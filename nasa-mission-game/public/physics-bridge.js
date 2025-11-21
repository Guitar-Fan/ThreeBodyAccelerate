// Physics Bridge - Interface to C++ WASM three-body physics engine
export class PhysicsBridge {
    constructor() {
        this.wasmModule = null;
        this.bodies = {
            earth: null,
            moon: null,
            asteroid: null,
            spacecraft: null
        };
        this.moonProximityRecord = Infinity;
        this.G = 6.67430e-11;
    }

    async init() {
        // In production, this would load the compiled WASM module
        // For now, we'll use JavaScript-based physics simulation
        console.log('⚠️  Using JavaScript physics (WASM not compiled yet)');
        console.log('   To use C++ WASM: compile src/main.cpp with Emscripten');
        
        // Fallback to JS implementation
        this.initJSPhysics();
    }

    initJSPhysics() {
        // Simple JavaScript implementation of three-body physics
        // This mimics what the C++ WASM would do
        this.timeStep = 100; // seconds per update
    }

    setupBodies(initialBodies) {
        this.bodies = {
            earth: { ...initialBodies.earth },
            moon: { ...initialBodies.moon },
            asteroid: { ...initialBodies.asteroid },
            spacecraft: { ...initialBodies.spacecraft }
        };
    }

    deploySpacecraft(spacecraft) {
        this.bodies.spacecraft = { ...spacecraft };
    }

    update(deltaTime) {
        // Perform physics integration using simple Euler method
        // In production, C++ WASM would use RK4 or Verlet integration
        
        const bodies = ['earth', 'moon', 'asteroid'];
        if (this.bodies.spacecraft.deployed) {
            bodies.push('spacecraft');
        }
        
        // Calculate gravitational forces
        const forces = {};
        bodies.forEach(name => {
            forces[name] = { x: 0, y: 0, z: 0 };
        });
        
        // Pairwise force calculation
        for (let i = 0; i < bodies.length; i++) {
            for (let j = i + 1; j < bodies.length; j++) {
                const body1 = bodies[i];
                const body2 = bodies[j];
                
                const force = this.calculateGravitationalForce(
                    this.bodies[body1],
                    this.bodies[body2]
                );
                
                // Apply force to both bodies (Newton's 3rd law)
                forces[body1].x += force.x;
                forces[body1].y += force.y;
                forces[body1].z += force.z;
                
                forces[body2].x -= force.x;
                forces[body2].y -= force.y;
                forces[body2].z -= force.z;
            }
        }
        
        // Update velocities and positions
        bodies.forEach(name => {
            const body = this.bodies[name];
            const force = forces[name];
            
            // a = F / m
            const ax = force.x / body.mass;
            const ay = force.y / body.mass;
            const az = force.z / body.mass;
            
            // Update velocity: v = v + a * dt
            body.velocity.x += ax * deltaTime;
            body.velocity.y += ay * deltaTime;
            body.velocity.z += az * deltaTime;
            
            // Update position: p = p + v * dt
            body.position.x += body.velocity.x * deltaTime;
            body.position.y += body.velocity.y * deltaTime;
            body.position.z += body.velocity.z * deltaTime;
        });
        
        // Track Moon proximity for achievements
        if (this.bodies.spacecraft.deployed) {
            const distance = this.calculateDistance(
                this.bodies.spacecraft.position,
                this.bodies.moon.position
            );
            if (distance < this.moonProximityRecord) {
                this.moonProximityRecord = distance;
            }
        }
        
        return this.bodies;
    }

    calculateGravitationalForce(body1, body2) {
        const dx = body2.position.x - body1.position.x;
        const dy = body2.position.y - body1.position.y;
        const dz = body2.position.z - body1.position.z;
        
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        // Prevent division by zero
        if (distance < 1000) {
            return { x: 0, y: 0, z: 0 };
        }
        
        // F = G * m1 * m2 / r^2
        const forceMagnitude = this.G * body1.mass * body2.mass / (distance * distance);
        
        // Normalize direction and scale by magnitude
        const fx = (dx / distance) * forceMagnitude;
        const fy = (dy / distance) * forceMagnitude;
        const fz = (dz / distance) * forceMagnitude;
        
        return { x: fx, y: fy, z: fz };
    }

