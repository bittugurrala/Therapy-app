let gameReady = false;
let gameStarted = false;

document.addEventListener("DOMContentLoaded", () => {

const openEye = document.getElementById("eye-open");
const closedEye = document.getElementById("eye-closed");

let idleTimer;
let blinkInterval;

function blink() {
    openEye.style.display = "none";
    closedEye.style.display = "inline";

    setTimeout(() => {
        closedEye.style.display = "none";
        openEye.style.display = "inline";
    }, 1800);
}

function startBlinking() {
    blinkInterval = setInterval(blink, 2000);
}

function stopBlinking() {
    clearInterval(blinkInterval);
}

function resetIdleTimer() {
    stopBlinking();
    clearTimeout(idleTimer);

    idleTimer = setTimeout(() => {
        startBlinking();
    }, 2000);
}

["mousemove","keydown","click","touchstart"].forEach(evt => {
    document.addEventListener(evt, resetIdleTimer);
});

resetIdleTimer();

});
document.addEventListener("DOMContentLoaded", () => {
    const settingsModal = new bootstrap.Modal(
        document.getElementById("settingsModal")
    );
    settingsModal.show();
});

const gameSettings = {
    letterSize: 1.8,
    bubbleSize: 90,
    patientName: ""
};

document.getElementById("applySettings").addEventListener("click", () => {

    gameSettings.letterSize =
        document.getElementById("setting-letter-size").value;

    gameSettings.bubbleSize =
        document.getElementById("setting-bubble-size").value;

    gameSettings.patientName =
        document.getElementById("setting-patient-name").value;

    gameReady = true;

    bootstrap.Modal
        .getInstance(document.getElementById("settingsModal"))
        .hide();

});

document.getElementById("emoji").addEventListener("click", () => {
    if (!gameReady || gameStarted) return;

    gameStarted = true;
    startGame();
});


function enableEmojiStart() {
    const emoji = document.getElementById("emoji");
    emoji.style.cursor = "pointer";

    emoji.addEventListener("click", startGame, { once: true });
}

function startGame() {
    document.getElementById("emoji").style.display = "none";
    createAlphabetBubbles();
}


const alphabets = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
let expectedIndex = 0;

function createAlphabetBubbles() {
    const shuffled = alphabets.sort(() => Math.random() - 0.5);

    shuffled.forEach(letter => {
        const bubble = document.createElement("div");
        bubble.className = "bubble";
        bubble.innerText = letter;

        bubble.style.fontSize = gameSettings.letterSize + "rem";
        bubble.style.height = gameSettings.bubbleSize + "px";
        bubble.style.width = gameSettings.bubbleSize + "px";

        // random position
        bubble.style.left = Math.random() * 80 + "%";
        bubble.style.top = Math.random() * 80 + "%";

        bubble.onclick = () => handleBubbleClick(letter, bubble);

        document.getElementById("bubble-container").appendChild(bubble);
    });
}

function handleBubbleClick(letter, bubble) {
    if (letter === alphabets[expectedIndex]) {
        bubble.classList.add("pop");
        document.getElementById("correctSound").play();
        expectedIndex++;
    } else {
        document.getElementById("wrongSound").play();
    }
}


