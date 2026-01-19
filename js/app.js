/***********************
 * GLOBAL STATE
 ***********************/
window.APP_STATE = {
    view: "dashboard", // dashboard | module | game
    selectedTherapy: null,
    selectedGame: null
};

/***********************
 * DATA
 ***********************/
window.APP_DATA = {
    therapies: [
        {
            // Vision Therapy
            id: "vision",
            title: "Vision Therapy",
            games: [
                {
                    // First Game Variants in Vision Therapy
                    id: "wheel",
                    title: "Rotatory Module",
                    variants: [
                        {
                            id: "rotationUppercase",
                            title: "Uppercase Rotatory",
                            url: "games/rotatoryModule/uppercaseWheel/index.html"
                        },
                        {
                            id: "rotationLowercase",
                            title: "Lowercase Rotatory",
                            url: "games/rotatoryModule/lowercaseWheel/index.html"
                        },
                        {
                            id: "rotationNumbers",
                            title: "Numeric Rotatory",
                            url: "games/rotatoryModule/numericWheel/index.html"
                        },
                        {
                            id: "rotationColors",
                            title: "Color Discriminant",
                            url: "games/rotatoryModule/colorDiscriminant/index.html"
                        }
                    ]
                },
                {
                    // Second Game Variant in Vision Therapy
                    id: "sorting",
                    title: "Sorting Module",
                    variants: [
                        {
                            id: "SortUppercase",
                            title: "Uppercase Alphabet Sorting",
                            url: "games/test/index.html"
                        },
                        {
                            id: "SortLowercase",
                            title: "Lowercase Alphabet Sorting",
                            url: "games/test/index.html"
                        },
                        {
                            id: "SortNumbers",
                            title: "Numeric Sorting",
                            url: "games/test/index.html"
                        }
                    ]
                }
            ]
        },
        // Uncomment when games are ready Therapy
        // {
        //     id: "speech",
        //     title: "Speech Therapy",
        //     games: [
        //         {
        //             id: "coming",
        //             title: "Coming Soon",
        //             variants: []
        //         }
        //     ]
        // }
    ]
};

/***********************
 * STATE HELPER
 ***********************/
function updateState(patch = {}) {
    Object.assign(APP_STATE, patch);
    render();
}

/***********************
 * RENDER CONTROLLER
 ***********************/
function render() {
    const main = document.querySelector(".main-container");
    if (!main) return;

    main.innerHTML = "";

    if (APP_STATE.view === "dashboard") {
        renderDashboard();
    }
    else if (APP_STATE.view === "module" && APP_STATE.selectedTherapy) {
        renderModule(APP_STATE.selectedTherapy);
    }
    else if (APP_STATE.view === "game" && APP_STATE.selectedGame) {
        renderGame(APP_STATE.selectedGame);
    }

    updateBreadcrumb();
}

/***********************
 * DASHBOARD
 ***********************/
function renderDashboard() {
    const main = document.querySelector(".main-container");

    APP_DATA.therapies.forEach(therapy => {
        const card = document.createElement("div");
        card.className = "module";
        card.dataset.therapy = therapy.id;
        card.innerHTML = `<p class="heading">${therapy.title}</p>`;
        main.appendChild(card);
    });
}

/***********************
 * MODULE (GAMES)
 ***********************/
function renderModule(therapyId) {
    const therapy = APP_DATA.therapies.find(t => t.id === therapyId);
    if (!therapy) return;

    const main = document.querySelector(".main-container");

    therapy.games.forEach(game => {
        const card = document.createElement("div");
        card.className = "module";
        card.dataset.game = game.id;
        card.innerHTML = `<p class="heading">${game.title}</p>`;
        main.appendChild(card);
    });
}

/***********************
 * GAME (VARIANTS)
 ***********************/
function renderGame(gameId) {
    const therapy = APP_DATA.therapies.find(t => t.id === APP_STATE.selectedTherapy);
    const game = therapy?.games.find(g => g.id === gameId);
    if (!game) return;

    const main = document.querySelector(".main-container");

    if (!game.variants || game.variants.length === 0) {
        const card = document.createElement("div");
        card.className = "module";
        card.innerHTML = `<p class="heading">Coming Soon</p>`;
        main.appendChild(card);
        return;
    }

    game.variants.forEach(variant => {
        const card = document.createElement("div");
        card.className = "module";
        card.dataset.variant = variant.id;
        card.innerHTML = `<p class="heading">${variant.title}</p>`;
        main.appendChild(card);
    });
}

