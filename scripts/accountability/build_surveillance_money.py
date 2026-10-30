#!/usr/bin/env python3
"""Build the public /accountability dataset: political money from Axon (formerly
TASER International) and Flock Safety, and how recipients voted on related bills.

Two steps, stdlib only:

  extract-bulk  Scan large state bulk downloads already on disk (TX TEC, CA Cal-Access,
                CO TRACER, IL SBE, IRS Form 8872) and write a small committed snapshot:
                scripts/accountability/snapshots/state-bulk.json

  build         Pull live sources (FEC, Senate LDA, House Clerk, Voteview Senate
                roll calls, Arizona Legislature, Socrata portals, Florida DOE),
                merge the committed snapshots, and write
                web/lib/accountability/surveillance-money.json

Env:
  DATA_GOV_API_KEY        FEC key (falls back to .cursor/mcp-servers/.env; never hardcode)
  ACCOUNTABILITY_BULK_DIR directory with bulk files for extract-bulk (default /tmp/bulk)
  ACCOUNTABILITY_CACHE    HTTP cache directory (default /tmp/accountability-cache)

Privacy: rank-and-file employees are never named in the output. Only corporate
entities, company PACs, company officers, and registered lobbyists / government-affairs
staff are named; other employee gifts are aggregated per recipient.
"""

from __future__ import annotations

import argparse
import collections
import csv
import datetime as dt
import hashlib
import io
import json
import os
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SNAP_DIR = ROOT / "scripts/accountability/snapshots"
BULK_SNAPSHOT = SNAP_DIR / "state-bulk.json"
AZ_SNAPSHOT = SNAP_DIR / "az-arizonans-for-a-better-future.json"
CIVICS_CONTACTS = SNAP_DIR / "civics-contacts.json"
OUT = ROOT / "web/lib/accountability/surveillance-money.json"
PUBLIC_DIR = ROOT / "web/public/data/accountability"
SUMMARY = SNAP_DIR / "SUMMARY.md"
BULK_DIR = Path(os.environ.get("ACCOUNTABILITY_BULK_DIR", "/tmp/bulk"))
CACHE_DIR = Path(os.environ.get("ACCOUNTABILITY_CACHE", "/tmp/accountability-cache"))
UA = "Mozilla/5.0 (civic research; choices accountability builder)"

csv.field_size_limit(sys.maxsize)


def log(*a):
    print(*a, file=sys.stderr, flush=True)


# --------------------------------------------------------------------------- http

def api_key() -> str:
    key = os.environ.get("DATA_GOV_API_KEY", "").strip()
    if key:
        return key
    env = ROOT / ".cursor/mcp-servers/.env"
    if env.exists():
        for line in env.read_text().splitlines():
            if line.startswith("DATA_GOV_API_KEY="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    sys.exit("DATA_GOV_API_KEY is not set (env or .cursor/mcp-servers/.env)")


def _cache_path(url: str, body: bytes | None) -> Path:
    clean = re.sub(r"api_key=[^&]+", "api_key=_", url)
    h = hashlib.sha256((clean + "|" + (body or b"").decode("latin-1")).encode()).hexdigest()[:32]
    return CACHE_DIR / h


def http(url: str, *, body: bytes | None = None, headers: dict | None = None,
         cache: bool = True, retries: int = 5) -> bytes:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    cp = _cache_path(url, body)
    if cache and cp.exists():
        return cp.read_bytes()
    hdrs = {"User-Agent": UA, "Accept": "*/*"}
    hdrs.update(headers or {})
    last = None
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, data=body, headers=hdrs)
            with urllib.request.urlopen(req, timeout=90) as r:
                data = r.read()
            if cache:
                cp.write_bytes(data)
            return data
        except urllib.error.HTTPError as e:
            last = e
            if e.code in (429, 500, 502, 503, 504):
                time.sleep(min(60, 5 * (attempt + 1)))
                continue
            raise
        except (urllib.error.URLError, TimeoutError) as e:
            last = e
            time.sleep(5 * (attempt + 1))
    raise RuntimeError(f"failed after retries: {re.sub(r'api_key=[^&]+', 'api_key=_', url)}: {last}")


def http_json(url: str, **kw):
    return json.loads(http(url, **kw).decode("utf-8"))


# ----------------------------------------------------------------------- matching

def norm(s: str | None) -> str:
    s = unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode()
    return re.sub(r"\s+", " ", re.sub(r"[^A-Za-z0-9 ]+", " ", s)).strip().upper()


FALSE_POSITIVE = re.compile(
    r"\b(JAXON|KLAXON|AXONICS|AXONIUS|HCL AXON|AXON MEDIA|AXON ENERGY|AXON PRESSURE|"
    r"AXON OPTICS|AXON CAPITAL|AXON PARTNERS|AXON ADVISORS|AXON SOLUTIONS|AXON INSURANCE|"
    r"TASER PROTECT|FLOCK FREIGHT|FLOCKFREIGHT)\b"
)
AXON_EXPLICIT = re.compile(r"\b(AXON ENTERPRISES?|AXON CORP(ORATION)?|TASER( INTERNATIONAL| INTL| INT L)?)\b")
FLOCK_EXPLICIT = re.compile(r"\b(FLOCK SAFETY|FLOCK GROUP)\b")
AXON_BARE = {"AXON", "AXON INC", "AXON LLC", "AXON CO"}
FLOCK_BARE = {"FLOCK", "FLOCK INC"}


def company_for_employer(employer: str | None, state: str | None) -> tuple[str | None, bool]:
    """Return (company, ambiguous). Bare 'AXON' / 'FLOCK' only counts near HQ states."""
    e = norm(employer)
    if not e or FALSE_POSITIVE.search(e):
        return None, False
    if FLOCK_EXPLICIT.search(e):
        return "flock", False
    if AXON_EXPLICIT.search(e):
        return "axon", False
    st = (state or "").upper().strip()
    if e in AXON_BARE:
        return ("axon", False) if st in ("AZ", "WA") else (None, True)
    if e in FLOCK_BARE:
        return ("flock", False) if st == "GA" else (None, True)
    return None, False


ORG_AXON = re.compile(r"^(AXON( ENTERPRISES?)?( INC)?|AXON CORPORATION|TASER INTERNATIONAL( INC)?|TASER INT L)$")
ORG_FLOCK = re.compile(r"^(FLOCK (GROUP|SAFETY)( INC)?( D B A FLOCK SAFETY)?)$")


def company_for_org(name: str | None) -> str | None:
    n = norm(name)
    if ORG_AXON.match(n):
        return "axon"
    if ORG_FLOCK.match(n):
        return "flock"
    return None


EXEC_RE = re.compile(
    r"\b(CEO|CFO|COO|CTO|CRO|CMO|CLO|CPO|CIO|CHIEF|PRESIDENT|FOUNDER|COFOUNDER|CO FOUNDER|"
    r"CHAIRMAN|CHAIR|EVP|SVP|EXECUTIVE VICE|SENIOR VICE|VICE PRESIDENT|VP|GENERAL COUNSEL|"
    r"TECH EXECUTIVE|BUSINESS EXECUTIVE|CORPORATE EXECUTIVE|EXECUTIVE OFFICER|PRINCIPAL)\b"
)
NOT_EXEC_RE = re.compile(r"\b(ACCOUNT EXECUTIVE|SALES EXECUTIVE|ASSISTANT TO|EXECUTIVE ASSISTANT|PRINCIPAL (ENGINEER|DESIGNER|PRODUCT|SOFTWARE|PROGRAM|SCIENTIST|ARCHITECT|DIRECTOR|RESEARCHER|ANALYST|CONSULTANT|MANAGER))\b")
GOV_AFFAIRS_RE = re.compile(r"\b(GOVERNMENT AFFAIRS|GOVERNMENT RELATIONS|GOVT AFFAIRS|PUBLIC POLICY|PUBLIC AFFAIRS|LOBBYIST|LOBBYING)\b")


def donor_channel(occupation: str | None, name_key: str, lobbyists: set[str]) -> str:
    o = norm(occupation)
    if name_key in lobbyists or GOV_AFFAIRS_RE.search(o):
        return "lobbyist"
    if EXEC_RE.search(o) and not NOT_EXEC_RE.search(o):
        return "executive"
    return "employees"


def person_key(name: str | None) -> str:
    """'SMITH, PATRICK W.' / 'Patrick W Smith' -> 'PATRICK SMITH' (first + last)."""
    n = (name or "").strip()
    if "," in n:
        last, rest = n.split(",", 1)
        n = f"{rest} {last}"
    toks = [t for t in norm(n).split() if t not in {"MR", "MRS", "MS", "DR", "JR", "SR", "II", "III", "IV", "HON", "THE", "HONORABLE"}]
    toks = [t for t in toks if len(t) > 1] or toks
    if not toks:
        return ""
    return f"{toks[0]} {toks[-1]}" if len(toks) > 1 else toks[0]


SMALL = {"of", "for", "and", "the", "to", "in", "a", "on"}


def title_name(name: str | None, person: bool = True) -> str:
    n = (name or "").strip()
    if person and "," in n and n.count(",") == 1:
        last, rest = [p.strip() for p in n.split(",", 1)]
        n = f"{rest} {last}"
    if person:
        n = re.sub(r"(?i)(^|\s)(mr|mrs|ms|miss|dr|hon)\.?(?=\s|$)|(^|\s)\d(?=\s|$)", " ", n).strip()
    out = []
    for i, w in enumerate(re.split(r"(\s+)", n.lower())):
        if not w.strip():
            out.append(w)
            continue
        if i and w in SMALL:
            out.append(w)
            continue
        if re.fullmatch(r"(ii|iii|iv|llc|pac|inc\.?|usa|us)", w):
            out.append(w.upper().replace("INC.", "Inc.").replace("INC", "Inc"))
            continue
        w = "-".join(p[:1].upper() + p[1:] for p in w.split("-"))
        w = re.sub(r"^(Mc)([a-z])", lambda m: m.group(1) + m.group(2).upper(), w)
        w = re.sub(r"^O'([a-z])", lambda m: "O'" + m.group(1).upper(), w)
        out.append(w)
    s = re.sub(r"\s+", " ", "".join(out)).strip()
    return re.sub(r"(?i)\b(ceo|cfo|cto|coo|cro|cpo|svp|evp|vp|fp&a|pr)\b", lambda m: m.group(1).upper(), s)


def donor_hash(name: str | None, state: str | None = "") -> str:
    return hashlib.sha256(f"{person_key(name)}|{(state or '').upper()}".encode()).hexdigest()[:12]


def iso(d: str | None) -> str | None:
    if not d:
        return None
    d = d.strip()
    for fmt in ("%Y-%m-%dT%H:%M:%S.%f", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d",
                "%m/%d/%Y %I:%M:%S %p", "%m/%d/%Y", "%Y%m%d", "%m-%d-%Y"):
        try:
            return dt.datetime.strptime(d, fmt).date().isoformat()
        except ValueError:
            continue
    m = re.match(r"(\d{4}-\d{2}-\d{2})", d)
    return m.group(1) if m else None


def money(x) -> float:
    try:
        return round(float(str(x).replace(",", "").replace("$", "")), 2)
    except (TypeError, ValueError):
        return 0.0


# =================================================================== extract-bulk

def bulk_record(**kw) -> dict:
    """Normalized state/local record. Rank-and-file donor names are dropped here."""
    channel = kw.pop("channel")
    name = kw.pop("donorName", None)
    st = kw.get("donorState")
    rec = {
        "source": kw["source"], "jurisdiction": kw["jurisdiction"], "level": kw.get("level", "state"),
        "company": kw["company"], "channel": channel,
        "donor": title_name(name, person=channel != "corporate") if channel != "employees" else None,
        "donorOccupation": kw.get("donorOccupation") if channel != "employees" else None,
        "donorKey": donor_hash(name, st),
        "amount": kw["amount"], "date": kw["date"],
        "recipientCommittee": kw.get("recipientCommittee"),
        "recipientCandidate": kw.get("recipientCandidate"),
        "recipientKind": kw.get("recipientKind", "candidate"),
        "office": kw.get("office"),
        "recordId": kw.get("recordId"),
        "sourceUrl": kw.get("sourceUrl"),
    }
    return rec


