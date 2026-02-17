/* 
 * SORTING GAME - Plain JS Implementation
 * Therapy-ready, Metrics-rich, Lag-free Audio
 */

// ================= STATE MANAGEMENT =================
const state = {
    isGameReady: false,
    isGameStarted: false,
    currentAlphabetGroup: [],
    remainingAlphabets: [],
    startTime: 0,

    metrics: {
        correctClicks: 0,
        wrongClicks: 0,
        reactionTimes: [],      // { letter, time }
        wrongLetters: [],       // { expected, clicked, time }
        perLetterStats: {},     // A: { reactions:[], wrong:0 }
        lastClickTime: 0
    },

    settings: {
        letterSize: 1.8,
        bubbleSize: 90,
        patientName: "",
        themeColor: "blue",
        glowIntensity: 0.5
    }
};

const CONSTANTS = {
    INITIAL_BATCH_SIZE: 4,
    ALPHABETS: "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")
};

const THEMES = {
    blue:   { bg: "radial-gradient(circle at top, #e6faff, #8fdfff)", border: "#6fe3ff" },
    green:  { bg: "radial-gradient(circle at top, #e6ffea, #8fff9f)", border: "#6fff86" },
    purple: { bg: "radial-gradient(circle at top, #f3e6ff, #d48fff)", border: "#c06fff" },
    orange: { bg: "radial-gradient(circle at top, #fff5e6, #ffc98f)", border: "#ffb86f" }
};

// ================= DOM ELEMENTS =================
const els = {
    emoji: document.getElementById("emoji"),
    startScreen: document.getElementById("start-screen"),
    bubbleContainer: document.getElementById("bubble-container"),
    settingsModal: document.getElementById("settingsModal"),
    resultsModal: document.getElementById("resultsModal"),
    resultsContent: document.getElementById("resultsContent"),

    inputPatient: document.getElementById("setting-patient-name"),
    inputLetterSize: document.getElementById("setting-letter-size"),
    inputBubbleSize: document.getElementById("setting-bubble-size"),
    inputGlow: document.getElementById("setting-glow"),
    colorOptions: document.querySelectorAll(".color-option"),

    btnApply: document.getElementById("applySettings"),
    btnResultsClose: document.getElementById("resultsCloseBtn"),
    btnExport: document.getElementById("exportBtn"),

    statReaction: document.getElementById("stat-reaction"),
    statDuration: document.getElementById("stat-duration"),
    statClicks: document.getElementById("stat-clicks")
};

// ================= GAME START =================
document.addEventListener("DOMContentLoaded", () => {
    showModal(els.settingsModal);
});

// ================= SETTINGS =================
els.btnApply.addEventListener("click", () => {
    state.settings.patientName = els.inputPatient.value || "Anonymous";
    state.settings.letterSize = els.inputLetterSize.value;
    state.settings.bubbleSize = els.inputBubbleSize.value;
    state.settings.glowIntensity = els.inputGlow.value;
    state.isGameReady = true;
    hideModal(els.settingsModal);
});

els.emoji.addEventListener("click", () => {
    if (!state.isGameReady) return;
    startGame();
});
els.btnResultsClose.addEventListener("click", () => {
    hideModal(els.resultsModal);
    location.reload(); // simple reset for now
});


// ================= GAME LOGIC =================
function startGame() {
    state.isGameStarted = true;
    state.startTime = Date.now();
    state.metrics.lastClickTime = state.startTime;

    state.metrics.correctClicks = 0;
    state.metrics.wrongClicks = 0;
    state.metrics.reactionTimes = [];
    state.metrics.wrongLetters = [];
    state.metrics.perLetterStats = {};

    const alphabets = [...CONSTANTS.ALPHABETS];
    state.currentAlphabetGroup = [];
    state.remainingAlphabets = alphabets.slice(CONSTANTS.INITIAL_BATCH_SIZE);

    alphabets.slice(0, CONSTANTS.INITIAL_BATCH_SIZE).forEach(letter => {
        state.currentAlphabetGroup.push({ letter, ...findSafePosition() });
    });

    els.startScreen.style.display = "none";
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
        els.bubbleContainer.appendChild(createBubble(item));
    });
}

