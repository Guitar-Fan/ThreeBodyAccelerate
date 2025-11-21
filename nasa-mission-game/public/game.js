// NASA Asteroid Defense - Main Game Engine
import { Renderer } from './renderer.js';
import { TelemetryDashboard } from './telemetry.js';
import { UIController } from './ui-controller.js';
import { PhysicsBridge } from './physics-bridge.js';

class NASAMissionGame {
    constructor() {
        this.state = {
            phase: 'PLANNING', // PLANNING, LAUNCH_WINDOW, DEPLOYED, TRAJECTORY_CORRECTION, FINAL_APPROACH, COMPLETED
            difficulty: 'medium',
            scenario: null,
            missionTime: 0,
            timeToImpact: 90 * 86400, // seconds
            score: 0,
            multiplier: 1.0,
            spacecraft: {
                deployed: false,
                position: { x: 0, y: 0, z: 0 },
                velocity: { x: 0, y: 0, z: 0 },
                mass: 500,
                fuel: 100,
                deltaVRemaining: 3500,
                strategy: 'kinetic'
            },
            asteroid: {
                position: { x: 0, y: 0, z: 0 },
                velocity: { x: 0, y: 0, z: 0 },
                mass: 5e12,
                size: 500
            },
            earth: {
                position: { x: 0, y: 0, z: 0 },
                velocity: { x: 0, y: 0, z: 0 },
                mass: 5.972e24
            },
            moon: {
                position: { x: 384400000, y: 0, z: 0 },
                velocity: { x: 0, y: 1022, z: 0 },
                mass: 7.342e22
            },
            missDistance: null,
            closestApproach: Infinity,
            correctionsUsed: 0,
            achievements: [],
            deploymentTime: null
        };

        this.config = null;
        this.renderer = null;
        this.telemetry = null;
        this.ui = null;
        this.physics = null;
        this.lastUpdate = performance.now();
        this.isPaused = false;
        this.animationFrame = null;
    }

    async init() {
        console.log('🚀 Initializing NASA Mission Game...');
        
        // Load configuration
        await this.loadConfig();
        
        // Initialize subsystems
        this.physics = new PhysicsBridge();
        await this.physics.init();
        
        this.renderer = new Renderer(document.getElementById('viewport'));
        await this.renderer.init();
        
        this.telemetry = new TelemetryDashboard();
        this.telemetry.init();
        
        this.ui = new UIController(this);
        this.ui.init();
        
        // Setup mission
        this.setupMission();
        
        // Start game loop
        this.startGameLoop();
        
        console.log('✓ Mission Control Ready');
    }

    async loadConfig() {
        const response = await fetch('/mission-config.json');
        this.config = await response.json();
        console.log('✓ Mission configuration loaded');
    }

    setupMission() {
        // Get difficulty settings
        const difficulty = this.config.difficulties[this.state.difficulty];
        
        // Setup scenario
        this.state.scenario = this.config.scenarios[0];
        this.state.timeToImpact = difficulty.timeToImpact * 86400;
        
        // Initialize asteroid
        this.state.asteroid.mass = difficulty.asteroidMass;
        this.state.asteroid.velocity.x = difficulty.asteroidVelocity;
        
        // Position asteroid at distance
        const distance = difficulty.asteroidVelocity * difficulty.timeToImpact;
        this.state.asteroid.position.x = distance;
        
        // Initialize spacecraft at Earth
        this.state.spacecraft.deltaVRemaining = difficulty.spacecraftDeltaV;
        
        // Setup physics simulation
        this.physics.setupBodies({
            earth: this.state.earth,
            moon: this.state.moon,
            asteroid: this.state.asteroid,
            spacecraft: this.state.spacecraft
        });
        
        // Update UI
        this.ui.updateMissionBriefing(this.state.scenario, difficulty);
        this.ui.logEvent('Mission initialized', 0);
        
        console.log(`Mission setup complete: ${difficulty.name} difficulty`);
    }

