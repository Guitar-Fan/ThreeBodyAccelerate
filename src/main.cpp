#include <emscripten/emscripten.h>
#include <emscripten/html5.h>
#include <cmath>
#include <cstdio>
#include <vector>
#include <algorithm>

// Structure to represent a celestial body
struct Body {
    double x, y;      // Position
    double vx, vy;    // Velocity
    double ax, ay;    // Acceleration
    double mass;
    double radius;
    unsigned int color; // RGBA color
    
    // Computed properties
    double kineticEnergy;
    double potentialEnergy;
};

// Simulation state
std::vector<Body> bodies;
std::vector<Body> initialBodies; // Store initial state for reset

// Physics parameters
double G = 1.0;         // Gravitational constant (scaled for simulation)
double dt = 0.01;       // Time step
double timeScale = 1.0; // Time multiplier
bool useRK4 = false;    // Runge-Kutta 4th order vs Verlet
bool enableCollisions = false;
double collisionDamping = 0.8; // Coefficient of restitution

// System properties
double totalEnergy = 0.0;
double totalMomentumX = 0.0;
double totalMomentumY = 0.0;
double centerOfMassX = 0.0;
double centerOfMassY = 0.0;

// Canvas properties
int canvasWidth = 800;
int canvasHeight = 600;

// Preset configurations
enum PresetType {
    PRESET_FIGURE_EIGHT,
    PRESET_STABLE_ORBIT,
    PRESET_CHAOTIC,
    PRESET_BINARY_STAR,
    PRESET_PYTHAGOREAN,
    PRESET_CUSTOM
};


// Preset: Figure-eight orbit (discovered by Cris Moore, 1993)
// This is a stable periodic orbit where three equal masses chase each other
void loadFigureEight() {
    bodies.clear();
    
    // Figure-eight initial conditions (scaled for visualization)
    bodies.push_back({
        350.0, 300.0,         // x, y
        0.3471168, 0.5327706, // vx, vy
        0.0, 0.0,             // ax, ay
        50.0, 10.0,           // mass, radius
        0xFFFF00FF,           // yellow
        0.0, 0.0              // energies
    });
    
    bodies.push_back({
        450.0, 300.0,         // x, y
        0.3471168, 0.5327706, // vx, vy (same as body 1)
        0.0, 0.0,             // ax, ay
        50.0, 10.0,           // mass, radius
        0x00FFFFFF,           // cyan
        0.0, 0.0              // energies
    });
    
    bodies.push_back({
        400.0, 213.0,         // x, y
        -0.6942336, -1.0655412, // vx, vy (opposite of others)
        0.0, 0.0,             // ax, ay
        50.0, 10.0,           // mass, radius
        0xFF00FFFF,           // magenta
        0.0, 0.0              // energies
    });
}

// Preset: Stable circular orbit system
void loadStableOrbit() {
    bodies.clear();
    
    // Central massive body
    bodies.push_back({
        400.0, 300.0,    // x, y (center)
        0.0, 0.0,        // vx, vy (stationary)
        0.0, 0.0,        // ax, ay
        150.0,           // large mass
        18.0,            // radius
        0xFFFF00FF,      // yellow
        0.0, 0.0
    });
    
    // Orbiting body 1
    // v = sqrt(G*M/r) for circular orbit
    double r1 = 150.0;
    double v1 = sqrt(G * 150.0 / r1);
    bodies.push_back({
        400.0 + r1, 300.0,
        0.0, v1,
        0.0, 0.0,
        30.0, 8.0,
        0x00FFFFFF,
        0.0, 0.0
    });
    
    // Orbiting body 2
    double r2 = 220.0;
    double v2 = sqrt(G * 150.0 / r2);
    bodies.push_back({
        400.0, 300.0 - r2,
        v2, 0.0,
        0.0, 0.0,
        25.0, 7.0,
        0xFF00FFFF,
        0.0, 0.0
    });
}

// Preset: Chaotic system
void loadChaotic() {
    bodies.clear();
    
    bodies.push_back({
        300.0, 250.0,
        0.5, -0.3,
        0.0, 0.0,
        80.0, 14.0,
        0xFFFF00FF,
        0.0, 0.0
    });
    
    bodies.push_back({
        500.0, 350.0,
        -0.4, 0.6,
        0.0, 0.0,
        60.0, 11.0,
        0x00FFFFFF,
        0.0, 0.0
    });
    
    bodies.push_back({
        400.0, 200.0,
        0.2, 0.8,
        0.0, 0.0,
        70.0, 12.0,
        0xFF00FFFF,
        0.0, 0.0
    });
}

