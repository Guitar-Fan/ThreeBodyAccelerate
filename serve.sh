#!/bin/bash

# Start web server in public directory
cd public
echo "Starting web server on http://localhost:8080"
echo "Press Ctrl+C to stop"
python3 -m http.server 8080
