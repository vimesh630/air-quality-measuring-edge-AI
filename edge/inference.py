# edge/inference.py
# Runs continuously on the Raspberry Pi (or laptop with simulator)
# Reads sensors → normalises → runs TFLite inference → prints prediction
#
# Run this: python edge/inference.py

import sys
import os
import time
import json
import pickle
import numpy as np
from datetime import datetime

# Add project root to path so we can import sensor_read.py
sys.path.insert(0, os.path.abspath(
    os.path.join(os.path.dirname(__file__), '..')
))
from sensor_read import read_sensors

# TFLite import — works on Windows and Raspberry Pi
try:
    import tflite_runtime.interpreter as tflite
except ModuleNotFoundError:
    try:
        from tensorflow.lite.python.interpreter import Interpreter as _Interp
    except ImportError:
        import tensorflow as tf
        _Interp = tf.lite.Interpreter
    class tflite:
        Interpreter = _Interp

# ─────────────────────────────────────────
# Configuration
# ─────────────────────────────────────────
MODEL_PATH   = os.path.join(os.path.dirname(__file__),
                            '..', 'model', 'classifier', 'output', 'aqm_model.tflite')
SCALER_PATH  = os.path.join(os.path.dirname(__file__),
                            '..', 'model', 'classifier', 'output', 'scaler.pkl')
ENCODER_PATH = os.path.join(os.path.dirname(__file__),
                            '..', 'model', 'classifier', 'output', 'label_encoder.pkl')

SAMPLE_INTERVAL = 2
ALERT_LABEL     = 'poor'

GREEN  = '\033[92m'
YELLOW = '\033[93m'
RED    = '\033[91m'
RESET  = '\033[0m'
BOLD   = '\033[1m'

# ─────────────────────────────────────────
# Load model and preprocessing objects
# ─────────────────────────────────────────
def load_model():
    print("Loading model...")

    interpreter = tflite.Interpreter(
        model_path=os.path.abspath(MODEL_PATH)
    )
    interpreter.allocate_tensors()
    input_details  = interpreter.get_input_details()
    output_details = interpreter.get_output_details()

    with open(os.path.abspath(SCALER_PATH), 'rb') as f:
        scaler = pickle.load(f)

    with open(os.path.abspath(ENCODER_PATH), 'rb') as f:
        le = pickle.load(f)

    print(f"Model loaded successfully.")
    print(f"Classes : {list(le.classes_)}")
    print(f"Input   : {input_details[0]['shape']}")
    print(f"Output  : {output_details[0]['shape']}\n")

    return interpreter, input_details, output_details, scaler, le