def classify_individual(employer, occupation, name, state, lobbyists=frozenset()):
    company, ambiguous = company_for_employer(employer, state)
    if not company:
        return None, ambiguous
    return (company, donor_channel(occupation, person_key(name), set(lobbyists))), False


def extract_tx(out: list, stats: dict):
    z = BULK_DIR / "tx.zip"
    if not z.exists():
        stats["TX"] = "missing tx.zip"
        return
    zf = zipfile.ZipFile(z)
    filers = {}
    with zf.open("filers.csv") as f:
        for r in csv.DictReader(io.TextIOWrapper(f, encoding="latin-1")):
            filers.setdefault(r["filerIdent"], []).append(r)
    rx = re.compile(rb"axon|taser|flock", re.I)
    n_amb = 0
    seen = set()
    for name in sorted(n for n in zf.namelist() if re.match(r"contribs_\d+\.csv$", n)):
        with zf.open(name) as f:
            header = None
            for raw in f:
                if header is None:
                    header = next(csv.reader([raw.decode("latin-1")]))
                    continue
                if not rx.search(raw):
                    continue
                r = dict(zip(header, next(csv.reader([raw.decode("latin-1")]))))
                org = r.get("contributorNameOrganization")
                amount = money(r.get("contributionAmount"))
                date = iso(r.get("contributionDt"))
                base = dict(source="tx-tec", jurisdiction="TX", amount=amount, date=date,
                            recordId=r.get("contributionInfoId"),
                            sourceUrl="https://www.ethics.state.tx.us/search/cf/")
                if org:
                    comp = company_for_org(org)
                    if not comp:
                        continue
                    hit = (comp, "corporate")
                    donor = org
                else:
                    donor = f"{r.get('contributorNameLast')}, {r.get('contributorNameFirst')}"
                    hit, amb = classify_individual(r.get("contributorEmployer"), r.get("contributorOccupation"),
                                                   donor, r.get("contributorStreetStateCd"))
                    if not hit:
                        # employer/occupation columns are sometimes swapped by filers
                        hit, amb2 = classify_individual(r.get("contributorOccupation"), r.get("contributorEmployer"),
                                                        donor, r.get("contributorStreetStateCd"))
                        amb = amb or amb2
                    if not hit:
                        n_amb += amb
                        continue
                ftype = r.get("filerTypeCd")
                filer_name = r.get("filerName")
                if ftype in ("GPAC",) and "ACTBLUE" in norm(filer_name):
                    continue  # conduit; the candidate's own report carries the earmarked gift
                dedupe = (r.get("filerIdent"), person_key(donor), date, amount)
                if dedupe in seen:
                    continue  # amended reports repeat every itemized row
                seen.add(dedupe)
                cand = None
                office = None
                kind = "candidate" if ftype in ("COH", "JCOH") else "committee"
                if kind == "candidate":
                    rows = filers.get(r.get("filerIdent"), [])
                    fr = next((x for x in rows if x["filerTypeCd"] == ftype), rows[0] if rows else {})
                    cand = title_name(f"{fr.get('filerNameLast', '')}, {fr.get('filerNameFirst', '')}") if fr else title_name(re.sub(r"\(.*?\)", "", filer_name or ""))
                    hold = fr.get("filerHoldOfficeCd")
                    seek = fr.get("ctaSeekOfficeCd") or fr.get("contestSeekOfficeCd")
                    office = {
                        "held": tx_office(hold, fr.get("filerHoldOfficeDistrict")) if fr.get("filerFilerpersStatusCd") == "CURRENT_OFFICEHOLDER" else None,
                        "sought": tx_office(seek, fr.get("ctaSeekOfficeDistrict") or fr.get("contestSeekOfficeDistrict")),
                    }
                out.append(bulk_record(**base, company=hit[0], channel=hit[1], donorName=donor,
                                       donorOccupation=r.get("contributorOccupation"),
                                       donorState=r.get("contributorStreetStateCd"),
                                       recipientCommittee=re.sub(r"\s*\((DISSOLVED|INACTIVE)\)", "", filer_name or ""),
                                       recipientCandidate=cand, recipientKind=kind, office=office))
    stats["TX"] = f"{sum(1 for r in out if r['source'] == 'tx-tec')} records; {n_amb} ambiguous bare-employer rows excluded"


TX_OFFICES = {"STATEREP": "Texas House", "STATESEN": "Texas Senate", "GOVERNOR": "Governor of Texas",
              "LTGOVERNOR": "Lieutenant Governor of Texas", "ATTYGEN": "Texas Attorney General",
              "JUDGEDIST": "District Judge", "CRIMINAL_JUDGEDIST": "Criminal District Judge"}


def tx_office(cd, district):
    if not cd:
        return None
    label = TX_OFFICES.get(cd, cd.replace("_", " ").title())
    return f"{label} (District {district})" if district else label


def extract_ca(out: list, stats: dict):
    z = BULK_DIR / "ca.zip"
    if not z.exists():
        stats["CA"] = "missing ca.zip"
        return
    zf = zipfile.ZipFile(z)
    rx = re.compile(rb"taser|axon enterprise|flock safety|flock group", re.I)
    hits = []
    for member, kind in (("CalAccess/DATA/RCPT_CD.TSV", "rcpt"), ("CalAccess/DATA/S497_CD.TSV", "s497")):
        with zf.open(member) as f:
            header = f.readline().decode("latin-1").rstrip("\r\n").split("\t")
            for raw in f:
                if not rx.search(raw):
                    continue
                row = dict(zip(header, raw.decode("latin-1").rstrip("\r\n").split("\t")))
                if kind == "s497" and row.get("FORM_TYPE") != "F497P1":
                    continue
                hits.append((kind, row))
    filings = {r["FILING_ID"] for _, r in hits}
    cover = {}
    with zf.open("CalAccess/DATA/CVR_CAMPAIGN_DISCLOSURE_CD.TSV") as f:
        header = f.readline().decode("latin-1").rstrip("\r\n").split("\t")
        for raw in f:
            fid = raw.split(b"\t", 1)[0].decode("latin-1")
            if fid in filings:
                row = dict(zip(header, raw.decode("latin-1").rstrip("\r\n").split("\t")))
                prev = cover.get(fid)
                if not prev or int(row.get("AMEND_ID") or 0) >= int(prev.get("AMEND_ID") or 0):
                    cover[fid] = row
    best = {}
    for kind, r in hits:
        key = (r["FILING_ID"], r.get("TRAN_ID"), kind)
        if key not in best or int(r.get("AMEND_ID") or 0) > int(best[key][1].get("AMEND_ID") or 0):
            best[key] = (kind, r)
    # A late-contribution report (497) is repeated on the next semiannual 460; keep the 460 row.
    ordered = sorted(best.values(), key=lambda kr: kr[0] != "rcpt")
    seen_460 = set()
    n = 0
    for kind, r in ordered:
        naml = r.get("CTRIB_NAML") or r.get("ENTY_NAML") or ""
        namf = r.get("CTRIB_NAMF") or r.get("ENTY_NAMF") or ""
        st = r.get("CTRIB_ST") or r.get("ENTY_ST")
        is_org = r.get("ENTITY_CD") != "IND"
        if is_org:
            donor = f"{naml}, {namf}" if namf else naml
            comp = company_for_org(donor) or company_for_org(naml)
            if not comp:
                continue
            hit = (comp, "corporate")
        else:
            donor = f"{naml}, {namf}"
            hit, _ = classify_individual(r.get("CTRIB_EMP"), r.get("CTRIB_OCC"), donor, st)
            if not hit:
                continue
        cv = cover.get(r["FILING_ID"], {})
        amount = money(r.get("AMOUNT"))
        date = iso(r.get("RCPT_DATE") or r.get("CTRIB_DATE"))
        dkey = (cv.get("FILER_ID"), person_key(donor) if not is_org else hit[0], date, amount)
        if kind == "rcpt":
            seen_460.add(dkey)
        elif dkey in seen_460:
            continue
        committee = cv.get("FILER_NAML") or ""
        cand = " ".join(x for x in (cv.get("CAND_NAMF"), cv.get("CAND_NAML")) if x).strip() or None
        office = ca_office(cv)
        out.append(bulk_record(
            source="ca-calaccess", jurisdiction="CA", company=hit[0], channel=hit[1], donorName=donor,
            donorOccupation=r.get("CTRIB_OCC"), donorState=st, amount=amount, date=date,
            recipientCommittee=committee, recipientCandidate=cand,
            recipientKind="candidate" if cand else ("ballot" if cv.get("BAL_NAME") else "committee"),
            office={"sought": office, "held": None} if office else None,
            recordId=f"{r['FILING_ID']}:{r.get('TRAN_ID')}",
            sourceUrl=f"https://cal-access.sos.ca.gov/PDFGen/pdfgen.prg?filingid={r['FILING_ID']}&amendid={r.get('AMEND_ID') or 0}",
        ))
        n += 1
    stats["CA"] = f"{n} records (Cal-Access bulk export; 497 late reports deduplicated against 460s)"


CA_OFFICES = {"ASM": "California Assembly", "SEN": "California Senate", "GOV": "Governor of California",
              "LTG": "Lieutenant Governor of California", "ATT": "California Attorney General",
              "SOS": "California Secretary of State", "CON": "California Controller", "TRE": "California Treasurer",
              "INS": "California Insurance Commissioner", "SPI": "Superintendent of Public Instruction",
              "SUP": "County Supervisor", "MAY": "Mayor", "CCM": "City Council", "DAT": "District Attorney",
              "SHF": "Sheriff"}


def ca_office(cv: dict) -> str | None:
    label = CA_OFFICES.get((cv.get("OFFICE_CD") or "").upper()) or (cv.get("OFFIC_DSCR") or "").strip()
    if not label:
        return None
    dist = (cv.get("DIST_NO") or "").strip()
    juris = (cv.get("JURIS_DSCR") or "").strip()
    if dist and dist not in ("0", "00"):
        label += f" (District {int(dist) if dist.isdigit() else dist})"
    elif juris and label in ("County Supervisor", "Mayor", "City Council", "District Attorney", "Sheriff"):
        label += f" — {juris}"
    return label


def extract_co(out: list, stats: dict):
    zips = sorted(BULK_DIR.glob("co_20*.zip"))
    if not zips:
        stats["CO"] = "missing co_YYYY.zip"
        return
    rx = re.compile(rb"axon|taser|flock", re.I)
    n = 0
    seen = set()
    for z in zips:
        zf = zipfile.ZipFile(z)
        for member in zf.namelist():
            if not member.lower().endswith((".csv", ".txt")):
                continue
            with zf.open(member) as f:
                header = None
                for raw in f:
                    line = raw.decode("latin-1")
                    if header is None:
                        header = next(csv.reader([line]))
                        continue
                    if not rx.search(raw):
                        continue
                    r = dict(zip(header, next(csv.reader([line]))))
                    if r.get("RecordID") in seen:
                        continue
                    if r.get("Amended") == "Y":
                        continue
                    ctype = r.get("ContributorType", "")
                    last, first = r.get("LastName", ""), r.get("FirstName", "")
                    if ctype != "Individual" and not first:
                        comp = company_for_org(last)
                        if not comp:
                            continue
                        hit, donor = (comp, "corporate"), last
                    else:
                        donor = f"{last}, {first}"
                        hit, _ = classify_individual(r.get("Employer"), r.get("Occupation"), donor, r.get("State"))
                        if not hit:
                            continue
                    seen.add(r.get("RecordID"))
                    cand = title_name(r.get("CandidateName")) if r.get("CandidateName") else None
                    if cand and person_key(cand) == person_key(donor) and hit[1] == "employees":
                        continue  # self-funding by a candidate who happens to work there
                    out.append(bulk_record(
                        source="co-tracer", jurisdiction="CO",
                        level="local" if r.get("Jurisdiction") not in ("STATEWIDE", "") and r.get("CommitteeType") == "Candidate Committee" and not re.search(r"HOUSE|SENATE|STATE", r.get("CommitteeName", ""), re.I) else "state",
                        company=hit[0], channel=hit[1], donorName=donor, donorOccupation=r.get("Occupation"),
                        donorState=r.get("State"), amount=money(r.get("ContributionAmount")),
                        date=iso(r.get("ContributionDate")), recipientCommittee=title_name(r.get("CommitteeName"), person=False),
                        recipientCandidate=cand,
                        recipientKind="candidate" if r.get("CommitteeType") == "Candidate Committee" else ("ballot" if r.get("CommitteeType") == "Issue Committee" else "committee"),
                        recordId=r.get("RecordID"),
                        sourceUrl="https://tracer.sos.colorado.gov/PublicSite/SearchPages/ContributionSearch.aspx",
                    ))
                    n += 1
    stats["CO"] = f"{n} records (TRACER yearly bulk files)"


