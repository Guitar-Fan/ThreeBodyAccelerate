# 🚀 Quick Start Guide

## Running the Simulation

### Option 1: Direct File Open
Simply open `index.html` in your web browser:
- Double-click `index.html`, or
- Right-click → Open with → Your Browser

### Option 2: Local Web Server (Recommended)
For best results, serve via HTTP:

```bash
# Python 3
python3 -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js (if you have http-server installed)
npx http-server

# PHP
php -S localhost:8000
```

Then open: http://localhost:8000

## First Steps

1. **Load a Preset**
   - Click any preset in the sidebar (try "Figure-Eight" first!)
   - Press the ▶️ Play button

2. **Create Custom Bodies**
   - Click on the canvas to place a body
   - Drag from the body to set its velocity (green arrow)
   - Right-click a body to delete it

3. **Adjust Physics**
   - Lower `Time Step (dt)` for more accuracy
   - Increase `Speed` for faster playback
   - Try different integrators (Verlet recommended)

4. **Explore Features**
   - Enable "Show Velocity Vectors" to see motion
   - Toggle "Poincaré Section" for periodic orbit analysis
   - Click "Reverse Time" to test numerical accuracy
   - Monitor energy drift in the diagnostics panel

## Keyboard Shortcuts

- `Space` - Play/Pause
- `R` - Reset to initial state
- `C` - Clear all trails
- Mouse Wheel - Zoom in/out

## Understanding the UI

### Left Panel (Controls)
- **Playback controls** - Play, pause, step, reset
- **Time controls** - Timestep and speed multipliers
- **Physics settings** - Integrator, softening, G constant
- **Visual settings** - Trails, vectors, grid, glow
- **Presets** - Pre-configured scenarios
- **Bodies** - Edit individual body properties
- **Save/Load** - Export/import configurations

### Right Panel (Diagnostics)
- **Real-time stats** - Time, steps, FPS, body count
- **Energy tracking** - Total energy and drift percentage
- **Conservation checks** - Momentum and angular momentum
- **Energy graph** - Historical energy plot
- **Phase space** - Position vs velocity plot
- **Center of mass** - System barycenter tracking

## Tips for Success

### For Beautiful Orbits
- Use "Figure-Eight" or "Lagrange Triangle" presets
- Lower time step to 0.005 or less
- Enable glow effects and long trails

### For Chaos Experiments
- Try "Chaotic Scattering" preset
- Make tiny changes to initial conditions
- Compare trajectories side-by-side

### For Accurate Physics
- Use Velocity Verlet integrator
- Keep time step small (0.001-0.01)
- Monitor energy drift (should be < 1%)
- Test with time reversal

### For Performance
- Reduce trail length to 100-200
- Disable glow effects
- Use Euler integrator for speed
- Lower speed multiplier

## Common Issues

**Energy drift is high (> 5%)**
- Lower the time step (dt)
- Switch to Verlet integrator
- Increase softening parameter for close encounters

**Simulation is slow**
- Increase time step (less accurate but faster)
- Reduce trail length
- Disable glow and vector visualizations

**Bodies escape to infinity**
- Velocities too high - reduce initial velocities
- Check that G constant is appropriate
- Try a stable preset like "Lagrange Triangle"

**Bodies collide instantly**
- Increase softening parameter
- Enable collision mode (merge or elastic)
- Start with more separation

## Recommended Experiments

1. **Energy Conservation Test**
   - Load "Figure-Eight"
   - Run for 1000 steps with Verlet
   - Check energy drift (should be < 0.1%)
   - Now switch to Euler and compare

2. **Chaos Demonstration**
   - Load "Chaotic Scattering"
   - Note the final positions
   - Reset and change one velocity by 0.01
   - Observe completely different outcome

3. **Time Reversal Accuracy**
   - Load any preset
   - Run for 500 steps
   - Click "Reverse Time"
   - Run for 500 steps back
   - Should return near initial state (Verlet best)

4. **Poincaré Section**
   - Load "Figure-Eight"
   - Enable "Poincaré Section"
   - Run simulation
   - Periodic orbit shows discrete points
   - Chaotic orbit fills area densely

## Sharing Your Work

### Export Scenario
1. Click "📥 Export JSON"
2. Saves current configuration
3. Share file with others
4. Import via "📤 Import JSON"

### Create Permalink
1. Click "🔗 Copy Permalink"
2. Share URL with others
3. Contains entire configuration in URL
4. Works across browsers

## Next Steps

- Try all 10 presets
- Create your own stable configurations
- Experiment with mass ratios
- Study energy conservation
- Explore phase space structures
- Test numerical integrators
- Share your discoveries!

---

**Have fun exploring gravitational dynamics! 🌌**

For more details, see the full [README.md](README.md)
