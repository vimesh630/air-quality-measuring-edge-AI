# edge/inference.py
# Runs continuously on the Raspberry Pi (or laptop with simulator)
# Reads sensors → normalises → runs TFLite inference → prints prediction
<<<<<<< Updated upstream
=======
# Also subscribes to MQTT commands: read_now, set_interval, retrain
>>>>>>> Stashed changes
#
# Run this: python edge/inference.py

import sys
import os
import time
import json
import pickle
<<<<<<< Updated upstream
import numpy as np
from datetime import datetime

# Add project root to path so we can import sensor_read.py
sys.path.insert(0, os.path.abspath(
    os.path.join(os.path.dirname(__file__), '..')
))
=======
import threading
import numpy as np
from datetime import datetime

# Add project root to path so we can import sensor_read.py and cloud/mqtt_publisher.py
_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, _ROOT)
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
MODEL_PATH   = os.path.join(os.path.dirname(__file__),
                            '..', 'model', 'classifier', 'output', 'aqm_model.tflite')
SCALER_PATH  = os.path.join(os.path.dirname(__file__),
                            '..', 'model', 'classifier', 'output', 'scaler.pkl')
ENCODER_PATH = os.path.join(os.path.dirname(__file__),
                            '..', 'model', 'classifier', 'output', 'label_encoder.pkl')

SAMPLE_INTERVAL = 2
=======
MODEL_PATH   = os.path.join(_ROOT, 'model', 'classifier', 'output', 'aqm_model.tflite')
SCALER_PATH  = os.path.join(_ROOT, 'model', 'classifier', 'output', 'scaler.pkl')
ENCODER_PATH = os.path.join(_ROOT, 'model', 'classifier', 'output', 'label_encoder.pkl')

SAMPLE_INTERVAL = 2      # seconds between readings (mutable via command)
>>>>>>> Stashed changes
ALERT_LABEL     = 'poor'

GREEN  = '\033[92m'
YELLOW = '\033[93m'
RED    = '\033[91m'
RESET  = '\033[0m'
BOLD   = '\033[1m'

# ─────────────────────────────────────────
<<<<<<< Updated upstream
# Load model and preprocessing objects
# ─────────────────────────────────────────
def load_model():
=======
# Mutable runtime state (shared across threads)
# ─────────────────────────────────────────
_lock            = threading.Lock()
_sample_interval = SAMPLE_INTERVAL
_force_read      = threading.Event()  # set to trigger an immediate read
_retrain_pending = threading.Event()  # set when a retrain command arrives

# ─────────────────────────────────────────
# Load model and preprocessing objects
# ─────────────────────────────────────────
def load_model():
    """Load TFLite interpreter, scaler and label encoder from disk."""
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
    return interpreter, input_details, output_details, scaler, le
=======
    return interpreter, input_details, output_details, scaler, le


# ─────────────────────────────────────────
# Inference
# ─────────────────────────────────────────
def predict(interpreter, input_details, output_details, scaler, le, reading):
    """
    Run one inference cycle.

    Parameters
    ----------
    reading : dict with keys temperature, humidity, aqi

    Returns
    -------
    (label: str, confidence: float 0-1, is_alert: bool)
    """
    raw = np.array([[
        reading['temperature'],
        reading['humidity'],
        reading['aqi']
    ]], dtype=np.float32)

    scaled = scaler.transform(raw).astype(np.float32)

    interpreter.set_tensor(input_details[0]['index'], scaled)
    interpreter.invoke()

    output     = interpreter.get_tensor(output_details[0]['index'])[0]
    pred_idx   = int(np.argmax(output))
    label      = le.inverse_transform([pred_idx])[0]
    confidence = float(np.max(output))
    is_alert   = (label == ALERT_LABEL)

    return label, confidence, is_alert


# ─────────────────────────────────────────
# Command handler (called from MQTT thread)
# ─────────────────────────────────────────
def handle_command(command: dict):
    """
    Dispatch incoming MQTT commands.

    Supported actions
    -----------------
    read_now     — trigger an immediate sensor read
    set_interval — change the sampling interval (seconds)
    retrain      — schedule an on-device model retrain
    """
    global _sample_interval

    action = command.get("action", "")
    print(f"\n[CMD] action={action!r}  value={command.get('value')!r}  "
          f"from={command.get('source','?')}")

    if action == "read_now":
        _force_read.set()

    elif action == "set_interval":
        try:
            new_val = int(command.get("value", _sample_interval))
            if new_val < 1:
                new_val = 1
            with _lock:
                _sample_interval = new_val
            print(f"[CMD] Sampling interval updated → {new_val}s")
        except (TypeError, ValueError) as exc:
            print(f"[CMD] Invalid interval value: {exc}")

    elif action == "retrain":
        print("[CMD] On-device retrain requested — scheduling...")
        _retrain_pending.set()

    else:
        print(f"[CMD] Unknown action: {action!r} — ignoring")


