# Therapy-app

### file struc

therapy-app/
│
├── index.html                  ← Main Dashboard
├── module.html                 ← Generic module page (Vision / Speech / etc)
├── game.html                   ← Generic game container
│
├── css/
│   ├── base.css                ← global styles (touch lock, fonts, colors)
│   ├── layout.css              ← headers, grids, cards
│   ├── dashboard.css
│   ├── module.css
│   └── game.css
│
├── js/
│   ├── app.js                  ← app-wide init (touch lock, fullscreen)
│   ├── router.js               ← navigation + state
│   ├── data/
│   │   ├── modules.js          ← therapy modules list
│   │   └── games.js            ← games metadata
│   │
│   ├── dashboard.js
│   ├── module.js
│   └── game-loader.js          ← loads games dynamically
│
├── games/                      ← ⭐ THIS IS THE KEY
│   ├── rotating-wheel/
│   │   ├── index.html
│   │   ├── style.css
│   │   └── script.js
│   │
│   ├── color-match/
│   │   ├── index.html
│   │   ├── style.css
│   │   └── script.js
│   │
│   ├── direction-touch/
│   │   ├── index.html
│   │   ├── style.css
│   │   └── script.js
│   │
│   └── memory-lite/
│       ├── index.html
│       ├── style.css
│       └── script.js
│
├── assets/
│   ├── sounds/
│   ├── images/
│   └── icons/
│
└── README.md
