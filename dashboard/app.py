# dashboard/app.py
# Flask web dashboard for AQM Edge AI system
# Run: python dashboard/app.py
# Then open: http://localhost:5000

import os
import json
import boto3
import ssl
from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
from datetime import datetime, timezone
from boto3.dynamodb.conditions import Key

try:
    import paho.mqtt.client as mqtt
except ImportError:
    mqtt = None

load_dotenv()

app = Flask(__name__)
CORS(app)

# ─────────────────────────────────────────
# AWS Configuration
# ─────────────────────────────────────────
AWS_REGION   = os.getenv("AWS_REGION",          "eu-north-1")
TABLE_NAME   = os.getenv("DYNAMODB_TABLE",       "aqm_readings")
DEVICE_ID    = os.getenv("CLIENT_ID",            "aqm-pi-device")
CMD_TOPIC    = os.getenv("AWS_IOT_CMD_TOPIC",    "aqm/commands")
ENDPOINT     = os.getenv("AWS_IOT_ENDPOINT")
PORT         = int(os.getenv("AWS_IOT_PORT",     8883))
CERT_PATH    = os.getenv("CERT_PATH")
KEY_PATH     = os.getenv("KEY_PATH")
CA_PATH      = os.getenv("CA_PATH")

# DynamoDB client
dynamodb = boto3.resource(
    "dynamodb",
    region_name           = AWS_REGION,
    aws_access_key_id     = os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key = os.getenv("AWS_SECRET_ACCESS_KEY")
)
table = dynamodb.Table(TABLE_NAME)


# ─────────────────────────────────────────
# Helper — resolve cert paths relative to
# project root regardless of where app.py
# is run from
# ─────────────────────────────────────────
def resolve_path(path_from_env):
    """
    If the path from .env is absolute, use it directly.
    If relative, resolve it from the project root
    (one level above this dashboard/ folder).
    """
    if path_from_env is None:
        return None
    if os.path.isabs(path_from_env):
        return path_from_env
    # Project root = parent of the directory containing this file
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    return os.path.join(project_root, path_from_env)


# ─────────────────────────────────────────
# MQTT client for sending commands to Pi
# ─────────────────────────────────────────
def get_mqtt_client():
    """Create a fresh MQTT client for publishing a command."""
    if mqtt is None:
        return None
    try:
        cert_path = resolve_path(CERT_PATH)
        key_path  = resolve_path(KEY_PATH)
        ca_path   = resolve_path(CA_PATH)

        # Verify files exist before attempting connection
        for label, path in [("CERT", cert_path), ("KEY", key_path), ("CA", ca_path)]:
            if not path or not os.path.exists(path):
                print(f"MQTT error: {label} file not found at {path}")
                return None

        client = mqtt.Client(
            client_id            = "aqm-dashboard",
            protocol             = mqtt.MQTTv311,
            callback_api_version = mqtt.CallbackAPIVersion.VERSION1
        )
        client.tls_set(
            ca_certs    = ca_path,
            certfile    = cert_path,
            keyfile     = key_path,
            tls_version = ssl.PROTOCOL_TLSv1_2
        )
        client.connect(ENDPOINT, PORT, keepalive=10)
        client.loop_start()
        return client
    except Exception as e:
        print(f"MQTT client error: {e}")
        return None


# ─────────────────────────────────────────
# Routes
# ─────────────────────────────────────────

@app.route("/")
def index():
    """Serve the main dashboard page."""
    return render_template("index.html")


