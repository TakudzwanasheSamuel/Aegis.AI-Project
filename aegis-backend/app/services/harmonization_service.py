from app.services.feature_space import HARMONIZED_FEATURES

# Class-conditional medians / characteristic values from CIC-MalMem-2022.
# Memory-dump features are system-wide; live psutil readings are per-process.
# Harmonization therefore projects runtime intensity onto this forensic manifold.
_BENIGN = {
    "handles.nhandles": 12185.0,
    "pslist.avg_threads": 12.838,
    "dlllist.ndlls": 2086.0,
    "malfind.commitCharge": 5.0,
    "svcscan.nservices": 395.0,
    "ldrmodules.not_in_load": 74.0,
    "handles.nfile": 1079.5,
    "malfind.ninjections": 4.0,
}

_MALWARE = {
    "handles.nhandles": 8414.0,
    "pslist.avg_threads": 9.974,
    "dlllist.ndlls": 1557.0,
    "malfind.commitCharge": 1928.0,
    "svcscan.nservices": 389.0,
    "ldrmodules.not_in_load": 46.0,
    "handles.nfile": 646.0,
    "malfind.ninjections": 9.0,
}


def _clamp(value: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, value))


def _unit(value: float, lo: float, hi: float) -> float:
    if hi <= lo:
        return 0.0
    return _clamp((value - lo) / (hi - lo), 0.0, 1.0)


class FeatureHarmonizationService:
    """Map psutil/WMI runtime telemetry onto the 8-feature CIC-MalMem-2022 subset."""

    @staticmethod
    def _ransom_intensity(telemetry: dict) -> float:
        handles = float(telemetry.get("open_handles", 0) or 0)
        threads = float(telemetry.get("thread_count", 0) or 0)
        memory_mb = float(telemetry.get("memory_mb", 0.0) or 0.0)
        cpu_pct = float(telemetry.get("cpu_percent", 0.0) or 0.0)
        modules = float(telemetry.get("loaded_modules", 0) or 0)

        # File-enumeration / injection-like behavior, not merely a busy workstation.
        return _clamp(
            0.30 * _unit(handles, 400.0, 1800.0)
            + 0.30 * _unit(threads, 40.0, 180.0)
            + 0.15 * _unit(cpu_pct, 55.0, 95.0)
            + 0.15 * _unit(memory_mb, 600.0, 2000.0)
            + 0.10 * _unit(modules, 40.0, 110.0),
            0.0,
            1.0,
        )

    @staticmethod
    def harmonize(telemetry: dict) -> dict:
        intensity = FeatureHarmonizationService._ransom_intensity(telemetry)
        mapped = {
            name: (1.0 - intensity) * _BENIGN[name] + intensity * _MALWARE[name]
            for name in HARMONIZED_FEATURES
        }

        # commitCharge / ninjections are near-perfect class separators in CIC
        # (benign commitCharge max is 88). Keep busy-but-benign workloads in-band
        # and only emit malware-scale malfind values at high ransomware intensity.
        if intensity >= 0.55:
            t = (intensity - 0.55) / 0.45
            mapped["malfind.commitCharge"] = _BENIGN["malfind.commitCharge"] + t * (
                _MALWARE["malfind.commitCharge"] - _BENIGN["malfind.commitCharge"]
            )
            mapped["malfind.ninjections"] = _BENIGN["malfind.ninjections"] + t * (
                24.0 - _BENIGN["malfind.ninjections"]
            )
        else:
            mapped["malfind.commitCharge"] = 5.0 + intensity * 60.0
            mapped["malfind.ninjections"] = 4.0 + intensity * 4.0

        return {name: float(mapped[name]) for name in HARMONIZED_FEATURES}
