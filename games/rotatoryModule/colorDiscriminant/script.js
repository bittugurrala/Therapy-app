// ===========================================
// ELEMENTS
// ===========================================
const bubbleContainer = document.getElementById("bubble-container");
const wheel = document.querySelector(".rotating-wheel");
const targetValueBox = document.getElementById("target-value");
const startScreen = document.getElementById("start-screen");

const correctSound = document.getElementById("correctSound");
const wrongSound = document.getElementById("wrongSound");

// ===========================================
// GAME STATE
// ===========================================
let wheelPaused = true;
let poppingTargetActive = false;
let currentTarget = "";
let bubblePositions = [];
let currentSpeedLabel = "1x";
let sessionId = Math.floor(1000 + Math.random() * 9000);
let currentRound = 1;
const totalRounds = 2;

// ===========================================
// SETTINGS (Color Discriminant)
// ===========================================
const DEFAULT_SETTINGS = {
    bubbleCount: 10,
    rotationDuration: 25,
    bubbleSizeRatio: 0.095,
    patientName: "Demo Patient",
    minNum: 0,
    maxNum: 9,
    bubbleSizePx: 90,
    wheelColor: "#0a1a3a"
};

let settings = { ...DEFAULT_SETTINGS };

// ===========================================
// SESSION TRACKER (CLINICAL STYLE)
// ===========================================
let stats = {
    bubblesAppeared: 0,
    clicks: 0,
    correct: 0,
    wrong: 0,
    startTime: null,
    endTime: null,
    reactionTimes: [],
    targetShownAt: null
};

// ===========================================
// COLORS (Learning Levels)
// ===========================================
const LEVEL_COLORS = {
    "Beginner": ["Red", "Blue", "Yellow", "Green"],
    "Intermediate": ["Red", "Blue", "Yellow", "Green", "Orange", "Purple"],
    "Advanced": ["Red", "Blue", "Yellow", "Green", "Orange", "Purple", "Pink", "White"]
};

const LEVEL_COLORS_HEX = {
    "Red": "#FF0000",
    "Blue": "#0000FF",
    "Yellow": "#FFFF00",
    "Green": "#00FF00",
    "Orange": "#FFA500",
    "Purple": "#800080",
    "Pink": "#FFC0CB",
    "White": "#FFFFFF"
};

// ===========================================
// UTILITIES
// ===========================================
function randomLetter() {
    const level = settings.childLevel || "Intermediate";
    const colors = LEVEL_COLORS[level];
    return colors[Math.floor(Math.random() * colors.length)];
}

function getContrastColor(hexColor) {
    return "#000000"; // Fixed readable color as requested
}

/**
 * Suggest distinct colors for bubbles based on wheel background
 */
