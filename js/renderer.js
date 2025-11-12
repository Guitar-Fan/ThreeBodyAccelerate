/**
 * Renderer for Three-Body Problem Simulation
 * Handles Canvas2D rendering with trails, glow effects, and smooth animations
 */

class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.camera = {
            x: 0,
            y: 0,
            zoom: 1,
            targetZoom: 1
        };
        
        // Visual settings
        this.showTrails = true;
        this.showVelocities = false;
        this.showForces = false;
        this.showGrid = false;
        this.glowEffect = true;
        this.trailLength = 500;
        
        // Track center of mass
        this.trackCOM = false;
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = this.canvas.clientWidth * window.devicePixelRatio;
        this.canvas.height = this.canvas.clientHeight * window.devicePixelRatio;
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        this.width = this.canvas.clientWidth;
        this.height = this.canvas.clientHeight;
    }

    worldToScreen(x, y) {
        return {
            x: (x - this.camera.x) * this.camera.zoom + this.width / 2,
            y: (y - this.camera.y) * this.camera.zoom + this.height / 2
        };
    }

    screenToWorld(x, y) {
        return {
            x: (x - this.width / 2) / this.camera.zoom + this.camera.x,
            y: (y - this.height / 2) / this.camera.zoom + this.camera.y
        };
    }

    updateCamera(centerOfMass) {
        // Smooth zoom
        this.camera.zoom += (this.camera.targetZoom - this.camera.zoom) * 0.1;
        
        // Track center of mass if enabled
        if (this.trackCOM && centerOfMass) {
            this.camera.x += (centerOfMass.x - this.camera.x) * 0.05;
            this.camera.y += (centerOfMass.y - this.camera.y) * 0.05;
        }
    }

    clear() {
        // Create space background with gradient
        const gradient = this.ctx.createRadialGradient(
            this.width / 2, this.height / 2, 0,
            this.width / 2, this.height / 2, this.width / 2
        );
        gradient.addColorStop(0, '#1a1f3a');
        gradient.addColorStop(1, '#0a0e27');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Add stars
        this.drawStars();
    }

    drawStars() {
        const starCount = 100;
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        
        for (let i = 0; i < starCount; i++) {
            // Use deterministic pseudo-random for consistent star positions
            const x = (Math.sin(i * 12.9898) * 43758.5453) % 1 * this.width;
            const y = (Math.sin(i * 78.233) * 43758.5453) % 1 * this.height;
            const size = (Math.sin(i * 45.164) * 43758.5453) % 1 * 2;
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    drawGrid() {
        if (!this.showGrid) return;
        
        const spacing = 50 * this.camera.zoom;
        const offsetX = (-this.camera.x * this.camera.zoom + this.width / 2) % spacing;
        const offsetY = (-this.camera.y * this.camera.zoom + this.height / 2) % spacing;
        
        this.ctx.strokeStyle = 'rgba(100, 100, 150, 0.2)';
        this.ctx.lineWidth = 1;
        
        // Vertical lines
        for (let x = offsetX; x < this.width; x += spacing) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.height);
            this.ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = offsetY; y < this.height; y += spacing) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();
        }
        
        // Draw axes
        const origin = this.worldToScreen(0, 0);
        this.ctx.strokeStyle = 'rgba(0, 212, 255, 0.5)';
        this.ctx.lineWidth = 2;
        
        // X-axis
        this.ctx.beginPath();
        this.ctx.moveTo(0, origin.y);
        this.ctx.lineTo(this.width, origin.y);
        this.ctx.stroke();
        
        // Y-axis
        this.ctx.beginPath();
        this.ctx.moveTo(origin.x, 0);
        this.ctx.lineTo(origin.x, this.height);
        this.ctx.stroke();
    }

    drawTrail(body) {
        if (!this.showTrails || !body.trail || body.trail.length < 2) return;
        
        const trail = body.trail.slice(-this.trailLength);
        
        for (let i = 1; i < trail.length; i++) {
            const alpha = i / trail.length;
            const p1 = this.worldToScreen(trail[i - 1].x, trail[i - 1].y);
            const p2 = this.worldToScreen(trail[i].x, trail[i].y);
            
            this.ctx.strokeStyle = body.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
            this.ctx.lineWidth = 2;
            this.ctx.lineCap = 'round';
            
            this.ctx.beginPath();
            this.ctx.moveTo(p1.x, p1.y);
            this.ctx.lineTo(p2.x, p2.y);
            this.ctx.stroke();
        }
    }

    drawBody(body) {
        const pos = this.worldToScreen(body.x, body.y);
        // Ensure radius is always positive and has a minimum value
        const baseRadius = body.radius || 8;
        const radius = Math.max(Math.abs(baseRadius) * this.camera.zoom, 3);
        
        // Draw glow effect
        if (this.glowEffect && radius > 0) {
            const glowRadius = Math.max(radius * 3, 1);
            const gradient = this.ctx.createRadialGradient(
                pos.x, pos.y, 0,
                pos.x, pos.y, glowRadius
            );
            gradient.addColorStop(0, body.color + '80');
            gradient.addColorStop(0.5, body.color + '20');
            gradient.addColorStop(1, body.color + '00');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(pos.x, pos.y, glowRadius, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Draw body
        this.ctx.fillStyle = body.color || '#ffffff';
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1;
        
        this.ctx.beginPath();
        this.ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        
        // Draw highlight
        const highlightRadius = Math.max(radius, 1);
        const highlightGradient = this.ctx.createRadialGradient(
            pos.x - highlightRadius * 0.3, pos.y - highlightRadius * 0.3, 0,
            pos.x - highlightRadius * 0.3, pos.y - highlightRadius * 0.3, highlightRadius
        );
        highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        highlightGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
        highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        this.ctx.fillStyle = highlightGradient;
        this.ctx.beginPath();
        this.ctx.arc(pos.x, pos.y, highlightRadius, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawVelocityVector(body) {
        if (!this.showVelocities) return;
        
        const pos = this.worldToScreen(body.x, body.y);
        const velScale = 20;
        const endX = pos.x + body.vx * velScale * this.camera.zoom;
        const endY = pos.y + body.vy * velScale * this.camera.zoom;
        
        this.ctx.strokeStyle = '#00ff88';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        
        this.ctx.beginPath();
        this.ctx.moveTo(pos.x, pos.y);
        this.ctx.lineTo(endX, endY);
        this.ctx.stroke();
        
        // Draw arrowhead
        const angle = Math.atan2(endY - pos.y, endX - pos.x);
        const arrowSize = 8;
        
        this.ctx.setLineDash([]);
        this.ctx.fillStyle = '#00ff88';
        this.ctx.beginPath();
        this.ctx.moveTo(endX, endY);
        this.ctx.lineTo(
            endX - arrowSize * Math.cos(angle - Math.PI / 6),
            endY - arrowSize * Math.sin(angle - Math.PI / 6)
        );
        this.ctx.lineTo(
            endX - arrowSize * Math.cos(angle + Math.PI / 6),
            endY - arrowSize * Math.sin(angle + Math.PI / 6)
        );
        this.ctx.closePath();
        this.ctx.fill();
    }

    drawForceVectors(bodies, physics) {
        if (!this.showForces) return;
        
        for (let i = 0; i < bodies.length; i++) {
            let fx = 0, fy = 0;
            
            for (let j = 0; j < bodies.length; j++) {
                if (i === j) continue;
                const force = physics.calculateForce(bodies[i], bodies[j]);
                fx += force.fx;
                fy += force.fy;
            }
            
            const pos = this.worldToScreen(bodies[i].x, bodies[i].y);
            const forceScale = 5;
            const endX = pos.x + fx * forceScale * this.camera.zoom;
            const endY = pos.y + fy * forceScale * this.camera.zoom;
            
            this.ctx.strokeStyle = '#ff4488';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([3, 3]);
            
            this.ctx.beginPath();
            this.ctx.moveTo(pos.x, pos.y);
            this.ctx.lineTo(endX, endY);
            this.ctx.stroke();
            
            this.ctx.setLineDash([]);
        }
    }

    drawCenterOfMass(centerOfMass) {
        if (!centerOfMass) return;
        
        const pos = this.worldToScreen(centerOfMass.x, centerOfMass.y);
        
        this.ctx.strokeStyle = '#ffd700';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        
        // Draw crosshair
        const size = 15;
        this.ctx.beginPath();
        this.ctx.moveTo(pos.x - size, pos.y);
        this.ctx.lineTo(pos.x + size, pos.y);
        this.ctx.moveTo(pos.x, pos.y - size);
        this.ctx.lineTo(pos.x, pos.y + size);
        this.ctx.stroke();
        
        // Draw circle
        this.ctx.beginPath();
        this.ctx.arc(pos.x, pos.y, 10, 0, Math.PI * 2);
        this.ctx.stroke();
        
        this.ctx.setLineDash([]);
    }

    drawDraggingVector(startPos, endPos) {
        this.ctx.strokeStyle = '#00ff88';
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([5, 5]);
        
        this.ctx.beginPath();
        this.ctx.moveTo(startPos.x, startPos.y);
        this.ctx.lineTo(endPos.x, endPos.y);
        this.ctx.stroke();
        
        // Draw arrowhead
        const angle = Math.atan2(endPos.y - startPos.y, endPos.x - startPos.x);
        const arrowSize = 10;
        
        this.ctx.setLineDash([]);
        this.ctx.fillStyle = '#00ff88';
        this.ctx.beginPath();
        this.ctx.moveTo(endPos.x, endPos.y);
        this.ctx.lineTo(
            endPos.x - arrowSize * Math.cos(angle - Math.PI / 6),
            endPos.y - arrowSize * Math.sin(angle - Math.PI / 6)
        );
        this.ctx.lineTo(
            endPos.x - arrowSize * Math.cos(angle + Math.PI / 6),
            endPos.y - arrowSize * Math.sin(angle + Math.PI / 6)
        );
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.setLineDash([]);
    }

    render(bodies, physics, centerOfMass, dragState) {
        this.clear();
        this.drawGrid();
        
        // Update camera
        this.updateCamera(this.trackCOM ? centerOfMass : null);
        
        // Draw trails first (background)
        for (const body of bodies) {
            this.drawTrail(body);
        }
        
        // Draw center of mass
        if (this.trackCOM || centerOfMass) {
            this.drawCenterOfMass(centerOfMass);
        }
        
        // Draw force vectors
        this.drawForceVectors(bodies, physics);
        
        // Draw bodies
        for (const body of bodies) {
            this.drawBody(body);
            this.drawVelocityVector(body);
        }
        
        // Draw dragging vector
        if (dragState && dragState.dragging) {
            this.drawDraggingVector(dragState.start, dragState.current);
        }
    }

    zoom(delta, mouseX, mouseY) {
        const zoomFactor = 1.1;
        const oldZoom = this.camera.targetZoom;
        
        if (delta > 0) {
            this.camera.targetZoom *= zoomFactor;
        } else {
            this.camera.targetZoom /= zoomFactor;
        }
        
        // Clamp zoom
        this.camera.targetZoom = Math.max(0.1, Math.min(10, this.camera.targetZoom));
        
        // Zoom towards mouse position
        if (mouseX !== undefined && mouseY !== undefined) {
            const worldPos = this.screenToWorld(mouseX, mouseY);
            const newWorldPos = {
                x: (mouseX - this.width / 2) / this.camera.targetZoom + this.camera.x,
                y: (mouseY - this.height / 2) / this.camera.targetZoom + this.camera.y
            };
            
            this.camera.x += worldPos.x - newWorldPos.x;
            this.camera.y += worldPos.y - newWorldPos.y;
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Renderer;
}
