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

