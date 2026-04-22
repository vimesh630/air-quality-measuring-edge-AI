import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import os
import glob

# ─────────────────────────────────────────
# STEP 1 — Load all 12 CSV files
# ─────────────────────────────────────────
data_path = "model/data/"
all_files = glob.glob(os.path.join(data_path, "PRSA_Data_*.csv"))

print(f"Found {len(all_files)} CSV files\n")

df_list = []
for f in all_files:
    df_list.append(pd.read_csv(f))

df = pd.concat(df_list, ignore_index=True)

print(f"Total rows loaded : {len(df):,}")
print(f"Total columns     : {len(df.columns)}")
print(f"\nColumn names:")
print(list(df.columns))
print(f"\nFirst 3 rows:")
print(df.head(3))

# ─────────────────────────────────────────
# STEP 2 — Check missing values
# ─────────────────────────────────────────
print("\n── Missing values ──────────────────────")
missing = df.isnull().sum()
missing_pct = (missing / len(df) * 100).round(2)

missing_report = pd.DataFrame({
    'missing_count': missing,
    'missing_percent': missing_pct
}).sort_values('missing_percent', ascending=False)

print(missing_report[missing_report['missing_count'] > 0])

# ─────────────────────────────────────────
# STEP 3 — Select relevant columns and clean
# ─────────────────────────────────────────

# Derive relative humidity from temperature and dew point
# using the Magnus formula — standard meteorological method
df['humidity'] = 100 * np.exp(
    (17.625 * df['DEWP']) / (243.04 + df['DEWP'])
) / np.exp(
    (17.625 * df['TEMP']) / (243.04 + df['TEMP'])
)

# Keep only the three columns that match our sensors
df_clean = df[['TEMP', 'humidity', 'PM2.5']].copy()
df_clean.columns = ['temperature', 'humidity', 'aqi']

# Drop rows where any value is missing
before = len(df_clean)
df_clean = df_clean.dropna()
after = len(df_clean)
print(f"\n── Cleaning ────────────────────────────")
print(f"Rows before dropping NaN : {before:,}")
print(f"Rows after dropping NaN  : {after:,}")
print(f"Rows dropped             : {before - after:,}")

# Remove physically impossible values
df_clean = df_clean[
    (df_clean['temperature'] > -30) &
    (df_clean['temperature'] < 60)  &
    (df_clean['humidity'] >= 0)     &
    (df_clean['humidity'] <= 100)   &
    (df_clean['aqi'] >= 0)
]

# Clamp humidity to 0–100 just in case of floating point edge cases
df_clean['humidity'] = df_clean['humidity'].clip(0, 100)

print(f"Rows after removing impossible values : {len(df_clean):,}")
print(f"\n── Summary statistics ──────────────────")
print(df_clean.describe().round(2))

# ─────────────────────────────────────────
# STEP 4 — Create classification labels
# ─────────────────────────────────────────
def assign_label(pm25):
    if pm25 <= 12.0:
        return 'good'
    elif pm25 <= 35.4:
        return 'moderate'
    else:
        return 'poor'

df_clean['label'] = df_clean['aqi'].apply(assign_label)

print(f"\n── Class distribution ──────────────────")
counts = df_clean['label'].value_counts()
pcts   = df_clean['label'].value_counts(normalize=True).mul(100).round(1)

for label in ['good', 'moderate', 'poor']:
    print(f"  {label:<12} {counts[label]:>8,} rows   ({pcts[label]}%)")

print(f"\n  Total        {len(df_clean):>8,} rows")

# ─────────────────────────────────────────
# STEP 5 — Visualise data distributions
# ─────────────────────────────────────────
fig, axes = plt.subplots(1, 3, figsize=(15, 5))
fig.suptitle('Feature distributions by air quality label', fontsize=14)

colors = {'good': '#1D9E75', 'moderate': '#BA7517', 'poor': '#E24B4A'}

# Temperature distribution
for label, color in colors.items():
    subset = df_clean[df_clean['label'] == label]
    axes[0].hist(subset['temperature'], alpha=0.6,
                 label=label, bins=40, color=color)
axes[0].set_title('Temperature (°C)')
axes[0].set_xlabel('Temperature')
axes[0].set_ylabel('Count')
axes[0].legend()

# Humidity distribution
for label, color in colors.items():
    subset = df_clean[df_clean['label'] == label]
    axes[1].hist(subset['humidity'], alpha=0.6,
                 label=label, bins=40, color=color)
axes[1].set_title('Humidity (%)')
axes[1].set_xlabel('Humidity')
axes[1].legend()

# AQI distribution (capped at 200 for readability)
for label, color in colors.items():
    subset = df_clean[df_clean['label'] == label]
    subset_capped = subset[subset['aqi'] <= 200]
    axes[2].hist(subset_capped['aqi'], alpha=0.6,
                 label=label, bins=40, color=color)
axes[2].set_title('AQI / PM2.5 (capped at 200)')
axes[2].set_xlabel('AQI')
axes[2].legend()

plt.tight_layout()
plt.savefig('model/data_distribution.png', dpi=150, bbox_inches='tight')
plt.show()
print("\nPlot saved → model/data_distribution.png")

# ─────────────────────────────────────────
# STEP 6 — Save clean dataset
# ─────────────────────────────────────────
output_path = 'model/data/aqm_clean.csv'
df_clean.to_csv(output_path, index=False)

print(f"\n── Saved ───────────────────────────────")
print(f"Clean dataset saved to : {output_path}")
print(f"Rows                   : {len(df_clean):,}")
print(f"Columns                : {list(df_clean.columns)}")
print(f"\nReady for training tomorrow.")