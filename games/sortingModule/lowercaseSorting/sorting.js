
/* 
 * SORTING GAME - Plain JS Implementation
 * Modular, Clean Code, No Frameworks
 */

// ================= STATE MANAGEMENT =================
const state = {
    isGameReady: false,
    isGameStarted: false,
    currentAlphabetGroup: [], // Current set of {letter, x, y}
    remainingAlphabets: [],   // Letters yet to be introduced
    startTime: 0,             // Session start time
    
    // Metrics
    metrics: {
        correctClicks: 0,
        wrongClicks: 0,
        reactionTimes: [],    // Array of {letter, timeInMs}
        lastClickTime: 0,     // To calculate per-letter reaction
    },

    settings: {
        letterSize: 1.8,
        bubbleSize: 90,
        patientName: "",
        themeColor: "blue", // Default
        glowIntensity: 0.5
    }
};

const THEMES = {
    blue: { bg: "radial-gradient(circle at top, #e6faff, #8fdfff)", border: "#6fe3ff" },
    green: { bg: "radial-gradient(circle at top, #e6ffea, #8fff9f)", border: "#6fff86" },
    purple: { bg: "radial-gradient(circle at top, #f3e6ff, #d48fff)", border: "#c06fff" },
    orange: { bg: "radial-gradient(circle at top, #fff5e6, #ffc98f)", border: "#ffb86f" }
};

const CONSTANTS = {
    INITIAL_BATCH_SIZE: 6, // Start with A-F
    ALPHABETS: "abcdefghijklmnopqrstuvwxyz".split("")
};


// ================= DOM ELEMENTS =================
const els = {
    emoji: document.getElementById("emoji"),
    startScreen: document.getElementById("start-screen"),
    bubbleContainer: document.getElementById("bubble-container"),
    settingsModal: document.getElementById("settingsModal"),
    resultsModal: document.getElementById("resultsModal"),
    resultsContent: document.getElementById("resultsContent"),
    menuOverlay: document.getElementById("menuOverlay"),
    
    // Inputs
    inputPatient: document.getElementById("setting-patient-name"),
    inputLetterSize: document.getElementById("setting-letter-size"),
    inputBubbleSize: document.getElementById("setting-bubble-size"),
    inputGlow: document.getElementById("setting-glow"),
    colorOptions: document.querySelectorAll(".color-option"),
    
    // Display Values
    valLetterSize: document.getElementById("letterSizeValue"),
    valBubbleSize: document.getElementById("bubbleSizeValue"),
    valGlow: document.getElementById("glowValue"),
    previewLetter: document.getElementById("preview-letter"),
    previewBox: document.querySelector(".preview-box"),
    
    // Stats
    statReaction: document.getElementById("stat-reaction"),
    statDuration: document.getElementById("stat-duration"),
    statClicks: document.getElementById("stat-clicks"),
    
    // Buttons
    btnApply: document.getElementById("applySettings"),
    btnCloseSettings: document.getElementById("closeSettingsBtn"),
    btnMenu: document.getElementById("menuBtn"),
    btnMenuClose: document.getElementById("menuCloseBtn"),
    btnQuit: document.getElementById("quitBtn"),
    btnReset: document.getElementById("resetBtn"),
    btnSettings: document.getElementById("settingsBtn"),
    btnExport: document.getElementById("exportBtn"),
    btnResultsClose: document.getElementById("resultsCloseBtn"),
};

// ================= INITIALIZATION =================
document.addEventListener("DOMContentLoaded", () => {
    initBlinkingEmoji();
    initSettings();
    initEventListeners();
    
    // Show settings modal on load
    showModal(els.settingsModal);
});

// ================= EMOJI LOGIC =================
let blinkInterval;
let idleTimer;

