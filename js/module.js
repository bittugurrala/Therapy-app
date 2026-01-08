// function renderModule(moduleId){
//     const main = document.getElementById("main-container");
//     main.innerHTML = "";

//     const therapy = APP_DATA.therapies.find(t => t.id === moduleId);


//     if (!module) return;

//     document.querySelector(".logo").innerText = module.title;

//     module.games.forEach(game => {
//         const card = document.createElement("div");
//         card.classList.add("module");

//         const title  = document.createElement("p");
//         title.classList.add("heading");
//         title.innerText =  game.title;

//         card.appendChild(title);

//         card.onclick = () => {
//             goToGame(game.id);
//         };
        
//         main.appendChild(card);
//     });
// }
function renderModule(therapyId) {
    const main = document.getElementById("main-container");
    main.innerHTML = "";

    const therapy = APP_DATA.therapies.find(t => t.id === therapyId);
    if (!therapy) return;

    therapy.games.forEach(game => {
        const card = document.createElement("div");
        card.className = "module";

        card.innerHTML = `<p class="heading">${game.title}</p>`;

        card.onclick = () => {
            goToModule(therapy.id);
        };


        main.appendChild(card);
    });

    // updateHeader(therapy.title);
}
