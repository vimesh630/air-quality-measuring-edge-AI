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


