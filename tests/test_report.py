from pathlib import Path
from choices_e2e_audit.report import summarize_playwright_json

def test_summarize_playwright_json(tmp_path: Path):
    data = {
        "suites": [{
            "title": "chromium",
            "specs": [{
                "title": "Spec A",
                "titlePath": ["e2e", "Spec A"],
                "tests": [{"results":[{"status":"passed", "duration": 1200}]}]
            },{
                "title": "Spec B",
                "titlePath": ["e2e", "Spec B"],
                "tests": [{"results":[{"status":"failed", "duration": 500, "attachments":[{"name":"error","body":"boom"}]}]}]
            }]
        }]
    }
    p = tmp_path / "r.json"
    p.write_text(__import__("json").dumps(data))
    s = summarize_playwright_json(p)
    assert s["total"] == 2
    assert s["passed"] == 1
    assert s["failed"] == 1
    assert s["failures"][0]["error"] == "boom"