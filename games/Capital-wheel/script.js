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

// ===========================================
// SETTINGS (capital letters game)
// ===========================================
const settings = {
    bubbleCount: 12,
    rotationDuration: 25,
    bubbleSizeRatio: 0.095,
    letterSize: 1
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
const therapyColors = ["#FFFFFF", "#2F80FF", "#FF3B30"];

// ===========================================
// UTILITIES
// ===========================================
function randomLetter() {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    return letters[Math.floor(Math.random() * letters.length)];
}

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

    const span = document.createElement("span");
    span.innerText = letter;
    span.style.fontSize = `${settings.letterSize}em`;
    bubble.appendChild(span);

    bubble.style.background =
        therapyColors[Math.floor(Math.random() * therapyColors.length)];

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
            const speed = parseFloat(text.replace("x", ""));
            wheel.style.animationDuration =
                (settings.rotationDuration / speed) + "s";
        }

        if (text === "Reset") startLevel();
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

    const durationSec =
        (stats.endTime - stats.startTime) / 1000;

    const accuracy =
        stats.bubblesAppeared
            ? (stats.correct / stats.bubblesAppeared) * 100
            : 0;

    const avgReaction =
        stats.reactionTimes.length
            ? stats.reactionTimes.reduce((a, b) => a + b) / stats.reactionTimes.length
            : 0;

    console.log("SESSION RESULT", {
        bubbles: stats.bubblesAppeared,
        correct: stats.correct,
        wrong: stats.wrong,
        clicks: stats.clicks,
        durationSec: durationSec.toFixed(2),
        accuracy: accuracy.toFixed(2),
        avgReactionMs: avgReaction.toFixed(0)
    });

    // 🔜 Result modal + CSV export next
}

// ===========================================
// START SCREEN
// ===========================================
if (startScreen) {
    startScreen.addEventListener("click", startGame);
}
