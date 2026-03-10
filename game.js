/* ============================================================
   EU STRATEGY SPOOF — GAME.JS (PART 1)
   - 60 FPS loop
   - Canvas map
   - Country click detection
   - Modal confirm
   - Tick system
============================================================ */

let canvas = document.getElementById("eu-map");
let ctx = canvas.getContext("2d");

let modalBackdrop = document.getElementById("modal-backdrop");
let modalCountryName = document.getElementById("modal-country-name");
let modalConfirm = document.getElementById("modal-confirm-btn");
let modalCancel = document.getElementById("modal-cancel-btn");

let playAsBtn = document.getElementById("play-as-btn");

let tickInfo = document.getElementById("tick-info");
let dateLabel = document.getElementById("date-label");
let currentCountryLabel = document.getElementById("current-country-label");

let playerCountry = null;
let selectedCountry = null;

let tick = 0;
let gameSpeed = 1;
let paused = false;

/* ============================================================
   COUNTRY DATA
============================================================ */
const countries = {
    GER: {
        name: "Germany",
        color: "#4a4a9e",
        x: 420, y: 200, w: 80, h: 60,
        factories: 12,
        civ: 7,
        mil: 5,
        gdp: 120,
        stability: 0.65,
        focuses: ["Rebuild Industry", "Rearmament", "National Pride"]
    },
    FRA: {
        name: "France",
        color: "#9e4a4a",
        x: 350, y: 230, w: 70, h: 60,
        factories: 10,
        civ: 6,
        mil: 4,
        gdp: 110,
        stability: 0.70,
        focuses: ["Strengthen Democracy", "Colonial Investments"]
    },
    UK: {
        name: "United Kingdom",
        color: "#4a9e4a",
        x: 300, y: 150, w: 60, h: 50,
        factories: 9,
        civ: 5,
        mil: 4,
        gdp: 105,
        stability: 0.75,
        focuses: ["Royal Navy Expansion", "Industrial Aid"]
    },
    SOV: {
        name: "Soviet Union",
        color: "#9e9e4a",
        x: 520, y: 180, w: 120, h: 80,
        factories: 15,
        civ: 9,
        mil: 6,
        gdp: 140,
        stability: 0.55,
        focuses: ["Five-Year Plan", "Red Army Modernization"]
    }
};

/* ============================================================
   DRAW MAP (simple rectangles for now)
============================================================ */
function drawMap() {
    ctx.fillStyle = "#202020";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let tag in countries) {
        let c = countries[tag];
        ctx.fillStyle = c.color;
        ctx.fillRect(c.x, c.y, c.w, c.h);

        ctx.fillStyle = "white";
        ctx.font = "14px Arial";
        ctx.fillText(tag, c.x + 5, c.y + 20);
    }
}

/* ============================================================
   COUNTRY CLICK DETECTION
============================================================ */
canvas.addEventListener("click", (e) => {
    let rect = canvas.getBoundingClientRect();
    let mx = e.clientX - rect.left;
    let my = e.clientY - rect.top;

    selectedCountry = null;

    for (let tag in countries) {
        let c = countries[tag];
        if (mx >= c.x && mx <= c.x + c.w &&
            my >= c.y && my <= c.y + c.h) {

            selectedCountry = tag;
            showCountryInfo(tag);

            // Enable "Play as" button
            playAsBtn.disabled = false;

            // Ask confirmation modal
            modalCountryName.textContent = countries[tag].name;
            modalBackdrop.classList.remove("hidden");
            return;
        }
    }
});

/* ============================================================
   MODAL CONFIRMATION
============================================================ */
modalConfirm.onclick = () => {
    if (selectedCountry) {
        playerCountry = selectedCountry;
        currentCountryLabel.textContent = "Playing as: " + countries[playerCountry].name;
        enableEconomyButtons();
        loadFocusTree(playerCountry);
    }
    modalBackdrop.classList.add("hidden");
};

modalCancel.onclick = () => {
    modalBackdrop.classList.add("hidden");
};

/* ============================================================
   SHOW COUNTRY INFO PANEL
============================================================ */
function showCountryInfo(tag) {
    let c = countries[tag];

    document.getElementById("country-info").innerHTML = `
        <p><strong>${c.name}</strong></p>
        <p>Factories: ${c.factories}</p>
        <p>Civilian: ${c.civ}</p>
        <p>Military: ${c.mil}</p>
        <p>GDP: ${c.gdp}</p>
        <p>Stability: ${Math.round(c.stability * 100)}%</p>
    `;
}

