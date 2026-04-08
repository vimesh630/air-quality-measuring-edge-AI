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
                            '..', 'model', 'aqm_model.tflite')
SCALER_PATH  = os.path.join(os.path.dirname(__file__),
                            '..', 'model', 'scaler.pkl')
ENCODER_PATH = os.path.join(os.path.dirname(__file__),
                            '..', 'model', 'label_encoder.pkl')

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


# ─────────────────────────────────────────
# Run single inference
# ─────────────────────────────────────────
def predict(interpreter, input_details, output_details,
            scaler, le, temperature, humidity, aqi):

    raw    = np.array([[temperature, humidity, aqi]], dtype=np.float32)
    scaled = scaler.transform(raw).astype(np.float32)

    interpreter.set_tensor(input_details[0]['index'], scaled)
    interpreter.invoke()

    output     = interpreter.get_tensor(output_details[0]['index'])[0]
    pred_idx   = int(np.argmax(output))
    confidence = float(np.max(output))
    label      = le.inverse_transform([pred_idx])[0]

    all_probs = {
        le.classes_[i]: round(float(output[i]) * 100, 1)
        for i in range(len(le.classes_))
    }

    return label, confidence, all_probs


# ─────────────────────────────────────────
# Format and print a reading
# ─────────────────────────────────────────
def print_reading(timestamp, data, label, confidence, all_probs):

    if label == 'good':
        colour = GREEN
    elif label == 'moderate':
        colour = YELLOW
    else:
        colour = RED

    alert_str = f"  {RED}{BOLD}⚠  ALERT — ventilate room{RESET}" \
                if label == ALERT_LABEL else ""

    # Main reading line
    print(
        f"[{timestamp}]  "
        f"Temp: {data['temperature']:5.1f}°C  "
        f"Hum: {data['humidity']:5.1f}%  "
        f"AQI: {data['aqi']:5.1f}  →  "
        f"{colour}{BOLD}{label.upper():<10}{RESET}  "
        f"({confidence*100:.1f}%)"
        f"{alert_str}"
    )

    # Probability breakdown
    prob_str = "  ".join([f"{k}: {v}%" for k, v in all_probs.items()])
    print(f"             Probabilities : {prob_str}")

    # Gas concentration readings
    co2 = data.get('co2_ppm', 0)
    co  = data.get('co_ppm',  0)
    nh3 = data.get('nh3_ppm', 0)
    print(f"             Gases         : "
          f"CO2: {co2} ppm  "
          f"CO: {co} ppm  "
          f"NH3: {nh3} ppm\n")


# ─────────────────────────────────────────
# Build payload for MQTT
# ─────────────────────────────────────────
def build_payload(timestamp, data, label, confidence):
    """
    Build the JSON payload sent to AWS IoT Core.
    Includes all sensor readings and gas concentration estimates.
    """
    return {
        "timestamp":   datetime.now().strftime('%Y-%m-%dT%H:%M:%S'),
        "temperature": data['temperature'],
        "humidity":    data['humidity'],
        "aqi":         data['aqi'],
        "co2_ppm":     data.get('co2_ppm', 0),
        "co_ppm":      data.get('co_ppm',  0),
        "nh3_ppm":     data.get('nh3_ppm', 0),
        "label":       label,
        "confidence":  round(confidence, 4),
        "is_alert":    label == ALERT_LABEL,
        "device_id":   "aqm-pi-device"
    }


# ─────────────────────────────────────────
# Main inference loop
# ─────────────────────────────────────────
def run_inference_loop():
    """Main loop — reads sensors, runs inference, publishes to cloud."""

    # Load model
    interpreter, input_details, output_details, scaler, le = \
        load_model()

    # Connect MQTT
    from cloud.mqtt_publisher import MQTTPublisher
    publisher = MQTTPublisher()

    # Handle commands from dashboard
    def handle_command(command):
        global SAMPLE_INTERVAL
        action = command.get("action", "")

        if action == "read_now":
            print("[CMD] Manual read triggered")

        elif action == "set_interval":
            new_interval = int(command.get("value", 2))
            SAMPLE_INTERVAL = new_interval
            print(f"[CMD] Sampling interval set to {new_interval}s")

        elif action == "retrain":
            print("[CMD] Retraining model...")

        else:
            print(f"[CMD] Unknown command: {action}")

    try:
        publisher.connect()
        publisher.subscribe_commands(handle_command)
    except ConnectionError as e:
        print(f"WARNING: Could not connect to AWS — "
              f"running in offline mode\n{e}")
        publisher = None

    print("=" * 60)
    print("  AQM Edge AI — Live inference running")
    print(f"  Sampling every {SAMPLE_INTERVAL} seconds")
    print(f"  Press Ctrl+C to stop")
    print("=" * 60)
    print()

    reading_count = 0
    alert_count   = 0
    label_counts  = {'good': 0, 'moderate': 0, 'poor': 0}

    try:
        while True:
            timestamp = datetime.now().strftime('%Y-%m-%dT%H:%M:%S')
            data      = read_sensors()

            if data['temperature'] is None:
                print(f"[{timestamp}]  Sensor read error — retrying...")
                time.sleep(SAMPLE_INTERVAL)
                continue

            label, confidence, all_probs = predict(
                interpreter, input_details, output_details,
                scaler, le,
                data['temperature'],
                data['humidity'],
                data['aqi']
            )

            reading_count       += 1
            label_counts[label] += 1
            if label == ALERT_LABEL:
                alert_count += 1

            print_reading(timestamp, data,
                          label, confidence, all_probs)

            payload = build_payload(timestamp, data,
                                    label, confidence)

            if publisher:
                publisher.publish(payload)

            time.sleep(SAMPLE_INTERVAL)

    except KeyboardInterrupt:
        print("\n" + "=" * 60)
        print("  Session summary")
        print("=" * 60)
        print(f"  Total readings : {reading_count}")
        print(f"  Total alerts   : {alert_count}")
        print(f"\n  Label breakdown:")
        for lbl, count in label_counts.items():
            pct = (count / reading_count * 100) if reading_count > 0 else 0
            bar = '█' * int(pct / 5)
            print(f"    {lbl:<12} {count:>5}  ({pct:.1f}%)  {bar}")
        print("=" * 60)
        print("  Inference stopped.")

    finally:
        if publisher:
            publisher.disconnect()


# ─────────────────────────────────────────
# Entry point
# ─────────────────────────────────────────
if __name__ == "__main__":
    run_inference_loop()