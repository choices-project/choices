# Claude Development Setup Guide

**Created at:** 2024-12-19  
**Updated at:** 2024-12-19

## Overview

This guide provides a comprehensive approach to setting up Claude for development work, including environment export tools, branch isolation strategies, and personalization templates.

## Quick Setup Checklist

### What to Export
- [ ] Claude memory (manual export via UI)
- [ ] Project-level guidance files (e.g., CLAUDE.md)
- [ ] Git config, branches, worktrees mapping, and hooks
- [ ] (Optional) GitButler state if present
- [ ] Editor/IDE settings (VS Code settings + extensions)
- [ ] Tooling versions (git, node, npm/pnpm/yarn/bun, python, claude cli, gitbutler, etc.)

## Settings Exporter Tool

### Installation & Usage

Create the following directory structure:

```
settings_exporter/
  exporter.py
  cli.py
tests/
  test_exporter.py
```

### Core Implementation

#### `settings_exporter/exporter.py`

```python
# SPDX-License-Identifier: MIT
# settings_exporter/exporter.py
from __future__ import annotations
import json, os, platform, shutil, subprocess, sys, tempfile, time, zipfile
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Optional, Tuple

# ---------- Utilities ----------

def which(cmd: str) -> Optional[str]:
    return shutil.which(cmd)

def run(cmd: List[str], cwd: Optional[Path] = None, timeout: int = 15) -> Tuple[int, str, str]:
    try:
        proc = subprocess.run(
            cmd, cwd=str(cwd) if cwd else None,
            stdout=subprocess.PIPE, stderr=subprocess.PIPE,
            text=True, timeout=timeout
        )
        return proc.returncode, proc.stdout.strip(), proc.stderr.strip()
    except Exception as e:
        return 1, "", f"{type(e).__name__}: {e}"

def read_text_file(p: Path, max_bytes: int = 2_000_000) -> Optional[str]:
    try:
        if p.exists() and p.is_file() and p.stat().st_size <= max_bytes:
            return p.read_text(encoding="utf-8", errors="replace")
    except Exception:
        pass
    return None

def find_first_existing(paths: List[Path]) -> List[Path]:
    return [p for p in paths if p.exists()]

# ---------- Data model ----------

@dataclass
class CollectedFile:
    source: Path
    dest_rel: Path  # path inside zip

@dataclass
class CollectorResult:
    meta: Dict
    files: List[CollectedFile] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)

# ---------- Collectors ----------

class SystemCollector:
    def collect(self) -> CollectorResult:
        env_keys = ["SHELL", "TERM", "HOME", "HOMEPATH", "HOMEDRIVE", "APPDATA", "LOCALAPPDATA", "USERPROFILE", "PATH"]
        env = {k: os.environ.get(k, "") for k in env_keys}
        return CollectorResult(meta={
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "platform": platform.platform(),
            "python": sys.version.split()[0],
            "env_subset": env,
        })

class ToolsCollector:
    CMDS = [
        "git", "git-lfs", "gh",
        "node", "npm", "pnpm", "yarn", "bun",
        "python3", "pyenv",
        "claude", "gitbutler", "brew"
    ]
    def collect(self) -> CollectorResult:
        meta = {}
        for c in self.CMDS:
            exe = which(c)
            if not exe:
                meta[c] = {"present": False}
                continue
            code, out, err = run([c, "--version"])
            if code != 0 and c == "python3":
                # try "python --version"
                code, out, err = run(["python", "--version"])
            meta[c] = {"present": True, "path": exe, "version_output": out or err}
        return CollectorResult(meta=meta)

class VSCodeCollector:
    def collect(self) -> CollectorResult:
        files = []
        warnings = []
        meta = {"settings_path": None, "extensions_listed": False, "extensions": []}

        # settings.json common locations
        home = Path.home()
        candidates = []
        if sys.platform == "darwin":
            candidates.append(home / "Library/Application Support/Code/User/settings.json")
        elif sys.platform.startswith("win"):
            appdata = os.environ.get("APPDATA", "")
            if appdata:
                candidates.append(Path(appdata) / "Code/User/settings.json")
        else:
            candidates.append(home / ".config/Code/User/settings.json")

        existing = find_first_existing(candidates)
        if existing:
            meta["settings_path"] = str(existing[0])
            files.append(CollectedFile(existing[0], Path("vscode/settings.json")))
        else:
            warnings.append("VS Code settings.json not found.")

        # VS Code extensions via CLI
        code_exe = which("code")
        if code_exe:
            code, out, err = run([code_exe, "--list-extensions"])
            if code == 0:
                meta["extensions_listed"] = True
                meta["extensions"] = out.splitlines()
            else:
                warnings.append(f"Failed to list VS Code extensions: {err or 'unknown error'}")
        else:
            warnings.append("VS Code CLI 'code' not found in PATH—cannot list extensions.")

        return CollectorResult(meta=meta, files=files, warnings=warnings)

class GitCollector:
    def __init__(self, repo: Optional[Path]):
        self.repo = repo

    def collect(self) -> CollectorResult:
        meta = {"global_config": "", "repo": None}
        files = []
        warnings = []

        # Global git config
        git = which("git")
        if git:
            code, out, err = run([git, "config", "--global", "--list"])
            if code == 0:
                meta["global_config"] = out
            else:
                warnings.append(f"git global config failed: {err or 'unknown error'}")
        else:
            warnings.append("git not found")

        # Per-repo details
        if self.repo and (self.repo / ".git").exists():
            meta["repo"] = {"path": str(self.repo)}
            # local config
            local_cfg = self.repo / ".git" / "config"
            if local_cfg.exists():
                files.append(CollectedFile(local_cfg, Path("git/local-config.txt")))
            # worktrees
            if git:
                code, out, err = run([git, "worktree", "list"], cwd=self.repo)
                meta["repo"]["worktrees"] = out if code == 0 else f"(error) {err}"
                # branches
                code, out, err = run([git, "branch", "--all", "--verbose", "--no-abbrev"], cwd=self.repo)
                meta["repo"]["branches"] = out if code == 0 else f"(error) {err}"
            # hooks
            hooks_dir = self.repo / ".git" / "hooks"
            if hooks_dir.exists():
                for p in hooks_dir.iterdir():
                    if p.is_file():
                        files.append(CollectedFile(p, Path("git/hooks") / p.name))
        else:
            warnings.append("No valid repo provided or .git missing; repo-level details skipped.")

        return CollectorResult(meta=meta, files=files, warnings=warnings)

class ClaudeCollector:
    """
    Note: Claude memory is user-exported from the UI; we create a placeholder file
    that the user can paste into, so it's captured in the zip.
    We also try to capture app-level config directories if present.
    """
    def collect(self) -> CollectorResult:
        files = []
        warnings = []
        meta = {"memory_placeholder": "paste into claude_memory/claude_memory.txt", "found_config_paths": []}

        home = Path.home()
        candidates = []
        # Common guesses (gracefully optional)
        if sys.platform == "darwin":
            candidates += [
                home / "Library/Application Support/Claude",
                home / "Library/Application Support/Claude Code",
            ]
        elif sys.platform.startswith("win"):
            appdata = os.environ.get("APPDATA", "")
            if appdata:
                candidates += [Path(appdata) / "Claude", Path(appdata) / "Claude Code"]
        else:
            candidates += [home / ".config/claude", home / ".config/claude-code"]

        for p in candidates:
            if p.exists():
                meta["found_config_paths"].append(str(p))
                # We don't blindly ingest recursively to avoid huge zips;
                # just record path, and include small known files if they exist.
                # (Adjust here if you want to add specific filenames.)
        # Create a placeholder memory file
        tmpdir = Path(tempfile.mkdtemp(prefix="claude_mem_"))
        memory_file = tmpdir / "claude_memory.txt"
        memory_file.write_text(
            "Paste your Claude memory export here.\n"
            "How to get it: Settings → Features → View and edit memory → Copy.\n", encoding="utf-8"
        )
        files.append(CollectedFile(memory_file, Path("claude_memory/claude_memory.txt")))
        return CollectorResult(meta=meta, files=files, warnings=warnings)

# ---------- Orchestrator ----------

class SettingsExporter:
    def __init__(self, repo: Optional[Path] = None):
        self.repo = repo if repo else None
        if self.repo:
            self.repo = self.repo.resolve()

    def run(self) -> Dict:
        sections: List[Tuple[str, CollectorResult]] = []
        sections.append(("system", SystemCollector().collect()))
        sections.append(("tools", ToolsCollector().collect()))
        sections.append(("vscode", VSCodeCollector().collect()))
        sections.append(("git", GitCollector(self.repo).collect()))
        sections.append(("claude", ClaudeCollector().collect()))

        report = {"sections": {}, "warnings": []}
        collected_files: List[CollectedFile] = []

        for name, res in sections:
            report["sections"][name] = res.meta
            report["warnings"].extend(res.warnings)
            collected_files.extend(res.files)

        return report, collected_files

def write_zip(report: Dict, files: List[CollectedFile], out_zip: Path) -> Path:
    out_zip = out_zip.resolve()
    out_zip.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(out_zip, "w", compression=zipfile.ZIP_DEFLATED) as z:
        # report.json
        z.writestr("report.json", json.dumps(report, indent=2))
        # files
        for f in files:
            try:
                z.write(str(f.source), arcname=str(f.dest_rel))
            except Exception:
                # ignore missing/locked files
                pass
        # README
        z.writestr("README.txt",
                   "This bundle contains:\n"
                   "- report.json: summarized metadata\n"
                   "- claude_memory/claude_memory.txt: paste your Claude memory export here\n"
                   "- git/*: local git details if provided\n"
                   "- vscode/*: VS Code settings if found\n")
    return out_zip
```

