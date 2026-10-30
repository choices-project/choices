#!/usr/bin/env python3
"""Attach public office contact channels to the compiled accountability dataset.

Sources (all public):
  - congress-legislators (phone, website, contact form, social)
  - Choices representatives_core snapshot (phones/sites/social from the civics ingest)

Does not call FEC. Safe to re-run after `build`.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(Path(__file__).resolve().parent))

from build_surveillance_money import (  # noqa: E402
    OUT,
    SNAP_DIR,
    http_json,
    person_key,
    write_exports,
)

CIVICS_SNAP = SNAP_DIR / "civics-contacts.json"
SOCIAL_URL = "https://unitedstates.github.io/congress-legislators/legislators-social-media.json"
CURRENT_URL = "https://unitedstates.github.io/congress-legislators/legislators-current.json"
HIST_URL = "https://unitedstates.github.io/congress-legislators/legislators-historical.json"

TWITTER_RE = re.compile(r"^[A-Za-z0-9_]{1,15}$")
PHONE_RE = re.compile(r"[^\d+]")


def https_url(url: str | None) -> str | None:
    if not url:
        return None
    u = url.strip()
    if u.startswith("//"):
        u = "https:" + u
    elif u.startswith("http://"):
        u = "https://" + u[7:]
    elif not u.startswith("https://"):
        if "." not in u:
            return None
        u = "https://" + u.lstrip("/")
    if any(ch in u for ch in (" ", "<", ">", '"', "'")):
        return None
    return u


def twitter_url(handle: str | None) -> str | None:
    if not handle:
        return None
    h = handle.strip().lstrip("@")
    if h.startswith("http"):
        return https_url(h)
    if not TWITTER_RE.match(h):
        return None
    return f"https://x.com/{h}"


def clean_phone(phone: str | None) -> str | None:
    if not phone:
        return None
    digits = re.sub(r"\D", "", phone)
    if len(digits) < 10 or len(digits) > 15:
        return None
    return phone.strip()[:32]


def compact(contact: dict) -> dict | None:
    out = {k: v for k, v in contact.items() if v}
    return out or None


def merge_contact(dst: dict, src: dict):
    cur = dict(dst.get("contact") or {})
    for k, v in src.items():
        if v and not cur.get(k):
            cur[k] = v
    cleaned = compact(cur)
    if cleaned:
        dst["contact"] = cleaned


def load_congress_contacts() -> tuple[dict[str, dict], dict[str, dict]]:
    social = {}
    for row in http_json(SOCIAL_URL):
        bio = (row.get("id") or {}).get("bioguide")
        s = row.get("social") or {}
        if bio:
            social[bio] = s
    by_bio, by_name = {}, {}
    for url in (CURRENT_URL, HIST_URL):
        for p in http_json(url):
            ids = p.get("id") or {}
            bio = ids.get("bioguide")
            term = (p.get("terms") or [{}])[-1]
            name = p.get("name", {}).get("official_full") or f"{p.get('name', {}).get('first')} {p.get('name', {}).get('last')}"
            s = social.get(bio) or {}
            rec = compact({
                "phone": clean_phone(term.get("phone")),
                "website": https_url(term.get("url")),
                "contactForm": https_url(term.get("contact_form")),
                "address": (term.get("address") or "").strip() or None,
                "twitter": twitter_url(s.get("twitter") or s.get("twitter_id")),
                "facebook": https_url(s.get("facebook")) if s.get("facebook") and str(s.get("facebook")).startswith("http") else (
                    https_url(f"https://www.facebook.com/{s['facebook']}") if s.get("facebook") else None
                ),
                "instagram": https_url(f"https://www.instagram.com/{s['instagram']}") if s.get("instagram") else None,
                "ballotpedia": None,
            }) or {}
            if rec.get("twitter") and not rec["twitter"].startswith("https://x.com/"):
                rec["twitter"] = twitter_url(s.get("twitter"))
            if bio:
                by_bio[bio] = rec
            key = (term.get("state") or "", person_key(name))
            if key[1]:
                by_name.setdefault(key, []).append(rec)
    return by_bio, by_name


def civics_row_contact(row: dict) -> dict:
    fb = row.get("facebook") or row.get("facebook_url")
    return compact({
        "phone": clean_phone(row.get("phone") or row.get("primary_phone")),
        "website": https_url(row.get("website") or row.get("primary_website")),
        "twitter": twitter_url(row.get("twitter") or row.get("twitter_handle")),
        "facebook": https_url(fb) if fb and str(fb).startswith("http") else (https_url(f"https://www.facebook.com/{fb}") if fb else None),
        "instagram": https_url(f"https://www.instagram.com/{row.get('instagram') or row.get('instagram_handle')}") if (row.get("instagram") or row.get("instagram_handle")) else None,
        "ballotpedia": https_url(row.get("ballotpedia") or row.get("ballotpedia_url")),
    }) or {}


def index_civics(rows: list[dict]) -> tuple[dict[str, dict], dict[str, dict], dict[tuple[str, str], list[dict]]]:
    by_bio, by_fec, by_name = {}, {}, {}
    for row in rows:
        rec = civics_row_contact(row)
        if not rec:
            continue
        bio = row.get("bioguide") or row.get("bioguide_id")
        fec = row.get("fec") or row.get("fec_id")
        if bio:
            by_bio[bio] = rec
        if fec:
            by_fec[str(fec).upper()] = rec
        key = ((row.get("state") or "").upper(), person_key(row.get("name")))
        if key[1]:
            by_name.setdefault(key, []).append(rec)
    return by_bio, by_fec, by_name


def pick_unique(rows: list[dict]) -> dict | None:
    if len(rows) != 1:
        return None
    return rows[0]


def attach(officials: list[dict], congress_bio, congress_name, civics_bio, civics_fec, civics_name) -> int:
    n = 0
    for o in officials:
        before = o.get("contact")
        if o.get("bioguide"):
            merge_contact(o, congress_bio.get(o["bioguide"]) or {})
            merge_contact(o, civics_bio.get(o["bioguide"]) or {})
        for fec in o.get("fecIds") or []:
            merge_contact(o, civics_fec.get(str(fec).upper()) or {})
        key = ((o.get("state") or "").upper(), person_key(o.get("name")))
        merge_contact(o, pick_unique(congress_name.get(key) or []) or {})
        merge_contact(o, pick_unique(civics_name.get(key) or []) or {})
        if o.get("contact") and o.get("contact") != before:
            n += 1
        elif o.get("contact") and not before:
            n += 1
    return n


def parse_mcp_array(path: Path) -> list[dict]:
    raw = path.read_text()
    try:
        wrapped = json.loads(raw)
        text = wrapped.get("result") if isinstance(wrapped, dict) else None
        if not isinstance(text, str):
            return wrapped if isinstance(wrapped, list) else []
    except json.JSONDecodeError:
        text = raw
    match = re.search(r"<untrusted-data-[a-f0-9-]+>\s*(\[)", text)
    if not match:
        data = json.loads(text) if text.lstrip().startswith("[") else []
        return data if isinstance(data, list) else []
    start = match.start(1)
    end = text.find("</untrusted-data-", start)
    data = json.loads(text[start:end].strip())
    return data if isinstance(data, list) else []


def main():
    extra_paths = [Path(p) for p in sys.argv[1:]]
    payload = json.loads(OUT.read_text())
    officials = payload["officials"]
    print("loading congress-legislators…", file=sys.stderr)
    congress_bio, congress_name = load_congress_contacts()
    civics_rows = []
    if CIVICS_SNAP.exists():
        civics_rows.extend(json.loads(CIVICS_SNAP.read_text()))
    for p in extra_paths:
        civics_rows.extend(parse_mcp_array(p))
    civics_bio, civics_fec, civics_name = index_civics(civics_rows)
    matched = attach(officials, congress_bio, congress_name, civics_bio, civics_fec, civics_name)
    with_contact = sum(1 for o in officials if o.get("contact"))
    # Persist only the compact contacts we actually used, keyed for the next run.
    snap = []
    seen = set()
    for o in officials:
        c = o.get("contact")
        if not c:
            continue
        key = (o.get("bioguide"), o.get("state"), person_key(o.get("name")))
        if key in seen:
            continue
        seen.add(key)
        snap.append({
            "name": o["name"],
            "state": o.get("state"),
            "bioguide": o.get("bioguide"),
            "fec": (o.get("fecIds") or [None])[0],
            **c,
        })
    CIVICS_SNAP.write_text(json.dumps(snap, indent=1, ensure_ascii=False) + "\n")
    OUT.write_text(json.dumps(payload, indent=1, ensure_ascii=False) + "\n")
    write_exports(payload)
    print(f"contact on {with_contact}/{len(officials)} officials (updated {matched}); snapshot {CIVICS_SNAP.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
