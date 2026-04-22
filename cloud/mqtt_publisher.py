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

    def connect(self):
        """Connect to AWS IoT Core."""
        print(f"Connecting to AWS IoT Core...")
        print(f"  Endpoint : {ENDPOINT}")
        print(f"  ClientID : {CLIENT_ID}")
        print(f"  Topic    : {DATA_TOPIC}")

        self.client.connect(ENDPOINT, PORT, keepalive=60)

        # Start background network loop
        self.client.loop_start()

        # Wait up to 10 seconds for connection
        timeout = 10
        while not self.connected and timeout > 0:
            time.sleep(0.5)
            timeout -= 0.5

        if not self.connected:
            raise ConnectionError(
                "Could not connect to AWS IoT Core. "
                "Check your endpoint, certificates, and internet connection."
            )

        print("Connected to AWS IoT Core successfully.\n")

    def publish(self, payload: dict):
        """
        Publish a reading payload to the data topic.
        payload must be a dict — it will be JSON serialised.
        """
        if not self.connected:
            print("MQTT not connected — skipping publish")
            return False

        # Add ISO timestamp if not present
        if "timestamp" not in payload:
            payload["timestamp"] = datetime.utcnow().isoformat()

        message = json.dumps(payload)
        result  = self.client.publish(DATA_TOPIC, message, qos=1)

        if result.rc == mqtt.MQTT_ERR_SUCCESS:
            return True
        else:
            print(f"MQTT publish failed: rc={result.rc}")
            return False
    
    def subscribe_commands(self, callback):
        """
        Subscribe to the command topic.
        callback(command_dict) is called when a command arrives.
        """
        self.command_callback = callback
        self.client.subscribe(CMD_TOPIC, qos=1)
        print(f"Subscribed to command topic: {CMD_TOPIC}")

    def disconnect(self):
        """Cleanly disconnect from AWS IoT Core."""
        self.client.loop_stop()
        self.client.disconnect()
        print("Disconnected from AWS IoT Core.")

    # ── Private callbacks ──────────────────

    def _on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            self.connected = True
            print(f"MQTT connected (rc={rc})")
        else:
            error_codes = {
                1: "Incorrect protocol version",
                2: "Invalid client ID",
                3: "Server unavailable",
                4: "Bad username or password",
                5: "Not authorised"
            }
            print(f"MQTT connect failed: {error_codes.get(rc, f'rc={rc}')}")

    def _on_disconnect(self, client, userdata, rc):
        self.connected = False
        if rc != 0:
            print(f"Unexpected MQTT disconnect (rc={rc}) — will reconnect")
