# MATLAB Quick Start on Windows

## Run the committed reference analysis

1. Download the complete repository ZIP.
2. In File Explorer, right-click the ZIP and select **Extract All**.
3. Open MATLAB and set **Current Folder** to the extracted repository root.
4. Open `analysis/matlab/analyze_noaa18_reference_pass.m`.
5. Select **Run**.

The script reads the committed file:

```text
data/best_pass_aer_link.csv
```

It then writes three figures and one CSV file to `results/`. If the extracted
repository is read-only, the Command Window prints the alternative writable
results directory selected by the script.

Expected summary:

```text
Maximum elevation: 89.52 deg
Minimum slant range: 845.19 km
Peak C/N: 32.67 dB
Maximum absolute Doppler: 3.06 kHz
```

## Common errors

### `Error using mkdir: Access is denied`

The script is being run from a read-only location, commonly from inside the ZIP
preview. Extract the whole ZIP first. The revised script also falls back to a
writable MATLAB user directory and prints that path in the Command Window.

### `Required input file was not found`

Only the `.m` file was downloaded or moved. Keep the `analysis/`, `data/`,
`docs/` and `results/` folders together in the extracted repository.
