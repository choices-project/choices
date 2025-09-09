# Contributing
*Last Updated: 2025-09-09*

## Security- and Privacy-Sensitive Changes
- Discuss protocol/crypto changes via proposals in `specs/` and ADRs.
- Do not submit PII or real secrets in issues or PRs.

## Neutrality Safeguards
- Poll selection requires two independent proposers + public comment period.
- All tally code must be reproducible; publish method & hash in releases.
- Add CHAOSS community-health metrics dashboards to `/ops/dashboards/`.

## Dev Setup
- Go 1.22+, Node 20+.
- `make dev` (coming soon) spins up IA, PO, and web locally.