function suggestBubbleColors(wheelHex) {
    const defaultSuggestions = ["#FFFFFF", "#2F80FF", "#FF3B30"];
    // If wheel is white/very light, use slightly darker variants for the suggestions
    const r = parseInt(wheelHex.slice(1, 3), 16);
    const g = parseInt(wheelHex.slice(3, 5), 16);
    const b = parseInt(wheelHex.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    if (luminance > 0.8) {
        return ["#E0E0E0", "#1A66FF", "#D92E2E"];
    }
    return defaultSuggestions;
}

// Color Live Preview - Bubble Colors
const updateBubbleColorsRealtime = () => {
    // Functionality preserved for architecture but DISCRIMINATION_COLORS are used for game
    document.querySelectorAll(".bubble").forEach((bubble, idx) => {
        // No-op for discrimination mode or handle if specific behavior needed
    });
};

function updateLiveStats() {
    const reactionElem = document.getElementById("stat-reaction");
    const durationElem = document.getElementById("stat-duration");
    const clicksElem = document.getElementById("stat-clicks");
    const correctElem = document.getElementById("stat-correct");
    const wrongElem = document.getElementById("stat-wrong");

    if (reactionElem) {
        const avgReaction = stats.reactionTimes.length
            ? stats.reactionTimes.reduce((a, b) => a + b) / stats.reactionTimes.length
            : 0;
        reactionElem.innerText = avgReaction.toFixed(0);
    }
    if (durationElem && stats.startTime) {
        const dur = (performance.now() - stats.startTime) / 1000;
        durationElem.innerText = dur.toFixed(0);
    }
    if (clicksElem) clicksElem.innerText = stats.clicks;
    if (correctElem) correctElem.innerText = stats.correct;
    if (wrongElem) wrongElem.innerText = stats.wrong;
}

// Update stats every second if game is running
setInterval(() => {
    if (!wheelPaused) updateLiveStats();
}, 1000);

function updateTargetDisplay() {
    const targetColor = LEVEL_COLORS_HEX[currentTarget] || "#333";
    // targetValueBox.innerHTML = `Find: <span style="color: ${targetColor}; filter: drop-shadow(0 0 1px rgba(0,0,0,0.5));">${currentTarget}</span>`;
    targetValueBox.innerHTML = `<span>${currentTarget}</span>`;
}

// ===========================================
// GAME FLOW
// ===========================================
function startGame() {
    startScreen.style.display = "none";
    currentRound = 1;

    stats = {
        bubblesAppeared: 0,
        clicks: 0,
        correct: 0,
        wrong: 0,
        startTime: performance.now(),
        endTime: null,
        reactionTimes: [],
        targetShownAt: null
    };

    wheelPaused = false;
    wheel.style.animationPlayState = "running";
    const playPauseIcon = document.querySelector(".playpause i");
    if (playPauseIcon) {
        playPauseIcon.classList.replace("fa-play", "fa-pause");
    }

    sessionId = Math.floor(1000 + Math.random() * 9000);
    startLevel();
}

function generateNumberPool(count) {
    let pool = [];
    const level = settings.childLevel || "Intermediate";
    const colors = LEVEL_COLORS[level];

    // Fisher-Yates shuffle helper
    const shuffle = (array) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    };

    // Build the pool ensuring even distribution
    for (let i = 0; i < count; i++) {
        pool.push(colors[i % colors.length]);
    }

    return shuffle(pool);
}

function startLevel() {
    bubbleContainer.innerHTML = "";
    bubblePositions = [];
    poppingTargetActive = false;
    bubblesAppeared = 0;

    const pool = generateNumberPool(settings.bubbleCount);
    pool.forEach(num => {
        createBubble(num);
        stats.bubblesAppeared++;
    });

    setTimeout(chooseNextTarget, 300);
}

// ===========================================
// BUBBLE CREATION
// ===========================================
function createBubble(colorName) {
    const bubble = document.createElement("div");
    bubble.className = "bubble";

    const hex = LEVEL_COLORS_HEX[colorName] || "#FFFFFF";
    bubble.style.background = hex;
    bubble.style.backgroundColor = hex;

    const currentSize = settings.bubbleSizePx || 90;
    bubble.style.width = `${currentSize}px`;
    bubble.style.height = `${currentSize}px`;

    const span = document.createElement("span");
    span.innerText = colorName;
    span.style.display = "none"; // Hide text inside bubble
    bubble.appendChild(span);

    const wheelSize = bubbleContainer.clientWidth;
    const bubbleRadius = currentSize / 2;
    const padding = 10; // Extra padding from boundary

    let pos, valid = false;

    // Use a radial distribution approach for better fit
    for (let attempt = 0; attempt < 150; attempt++) {
        const angle = Math.random() * Math.PI * 2;
        const maxAllowedR = (wheelSize / 2) - bubbleRadius - padding;
        const radius = Math.sqrt(Math.random()) * maxAllowedR;

        const x = 50 + (radius * Math.cos(angle)) / (wheelSize / 100);
        const y = 50 + (radius * Math.sin(angle)) / (wheelSize / 100);

        pos = { x, y };
        if (!checkOverlap(pos, currentSize)) {
            valid = true;
            break;
        }
    }

    if (!valid) return;

    bubblePositions.push({ ...pos, size: currentSize });
    bubble.style.left = pos.x + "%";
    bubble.style.top = pos.y + "%";

    bubble.onpointerdown = (e) => {
        e.preventDefault();
        handleBubbleClick(bubble);
    };
    bubbleContainer.appendChild(bubble);
}

