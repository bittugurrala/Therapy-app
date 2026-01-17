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

// ===========================================
// SETTINGS (capital letters game)
// ===========================================
const settings = {
    bubbleCount: 12,
    rotationDuration: 25,
    bubbleSizeRatio: 0.095,
    letterSize: 1.8,
    patientName: "Demo Patient"
};

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
// COLORS (TV FRIENDLY)
// ===========================================
let therapyColors = ["#FFFFFF", "#2F80FF", "#FF3B30"];

// ===========================================
// UTILITIES
// ===========================================
function randomLetter() {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    return letters[Math.floor(Math.random() * letters.length)];
}

/**
 * Calculate contrast color (black or white) for text over a background hex color
 */
function getContrastColor(hexColor) {
    // Convert hex to RGB
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    // Calculate relative luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? "#000000" : "#FFFFFF";
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
    targetValueBox.innerText = currentTarget;
}

// ===========================================
// GAME FLOW
// ===========================================
function startGame() {
    startScreen.style.display = "none";

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
    document.querySelector(".playpause i")
        .classList.replace("fa-play", "fa-pause");

    startLevel();
}

function startLevel() {
    bubbleContainer.innerHTML = "";
    bubblePositions = [];
    poppingTargetActive = false;

    for (let i = 0; i < settings.bubbleCount; i++) {
        createBubble(randomLetter());
        stats.bubblesAppeared++;
    }

    setTimeout(chooseNextTarget, 300);
}

// ===========================================
// BUBBLE CREATION
// ===========================================
function createBubble(letter) {
    const bubble = document.createElement("div");
    bubble.className = "bubble";

    const bubbleColor = therapyColors[Math.floor(Math.random() * therapyColors.length)];
    bubble.style.background = bubbleColor;

    const span = document.createElement("span");
    span.innerText = letter;
    span.style.fontSize = `${settings.letterSize}rem`;
    span.style.color = getContrastColor(bubbleColor); // Contrast protection
    bubble.appendChild(span);

    const wheelSize = bubbleContainer.clientWidth;
    const bubbleRadius = (wheelSize * settings.bubbleSizeRatio) / 2;

    let pos, valid = false;

    for (let attempt = 0; attempt < 80; attempt++) {
        const angle = Math.random() * Math.PI * 2;
        const maxR = wheelSize / 2 - bubbleRadius;
        const radius = Math.sqrt(Math.random()) * maxR;

        const x = 50 + (radius * Math.cos(angle)) / (wheelSize / 100);
        const y = 50 + (radius * Math.sin(angle)) / (wheelSize / 100);

        pos = { x, y };
        if (!checkOverlap(pos)) {
            valid = true;
            break;
        }
    }

    if (!valid) return;

    bubblePositions.push(pos);
    bubble.style.left = pos.x + "%";
    bubble.style.top = pos.y + "%";

    bubble.onclick = () => handleBubbleClick(bubble);
    bubbleContainer.appendChild(bubble);
}

