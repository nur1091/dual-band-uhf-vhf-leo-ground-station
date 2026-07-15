import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as satellite from 'satellite.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../..');
const dataDir = path.join(repoRoot, 'data');

const scenario = {
  startUtc: new Date('2025-01-10T00:00:00.000Z'),
  stopUtc: new Date('2025-01-11T00:00:00.000Z'),
  stepSeconds: 1,
  preferredElevationDeg: 10,
  groundStation: {
    name: 'NEU Koycegiz Campus, Konya',
    latitudeDeg: 37.864722,
    longitudeDeg: 32.414722,
    altitudeKm: 1.011,
  },
  rf: {
    frequencyMHz: 137.9125,
    assumedSatelliteEirpDbw: 10,
    receiveAntennaGainDbi: 2.15,
    implementationLossDb: 2,
    lnaNoiseFigureDb: 2.9,
    antennaNoiseTemperatureK: 150,
    receiverBandwidthHz: 40000,
  },
};

const tleLines = fs
  .readFileSync(path.join(dataDir, 'noaa18_tle_2025-01-10.txt'), 'utf8')
  .trim()
  .split(/\r?\n/);
const [satelliteName, tleLine1, tleLine2] = tleLines;
const satrec = satellite.twoline2satrec(tleLine1, tleLine2);

const degToRad = (degrees) => degrees * Math.PI / 180;
const radToDeg = (radians) => radians * 180 / Math.PI;
const observer = {
  latitude: degToRad(scenario.groundStation.latitudeDeg),
  longitude: degToRad(scenario.groundStation.longitudeDeg),
  height: scenario.groundStation.altitudeKm,
};

function sampleAt(date) {
  const pv = satellite.propagate(satrec, date);
  if (!pv.position) {
    throw new Error(`SGP4 propagation failed at ${date.toISOString()}`);
  }
  const gmst = satellite.gstime(date);
  const positionEcf = satellite.eciToEcf(pv.position, gmst);
  const look = satellite.ecfToLookAngles(observer, positionEcf);
  const geodetic = satellite.eciToGeodetic(pv.position, gmst);
  return {
    timeMs: date.getTime(),
    timeUtc: date.toISOString(),
    azimuthDeg: (radToDeg(look.azimuth) + 360) % 360,
    elevationDeg: radToDeg(look.elevation),
    rangeKm: look.rangeSat,
    satelliteLatitudeDeg: radToDeg(geodetic.latitude),
    satelliteLongitudeDeg: radToDeg(geodetic.longitude),
    satelliteAltitudeKm: geodetic.height,
  };
}

function summarizePass(pass, passId) {
  const maxElevationSample = pass.reduce((best, row) =>
    row.elevationDeg > best.elevationDeg ? row : best);
  const minRangeSample = pass.reduce((best, row) =>
    row.rangeKm < best.rangeKm ? row : best);
  const preferred = pass.filter(
    (row) => row.elevationDeg >= scenario.preferredElevationDeg,
  );
  return {
    passId,
    aosUtc: pass[0].timeUtc,
    losUtc: pass.at(-1).timeUtc,
    durationSeconds: (pass.at(-1).timeMs - pass[0].timeMs) / 1000,
    maxElevationDeg: maxElevationSample.elevationDeg,
    maxElevationTimeUtc: maxElevationSample.timeUtc,
    minRangeKm: minRangeSample.rangeKm,
    preferredStartUtc: preferred.length ? preferred[0].timeUtc : '',
    preferredStopUtc: preferred.length ? preferred.at(-1).timeUtc : '',
    preferredDurationSeconds: preferred.length
      ? (preferred.at(-1).timeMs - preferred[0].timeMs) / 1000
      : 0,
    samples: pass,
  };
}

function csvEscape(value) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function writeCsv(filename, headers, rows) {
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((header) => csvEscape(row[header])).join(','));
  }
  fs.writeFileSync(path.join(dataDir, filename), `${lines.join('\n')}\n`);
}

const rawPasses = [];
let activePass = [];
for (
  let timeMs = scenario.startUtc.getTime();
  timeMs <= scenario.stopUtc.getTime();
  timeMs += scenario.stepSeconds * 1000
) {
  const sample = sampleAt(new Date(timeMs));
  if (sample.elevationDeg >= 0) {
    activePass.push(sample);
  } else if (activePass.length) {
    rawPasses.push(activePass);
    activePass = [];
  }
}
if (activePass.length) rawPasses.push(activePass);

const passSummaries = rawPasses.map((pass, index) => summarizePass(pass, index + 1));
if (!passSummaries.length) throw new Error('No visible pass was found in the scenario interval.');
const bestPass = passSummaries.reduce((best, item) =>
  item.maxElevationDeg > best.maxElevationDeg ? item : best);

