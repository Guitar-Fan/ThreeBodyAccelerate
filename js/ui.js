/**
 * UI Controller
 * Handles all user interface interactions and updates
 */

class UIController {
    constructor(app) {
        this.app = app;
        this.setupEventListeners();
        this.updateAllControls();
    }

    setupEventListeners() {
        // Playback controls
        document.getElementById('btn-play').addEventListener('click', () => this.app.play());
        document.getElementById('btn-pause').addEventListener('click', () => this.app.pause());
        document.getElementById('btn-step').addEventListener('click', () => this.app.step());
        document.getElementById('btn-reset').addEventListener('click', () => this.app.reset());
        document.getElementById('btn-reverse').addEventListener('click', () => this.app.reverseTime());
        document.getElementById('btn-clear-trails').addEventListener('click', () => this.app.clearTrails());

        // Time controls
        document.getElementById('dt-slider').addEventListener('input', (e) => {
            this.app.dt = parseFloat(e.target.value);
            document.getElementById('dt-value').textContent = this.app.dt.toFixed(3);
        });

        document.getElementById('speed-slider').addEventListener('input', (e) => {
            this.app.speed = parseFloat(e.target.value);
            document.getElementById('speed-value').textContent = this.app.speed.toFixed(1) + '×';
        });

        // Integrator
        document.getElementById('integrator-select').addEventListener('change', (e) => {
            this.app.physics.integrator = e.target.value;
        });

        // Physics parameters
        document.getElementById('softening-slider').addEventListener('input', (e) => {
            this.app.physics.softening = parseFloat(e.target.value);
            document.getElementById('softening-value').textContent = this.app.physics.softening.toFixed(2);
        });

        document.getElementById('g-slider').addEventListener('input', (e) => {
            this.app.physics.G = parseFloat(e.target.value);
            document.getElementById('g-value').textContent = this.app.physics.G.toFixed(1);
        });

        // Collision mode
        document.getElementById('collision-mode').addEventListener('change', (e) => {
            this.app.physics.collisionMode = e.target.value;
        });

        // Visual settings
        document.getElementById('show-trails').addEventListener('change', (e) => {
            this.app.renderer.showTrails = e.target.checked;
        });

        document.getElementById('trail-length').addEventListener('input', (e) => {
            this.app.renderer.trailLength = parseInt(e.target.value);
            document.getElementById('trail-length-value').textContent = e.target.value;
        });

        document.getElementById('show-velocities').addEventListener('change', (e) => {
            this.app.renderer.showVelocities = e.target.checked;
        });

        document.getElementById('show-forces').addEventListener('change', (e) => {
            this.app.renderer.showForces = e.target.checked;
        });

        document.getElementById('show-grid').addEventListener('change', (e) => {
            this.app.renderer.showGrid = e.target.checked;
        });

        document.getElementById('glow-effect').addEventListener('change', (e) => {
            this.app.renderer.glowEffect = e.target.checked;
        });

        // Center of mass tracking
        document.getElementById('track-com').addEventListener('change', (e) => {
            this.app.renderer.trackCOM = e.target.checked;
        });

        // Poincaré section
        document.getElementById('poincare-section').addEventListener('change', (e) => {
            this.app.diagnostics.togglePoincare();
        });

        // Add body
        document.getElementById('add-body').addEventListener('click', () => {
            this.app.addBody({
                id: `body_${Date.now()}`,
                mass: 1.0,
                x: (Math.random() - 0.5) * 4,
                y: (Math.random() - 0.5) * 4,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                radius: 8,
                color: this.randomColor(),
                trail: []
            });
        });

        // Export/Import
        document.getElementById('export-json').addEventListener('click', () => this.exportJSON());
        document.getElementById('import-json').addEventListener('click', () => {
            document.getElementById('file-input').click();
        });
        document.getElementById('file-input').addEventListener('change', (e) => this.importJSON(e));
        document.getElementById('permalink').addEventListener('click', () => this.copyPermalink());

        // Help modal
        document.getElementById('toggle-help').addEventListener('click', () => {
            document.getElementById('help-modal').style.display = 'block';
        });

        document.querySelector('.close').addEventListener('click', () => {
            document.getElementById('help-modal').style.display = 'none';
        });

        window.addEventListener('click', (e) => {
            if (e.target === document.getElementById('help-modal')) {
                document.getElementById('help-modal').style.display = 'none';
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.app.togglePlayPause();
            } else if (e.code === 'KeyR') {
                this.app.reset();
            } else if (e.code === 'KeyC') {
                this.app.clearTrails();
            }
        });

        // Canvas mouse events
        const canvas = document.getElementById('main-canvas');
        let mouseDown = false;
        let dragStart = null;
        let draggedBody = null;

        canvas.addEventListener('mousedown', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const worldPos = this.app.renderer.screenToWorld(x, y);

            // Check if clicking on existing body
            for (const body of this.app.bodies) {
                const dx = body.x - worldPos.x;
                const dy = body.y - worldPos.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < body.radius / this.app.renderer.camera.zoom) {
                    if (e.button === 2) { // Right click to delete
                        e.preventDefault();
                        this.app.removeBody(body);
                        return;
                    } else {
                        draggedBody = body;
                        dragStart = { x, y, worldPos };
                        mouseDown = true;
                        return;
                    }
                }
            }

            // Start dragging for new body or velocity
            mouseDown = true;
            dragStart = { x, y, worldPos };
        });

        canvas.addEventListener('mousemove', (e) => {
            if (!mouseDown || !dragStart) return;

            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            this.app.dragState = {
                dragging: true,
                start: dragStart,
                current: { x, y }
            };
        });

        canvas.addEventListener('mouseup', (e) => {
            if (!mouseDown || !dragStart) return;

            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const worldEnd = this.app.renderer.screenToWorld(x, y);

            if (draggedBody) {
                // Set velocity for existing body
                const velocityScale = 0.1;
                draggedBody.vx = (worldEnd.x - dragStart.worldPos.x) * velocityScale;
                draggedBody.vy = (worldEnd.y - dragStart.worldPos.y) * velocityScale;
            } else {
                // Create new body
                const velocityScale = 0.1;
                this.app.addBody({
                    id: `body_${Date.now()}`,
                    mass: 1.0,
                    x: dragStart.worldPos.x,
                    y: dragStart.worldPos.y,
                    vx: (worldEnd.x - dragStart.worldPos.x) * velocityScale,
                    vy: (worldEnd.y - dragStart.worldPos.y) * velocityScale,
                    radius: 8,
                    color: this.randomColor(),
                    trail: []
                });
            }

            mouseDown = false;
            dragStart = null;
            draggedBody = null;
            this.app.dragState = null;
        });

        canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        // Mouse wheel for zoom
        canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.app.renderer.zoom(e.deltaY, x, y);
        });

        // Load presets
        this.loadPresets();
    }

    loadPresets() {
        const container = document.getElementById('presets-container');
        container.innerHTML = '';

        for (const [key, preset] of Object.entries(Presets)) {
            const btn = document.createElement('div');
            btn.className = 'preset-btn';
            btn.innerHTML = `
                <h4>${preset.name}</h4>
                <p>${preset.description}</p>
            `;
            btn.addEventListener('click', () => this.app.loadPreset(key));
            container.appendChild(btn);
        }
    }

    updateBodiesList() {
        const container = document.getElementById('bodies-list');
        container.innerHTML = '';

        this.app.bodies.forEach((body, index) => {
            const item = document.createElement('div');
            item.className = 'body-item';
            item.innerHTML = `
                <h4>
                    Body ${index + 1}
                    <button class="delete-body" data-id="${body.id}">Delete</button>
                </h4>
                <label>Mass: <input type="number" step="0.1" value="${body.mass}" data-id="${body.id}" data-prop="mass"></label>
                <label>Radius: <input type="number" step="1" value="${body.radius}" data-id="${body.id}" data-prop="radius"></label>
                <label>Color: <input type="color" value="${body.color}" data-id="${body.id}" data-prop="color"></label>
            `;
            container.appendChild(item);
        });

        // Add event listeners for body controls
        container.querySelectorAll('input[data-prop]').forEach(input => {
            input.addEventListener('input', (e) => {
                const body = this.app.bodies.find(b => b.id === e.target.dataset.id);
                if (body) {
                    const prop = e.target.dataset.prop;
                    if (prop === 'color') {
                        body[prop] = e.target.value;
                    } else {
                        body[prop] = parseFloat(e.target.value);
                    }
                }
            });
        });

        container.querySelectorAll('.delete-body').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const body = this.app.bodies.find(b => b.id === e.target.dataset.id);
                if (body) {
                    this.app.removeBody(body);
                }
            });
        });
    }

    updateDiagnostics(diagnostics, time, steps, fps) {
        document.getElementById('diag-time').textContent = time.toFixed(2);
        document.getElementById('diag-steps').textContent = steps;
        document.getElementById('diag-fps').textContent = fps.toFixed(0);
        document.getElementById('diag-bodies').textContent = this.app.bodies.length;
        document.getElementById('diag-energy').textContent = diagnostics.totalEnergy.toFixed(4);
        
        const energyDrift = this.app.diagnostics.initialEnergy 
            ? ((diagnostics.totalEnergy - this.app.diagnostics.initialEnergy) / Math.abs(this.app.diagnostics.initialEnergy) * 100)
            : 0;
        document.getElementById('diag-energy-drift').textContent = energyDrift.toFixed(4);
        
        document.getElementById('diag-momentum').textContent = diagnostics.momentum.magnitude.toFixed(4);
        document.getElementById('diag-angular').textContent = diagnostics.angularMomentum.toFixed(4);
        
        document.getElementById('com-x').textContent = diagnostics.centerOfMass.x.toFixed(4);
        document.getElementById('com-y').textContent = diagnostics.centerOfMass.y.toFixed(4);
        
        const comDrift = Math.sqrt(
            diagnostics.centerOfMass.x ** 2 + 
            diagnostics.centerOfMass.y ** 2
        );
        document.getElementById('com-drift').textContent = comDrift.toFixed(4);
    }

    updateAllControls() {
        document.getElementById('dt-value').textContent = this.app.dt.toFixed(3);
        document.getElementById('speed-value').textContent = this.app.speed.toFixed(1) + '×';
        document.getElementById('softening-value').textContent = this.app.physics.softening.toFixed(2);
        document.getElementById('g-value').textContent = this.app.physics.G.toFixed(1);
        document.getElementById('trail-length-value').textContent = this.app.renderer.trailLength;
    }

    randomColor() {
        const colors = ['#ff6b6b', '#4ecdc4', '#ffd93d', '#ff6b9d', '#c44569', '#6c5ce7', '#00d2d3'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    exportJSON() {
        const data = {
            bodies: this.app.bodies.map(b => ({
                ...b,
                trail: [] // Don't export trails
            })),
            settings: {
                dt: this.app.dt,
                G: this.app.physics.G,
                softening: this.app.physics.softening,
                integrator: this.app.physics.integrator,
                collisionMode: this.app.physics.collisionMode
            }
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'three-body-simulation.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    importJSON(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                this.app.loadCustomPreset(data);
            } catch (error) {
                alert('Error loading file: ' + error.message);
            }
        };
        reader.readAsText(file);
    }

    copyPermalink() {
        const data = {
            bodies: this.app.bodies.map(b => ({
                mass: b.mass,
                x: b.x,
                y: b.y,
                vx: b.vx,
                vy: b.vy,
                radius: b.radius,
                color: b.color
            })),
            settings: {
                dt: this.app.dt,
                G: this.app.physics.G,
                softening: this.app.physics.softening
            }
        };

        const encoded = btoa(JSON.stringify(data));
        const url = window.location.origin + window.location.pathname + '?scene=' + encoded;
        
        navigator.clipboard.writeText(url).then(() => {
            alert('Permalink copied to clipboard!');
        });
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIController;
}