// Preset: Binary star system with planet
void loadBinaryStar() {
    bodies.clear();
    
    // Binary star system - two stars orbiting their barycenter
    // Star 1
    bodies.push_back({
        350.0, 300.0,
        0.0, 1.2,
        0.0, 0.0,
        100.0, 15.0,
        0xFFFF00FF,
        0.0, 0.0
    });
    
    // Star 2
    bodies.push_back({
        450.0, 300.0,
        0.0, -1.2,
        0.0, 0.0,
        100.0, 15.0,
        0xFF8800FF,
        0.0, 0.0
    });
    
    // Planet in far orbit
    bodies.push_back({
        400.0, 150.0,
        2.0, 0.0,
        0.0, 0.0,
        10.0, 5.0,
        0x0088FFFF,
        0.0, 0.0
    });
}

// Preset: Pythagorean three-body problem
void loadPythagorean() {
    bodies.clear();
    
    // Classic Pythagorean problem: masses in ratio 3:4:5
    bodies.push_back({
        250.0, 300.0,
        0.0, 0.0,
        0.0, 0.0,
        150.0, 16.0,  // mass 3
        0xFF0000FF,   // red
        0.0, 0.0
    });
    
    bodies.push_back({
        550.0, 300.0,
        0.0, 0.0,
        0.0, 0.0,
        200.0, 18.0,  // mass 4
        0x00FF00FF,   // green
        0.0, 0.0
    });
    
    bodies.push_back({
        400.0, 100.0,
        0.0, 1.5,
        0.0, 0.0,
        250.0, 20.0,  // mass 5
        0x0000FFFF,   // blue
        0.0, 0.0
    });
}

// Default initialization
void initBodies() {
    loadFigureEight(); // Default to figure-eight
}

/**
 * PHYSICS: Gravitational Force Calculation
 * 
 * Newton's Law of Universal Gravitation:
 * F = G * (m1 * m2) / r²
 * 
 * Where:
 * - G is the gravitational constant
 * - m1, m2 are the masses of the two bodies
 * - r is the distance between their centers
 * 
 * The force is a vector pointing from one mass to the other:
 * F_vec = F * (r_vec / |r_vec|)
 */
void calculateForces() {
    // Reset accelerations
    for (auto& body : bodies) {
        body.ax = 0.0;
        body.ay = 0.0;
    }
    
    // Calculate forces between all pairs (O(n²) algorithm)
    for (size_t i = 0; i < bodies.size(); i++) {
        for (size_t j = i + 1; j < bodies.size(); j++) {
            double dx = bodies[j].x - bodies[i].x;
            double dy = bodies[j].y - bodies[i].y;
            double distSq = dx * dx + dy * dy;
            double dist = sqrt(distSq);
            
            // Softening parameter to avoid singularities
            const double softening = 1.0;
            dist = fmax(dist, softening);
            distSq = dist * dist;
            
            // F = G * m1 * m2 / r²
            double force = G * bodies[i].mass * bodies[j].mass / distSq;
            
            // Force direction (unit vector)
            double fx = force * dx / dist;
            double fy = force * dy / dist;
            
            // Apply forces (Newton's 2nd law: F = ma => a = F/m)
            bodies[i].ax += fx / bodies[i].mass;
            bodies[i].ay += fy / bodies[i].mass;
            bodies[j].ax -= fx / bodies[j].mass;
            bodies[j].ay -= fy / bodies[j].mass;
        }
    }
}

/**
 * PHYSICS: Collision Detection and Response
 * 
 * Elastic collision formula:
 * v1' = ((m1 - m2) * v1 + 2 * m2 * v2) / (m1 + m2)
 * v2' = ((m2 - m1) * v2 + 2 * m1 * v1) / (m1 + m2)
 * 
 * With coefficient of restitution 'e' for inelastic collisions:
 * v_rel_after = -e * v_rel_before
 */