// ===========================================
// COLLISION CHECK
// ===========================================
function checkOverlap(pos) {
    return bubblePositions.some(p => {
        const dx = p.x - pos.x;
        const dy = p.y - pos.y;
        return Math.sqrt(dx * dx + dy * dy) < 12;
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
        endSession();
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
    const value = bubble.querySelector("span").innerText;

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
    document.getElementById("res-stimuli-count").innerText = stats.bubblesAppeared;
    document.getElementById("res-letter-size-val").innerText = settings.letterSize;
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
    const sessionData = {
        Patient: settings.patientName,
        SessionID: sessionId,
        Date: dateStr,
        Game: "Capital Letters – Rotator",
        Stimuli: stats.bubblesAppeared,
        LetterSize: settings.letterSize,
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
const letterSizeInput = document.getElementById("setting-letter-size");
const letterSizeValue = document.getElementById("letterSizeValue");
const previewLetter = document.getElementById("preview-letter");
const patientNameInput = document.getElementById("setting-patient-name");
const bubbleSizeInput = document.getElementById("setting-bubble-size");
const bubbleSizeValue = document.getElementById("bubbleSizeValue");
const colorInput1 = document.getElementById("setting-color-1");
const colorInput2 = document.getElementById("setting-color-2");
const colorInput3 = document.getElementById("setting-color-3");
const wheelColorInput = document.getElementById("setting-wheel-color");
const applySettingsBtn = document.getElementById("applySettings");
const settingsModal = document.getElementById("settingsModal");

// Initialize inputs with current settings
if (letterSizeInput) {
    letterSizeInput.value = settings.letterSize;
    letterSizeValue.innerText = settings.letterSize;
    previewLetter.style.fontSize = `${settings.letterSize}rem`;
}
if (patientNameInput) patientNameInput.value = settings.patientName;
if (bubbleSizeInput) {
    bubbleSizeInput.value = settings.bubbleSizePx || 90;
    bubbleSizeValue.innerText = settings.bubbleSizePx || 90;
}
if (colorInput1) {
    colorInput1.value = therapyColors[0];
    colorInput2.value = therapyColors[1];
    colorInput3.value = therapyColors[2];
}

// Slider Live Preview - Letter Size
if (letterSizeInput) {
    letterSizeInput.addEventListener("input", (e) => {
        const val = e.target.value;
        letterSizeValue.innerText = val;
        previewLetter.style.fontSize = `${val}rem`;
        // REALTIME: update existing bubbles
        document.querySelectorAll(".bubble span").forEach(span => {
            span.style.fontSize = `${val}rem`;
        });
    });
}

// Slider Live Preview - Stimulus Size
if (bubbleSizeInput) {
    bubbleSizeInput.addEventListener("input", (e) => {
        const val = e.target.value;
        bubbleSizeValue.innerText = val;
        // REALTIME: update existing bubbles
        document.querySelectorAll(".bubble").forEach(bubble => {
            bubble.style.height = `${val}px`;
            bubble.style.width = `${val}px`;
        });
    });
}

// Color Live Preview - Bubble Colors
const updateBubbleColorsRealtime = () => {
    const colors = [colorInput1.value, colorInput2.value, colorInput3.value];
    document.querySelectorAll(".bubble").forEach((bubble, idx) => {
        const color = colors[idx % 3];
        bubble.style.background = color;
        const span = bubble.querySelector("span");
        if (span) span.style.color = getContrastColor(color);
    });
};
if (colorInput1) colorInput1.addEventListener("input", updateBubbleColorsRealtime);
if (colorInput2) colorInput2.addEventListener("input", updateBubbleColorsRealtime);
if (colorInput3) colorInput3.addEventListener("input", updateBubbleColorsRealtime);

// Color Live Preview - Wheel Color
if (wheelColorInput) {
    wheelColorInput.addEventListener("input", (e) => {
        const val = e.target.value;
        // REALTIME: update wheel
        wheel.style.backgroundColor = val;
        
        // AUTO SUGGEST: update bubble color inputs if they match wheel too closely
        const suggestions = suggestBubbleColors(val);
        colorInput1.value = suggestions[0];
        colorInput2.value = suggestions[1];
        colorInput3.value = suggestions[2];
        
        // Trigger live bubble update
        updateBubbleColorsRealtime();
    });
}

// Apply Settings
if (applySettingsBtn) {
    applySettingsBtn.addEventListener("click", () => {
        settings.patientName = patientNameInput.value;
        settings.letterSize = parseFloat(letterSizeInput.value);
        settings.bubbleSizePx = parseFloat(bubbleSizeInput.value);
        therapyColors = [colorInput1.value, colorInput2.value, colorInput3.value];
        settings.wheelColor = wheelColorInput.value;
        
        // Update existing bubbles (Final Commit)
        document.querySelectorAll(".bubble").forEach((bubble, idx) => {
            bubble.style.height = `${settings.bubbleSizePx}px`;
            bubble.style.width = `${settings.bubbleSizePx}px`;
            bubble.style.background = therapyColors[idx % 3];
            const span = bubble.querySelector("span");
            if (span) span.style.fontSize = `${settings.letterSize}rem`;
        });
        wheel.style.backgroundColor = settings.wheelColor;

        // Hide modal (Bootstrap 5)
        const modal = bootstrap.Modal.getInstance(settingsModal);
        if (modal) modal.hide();
    });
}

// Reset on Close (Cancel)
if (settingsModal) {
    settingsModal.addEventListener('hidden.bs.modal', () => {
        // Revert UI to match stored settings
        patientNameInput.value = settings.patientName;
        letterSizeInput.value = settings.letterSize;
        letterSizeValue.innerText = settings.letterSize;
        previewLetter.style.fontSize = `${settings.letterSize}rem`;
        bubbleSizeInput.value = settings.bubbleSizePx || 90;
        bubbleSizeValue.innerText = settings.bubbleSizePx || 90;
        colorInput1.value = therapyColors[0];
        colorInput2.value = therapyColors[1];
        colorInput3.value = therapyColors[2];
        
        // Revert Realtime changes if not applied
        document.querySelectorAll(".bubble").forEach((bubble, idx) => {
            bubble.style.height = settings.bubbleSizePx ? `${settings.bubbleSizePx}px` : "clamp(40px, 7vw, 110px)";
            bubble.style.width = settings.bubbleSizePx ? `${settings.bubbleSizePx}px` : "clamp(40px, 7vw, 110px)";
            bubble.style.background = therapyColors[idx % 3];
            const span = bubble.querySelector("span");
            if (span) span.style.fontSize = `${settings.letterSize}rem`;
        });
        wheel.style.backgroundColor = settings.wheelColor || "";
    });
}
// BLOCK TOUCH GESTURES (kiosk-style behavior)
["touchstart", "touchmove", "touchend", "gesturestart", "gesturechange", "gestureend"].forEach(evt => {
    document.addEventListener(evt, e => {
        e.preventDefault();
    }, { passive: false });
});
