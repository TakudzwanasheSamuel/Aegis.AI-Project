from app.services.feature_space import HARMONIZED_FEATURES

# Payload keys are underscore form; model columns are the dotted CIC names.
_PAYLOAD_TO_FEATURE = {
    "pslist.nproc": "pslist_nproc",
    "pslist.nppid": "pslist_nppid",
    "pslist.avg_threads": "pslist_avg_threads",
    "pslist.avg_handlers": "pslist_avg_handlers",
    "dlllist.ndlls": "dlllist_ndlls",
    "dlllist.avg_dlls_per_proc": "dlllist_avg_dlls_per_proc",
    "handles.nhandles": "handles_nhandles",
    "handles.avg_handles_per_proc": "handles_avg_handles_per_proc",
}


class FeatureHarmonizationService:
    """Pass live system-wide counters through as the 8 model features."""

    @staticmethod
    def harmonize(telemetry: dict) -> dict:
        return {
            name: float(telemetry.get(_PAYLOAD_TO_FEATURE[name], 0) or 0)
            for name in HARMONIZED_FEATURES
        }
