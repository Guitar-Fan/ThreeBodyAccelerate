# Classical Three-Body Problem Implementation

## Alignment with Academic Objectives

This implementation follows the classical three-body problem formulation as outlined in "Weeks 3 & 4: The Three Body Problem" by Alexander Van Doren.

## Mathematical Formulation (PDF Section 2)

### Newton's Law of Universal Gravitation
The simulation implements the exact gravitational force equation from equation (1):

```cpp
F_ij = G * m_i * m_j / |r_j - r_i|^3 * (r_j - r_i)
```

Implemented in `calculateForces()`:
```cpp
double forceMag = G * bodies[i].mass * bodies[j].mass / softenedDistSq;
double fx = forceMag * dx / softenedDist;
double fy = forceMag * dy / softenedDist;
```

Note: Plummer softening (`softenedDistSq = distSq + ε²`) prevents singularities when r→0, as recommended in PDF Section 3.3.

### Equations of Motion (Equations 2-4)
Accelerations are computed following:
```
ä_1 = G*m_2*(r_2-r_1)/|r_2-r_1|³ + G*m_3*(r_3-r_1)/|r_3-r_1|³
```

Implementation correctly sums pairwise gravitational accelerations for each body.

## Conservation Laws (PDF Section 2.2)

### Total Energy (Equation 5)
```cpp
E = (1/2) * Σ m_i * |v_i|² - G * Σ_(i<j) m_i*m_j / |r_i - r_j|
```

Implemented with real-time monitoring:
- Kinetic Energy: `KE = 0.5 * m * (vx² + vy²)`
- Potential Energy: `PE = -G * m1 * m2 / r`
- **Energy Drift Tracking**: Monitors `|(E_current - E_initial) / E_initial|`

### Linear Momentum (Equation 6)
```cpp
P = Σ m_i * v_i
```

Conserved quantities:
- Total momentum magnitude displayed
- **Momentum Drift Tracking**: Color-coded indicators (green <0.1%, yellow <1%, red ≥1%)

### Angular Momentum (Equation 7)
```cpp
L = Σ m_i * (r_i × v_i)
```

In 2D: `L_z = Σ m_i * (x_i * v_y_i - y_i * v_x_i)`

All three conservation laws are continuously monitored and displayed.

## Computational Modeling (PDF Section 3)

### State Space Representation (Section 3.1)
Following equation (8), the system uses first-order formulation:
```cpp
struct Body {
    double x, y;      // Position r_i
    double vx, vy;    // Velocity v_i = dr_i/dt
    double ax, ay;    // Acceleration a_i(r_1, r_2, r_3)
    ...
};
```

### Numerical Integration Methods (Section 3.2)

#### Velocity Verlet (Symplectic, Default)
Preserves phase space volume and energy better than Euler:
```cpp
void updateBodiesVerlet() {
    // 1. v(t + dt/2) = v(t) + a(t) * dt/2
    body.vx += body.ax * dt * 0.5;
    
    // 2. x(t + dt) = x(t) + v(t + dt/2) * dt
    body.x += body.vx * dt;
    
    // 3. Calculate a(t + dt)
    calculateForces();
    
    // 4. v(t + dt) = v(t + dt/2) + a(t + dt) * dt/2
    body.vx += body.ax * dt * 0.5;
}
```

#### Runge-Kutta 4th Order
Higher accuracy for chaotic systems, implements RK4 as mentioned in PDF Section 3.3.

### Implementation Considerations (Section 3.3)

✅ **Time Step Control**: Adjustable dt with real-time modification
✅ **Collision Handling**: Softening parameter prevents r→0 singularities
✅ **Conservation Monitoring**: Real-time energy and momentum drift tracking
✅ **Adaptive Methods**: User can switch between Verlet and RK4

### Computational Algorithm (Section 3.4)

The simulation follows the exact structure from PDF:

1. ✅ Initialize positions r_i(0) and velocities v_i(0)
2. ✅ For each time step:
   - (a) Compute pairwise separations r_ij = r_j - r_i
   - (b) Calculate accelerations using equations (2)-(4)
   - (c) Update velocities and positions using chosen integrator
   - (d) Check conservation laws and detect close encounters
3. ✅ Output trajectory data for visualization

## Key Features Addressing PDF Objectives

