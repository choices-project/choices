#!/usr/bin/env python3
"""Emit SQL that replaces the public accountability_* tables from the compiled JSON.

  python3 scripts/accountability/load_supabase.py > /tmp/accountability-load.sql

The landing page still reads the JSON. This load is for querying / joining in
Supabase. Apply via MCP execute_sql (batched) or a service-role client.
"""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
JSON_PATH = ROOT / "web/lib/accountability/surveillance-money.json"
ENV_PATH = ROOT / "web/.env.local"


def lit(value) -> str:
    if value is None or value == "":
        return "null"
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, int):
        return str(value)
    if isinstance(value, float):
        return f"{value:.2f}"
    if isinstance(value, list):
        if not value:
            return "'{}'::text[]"
        inner = ",".join(lit(str(item)) for item in value)
        return f"array[{inner}]::text[]"
    text = str(value).replace("'", "''")
    return f"'{text}'"


def date_lit(value) -> str:
    if not value:
        return "null"
    return f"{lit(str(value)[:10])}::date"


def ts_lit(value) -> str:
    if not value:
        return "null"
    return f"{lit(value)}::timestamptz"


def contact(official: dict) -> dict:
    return official.get("contact") or {}


def totals(row: dict) -> tuple:
    t = row.get("totals") or {}
    return (
        float(t.get("axon") or 0),
        float(t.get("flock") or 0),
        float(t.get("total") or 0),
    )


def contrib_row(snapshot_expr: str, recipient_col: str, recipient_id: str, c: dict) -> str:
    return (
        f"({snapshot_expr},{lit(recipient_id) if recipient_col == 'official_id' else 'null'},"
        f"{lit(recipient_id) if recipient_col == 'organization_id' else 'null'},"
        f"{lit(c.get('company'))},{lit(c.get('channel'))},{lit(c.get('source'))},"
        f"{lit(float(c.get('amount') or 0))},{date_lit(c.get('date'))},"
        f"{date_lit(c.get('dateFrom'))},{date_lit(c.get('dateTo'))},"
        f"{lit(c.get('donor'))},{lit(c.get('donorRole'))},{lit(c.get('via'))},"
        f"{lit(c.get('url'))},{lit(c.get('donorCount'))},{lit(c.get('contributionCount'))})"
    )


def emit_insert(table: str, columns: str, rows: list[str], batch: int = 80) -> None:
    if not rows:
        return
    for i in range(0, len(rows), batch):
        chunk = rows[i : i + batch]
        print(f"insert into public.{table} ({columns}) values")
        print(",\n".join(f"  {row}" for row in chunk) + ";")
        print()


