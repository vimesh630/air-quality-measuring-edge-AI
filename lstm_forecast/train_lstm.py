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

# Train Model
print("\nTraining LSTM Network...")
history = model.fit(
    X_train, y_train,
    epochs=10,           # Updated to 10
    batch_size=128,      # Updated to 128 (Proper LSTM sizing)
    validation_split=0.1,
    verbose=1
)

# Evaluation & Plots
print("\nGenerating Plots & Calculating Metrics...")
plt.figure(figsize=(10, 4))
plt.plot(history.history['loss'], label='Train Loss (MSE)')
plt.plot(history.history['val_loss'], label='Val Loss (MSE)')
plt.title('LSTM Training Loss')
plt.xlabel('Epochs')
plt.ylabel('Mean Squared Error')
plt.legend()
plt.grid(True, alpha=0.3)
plt.tight_layout()
plt.savefig('output/lstm_loss.png', dpi=150)

# Predict on the entire test set using the new batch size
preds_full = model.predict(X_test, batch_size=128)

# Inverse transform predictions and truth to get actual PM2.5 units
dummy_pred = np.zeros((len(preds_full), 3))
dummy_pred[:, 2] = preds_full.flatten()
preds_unscaled = scaler.inverse_transform(dummy_pred)[:, 2]

dummy_truth = np.zeros((len(y_test), 3))
dummy_truth[:, 2] = y_test.flatten()
truth_unscaled = scaler.inverse_transform(dummy_truth)[:, 2]

# Calculate Metrics
mse = mean_squared_error(truth_unscaled, preds_unscaled)
rmse = np.sqrt(mse)
mae = mean_absolute_error(truth_unscaled, preds_unscaled)
r2 = r2_score(truth_unscaled, preds_unscaled)
corr_matrix = np.corrcoef(truth_unscaled, preds_unscaled)
correlation = corr_matrix[0, 1]

# THIS IS THE PRINT BLOCK THAT WAS MISSING
print("\n" + "="*50)
print("TEST SET PERFORMANCE METRICS (Unscaled PM2.5)")
print("="*50)
print(f"RMSE (Root Mean Squared Error): {rmse:.2f}")
print(f"MAE  (Mean Absolute Error):     {mae:.2f}")
print(f"MSE  (Mean Squared Error):      {mse:.2f}")
print(f"R² Score:                       {r2:.4f}")
print(f"Pearson Correlation (r):        {correlation:.4f}")
print("="*50 + "\n")

# Line Plot: True vs Predict on small unseen subset
test_subset_len = 300
plt.figure(figsize=(12, 5))
plt.plot(truth_unscaled[:test_subset_len], label='Actual PM2.5', color='#1D9E75')
plt.plot(preds_unscaled[:test_subset_len], label='LSTM 1-Hour Forecast', color='#BA7517', linestyle='--')
plt.title(f'Prediction Accuracy: Next-Hour PM2.5 Forecast (Sample of {test_subset_len} hours)')
plt.xlabel('Hours from test start')
plt.ylabel('PM2.5 Concentration')
plt.legend()
plt.grid(True, alpha=0.3)
plt.tight_layout()
plt.savefig('output/lstm_forecast_accuracy.png', dpi=150)

# Save Artifacts
print("Saving Models...")
model.save('output/lstm_model.keras') # Saved as .keras to prevent warnings
with open('output/lstm_scaler.pkl', 'wb') as f:
    pickle.dump(scaler, f)
    
print("Exported standard Keras model and scaler.")

# Attempt TFLite conversion
try:
    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    
    # 1. Add Dynamic Range Quantization (reduces size by ~4x)
    converter.optimizations = [tf.lite.Optimize.DEFAULT]
    
    # 2. Target only native TFLite kernels (avoids Flex Ops)
    converter.target_spec.supported_ops = [tf.lite.OpsSet.TFLITE_BUILTINS]
    
    # 3. Enhanced optimization for internal recurrent structures
    converter._experimental_lower_tensor_list_ops = True
    
    tflite_model = converter.convert()
    with open('output/aqm_lstm.tflite', 'wb') as f:
        f.write(tflite_model)
    print("Exported QUANTIZED, NATIVE TFLite model for high-efficiency Edge Inference.")
except Exception as e:
    print(f"\n[Warning] TFLite conversion skipped: {str(e)}")
    print("The primary .keras model is perfectly fine for predictions.")

print("\n" + "="*50)
print("SUCCESS: Full LSTM Pipeline Execution Complete.")
print("Outputs located in c:/Vimesh/AQI/model/lstm_forecast/output/")
print("="*50)