def extract_il(out: list, stats: dict):
    rec = BULK_DIR / "il_receipts.txt"
    com = BULK_DIR / "il_committees.txt"
    if not rec.exists() or not com.exists():
        stats["IL"] = "missing il_receipts.txt / il_committees.txt"
        return
    committees = {}
    with open(com, encoding="latin-1", newline="") as f:
        for r in csv.DictReader(f, delimiter="\t", quoting=csv.QUOTE_NONE):
            committees[r["ID"]] = r
    rx = re.compile(r"axon|taser|flock", re.I)
    n = 0
    with open(rec, encoding="latin-1", newline="") as f:
        header = f.readline().rstrip("\r\n").split("\t")
        for line in f:
            if not rx.search(line):
                continue
            r = dict(zip(header, line.rstrip("\r\n").split("\t")))
            if r.get("Archived") == "True":
                continue  # superseded by an amended report
            first = r.get("FirstName", "").strip()
            last = r.get("LastOnlyName", "").strip()
            if not first:
                comp = company_for_org(last)
                if not comp:
                    continue
                hit, donor = (comp, "corporate"), last
            else:
                donor = f"{last}, {first}"
                hit, _ = classify_individual(r.get("Employer"), r.get("Occupation"), donor, r.get("State"))
                if not hit:
                    continue
            c = committees.get(r.get("CommitteeID"), {})
            out.append(bulk_record(
                source="il-sbe", jurisdiction="IL", level="local" if c.get("LocalCommittee") == "True" and c.get("StateCommittee") != "True" else "state",
                company=hit[0], channel=hit[1], donorName=donor, donorOccupation=r.get("Occupation"),
                donorState=r.get("State"), amount=money(r.get("Amount")), date=iso(r.get("RcvDate")),
                recipientCommittee=c.get("Name") or f"Committee {r.get('CommitteeID')}",
                recipientCandidate=None, recipientKind="committee", recordId=r.get("ID"),
                sourceUrl=f"https://www.elections.il.gov/CampaignDisclosure/CommitteeDetail.aspx?ID={r.get('CommitteeID')}",
            ))
            n += 1
    stats["IL"] = f"{n} records (SBE Receipts.txt)"


def extract_irs(out: list, stats: dict):
    z = BULK_DIR / "irs_full.zip"
    if not z.exists():
        stats["IRS"] = "missing irs_full.zip"
        return
    zf = zipfile.ZipFile(z)
    member = next(n for n in zf.namelist() if n.lower().endswith(".txt"))
    rx = re.compile(rb"axon|taser|flock", re.I)
    seen = set()
    n = 0
    with zf.open(member) as f:
        for raw in f:
            if not raw.startswith(b"A|") or not rx.search(raw):
                continue
            p = raw.decode("latin-1").rstrip("\r\n").split("|")
            if len(p) < 17:
                continue
            org, contributor, employer, amount, occupation, date = p[3], p[5], p[12], p[13], p[14], p[16]
            comp = company_for_org(contributor)
            if comp:
                hit = (comp, "corporate")
            else:
                hit, _ = classify_individual(employer, occupation, contributor, p[9])
                if not hit:
                    continue
            key = (norm(org), person_key(contributor), date, money(amount))
            if key in seen:
                continue  # amended 8872 reports repeat the same schedule A line
            seen.add(key)
            out.append(bulk_record(
                source="irs-8872", jurisdiction="US", level="association", company=hit[0], channel=hit[1],
                donorName=contributor, donorOccupation=occupation, donorState=p[9], amount=money(amount),
                date=iso(date), recipientCommittee=title_name(org, person=False) if org.isupper() else org,
                recipientCandidate=None, recipientKind="association", recordId=f"{p[1]}:{p[2]}",
                sourceUrl=f"https://forms.irs.gov/app/pod/basicSearch/search?formType=8872&ein={p[4]}" if p[4] else "https://forms.irs.gov/app/pod/basicSearch/search",
            ))
            n += 1
    stats["IRS"] = f"{n} records (Form 8872 full data file)"


EXTRACTORS = {"IRS": (extract_irs, "irs-8872"), "TX": (extract_tx, "tx-tec"), "CO": (extract_co, "co-tracer"),
              "IL": (extract_il, "il-sbe"), "CA": (extract_ca, "ca-calaccess")}


def cmd_extract_bulk(args):
    only = {s.strip().upper() for s in (args.only or "").split(",") if s.strip()}
    out: list = []
    stats: dict = {}
    if only and BULK_SNAPSHOT.exists():
        prev = json.loads(BULK_SNAPSHOT.read_text())
        keep = {src for k, (_, src) in EXTRACTORS.items() if k not in only}
        out = [r for r in prev["records"] if r["source"] in keep]
        stats = {k: v for k, v in (prev.get("stats") or {}).items() if k not in only}
    for key, (fn, _src) in EXTRACTORS.items():
        if only and key not in only:
            continue
        log(f"extract: {fn.__name__}")
        try:
            fn(out, stats)
        except Exception as e:  # keep other states if one archive is malformed
            stats[key] = f"error: {e}"
            log(f"  error: {e}")
    SNAP_DIR.mkdir(parents=True, exist_ok=True)
    payload = {"generatedAt": dt.date.today().isoformat(), "stats": stats,
               "records": sorted(out, key=lambda r: (r["jurisdiction"], r["date"] or "", r["recordId"] or ""))}
    BULK_SNAPSHOT.write_text(json.dumps(payload, indent=1, ensure_ascii=False) + "\n")
    log(json.dumps(stats, indent=1))
    log(f"wrote {BULK_SNAPSHOT.relative_to(ROOT)} ({len(out)} records)")


# ========================================================================== build

FEC = "https://api.open.fec.gov/v1"
AXON_PAC = "C00890590"
CONDUITS = {"C00401224", "C00694323"}  # ActBlue, WinRed: earmarks appear on recipient reports
LEG_URLS = ["https://unitedstates.github.io/congress-legislators/legislators-current.json",
            "https://unitedstates.github.io/congress-legislators/legislators-historical.json"]


def fec_pdf(url: str | None) -> str | None:
    return re.sub(r"^http://docquery\.fec\.gov/", "https://docquery.fec.gov/", url) if url else None


def fec_pages(path: str, params: dict, index_key: str):
    key = api_key()
    q = dict(params, per_page=100, api_key=key)
    while True:
        url = f"{FEC}{path}?{urllib.parse.urlencode(q, doseq=True)}"
        d = http_json(url)
        rows = d.get("results", [])
        yield from rows
        last = (d.get("pagination") or {}).get("last_indexes")
        if not rows or not last:
            break
        q.update(last)
        time.sleep(0.4)


FEC_ID_RE = re.compile(r"^[CHSP][0-9A-Z]{8}$")


def fec_batch(path: str, id_param: str, ids: list[str]) -> dict:
    out = {}
    ids = sorted({i.strip().upper() for i in ids if i and FEC_ID_RE.match(i.strip().upper())})

    def fetch(chunk: list[str]):
        url = f"{FEC}{path}?{urllib.parse.urlencode({id_param: chunk, 'per_page': 100, 'api_key': api_key()}, doseq=True)}"
        try:
            rows = http_json(url).get("results", [])
        except urllib.error.HTTPError as e:
            if e.code != 422:
                raise
            if len(chunk) == 1:
                log(f"  {path}: FEC rejected id {chunk[0]}")
                return
            mid = len(chunk) // 2
            fetch(chunk[:mid])
            fetch(chunk[mid:])
            return
        for r in rows:
            out[r.get(id_param)] = r
        time.sleep(0.4)

    for i in range(0, len(ids), 40):
        fetch(ids[i:i + 40])
    return out


def load_legislators():
    by_fec, by_bio, by_lis = {}, {}, {}
    for i, url in enumerate(LEG_URLS):
        for p in http_json(url):
            ids = p.get("id", {})
            term = p["terms"][-1]
            rec = {
                "bioguide": ids.get("bioguide"),
                "name": p["name"].get("official_full") or f"{p['name'].get('first')} {p['name'].get('last')}",
                "current": i == 0,
                "chamber": "senate" if term["type"] == "sen" else "house",
                "state": term.get("state"),
                "district": term.get("district"),
                "party": (term.get("party") or "")[:1] or None,
            }
            by_bio[rec["bioguide"]] = rec
            for f in ids.get("fec", []) or []:
                by_fec[f] = rec
            if ids.get("lis"):
                by_lis[ids["lis"]] = rec
    return by_fec, by_bio, by_lis


PARTY = {"DEM": "D", "REP": "R", "IND": "I", "LIB": "L", "GRE": "G", "DFL": "D"}


def fec_money(lobbyists: set[str], coverage: list):
    """Return list of federal contribution events (pre-resolution)."""
    events = []
    ambiguous = collections.Counter()
    seen = set()
    for term in ("AXON", "TASER", "FLOCK"):
        for cycle in range(2006, 2028, 2):
            n0 = len(events)
            for r in fec_pages("/schedules/schedule_a/", {"contributor_employer": term, "two_year_transaction_period": cycle,
                                                           "is_individual": "true", "sort": "-contribution_receipt_date"},
                               "last_index"):
                sid = r.get("sub_id")
                if sid in seen:
                    continue
                seen.add(sid)
                if r.get("memo_code") == "X" or r.get("committee_id") in CONDUITS:
                    continue
                company, amb = company_for_employer(r.get("contributor_employer"), r.get("contributor_state"))
                if not company:
                    if amb:
                        ambiguous[term] += 1
                    continue
                name = r.get("contributor_name")
                events.append({
                    "company": company, "channel": donor_channel(r.get("contributor_occupation"), person_key(name), lobbyists),
                    "donor": name, "donorOccupation": r.get("contributor_occupation"),
                    "donorKey": donor_hash(name, r.get("contributor_state")),
                    "amount": money(r.get("contribution_receipt_amount")), "date": iso(r.get("contribution_receipt_date")),
                    "committeeId": r.get("committee_id"), "committeeName": (r.get("committee") or {}).get("name"),
                    "url": fec_pdf(r.get("pdf_url")) or f"https://www.fec.gov/data/receipts/?committee_id={r.get('committee_id')}&contributor_employer={urllib.parse.quote(term)}",
                    "source": "fec",
                })
            log(f"  fec employer={term} cycle={cycle}: +{len(events) - n0}")
    for name in ("Axon Enterprise", "Taser International", "Flock Group", "Flock Safety"):
        for r in fec_pages("/schedules/schedule_a/", {"contributor_name": name, "is_individual": "false"}, "last_index"):
            if r.get("sub_id") in seen or r.get("memo_code") == "X":
                continue
            seen.add(r.get("sub_id"))
            comp = company_for_org(r.get("contributor_name"))
            if not comp:
                continue
            events.append({
                "company": comp, "channel": "corporate", "donor": title_name(r.get("contributor_name"), person=False),
                "amount": money(r.get("contribution_receipt_amount")), "date": iso(r.get("contribution_receipt_date")),
                "committeeId": r.get("committee_id"), "committeeName": (r.get("committee") or {}).get("name"),
                "url": fec_pdf(r.get("pdf_url")) or f"https://www.fec.gov/data/receipts/?committee_id={r.get('committee_id')}",
                "source": "fec",
            })
    n_pac = 0
    for r in fec_pages("/schedules/schedule_b/", {"committee_id": AXON_PAC}, "last_index"):
        if r.get("memo_code") == "X" or not r.get("recipient_committee_id"):
            continue
        events.append({
            "company": "axon", "channel": "pac", "donor": "Axon Enterprise Inc. PAC",
            "amount": money(r.get("disbursement_amount")), "date": iso(r.get("disbursement_date")),
            "committeeId": r.get("recipient_committee_id"), "committeeName": r.get("recipient_name"),
            "url": fec_pdf(r.get("pdf_url")) or f"https://www.fec.gov/data/disbursements/?committee_id={AXON_PAC}",
            "source": "fec",
        })
        n_pac += 1
    coverage.append({"jurisdiction": "US", "level": "federal", "source": "FEC (OpenFEC API)",
                     "url": "https://api.open.fec.gov/developers/", "status": "searched",
                     "note": f"Itemized receipts 2006–2026 by employer (AXON, TASER, FLOCK) and by organization name; "
                             f"Axon PAC ({AXON_PAC}) disbursements ({n_pac} rows). Bare employer 'AXON'/'FLOCK' outside AZ/WA/GA "
                             f"excluded as ambiguous ({sum(ambiguous.values())} rows). Gifts under $200 are not itemized by FEC rules."})
    return events


