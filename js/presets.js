/**
 * Presets for Three-Body Problem Simulation
 * Contains famous solutions and interesting configurations
 */

const Presets = {
    // Figure-Eight (Moore, 1993) - Periodic solution
    figureEight: {
        name: "Figure-Eight",
        description: "Moore's famous periodic orbit discovered in 1993",
        bodies: [
            {
                id: 'body1',
                mass: 1.0,
                x: 0.97000436,
                y: -0.24308753,
                vx: 0.466203685,
                vy: 0.43236573,
                radius: 8,
                color: '#ff6b6b',
                trail: []
            },
            {
                id: 'body2',
                mass: 1.0,
                x: -0.97000436,
                y: 0.24308753,
                vx: 0.466203685,
                vy: 0.43236573,
                radius: 8,
                color: '#4ecdc4',
                trail: []
            },
            {
                id: 'body3',
                mass: 1.0,
                x: 0,
                y: 0,
                vx: -0.93240737,
                vy: -0.86473146,
                radius: 8,
                color: '#ffd93d',
                trail: []
            }
        ],
        settings: {
            dt: 0.01,
            G: 1.0,
            softening: 0.01,
            integrator: 'verlet'
        }
    },

    // Lagrange Equilateral Triangle (L4/L5)
    lagrangeTriangle: {
        name: "Lagrange Triangle",
        description: "Three equal masses in rotating equilateral triangle",
        bodies: [
            {
                id: 'body1',
                mass: 1.0,
                x: 1.0,
                y: 0,
                vx: 0,
                vy: 0.5773503,
                radius: 8,
                color: '#ff6b6b',
                trail: []
            },
            {
                id: 'body2',
                mass: 1.0,
                x: -0.5,
                y: 0.8660254,
                vx: -0.5,
                vy: -0.28867513,
                radius: 8,
                color: '#4ecdc4',
                trail: []
            },
            {
                id: 'body3',
                mass: 1.0,
                x: -0.5,
                y: -0.8660254,
                vx: 0.5,
                vy: -0.28867513,
                radius: 8,
                color: '#ffd93d',
                trail: []
            }
        ],
        settings: {
            dt: 0.01,
            G: 1.0,
            softening: 0.01,
            integrator: 'verlet'
        }
    },

    // Binary with Satellite
    binaryPlanet: {
        name: "Binary + Planet",
        description: "Hierarchical system: binary pair with distant third body",
        bodies: [
            {
                id: 'star1',
                mass: 5.0,
                x: -0.5,
                y: 0,
                vx: 0,
                vy: -0.7,
                radius: 12,
                color: '#ff6b6b',
                trail: []
            },
            {
                id: 'star2',
                mass: 5.0,
                x: 0.5,
                y: 0,
                vx: 0,
                vy: 0.7,
                radius: 12,
                color: '#ffd93d',
                trail: []
            },
            {
                id: 'planet',
                mass: 0.1,
                x: 0,
                y: 3.0,
                vx: 1.2,
                vy: 0,
                radius: 5,
                color: '#4ecdc4',
                trail: []
            }
        ],
        settings: {
            dt: 0.01,
            G: 1.0,
            softening: 0.01,
            integrator: 'verlet'
        }
    },

    // Pythagorean Three-Body Problem
    pythagorean: {
        name: "Pythagorean",
        description: "3-4-5 mass ratio creating chaotic scattering",
        bodies: [
            {
                id: 'body1',
                mass: 3.0,
                x: 1.0,
                y: 3.0,
                vx: 0,
                vy: 0,
                radius: 10,
                color: '#ff6b6b',
                trail: []
            },
            {
                id: 'body2',
                mass: 4.0,
                x: -2.0,
                y: -1.0,
                vx: 0,
                vy: 0,
                radius: 11,
                color: '#4ecdc4',
                trail: []
            },
            {
                id: 'body3',
                mass: 5.0,
                x: 1.0,
                y: -1.0,
                vx: 0,
                vy: 0,
                radius: 12,
                color: '#ffd93d',
                trail: []
            }
        ],
        settings: {
            dt: 0.005,
            G: 1.0,
            softening: 0.05,
            integrator: 'verlet'
        }
    },

    // Butterfly I (Šuvakov and Dmitrašinović, 2013)
    butterfly: {
        name: "Butterfly I",
        description: "Periodic orbit resembling a butterfly",
        bodies: [
            {
                id: 'body1',
                mass: 1.0,
                x: 0.306893,
                y: 0.125507,
                vx: 0.080584,
                vy: 0.588836,
                radius: 8,
                color: '#ff6b6b',
                trail: []
            },
            {
                id: 'body2',
                mass: 1.0,
                x: -0.306893,
                y: -0.125507,
                vx: 0.080584,
                vy: 0.588836,
                radius: 8,
                color: '#4ecdc4',
                trail: []
            },
            {
                id: 'body3',
                mass: 1.0,
                x: 0,
                y: 0,
                vx: -0.161168,
                vy: -1.177672,
                radius: 8,
                color: '#ffd93d',
                trail: []
            }
        ],
        settings: {
            dt: 0.01,
            G: 1.0,
            softening: 0.01,
            integrator: 'verlet'
        }
    },

    // Broucke Orbit A1
    brouckeA1: {
        name: "Broucke A1",
        description: "Stable periodic orbit by Broucke",
        bodies: [
            {
                id: 'body1',
                mass: 1.0,
                x: 1.186,
                y: 0,
                vx: 0,
                vy: 0.5,
                radius: 8,
                color: '#ff6b6b',
                trail: []
            },
            {
                id: 'body2',
                mass: 1.0,
                x: -0.593,
                y: 1.027,
                vx: -0.433,
                vy: -0.25,
                radius: 8,
                color: '#4ecdc4',
                trail: []
            },
            {
                id: 'body3',
                mass: 1.0,
                x: -0.593,
                y: -1.027,
                vx: 0.433,
                vy: -0.25,
                radius: 8,
                color: '#ffd93d',
                trail: []
            }
        ],
        settings: {
            dt: 0.01,
            G: 1.0,
            softening: 0.01,
            integrator: 'verlet'
        }
    },

    // Sun-Earth-Moon (Simplified)
    sunEarthMoon: {
        name: "Sun-Earth-Moon",
        description: "Simplified model of our solar system",
        bodies: [
            {
                id: 'sun',
                mass: 100.0,
                x: 0,
                y: 0,
                vx: 0,
                vy: 0,
                radius: 15,
                color: '#ffd93d',
                trail: []
            },
            {
                id: 'earth',
                mass: 1.0,
                x: 5.0,
                y: 0,
                vx: 0,
                vy: 4.5,
                radius: 6,
                color: '#4ecdc4',
                trail: []
            },
            {
                id: 'moon',
                mass: 0.01,
                x: 5.3,
                y: 0,
                vx: 0,
                vy: 5.5,
                radius: 3,
                color: '#a0a0a0',
                trail: []
            }
        ],
        settings: {
            dt: 0.005,
            G: 1.0,
            softening: 0.02,
            integrator: 'verlet'
        }
    },

    // Chaotic Scattering
    chaoticScattering: {
        name: "Chaotic Scattering",
        description: "Three bodies on collision course - extreme sensitivity",
        bodies: [
            {
                id: 'body1',
                mass: 1.0,
                x: -3.0,
                y: 0,
                vx: 1.0,
                vy: 0.05,
                radius: 8,
                color: '#ff6b6b',
                trail: []
            },
            {
                id: 'body2',
                mass: 1.0,
                x: 0,
                y: 0,
                vx: 0,
                vy: 0,
                radius: 8,
                color: '#4ecdc4',
                trail: []
            },
            {
                id: 'body3',
                mass: 1.0,
                x: 3.0,
                y: 0,
                vx: -1.0,
                vy: -0.05,
                radius: 8,
                color: '#ffd93d',
                trail: []
            }
        ],
        settings: {
            dt: 0.005,
            G: 1.0,
            softening: 0.05,
            integrator: 'verlet'
        }
    },

    // Simple Circular
    simpleCircular: {
        name: "Simple Circular",
        description: "Three bodies in simple circular motion",
        bodies: [
            {
                id: 'body1',
                mass: 1.0,
                x: 0,
                y: 0,
                vx: 0,
                vy: 0,
                radius: 10,
                color: '#ffd93d',
                trail: []
            },
            {
                id: 'body2',
                mass: 0.5,
                x: 2.0,
                y: 0,
                vx: 0,
                vy: 0.7,
                radius: 6,
                color: '#ff6b6b',
                trail: []
            },
            {
                id: 'body3',
                mass: 0.5,
                x: -2.0,
                y: 0,
                vx: 0,
                vy: -0.7,
                radius: 6,
                color: '#4ecdc4',
                trail: []
            }
        ],
        settings: {
            dt: 0.01,
            G: 1.0,
            softening: 0.01,
            integrator: 'verlet'
        }
    },

    // Empty (for custom setup)
    custom: {
        name: "Custom Setup",
        description: "Start with a blank canvas",
        bodies: [],
        settings: {
            dt: 0.01,
            G: 1.0,
            softening: 0.01,
            integrator: 'verlet'
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Presets;
}
