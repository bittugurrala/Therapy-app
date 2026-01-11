// ===========================================
// ELEMENTS
// ===========================================
const bubbleContainer = document.getElementById("bubble-container");
const wheel = document.querySelector(".rotating-wheel");

const correctSound = document.getElementById("correctSound");
const wrongSound = document.getElementById("wrongSound");

const targetValueBox = document.getElementById("target-value");

// ===========================================
// GAME SETTINGS
// ===========================================
let mode = "alphabets";   // alphabets / numbers / colors
let wheelPaused = false;

// COLOR LEARNING MODE — BRIGHT COLORS ONLY
let brightColors = [
    { name: "Red",    code: "#FF1E1E" },
    { name: "Blue",   code: "#0084FF" },
    { name: "Green",  code: "#00D26A" },
    { name: "Yellow", code: "#FFD600" }
];

// SOFT THERAPY COLORS
let therapyColors = [
    // "#FFF6A3", "#A8D8FF", "#FFB7B2", "#B9F2C7", "#D8C5FF"
    "#ffffff", // white
    "#2f80ff", // blue
    "#ff3b30"  // red

];

let bubblePositions = [];
let currentTarget = "";
let poppingTargetActive = false;

// ===========================================
// UPDATE TARGET DISPLAY
// ===========================================
function updateTargetDisplay() {
    targetValueBox.innerText = currentTarget;
}

// ===========================================
// GET EXISTING SYMBOLS
// ===========================================
function getRemainingSymbols() {
    let set = new Set();
    document.querySelectorAll(".bubble span").forEach(b => {
        set.add(b.innerText);
    });
    return Array.from(set);
}

// ===========================================
// START LEVEL
// ===========================================
function startLevel() {
    bubbleContainer.innerHTML = "";
    bubblePositions = [];
    poppingTargetActive = false;

    for (let i = 0; i < 12; i++) {
        createBubble(randomSymbol());
    }

    setTimeout(chooseNextTarget, 300);
}

// ===========================================
// RANDOM SYMBOL (CAPITAL LETTERS ONLY)
// ===========================================
function randomSymbol() {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    return letters[Math.floor(Math.random() * letters.length)];
}

// ===========================================
// CREATE BUBBLE
// ===========================================
function createBubble(symbol) {
    const bubble = document.createElement("div");
    bubble.classList.add("bubble");

    // ⭐ ADDED: wrap letter in span
    const span = document.createElement("span");
    span.innerText = symbol;
    bubble.appendChild(span);

    bubble.style.background =
        therapyColors[Math.floor(Math.random() * therapyColors.length)];

    const wheelSize = bubbleContainer.clientWidth;
    const bubbleRadius = (wheelSize * 0.095) / 2;

    let pos;
    let valid = false;

    for (let attempt = 0; attempt < 80; attempt++) {
        const angle = Math.random() * 2 * Math.PI;
        const maxR = (wheelSize / 2) - bubbleRadius;
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
    for (const p of bubblePositions) {
        const dx = p.x - pos.x;
        const dy = p.y - pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 12) return true;
    }
    return false;
}

// ===========================================
// CHOOSE TARGET
// ===========================================
function chooseNextTarget() {
    let remaining = getRemainingSymbols();

    if (remaining.length === 0) {
        setTimeout(startLevel, 400);
        return;
    }

    currentTarget = remaining[Math.floor(Math.random() * remaining.length)];
    updateTargetDisplay();
    poppingTargetActive = true;

    setTimeout(() => speak(currentTarget), 400);
}

// ===========================================
// CLICK HANDLER
// ===========================================
function handleBubbleClick(bubble) {
    if (!poppingTargetActive) return;

    const clickedValue = bubble.querySelector("span").innerText;

    if (clickedValue === currentTarget) {
        speak(clickedValue);
        bubble.classList.add("pop");

        setTimeout(() => {
            bubble.remove();

            let stillLeft = false;
            document.querySelectorAll(".bubble span").forEach(b => {
                if (b.innerText === currentTarget) stillLeft = true;
            });

            if (!stillLeft) {
                poppingTargetActive = false;
                setTimeout(chooseNextTarget, 600);
            }
        }, 250);
    } else {
        speak("wrong");
        bubble.classList.add("wrong");
        setTimeout(() => bubble.classList.remove("wrong"), 300);
    }
}

// ===========================================
// SPEED CONTROL (UNCHANGED)
// ===========================================
document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        let text = btn.innerText;

        if (text.includes("x")) {
            let speed = parseFloat(text.replace("x", ""));
            wheel.style.animationDuration = (25 / speed) + "s";
        }

        if (text === "Reset") startLevel();
        if (text === "Quit") quitGame();
    });
});

// ===========================================
// PLAY / PAUSE (UNCHANGED)
// ===========================================
document.querySelector(".playpause").addEventListener("click", () => {
    if (wheelPaused) {
        wheel.style.animationPlayState = "running";
        document.querySelector(".playpause i").classList.replace("fa-play", "fa-pause");
        wheelPaused = false;
    } else {
        wheel.style.animationPlayState = "paused";
        document.querySelector(".playpause i").classList.replace("fa-pause", "fa-play");
        wheelPaused = true;
    }
});

// ===========================================
// ⭐ COUNTER-ROTATE LETTERS (KEY FIX)
// ===========================================
function syncTextRotation() {
    const transform = getComputedStyle(wheel).transform;
    if (transform !== "none") {
        const values = transform.split("(")[1].split(")")[0].split(",");
        const a = values[0];
        const b = values[1];
        const angle = Math.atan2(b, a) * (180 / Math.PI);

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
    utter.volume = 1;
    speechSynthesis.speak(utter);
}

// ===========================================
// INIT
// ===========================================
startLevel();