function initBlinkingEmoji() {
    const openEye = document.getElementById("eye-open");
    const closedEye = document.getElementById("eye-closed");

    function blink() {
        openEye.style.display = "none";
        closedEye.style.display = "inline";

        setTimeout(() => {
            closedEye.style.display = "none";
            openEye.style.display = "inline";
        }, 200); // Faster blink for better feel
    }

    function startBlinking() {
        if (blinkInterval) clearInterval(blinkInterval);
        blinkInterval = setInterval(blink, 2000);
    }

    function stopBlinking() {
        clearInterval(blinkInterval);
        // Ensure eye is open when stopped
        closedEye.style.display = "none";
        openEye.style.display = "inline";
    }

    function resetIdleTimer() {
        stopBlinking();
        clearTimeout(idleTimer);
        idleTimer = setTimeout(startBlinking, 2000);
    }

    // Reset blinking on interaction
    ["mousemove", "keydown", "click", "touchstart"].forEach(evt => {
        document.addEventListener(evt, resetIdleTimer);
    });

    startBlinking();
}

// ================= SETTINGS LOGIC =================
function initSettings() {
    // Update preview when sliders move
    els.inputLetterSize.addEventListener("input", (e) => {
        const val = e.target.value;
        els.valLetterSize.textContent = val;
        els.previewLetter.style.fontSize = val + "rem";
        state.settings.letterSize = val;
    });

    els.inputBubbleSize.addEventListener("input", (e) => {
        const val = e.target.value;
        els.valBubbleSize.textContent = val;
        state.settings.bubbleSize = val;
        
        els.previewBox.style.width = val + "px";
        els.previewBox.style.height = val + "px";
    });

    els.inputGlow.addEventListener("input", (e) => {
        const val = e.target.value;
        els.valGlow.textContent = val;
        state.settings.glowIntensity = val;
        updatePreviewGlow(val);
    });

    // Color Selection
    els.colorOptions.forEach(opt => {
        opt.addEventListener("click", () => {
            els.colorOptions.forEach(o => o.classList.remove("selected"));
            opt.classList.add("selected");
            
            const color = opt.dataset.color;
            state.settings.themeColor = color;
            updatePreviewColor(color);
        });
    });
}

function updatePreviewGlow(intensity) {
    // Base shadow + dynamic intensity
    const whiteGlow = `0 0 ${15 * intensity}px rgba(255,255,255,${0.4 * intensity})`;
    const darkShadow = `0 ${10 * intensity}px ${25 * intensity}px rgba(0,0,0,${0.4 * intensity})`;
    els.previewBox.style.boxShadow = `${whiteGlow}, ${darkShadow}`;
}

function updatePreviewColor(color) {
    const theme = THEMES[color];
    els.previewBox.style.background = theme.bg;
    els.previewBox.style.border = `4px solid ${theme.border}`;
}

function applySettings() {
    state.settings.patientName = els.inputPatient.value || "Anonymous";
    state.settings.letterSize = els.inputLetterSize.value;
    state.settings.bubbleSize = els.inputBubbleSize.value;
    state.settings.glowIntensity = els.inputGlow.value;

    state.isGameReady = true;
    hideModal(els.settingsModal);
    
    // Enable start emoji
    els.emoji.style.cursor = "pointer";
    els.emoji.title = "Click to Start";
}

// ================= GAME LOGIC =================
function startGame() {
    if (!state.isGameReady) return;
    
    state.isGameStarted = true;
    state.startTime = Date.now();
    state.metrics.lastClickTime = state.startTime;
    
    // Reset Metrics
    state.metrics.correctClicks = 0;
    state.metrics.wrongClicks = 0;
    state.metrics.reactionTimes = [];
    
    // Prepare Alphabets
    const allAlphabets = [...CONSTANTS.ALPHABETS];
    const initialBatch = allAlphabets.slice(0, CONSTANTS.INITIAL_BATCH_SIZE);
    state.remainingAlphabets = allAlphabets.slice(CONSTANTS.INITIAL_BATCH_SIZE);
    state.currentAlphabetGroup = [];
    
    // Find non-overlapping positions for initial batch
    initialBatch.forEach(letter => {
        const pos = findSafePosition();
        state.currentAlphabetGroup.push({ letter, ...pos });
    });
    
    // UI Updates
    els.startScreen.style.display = "none";
    els.emoji.style.display = "none";
    
    renderBubbles();
    startStatsTimer();
}

