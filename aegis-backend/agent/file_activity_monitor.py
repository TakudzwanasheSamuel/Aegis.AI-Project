# file_activity_monitor.py
# Watches a folder for file writes and renames, and reports counts and a
# behavioural verdict per interval. Portable: the watch folder is resolved
# relative to this file and created if missing, so it runs on any machine.

import os
import time
import threading
from collections import deque
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# Extensions commonly used by ransomware when renaming encrypted files
SUSPICIOUS_EXTS = {".enc", ".locked", ".crypt", ".crypto", ".encrypted",
                   ".locky", ".wannacry", ".cerber", ".aes", ".ryk"}


def default_watch_dir():
    # aegis-backend/watch_target, resolved from this file's location
    here = os.path.dirname(os.path.abspath(__file__))
    backend = os.path.dirname(here)  # agent/ -> aegis-backend/
    path = os.path.join(backend, "watch_target")
    os.makedirs(path, exist_ok=True)
    return path


class ActivityHandler(FileSystemEventHandler):
    def __init__(self):
        self._lock = threading.Lock()
        self.modified = deque()
        self.created = deque()
        self.renamed = deque()
        self.suspicious_renames = deque()

    def _stamp(self, dq):
        with self._lock:
            dq.append(time.time())

    def on_modified(self, event):
        if not event.is_directory:
            self._stamp(self.modified)

    def on_created(self, event):
        if not event.is_directory:
            self._stamp(self.created)

    def on_moved(self, event):
        if not event.is_directory:
            self._stamp(self.renamed)
            dest = getattr(event, "dest_path", "") or ""
            if os.path.splitext(dest)[1].lower() in SUSPICIOUS_EXTS:
                self._stamp(self.suspicious_renames)

    def counts_in_window(self, window_s):
        cutoff = time.time() - window_s
        with self._lock:
            for dq in (self.modified, self.created, self.renamed, self.suspicious_renames):
                while dq and dq[0] < cutoff:
                    dq.popleft()
            return {
                "files_modified": len(self.modified),
                "files_created": len(self.created),
                "files_renamed": len(self.renamed),
                "suspicious_renames": len(self.suspicious_renames),
            }


class FileActivityMonitor:
    def __init__(self, watch_dir=None, window_s=10.0):
        self.watch_dir = watch_dir or default_watch_dir()
        self.window_s = window_s
        self.handler = ActivityHandler()
        self.observer = Observer()

    def start(self):
        self.observer.schedule(self.handler, self.watch_dir, recursive=True)
        self.observer.start()
        return self

    def stop(self):
        self.observer.stop()
        self.observer.join(timeout=3)

    def snapshot(self):
        c = self.handler.counts_in_window(self.window_s)
        c["modify_rate"] = round(c["files_modified"] / self.window_s, 2)
        c["rename_rate"] = round(c["files_renamed"] / self.window_s, 2)
        return c

    def behavioural_verdict(self):
        s = self.snapshot()
        rw = s["modify_rate"]
        rn = s["rename_rate"]
        susp = s["suspicious_renames"]
        # Explainable rule: sustained high-rate file rewriting and renaming,
        # especially to suspicious extensions, indicates encryption-like activity.
        if susp >= 20 or (rw >= 20 and rn >= 20):
            level, score = "CRITICAL", 95
        elif susp >= 5 or (rw >= 8 and rn >= 8):
            level, score = "HIGH", 75
        elif rw >= 3 or rn >= 3:
            level, score = "MEDIUM", 45
        else:
            level, score = "SAFE", 5
        reasons = []
        if susp > 0:
            reasons.append(f"{susp} renames to suspicious extensions in {int(self.window_s)}s")
        if rw >= 3:
            reasons.append(f"file rewrite rate {rw:.1f}/s")
        if rn >= 3:
            reasons.append(f"file rename rate {rn:.1f}/s")
        return {
            "behavioural_level": level,
            "behavioural_score": score,
            "behavioural_reasons": reasons,
            **s,
        }


# Standalone test: run this file directly to watch the folder live
if __name__ == "__main__":
    mon = FileActivityMonitor().start()
    print(f"Watching: {mon.watch_dir}")
    print(f"Rolling window: {mon.window_s} s. Press Ctrl+C to stop.\n")
    try:
        while True:
            time.sleep(2)
            v = mon.behavioural_verdict()
            print(f"[{v['behavioural_level']:8s} score={v['behavioural_score']:3d}]  "
                  f"modify_rate={v['modify_rate']:6.1f}/s  rename_rate={v['rename_rate']:6.1f}/s  "
                  f"suspicious={v['suspicious_renames']:4d}  | {'; '.join(v['behavioural_reasons']) or 'no activity'}")
    except KeyboardInterrupt:
        mon.stop()
        print("\nStopped.")