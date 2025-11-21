#!/bin/bash
# NASA Mission Game - Quick Launch Script

echo "🚀 NASA Asteroid Defense Mission - Launch Sequence"
echo "=================================================="
echo ""

# Check if in correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Run this script from nasa-mission-game directory"
    exit 1
fi

# Check dependencies
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
    echo "✓ Dependencies installed"
    echo ""
fi

# Launch game
echo "🎮 Starting Mission Control..."
echo ""
echo "   Game will open at: http://localhost:5173"
echo "   Press Ctrl+C to stop the server"
echo ""
echo "=================================================="

npm run dev
