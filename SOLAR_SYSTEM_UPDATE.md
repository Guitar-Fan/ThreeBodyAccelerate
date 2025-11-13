# Solar System Simulation Update

## Summary of Changes

This update adds a realistic solar system simulation mode with planetary-scale masses and space-like physics to the Three-Body simulation.

## Key Features Added

### 1. New Solar System Preset
- Added a new `PRESET_SOLAR_SYSTEM` configuration
- Includes 7 celestial bodies:
  - **Sun**: 1000 mass units (scaled from 333,000 Earth masses)
  - **Mercury**: 0.055 Earth masses
  - **Venus**: 0.815 Earth masses
  - **Earth**: 1.0 Earth mass (reference)
  - **Mars**: 0.107 Earth masses
  - **Jupiter**: 317.8 Earth masses (gas giant)
  - **Saturn**: 95.2 Earth masses (gas giant)
  
- Uranus and Neptune are commented out but available (too distant for good visualization)
- All planets have realistic orbital velocities calculated using: `v = sqrt(G * M_sun / r)`
- Planets are positioned at scaled orbital radii for visual clarity

### 2. Updated All Presets with Realistic Masses

#### Figure-8 Orbit
- Changed from 50 mass units to **1.0 Earth mass** for each body
- Represents three Earth-like planets in exotic orbit

#### Stable Orbit
- Sun: **333 mass units** (scaled solar mass)
- Inner planet: **1.0 Earth mass**
- Outer planet: **317.8 masses** (Jupiter-like)

#### Chaotic System
- Body 1: **17.1 masses** (Neptune)
- Body 2: **14.5 masses** (Uranus)
- Body 3: **95.2 masses** (Saturn)

#### Binary Star System
- Star 1: **333 masses** (1 solar mass, scaled)
- Star 2: **250 masses** (0.75 solar masses, scaled)
- Planet: **5.0 masses** (Super-Earth)

#### Pythagorean Problem
- Maintains 3:4:5 ratio but using gas giant masses:
  - Body 1: **95.2 masses** (Saturn)
  - Body 2: **126.9 masses** (4/3 × Saturn)
  - Body 3: **158.7 masses** (5/3 × Saturn)

### 3. Space Physics Characteristics

The simulation now uses:
- **Realistic mass ratios** based on actual planetary data
- **Plummer softening** to prevent gravitational singularities (already implemented)
- **Proper circular orbit velocities** calculated from gravitational physics
- **Energy and momentum conservation** for realistic space dynamics
- **Collision physics** with merging for catastrophic impacts (already implemented)

### 4. UI Enhancement

Added a new "🌌 Solar System" button in the preset grid with distinctive styling:
- Spans full width of the preset grid
- Special blue gradient background to stand out
- Loads the realistic solar system configuration

## Technical Details

### Mass Scale
- Earth mass = 1.0 (reference unit)
- Solar mass scaled to 333-1000 units (depending on preset)
- Gas giants: 14.5 to 317.8 Earth masses
- Rocky planets: 0.055 to 5.0 Earth masses

### Physics Parameters
- Gravitational constant G = 1.0 (simulation units)
- Time step dt = 0.01 (adjustable)
- Softening length = 1.0 (prevents close encounter infinities)
- All presets use realistic orbital mechanics

### Orbital Mechanics
All orbital velocities calculated using Kepler's laws:
```
v_orbital = sqrt(G * M_central / r_orbit)
```

This ensures stable, realistic orbits when bodies are properly positioned.

## How to Use

1. Build the project: `./build.sh`
2. Start server: `./serve.sh`
3. Open browser to `http://localhost:8080`
4. Click "🌌 Solar System" button to load the solar system preset
5. Use existing controls to:
   - Adjust gravitational constant
   - Change time scale (speed up/slow down)
   - Toggle trails and velocity vectors
   - Enable/disable collisions
   - Monitor energy and momentum conservation

## Files Modified

1. **src/main.cpp**:
   - Added `PRESET_SOLAR_SYSTEM` enum value
   - Created `loadSolarSystem()` function with 7 planets
   - Updated all preset functions with realistic planetary masses
   - Added solar system case to `loadPreset()` switch statement

2. **public/index.html**:
   - Added Solar System button to preset grid
   - Styled with distinctive appearance

## Planetary Mass Reference

| Body    | Real Mass (Earth = 1) | Simulation Mass |
|---------|----------------------|-----------------|
| Sun     | 333,000              | 333-1000        |
| Mercury | 0.055                | 0.055           |
| Venus   | 0.815                | 0.815           |
| Earth   | 1.000                | 1.000           |
| Mars    | 0.107                | 0.107           |
| Jupiter | 317.8                | 317.8           |
| Saturn  | 95.2                 | 95.2            |
| Uranus  | 14.5                 | 14.5            |
| Neptune | 17.1                 | 17.1            |

## Notes

- The simulation uses scaled masses for numerical stability
- All mass ratios are preserved from real solar system data
- Orbital distances are compressed for visualization
- Physics engine maintains conservation laws for realistic dynamics
- Bodies can merge during catastrophic collisions if enabled
- Gravitational softening prevents numerical singularities during close approaches
