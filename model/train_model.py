import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder, MinMaxScaler
from sklearn.metrics import (classification_report,
                             confusion_matrix,
                             accuracy_score)
import tensorflow as tf
import pickle
import os

# TFLite import — works on Windows (TF fallback) and Raspberry Pi (tflite_runtime)
try:
    import tflite_runtime.interpreter as tflite
except ModuleNotFoundError:
    try:
        from tensorflow.lite.python.interpreter import Interpreter as _Interp
    except ImportError:
        _Interp = tf.lite.Interpreter
    class tflite:
        Interpreter = _Interp

print("=" * 50)
print("AQM Model Training — Day 2")
print("=" * 50)

# ─────────────────────────────────────────
# STEP 1 — Load clean dataset
# ─────────────────────────────────────────
df = pd.read_csv('model/data/aqm_clean.csv')

print(f"\nDataset loaded")
print(f"Rows    : {len(df):,}")
print(f"Columns : {list(df.columns)}")
print(f"\nLabel counts:")
print(df['label'].value_counts())

# ─────────────────────────────────────────
# STEP 2 — Encode labels + train/test split
# ─────────────────────────────────────────
le = LabelEncoder()
df['label_enc'] = le.fit_transform(df['label'])

print(f"\nLabel encoding:")
for i, cls in enumerate(le.classes_):
    print(f"  {i} = {cls}")

X = df[['temperature', 'humidity', 'aqi']].values
y = df['label_enc'].values

X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

print(f"\nTrain set : {len(X_train):,} rows")
print(f"Test set  : {len(X_test):,} rows")
print(f"\nTrain label distribution:")
unique, counts = np.unique(y_train, return_counts=True)
for u, c in zip(unique, counts):
    print(f"  {le.classes_[u]:<12} {c:>8,} ({c/len(y_train)*100:.1f}%)")

# ─────────────────────────────────────────
# STEP 3 — Train Random Forest classifier
# ─────────────────────────────────────────
print(f"\nTraining Random Forest...")
print(f"(This takes about 30–60 seconds)")

rf = RandomForestClassifier(
    n_estimators=100,
    max_depth=15,
    min_samples_split=10,
    class_weight='balanced',
    random_state=42,
    n_jobs=-1
)

rf.fit(X_train, y_train)
print("Training complete.")

y_pred   = rf.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)

print(f"\n── Results ─────────────────────────────")
print(f"Overall accuracy : {accuracy * 100:.2f}%")
print(f"\nDetailed report:")
print(classification_report(
    y_test, y_pred,
    target_names=le.classes_
))

# ─────────────────────────────────────────
# STEP 4 — Confusion matrix
# ─────────────────────────────────────────
cm = confusion_matrix(y_test, y_pred)

plt.figure(figsize=(8, 6))
sns.heatmap(
    cm,
    annot=True,
    fmt='d',
    cmap='Blues',
    xticklabels=le.classes_,
    yticklabels=le.classes_
)
plt.title('Confusion matrix — Random Forest AQI classifier')
plt.ylabel('Actual label')
plt.xlabel('Predicted label')
plt.tight_layout()
plt.savefig('model/confusion_matrix.png', dpi=150)
plt.show()
print("Confusion matrix saved → model/confusion_matrix.png")

importances = rf.feature_importances_
features    = ['temperature', 'humidity', 'aqi']

print(f"\n── Feature importance ──────────────────")
for feat, imp in sorted(zip(features, importances),
                         key=lambda x: x[1], reverse=True):
    bar = '█' * int(imp * 40)
    print(f"  {feat:<15} {imp:.4f}  {bar}")

# ─────────────────────────────────────────
# STEP 5 — Save RF model and label encoder
# ─────────────────────────────────────────
os.makedirs('model', exist_ok=True)

with open('model/label_encoder.pkl', 'wb') as f:
    pickle.dump(le, f)
print("\nLabel encoder saved → model/label_encoder.pkl")

with open('model/rf_model.pkl', 'wb') as f:
    pickle.dump(rf, f)
print("RF model saved     → model/rf_model.pkl")

# ─────────────────────────────────────────
# STEP 6 — Normalize + train neural network
# ─────────────────────────────────────────
print(f"\nTraining neural network for TFLite export...")

scaler         = MinMaxScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled  = scaler.transform(X_test)

with open('model/scaler.pkl', 'wb') as f:
    pickle.dump(scaler, f)
print("Scaler saved → model/scaler.pkl")

