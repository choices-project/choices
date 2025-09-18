from __future__ import annotations
import subprocess

def run_shell(cmd: str) -> int:
    print(f"$ {cmd}", flush=True)
    proc = subprocess.Popen(cmd, shell=True)
    proc.communicate()
    return proc.returncode

def run_steps(steps):
    for s in steps or []:
        code = run_shell(s)
        if code != 0:
            raise SystemExit(code)