void handleCollisions() {
    if (!enableCollisions) return;
    
    for (size_t i = 0; i < bodies.size(); i++) {
        for (size_t j = i + 1; j < bodies.size(); j++) {
            double dx = bodies[j].x - bodies[i].x;
            double dy = bodies[j].y - bodies[i].y;
            double dist = sqrt(dx * dx + dy * dy);
            double minDist = bodies[i].radius + bodies[j].radius;
            
            if (dist < minDist) {
                // Collision detected!
                // Normal vector
                double nx = dx / dist;
                double ny = dy / dist;
                
                // Relative velocity
                double dvx = bodies[j].vx - bodies[i].vx;
                double dvy = bodies[j].vy - bodies[i].vy;
                double vrel = dvx * nx + dvy * ny;
                
                // Only resolve if bodies are moving toward each other
                if (vrel < 0) {
                    // Impulse magnitude: J = -(1 + e) * v_rel / (1/m1 + 1/m2)
                    double impulse = -(1.0 + collisionDamping) * vrel / (1.0/bodies[i].mass + 1.0/bodies[j].mass);
                    
                    // Apply impulse
                    bodies[i].vx -= impulse * nx / bodies[i].mass;
                    bodies[i].vy -= impulse * ny / bodies[i].mass;
                    bodies[j].vx += impulse * nx / bodies[j].mass;
                    bodies[j].vy += impulse * ny / bodies[j].mass;
                    
                    // Separate bodies to prevent overlap
                    double overlap = minDist - dist;
                    double separationRatio = overlap / (2.0 * dist);
                    bodies[i].x -= dx * separationRatio;
                    bodies[i].y -= dy * separationRatio;
                    bodies[j].x += dx * separationRatio;
                    bodies[j].y += dy * separationRatio;
                }
            }
        }
    }
}

/**
 * PHYSICS: Velocity Verlet Integration (Symplectic, 2nd order)
 * 
 * More stable than Euler method, conserves energy better.
 * Algorithm:
 * 1. v(t + dt/2) = v(t) + a(t) * dt/2
 * 2. x(t + dt) = x(t) + v(t + dt/2) * dt
 * 3. Calculate a(t + dt) from new positions
 * 4. v(t + dt) = v(t + dt/2) + a(t + dt) * dt/2
 */
void updateBodiesVerlet() {
    double effectiveDt = dt * timeScale;
    
    calculateForces();
    
    for (auto& body : bodies) {
        // Update velocity (half step)
        body.vx += body.ax * effectiveDt * 0.5;
        body.vy += body.ay * effectiveDt * 0.5;
        
        // Update position
        body.x += body.vx * effectiveDt;
        body.y += body.vy * effectiveDt;
    }
    
    handleCollisions();
    calculateForces();
    
    for (auto& body : bodies) {
        // Update velocity (second half step)
        body.vx += body.ax * effectiveDt * 0.5;
        body.vy += body.ay * effectiveDt * 0.5;
    }
}

/**
 * PHYSICS: Runge-Kutta 4th Order Integration (RK4)
 * 
 * Higher accuracy than Verlet, 4th order method.
 * More computationally expensive but better for chaotic systems.
 * 
 * k1 = f(t, y)
 * k2 = f(t + dt/2, y + k1*dt/2)
 * k3 = f(t + dt/2, y + k2*dt/2)
 * k4 = f(t + dt, y + k3*dt)
 * y(t+dt) = y(t) + (k1 + 2*k2 + 2*k3 + k4) * dt/6
 */
struct State {
    double x, y, vx, vy;
};

struct Derivative {
    double dx, dy, dvx, dvy;
};

Derivative evaluate(const State& initial, double dt, const Derivative& d, std::vector<Body>& tempBodies) {
    State state;
    state.x = initial.x + d.dx * dt;
    state.y = initial.y + d.dy * dt;
    state.vx = initial.vx + d.dvx * dt;
    state.vy = initial.vy + d.dvy * dt;
    
    // Update temp bodies with new state
    for (size_t i = 0; i < tempBodies.size(); i++) {
        if (i < bodies.size()) {
            tempBodies[i].x = state.x;
            tempBodies[i].y = state.y;
        }
    }
    
    Derivative output;
    output.dx = state.vx;
    output.dy = state.vy;
    
    // Calculate acceleration at this state
    double ax = 0, ay = 0;
    for (size_t i = 0; i < bodies.size(); i++) {
        for (size_t j = 0; j < bodies.size(); j++) {
            if (i != j) {
                double dx = tempBodies[j].x - state.x;
                double dy = tempBodies[j].y - state.y;
                double distSq = dx * dx + dy * dy;
                double dist = sqrt(distSq);
                dist = fmax(dist, 1.0);
                distSq = dist * dist;
                
                double force = G * tempBodies[j].mass / distSq;
                ax += force * dx / dist;
                ay += force * dy / dist;
            }
        }
    }
    
    output.dvx = ax;
    output.dvy = ay;
    return output;
}

