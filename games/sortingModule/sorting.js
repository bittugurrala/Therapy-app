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