    startGameLoop() {
        const loop = (timestamp) => {
            if (!this.isPaused) {
                const deltaTime = (timestamp - this.lastUpdate) / 1000; // seconds
                this.lastUpdate = timestamp;
                
                this.update(deltaTime);
                this.render();
            }
            
            this.animationFrame = requestAnimationFrame(loop);
        };
        
        this.animationFrame = requestAnimationFrame(loop);
    }

    update(deltaTime) {
        // Time scaling for faster simulation
        const difficulty = this.config.difficulties[this.state.difficulty];
        const scaledDelta = deltaTime * difficulty.timeScale;
        
        this.state.missionTime += scaledDelta;
        this.state.timeToImpact -= scaledDelta;
        
        // Update physics
        if (this.state.spacecraft.deployed) {
            const physicsState = this.physics.update(scaledDelta);
            
            // Update positions from physics
            this.state.earth.position = physicsState.earth.position;
            this.state.moon.position = physicsState.moon.position;
            this.state.asteroid.position = physicsState.asteroid.position;
            this.state.spacecraft.position = physicsState.spacecraft.position;
            
            this.state.earth.velocity = physicsState.earth.velocity;
            this.state.moon.velocity = physicsState.moon.velocity;
            this.state.asteroid.velocity = physicsState.asteroid.velocity;
            this.state.spacecraft.velocity = physicsState.spacecraft.velocity;
            
            // Calculate closest approach
            const distance = this.calculateDistance(
                this.state.asteroid.position,
                this.state.earth.position
            );
            
            if (distance < this.state.closestApproach) {
                this.state.closestApproach = distance;
            }
            
            // Update mission phase
            this.updateMissionPhase();
            
            // Check win/lose conditions
            this.checkMissionStatus();
        }
        
        // Update UI elements
        this.ui.updateTimers(this.state.missionTime, this.state.timeToImpact);
        this.ui.updateStatusBar(this.state);
        
        // Update telemetry
        if (this.state.spacecraft.deployed) {
            this.telemetry.update(this.state);
        }
        
        // Calculate and update score
        this.updateScore();
    }

    render() {
        this.renderer.render(this.state);
    }

    updateMissionPhase() {
        const timeElapsed = this.state.missionTime / (this.config.difficulties[this.state.difficulty].timeToImpact * 86400);
        
        if (!this.state.spacecraft.deployed) {
            this.state.phase = timeElapsed < 0.2 ? 'PLANNING' : 'LAUNCH_WINDOW';
        } else if (timeElapsed < 0.6) {
            this.state.phase = 'DEPLOYED';
        } else if (timeElapsed < 0.9) {
            this.state.phase = 'FINAL_APPROACH';
        }
        
        this.ui.updatePhase(this.state.phase);
    }

    checkMissionStatus() {
        const earthRadius = this.config.physicsConstants.earthRadius;
        const safeDistance = this.config.physicsConstants.safeDistance;
        
        // Check if time is up
        if (this.state.timeToImpact <= 0) {
            if (this.state.closestApproach > safeDistance) {
                this.missionSuccess();
            } else {
                this.missionFailure('TIME_UP');
            }
            return;
        }
        
        // Check for Earth impact
        const distanceToEarth = this.calculateDistance(
            this.state.asteroid.position,
            this.state.earth.position
        );
        
        if (distanceToEarth < earthRadius + this.state.asteroid.size) {
            this.missionFailure('IMPACT');
        }
    }