void updateBodiesRK4() {
    double effectiveDt = dt * timeScale;
    std::vector<Body> tempBodies = bodies;
    
    for (size_t i = 0; i < bodies.size(); i++) {
        State state = {bodies[i].x, bodies[i].y, bodies[i].vx, bodies[i].vy};
        
        Derivative k1 = evaluate(state, 0.0, {0,0,0,0}, tempBodies);
        Derivative k2 = evaluate(state, effectiveDt*0.5, k1, tempBodies);
        Derivative k3 = evaluate(state, effectiveDt*0.5, k2, tempBodies);
        Derivative k4 = evaluate(state, effectiveDt, k3, tempBodies);
        
        // Combine derivatives
        double dxdt = (k1.dx + 2.0*k2.dx + 2.0*k3.dx + k4.dx) / 6.0;
        double dydt = (k1.dy + 2.0*k2.dy + 2.0*k3.dy + k4.dy) / 6.0;
        double dvxdt = (k1.dvx + 2.0*k2.dvx + 2.0*k3.dvx + k4.dvx) / 6.0;
        double dvydt = (k1.dvy + 2.0*k2.dvy + 2.0*k3.dvy + k4.dvy) / 6.0;
        
        bodies[i].x += dxdt * effectiveDt;
        bodies[i].y += dydt * effectiveDt;
        bodies[i].vx += dvxdt * effectiveDt;
        bodies[i].vy += dvydt * effectiveDt;
    }
    
    handleCollisions();
}

/**
 * Calculate system properties for physics analysis
 */
void calculateSystemProperties() {
    double totalMass = 0.0;
    double cmX = 0.0, cmY = 0.0;
    double momX = 0.0, momY = 0.0;
    double kineticE = 0.0;
    double potentialE = 0.0;
    
    // Calculate center of mass and momentum
    for (const auto& body : bodies) {
        totalMass += body.mass;
        cmX += body.x * body.mass;
        cmY += body.y * body.mass;
        momX += body.vx * body.mass;
        momY += body.vy * body.mass;
        
        // Kinetic energy: KE = (1/2) * m * v²
        double speedSq = body.vx * body.vx + body.vy * body.vy;
        kineticE += 0.5 * body.mass * speedSq;
    }
    
    centerOfMassX = cmX / totalMass;
    centerOfMassY = cmY / totalMass;
    totalMomentumX = momX;
    totalMomentumY = momY;
    
    // Potential energy: PE = -G * m1 * m2 / r
    for (size_t i = 0; i < bodies.size(); i++) {
        for (size_t j = i + 1; j < bodies.size(); j++) {
            double dx = bodies[j].x - bodies[i].x;
            double dy = bodies[j].y - bodies[i].y;
            double dist = sqrt(dx * dx + dy * dy);
            dist = fmax(dist, 1.0);
            
            potentialE -= G * bodies[i].mass * bodies[j].mass / dist;
        }
    }
    
    totalEnergy = kineticE + potentialE;
}

void updateBodies() {
    if (useRK4) {
        updateBodiesRK4();
    } else {
        updateBodiesVerlet();
    }
    calculateSystemProperties();
}