model = tf.keras.Sequential([
    tf.keras.layers.Input(shape=(3,)),
    tf.keras.layers.Dense(64, activation='relu'),
    tf.keras.layers.BatchNormalization(),
    tf.keras.layers.Dropout(0.2),
    tf.keras.layers.Dense(32, activation='relu'),
    tf.keras.layers.BatchNormalization(),
    tf.keras.layers.Dropout(0.2),
    tf.keras.layers.Dense(3, activation='softmax')
])

model.compile(
    optimizer='adam',
    loss='sparse_categorical_crossentropy',
    metrics=['accuracy']
)

model.summary()

early_stop = tf.keras.callbacks.EarlyStopping(
    monitor='val_accuracy',
    patience=5,
    restore_best_weights=True
)

history = model.fit(
    X_train_scaled, y_train,
    epochs=50,
    batch_size=512,
    validation_split=0.1,
    callbacks=[early_stop],
    verbose=1
)

nn_loss, nn_acc = model.evaluate(X_test_scaled, y_test, verbose=0)
print(f"\nNeural network test accuracy : {nn_acc * 100:.2f}%")

# ─────────────────────────────────────────
# STEP 7 — Convert to TFLite
# ─────────────────────────────────────────
print(f"\nConverting to TFLite...")

converter              = tf.lite.TFLiteConverter.from_keras_model(model)
converter.optimizations = [tf.lite.Optimize.DEFAULT]
tflite_model           = converter.convert()

tflite_path = 'model/aqm_model.tflite'
with open(tflite_path, 'wb') as f:
    f.write(tflite_model)

file_size_kb = len(tflite_model) / 1024
print(f"TFLite model saved → {tflite_path}")
print(f"File size          : {file_size_kb:.1f} KB")

if file_size_kb < 500:
    print(f"Size check         : PASS — small enough for Raspberry Pi")
else:
    print(f"Size check         : WARNING — larger than expected")

# ─────────────────────────────────────────
# STEP 8 — Verify TFLite model
# ─────────────────────────────────────────
print(f"\n── TFLite verification ─────────────────")

interpreter = tflite.Interpreter(model_path=tflite_path)
interpreter.allocate_tensors()

input_details  = interpreter.get_input_details()
output_details = interpreter.get_output_details()

print(f"Input shape  : {input_details[0]['shape']}")
print(f"Output shape : {output_details[0]['shape']}")

test_cases = [
    {'temp': 10.0, 'hum': 45.0, 'aqi': 5.0,  'expected': 'good'},
    {'temp': 20.0, 'hum': 60.0, 'aqi': 25.0, 'expected': 'moderate'},
    {'temp': 30.0, 'hum': 70.0, 'aqi': 80.0, 'expected': 'poor'},
]

print(f"\nTest predictions:")
all_correct = True

for tc in test_cases:
    raw    = np.array([[tc['temp'], tc['hum'], tc['aqi']]],
                      dtype=np.float32)
    scaled = scaler.transform(raw).astype(np.float32)

    interpreter.set_tensor(input_details[0]['index'], scaled)
    interpreter.invoke()

    output     = interpreter.get_tensor(output_details[0]['index'])[0]
    pred_idx   = int(np.argmax(output))
    pred_label = le.inverse_transform([pred_idx])[0]
    confidence = float(np.max(output)) * 100

    status = "PASS" if pred_label == tc['expected'] else "FAIL"
    if status == "FAIL":
        all_correct = False

    print(f"  Temp:{tc['temp']}°C  Hum:{tc['hum']}%  "
          f"AQI:{tc['aqi']:5.1f}  →  "
          f"{pred_label:<10} ({confidence:.1f}%)  [{status}]")

print(f"\nAll tests passed : {all_correct}")

# ─────────────────────────────────────────
# STEP 9 — Training history plot
# ─────────────────────────────────────────
plt.figure(figsize=(10, 4))

plt.subplot(1, 2, 1)
plt.plot(history.history['accuracy'],     label='Train accuracy')
plt.plot(history.history['val_accuracy'], label='Val accuracy')
plt.title('Model accuracy over epochs')
plt.xlabel('Epoch')
plt.ylabel('Accuracy')
plt.legend()

plt.subplot(1, 2, 2)
plt.plot(history.history['loss'],     label='Train loss')
plt.plot(history.history['val_loss'], label='Val loss')
plt.title('Model loss over epochs')
plt.xlabel('Epoch')
plt.ylabel('Loss')
plt.legend()

plt.tight_layout()
plt.savefig('model/training_history.png', dpi=150)
plt.show()
print("Training history saved → model/training_history.png")

print(f"\n{'=' * 50}")
print(f"Day 2 complete. Files ready for Raspberry Pi:")
print(f"  model/aqm_model.tflite")
print(f"  model/label_encoder.pkl")
print(f"  model/scaler.pkl")
print(f"{'=' * 50}")