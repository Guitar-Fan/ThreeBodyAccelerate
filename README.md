# ThreeBodyAccelerate

A three-body problem physics simulation using C++ compiled to WebAssembly with Emscripten.

## Features

- Custom physics implementation (no pre-coded physics libraries)
- Real-time gravitational N-body simulation
- WebAssembly for high-performance computation
- Interactive visualization with HTML5 Canvas
- Trail effects to visualize orbital paths
- Pause/Resume and Reset controls

## Requirements

- Emscripten SDK (installed in `/tmp/emsdk`)
- Modern web browser with WebAssembly support
- Python 3 (for local web server)

## Quick Start

### 1. Build the project

```bash
./build.sh
```

This will compile the C++ code to WebAssembly and copy the output files to the `public/` directory.

### 2. Run the simulation

```bash
./serve.sh
```

Then open your browser to `http://localhost:8080`

## Project Structure

```
ThreeBodyAccelerate/
├── src/
│   └── main.cpp          # Main C++ physics simulation code
├── include/              # Header files (if needed)
├── public/
│   ├── index.html        # Web interface
│   ├── main.js           # Generated JavaScript (from Emscripten)
│   └── main.wasm         # Generated WebAssembly binary
├── build/                # Build artifacts
├── build.sh              # Build script
├── serve.sh              # Web server script
└── README.md             # This file
```

## Physics Implementation

The simulation implements the gravitational three-body problem using:

- **Newtonian Gravitation**: F = G × m₁ × m₂ / r²
- **Velocity Verlet Integration**: A numerical integration method for better accuracy and energy conservation
- **Custom Force Calculation**: All gravitational forces computed from scratch without external physics libraries

## Controls

- **Pause/Resume**: Toggle simulation on/off
- **Reset**: Reset bodies to initial positions and velocities
- **Toggle Trails**: Show/hide orbital path trails

## Customization

You can modify the initial conditions in `src/main.cpp`:

- Body positions, velocities, and masses
- Gravitational constant (G)
- Time step (dt) for integration accuracy
- Body colors and sizes

After making changes, rebuild with `./build.sh`

## Technology Stack

- **C++17**: Core physics computation
- **Emscripten**: C++ to WebAssembly compiler
- **WebAssembly**: High-performance code execution in browser
- **HTML5 Canvas**: Visualization and rendering
- **JavaScript**: UI controls and animation loop