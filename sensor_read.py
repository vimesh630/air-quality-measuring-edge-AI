# sensor_read.py
# Real hardware version — DHT22 + MQ-135 via ADS1115
# This file is imported by inference.py — do not rename it

import board
import busio
import math
import time
import adafruit_dht
from adafruit_ads1x15.ads1115 import ADS1115
from adafruit_ads1x15.analog_in import AnalogIn

# ─────────────────────────────────────────
# Hardware setup
# ─────────────────────────────────────────
dht  = adafruit_dht.DHT22(board.D4)
i2c  = busio.I2C(board.SCL, board.SDA)
ads  = ADS1115(i2c)
chan = AnalogIn(ads, 0)

# ─────────────────────────────────────────
# MQ-135 calibration constants
# ─────────────────────────────────────────
MQ135_RL = 10.0    # load resistance in kΩ
MQ135_RO = 9.55    # sensor resistance in clean air (baseline)
VREF     = 3.3     # ADS1115 reference voltage

def get_smoothed_voltage(channel, samples=10, delay=0.01):
    """Takes multiple readings and averages them to eliminate analog noise/mains hum."""
    total = 0.0
    for _ in range(samples):
        total += channel.voltage
        time.sleep(delay)
    return total / samples

# ─────────────────────────────────────────
# MQ-135 gas estimation functions
# ─────────────────────────────────────────
def get_resistance(voltage):
    """Convert voltage reading to sensor resistance Rs in kΩ."""
    if voltage <= 0:
        voltage = 0.001
    # Scale voltage back to 5V range (voltage divider compensation)
    voltage_5v = voltage * (20 / 10)
    if voltage_5v <= 0:
        voltage_5v = 0.001
    rs = ((5.0 * MQ135_RL) / voltage_5v) - MQ135_RL
    return max(rs, 0.001)

def estimate_co2_ppm(voltage):
    """Estimate CO2 concentration in ppm from MQ-135."""
    rs    = get_resistance(voltage)
    ratio = rs / MQ135_RO
    ppm   = 116.6020682 * math.pow(ratio, -2.769034857)
    return round(max(400.0, ppm), 1)

def estimate_co_ppm(voltage):
    """Estimate CO concentration in ppm from MQ-135."""
    rs    = get_resistance(voltage)
    ratio = rs / MQ135_RO
    ppm   = 605.18 * math.pow(ratio, -3.937)
    return round(max(0.0, ppm), 1)

def estimate_nh3_ppm(voltage):
    """Estimate NH3 concentration in ppm from MQ-135."""
    rs    = get_resistance(voltage)
    ratio = rs / MQ135_RO
    ppm   = 102.2 * math.pow(ratio, -2.473)
    return round(max(0.0, ppm), 1)

# ─────────────────────────────────────────
# AQI calculation from gas readings
# ─────────────────────────────────────────
def calculate_aqi(co2_ppm, co_ppm, nh3_ppm):
    """Calculate a simple AQI score (0-100) from gas readings."""
    co2_score = min((co2_ppm - 400) / 16, 100)
    co_score  = min(co_ppm * 2, 100)
    nh3_score = min(nh3_ppm * 5, 100)
    aqi = (co2_score * 0.5) + (co_score * 0.3) + (nh3_score * 0.2)
    return round(max(0.0, min(100.0, aqi)), 1)

# ─────────────────────────────────────────
# Main sensor reading function
# ─────────────────────────────────────────
def read_sensors():
    """Reads real sensors and computes exactly what the classifier expects."""
    # Read DHT22
    try:
        temperature = dht.temperature
        humidity    = dht.humidity
    except RuntimeError:
        return None

    if temperature is None or humidity is None:
        return None

    # Smooth the analog voltage reading to eliminate noise spikes
    voltage = get_smoothed_voltage(chan, samples=10)

    # Estimate gas concentrations using the smoothed signal
    co2_ppm = estimate_co2_ppm(voltage)
    co_ppm  = estimate_co_ppm(voltage)
    nh3_ppm = estimate_nh3_ppm(voltage)

    # Calculate AQI
    aqi     = calculate_aqi(co2_ppm, co_ppm, nh3_ppm)
    raw_aqi = int(aqi * 10.23)

    return {
        "temperature": round(float(temperature), 1),
        "humidity":    round(float(humidity),    1),
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
    print("Real hardware sensor test — 5 readings:\n")
    for i in range(5):
        data = read_sensors()
        if data:
            print(f"  Reading {i+1}:")
            print(f"    Temp     : {data['temperature']}°C")
            print(f"    Humidity : {data['humidity']}%")
            print(f"    AQI      : {data['aqi']}")
            print(f"    CO2      : {data['co2_ppm']} ppm")
            print(f"    CO       : {data['co_ppm']} ppm")
            print(f"    NH3      : {data['nh3_ppm']} ppm")
            print()
        else:
            print(f"  Reading {i+1}: Sensor error — retrying...")
        time.sleep(2)
    print("Real hardware test complete!")