function findSafePosition() {
    const padding = 15; // padding in %
    const maxAttempts = 50;
    const bubbleSizePercent = 10; // rough estimate of bubble size in viewport %

    for (let i = 0; i < maxAttempts; i++) {
        const x = Math.random() * (100 - 2 * padding) + padding;
        const y = Math.random() * (100 - 2 * padding) + padding;
        
        let overlap = false;
        for (const existing of state.currentAlphabetGroup) {
            const dx = existing.x - x;
            const dy = existing.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < bubbleSizePercent * 1.5) {
                overlap = true;
                break;
            }
        }
        
        if (!overlap) return { x, y };
    }
    
    // Fallback if no safe position found
    return { x: Math.random() * 80 + 10, y: Math.random() * 80 + 10 };
}

function renderBubbles() {
    els.bubbleContainer.innerHTML = "";
    state.currentAlphabetGroup.forEach(item => {
        const bubble = createBubble(item);
        els.bubbleContainer.appendChild(bubble);
    });
}

function createBubble(item) {
    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.innerText = item.letter;

    // Apply Settings
    bubble.style.fontSize = state.settings.letterSize + "rem";
    bubble.style.height = state.settings.bubbleSize + "px";
    bubble.style.width = state.settings.bubbleSize + "px";

    // Theme Colors
    const theme = THEMES[state.settings.themeColor] || THEMES.blue;
    bubble.style.background = theme.bg;
    bubble.style.border = `4px solid ${theme.border}`;

    // Apply Glow
    const intensity = state.settings.glowIntensity;
    const whiteGlow = `0 0 ${15 * intensity}px rgba(255,255,255,${0.4 * intensity})`;
    const darkShadow = `0 ${10 * intensity}px ${25 * intensity}px rgba(0,0,0,${0.4 * intensity})`;
    bubble.style.boxShadow = `${whiteGlow}, ${darkShadow}`;

    // Position
    bubble.style.left = item.x + "%";
    bubble.style.top = item.y + "%";
    bubble.style.transform = "translate(-50%, -50%)";

    bubble.onclick = (e) => handleBubbleClick(item.letter, bubble, e);
    
    return bubble;
}

function handleBubbleClick(letter, bubbleElement, event) {
    event.stopPropagation();
    
    const globalCorrectIndex = state.metrics.correctClicks;
    const expectedLetter = CONSTANTS.ALPHABETS[globalCorrectIndex];

    const now = Date.now();
    const reactionTime = now - state.metrics.lastClickTime;

    if (letter === expectedLetter) {
        // CORRECT
        state.metrics.correctClicks++;
        state.metrics.reactionTimes.push({ letter, time: reactionTime });
        state.metrics.lastClickTime = now;
        
        // Visuals
        bubbleElement.classList.add("pop");
        playAudio(true);
        updateLiveStats(reactionTime);

        // DELAY then Update Group
        setTimeout(() => {
            // Remove the clicked letter from the group
            state.currentAlphabetGroup = state.currentAlphabetGroup.filter(item => item.letter !== letter);
            
            // Add the next letter from the remaining pool if available
            if (state.remainingAlphabets.length > 0) {
                const nextLetter = state.remainingAlphabets.shift();
                const pos = findSafePosition();
                state.currentAlphabetGroup.push({ letter: nextLetter, ...pos });
            }

            // Check if game is over (no letters left on board)
            if (state.currentAlphabetGroup.length === 0) {
                endGame();
            } else {
                renderBubbles(); 
            }
        }, 300);

    } else {
        // WRONG
        state.metrics.wrongClicks++;
        playAudio(false);
        bubbleElement.style.transform = "translate(-50%, -50%) translateX(5px)";
        setTimeout(() => bubbleElement.style.transform = "translate(-50%, -50%)", 100);
    }
}

function endGame() {
    state.isGameStarted = false;
    stopStatsTimer();
    showResultsModal();
}