BILL_PREFIX = {"HR": "H.R.", "S": "S.", "HRES": "H.Res.", "SCONRES": "S.Con.Res."}


def canonical_bill(prefix: str, number: str) -> str:
    """'H.R', 'HR', 'H. R.' -> 'H.R. 2189'."""
    key = re.sub(r"[\s.]", "", prefix.upper())
    return f"{BILL_PREFIX.get(key, prefix.upper())} {int(number)}"


def lda_summary(coverage: list):
    filings = {}
    for client in ("Axon Enterprise", "Taser International", "Flock Safety", "Flock Group"):
        url = f"https://lda.gov/api/v1/filings/?{urllib.parse.urlencode({'client_name': client, 'page_size': 100})}"
        while url:
            d = http_json(url)
            for f in d.get("results", []):
                filings[f["filing_uuid"]] = f
            url = d.get("next")
            time.sleep(0.5)
    by = collections.defaultdict(lambda: {"amount": 0.0, "registrants": set(), "issues": collections.Counter(), "filings": 0, "bills": set()})
    lobbyists = set()
    text_by_company_year = collections.defaultdict(str)
    for f in filings.values():
        cname = norm(f["client"]["name"])
        company = "flock" if "FLOCK" in cname else "axon"
        year = f["filing_year"]
        b = by[(company, year)]
        b["filings"] += 1
        b["amount"] += money(f.get("income") or f.get("expenses") or 0)
        reg = f["registrant"]["name"]
        b["registrants"].add(title_name(reg, person=False) if reg.isupper() else reg)
        for a in f.get("lobbying_activities") or []:
            b["issues"][a.get("general_issue_code_display")] += 1
            desc = a.get("description") or ""
            text_by_company_year[(company, year)] += " " + desc
            for m in re.finditer(r"\b(H\.?\s?R\.?|S\.?|H\.?\s?Res\.?|S\.?\s?Con\.?\s?Res\.?)\s?(\d{1,5})\b", desc, re.I):
                b["bills"].add(canonical_bill(m.group(1), m.group(2)))
            if "AXON" in norm(reg) or "TASER" in norm(reg):  # in-house registrant: its lobbyists are company staff
                for l in a.get("lobbyists") or []:
                    lb = l.get("lobbyist") or {}
                    lobbyists.add(person_key(f"{lb.get('first_name', '')} {lb.get('last_name', '')}"))
    rows = []
    for (company, year), b in sorted(by.items(), key=lambda kv: (kv[0][0], kv[0][1])):
        rows.append({"company": company, "year": year, "filings": b["filings"], "reportedAmount": round(b["amount"], 2),
                     "registrants": sorted(b["registrants"]),
                     "topIssues": [k for k, _ in b["issues"].most_common(5) if k],
                     "bills": sorted(b["bills"], key=lambda x: (x.split()[0], int(x.split()[-1])))[:40],
                     "url": f"https://lda.senate.gov/filings/public/filing/search/?client_name={urllib.parse.quote('Flock' if company == 'flock' else ('Axon' if year >= 2017 else 'Taser'))}&filing_year={year}"})
    coverage.append({"jurisdiction": "US", "level": "federal", "source": "Senate LDA (lda.gov API)",
                     "url": "https://lda.gov/api/", "status": "searched",
                     "note": f"{len(filings)} LD-1/LD-2 filings for Axon/TASER/Flock as client."})
    return rows, lobbyists, text_by_company_year


def bill_keys(bill: str) -> set[str]:
    k = re.sub(r"[\s.]", "", bill.upper())
    return {k}


FED_VOTES = [
    dict(id="us-hr7120-2020", chamber="house", year=2020, roll=119, congress=116, bill="H.R. 7120", title="George Floyd Justice in Policing Act of 2020", question="On passage", topic="policing"),
    dict(id="us-s3985-2020", chamber="senate", congress=116, session=2, roll=126, bill="S. 3985", title="JUSTICE Act", question="Cloture on the motion to proceed", topic="policing"),
    dict(id="us-hr6395-2020-h", chamber="house", year=2020, roll=238, congress=116, bill="H.R. 6395", title="NDAA for Fiscal Year 2021", question="On agreeing to the conference report", topic="defense"),
    dict(id="us-hr6395-2020-s", chamber="senate", congress=116, session=2, roll=264, bill="H.R. 6395", title="NDAA for Fiscal Year 2021", question="On the conference report", topic="defense"),
    dict(id="us-hr1280-2021", chamber="house", year=2021, roll=60, congress=117, bill="H.R. 1280", title="George Floyd Justice in Policing Act of 2021", question="On passage", topic="policing"),
    dict(id="us-hr2670-2023-h", chamber="house", year=2023, roll=723, congress=118, bill="H.R. 2670", title="NDAA for Fiscal Year 2024", question="On agreeing to the conference report", topic="defense"),
    dict(id="us-hr2670-2023-s", chamber="senate", congress=118, session=1, roll=343, bill="H.R. 2670", title="NDAA for Fiscal Year 2024", question="On the conference report", topic="defense"),
    dict(id="us-hr2882-2024-h", chamber="house", year=2024, roll=102, congress=118, bill="H.R. 2882", title="Further Consolidated Appropriations Act, 2024", question="Concur in Senate amendment (H.Res. 1102)", topic="appropriations"),
    dict(id="us-hr2882-2024-s", chamber="senate", congress=118, session=2, roll=114, bill="H.R. 2882", title="Further Consolidated Appropriations Act, 2024", question="Concur in House amendment", topic="appropriations"),
    dict(id="us-hr7888-biggs-2024", chamber="house", year=2024, roll=114, congress=118, bill="H.R. 7888", title="RISAA — Biggs amendment (warrant requirement for U.S.-person queries)", question="On agreeing to the amendment", topic="surveillance"),
    dict(id="us-hr7888-2024-h", chamber="house", year=2024, roll=119, congress=118, bill="H.R. 7888", title="Reforming Intelligence and Securing America Act (FISA 702 reauthorization)", question="On passage", topic="surveillance"),
    dict(id="us-hr7888-2024-s", chamber="senate", congress=118, session=2, roll=150, bill="H.R. 7888", title="Reforming Intelligence and Securing America Act (FISA 702 reauthorization)", question="On passage", topic="surveillance"),
    dict(id="us-hr4639-2024", chamber="house", year=2024, roll=136, congress=118, bill="H.R. 4639", title="Fourth Amendment Is Not For Sale Act (limits government purchase of data)", question="On passage", topic="surveillance"),
    dict(id="us-hr2189-2026", chamber="house", year=2026, roll=70, congress=119, bill="H.R. 2189", title="Firearms law modernization for less-than-lethal weapons", question="On passage", topic="policing"),
    dict(id="us-sconres33-2026-h", chamber="house", year=2026, roll=143, congress=119, bill="S. Con. Res. 33", title="Concurrent budget resolution, FY2027", question="On agreeing to the resolution", topic="appropriations"),
    dict(id="us-sconres33-2026-s", chamber="senate", congress=119, session=2, roll=105, bill="S. Con. Res. 33", title="Concurrent budget resolution, FY2027", question="On the resolution", topic="appropriations"),
]

VOTE_NORM = {"YEA": "yes", "AYE": "yes", "YES": "yes", "Y": "yes", "NAY": "no", "NO": "no", "N": "no",
             "NOT VOTING": "nv", "NV": "nv", "PRESENT": "present", "P": "present", "EXCUSED": "nv", "E": "nv"}


def congress_years(c: int) -> set[int]:
    y = 1789 + (c - 1) * 2
    return {y, y + 1}


VOTEVIEW = "https://voteview.com/static/data/out"
VOTEVIEW_CAST = {1: "yes", 2: "yes", 3: "yes", 4: "no", 5: "no", 6: "no", 7: "present", 8: "present", 9: "nv"}


def voteview_senate(congress: int, session: int, roll: int):
    """Senate positions via Voteview (UCLA); senate.gov's WAF rejects automated clients."""
    calls = list(csv.DictReader(io.StringIO(http(f"{VOTEVIEW}/rollcalls/S{congress}_rollcalls.csv").decode("utf-8"))))
    rc = next(r for r in calls if r["session"] == str(session) and r["clerk_rollnumber"] == str(roll))
    members = {r["icpsr"]: r.get("bioguide_id") for r in
               csv.DictReader(io.StringIO(http(f"{VOTEVIEW}/members/S{congress}_members.csv").decode("utf-8")))
               if r.get("chamber") == "Senate"}  # the file also lists the President's announced position
    pos = {}
    for r in csv.DictReader(io.StringIO(http(f"{VOTEVIEW}/votes/S{congress}_votes.csv").decode("utf-8"))):
        if r["rollnumber"] != rc["rollnumber"]:
            continue
        bio = members.get(r["icpsr"])
        code = int(float(r["cast_code"] or 0))
        if bio and code in VOTEVIEW_CAST:
            pos[bio] = VOTEVIEW_CAST[code]
    return rc["date"], rc.get("vote_result", ""), pos


def fetch_fed_votes(by_lis, lobby_text):
    votes, positions = [], {}
    for v in FED_VOTES:
        if v["chamber"] == "house":
            url = f"https://clerk.house.gov/evs/{v['year']}/roll{v['roll']:03d}.xml"
            root = ET.fromstring(http(url))
            meta = root.find("vote-metadata")
            date = iso(dt.datetime.strptime(meta.findtext("action-date").strip(), "%d-%b-%Y").strftime("%Y-%m-%d"))
            result = meta.findtext("vote-result", "").strip()
            pos = {}
            for rv in root.iter("recorded-vote"):
                leg = rv.find("legislator")
                pos[leg.get("name-id")] = VOTE_NORM.get(rv.findtext("vote", "").strip().upper(), "nv")
            src = f"https://clerk.house.gov/Votes/{v['year']}{v['roll']}"
        else:
            date, result, pos = voteview_senate(v["congress"], v["session"], v["roll"])
            src = (f"https://www.senate.gov/legislative/LIS/roll_call_votes/vote{v['congress']}{v['session']}/"
                   f"vote_{v['congress']}_{v['session']}_{v['roll']:05d}.htm")
        tally = collections.Counter(pos.values())
        key = re.sub(r"[\s.]", "", v["bill"].upper())
        lobbied = sorted({c for (c, y), txt in lobby_text.items()
                          if y in congress_years(v["congress"]) and key in re.sub(r"[\s.]", "", txt.upper())})
        votes.append({
            "id": v["id"], "jurisdiction": "US", "chamber": v["chamber"], "date": date, "bill": v["bill"],
            "title": v["title"], "question": v["question"], "result": result, "topic": v["topic"],
            "tally": {"yes": tally["yes"], "no": tally["no"], "other": tally["nv"] + tally["present"]},
            "lobbiedBy": lobbied, "url": src,
        })
        positions[v["id"]] = pos
        log(f"  vote {v['id']}: {date} {result} {dict(tally)} lobbied={lobbied}")
    return votes, positions


