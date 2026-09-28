"""Demo control endpoint: launches the local ransomware behaviour simulator
so the dashboard can show the behavioural detector firing. Local demo use only."""

import os
import sys
import subprocess
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/v1/demo", tags=["Demo Control"])

_process = {"proc": None}


def _simulator_path() -> str:
    # app/api/demo.py -> app/ -> aegis-backend/ -> agent/ransomware_simulator.py
    here = os.path.dirname(os.path.abspath(__file__))
    backend = os.path.dirname(os.path.dirname(here))
    return os.path.join(backend, "agent", "ransomware_simulator.py")


@router.post("/simulate-ransomware")
def simulate_ransomware(duration: int = 30):
    """Start the contained file-activity simulator for `duration` seconds."""
    if _process["proc"] is not None and _process["proc"].poll() is None:
        raise HTTPException(status_code=409, detail="A simulation is already running.")
    script = _simulator_path()
    if not os.path.exists(script):
        raise HTTPException(status_code=404, detail=f"Simulator not found at {script}")
    duration = max(5, min(int(duration), 120))
    _process["proc"] = subprocess.Popen([sys.executable, script, str(duration)])
    return {"status": "started", "duration_seconds": duration}


@router.get("/status")
def simulation_status():
    proc = _process["proc"]
    running = proc is not None and proc.poll() is None
    return {"running": running}