#### `settings_exporter/cli.py`

```python
# SPDX-License-Identifier: MIT
# settings_exporter/cli.py
import argparse
from pathlib import Path
from .exporter import SettingsExporter, write_zip

def main():
    ap = argparse.ArgumentParser(description="Export Claude/dev settings into a zip for review.")
    ap.add_argument("--repo", type=Path, default=None, help="Optional path to a git repository")
    ap.add_argument("--out", type=Path, required=True, help="Output zip path (e.g., ./export_bundle.zip)")
    args = ap.parse_args()

    exporter = SettingsExporter(repo=args.repo)
    report, files = exporter.run()
    outp = write_zip(report, files, args.out)
    print(f"Done. Bundle written to: {outp}")
    print("IMPORTANT: Open 'claude_memory/claude_memory.txt' inside the zip and paste your Claude memory export.")
    print("Then share the zip with me to review and personalize your setup.")

if __name__ == "__main__":
    main()
```

#### `tests/test_exporter.py`

```python
# SPDX-License-Identifier: MIT
# tests/test_exporter.py
from pathlib import Path
import json, zipfile, tempfile, os
from settings_exporter.exporter import SettingsExporter, write_zip

def test_exporter_minimal(tmp_path: Path):
    # No repo, minimal env
    exp = SettingsExporter(repo=None)
    report, files = exp.run()
    assert "sections" in report and "system" in report["sections"]
    # write zip
    out_zip = tmp_path / "bundle.zip"
    write_zip(report, files, out_zip)
    assert out_zip.exists()
    with zipfile.ZipFile(out_zip, "r") as z:
        names = z.namelist()
        assert "report.json" in names
        assert "claude_memory/claude_memory.txt" in names
        data = json.loads(z.read("report.json"))
        assert "tools" in data["sections"]

def test_repo_absent_is_graceful(tmp_path: Path):
    repo = tmp_path / "not_a_repo"
    repo.mkdir()
    exp = SettingsExporter(repo=repo)
    report, _ = exp.run()
    assert "git" in report["sections"]
    # Should warn rather than crash
    assert any("repo-level" in w or ".git missing" in w for w in report.get("warnings", []))
```

