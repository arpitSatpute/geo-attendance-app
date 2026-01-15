#!/bin/bash

# Start Face Recognition Service

cd "$(dirname "$0")"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Create faces directory
mkdir -p faces

# Start the service
echo "Starting Face Recognition Service on port 5001..."
python app.py
