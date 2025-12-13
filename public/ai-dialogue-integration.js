/**
 * AI Dialogue Integration for WebAssembly Three-Body Simulation
 * Integrates HackClub AI to generate space-related jokes and dialogue
 */

// AI Dialogue System Configuration
const AIDialogueConfig = {
    apiKey: localStorage.getItem('hackclub_ai_key') || '',
    baseURL: 'https://ai.hackclub.com/proxy/v1',
    model: 'qwen/qwen3-32b',
    enabled: false,
    cooldownMs: 10000, // 10 seconds between generations per body
    checkIntervalMs: 5000 // Check every 5 seconds for dialogue opportunities
};

// Body dialogue tracking
const bodyDialogues = new Map(); // body index -> {lastTime, history, element}
let dialogueCheckTimer = null;
let isGenerating = false;

/**
 * Initialize AI Dialogue System
 */
function initAIDialogue() {
    // Load saved API key
    const savedKey = localStorage.getItem('hackclub_ai_key');
    if (savedKey) {
        document.getElementById('ai-key-input').value = savedKey;
        AIDialogueConfig.apiKey = savedKey;
        updateAIStatus('ready');
    }
    
    // Setup event listeners
    document.getElementById('save-api-key').addEventListener('click', saveAPIKey);
    document.getElementById('enable-dialogue').addEventListener('change', toggleDialogue);
    document.getElementById('cooldown-slider').addEventListener('input', updateCooldown);
    document.getElementById('trigger-dialogue').addEventListener('click', triggerManualDialogue);
    document.getElementById('view-history').addEventListener('click', showDialogueHistory);
    document.getElementById('clear-dialogue-history').addEventListener('click', clearDialogueHistory);
}

/**
 * Save API Key
 */
function saveAPIKey() {
    const key = document.getElementById('ai-key-input').value.trim();
    if (!key) {
        alert('Please enter a valid API key');
        return;
    }
    
    AIDialogueConfig.apiKey = key;
    localStorage.setItem('hackclub_ai_key', key);
    updateAIStatus('ready');
    document.getElementById('trigger-dialogue').disabled = false;
    alert('API key saved successfully!');
}

/**
 * Toggle dialogue system
 */
function toggleDialogue(e) {
    AIDialogueConfig.enabled = e.target.checked;
    
    if (AIDialogueConfig.enabled) {
        if (!AIDialogueConfig.apiKey) {
            alert('Please enter and save your API key first');
            e.target.checked = false;
            AIDialogueConfig.enabled = false;
            return;
        }
        startDialogueSystem();
    } else {
        stopDialogueSystem();
    }
}

/**
 * Update cooldown
 */
function updateCooldown(e) {
    const value = parseInt(e.target.value);
    AIDialogueConfig.cooldownMs = value * 1000;
    document.getElementById('cooldown-value').textContent = value + 's';
}

/**
 * Start dialogue generation system
 */
function startDialogueSystem() {
    updateAIStatus('active');
    dialogueCheckTimer = setInterval(checkForDialogue, AIDialogueConfig.checkIntervalMs);
}

/**
 * Stop dialogue generation system
 */
function stopDialogueSystem() {
    updateAIStatus('ready');
    if (dialogueCheckTimer) {
        clearInterval(dialogueCheckTimer);
        dialogueCheckTimer = null;
    }
}

/**
 * Check if it's time to generate dialogue
 */
async function checkForDialogue() {
    if (!AIDialogueConfig.enabled || isGenerating) return;
    
    try {
        const bodyCount = Module._getBodyCount();
        if (bodyCount === 0) return;
        
        // Randomly select a body that hasn't spoken recently
        const now = Date.now();
        const eligibleBodies = [];
        
        for (let i = 0; i < bodyCount; i++) {
            const lastTime = bodyDialogues.get(i)?.lastTime || 0;
            if (now - lastTime >= AIDialogueConfig.cooldownMs) {
                eligibleBodies.push(i);
            }
        }
        
        if (eligibleBodies.length > 0) {
            // Pick a random eligible body
            const bodyIndex = eligibleBodies[Math.floor(Math.random() * eligibleBodies.length)];
            await generateDialogueForBody(bodyIndex);
        }
    } catch (error) {
        console.error('Error checking for dialogue:', error);
    }
}

/**
 * Manually trigger dialogue generation
 */
async function triggerManualDialogue() {
    if (isGenerating) return;
    
    const bodyCount = Module._getBodyCount();
    if (bodyCount === 0) {
        alert('No bodies in the simulation');
        return;
    }
    
    // Pick a random body
    const bodyIndex = Math.floor(Math.random() * bodyCount);
    await generateDialogueForBody(bodyIndex);
}