### Usage

```bash
python -m settings_exporter.cli --repo /path/to/your/repo --out export_bundle.zip
# (repo is optional; you can run it anywhere)
```

## Branch Isolation Strategies

### A) Git Worktrees (Simple, Local, Robust)

Create a helper function for isolated branch sessions:

```bash
# create a worktree and launch Claude there
cc-branch () {
  # usage: cc-branch feature/my-task
  local BR="$1"
  if [ -z "$BR" ]; then echo "usage: cc-branch <branch-name>"; return 1; fi
  git fetch origin
  git worktree add "../wt-${BR##*/}" "$BR" || git worktree add -b "$BR" "../wt-${BR##*/}" origin/main
  cd "../wt-${BR##*/}" || return 1
  claude
}
```

### B) GitButler + Claude Code Hooks (Automated)

If using GitButler:
1. Install GitButler and enable Claude Code hooks
2. Each session automatically routes to its own branch
3. Review/merge in GitButler or CLI/GitHub

### C) Manual Branching (Most Control)

```bash
git checkout -b feature/xyz
claude   # do the work in-place
# commit as you go; when done:
git push -u origin feature/xyz
```

## Claude Personalization

### CLAUDE.md Template

Create this file at your repo root:

```markdown
# CLAUDE.md — Project Guardrails

## Persona & Style
- Act as a senior Python + full-stack mentor.
- Prefer small, composable modules with docstrings and tests (pytest).
- Enforce: type hints, clear separation of concerns, predictable side effects.

## Branch & Session Policy
- One Claude session ↔ one branch (via worktree or GitButler hooks).
- Never commit directly to `main`; open a PR with a short CHANGELOG snippet.

## Code Standards
- Python: ruff/black/mypy; 95%+ test coverage for new code; AAA unit tests.
- JS/TS: eslint + prettier; vitest/jest; keep functions < 40 LOC.
- Commit messages: Conventional Commits (`feat:`, `fix:`, `chore:`...).

## Task Rubric
Before coding, output: problem summary → constraints → plan → risks → test plan.
After coding, output: how to run, tests, and rollback plan.

## Project Map (update me)
- Stack summary, env vars, services, run scripts.
- Key modules and what they own.
```