AZ_VOTES = [
    dict(id="az-sb1543-2025-h", chamber="house", action=235181, question="House third reading"),
    dict(id="az-sb1543-2025-s", chamber="senate", action=235256, question="Senate final reading"),
]
AZ_BILL = dict(billStatusId=82973, bill="SB 1543 (2025)", title="Ancillary use; international headquarters campus (Axon HQ zoning bill)",
               url="https://apps.azleg.gov/BillStatus/BillOverview/82973")


def fetch_az_votes():
    votes, positions, legislators = [], {}, {}
    for v in AZ_VOTES:
        url = (f"https://apps.azleg.gov/api/BillStatusFloorAction/?billStatusId={AZ_BILL['billStatusId']}"
               f"&billStatusActionId={v['action']}&includeVotes=true")
        d = http_json(url)[0]
        pos = {}
        for x in d.get("Votes") or []:
            L = x["Legislator"]
            lid = f"az-{L['LegislatorId']}"
            legislators[lid] = {"name": L["FullName"].strip(), "party": L.get("Party"),
                                "chamber": "senate" if L.get("Body") == "S" else "house"}
            pos[lid] = VOTE_NORM.get((x.get("Vote") or "").strip().upper(), "nv")
        votes.append({
            "id": v["id"], "jurisdiction": "AZ", "chamber": v["chamber"], "date": (d.get("ReportDate") or "")[:10],
            "bill": AZ_BILL["bill"], "title": AZ_BILL["title"], "question": v["question"], "result": d.get("Action"),
            "topic": "company-specific", "tally": {"yes": d.get("Ayes"), "no": d.get("Nays"),
                                                    "other": (d.get("NotVoting") or 0) + (d.get("Excused") or 0)},
            "lobbiedBy": ["axon"], "url": AZ_BILL["url"],
        })
        positions[v["id"]] = pos
    return votes, positions, legislators


SOCRATA = [
    dict(domain="data.ny.gov", dataset="e9ss-239a", jurisdiction="NY", level="state",
         where="upper(flng_ent_name) like '%AXON ENTERPRISE%' OR upper(flng_ent_name) like '%TASER INT%' OR upper(flng_ent_name) like '%FLOCK GROUP%' OR upper(flng_ent_name) like '%FLOCK SAFETY%'"),
    dict(domain="data.cityofnewyork.us", dataset="rjkp-yttg", jurisdiction="NY", level="local",
         where="upper(empname) like '%AXON%' OR upper(empname) like '%TASER%' OR upper(empname) like '%FLOCK%' OR upper(name) like '%AXON ENTERPRISE%' OR upper(name) like '%FLOCK GROUP%'"),
    dict(domain="data.cityofnewyork.us", dataset="kgzj-pjna", jurisdiction="NY", level="local",
         where="upper(empname) like '%AXON%' OR upper(empname) like '%TASER%' OR upper(empname) like '%FLOCK%'"),
    dict(domain="data.lacity.org", dataset="m6g2-gc6c", jurisdiction="CA", level="local",
         where="upper(con_empr) like '%AXON%' OR upper(con_empr) like '%TASER%' OR upper(con_empr) like '%FLOCK%' OR upper(con_name) like '%AXON ENTERPRISE%' OR upper(con_name) like '%TASER INT%' OR upper(con_name) like '%FLOCK GROUP%'"),
    dict(domain="data.wa.gov", dataset="kv7h-kjye", jurisdiction="WA", level="state",
         where="upper(contributor_employer_name) like '%AXON%' OR upper(contributor_employer_name) like '%TASER%' OR upper(contributor_employer_name) like '%FLOCK%' OR upper(contributor_name) like '%AXON ENTERPRISE%' OR upper(contributor_name) like '%TASER INT%' OR upper(contributor_name) like '%FLOCK GROUP%' OR upper(contributor_name) like '%FLOCK SAFETY%'"),
    dict(domain="hicscdata.hawaii.gov", dataset="jexd-xbcg", jurisdiction="HI", level="state",
         where="upper(contributor_name) like '%AXON ENTERPRISE%' OR upper(contributor_name) like '%TASER INT%' OR upper(contributor_name) like '%FLOCK GROUP%' OR upper(contributor_name) like '%FLOCK SAFETY%' OR upper(employer) like '%AXON ENTERPRISE%' OR upper(employer) like '%TASER INT%' OR upper(employer) like '%FLOCK GROUP%' OR upper(employer) like '%FLOCK SAFETY%'"),
    dict(domain="data.austintexas.gov", dataset="g4yx-aw9r", jurisdiction="TX", level="local",
         where="upper(transactor_name) like '%AXON ENTERPRISE%' OR upper(transactor_name) like '%TASER INT%' OR upper(transactor_name) like '%FLOCK GROUP%' OR upper(transactor_name) like '%FLOCK SAFETY%' OR upper(transactor_employer) like '%AXON ENTERPRISE%' OR upper(transactor_employer) like '%TASER INT%' OR upper(transactor_employer) like '%FLOCK GROUP%' OR upper(transactor_employer) like '%FLOCK SAFETY%' OR upper(transactor_employer) like '%AXON%' OR upper(transactor_employer) like '%FLOCK%'"),
]

NYC_OFFICES = {"1": "Mayor of New York City", "2": "NYC Public Advocate", "3": "NYC Comptroller", "4": "Borough President", "5": "NYC Council"}


def fetch_socrata(coverage: list) -> list:
    recs = []
    for s in SOCRATA:
        url = f"https://{s['domain']}/resource/{s['dataset']}.json?{urllib.parse.urlencode({'$where': s['where'], '$limit': 5000})}"
        rows = http_json(url)
        page = f"https://{s['domain']}/d/{s['dataset']}"
        n = 0
        for r in rows:
            base = dict(jurisdiction=s["jurisdiction"], level=s["level"], sourceUrl=page)
            if s["dataset"] == "e9ss-239a":
                if r.get("filing_sched_abbrev") not in (None, "A", "B") and r.get("filing_sched_abbrev"):
                    continue  # schedule F etc. are expenditures, not contributions
                comp = company_for_org(r.get("flng_ent_name"))
                if not comp:
                    continue
                recs.append(bulk_record(source="ny-boe", company=comp, channel="corporate", donorName=r.get("flng_ent_name"),
                                        amount=money(r.get("org_amt")), date=iso(r.get("sched_date")),
                                        recipientCommittee=r.get("cand_comm_name"), recipientCandidate=None,
                                        recipientKind="committee", recordId=r.get("trans_number"), **base))
            elif s["domain"] == "data.cityofnewyork.us":
                hit, _ = classify_individual(r.get("empname"), r.get("occupation"), r.get("name"), r.get("state") or r.get("empstate"))
                if not hit:
                    continue
                cand = title_name(r.get("recipname"))
                recs.append(bulk_record(source="nyc-cfb", company=hit[0], channel=hit[1], donorName=r.get("name"),
                                        donorOccupation=r.get("occupation"), donorState=r.get("state"),
                                        amount=money(r.get("amnt")), date=iso(r.get("date")), recipientCommittee=None,
                                        recipientCandidate=cand, recipientKind="candidate",
                                        office={"sought": f"{NYC_OFFICES.get(str(r.get('officecd')), 'NYC office')} ({r.get('election')})", "held": None},
                                        recordId=r.get("refno"), **base))
            elif s["domain"] == "data.lacity.org":
                if company_for_org(r.get("con_name")):
                    hit = (company_for_org(r.get("con_name")), "corporate")
                else:
                    hit, _ = classify_individual(r.get("con_empr"), r.get("con_occ"), r.get("con_name"), r.get("con_st") or "AZ")
                if not hit:
                    continue
                recs.append(bulk_record(source="la-ethics", company=hit[0], channel=hit[1], donorName=r.get("con_name"),
                                        donorOccupation=r.get("con_occ"), donorState=r.get("con_st"),
                                        amount=money(r.get("con_amt") or r.get("amount")), date=iso(r.get("con_date")),
                                        recipientCommittee=r.get("com_name"), recipientCandidate=title_name(r.get("cand_name")),
                                        recipientKind="candidate",
                                        office={"sought": f"Los Angeles {r.get('office') or 'City office'}".strip(), "held": None},
                                        recordId=r.get("con_id") or r.get("id"), **base))
            elif s["domain"] == "data.wa.gov":
                if company_for_org(r.get("contributor_name")):
                    hit = (company_for_org(r.get("contributor_name")), "corporate")
                else:
                    hit, _ = classify_individual(r.get("contributor_employer_name"), r.get("contributor_occupation"),
                                                 r.get("contributor_name"), r.get("contributor_state"))
                if not hit:
                    continue
                is_cand = r.get("type") == "Candidate"
                cand = None
                if is_cand:
                    m = re.search(r"\(([^)]+)\)", r.get("filer_name") or "")
                    cand = title_name(m.group(1) if m else r.get("filer_name"))
                office = None
                if is_cand and r.get("office"):
                    office = {"sought": title_name(r.get("office"), person=False) + (f" (LD {r.get('legislative_district')})" if r.get("legislative_district") else ""), "held": None}
                recs.append(bulk_record(source="wa-pdc", company=hit[0], channel=hit[1], donorName=r.get("contributor_name"),
                                        donorOccupation=r.get("contributor_occupation"), donorState=r.get("contributor_state"),
                                        amount=money(r.get("amount")), date=iso(r.get("receipt_date")),
                                        recipientCommittee=r.get("filer_name"), recipientCandidate=cand,
                                        recipientKind="candidate" if is_cand else ("ballot" if "jail" in (r.get("filer_name") or "").lower() or r.get("ballot_number") else "committee"),
                                        office=office, recordId=r.get("id"),
                                        **dict(base, level="local" if (r.get("jurisdiction_type") or "").lower() in ("local", "county", "city") or "CO" in (r.get("jurisdiction") or "").split() else "state")))
            elif s["dataset"] == "jexd-xbcg":
                if company_for_org(r.get("contributor_name")):
                    hit = (company_for_org(r.get("contributor_name")), "corporate")
                else:
                    hit, _ = classify_individual(r.get("employer"), r.get("occupation"), r.get("contributor_name"), r.get("state"))
                if not hit:
                    continue
                recs.append(bulk_record(source="hi-csc", company=hit[0], channel=hit[1], donorName=r.get("contributor_name"),
                                        donorOccupation=r.get("occupation"), donorState=r.get("state"),
                                        amount=money(r.get("amount")), date=iso(r.get("date")),
                                        recipientCommittee=None, recipientCandidate=title_name(r.get("candidate_name")),
                                        recipientKind="candidate", office={"sought": "Hawaii candidate", "held": None},
                                        recordId=r.get("id") or f"{r.get('candidate_name')}|{r.get('date')}|{r.get('amount')}", **base))
            elif s["dataset"] == "g4yx-aw9r":
                if (r.get("transaction_type") or "").lower() != "contribution":
                    continue
                if company_for_org(r.get("transactor_name")):
                    hit = (company_for_org(r.get("transactor_name")), "corporate")
                else:
                    city = r.get("transactor_city") or ""
                    st_m = re.search(r"-\s*([A-Z]{2})\s*-", city)
                    st = st_m.group(1) if st_m else None
                    hit, _ = classify_individual(r.get("transactor_employer"), r.get("transactor_occupation"),
                                                 r.get("transactor_name"), st)
                if not hit:
                    continue
                link = (r.get("link_to_report") or {})
                url = link.get("url") if isinstance(link, dict) else page
                recs.append(bulk_record(source="austin-ethics", company=hit[0], channel=hit[1], donorName=r.get("transactor_name"),
                                        donorOccupation=r.get("transactor_occupation"),
                                        amount=money(r.get("transaction_amount")), date=iso(r.get("transaction_date")),
                                        recipientCommittee=r.get("filer_name"), recipientCandidate=title_name(r.get("filer_name")),
                                        recipientKind="candidate",
                                        office={"sought": title_name(r.get("office_sought"), person=False) or "Austin City office", "held": None},
                                        recordId=r.get("transaction_id"), **dict(base, sourceUrl=url or page)))
            n += 1
        coverage.append({"jurisdiction": s["jurisdiction"], "level": s["level"], "source": f"{s['domain']} ({s['dataset']})",
                         "url": page, "status": "searched", "note": f"{n} matching rows"})
    return recs


