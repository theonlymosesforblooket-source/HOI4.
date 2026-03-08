// HOI4 Prototype - Core Game Engine
class HOI4Game {
    constructor() {
        // Canvas & context
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');

        // Core state
        this.day = 1;
        this.selectedCountry = 'germany';

        // Countries
        this.countries = {
            germany: {
                manpower: 1000,
                civFactories: 20,
                milFactories: 15,
                steel: 50,
                divisions: 20,
                stability: 75,
                focuses: { current: null, progress: 0 },
                production: { rifles: 10, tanks: 2 },
                research: [{ name: 'Infantry I', progress: 35, duration: 70 }]
            },
            usa: {
                manpower: 2000,
                civFactories: 40,
                milFactories: 10,
                steel: 100,
                divisions: 15,
                stability: 70,
                focuses: { current: null, progress: 0 },
                production: { rifles: 8, tanks: 3 },
                research: []
            },
            uk: {
                manpower: 800,
                civFactories: 25,
                milFactories: 12,
                steel: 30,
                divisions: 18,
                stability: 80,
                focuses: { current: null, progress: 0 },
                production: { rifles: 7, tanks: 1 },
                research: []
            },
            ussr: {
                manpower: 3000,
                civFactories: 15,
                milFactories: 20,
                steel: 80,
                divisions: 35,
                stability: 60,
                focuses: { current: null, progress: 0 },
                production: { rifles: 12, tanks: 4 },
                research: []
            }
        };

        // Simple provinces
        this.provinces = [
            { x: 100, y: 200, w: 80, h: 60, owner: 'germany', color: '#ef4444' },
            { x: 220, y: 260, w: 70, h: 55, owner: 'usa', color: '#3b82f6' },
            { x: 320, y: 220, w: 75, h: 60, owner: 'uk', color: '#f59e0b' }
        ];

        // Init systems
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        this.initUI();
        this.initMouse();
        this.setupDiplomacy();

        this.updateStats();
        this.gameLoop();
    }

