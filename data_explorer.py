{
  "nbformat": 4,
  "nbformat_minor": 0,
  "metadata": {
    "colab": {
      "provenance": [],
      "authorship_tag": "ABX9TyNJmUyVXUiJXfnqDfzf1beI",
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
    },
    {
      "cell_type": "code",
      "source": [
        "# STEP 4 — Create classification labels\n",
        "\n",
        "def assign_label(pm25):\n",
        "    if pm25 <= 12.0:\n",
        "        return 'good'\n",
        "    elif pm25 <= 35.4:\n",
        "        return 'moderate'\n",
        "    else:\n",
        "        return 'poor'\n",
        "\n",
        "df_clean['label'] = df_clean['aqi'].apply(assign_label)\n",
        "\n",
        "print(f\"\\n── Class distribution ──────────────────\")\n",
        "counts = df_clean['label'].value_counts()\n",
        "pcts   = df_clean['label'].value_counts(normalize=True).mul(100).round(1)\n",
        "\n",
        "for label in ['good', 'moderate', 'poor']:\n",
        "    print(f\"  {label:<12} {counts[label]:>8,} rows   ({pcts[label]}%)\")\n",
        "\n",
        "print(f\"\\n  Total        {len(df_clean):>8,} rows\")\n",
        "\n"
      ],
      "metadata": {
        "id": "Odis9-A_vao3"
      },
      "execution_count": null,
      "outputs": []
    },
    {
      "cell_type": "code",
      "source": [
        "# STEP 5 — Visualise data distributions\n",
        "\n",
        "fig, axes = plt.subplots(1, 3, figsize=(15, 5))\n",
        "fig.suptitle('Feature distributions by air quality label', fontsize=14)\n",
        "\n",
        "colors = {'good': '#1D9E75', 'moderate': '#BA7517', 'poor': '#E24B4A'}\n",
        "\n",
        "# Temperature distribution\n",
        "for label, color in colors.items():\n",
        "    subset = df_clean[df_clean['label'] == label]\n",
        "    axes[0].hist(subset['temperature'], alpha=0.6,\n",
        "                 label=label, bins=40, color=color)\n",
        "axes[0].set_title('Temperature (°C)')\n",
        "axes[0].set_xlabel('Temperature')\n",
        "axes[0].set_ylabel('Count')\n",
        "axes[0].legend()\n",
        "\n",
        "\n",
        "# Humidity distribution\n",
        "for label, color in colors.items():\n",
        "    subset = df_clean[df_clean['label'] == label]\n",
        "    axes[1].hist(subset['humidity'], alpha=0.6,\n",
        "                 label=label, bins=40, color=color)\n",
        "axes[1].set_title('Humidity (%)')\n",
        "axes[1].set_xlabel('Humidity')\n",
        "axes[1].legend()\n",
        "\n",
        "# AQI distribution (capped at 200 for readability)\n",
        "for label, color in colors.items():\n",
        "    subset = df_clean[df_clean['label'] == label]\n",
        "    subset_capped = subset[subset['aqi'] <= 200]\n",
        "    axes[2].hist(subset_capped['aqi'], alpha=0.6,\n",
        "                 label=label, bins=40, color=color)\n",
        "axes[2].set_title('AQI / PM2.5 (capped at 200)')\n",
        "axes[2].set_xlabel('AQI')\n",
        "axes[2].legend()\n",
        "\n",
        "plt.tight_layout()\n",
        "plt.savefig('model/data_distribution.png', dpi=150, bbox_inches='tight')\n",
        "plt.show()\n",
        "print(\"\\nPlot saved → model/data_distribution.png\")\n"
      ],
      "metadata": {
        "id": "eJ93JwMWwhEH"
      },
      "execution_count": null,
      "outputs": []
    },
    {
      "cell_type": "code",
      "source": [
        "# STEP 6 — Save clean dataset\n",
        "\n",
        "output_path = 'model/data/aqm_clean.csv'\n",
        "df_clean.to_csv(output_path, index=False)\n",
        "\n",
        "print(f\"\\n── Saved ───────────────────────────────\")\n",
        "print(f\"Clean dataset saved to : {output_path}\")\n",
        "print(f\"Rows                   : {len(df_clean):,}\")\n",
        "print(f\"Columns                : {list(df_clean.columns)}\")\n",
        "print(f\"\\nReady for training tomorrow.\")"
      ],
      "metadata": {
        "id": "0H-2DIhSxV9C"
      },
      "execution_count": null,
      "outputs": []
    }
  ]
}