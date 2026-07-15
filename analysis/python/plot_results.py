"""Create portfolio-ready plots from the generated AER and RF results."""

from pathlib import Path

import matplotlib.dates as mdates
import matplotlib.pyplot as plt
import pandas as pd


ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data"
IMAGES = ROOT / "docs" / "images"
IMAGES.mkdir(parents=True, exist_ok=True)

df = pd.read_csv(DATA / "best_pass_aer_link.csv", parse_dates=["time_utc"])
time = df["time_utc"]

plt.style.use("seaborn-v0_8-whitegrid")


def finish(fig, ax, filename):
    ax.xaxis.set_major_formatter(mdates.DateFormatter("%H:%M", tz=time.dt.tz))
    fig.autofmt_xdate(rotation=0)
    fig.tight_layout()
    fig.savefig(IMAGES / filename, dpi=180, bbox_inches="tight")
    plt.close(fig)


fig, ax1 = plt.subplots(figsize=(9.2, 4.8))
ax1.plot(time, df["elevation_deg"], color="#146C94", linewidth=2.2, label="Elevation")
ax1.axhline(10, color="#E07A5F", linestyle="--", linewidth=1.5, label="10° mask")
ax1.set_ylabel("Elevation (deg)", color="#146C94")
ax1.set_xlabel("UTC on 10 January 2025")
ax1.tick_params(axis="y", labelcolor="#146C94")
ax2 = ax1.twinx()
ax2.plot(time, df["range_km"], color="#3D405B", linewidth=1.8, label="Slant range")
ax2.set_ylabel("Slant range (km)", color="#3D405B")
ax2.tick_params(axis="y", labelcolor="#3D405B")
handles = ax1.get_lines() + ax2.get_lines()
ax1.legend(handles, [line.get_label() for line in handles], loc="upper right")
ax1.set_title("NOAA-18 Reference Pass: Elevation and Slant Range")
finish(fig, ax1, "pass_elevation_range.png")

fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(9.2, 6.2), sharex=True)
ax1.plot(time, df["received_power_dbm"], color="#6A4C93", linewidth=2.2)
ax1.set_ylabel("Received power (dBm)")
ax1.set_title("Reference VHF Downlink Budget")
ax2.plot(time, df["cn_db"], color="#198754", linewidth=2.2)
ax2.set_ylabel("C/N (dB)")
ax2.set_xlabel("UTC on 10 January 2025")
finish(fig, ax2, "link_budget_cn.png")

fig, ax = plt.subplots(figsize=(9.2, 4.8))
ax.plot(time, df["doppler_hz"] / 1000, color="#C44536", linewidth=2.2)
ax.axhline(0, color="#333333", linewidth=1)
ax.set_ylabel("Doppler shift (kHz)")
ax.set_xlabel("UTC on 10 January 2025")
ax.set_title("Predicted Doppler Shift at 137.9125 MHz")
finish(fig, ax, "doppler_shift.png")

print(f"Created plots in {IMAGES}")