// ===========================================
// COLLISION CHECK
// ===========================================
function checkOverlap(pos, currentSize) {
    const wheelSize = bubbleContainer.clientWidth;
    const bubbleRadiusPx = currentSize / 2;
    
    return bubblePositions.some(p => {
        const dx = (p.x - pos.x) * (wheelSize / 100);
        const dy = (p.y - pos.y) * (wheelSize / 100);
        const distance = Math.sqrt(dx * dx + dy * dy);
        // Min distance is diameter + small gap
        return distance < (currentSize + 5);
    });
}

// ===========================================
// TARGET LOGIC
// ===========================================
function getRemainingLetters() {
    return [...new Set(
        [...document.querySelectorAll(".bubble span")]
            .map(s => s.innerText)
    )];
}

function chooseNextTarget() {
    const remaining = getRemainingLetters();

    if (remaining.length === 0) {
        if (currentRound < totalRounds) {
            currentRound++;
            startLevel();
        } else {
            endSession();
        }
        return;
    }

    currentTarget = remaining[Math.floor(Math.random() * remaining.length)];
    updateTargetDisplay();

    stats.targetShownAt = performance.now();
    poppingTargetActive = true;

    setTimeout(() => speak(currentTarget), 400);
}

// ===========================================
// CLICK HANDLER
// ===========================================
function handleBubbleClick(bubble) {
    if (!poppingTargetActive) return;

    stats.clicks++;
    const span = bubble.querySelector("span");
    if (!span) return;
    const value = span.innerText;

    if (value === currentTarget) {
        stats.correct++;

        const reaction =
            performance.now() - stats.targetShownAt;
        stats.reactionTimes.push(reaction);

        speak(value);
        bubble.classList.add("pop");

        setTimeout(() => {
            bubble.remove();

            const stillExists =
                [...document.querySelectorAll(".bubble span")]
                    .some(s => s.innerText === currentTarget);

            if (!stillExists) {
                poppingTargetActive = false;
                setTimeout(chooseNextTarget, 600);
            }
        }, 250);

    } else {
        stats.wrong++;
        speak("wrong");
        bubble.classList.add("wrong");
        setTimeout(() => bubble.classList.remove("wrong"), 300);
    }
}

// ===========================================
// PLAY / PAUSE
// ===========================================
document.querySelector(".playpause").addEventListener("click", () => {
    wheelPaused = !wheelPaused;
    wheel.style.animationPlayState =
        wheelPaused ? "paused" : "running";

    document.querySelector(".playpause i")
        .classList.toggle("fa-play", wheelPaused);
    document.querySelector(".playpause i")
        .classList.toggle("fa-pause", !wheelPaused);
});

// ===========================================
// SPEED CONTROL (UNCHANGED)
// ===========================================
document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        const text = btn.innerText;

        if (text.includes("x")) {
            currentSpeedLabel = text;
            const speed = parseFloat(text.replace("x", ""));
            wheel.style.animationDuration =
                (settings.rotationDuration / speed) + "s";
        }

        if (text === "Reset") {
            // Full Reset to Start Screen
            location.reload(); 
        }
        if (text === "Quit") location.reload();
    });
});

// ===========================================
// COUNTER ROTATE LETTERS (CRITICAL)
// ===========================================
function syncTextRotation() {
    const transform = getComputedStyle(wheel).transform;
    if (transform !== "none") {
        const values = transform.match(/matrix\(([^)]+)\)/)[1].split(",");
        const angle = Math.atan2(values[1], values[0]) * (180 / Math.PI);

        document.querySelectorAll(".bubble span").forEach(span => {
            span.style.transform = `rotate(${-angle}deg)`;
        });

        // Safe check for previewLetter (using local constant to avoid hoisting issues)
        const pl = document.getElementById("preview-letter");
        if (pl) {
            pl.style.transform = `rotate(${-angle}deg)`;
        }
    }
    requestAnimationFrame(syncTextRotation);
}
syncTextRotation();

