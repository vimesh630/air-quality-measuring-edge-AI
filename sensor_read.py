{
  "nbformat": 4,
  "nbformat_minor": 0,
  "metadata": {
    "colab": {
      "provenance": [],
      "authorship_tag": "ABX9TyMd9hxCMH3TtUbSwivIgmVh",
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
        "import random\n",
        "import math\n",
        "import time\n"
      ]
    },
    {
      "cell_type": "code",
      "source": [
        "_t = 0  # internal time counter for smooth realistic drift\n",
        "MQ135_RL = 10.0    # load resistance in kΩ\n",
        "MQ135_RO = 76.63   # sensor resistance in clean air (baseline)"
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
        "def get_resistance(raw_adc):\n",
        "    \"\"\"Convert raw ADC reading (0–1023) to sensor resistance Rs in kΩ.\"\"\"\n",
        "    if raw_adc <= 0:\n",
        "        raw_adc = 1\n",
        "    voltage = (raw_adc / 1023.0) * 5.0\n",
        "    if voltage <= 0:\n",
        "        voltage = 0.001\n",
        "    rs = ((5.0 * MQ135_RL) / voltage) - MQ135_RL\n",
        "    return max(rs, 0.001)"
      ],
      "metadata": {
        "id": "yyNU2SuCDhl_"
      },
      "execution_count": null,
      "outputs": []
    },
    {
      "cell_type": "code",
      "source": [
        "def estimate_co2_ppm(raw_adc):\n",
        "    \"\"\"Estimate CO2 concentration in ppm from MQ-135 sensitivity curve.\"\"\"\n",
        "    rs    = get_resistance(raw_adc)\n",
        "    ratio = rs / MQ135_RO\n",
        "    ppm   = 116.6020682 * math.pow(ratio, -2.769034857)\n",
        "    return round(max(400.0, ppm), 1)   # indoor CO2 baseline ~400 ppm"
      ],
      "metadata": {
        "id": "cEFQEsBnEsca"
      },
      "execution_count": null,
      "outputs": []
    },
    {
      "cell_type": "code",
      "source": [
        "def estimate_co_ppm(raw_adc):\n",
        "    \"\"\"Estimate CO (carbon monoxide) concentration in ppm.\"\"\"\n",
        "    rs    = get_resistance(raw_adc)\n",
        "    ratio = rs / MQ135_RO\n",
        "    ppm   = 605.18 * math.pow(ratio, -3.937)\n",
        "    return round(max(0.0, ppm), 1)\n"
      ],
      "metadata": {
        "id": "CBEQ34z4E3Ov"
      },
      "execution_count": null,
      "outputs": []
    },
    {
      "cell_type": "code",
      "source": [
        "def estimate_nh3_ppm(raw_adc):\n",
        "    \"\"\"Estimate NH3 (ammonia) concentration in ppm.\"\"\"\n",
        "    rs    = get_resistance(raw_adc)\n",
        "    ratio = rs / MQ135_RO\n",
        "    ppm   = 102.2 * math.pow(ratio, -2.473)\n",
        "    return round(max(0.0, ppm), 1)\n"
      ],
      "metadata": {
        "id": "Tbs4C2rRFAMY"
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