/**
 * Generate dialogue for a specific body
 */
async function generateDialogueForBody(bodyIndex) {
    if (isGenerating || !AIDialogueConfig.apiKey) return;
    
    try {
        isGenerating = true;
        updateAIStatus('generating');
        
        // Get body data
        const x = Module._getBodyX(bodyIndex);
        const y = Module._getBodyY(bodyIndex);
        const vx = Module._getBodyVX(bodyIndex);
        const vy = Module._getBodyVY(bodyIndex);
        const mass = Module._getBodyMass(bodyIndex);
        
        const speed = Math.sqrt(vx * vx + vy * vy);
        const position = Math.sqrt(x * x + y * y);
        
        // Analyze situation
        const situation = analyzeSituation(bodyIndex, x, y, vx, vy);
        
        // Get previous dialogues
        const previousDialogues = bodyDialogues.get(bodyIndex)?.history || [];
        
        // Generate dialogue
        const dialogue = await callHackClubAI(bodyIndex, situation, speed, position, previousDialogues);
        
        // Display dialogue
        displayDialogue(bodyIndex, dialogue);
        
        // Store in history
        const now = Date.now();
        if (!bodyDialogues.has(bodyIndex)) {
            bodyDialogues.set(bodyIndex, { lastTime: now, history: [], element: null });
        }
        const bodyData = bodyDialogues.get(bodyIndex);
        bodyData.lastTime = now;
        bodyData.history.push({ text: dialogue, timestamp: now });
        
        updateAIStatus(AIDialogueConfig.enabled ? 'active' : 'ready');
    } catch (error) {
        console.error('Error generating dialogue:', error);
        updateAIStatus('error');
        setTimeout(() => {
            updateAIStatus(AIDialogueConfig.enabled ? 'active' : 'ready');
        }, 2000);
    } finally {
        isGenerating = false;
    }
}

/**
 * Analyze the body's situation
 */
function analyzeSituation(bodyIndex, x, y, vx, vy) {
    const bodyCount = Module._getBodyCount();
    const speed = Math.sqrt(vx * vx + vy * vy);
    const position = Math.sqrt(x * x + y * y);
    
    // Find closest body
    let closestDist = Infinity;
    let closestIndex = -1;
    
    for (let i = 0; i < bodyCount; i++) {
        if (i === bodyIndex) continue;
        
        const ox = Module._getBodyX(i);
        const oy = Module._getBodyY(i);
        const dx = ox - x;
        const dy = oy - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < closestDist) {
            closestDist = dist;
            closestIndex = i;
        }
    }
    
    // Determine situation
    if (closestDist < 50) {
        return `in a VERY close encounter with Body ${closestIndex + 1} (distance: ${closestDist.toFixed(1)})`;
    } else if (closestDist < 100) {
        return `passing near Body ${closestIndex + 1}`;
    } else if (speed > 3.0) {
        return `zooming through space at high velocity (${speed.toFixed(2)})`;
    } else if (speed < 0.5) {
        return `drifting slowly through the cosmic dance`;
    } else if (position > 300) {
        return `venturing far from the center of the system`;
    } else if (position < 50) {
        return `near the center of the gravitational chaos`;
    } else {
        return `orbiting in the eternal three-body dance`;
    }
}

/**
 * Call HackClub AI API
 */