function createBubble(item) {
    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.innerText = item.letter;

    bubble.style.fontSize = state.settings.letterSize + "rem";
    bubble.style.width = bubble.style.height = state.settings.bubbleSize + "px";

    const theme = THEMES[state.settings.themeColor];
    bubble.style.background = theme.bg;
    bubble.style.border = `4px solid ${theme.border}`;

    bubble.style.left = item.x + "%";
    bubble.style.top = item.y + "%";
    bubble.style.transform = "translate(-50%, -50%)";

    bubble.onclick = (e) => handleBubbleClick(item.letter, bubble, e);
    return bubble;
}

// ================= CLICK HANDLER =================
function handleBubbleClick(letter, bubble, event) {
    event.stopPropagation();

    const expectedLetter = CONSTANTS.ALPHABETS[state.metrics.correctClicks];
    const now = Date.now();
    const reactionTime = now - state.metrics.lastClickTime;

    if (letter === expectedLetter) {
        state.metrics.correctClicks++;
        state.metrics.lastClickTime = now;

        state.metrics.reactionTimes.push({ letter, time: reactionTime });

        if (!state.metrics.perLetterStats[letter]) {
            state.metrics.perLetterStats[letter] = { reactions: [], wrong: 0 };
        }
        state.metrics.perLetterStats[letter].reactions.push(reactionTime);

        playAudio(true);
        bubble.classList.add("pop");
        updateLiveStats(reactionTime);

        setTimeout(() => {
            state.currentAlphabetGroup =
                state.currentAlphabetGroup.filter(l => l.letter !== letter);

            if (state.remainingAlphabets.length) {
                state.currentAlphabetGroup.push({
                    letter: state.remainingAlphabets.shift(),
                    ...findSafePosition()
                });
            }

            state.currentAlphabetGroup.length === 0
                ? endGame()
                : renderBubbles();
        }, 300);

    } else {
        state.metrics.wrongClicks++;

        state.metrics.wrongLetters.push({
            expected: expectedLetter,
            clicked: letter,
            time: now - state.startTime
        });

        if (!state.metrics.perLetterStats[expectedLetter]) {
            state.metrics.perLetterStats[expectedLetter] = { reactions: [], wrong: 0 };
        }
        state.metrics.perLetterStats[expectedLetter].wrong++;

        playAudio(false);
    }
}

// ================= END GAME =================
function endGame() {
    stopStatsTimer();
    showResultsModal();
}

// ================= RESULTS =================
function showResultsModal() {
    const duration = Math.floor((Date.now() - state.startTime) / 1000);

    els.resultsContent.innerHTML = `
        <p><b>Patient:</b> ${state.settings.patientName}</p>
        <p><b>Duration:</b> ${duration}s</p>
        <p><b>Correct:</b> ${state.metrics.correctClicks}</p>
        <p><b>Mistakes:</b> ${state.metrics.wrongClicks}</p>
        <hr/>
        ${generatePerLetterHTML()}
    `;

    showModal(els.resultsModal);
}

function generatePerLetterHTML() {
    return Object.entries(state.metrics.perLetterStats).map(([letter, data]) => {
        const avg = data.reactions.length
            ? Math.floor(data.reactions.reduce((a,b)=>a+b,0)/data.reactions.length)
            : "-";

        return `
            <div>
                <b>${letter}</b> — Avg RT: ${avg}ms | Mistakes: ${data.wrong}
            </div>
        `;
    }).join("");
}

// ================= STATS =================
let statsInterval;

function startStatsTimer() {
    statsInterval = setInterval(() => {
        els.statDuration.innerText =
            Math.floor((Date.now() - state.startTime) / 1000);
        els.statClicks.innerText =
            state.metrics.correctClicks + state.metrics.wrongClicks;
    }, 1000);
}

function stopStatsTimer() {
    clearInterval(statsInterval);
}

function updateLiveStats(rt) {
    els.statReaction.innerText = rt;
}

// ================= CSV EXPORT =================
els.btnExport.addEventListener("click", () => {
    const csv = JSON.stringify(state.metrics, null, 2);
    const blob = new Blob([csv], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "session_metrics.json";
    a.click();
});

// ================= MODALS =================
function showModal(el) {
    el.classList.remove("hidden");
    el.style.display = "flex";
}

function hideModal(el) {
    el.classList.add("hidden");
    setTimeout(() => el.style.display = "none", 200);
}

// ================= AUDIO =================
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playAudio(isCorrect) {
    if (audioCtx.state === "suspended") audioCtx.resume();

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (isCorrect) {
        osc.type = "sine";
        osc.frequency.setValueAtTime(500, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1000, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
    } else {
        osc.type = "sine";
        osc.frequency.setValueAtTime(300, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(180, audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.25);
    }
}