/* ============================================================
   ENABLE ECONOMY BUTTONS WHEN PLAYER SELECTED
============================================================ */
function enableEconomyButtons() {
    document.getElementById("build-civ-btn").disabled = false;
    document.getElementById("build-mil-btn").disabled = false;
    document.getElementById("tax-policy-btn").disabled = false;
}

/* ============================================================
   LOAD FOCUS TREE (placeholder)
============================================================ */
function loadFocusTree(tag) {
    let c = countries[tag];
    let tree = document.getElementById("focus-tree");

    tree.innerHTML = "";

    c.focuses.forEach(f => {
        let btn = document.createElement("button");
        btn.textContent = f;
        btn.style.display = "block";
        btn.style.marginBottom = "6px";
        tree.appendChild(btn);
    });
}

/* ============================================================
   GAME LOOP (60 FPS)
============================================================ */
function gameLoop() {
    if (!paused) {
        for (let i = 0; i < gameSpeed; i++) {
            tick++;
            tickInfo.textContent = "Tick: " + tick;
        }
    }

    drawMap();
    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
/* ============================================================
   PART 2 — ECONOMY, FOCUS TREE, MONTHLY TICKS
============================================================ */

let month = 0;
let year = 1936;

function advanceMonth() {
    month++;
    if (month >= 12) {
        month = 0;
        year++;
    }

    const monthNames = [
        "Jan","Feb","Mar","Apr","May","Jun",
        "Jul","Aug","Sep","Oct","Nov","Dec"
    ];

    dateLabel.textContent = `${monthNames[month]} ${year}`;

    if (playerCountry) {
        monthlyEconomyUpdate(playerCountry);
        updateFocusProgress(playerCountry);
    }
}

/* ============================================================
   ECONOMY SYSTEM
============================================================ */

function monthlyEconomyUpdate(tag) {
    let c = countries[tag];

    // GDP grows slightly each month
    c.gdp += Math.floor(c.gdp * 0.01);

    // Construction progress
    if (c.building) {
        c.building.progress++;

        if (c.building.progress >= c.building.time) {
            if (c.building.type === "civ") c.civ++;
            if (c.building.type === "mil") c.mil++;

            c.factories = c.civ + c.mil;
            c.building = null;
        }
    }

    updateEconomyPanel(tag);
}

function updateEconomyPanel(tag) {
    let c = countries[tag];

    document.getElementById("factories-value").textContent = c.factories;
    document.getElementById("civ-factories-value").textContent = c.civ;
    document.getElementById("mil-factories-value").textContent = c.mil;
    document.getElementById("gdp-value").textContent = c.gdp;
    document.getElementById("stability-value").textContent = Math.round(c.stability * 100) + "%";
}

/* ============================================================
   ECONOMY BUTTONS
============================================================ */

document.getElementById("build-civ-btn").onclick = () => {
    let c = countries[playerCountry];
    if (!c.building) {
        c.building = { type: "civ", progress: 0, time: 3 };
    }
};

document.getElementById("build-mil-btn").onclick = () => {
    let c = countries[playerCountry];
    if (!c.building) {
        c.building = { type: "mil", progress: 0, time: 4 };
    }
};

document.getElementById("tax-policy-btn").onclick = () => {
    let c = countries[playerCountry];

    // Simple tax toggle
    if (!c.taxHigh) {
        c.taxHigh = true;
        c.gdp += 10;
        c.stability -= 0.05;
    } else {
        c.taxHigh = false;
        c.stability += 0.05;
    }

    updateEconomyPanel(playerCountry);
};

/* ============================================================
   FOCUS TREE EXECUTION
============================================================ */

let activeFocus = null;

function loadFocusTree(tag) {
    let c = countries[tag];
    let tree = document.getElementById("focus-tree");
    tree.innerHTML = "";

    c.focuses.forEach(f => {
        let btn = document.createElement("button");
        btn.textContent = f;
        btn.style.display = "block";
        btn.style.marginBottom = "6px";

        btn.onclick = () => startFocus(tag, f);

        tree.appendChild(btn);
    });
}

function startFocus(tag, focusName) {
    if (activeFocus) return; // Only one at a time

    activeFocus = {
        name: focusName,
        progress: 0,
        time: 3 // 3 months
    };

    document.getElementById("focus-tree").innerHTML =
        `<p>Current Focus: <strong>${focusName}</strong></p>
         <p>Progress: <span id="focus-progress">0%</span></p>`;
}

function updateFocusProgress(tag) {
    if (!activeFocus) return;

    activeFocus.progress++;

    let percent = Math.floor((activeFocus.progress / activeFocus.time) * 100);
    document.getElementById("focus-progress").textContent = percent + "%";

    if (activeFocus.progress >= activeFocus.time) {
        applyFocusReward(tag, activeFocus.name);
        activeFocus = null;
        loadFocusTree(tag);
    }
}

function applyFocusReward(tag, focusName) {
    let c = countries[tag];

    if (focusName === "Rebuild Industry") c.civ += 1;
    if (focusName === "Rearmament") c.mil += 1;
    if (focusName === "National Pride") c.stability += 0.05;

    if (focusName === "Strengthen Democracy") c.stability += 0.1;
    if (focusName === "Colonial Investments") c.gdp += 20;

    if (focusName === "Royal Navy Expansion") c.mil += 1;
    if (focusName === "Industrial Aid") c.civ += 1;

    if (focusName === "Five-Year Plan") c.civ += 2;
    if (focusName === "Red Army Modernization") c.mil += 2;

    c.factories = c.civ + c.mil;
    updateEconomyPanel(tag);
}

/* ============================================================
   MONTHLY TICK HANDLER
============================================================ */

let tickCounter = 0;

function monthlyTickHandler() {
    tickCounter++;
    if (tickCounter >= 30) {
        tickCounter = 0;
        advanceMonth();
    }
}

/* Hook into the main loop from Part 1 */
const oldLoop = gameLoop;
gameLoop = function() {
    monthlyTickHandler();
    oldLoop();
};
/* ============================================================
   PART 3 — AI, WAR SYSTEM, SOUND EFFECTS
============================================================ */

/* ============================================================
   SOUND ENGINE (Web Audio API)
============================================================ */
let audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playBeep(freq = 440, duration = 0.1, volume = 0.2) {
    let osc = audioCtx.createOscillator();
    let gain = audioCtx.createGain();

    osc.frequency.value = freq;
    gain.gain.value = volume;

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

function soundClick() { playBeep(600, 0.05, 0.15); }
function soundFocusComplete() { playBeep(300, 0.2, 0.25); }
function soundFactoryBuilt() { playBeep(200, 0.15, 0.3); }
function soundWarDeclared() { playBeep(120, 0.3, 0.4); }

/* Hook sounds into UI */
canvas.addEventListener("click", soundClick);
modalConfirm.addEventListener("click", soundClick);
modalCancel.addEventListener("click", soundClick);

/* ============================================================
   WAR SYSTEM (simple scaffolding)
============================================================ */

let wars = []; // { attacker: "GER", defender: "FRA" }

function declareWar(attacker, defender) {
    wars.push({ attacker, defender });
    soundWarDeclared();
}

function countryStrength(tag) {
    let c = countries[tag];
    return c.mil * 10 + c.gdp * 0.1 + c.stability * 20;
}

/* ============================================================
   AI SYSTEM
============================================================ */

function aiTakeTurn(tag) {
    if (tag === playerCountry) return; // Player is not AI

    let c = countries[tag];

    // AI chooses random action
    let choice = Math.floor(Math.random() * 5);

    switch (choice) {
        case 0:
            // Build civ
            if (!c.building) {
                c.building = { type: "civ", progress: 0, time: 3 };
            }
            break;

        case 1:
            // Build mil
            if (!c.building) {
                c.building = { type: "mil", progress: 0, time: 4 };
            }
            break;

        case 2:
            // Adjust taxes
            if (!c.taxHigh) {
                c.taxHigh = true;
                c.gdp += 10;
                c.stability -= 0.05;
            } else {
                c.taxHigh = false;
                c.stability += 0.05;
            }
            break;

        case 3:
            // Start a focus if none active
            if (!activeFocus) {
                let f = c.focuses[Math.floor(Math.random() * c.focuses.length)];
                activeFocus = {
                    name: f,
                    progress: 0,
                    time: 3,
                    aiOwner: tag
                };
            }
            break;

        case 4:
            // AI may declare war if strong enough
            let targets = Object.keys(countries).filter(t => t !== tag);
            let target = targets[Math.floor(Math.random() * targets.length)];

            if (countryStrength(tag) > countryStrength(target) * 1.2) {
                declareWar(tag, target);
            }
            break;
    }
}

/* ============================================================
   AI MONTHLY HANDLER
============================================================ */

function aiMonthlyActions() {
    for (let tag in countries) {
        if (tag !== playerCountry) {
            aiTakeTurn(tag);
        }
    }
}

/* ============================================================
   EXTEND MONTHLY TICK (from Part 2)
============================================================ */

const oldAdvanceMonth = advanceMonth;
advanceMonth = function() {
    oldAdvanceMonth();

    // AI moves every month
    aiMonthlyActions();

    // If AI is doing a focus
    if (activeFocus && activeFocus.aiOwner) {
        activeFocus.progress++;

        if (activeFocus.progress >= activeFocus.time) {
            applyFocusReward(activeFocus.aiOwner, activeFocus.name);
            activeFocus = null;
        }
    }
};

/* ============================================================
   HOOK FACTORY COMPLETION SOUND
============================================================ */

const oldMonthlyEconomy = monthlyEconomyUpdate;
monthlyEconomyUpdate = function(tag) {
    let before = countries[tag].civ + countries[tag].mil;

    oldMonthlyEconomy(tag);

    let after = countries[tag].civ + countries[tag].mil;

    if (after > before) {
        soundFactoryBuilt();
    }
};

/* ============================================================
   HOOK FOCUS COMPLETE SOUND
============================================================ */

const oldApplyFocus = applyFocusReward;
applyFocusReward = function(tag, focusName) {
    oldApplyFocus(tag, focusName);
    soundFocusComplete();
};
/* ============================================================
   PART 4 — COMBAT SYSTEM + WAR UI
============================================================ */

/* ============================================================
   WAR PANEL UI
============================================================ */

let warPanel = document.createElement("div");
warPanel.className = "panel";
warPanel.innerHTML = `
    <h2>Wars</h2>
    <div id="war-list"><p>No active wars.</p></div>
`;
document.getElementById("ui-section").appendChild(warPanel);

function updateWarPanel() {
    let list = document.getElementById("war-list");

    if (wars.length === 0) {
        list.innerHTML = "<p>No active wars.</p>";
        return;
    }

    list.innerHTML = "";

    wars.forEach(w => {
        let atk = countries[w.attacker].name;
        let def = countries[w.defender].name;

        let div = document.createElement("div");
        div.style.marginBottom = "10px";
        div.innerHTML = `
            <strong>${atk}</strong> vs <strong>${def}</strong><br>
            <span id="war-${w.attacker}-${w.defender}">No battles yet.</span>
        `;
        list.appendChild(div);
    });
}

/* ============================================================
   COMBAT RESOLUTION
============================================================ */

function resolveBattle(attacker, defender) {
    let atk = countries[attacker];
    let def = countries[defender];

    // Strength formula
    let atkPower = atk.mil * 10 + atk.gdp * 0.1 + atk.stability * 20 + (Math.random() * 10);
    let defPower = def.mil * 10 + def.gdp * 0.1 + def.stability * 20 + (Math.random() * 10);

    // Casualties
    let atkLoss = Math.floor((defPower / 50) + Math.random() * 3);
    let defLoss = Math.floor((atkPower / 50) + Math.random() * 3);

    atk.mil = Math.max(0, atk.mil - atkLoss);
    def.mil = Math.max(0, def.mil - defLoss);

    atk.factories = atk.civ + atk.mil;
    def.factories = def.civ + def.mil;

    // Update UI
    let id = `war-${attacker}-${defender}`;
    let el = document.getElementById(id);
    if (el) {
        el.innerHTML = `
            Battle result:<br>
            ${atk.name} lost ${atkLoss} mil factories<br>
            ${def.name} lost ${defLoss} mil factories
        `;
    }

    // Check for collapse
    if (atk.mil <= 0) endWar(defender, attacker);
    if (def.mil <= 0) endWar(attacker, defender);
}

/* ============================================================
   END WAR
============================================================ */

function endWar(winner, loser) {
    wars = wars.filter(w => !(w.attacker === winner && w.defender === loser));

    // Winner gets GDP boost
    countries[winner].gdp += 30;
    countries[winner].stability += 0.05;

    // Loser gets wrecked
    countries[loser].gdp = Math.floor(countries[loser].gdp * 0.5);
    countries[loser].stability -= 0.2;

    updateWarPanel();
}

/* ============================================================
   MONTHLY WAR HANDLER
============================================================ */

function monthlyWarActions() {
    wars.forEach(w => {
        resolveBattle(w.attacker, w.defender);
    });
}

/* ============================================================
   HOOK INTO MONTHLY TICK
============================================================ */

const oldAdvanceMonth2 = advanceMonth;
advanceMonth = function() {
    oldAdvanceMonth2();

    // Resolve battles every month
    if (wars.length > 0) {
        monthlyWarActions();
    }

    updateWarPanel();
};
/* ============================================================
   PART 5 — MAP BORDERS, HOVER, FRONTLINES, ANIMATIONS
============================================================ */

let hoverCountry = null;
let battleFlash = []; // {x,y,life}

/* ============================================================
   HOVER DETECTION
============================================================ */
canvas.addEventListener("mousemove", (e) => {
    let rect = canvas.getBoundingClientRect();
    let mx = e.clientX - rect.left;
    let my = e.clientY - rect.top;

    hoverCountry = null;

    for (let tag in countries) {
        let c = countries[tag];
        if (mx >= c.x && mx <= c.x + c.w &&
            my >= c.y && my <= c.y + c.h) {
            hoverCountry = tag;
            return;
        }
    }
});

/* ============================================================
   DRAW COUNTRY BORDERS + HOVER GLOW
============================================================ */
function drawCountryBorders() {
    for (let tag in countries) {
        let c = countries[tag];

        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;
        ctx.strokeRect(c.x, c.y, c.w, c.h);

        if (hoverCountry === tag) {
            ctx.strokeStyle = "#ffff66";
            ctx.lineWidth = 3;
            ctx.strokeRect(c.x - 2, c.y - 2, c.w + 4, c.h + 4);
        }

        if (playerCountry === tag) {
            ctx.strokeStyle = "#66ff66";
            ctx.lineWidth = 3;
            ctx.strokeRect(c.x - 3, c.y - 3, c.w + 6, c.h + 6);
        }
    }
}

/* ============================================================
   FRONTLINE DRAWING (simple line between capitals)
============================================================ */
function drawFrontlines() {
    wars.forEach(w => {
        let atk = countries[w.attacker];
        let def = countries[w.defender];

        let ax = atk.x + atk.w / 2;
        let ay = atk.y + atk.h / 2;

        let dx = def.x + def.w / 2;
        let dy = def.y + def.h / 2;

        ctx.strokeStyle = "#ff4444";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(dx, dy);
        ctx.stroke();
    });
}

/* ============================================================
   BATTLE FLASH ANIMATION
============================================================ */
function addBattleFlash(x, y) {
    battleFlash.push({ x, y, life: 10 });
}

const oldResolveBattle = resolveBattle;
resolveBattle = function(attacker, defender) {
    let atk = countries[attacker];
    let def = countries[defender];

    // Add flash at midpoint
    let fx = (atk.x + atk.w / 2 + def.x + def.w / 2) / 2;
    let fy = (atk.y + atk.h / 2 + def.y + def.h / 2) / 2;
    addBattleFlash(fx, fy);

    oldResolveBattle(attacker, defender);
};

function drawBattleFlashes() {
    for (let i = battleFlash.length - 1; i >= 0; i--) {
        let f = battleFlash[i];

        ctx.fillStyle = `rgba(255, 200, 50, ${f.life / 10})`;
        ctx.beginPath();
        ctx.arc(f.x, f.y, 20 - f.life, 0, Math.PI * 2);
        ctx.fill();

        f.life--;
        if (f.life <= 0) battleFlash.splice(i, 1);
    }
}

/* ============================================================
   EXTEND MAIN DRAW LOOP
============================================================ */

const oldDrawMap = drawMap;
drawMap = function() {
    oldDrawMap();
    drawCountryBorders();
    drawFrontlines();
    drawBattleFlashes();
};
