"""AegisAI lightweight endpoint agent.

Collects per-process psutil telemetry and POSTs TelemetryPayload documents
to the FastAPI /api/v1/telemetry/assess gateway.
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

import psutil

DEFAULT_API_URL = os.environ.get("AEGIS_API_URL", "http://127.0.0.1:8000")
DEFAULT_INTERVAL = float(os.environ.get("AEGIS_AGENT_INTERVAL", "3"))
DEFAULT_MAX_PROCESSES = int(os.environ.get("AEGIS_AGENT_MAX_PROCESSES", "12"))


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _loaded_module_count(proc: psutil.Process) -> int:
    try:
        return len(proc.memory_maps())
    except (psutil.AccessDenied, psutil.NoSuchProcess, psutil.ZombieProcess, OSError):
        return 0


def _open_handle_count(proc: psutil.Process) -> int:
    try:
        if hasattr(proc, "num_handles"):
            return int(proc.num_handles())
        return int(proc.num_fds())
    except (psutil.AccessDenied, psutil.NoSuchProcess, psutil.ZombieProcess, OSError, AttributeError):
        return 0


def collect_process_payload(proc: psutil.Process, hostname: str) -> dict | None:
    try:
        with proc.oneshot():
            name = proc.name() or "unknown"
            memory_info = proc.memory_info()
            payload = {
                "timestamp": utc_now(),
                "hostname": hostname,
                "process_name": name,
                "pid": int(proc.pid),
                "cpu_percent": float(proc.cpu_percent(interval=None) or 0.0),
                "memory_mb": float(memory_info.rss) / (1024.0 * 1024.0),
                "thread_count": int(proc.num_threads()),
                "open_handles": _open_handle_count(proc),
                "loaded_modules": _loaded_module_count(proc),
            }
        return payload
    except (psutil.AccessDenied, psutil.NoSuchProcess, psutil.ZombieProcess):
        return None


def collect_payloads(max_processes: int) -> list[dict]:
    hostname = socket.gethostname()
    procs: list[psutil.Process] = []
    for proc in psutil.process_iter(["pid"]):
        try:
            proc.cpu_percent(interval=None)
            procs.append(proc)
        except (psutil.AccessDenied, psutil.NoSuchProcess, psutil.ZombieProcess):
            continue

    time.sleep(0.15)

    snapshots: list[dict] = []
    for proc in procs:
        payload = collect_process_payload(proc, hostname)
        if payload is not None:
            snapshots.append(payload)

    snapshots.sort(key=lambda item: (item["cpu_percent"], item["memory_mb"]), reverse=True)
    return snapshots[: max(1, max_processes)]


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


def run_loop(api_url: str, interval: float, max_processes: int, once: bool) -> None:
    print(f"[AegisAI Agent] hostname={socket.gethostname()} target={api_url}")
    print(f"[AegisAI Agent] interval={interval}s max_processes={max_processes}")

    while True:
        payloads = collect_payloads(max_processes)
        print(f"[{utc_now()}] collected {len(payloads)} process snapshots")
        for payload in payloads:
            try:
                result = post_payload(api_url, payload)
                print(
                    f"  PID {payload['pid']:>6} {payload['process_name']:<24} "
                    f"{result.get('severity', '?'):<8} risk={result.get('risk_score', '?')} "
                    f"pred={result.get('prediction', '?')}"
                )
            except urllib.error.HTTPError as exc:
                detail = exc.read().decode("utf-8", errors="ignore")
                print(f"  PID {payload['pid']} HTTP {exc.code}: {detail[:200]}")
            except urllib.error.URLError as exc:
                print(f"  Gateway unreachable ({exc.reason}). Is FastAPI running on {api_url}?")
                break
            except (psutil.AccessDenied, psutil.NoSuchProcess, psutil.ZombieProcess):
                continue
            except Exception as exc:  # noqa: BLE001 — keep the agent looping
                print(f"  PID {payload.get('pid', '?')} error: {exc}")

        if once:
            break
        time.sleep(max(0.5, interval))


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="AegisAI endpoint telemetry agent")
    parser.add_argument("--api-url", default=DEFAULT_API_URL, help="FastAPI base URL")
    parser.add_argument("--interval", type=float, default=DEFAULT_INTERVAL, help="Seconds between scans")
    parser.add_argument("--max-processes", type=int, default=DEFAULT_MAX_PROCESSES)
    parser.add_argument("--once", action="store_true", help="Collect and POST a single batch then exit")
    return parser.parse_args(argv)


def main() -> int:
    args = parse_args()
    try:
        run_loop(args.api_url, args.interval, args.max_processes, args.once)
    except KeyboardInterrupt:
        print("\n[AegisAI Agent] stopped")
        return 0
    return 0


if __name__ == "__main__":
    sys.exit(main())
