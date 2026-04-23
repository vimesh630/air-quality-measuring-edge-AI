# edge/on_device_train.py
# On-device retraining module for the AQM classifier.
#
# Called by inference.py when a "retrain" command arrives from the dashboard.
# Fetches recent labeled readings from DynamoDB, trains a lightweight
# neural network, converts to TFLite, and overwrites the live model files.
#
# Can also be run standalone for testing:
#   python edge/on_device_train.py

import os
import sys
import json
import pickle
import time
import numpy as np
from datetime import datetime, timezone

# ─────────────────────────────────────────
# Paths
# ─────────────────────────────────────────
_ROOT       = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
_OUTPUT_DIR = os.path.join(_ROOT, 'model', 'classifier', 'output')
MODEL_PATH  = os.path.join(_OUTPUT_DIR, 'aqm_model.tflite')
SCALER_PATH = os.path.join(_OUTPUT_DIR, 'scaler.pkl')
ENCODER_PATH= os.path.join(_OUTPUT_DIR, 'label_encoder.pkl')

# ─────────────────────────────────────────
# AQI label thresholds (must match the
# original data-prep and sensor pipeline)
# ─────────────────────────────────────────
def _aqi_to_label(aqi: float) -> str:
    if aqi <= 33:
        return 'good'
    elif aqi <= 66:
        return 'moderate'
    else:
        return 'poor'


# ─────────────────────────────────────────
# AWS / DynamoDB helpers
# ─────────────────────────────────────────
def _get_dynamo_table():
    """Return a boto3 DynamoDB Table resource using env-var credentials."""
    import boto3
    from dotenv import load_dotenv
    load_dotenv(os.path.join(_ROOT, ".env"))

    region     = os.getenv("AWS_REGION",          "eu-north-1")
    table_name = os.getenv("DYNAMODB_TABLE",       "aqm_readings")
    device_id  = os.getenv("CLIENT_ID",            "aqm-pi-device")

    dynamodb = boto3.resource(
        "dynamodb",
        region_name           = region,
        aws_access_key_id     = os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key = os.getenv("AWS_SECRET_ACCESS_KEY"),
    )
    return dynamodb.Table(table_name), device_id


def _fetch_training_data(n_samples: int = 500):
    """
    Fetch the most recent `n_samples` readings from DynamoDB.

    Returns
    -------
    X : np.ndarray, shape (N, 3)  — [temperature, humidity, aqi]
    y : np.ndarray, shape (N,)    — integer-encoded labels  {0,1,2}
    label_names : list[str]       — ['good', 'moderate', 'poor'] in sorted order
    """
    from boto3.dynamodb.conditions import Key

    table, device_id = _get_dynamo_table()

    print(f"[RETRAIN] Fetching {n_samples} readings from DynamoDB...")
    response = table.query(
        KeyConditionExpression = Key("device_id").eq(device_id),
        ScanIndexForward       = False,
        Limit                  = n_samples
    )
    items = response.get("Items", [])
    print(f"[RETRAIN] Retrieved {len(items)} records.")

    if len(items) < 30:
        raise ValueError(
            f"Only {len(items)} records found — need at least 30 to retrain."
        )

    rows   = []
    labels = []
    for item in items:
        try:
            temp  = float(item["temperature"])
            hum   = float(item["humidity"])
            aqi   = float(item["aqi"])
            # Use the stored label when available, otherwise derive from AQI
            lbl   = item.get("label") or _aqi_to_label(aqi)
            rows.append([temp, hum, aqi])
            labels.append(lbl)
        except (KeyError, TypeError, ValueError):
            continue  # skip malformed records

    X_raw = np.array(rows,   dtype=np.float32)
    y_raw = np.array(labels, dtype=object)

    label_names = sorted(set(y_raw))               # ['good', 'moderate', 'poor']
    label_to_int = {l: i for i, l in enumerate(label_names)}
    y = np.array([label_to_int[l] for l in y_raw], dtype=np.int32)

    print(f"[RETRAIN] Class distribution: "
          + ", ".join(f"{l}={int((y==i).sum())}" for i, l in enumerate(label_names)))

    return X_raw, y, label_names


# ─────────────────────────────────────────
# Model definition (mirrors train_model.py)
# ─────────────────────────────────────────
def _build_model(n_classes: int):
    import tensorflow as tf
    model = tf.keras.Sequential([
        tf.keras.layers.Input(shape=(3,)),
        tf.keras.layers.Dense(64, activation='relu'),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.Dropout(0.2),
        tf.keras.layers.Dense(32, activation='relu'),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.Dropout(0.2),
        tf.keras.layers.Dense(n_classes, activation='softmax'),
    ])
    model.compile(
        optimizer = 'adam',
        loss      = 'sparse_categorical_crossentropy',
        metrics   = ['accuracy']
    )
    return model


