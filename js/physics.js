/**
 * Physics Engine for Three-Body Problem Simulation
 * Implements various numerical integrators and conservation diagnostics
 */

class PhysicsEngine {
    constructor(config = {}) {
        this.G = config.G || 1.0;
        this.softening = config.softening || 0.01;
        this.integrator = config.integrator || 'verlet';
        this.collisionMode = config.collisionMode || 'merge';
        this.timeDirection = 1; // 1 for forward, -1 for reverse
    }

    /**
     * Calculate gravitational force between two bodies
     */
    calculateForce(body1, body2) {
        const dx = body2.x - body1.x;
        const dy = body2.y - body1.y;
        const distSq = dx * dx + dy * dy + this.softening * this.softening;
        const dist = Math.sqrt(distSq);
        const force = this.G * body1.mass * body2.mass / distSq;
        
        return {
            fx: force * dx / dist,
            fy: force * dy / dist,
            distance: dist
        };
    }

    /**
     * Calculate acceleration for all bodies
     */
    calculateAccelerations(bodies) {
        const accelerations = [];
        
        for (let i = 0; i < bodies.length; i++) {
            let ax = 0, ay = 0;
            
            for (let j = 0; j < bodies.length; j++) {
                if (i === j) continue;
                
                const force = this.calculateForce(bodies[i], bodies[j]);
                ax += force.fx / bodies[i].mass;
                ay += force.fy / bodies[i].mass;
            }
            
            accelerations.push({ ax, ay });
        }
        
        return accelerations;
    }

    /**
     * Velocity Verlet Integrator (Symplectic - conserves energy structure)
     */
    integrateVerlet(bodies, dt) {
        dt *= this.timeDirection;
        
        // Calculate initial accelerations
        const acc1 = this.calculateAccelerations(bodies);
        
        // Update positions and half-step velocities
        for (let i = 0; i < bodies.length; i++) {
            bodies[i].vx += 0.5 * acc1[i].ax * dt;
            bodies[i].vy += 0.5 * acc1[i].ay * dt;
            bodies[i].x += bodies[i].vx * dt;
            bodies[i].y += bodies[i].vy * dt;
        }
        
        // Recalculate accelerations at new positions
        const acc2 = this.calculateAccelerations(bodies);
        
        // Complete velocity update
        for (let i = 0; i < bodies.length; i++) {
            bodies[i].vx += 0.5 * acc2[i].ax * dt;
            bodies[i].vy += 0.5 * acc2[i].ay * dt;
        }
    }

    /**
     * Runge-Kutta 4th Order Integrator (Higher accuracy)
     */
    integrateRK4(bodies, dt) {
        dt *= this.timeDirection;
        const n = bodies.length;
        
        // Store initial state
        const initial = bodies.map(b => ({
            x: b.x, y: b.y, vx: b.vx, vy: b.vy
        }));
        
        // Helper function to get derivatives
        const getDerivatives = (tempBodies) => {
            const acc = this.calculateAccelerations(tempBodies);
            return tempBodies.map((b, i) => ({
                dx: b.vx,
                dy: b.vy,
                dvx: acc[i].ax,
                dvy: acc[i].ay
            }));
        };
        
        // K1
        const k1 = getDerivatives(bodies);
        
        // K2
        const tempBodies2 = bodies.map((b, i) => ({
            ...b,
            x: initial[i].x + 0.5 * dt * k1[i].dx,
            y: initial[i].y + 0.5 * dt * k1[i].dy,
            vx: initial[i].vx + 0.5 * dt * k1[i].dvx,
            vy: initial[i].vy + 0.5 * dt * k1[i].dvy
        }));
        const k2 = getDerivatives(tempBodies2);
        
        // K3
        const tempBodies3 = bodies.map((b, i) => ({
            ...b,
            x: initial[i].x + 0.5 * dt * k2[i].dx,
            y: initial[i].y + 0.5 * dt * k2[i].dy,
            vx: initial[i].vx + 0.5 * dt * k2[i].dvx,
            vy: initial[i].vy + 0.5 * dt * k2[i].dvy
        }));
        const k3 = getDerivatives(tempBodies3);
        
        // K4
        const tempBodies4 = bodies.map((b, i) => ({
            ...b,
            x: initial[i].x + dt * k3[i].dx,
            y: initial[i].y + dt * k3[i].dy,
            vx: initial[i].vx + dt * k3[i].dvx,
            vy: initial[i].vy + dt * k3[i].dvy
        }));
        const k4 = getDerivatives(tempBodies4);
        
        // Update bodies
        for (let i = 0; i < n; i++) {
            bodies[i].x = initial[i].x + (dt / 6) * (k1[i].dx + 2*k2[i].dx + 2*k3[i].dx + k4[i].dx);
            bodies[i].y = initial[i].y + (dt / 6) * (k1[i].dy + 2*k2[i].dy + 2*k3[i].dy + k4[i].dy);
            bodies[i].vx = initial[i].vx + (dt / 6) * (k1[i].dvx + 2*k2[i].dvx + 2*k3[i].dvx + k4[i].dvx);
            bodies[i].vy = initial[i].vy + (dt / 6) * (k1[i].dvy + 2*k2[i].dvy + 2*k3[i].dvy + k4[i].dvy);
        }
    }