@app.route("/api/readings")
def get_readings():
    """
    Fetch latest N readings from DynamoDB.
    Query param: ?limit=30 (default 30)
    """
    limit = int(request.args.get("limit", 30))

    try:
        response = table.query(
            KeyConditionExpression = Key("device_id").eq(DEVICE_ID),
            ScanIndexForward       = False,
            Limit                  = limit
        )
        items = response.get("Items", [])

        readings = []
        for item in items:
            readings.append({
                "timestamp"  : item.get("timestamp",   ""),
                "temperature": float(item.get("temperature", 0)),
                "humidity"   : float(item.get("humidity",    0)),
                "aqi"        : float(item.get("aqi",         0)),
                "co2_ppm"    : float(item.get("co2_ppm",     0)),
                "co_ppm"     : float(item.get("co_ppm",      0)),
                "nh3_ppm"    : float(item.get("nh3_ppm",     0)),
                "label"      : item.get("label",         "unknown"),
                "confidence" : float(item.get("confidence",  0)),
                "is_alert"   : bool(item.get("is_alert",    False)),
            })

        return jsonify({
            "success" : True,
            "count"   : len(readings),
            "readings": readings
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/latest")
def get_latest():
    """Fetch only the single most recent reading."""
    try:
        response = table.query(
            KeyConditionExpression = Key("device_id").eq(DEVICE_ID),
            ScanIndexForward       = False,
            Limit                  = 1
        )
        items = response.get("Items", [])

        if not items:
            return jsonify({"success": False,
                            "error": "No readings found"}), 404

        item = items[0]
        return jsonify({
            "success"    : True,
            "timestamp"  : item.get("timestamp",   ""),
            "temperature": float(item.get("temperature", 0)),
            "humidity"   : float(item.get("humidity",    0)),
            "aqi"        : float(item.get("aqi",         0)),
            "label"      : item.get("label",         "unknown"),
            "confidence" : float(item.get("confidence",  0)),
            "is_alert"   : bool(item.get("is_alert",    False)),
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/command", methods=["POST"])
def send_command():
    """
    Send a command to the Raspberry Pi via MQTT.
    Body: {"action": "read_now"} or
          {"action": "set_interval", "value": 5} or
          {"action": "retrain"}
    """
    data   = request.get_json()
    action = data.get("action", "")

    if not action:
        return jsonify({"success": False,
                        "error": "No action specified"}), 400

    command = {
        "action"   : action,
        "value"    : data.get("value", None),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "source"   : "dashboard"
    }

    try:
        client = get_mqtt_client()
        if client:
            import time
            time.sleep(0.5)
            client.publish(CMD_TOPIC,
                           json.dumps(command), qos=1)
            time.sleep(0.5)
            client.loop_stop()
            client.disconnect()
            return jsonify({"success": True,
                            "command": command})
        else:
            return jsonify({"success": False,
                            "error": "MQTT not available — check cert paths"}), 500

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/stats")
def get_stats():
    """Get summary statistics from the last 100 readings."""
    try:
        response = table.query(
            KeyConditionExpression = Key("device_id").eq(DEVICE_ID),
            ScanIndexForward       = False,
            Limit                  = 100
        )
        items = response.get("Items", [])

        if not items:
            return jsonify({"success": False,
                            "error": "No data"}), 404

        labels     = [i.get("label", "unknown") for i in items]
        aqi_values = [float(i.get("aqi", 0)) for i in items]
        alerts     = [i for i in items if i.get("is_alert", False)]

        return jsonify({
            "success"      : True,
            "total"        : len(items),
            "alerts"       : len(alerts),
            "avg_aqi"      : round(
                                 sum(aqi_values) / len(aqi_values), 1
                             ),
            "label_counts" : {
                "good"    : labels.count("good"),
                "moderate": labels.count("moderate"),
                "poor"    : labels.count("poor")
            }
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ─────────────────────────────────────────
# Run
# ─────────────────────────────────────────
if __name__ == "__main__":
    # Print resolved cert paths on startup so you can verify them
    print("=" * 50)
    print("  AQM Dashboard starting...")
    print(f"  Region   : {AWS_REGION}")
    print(f"  Table    : {TABLE_NAME}")
    print(f"  Device   : {DEVICE_ID}")
    print(f"  Open     : http://localhost:5000")
    print("=" * 50)
    print("  Cert paths resolved:")
    print(f"  CERT : {resolve_path(CERT_PATH)}")
    print(f"  KEY  : {resolve_path(KEY_PATH)}")
    print(f"  CA   : {resolve_path(CA_PATH)}")
    print("=" * 50)
    app.run(debug=True, host="0.0.0.0", port=5000)