# ─────────────────────────────────────────
# Public API
# ─────────────────────────────────────────
def retrain(n_samples: int = 500) -> tuple[bool, str]:
    """
    Full on-device retrain pipeline.

    1. Fetch recent data from DynamoDB
    2. Normalise features with MinMaxScaler
    3. Train a small Dense neural network
    4. Convert to TFLite with DEFAULT quantisation
    5. Atomically overwrite model/classifier/output/ artefacts

    Returns
    -------
    (success: bool, message: str)
    """
    import tensorflow as tf
    from sklearn.preprocessing import MinMaxScaler, LabelEncoder

    start = time.time()

    # ── 1. Data ──────────────────────────────
    try:
        X_raw, y, label_names = _fetch_training_data(n_samples)
    except Exception as exc:
        return False, f"Data fetch failed: {exc}"

    n_classes = len(label_names)

    # ── 2. Scale ─────────────────────────────
    scaler = MinMaxScaler()
    X      = scaler.fit_transform(X_raw).astype(np.float32)

    # ── 3. Train/val split (80/20 chronological) ─
    split = int(len(X) * 0.8)
    X_train, X_val = X[:split],  X[split:]
    y_train, y_val = y[:split],  y[split:]

    print(f"[RETRAIN] Train={len(X_train)}  Val={len(X_val)}  Classes={label_names}")

    model = _build_model(n_classes)

    early_stop = tf.keras.callbacks.EarlyStopping(
        monitor             = 'val_accuracy',
        patience            = 5,
        restore_best_weights= True,
        verbose             = 0
    )

    history = model.fit(
        X_train, y_train,
        epochs           = 50,
        batch_size       = min(64, len(X_train)),
        validation_data  = (X_val, y_val),
        callbacks        = [early_stop],
        verbose          = 1
    )

    val_acc = max(history.history.get('val_accuracy', [0]))
    print(f"[RETRAIN] Best val accuracy: {val_acc * 100:.2f}%")

    # ── 4. Convert to TFLite ─────────────────
    print("[RETRAIN] Converting to TFLite...")
    converter              = tf.lite.TFLiteConverter.from_keras_model(model)
    converter.optimizations = [tf.lite.Optimize.DEFAULT]
    try:
        tflite_model = converter.convert()
    except Exception as exc:
        return False, f"TFLite conversion failed: {exc}"

    # ── 5. Build updated LabelEncoder ────────
    le = LabelEncoder()
    le.classes_ = np.array(label_names)

    # ── 6. Write artefacts atomically ────────
    # Write to temp files first, then rename — safe even if the process is
    # killed mid-write (the old model remains valid).
    os.makedirs(_OUTPUT_DIR, exist_ok=True)

    _safe_write(MODEL_PATH,   tflite_model, binary=True)
    _safe_write_pickle(SCALER_PATH,  scaler)
    _safe_write_pickle(ENCODER_PATH, le)

    elapsed = time.time() - start
    size_kb  = len(tflite_model) / 1024
    msg = (
        f"Retrain complete in {elapsed:.0f}s — "
        f"val_acc={val_acc*100:.1f}%  "
        f"model={size_kb:.1f}KB  "
        f"samples={len(X)}"
    )
    return True, msg


# ─────────────────────────────────────────
# Atomic file-write helpers
# ─────────────────────────────────────────
def _safe_write(path: str, data: bytes, binary: bool = True):
    tmp = path + ".tmp"
    mode = 'wb' if binary else 'w'
    with open(tmp, mode) as f:
        f.write(data)
    os.replace(tmp, path)


def _safe_write_pickle(path: str, obj):
    tmp = path + ".tmp"
    with open(tmp, 'wb') as f:
        pickle.dump(obj, f)
    os.replace(tmp, path)


# ─────────────────────────────────────────
# Standalone test entry-point
# ─────────────────────────────────────────
if __name__ == "__main__":
    print("=" * 50)
    print("  AQM On-Device Retraining — standalone test")
    print("=" * 50)

    ok, msg = retrain(n_samples=500)
    if ok:
        print(f"\n✔  {msg}")
    else:
        print(f"\n✘  {msg}")
        sys.exit(1)
