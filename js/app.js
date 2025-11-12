/**
 * Main Application
 * Orchestrates the three-body simulation
 */

class ThreeBodyApp {
    constructor() {
        // Initialize components
        this.canvas = document.getElementById('main-canvas');
        this.renderer = new Renderer(this.canvas);
        this.physics = new PhysicsEngine({
            G: 1.0,
            softening: 0.01,
            integrator: 'verlet',
            collisionMode: 'merge'
        });
        this.diagnostics = new DiagnosticsPanel(
            document.getElementById('energy-graph'),
            document.getElementById('phase-space')
        );
        
        // Simulation state
        this.bodies = [];
        this.running = false;
        this.time = 0;
        this.steps = 0;
        this.dt = 0.01;
        this.speed = 1;
        this.lastFrameTime = 0;
        this.fps = 60;
        this.dragState = null;
        
        // Initial preset
        this.initialPreset = null;
        
        // UI Controller
        this.ui = new UIController(this);
        
        // Check for URL parameters
        this.loadFromURL();
        
        // Start with a preset if no URL params
        if (this.bodies.length === 0) {
            this.loadPreset('figureEight');
        }
        
        // Start render loop
        this.animate();
    }

    loadFromURL() {
        const params = new URLSearchParams(window.location.search);
        const sceneData = params.get('scene');
        
        if (sceneData) {
            try {
                const data = JSON.parse(atob(sceneData));
                this.loadCustomPreset(data);
            } catch (error) {
                console.error('Error loading scene from URL:', error);
            }
        }
    }

    loadPreset(presetName) {
        const preset = Presets[presetName];
        if (!preset) return;
        
        this.pause();
        this.initialPreset = presetName;
        
        // Deep copy bodies
        this.bodies = JSON.parse(JSON.stringify(preset.bodies));
        
        // Apply settings
        if (preset.settings) {
            this.dt = preset.settings.dt || 0.01;
            this.physics.G = preset.settings.G || 1.0;
            this.physics.softening = preset.settings.softening || 0.01;
            this.physics.integrator = preset.settings.integrator || 'verlet';
            this.physics.collisionMode = preset.settings.collisionMode || 'merge';
        }
        
        this.time = 0;
        this.steps = 0;
        this.physics.timeDirection = 1;
        
        this.diagnostics.reset();
        this.ui.updateAllControls();
        this.ui.updateBodiesList();
        
        // Update UI selects
        document.getElementById('integrator-select').value = this.physics.integrator;
        document.getElementById('collision-mode').value = this.physics.collisionMode;
        document.getElementById('dt-slider').value = this.dt;
        document.getElementById('g-slider').value = this.physics.G;
        document.getElementById('softening-slider').value = this.physics.softening;
    }

    loadCustomPreset(data) {
        this.pause();
        
        this.bodies = data.bodies.map(b => ({
            ...b,
            trail: []
        }));
        
        if (data.settings) {
            this.dt = data.settings.dt || 0.01;
            this.physics.G = data.settings.G || 1.0;
            this.physics.softening = data.settings.softening || 0.01;
            if (data.settings.integrator) {
                this.physics.integrator = data.settings.integrator;
            }
            if (data.settings.collisionMode) {
                this.physics.collisionMode = data.settings.collisionMode;
            }
        }
        
        this.time = 0;
        this.steps = 0;
        this.physics.timeDirection = 1;
        this.initialPreset = null;
        
        this.diagnostics.reset();
        this.ui.updateAllControls();
        this.ui.updateBodiesList();
    }

    reset() {
        if (this.initialPreset) {
            this.loadPreset(this.initialPreset);
        } else {
            this.time = 0;
            this.steps = 0;
            this.physics.timeDirection = 1;
            this.clearTrails();
            this.diagnostics.reset();
        }
    }

    play() {
        this.running = true;
        document.getElementById('btn-play').style.display = 'none';
        document.getElementById('btn-pause').style.display = 'inline-block';
    }

    pause() {
        this.running = false;
        document.getElementById('btn-play').style.display = 'inline-block';
        document.getElementById('btn-pause').style.display = 'none';
    }

    togglePlayPause() {
        if (this.running) {
            this.pause();
        } else {
            this.play();
        }
    }

    step() {
        this.updatePhysics(this.dt);
    }

    reverseTime() {
        this.physics.reverseTime();
        const btn = document.getElementById('btn-reverse');
        if (this.physics.isTimeReversed()) {
            btn.textContent = '⏩ Forward Time';
            btn.style.background = '#ff6b9d';
        } else {
            btn.textContent = '⏪ Reverse Time';
            btn.style.background = '';
        }
    }

    clearTrails() {
        for (const body of this.bodies) {
            body.trail = [];
        }
    }

    addBody(body) {
        this.bodies.push(body);
        this.ui.updateBodiesList();
    }

    removeBody(body) {
        const index = this.bodies.indexOf(body);
        if (index > -1) {
            this.bodies.splice(index, 1);
            this.ui.updateBodiesList();
        }
    }

    updatePhysics(dt) {
        // Step physics
        this.physics.step(this.bodies, dt);
        
        // Update trails
        for (const body of this.bodies) {
            if (!body.trail) body.trail = [];
            body.trail.push({ x: body.x, y: body.y });
            if (body.trail.length > this.renderer.trailLength) {
                body.trail.shift();
            }
        }
        
        this.time += dt * this.physics.timeDirection;
        this.steps++;
        
        // Update diagnostics
        const diag = this.physics.getDiagnostics(this.bodies);
        this.diagnostics.updateEnergy(diag.totalEnergy, this.time);
        this.diagnostics.updatePhaseSpace(this.bodies);
        
        return diag;
    }

    animate(timestamp = 0) {
        requestAnimationFrame((ts) => this.animate(ts));
        
        // Calculate FPS
        const deltaTime = timestamp - this.lastFrameTime;
        this.lastFrameTime = timestamp;
        this.fps = 1000 / deltaTime;
        
        // Update physics multiple times per frame for speed
        if (this.running) {
            const stepsPerFrame = Math.max(1, Math.floor(this.speed));
            for (let i = 0; i < stepsPerFrame; i++) {
                if (this.bodies.length > 0) {
                    this.updatePhysics(this.dt);
                }
            }
        }
        
        // Get diagnostics
        const diagnostics = this.bodies.length > 0 
            ? this.physics.getDiagnostics(this.bodies)
            : {
                totalEnergy: 0,
                momentum: { magnitude: 0 },
                angularMomentum: 0,
                centerOfMass: { x: 0, y: 0 }
            };
        
        // Render
        this.renderer.render(
            this.bodies,
            this.physics,
            diagnostics.centerOfMass,
            this.dragState
        );
        
        // Update diagnostics displays
        this.diagnostics.render();
        this.ui.updateDiagnostics(diagnostics, this.time, this.steps, this.fps);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ThreeBodyApp();
});
