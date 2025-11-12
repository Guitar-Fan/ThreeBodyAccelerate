#include <emscripten/emscripten.h>
#include <emscripten/html5.h>
#include <cmath>
#include <cstdio>
#include <vector>

// Structure to represent a celestial body
struct Body {
    double x, y;      // Position
    double vx, vy;    // Velocity
    double ax, ay;    // Acceleration
    double mass;
    double radius;
    unsigned int color; // RGBA color
};

// Simulation state
std::vector<Body> bodies;
const double G = 1.0; // Gravitational constant (scaled for simulation)
const double dt = 0.01; // Time step
int canvasWidth = 800;
int canvasHeight = 600;

// Initialize the three-body system
void initBodies() {
    bodies.clear();
    
    // Body 1 - Large central body (yellow)
    bodies.push_back({
        300.0, 300.0,    // x, y
        0.0, -0.2,       // vx, vy
        0.0, 0.0,        // ax, ay
        100.0,           // mass
        15.0,            // radius
        0xFFFF00FF       // color (RGBA)
    });
    
    // Body 2 - Medium body (cyan)
    bodies.push_back({
        400.0, 300.0,    // x, y
        0.0, 1.5,        // vx, vy
        0.0, 0.0,        // ax, ay
        50.0,            // mass
        10.0,            // radius
        0x00FFFFFF       // color (RGBA)
    });
    
    // Body 3 - Small body (magenta)
    bodies.push_back({
        350.0, 200.0,    // x, y
        -1.0, 0.5,       // vx, vy
        0.0, 0.0,        // ax, ay
        30.0,            // mass
        8.0,             // radius
        0xFF00FFFF       // color (RGBA)
    });
}

// Calculate gravitational forces and update accelerations
void calculateForces() {
    // Reset accelerations
    for (auto& body : bodies) {
        body.ax = 0.0;
        body.ay = 0.0;
    }
    
    // Calculate forces between all pairs
    for (size_t i = 0; i < bodies.size(); i++) {
        for (size_t j = i + 1; j < bodies.size(); j++) {
            double dx = bodies[j].x - bodies[i].x;
            double dy = bodies[j].y - bodies[i].y;
            double distSq = dx * dx + dy * dy;
            double dist = sqrt(distSq);
            
            // Avoid division by zero
            if (dist < 1.0) dist = 1.0;
            
            // F = G * m1 * m2 / r^2
            double force = G * bodies[i].mass * bodies[j].mass / distSq;
            
            // Force direction (unit vector)
            double fx = force * dx / dist;
            double fy = force * dy / dist;
            
            // Apply forces (F = ma => a = F/m)
            bodies[i].ax += fx / bodies[i].mass;
            bodies[i].ay += fy / bodies[i].mass;
            bodies[j].ax -= fx / bodies[j].mass;
            bodies[j].ay -= fy / bodies[j].mass;
        }
    }
}

// Update positions and velocities using Velocity Verlet integration
void updateBodies() {
    calculateForces();
    
    for (auto& body : bodies) {
        // Update velocity (half step)
        body.vx += body.ax * dt * 0.5;
        body.vy += body.ay * dt * 0.5;
        
        // Update position
        body.x += body.vx * dt;
        body.y += body.vy * dt;
    }
    
    calculateForces();
    
    for (auto& body : bodies) {
        // Update velocity (second half step)
        body.vx += body.ax * dt * 0.5;
        body.vy += body.ay * dt * 0.5;
    }
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
    int getBodyCount() {
        return bodies.size();
    }
    
    EMSCRIPTEN_KEEPALIVE
    void init() {
        initBodies();
        printf("Three-body simulation initialized with %zu bodies\n", bodies.size());
    }
    
    EMSCRIPTEN_KEEPALIVE
    void reset() {
        initBodies();
    }
}

int main() {
    printf("Three-body simulation starting...\n");
    init();
    return 0;
}
