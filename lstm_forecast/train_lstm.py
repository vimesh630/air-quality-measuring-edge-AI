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