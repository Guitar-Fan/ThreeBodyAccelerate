// Telemetry Dashboard - Chart.js integration
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

export class TelemetryDashboard {
    constructor() {
        this.charts = {
            threat: null,
            deltaV: null,
            energy: null
        };
        
        this.data = {
            threat: { time: [], distance: [] },
            deltaV: { time: [], consumption: [] },
            energy: { time: [], transfer: [] }
        };
        
        this.maxDataPoints = 50;
    }

    init() {
        this.createThreatChart();
        this.createDeltaVChart();
        this.createEnergyChart();
        
        console.log('✓ Telemetry Dashboard initialized');
    }

    createThreatChart() {
        const ctx = document.getElementById('threat-chart');
        if (!ctx) return;
        
        this.charts.threat = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Distance to Earth (km)',
                    data: [],
                    borderColor: '#FF4444',
                    backgroundColor: 'rgba(255, 68, 68, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Mission Time (days)',
                            color: '#AAA'
                        },
                        ticks: { color: '#888' },
                        grid: { color: 'rgba(255,255,255,0.1)' }
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Distance (km)',
                            color: '#AAA'
                        },
                        ticks: { color: '#888' },
                        grid: { color: 'rgba(255,255,255,0.1)' }
                    }
                }
            }
        });
    }

    createDeltaVChart() {
        const ctx = document.getElementById('deltav-chart');
        if (!ctx) return;
        
        this.charts.deltaV = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Delta-V Remaining (m/s)',
                    data: [],
                    borderColor: '#44FF44',
                    backgroundColor: 'rgba(68, 255, 68, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Mission Time (days)',
                            color: '#AAA'
                        },
                        ticks: { color: '#888' },
                        grid: { color: 'rgba(255,255,255,0.1)' }
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Delta-V (m/s)',
                            color: '#AAA'
                        },
                        ticks: { color: '#888' },
                        grid: { color: 'rgba(255,255,255,0.1)' }
                    }
                }
            }
        });
    }

    createEnergyChart() {
        const ctx = document.getElementById('energy-chart');
        if (!ctx) return;
        
        this.charts.energy = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Kinetic', 'Potential', 'Total'],
                datasets: [{
                    label: 'Energy (GJ)',
                    data: [0, 0, 0],
                    backgroundColor: [
                        'rgba(255, 159, 64, 0.8)',
                        'rgba(54, 162, 235, 0.8)',
                        'rgba(153, 102, 255, 0.8)'
                    ],
                    borderColor: [
                        'rgb(255, 159, 64)',
                        'rgb(54, 162, 235)',
                        'rgb(153, 102, 255)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#888' },
                        grid: { color: 'rgba(255,255,255,0.1)' }
                    },
                    x: {
                        ticks: { color: '#888' },
                        grid: { color: 'rgba(255,255,255,0.1)' }
                    }
                }
            }
        });
    }

    update(gameState) {
        const missionDays = gameState.missionTime / 86400;
        
        // Update threat distance
        const distanceToEarth = this.calculateDistance(
            gameState.asteroid.position,
            gameState.earth.position
        ) / 1000; // Convert to km
        
        this.addDataPoint(this.data.threat, missionDays, distanceToEarth);
        this.updateChart(this.charts.threat, this.data.threat);
        
        // Update delta-V
        this.addDataPoint(this.data.deltaV, missionDays, gameState.spacecraft.deltaVRemaining);
        this.updateChart(this.charts.deltaV, this.data.deltaV);
        
        // Update energy
        const kineticEnergy = this.calculateKineticEnergy(gameState.spacecraft);
        const potentialEnergy = this.calculatePotentialEnergy(gameState);
        const totalEnergy = kineticEnergy + potentialEnergy;
        
        this.charts.energy.data.datasets[0].data = [
            kineticEnergy / 1e9, // Convert to GJ
            potentialEnergy / 1e9,
            totalEnergy / 1e9
        ];
        this.charts.energy.update('none');
        
        // Update stat values
        this.updateStats(gameState, distanceToEarth);
    }

    addDataPoint(dataSet, time, value) {
        dataSet.time.push(time.toFixed(2));
        dataSet.distance ? dataSet.distance.push(value) : dataSet.consumption ? dataSet.consumption.push(value) : null;
        
        // Limit data points
        if (dataSet.time.length > this.maxDataPoints) {
            dataSet.time.shift();
            if (dataSet.distance) dataSet.distance.shift();
            if (dataSet.consumption) dataSet.consumption.shift();
        }
    }

    updateChart(chart, dataSet) {
        if (!chart) return;
        
        chart.data.labels = dataSet.time;
        const dataset = dataSet.distance || dataSet.consumption || [];
        chart.data.datasets[0].data = dataset;
        chart.update('none'); // Skip animation for performance
    }

    updateStats(gameState, distanceToEarth) {
        // Current distance
        document.getElementById('current-distance').textContent = 
            `${(distanceToEarth / 1000).toFixed(0)} km`;
        
        // Relative velocity
        const relVelocity = this.calculateRelativeVelocity(
            gameState.spacecraft.velocity,
            gameState.asteroid.velocity
        );
        document.getElementById('relative-velocity').textContent = 
            `${(relVelocity / 1000).toFixed(2)} km/s`;
        
        // Closest approach
        if (gameState.closestApproach < Infinity) {
            document.getElementById('closest-approach').textContent = 
                `${(gameState.closestApproach / 1000).toFixed(0)} km`;
        }
    }

    calculateDistance(pos1, pos2) {
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        const dz = pos1.z - pos2.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    calculateRelativeVelocity(vel1, vel2) {
        const dvx = vel1.x - vel2.x;
        const dvy = vel1.y - vel2.y;
        const dvz = vel1.z - vel2.z;
        return Math.sqrt(dvx * dvx + dvy * dvy + dvz * dvz);
    }

    calculateKineticEnergy(body) {
        const v = Math.sqrt(
            body.velocity.x ** 2 +
            body.velocity.y ** 2 +
            body.velocity.z ** 2
        );
        return 0.5 * body.mass * v * v;
    }

    calculatePotentialEnergy(gameState) {
        const G = 6.67430e-11;
        const r = this.calculateDistance(
            gameState.spacecraft.position,
            gameState.earth.position
        );
        return -G * gameState.earth.mass * gameState.spacecraft.mass / r;
    }

    clear() {
        this.data.threat = { time: [], distance: [] };
        this.data.deltaV = { time: [], consumption: [] };
        this.data.energy = { time: [], transfer: [] };
        
        Object.values(this.charts).forEach(chart => {
            if (chart) {
                chart.data.labels = [];
                chart.data.datasets[0].data = [];
                chart.update();
            }
        });
    }
}
