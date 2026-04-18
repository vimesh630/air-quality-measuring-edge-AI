{
  "nbformat": 4,
  "nbformat_minor": 0,
  "metadata": {
    "colab": {
      "provenance": [],
      "authorship_tag": "ABX9TyPZfhRy/ZIf6939As+pqFms",
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
      "source": [],
      "metadata": {
        "id": "yyNU2SuCDhl_"
      },
      "execution_count": null,
      "outputs": []
    }
  ]
}