# 🚀 NASA Asteroid Defense Mission Game

An immersive, educational game demonstrating **three-body orbital mechanics** in a real-world scenario: defending Earth from asteroid impact. Built with modern web technologies and C++ WebAssembly physics.

![Mission Control](https://img.shields.io/badge/Status-Ready-brightgreen) ![Physics](https://img.shields.io/badge/Physics-3--Body-blue) ![Tech](https://img.shields.io/badge/Tech-WebAssembly-orange)

## 🎮 Game Overview

Command NASA's asteroid defense mission from a realistic mission control interface. Use gravitational dynamics, delta-V management, and strategic timing to deflect incoming asteroids using the Earth-Moon-Asteroid three-body system.

### Key Features

- **🎯 Realistic Physics**: Three-body gravitational interactions with WebAssembly-accelerated calculations
- **📊 Real-Time Telemetry**: Live graphs showing threat distance, fuel consumption, and energy transfer
- **🎨 Cinematic Visuals**: PixiJS-powered WebGL rendering with particle effects and trajectory prediction
- **🏆 Achievement System**: Unlock rewards for mastering orbital mechanics
- **📚 Educational Content**: Learn Kepler's laws, delta-V budgets, and gravity assists
- **🎓 Multiple Difficulties**: From beginner-friendly to near-impossible expert mode

## 🛠️ Technology Stack

### Frontend
- **PixiJS 7.4.3** - WebGL rendering engine for high-performance 2D graphics
- **Chart.js 4.5.1** - Real-time telemetry visualization
- **GSAP 3.13.0** - Smooth UI animations and transitions
- **Vite 5.4.21** - Fast build tooling and hot module replacement

### Backend/Physics
- **C++ with Emscripten** - High-performance three-body physics compiled to WebAssembly
- **JavaScript Fallback** - Pure JS physics for development (no WASM compilation needed)

## 🚀 Quick Start

### Prerequisites
```bash
Node.js 18+ and npm
```

### Installation
```bash
cd nasa-mission-game
npm install
```

### Development Mode
```bash
npm run dev
```
Open browser to `http://localhost:5173`

### Production Build
```bash
npm run build
npm run preview
```

## 🎮 How to Play

### Mission Objective
Deploy a spacecraft to deflect an incoming asteroid before it impacts Earth. Use the Moon's gravity and precise trajectory calculations to achieve maximum deflection with limited fuel.

### Controls

**Mission Planning**
1. Select difficulty level (Easy → Expert)
2. Choose deflection strategy:
   - **Kinetic Impactor**: Direct collision (high delta-V, instant effect)
   - **Gravity Tractor**: Proximity hover (low fuel, requires precision)
   - **Explosive Device**: Detonation near surface (moderate, area effect)

**Deployment**
1. Adjust launch velocity (0-15 km/s)
2. Set launch angle (0-360°)
3. Monitor launch window indicator (optimal = green)
4. Click **DEPLOY SPACECRAFT** when ready

**Mid-Course Corrections**
- Use sparingly (limited by difficulty)
- Refine trajectory after initial burn
- Apply corrections during transfer phase

**Camera Controls**
- **+/-**: Zoom in/out
- **⌂**: Reset view
- **◎**: Auto-track spacecraft
- **Mouse Drag**: Pan camera
- **Scroll Wheel**: Zoom

### Scoring System

**Base Score Factors**
- **Miss Distance**: Exponential curve (2x safe distance = 100 pts, 10x = 1000 pts)
- **Fuel Efficiency**: Unused delta-V bonus (up to +200 pts)
- **Time Efficiency**: Faster completion = higher multiplier (1.0-2.0x)
- **Precision Bonus**: Deploy in optimal window (+250 pts)

**Multipliers**
- Easy: 1.0x
- Medium: 1.5x
- Hard: 2.0x
- Expert: 3.0x

### Achievements

🌙 **Gravity Guru** - Use Moon's gravity assist  
⛽ **Fuel Efficient** - Complete with >50% delta-V remaining  
⏱️ **Last Second Save** - Intercept with <5% time remaining  
🎯 **Perfect Trajectory** - Score above 950  
🚀 **Quick Deploy** - Launch within first 10% of mission  
🎱 **One Shot Wonder** - No mid-course corrections  
🏆 **Expert Defender** - Beat Expert difficulty  
👑 **Three-Body Master** - All difficulties with 700+ score

## 📐 Physics Simulation

### Three-Body Dynamics

The game simulates the **Earth-Moon-Asteroid** restricted three-body problem:

```
F = G * (m₁ * m₂) / r²
```

**Gravitational Forces**
- Earth: 5.972×10²⁴ kg
- Moon: 7.342×10²² kg  
- Asteroid: 10¹²-10¹³ kg (difficulty dependent)
- Spacecraft: 500 kg

**Integration Methods**
- JavaScript: Euler method (fast, development)
- C++ WASM: RK4 or Verlet (accurate, production)

### Orbital Mechanics Concepts

**Delta-V Budget**: Total velocity change capacity (2000-5000 m/s)  
**Launch Window**: Optimal timing for energy-efficient transfers  
**Gravity Assist**: Using Moon's gravity for trajectory modification  
**Hohmann Transfer**: Energy-optimal orbital transfer path  
**Sphere of Influence**: Region where body's gravity dominates

## 🔧 Development

### Project Structure
```
nasa-mission-game/
├── public/
│   ├── index.html           # Main HTML structure
│   ├── game.js             # Core game engine
│   ├── renderer.js         # PixiJS rendering
│   ├── telemetry.js        # Chart.js dashboards
│   ├── ui-controller.js    # GSAP animations
│   ├── physics-bridge.js   # WASM/JS physics interface
│   └── styles.css          # Mission control theme
├── assets/
│   └── textures/           # Sprites and images
├── mission-config.json     # Game configuration
├── package.json            # Dependencies
└── vite.config.js          # Build configuration
```

### Adding C++ WASM Physics

**1. Activate Emscripten**
```bash
source .emsdkrc
```

**2. Compile Physics Engine**
```bash
emcc ../src/main.cpp -o public/main.js \
  -s WASM=1 \
  -s EXPORTED_FUNCTIONS='["_initialize", "_updatePhysics"]' \
  -s EXPORTED_RUNTIME_METHODS='["ccall", "cwrap"]' \
  -O3
```

**3. Update Physics Bridge**
Modify `physics-bridge.js` to load `main.wasm` instead of using JS fallback.

### Customizing Missions

Edit `mission-config.json`:

```json
{
  "scenarios": [
    {
      "id": "custom-threat",
      "name": "Your Scenario Name",
      "description": "Mission briefing text",
      "asteroidSize": 500,
      "impactProbability": 0.85
    }
  ]
}
```

## 🎓 Educational Resources

### In-Game Tutorials
1. **Kepler's Laws Basics** - Orbital periods and velocities
2. **Understanding Delta-V** - Fuel budgeting and efficiency
3. **Three-Body Dynamics** - Gravitational interactions

### Real-World Context
- **DART Mission** (NASA, 2022): First planetary defense test
- **Deep Impact** (2005): Comet nucleus study
- **Apophis** (2029): Close asteroid flyby observation
- **Restricted Three-Body Problem**: Foundation for mission planning

### Further Learning
- [NASA Planetary Defense](https://www.nasa.gov/planetarydefense)
- [Three-Body Problem Overview](https://en.wikipedia.org/wiki/Three-body_problem)
- [Orbital Mechanics Tutorial](https://www.braeunig.us/space/orbmech.htm)

## 🐛 Troubleshooting

**Game won't start**
- Clear browser cache
- Check console for errors (`F12`)
- Verify dependencies: `npm install`

**Poor performance**
- Reduce particle count (modify `renderer.js`)
- Disable telemetry animations
- Use Firefox/Chrome (better WebGL support)

**Physics behaves strangely**
- Check initial conditions in `mission-config.json`
- Verify time scaling is appropriate
- Consider compiling C++ WASM for accuracy

## 📝 License

MIT License - Educational use encouraged

## 🤝 Contributing

Contributions welcome! Areas for improvement:
- Additional mission scenarios
- Sound effects and music
- Mobile touch controls
- Multiplayer challenge mode
- Tutorial mission improvements

## 🙏 Credits

**Inspired By**
- NASA's Planetary Defense Coordination Office
- The Three-Body Problem (Liu Cixin)
- Kerbal Space Program
- SpaceX Mission Control aesthetics

**Built With**
- PixiJS Team
- Chart.js Contributors  
- GreenSock (GSAP)
- Emscripten Project

---

**🌍 Defend Earth. Master Physics. Become a Three-Body Expert.**