async function callHackClubAI(bodyIndex, situation, speed, position, previousDialogues) {
    const bodyCount = Module._getBodyCount();
    const dialogueContext = previousDialogues.length > 0
        ? `Previous things this body has said: ${previousDialogues.slice(-2).map(d => d.text).join('; ')}`
        : 'This is the first time this body is speaking.';
    
    const prompt = `You are Body ${bodyIndex + 1} in a classical three-body gravitational simulation with ${bodyCount} total bodies. You are currently ${situation}. Your speed is ${speed.toFixed(2)} and you're at distance ${position.toFixed(2)} from center.

Generate a SHORT (1-2 sentences max), witty, space-related joke or dialogue that reflects your current situation. Be creative, funny, and reference physics, astronomy, or cosmic phenomena. Stay in character as a celestial body with personality.

${dialogueContext}

Generate ONLY the dialogue/joke, nothing else. Keep it brief and punchy!`;

    const response = await fetch(`${AIDialogueConfig.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${AIDialogueConfig.apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: AIDialogueConfig.model,
            messages: [
                {
                    role: 'system',
                    content: 'You are a witty celestial body in a physics simulation. Generate SHORT, funny space jokes and dialogue. Maximum 2 sentences. Be clever and physics-aware.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.9,
            max_tokens: 100
        })
    });
    
    if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content.trim();
}

/**
 * Display dialogue on screen
 */
function displayDialogue(bodyIndex, text) {
    const container = document.getElementById('dialogue-container');
    
    // Remove existing dialogue for this body
    const existing = bodyDialogues.get(bodyIndex)?.element;
    if (existing && existing.parentNode) {
        existing.remove();
    }
    
    // Create dialogue element
    const dialogueEl = document.createElement('div');
    dialogueEl.className = 'body-dialogue';
    
    // Get body color
    const color = Module._getBodyColor(bodyIndex);
    const r = (color >> 24) & 0xFF;
    const g = (color >> 16) & 0xFF;
    const b = (color >> 8) & 0xFF;
    dialogueEl.style.backgroundColor = `rgba(${r}, ${g}, ${b}, 0.9)`;
    dialogueEl.style.borderColor = `rgba(${r}, ${g}, ${b}, 1)`;
    
    dialogueEl.innerHTML = `
        <div class="dialogue-header">Body ${bodyIndex + 1}</div>
        <div class="dialogue-text">${escapeHtml(text)}</div>
    `;
    
    container.appendChild(dialogueEl);
    
    // Store reference
    const bodyData = bodyDialogues.get(bodyIndex);
    if (bodyData) {
        bodyData.element = dialogueEl;
    }
    
    // Animate in
    setTimeout(() => dialogueEl.classList.add('show'), 10);
    
    // Auto-hide after 8 seconds
    setTimeout(() => {
        dialogueEl.classList.remove('show');
        setTimeout(() => {
            if (dialogueEl.parentNode) {
                dialogueEl.remove();
            }
        }, 300);
    }, 8000);
}

/**
 * Update AI status indicator
 */
function updateAIStatus(status) {
    const indicator = document.getElementById('ai-status-indicator');
    const text = document.getElementById('ai-status-text');
    
    indicator.className = 'ai-status-indicator';
    
    switch (status) {
        case 'active':
            indicator.classList.add('active');
            text.textContent = 'Active';
            break;
        case 'generating':
            indicator.classList.add('generating');
            text.textContent = 'Generating...';
            break;
        case 'ready':
            text.textContent = 'Ready';
            break;
        case 'error':
            text.textContent = 'Error';
            break;
        default:
            text.textContent = 'Inactive';
    }
}

/**
 * Show dialogue history
 */
function showDialogueHistory() {
    const modal = document.getElementById('dialogue-history-modal');
    const content = document.getElementById('dialogue-history-content');
    
    content.innerHTML = '';
    
    if (bodyDialogues.size === 0) {
        content.innerHTML = '<p style="color: #8a8aa5; text-align: center; padding: 20px;">No dialogue history yet. Enable AI dialogue and let the bodies speak!</p>';
    } else {
        for (const [bodyIndex, data] of bodyDialogues.entries()) {
            if (data.history.length === 0) continue;
            
            const section = document.createElement('div');
            section.className = 'history-body-section';
            
            const title = document.createElement('div');
            title.className = 'history-body-title';
            title.textContent = `Body ${bodyIndex + 1}`;
            section.appendChild(title);
            
            for (const item of data.history) {
                const historyItem = document.createElement('div');
                historyItem.className = 'history-item';
                const timestamp = new Date(item.timestamp).toLocaleTimeString();
                historyItem.innerHTML = `${escapeHtml(item.text)} <span class="history-timestamp">${timestamp}</span>`;
                section.appendChild(historyItem);
            }
            
            content.appendChild(section);
        }
    }
    
    modal.classList.add('visible');
}

/**
 * Hide dialogue history
 */
function hideDialogueHistory() {
    document.getElementById('dialogue-history-modal').classList.remove('visible');
}

/**
 * Clear dialogue history
 */
function clearDialogueHistory() {
    if (!confirm('Clear all dialogue history?')) return;
    
    bodyDialogues.clear();
    
    // Clear visible dialogues
    const container = document.getElementById('dialogue-container');
    container.innerHTML = '';
    
    alert('Dialogue history cleared');
}

/**
 * Escape HTML
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize when page loads
if (typeof Module !== 'undefined') {
    initAIDialogue();
} else {
    // Wait for Module to be ready
    document.addEventListener('DOMContentLoaded', () => {
        if (typeof Module !== 'undefined') {
            initAIDialogue();
        }
    });
}
