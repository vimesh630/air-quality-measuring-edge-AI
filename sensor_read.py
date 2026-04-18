{
  "nbformat": 4,
  "nbformat_minor": 0,
  "metadata": {
    "colab": {
      "provenance": [],
      "authorship_tag": "ABX9TyOlS8x8luqjMii0xNtix29A",
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
    }
  ]
}