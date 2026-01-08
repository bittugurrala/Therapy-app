// =====================================
// APP STATE
// =====================================
window.APP_STATE = {
    view: "dashboard", // "dashboard" | "module" | "game"
    selectedTherapy: null,
    selectedGame: null
};

// =====================================
// APP DATA
// =====================================
window.APP_DATA = {
    therapies: [
        {
            id: "vision",
            title: "Vision Therapy",
            games: [
                {
                    id: "wheel",
                    title: "Rotating Wheel",
                    variants: [
                        { id: "capital", title: "Capital Letters" },
                        { id: "small", title: "Small Letters" },
                        { id: "colors", title: "Colors" },
                        { id: "fruits", title: "Fruits" }
                    ]
                },
                {
                    id: "alphabates",
                    title: "Alphabates",
                    variants: []
                }
            ]
        },
        {
            id: "speech",
            title: "Speech Therapy",
            games: [
                {
                    id: "wheel",
                    title: "Rotating Wheel",
                    variants: []
                }
            ]
        }
    ]
};

// =====================================
// RENDER CONTROLLER
// =====================================
function render() {
    if (APP_STATE.view === "dashboard") {
        renderDashboard();
    }

    if (APP_STATE.view === "module") {
        renderModule(APP_STATE.selectedTherapy);
    }

    if (APP_STATE.view === "game") {
        renderGame(APP_STATE.selectedGame);
    }

    updateBreadcrumb();
}

// =====================================
// DASHBOARD
// =====================================
function renderDashboard() {
    const main = document.querySelector(".main-container");
    main.innerHTML = "";

    APP_DATA.therapies.forEach(therapy => {
        const card = document.createElement("div");
        card.className = "module";

        card.innerHTML = `
            <p class="heading">${therapy.title}</p>
        `;

        card.onclick = () => {
            APP_STATE.view = "module";
            APP_STATE.selectedTherapy = therapy.id;
            render();
        };

        main.appendChild(card);
    });
}


// =====================================
// MODULE (THERAPY)
// =====================================
function renderModule(therapyId) {
    const therapy = APP_DATA.therapies.find(t => t.id === therapyId);
    if (!therapy) return;

    const main = document.querySelector(".main-container");
    main.innerHTML = "";

    therapy.games.forEach(game => {
        const card = document.createElement("div");
        card.className = "module";
        card.innerHTML = `<p class="heading">${game.title}</p>`;

        card.onclick = () => navigateToGame(game.id);

        main.appendChild(card);
    });
}

// =====================================
// GAME
// =====================================
function renderGame(gameId) {
    const main = document.querySelector(".main-container");

    main.innerHTML = `
        <div class="module">
            <p class="heading">Game Screen</p>
            <p>${gameId}</p>
        </div>
    `;
}

// =====================================
// NAVIGATION
// =====================================
function navigateToModule(therapyId) {
    APP_STATE.view = "module";
    APP_STATE.selectedTherapy = therapyId;
    APP_STATE.selectedGame = null;
    render();
}

function navigateToGame(gameId) {
    APP_STATE.view = "game";
    APP_STATE.selectedGame = gameId;
    render();
}

function goBack() {
    if (APP_STATE.view === "game") {
        APP_STATE.view = "module";
        APP_STATE.selectedGame = null;
    } else if (APP_STATE.view === "module") {
        APP_STATE.view = "dashboard";
        APP_STATE.selectedTherapy = null;
    }
    render();
}

// =====================================
// HEADER + BREADCRUMB
// =====================================
function updateBreadcrumb() {
    const breadcrumb = document.getElementById("breadcrumb");
    if (!breadcrumb) return;

    let path = ["Dashboard"];

    if (APP_STATE.selectedTherapy) {
        const therapy = APP_DATA.therapies.find(
            t => t.id === APP_STATE.selectedTherapy
        );
        if (therapy) path.push(therapy.title);
    }

    if (APP_STATE.selectedGame) {
        const therapy = APP_DATA.therapies.find(
            t => t.id === APP_STATE.selectedTherapy
        );
        const game = therapy?.games.find(
            g => g.id === APP_STATE.selectedGame
        );
        if (game) path.push(game.title);
    }

    breadcrumb.innerHTML = path.join(
        " <span class='sep'>›</span> "
    );
}

// =====================================
// INIT
// =====================================
document.addEventListener("DOMContentLoaded", () => {
    render();
});
