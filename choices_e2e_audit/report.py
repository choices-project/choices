from __future__ import annotations
import json, datetime
from pathlib import Path
from typing import Dict, Any, List
import xml.etree.ElementTree as ET

def summarize_playwright_json(json_report_path: Path) -> Dict[str, Any]:
    """Reads Playwright JSON report and returns a summary dict."""
    data = json.loads(Path(json_report_path).read_text())
    total = passed = failed = skipped = 0
    specs = []
    failures = []

    def walk_suites(suites):
        nonlocal total, passed, failed, skipped, specs, failures
        if not suites:
            return
        for s in suites:
            for spec in s.get("specs", []):
                spec_title = " ".join(spec.get("titlePath", spec.get("title", "").split()))
                for t in spec.get("tests", []):
                    for r in t.get("results", []):
                        status = r.get("status")
                        duration_ms = r.get("duration", 0)
                        total += 1
                        if status == "passed":
                            passed += 1
                        elif status == "failed":
                            failed += 1
                            err = None
                            for a in r.get("attachments", []):
                                if a.get("name") == "error" and a.get("body"):
                                    err = a.get("body")
                                    break
                            failures.append({
                                "title": spec_title or spec.get("title",""),
                                "duration_ms": duration_ms,
                                "error": err,
                            })
                        elif status in ("skipped", "timedOut", "interrupted"):
                            skipped += 1
                        specs.append({
                            "title": spec_title or spec.get("title",""),
                            "duration_ms": duration_ms,
                            "status": status or "unknown",
                        })
            walk_suites(s.get("suites", []))

    walk_suites(data.get("suites", []))
    return {
        "total": total,
        "passed": passed,
        "failed": failed,
        "skipped": skipped,
        "specs": specs,
        "failures": failures,
    }

def write_junit_xml(summary: Dict[str, Any], dest: Path) -> None:
    ts = ET.Element("testsuite", {
        "name": "choices-e2e",
        "tests": str(summary["total"]),
        "failures": str(summary["failed"]),
        "skipped": str(summary["skipped"]),
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
    })
    for spec in summary["specs"]:
        tc = ET.SubElement(ts, "testcase", {
            "name": spec["title"],
            "time": f"{spec['duration_ms']/1000:.3f}",
        })
        if spec["status"] == "failed":
            msg = "Test failed"
            for f in summary["failures"]:
                if f["title"] == spec["title"]:
                    msg = f.get("error") or msg
                    break
            ET.SubElement(tc, "failure", {"message": msg}).text = msg
        elif spec["status"] == "skipped":
            ET.SubElement(tc, "skipped")
    dest.write_text(ET.tostring(ts, encoding="unicode"))

def write_markdown(summary: Dict[str, Any], dest: Path) -> None:
    lines = []
    lines.append("# E2E Audit Summary\n")
    lines.append(f"- **Total:** {summary['total']}  \n- **Passed:** {summary['passed']}  \n- **Failed:** {summary['failed']}  \n- **Skipped:** {summary['skipped']}\n")
    if summary["failures"]:
        lines.append("## Failures\n")
        for f in summary["failures"]:
            lines.append(f"- **{f['title']}** ({f['duration_ms']} ms)\n")
            if f.get("error"):
                lines.append(f"  - Error: `{f['error']}`\n")
    Path(dest).write_text("\n".join(lines))