// ===========================================
// TEXT TO SPEECH
// ===========================================
function speak(text) {
    const utter = new SpeechSynthesisUtterance(text.toLowerCase());
    utter.rate = 0.9;
    utter.pitch = 1.1;
    speechSynthesis.speak(utter);
}
function rebuildBubblesPreservingTargets() {
    const existing = [...document.querySelectorAll(".bubble span")]
        .map(s => s.innerText);

    bubbleContainer.innerHTML = "";
    bubblePositions = [];

    existing.forEach(value => createBubble(value));
}


// ===========================================
// SESSION END (RESULT READY)
// ===========================================
function endSession() {
    stats.endTime = performance.now();
    wheel.style.animationPlayState = "paused";
    wheelPaused = true;

    const durationSec = (stats.endTime - stats.startTime) / 1000;
    const accuracy = stats.bubblesAppeared ? (stats.correct / stats.bubblesAppeared) * 100 : 0;
    const avgReaction = stats.reactionTimes.length 
        ? (stats.reactionTimes.reduce((a, b) => a + b) / stats.reactionTimes.length) / 1000 
        : 0;

    const dateStr = new Date().toLocaleDateString('en-GB', {
        day: '2-digit', month: 'long', year: 'numeric'
    });

    // Populate Clinical Result Modal
    document.getElementById("res-patient").innerText = settings.patientName;
    document.getElementById("res-session-id").innerText = sessionId;
    document.getElementById("res-date").innerText = dateStr;
    
    const sessionLevel = settings.childLevel || "Intermediate";
    document.getElementById("res-level").innerText = sessionLevel;
    document.getElementById("res-colors-used").innerText = LEVEL_COLORS[sessionLevel].join(", ");
    
    document.getElementById("res-stimuli-count").innerText = stats.bubblesAppeared;
    document.getElementById("res-speed-level").innerText = currentSpeedLabel;
    
    document.getElementById("res-time").innerText = durationSec.toFixed(1);
    document.getElementById("res-accuracy").innerText = accuracy.toFixed(1);
    document.getElementById("res-correct").innerText = stats.correct;
    document.getElementById("res-wrong").innerText = stats.wrong;
    document.getElementById("res-clicks-total").innerText = stats.clicks;
    document.getElementById("res-avg-react").innerText = avgReaction.toFixed(2);

    const resultModal = new bootstrap.Modal(document.getElementById('resultModal'));
    resultModal.show();

    // Prepare CSV Data
    const csvLevel = settings.childLevel || "Intermediate";
    const sessionData = {
        Patient: settings.patientName,
        SessionID: sessionId,
        Date: dateStr,
        Game: "Color Discriminant",
        Level: csvLevel,
        ColorsUsed: LEVEL_COLORS[csvLevel].join("; "),
        Stimuli: stats.bubblesAppeared,
        Speed: currentSpeedLabel,
        Duration: durationSec.toFixed(1),
        Clicks: stats.clicks,
        Correct: stats.correct,
        Wrong: stats.wrong,
        Accuracy: accuracy.toFixed(1),
        AvgReaction: avgReaction.toFixed(2)
    };

    document.getElementById("downloadCSV").onclick = () => downloadCSV(sessionData);
}