    /**
     * Euler Integrator (Fast but less accurate)
     */
    integrateEuler(bodies, dt) {
        dt *= this.timeDirection;
        const acc = this.calculateAccelerations(bodies);
        
        for (let i = 0; i < bodies.length; i++) {
            bodies[i].x += bodies[i].vx * dt;
            bodies[i].y += bodies[i].vy * dt;
            bodies[i].vx += acc[i].ax * dt;
            bodies[i].vy += acc[i].ay * dt;
        }
    }

    /**
     * Step simulation forward
     */
    step(bodies, dt) {
        switch(this.integrator) {
            case 'verlet':
                this.integrateVerlet(bodies, dt);
                break;
            case 'rk4':
                this.integrateRK4(bodies, dt);
                break;
            case 'euler':
                this.integrateEuler(bodies, dt);
                break;
        }
        
        // Handle collisions
        this.handleCollisions(bodies);
    }

    /**
     * Handle collisions between bodies
     */
    handleCollisions(bodies) {
        if (this.collisionMode === 'none') return;
        
        for (let i = bodies.length - 1; i >= 0; i--) {
            for (let j = i - 1; j >= 0; j--) {
                const dx = bodies[i].x - bodies[j].x;
                const dy = bodies[i].y - bodies[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const minDist = bodies[i].radius + bodies[j].radius;
                
                if (dist < minDist) {
                    if (this.collisionMode === 'merge') {
                        // Merge bodies - conserve momentum
                        const totalMass = bodies[i].mass + bodies[j].mass;
                        const newBody = {
                            id: `merged_${Date.now()}`,
                            mass: totalMass,
                            x: (bodies[i].x * bodies[i].mass + bodies[j].x * bodies[j].mass) / totalMass,
                            y: (bodies[i].y * bodies[i].mass + bodies[j].y * bodies[j].mass) / totalMass,
                            vx: (bodies[i].vx * bodies[i].mass + bodies[j].vx * bodies[j].mass) / totalMass,
                            vy: (bodies[i].vy * bodies[i].mass + bodies[j].vy * bodies[j].mass) / totalMass,
                            radius: Math.cbrt(bodies[i].radius**3 + bodies[j].radius**3),
                            color: bodies[i].mass > bodies[j].mass ? bodies[i].color : bodies[j].color,
                            trail: []
                        };
                        
                        bodies.splice(i, 1);
                        bodies.splice(j, 1);
                        bodies.push(newBody);
                        return; // Restart collision detection
                    } else if (this.collisionMode === 'elastic') {
                        // Elastic collision
                        const nx = dx / dist;
                        const ny = dy / dist;
                        
                        const dvx = bodies[i].vx - bodies[j].vx;
                        const dvy = bodies[i].vy - bodies[j].vy;
                        const dvn = dvx * nx + dvy * ny;
                        
                        if (dvn > 0) continue; // Moving apart
                        
                        const m1 = bodies[i].mass;
                        const m2 = bodies[j].mass;
                        const impulse = 2 * dvn / (m1 + m2);
                        
                        bodies[i].vx -= impulse * m2 * nx;
                        bodies[i].vy -= impulse * m2 * ny;
                        bodies[j].vx += impulse * m1 * nx;
                        bodies[j].vy += impulse * m1 * ny;
                        
                        // Separate bodies to avoid overlap
                        const overlap = minDist - dist;
                        const separationRatio = overlap / 2 / dist;
                        bodies[i].x += dx * separationRatio;
                        bodies[i].y += dy * separationRatio;
                        bodies[j].x -= dx * separationRatio;
                        bodies[j].y -= dy * separationRatio;
                    }
                }
            }
        }
    }

    /**
     * Calculate total kinetic energy
     */
    calculateKineticEnergy(bodies) {
        return bodies.reduce((sum, body) => {
            const vSq = body.vx * body.vx + body.vy * body.vy;
            return sum + 0.5 * body.mass * vSq;
        }, 0);
    }

    /**
     * Calculate total potential energy
     */
    calculatePotentialEnergy(bodies) {
        let potential = 0;
        for (let i = 0; i < bodies.length; i++) {
            for (let j = i + 1; j < bodies.length; j++) {
                const dx = bodies[j].x - bodies[i].x;
                const dy = bodies[j].y - bodies[i].y;
                const dist = Math.sqrt(dx * dx + dy * dy + this.softening * this.softening);
                potential -= this.G * bodies[i].mass * bodies[j].mass / dist;
            }
        }
        return potential;
    }

    /**
     * Calculate total energy
     */
    calculateTotalEnergy(bodies) {
        return this.calculateKineticEnergy(bodies) + this.calculatePotentialEnergy(bodies);
    }

    /**
     * Calculate total linear momentum
     */
    calculateMomentum(bodies) {
        let px = 0, py = 0;
        for (const body of bodies) {
            px += body.mass * body.vx;
            py += body.mass * body.vy;
        }
        return { px, py, magnitude: Math.sqrt(px * px + py * py) };
    }

    /**
     * Calculate total angular momentum (about origin)
     */
    calculateAngularMomentum(bodies) {
        return bodies.reduce((sum, body) => {
            return sum + body.mass * (body.x * body.vy - body.y * body.vx);
        }, 0);
    }

    /**
     * Calculate center of mass
     */
    calculateCenterOfMass(bodies) {
        let totalMass = 0;
        let comX = 0, comY = 0;
        let comVx = 0, comVy = 0;
        
        for (const body of bodies) {
            totalMass += body.mass;
            comX += body.mass * body.x;
            comY += body.mass * body.y;
            comVx += body.mass * body.vx;
            comVy += body.mass * body.vy;
        }
        
        return {
            x: comX / totalMass,
            y: comY / totalMass,
            vx: comVx / totalMass,
            vy: comVy / totalMass
        };
    }

    /**
     * Get all diagnostics
     */
    getDiagnostics(bodies) {
        const energy = this.calculateTotalEnergy(bodies);
        const momentum = this.calculateMomentum(bodies);
        const angularMomentum = this.calculateAngularMomentum(bodies);
        const centerOfMass = this.calculateCenterOfMass(bodies);
        
        return {
            kineticEnergy: this.calculateKineticEnergy(bodies),
            potentialEnergy: this.calculatePotentialEnergy(bodies),
            totalEnergy: energy,
            momentum,
            angularMomentum,
            centerOfMass
        };
    }

    /**
     * Reverse time direction
     */
    reverseTime() {
        this.timeDirection *= -1;
    }

    /**
     * Check if time is reversed
     */
    isTimeReversed() {
        return this.timeDirection === -1;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PhysicsEngine;
}
