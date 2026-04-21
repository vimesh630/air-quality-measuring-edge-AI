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
