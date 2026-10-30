# Accountability (money in politics)

The public home page is [`/`](../web/app/page.tsx) (same view at [`/accountability`](../web/app/accountability/page.tsx)). It lists political contributions from **Axon** (formerly TASER) and **Flock Safety** to federal, state and local officials and organizations, plus recipients' votes on tracked bills and **office contact** (phone, website, contact form, social) joined from congress-legislators and the Choices `representatives_core` civics roster. The previous marketing page stays at [`/welcome`](../web/app/welcome/page.tsx).

## What viewers see

- Officials and candidates, with filters for name, state, level, company and money type
- Party committees, PACs, ballot committees and officeholder associations
- Roll-call votes (House Clerk, Voteview for the Senate, Arizona Legislature)
- Federal lobbying disclosed under the LDA
- News-reported items that are **not** counted in totals
- A coverage table of jurisdictions searched or skipped

Every dollar links to the filing it came from. A contribution next to a vote shows timing only; it is not evidence of cause.

## How the data is built

Generator: [`scripts/accountability/build_surveillance_money.py`](../scripts/accountability/build_surveillance_money.py).

```bash
# After downloading bulk files into /tmp/bulk (see the script header)
python3 scripts/accountability/build_surveillance_money.py extract-bulk
# Live sources (FEC, LDA, Socrata, Florida, AZ, roll calls) + the snapshot
python3 scripts/accountability/build_surveillance_money.py build
# Join office phone / site / social from congress-legislators + civics snapshot
python3 scripts/accountability/enrich_contacts.py
```

`build` writes [`web/lib/accountability/surveillance-money.json`](../web/lib/accountability/surveillance-money.json) and public copies under [`web/public/data/accountability/`](../web/public/data/accountability/) (JSON + CSVs). `python3 scripts/accountability/build_surveillance_money.py export` refreshes those public files from the existing JSON. The FEC key is read from `DATA_GOV_API_KEY` / `FEC_API_KEY` or the gitignored `.cursor/mcp-servers/.env`. Do not commit keys.

Viewers can open `/` or `/accountability`, or download `/data/accountability/officials.csv`, `contacts.csv`, `contributions.csv`, `votes.csv`, `lobbying.csv`, and `surveillance-money.json`. A one-page index is in [`scripts/accountability/snapshots/SUMMARY.md`](../scripts/accountability/snapshots/SUMMARY.md).

The same compiled record is also loaded into Supabase (`accountability_*` tables; public SELECT, service-role writes). After a rebuild:

```bash
# Replace the current snapshot, then:
python3 scripts/accountability/load_supabase.py rest
```

`rest` needs `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `web/.env.local`. Officials are joined to `representatives_core` by bioguide (prefer same-state federal rows) or exact name+state+level. The landing page still reads the JSON file.

Privacy: executives, company PAC, company treasury, company-funded committees and in-house lobbyists are named. Other employees are counted and totaled per recipient, not named.

## Coverage limits

Federal itemization starts at $200. Georgia (Flock HQ) has no public API and is not searched. Arizona direct executive-to-candidate gifts are news-reported only. Maryland blocked automated search. FollowTheMoney was not used. States not listed on the page were not searched.