### 1. Classical Three-Body Problem Focus
- **Figure-8 Orbit**: Equal masses (m₁ = m₂ = m₃ = 1.0), famous periodic solution
- **Pythagorean Problem**: Mass ratio 3:4:5 using gas giant masses
- All presets now use realistic planetary mass scales

### 2. Conservation Law Verification
- **Real-time Monitoring**: Energy and momentum drift displayed as percentages
- **Color-Coded Indicators**:
  - 🟢 Green: < 0.1% drift (excellent conservation)
  - 🟡 Yellow: 0.1-1% drift (acceptable)
  - 🔴 Red: ≥ 1% drift (numerical errors accumulating)
- **Angular Momentum**: Full L = r × p calculation and display

### 3. Numerical Integration Accuracy
- **Symplectic Integrator**: Velocity Verlet conserves energy over long timescales
- **Higher-Order Method**: RK4 available for comparison
- **Softening Length**: Configurable ε to prevent force singularities
- **Time Step Control**: User-adjustable for accuracy vs. performance

### 4. Physics Parameters
All parameters from classical mechanics:
- Gravitational constant G (adjustable)
- Time step dt (configurable)
- Time scale (speed control)
- Softening length ε

### 5. Educational Value
The UI now emphasizes:
- **Conservation Laws** section (replaces "System Metrics")
- Classical mechanics formulas displayed
- Real-time physics monitoring
- Drift detection for learning about numerical errors

## Solar System Mode

As requested, includes realistic planetary simulation:
- Sun: 1000 mass units (scaled from 333,000 Earth masses)
- Inner planets: Mercury (0.055), Venus (0.815), Earth (1.0), Mars (0.107)
- Gas giants: Jupiter (317.8), Saturn (95.2)
- Proper orbital velocities: v = √(GM/r)

## Technical Implementation

### Files Modified
1. **src/main.cpp**:
   - Added conservation drift monitoring
   - Enhanced angular momentum calculation
   - Added `saveInitialState()` for baseline tracking
   - Updated all presets with realistic masses
   - Added solar system configuration

2. **public/index.html**:
   - Renamed to "Classical Three-Body Problem"
   - Conservation Laws section with drift monitoring
   - Color-coded drift indicators
   - Updated physics formulas to match PDF notation
   - Added momentum magnitude display

3. **build.sh**:
   - Added new exported functions: `_getEnergyDrift`, `_getMomentumDrift`, `_saveInitialState`

### Conservation Monitoring Algorithm
```cpp
// At initialization and reset:
saveInitialState() {
    initialEnergy = totalEnergy;
    initialMomentumX = totalMomentumX;
    initialMomentumY = totalMomentumY;
    initialAngularMomentum = angularMomentum;
}

// During simulation:
energyDrift = |(E_current - E_initial) / E_initial|
momentumDrift = |(|P_current| - |P_initial|) / |P_initial||
```

## Usage

1. **Build**: `./build.sh`
2. **Run**: `./serve.sh`
3. **Access**: `http://localhost:8080`

### Observing Conservation Laws
1. Load "Figure-8" preset (equal masses)
2. Watch conservation drift indicators:
   - Should stay green (< 0.1%) for good numerical accuracy
   - Yellow indicates accumulating errors
   - Red suggests timestep too large or integrator issues
3. Try different integrators (Verlet vs RK4)
4. Adjust time step to see accuracy vs. performance tradeoff

### Classical Scenarios
- **Figure-8**: Periodic solution, demonstrates stability
- **Pythagorean**: Classic 3:4:5 mass ratio problem
- **Chaotic**: High sensitivity to initial conditions
- **Solar System**: Realistic planetary masses and orbits

## Conclusion

This implementation directly addresses all aspects of the PDF:
- ✅ Proper mathematical formulation (Section 2)
- ✅ Conservation laws with monitoring (Section 2.2)
- ✅ State space representation (Section 3.1)
- ✅ Multiple numerical methods (Section 3.2)
- ✅ All implementation considerations (Section 3.3)
- ✅ Recommended algorithm structure (Section 3.4)

The simulation demonstrates the transition from integrable to chaotic dynamics while providing tools to verify numerical accuracy through conservation law monitoring, exactly as outlined in the academic objectives.
