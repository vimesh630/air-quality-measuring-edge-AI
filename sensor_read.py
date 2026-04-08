# sensor_read.py
# Sensor simulator — replace this file with real hardware version on Day 5
# This file is imported by inference.py — do not rename it

import random
import math
import time

_t = 0  # internal time counter for smooth realistic drift

# ─────────────────────────────────────────
# MQ-135 calibration constants
# ─────────────────────────────────────────
MQ135_RL = 10.0    # load resistance in kΩ
MQ135_RO = 76.63   # sensor resistance in clean air (baseline)

def get_resistance(raw_adc):
    """Convert raw ADC reading (0–1023) to sensor resistance Rs in kΩ."""
    if raw_adc <= 0:
        raw_adc = 1
    voltage = (raw_adc / 1023.0) * 5.0
    if voltage <= 0:
        voltage = 0.001
    rs = ((5.0 * MQ135_RL) / voltage) - MQ135_RL
    return max(rs, 0.001)

def estimate_co2_ppm(raw_adc):
    """Estimate CO2 concentration in ppm from MQ-135 sensitivity curve."""
    rs    = get_resistance(raw_adc)
    ratio = rs / MQ135_RO
    ppm   = 116.6020682 * math.pow(ratio, -2.769034857)
    return round(max(400.0, ppm), 1)   # indoor CO2 baseline ~400 ppm

def estimate_co_ppm(raw_adc):
    """Estimate CO (carbon monoxide) concentration in ppm."""
    rs    = get_resistance(raw_adc)
    ratio = rs / MQ135_RO
    ppm   = 605.18 * math.pow(ratio, -3.937)
    return round(max(0.0, ppm), 1)

def estimate_nh3_ppm(raw_adc):
    """Estimate NH3 (ammonia) concentration in ppm."""
    rs    = get_resistance(raw_adc)
    ratio = rs / MQ135_RO
    ppm   = 102.2 * math.pow(ratio, -2.473)
    return round(max(0.0, ppm), 1)


# ─────────────────────────────────────────
# Main sensor reading function
# ─────────────────────────────────────────
def read_sensors():
    """
    Simulates DHT22 + MQ-135 sensor readings including individual
    gas concentration estimates.
    Returns a dict matching exactly what the real hardware version returns.
    On Day 5 this entire file gets replaced with the real sensor version.
    """
    global _t
    _t += 1

    # Temperature drifts smoothly between 22–30°C
    temperature = round(
        26 + 4 * math.sin(_t / 30) + random.uniform(-0.3, 0.3), 1
    )

    # Humidity drifts inversely to temperature (45–75%)
    humidity = round(
        60 - 6 * math.sin(_t / 30) + random.uniform(-0.5, 0.5), 1
    )
    humidity = max(0.0, min(100.0, humidity))

    # AQI — mostly normal with occasional spikes to simulate
    # cooking smoke, cleaning products etc.
    spike = random.random() < 0.08   # 8% chance of spike
    if spike:
        aqi = round(random.uniform(60, 95), 1)
    else:
        aqi = round(
            28 + 12 * math.sin(_t / 50) + random.uniform(-2, 2), 1
        )
    aqi = max(0.0, min(100.0, aqi))

    # Convert AQI percentage back to a raw ADC value for gas calculations
    raw_aqi = int(aqi * 10.23)

    # Estimate individual gas concentrations from raw ADC reading
    co2_ppm = estimate_co2_ppm(raw_aqi)
    co_ppm  = estimate_co_ppm(raw_aqi)
    nh3_ppm = estimate_nh3_ppm(raw_aqi)

    return {
        "temperature": temperature,
        "humidity":    humidity,
        "aqi":         aqi,
        "raw_aqi":     raw_aqi,
        "co2_ppm":     co2_ppm,
        "co_ppm":      co_ppm,
        "nh3_ppm":     nh3_ppm
    }


# ─────────────────────────────────────────
# Quick test
# ─────────────────────────────────────────
if __name__ == "__main__":
    print("Sensor simulator test — 5 readings:\n")
    for i in range(5):
        data = read_sensors()
        print(f"  Reading {i+1}:")
        print(f"    Temp      : {data['temperature']}°C")
        print(f"    Humidity  : {data['humidity']}%")
        print(f"    AQI       : {data['aqi']}")
        print(f"    CO2       : {data['co2_ppm']} ppm")
        print(f"    CO        : {data['co_ppm']} ppm")
        print(f"    NH3       : {data['nh3_ppm']} ppm")
        print()
        time.sleep(0.5)
    print("Simulator working correctly.")