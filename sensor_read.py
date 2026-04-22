{
  "nbformat": 4,
  "nbformat_minor": 0,
  "metadata": {
    "colab": {
      "provenance": [],
      "authorship_tag": "ABX9TyNVLc8cFISz6s5oSmIWmSqD",
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
        "# AQI calculation from gas readings\n",
        "def calculate_aqi(co2_ppm, co_ppm, nh3_ppm):\n",
        "    \"\"\"Calculate a simple AQI score (0-100) from gas readings.\"\"\"\n",
        "    co2_score = min((co2_ppm - 400) / 16, 100)\n",
        "    co_score  = min(co_ppm * 2, 100)\n",
        "    nh3_score = min(nh3_ppm * 5, 100)\n",
        "    aqi = (co2_score * 0.5) + (co_score * 0.3) + (nh3_score * 0.2)\n",
        "    return round(max(0.0, min(100.0, aqi)), 1)\n"
      ],
      "metadata": {
        "id": "wxlXGkqMUOn_"
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
        "    \"\"\"Reads real sensors and computes exactly what the classifier expects.\"\"\"\n",
        "    # Read DHT22\n",
        "    try:\n",
        "        temperature = dht.temperature\n",
        "        humidity    = dht.humidity\n",
        "    except RuntimeError:\n",
        "        return None\n",
        "\n",
        "    if temperature is None or humidity is None:\n",
        "        return None\n",
        "\n",
        "    # Smooth the analog voltage reading to eliminate noise spikes\n",
        "    voltage = get_smoothed_voltage(chan, samples=10)\n",
        "\n",
        "    # Estimate gas concentrations using the smoothed signal\n",
        "    co2_ppm = estimate_co2_ppm(voltage)\n",
        "    co_ppm  = estimate_co_ppm(voltage)\n",
        "    nh3_ppm = estimate_nh3_ppm(voltage)\n",
        "\n",
        "    # Calculate AQI\n",
        "    aqi     = calculate_aqi(co2_ppm, co_ppm, nh3_ppm)\n",
        "    raw_aqi = int(aqi * 10.23)\n",
        "\n",
        "    return {\n",
        "        \"temperature\": round(float(temperature), 1),\n",
        "        \"humidity\":    round(float(humidity),    1),\n",
        "        \"aqi\":         aqi,\n",
        "        \"raw_aqi\":     raw_aqi,\n",
        "        \"co2_ppm\":     co2_ppm,\n",
        "        \"co_ppm\":      co_ppm,\n",
        "        \"nh3_ppm\":     nh3_ppm\n",
        "    }\n"
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
        "    print(\"Real hardware sensor test — 5 readings:\\n\")\n",
        "    for i in range(5):\n",
        "        data = read_sensors()\n",
        "        if data:\n",
        "            print(f\"  Reading {i+1}:\")\n",
        "            print(f\"    Temp     : {data['temperature']}°C\")\n",
        "            print(f\"    Humidity : {data['humidity']}%\")\n",
        "            print(f\"    AQI      : {data['aqi']}\")\n",
        "            print(f\"    CO2      : {data['co2_ppm']} ppm\")\n",
        "            print(f\"    CO       : {data['co_ppm']} ppm\")\n",
        "            print(f\"    NH3      : {data['nh3_ppm']} ppm\")\n",
        "            print()\n",
        "        else:\n",
        "            print(f\"  Reading {i+1}: Sensor error — retrying...\")\n",
        "        time.sleep(2)\n",
        "    print(\"Real hardware test complete!\")\n"
      ],
      "metadata": {
        "id": "my8XqDWjGxq3"
      },
      "execution_count": null,
      "outputs": []
    }
  ]
}