def main() -> int:
    data = json.loads(JSON_PATH.read_text())
    officials = data.get("officials") or []
    organizations = data.get("organizations") or []
    roll_calls = data.get("votes") or []
    lobbying = data.get("lobbying") or []
    coverage = data.get("coverage") or []
    reported = data.get("reported") or []
    companies = data.get("companies") or []
    contrib_count = sum(len(o.get("contributions") or []) for o in officials)
    contrib_count += sum(len(o.get("contributions") or []) for o in organizations)

    print("begin;")
    print()
    print(
        "truncate table"
        "  public.accountability_official_votes,"
        "  public.accountability_contributions,"
        "  public.accountability_lobbying,"
        "  public.accountability_coverage,"
        "  public.accountability_reported,"
        "  public.accountability_roll_calls,"
        "  public.accountability_officials,"
        "  public.accountability_organizations,"
        "  public.accountability_companies,"
        "  public.accountability_snapshots"
        " restart identity cascade;"
    )
    print()
    print(
        "insert into public.accountability_snapshots"
        " (generated_at, source, is_current, official_count, organization_count, contribution_count)"
        f" values ({ts_lit(data.get('generatedAt'))}, 'surveillance-money.json', true,"
        f" {len(officials)}, {len(organizations)}, {contrib_count});"
    )
    print()

    snap = "(select id from public.accountability_snapshots where is_current limit 1)"

    company_rows = []
    for c in companies:
        pac = c.get("pac") or {}
        company_rows.append(
            f"({lit(c.get('id'))},{snap},{lit(c.get('name'))},{lit(c.get('formerly'))},"
            f"{lit(c.get('hq'))},{lit(c.get('products'))},"
            f"{lit(pac.get('name'))},{lit(pac.get('fecId'))})"
        )
    emit_insert(
        "accountability_companies",
        "id, snapshot_id, name, formerly, hq, products, pac_name, pac_fec_id",
        company_rows,
    )

    official_rows = []
    for o in officials:
        axon, flock, total = totals(o)
        ct = contact(o)
        official_rows.append(
            f"({lit(o.get('id'))},{snap},{lit(o.get('name'))},{lit(o.get('office'))},"
            f"{lit(o.get('state'))},{lit(o.get('level'))},{lit(o.get('party'))},"
            f"{lit(o.get('current'))},{lit(o.get('bioguide'))},{lit(o.get('fecIds') or [])},"
            f"{lit(axon)},{lit(flock)},{lit(total)},"
            f"{lit(ct.get('phone'))},{lit(ct.get('website'))},{lit(ct.get('contactForm'))},"
            f"{lit(ct.get('address'))},{lit(ct.get('twitter'))},{lit(ct.get('facebook'))},"
            f"{lit(ct.get('instagram'))},{lit(ct.get('ballotpedia'))})"
        )
    emit_insert(
        "accountability_officials",
        "id, snapshot_id, name, office, state, level, party, is_current, bioguide, fec_ids,"
        " total_axon, total_flock, total_received, phone, website, contact_form, address,"
        " twitter, facebook, instagram, ballotpedia",
        official_rows,
    )

    org_rows = []
    for o in organizations:
        axon, flock, total = totals(o)
        org_rows.append(
            f"({lit(o.get('id'))},{snap},{lit(o.get('name'))},{lit(o.get('kind'))},"
            f"{lit(o.get('level'))},{lit(o.get('state'))},{lit(o.get('note'))},"
            f"{lit(axon)},{lit(flock)},{lit(total)})"
        )
    emit_insert(
        "accountability_organizations",
        "id, snapshot_id, name, kind, level, state, note, total_axon, total_flock, total_received",
        org_rows,
    )

    vote_rows = []
    for v in roll_calls:
        tally = v.get("tally") or {}
        vote_rows.append(
            f"({lit(v.get('id'))},{snap},{lit(v.get('jurisdiction'))},{lit(v.get('chamber'))},"
            f"{date_lit(v.get('date'))},{lit(v.get('bill'))},{lit(v.get('title'))},"
            f"{lit(v.get('question'))},{lit(v.get('result'))},{lit(v.get('topic'))},"
            f"{lit(tally.get('yes') or 0)},{lit(tally.get('no') or 0)},{lit(tally.get('other') or 0)},"
            f"{lit(v.get('lobbiedBy') or [])},{lit(v.get('url'))})"
        )
    emit_insert(
        "accountability_roll_calls",
        "id, snapshot_id, jurisdiction, chamber, vote_date, bill, title, question, result,"
        " topic, tally_yes, tally_no, tally_other, lobbied_by, source_url",
        vote_rows,
    )

    contrib_rows = []
    for o in officials:
        for c in o.get("contributions") or []:
            contrib_rows.append(contrib_row(snap, "official_id", o["id"], c))
    for o in organizations:
        for c in o.get("contributions") or []:
            contrib_rows.append(contrib_row(snap, "organization_id", o["id"], c))
    emit_insert(
        "accountability_contributions",
        "snapshot_id, official_id, organization_id, company, channel, source, amount,"
        " contributed_on, date_from, date_to, donor, donor_role, via, source_url,"
        " donor_count, contribution_count",
        contrib_rows,
    )

    position_rows = []
    for o in officials:
        for roll_id, position in (o.get("votes") or {}).items():
            position_rows.append(f"({lit(o['id'])},{lit(roll_id)},{lit(position)})")
    emit_insert(
        "accountability_official_votes",
        "official_id, roll_call_id, position",
        position_rows,
    )

    lobby_rows = []
    for row in lobbying:
        lobby_rows.append(
            f"({snap},{lit(row.get('company'))},{lit(row.get('year'))},"
            f"{lit(row.get('filings') or 0)},{lit(float(row.get('reportedAmount') or 0))},"
            f"{lit(row.get('registrants') or [])},{lit(row.get('topIssues') or [])},"
            f"{lit(row.get('bills') or [])},{lit(row.get('url'))})"
        )
    emit_insert(
        "accountability_lobbying",
        "snapshot_id, company, year, filings, reported_amount, registrants, top_issues, bills, source_url",
        lobby_rows,
    )

    coverage_rows = []
    for row in coverage:
        coverage_rows.append(
            f"({snap},{lit(row.get('jurisdiction'))},{lit(row.get('level'))},"
            f"{lit(row.get('source'))},{lit(row.get('url'))},{lit(row.get('status'))},"
            f"{lit(row.get('note'))})"
        )
    emit_insert(
        "accountability_coverage",
        "snapshot_id, jurisdiction, level, source, source_url, status, note",
        coverage_rows,
    )

    reported_rows = []
    for row in reported:
        reported_rows.append(
            f"({snap},{lit(row.get('company'))},{lit(row.get('jurisdiction'))},"
            f"{lit(row.get('summary'))},{lit(row.get('source'))},{lit(row.get('url'))})"
        )
    emit_insert(
        "accountability_reported",
        "snapshot_id, company, jurisdiction, summary, source, source_url",
        reported_rows,
    )

    print(
        """
-- Prefer the federal same-state civics row; skip OC duplicates when a state row exists.
update public.accountability_officials o
set representative_id = matched.id
from (
  select distinct on (a.id)
    a.id as official_id,
    r.id
  from public.accountability_officials a
  join public.representatives_core r
    on a.bioguide is not null
   and r.bioguide_id = a.bioguide
  order by
    a.id,
    case when a.state is not null and r.state = a.state then 0 else 1 end,
    case when r.level = 'federal' then 0 else 1 end,
    case when r.status = 'active' then 0 else 1 end,
    r.id
) matched
where o.id = matched.official_id
  and o.representative_id is null;

update public.accountability_officials o
set representative_id = matched.id
from (
  select distinct on (a.id)
    a.id as official_id,
    r.id
  from public.accountability_officials a
  join public.representatives_core r
    on a.bioguide is null
   and a.state is not null
   and r.state = a.state
   and r.level = a.level
   and lower(r.name) = lower(a.name)
  order by
    a.id,
    case when r.status = 'active' then 0 else 1 end,
    r.id
) matched
where o.id = matched.official_id
  and o.representative_id is null;

analyze public.accountability_snapshots;
analyze public.accountability_officials;
analyze public.accountability_organizations;
analyze public.accountability_contributions;
analyze public.accountability_official_votes;
"""
    )
    print("commit;")
    return 0


