<<<<<<< HEAD
{
  "nbformat": 4,
  "nbformat_minor": 0,
  "metadata": {
    "colab": {
      "provenance": [],
      "authorship_tag": "ABX9TyMLLx2TDjsv8cU2OPWl+vE2",
      "include_colab_link": true
    },
    "kernelspec": {
      "name": "python3",
      "display_name": "Python 3"
    },
    "language_info": {
      "name": "python"
    }
  },
  "cells": [
    {
      "cell_type": "markdown",
      "metadata": {
        "id": "view-in-github",
        "colab_type": "text"
      },
      "source": [
        "<a href=\"https://colab.research.google.com/github/vimesh630/air-quality-measuring-edge-AI/blob/feature%2Fhardware-sensors/sensor_read.py\" target=\"_parent\"><img src=\"https://colab.research.google.com/assets/colab-badge.svg\" alt=\"Open In Colab\"/></a>"
      ]
    },
    {
      "cell_type": "code",
      "execution_count": null,
      "metadata": {
        "id": "ojkTy9fJ_qEz"
      },
      "outputs": [],
      "source": [
        "import board\n",
        "import busio\n",
        "import math\n",
        "import time\n",
        "import adafruit_dht\n",
        "from adafruit_ads1x15.ads1115 import ADS1115\n",
        "from adafruit_ads1x15.analog_in import AnalogIn\n"
      ]
    },
    {
      "cell_type": "code",
      "source": [
        "# Hardware setup\n",
        "dht  = adafruit_dht.DHT22(board.D4)\n",
        "i2c  = busio.I2C(board.SCL, board.SDA)\n",
        "ads  = ADS1115(i2c)\n",
        "chan = AnalogIn(ads, 0)\n"
      ],
      "metadata": {
        "id": "a9n9Mxl1RJxS"
      },
      "execution_count": null,
      "outputs": []
    },
    {
      "cell_type": "code",
      "source": [
        "# MQ-135 calibration constants\n",
        "\n",
        "MQ135_RL = 10.0    # load resistance in kΩ\n",
        "MQ135_RO = 9.55    # sensor resistance in clean air (baseline)\n",
        "VREF     = 3.3     # ADS1115 reference voltage\n",
        "\n",
        "def get_smoothed_voltage(channel, samples=10, delay=0.01):\n",
        "    \"\"\"Takes multiple readings and averages them to eliminate analog noise/mains hum.\"\"\"\n",
        "    total = 0.0\n",
        "    for _ in range(samples):\n",
        "        total += channel.voltage\n",
        "        time.sleep(delay)\n",
        "    return total / samples\n"
      ],
      "metadata": {
        "id": "JtlEMBEeDcdq"
      },
      "execution_count": null,
      "outputs": []
    },
    {
      "cell_type": "code",
      "source": [
        "# MQ-135 gas estimation functions\n",
        "\n",
        "def get_resistance(voltage):\n",
        "    \"\"\"Convert voltage reading to sensor resistance Rs in kΩ.\"\"\"\n",
        "    if voltage <= 0:\n",
        "        voltage = 0.001\n",
        "    # Scale voltage back to 5V range (voltage divider compensation)\n",
        "    voltage_5v = voltage * (20 / 10)\n",
        "    if voltage_5v <= 0:\n",
        "        voltage_5v = 0.001\n",
        "    rs = ((5.0 * MQ135_RL) / voltage_5v) - MQ135_RL\n",
        "    return max(rs, 0.001)\n",
        "\n",
        "def estimate_co2_ppm(voltage):\n",
        "    \"\"\"Estimate CO2 concentration in ppm from MQ-135.\"\"\"\n",
        "    rs    = get_resistance(voltage)\n",
        "    ratio = rs / MQ135_RO\n",
        "    ppm   = 116.6020682 * math.pow(ratio, -2.769034857)\n",
        "    return round(max(400.0, ppm), 1)\n",
        "\n",
        "def estimate_co_ppm(voltage):\n",
        "    \"\"\"Estimate CO concentration in ppm from MQ-135.\"\"\"\n",
        "    rs    = get_resistance(voltage)\n",
        "    ratio = rs / MQ135_RO\n",
        "    ppm   = 605.18 * math.pow(ratio, -3.937)\n",
        "    return round(max(0.0, ppm), 1)\n",
        "\n",
        "\n",
        "def estimate_nh3_ppm(voltage):\n",
        "    \"\"\"Estimate NH3 concentration in ppm from MQ-135.\"\"\"\n",
        "    rs    = get_resistance(voltage)\n",
        "    ratio = rs / MQ135_RO\n",
        "    ppm   = 102.2 * math.pow(ratio, -2.473)\n",
        "    return round(max(0.0, ppm), 1)\n"
      ],
      "metadata": {
        "id": "0xyXvf0GSR32"
      },
      "execution_count": null,
      "outputs": []
    },
    {
      "cell_type": "code",
      "source": [
        "# Main sensor reading function\n",
        "\n",
        "def read_sensors():\n",
        "    \"\"\"\n",
        "    Simulates DHT22 + MQ-135 sensor readings including individual\n",
        "    gas concentration estimates.\n",
        "    Returns a dict matching exactly what the real hardware version returns.\n",
        "    On Day 5 this entire file gets replaced with the real sensor version.\n",
        "    \"\"\"\n",
        "    global _t\n",
        "    _t += 1\n",
        "\n",
        "     # Temperature drifts smoothly between 22–30°C\n",
        "    temperature = round(\n",
        "        26 + 4 * math.sin(_t / 30) + random.uniform(-0.3, 0.3), 1\n",
        "    )\n",
        "\n",
        "    # Humidity drifts inversely to temperature (45–75%)\n",
        "    humidity = round(\n",
        "        60 - 6 * math.sin(_t / 30) + random.uniform(-0.5, 0.5), 1\n",
        "    )\n",
        "    humidity = max(0.0, min(100.0, humidity))\n",
        "\n",
        "    # AQI — mostly normal with occasional spikes to simulate\n",
        "    # cooking smoke, cleaning products etc.\n",
        "    spike = random.random() < 0.08   # 8% chance of spike\n",
        "    if spike:\n",
        "        aqi = round(random.uniform(60, 95), 1)\n",
        "    else:\n",
        "        aqi = round(\n",
        "            28 + 12 * math.sin(_t / 50) + random.uniform(-2, 2), 1\n",
        "        )\n",
        "    aqi = max(0.0, min(100.0, aqi))\n",
        "\n",
        "    # Convert AQI percentage back to a raw ADC value for gas calculations\n",
        "    raw_aqi = int(aqi * 10.23)\n",
        "\n",
        "    # Estimate individual gas concentrations from raw ADC reading\n",
        "    co2_ppm = estimate_co2_ppm(raw_aqi)\n",
        "    co_ppm  = estimate_co_ppm(raw_aqi)\n",
        "    nh3_ppm = estimate_nh3_ppm(raw_aqi)\n",
        "\n",
        "    return {\n",
        "        \"temperature\": temperature,\n",
        "        \"humidity\":    humidity,\n",
        "        \"aqi\":         aqi,\n",
        "        \"raw_aqi\":     raw_aqi,\n",
        "        \"co2_ppm\":     co2_ppm,\n",
        "        \"co_ppm\":      co_ppm,\n",
        "        \"nh3_ppm\":     nh3_ppm\n",
        "    }\n",
        "\n"
      ],
      "metadata": {
        "id": "HuCg1U5GF47K"
      },
      "execution_count": null,
      "outputs": []
    },
    {
      "cell_type": "code",
      "source": [
        "# Quick test\n",
        "\n",
        "if __name__ == \"__main__\":\n",
        "    print(\"Sensor simulator test — 5 readings:\\n\")\n",
        "    for i in range(5):\n",
        "        data = read_sensors()\n",
        "        print(f\"  Reading {i+1}:\")\n",
        "        print(f\"    Temp      : {data['temperature']}°C\")\n",
        "        print(f\"    Humidity  : {data['humidity']}%\")\n",
        "        print(f\"    AQI       : {data['aqi']}\")\n",
        "        print(f\"    CO2       : {data['co2_ppm']} ppm\")\n",
        "        print(f\"    CO        : {data['co_ppm']} ppm\")\n",
        "        print(f\"    NH3       : {data['nh3_ppm']} ppm\")\n",
        "        print()\n",
        "        time.sleep(0.5)\n",
        "    print(\"Simulator working correctly.\")"
      ],
      "metadata": {
        "id": "my8XqDWjGxq3"
      },
      "execution_count": null,
      "outputs": []
    }
  ]
}
=======
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
>>>>>>> origin/develop
