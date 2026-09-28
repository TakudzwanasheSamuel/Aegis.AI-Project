"""AegisAI lightweight endpoint agent.

Collects one system-wide psutil snapshot per cycle, adds a live
file-activity behavioural reading, and POSTs both to the FastAPI
/api/v1/telemetry/assess gateway.
"""

from __future__ import annotations

import argparse
import json
import os
import socket
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone

import numpy as np
import psutil

# Behavioural file-activity monitor (same package)
try:
    from agent.file_activity_monitor import FileActivityMonitor
except ImportError:
    from file_activity_monitor import FileActivityMonitor

DEFAULT_API_URL = os.environ.get("AEGIS_API_URL", "http://127.0.0.1:8000")
DEFAULT_INTERVAL = float(os.environ.get("AEGIS_AGENT_INTERVAL", "3"))


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _handle_count(proc: psutil.Process) -> int:
    if hasattr(proc, "num_handles"):
        return int(proc.num_handles())
    try:
        return int(proc.num_fds())
    except (psutil.AccessDenied, psutil.NoSuchProcess, psutil.ZombieProcess, OSError, AttributeError):
        return 0


def _mean(values: list[float]) -> float:
    if not values:
        return 0.0
    return float(np.mean(values))


def system_snapshot() -> dict:
    threads: list[float] = []
    handles: list[float] = []
    dlls: list[float] = []
    ppids: set[int] = set()
    total = 0

    for proc in psutil.process_iter(["pid", "ppid"]):
        total += 1
        ppid = proc.info.get("ppid") if isinstance(proc.info, dict) else None
        if ppid is not None:
            ppids.add(ppid)
        try:
            thread_count = proc.num_threads()
            handle_count = _handle_count(proc)
            dll_count = sum(
                1
                for module in proc.memory_maps(grouped=True)
                if module.path and module.path.lower().endswith(".dll")
            )
        except (psutil.AccessDenied, psutil.NoSuchProcess, psutil.ZombieProcess, OSError):
            continue
        threads.append(thread_count)
        handles.append(handle_count)
        dlls.append(dll_count)

    return {
        "pslist_nproc": total,
        "pslist_nppid": len(ppids),
        "pslist_avg_threads": _mean(threads),
        "pslist_avg_handlers": _mean(handles),
        "dlllist_ndlls": int(np.sum(dlls)) if dlls else 0,
        "dlllist_avg_dlls_per_proc": _mean(dlls),
        "handles_nhandles": int(np.sum(handles)) if handles else 0,
        "handles_avg_handles_per_proc": _mean(handles),
        "accessible_processes": len(threads),
    }


def post_payload(api_url: str, payload: dict, timeout: float = 8.0) -> dict:
    assess_url = api_url.rstrip("/") + "/api/v1/telemetry/assess"
    body = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        assess_url,
        data=body,
        headers={"Content-Type": "application/json", "Accept": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8"))


def run_loop(api_url: str, interval: float, once: bool) -> None:
    hostname = socket.gethostname()

    # Start the behavioural file-activity monitor (watches aegis-backend/watch_target)
    monitor = FileActivityMonitor().start()

    print(f"[AegisAI Agent] hostname={hostname} target={api_url}")
    print(f"[AegisAI Agent] interval={interval}s mode=system-snapshot+behavioural")
    print(f"[AegisAI Agent] watching folder: {monitor.watch_dir}")

    try:
        while True:
            behaviour = monitor.behavioural_verdict()
            payload = {
                "timestamp": utc_now(),
                "hostname": hostname,
                "snapshot_label": "SYSTEM_SNAPSHOT",
                **system_snapshot(),
                # behavioural fields
                "behavioural_level": behaviour["behavioural_level"],
                "behavioural_score": behaviour["behavioural_score"],
                "behavioural_reasons": behaviour["behavioural_reasons"],
                "modify_rate": behaviour["modify_rate"],
                "rename_rate": behaviour["rename_rate"],
                "suspicious_renames": behaviour["suspicious_renames"],
            }
            print(
                f"[{payload['timestamp']}] accessible={payload['accessible_processes']} "
                f"nproc={payload['pslist_nproc']} "
                f"behaviour={payload['behavioural_level']}({payload['behavioural_score']}) "
                f"rewrite={payload['modify_rate']:.0f}/s rename={payload['rename_rate']:.0f}/s"
            )
            try:
                result = post_payload(api_url, payload)
                print(
                    f"  {payload['snapshot_label']:<20} "
                    f"final={result.get('severity', '?'):<8} risk={result.get('risk_score', '?')} "
                    f"pred={result.get('prediction', '?')}"
                )
            except urllib.error.HTTPError as exc:
                detail = exc.read().decode("utf-8", errors="ignore")
                print(f"  HTTP {exc.code}: {detail[:200]}")
            except urllib.error.URLError as exc:
                print(f"  Gateway unreachable ({exc.reason}). Is FastAPI running on {api_url}?")
                break
            except Exception as exc:  # noqa: BLE001 - keep the agent looping
                print(f"  snapshot error: {exc}")

            if once:
                break
            time.sleep(max(0.5, interval))
    finally:
        monitor.stop()


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="AegisAI endpoint telemetry agent")
    parser.add_argument("--api-url", default=DEFAULT_API_URL, help="FastAPI base URL")
    parser.add_argument("--interval", type=float, default=DEFAULT_INTERVAL, help="Seconds between scans")
    parser.add_argument("--once", action="store_true", help="Collect and POST a single snapshot then exit")
    return parser.parse_args(argv)


def main() -> int:
    args = parse_args()
    try:
        run_loop(args.api_url, args.interval, args.once)
    except KeyboardInterrupt:
        print("\n[AegisAI Agent] stopped")
        return 0
    return 0


if __name__ == "__main__":
    sys.exit(main())