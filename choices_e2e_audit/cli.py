from __future__ import annotations
import argparse, os, sys
from pathlib import Path
from typing import Any, Dict, List
import yaml

from .report import summarize_playwright_json, write_junit_xml, write_markdown
from .supabase_utils import run_steps

def _default_config() -> Dict[str, Any]:
    return {
        "pre": [],
        "playwright": {
            "cmd": "npx playwright test --reporter=json",
            "cwd": "."
        },
        "artifacts_dir": "e2e-audit-artifacts",
        "post": []
    }

def main(argv: List[str] | None = None) -> None:
    p = argparse.ArgumentParser(description="Choices E2E Audit Orchestrator")
    p.add_argument("-c", "--config", help="Path to audit YAML", default="choices_audit.yml")
    args = p.parse_args(argv)

    cfg_path = Path(args.config)
    if cfg_path.exists():
        cfg = _default_config()
        loaded = yaml.safe_load(cfg_path.read_text()) or {}
        cfg.update(loaded)
    else:
        cfg = _default_config()

    artifacts = Path(cfg.get("artifacts_dir", "e2e-audit-artifacts"))
    artifacts.mkdir(parents=True, exist_ok=True)

    # 1) pre steps
    pre = cfg.get("pre") or []
    if pre:
        print("==> Running pre-steps…", flush=True)
        run_steps(pre)

    # 2) run Playwright
    pw = cfg.get("playwright", {})
    cmd = pw.get("cmd", "npx playwright test --reporter=json")
    cwd = Path(pw.get("cwd", "."))

    print(f"==> Running Playwright: {cmd} (cwd={cwd})", flush=True)
    json_report = artifacts / "playwright-report.json"

    # Force JSON to a known path if not already provided
    if "--reporter=" in cmd and "json=" in cmd:
        rc = os.system(f"cd {cwd} && {cmd}")
    else:
        rc = os.system(f"cd {cwd} && {cmd}={json_report}")

    if rc != 0:
        print("Playwright exited with non-zero status (tests may have failed). Continuing to aggregate.", flush=True)

    if not json_report.exists():
        default_json = Path(cwd) / "playwright-report.json"
        if default_json.exists():
            json_report = default_json
        else:
            print("ERROR: Could not find Playwright JSON report.", file=sys.stderr)
            sys.exit(2)

    summary = summarize_playwright_json(json_report)
    write_markdown(summary, artifacts / "SUMMARY.md")
    write_junit_xml(summary, artifacts / "junit.xml")

    print(f"==> Summary: {summary['passed']}/{summary['total']} passed, {summary['failed']} failed, {summary['skipped']} skipped.")
    print(f"Artifacts in: {artifacts}")

    post = cfg.get("post") or []
    if post:
        print("==> Running post-steps…", flush=True)
        run_steps(post)

    if summary["failed"] > 0:
        sys.exit(1)