def _env() -> dict[str, str]:
    values: dict[str, str] = {}
    if ENV_PATH.exists():
        for line in ENV_PATH.read_text().splitlines():
            if not line or line.lstrip().startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            values[key.strip()] = value.strip().strip("'").strip('"')
    values.update({key: os.environ[key] for key in os.environ})
    return values


def _date(value):
    return str(value)[:10] if value else None


def rest_rows(data: dict) -> dict[str, list[dict]]:
    officials = data.get("officials") or []
    organizations = data.get("organizations") or []
    snapshot_id = 1
    companies = []
    for c in data.get("companies") or []:
        pac = c.get("pac") or {}
        companies.append(
            {
                "id": c.get("id"),
                "snapshot_id": snapshot_id,
                "name": c.get("name"),
                "formerly": c.get("formerly"),
                "hq": c.get("hq"),
                "products": c.get("products"),
                "pac_name": pac.get("name"),
                "pac_fec_id": pac.get("fecId"),
            }
        )
    official_rows = []
    contribs = []
    votes = []
    for o in officials:
        axon, flock, total = totals(o)
        ct = contact(o)
        official_rows.append(
            {
                "id": o.get("id"),
                "snapshot_id": snapshot_id,
                "name": o.get("name"),
                "office": o.get("office"),
                "state": o.get("state"),
                "level": o.get("level"),
                "party": o.get("party"),
                "is_current": o.get("current"),
                "bioguide": o.get("bioguide"),
                "fec_ids": o.get("fecIds") or [],
                "total_axon": axon,
                "total_flock": flock,
                "total_received": total,
                "phone": ct.get("phone"),
                "website": ct.get("website"),
                "contact_form": ct.get("contactForm"),
                "address": ct.get("address"),
                "twitter": ct.get("twitter"),
                "facebook": ct.get("facebook"),
                "instagram": ct.get("instagram"),
                "ballotpedia": ct.get("ballotpedia"),
            }
        )
        for c in o.get("contributions") or []:
            contribs.append(_contrib_obj(snapshot_id, "official_id", o["id"], c))
        for roll_id, position in (o.get("votes") or {}).items():
            votes.append(
                {"official_id": o["id"], "roll_call_id": roll_id, "position": position}
            )
    org_rows = []
    for o in organizations:
        axon, flock, total = totals(o)
        org_rows.append(
            {
                "id": o.get("id"),
                "snapshot_id": snapshot_id,
                "name": o.get("name"),
                "kind": o.get("kind"),
                "level": o.get("level"),
                "state": o.get("state"),
                "note": o.get("note"),
                "total_axon": axon,
                "total_flock": flock,
                "total_received": total,
            }
        )
        for c in o.get("contributions") or []:
            contribs.append(_contrib_obj(snapshot_id, "organization_id", o["id"], c))
    roll_rows = []
    for v in data.get("votes") or []:
        tally = v.get("tally") or {}
        roll_rows.append(
            {
                "id": v.get("id"),
                "snapshot_id": snapshot_id,
                "jurisdiction": v.get("jurisdiction"),
                "chamber": v.get("chamber"),
                "vote_date": _date(v.get("date")),
                "bill": v.get("bill"),
                "title": v.get("title"),
                "question": v.get("question"),
                "result": v.get("result"),
                "topic": v.get("topic"),
                "tally_yes": tally.get("yes") or 0,
                "tally_no": tally.get("no") or 0,
                "tally_other": tally.get("other") or 0,
                "lobbied_by": v.get("lobbiedBy") or [],
                "source_url": v.get("url"),
            }
        )
    lobby_rows = []
    for row in data.get("lobbying") or []:
        lobby_rows.append(
            {
                "snapshot_id": snapshot_id,
                "company": row.get("company"),
                "year": row.get("year"),
                "filings": row.get("filings") or 0,
                "reported_amount": float(row.get("reportedAmount") or 0),
                "registrants": row.get("registrants") or [],
                "top_issues": row.get("topIssues") or [],
                "bills": row.get("bills") or [],
                "source_url": row.get("url"),
            }
        )
    coverage_rows = [
        {
            "snapshot_id": snapshot_id,
            "jurisdiction": row.get("jurisdiction"),
            "level": row.get("level"),
            "source": row.get("source"),
            "source_url": row.get("url"),
            "status": row.get("status"),
            "note": row.get("note"),
        }
        for row in data.get("coverage") or []
    ]
    reported_rows = [
        {
            "snapshot_id": snapshot_id,
            "company": row.get("company"),
            "jurisdiction": row.get("jurisdiction"),
            "summary": row.get("summary"),
            "source": row.get("source"),
            "source_url": row.get("url"),
        }
        for row in data.get("reported") or []
    ]
    return {
        "accountability_companies": companies,
        "accountability_officials": official_rows,
        "accountability_organizations": org_rows,
        "accountability_roll_calls": roll_rows,
        "accountability_contributions": contribs,
        "accountability_official_votes": votes,
        "accountability_lobbying": lobby_rows,
        "accountability_coverage": coverage_rows,
        "accountability_reported": reported_rows,
    }


