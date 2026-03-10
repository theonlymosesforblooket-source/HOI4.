let playerCountry = null;

const countries = {
    GER: { name: "Germany", factories: 8, stability: 0.6, warSupport: 0.4 },
    FRA: { name: "France", factories: 7, stability: 0.7, warSupport: 0.3 },
    UK:  { name: "United Kingdom", factories: 6, stability: 0.65, warSupport: 0.35 },
    SOV: { name: "Soviet Union", factories: 10, stability: 0.55, warSupport: 0.5 }
};

function pickCountry(tag) {
    playerCountry = tag;
    const c = countries[tag];

    document.getElementById("info").innerHTML = `
        <h2>You are now playing as ${c.name}</h2>
        <p>Factories: ${c.factories}</p>
        <p>Stability: ${Math.round(c.stability * 100)}%</p>
        <p>War Support: ${Math.round(c.warSupport * 100)}%</p>

        <button id="build">Build Factory</button>
        <button id="propaganda">Propaganda</button>
    `;

    enableActions();
}

function enableActions() {
    const c = countries[playerCountry];

    document.getElementById("build").onclick = () => {
        c.factories++;
        updatePanel();
    };

    document.getElementById("propaganda").onclick = () => {
        c.warSupport = Math.min(1, c.warSupport + 0.05);
        updatePanel();
    };
}

function updatePanel() {
    const c = countries[playerCountry];

    document.getElementById("info").innerHTML = `
        <h2>You are playing as ${c.name}</h2>
        <p>Factories: ${c.factories}</p>
        <p>Stability: ${Math.round(c.stability * 100)}%</p>
        <p>War Support: ${Math.round(c.warSupport * 100)}%</p>

        <button id="build">Build Factory</button>
        <button id="propaganda">Propaganda</button>
    `;

    enableActions();
}

document.querySelectorAll(".country").forEach(btn => {
    btn.addEventListener("click", () => {
        if (!playerCountry) {
            pickCountry(btn.dataset.tag);
        } else {
            const c = countries[btn.dataset.tag];
            document.getElementById("info").innerHTML = `
                <h2>${c.name}</h2>
                <p>Factories: ${c.factories}</p>
                <p>Stability: ${Math.round(c.stability * 100)}%</p>
                <p>War Support: ${Math.round(c.warSupport * 100)}%</p>
            `;
        }
    });
});
