# choices-e2e-audit

A small Python CLI to orchestrate your **end-to-end audit**:
- Runs optional **pre** steps (e.g., DB reset/seed),
- Runs **Playwright** with a JSON reporter,
- Aggregates into **JUnit XML** and a **Markdown summary**,
- Exits non‑zero when failures occur (use in CI).

## Install
```bash
pip install -e .
```

## Usage
```bash
choices-audit -c choices_audit.yml
```

Artifacts in `e2e-audit-artifacts/`:
- `playwright-report.json`
- `junit.xml`
- `SUMMARY.md`

## Example `choices_audit.yml`
```yaml
pre:
  - echo "Reset DB here (optional)"
  # - npm run db:reset:test
playwright:
  cmd: "npx playwright test --project=chromium --reporter=json=/tmp/pw.json"
  cwd: "./web"
artifacts_dir: "e2e-audit-artifacts"
post:
  - echo "After steps"
```

## Run unit tests
```bash
pytest
```