const speedOfLightMps = 299792458;
const boltzmann = 1.380649e-23;
const rf = scenario.rf;
const frequencyHz = rf.frequencyMHz * 1e6;
const equivalentLnaTemperatureK = 290 * (10 ** (rf.lnaNoiseFigureDb / 10) - 1);
const systemNoiseTemperatureK = rf.antennaNoiseTemperatureK + equivalentLnaTemperatureK;
const noisePowerW = boltzmann * systemNoiseTemperatureK * rf.receiverBandwidthHz;
const noisePowerDbm = 10 * Math.log10(noisePowerW * 1000);

const detailedRows = bestPass.samples.map((row, index, rows) => {
  const previous = rows[Math.max(0, index - 1)];
  const next = rows[Math.min(rows.length - 1, index + 1)];
  const elapsedSeconds = Math.max(1, (next.timeMs - previous.timeMs) / 1000);
  const radialVelocityKmS = (next.rangeKm - previous.rangeKm) / elapsedSeconds;
  const dopplerHz = -(radialVelocityKmS * 1000 / speedOfLightMps) * frequencyHz;
  const fsplDb = 32.44 + 20 * Math.log10(rf.frequencyMHz) + 20 * Math.log10(row.rangeKm);
  const receivedPowerDbm = rf.assumedSatelliteEirpDbw + 30
    + rf.receiveAntennaGainDbi - fsplDb - rf.implementationLossDb;
  const cnDb = receivedPowerDbm - noisePowerDbm;
  return {
    time_utc: row.timeUtc,
    azimuth_deg: row.azimuthDeg.toFixed(6),
    elevation_deg: row.elevationDeg.toFixed(6),
    range_km: row.rangeKm.toFixed(6),
    radial_velocity_km_s: radialVelocityKmS.toFixed(9),
    doppler_hz: dopplerHz.toFixed(3),
    fspl_db: fsplDb.toFixed(6),
    received_power_dbm: receivedPowerDbm.toFixed(6),
    noise_power_dbm: noisePowerDbm.toFixed(6),
    cn_db: cnDb.toFixed(6),
    satellite_latitude_deg: row.satelliteLatitudeDeg.toFixed(6),
    satellite_longitude_deg: row.satelliteLongitudeDeg.toFixed(6),
    satellite_altitude_km: row.satelliteAltitudeKm.toFixed(6),
  };
});

writeCsv(
  'pass_summary.csv',
  [
    'pass_id', 'aos_utc', 'los_utc', 'duration_s', 'max_elevation_deg',
    'max_elevation_time_utc', 'min_range_km', 'preferred_start_utc',
    'preferred_stop_utc', 'preferred_duration_s',
  ],
  passSummaries.map((item) => ({
    pass_id: item.passId,
    aos_utc: item.aosUtc,
    los_utc: item.losUtc,
    duration_s: item.durationSeconds.toFixed(0),
    max_elevation_deg: item.maxElevationDeg.toFixed(6),
    max_elevation_time_utc: item.maxElevationTimeUtc,
    min_range_km: item.minRangeKm.toFixed(6),
    preferred_start_utc: item.preferredStartUtc,
    preferred_stop_utc: item.preferredStopUtc,
    preferred_duration_s: item.preferredDurationSeconds.toFixed(0),
  })),
);

writeCsv('best_pass_aer_link.csv', Object.keys(detailedRows[0]), detailedRows);

const peakCn = detailedRows.reduce((best, row) =>
  Number(row.cn_db) > Number(best.cn_db) ? row : best);
const maxAbsDoppler = detailedRows.reduce((best, row) =>
  Math.abs(Number(row.doppler_hz)) > Math.abs(Number(best.doppler_hz)) ? row : best);

const summary = {
  satellite: satelliteName,
  noradCatalogId: 28654,
  tleEpoch: '2025-01-10T03:17:10.617Z',
  scenarioStartUtc: scenario.startUtc.toISOString(),
  scenarioStopUtc: scenario.stopUtc.toISOString(),
  groundStation: scenario.groundStation,
  preferredElevationDeg: scenario.preferredElevationDeg,
  rfAssumptions: {
    ...rf,
    systemNoiseTemperatureK,
    noisePowerDbm,
  },
  selectedPass: {
    passId: bestPass.passId,
    aosUtc: bestPass.aosUtc,
    losUtc: bestPass.losUtc,
    durationSeconds: bestPass.durationSeconds,
    maxElevationDeg: bestPass.maxElevationDeg,
    maxElevationTimeUtc: bestPass.maxElevationTimeUtc,
    minRangeKm: bestPass.minRangeKm,
    preferredStartUtc: bestPass.preferredStartUtc,
    preferredStopUtc: bestPass.preferredStopUtc,
    preferredDurationSeconds: bestPass.preferredDurationSeconds,
    peakCnDb: Number(peakCn.cn_db),
    maximumAbsoluteDopplerHz: Math.abs(Number(maxAbsDoppler.doppler_hz)),
  },
};
fs.writeFileSync(
  path.join(dataDir, 'analysis_summary.json'),
  `${JSON.stringify(summary, null, 2)}\n`,
);

console.log(JSON.stringify(summary, null, 2));
