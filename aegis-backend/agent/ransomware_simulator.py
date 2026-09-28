# ransomware_simulator.py
# Safe, contained ransomware-BEHAVIOUR simulator for the AegisAI demo.
# Writes only inside aegis-backend/watch_target, resolved relative to this file.
# It rewrites files and renames them to .enc at high speed to imitate an
# encryption pass. No real encryption, no network, no files touched outside
# the watch folder. Cleans up on exit.

import os
import sys
import time
import threading

DURATION = int(sys.argv[1]) if len(sys.argv) > 1 else 60   # seconds
NUM_FILES = 200
NUM_WORKER_THREADS = 32


def watch_dir():
    here = os.path.dirname(os.path.abspath(__file__))
    backend = os.path.dirname(here)  # agent/ -> aegis-backend/
    path = os.path.join(backend, "watch_target")
    os.makedirs(path, exist_ok=True)
    return path


WORK_DIR = watch_dir()
stop_time = time.time() + DURATION

# Create disposable test files
for i in range(NUM_FILES):
    p = os.path.join(WORK_DIR, f"document_{i:04d}.txt")
    if not os.path.exists(p):
        with open(p, "wb") as f:
            f.write(os.urandom(64 * 1024))
print(f"Created {NUM_FILES} test files in {WORK_DIR}")

lock = threading.Lock()
rewrites = [0]


def worker(worker_id):
    idx = worker_id
    while time.time() < stop_time:
        src = os.path.join(WORK_DIR, f"document_{idx % NUM_FILES:04d}.txt")
        enc = os.path.join(WORK_DIR, f"document_{idx % NUM_FILES:04d}.enc")
        try:
            with open(src, "rb") as f:
                data = f.read()
            # reversible XOR, NOT real encryption, only to produce write activity
            with open(src, "wb") as f:
                f.write(bytes(b ^ 0x5A for b in data))
            if os.path.exists(enc):
                os.remove(enc)
            os.rename(src, enc)       # rename to a suspicious extension
            os.rename(enc, src)       # rename back so the file set is reused
            with lock:
                rewrites[0] += 1
        except (OSError, FileNotFoundError):
            pass
        idx += NUM_WORKER_THREADS


threads = []
for w in range(NUM_WORKER_THREADS):
    t = threading.Thread(target=worker, args=(w,), daemon=True)
    t.start()
    threads.append(t)
print(f"Started {NUM_WORKER_THREADS} worker threads. Running for {DURATION} s ...")

while time.time() < stop_time:
    time.sleep(2)
    print(f"  t={DURATION - int(stop_time - time.time()):3d}s  rewrites so far: {rewrites[0]:,}")

# Clean up: delete every file in the watch folder
for name in os.listdir(WORK_DIR):
    try:
        os.remove(os.path.join(WORK_DIR, name))
    except OSError:
        pass
print(f"Finished. Total file rewrites: {rewrites[0]:,}. Watch folder cleaned.")