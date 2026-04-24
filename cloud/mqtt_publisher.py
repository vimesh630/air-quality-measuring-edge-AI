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

load_dotenv()

# AWS IoT Configuration
CLIENT_ID  = os.getenv("CLIENT_ID", "aqm-pi-device")
ENDPOINT   = os.getenv("AWS_IOT_ENDPOINT")
PORT       = int(os.getenv("AWS_IOT_PORT", 8883))
DATA_TOPIC = os.getenv("AWS_IOT_DATA_TOPIC", "aqm/data")
CMD_TOPIC  = os.getenv("AWS_IOT_CMD_TOPIC", "aqm/commands")

# Certificate paths
CERT_PATH  = os.getenv("CERT_PATH", "certs/certificate.pem.crt")
KEY_PATH   = os.getenv("KEY_PATH", "certs/private.pem.key")
CA_PATH    = os.getenv("CA_PATH", "certs/AmazonRootCA1.pem")


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

    def _on_message(self, client, userdata, msg):
        """Handle incoming command messages from dashboard."""
        try:
            command = json.loads(msg.payload.decode())
            print(f"\n[COMMAND RECEIVED] {command}")

            if self.command_callback:
                self.command_callback(command)

        except json.JSONDecodeError:
            print(f"Invalid command JSON received: {msg.payload}")

# ─────────────────────────────────────────
# Quick connection test
# ─────────────────────────────────────────
if __name__ == "__main__":
    print("Testing MQTT connection to AWS IoT Core...\n")

    publisher = MQTTPublisher()

    try:
        publisher.connect()

        # Send 3 test messages
        for i in range(3):
            test_payload = {
                "device_id"  : "aqm-pi-device",
                "timestamp"  : datetime.utcnow().isoformat(),
                "temperature": 25.0 + i,
                "humidity"   : 60.0,
                "aqi"        : 30.0 + (i * 10),
                "label"      : ["good", "moderate", "poor"][i],
                "confidence" : 0.95,
                "is_alert"   : i == 2,
                "test"       : True
            }

            success = publisher.publish(test_payload)
            status  = "SENT" if success else "FAILED"
            print(f"  Message {i+1}: {test_payload['label']:<10} "
                  f"AQI={test_payload['aqi']}  [{status}]")
            time.sleep(1)

        print(f"\nAll test messages sent.")
        print(f"Check DynamoDB table 'aqm_readings' to verify.")

    except ConnectionError as e:
        print(f"Connection failed: {e}")

    except KeyboardInterrupt:
        pass

    finally:
        publisher.disconnect()
