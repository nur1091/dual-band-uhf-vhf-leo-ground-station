# Data Sources

## Orbital data

The NOAA-18 TLE used in this repository was archived by the University of Wisconsin-Madison Antarctic Meteorological Research Center for 10 January 2025:

- https://amrc.ssec.wisc.edu/data/view-data.php?action=view_text_file&product=ftp%2Farchive%2F2025%2F0110%2FNAV.2025.01.10.txt

The unmodified two-line element set is stored in `data/noaa18_tle_2025-01-10.txt`.

## Mission and RF information

- NOAA POES spacecraft status and NOAA-18 mission data: https://www.ospo.noaa.gov/operations/poes/status.html
- NOAA-N Prime/POES communications information: https://www.ospo.noaa.gov/assets/pdf/NOAA_NP_Booklet.pdf
- NOAA-18 decommissioning notice: https://www.nesdis.noaa.gov/about/documents-reports/notice-of-changes/2025-notice-of-changes/decommissioning-of-noaa-18-scheduled-june-6-2025-1733-1749-utc

## Propagation software

SGP4 propagation and coordinate transformations use the MIT-licensed `satellite.js` library:

- https://github.com/shashwatak/satellite-js

## Ground location

The ground station uses approximate public-map coordinates for the NEU Köyceğiz Campus. They are adequate for a portfolio-scale reference analysis but should be replaced by surveyed antenna coordinates before physical implementation.
