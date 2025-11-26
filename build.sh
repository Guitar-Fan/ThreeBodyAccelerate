#!/bin/bash

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Source Emscripten environment
source /tmp/emsdk/emsdk_env.sh

# Build directory
BUILD_DIR="build"
PUBLIC_DIR="public"

# Create build directory if it doesn't exist
mkdir -p $BUILD_DIR
mkdir -p $PUBLIC_DIR

# Compile C++ to WebAssembly
echo "Compiling C++ to WebAssembly..."

emcc src/main.cpp \
    -o $BUILD_DIR/main.js \
    -s WASM=1 \
    -s EXPORTED_FUNCTIONS='["_init", "_update", "_reset", "_getBodyX", "_getBodyY", "_getBodyZ", "_getBodyRadius", "_getBodyColor", "_getBodyVX", "_getBodyVY", "_getBodyVZ", "_getBodyMass", "_getBodyCount", "_getTotalEnergy", "_getMomentumX", "_getMomentumY", "_getMomentumZ", "_getCenterOfMassX", "_getCenterOfMassY", "_getCenterOfMassZ", "_setGravitationalConstant", "_getGravitationalConstant", "_setTimeStep", "_getTimeStep", "_setTimeScale", "_getTimeScale", "_setIntegrator", "_getIntegrator", "_setCollisions", "_getCollisions", "_setCollisionDamping", "_loadPreset", "_addBody", "_removeBody", "_clearBodies", "_setBodyPosition", "_setBodyVelocity", "_setBodyMass", "_setBodyColor", "_setBodyCharge", "_getBodyCharge", "_findBodyAtPosition", "_getDistance", "_getKineticEnergy", "_saveState", "_setMergingEnabled", "_getMergingEnabled", "_setTidalForces", "_getTidalForces", "_setSofteningLength", "_getSofteningLength", "_setGravitationalWaves", "_getGravitationalWaves", "_setChargeForces", "_getChargeForces", "_setElectrostaticConstant", "_getElectrostaticConstant", "_setBoundaryMode", "_getBoundaryMode", "_setBoundaryPadding", "_getBoundaryPadding", "_setBoundaryRestitution", "_getBoundaryRestitution", "_getAngularMomentum", "_getAngularMomentumX", "_getAngularMomentumY", "_getAngularMomentumZ", "_getEnergyDrift", "_getMomentumDrift", "_getAngularMomentumDrift", "_startNASAMission", "_getGameMode", "_getMissionState", "_deploySpacecraft", "_getThreatDistance", "_getMissionTime", "_getTimeLimit", "_getClosestApproach", "_getDeltaVBudget", "_getDeltaVUsed", "_getMissionScore", "_getThreatRadius", "_getSafetyMargin", "_getEarthIndex", "_getAsteroidIndex", "_getSpacecraftIndex", "_saveInitialState", "_main"]' \
    -s EXPORTED_RUNTIME_METHODS='["ccall", "cwrap"]' \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s NO_EXIT_RUNTIME=1 \
    -O3 \
    --std=c++17

if [ $? -eq 0 ]; then
    echo "Build successful!"
    
    # Copy output files to public directory
    cp $BUILD_DIR/main.js $PUBLIC_DIR/
    cp $BUILD_DIR/main.wasm $PUBLIC_DIR/
    
    echo "Files copied to $PUBLIC_DIR/"
    echo ""
    echo "To run the simulation:"
    echo "  1. Start a local web server:"
    echo "     cd public && python3 -m http.server 8080"
    echo "  2. Open browser to http://localhost:8080"
    echo ""
else
    echo "Build failed!"
    exit 1
fi
