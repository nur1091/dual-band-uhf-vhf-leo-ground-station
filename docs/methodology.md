# Methodology and Assumptions

## Scenario definition

- Reference spacecraft: NOAA-18 (NORAD 28654)
- TLE epoch: 10 January 2025, 03:17:10 UTC
- Propagation interval: 10 January 2025, 00:00-24:00 UTC
- Propagator: SGP4 through `satellite.js`
- Ground location: NEU Köyceğiz Campus, Konya
- Approximate coordinates: 37.864722° N, 32.414722° E, 1.011 km
- Geometric horizon: 0° elevation
- Preferred communication mask: 10° elevation

The TLE is from the operational period of NOAA-18 and is propagated only on its epoch day. This limits propagation error and avoids presenting a post-decommission RF scenario as operational reception.

## Pass analysis

The JavaScript analysis propagates the TLE at one-second intervals. For each epoch it converts the satellite position from ECI to ECF and computes azimuth, elevation and slant range relative to the ground location. A pass begins when elevation becomes non-negative and ends when it falls below the geometric horizon.

Two visibility durations are reported:

- Full geometric pass: elevation greater than or equal to 0°.
- Preferred link window: elevation greater than or equal to 10°.

## RF reference model

The RF results are analytical design outputs rather than measured reception data.

| Parameter | Value | Status |
|---|---:|---|
| Center frequency | 137.9125 MHz | Legacy NOAA-18 APT frequency |
| Satellite EIRP | 10 dBW | Design assumption retained from the original study |
| Ground antenna gain | 2.15 dBi | VHF half-wave reference value |
| Implementation loss | 2 dB | Design allowance |
| LNA noise figure | 2.9 dB | ZFL-500LN+ design value |
| Antenna noise temperature | 150 K | Design assumption |
| Receiver noise bandwidth | 40 kHz | Analog VHF receiver assumption |

The original UHF BPF-BV435+ filter is not used in the 137.9125 MHz reference calculation because its passband is incompatible with the VHF APT signal. A VHF-appropriate band-pass filter is required in a physical implementation.

## Equations

Free-space path loss, with frequency in MHz and range in kilometres:

```text
FSPL(dB) = 32.44 + 20 log10(f_MHz) + 20 log10(d_km)
```

Received carrier power:

```text
Pr(dBm) = EIRP(dBW) + 30 + Gr(dBi) - FSPL(dB) - Lsystem(dB)
```

Equivalent receiver noise temperature and system noise temperature:

```text
Te(K)   = 290 [10^(NF/10) - 1]
Tsys(K) = Tantenna + Te
```

Noise power and carrier-to-noise ratio:

```text
N(W)   = k Tsys B
N(dBm) = 10 log10[1000 k Tsys B]
C/N    = Pr(dBm) - N(dBm)
```

First-order Doppler shift from slant-range rate:

```text
fd(Hz) = -(vr/c) f0
```

## Interpretation limits

- NOAA-18 was permanently decommissioned on 6 June 2025. The selected date predates decommissioning.
- NOAA APT is an analog service. The repository therefore reports received power and C/N, not BER or a digital Eb/No requirement.
- Atmospheric fading, polarization mismatch, local obstructions and receiver implementation details are represented only by simplified assumptions.
- The model is not a substitute for RF measurement, antenna characterization or end-to-end field testing.
