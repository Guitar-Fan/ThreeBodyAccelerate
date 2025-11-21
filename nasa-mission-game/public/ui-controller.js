// UI Controller - GSAP animations and interface management
import { gsap } from 'gsap';

export class UIController {
    constructor(game) {
        this.game = game;
        this.elements = {};
        this.animations = {};
    }

    init() {
        this.cacheElements();
        this.setupEventListeners();
        this.setupAccordions();
        this.initializeAchievements();
        
        console.log('✓ UI Controller initialized');
    }

    cacheElements() {
        this.elements = {
            // Header
            phase: document.getElementById('mission-phase'),
            timer: document.getElementById('mission-timer'),
            score: document.getElementById('score-value'),
            multiplier: document.getElementById('multiplier'),
            
            // Status bar
            threatLevel: document.getElementById('threat-level'),
            timeToImpact: document.getElementById('time-to-impact'),
            missDistance: document.getElementById('miss-distance'),
            resourcesRemaining: document.getElementById('resources-remaining'),
            
            // Controls
            difficultySelect: document.getElementById('difficulty-select'),
            launchVelocity: document.getElementById('launch-velocity'),
            launchVelocityValue: document.getElementById('launch-velocity-value'),
            launchAngle: document.getElementById('launch-angle'),
            launchAngleValue: document.getElementById('launch-angle-value'),
            strategySelect: document.getElementById('strategy-select'),
            launchWindowIndicator: document.getElementById('launch-window-indicator'),
            windowStatus: document.getElementById('window-status'),
            deployBtn: document.getElementById('deploy-btn'),
            correctionBtn: document.getElementById('correction-btn'),
            
            // Spacecraft status
            fuelBar: document.getElementById('fuel-bar'),
            fuelValue: document.getElementById('fuel-value'),
            massValue: document.getElementById('mass-value'),
            positionValue: document.getElementById('position-value'),
            velocityValue: document.getElementById('velocity-value'),
            
            // Mission log
            missionLog: document.getElementById('mission-log'),
            briefingText: document.getElementById('briefing-text'),
            threatDescription: document.getElementById('threat-description'),
            
            // Modal
            missionModal: document.getElementById('mission-modal'),
            modalTitle: document.getElementById('modal-title'),
            modalBody: document.getElementById('modal-body'),
            modalRetry: document.getElementById('modal-retry'),
            modalMenu: document.getElementById('modal-menu'),
            
            // Achievements
            achievementsGrid: document.getElementById('achievements-grid')
        };
    }

    setupEventListeners() {
        // Difficulty selection
        this.elements.difficultySelect?.addEventListener('change', (e) => {
            this.game.changeDifficulty(e.target.value);
        });
        
        // Launch controls
        this.elements.launchVelocity?.addEventListener('input', (e) => {
            this.elements.launchVelocityValue.textContent = parseFloat(e.target.value).toFixed(1);
            this.updateLaunchWindow();
        });
        
        this.elements.launchAngle?.addEventListener('input', (e) => {
            this.elements.launchAngleValue.textContent = e.target.value;
            this.updateLaunchWindow();
        });
        
        // Deploy button
        this.elements.deployBtn?.addEventListener('click', () => {
            const velocity = parseFloat(this.elements.launchVelocity.value);
            const angle = parseFloat(this.elements.launchAngle.value);
            const strategy = this.elements.strategySelect.value;
            
            this.game.deploySpacecraft(velocity, angle, strategy);
            this.animateDeployment();
        });
        
        // Correction button
        this.elements.correctionBtn?.addEventListener('click', () => {
            const deltaV = 100; // Simple correction
            this.game.performCorrection(deltaV);
        });
        
        // Modal buttons
        this.elements.modalRetry?.addEventListener('click', () => {
            this.hideModal();
            this.game.reset();
        });
        
        this.elements.modalMenu?.addEventListener('click', () => {
            this.hideModal();
            location.reload();
        });
        
        // Panel collapse
        document.getElementById('collapse-telemetry')?.addEventListener('click', () => {
            this.togglePanel('telemetry-content');
        });
        
        document.getElementById('collapse-control')?.addEventListener('click', () => {
            this.togglePanel('control-content');
        });
    }

