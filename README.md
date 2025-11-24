# ThreeBodyAccelerate

An advanced three-body problem physics simulation using C++ compiled to WebAssembly with Emscripten. This project demonstrates mastery of classical mechanics, numerical integration methods, and high-performance computing in the browser.

## Features

### 🎮 Interactive & Educational
- **Challenge Mode**: Hunt for periodic orbits like the famous Figure-8 solution
- **Particle Effects**: Stunning collision animations with physics-based particles
- **Periodic Orbit Detection**: Automatic notification when bodies return to starting positions
- **Achievement System**: Earn badges for physics milestones and discoveries
- **Interactive Body Creation**: Shift+Drag to create custom bodies with velocities
- **Gravitational Field Visualization**: See force lines when bodies interact closely

### Physics Implementation
- **Custom Gravitational Calculations**: Pure implementation of Newton's Law of Universal Gravitation (F = G·m₁·m₂/r²)
- **Multiple Integration Methods**:
  - Velocity Verlet (symplectic, 2nd order) - default, energy-conserving
  - Runge-Kutta 4th Order (RK4) - higher accuracy for chaotic systems
- **Collision Detection & Response**: Elastic and inelastic collisions with configurable damping
- **Real-time Physics Analysis**:
  - Total energy calculation (kinetic + potential)
  - Linear momentum conservation tracking
  - Center of mass computation
  - System property monitoring
  - Conservation drift monitoring with color-coded warnings

