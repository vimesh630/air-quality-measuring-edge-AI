# 🌬️ AQM Edge AI — Air Quality Monitoring with Edge Intelligence

![Python](https://img.shields.io/badge/Python-3.9+-3776AB?style=flat&logo=python&logoColor=white)
![TensorFlow](https://img.shields.io/badge/TFLite-Edge_AI-FF6F00?style=flat&logo=tensorflow&logoColor=white)
![AWS](https://img.shields.io/badge/AWS_IoT_Core-MQTT%2FTLS-FF9900?style=flat&logo=amazonaws&logoColor=white)
![React](https://img.shields.io/badge/React-Dashboard-61DAFB?style=flat&logo=react&logoColor=black)
![License](https://img.shields.io/badge/License-Academic-lightgrey?style=flat)

> A full-stack, end-to-end Edge-AI system that reads real air quality sensors
> on a Raspberry Pi, classifies air quality in real time using a TFLite neural
> network, streams data to AWS IoT Core, displays live readings and 1-hour
> forecasts on a React dashboard, and **retrains the model on-device** using
> historical data pulled directly from DynamoDB.

---
## 📸 System Overview

```
┌─────────────────────────────┐      MQTT / TLS      ┌──────────────────────┐
│        Raspberry Pi         │ ───────────────────► │    AWS IoT Core      │
│                             │                      └──────────┬───────────┘
│  DHT22  ──► Temp/Humidity   │                                 │ IoT Rule
│  MQ-135 ──► CO₂ / CO / NH₃  │                      ┌──────────▼───────────┐
│  TFLite Classifier          │                      │    DynamoDB Table    │
│  on_device_train.py ◄───────┼── retrain command    │   (aqm_readings)     │
└─────────────────────────────┘                      └──────────┬───────────┘
                                                                │
                                                     ┌──────────▼───────────┐
                                                     │  Flask API + React   │
                                                     │  Live Dashboard      │
                                                     │  LSTM 1-hr Forecast  │
                                                     └──────────────────────┘
```

---

## ✨ Key Features

| Feature | Detail |
|---|---|
| ⚡ **Real-time Inference** | TFLite neural network classifies air quality every 2 s on-device |
| 🌡️ **Multi-sensor Fusion** | DHT22 (temp + humidity) + MQ-135 (CO₂, CO, NH₃) via ADS1115 ADC |
| ☁️ **Cloud Streaming** | Secure MQTT over TLS → AWS IoT Core → DynamoDB auto-insert |
| 🧠 **LSTM Forecasting** | Stacked LSTM predicts AQI 1 hour ahead from a 24-hr lookback window |
| 🔄 **On-Device Training** | Pi pulls DynamoDB history and retrains the classifier locally — no cloud GPU needed |
| 📊 **Live Dashboard** | React + Vite frontend with real-time charts, AQI gauge, gas breakdown, and alerts |
| 📡 **Bidirectional MQTT** | Dashboard sends commands to change interval, trigger reads, or kick off retraining |

---
## 🗂️ Project Structure

```
AQI/
├── sensor_read.py              # DHT22 + MQ-135 hardware driver
├── edge/
│   ├── inference.py            # Main edge loop: read → classify → publish
│   └── on_device_train.py      # ✦ NEW — retrain classifier on Pi from DynamoDB data
├── cloud/
│   └── mqtt_publisher.py       # MQTT client for AWS IoT Core
├── model/
│   ├── classifier/
│   │   ├── train_model.py      # Trains RF + neural net, exports TFLite
│   │   └── output/
│   │       ├── aqm_model.tflite
│   │       ├── scaler.pkl
│   │       └── label_encoder.pkl
│   └── lstm_forecast/
│       ├── train_lstm.py       # Stacked LSTM for AQI time-series forecasting
│       └── output/
│           ├── aqm_lstm.tflite
│           ├── lstm_model.keras
│           └── lstm_scaler.pkl
├── dashboard/
│   └── app.py                  # Flask REST API
├── aqm-react/                  # Vite + React frontend
├── .env                        # AWS credentials (not committed)
├── requirements.txt
└── README.md
```

---
## 🧠 AI Models

### 1. AQI Classifier — Edge (TFLite)
- **Architecture**: Dense 64 → 32 → 3 with BatchNorm + Dropout
- **Input**: `temperature`, `humidity`, `aqi`
- **Output**: `good` / `moderate` / `poor` with confidence scores
- **Size**: < 500 KB quantized, runs directly on Raspberry Pi

### 2. LSTM Forecaster — Cloud
- **Architecture**: Stacked LSTM 64 → 32 with Dropout
- **Sequence**: 24-hour lookback → predicts 1 hour ahead
- **Training data**: PRSA Beijing PM2.5 dataset (2013–2017)

### 3. On-Device Training — `edge/on_device_train.py` ✦ New
- Fetches historical readings from DynamoDB using `boto3`
- Retrains the dense AQI classifier entirely on the Pi (ARM CPU)
- Exports updated `.tflite` model and `scaler.pkl` in-place
- Triggered via MQTT command: `{"action": "retrain"}`
- Keeps the model adapted to **local environmental drift** over time

---


