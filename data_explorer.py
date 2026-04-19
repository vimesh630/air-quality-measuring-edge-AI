{
  "nbformat": 4,
  "nbformat_minor": 0,
  "metadata": {
    "colab": {
      "provenance": [],
      "authorship_tag": "ABX9TyMzACjKGMSmq7+RkKa1Qs+K",
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
        "<a href=\"https://colab.research.google.com/github/vimesh630/air-quality-measuring-edge-AI/blob/feature%2Faqi-classifier/data_explorer.py\" target=\"_parent\"><img src=\"https://colab.research.google.com/assets/colab-badge.svg\" alt=\"Open In Colab\"/></a>"
      ]
    },
    {
      "cell_type": "code",
      "execution_count": null,
      "metadata": {
        "id": "8emtPWTjgom7"
      },
      "outputs": [],
      "source": [
        "import pandas as pd\n",
        "import numpy as np\n",
        "import matplotlib.pyplot as plt\n",
        "import seaborn as sns\n",
        "import os\n",
        "import glob"
      ]
    },
    {
      "cell_type": "code",
      "source": [
        "# Load all 12 CSV files\n",
        "data_path = \"model/data/\"\n",
        "all_files = glob.glob(os.path.join(data_path, \"PRSA_Data_*.csv\"))\n",
        "\n",
        "print(f\"Found {len(all_files)} CSV files\\n\")\n",
        "\n",
        "df_list = []\n",
        "for f in all_files:\n",
        "    df_list.append(pd.read_csv(f))\n",
        "\n",
        "df = pd.concat(df_list, ignore_index=True)"
      ],
      "metadata": {
        "id": "MuxjSW7jhGOm"
      },
      "execution_count": null,
      "outputs": []
    }
  ]
}