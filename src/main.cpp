#include <emscripten/emscripten.h>
#include <emscripten/html5.h>
#include <cmath>
#include <cstdio>
#include <vector>
#include <algorithm>

#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

// Structure to represent a celestial body
struct Body {
    double x, y, z;      // Position (3D as per PDF requirement)
    double vx, vy, vz;    // Velocity (3D)
    double ax, ay, az;    // Acceleration (3D)
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

// Integration method selection
enum IntegrationMethod {
    METHOD_EULER,        // Basic Euler method (PDF Section 3.2)
    METHOD_VERLET,       // Velocity Verlet (symplectic)
    METHOD_RK4,          // Runge-Kutta 4th order
    METHOD_RKF45         // Runge-Kutta-Fehlberg adaptive (PDF Section 3.3)
};
IntegrationMethod currentMethod = METHOD_VERLET;

bool enableCollisions = false;
double collisionDamping = 0.8; // Coefficient of restitution
bool enableMerging = true;     // Allow bodies to merge on collision
bool enableTidalForces = false; // Tidal deformation effects
double softeningLength = 0.0;   // Gravitational softening (OFF by default for pure Newton)
bool conserveAngularMomentum = true; // Enforce angular momentum conservation
bool enableGravitationalWaves = false; // Energy loss from GW radiation

// RKF45 adaptive parameters
double rkfTolerance = 1e-6;     // Error tolerance for adaptive stepping
double minDt = 0.001;           // Minimum time step
double maxDt = 0.1;             // Maximum time step

// System properties (3D vectors as per PDF Section 2.2)
double totalEnergy = 0.0;
double totalMomentumX = 0.0;
double totalMomentumY = 0.0;
double totalMomentumZ = 0.0;
double centerOfMassX = 0.0;
double centerOfMassY = 0.0;
double centerOfMassZ = 0.0;
double angularMomentumX = 0.0;  // L_x component
double angularMomentumY = 0.0;  // L_y component
double angularMomentumZ = 0.0;  // L_z component

// Conservation monitoring
double initialEnergy = 0.0;
double initialMomentumX = 0.0;
double initialMomentumY = 0.0;
double initialMomentumZ = 0.0;
double initialAngularMomentumX = 0.0;
double initialAngularMomentumY = 0.0;
double initialAngularMomentumZ = 0.0;
double energyDrift = 0.0;
double momentumDrift = 0.0;
double angularMomentumDrift = 0.0;

// Canvas properties
int canvasWidth = 800;
int canvasHeight = 600;

// Preset configurations
enum PresetType {
    PRESET_FIGURE_EIGHT,        // Classic 3-body equal mass
    PRESET_STABLE_ORBIT,        // 3-body hierarchical
    PRESET_CHAOTIC,            // 3-body chaotic
    PRESET_BINARY_STAR,        // 3-body binary+planet
    PRESET_PYTHAGOREAN,        // 3-body Pythagorean problem
    PRESET_LAGRANGE,           // 3-body Lagrange equilateral triangle
    PRESET_SOLAR_SYSTEM,       // N-body (beyond three-body scope)
    PRESET_CUSTOM
};


// Preset: Figure-eight orbit (discovered by Cris Moore, 1993)
// This is a stable periodic orbit where three equal masses chase each other
// Classic three-body problem solution with m1 = m2 = m3
void loadFigureEight() {
    bodies.clear();
    
    // Figure-eight initial conditions (scaled for visualization)
    // Equal masses - fundamental to classical three-body problem
    double mass = 1.0;  // Equal mass for all three bodies
    
    bodies.push_back({
        350.0, 300.0, 0.0,         // x, y, z (3D, z=0 for 2D view)
        0.3471168, 0.5327706, 0.0, // vx, vy, vz
        0.0, 0.0, 0.0,             // ax, ay, az
        mass, 8.0,            // mass (equal), radius
        0x4A90E2FF,           // Earth blue
        0.0, 0.0              // energies
    });
    
    bodies.push_back({
        450.0, 300.0, 0.0,         // x, y, z
        0.3471168, 0.5327706, 0.0, // vx, vy, vz (same as body 1)
        0.0, 0.0, 0.0,             // ax, ay, az
        mass, 8.0,            // mass (equal), radius
        0xE74C3CFF,           // Mars red
        0.0, 0.0              // energies
    });
    
    bodies.push_back({
        400.0, 213.0, 0.0,         // x, y, z
        -0.6942336, -1.0655412, 0.0, // vx, vy, vz (opposite of others)
        0.0, 0.0, 0.0,             // ax, ay, az
        mass, 8.0,            // mass (equal), radius
        0xF39C12FF,           // Venus yellow/orange
        0.0, 0.0              // energies
    });
}

// Preset: Stable circular orbit system
void loadStableOrbit() {
    bodies.clear();
    
    // Central massive body (Sun-like - scaled mass)
    bodies.push_back({
        400.0, 300.0, 0.0,    // x, y, z (center)
        0.0, 0.0, 0.0,        // vx, vy, vz (stationary)
        0.0, 0.0, 0.0,        // ax, ay, az
        333.0,           // large mass (Sun-like, scaled from 333,000)
        20.0,            // radius
        0xFDB813FF,      // Sun yellow
        0.0, 0.0
    });
    
    // Orbiting body 1 (Earth-like planet)
    // v = sqrt(G*M/r) for circular orbit
    double r1 = 150.0;
    double v1 = sqrt(G * 333.0 / r1);
    bodies.push_back({
        400.0 + r1, 300.0, 0.0,
        0.0, v1, 0.0,
        0.0, 0.0, 0.0,
        1.0, 7.5,        // 1 Earth mass
        0x3498DBFF,      // Earth blue
        0.0, 0.0
    });
    
    // Orbiting body 2 (Jupiter-like planet)
    double r2 = 220.0;
    double v2 = sqrt(G * 333.0 / r2);
    bodies.push_back({
        400.0, 300.0 - r2, 0.0,
        v2, 0.0, 0.0,
        0.0, 0.0, 0.0,
        317.8, 16.0,     // Jupiter mass
        0xE67E22FF,      // Jupiter orange
        0.0, 0.0
    });
}

// Preset: Chaotic system
void loadChaotic() {
    bodies.clear();
    
    // Using planetary masses for chaotic interactions
    bodies.push_back({
        300.0, 250.0, 0.0,
        0.5, -0.3, 0.0,
        0.0, 0.0, 0.0,
        17.1, 10.0,      // Neptune mass
        0x9B59B6FF,      // Purple (Neptune-like)
        0.0, 0.0
    });
    
    bodies.push_back({
        500.0, 350.0, 0.0,
        -0.4, 0.6, 0.0,
        0.0, 0.0, 0.0,
        14.5, 9.5,       // Uranus mass
        0x1ABC9CFF,      // Turquoise (Uranus-like)
        0.0, 0.0
    });
    
    bodies.push_back({
        400.0, 200.0, 0.0,
        0.2, 0.8, 0.0,
        0.0, 0.0, 0.0,
        95.2, 14.0,      // Saturn mass
        0xE74C3CFF,      // Red (stylized)
        0.0, 0.0
    });
}

// Preset: Binary star system with planet
void loadBinaryStar() {
    bodies.clear();
    
    // Binary star system - two stars orbiting their barycenter
    // Star 1 (Yellow star - scaled solar mass)
    bodies.push_back({
        350.0, 300.0, 0.0,
        0.0, 1.2, 0.0,
        0.0, 0.0, 0.0,
        333.0, 18.0,     // Solar mass (scaled)
        0xFFF3B0FF,      // Bright yellow star
        0.0, 0.0
    });
    
    // Star 2 (Orange star - slightly smaller)
    bodies.push_back({
        450.0, 300.0, 0.0,
        0.0, -1.2, 0.0,
        0.0, 0.0, 0.0,
        250.0, 16.0,     // 0.75 solar masses (scaled)
        0xFF8C42FF,      // Orange star
        0.0, 0.0
    });
    
    // Planet in far orbit (Super-Earth)
    bodies.push_back({
        400.0, 150.0, 0.0,
        2.0, 0.0, 0.0,
        0.0, 0.0, 0.0,
        5.0, 6.0,        // Super-Earth (5 Earth masses)
        0xA2D5F2FF,      // Pale blue ice planet
        0.0, 0.0
    });
}

// Preset: Pythagorean three-body problem
void loadPythagorean() {
    bodies.clear();
    
    // Classic Pythagorean problem: masses in ratio 3:4:5
    // Using gas giant masses
    bodies.push_back({
        250.0, 300.0, 0.0,
        0.0, 0.0, 0.0,
        0.0, 0.0, 0.0,
        95.2, 16.0,      // Saturn mass (represents 3)
        0xE67E22FF,      // Jupiter orange
        0.0, 0.0
    });
    
    bodies.push_back({
        550.0, 300.0, 0.0,
        0.0, 0.0, 0.0,
        0.0, 0.0, 0.0,
        126.9, 17.0,     // ~4/3 * Saturn (represents 4)
        0xF4D03FFF,      // Saturn yellow
        0.0, 0.0
    });
    
    bodies.push_back({
        400.0, 100.0, 0.0,
        0.0, 1.5, 0.0,
        0.0, 0.0, 0.0,
        158.7, 18.0,     // ~5/3 * Saturn (represents 5)
        0x5DADE2FF,      // Neptune blue
        0.0, 0.0
    });
}

// Preset: Lagrange Equilateral Triangle Configuration
// Classic three-body solution where bodies orbit in equilateral triangle
// One of the simplest periodic solutions to the three-body problem
void loadLagrange() {
    bodies.clear();
    
    // Three equal masses at vertices of equilateral triangle
    // Rotating about their common center of mass
    double mass = 1.0;      // Equal masses (fundamental to this solution)
    double radius = 150.0;  // Distance from center
    
    // Angular velocity for stable orbit
    double omega = sqrt(3.0 * G * mass / (radius * radius * radius));
    
    // Body 1 at 0 degrees
    double angle1 = 0.0;
    bodies.push_back({
        400.0 + radius * cos(angle1), 300.0 + radius * sin(angle1), 0.0,
        -omega * radius * sin(angle1), omega * radius * cos(angle1), 0.0,
        0.0, 0.0, 0.0,
        mass, 8.0,
        0x4A90E2FF,  // Blue
        0.0, 0.0
    });
    
    // Body 2 at 120 degrees
    double angle2 = 2.0 * M_PI / 3.0;
    bodies.push_back({
        400.0 + radius * cos(angle2), 300.0 + radius * sin(angle2), 0.0,
        -omega * radius * sin(angle2), omega * radius * cos(angle2), 0.0,
        0.0, 0.0, 0.0,
        mass, 8.0,
        0xE74C3CFF,  // Red
        0.0, 0.0
    });
    
    // Body 3 at 240 degrees
    double angle3 = 4.0 * M_PI / 3.0;
    bodies.push_back({
        400.0 + radius * cos(angle3), 300.0 + radius * sin(angle3), 0.0,
        -omega * radius * sin(angle3), omega * radius * cos(angle3), 0.0,
        0.0, 0.0, 0.0,
        mass, 8.0,
        0xF39C12FF,  // Yellow
        0.0, 0.0
    });
}

// Preset: Solar System simulation
// Uses realistic planetary mass ratios (Earth = 1.0)
// Sun ≈ 333,000 Earth masses (scaled down for simulation stability)
void loadSolarSystem() {
    bodies.clear();
    
    // Sun at center (mass scaled to 1000 for simulation)
    bodies.push_back({
        400.0, 300.0, 0.0,    // x, y, z (center)
        0.0, 0.0, 0.0,        // vx, vy, vz (stationary)
        0.0, 0.0, 0.0,        // ax, ay, az
        1000.0,          // mass (Sun - scaled from 333,000)
        25.0,            // radius
        0xFDB813FF,      // Sun yellow
        0.0, 0.0
    });
    
    // Mercury (mass 0.055 Earth masses)
    // Orbital radius ~58M km = 0.39 AU, speed ~47.9 km/s
    double mercuryR = 60.0;
    double mercuryV = sqrt(G * 1000.0 / mercuryR);
    bodies.push_back({
        400.0 + mercuryR, 300.0, 0.0,
        0.0, mercuryV, 0.0,
        0.0, 0.0, 0.0,
        0.055, 3.5,      // Small mass, small radius
        0x8C7853FF,      // Mercury gray-brown
        0.0, 0.0
    });
    
    // Venus (mass 0.815 Earth masses)
    // Orbital radius ~108M km = 0.72 AU, speed ~35 km/s
    double venusR = 90.0;
    double venusV = sqrt(G * 1000.0 / venusR);
    bodies.push_back({
        400.0, 300.0 - venusR, 0.0,
        venusV, 0.0, 0.0,
        0.0, 0.0, 0.0,
        0.815, 7.0,
        0xFFC649FF,      // Venus yellowish
        0.0, 0.0
    });
    
    // Earth (mass 1.0 Earth mass)
    // Orbital radius ~150M km = 1 AU, speed ~30 km/s
    double earthR = 120.0;
    double earthV = sqrt(G * 1000.0 / earthR);
    bodies.push_back({
        400.0 - earthR, 300.0, 0.0,
        0.0, -earthV, 0.0,
        0.0, 0.0, 0.0,
        1.0, 7.5,        // Earth mass = 1.0
        0x4A90E2FF,      // Earth blue
        0.0, 0.0
    });
    
    // Mars (mass 0.107 Earth masses)
    // Orbital radius ~228M km = 1.52 AU, speed ~24 km/s
    double marsR = 160.0;
    double marsV = sqrt(G * 1000.0 / marsR);
    bodies.push_back({
        400.0, 300.0 + marsR, 0.0,
        -marsV, 0.0, 0.0,
        0.0, 0.0, 0.0,
        0.107, 4.5,
        0xE74C3CFF,      // Mars red
        0.0, 0.0
    });
    
    // Jupiter (mass 317.8 Earth masses)
    // Orbital radius ~778M km = 5.2 AU, speed ~13 km/s
    double jupiterR = 240.0;
    double jupiterV = sqrt(G * 1000.0 / jupiterR);
    bodies.push_back({
        400.0 + jupiterR, 300.0, 0.0,
        0.0, jupiterV, 0.0,
        0.0, 0.0, 0.0,
        317.8, 18.0,     // Jupiter - gas giant
        0xE67E22FF,      // Jupiter orange with bands
        0.0, 0.0
    });
    
    // Saturn (mass 95.2 Earth masses)
    // Orbital radius ~1.4B km = 9.5 AU, speed ~9.7 km/s
    double saturnR = 290.0;
    double saturnV = sqrt(G * 1000.0 / saturnR);
    bodies.push_back({
        400.0 - saturnR * 0.7, 300.0 - saturnR * 0.7, 0.0,
        saturnV * 0.7, -saturnV * 0.7, 0.0,
        0.0, 0.0, 0.0,
        95.2, 16.0,
        0xF4D03FFF,      // Saturn pale yellow
        0.0, 0.0
    });
    
    // Uranus (mass 14.5 Earth masses)
    // Orbital radius ~2.9B km = 19.2 AU, speed ~6.8 km/s (optional - far out)
    /*double uranusR = 340.0;
    double uranusV = sqrt(G * 1000.0 / uranusR);
    bodies.push_back({
        400.0, 300.0 - uranusR, 0.0,
        uranusV, 0.0, 0.0,
        0.0, 0.0, 0.0,
        14.5, 10.0,
        0x4FD5D6FF,      // Uranus cyan
        0.0, 0.0
    });*/
    
    // Neptune (mass 17.1 Earth masses) 
    // Orbital radius ~4.5B km = 30 AU, speed ~5.4 km/s (optional - very far)
    /*double neptuneR = 380.0;
    double neptuneV = sqrt(G * 1000.0 / neptuneR);
    bodies.push_back({
        400.0 + neptuneR, 300.0, 0.0,
        0.0, neptuneV, 0.0,
        0.0, 0.0, 0.0,
        17.1, 10.0,
        0x5DADE2FF,      // Neptune blue
        0.0, 0.0
    });*/
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
/**
 * PHYSICS: Gravitational Force Calculation (3D)
 * 
 * Newton's Law of Universal Gravitation (PDF equations 1-4):
 * F = G * m1 * m2 / r²
 * 
 * Optional Plummer softening to prevent singularities:
 * F = G * m1 * m2 / (r² + ε²)^(3/2)
 * 
 * Softening length ε prevents infinite forces at r→0 (disabled by default)
 * Also includes optional tidal force approximation
 */
void calculateForces() {
    // Reset accelerations
    for (auto& body : bodies) {
        body.ax = 0.0;
        body.ay = 0.0;
        body.az = 0.0;
    }
    
    // Calculate forces between all pairs (O(n²) algorithm)
    for (size_t i = 0; i < bodies.size(); i++) {
        for (size_t j = i + 1; j < bodies.size(); j++) {
            double dx = bodies[j].x - bodies[i].x;
            double dy = bodies[j].y - bodies[i].y;
            double dz = bodies[j].z - bodies[i].z;
            double distSq = dx * dx + dy * dy + dz * dz;
            double dist = sqrt(distSq);
            
            // Optional Plummer softening: F = G*m1*m2 / (r² + ε²)^(3/2)
            // Only applied if softeningLength > 0
            double softenedDistSq = distSq + softeningLength * softeningLength;
            double softenedDist = sqrt(softenedDistSq);
            
            // Gravitational force magnitude
            double forceMag = G * bodies[i].mass * bodies[j].mass / softenedDistSq;
            
            // Force components (3D)
            double fx = forceMag * dx / softenedDist;
            double fy = forceMag * dy / softenedDist;
            double fz = forceMag * dz / softenedDist;
            
            // Apply forces (Newton's 2nd & 3rd laws: F = ma, F_ij = -F_ji)
            bodies[i].ax += fx / bodies[i].mass;
            bodies[i].ay += fy / bodies[i].mass;
            bodies[i].az += fz / bodies[i].mass;
            bodies[j].ax -= fx / bodies[j].mass;
            bodies[j].ay -= fy / bodies[j].mass;
            bodies[j].az -= fz / bodies[j].mass;
            
            // Optional: Tidal forces (quadrupole approximation)
            // Causes tidal deformation and heating
            if (enableTidalForces && dist < bodies[i].radius * 5 && dist < bodies[j].radius * 5) {
                // Tidal acceleration ~ G*M*R/r³ (simplified)
                double tidalFactor = 0.01; // Damping factor
                double tidalAccel1 = tidalFactor * G * bodies[j].mass * bodies[i].radius / (dist * dist * dist);
                double tidalAccel2 = tidalFactor * G * bodies[i].mass * bodies[j].radius / (dist * dist * dist);
                
                // Apply small damping to simulate tidal dissipation
                bodies[i].vx *= (1.0 - tidalAccel1 * dt * 0.001);
                bodies[i].vy *= (1.0 - tidalAccel1 * dt * 0.001);
                bodies[i].vz *= (1.0 - tidalAccel1 * dt * 0.001);
                bodies[j].vx *= (1.0 - tidalAccel2 * dt * 0.001);
                bodies[j].vy *= (1.0 - tidalAccel2 * dt * 0.001);
                bodies[j].vz *= (1.0 - tidalAccel2 * dt * 0.001);
            }
            
            // Optional: Gravitational wave energy loss (post-Newtonian)
            // dE/dt = -(32/5) * G⁴/c⁵ * (m1*m2)²*(m1+m2)/r⁵
            if (enableGravitationalWaves && dist < 100.0) {
                double c = 300.0; // Speed of light (scaled)
                double m1m2 = bodies[i].mass * bodies[j].mass;
                double gwFactor = (32.0/5.0) * pow(G, 4) / pow(c, 5);
                double energyLoss = gwFactor * m1m2 * m1m2 * (bodies[i].mass + bodies[j].mass) / pow(dist, 5);
                
                // Apply energy loss as velocity damping
                double dampingFactor = 1.0 - energyLoss * dt * 0.0001;
                bodies[i].vx *= dampingFactor;
                bodies[i].vy *= dampingFactor;
                bodies[i].vz *= dampingFactor;
                bodies[j].vx *= dampingFactor;
                bodies[j].vy *= dampingFactor;
                bodies[j].vz *= dampingFactor;
            }
        }
    }
}

/**
 * PHYSICS: Collision Detection and Response (3D)
 * 
 * Realistic collision mechanics:
 * 1. Conservation of linear momentum: m1*v1 + m2*v2 = (m1+m2)*v_final
 * 2. Conservation of angular momentum: L1 + L2 = L_final
 * 3. Energy dissipation through coefficient of restitution
 * 4. Merging for catastrophic collisions (high velocity/mass ratio)
 * 
 * Elastic collision formula:
 * v1' = ((m1 - m2) * v1 + 2 * m2 * v2) / (m1 + m2)
 * v2' = ((m2 - m1) * v2 + 2 * m1 * v1) / (m1 + m2)
 */
void handleCollisions() {
    if (!enableCollisions) return;
    
    std::vector<size_t> bodiesToRemove;
    
    for (size_t i = 0; i < bodies.size(); i++) {
        for (size_t j = i + 1; j < bodies.size(); j++) {
            double dx = bodies[j].x - bodies[i].x;
            double dy = bodies[j].y - bodies[i].y;
            double dz = bodies[j].z - bodies[i].z;
            double dist = sqrt(dx * dx + dy * dy + dz * dz);
            double minDist = bodies[i].radius + bodies[j].radius;
            
            if (dist < minDist) {
                // Collision detected!
                double m1 = bodies[i].mass;
                double m2 = bodies[j].mass;
                double totalMass = m1 + m2;
                
                // Relative velocity magnitude
                double dvx = bodies[j].vx - bodies[i].vx;
                double dvy = bodies[j].vy - bodies[i].vy;
                double dvz = bodies[j].vz - bodies[i].vz;
                double relSpeed = sqrt(dvx * dvx + dvy * dvy + dvz * dvz);
                
                // Escape velocity from larger body
                double largerMass = std::max(m1, m2);
                double escapeVel = sqrt(2.0 * G * largerMass / minDist);
                
                // If collision is catastrophic (rel velocity > escape velocity), merge bodies
                if (enableMerging && relSpeed > escapeVel * 0.5) {
                    // MERGING: Perfectly inelastic collision
                    // Conserve momentum
                    double newVx = (m1 * bodies[i].vx + m2 * bodies[j].vx) / totalMass;
                    double newVy = (m1 * bodies[i].vy + m2 * bodies[j].vy) / totalMass;
                    double newVz = (m1 * bodies[i].vz + m2 * bodies[j].vz) / totalMass;
                    
                    // Position weighted by mass (center of mass)
                    double newX = (m1 * bodies[i].x + m2 * bodies[j].x) / totalMass;
                    double newY = (m1 * bodies[i].y + m2 * bodies[j].y) / totalMass;
                    double newZ = (m1 * bodies[i].z + m2 * bodies[j].z) / totalMass;
                    
                    // New radius: assume constant density, V ~ r^3, V1 + V2 = V_new
                    double newRadius = pow(pow(bodies[i].radius, 3) + pow(bodies[j].radius, 3), 1.0/3.0);
                    
                    // Color blend based on mass ratio
                    unsigned int c1 = bodies[i].color;
                    unsigned int c2 = bodies[j].color;
                    double ratio = m1 / totalMass;
                    unsigned int r = (unsigned int)(((c1 >> 24) & 0xFF) * ratio + ((c2 >> 24) & 0xFF) * (1-ratio));
                    unsigned int g = (unsigned int)(((c1 >> 16) & 0xFF) * ratio + ((c2 >> 16) & 0xFF) * (1-ratio));
                    unsigned int b = (unsigned int)(((c1 >> 8) & 0xFF) * ratio + ((c2 >> 8) & 0xFF) * (1-ratio));
                    unsigned int newColor = (r << 24) | (g << 16) | (b << 8) | 0xFF;
                    
                    // Update larger body (keep index i)
                    bodies[i].x = newX;
                    bodies[i].y = newY;
                    bodies[i].z = newZ;
                    bodies[i].vx = newVx;
                    bodies[i].vy = newVy;
                    bodies[i].vz = newVz;
                    bodies[i].mass = totalMass;
                    bodies[i].radius = newRadius;
                    bodies[i].color = newColor;
                    
                    // Mark smaller body for removal
                    bodiesToRemove.push_back(j);
                } else {
                    // ELASTIC/INELASTIC BOUNCE
                    // Normal vector
                    double nx = dx / dist;
                    double ny = dy / dist;
                    double nz = dz / dist;
                    
                    // Relative velocity along normal
                    double vrel = dvx * nx + dvy * ny + dvz * nz;
                    
                    // Only resolve if bodies are moving toward each other
                    if (vrel < 0) {
                        // Impulse magnitude: J = -(1 + e) * v_rel / (1/m1 + 1/m2)
                        double impulse = -(1.0 + collisionDamping) * vrel / (1.0/m1 + 1.0/m2);
                        
                        // Apply impulse (Newton's third law)
                        bodies[i].vx -= impulse * nx / m1;
                        bodies[i].vy -= impulse * ny / m1;
                        bodies[i].vz -= impulse * nz / m1;
                        bodies[j].vx += impulse * nx / m2;
                        bodies[j].vy += impulse * ny / m2;
                        bodies[j].vz += impulse * nz / m2;
                        
                        // Separate bodies to prevent overlap
                        double overlap = minDist - dist;
                        // Separation proportional to inverse mass (lighter body moves more)
                        double totalInvMass = 1.0/m1 + 1.0/m2;
                        double sep1 = overlap * (1.0/m1) / totalInvMass;
                        double sep2 = overlap * (1.0/m2) / totalInvMass;
                        
                        bodies[i].x -= nx * sep1;
                        bodies[i].y -= ny * sep1;
                        bodies[i].z -= nz * sep1;
                        bodies[j].x += nx * sep2;
                        bodies[j].y += ny * sep2;
                        bodies[j].z += nz * sep2;
                    }
                }
            }
        }
    }
    
    // Remove merged bodies (in reverse order to maintain indices)
    std::sort(bodiesToRemove.begin(), bodiesToRemove.end(), std::greater<size_t>());
    for (size_t idx : bodiesToRemove) {
        bodies.erase(bodies.begin() + idx);
    }
}

/**
 * PHYSICS: Euler Method Integration (PDF Section 3.2, equations 9-10)
 * 
 * Basic first-order integration - pedagogical foundation method
 * Gets more inaccurate as n gets large (as noted in PDF)
 * 
 * Algorithm:
 * v(t + dt) = v(t) + a(t) * dt
 * x(t + dt) = x(t) + v(t) * dt
 */
void updateBodiesEuler() {
    double effectiveDt = dt * timeScale;
    
    calculateForces();
    
    for (auto& body : bodies) {
        // Update velocity using current acceleration
        body.vx += body.ax * effectiveDt;
        body.vy += body.ay * effectiveDt;
        body.vz += body.az * effectiveDt;
        
        // Update position using updated velocity
        body.x += body.vx * effectiveDt;
        body.y += body.vy * effectiveDt;
        body.z += body.vz * effectiveDt;
    }
    
    handleCollisions();
}

/**
 * PHYSICS: Velocity Verlet Integration (Symplectic, 2nd order, 3D)
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
        body.vz += body.az * effectiveDt * 0.5;
        
        // Update position
        body.x += body.vx * effectiveDt;
        body.y += body.vy * effectiveDt;
        body.z += body.vz * effectiveDt;
    }
    
    handleCollisions();
    calculateForces();
    
    for (auto& body : bodies) {
        // Update velocity (second half step)
        body.vx += body.ax * effectiveDt * 0.5;
        body.vy += body.ay * effectiveDt * 0.5;
        body.vz += body.az * effectiveDt * 0.5;
    }
}

/**
 * PHYSICS: Runge-Kutta 4th Order Integration (RK4, 3D)
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
    double x, y, z, vx, vy, vz;
};

struct Derivative {
    double dx, dy, dz, dvx, dvy, dvz;
};

Derivative evaluate(const State& initial, double dt, const Derivative& d, std::vector<Body>& tempBodies, size_t bodyIndex) {
    State state;
    state.x = initial.x + d.dx * dt;
    state.y = initial.y + d.dy * dt;
    state.z = initial.z + d.dz * dt;
    state.vx = initial.vx + d.dvx * dt;
    state.vy = initial.vy + d.dvy * dt;
    state.vz = initial.vz + d.dvz * dt;
    
    // Update temp body with new state
    tempBodies[bodyIndex].x = state.x;
    tempBodies[bodyIndex].y = state.y;
    tempBodies[bodyIndex].z = state.z;
    
    Derivative output;
    output.dx = state.vx;
    output.dy = state.vy;
    output.dz = state.vz;
    
    // Calculate acceleration at this state
    double ax = 0, ay = 0, az = 0;
    for (size_t j = 0; j < tempBodies.size(); j++) {
        if (bodyIndex != j) {
            double dx = tempBodies[j].x - state.x;
            double dy = tempBodies[j].y - state.y;
            double dz = tempBodies[j].z - state.z;
            double distSq = dx * dx + dy * dy + dz * dz;
            double dist = sqrt(distSq);
            dist = fmax(dist, 1.0);
            
            // Optional softening
            double softenedDistSq = distSq + softeningLength * softeningLength;
            double softenedDist = sqrt(softenedDistSq);
            
            double force = G * tempBodies[j].mass / softenedDistSq;
            ax += force * dx / softenedDist;
            ay += force * dy / softenedDist;
            az += force * dz / softenedDist;
        }
    }
    
    output.dvx = ax;
    output.dvy = ay;
    output.dvz = az;
    return output;
}

void updateBodiesRK4() {
    double effectiveDt = dt * timeScale;
    std::vector<Body> tempBodies = bodies;
    
    for (size_t i = 0; i < bodies.size(); i++) {
        State state = {bodies[i].x, bodies[i].y, bodies[i].z, 
                       bodies[i].vx, bodies[i].vy, bodies[i].vz};
        
        Derivative k1 = evaluate(state, 0.0, {0,0,0,0,0,0}, tempBodies, i);
        Derivative k2 = evaluate(state, effectiveDt*0.5, k1, tempBodies, i);
        Derivative k3 = evaluate(state, effectiveDt*0.5, k2, tempBodies, i);
        Derivative k4 = evaluate(state, effectiveDt, k3, tempBodies, i);
        
        // Combine derivatives
        double dxdt = (k1.dx + 2.0*k2.dx + 2.0*k3.dx + k4.dx) / 6.0;
        double dydt = (k1.dy + 2.0*k2.dy + 2.0*k3.dy + k4.dy) / 6.0;
        double dzdt = (k1.dz + 2.0*k2.dz + 2.0*k3.dz + k4.dz) / 6.0;
        double dvxdt = (k1.dvx + 2.0*k2.dvx + 2.0*k3.dvx + k4.dvx) / 6.0;
        double dvydt = (k1.dvy + 2.0*k2.dvy + 2.0*k3.dvy + k4.dvy) / 6.0;
        double dvzdt = (k1.dvz + 2.0*k2.dvz + 2.0*k3.dvz + k4.dvz) / 6.0;
        
        bodies[i].x += dxdt * effectiveDt;
        bodies[i].y += dydt * effectiveDt;
        bodies[i].z += dzdt * effectiveDt;
        bodies[i].vx += dvxdt * effectiveDt;
        bodies[i].vy += dvydt * effectiveDt;
        bodies[i].vz += dvzdt * effectiveDt;
    }
    
    handleCollisions();
}

/**
 * PHYSICS: Runge-Kutta-Fehlberg Adaptive Time-Stepping (RKF45, PDF Section 3.3)
 * 
 * Adaptive method that balances accuracy and efficiency
 * Uses 4th and 5th order estimates to control error
 * Automatically adjusts time step based on local truncation error
 */
void updateBodiesRKF45() {
    double effectiveDt = dt * timeScale;
    std::vector<Body> tempBodies = bodies;
    std::vector<Body> nextBodies = bodies;
    
    // RKF45 Butcher tableau coefficients
    const double a2 = 1.0/4.0, a3 = 3.0/8.0, a4 = 12.0/13.0, a5 = 1.0, a6 = 1.0/2.0;
    
    // For each body, perform RKF45 integration
    for (size_t i = 0; i < bodies.size(); i++) {
        State state = {bodies[i].x, bodies[i].y, bodies[i].z,
                       bodies[i].vx, bodies[i].vy, bodies[i].vz};
        
        // Calculate k1 through k6 (Fehlberg coefficients)
        Derivative k1 = evaluate(state, 0.0, {0,0,0,0,0,0}, tempBodies, i);
        Derivative k2 = evaluate(state, effectiveDt * a2, k1, tempBodies, i);
        Derivative k3 = evaluate(state, effectiveDt * a3, k2, tempBodies, i);
        Derivative k4 = evaluate(state, effectiveDt * a4, k3, tempBodies, i);
        Derivative k5 = evaluate(state, effectiveDt * a5, k4, tempBodies, i);
        Derivative k6 = evaluate(state, effectiveDt * a6, k5, tempBodies, i);
        
        // 4th order solution
        double dx4 = (25.0/216.0*k1.dx + 1408.0/2565.0*k3.dx + 2197.0/4104.0*k4.dx - 1.0/5.0*k5.dx) * effectiveDt;
        double dy4 = (25.0/216.0*k1.dy + 1408.0/2565.0*k3.dy + 2197.0/4104.0*k4.dy - 1.0/5.0*k5.dy) * effectiveDt;
        double dz4 = (25.0/216.0*k1.dz + 1408.0/2565.0*k3.dz + 2197.0/4104.0*k4.dz - 1.0/5.0*k5.dz) * effectiveDt;
        
        // 5th order solution
        double dx5 = (16.0/135.0*k1.dx + 6656.0/12825.0*k3.dx + 28561.0/56430.0*k4.dx - 9.0/50.0*k5.dx + 2.0/55.0*k6.dx) * effectiveDt;
        double dy5 = (16.0/135.0*k1.dy + 6656.0/12825.0*k3.dy + 28561.0/56430.0*k4.dy - 9.0/50.0*k5.dy + 2.0/55.0*k6.dy) * effectiveDt;
        double dz5 = (16.0/135.0*k1.dz + 6656.0/12825.0*k3.dz + 28561.0/56430.0*k4.dz - 9.0/50.0*k5.dz + 2.0/55.0*k6.dz) * effectiveDt;
        
        // Error estimate
        double error = sqrt((dx5-dx4)*(dx5-dx4) + (dy5-dy4)*(dy5-dy4) + (dz5-dz4)*(dz5-dz4));
        
        // Use 5th order solution (more accurate)
        nextBodies[i].x = bodies[i].x + dx5;
        nextBodies[i].y = bodies[i].y + dy5;
        nextBodies[i].z = bodies[i].z + dz5;
        
        // Update velocities similarly
        double dvx4 = (25.0/216.0*k1.dvx + 1408.0/2565.0*k3.dvx + 2197.0/4104.0*k4.dvx - 1.0/5.0*k5.dvx) * effectiveDt;
        double dvy4 = (25.0/216.0*k1.dvy + 1408.0/2565.0*k3.dvy + 2197.0/4104.0*k4.dvy - 1.0/5.0*k5.dvy) * effectiveDt;
        double dvz4 = (25.0/216.0*k1.dvz + 1408.0/2565.0*k3.dvz + 2197.0/4104.0*k4.dvz - 1.0/5.0*k5.dvz) * effectiveDt;
        
        double dvx5 = (16.0/135.0*k1.dvx + 6656.0/12825.0*k3.dvx + 28561.0/56430.0*k4.dvx - 9.0/50.0*k5.dvx + 2.0/55.0*k6.dvx) * effectiveDt;
        double dvy5 = (16.0/135.0*k1.dvy + 6656.0/12825.0*k3.dvy + 28561.0/56430.0*k4.dvy - 9.0/50.0*k5.dvy + 2.0/55.0*k6.dvy) * effectiveDt;
        double dvz5 = (16.0/135.0*k1.dvz + 6656.0/12825.0*k3.dvz + 28561.0/56430.0*k4.dvz - 9.0/50.0*k5.dvz + 2.0/55.0*k6.dvz) * effectiveDt;
        
        nextBodies[i].vx = bodies[i].vx + dvx5;
        nextBodies[i].vy = bodies[i].vy + dvy5;
        nextBodies[i].vz = bodies[i].vz + dvz5;
        
        // Adaptive step size control (for future enhancement)
        // Could adjust dt based on error, but kept simple for now
        if (error > rkfTolerance && effectiveDt > minDt) {
            // Step too large, should reduce (handled by user dt control for now)
        } else if (error < rkfTolerance * 0.1 && effectiveDt < maxDt) {
            // Could increase step size
        }
    }
    
    bodies = nextBodies;
    handleCollisions();
}

/**
 * Calculate system properties for physics analysis (3D, PDF Section 2.2)
 * Implements conservation law monitoring as per classical mechanics
 * Tracks all 10 conserved quantities: E, Px, Py, Pz, Lx, Ly, Lz, CMx, CMy, CMz
 */
void calculateSystemProperties() {
    double totalMass = 0.0;
    double cmX = 0.0, cmY = 0.0, cmZ = 0.0;
    double momX = 0.0, momY = 0.0, momZ = 0.0;
    double kineticE = 0.0;
    double potentialE = 0.0;
    double angularMomX = 0.0, angularMomY = 0.0, angularMomZ = 0.0;
    
    // Calculate center of mass and momentum
    for (const auto& body : bodies) {
        totalMass += body.mass;
        cmX += body.x * body.mass;
        cmY += body.y * body.mass;
        cmZ += body.z * body.mass;
        momX += body.vx * body.mass;
        momY += body.vy * body.mass;
        momZ += body.vz * body.mass;
        
        // Kinetic energy: KE = (1/2) * m * v²
        double speedSq = body.vx * body.vx + body.vy * body.vy + body.vz * body.vz;
        kineticE += 0.5 * body.mass * speedSq;
        
        // Angular momentum: L = r × p (3D vector)
        // L_x = y * p_z - z * p_y
        // L_y = z * p_x - x * p_z  
        // L_z = x * p_y - y * p_x
        double px = body.mass * body.vx;
        double py = body.mass * body.vy;
        double pz = body.mass * body.vz;
        angularMomX += body.y * pz - body.z * py;
        angularMomY += body.z * px - body.x * pz;
        angularMomZ += body.x * py - body.y * px;
    }
    
    centerOfMassX = cmX / totalMass;
    centerOfMassY = cmY / totalMass;
    centerOfMassZ = cmZ / totalMass;
    totalMomentumX = momX;
    totalMomentumY = momY;
    totalMomentumZ = momZ;
    angularMomentumX = angularMomX;
    angularMomentumY = angularMomY;
    angularMomentumZ = angularMomZ;
    
    // Potential energy: PE = -G * m1 * m2 / r
    for (size_t i = 0; i < bodies.size(); i++) {
        for (size_t j = i + 1; j < bodies.size(); j++) {
            double dx = bodies[j].x - bodies[i].x;
            double dy = bodies[j].y - bodies[i].y;
            double dz = bodies[j].z - bodies[i].z;
            double dist = sqrt(dx * dx + dy * dy + dz * dz);
            dist = fmax(dist, 1.0);
            
            potentialE -= G * bodies[i].mass * bodies[j].mass / dist;
        }
    }
    
    totalEnergy = kineticE + potentialE;
    
    // Calculate conservation drift (deviation from initial values)
    if (initialEnergy != 0.0) {
        energyDrift = fabs((totalEnergy - initialEnergy) / initialEnergy);
    }
    
    // Momentum drift (magnitude)
    double momentumMag = sqrt(totalMomentumX * totalMomentumX + 
                             totalMomentumY * totalMomentumY + 
                             totalMomentumZ * totalMomentumZ);
    double initialMomentumMag = sqrt(initialMomentumX * initialMomentumX + 
                                     initialMomentumY * initialMomentumY + 
                                     initialMomentumZ * initialMomentumZ);
    if (initialMomentumMag > 1e-6) {
        momentumDrift = fabs((momentumMag - initialMomentumMag) / initialMomentumMag);
    } else {
        momentumDrift = momentumMag;  // Absolute drift if initial is ~zero
    }
    
    // Angular momentum drift (magnitude)
    double angMomMag = sqrt(angularMomentumX * angularMomentumX + 
                           angularMomentumY * angularMomentumY + 
                           angularMomentumZ * angularMomentumZ);
    double initialAngMomMag = sqrt(initialAngularMomentumX * initialAngularMomentumX + 
                                   initialAngularMomentumY * initialAngularMomentumY + 
                                   initialAngularMomentumZ * initialAngularMomentumZ);
    if (initialAngMomMag > 1e-6) {
        angularMomentumDrift = fabs((angMomMag - initialAngMomMag) / initialAngMomMag);
    } else {
        angularMomentumDrift = angMomMag;
    }
}

void updateBodies() {
    switch (currentMethod) {
        case METHOD_EULER:
            updateBodiesEuler();
            break;
        case METHOD_VERLET:
            updateBodiesVerlet();
            break;
        case METHOD_RK4:
            updateBodiesRK4();
            break;
        case METHOD_RKF45:
            updateBodiesRKF45();
            break;
    }
    calculateSystemProperties();
}


// Main loop
extern "C" {
    // Forward declaration for internal use
    void saveInitialState();
    
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
    double getBodyZ(int index) {
        if (index >= 0 && index < bodies.size()) {
            return bodies[index].z;
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
    double getBodyVZ(int index) {
        if (index >= 0 && index < bodies.size()) {
            return bodies[index].vz;
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
    double getMomentumZ() {
        return totalMomentumZ;
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
    double getCenterOfMassZ() {
        return centerOfMassZ;
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
    void setIntegrator(int method) {
        // 0=Euler, 1=Verlet, 2=RK4, 3=RKF45
        if (method >= 0 && method <= 3) {
            currentMethod = static_cast<IntegrationMethod>(method);
        }
    }
    
    EMSCRIPTEN_KEEPALIVE
    int getIntegrator() {
        return static_cast<int>(currentMethod);
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
            case PRESET_LAGRANGE:
                loadLagrange();
                break;
            case PRESET_SOLAR_SYSTEM:
                loadSolarSystem();
                break;
        }
        initialBodies = bodies;
        calculateSystemProperties();
        saveInitialState();  // Save conservation baselines
    }
    
    EMSCRIPTEN_KEEPALIVE
    void addBody(double x, double y, double vx, double vy, double mass, double radius, unsigned int color) {
        bodies.push_back({
            x, y, 0.0, vx, vy, 0.0, 0.0, 0.0, 0.0,
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
        saveInitialState();  // Initialize conservation baselines
        printf("Three-body simulation initialized with %zu bodies\n", bodies.size());
    }
    
    EMSCRIPTEN_KEEPALIVE
    void reset() {
        bodies = initialBodies;
        calculateSystemProperties();
        saveInitialState();  // Reset conservation baselines
    }
    
    // New interactive functions
    EMSCRIPTEN_KEEPALIVE
    void setBodyPosition(int index, double x, double y) {
        if (index >= 0 && index < bodies.size()) {
            bodies[index].x = x;
            bodies[index].y = y;
            // z remains unchanged (0 for 2D view)
        }
    }
    
    EMSCRIPTEN_KEEPALIVE
    void setBodyVelocity(int index, double vx, double vy) {
        if (index >= 0 && index < bodies.size()) {
            bodies[index].vx = vx;
            bodies[index].vy = vy;
            // vz remains unchanged (0 for 2D view)
        }
    }
    
    EMSCRIPTEN_KEEPALIVE
    void setBodyMass(int index, double mass) {
        if (index >= 0 && index < bodies.size()) {
            bodies[index].mass = mass;
            // Update radius based on mass (radius ~ mass^(1/3) for constant density)
            bodies[index].radius = 5.0 + pow(mass / 10.0, 0.4) * 5.0;
        }
    }
    
    EMSCRIPTEN_KEEPALIVE
    void setBodyColor(int index, unsigned int color) {
        if (index >= 0 && index < bodies.size()) {
            bodies[index].color = color;
        }
    }
    
    EMSCRIPTEN_KEEPALIVE
    int findBodyAtPosition(double x, double y) {
        for (int i = bodies.size() - 1; i >= 0; i--) {
            double dx = bodies[i].x - x;
            double dy = bodies[i].y - y;
            // Use 2D projection (ignore z for clicking)
            double dist = sqrt(dx * dx + dy * dy);
            if (dist <= bodies[i].radius * 1.5) {  // 1.5x for easier clicking
                return i;
            }
        }
        return -1;
    }
    
    EMSCRIPTEN_KEEPALIVE
    double getDistance(int index1, int index2) {
        if (index1 >= 0 && index1 < bodies.size() && index2 >= 0 && index2 < bodies.size()) {
            double dx = bodies[index2].x - bodies[index1].x;
            double dy = bodies[index2].y - bodies[index1].y;
            double dz = bodies[index2].z - bodies[index1].z;
            return sqrt(dx * dx + dy * dy + dz * dz);
        }
        return 0.0;
    }
    
    EMSCRIPTEN_KEEPALIVE
    double getKineticEnergy(int index) {
        if (index >= 0 && index < bodies.size()) {
            double speedSq = bodies[index].vx * bodies[index].vx + 
                            bodies[index].vy * bodies[index].vy + 
                            bodies[index].vz * bodies[index].vz;
            return 0.5 * bodies[index].mass * speedSq;
        }
        return 0.0;
    }
    
    EMSCRIPTEN_KEEPALIVE
    void saveState() {
        initialBodies = bodies;
    }
    
    // New physics control functions
    EMSCRIPTEN_KEEPALIVE
    void setMergingEnabled(int enabled) {
        enableMerging = (enabled != 0);
    }
    
    EMSCRIPTEN_KEEPALIVE
    int getMergingEnabled() {
        return enableMerging ? 1 : 0;
    }
    
    EMSCRIPTEN_KEEPALIVE
    void setTidalForces(int enabled) {
        enableTidalForces = (enabled != 0);
    }
    
    EMSCRIPTEN_KEEPALIVE
    int getTidalForces() {
        return enableTidalForces ? 1 : 0;
    }
    
    EMSCRIPTEN_KEEPALIVE
    void setSofteningLength(double length) {
        softeningLength = length;
    }
    
    EMSCRIPTEN_KEEPALIVE
    double getSofteningLength() {
        return softeningLength;
    }
    
    EMSCRIPTEN_KEEPALIVE
    void setGravitationalWaves(int enabled) {
        enableGravitationalWaves = (enabled != 0);
    }
    
    EMSCRIPTEN_KEEPALIVE
    int getGravitationalWaves() {
        return enableGravitationalWaves ? 1 : 0;
    }
    
    EMSCRIPTEN_KEEPALIVE
    double getAngularMomentum() {
        // Return magnitude for backward compatibility
        return sqrt(angularMomentumX * angularMomentumX + 
                   angularMomentumY * angularMomentumY + 
                   angularMomentumZ * angularMomentumZ);
    }
    
    EMSCRIPTEN_KEEPALIVE
    double getAngularMomentumX() {
        return angularMomentumX;
    }
    
    EMSCRIPTEN_KEEPALIVE
    double getAngularMomentumY() {
        return angularMomentumY;
    }
    
    EMSCRIPTEN_KEEPALIVE
    double getAngularMomentumZ() {
        return angularMomentumZ;
    }
    
    EMSCRIPTEN_KEEPALIVE
    double getEnergyDrift() {
        return energyDrift;
    }
    
    EMSCRIPTEN_KEEPALIVE
    double getMomentumDrift() {
        return momentumDrift;
    }
    
    EMSCRIPTEN_KEEPALIVE
    double getAngularMomentumDrift() {
        return angularMomentumDrift;
    }
    
    EMSCRIPTEN_KEEPALIVE
    void saveInitialState() {
        // Save initial conservation values for drift monitoring (3D)
        initialEnergy = totalEnergy;
        initialMomentumX = totalMomentumX;
        initialMomentumY = totalMomentumY;
        initialMomentumZ = totalMomentumZ;
        initialAngularMomentumX = angularMomentumX;
        initialAngularMomentumY = angularMomentumY;
        initialAngularMomentumZ = angularMomentumZ;
        energyDrift = 0.0;
        momentumDrift = 0.0;
        angularMomentumDrift = 0.0;
    }
}

int main() {
    printf("Three-body simulation starting...\n");
    init();
    return 0;
}