    calculateDistance(pos1, pos2) {
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        const dz = pos1.z - pos2.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    updateScore() {
        if (!this.state.spacecraft.deployed) return;
        
        const config = this.config.scoring;
        let score = 0;
        
        // Miss distance score (exponential)
        if (this.state.closestApproach < Infinity) {
            const safeDistance = config.missDistanceThresholds.safe;
            const ratio = this.state.closestApproach / safeDistance;
            
            if (ratio >= 2) {
                const normalizedRatio = (ratio - 2) / (10 - 2);
                score = config.missDistanceFormula.baseScore + 
                       (config.missDistanceFormula.maxScore - config.missDistanceFormula.baseScore) * 
                       Math.min(normalizedRatio, 1);
            }
        }
        
        // Delta-V efficiency bonus
        const fuelRemaining = this.state.spacecraft.deltaVRemaining / 
                             this.config.difficulties[this.state.difficulty].spacecraftDeltaV;
        score += fuelRemaining * config.deltaVEfficiency.maxBonus;
        
        // Time efficiency multiplier
        const timeRemaining = this.state.timeToImpact / 
                             (this.config.difficulties[this.state.difficulty].timeToImpact * 86400);
        const timeMult = 1.0 + timeRemaining;
        
        // Apply difficulty multiplier
        const difficultyMult = this.config.difficulties[this.state.difficulty].scoringMultiplier;
        
        this.state.score = Math.floor(score * timeMult * difficultyMult);
        this.state.multiplier = timeMult * difficultyMult;
        
        this.ui.updateScore(this.state.score, this.state.multiplier);
    }

    deploySpacecraft(velocity, angle, strategy) {
        if (this.state.spacecraft.deployed) return;
        
        console.log(`🚀 Deploying spacecraft: ${velocity} km/s at ${angle}°`);
        
        // Record deployment time
        this.state.deploymentTime = this.state.missionTime;
        
        // Convert angle to radians
        const angleRad = (angle * Math.PI) / 180;
        
        // Set initial velocity
        this.state.spacecraft.velocity = {
            x: velocity * 1000 * Math.cos(angleRad), // km/s to m/s
            y: velocity * 1000 * Math.sin(angleRad),
            z: 0
        };
        
        this.state.spacecraft.strategy = strategy;
        this.state.spacecraft.deployed = true;
        
        // Calculate delta-V used
        const deltaVUsed = velocity;
        this.state.spacecraft.deltaVRemaining -= deltaVUsed;
        this.state.spacecraft.fuel = (this.state.spacecraft.deltaVRemaining / 
                                     this.config.difficulties[this.state.difficulty].spacecraftDeltaV) * 100;
        
        // Update physics
        this.physics.deploySpacecraft(this.state.spacecraft);
        
        // Log event
        this.ui.logEvent(`Spacecraft deployed: ${strategy} strategy`, this.state.missionTime);
        this.ui.disableDeployment();
        
        // Enable corrections if allowed
        const difficulty = this.config.difficulties[this.state.difficulty];
        if (difficulty.correctionsAllowed > 0) {
            this.ui.enableCorrection();
        }
    }

    performCorrection(deltaV) {
        const difficulty = this.config.difficulties[this.state.difficulty];
        
        if (this.state.correctionsUsed >= difficulty.correctionsAllowed) {
            console.warn('No corrections remaining');
            return;
        }
        
        if (this.state.spacecraft.deltaVRemaining < deltaV) {
            console.warn('Insufficient delta-V');
            return;
        }
        
        // Apply correction
        this.state.spacecraft.deltaVRemaining -= deltaV;
        this.state.spacecraft.fuel = (this.state.spacecraft.deltaVRemaining / 
                                     difficulty.spacecraftDeltaV) * 100;
        this.state.correctionsUsed++;
        
        this.physics.applyCorrection(deltaV);
        this.ui.logEvent(`Mid-course correction: ${deltaV.toFixed(1)} m/s`, this.state.missionTime);
        
        if (this.state.correctionsUsed >= difficulty.correctionsAllowed) {
            this.ui.disableCorrection();
        }
    }

    missionSuccess() {
        this.state.phase = 'COMPLETED';
        this.isPaused = true;
        
        console.log('✓ MISSION SUCCESS!');
        
        // Check achievements
        this.checkAchievements(true);
        
        // Show result modal
        this.ui.showMissionResult(true, this.state);
    }

    missionFailure(reason) {
        this.state.phase = 'COMPLETED';
        this.isPaused = true;
        
        console.log(`✗ MISSION FAILED: ${reason}`);
        
        // Check achievements
        this.checkAchievements(false);
        
        // Show result modal
        this.ui.showMissionResult(false, this.state, reason);
    }

    checkAchievements(success) {
        const achievements = this.config.achievements;
        const difficulty = this.config.difficulties[this.state.difficulty];
        
        achievements.forEach(achievement => {
            if (this.state.achievements.includes(achievement.id)) return;
            
            let earned = false;
            
            switch (achievement.requirement) {
                case 'moonSlingshot':
                    // Check if spacecraft passed near moon
                    earned = this.physics.usedMoonGravity();
                    break;
                    
                case 'deltaVRemaining > 0.5':
                    earned = (this.state.spacecraft.deltaVRemaining / difficulty.spacecraftDeltaV) > 0.5;
                    break;
                    
                case 'timeRemaining < 0.05':
                    earned = (this.state.timeToImpact / (difficulty.timeToImpact * 86400)) < 0.05 && success;
                    break;
                    
                case 'score > 950':
                    earned = this.state.score > 950;
                    break;
                    
                case 'deployTime < 0.1':
                    earned = (this.state.deploymentTime / (difficulty.timeToImpact * 86400)) < 0.1;
                    break;
                    
                case 'corrections === 0':
                    earned = this.state.correctionsUsed === 0 && success;
                    break;
                    
                case "difficulty === 'expert' && success":
                    earned = this.state.difficulty === 'expert' && success;
                    break;
            }
            
            if (earned) {
                this.state.achievements.push(achievement.id);
                this.ui.unlockAchievement(achievement);
                this.state.score += achievement.points;
            }
        });
    }

    changeDifficulty(difficulty) {
        if (this.state.spacecraft.deployed) {
            console.warn('Cannot change difficulty during mission');
            return;
        }
        
        this.state.difficulty = difficulty;
        this.setupMission();
    }

    reset() {
        // Stop current game
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        
        // Reset state
        this.state = {
            phase: 'PLANNING',
            difficulty: this.state.difficulty,
            scenario: null,
            missionTime: 0,
            timeToImpact: 90 * 86400,
            score: 0,
            multiplier: 1.0,
            spacecraft: {
                deployed: false,
                position: { x: 0, y: 0, z: 0 },
                velocity: { x: 0, y: 0, z: 0 },
                mass: 500,
                fuel: 100,
                deltaVRemaining: 3500,
                strategy: 'kinetic'
            },
            asteroid: {
                position: { x: 0, y: 0, z: 0 },
                velocity: { x: 0, y: 0, z: 0 },
                mass: 5e12,
                size: 500
            },
            earth: {
                position: { x: 0, y: 0, z: 0 },
                velocity: { x: 0, y: 0, z: 0 },
                mass: 5.972e24
            },
            moon: {
                position: { x: 384400000, y: 0, z: 0 },
                velocity: { x: 0, y: 1022, z: 0 },
                mass: 7.342e22
            },
            missDistance: null,
            closestApproach: Infinity,
            correctionsUsed: 0,
            achievements: this.state.achievements, // Keep achievements
            deploymentTime: null
        };
        
        this.isPaused = false;
        this.lastUpdate = performance.now();
        
        // Restart
        this.setupMission();
        this.startGameLoop();
    }

    pause() {
        this.isPaused = true;
    }

    resume() {
        this.isPaused = false;
        this.lastUpdate = performance.now();
    }
}

// Initialize game when page loads
window.addEventListener('DOMContentLoaded', async () => {
    const game = new NASAMissionGame();
    await game.init();
    
    // Expose game instance for debugging
    window.game = game;
});

export { NASAMissionGame };
