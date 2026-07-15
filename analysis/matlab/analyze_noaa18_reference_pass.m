%% NOAA-18 reference-pass RF analysis
% Recomputes FSPL, received power, system noise, C/N and Doppler shift from
% the SGP4-generated AER data in data/best_pass_aer_link.csv.

clear; clc; close all;

scriptDirectory = fileparts(mfilename('fullpath'));
repositoryRoot = fileparts(fileparts(scriptDirectory));
dataFile = fullfile(repositoryRoot, 'data', 'best_pass_aer_link.csv');
resultsDirectory = fullfile(repositoryRoot, 'results');
if ~isfile(dataFile)
    error(['Required input file was not found:\n%s\n\n' ...
        'Extract the complete repository first; do not run this script ' ...
        'directly from inside the ZIP file.'], dataFile);
end

% Prefer the repository's results folder. If the repository is opened from
% a read-only location (for example, directly inside a ZIP archive), fall
% back to a writable folder under MATLAB's user directory.
repositoryOutputWritable = true;
try
    if ~exist(resultsDirectory, 'dir')
        mkdir(resultsDirectory);
    end
    writeTestFile = fullfile(resultsDirectory, 'matlab_write_test.tmp');
    [testFileId, message] = fopen(writeTestFile, 'w');
    if testFileId < 0
        error('MATLAB:OutputNotWritable', '%s', message);
    end
    fclose(testFileId);
    delete(writeTestFile);
catch outputError
    repositoryOutputWritable = false;
    message = outputError.message;
end

if ~repositoryOutputWritable
    matlabUserDirectory = userpath;
    if isempty(matlabUserDirectory)
        matlabUserDirectory = tempdir;
    else
        matlabUserDirectory = strsplit(matlabUserDirectory, pathsep);
        matlabUserDirectory = matlabUserDirectory{1};
    end
    resultsDirectory = fullfile(matlabUserDirectory, ...
        'noaa18_ground_station_results');
    try
        if ~exist(resultsDirectory, 'dir')
            mkdir(resultsDirectory);
        end
    catch fallbackError
        error('Unable to create an output folder: %s', fallbackError.message);
    end
    warning('Repository output folder is not writable: %s', message);
end

fprintf('Input data: %s\n', dataFile);
fprintf('Results directory: %s\n\n', resultsDirectory);

data = readtable(dataFile);
timeUtc = datetime(data.time_utc, 'InputFormat', ...
    'yyyy-MM-dd''T''HH:mm:ss.SSS''Z''', 'TimeZone', 'UTC');

% Documented design assumptions for the legacy NOAA-18 APT reference case.
frequencyMHz = 137.9125;
frequencyHz = frequencyMHz * 1e6;
satelliteEirpDbw = 10.0;
receiveAntennaGainDbi = 2.15;
implementationLossDb = 2.0;
lnaNoiseFigureDb = 2.9;
antennaNoiseTemperatureK = 150;
receiverBandwidthHz = 40000;

boltzmann = 1.380649e-23;
speedOfLightMps = 299792458;
equivalentLnaTemperatureK = 290 * (10^(lnaNoiseFigureDb / 10) - 1);
systemNoiseTemperatureK = antennaNoiseTemperatureK + equivalentLnaTemperatureK;
noisePowerW = boltzmann * systemNoiseTemperatureK * receiverBandwidthHz;
noisePowerDbm = 10 * log10(noisePowerW * 1000);

fsplDb = 32.44 + 20 * log10(frequencyMHz) + 20 * log10(data.range_km);
receivedPowerDbm = satelliteEirpDbw + 30 + receiveAntennaGainDbi ...
    - fsplDb - implementationLossDb;
cnDb = receivedPowerDbm - noisePowerDbm;
dopplerHz = -(data.radial_velocity_km_s * 1000 / speedOfLightMps) * frequencyHz;

results = table(timeUtc, data.azimuth_deg, data.elevation_deg, data.range_km, ...
    fsplDb, receivedPowerDbm, repmat(noisePowerDbm, height(data), 1), cnDb, ...
    dopplerHz, 'VariableNames', {'TimeUTC', 'AzimuthDeg', 'ElevationDeg', ...
    'RangeKm', 'FSPLdB', 'ReceivedPowerdBm', 'NoisePowerdBm', 'CNdB', ...
    'DopplerHz'});
writetable(results, fullfile(resultsDirectory, 'matlab_reference_link_results.csv'));

[maximumElevationDeg, maxElevationIndex] = max(data.elevation_deg);
minimumRangeKm = min(data.range_km);
peakCnDb = max(cnDb);
maximumAbsoluteDopplerHz = max(abs(dopplerHz));

fprintf('Maximum elevation: %.2f deg at %s\n', maximumElevationDeg, ...
    string(timeUtc(maxElevationIndex)));
fprintf('Minimum slant range: %.2f km\n', minimumRangeKm);
fprintf('Peak C/N: %.2f dB\n', peakCnDb);
fprintf('Maximum absolute Doppler: %.2f kHz\n', maximumAbsoluteDopplerHz / 1000);

figure('Color', 'w');
yyaxis left
plot(timeUtc, data.elevation_deg, 'LineWidth', 1.8);
ylabel('Elevation (deg)');
yline(10, '--', '10 deg mask');
yyaxis right
plot(timeUtc, data.range_km, 'LineWidth', 1.5);
ylabel('Slant range (km)');
xlabel('UTC');
title('NOAA-18 Reference Pass: Elevation and Slant Range');
grid on;
exportgraphics(gcf, fullfile(resultsDirectory, 'matlab_elevation_range.png'), ...
    'Resolution', 180);

figure('Color', 'w');
yyaxis left
plot(timeUtc, receivedPowerDbm, 'LineWidth', 1.8);
ylabel('Received power (dBm)');
yyaxis right
plot(timeUtc, cnDb, 'LineWidth', 1.8);
ylabel('C/N (dB)');
xlabel('UTC');
title('Reference VHF Downlink Budget');
grid on;
exportgraphics(gcf, fullfile(resultsDirectory, 'matlab_link_budget.png'), ...
    'Resolution', 180);

figure('Color', 'w');
plot(timeUtc, dopplerHz / 1000, 'LineWidth', 1.8);
yline(0, '-');
xlabel('UTC');
ylabel('Doppler shift (kHz)');
title('Predicted Doppler Shift at 137.9125 MHz');
grid on;
exportgraphics(gcf, fullfile(resultsDirectory, 'matlab_doppler.png'), ...
    'Resolution', 180);
