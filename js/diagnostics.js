/**
 * Diagnostics Module
 * Handles energy graphs, phase space plots, and Poincaré sections
 */

class DiagnosticsPanel {
    constructor(energyCanvas, phaseCanvas) {
        this.energyCanvas = energyCanvas;
        this.phaseCanvas = phaseCanvas;
        this.energyCtx = energyCanvas.getContext('2d');
        this.phaseCtx = phaseCanvas.getContext('2d');
        
        this.energyHistory = [];
        this.maxEnergyHistory = 500;
        this.initialEnergy = null;
        
        this.phasePoints = [];
        this.poincarePoints = [];
        this.showPoincare = false;
        
        this.resize();
    }

    resize() {
        // Energy graph
        const eRect = this.energyCanvas.getBoundingClientRect();
        this.energyCanvas.width = eRect.width * window.devicePixelRatio;
        this.energyCanvas.height = eRect.height * window.devicePixelRatio;
        this.energyCtx.scale(window.devicePixelRatio, window.devicePixelRatio);
        
        // Phase space
        const pRect = this.phaseCanvas.getBoundingClientRect();
        this.phaseCanvas.width = pRect.width * window.devicePixelRatio;
        this.phaseCanvas.height = pRect.height * window.devicePixelRatio;
        this.phaseCtx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    updateEnergy(energy, time) {
        if (this.initialEnergy === null) {
            this.initialEnergy = energy;
        }
        
        this.energyHistory.push({ time, energy });
        
        if (this.energyHistory.length > this.maxEnergyHistory) {
            this.energyHistory.shift();
        }
    }

    updatePhaseSpace(bodies) {
        // Use first body for phase space (x vs vx)
        if (bodies.length > 0) {
            const body = bodies[0];
            this.phasePoints.push({ x: body.x, vx: body.vx, y: body.y, vy: body.vy });
            
            if (this.phasePoints.length > 1000) {
                this.phasePoints.shift();
            }
            
            // Poincaré section: record points when y crosses zero with vy > 0
            if (this.showPoincare && Math.abs(body.y) < 0.1 && body.vy > 0) {
                this.poincarePoints.push({ x: body.x, vx: body.vx });
                
                if (this.poincarePoints.length > 500) {
                    this.poincarePoints.shift();
                }
            }
        }
    }

    drawEnergyGraph() {
        const width = this.energyCanvas.clientWidth;
        const height = this.energyCanvas.clientHeight;
        const ctx = this.energyCtx;
        
        // Clear
        ctx.fillStyle = '#0a0e27';
        ctx.fillRect(0, 0, width, height);
        
        if (this.energyHistory.length < 2) return;
        
        // Find min/max energy
        let minE = Infinity, maxE = -Infinity;
        for (const point of this.energyHistory) {
            minE = Math.min(minE, point.energy);
            maxE = Math.max(maxE, point.energy);
        }
        
        const range = maxE - minE;
        const margin = range * 0.1;
        minE -= margin;
        maxE += margin;
        
        // Draw grid
        ctx.strokeStyle = 'rgba(100, 100, 150, 0.3)';
        ctx.lineWidth = 1;
        for (let i = 1; i < 4; i++) {
            const y = (height / 4) * i;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        
        // Draw initial energy line
        if (this.initialEnergy !== null && range > 0) {
            const y = height - ((this.initialEnergy - minE) / (maxE - minE)) * height;
            ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        
        // Draw energy curve
        ctx.strokeStyle = '#00d4ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        for (let i = 0; i < this.energyHistory.length; i++) {
            const x = (i / (this.maxEnergyHistory - 1)) * width;
            const y = height - ((this.energyHistory[i].energy - minE) / (maxE - minE)) * height;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.stroke();
        
        // Draw labels
        ctx.fillStyle = '#b8bcc8';
        ctx.font = '10px monospace';
        ctx.fillText(`E: ${maxE.toFixed(2)}`, 5, 12);
        ctx.fillText(`E: ${minE.toFixed(2)}`, 5, height - 2);
        
        // Energy drift percentage
        if (this.initialEnergy !== null && this.energyHistory.length > 0) {
            const currentEnergy = this.energyHistory[this.energyHistory.length - 1].energy;
            const drift = ((currentEnergy - this.initialEnergy) / Math.abs(this.initialEnergy)) * 100;
            const driftText = `ΔE: ${drift.toFixed(4)}%`;
            ctx.fillStyle = Math.abs(drift) > 1 ? '#ff4488' : '#00ff88';
            ctx.fillText(driftText, width - 80, 12);
        }
    }

    drawPhaseSpace() {
        const width = this.phaseCanvas.clientWidth;
        const height = this.phaseCanvas.clientHeight;
        const ctx = this.phaseCtx;
        
        // Clear
        ctx.fillStyle = '#0a0e27';
        ctx.fillRect(0, 0, width, height);
        
        if (this.phasePoints.length < 2) return;
        
        // Find bounds
        let minX = Infinity, maxX = -Infinity;
        let minVx = Infinity, maxVx = -Infinity;
        
        for (const point of this.phasePoints) {
            minX = Math.min(minX, point.x);
            maxX = Math.max(maxX, point.x);
            minVx = Math.min(minVx, point.vx);
            maxVx = Math.max(maxVx, point.vx);
        }
        
        const rangeX = maxX - minX || 1;
        const rangeVx = maxVx - minVx || 1;
        const marginX = rangeX * 0.1;
        const marginVx = rangeVx * 0.1;
        
        minX -= marginX;
        maxX += marginX;
        minVx -= marginVx;
        maxVx += marginVx;
        
        // Draw grid
        ctx.strokeStyle = 'rgba(100, 100, 150, 0.3)';
        ctx.lineWidth = 1;
        
        // Axes
        const zeroX = (-minX / (maxX - minX)) * width;
        const zeroY = height - ((-minVx / (maxVx - minVx)) * height);
        
        if (zeroX >= 0 && zeroX <= width) {
            ctx.beginPath();
            ctx.moveTo(zeroX, 0);
            ctx.lineTo(zeroX, height);
            ctx.stroke();
        }
        
        if (zeroY >= 0 && zeroY <= height) {
            ctx.beginPath();
            ctx.moveTo(0, zeroY);
            ctx.lineTo(width, zeroY);
            ctx.stroke();
        }
        
        // Draw phase trajectory
        if (!this.showPoincare) {
            ctx.strokeStyle = '#ff6b9d';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            
            for (let i = 0; i < this.phasePoints.length; i++) {
                const x = ((this.phasePoints[i].x - minX) / (maxX - minX)) * width;
                const y = height - ((this.phasePoints[i].vx - minVx) / (maxVx - minVx)) * height;
                
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            
            ctx.stroke();
        }
        
        // Draw Poincaré section points
        if (this.showPoincare && this.poincarePoints.length > 0) {
            ctx.fillStyle = '#00ff88';
            
            for (const point of this.poincarePoints) {
                const x = ((point.x - minX) / (maxX - minX)) * width;
                const y = height - ((point.vx - minVx) / (maxVx - minVx)) * height;
                
                ctx.beginPath();
                ctx.arc(x, y, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // Draw labels
        ctx.fillStyle = '#b8bcc8';
        ctx.font = '10px monospace';
        ctx.fillText('x', width - 15, height - 5);
        ctx.fillText('vx', 5, 12);
        
        if (this.showPoincare) {
            ctx.fillStyle = '#00ff88';
            ctx.fillText('Poincaré Section', 5, height - 5);
        }
    }

    render() {
        this.drawEnergyGraph();
        this.drawPhaseSpace();
    }

    reset() {
        this.energyHistory = [];
        this.phasePoints = [];
        this.poincarePoints = [];
        this.initialEnergy = null;
    }

    togglePoincare() {
        this.showPoincare = !this.showPoincare;
        if (!this.showPoincare) {
            this.poincarePoints = [];
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DiagnosticsPanel;
}
