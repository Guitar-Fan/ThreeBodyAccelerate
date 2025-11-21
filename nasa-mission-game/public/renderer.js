// PixiJS Renderer - WebGL visualization system
import * as PIXI from 'pixi.js';

export class Renderer {
    constructor(container) {
        this.container = container;
        this.app = null;
        this.viewport = null;
        this.camera = {
            x: 0,
            y: 0,
            zoom: 1.0,
            targetZoom: 1.0,
            tracking: null
        };
        
        this.sprites = {
            earth: null,
            moon: null,
            asteroid: null,
            spacecraft: null,
            trajectories: []
        };
        
        this.particles = {
            stars: [],
            thruster: null,
            debris: []
        };
        
        this.scale = 1e-6; // 1 pixel = 1000 km
    }

    async init() {
        // Create PixiJS application
        this.app = new PIXI.Application();
        await this.app.init({
            width: this.container.clientWidth,
            height: this.container.clientHeight,
            backgroundColor: 0x000000,
            resolution: window.devicePixelRatio || 1,
            autoDensity: true,
            antialias: true
        });
        
        this.container.appendChild(this.app.canvas);
        
        // Create viewport container
        this.viewport = new PIXI.Container();
        this.app.stage.addChild(this.viewport);
        
        // Initialize scene
        await this.createStarfield();
        await this.createBodies();
        
        // Setup camera controls
        this.setupCameraControls();
        
        // Handle window resize
        window.addEventListener('resize', () => this.handleResize());
        
        console.log('✓ PixiJS Renderer initialized');
    }

    async createStarfield() {
        const starfield = new PIXI.Container();
        this.viewport.addChild(starfield);
        
        // Create parallax layers
        for (let layer = 0; layer < 3; layer++) {
            const layerContainer = new PIXI.Container();
            layerContainer.alpha = 0.3 + (layer * 0.2);
            
            for (let i = 0; i < 100; i++) {
                const star = new PIXI.Graphics();
                const size = Math.random() * 2 + 0.5;
                const brightness = Math.random() * 0.5 + 0.5;
                
                star.beginFill(0xFFFFFF, brightness);
                star.drawCircle(0, 0, size);
                star.endFill();
                
                star.x = Math.random() * this.app.screen.width * 2 - this.app.screen.width;
                star.y = Math.random() * this.app.screen.height * 2 - this.app.screen.height;
                
                layerContainer.addChild(star);
                this.particles.stars.push({ sprite: star, layer: layer });
            }
            
            starfield.addChild(layerContainer);
        }
    }

    async createBodies() {
        // Earth
        this.sprites.earth = new PIXI.Graphics();
        this.sprites.earth.beginFill(0x1E90FF);
        this.sprites.earth.drawCircle(0, 0, 20);
        this.sprites.earth.endFill();
        
        // Add atmosphere glow
        const earthGlow = new PIXI.Graphics();
        earthGlow.beginFill(0x4169E1, 0.3);
        earthGlow.drawCircle(0, 0, 25);
        earthGlow.endFill();
        this.sprites.earth.addChild(earthGlow);
        
        this.viewport.addChild(this.sprites.earth);
        
        // Moon
        this.sprites.moon = new PIXI.Graphics();
        this.sprites.moon.beginFill(0xC0C0C0);
        this.sprites.moon.drawCircle(0, 0, 8);
        this.sprites.moon.endFill();
        this.viewport.addChild(this.sprites.moon);
        
        // Asteroid
        this.sprites.asteroid = new PIXI.Graphics();
        this.sprites.asteroid.beginFill(0x8B4513);
        this.sprites.asteroid.drawCircle(0, 0, 5);
        this.sprites.asteroid.endFill();
        
        // Add danger indicator
        const dangerRing = new PIXI.Graphics();
        dangerRing.lineStyle(2, 0xFF0000, 0.8);
        dangerRing.drawCircle(0, 0, 8);
        this.sprites.asteroid.addChild(dangerRing);
        
        this.viewport.addChild(this.sprites.asteroid);
        
        // Spacecraft (initially hidden)
        this.sprites.spacecraft = new PIXI.Graphics();
        this.sprites.spacecraft.beginFill(0xFFD700);
        this.sprites.spacecraft.drawPolygon([
            0, -6,
            4, 6,
            0, 3,
            -4, 6
        ]);
        this.sprites.spacecraft.endFill();
        this.sprites.spacecraft.visible = false;
        this.viewport.addChild(this.sprites.spacecraft);
        
        // Create trajectory line container
        this.trajectoryGraphics = new PIXI.Graphics();
        this.viewport.addChild(this.trajectoryGraphics);
    }

