"""Validate the committed ground-station analysis outputs.

This script intentionally uses only the Python standard library so it can run
as a lightweight integrity check in local development and GitHub Actions.
"""

from __future__ import annotations

import csv
import json
import math
from datetime import datetime
from pathlib import Path


REPOSITORY_ROOT = Path(__file__).resolve().parents[2]
DATA_DIRECTORY = REPOSITORY_ROOT / "data"
IMAGE_DIRECTORY = REPOSITORY_ROOT / "docs" / "images"


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8") as file:
        rows = list(csv.DictReader(file))
    if not rows:
        raise AssertionError(f"No data rows found in {path}")
    return rows


def assert_close(actual: float, expected: float, tolerance: float, label: str) -> None:
    if not math.isclose(actual, expected, abs_tol=tolerance):
        raise AssertionError(
            f"{label} mismatch: expected {expected:.6f}, found {actual:.6f}"
        )


def main() -> None:
    summary_path = DATA_DIRECTORY / "analysis_summary.json"
    summary = json.loads(summary_path.read_text(encoding="utf-8"))
    selected_pass = summary["selectedPass"]

    aer_rows = read_csv(DATA_DIRECTORY / "best_pass_aer_link.csv")
    pass_rows = read_csv(DATA_DIRECTORY / "pass_summary.csv")

    expected_row_count = int(selected_pass["durationSeconds"]) + 1
    if len(aer_rows) != expected_row_count:
        raise AssertionError(
            f"Expected {expected_row_count} AER rows, found {len(aer_rows)}"
        )

    times = [datetime.fromisoformat(row["time_utc"].replace("Z", "+00:00")) for row in aer_rows]
    if any((later - earlier).total_seconds() != 1 for earlier, later in zip(times, times[1:])):
        raise AssertionError("AER timestamps are not continuous one-second samples")

    max_elevation = max(float(row["elevation_deg"]) for row in aer_rows)
    min_range = min(float(row["range_km"]) for row in aer_rows)
    peak_cn = max(float(row["cn_db"]) for row in aer_rows)
    max_doppler = max(abs(float(row["doppler_hz"])) for row in aer_rows)

    assert_close(max_elevation, selected_pass["maxElevationDeg"], 1e-5, "Maximum elevation")
    assert_close(min_range, selected_pass["minRangeKm"], 1e-5, "Minimum range")
    assert_close(peak_cn, selected_pass["peakCnDb"], 1e-5, "Peak C/N")
    assert_close(max_doppler, selected_pass["maximumAbsoluteDopplerHz"], 1e-3, "Maximum Doppler")

    selected_rows = [row for row in pass_rows if int(row["pass_id"]) == selected_pass["passId"]]
    if len(selected_rows) != 1:
        raise AssertionError("Selected pass is missing or duplicated in pass_summary.csv")

    required_images = (
        "pass_elevation_range.png",
        "link_budget_cn.png",
        "doppler_shift.png",
        "stk_original_3d_scenario.png",
        "stk_original_2d_ground_track.png",
    )
    for image_name in required_images:
        image_path = IMAGE_DIRECTORY / image_name
        if not image_path.is_file() or image_path.stat().st_size < 10_000:
            raise AssertionError(f"Missing or invalid image: {image_path}")

    print(
        "Validation passed: "
        f"{len(pass_rows)} passes, {len(aer_rows)} selected-pass samples, "
        f"max elevation {max_elevation:.2f} deg, peak C/N {peak_cn:.2f} dB."
    )


if __name__ == "__main__":
    main()