// Main loop
extern "C" {
    EMSCRIPTEN_KEEPALIVE
    void update() {
        updateBodies();
    }
    
    EMSCRIPTEN_KEEPALIVE
    double getBodyX(int index) {
        if (index >= 0 && index < bodies.size()) {
            return bodies[index].x;
        }
        return 0.0;
    }
    
    EMSCRIPTEN_KEEPALIVE
    double getBodyY(int index) {
        if (index >= 0 && index < bodies.size()) {
            return bodies[index].y;
        }
        return 0.0;
    }
    
    EMSCRIPTEN_KEEPALIVE
    double getBodyRadius(int index) {
        if (index >= 0 && index < bodies.size()) {
            return bodies[index].radius;
        }
        return 0.0;
    }
    
    EMSCRIPTEN_KEEPALIVE
    unsigned int getBodyColor(int index) {
        if (index >= 0 && index < bodies.size()) {
            return bodies[index].color;
        }
        return 0xFFFFFFFF;
    }
    
    EMSCRIPTEN_KEEPALIVE
    double getBodyVX(int index) {
        if (index >= 0 && index < bodies.size()) {
            return bodies[index].vx;
        }
        return 0.0;
    }
    
    EMSCRIPTEN_KEEPALIVE
    double getBodyVY(int index) {
        if (index >= 0 && index < bodies.size()) {
            return bodies[index].vy;
        }
        return 0.0;
    }
    
    EMSCRIPTEN_KEEPALIVE
    double getBodyMass(int index) {
        if (index >= 0 && index < bodies.size()) {
            return bodies[index].mass;
        }
        return 0.0;
    }
    
    EMSCRIPTEN_KEEPALIVE
    int getBodyCount() {
        return bodies.size();
    }
    
    EMSCRIPTEN_KEEPALIVE
    double getTotalEnergy() {
        return totalEnergy;
    }
    
    EMSCRIPTEN_KEEPALIVE
    double getMomentumX() {
        return totalMomentumX;
    }
    
    EMSCRIPTEN_KEEPALIVE
    double getMomentumY() {
        return totalMomentumY;
    }
    
    EMSCRIPTEN_KEEPALIVE
    double getCenterOfMassX() {
        return centerOfMassX;
    }
    
    EMSCRIPTEN_KEEPALIVE
    double getCenterOfMassY() {
        return centerOfMassY;
    }
    
    EMSCRIPTEN_KEEPALIVE
    void setGravitationalConstant(double g) {
        G = g;
    }
    
    EMSCRIPTEN_KEEPALIVE
    double getGravitationalConstant() {
        return G;
    }
    
    EMSCRIPTEN_KEEPALIVE
    void setTimeStep(double newDt) {
        dt = newDt;
    }
    
    EMSCRIPTEN_KEEPALIVE
    double getTimeStep() {
        return dt;
    }
    
    EMSCRIPTEN_KEEPALIVE
    void setTimeScale(double scale) {
        timeScale = scale;
    }
    
    EMSCRIPTEN_KEEPALIVE
    double getTimeScale() {
        return timeScale;
    }
    
    EMSCRIPTEN_KEEPALIVE
    void setIntegrator(int rk4) {
        useRK4 = (rk4 != 0);
    }
    
    EMSCRIPTEN_KEEPALIVE
    int getIntegrator() {
        return useRK4 ? 1 : 0;
    }
    
    EMSCRIPTEN_KEEPALIVE
    void setCollisions(int enabled) {
        enableCollisions = (enabled != 0);
    }
    
    EMSCRIPTEN_KEEPALIVE
    int getCollisions() {
        return enableCollisions ? 1 : 0;
    }
    
    EMSCRIPTEN_KEEPALIVE
    void setCollisionDamping(double damping) {
        collisionDamping = damping;
    }
    
    EMSCRIPTEN_KEEPALIVE
    void loadPreset(int presetType) {
        switch (presetType) {
            case PRESET_FIGURE_EIGHT:
                loadFigureEight();
                break;
            case PRESET_STABLE_ORBIT:
                loadStableOrbit();
                break;
            case PRESET_CHAOTIC:
                loadChaotic();
                break;
            case PRESET_BINARY_STAR:
                loadBinaryStar();
                break;
            case PRESET_PYTHAGOREAN:
                loadPythagorean();
                break;
        }
        initialBodies = bodies;
        calculateSystemProperties();
    }
    
    EMSCRIPTEN_KEEPALIVE
    void addBody(double x, double y, double vx, double vy, double mass, double radius, unsigned int color) {
        bodies.push_back({
            x, y, vx, vy, 0.0, 0.0,
            mass, radius, color,
            0.0, 0.0
        });
        initialBodies = bodies;
    }
    
    EMSCRIPTEN_KEEPALIVE
    void removeBody(int index) {
        if (index >= 0 && index < bodies.size()) {
            bodies.erase(bodies.begin() + index);
            initialBodies = bodies;
        }
    }
    
    EMSCRIPTEN_KEEPALIVE
    void clearBodies() {
        bodies.clear();
        initialBodies.clear();
    }
    
    EMSCRIPTEN_KEEPALIVE
    void init() {
        initBodies();
        initialBodies = bodies;
        calculateSystemProperties();
        printf("Three-body simulation initialized with %zu bodies\n", bodies.size());
    }
    
    EMSCRIPTEN_KEEPALIVE
    void reset() {
        bodies = initialBodies;
        calculateSystemProperties();
    }
}

int main() {
    printf("Three-body simulation starting...\n");
    init();
    return 0;
}
