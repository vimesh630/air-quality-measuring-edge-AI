# 🌬️ AQM Edge AI — Air Quality Monitoring with Edge Intelligence

> A full-stack, end-to-end IoT system that reads real air quality sensors on a Raspberry Pi, classifies air quality in real time using a TFLite neural network, streams data to AWS IoT Core, and displays live readings and 1-hour forecasts on a React dashboard.

---

## 📸 System Overview

```
┌─────────────────────────────┐        MQTT / TLS         ┌──────────────────────┐
│        Raspberry Pi          │  ──────────────────────► │    AWS IoT Core      │
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
