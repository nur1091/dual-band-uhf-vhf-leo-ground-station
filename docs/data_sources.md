# Data Sources

## Orbital data

The NOAA-18 TLE used in this repository was obtained from the University of
Wisconsin–Madison Antarctic Meteorological Research Center archive for
10 January 2025.

The original AMRC archive interface has since migrated to the new
[AMRDC Data Repository](https://amrdcdata.ssec.wisc.edu/). To preserve
reproducibility, the exact unmodified TLE used by the analysis is committed at
[`data/noaa18_tle_2025-01-10.txt`](../data/noaa18_tle_2025-01-10.txt).

- Original archive reference: `NAV.2025.01.10.txt`
- NORAD catalog ID: `28654`
- TLE epoch: `2025-01-10T03:17:10.617Z`
- SHA-256: `35b3134a4008ed5c3480d08f7e12f8544eee86888f3d30edba5f9277ddea711b`

## Mission and RF information

- NOAA POES spacecraft status and NOAA-18 mission data: https://www.ospo.noaa.gov/operations/poes/status.html
- NOAA-N Prime/POES communications information: https://www.ospo.noaa.gov/assets/pdf/NOAA_NP_Booklet.pdf
- NOAA-18 decommissioning notice: https://www.nesdis.noaa.gov/about/documents-reports/notice-of-changes/2025-notice-of-changes/decommissioning-of-noaa-18-scheduled-june-6-2025-1733-1749-utc

## Propagation software

SGP4 propagation and coordinate transformations use the MIT-licensed `satellite.js` library:

- https://github.com/shashwatak/satellite-js

## Ground location

The ground station uses approximate public-map coordinates for the NEU Köyceğiz Campus. They are adequate for a portfolio-scale reference analysis but should be replaced by surveyed antenna coordinates before physical implementation.