def fetch_florida(coverage: list) -> list:
    recs = []
    for q in ("AXON ENTERPRISE", "TASER INTERNATIONAL", "FLOCK SAFETY", "FLOCK GROUP"):
        body = urllib.parse.urlencode({
            "election": "All", "search_on": "1", "CanFName": "", "CanLName": "", "CanNameSrch": "2", "office": "All",
            "cdistrict": "", "cgroup": "", "party": "All", "ComName": "", "ComNameSrch": "2", "committee": "All",
            "cfname": "", "clname": q, "namesearch": "2", "ccity": "", "cstate": "", "czipcode": "", "coccupation": "",
            "cdollar_minimum": "", "cdollar_maximum": "", "rowlimit": "", "csort1": "DAT", "csort2": "CAN",
            "cdatefrom": "", "cdateto": "", "queryformat": "2", "Submit": "Submit"}).encode()
        text = http("https://dos.elections.myflorida.com/cgi-bin/contrib.exe", body=body,
                    headers={"Content-Type": "application/x-www-form-urlencoded"}).decode("latin-1")
        rows = list(csv.reader(io.StringIO(text), delimiter="\t"))
        for r in rows[1:]:
            if len(r) < 5:
                continue
            comp = company_for_org(r[4])
            if not comp:
                continue
            recs.append(bulk_record(source="fl-doe", jurisdiction="FL", level="local" if "Chronister" in r[0] else "state",
                                    company=comp, channel="corporate", donorName=r[4], amount=money(r[2]), date=iso(r[1]),
                                    recipientCommittee=re.sub(r"\s*\((PAC|CCE|ECO)\)$", "", r[0]), recipientCandidate=None,
                                    recipientKind="committee", recordId=f"{r[0]}|{r[1]}|{r[2]}",
                                    sourceUrl="https://dos.elections.myflorida.com/campaign-finance/contributions/"))
    coverage.append({"jurisdiction": "FL", "level": "state", "source": "Florida Division of Elections", "status": "searched",
                     "url": "https://dos.elections.myflorida.com/campaign-finance/contributions/",
                     "note": f"{len(recs)} corporate contributions (Florida does not collect donor employer)."})
    return recs


# Manual resolution for committees whose filings do not name the candidate. Each entry
# is checked against the filing (committee name, jurisdiction, cycle) before use.
RECIPIENT_OVERRIDES = {
    ("NY", "Dubois For Sheriff"): dict(name="Carl E. DuBois", office="Orange County (NY) Sheriff", level="local"),
    ("NY", "Spitzer Paterson 2006"): dict(name="Eliot Spitzer", office="Governor of New York (2006 campaign)", level="state"),
    ("FL", "Friends of Chad Chronister"): dict(name="Chad Chronister", office="Hillsborough County (FL) Sheriff — affiliated political committee", level="local"),
    ("CA", "Simonoff for Assembly"): dict(name="Marty Simonoff", office="California Assembly (2006 campaign)"),
    ("CA", "Becerra for Governor"): dict(name="Xavier Becerra", office="Governor of California (2026 campaign)"),
    ("CA", "Portantino for Senate"): dict(name="Anthony Portantino", office="California Senate (2020 campaign)"),
    ("TX", "Beto for Texas"): dict(name="Beto O'Rourke", office="Governor of Texas (2022 campaign)"),
    ("IL", "Cicero Voters Alliance (The Larry Dominick Team)"): dict(name="Larry Dominick", office="Cicero (IL) Town President — slate committee", level="local"),
    ("IL", "Friends of John Idleburg"): dict(name="John Idleburg", office="St. Clair County (IL) Sheriff", level="local"),
    ("IL", "Committee to Elect Robert J Lovero"): dict(name="Robert J. Lovero", office="Mayor of Berwyn, Illinois", level="local"),
    ("IL", "Friends To Elect Dan Jungles Sheriff"): dict(name="Dan Jungles", office="Illinois sheriff candidate", level="local"),
}


# Filer names published without a comma ("LAST FIRST M") that cannot be flipped mechanically.
NAME_FIXES = {"Podlodowski Tina M": "Tina Podlodowski"}


def override_for(jur: str, committee: str | None):
    c = norm(committee)
    for (j, name), v in RECIPIENT_OVERRIDES.items():
        if j == jur and c.startswith(norm(name)):
            return v
    return None


STATE_NAMES = {"CA": "California", "CO": "Colorado", "TX": "Texas", "WA": "Washington", "NY": "New York",
               "FL": "Florida", "IL": "Illinois", "AZ": "Arizona"}
CAND_COMMITTEE_RE = re.compile(
    r"^(?:friends of |elect |re-?elect |committee to elect )?(?P<name>[A-Za-z.'\- ]+?)\s+(?:for|4)\s+"
    r"(?P<office>state assembly|assembly|state senate|senate|governor|lieutenant governor|attorney general|"
    r"secretary of state|treasurer|controller|insurance commissioner|superintendent|supervisor|sheriff|"
    r"mayor|city council|council|district attorney|state representative|state rep|house|colorado|texas|"
    r"washington|california|arizona|illinois|florida|new york)\b(?:\s+(?P<year>\d{4}))?",
    re.I)


def candidate_from_committee(jur: str, committee: str | None):
    """'Lorena Gonzalez for Assembly 2020' -> ('Lorena Gonzalez', 'California Assembly (2020 campaign)')."""
    m = CAND_COMMITTEE_RE.match((committee or "").strip())
    if not m or len(m.group("name").split()) < 2:
        return None
    office = m.group("office").title()
    state = STATE_NAMES.get(jur, jur)
    if office.lower() in {s.lower() for s in STATE_NAMES.values()}:
        office = f"{state} office"
    elif office.lower() in ("assembly", "state assembly", "senate", "state senate", "house", "state representative", "state rep"):
        office = f"{state} {'Senate' if 'senate' in office.lower() else ('Assembly' if 'assembly' in office.lower() else 'House')}"
    year = m.group("year")
    return m.group("name").strip(), f"{office} ({year} campaign)" if year else office


CONDUIT_RE = re.compile(r"\b(ACTBLUE|WINRED|DEMOCRACY ENGINE)\b")


ORG_KIND_RE = [
    (re.compile(r"GOVERNORS ASSOCIATION|ATTORNEYS GENERAL|MAYORS|COUNTY OFFICIALS|COMMUNITY LEADERS OF AMERICA|LIEUTENANT GOVERNORS|SECRETARIES OF STATE|LEGISLATIVE CAMPAIGN", re.I), "association"),
    (re.compile(r"\bPARTY\b|DEMOCRATIC (PAC|CLUB)|REPUBLICAN (WOMEN|PAC|CLUB)|\bDNC\b|\bRNC\b|DCCC|NRCC|DSCC|NRSC|CENTRAL COMMITTEE", re.I), "party"),
    (re.compile(r"\bYES\b|\bNO ON\b|\bISSUE\b|MEASURE|PROPOSITION|INVESTING IN|BOND", re.I), "ballot"),
]


def org_kind(name: str, default: str = "pac") -> str:
    for rx, kind in ORG_KIND_RE:
        if rx.search(name or ""):
            return kind
    return default


# ------------------------------------------------------------------- assembling

class Book:
    def __init__(self):
        self.officials: dict[str, dict] = {}
        self.orgs: dict[str, dict] = {}

    def official(self, key: str, **fields) -> dict:
        o = self.officials.get(key)
        if not o:
            o = {"id": key, "name": fields.get("name"), "level": fields.get("level"), "state": fields.get("state"),
                 "office": fields.get("office"), "party": fields.get("party"), "current": fields.get("current"),
                 "bioguide": fields.get("bioguide"), "items": [], "votes": {}}
            self.officials[key] = o
        else:
            for k in ("office", "party", "current", "bioguide"):
                if not o.get(k) and fields.get(k) is not None:
                    o[k] = fields[k]
        return o

    def org(self, key: str, **fields) -> dict:
        o = self.orgs.get(key)
        if not o:
            o = {"id": key, "name": fields.get("name"), "kind": fields.get("kind"), "level": fields.get("level"),
                 "state": fields.get("state"), "note": fields.get("note"), "items": []}
            self.orgs[key] = o
        return o


def slug(*parts) -> str:
    return re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", "-".join(str(p) for p in parts if p).lower())).strip("-")


def add_item(target: dict, ev: dict):
    target["items"].append(ev)


def collapse_items(items: list) -> list:
    """Name officers/lobbyists/companies; aggregate rank-and-file employees per company+source."""
    named, agg = [], {}
    for it in items:
        if it["channel"] == "employees":
            k = (it["company"], it["source"])
            a = agg.setdefault(k, {"company": it["company"], "channel": "employees", "source": it["source"], "amount": 0.0,
                                   "donors": set(), "count": 0, "dates": [], "via": set(), "url": it.get("url")})
            a["amount"] += it["amount"]
            a["donors"].add(it.get("donorKey"))
            a["count"] += 1
            if it.get("date"):
                a["dates"].append(it["date"])
            if it.get("via"):
                a["via"].add(it["via"])
        else:
            named.append({k: it.get(k) for k in ("company", "channel", "source", "amount", "date", "donor", "donorRole", "via", "url")})
    for a in agg.values():
        d = sorted(a["dates"])
        named.append({"company": a["company"], "channel": "employees", "source": a["source"], "amount": round(a["amount"], 2),
                      "donorCount": len(a["donors"]), "contributionCount": a["count"],
                      "dateFrom": d[0] if d else None, "dateTo": d[-1] if d else None,
                      "via": "; ".join(sorted(a["via"]))[:200] or None, "url": a["url"]})
    named.sort(key=lambda x: (x.get("date") or x.get("dateTo") or ""), reverse=True)
    for n in named:
        n["amount"] = round(n["amount"], 2)
        for k in [k for k, v in n.items() if v is None]:
            del n[k]
    return named


def totals(items: list) -> dict:
    t = {"axon": 0.0, "flock": 0.0}
    by_channel = collections.Counter()
    for it in items:
        t[it["company"]] = round(t[it["company"]] + it["amount"], 2)
        by_channel[it["channel"]] += it["amount"]
    return {"axon": t["axon"], "flock": t["flock"], "total": round(t["axon"] + t["flock"], 2),
            "byChannel": {k: round(v, 2) for k, v in by_channel.items()}}


def merge_federal_duplicates(book: Book):
    """One person can hold several FEC candidate IDs (House, Senate, President runs).
    Merge federal entries sharing a normalized name when the states agree or one is a
    presidential run; prefer the entry linked to a congress-legislators record."""
    groups = collections.defaultdict(list)
    for o in book.officials.values():
        if o["level"] == "federal":
            groups[person_key(o["name"])].append(o)
    for entries in groups.values():
        if len(entries) < 2:
            continue
        entries.sort(key=lambda o: (not o.get("bioguide"), o["state"] == "US", -len(o["items"])))
        keep = entries[0]
        for o in entries[1:]:
            if o["state"] not in (keep["state"], "US") and keep["state"] != "US":
                continue
            keep["items"].extend(o["items"])
            keep.setdefault("fecIds", set()).update(o.get("fecIds") or set())
            for vid, pos in o["votes"].items():
                keep["votes"].setdefault(vid, pos)
            if o.get("office") and o["office"] not in (keep.get("office") or ""):
                keep["office"] = f"{keep['office']}; also {o['office'].replace(' (candidate)', '')} candidate" \
                    if "President" in o["office"] else f"{keep['office']}; also ran for {o['office']}"
            del book.officials[o["id"]]


def az_name_key(name: str) -> tuple[str, str]:
    n = norm(re.sub(r'"[^"]*"', "", name))
    toks = [t for t in n.split() if len(t) > 1 or t.isalpha()]
    return (toks[-1] if toks else "", toks[0][:1] if toks else "")