/***********************
 * EVENT DELEGATION
 ***********************/
function onMainContainerClick(e) {
    const card = e.target.closest(".module");
    if (!card) return;

    // Dashboard → Module
    if (card.dataset.therapy) {
        updateState({
            view: "module",
            selectedTherapy: card.dataset.therapy,
            selectedGame: null
        });
        return;
    }

    // Module → Game
    if (card.dataset.game) {
        updateState({
            view: "game",
            selectedGame: card.dataset.game
        });
        return;
    }

    // Game → Launch Variant
    if (card.dataset.variant) {
        const therapy = APP_DATA.therapies.find(
            t => t.id === APP_STATE.selectedTherapy
        );
        const game = therapy?.games.find(
            g => g.id === APP_STATE.selectedGame
        );
        const variant = game?.variants.find(
            v => v.id === card.dataset.variant
        );

        if (variant?.url) {
            launchGame(variant.url);
        } else {
            console.error("Variant URL missing");
        }
    }
}

/***********************
 * GAME OVERLAY (FULLSCREEN)
 ***********************/
function launchGame(url) {
    const overlay = document.getElementById("game-overlay");
    const frame = document.getElementById("game-frame");

    frame.src = url;
    overlay.classList.remove("hidden");

    enterFullscreen();
}

function exitGame() {
    const overlay = document.getElementById("game-overlay");
    const frame = document.getElementById("game-frame");

    frame.src = "";
    overlay.classList.add("hidden");

    exitFullscreen();

    // Go back to variants
    APP_STATE.view = "game";
    render();
}

/***********************
 * FULLSCREEN HELPERS
 ***********************/
function isFullscreen() {
    return !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement
    );
}

function enterFullscreen() {
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen();
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
}

function exitFullscreen() {
    if (document.exitFullscreen) document.exitFullscreen();
    else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
}

function toggleFullscreen() {
    if (isFullscreen()) exitFullscreen();
    else enterFullscreen();
}

/***********************
 * BREADCRUMB
 ***********************/
function updateBreadcrumb() {
    const breadcrumb = document.getElementById("breadcrumb");
    if (!breadcrumb) return;

    breadcrumb.innerHTML = "";

    const path = [{ title: "Dashboard", view: "dashboard" }];

    const therapy = APP_DATA.therapies.find(
        t => t.id === APP_STATE.selectedTherapy
    );
    if (therapy) path.push({ title: therapy.title, view: "module" });

    const game = therapy?.games.find(
        g => g.id === APP_STATE.selectedGame
    );
    if (game) path.push({ title: game.title, view: "game" });

    path.forEach((item, index) => {
        const span = document.createElement("span");
        span.className = "breadcrumb-item";
        span.innerText = item.title;
        span.style.cursor = "pointer";

        span.onclick = () => {
            if (item.view === "dashboard") {
                updateState({
                    view: "dashboard",
                    selectedTherapy: null,
                    selectedGame: null
                });
            }
            else if (item.view === "module") {
                updateState({
                    view: "module",
                    selectedGame: null
                });
            }
            else if (item.view === "game") {
                updateState({ view: "game" });
            }
        };

        breadcrumb.appendChild(span);

        if (index < path.length - 1) {
            breadcrumb.appendChild(document.createTextNode(" › "));
        }
    });
}

/***********************
 * FULLSCREEN CHANGE LISTENER
 ***********************/
document.addEventListener("fullscreenchange", () => {
    console.log("Fullscreen changed:", isFullscreen());
});

/***********************
 * INIT
 ***********************/
document.addEventListener("DOMContentLoaded", () => {
    const main = document.querySelector(".main-container");
    if (main) {
        main.addEventListener("click", onMainContainerClick);
    }
    render();
});

/***********************
 * EXPOSE GLOBALS
 ***********************/
window.exitGame = exitGame;
window.toggleFullscreen = toggleFullscreen;
