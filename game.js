document.addEventListener("DOMContentLoaded", () => {

    const countries = {
        GER: { name: "Germany", factories: 8, stability: 0.6, warSupport: 0.4 },
        FRA: { name: "France", factories: 7, stability: 0.7, warSupport: 0.3 },
        UK:  { name: "United Kingdom", factories: 6, stability: 0.65, warSupport: 0.35 },
        SOV: { name: "Soviet Union", factories: 10, stability: 0.55, warSupport: 0.5 }
    };

    function showCountry(tag) {
        const c = countries[tag];
        document.getElementById("info").innerHTML = `
            <h2>${c.name}</h2>
            <p>Factories: ${c.factories}</p>
            <p>Stability: ${Math.round(c.stability * 100)}%</p>
            <p>War Support: ${Math.round(c.warSupport * 100)}%</p>
        `;
    }

    document.querySelectorAll(".country").forEach(btn => {
        btn.addEventListener("click", () => {
            showCountry(btn.dataset.tag);
        });
    });

});