### Advanced Controls
- **Preset Configurations**:
  - Figure-Eight orbit (Moore's famous periodic solution)
  - Stable circular orbits (Kepler-like system)
  - Chaotic system (high sensitivity to initial conditions)
  - Binary star with planet
  - Pythagorean three-body problem (mass ratio 3:4:5)
  
- **Physics Parameters**:
  - Gravitational constant (G) adjustment
  - Time scale control (slow-motion to fast-forward)
  - Integration timestep modification
  - Integrator selection (Verlet vs RK4)
  - Collision enable/disable with damping control

### Visualization Features
- **Trail Effects**: Orbital path visualization with adjustable opacity
- **Velocity Vectors**: Real-time velocity direction and magnitude display
- **Center of Mass Indicator**: Shows the system's barycenter
- **Smooth Animations**: 60 FPS with WebAssembly performance
- **Glow Effects**: Bodies have radial gradients for visual appeal

### System Monitoring
- Real-time FPS counter
- Simulation time tracking
- Energy conservation verification
- Momentum conservation tracking
- Body count and properties

## Physics Theory

### Gravitational Force
```
F = G × m₁ × m₂ / r²
```
Where:
- F is the gravitational force between two masses
- G is the gravitational constant
- m₁, m₂ are the masses
- r is the distance between centers

### Energy Conservation
```
Total Energy (E) = Kinetic Energy (KE) + Potential Energy (PE)
KE = ½ × m × v²
PE = -G × m₁ × m₂ / r
```

In an ideal system, total energy should remain constant (conservation of energy). Any drift indicates numerical integration errors.

### Momentum Conservation
```
p = m × v (momentum)
Total Momentum = Σ(mᵢ × vᵢ)
```

In a closed system with no external forces, total momentum is conserved in both x and y directions.

### Numerical Integration

#### Velocity Verlet Method
A symplectic integrator that preserves phase space volume:
```
1. v(t + dt/2) = v(t) + a(t) × dt/2
2. x(t + dt) = x(t) + v(t + dt/2) × dt
3. Calculate a(t + dt) from new positions
4. v(t + dt) = v(t + dt/2) + a(t + dt) × dt/2
```

#### Runge-Kutta 4th Order (RK4)
Higher-order method with better accuracy:
```
k₁ = f(t, y)
k₂ = f(t + dt/2, y + k₁×dt/2)
k₃ = f(t + dt/2, y + k₂×dt/2)
k₄ = f(t + dt, y + k₃×dt)
y(t+dt) = y(t) + (k₁ + 2k₂ + 2k₃ + k₄) × dt/6
```

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

### Simulation Control
- **Pause/Play**: Toggle simulation execution
- **Reset**: Return to initial conditions

### Preset Scenarios
- **Figure-8**: Famous periodic solution discovered by Cris Moore (1993)
- **Stable**: Hierarchical system with stable circular orbits
- **Chaotic**: Highly sensitive system demonstrating chaos theory
- **Binary**: Binary star system with orbiting planet
- **Pythagorean**: Classic problem with masses in 3:4:5 ratio

### Physics Parameters
- **Gravitational Constant (G)**: Adjust the strength of gravity (0.1 to 3.0)
- **Time Scale**: Speed up or slow down the simulation (0.1x to 5.0x)
- **Integration Time Step**: Control integration accuracy vs performance (0.001 to 0.05)
- **Integration Method**: Switch between Verlet (fast) and RK4 (accurate)
- **Collision Detection**: Enable/disable physical collisions between bodies
- **Collision Damping**: Control energy loss in collisions (0 = perfectly elastic, 1 = completely inelastic)

### Display Options
- **Show Trails**: Visualize orbital paths over time
- **Show Velocity Vectors**: Display velocity magnitude and direction
- **Show Center of Mass**: Mark the system's barycenter
- **Trail Opacity**: Adjust how quickly trails fade

## Customization

You can modify the physics in `src/main.cpp`:

### Adding New Presets
Create custom initial conditions by adding new preset functions following the pattern:
```cpp
void loadMyPreset() {
    bodies.clear();
    bodies.push_back({
        x, y,        // position
        vx, vy,      // velocity
        0.0, 0.0,    // acceleration (calculated)
        mass,        // mass
        radius,      // display radius
        color,       // RGBA color
        0.0, 0.0     // energies (calculated)
    });
}
```

### Modifying Physics
- Adjust softening parameter in `calculateForces()` to prevent singularities
- Modify integration methods for different accuracy/performance tradeoffs
- Implement additional force laws (electromagnetic, etc.)
- Add drag forces or other effects

After making changes, rebuild with `./build.sh`

## Technology Stack

- **C++17**: Core physics computation with STL vectors and modern features
- **Emscripten**: C++ to WebAssembly compiler toolchain
- **WebAssembly**: High-performance code execution in browser (near-native speed)
- **HTML5 Canvas 2D**: Visualization and rendering with hardware acceleration
- **JavaScript**: UI controls, animation loop, and interactivity
- **Eruda**: Mobile debugging console for development

## Educational Value

This project demonstrates:

1. **Classical Mechanics**:
   - Newton's laws of motion and gravitation
   - Energy and momentum conservation
   - Multi-body gravitational dynamics
   - Chaotic systems and sensitivity to initial conditions

2. **Numerical Methods**:
   - Symplectic integration (Verlet method)
   - Higher-order integration (RK4)
   - Timestep selection and stability
   - Error accumulation and conservation

3. **Computational Physics**:
   - Efficient force calculation (O(n²) algorithm)
   - Collision detection and response
   - Real-time simulation constraints
   - Performance optimization

4. **Software Engineering**:
   - C++ to WebAssembly compilation
   - Memory management in WASM
   - JavaScript-C++ interop
   - Real-time graphics rendering

## Known Phenomena

### Energy Drift
Over long simulation times, numerical errors can cause total energy to drift. This is normal for non-symplectic integrators and large timesteps. The Verlet method minimizes this drift.

### Chaos Sensitivity
The three-body problem is chaotic - tiny changes in initial conditions lead to completely different outcomes. This is a feature of the physics, not a bug!

### Escape Velocities
Bodies can be ejected from the system if they gain enough velocity. This is physically correct and occurs in real gravitational systems.

## Performance Notes

- **Verlet Integration**: ~60 FPS with 3-5 bodies
- **RK4 Integration**: ~30-40 FPS with 3-5 bodies (4x more calculations)
- **WebAssembly Speedup**: ~10-20x faster than pure JavaScript
- **Optimization**: O3 compiler flag, minimal memory allocations

## Future Enhancements

Potential additions:
- 3D visualization with WebGL
- More bodies (N-body simulation)
- Relativistic corrections
- User-interactive body placement
- Orbital parameter display
- Energy/momentum graphs over time
- Preset library expansion
- Export/import of configurations

## License

Open source educational project. Feel free to use and modify.

## References

- Moore, C. (1993). "Braids in classical dynamics". Physical Review Letters.
- Hairer, E., Lubich, C., & Wanner, G. (2006). "Geometric Numerical Integration".
- Press, W. H., et al. (2007). "Numerical Recipes: The Art of Scientific Computing".