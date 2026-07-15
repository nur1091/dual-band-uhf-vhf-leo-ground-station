# Original STK Study Notes

## Purpose

The original graduation study used Ansys Systems Tool Kit (STK) to develop the
scenario concept and visualize the relationship between the NOAA-18 orbit and
the proposed Konya ground station. Two archived views from that study are
preserved in this repository:

- `stk_original_3d_scenario.png`: global 3D orbit and ground-station view.
- `stk_original_2d_ground_track.png`: regional 2D ground-track view.

These images provide evidence of the original STK modelling activity. They are
kept separate from the current reference analysis because the screenshots show
a scenario date of 15 January 2026, after NOAA-18 was permanently decommissioned.

## Verification boundary

The archived STK report tables are not used as numerical evidence in this
repository. Review of the saved material found configuration fields that do not
match the intended 137.9125 MHz analog reference case, including a displayed
10 GHz receive frequency and BER-style output that is not applicable to an
analog APT link.

For that reason, the portfolio repository uses:

- an operational-period NOAA-18 TLE from 10 January 2025;
- SGP4 propagation with committed one-second AER data;
- received power and carrier-to-noise ratio for the analog VHF reference;
- documented assumptions and scripts that can be rerun without an STK licence.

The STK screenshots therefore document the design history, while the generated
CSV files and plots provide the reproducible quantitative result set.
