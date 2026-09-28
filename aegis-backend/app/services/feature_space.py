"""Canonical 8-feature space shared by training, harmonization, and inference."""

HARMONIZED_FEATURES = [
    "pslist.nproc",
    "pslist.nppid",
    "pslist.avg_threads",
    "pslist.avg_handlers",
    "dlllist.ndlls",
    "dlllist.avg_dlls_per_proc",
    "handles.nhandles",
    "handles.avg_handles_per_proc",
]