function downloadCSV(data) {
    const headers = Object.keys(data).join(",");
    const values = Object.values(data).join(",");
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + values;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `session_${sessionId}_results.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ===========================================
// START SCREEN
// ===========================================
if (startScreen) {
    startScreen.addEventListener("click", startGame);
}

// ===========================================
// SETTINGS LOGIC
// ===========================================
const patientNameInput = document.getElementById("setting-patient-name");
const bubbleSizeInput = document.getElementById("setting-bubble-size");
const bubbleSizeValue = document.getElementById("bubbleSizeValue");
const wheelColorInput = document.getElementById("setting-wheel-color");
const applySettingsBtn = document.getElementById("applySettings");
const settingsModal = document.getElementById("settingsModal");

const resetToDefaultBtn = document.getElementById("resetToDefault");

const childLevelInput = document.getElementById("setting-child-level");

// Initialize inputs with current settings
function syncSettingsToUI() {
    if (patientNameInput) patientNameInput.value = settings.patientName;
    if (bubbleSizeInput) {
        bubbleSizeInput.value = settings.bubbleSizePx || 90;
        bubbleSizeValue.innerText = settings.bubbleSizePx || 90;
    }
    if (childLevelInput) childLevelInput.value = settings.childLevel || "Intermediate";
    
    if (wheelColorInput) wheelColorInput.value = settings.wheelColor || "#0a1a3a";
}

syncSettingsToUI();

if (resetToDefaultBtn) {
    resetToDefaultBtn.addEventListener("click", () => {
        settings = { ...DEFAULT_SETTINGS };
        syncSettingsToUI();
        // Update Live Preview immediately
        wheel.style.backgroundColor = settings.wheelColor;
        
        // Refresh bubbles if active
        if (!startScreen || startScreen.style.display === "none") {
            startLevel();
        }
    });
}

// Slider Live Preview - Stimulus Size
// if (bubbleSizeInput) {
//     bubbleSizeInput.addEventListener("input", (e) => {
//         const val = e.target.value;
//         bubbleSizeValue.innerText = val;
//         settings.bubbleSizePx = parseFloat(val);
        
//         // REALTIME: update existing bubbles layout and size
//         if (!startScreen || startScreen.style.display === "none") {
//             const currentBubbles = [...document.querySelectorAll(".bubble")].map(b => {
//                 const span = b.querySelector("span");
//                 return span ? span.innerText : null;
//             }).filter(Boolean);
            
//             bubbleContainer.innerHTML = "";
//             bubblePositions = [];
//             currentBubbles.forEach(colorName => createBubble(colorName));
//         }
//     });
// }
// Slider Live Preview - Stimulus Size (SAFE)
if (bubbleSizeInput) {
    bubbleSizeInput.addEventListener("input", (e) => {
        const val = parseInt(e.target.value, 10);
        bubbleSizeValue.innerText = val;
        settings.bubbleSizePx = val;

        // ✅ SAFE: only rebuild layout, DO NOT restart game
        if (!wheelPaused) {
            rebuildBubblesPreservingTargets();
        }
    });
}


// Color Live Preview - Wheel Color
if (wheelColorInput) {
    wheelColorInput.addEventListener("input", (e) => {
        const val = e.target.value;
        // REALTIME: update wheel
        wheel.style.backgroundColor = val;
    });
}

// Apply Settings
if (applySettingsBtn) {
    applySettingsBtn.addEventListener("click", () => {
        settings.patientName = patientNameInput.value;
        settings.bubbleSizePx = parseFloat(bubbleSizeInput.value);
        settings.childLevel = childLevelInput.value;
        settings.wheelColor = wheelColorInput.value;
        
        // Refresh the level with new sizes/colors if game is active
        if (!startScreen || startScreen.style.display === "none") {
            startLevel();
        }
        
        wheel.style.backgroundColor = settings.wheelColor;

        // Auto-close modal (Bootstrap 5)
        const modalEl = document.getElementById('settingsModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) {
            modal.hide();
            // Return focus to body to avoid stuck focus states
            document.body.focus();
        }
    });
}

// Reset on Close (Cancel)
if (settingsModal) {
    settingsModal.addEventListener('hidden.bs.modal', () => {
        // Revert UI to match stored settings
        patientNameInput.value = settings.patientName;
        bubbleSizeInput.value = settings.bubbleSizePx || 90;
        bubbleSizeValue.innerText = settings.bubbleSizePx || 90;
        
        // Revert Realtime changes if not applied
        if (!startScreen || startScreen.style.display === "none") {
            const currentBubbles = [...document.querySelectorAll(".bubble")].map(b => {
                const span = b.querySelector("span");
                return span ? span.innerText : null;
            }).filter(Boolean);
            
            bubbleContainer.innerHTML = "";
            bubblePositions = [];
            currentBubbles.forEach(colorName => createBubble(colorName));
        }
        wheel.style.backgroundColor = settings.wheelColor || "";
    });
}

