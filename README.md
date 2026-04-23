# 🌬️ AQM Edge AI — Air Quality Monitoring with Edge Intelligence

> A full-stack, end-to-end Edge-AI system that reads real air quality sensors on a Raspberry Pi, classifies air quality in real time using a TFLite neural network, streams data to AWS IoT Core, and displays live readings and 1-hour forecasts on a React dashboard.

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

## 🧠 AI Models

### 1. Air Quality Classifier (Edge, TFLite)

- **Architecture**: 3-layer dense neural network (64 → 32 → 3 units) with BatchNorm + Dropout
- **Input features**: `temperature`, `humidity`, `aqi`
- **Output**: `good` / `moderate` / `poor` with per-class confidence scores
- **Pre-processing**: also trains a Random Forest for comparison and validation
- **Deployment**: quantized to TFLite (`< 500 KB`) and runs directly on the Pi

### 2. LSTM AQI Forecaster (Cloud)

- **Architecture**: Stacked LSTM (64 → 32 units) with Dropout
- **Sequence**: 24-hour lookback window → predicts 1 hour ahead
- **Training data**: PRSA Beijing PM2.5 dataset (13 stations, 2013–2017)
- **AQI scaling**: PM2.5 µg/m³ ÷ 10 → mapped to live sensor 0–100 AQI range
- **Export**: `.keras` model + quantized TFLite with SELECT_TF_OPS for stacked LSTM support

---

## 🔧 Hardware

| Component | Role |
|---|---|
| Raspberry Pi 4 | Edge compute, runs TFLite inference loop |
| DHT22 | Temperature + relative humidity (GPIO pin 4) |
| MQ-135 | Gas sensor: CO₂, CO, NH₃ estimation |
| ADS1115 | 16-bit I²C ADC — digitises MQ-135 analog output |

> **Analog noise mitigation**: `sensor_read.py` takes 10 oversampled readings per cycle and averages them to eliminate mains hum (50 Hz) and signal jitter.
> **MQ-135 Calibration**: Sensor requires 24-48 hour burn-in period on first use. 
> Calibrated RO value = 9.55 kΩ measured in clean indoor air.

---

## ☁️ Cloud Architecture

- **AWS IoT Core** — MQTT broker with mutual TLS authentication (X.509 certificates)
- **DynamoDB** — `aqm_readings` table keyed by `device_id` + `timestamp`
- **IoT Rule** — routes MQTT topic `aqm/data` → DynamoDB insert automatically
- **Bidirectional MQTT** — dashboard sends commands to `aqm/commands` topic; Pi subscribes and responds

---

## 🚀 Getting Started

### Prerequisites

```bash
pip install -r requirements.txt
```

### 1. Configure Environment

Create a `.env` file in the project root:

```env
AWS_REGION=eu-north-1
DYNAMODB_TABLE=aqm_readings
CLIENT_ID=aqm-pi-device
AWS_IOT_ENDPOINT=<your-endpoint>.iot.eu-north-1.amazonaws.com
AWS_IOT_PORT=8883
AWS_IOT_DATA_TOPIC=aqm/data
AWS_IOT_CMD_TOPIC=aqm/commands
CERT_PATH=certs/device.pem.crt
KEY_PATH=certs/private.pem.key
CA_PATH=certs/AmazonRootCA1.pem
AWS_ACCESS_KEY_ID=<your-key>
AWS_SECRET_ACCESS_KEY=<your-secret>
```

### 2. Train the Models

```bash
# Train the AQI classifier (outputs TFLite + scaler)
python model/classifier/train_model.py

# Train the LSTM forecaster (outputs .keras + TFLite)
python model/lstm_forecast/train_lstm.py
```

### 3. Run Edge Inference (on Raspberry Pi)

```bash
python edge/inference.py
```

The edge loop will:
1. Read sensors every 2 seconds
2. Run TFLite classification
3. Publish results to AWS IoT Core via MQTT
4. Print live readings with colour-coded labels to the console

### 4. Start the Dashboard

```bash
# Backend
python dashboard/app.py

# Frontend (in aqm-react/)
cd aqm-react
npm install
npm run dev
```

Open **http://localhost:3000** (React dev server) or **http://localhost:5000** (Flask with Jinja template).

---

### 5. Deploy to EC2 (Production)
```bash
# Build Docker image
docker build -f dashboard/Dockerfile -t aqm-dashboard .

# Run container
docker run -d --name aqm-dashboard -p 80:5000 --restart always aqm-dashboard
```
---

## 📡 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/latest` | Most recent sensor reading |
| `GET` | `/api/readings?limit=30` | Last N readings from DynamoDB |
| `GET` | `/api/stats` | Summary stats (avg AQI, label counts, alert count) |
| `GET` | `/api/forecast` | 1-hour LSTM AQI prediction |
| `POST` | `/api/command` | Send a command to the Pi via MQTT |

**Command payload examples:**
```json
{ "action": "read_now" }
{ "action": "set_interval", "value": 5 }
{ "action": "retrain" }
```

---

## 📦 Dependencies

Key packages (see `requirements.txt` for the full list):

| Package | Purpose |
|---|---|
| `tensorflow` | Model training + TFLite inference |
| `tflite-runtime` | Lightweight TFLite for Raspberry Pi |
| `scikit-learn` | Data preprocessing, Random Forest, metrics |
| `adafruit-circuitpython-dht` | DHT22 driver |
| `adafruit-circuitpython-ads1x15` | ADS1115 ADC driver |
| `paho-mqtt` | MQTT communication |
| `boto3` | AWS DynamoDB & IoT Core |
| `flask` + `flask-cors` | REST API backend |
| `pandas` + `numpy` | Data processing |

---

## 📊 Dataset

- **PRSA Beijing Multi-Site Air-Quality Dataset** (2013–2017)
- 12 monitoring stations across Beijing
- Features used: `TEMP`, `DEWP` (→ converted to humidity via Magnus formula), `PM2.5`
- PM2.5 mapped to 0–100 AQI scale to be compatible with the live sensor output

---

## 📄 License

This project is for academic and research purposes.

---

*Built with Python · TensorFlow Lite · AWS IoT Core · React · Flask*