    render(gameState) {
        // Update camera
        this.updateCamera(gameState);
        
        // Update body positions
        this.updateBodyPositions(gameState);
        
        // Draw trajectories
        this.drawTrajectories(gameState);
        
        // Update particles
        this.updateParticles(gameState);
        
        // Apply camera transform
        this.viewport.x = this.app.screen.width / 2 - this.camera.x * this.camera.zoom;
        this.viewport.y = this.app.screen.height / 2 - this.camera.y * this.camera.zoom;
        this.viewport.scale.set(this.camera.zoom);
    }

    updateCamera(gameState) {
        // Smooth zoom interpolation
        this.camera.zoom += (this.camera.targetZoom - this.camera.zoom) * 0.1;
        
        // Auto-tracking
        if (this.camera.tracking) {
            const target = gameState[this.camera.tracking];
            if (target && target.position) {
                const targetX = target.position.x * this.scale;
                const targetY = target.position.y * this.scale;
                
                this.camera.x += (targetX - this.camera.x) * 0.05;
                this.camera.y += (targetY - this.camera.y) * 0.05;
            }
        } else if (gameState.spacecraft.deployed) {
            // Center on spacecraft-asteroid midpoint
            const midX = (gameState.spacecraft.position.x + gameState.asteroid.position.x) / 2 * this.scale;
            const midY = (gameState.spacecraft.position.y + gameState.asteroid.position.y) / 2 * this.scale;
            
            this.camera.x += (midX - this.camera.x) * 0.02;
            this.camera.y += (midY - this.camera.y) * 0.02;
            
            // Auto-adjust zoom based on distance
            const distance = Math.sqrt(
                Math.pow(gameState.spacecraft.position.x - gameState.asteroid.position.x, 2) +
                Math.pow(gameState.spacecraft.position.y - gameState.asteroid.position.y, 2)
            ) * this.scale;
            
            const targetZoom = Math.max(0.3, Math.min(2.0, 500 / distance));
            this.camera.targetZoom = targetZoom;
        }
    }

    updateBodyPositions(gameState) {
        // Earth
        this.sprites.earth.x = gameState.earth.position.x * this.scale;
        this.sprites.earth.y = gameState.earth.position.y * this.scale;
        
        // Moon
        this.sprites.moon.x = gameState.moon.position.x * this.scale;
        this.sprites.moon.y = gameState.moon.position.y * this.scale;
        
        // Asteroid
        this.sprites.asteroid.x = gameState.asteroid.position.x * this.scale;
        this.sprites.asteroid.y = gameState.asteroid.position.y * this.scale;
        
        // Spacecraft
        if (gameState.spacecraft.deployed) {
            this.sprites.spacecraft.visible = true;
            this.sprites.spacecraft.x = gameState.spacecraft.position.x * this.scale;
            this.sprites.spacecraft.y = gameState.spacecraft.position.y * this.scale;
            
            // Rotate to face velocity direction
            const angle = Math.atan2(
                gameState.spacecraft.velocity.y,
                gameState.spacecraft.velocity.x
            );
            this.sprites.spacecraft.rotation = angle + Math.PI / 2;
        }
    }

    drawTrajectories(gameState) {
        this.trajectoryGraphics.clear();
        
        if (!gameState.spacecraft.deployed) return;
        
        // Draw spacecraft trajectory (predicted path)
        this.trajectoryGraphics.lineStyle(2, 0x00FF00, 0.5);
        this.trajectoryGraphics.moveTo(
            gameState.spacecraft.position.x * this.scale,
            gameState.spacecraft.position.y * this.scale
        );
        
        // Simple linear prediction (replace with actual physics prediction)
        for (let i = 1; i <= 10; i++) {
            const t = i * 86400; // 1 day intervals
            const px = gameState.spacecraft.position.x + gameState.spacecraft.velocity.x * t;
            const py = gameState.spacecraft.position.y + gameState.spacecraft.velocity.y * t;
            
            this.trajectoryGraphics.lineTo(px * this.scale, py * this.scale);
        }
        
        // Draw asteroid trajectory
        this.trajectoryGraphics.lineStyle(2, 0xFF0000, 0.5);
        this.trajectoryGraphics.moveTo(
            gameState.asteroid.position.x * this.scale,
            gameState.asteroid.position.y * this.scale
        );
        
        for (let i = 1; i <= 10; i++) {
            const t = i * 86400;
            const px = gameState.asteroid.position.x + gameState.asteroid.velocity.x * t;
            const py = gameState.asteroid.position.y + gameState.asteroid.velocity.y * t;
            
            this.trajectoryGraphics.lineTo(px * this.scale, py * this.scale);
        }
        
        // Draw Earth safe zone
        this.trajectoryGraphics.lineStyle(1, 0x00FF00, 0.2);
        this.trajectoryGraphics.drawCircle(
            gameState.earth.position.x * this.scale,
            gameState.earth.position.y * this.scale,
            150000000 * this.scale
        );
    }

