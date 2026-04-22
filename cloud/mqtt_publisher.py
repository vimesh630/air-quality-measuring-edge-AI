# cloud/mqtt_publisher.py
# Connects to AWS IoT Core and publishes/receives MQTT messages
# Used by inference.py to send readings to the cloud

import os
import json
import time
import ssl
import threading
from datetime import datetime
from dotenv import load_dotenv

try:
    import paho.mqtt.client as mqtt
except ImportError:
    raise ImportError("Run: pip install paho-mqtt")

# Load environment variables from .env
load_dotenv()

# ─────────────────────────────────────────
# Configuration from .env
# ─────────────────────────────────────────
ENDPOINT   = os.getenv("AWS_IOT_ENDPOINT")
PORT       = int(os.getenv("AWS_IOT_PORT", 8883))
DATA_TOPIC = os.getenv("AWS_IOT_DATA_TOPIC", "aqm/data")
CMD_TOPIC  = os.getenv("AWS_IOT_CMD_TOPIC",  "aqm/commands")
CLIENT_ID  = os.getenv("CLIENT_ID", "aqm-pi-device")
CERT_PATH  = os.getenv("CERT_PATH")
KEY_PATH   = os.getenv("KEY_PATH")
CA_PATH    = os.getenv("CA_PATH")