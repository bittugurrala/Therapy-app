
document.addEventListener("DOMContentLoaded", () => {
    console.log("dashboard.js loaded");
    console.log("APP_DATA:", window.APP_DATA);

    renderDashboard();
});

// function renderDashboard() {
//     const main = document.getElementById("main-container");

//     if (!window.APP_DATA || !window.APP_DATA.therapies) {
//         console.error("APP_DATA not found");
//         return;
//     }

//     main.innerHTML = "";

//     window.APP_DATA.therapies.forEach(therapy => {
//         const card = document.createElement("div");
//         card.className = "module";

//         const title = document.createElement("p");
//         title.className = "heading";
//         title.innerText = therapy.title;

//         card.appendChild(title);

//         card.onclick = () => {
//             goToModule(therapy.id);
//         };

//         main.appendChild(card);
//     });
// }
function renderDashboard() {
    const main = document.getElementById("main-container");
    main.innerHTML = "";

    APP_DATA.therapies.forEach(therapy => {
        const card = document.createElement("div");
        card.className = "module";

        card.innerHTML = `<p class="heading">${therapy.title}</p>`;

        card.onclick = () => {
            navigateTo("module", { therapyId: therapy.id });
        };

        main.appendChild(card);
    });
}


function goToModule(moduleId) {
    // for now, just log
    console.log("Navigate to module:", moduleId);

    // later:
    // router.navigate(`/module.html?module=${moduleId}`)
}