    calculateDistance(pos1, pos2) {
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        const dz = pos1.z - pos2.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    applyCorrection(deltaV) {
        if (!this.bodies.spacecraft.deployed) return;
        
        // Apply delta-V in current velocity direction
        const speed = Math.sqrt(
            this.bodies.spacecraft.velocity.x ** 2 +
            this.bodies.spacecraft.velocity.y ** 2 +
            this.bodies.spacecraft.velocity.z ** 2
        );
        
        if (speed === 0) return;
        
        // Normalize velocity and apply delta-V
        const factor = (speed + deltaV) / speed;
        
        this.bodies.spacecraft.velocity.x *= factor;
        this.bodies.spacecraft.velocity.y *= factor;
        this.bodies.spacecraft.velocity.z *= factor;
    }

    usedMoonGravity() {
        // Check if spacecraft passed within Moon's sphere of influence
        const moonSOI = 66000000; // meters (approximate)
        return this.moonProximityRecord < moonSOI;
    }

    // WASM-specific methods (for when C++ module is available)
    async loadWASM(wasmPath) {
        try {
            const response = await fetch(wasmPath);
            const bytes = await response.arrayBuffer();
            
            const wasmModule = await WebAssembly.instantiate(bytes, {
                env: {
                    // Import functions that C++ can call
                    log: (message) => console.log('WASM:', message),
                    abort: () => console.error('WASM aborted')
                }
            });
            
            this.wasmModule = wasmModule.instance;
            console.log('✓ WASM Physics Module loaded');
            return true;
        } catch (error) {
            console.warn('Failed to load WASM module:', error);
            return false;
        }
    }

    // Call C++ functions (example)
    callWASMUpdate(deltaTime) {
        if (!this.wasmModule) return null;
        
        // Example of calling exported C++ function
        // const result = this.wasmModule.exports.updatePhysics(deltaTime);
        // return result;
    }

    // Data marshalling for WASM
    serializeBodies() {
        // Convert JavaScript objects to format C++ expects
        // Typically a Float64Array or structured buffer
        const data = new Float64Array(48); // 4 bodies × 12 values each (pos, vel, mass)
        
        let offset = 0;
        ['earth', 'moon', 'asteroid', 'spacecraft'].forEach(name => {
            const body = this.bodies[name];
            data[offset++] = body.position.x;
            data[offset++] = body.position.y;
            data[offset++] = body.position.z;
            data[offset++] = body.velocity.x;
            data[offset++] = body.velocity.y;
            data[offset++] = body.velocity.z;
            data[offset++] = body.mass;
            offset += 5; // Padding
        });
        
        return data;
    }

    deserializeBodies(data) {
        // Convert C++ output back to JavaScript objects
        let offset = 0;
        ['earth', 'moon', 'asteroid', 'spacecraft'].forEach(name => {
            this.bodies[name].position.x = data[offset++];
            this.bodies[name].position.y = data[offset++];
            this.bodies[name].position.z = data[offset++];
            this.bodies[name].velocity.x = data[offset++];
            this.bodies[name].velocity.y = data[offset++];
            this.bodies[name].velocity.z = data[offset++];
            offset += 6; // Skip mass and padding
        });
    }

    // Orbital mechanics utilities
    calculateOrbitalEnergy(body, centralBody) {
        // E = KE + PE = (1/2)mv^2 - GMm/r
        const v = Math.sqrt(
            body.velocity.x ** 2 +
            body.velocity.y ** 2 +
            body.velocity.z ** 2
        );
        
        const r = this.calculateDistance(body.position, centralBody.position);
        
        const kineticEnergy = 0.5 * body.mass * v * v;
        const potentialEnergy = -this.G * body.mass * centralBody.mass / r;
        
        return kineticEnergy + potentialEnergy;
    }

    calculateOrbitalPeriod(body, centralBody) {
        // T = 2π√(a³/μ) where μ = GM
        const r = this.calculateDistance(body.position, centralBody.position);
        const mu = this.G * centralBody.mass;
        
        return 2 * Math.PI * Math.sqrt(Math.pow(r, 3) / mu);
    }

    predictTrajectory(body, steps = 100, stepSize = 86400) {
        // Predict future positions (useful for visualization)
        const trajectory = [];
        const tempBody = {
            position: { ...body.position },
            velocity: { ...body.velocity },
            mass: body.mass
        };
        
        for (let i = 0; i < steps; i++) {
            trajectory.push({ ...tempBody.position });
            
            // Simple propagation (doesn't account for other bodies)
            tempBody.position.x += tempBody.velocity.x * stepSize;
            tempBody.position.y += tempBody.velocity.y * stepSize;
            tempBody.position.z += tempBody.velocity.z * stepSize;
        }
        
        return trajectory;
    }
}
