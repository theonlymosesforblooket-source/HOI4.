// GameJS-style engine (canvas + loop)
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const nextDayBtn = document.getElementById('next-day');
const statsDiv = document.getElementById('country-stats');

// Game state
let game = {
    day: 0,
    selectedCountry: 'germany',  // Start as Germany
    countries: {
        germany: {
            manpower: 1000, civFactories: 20, milFactories: 15, steel: 50,
            focuses: { current: null, progress: 0, tree: ['rearm', 'alliance', 'ideology'] },
            production: { rifles: 10, tanks: 2 },
            divisions: 20
        },
        usa: { manpower: 2000, civFactories: 40, milFactories: 10, steel: 100, divisions: 15 }
        // Add more...
    }
};

// Simple map (provinces as rects; draw Europe stub)
const provinces = [
    { x: 100, y: 200, w: 60, h: 40, owner: 'germany', color: '#ff6b6b' },  // Germany core
    { x: 200, y: 300, w: 50, h: 50, owner: 'usa', color: '#4ecdc4' }     // USA (placeholder)
];

// Game loop (60 FPS render, but logic on button/day tick)
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw map
    provinces.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.strokeStyle = '#333'; ctx.lineWidth = 2; ctx.strokeRect(p.x, p.y, p.w, p.h);
        ctx.fillStyle = 'white'; ctx.font = '12px Arial'; ctx.fillText(p.owner, p.x + 5, p.y + 20);
    });
    
    // Draw UI elements (focus progress bar)
    const country = game.countries[game.selectedCountry];
    if (country.focuses.current) {
        ctx.fillStyle = 'rgba(0,255,0,0.3)'; ctx.fillRect(800, 50, (country.focuses.progress / 70) * 200, 20);
        ctx.strokeRect(800, 50, 200, 20);
    }
    
    requestAnimationFrame(gameLoop);
}

// Day tick (advance time, update systems)
function nextDay() {
    game.day++;
    const country = game.countries[game.selectedCountry];
    
    // Focus progress (70 days per focus)
    if (country.focuses.current) {
        country.focuses.progress++;
        if (country.focuses.progress >= 70) {
            applyFocusEffect(country.focuses.current);
            country.focuses.current = null;  // Pick next?
            country.focuses.progress = 0;
        }
    }
    
    // Production tick (simplified)
    country.manpower += 5;  // Daily recruit
    country.milFactories += 0.01;  // Slow growth
    
    updateStats();
}

// Apply focus effects
function applyFocusEffect(focus) {
    const country = game.countries[game.selectedCountry];
    if (focus === 'rearm') country.milFactories += 5;
    else if (focus === 'alliance') console.log('Alliance formed!');
    // Expand with more...
}

// Update UI stats
function updateStats() {
    const country = game.countries[game.selectedCountry];
    statsDiv.innerHTML = `
        Day: ${game.day}<br>
        Manpower: ${country.manpower}<br>
        Civ Factories: ${country.civFactories}<br>
        Mil Factories: ${country.milFactories}<br>
        Divisions: ${country.divisions}
    `;
}

// Event listeners
nextDayBtn.onclick = nextDay;

// Init
updateStats();
gameLoop();
