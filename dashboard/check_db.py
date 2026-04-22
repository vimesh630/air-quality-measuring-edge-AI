import boto3
import os
from dotenv import load_dotenv
from boto3.dynamodb.conditions import Key

load_dotenv()

dynamodb = boto3.resource(
    'dynamodb',
    region_name           = os.getenv('AWS_REGION'),
    aws_access_key_id     = os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key = os.getenv('AWS_SECRET_ACCESS_KEY')
)

table = dynamodb.Table('aqm_readings')

# Check all device IDs in the table
print("Scanning all device IDs in DynamoDB...")
scan = table.scan()
items = scan.get('Items', [])
ids = set(item.get('device_id') for item in items)
print(f"Total rows: {len(items)}")
print(f"Device IDs found: {ids}")

# Check latest 5 rows for aqm-pi-device
print("\nLatest 5 rows for device aqm-pi-device:")
response = table.query(
    KeyConditionExpression = Key('device_id').eq('aqm-pi-device'),
    ScanIndexForward       = False,
    Limit                  = 5
)
rows = response.get('Items', [])
if not rows:
    print("  No rows found for aqm-pi-device")
else:
    for row in rows:
        print(f"  {row.get('timestamp')}  label={row.get('label')}  aqi={row.get('aqi')}")

# Check latest 5 rows for pi-living-room
print("\nLatest 5 rows for device pi-living-room:")
response2 = table.query(
    KeyConditionExpression = Key('device_id').eq('pi-living-room'),
    ScanIndexForward       = False,
    Limit                  = 5
)
rows2 = response2.get('Items', [])
if not rows2:
    print("  No rows found for pi-living-room")
else:
    for row in rows2:
        print(f"  {row.get('timestamp')}  label={row.get('label')}  aqi={row.get('aqi')}")