    resizeCanvas() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
    }

    initUI() {
        // Navigation tabs
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const target = e.target.dataset.target;
                this.showPanel(target, e);
            });
        });

        // Next Day (with AI tick)
        const nextDayBtn = document.getElementById('next-day');
        if (nextDayBtn) {
            nextDayBtn.addEventListener('click', () => {
                this.nextDay();
                this.aiTick();
                document.getElementById('day-counter').textContent = this.day;
            });
        }

        // Country selector
        const selectCountryBtn = document.getElementById('select-country');
        if (selectCountryBtn) {
            selectCountryBtn.addEventListener('click', () => {
                const select = document.getElementById('country-select');
                this.selectedCountry = select.value;
                this.updateStats();
                this.renderMap();
                this.logDebug(`Switched to ${this.selectedCountry.toUpperCase()}`);
            });
        }

        // Focus buttons
        document.querySelectorAll('.focus-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const focusName = e.target.dataset.focus;
                const country = this.countries[this.selectedCountry];

                country.focuses.current = focusName;
                country.focuses.progress = 0;

                document.querySelectorAll('.focus-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');

                this.logDebug(`Selected focus: ${focusName}`);
            });
        });

        // Production +/- buttons
        document.querySelectorAll('.production-line').forEach(line => {
            const type = line.dataset.type;
            const buttons = line.querySelectorAll('.prod-btn');

            buttons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const country = this.countries[this.selectedCountry];
                    if (e.target.textContent === '+') {
                        country.production[type] += 2;
                    } else {
                        country.production[type] = Math.max(0, country.production[type] - 2);
                    }
                    this.updateStats();
                });
            });
        });

        // Save button
        const saveBtn = document.getElementById('save-game');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveGame());
        }

        // Clear debug
        const clearDebugBtn = document.getElementById('clear-debug');
        if (clearDebugBtn) {
            clearDebugBtn.addEventListener('click', () => {
                const log = document.getElementById('debug-log');
                log.value = '';
            });
        }
    }

    initMouse() {
        this.canvas.addEventListener('mousedown', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const clickedProvince = this.provinces.find(p =>
                x >= p.x && x <= p.x + p.w &&
                y >= p.y && y <= p.y + p.h
            );

            if (clickedProvince) {
                if (clickedProvince.owner !== this.selectedCountry) {
                    this.logDebug(`Province owned by ${clickedProvince.owner.toUpperCase()}`);
                } else {
                    this.logDebug(`Selected own province (${clickedProvince.owner.toUpperCase()})`);
                }
                this.renderMap();
            }
        });

        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            this.canvas.style.cursor = 'default';
            this.provinces.forEach(p => {
                if (x >= p.x && x <= p.x + p.w &&
                    y >= p.y && y <= p.y + p.h) {
                    this.canvas.style.cursor = 'pointer';
                }
            });
        });
    }

    setupDiplomacy() {
        document.querySelectorAll('.diplo-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const text = e.target.parentElement.querySelector('span').textContent;
                if (text.includes('Improve Relations')) {
                    this.improveRelations('UK');
                } else if (text.includes('Trade Steel')) {
                    this.logDebug('Trade deal with USA initiated');
                } else if (text.includes('Justify War')) {
                    this.logDebug('War justification on Poland started');
                }
            });
        });
    }

    showPanel(panelId, e) {
        document.querySelectorAll('.panel').forEach(p => p.classList.add('hidden'));
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

        const panel = document.getElementById(panelId + '-panel');
        if (panel) panel.classList.remove('hidden');

        if (e && e.target) {
            e.target.classList.add('active');
        }
    }
    nextDay() {
        this.day++;

        const country = this.countries[this.selectedCountry];

        // --- Focus Progress ---
        if (country.focuses.current) {
            country.focuses.progress++;

            const percent = (country.focuses.progress / 70) * 100;
            const bar = document.getElementById('focus-progress-fill');
            if (bar) bar.style.width = percent + '%';

            if (country.focuses.progress >= 70) {
                const finished = country.focuses.current;
                this.applyFocusEffect(finished);

                country.focuses.current = null;
                country.focuses.progress = 0;

                document.querySelectorAll('.focus-btn').forEach(b => b.classList.remove('active'));
                this.logDebug(`Focus completed: ${finished}`);
            }
        }

        // --- Daily Growth ---
        country.manpower += Math.floor(country.stability / 10);
        country.milFactories += 0.01 * country.civFactories;

        // Steel consumption
        const steelUse = country.production.rifles * 0.1 + country.production.tanks * 0.5;
        country.steel = Math.max(0, country.steel + 2 - steelUse);

        // --- Research Progress ---
        country.research.forEach((tech, i) => {
            tech.progress++;
            const percent = (tech.progress / tech.duration) * 100;

            const bar = document.querySelectorAll('.research-progress')[i];
            if (bar) bar.style.width = percent + '%';
        });

        this.updateStats();
        this.renderMap();
    }

    applyFocusEffect(focus) {
        const c = this.countries[this.selectedCountry];

        switch (focus) {
            case 'rearm':
                c.milFactories += 5;
                c.divisions += 3;
                break;

            case 'alliance':
                c.stability += 10;
                break;

            case 'industry':
                c.civFactories += 8;
                break;

            case 'ideology':
                c.steel += 20;
                break;
        }

        this.logDebug(`Applied focus effect: ${focus}`);
    }

    updateStats() {
        const c = this.countries[this.selectedCountry];

        document.getElementById('manpower-stat').textContent = c.manpower.toLocaleString();
        document.getElementById('civ-factories-stat').textContent = Math.floor(c.civFactories);
        document.getElementById('mil-factories-stat').textContent = Math.floor(c.milFactories);
        document.getElementById('steel-stat').textContent = Math.floor(c.steel);
        document.getElementById('divisions-stat').textContent = c.divisions;
        document.getElementById('focus-stat').textContent = c.focuses.current || 'None';

        // Production
        document.getElementById('rifles-output').textContent = `+${c.production.rifles}/day`;
        document.getElementById('tanks-output').textContent = `+${c.production.tanks}/day`;
    }

    renderMap() {
        // Background
        this.ctx.fillStyle = '#0f0f23';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Provinces
        this.provinces.forEach(p => {
            const rgb = this.hexToRgb(p.color);
            const alpha = p.owner === this.selectedCountry ? 0.85 : 0.45;

            this.ctx.fillStyle = `rgba(${rgb}, ${alpha})`;
            this.ctx.fillRect(p.x, p.y, p.w, p.h);

            // Border
            this.ctx.strokeStyle = '#333';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(p.x, p.y, p.w, p.h);

            // Label
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(
                p.owner.toUpperCase(),
                p.x + p.w / 2,
                p.y + p.h / 2
            );
        });

        // Highlight selected country's provinces
        this.ctx.strokeStyle = '#22c55e';
        this.ctx.lineWidth = 3;

        this.provinces
            .filter(p => p.owner === this.selectedCountry)
            .forEach(p => this.ctx.strokeRect(p.x, p.y, p.w, p.h));

        // Grid overlay
        this.ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        this.ctx.lineWidth = 1;

        for (let x = 0; x < this.canvas.width; x += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }

        for (let y = 0; y < this.canvas.height; y += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }

    hexToRgb(hex) {
        const bigint = parseInt(hex.slice(1), 16);
        const r = (bigint >> 16) & 255;
        const g = (bigint >> 8) & 255;
        const b = bigint & 255;
        return `${r}, ${g}, ${b}`;
    }

    gameLoop() {
        this.renderMap();
        requestAnimationFrame(() => this.gameLoop());
    }

    logDebug(message) {
        const log = document.getElementById('debug-log');
        const timestamp = new Date().toLocaleTimeString();
        log.value += `[${timestamp}] ${message}\n`;
        log.scrollTop = log.scrollHeight;
    }

    improveRelations(target) {
        const c = this.countries[this.selectedCountry];
        c.stability += 2;
        this.logDebug(`Improved relations with ${target}`);
        this.updateStats();
    }
    saveGame() {
        const saveData = {
            day: this.day,
            selectedCountry: this.selectedCountry,
            countries: this.countries
        };

        localStorage.setItem('hoi4Prototype', JSON.stringify(saveData));
        this.logDebug('Game saved');
    }

    loadGame() {
        const saved = localStorage.getItem('hoi4Prototype');
        if (!saved) {
            this.logDebug('No save file found');
            return;
        }

        const data = JSON.parse(saved);
        this.day = data.day;
        this.selectedCountry = data.selectedCountry;
        this.countries = data.countries;

        document.getElementById('day-counter').textContent = this.day;

        this.updateStats();
        this.renderMap();
        this.logDebug('Game loaded');
    }

    createDivision(type = 'infantry') {
        const c = this.countries[this.selectedCountry];

        if (c.manpower < 10 || c.steel < 5) {
            this.logDebug('Not enough resources to create division');
            return;
        }

        c.manpower -= 10;
        c.steel -= 5;
        c.divisions++;

        this.logDebug(`Created new ${type} division`);
        this.updateStats();
    }

    attackProvince(attackerCountry, defenderCountry) {
        const atk = this.countries[attackerCountry];
        const def = this.countries[defenderCountry];

        const attackPower = atk.divisions * 5 + Math.random() * 20;
        const defendPower = def.divisions * 6 + Math.random() * 15;

        if (attackPower > defendPower) {
            this.logDebug(
                `Attack succeeds! (${attackPower.toFixed(1)} vs ${defendPower.toFixed(1)})`
            );
            return true;
        } else {
            this.logDebug(
                `Attack fails! (${attackPower.toFixed(1)} vs ${defendPower.toFixed(1)})`
            );
            return false;
        }
    }

    aiTick() {
        Object.keys(this.countries).forEach(name => {
            if (name === this.selectedCountry) return;

            const c = this.countries[name];

            // AI growth
            c.manpower += Math.floor(c.manpower * 0.001);
            c.milFactories += 0.005;

            // AI division growth (fixed)
            if (Math.random() < 0.1) {
                c.divisions++;
            }
        });
    }

    drawFrontline(startX, startY, endX, endY) {
        this.ctx.strokeStyle = '#ff0000';
        this.ctx.lineWidth = 4;
        this.ctx.setLineDash([10, 10]);

        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        this.ctx.lineTo(endX, endY);
        this.ctx.stroke();

        this.ctx.setLineDash([]);
    }

    exportGameState() {
        const dataStr = JSON.stringify(this.countries, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = 'hoi4-save.json';
        link.click();

        URL.revokeObjectURL(url);
        this.logDebug('Exported game state');
    }
}

// ⭐ CRITICAL: This boots the game and makes the map render
window.onload = () => {
    new HOI4Game();
};