def cmd_build(_args):
    coverage: list = []
    book = Book()

    log("legislators…")
    by_fec, by_bio, by_lis = load_legislators()

    log("LDA…")
    lobbying, lobbyists, lobby_text = lda_summary(coverage)

    log("FEC…")
    fec_events = fec_money(lobbyists, coverage)
    cids = {e["committeeId"] for e in fec_events}
    committees = fec_batch("/committees/", "committee_id", sorted(cids))
    cand_ids = set()
    for c in committees.values():
        cand_ids.update(i for i in c.get("candidate_ids") or [] if not i.startswith("C"))
        cand_ids.update(i for i in c.get("sponsor_candidate_ids") or [] if not i.startswith("C"))
    candidates = fec_batch("/candidates/", "candidate_id", sorted(cand_ids))

    for e in fec_events:
        c = committees.get(e["committeeId"], {})
        ctype, desig = c.get("committee_type"), c.get("designation")
        cand_id = None
        people = [i for i in (c.get("candidate_ids") or []) if not i.startswith("C")]
        sponsors = [i for i in (c.get("sponsor_candidate_ids") or []) if not i.startswith("C")]
        if ctype in ("H", "S", "P") and people:
            cand_id = people[0]
        elif desig == "D" and sponsors:
            cand_id = sponsors[0]
        via = title_name(c.get("name") or e.get("committeeName"), person=False)
        item = {"company": e["company"], "channel": e["channel"], "source": "fec", "amount": e["amount"], "date": e["date"],
                "donor": title_name(e["donor"], person=e["channel"] not in ("corporate", "pac")) if e["channel"] != "employees" else None,
                "donorRole": title_name(e.get("donorOccupation"), person=False) if e["channel"] in ("executive", "lobbyist") else None,
                "donorKey": e.get("donorKey"), "via": via, "url": e["url"]}
        if cand_id:
            cand = candidates.get(cand_id, {})
            leg = by_fec.get(cand_id)
            office_code = cand.get("office") or ctype
            st = cand.get("state") or (leg or {}).get("state")
            if leg and office_code != "P":
                st = leg["state"]
                if leg["chamber"] == "senate":
                    office = f"U.S. Senate — {st}"
                else:
                    dist = leg.get("district")
                    office = f"U.S. House — {st}-{int(dist):02d}" if dist else f"U.S. House — {st} (at-large)"
                if not leg["current"]:
                    office += " (former)"
            elif office_code == "P":
                office = "President of the United States (candidate)"
                st = "US"
            elif office_code == "S":
                office = f"U.S. Senate — {st}"
            else:
                dist = cand.get("district") or (leg or {}).get("district")
                office = f"U.S. House — {st}-{int(dist):02d}" if str(dist or "").isdigit() and int(dist) > 0 else f"U.S. House — {st} (at-large)"
            key = f"us-{leg['bioguide']}" if leg else f"us-{cand_id}"
            o = book.official(key, name=leg["name"] if leg else title_name(cand.get("name") or via), level="federal", state=st,
                              office=office, party=(leg or {}).get("party") or PARTY.get(cand.get("party"), (cand.get("party") or "")[:1] or None),
                              current=bool(leg and leg["current"]), bioguide=(leg or {}).get("bioguide"))
            o.setdefault("fecIds", set()).add(cand_id)
            add_item(o, item)
        else:
            kind = {"X": "party", "Y": "party", "Z": "party", "O": "super_pac", "U": "super_pac", "V": "pac", "W": "pac",
                    "N": "pac", "Q": "pac"}.get(ctype, "pac")
            if desig == "J":
                kind = "jfc"
            if e["committeeId"] == AXON_PAC:
                o = book.org(f"us-{AXON_PAC}", name=via, kind="company_committee", level="federal", state=c.get("state"),
                             note="Axon's corporate PAC. Amounts shown are money it raised; its gifts appear under each recipient.")
                o["direction"] = "received"
            else:
                o = book.org(f"us-{e['committeeId']}", name=via, kind=kind, level="federal", state=c.get("state"))
            add_item(o, item)

    log("federal votes…")
    fed_votes, fed_pos = fetch_fed_votes(by_lis, lobby_text)
    for o in book.officials.values():
        if o.get("bioguide"):
            for vid, pos in fed_pos.items():
                if o["bioguide"] in pos:
                    o["votes"][vid] = pos[o["bioguide"]]

    log("Arizona…")
    az_votes, az_pos, az_legs = fetch_az_votes()
    az_index = {}
    for lid, L in az_legs.items():
        az_index.setdefault(az_name_key(L["name"]), []).append((lid, L))
    snap = json.loads(AZ_SNAPSHOT.read_text())
    afbf = book.org("az-arizonans-for-a-better-future", name=snap["committee"], kind="company_committee", level="state", state="AZ",
                    note="Arizona political committee funded by Axon Enterprise and Axon executives. Amounts shown are money it raised; its gifts appear under each recipient.")
    for inc in snap["income"]:
        add_item(afbf, {"company": "axon", "channel": "corporate" if inc["kind"] == "corporate" else "executive",
                        "source": "az-seethemoney", "amount": inc["amount"], "date": inc["date"],
                        "donor": inc["contributor"], "donorRole": inc.get("occupation"), "via": snap["committee"],
                        "url": snap["sourceUrl"]})
    afbf["direction"] = "received"
    az_unmatched = []
    for c in snap["contributions"]:
        item = {"company": "axon", "channel": "company_committee", "source": "az-seethemoney", "amount": c["amount"],
                "date": c["date"], "donor": snap["committee"], "via": c["recipientCommittee"], "url": snap["sourceUrl"]}
        person = snap["committeeToLegislator"].get(c["recipientCommittee"])
        if c["type"] != "candidate" or not person:
            o = book.org(slug("az", c["recipientCommittee"]), name=c["recipientCommittee"],
                         kind="super_pac" if c["type"] == "pac" else "committee", level="federal" if c["recipientCommittee"] == "American Perspective" else "state",
                         state="AZ", note=snap["unattributed"].get(c["recipientCommittee"]))
            add_item(o, item)
            continue
        matches = az_index.get(az_name_key(person), [])
        lid, L = matches[0] if len(matches) == 1 else (None, None)
        if not lid:
            az_unmatched.append(person)
        key = lid or slug("az", person)
        o = book.official(key, name=person, level="state", state="AZ",
                          office=("Arizona Senate" if L and L["chamber"] == "senate" else "Arizona House") if L else "Arizona legislative candidate",
                          party=(L or {}).get("party"), current=True if L else None)
        add_item(o, item)
    for vid, pos in az_pos.items():
        for lid, p in pos.items():
            if lid in book.officials:
                book.officials[lid]["votes"][vid] = p
    if az_unmatched:
        log(f"  AZ recipients not matched to a 2025 legislator: {sorted(set(az_unmatched))}")
    coverage.append({"jurisdiction": "AZ", "level": "state", "source": "Arizona SeeTheMoney + Arizona Legislature API",
                     "url": "https://seethemoney.az.gov/", "status": "partial",
                     "note": "Committee-level capture for Arizonans for a Better Future (browser-only site, no API). "
                             "Direct executive-to-candidate gifts were not exportable; see the news-reported items."})

    log("state/local live + bulk…")
    state_recs = fetch_socrata(coverage) + fetch_florida(coverage)
    bulk = json.loads(BULK_SNAPSHOT.read_text()) if BULK_SNAPSHOT.exists() else {"records": [], "stats": {}}
    state_recs += bulk["records"]
    for jur, note in sorted((bulk.get("stats") or {}).items()):
        coverage.append({"jurisdiction": jur if len(jur) == 2 else "US", "level": "state" if jur != "IRS" else "association",
                         "source": {"TX": "Texas Ethics Commission bulk export", "CA": "Cal-Access bulk export",
                                    "CO": "Colorado TRACER bulk files", "IL": "Illinois SBE Receipts.txt",
                                    "IRS": "IRS Form 8872 (political organizations) full data"}.get(jur, jur),
                         "url": {"TX": "https://www.ethics.state.tx.us/search/cf/", "CA": "https://www.sos.ca.gov/campaign-lobbying/cal-access-resources/raw-data-campaign-finance-and-lobbying-activity",
                                 "CO": "https://tracer.sos.colorado.gov/PublicSite/DataDownload.aspx", "IL": "https://elections.il.gov/campaigndisclosuredatafiles/",
                                 "IRS": "https://forms.irs.gov/app/pod/dataDownload/dataDownload"}.get(jur),
                         "status": "searched", "note": note})

    for r in state_recs:
        if not r.get("amount"):
            continue
        item = {"company": r["company"], "channel": r["channel"], "source": r["source"], "amount": r["amount"], "date": r["date"],
                "donor": r.get("donor"), "donorRole": title_name(r.get("donorOccupation"), person=False) if r.get("donorOccupation") else None,
                "donorKey": r.get("donorKey"), "via": r.get("recipientCommittee"), "url": r.get("sourceUrl")}
        jur = r["jurisdiction"]
        if CONDUIT_RE.search(norm(r.get("recipientCommittee"))):
            continue  # earmark conduits: the final recipient reports the gift itself
        ov = override_for(jur, r.get("recipientCommittee"))
        cand = r.get("recipientCandidate")
        if not ov and not cand and r.get("recipientKind") == "committee":
            guess = candidate_from_committee(jur, r.get("recipientCommittee"))
            if guess:
                ov = {"name": guess[0], "office": guess[1]}
        if ov or (cand and r.get("recipientKind") == "candidate"):
            name = ov["name"] if ov else cand
            office = (ov or {}).get("office")
            off = r.get("office") or {}
            if not office:
                office = off.get("held") or off.get("sought") or "Candidate"
                if off.get("held") and off.get("sought") and off["held"] != off["sought"]:
                    office = f"{off['held']}; candidate for {off['sought']}"
            o = book.official(slug(jur, person_key(name)), name=title_name(name) if name.isupper() else name,
                              level=(ov or {}).get("level") or r.get("level") or "state", state=jur, office=office,
                              current=True if off.get("held") else None)
            add_item(o, item)
        else:
            name = r.get("recipientCommittee") or "Unknown committee"
            kind = r.get("recipientKind") if r.get("recipientKind") in ("association", "ballot") else org_kind(name, "committee")
            o = book.org(slug(jur, name), name=name, kind=kind, level=r.get("level") or "state", state=jur if jur != "US" else None)
            add_item(o, item)

    coverage += STATIC_COVERAGE
    merge_federal_duplicates(book)

    officials = []
    for o in book.officials.values():
        o["name"] = NAME_FIXES.get(o["name"], o["name"])
        items = collapse_items(o.pop("items"))
        o["fecIds"] = sorted(o.get("fecIds") or [])
        if not o["fecIds"]:
            o.pop("fecIds")
        o["totals"] = totals(items)
        o["contributions"] = items
        if not o["votes"]:
            o.pop("votes")
        officials.append({k: v for k, v in o.items() if v is not None})
    attach_saved_contacts(officials)
    officials.sort(key=lambda o: (-o["totals"]["total"], o["name"]))
    orgs = []
    for o in book.orgs.values():
        items = collapse_items(o.pop("items"))
        o["totals"] = totals(items)
        o["contributions"] = items
        orgs.append({k: v for k, v in o.items() if v is not None})
    orgs.sort(key=lambda o: (-o["totals"]["total"], o["name"]))

    payload = {
        "generatedAt": dt.date.today().isoformat(),
        "companies": [
            {"id": "axon", "name": "Axon Enterprise, Inc.", "formerly": "TASER International (renamed 2017)", "hq": "Scottsdale, AZ",
             "products": "Body cameras, TASER energy weapons, evidence and records software, drones", "pac": {"name": "Axon Enterprise Inc. PAC", "fecId": AXON_PAC}},
            {"id": "flock", "name": "Flock Group Inc. (Flock Safety)", "hq": "Atlanta, GA",
             "products": "Automated license plate readers, gunshot detection, drones, video integration", "pac": None},
        ],
        "votes": fed_votes + az_votes,
        "officials": officials,
        "organizations": orgs,
        "lobbying": lobbying,
        "reported": REPORTED_ITEMS,
        "coverage": coverage,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, indent=1, ensure_ascii=False, sort_keys=False) + "\n")
    write_exports(payload)
    log(f"wrote {OUT.relative_to(ROOT)}: {len(officials)} officials, {len(orgs)} organizations, {len(payload['votes'])} votes, "
        f"{OUT.stat().st_size // 1024} KB")


