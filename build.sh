#!/bin/bash

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
    -s EXPORTED_FUNCTIONS='["_init", "_update", "_reset", "_getBodyX", "_getBodyY", "_getBodyRadius", "_getBodyColor", "_getBodyVX", "_getBodyVY", "_getBodyMass", "_getBodyCount", "_getTotalEnergy", "_getMomentumX", "_getMomentumY", "_getCenterOfMassX", "_getCenterOfMassY", "_setGravitationalConstant", "_getGravitationalConstant", "_setTimeStep", "_getTimeStep", "_setTimeScale", "_getTimeScale", "_setIntegrator", "_getIntegrator", "_setCollisions", "_getCollisions", "_setCollisionDamping", "_loadPreset", "_addBody", "_removeBody", "_clearBodies", "_setBodyPosition", "_setBodyVelocity", "_setBodyMass", "_setBodyColor", "_findBodyAtPosition", "_getDistance", "_getKineticEnergy", "_saveState", "_setMergingEnabled", "_getMergingEnabled", "_setTidalForces", "_getTidalForces", "_setSofteningLength", "_getSofteningLength", "_setGravitationalWaves", "_getGravitationalWaves", "_getAngularMomentum", "_getEnergyDrift", "_getMomentumDrift", "_saveInitialState", "_main"]' \
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
