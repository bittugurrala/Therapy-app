/***********************
 * GLOBAL STATE
 ***********************/
window.APP_STATE = {
    view: "dashboard",          // dashboard | module | game
    selectedTherapy: null,
    selectedGame: null
};

/***********************
 * DATA
 ***********************/
window.APP_DATA = {
    therapies: [
        // Vision Therapy
        {
            id: "vision",
            title: "Vision Therapy",
            games: [
                // Rotating Wheel game
                {
                    id: "wheel",
                    title: "Rotating Wheel",
                    variants: [
                        // color variant
                        {
                            id: "color",
                            title: "Color Wheel",
                            url: "games/color-wheel/index.html"
                        },
                        // capital letters variant
                        {
                            id: "capital",
                            title: "Capital Letters",
                            url: "games/capital-letters/index.html"
                        },
                        // small letters variant
                        {
                            id: "small",
                            title: "Small Letters",
                            url: "games/small-letters/index.html"
                        }
                    ]
                },
                // Alphabets game
                {
                    id: "alphabets",
                    title: "Alphabets",
                    variants: [
                        {
                            id: "test",
                            title: "Test Variant",
                            url: "games/test/index.html"
                        }
                    ]
                }
            ]
        },
        // Speech Therapy
        {
            id: "speech",
            title: "Speech Therapy",
            games: [
                {
                    id: "coming",
                    title: "Coming Soon",
                    variants: []
                }
            ]
        }
    ]
};

/***********************
 * STATE HELPER
 ***********************/
function updateState(patch = {}) {
    Object.assign(window.APP_STATE, patch);
    render();
}

/***********************
 * RENDER CONTROLLER
 ***********************/
function render() {
    const main = document.querySelector(".main-container");
    if (!main) return;

    // ONLY place DOM is cleared
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

    // Game → Launch Variant (OPEN GAME URL)
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
            window.location.href = variant.url;
        } else {
            console.error("Variant URL missing:", card.dataset.variant);
        }
    }
}

/***********************
 * BREADCRUMB
 ***********************/
function updateBreadcrumb() {
    const breadcrumb = document.getElementById("breadcrumb");
    if (!breadcrumb) return;

    let path = ["Dashboard"];

    const therapy = APP_DATA.therapies.find(t => t.id === APP_STATE.selectedTherapy);
    if (therapy) path.push(therapy.title);

    const game = therapy?.games.find(g => g.id === APP_STATE.selectedGame);
    if (game) path.push(game.title);

    breadcrumb.innerHTML = path.join(" <span class='sep'>›</span> ");
}

/***********************
 * BACK BUTTON
 ***********************/
function goBack() {
    if (APP_STATE.view === "game") {
        updateState({ view: "module", selectedGame: null });
    }
    else if (APP_STATE.view === "module") {
        updateState({ view: "dashboard", selectedTherapy: null });
    }
}
window.goBack = goBack;

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
