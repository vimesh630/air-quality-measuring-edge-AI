# 🌬️ AQM Edge AI — Air Quality Monitoring with Edge Intelligence

> A full-stack, end-to-end IoT system that reads real air quality sensors on a Raspberry Pi, classifies air quality in real time using a TFLite neural network, streams data to AWS IoT Core, and displays live readings and 1-hour forecasts on a React dashboard.

---

## 📸 System Overview

```
┌─────────────────────────────┐        MQTT / TLS         ┌──────────────────────┐
│        Raspberry Pi         │  ──────────────────────►  │    AWS IoT Core      │
│                             │                           └──────────┬───────────┘
│  DHT22  ──► Temperature     │                                      │ IoT Rule
│  MQ-135 ──► CO₂ / CO / NH₃  │                           ┌──────────▼───────────┐
│             AQI (0–100)     │                           │    DynamoDB Table    │
│                             │  ◄──────────────────────  │   (aqm_readings)     │
│  TFLite Classifier          │       Commands            └──────────┬───────────┘
│  good / moderate / poor     │                                      │
└─────────────────────────────┘                           ┌──────────▼───────────┐
                                                          │  Flask API + React   │
                                                          │  Live Dashboard      │
                                                          │  LSTM 1-hr Forecast  │
                                                          └──────────────────────┘
```

---

## ✨ Key Features

| Feature | Detail |
|---|---|
| 🔴 **Real-time Inference** | TFLite neural network runs on Raspberry Pi every 2 s |
| 🌡️ **Multi-sensor Fusion** | DHT22 (temp + humidity) + MQ-135 (CO₂, CO, NH₃) via ADS1115 ADC |
| 📊 **AQI Calculation** | Custom weighted formula across CO₂, CO, NH₃ → 0–100 scale |
| ☁️ **Cloud Streaming** | Secure MQTT over TLS to AWS IoT Core → DynamoDB |
| 🧠 **LSTM Forecasting** | Stacked LSTM predicts AQI 1 hour ahead (trained on PRSA Beijing dataset) |
| 📟 **Live React Dashboard** | Real-time charts, status cards, AQI gauge, gas breakdown, alerts |
| ⚡ **Remote Commands** | Dashboard can trigger manual reads or change sampling interval via MQTT |
| 🔔 **Alert System** | Automatic "poor" air quality alerts with visual and console warnings |

---

## 🗂️ Project Structure

```
AQI/
├── sensor_read.py              # DHT22 + MQ-135 hardware driver
├── edge/
│   └── inference.py            # Main edge loop: read → classify → publish
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
│   └── app.py                  # Flask REST API (readings, stats, forecast, commands)
├── aqm-react/                  # Vite + React frontend dashboard
│   └── src/
│       ├── App.jsx
│       └── components/
├── PRSA_Data_20130301-20170228/ # Beijing PM2.5 dataset (LSTM training data)
├── .env                        # AWS credentials and IoT config (not committed)
├── requirements.txt
└── README.md
```

---