    setupAccordions() {
        const headers = document.querySelectorAll('.accordion-header');
        
        headers.forEach(header => {
            header.addEventListener('click', () => {
                const section = header.parentElement;
                const content = section.querySelector('.accordion-content');
                const icon = header.querySelector('.accordion-icon');
                
                const isActive = section.classList.contains('active');
                
                if (isActive) {
                    gsap.to(content, {
                        height: 0,
                        duration: 0.3,
                        ease: 'power2.inOut'
                    });
                    gsap.to(icon, {
                        rotation: -90,
                        duration: 0.3
                    });
                    section.classList.remove('active');
                } else {
                    gsap.set(content, { height: 'auto' });
                    const height = content.offsetHeight;
                    gsap.from(content, {
                        height: 0,
                        duration: 0.3,
                        ease: 'power2.inOut'
                    });
                    gsap.to(icon, {
                        rotation: 0,
                        duration: 0.3
                    });
                    section.classList.add('active');
                }
            });
        });
    }

    initializeAchievements() {
        if (!this.game.config) return;
        
        const grid = this.elements.achievementsGrid;
        if (!grid) return;
        
        grid.innerHTML = '';
        
        this.game.config.achievements.forEach(achievement => {
            const card = document.createElement('div');
            card.className = 'achievement-card locked';
            card.id = `achievement-${achievement.id}`;
            card.innerHTML = `
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-name">${achievement.name}</div>
                <div class="achievement-desc">${achievement.description}</div>
                <div class="achievement-points">+${achievement.points}</div>
            `;
            grid.appendChild(card);
        });
    }

    updateMissionBriefing(scenario, difficulty) {
        if (this.elements.threatDescription) {
            this.elements.threatDescription.innerHTML = `
                <p><strong>Threat:</strong> ${scenario.name}</p>
                <p>${scenario.description}</p>
                <p><strong>Asteroid Size:</strong> ${scenario.asteroidSize}m diameter</p>
                <p><strong>Impact Probability:</strong> ${(scenario.impactProbability * 100).toFixed(0)}%</p>
                <p><strong>Time to Impact:</strong> ${difficulty.timeToImpact} days</p>
                <p><strong>Available Delta-V:</strong> ${difficulty.spacecraftDeltaV} m/s</p>
                <p><strong>Mid-course Corrections:</strong> ${difficulty.correctionsAllowed}</p>
                <hr>
                <p class="scientific-note"><em>${scenario.scientificContext}</em></p>
            `;
        }
    }