function showResultsModal() {
    const duration = Math.floor((Date.now() - state.startTime) / 1000);
    const avgReaction = state.metrics.reactionTimes.length > 0 
        ? Math.floor(state.metrics.reactionTimes.reduce((acc, rt) => acc + rt.time, 0) / state.metrics.reactionTimes.length)
        : 0;

    els.resultsContent.innerHTML = `
        <div class="stats-row mb-3">
            <div class="stat-item">
                <small>Patient</small>
                <div class="stat-value">${state.settings.patientName || 'Demo Patient'}</div>
            </div>
            <div class="stat-item">
                <small>Duration</small>
                <div class="stat-value">${duration}s</div>
            </div>
        </div>
        <div class="stats-row mb-3">
            <div class="stat-item">
                <small>Correct</small>
                <div class="stat-value">${state.metrics.correctClicks}</div>
            </div>
            <div class="stat-item">
                <small>Mistakes</small>
                <div class="stat-value">${state.metrics.wrongClicks}</div>
            </div>
        </div>
        <div class="stats-row">
            <div class="stat-item">
                <small>Avg Reaction</small>
                <div class="stat-value">${avgReaction}ms</div>
            </div>
        </div>
    `;
    
    showModal(els.resultsModal);
}


// ================= DATA & STATS =================
let statsInterval;

function startStatsTimer() {
    if (statsInterval) clearInterval(statsInterval);
    statsInterval = setInterval(() => {
        const duration = Math.floor((Date.now() - state.startTime) / 1000);
        els.statDuration.innerText = duration;
        els.statClicks.innerText = state.metrics.correctClicks + state.metrics.wrongClicks;
    }, 1000);
}

function stopStatsTimer() {
    clearInterval(statsInterval);
}

function updateLiveStats(lastReaction) {
    els.statReaction.innerText = lastReaction;
}

function exportToCSV() {
    const data = state.metrics.reactionTimes.map(rt => ({
        Patient: state.settings.patientName,
        Letter: rt.letter,
        ReactionTimeMs: rt.time,
        TotalCorrect: state.metrics.correctClicks,
        TotalWrong: state.metrics.wrongClicks,
        DurationSec: Math.floor((Date.now() - state.startTime) / 1000),
        BubbleSize: state.settings.bubbleSize,
        Theme: state.settings.themeColor,
        Glow: state.settings.glowIntensity
    }));

    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvRows = [];
    csvRows.push(headers.join(','));

    for (const row of data) {
        const values = headers.map(header => {
            const val = row[header];
            return `"${val}"`;
        });
        csvRows.push(values.join(','));
    }

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `session_${state.settings.patientName || 'anonymous'}_${new Date().getTime()}.csv`);
    a.click();
}

// ================= UTILS & EVENTS =================
function initEventListeners() {
    els.btnApply.addEventListener("click", applySettings);
    els.btnCloseSettings.addEventListener("click", () => hideModal(els.settingsModal));
    els.btnMenu.addEventListener("click", () => showModal(els.menuOverlay));
    els.btnMenuClose.addEventListener("click", () => hideModal(els.menuOverlay));
    els.btnQuit.addEventListener("click", () => location.reload());
    els.btnReset.addEventListener("click", () => location.reload());
    els.btnSettings.addEventListener("click", () => {
        hideModal(els.menuOverlay);
        showModal(els.settingsModal);
    });
    
    els.btnExport.addEventListener("click", exportToCSV);
    els.btnResultsClose.addEventListener("click", () => location.reload());

    els.emoji.addEventListener("click", (e) => {
        if (!state.isGameReady) {
            showModal(els.settingsModal);
            return;
        }
        e.stopPropagation();
        startGame();
    });
}

function showModal(el) {
    el.classList.remove("hidden");
    el.style.display = "flex";
}

function hideModal(el) {
    el.classList.add("hidden");
    setTimeout(() => el.style.display = "none", 200);
}

// Simple synth audio to avoid asset dependencies
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playAudio(isCorrect) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    if (isCorrect) {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(500, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1000, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
    } else {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(100, audioCtx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
    }
}
