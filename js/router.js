let appState = {
    currentScreen: "dashboard",
    currentModule: null,
    currentGame : null,
};

function  goToDashboard(){
    appState.currentScreen = "dashboard";
    appState.currentModule = null;
    appState.currentGame = null;

    renderDashboard();
}

function goToModule(moduleId){
    appState.currentScreen = "module";
    appState.currentModule = moduleId;
    appState.currentGame = null;

    renderModule(moduleId);
}

function goToGame(gameId){
    appState.currentScreen = "game";
    appState.currentGame = gameId;

    renderGame(gameId);
}
function navigateTo(view, payload = {}) {
    APP_STATE.view = view;

    if (view === "module") {
        APP_STATE.selectedTherapy = payload.therapyId;
    }

    if (view === "game") {
        APP_STATE.selectedGame = payload.gameId;
    }

    render();
}