    updateTimers(missionTime, timeToImpact) {
        // Mission timer
        const days = Math.floor(missionTime / 86400);
        const hours = Math.floor((missionTime % 86400) / 3600);
        const minutes = Math.floor((missionTime % 3600) / 60);
        
        if (this.elements.timer) {
            this.elements.timer.textContent = `T+${String(days).padStart(2, '0')}:${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        }
        
        // Time to impact
        const impactDays = Math.floor(timeToImpact / 86400);
        const impactHours = Math.floor((timeToImpact % 86400) / 3600);
        
        if (this.elements.timeToImpact) {
            if (impactDays > 0) {
                this.elements.timeToImpact.textContent = `${impactDays} days ${impactHours}h`;
            } else {
                this.elements.timeToImpact.textContent = `${impactHours}h ${Math.floor((timeToImpact % 3600) / 60)}m`;
            }
            
            // Pulse warning when time is low
            if (timeToImpact < 86400 && !this.animations.timeWarning) {
                this.animations.timeWarning = gsap.to(this.elements.timeToImpact, {
                    scale: 1.2,
                    color: '#FF0000',
                    repeat: -1,
                    yoyo: true,
                    duration: 0.5
                });
            }
        }
    }

    updatePhase(phase) {
        if (!this.elements.phase) return;
        
        this.elements.phase.textContent = phase;
        
        // Animate phase change
        gsap.fromTo(this.elements.phase,
            { scale: 1.2, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out' }
        );
    }

    updateScore(score, multiplier) {
        if (this.elements.score) {
            this.elements.score.textContent = score.toLocaleString();
        }
        if (this.elements.multiplier) {
            this.elements.multiplier.textContent = `×${multiplier.toFixed(1)}`;
        }
    }

    updateStatusBar(gameState) {
        // Threat level
        if (this.elements.threatLevel) {
            const distance = gameState.closestApproach;
            let level = 'CRITICAL';
            let color = '#FF0000';
            
            if (distance > 500000000) {
                level = 'LOW';
                color = '#00FF00';
            } else if (distance > 300000000) {
                level = 'MEDIUM';
                color = '#FFAA00';
            } else if (distance > 150000000) {
                level = 'HIGH';
                color = '#FF6600';
            }
            
            this.elements.threatLevel.textContent = level;
            this.elements.threatLevel.style.color = color;
        }
        
        // Miss distance
        if (this.elements.missDistance && gameState.closestApproach < Infinity) {
            this.elements.missDistance.textContent = `${(gameState.closestApproach / 1000000).toFixed(0)} Mm`;
        }
        
        // Resources remaining
        if (this.elements.resourcesRemaining) {
            this.elements.resourcesRemaining.textContent = `${gameState.spacecraft.fuel.toFixed(0)}%`;
        }
        
        // Spacecraft status
        if (this.elements.fuelBar) {
            gsap.to(this.elements.fuelBar, {
                width: `${gameState.spacecraft.fuel}%`,
                duration: 0.3
            });
        }
        
        if (this.elements.fuelValue) {
            this.elements.fuelValue.textContent = `${gameState.spacecraft.fuel.toFixed(0)}%`;
        }
        
        if (gameState.spacecraft.deployed) {
            const speed = Math.sqrt(
                gameState.spacecraft.velocity.x ** 2 +
                gameState.spacecraft.velocity.y ** 2 +
                gameState.spacecraft.velocity.z ** 2
            );
            
            if (this.elements.velocityValue) {
                this.elements.velocityValue.textContent = `${(speed / 1000).toFixed(2)} km/s`;
            }
            
            if (this.elements.positionValue) {
                const dist = Math.sqrt(
                    gameState.spacecraft.position.x ** 2 +
                    gameState.spacecraft.position.y ** 2 +
                    gameState.spacecraft.position.z ** 2
                );
                this.elements.positionValue.textContent = `${(dist / 1000000).toFixed(0)} Mm from Earth`;
            }
        }
    }

    updateLaunchWindow() {
        // Simple launch window calculation
        const velocity = parseFloat(this.elements.launchVelocity.value);
        const angle = parseFloat(this.elements.launchAngle.value);
        
        // Optimal window is around 11 km/s at 90 degrees
        const velocityScore = 1 - Math.abs(velocity - 11) / 11;
        const angleScore = 1 - Math.abs(angle - 90) / 90;
        const windowScore = (velocityScore + angleScore) / 2;
        
        let status = 'OPTIMAL';
        let color = '#00FF00';
        let width = 100;
        
        if (windowScore < 0.3) {
            status = 'POOR';
            color = '#FF0000';
            width = 30;
        } else if (windowScore < 0.6) {
            status = 'SUBOPTIMAL';
            color = '#FFAA00';
            width = 60;
        } else if (windowScore < 0.85) {
            status = 'GOOD';
            color = '#AAFF00';
            width = 80;
        }
        
        if (this.elements.windowStatus) {
            this.elements.windowStatus.textContent = status;
            this.elements.windowStatus.style.color = color;
        }
        
        if (this.elements.launchWindowIndicator) {
            gsap.to(this.elements.launchWindowIndicator, {
                width: `${width}%`,
                backgroundColor: color,
                duration: 0.3
            });
        }
    }

    logEvent(message, time) {
        if (!this.elements.missionLog) return;
        
        const days = Math.floor(time / 86400);
        const hours = Math.floor((time % 86400) / 3600);
        const minutes = Math.floor((time % 3600) / 60);
        
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.textContent = `T+${days}d ${hours}h ${minutes}m - ${message}`;
        
        this.elements.missionLog.prepend(entry);
        
        // Animate entry
        gsap.from(entry, {
            x: -20,
            opacity: 0,
            duration: 0.3
        });
        
        // Limit log entries
        const entries = this.elements.missionLog.children;
        if (entries.length > 10) {
            this.elements.missionLog.removeChild(entries[entries.length - 1]);
        }
    }

    disableDeployment() {
        if (this.elements.deployBtn) {
            this.elements.deployBtn.disabled = true;
            this.elements.deployBtn.textContent = 'DEPLOYED';
        }
        
        if (this.elements.launchVelocity) this.elements.launchVelocity.disabled = true;
        if (this.elements.launchAngle) this.elements.launchAngle.disabled = true;
        if (this.elements.strategySelect) this.elements.strategySelect.disabled = true;
    }

    enableCorrection() {
        if (this.elements.correctionBtn) {
            this.elements.correctionBtn.disabled = false;
        }
    }

    disableCorrection() {
        if (this.elements.correctionBtn) {
            this.elements.correctionBtn.disabled = true;
            this.elements.correctionBtn.textContent = 'NO CORRECTIONS LEFT';
        }
    }

    animateDeployment() {
        // Flash the deploy button
        gsap.timeline()
            .to(this.elements.deployBtn, {
                scale: 1.2,
                backgroundColor: '#00FF00',
                duration: 0.2
            })
            .to(this.elements.deployBtn, {
                scale: 1,
                duration: 0.2
            });
        
        // Pulse the spacecraft status panel
        const spacecraftSection = document.querySelector('[data-section="spacecraft"]');
        if (spacecraftSection) {
            gsap.to(spacecraftSection, {
                backgroundColor: 'rgba(0, 255, 0, 0.1)',
                duration: 0.5,
                yoyo: true,
                repeat: 1
            });
        }
    }

    unlockAchievement(achievement) {
        const card = document.getElementById(`achievement-${achievement.id}`);
        if (!card) return;
        
        card.classList.remove('locked');
        card.classList.add('unlocked');
        
        // Animate unlock
        gsap.timeline()
            .from(card, {
                scale: 0.5,
                rotation: -180,
                opacity: 0,
                duration: 0.5,
                ease: 'back.out'
            })
            .to(card, {
                boxShadow: '0 0 20px rgba(255, 215, 0, 0.8)',
                duration: 0.3,
                yoyo: true,
                repeat: 2
            });
        
        this.logEvent(`Achievement Unlocked: ${achievement.name} (+${achievement.points} pts)`, this.game.state.missionTime);
    }

    showMissionResult(success, gameState, reason = '') {
        if (!this.elements.missionModal) return;
        
        const modal = this.elements.missionModal;
        const title = this.elements.modalTitle;
        const body = this.elements.modalBody;
        
        if (success) {
            title.textContent = '🎉 MISSION SUCCESS';
            title.style.color = '#00FF00';
            
            body.innerHTML = `
                <p class="result-message">The asteroid has been successfully deflected!</p>
                <div class="result-stats">
                    <div class="stat-row">
                        <span>Final Score:</span>
                        <span class="stat-highlight">${gameState.score.toLocaleString()}</span>
                    </div>
                    <div class="stat-row">
                        <span>Miss Distance:</span>
                        <span>${(gameState.closestApproach / 1000000).toFixed(0)} Mm</span>
                    </div>
                    <div class="stat-row">
                        <span>Fuel Remaining:</span>
                        <span>${gameState.spacecraft.fuel.toFixed(0)}%</span>
                    </div>
                    <div class="stat-row">
                        <span>Corrections Used:</span>
                        <span>${gameState.correctionsUsed}</span>
                    </div>
                    <div class="stat-row">
                        <span>Achievements Earned:</span>
                        <span>${gameState.achievements.length}</span>
                    </div>
                </div>
                <p class="result-debrief">Your precise calculations and expert use of three-body dynamics saved Earth from catastrophic impact. The mission demonstrates the practical application of orbital mechanics in planetary defense.</p>
            `;
        } else {
            title.textContent = '⚠️ MISSION FAILED';
            title.style.color = '#FF0000';
            
            let failureMessage = 'The asteroid was not successfully deflected.';
            if (reason === 'IMPACT') {
                failureMessage = 'The asteroid impacted Earth!';
            } else if (reason === 'TIME_UP') {
                failureMessage = 'Time ran out before achieving safe deflection.';
            }
            
            body.innerHTML = `
                <p class="result-message">${failureMessage}</p>
                <div class="result-stats">
                    <div class="stat-row">
                        <span>Final Score:</span>
                        <span>${gameState.score.toLocaleString()}</span>
                    </div>
                    <div class="stat-row">
                        <span>Closest Approach:</span>
                        <span>${(gameState.closestApproach / 1000000).toFixed(0)} Mm</span>
                    </div>
                    <div class="stat-row">
                        <span>Required Distance:</span>
                        <span>150 Mm</span>
                    </div>
                </div>
                <p class="result-debrief">Analyze your trajectory and try again. Consider using the Moon's gravity for assistance, and optimize your launch window for better results.</p>
            `;
        }
        
        // Show modal with animation
        modal.style.display = 'flex';
        gsap.from(modal.querySelector('.modal-content'), {
            scale: 0.5,
            opacity: 0,
            duration: 0.5,
            ease: 'back.out'
        });
    }

    hideModal() {
        if (!this.elements.missionModal) return;
        
        gsap.to(this.elements.missionModal.querySelector('.modal-content'), {
            scale: 0.5,
            opacity: 0,
            duration: 0.3,
            onComplete: () => {
                this.elements.missionModal.style.display = 'none';
            }
        });
    }

    togglePanel(panelId) {
        const panel = document.getElementById(panelId);
        if (!panel) return;
        
        const isVisible = panel.style.display !== 'none';
        
        if (isVisible) {
            gsap.to(panel, {
                height: 0,
                opacity: 0,
                duration: 0.3,
                onComplete: () => {
                    panel.style.display = 'none';
                }
            });
        } else {
            panel.style.display = 'block';
            gsap.from(panel, {
                height: 0,
                opacity: 0,
                duration: 0.3
            });
        }
    }
}
