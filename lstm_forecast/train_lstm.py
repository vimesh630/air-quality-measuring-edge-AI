# Imports
import pandas as pd
import numpy as np
import os
import glob
import matplotlib.pyplot as plt
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import pickle
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout

print("="*50)
print("AQI LSTM Time-Series Forecasting Pipeline")
print("="*50)

# Setup paths relative to this script
import os
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
data_dir = os.path.abspath(os.path.join(BASE_DIR, '..', '..', 'PRSA_Data_20130301-20170228'))
out_dir  = os.path.join(BASE_DIR, 'output')
os.makedirs(out_dir, exist_ok=True)

# Parameters
SEQUENCE_LENGTH = 24  # 24 hours lookback
PREDICT_DISTANCE = 1  # Predict 1 hour ahead
FEATURES = ['temperature', 'humidity', 'aqi']

# Load & Process dataset
print("Loading CSV files from:", data_dir)
all_files = glob.glob(os.path.join(data_dir, "*.csv"))
if not all_files:
    print(f"ERROR: No CSV files found in {data_dir}")
    exit(1)

X_list, y_list = [], []
scaler = MinMaxScaler()
all_data = []

def calc_humidity(temp, dewp):
    # Magnus formula for relative humidity
    return 100 * np.exp((17.625 * dewp) / (243.04 + dewp)) / np.exp((17.625 * temp) / (243.04 + temp))

print(f"Processing {len(all_files)} stations...")
for f in all_files:
    df = pd.read_csv(f)
    # Parse chronological timeline
    df['datetime'] = pd.to_datetime(df[['year', 'month', 'day', 'hour']])
    df = df.sort_values('datetime').reset_index(drop=True)
    
    # Calculate humidity from Dew Point and Temp
    df['humidity'] = calc_humidity(df['TEMP'], df['DEWP'])
    df['humidity'] = df['humidity'].clip(0, 100)
    
    # Extract specific features
    df_feat = df[['TEMP', 'humidity', 'PM2.5']].copy()
    df_feat.columns = FEATURES
    
    # Time-series safe interpolation (prevents breaking sequences unlike dropping NAs)
    df_feat = df_feat.interpolate(method='linear').bfill().ffill()
    all_data.append(df_feat.values)

print("Fitting MinMaxScaler only on the first 80% of chronological data...")
full_raw_stack = np.vstack(all_data)
train_limit    = int(len(full_raw_stack) * 0.8)
scaler.fit(full_raw_stack[:train_limit])

print("Extracting X, y sliding windows (this may take a moment)...")
for station_data in all_data:
    scaled = scaler.transform(station_data)
    
    # Stacking sliding windows 
    # Shape: (samples, sequence_length, features)
    X, y = [], []
    for i in range(len(scaled) - SEQUENCE_LENGTH - PREDICT_DISTANCE):
        X.append(scaled[i : i + SEQUENCE_LENGTH])
        # Target: Next hour's PM2.5 (index 2)
        y.append(scaled[i + SEQUENCE_LENGTH + PREDICT_DISTANCE - 1, 2]) 
        
    X_list.append(np.array(X, dtype=np.float32))
    y_list.append(np.array(y, dtype=np.float32))

X_all = np.concatenate(X_list)
y_all = np.concatenate(y_list)

print(f"Total Sequences Created: {X_all.shape[0]:,}")

# Memory cleanup
del X_list, y_list, all_data

# Train Test Split (Time-series specific: preserve chronological order, avoid random split shuffling)
split_idx = int(len(X_all) * 0.8)
X_train, y_train = X_all[:split_idx], y_all[:split_idx]
X_test, y_test = X_all[split_idx:], y_all[split_idx:]

print(f"X_train shape: {X_train.shape}")
print(f"X_test shape: {X_test.shape}")