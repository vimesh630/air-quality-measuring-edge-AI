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

# ─────────────────────────────────────────
# MQTTPublisher class
# ─────────────────────────────────────────
class MQTTPublisher:

    def __init__(self):
        self.client       = mqtt.Client(
                                client_id=CLIENT_ID,
                                protocol=mqtt.MQTTv311
                            )
        self.connected    = False
        self.command_callback = None  # set by inference.py

        # TLS/SSL with AWS IoT certificates
        self.client.tls_set(
            ca_certs    = os.path.abspath(CA_PATH),
            certfile    = os.path.abspath(CERT_PATH),
            keyfile     = os.path.abspath(KEY_PATH),
            tls_version = ssl.PROTOCOL_TLSv1_2
        )

        # Bind callbacks
        self.client.on_connect    = self._on_connect
        self.client.on_disconnect = self._on_disconnect
        self.client.on_message    = self._on_message
