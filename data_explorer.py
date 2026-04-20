{
  "nbformat": 4,
  "nbformat_minor": 0,
  "metadata": {
    "colab": {
      "provenance": [],
      "authorship_tag": "ABX9TyM2+kP3EyjEEllGLM854KIT",
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
        "df = pd.concat(df_list, ignore_index=True)\n",
        "\n",
        "print(f\"Total rows loaded : {len(df):,}\")\n",
        "print(f\"Total columns     : {len(df.columns)}\")\n",
        "print(f\"\\nColumn names:\")\n",
        "print(list(df.columns))\n",
        "print(f\"\\nFirst 3 rows:\")\n",
        "print(df.head(3))"
      ],
      "metadata": {
        "id": "MuxjSW7jhGOm"
      },
      "execution_count": null,
      "outputs": []
    },
    {
      "cell_type": "code",
      "source": [
        "# STEP 2 — Check missing values\n",
        "\n",
        "print(\"\\n── Missing values ──────────────────────\")\n",
        "missing = df.isnull().sum()\n",
        "missing_pct = (missing / len(df) * 100).round(2)\n",
        "\n",
        "missing_report = pd.DataFrame({\n",
        "    'missing_count': missing,\n",
        "    'missing_percent': missing_pct\n",
        "}).sort_values('missing_percent', ascending=False)\n",
        "\n",
        "print(missing_report[missing_report['missing_count'] > 0])\n"
      ],
      "metadata": {
        "id": "s9wctqM1q9PC"
      },
      "execution_count": null,
      "outputs": []
    },
    {
      "cell_type": "code",
      "source": [
        "# STEP 3 — Select relevant columns and clean\n",
        "\n",
        "# Derive relative humidity from temperature and dew point\n",
        "# using the Magnus formula — standard meteorological method\n",
        "df['humidity'] = 100 * np.exp(\n",
        "    (17.625 * df['DEWP']) / (243.04 + df['DEWP'])\n",
        ") / np.exp(\n",
        "    (17.625 * df['TEMP']) / (243.04 + df['TEMP'])\n",
        ")\n",
        "\n",
        "# Keep only the three columns that match our sensors\n",
        "df_clean = df[['TEMP', 'humidity', 'PM2.5']].copy()\n",
        "df_clean.columns = ['temperature', 'humidity', 'aqi']\n",
        "\n",
        "# Drop rows where any value is missing\n",
        "before = len(df_clean)\n",
        "df_clean = df_clean.dropna()\n",
        "after = len(df_clean)\n",
        "print(f\"\\n── Cleaning ────────────────────────────\")\n",
        "print(f\"Rows before dropping NaN : {before:,}\")\n",
        "print(f\"Rows after dropping NaN  : {after:,}\")\n",
        "print(f\"Rows dropped             : {before - after:,}\")\n",
        "\n",
        "\n",
        "# Remove physically impossible values\n",
        "df_clean = df_clean[\n",
        "    (df_clean['temperature'] > -30) &\n",
        "    (df_clean['temperature'] < 60)  &\n",
        "    (df_clean['humidity'] >= 0)     &\n",
        "    (df_clean['humidity'] <= 100)   &\n",
        "    (df_clean['aqi'] >= 0)\n",
        "]\n",
        "\n",
        "# Clamp humidity to 0–100 just in case of floating point edge cases\n",
        "df_clean['humidity'] = df_clean['humidity'].clip(0, 100)\n",
        "\n",
        "print(f\"Rows after removing impossible values : {len(df_clean):,}\")\n",
        "print(f\"\\n── Summary statistics ──────────────────\")\n",
        "print(df_clean.describe().round(2))\n",
        "\n"
      ],
      "metadata": {
        "id": "BlIMBX6dt15Y"
      },
      "execution_count": null,
      "outputs": []
    }
  ]
}