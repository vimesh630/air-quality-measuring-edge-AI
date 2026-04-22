# edge/inference.py
# Runs continuously on the Raspberry Pi (or laptop with simulator)
# Reads sensors → normalises → runs TFLite inference → prints prediction
#
# Run this: python edge/inference.py

import sys
import os
import time
import json
import pickle
import numpy as np
from datetime import datetime

