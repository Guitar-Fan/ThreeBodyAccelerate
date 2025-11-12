# 🌌 Three-Body Problem Simulator

An interactive, feature-rich web application for simulating the three-body problem - one of the most fascinating challenges in classical mechanics and celestial dynamics.

![Three-Body Simulation](https://img.shields.io/badge/Physics-Simulation-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![No Dependencies](https://img.shields.io/badge/dependencies-none-orange)

## 🎯 What is the Three-Body Problem?

The three-body problem seeks to predict the motion of three celestial bodies under mutual gravitational attraction. Unlike the two-body problem (which has closed-form solutions), the three-body system exhibits chaotic behavior where tiny changes in initial conditions lead to drastically different outcomes over time.

This simulator allows you to:
- Explore famous periodic solutions like the Figure-Eight orbit
- Visualize energy conservation and phase space dynamics
- Experiment with different numerical integrators
- Study chaotic scattering and hierarchical systems
- Test numerical accuracy with time reversal

## ✨ Features

### Physics Engine
- **Multiple Numerical Integrators:**
  - Velocity Verlet (Symplectic - best for long-term energy conservation)
  - Runge-Kutta 4th Order (Higher accuracy per step)
  - Euler (Fast but less accurate)
- **Realistic Gravitational Physics** - No external physics libraries, all implemented from scratch
- **Collision Handling** - Merge bodies or elastic collisions
- **Softening Parameter** - Prevents singularities at close approaches
- **Conservation Monitoring** - Track energy, momentum, and angular momentum

### Advanced Features
- **Time Reversal** - Run simulation backwards to test numerical accuracy
- **Energy History Graph** - Monitor energy conservation over time
- **Phase Space Plots** - Visualize system evolution in phase space
- **Poincaré Sections** - Study periodic orbits and chaotic regions
- **Center of Mass Tracking** - Follow the system's center of mass
- **Real-time Diagnostics** - FPS, energy drift, momentum, and more

### Visual Experience
- **Beautiful Space-Themed UI** - Modern gradient design with glow effects
- **Smooth Trails** - Fading orbital paths with configurable length
- **Velocity & Force Vectors** - Visualize motion and gravitational forces
- **Glow Effects** - Celestial bodies with realistic glow halos
- **Grid Overlay** - Optional coordinate grid for reference
- **Responsive Zoom** - Smooth camera zoom and pan

### Interaction
- **Click to Add Bodies** - Place new bodies with mouse clicks
- **Drag to Set Velocity** - Visual velocity vector creation
- **Right-Click to Delete** - Remove bodies easily
- **Scroll to Zoom** - Intuitive camera controls
- **Keyboard Shortcuts:**
  - `Space` - Play/Pause
  - `R` - Reset simulation
  - `C` - Clear trails

### Presets
Ten carefully crafted initial conditions including:
- **Figure-Eight** (Moore, 1993) - Famous periodic orbit
- **Lagrange Triangle** - Rotating equilateral configuration
- **Binary + Planet** - Hierarchical system
- **Pythagorean** - 3-4-5 mass ratio (chaotic)
- **Butterfly I** - Beautiful periodic orbit
- **Broucke A1** - Stable periodic solution
- **Sun-Earth-Moon** - Simplified solar system
- **Chaotic Scattering** - Extreme sensitivity demo
- And more...

### Export & Share
- **JSON Export/Import** - Save and load custom scenarios
- **Permalink Generation** - Share configurations via URL
- **Customizable Bodies** - Edit mass, radius, color, and position

## 🚀 Getting Started

### Installation

No installation required! Simply open `index.html` in a modern web browser.

```bash
# Clone the repository
git clone https://github.com/yourusername/ThreeBodyAccelerate.git

# Navigate to the directory
cd ThreeBodyAccelerate

# Open in your browser
open index.html
# or
python -m http.server 8000  # Then visit http://localhost:8000
```

### Browser Compatibility

Works best in modern browsers:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

Requires JavaScript enabled and HTML5 Canvas support.

## 📖 How to Use

### Basic Controls

1. **Starting a Simulation:**
   - Choose a preset from the sidebar, or
   - Click on the canvas to place bodies
   - Drag from a body to set its initial velocity

2. **Running the Simulation:**
   - Press `Play` to start
   - Adjust `Time Step (dt)` for accuracy vs. speed
   - Change `Speed` multiplier for faster/slower playback

3. **Experimenting:**
   - Try different integrators and compare energy conservation
   - Enable Poincaré sections to find periodic orbits
   - Reverse time to test numerical accuracy
   - Track the center of mass to verify momentum conservation

### Understanding the Diagnostics

- **Total Energy** - Should remain constant (check ΔE% for drift)
- **Momentum** - Should be conserved (near zero for isolated system)
- **Angular Momentum** - Conserved quantity about the origin
- **Energy Drift (ΔE%)** - Indicates numerical error
  - < 0.1% - Excellent
  - < 1% - Good
  - > 5% - Consider lowering dt or using Verlet integrator

### Tips for Best Results

- **For Long Simulations:** Use Velocity Verlet integrator
- **For Accuracy:** Lower the time step (dt)
- **For Close Encounters:** Increase softening parameter
- **For Chaos Studies:** Use Poincaré sections and phase space plots
- **For Performance:** Reduce trail length or disable glow effects

## 🔬 Physics Implementation

### Gravitational Force

The force between two bodies i and j is calculated as:

```
F_ij = G * m_i * m_j * (r_j - r_i) / (|r_j - r_i|² + ε²)^(3/2)
```

Where:
- `G` - Gravitational constant
- `m_i, m_j` - Masses
- `r_i, r_j` - Position vectors
- `ε` - Softening parameter (prevents singularities)

### Velocity Verlet Integrator

Symplectic integrator that preserves energy structure:

```
v += 0.5 * a * dt
x += v * dt
recalculate a
v += 0.5 * a * dt
```

### Conservation Laws

The simulator monitors:
- **Energy:** E = K + U where K = Σ½mv² and U = -GΣΣm_im_j/r_ij
- **Linear Momentum:** P = Σm_iv_i
- **Angular Momentum:** L = Σm_i(r_i × v_i)

## 🎨 Customization

### Adding New Presets

Edit `js/presets.js` and add your configuration:

```javascript
myCustomPreset: {
    name: "My Preset",
    description: "Custom three-body configuration",
    bodies: [
        {
            id: 'body1',
            mass: 1.0,
            x: 1.0, y: 0.0,
            vx: 0.0, vy: 0.5,
            radius: 8,
            color: '#ff6b6b',
            trail: []
        },
        // Add more bodies...
    ],
    settings: {
        dt: 0.01,
        G: 1.0,
        softening: 0.01,
        integrator: 'verlet'
    }
}
```

### Styling

Customize colors and appearance in `css/style.css`. The app uses CSS variables for easy theming.

## 📊 Performance

- **Typical FPS:** 60 FPS with 3-5 bodies
- **Scalability:** O(N²) where N is number of bodies
- **Optimization:** Use lower trail lengths for better performance

## 🤝 Contributing

Contributions are welcome! Areas for improvement:
- Additional famous periodic orbits
- Better visualization options
- Performance optimizations
- Mobile touch support improvements
- Accessibility enhancements

## 📚 References

### Scientific Papers
- Moore, C. (1993). "Braids in classical dynamics"
- Šuvakov, M. & Dmitrašinović, V. (2013). "Three Classes of Newtonian Three-Body Planar Periodic Orbits"
- Broucke, R. (1975). "Periodic Orbits in the Restricted Three-Body Problem"

### Numerical Methods
- Hairer, E., Lubich, C., & Wanner, G. (2006). "Geometric Numerical Integration"
- Press, W. H., et al. (2007). "Numerical Recipes"

## 📄 License

MIT License - Feel free to use, modify, and distribute.

## 🌟 Acknowledgments

- Inspired by PhET Interactive Simulations
- Periodic orbit data from Šuvakov and Dmitrašinović (2013)
- Built with vanilla JavaScript - no frameworks required!

---

**Enjoy exploring the beautiful chaos of gravitational dynamics! 🌌**