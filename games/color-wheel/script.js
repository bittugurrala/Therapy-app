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


// SOFT THERAPY COLORS (Alphabet & Number mode)
let therapyColors = [
    "#FFF6A3", "#A8D8FF", "#FFB7B2", "#B9F2C7", "#D8C5FF"
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
// GET EXISTING SYMBOLS (TEXT OR COLOR NAMES)
// ===========================================
function getRemainingSymbols() {

    if (mode === "colors") {
        let set = new Set();
        document.querySelectorAll(".bubble").forEach(b => {
            set.add(b.dataset.colorname);
        });
        return Array.from(set);
    }

    // alphabet & number modes
    let set = new Set();
    document.querySelectorAll(".bubble").forEach(b => {
        set.add(b.innerText);
    });
    return Array.from(set);
}


// ===========================================
// START A NEW LEVEL
// ===========================================
function startLevel() {
    bubbleContainer.innerHTML = "";
    bubblePositions = [];
    poppingTargetActive = false;

    for (let i = 0; i < 12; i++) {
        createBubble(randomSymbol());
    }

    setTimeout(() => chooseNextTarget(), 300);

}


// ===========================================
// RANDOM SYMBOL GENERATOR
// ===========================================
function randomSymbol() {
    if (mode === "alphabets") {
        const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        return letters[Math.floor(Math.random() * letters.length)];
    }

    if (mode === "numbers") {
        const nums = "0123456789";
        return nums[Math.floor(Math.random() * nums.length)];
    }

    if (mode === "colors") {
        return brightColors[Math.floor(Math.random() * brightColors.length)].name;
    }
}


// ===========================================
// CREATE BUBBLE (supports all 3 modes)
// ===========================================
function createBubble(symbol) {
    const bubble = document.createElement("div");
    bubble.classList.add("bubble");

    if (mode === "colors") {
        let colorObj = brightColors.find(c => c.name === symbol);

        bubble.style.background = colorObj.code;
        bubble.innerText = "";
        bubble.dataset.colorname = colorObj.name;   // STORE color name
    } else {
        bubble.innerText = symbol;
        bubble.style.background =
            therapyColors[Math.floor(Math.random() * therapyColors.length)];
    }

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

        if (!checkOverlap(pos, bubbleRadius)) {
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
// COLLISION CHECKkkkkkkkkkk
// ===========================================
function checkOverlap(pos, radius) {
    for (const p of bubblePositions) {
        const dx = p.x - pos.x;
        const dy = p.y - pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 12) return true;
    }
    return false;
}


// ===========================================
// CHOOSE NEXT TARGET
// ===========================================
function chooseNextTarget() {
    let remaining = getRemainingSymbols();

    if (remaining.length === 0) {
        setTimeout(startLevel, 400);
        return;
    }

    currentTarget = remaining[Math.floor(Math.random() * remaining.length)];

    if (mode === "colors") {
        let colorObj = brightColors.find(c => c.name === currentTarget);
        targetValueBox.innerText = currentTarget;
        targetValueBox.style.color = colorObj.code;

        setTimeout(() => {
            speak(currentTarget);
        }, 400);  // delay for smoothness
    } 
    else {
        targetValueBox.innerText = currentTarget;
        targetValueBox.style.color = "#ff5722";
        // speak("target" + currentTarget)

        setTimeout(() => {
            speak("target" + currentTarget);
        }, 400); // delay for alphabet/number too
    }

    poppingTargetActive = true;
}





// ===========================================
// CLICK HANDLER (updated for all modes)
// ===========================================
function handleBubbleClick(bubble) {

    if (!poppingTargetActive) return;

    let clickedValue =
        mode === "colors"
            ? bubble.dataset.colorname
            : bubble.innerText;

    if (clickedValue === currentTarget) {

        speak(clickedValue);

        bubble.classList.add("pop");

        setTimeout(() => {
            bubble.remove();

            let stillLeft = false;

            document.querySelectorAll(".bubble").forEach(b => {
                let value =
                    mode === "colors"
                        ? b.dataset.colorname
                        : b.innerText;
                if (value === currentTarget) stillLeft = true;
            });

            if (!stillLeft) {
                poppingTargetActive = false;

                // 500ms delay after popping last bubble
                setTimeout(() => {
                    chooseNextTarget();
                }, 600);
            }

        }, 250);

    } else {
        speak("wrong");
        bubble.classList.add("wrong");
        setTimeout(() => bubble.classList.remove("wrong"), 300);
    }
}


// ===========================================
// SPEED CONTROL
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
// MODE SWITCH (A <-> 1)
// ===========================================
document.querySelector(".modeSwitch").addEventListener("click", () => {
    mode = (mode === "alphabets") ? "numbers" : "alphabets";
    startLevel();
});


// ===========================================
// COLOR MODE SWITCH
// ===========================================
document.querySelector(".modeColors").addEventListener("click", () => {
    mode = "colors";
    startLevel();
});


// ===========================================
// PLAY / PAUSE
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
// QUIT GAME
// ===========================================
function quitGame() {
    bubbleContainer.innerHTML = "";
    targetValueBox.innerText = "";
    alert("Game Stopped");
}


// ===========================================
// TEXT TO SPEECH
// ===========================================
function speak(text) {
    const utter = new SpeechSynthesisUtterance();

    // If it's a single alphabet, speak only the letter sound
    if (mode !== "colors" && /^[A-Z]$/.test(text)) {
        utter.text = text;         // keep uppercase on screen
        utter.spellOut = true;     // <-- important for iPad
        utter.text = text.toLowerCase();  // but speak lowercase (prevents "CAPITAL")
    }
    else {
        utter.text = text;
    }

    utter.rate = 0.9;
    utter.pitch = 1.1;
    utter.volume = 1;

    speechSynthesis.speak(utter);
}


// ===========================================
// INIT GAME
// ===========================================
startLevel();