def _csv(path: Path, rows: list[dict], fields: list[str]):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore")
        w.writeheader()
        for r in rows:
            w.writerow({k: "" if r.get(k) is None else r.get(k) for k in fields})


CONTACT_FIELDS = ("phone", "website", "twitter", "facebook", "instagram", "contactForm", "address", "ballotpedia")


def attach_saved_contacts(officials: list[dict]):
    """Re-apply office contact from the last enrich_contacts.py run."""
    if not CIVICS_CONTACTS.exists():
        return
    rows = json.loads(CIVICS_CONTACTS.read_text())
    by_bio = {r["bioguide"]: r for r in rows if r.get("bioguide")}
    by_name: dict[tuple[str, str], list[dict]] = {}
    for r in rows:
        key = ((r.get("state") or "").upper(), person_key(r.get("name")))
        if key[1]:
            by_name.setdefault(key, []).append(r)
    n = 0
    for o in officials:
        src = by_bio.get(o.get("bioguide")) if o.get("bioguide") else None
        if not src:
            hits = by_name.get(((o.get("state") or "").upper(), person_key(o.get("name")))) or []
            src = hits[0] if len(hits) == 1 else None
        if not src:
            continue
        contact = {k: src[k] for k in CONTACT_FIELDS if src.get(k)}
        if contact:
            o["contact"] = contact
            n += 1
    log(f"  office contact from snapshot: {n}/{len(officials)}")


def write_exports(payload: dict):
    """Public copies at /data/accountability/ plus a one-page summary in the snapshot folder."""
    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)
    (PUBLIC_DIR / "surveillance-money.json").write_text(
        json.dumps(payload, indent=1, ensure_ascii=False) + "\n")
    officials = payload.get("officials") or []
    orgs = payload.get("organizations") or []
    votes = {v["id"]: v for v in payload.get("votes") or []}
    _csv(PUBLIC_DIR / "officials.csv", [
        {"id": o["id"], "name": o["name"], "level": o.get("level"), "state": o.get("state"),
         "office": o.get("office"), "party": o.get("party"), "current": o.get("current"),
         "axon": o["totals"]["axon"], "flock": o["totals"]["flock"], "total": o["totals"]["total"],
         "voteCount": len(o.get("votes") or {}),
         "phone": (o.get("contact") or {}).get("phone"),
         "website": (o.get("contact") or {}).get("website"),
         "twitter": (o.get("contact") or {}).get("twitter"),
         "contactForm": (o.get("contact") or {}).get("contactForm")}
        for o in officials
    ], ["id", "name", "level", "state", "office", "party", "current", "axon", "flock", "total", "voteCount",
        "phone", "website", "twitter", "contactForm"])
    _csv(PUBLIC_DIR / "contacts.csv", [
        {"id": o["id"], "name": o["name"], "state": o.get("state"), "office": o.get("office"),
         **{k: (o.get("contact") or {}).get(k) for k in CONTACT_FIELDS}}
        for o in officials if o.get("contact")
    ], ["id", "name", "state", "office", *CONTACT_FIELDS])
    _csv(PUBLIC_DIR / "organizations.csv", [
        {"id": o["id"], "name": o["name"], "kind": o.get("kind"), "level": o.get("level"),
         "state": o.get("state"), "direction": o.get("direction"),
         "axon": o["totals"]["axon"], "flock": o["totals"]["flock"], "total": o["totals"]["total"]}
        for o in orgs
    ], ["id", "name", "kind", "level", "state", "direction", "axon", "flock", "total"])
    contribs = []
    for kind, rows in (("official", officials), ("organization", orgs)):
        for rec in rows:
            for c in rec.get("contributions") or []:
                contribs.append({
                    "recipientType": kind, "recipientId": rec["id"], "recipientName": rec["name"],
                    "state": rec.get("state"), "level": rec.get("level"), "office": rec.get("office") or rec.get("kind"),
                    "company": c.get("company"), "channel": c.get("channel"), "amount": c.get("amount"),
                    "date": c.get("date") or c.get("dateTo"), "dateFrom": c.get("dateFrom"),
                    "donor": c.get("donor"), "donorRole": c.get("donorRole"),
                    "donorCount": c.get("donorCount"), "contributionCount": c.get("contributionCount"),
                    "via": c.get("via"), "source": c.get("source"), "url": c.get("url"),
                })
    contribs.sort(key=lambda r: (-float(r["amount"] or 0), r.get("date") or ""), reverse=False)
    _csv(PUBLIC_DIR / "contributions.csv", contribs,
         ["recipientType", "recipientId", "recipientName", "state", "level", "office", "company", "channel",
          "amount", "date", "dateFrom", "donor", "donorRole", "donorCount", "contributionCount", "via", "source", "url"])
    vote_rows = []
    for rec in officials:
        for vid, pos in (rec.get("votes") or {}).items():
            v = votes.get(vid) or {}
            vote_rows.append({
                "officialId": rec["id"], "officialName": rec["name"], "state": rec.get("state"),
                "voteId": vid, "position": pos, "bill": v.get("bill"), "title": v.get("title"),
                "date": v.get("date"), "chamber": v.get("chamber"), "jurisdiction": v.get("jurisdiction"),
                "url": v.get("url"),
            })
    _csv(PUBLIC_DIR / "votes.csv", vote_rows,
         ["officialId", "officialName", "state", "voteId", "position", "bill", "title", "date", "chamber", "jurisdiction", "url"])
    _csv(PUBLIC_DIR / "lobbying.csv", [
        {**r, "registrants": "; ".join(r.get("registrants") or []),
         "topIssues": "; ".join(r.get("topIssues") or []),
         "bills": "; ".join(r.get("bills") or [])}
        for r in payload.get("lobbying") or []
    ], ["company", "year", "filings", "reportedAmount", "registrants", "topIssues", "bills", "url"])
    axon = sum(o["totals"]["axon"] for o in officials)
    flock = sum(o["totals"]["flock"] for o in officials)
    org_out = [o for o in orgs if o.get("direction") != "received"]
    lines = [
        f"# Accountability snapshot ({payload.get('generatedAt')})",
        "",
        "Compiled public filings for Axon (TASER) and Flock Safety. Open `/` or `/accountability`",
        "or download `/data/accountability/` (JSON + CSV).",
        "",
        f"- Officials and candidates: **{len(officials)}**",
        f"- Organizations (excluding company vehicles): **{len(org_out)}**",
        f"- Tracked roll calls: **{len(payload.get('votes') or [])}**",
        f"- Itemized / aggregated contribution rows: **{len(contribs)}**",
        f"- To officials: Axon ${axon:,.0f} · Flock ${flock:,.0f}",
        f"- To other organizations: ${sum(o['totals']['total'] for o in org_out):,.0f}",
        "",
        "## Files",
        "",
        "| File | What it is |",
        "| --- | --- |",
        "| `web/lib/accountability/surveillance-money.json` | Full dataset the page reads |",
        "| `web/public/data/accountability/surveillance-money.json` | Same file, stable public URL |",
        "| `web/public/data/accountability/officials.csv` | One row per official (includes office phone/site) |",
        "| `web/public/data/accountability/contacts.csv` | Office phone, site, social, and contact form |",
        "| `web/public/data/accountability/organizations.csv` | One row per committee / PAC / association |",
        "| `web/public/data/accountability/contributions.csv` | Flattened gifts (employees aggregated) |",
        "| `web/public/data/accountability/votes.csv` | Recipient × roll call |",
        "| `web/public/data/accountability/lobbying.csv` | Federal LDA yearly totals |",
        "",
        "A contribution next to a vote is timing only. It is not evidence of cause.",
        "",
    ]
    SUMMARY.write_text("\n".join(lines))
    log(f"wrote public exports in {PUBLIC_DIR.relative_to(ROOT)} and {SUMMARY.relative_to(ROOT)}")


def cmd_export(_args):
    if not OUT.exists():
        sys.exit(f"missing {OUT}; run build first")
    write_exports(json.loads(OUT.read_text()))


# News-reported items we could not confirm in a machine-readable filing. Shown separately.
REPORTED_ITEMS = [
    {"company": "flock", "jurisdiction": "CA",
     "summary": "Both campaigns told POLITICO they were returning Flock's $11,800 (primary + general maximum) contributions to Speaker Robert Rivas and Assemblymember Buffy Wicks, filed in March 2026. The filings still appear in Cal-Access.",
     "source": "POLITICO, March 13, 2026",
     "url": "https://www.politico.com/news/2026/03/13/legislators-reject-flocks-first-political-donations-in-california-00827556"},
    {"company": "axon", "jurisdiction": "AZ",
     "summary": "Axon CEO Patrick (Rick) Smith gave $5,500 directly to Rep. Alma Hernandez (Jan. 9, 2026) and $500 to House Majority Leader Michael Carbone; Axon President Josh Isner gave $5,400 to Gov. Katie Hobbs in late 2024. These direct gifts could not be exported from SeeTheMoney and are not counted in totals above.",
     "source": "KJZZ, April 21, 2026",
     "url": "https://www.kjzz.org/politics/2026-04-21/az-lawmakers-who-backed-controversial-axon-bill-received-campaign-cash-from-company-executives"},
]

STATIC_COVERAGE = [
    {"jurisdiction": "GA", "level": "state", "source": "Georgia Campaign Finance Commission", "status": "not_searched",
     "url": "https://efile.ethics.ga.gov/", "note": "Flock's home state. No public API; bulk CSV requires a manual download. Not yet included."},
    {"jurisdiction": "TX", "level": "local", "source": "City of Dallas open data", "status": "searched",
     "url": "https://www.dallasopendata.com/", "note": "The published file is report metadata, not itemized contributions."},
    {"jurisdiction": "CA", "level": "local", "source": "City of Oakland and City of San Francisco open data", "status": "blocked",
     "url": "https://data.sf.gov/", "note": "San Francisco SODA returned HTTP 403. Oakland catalog search returned no campaign-finance dataset."},
    {"jurisdiction": "IL", "level": "local", "source": "City of Chicago open data", "status": "searched",
     "url": "https://data.cityofchicago.org/", "note": "No campaign-contribution dataset with matching Axon/Flock rows. Illinois state filings are included."},
    {"jurisdiction": "MD", "level": "state", "source": "Maryland Campaign Reporting Information System", "status": "blocked",
     "url": "https://campaignfinance.maryland.gov/", "note": "Search returned HTTP 403 to automated requests."},
    {"jurisdiction": "MI", "level": "state", "source": "Michigan Bureau of Elections (NICTUSA dumps)", "status": "blocked",
     "url": "https://miboecfr.nictusa.com/cfr/dumpall/cfrdetail/", "note": "Bulk index is behind Cloudflare and was not downloaded."},
    {"jurisdiction": "VA", "level": "state", "source": "Virginia Department of Elections CSV archive", "status": "not_searched",
     "url": "https://www.elections.virginia.gov/", "note": "The former SBE_CSV path now redirects to the main elections site."},
    {"jurisdiction": "AL", "level": "state", "source": "Alabama FCPA", "status": "blocked",
     "url": "https://fcpa.alabamavotes.gov/PublicSite/DataDownload.aspx", "note": "Bulk download requires a signed-in account."},
    {"jurisdiction": "US", "level": "state", "source": "FollowTheMoney / OpenSecrets state data", "status": "blocked",
     "url": "https://www.followthemoney.org/", "note": "Site is behind a bot challenge and requires an API key. States not listed here were not searched."},
]


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    eb = sub.add_parser("extract-bulk")
    eb.add_argument("--only", help="comma-separated subset: IRS,TX,CO,IL,CA (others kept from the existing snapshot)")
    eb.set_defaults(fn=cmd_extract_bulk)
    sub.add_parser("build").set_defaults(fn=cmd_build)
    sub.add_parser("export").set_defaults(fn=cmd_export)
    args = ap.parse_args()
    args.fn(args)


if __name__ == "__main__":
    main()