# ─────────────────────────────────────────
# Retrain helper (runs in a background thread)
# ─────────────────────────────────────────
def _run_retrain(model_state: list, publisher):
    """
    Called in a background thread when _retrain_pending is set.
    Imports on_device_train, runs retraining, then hot-reloads
    the interpreter in model_state[0..4].
    """
    print("\n" + "=" * 50)
    print("  ON-DEVICE RETRAINING STARTED")
    print("=" * 50)

    try:
        # on_device_train lives next to this file
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
        from on_device_train import retrain

        success, message = retrain()

        if success:
            print(f"\n[RETRAIN] {message}")
            print("[RETRAIN] Hot-reloading model...")

            new_interp, new_in, new_out, new_scaler, new_le = load_model()
            with _lock:
                model_state[0] = new_interp
                model_state[1] = new_in
                model_state[2] = new_out
                model_state[3] = new_scaler
                model_state[4] = new_le

            print("[RETRAIN] Model hot-reloaded — now using the updated classifier.\n")

            if publisher:
                publisher.publish({
                    "device_id": os.getenv("CLIENT_ID", "aqm-pi-device"),
                    "event":     "retrain_complete",
                    "message":   message,
                    "timestamp": datetime.utcnow().isoformat()
                })
        else:
            print(f"\n[RETRAIN] Failed: {message}\n")

    except Exception as exc:
        print(f"\n[RETRAIN] Unexpected error: {exc}\n")
        import traceback; traceback.print_exc()

    print("=" * 50)


# ─────────────────────────────────────────
# Main loop
# ─────────────────────────────────────────
def main():
    global _sample_interval

    # ── Load initial model ───────────────
    # Use a mutable list so background threads can hot-swap components
    model_state = list(load_model())  # [interpreter, in_details, out_details, scaler, le]

    # ── Connect to MQTT (optional — degrades gracefully without it) ──
    publisher = None
    try:
        sys.path.insert(0, os.path.join(_ROOT, 'cloud'))
        from mqtt_publisher import MQTTPublisher
        publisher = MQTTPublisher()
        publisher.connect()
        publisher.subscribe_commands(handle_command)
    except Exception as exc:
        print(f"[MQTT] Could not connect ({exc}) — running in offline mode.\n")
        publisher = None

    print(f"{BOLD}Starting inference loop (interval={_sample_interval}s) …{RESET}\n")
    print(f"{'─' * 50}")

    try:
        while True:
            # ── Check for pending retrain ────────────
            if _retrain_pending.is_set():
                _retrain_pending.clear()
                t = threading.Thread(
                    target=_run_retrain,
                    args=(model_state, publisher),
                    daemon=True
                )
                t.start()

            # ── Read sensors ─────────────────────────
            try:
                reading = read_sensors()
            except Exception as exc:
                print(f"[SENSOR] Read error: {exc}")
                time.sleep(2)
                continue

            # ── Inference ────────────────────────────
            with _lock:
                interp, in_d, out_d, scaler, le = model_state[:5]

            label, confidence, is_alert = predict(
                interp, in_d, out_d, scaler, le, reading
            )

            # ── Colour-coded console output ──────────
            color = GREEN if label == 'good' else (YELLOW if label == 'moderate' else RED)
            ts    = datetime.now().strftime('%H:%M:%S')
            alert_tag = f" {RED}{BOLD}⚠ ALERT{RESET}" if is_alert else ""

            print(
                f"{ts}  "
                f"T={reading['temperature']:.1f}°C  "
                f"H={reading['humidity']:.1f}%  "
                f"AQI={reading['aqi']:.1f}  →  "
                f"{color}{BOLD}{label.upper():<10}{RESET}"
                f"({confidence * 100:.1f}%){alert_tag}"
            )

            # ── Publish to cloud ─────────────────────
            if publisher and publisher.connected:
                payload = {
                    "device_id"  : os.getenv("CLIENT_ID", "aqm-pi-device"),
                    "timestamp"  : datetime.utcnow().isoformat(),
                    "temperature": reading['temperature'],
                    "humidity"   : reading['humidity'],
                    "aqi"        : reading['aqi'],
                    "co2_ppm"    : reading.get('co2_ppm', 0),
                    "co_ppm"     : reading.get('co_ppm', 0),
                    "nh3_ppm"    : reading.get('nh3_ppm', 0),
                    "label"      : label,
                    "confidence" : round(confidence, 4),
                    "is_alert"   : is_alert
                }
                publisher.publish(payload)

            # ── Wait for next cycle (or forced read) ─
            with _lock:
                interval = _sample_interval

            _force_read.wait(timeout=interval)
            _force_read.clear()

    except KeyboardInterrupt:
        print(f"\n{BOLD}Stopping…{RESET}")

    finally:
        if publisher:
            publisher.disconnect()
        print("Inference loop stopped.")


if __name__ == "__main__":
    main()
>>>>>>> Stashed changes