    updateParticles(gameState) {
        // Update starfield parallax
        this.particles.stars.forEach(star => {
            star.sprite.x -= (this.camera.x * (star.layer + 1) * 0.01);
            star.sprite.y -= (this.camera.y * (star.layer + 1) * 0.01);
        });
        
        // Thruster particles (when spacecraft is burning)
        if (gameState.spacecraft.deployed && gameState.spacecraft.deltaVRemaining < gameState.spacecraft.fuel) {
            // Add thruster trail effect
            if (Math.random() < 0.3) {
                const particle = new PIXI.Graphics();
                particle.beginFill(0xFF6600, 0.8);
                particle.drawCircle(0, 0, 2);
                particle.endFill();
                
                particle.x = this.sprites.spacecraft.x;
                particle.y = this.sprites.spacecraft.y;
                particle.life = 30;
                
                this.viewport.addChild(particle);
                this.particles.debris.push(particle);
            }
        }
        
        // Update and remove old particles
        this.particles.debris = this.particles.debris.filter(particle => {
            particle.life--;
            particle.alpha = particle.life / 30;
            
            if (particle.life <= 0) {
                this.viewport.removeChild(particle);
                return false;
            }
            return true;
        });
    }

    setupCameraControls() {
        // Zoom controls
        document.getElementById('cam-zoom-in')?.addEventListener('click', () => {
            this.camera.targetZoom = Math.min(3.0, this.camera.targetZoom * 1.2);
        });
        
        document.getElementById('cam-zoom-out')?.addEventListener('click', () => {
            this.camera.targetZoom = Math.max(0.2, this.camera.targetZoom / 1.2);
        });
        
        document.getElementById('cam-reset')?.addEventListener('click', () => {
            this.camera.x = 0;
            this.camera.y = 0;
            this.camera.targetZoom = 1.0;
            this.camera.tracking = null;
        });
        
        document.getElementById('cam-track')?.addEventListener('click', () => {
            if (this.camera.tracking === 'spacecraft') {
                this.camera.tracking = null;
            } else {
                this.camera.tracking = 'spacecraft';
            }
        });
        
        // Mouse wheel zoom
        this.app.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY < 0 ? 1.1 : 0.9;
            this.camera.targetZoom = Math.max(0.2, Math.min(3.0, this.camera.targetZoom * delta));
        });
        
        // Mouse drag pan
        let isDragging = false;
        let lastX, lastY;
        
        this.app.canvas.addEventListener('mousedown', (e) => {
            isDragging = true;
            lastX = e.clientX;
            lastY = e.clientY;
            this.camera.tracking = null;
        });
        
        this.app.canvas.addEventListener('mousemove', (e) => {
            if (isDragging) {
                const dx = e.clientX - lastX;
                const dy = e.clientY - lastY;
                
                this.camera.x -= dx / this.camera.zoom;
                this.camera.y -= dy / this.camera.zoom;
                
                lastX = e.clientX;
                lastY = e.clientY;
            }
        });
        
        this.app.canvas.addEventListener('mouseup', () => {
            isDragging = false;
        });
    }

    handleResize() {
        this.app.renderer.resize(
            this.container.clientWidth,
            this.container.clientHeight
        );
    }

    highlightBody(bodyName) {
        // Add highlight effect to body
        const sprite = this.sprites[bodyName];
        if (sprite) {
            const highlight = new PIXI.Graphics();
            highlight.lineStyle(3, 0xFFFF00, 0.8);
            highlight.drawCircle(0, 0, sprite.width / 2 + 5);
            sprite.addChild(highlight);
            
            setTimeout(() => {
                sprite.removeChild(highlight);
            }, 2000);
        }
    }

    showExplosion(position) {
        // Create explosion particle effect
        for (let i = 0; i < 20; i++) {
            const particle = new PIXI.Graphics();
            const size = Math.random() * 3 + 1;
            particle.beginFill(0xFF6600);
            particle.drawCircle(0, 0, size);
            particle.endFill();
            
            particle.x = position.x * this.scale;
            particle.y = position.y * this.scale;
            particle.vx = (Math.random() - 0.5) * 5;
            particle.vy = (Math.random() - 0.5) * 5;
            particle.life = 60;
            
            this.viewport.addChild(particle);
            this.particles.debris.push(particle);
        }
    }
}