## Workflow Diagram

```
[CLI args] --> [SettingsExporter]
   |                 |
   |        +--------+--------+-------------------+
   |        |System   |Tools   |VSCode |Git |Claude|
   |        v         v        v      v     v
   |     (meta)    (meta)   (meta)  (meta) (meta+mem placeholder)
   |                 \_________ collected files ________/
   |                                  |
   +------------------------------> [write_zip] --> export_bundle.zip
```

## Next Steps

1. **Run the exporter**: `python -m settings_exporter.cli --repo /path/to/repo --out export_bundle.zip`
2. **Export Claude memory**: Settings → Features → "View and edit memory" → Copy
3. **Paste memory**: Open `claude_memory/claude_memory.txt` inside the zip and paste your export
4. **Share bundle**: For review and personalized setup recommendations

## Questions for Implementation

1. Can you run the exporter and share the bundle for review?
2. Do you want tailored CLAUDE.md, .editorconfig, ruff.toml, and pyproject.toml files?
3. Are you leaning toward Git worktrees or GitButler hooks for branch isolation?

## References

- [Claude Memory Export](https://help.anthropic.com/en/articles/8862582-managing-your-memory)
- [Claude Code Workflows](https://docs.anthropic.com/claude/code)
- [GitButler Documentation](https://docs.gitbutler.com/)
- [CLAUDE.md Pattern](https://medium.com/@your-username/claude-setup-guide)

---

*This guide provides a comprehensive foundation for setting up Claude in your development environment with proper isolation, personalization, and workflow management.*