def _contrib_obj(snapshot_id: int, recipient_col: str, recipient_id: str, c: dict) -> dict:
    return {
        "snapshot_id": snapshot_id,
        "official_id": recipient_id if recipient_col == "official_id" else None,
        "organization_id": recipient_id if recipient_col == "organization_id" else None,
        "company": c.get("company"),
        "channel": c.get("channel"),
        "source": c.get("source"),
        "amount": float(c.get("amount") or 0),
        "contributed_on": _date(c.get("date")),
        "date_from": _date(c.get("dateFrom")),
        "date_to": _date(c.get("dateTo")),
        "donor": c.get("donor"),
        "donor_role": c.get("donorRole"),
        "via": c.get("via"),
        "source_url": c.get("url"),
        "donor_count": c.get("donorCount"),
        "contribution_count": c.get("contributionCount"),
    }


def rest_post(base_url: str, key: str, table: str, rows: list[dict], batch: int = 80) -> int:
    posted = 0
    for i in range(0, len(rows), batch):
        chunk = rows[i : i + batch]
        req = urllib.request.Request(
            f"{base_url}/rest/v1/{table}",
            data=json.dumps(chunk).encode(),
            method="POST",
            headers={
                "apikey": key,
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json",
                "Prefer": "return=minimal",
            },
        )
        try:
            with urllib.request.urlopen(req) as resp:
                if resp.status not in (200, 201, 204):
                    raise SystemExit(f"{table} batch {i} failed: HTTP {resp.status}")
        except urllib.error.HTTPError as exc:
            body = exc.read().decode("utf-8", "replace")[:800]
            raise SystemExit(f"{table} batch {i} failed: HTTP {exc.code} {body}") from exc
        posted += len(chunk)
    return posted


def load_rest() -> int:
    env = _env()
    base = (env.get("NEXT_PUBLIC_SUPABASE_URL") or "").rstrip("/")
    key = env.get("SUPABASE_SERVICE_ROLE_KEY") or ""
    if not base or not key:
        raise SystemExit("Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
    data = json.loads(JSON_PATH.read_text())
    print("Loading compiled JSON into existing accountability_snapshots row id=1", file=sys.stderr)
    tables = rest_rows(data)
    order = [
        "accountability_companies",
        "accountability_officials",
        "accountability_organizations",
        "accountability_roll_calls",
        "accountability_contributions",
        "accountability_official_votes",
        "accountability_lobbying",
        "accountability_coverage",
        "accountability_reported",
    ]
    for table in order:
        count = rest_post(base, key, table, tables[table])
        print(f"{table} {count}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "rest":
        sys.exit(load_rest())
    sys.exit(main())

