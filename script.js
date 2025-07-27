document.addEventListener('DOMContentLoaded', () => {

    // ===================================================================================
    // === SINGLE SOURCE OF TRUTH (ACTUALIZADO CON DEMANDA Y VALOR O/C) ===
    // ===================================================================================
    const currencyTiers = {
        'diamonds': [
            { threshold: 50000, value: parseValue("3B") }, { threshold: 35000, value: parseValue("2.7B") },
            { threshold: 25000, value: parseValue("2.4B") }, { threshold: 15000, value: 2.2e9 },
            { threshold: 10000, value: 2e9 }, { threshold: 5000, value: 1.8e9 },
            { threshold: 3000, value: 1.7e9 }, { threshold: 1000, value: 1.6e9 },
            { threshold: 0, value: 1.5e9 }
        ],
        'heartstones': [
            { threshold: 50000, value: parseValue("775M") }, { threshold: 35000, value: parseValue("725M") },
            { threshold: 25000, value: parseValue("650M") }, { threshold: 15000, value: 625e6 },
            { threshold: 10000, value: 600e6 }, { threshold: 5000, value: 575e6 },
            { threshold: 3000, value: 550e6 }, { threshold: 1000, value: 525e6 },
            { threshold: 0, value: 500e6 }
        ]
    };

    const appData = {
        currencies: {
            "time": { name: "Time", icon: null },
            "diamonds": { name: "Diamonds", icon: "images/diamonds.png" },
            "heartstones": { name: "Heartstones", icon: "images/heartstones.png" }
        },
        cases: {
            "beginner_case": {
                name: "BEGINNER CASE", image: "images/beginner-case2.png", price: 200, currency: "time", borderColor: "var(--main-green)",
                rewards: [
                    { id: "plastic-sword", name: "Plastic Sword", image: "images/plastic-sword.png", chance: 40, value: 80, stats: "x1.3", rarity: "common", exist: "N/A", lastUpdated: "2025-07-21T11:32:00Z" },
                    { id: "marshmallow", name: "Marshmallow", image: "images/marshmallow.png", chance: 34, value: 350, stats: "x2.3", rarity: "uncommon", exist: "N/A", lastUpdated: "2025-07-21T12:00:00Z" },
                    { id: "alien", name: "Alien", image: "images/alien.png", chance: 20, value: 1200, stats: "x3.6", rarity: "rare", exist: "N/A", lastUpdated: "2025-07-21T14:10:00Z" },
                    { id: "bombastic", name: "Bombastic", image: "images/bombastic.png", chance: 5, value: 10000, stats: "x5.2", rarity: "epic", exist: "N/A", lastUpdated: "2025-07-19T18:00:00Z" },
                    { id: "excalibur", name: "Excalibur", image: "images/excalibur.png", chance: 1, value: 75000, stats: "x6.5", rarity: "legendary", exist: "N/A", lastUpdated: "2025-07-20T10:00:00Z", description: "A legendary sword of ancient kings. Only obtainable from the [case:beginner_case].", demand: "high" },
                ]
            },
            "vengeful_case": {
                name: "VENGEFUL CASE", image: "images/vengeful-case.png", price: 1500, currency: "time", borderColor: "var(--vengeful-red)",
                rewards: [
                    { id: "bloody-sword", name: "Bloody Sword", image: "images/bloody-sword.png", chance: 48, value: 600, stats: "x1.7", rarity: "common", exist: "N/A", lastUpdated: "2025-07-21T11:00:00Z", demand: "low" },
                    { id: "imaginary-sword", name: "Imaginary Sword", image: "images/imaginary-sword.png", chance: 38, value: 2500, stats: "x3.3", rarity: "uncommon", exist: "N/A", lastUpdated: "2025-06-30T22:00:00Z" },
                    { id: "claustrophobia", name: "Claustrophobia", image: "images/claustrophobia.png", chance: 12.8, value: 9000, stats: "x5.2", rarity: "rare", exist: "N/A", lastUpdated: "2025-07-15T15:20:00Z", demand: "medium" },
                    { id: "demon-axe", name: "Demon Axe", image: "images/demon-axe.png", chance: 1.2, value: 250000, stats: "x10.2", rarity: "legendary", exist: "N/A", lastUpdated: "2025-07-21T09:55:00Z" },
                ]
            },
             "void_case": {
                name: "VOID CASE", image: "images/void-case.png", price: 4500, currency: "time", borderColor: "#1c3e7eff",
                rewards: [
                    { id: "black-fire", name: "Black Fire", image: "images/black-fire.png", chance: 35, value: 1000, stats: "x2.1", rarity: "common", exist: "N/A", lastUpdated: "2025-07-21T11:00:00Z" },
                    { id: "dark-glitch", name: "Dark Glitch", image: "images/dark-glitch.png", chance: 30, value: 8000, stats: "x3.9", rarity: "uncommon", exist: "N/A", lastUpdated: "2025-06-30T22:00:00Z" },
                    { id: "rainbow-void", name: "Rainbow Void", image: "images/rainbow-void.png", chance: 25.6, value: 20000, stats: "x6.3", rarity: "rare", exist: "N/A", lastUpdated: "2025-07-15T15:20:00Z" },
                    { id: "infinity-void", name: "Infinity Void", image: "images/infinity-void.png", chance: 10.2, value: 45000, stats: "x9.6", rarity: "epic", exist: "N/A", lastUpdated: "2025-07-21T09:55:00Z" },
                    { id: "pure-darkness", name: "Pure Darkness", image: "images/pure-darkness.png", chance: 1.5, value: 120000, stats: "x12.9", rarity: "legendary", exist: "N/A", lastUpdated: "2025-07-21T09:55:00Z" },
                    { id: "tenebris", name: "Tenebris", image: "images/tenebris.png", chance: 0.1, value: "1.5M", stats: "x19.4", rarity: "godly", exist: "N/A", lastUpdated: "2025-07-25T19:43:00Z" },
                ]
            },
            "freeeee": {
                name: "FREEEEE", image: "images/freeeee.png", price: 2, currency: "cooldown", borderColor: "#3be72bff",
                rewards: [
                    { id: "twig", name: "Twig", image: "images/twig.png", chance: 52, value: "N/A", stats: "x2.3", rarity: "common", exist: "N/A", lastUpdated: "2025-07-21T11:00:00Z" },
                    { id: "ghost-machette", name: "Ghost Machette", image: "images/ghost-machette.png", chance: 34, value: "N/A", stats: "x6.5", rarity: "uncommon", exist: "N/A", lastUpdated: "2025-06-30T22:00:00Z" },
                    { id: "dark-mastery", name: "Dark Mastery", image: "images/dark-mastery.png", chance: 13.7, value: "N/A", stats: "x17.4", rarity: "epic", exist: "N/A", lastUpdated: "2025-07-15T15:20:00Z" },
                    { id: "death-speaker", name: "Death Speaker", image: "images/death-speaker.png", chance: 0.22, value: "500b", stats: "x73", rarity: "legendary", exist: "N/A", lastUpdated: "2025-07-21T09:55:00Z" },
                    { id: "limitless", name: "Limitless", image: "images/limitless.png", chance: 0.07, value: "8T-10T", stats: "x140.3", rarity: "godly", exist: "N/A", lastUpdated: "2025-07-21T09:55:00Z" },
                    { id: "ghost-star", name: "Ghost Star", image: "images/ghost-star.png", chance: 0.01, value: "O/C[300T-390T]", stats: "x190", rarity: "mythic", exist: "N/A", lastUpdated: "2025-07-25T19:43:00Z", demand: "insane" },
                ]
            },
            "neon-red-dilemma": {
                name: "NEON RED DILEMMA", image: "images/neon-red-dilemma.png", price: 10, currency: "heartstones", borderColor: "#ff7ae9ff",
                rewards: [
                    { id: "heat", name: "Heat", image: "images/heat.png", chance: 37, value: "N/A", stats: "x2.3", rarity: "common", exist: "N/A", lastUpdated: "2025-07-21T11:00:00Z" },
                    { id: "erythrophobia", name: "Erythrophobia", image: "images/erythrophobia.png", chance: 30, value: "N/A", stats: "x6.5", rarity: "uncommon", exist: "N/A", lastUpdated: "2025-06-30T22:00:00Z" },
                    { id: "the-hitbox", name: "The Hitbox", image: "images/the-hitbox.png", chance: 16, value: "N/A", stats: "x7.6", rarity: "rare", exist: "N/A", lastUpdated: "2025-07-15T15:20:00Z" },
                    { id: "pink-ice", name: "Pink Ice", image: "images/pink-ice.png", chance: 14.33, value: "N/A", stats: "x13.4", rarity: "epic", exist: "N/A", lastUpdated: "2025-07-21T09:55:00Z" },
                    { id: "dark-light", name: "Dark Light", image: "images/dark-light.png", chance: 2.5, value: "N/A", stats: "x42.3", rarity: "legendary", exist: "N/A", lastUpdated: "2025-07-21T09:55:00Z" },
                    { id: "emerald-blade", name: "Emerald Blade", image: "images/emerald-blade.png", chance: 0.15, value: "N/A", stats: "x160.4", rarity: "godly", exist: "N/A", lastUpdated: "2025-07-25T19:43:00Z" },
                    { id: "monochrome-caeruleum", name: "Monochrome Caeruleum", image: "images/monochrome-caeruleum.png", chance: 0.015, value: "6T", stats: "x394", rarity: "insane", exist: "N/A", lastUpdated: "2025-07-25T19:43:00Z", demand: "low" },
                    { id: "monochrome-ablus", name: "Monochrome Ablus", image: "images/monochrome-ablus.png", chance: 0.005, value: "32T-35T", stats: "x954", rarity: "mythic", exist: "N/A", lastUpdated: "2025-07-25T19:43:00Z", demand: "medium" },
                ]
            },
            "rgb-toy-case": {
                name: "RGB TOY CASE", image: "images/rgb-toy-case.png", price: 13300, currency: "time", borderColor: "#c75eb5ff",
                rewards: [
                    { id: "rgb-balloon", name: "RGB Balloon", image: "images/rgb-balloon.png", chance: 41, value: "N/A", stats: "x3.1", rarity: "common", exist: "N/A", lastUpdated: "2025-07-21T11:00:00Z" },
                    { id: "rgb-bat", name: "RGB Bat", image: "images/rgb-bat.png", chance: 32, value: "N/A", stats: "x5.7", rarity: "uncommon", exist: "N/A", lastUpdated: "2025-06-30T22:00:00Z" },
                    { id: "rgb-blade", name: "RGB Blade", image: "images/rgb-blade.png", chance: 19.6, value: "N/A", stats: "x9.2", rarity: "rare", exist: "N/A", lastUpdated: "2025-07-15T15:20:00Z" },
                    { id: "rgb-shark", name: "RGB Shark", image: "images/rgb-shark.png", chance: 7.85, value: "N/A", stats: "x14.5", rarity: "epic", exist: "N/A", lastUpdated: "2025-07-21T09:55:00Z" },
                    { id: "rgb-m4", name: "RGB M4", image: "images/rgb-m4.png", chance: 0.75, value: "N/A", stats: "x25.5", rarity: "godly", exist: "N/A", lastUpdated: "2025-07-21T09:55:00Z" },
                ]
            },
            "the-rock-family": {
                name: "THE ROCK FAMILY", image: "images/the-rock-family.png", price: 40000, currency: "time", borderColor: "#b4b4b4ff",
                rewards: [
                    { id: "rock", name: "Rock", image: "images/rock.png", chance: 99.59, value: "N/A", stats: "x3.1", rarity: "common", exist: "N/A", lastUpdated: "2025-07-21T11:00:00Z" },
                    { id: "chris", name: "Chris", image: "images/chris.png", chance: 0.2, value: "N/A", stats: "x35.3", rarity: "godly", exist: "N/A", lastUpdated: "2025-06-30T22:00:00Z" },
                    { id: "billy", name: "Billy", image: "images/billy.png", chance: 0.2, value: "N/A", stats: "x42.5", rarity: "godly", exist: "N/A", lastUpdated: "2025-07-15T15:20:00Z" },
                    { id: "king-bob", name: "King Bob", image: "images/king-bob.png", chance: 0.01, value: "5B", stats: "x77.5", rarity: "mythic", exist: "N/A", lastUpdated: "2025-07-21T09:55:00Z" },
                ]
            },
            "shiny-rocks": {
                name: "SHINY ROCKS", image: "images/shiny-rocks.png", price: 10, currency: "diamonds", borderColor: "#4688d3ff",
                rewards: [
                    { id: "pink-hitbox", name: "Pink Hitbox", image: "images/pink-hitbox.png", chance: 48.6, value: "N/A", stats: "x4", rarity: "rare", exist: "N/A", lastUpdated: "2025-07-21T11:00:00Z" },
                    { id: "electric-pink", name: "Electric Pink", image: "images/electric-pink.png", chance: 42.5, value: "N/A", stats: "x19.4", rarity: "epic", exist: "N/A", lastUpdated: "2025-06-30T22:00:00Z" },
                    { id: "underworld", name: "Underworld", image: "images/underworld.png", chance: 6, value: "N/A", stats: "x42.7", rarity: "legendary", exist: "N/A", lastUpdated: "2025-07-15T15:20:00Z" },
                    { id: "colored-darkness", name: "Colored Darkness", image: "images/colored-darkness.png", chance: 2.4, value: "N/A", stats: "x92.4", rarity: "godly", exist: "N/A", lastUpdated: "2025-07-21T09:55:00Z" },
                    { id: "monochrome-calcis", name: "Monochrome Calcis", image: "images/monochrome-calcis.png", chance: 0.49, value: "N/A", stats: "x124.5", rarity: "insane", exist: "N/A", lastUpdated: "2025-07-21T09:55:00Z" },
                    { id: "les-infernal", name: "Les Infernal", image: "images/les-infernal.png", chance: 0.01, value: "85T-95T", stats: "x654.4", rarity: "mythic", exist: "N/A", lastUpdated: "2025-07-21T09:55:00Z" },
                ]
            },
            "crystallic-treasures": {
                name: "CRYSTALLIC TREASURES", image: "images/crystallic-treasures.png", price: 120000, currency: "time", borderColor: "#7be7faff",
                rewards: [
                    { id: "crystal", name: "Crystal", image: "images/crystal.png", chance: 87.04, value: "N/A", stats: "x3.6", rarity: "common", exist: "N/A", lastUpdated: "2025-07-21T11:00:00Z" },
                    { id: "crystal-soul", name: "Crystal Soul", image: "images/crystal-soul.png", chance: 12.8, value: "N/A", stats: "x17.9", rarity: "epic", exist: "N/A", lastUpdated: "2025-06-30T22:00:00Z" },
                    { id: "laetus", name: "Laetus", image: "images/laetus.png", chance: 0.15, value: "N/A", stats: "x46.5", rarity: "godly", exist: "N/A", lastUpdated: "2025-07-15T15:20:00Z" },
                    { id: "iris", name: "Iris", image: "images/iris.png", chance: 0.01, value: "N/A", stats: "x113.6", rarity: "mythic", exist: "N/A", lastUpdated: "2025-07-21T09:55:00Z" },
                ]
            },
            "neo-neo-tempus": {
                name: "NEO NEO TEMPUS", image: "images/neo-neo-tempus.png", price: 10000000, currency: "time", borderColor: "#f1ff31ff",
                rewards: [
                    { id: "purple-neo-blade", name: "Purple Neo Blade", image: "images/purple-neo-blade.png", chance: 24.81, value: "N/A", stats: "x31.5", rarity: "legendary", exist: "N/A", lastUpdated: "2025-07-21T11:00:00Z" },
                    { id: "lime-neo-blade", name: "Lime Neo Blade", image: "images/lime-neo-blade.png", chance: 24.81, value: "N/A", stats: "x34.2", rarity: "legendary", exist: "N/A", lastUpdated: "2025-06-30T22:00:00Z" },
                    { id: "red-neo-blade", name: "Red Neo Blade", image: "images/red-neo-blade.png", chance: 24.81, value: "N/A", stats: "x53.2", rarity: "legendary", exist: "N/A", lastUpdated: "2025-07-15T15:20:00Z" },
                    { id: "cyan-neo-blade", name: "Cyan Neo Blade", image: "images/cyan-neo-blade.png", chance: 24.81, value: "N/A", stats: "x65.2", rarity: "legendary", exist: "N/A", lastUpdated: "2025-07-21T09:55:00Z" },
                    { id: "rainbow-neo-blade", name: "Rainbow Neo Blade", image: "images/rainbow-neo-blade.png", chance: 0.71, value: "N/A", stats: "x160.5", rarity: "insane", exist: "N/A", lastUpdated: "2025-07-21T09:55:00Z" },
                    { id: "neo-smiter", name: "Neo Smiter", image: "images/neo-smiter.png", chance: 0.05, value: "N/A", stats: "x444.6", rarity: "mythic", exist: "N/A", lastUpdated: "2025-07-21T09:55:00Z" },
                ]
            },
            "neo-neo-crazy": {
                name: "NEO NEO CRAZY", image: "images/neo-neo-crazy.png", price: 35, currency: "diamonds", borderColor: "#58c0c7ff",
                rewards: [
                    { id: "purple-neo-blade", name: "Purple Neo Blade", image: "images/purple-neo-blade.png", chance: 24.8, value: "N/A", stats: "x31.5", rarity: "legendary", exist: "N/A", lastUpdated: "2025-07-21T11:00:00Z" },
                    { id: "lime-neo-blade", name: "Lime Neo Blade", image: "images/lime-neo-blade.png", chance: 24.8, value: "N/A", stats: "x34.2", rarity: "legendary", exist: "N/A", lastUpdated: "2025-06-30T22:00:00Z" },
                    { id: "red-neo-blade", name: "Red Neo Blade", image: "images/red-neo-blade.png", chance: 24.8, value: "N/A", stats: "x53.2", rarity: "legendary", exist: "N/A", lastUpdated: "2025-07-15T15:20:00Z" },
                    { id: "cyan-neo-blade", name: "Cyan Neo Blade", image: "images/cyan-neo-blade.png", chance: 24.8, value: "N/A", stats: "x65.2", rarity: "legendary", exist: "N/A", lastUpdated: "2025-07-21T09:55:00Z" },
                    { id: "neo-striker", name: "Neo Striker", image: "images/neo-striker.png", chance: 0.1, value: "N/A", stats: "x764.5", rarity: "insane", exist: "N/A", lastUpdated: "2025-07-21T09:55:00Z" },
                    { id: "nox-revus", name: "Nox Revus", image: "images/nox-revus.png", chance: 0.01, value: "N/A", stats: "x5638", rarity: "mythic", exist: "N/A", lastUpdated: "2025-07-21T09:55:00Z" },
                ]
            }
        },
        otherSwords: [
             { id: "subzero_1", name: "Glacial Edge", image: "images/placeholder.png", value: 163790, stats: "x16379", rarity: "subzero", exist: 5, lastUpdated: "2025-07-21T10:00:00Z", description: "An ancient blade forged in a cosmic frost." },
             { id: "mythic_1", name: "Void Reaver", image: "images/placeholder.png", value: 162670, stats: "x16267", rarity: "mythic", exist: 3, lastUpdated: "2025-07-20T14:20:00Z", description: "Said to be a fragment of the [sword:singularity]." },
             { id: "hell_1", name: "Infernal Slayer", image: "images/placeholder.png", value: 150000, stats: "x15500", rarity: "hell", exist: 10, lastUpdated: "2025-07-19T18:00:00Z", description: "Forged in hellfire, it feeds on the souls of its victims." },
             { id: "evil_1", name: "Malevolence", image: "images/placeholder.png", value: 145000, stats: "x14000", rarity: "evil", exist: 12, lastUpdated: "2025-07-18T18:00:00Z", description: "A weapon corrupted by pure evil." },
             { id: "insane_1", name: "Boulder Splitter", image: "images/placeholder.png", value: 93140, stats: "x9314", rarity: "insane", exist: 346, lastUpdated: "2025-07-19T11:00:00Z", description: "A simple but brutally effective weapon." },
             { id: "staff_1", name: "Admin's Wrath", image: "images/placeholder.png", value: 750000, stats: "x99999", rarity: "staff", exist: 1, lastUpdated: "2025-07-18T18:00:00Z", description: "A tool of moderation and power." },
             { id: "godly_1", name: "Laetus", image: "images/placeholder.png", value: 46500, stats: "x1330", rarity: "godly", exist: 37300, lastUpdated: "2025-07-18T18:00:00Z", description: "A divine sword that brings joy to its wielder." },
             { id: "limited_1", name: "Chroma Fin", image: "images/placeholder.png", value: 40000, stats: "x400", rarity: "limited", exist: 5000, lastUpdated: "2025-07-17T12:00:00Z", description: "A special item from a past limited-time event." },
             { id: "exclusive_1", name: "Golden Star", image: "images/placeholder.png", value: 35000, stats: "x350", rarity: "exclusive", exist: 8000, lastUpdated: "2025-07-17T10:00:00Z", description: "An exclusive reward for veteran players." },
             { id: "legendary_lim_1", name: "Golden Fish", image: "images/placeholder.png", value: 30330, stats: "x303.3", rarity: "legendary", exist: 12000, lastUpdated: "2025-07-17T12:00:00Z", description: "It's a fish. But golden." },
             { id: "event_1", name: "2024 Holly", image: "images/placeholder.png", value: 15500, stats: "x155", rarity: "event", exist: 25000, lastUpdated: "2025-07-16T18:00:00Z", description: "Commemorative item from the 2024 Winter event." },
             { id: "easter_1", name: "Carrot Dagger", image: "images/placeholder.png", value: 8200, stats: "x82", rarity: "easter", exist: 50000, lastUpdated: "2025-07-16T15:00:00Z", description: "A sharp, healthy snack from the Easter event." },
             { id: "epic_lim_1", name: "My Tent Is In Here", image: "images/placeholder.png", value: 5160, stats: "x51.6", rarity: "epic", exist: "N/A", lastUpdated: "2025-07-16T15:00:00Z", description: "For the dedicated camper." },
             { id: "unobtainable_1", name: "Beta Tester's Blade", image: "images/placeholder.png", value: "250K", stats: "x1000", rarity: "unobtainable", exist: 100, lastUpdated: "2025-07-15T10:00:00Z", description: "This item is no longer obtainable in any way." }
        ]
    };

    // --- State Management ---
    let swordUpdateInterval = null;
    let navigationContext = { view: 'selection', id: null };
    const appState = {
        currentPage: 1, itemsPerPage: 10,
        currentCaseIdForCalc: null,
        calculatorMode: 'theoretical' // 'theoretical', 'simulate', 'untilBest', 'graph'
    };
    const MAX_GRAPH_SECTIONS = 50;


    // --- DOM Element Selection ---
    const mainViews = {
        selection: document.getElementById('case-selection-view'),
        caseDetails: document.getElementById('case-details-view'),
        swordDetails: document.getElementById('sword-details-view')
    };
    const containers = {
        cases: document.querySelector('#case-selection-view .cases-container'),
        rewards: document.getElementById('rewards-list-container'),
        otherSwords: document.getElementById('other-swords-container'),
        calculatorResults: document.getElementById('calculator-results-container'),
        simulationLoot: document.getElementById('simulation-loot-summary'),
        resultsTable: document.getElementById('results-table-container'),
        graph: document.getElementById('graph-container')
    };
    const buttons = {
        detailsToSelection: document.getElementById('details-to-selection-btn'),
        swordToDetails: document.getElementById('sword-to-details-btn'),
        otherPrev: document.getElementById('other-prev-btn'),
        otherNext: document.getElementById('other-next-btn'),
        calculate: document.getElementById('calculate-btn'),
        calculateGraph: document.getElementById('calculate-graph-btn'),
        modeTheoretical: document.getElementById('mode-theoretical-btn'),
        modeSimulate: document.getElementById('mode-simulate-btn'),
        modeUntilBest: document.getElementById('mode-until-best-btn'),
        modeGraph: document.getElementById('mode-graph-btn')
    };
    const inputs = {
        caseQuantity: document.getElementById('case-quantity-input'),
        graphStep: document.getElementById('graph-step-input'),
        graphMax: document.getElementById('graph-max-input'),
    };
    const controls = {
        standard: document.getElementById('standard-controls'),
        graph: document.getElementById('graph-controls'),
    };

    // --- Helper Functions ---
    function formatTimeAgo(isoString) {
        if (!isoString) return '';
        const date = new Date(isoString); const now = new Date();
        const seconds = Math.round((now - date) / 1000);
        if (seconds < 5) return `Updated just now`;
        if (seconds < 60) return `Updated ${seconds} seconds ago`;
        const minutes = Math.round(seconds / 60);
        if (minutes < 60) return `Updated ${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        const hours = Math.round(minutes / 60);
        if (hours < 24) return `Updated ${hours} hour${hours > 1 ? 's' : ''} ago`;
        const days = Math.round(hours / 24);
        return `Updated ${days} day${days > 1 ? 's' : ''} ago`;
    }
    function formatLargeNumber(num) {
        if (typeof num !== 'number' || isNaN(num)) return 'N/A';
        if (Math.abs(num) < 1000) return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
        const units = ['K', 'M', 'B', 'T', 'Qd'];
        if (num === 0) return '0';
        const tier = Math.floor(Math.log10(Math.abs(num)) / 3);
        if (tier === 0) return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
        const unit = units[tier - 1];
        if (!unit) return num.toLocaleString();
        const scaled = num / Math.pow(1000, tier);
        return scaled.toFixed(2) + unit;
    }

    // === MODIFICADO: parseValue ahora entiende el formato O/C y abreviaciones ===
    function parseValue(value) {
        if (typeof value === 'number') return value;
        if (typeof value !== 'string' || !value) return 0;

        let processableValue = value.trim().toUpperCase();

        if (processableValue.startsWith('O/C')) {
            const match = processableValue.match(/\[(.*?)\]/);
            if (match && match[1]) {
                processableValue = match[1];
            } else {
                return 0;
            }
        }
        if (processableValue.includes('-')) {
            processableValue = processableValue.split('-')[0].trim();
        }
        const multipliers = { 'K': 1e3, 'M': 1e6, 'B': 1e9, 'T': 1e12, 'QD': 1e15 };
        const lastChar = processableValue.slice(-1);
        const multiplier = multipliers[lastChar];

        if (multiplier) {
            const numberPart = parseFloat(processableValue.slice(0, -1));
            return isNaN(numberPart) ? 0 : numberPart * multiplier;
        }
        const plainNumber = parseFloat(processableValue);
        return isNaN(plainNumber) ? 0 : plainNumber;
    }

    function getUnitValue(currencyKey, totalUnits = 1) {
        if (currencyKey === 'time') return 1;
        const tiers = currencyTiers[currencyKey];
        if (!tiers) return 0;
        const applicableTier = tiers.find(tier => totalUnits >= tier.threshold);
        return applicableTier ? applicableTier.value : 0;
    }
    function convertTimeValueToCurrency(timeValue, targetCurrency) {
        if (targetCurrency === 'time') return timeValue;
        const tiers = currencyTiers[targetCurrency];
        if (!tiers || timeValue <= 0) return 0;
        for (const tier of tiers) {
            const calculatedQuantity = timeValue / tier.value;
            if (calculatedQuantity >= tier.threshold) return calculatedQuantity;
        }
        return timeValue / tiers[tiers.length - 1].value;
    }
    // REEMPLAZA ESTA FUNCIÓN
    function formatHours(totalHours) {
        if (totalHours < 24) return `${totalHours.toFixed(1)} hours`;
        const days = totalHours / 24;
        if (days < 7) return `${days.toFixed(1)} days`;
        const weeks = days / 7;
        if (weeks < 4.34) return `${weeks.toFixed(1)} weeks`;
        const months = days / 30.44;
        if (months < 12) return `${months.toFixed(1)} months`;
        const years = days / 365.25;
        return `${years.toFixed(2)} years`;
    }
    function calculateTotalCost(currencyKey, pricePerCase, quantity) {
        if (currencyKey === 'time' || currencyKey === 'cooldown') {
            return pricePerCase * quantity;
        }
        const totalUnits = pricePerCase * quantity;
        const valuePerUnit = getUnitValue(currencyKey, totalUnits);
        return totalUnits * valuePerUnit;
    }
    function showView(viewName) {
        if (swordUpdateInterval) { clearInterval(swordUpdateInterval); swordUpdateInterval = null; }
        Object.values(mainViews).forEach(view => view.style.display = 'none');
        mainViews[viewName].style.display = 'block';
        window.scrollTo(0, 0);
    }
    function getCurrencyHTML(currencyKey, price) {
        if (currencyKey === 'cooldown') {
            return `<span class="currency-text">Free (Every ${price} hr)</span>`;
        }
        const currency = appData.currencies[currencyKey];
        if (currency.icon) {
            return `<img src="${currency.icon}" alt="${currencyKey}" class="currency-icon"> <span class="value">${price.toLocaleString()}</span>`;
        }
        return `<span class="currency-text">${currency.name}</span> <span class="value">${price.toLocaleString()}</span>`;
    }
    function findSwordById(swordId) {
        for (const caseId in appData.cases) {
            const foundSword = appData.cases[caseId].rewards.find(r => r.id === swordId);
            if (foundSword) return { sword: foundSword, source: { type: 'case', id: caseId } };
        }
        const foundOtherSword = appData.otherSwords.find(s => s.id === swordId);
        if (foundOtherSword) return { sword: foundOtherSword, source: { type: 'other' } };
        return null;
    }
    function parseAndSetDescription(element, text) {
        element.innerHTML = '';
        if (!text) { element.textContent = 'No description available for this item.'; return; }
        const fragment = document.createDocumentFragment();
        const regex = /\[(case|sword):([a-zA-Z0-9_-]+)\]/g;
        let lastIndex = 0; let match;
        while ((match = regex.exec(text)) !== null) {
            fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
            const [fullMatch, type, id] = match;
            const link = document.createElement('a'); link.href = '#';
            if (type === 'case') {
                const data = appData.cases[id];
                if (data) {
                    link.textContent = data.name; link.className = 'case-link-in-description';
                    link.onclick = (e) => { e.preventDefault(); renderCaseDetails(id); };
                }
            } else if (type === 'sword') {
                const data = findSwordById(id);
                if (data) {
                    link.textContent = data.sword.name; link.className = 'sword-link-in-description';
                    link.onclick = (e) => { e.preventDefault(); renderSwordDetails(data.sword, data.source); };
                }
            }
            if (link.textContent) { fragment.appendChild(link); } else { fragment.appendChild(document.createTextNode(fullMatch)); }
            lastIndex = regex.lastIndex;
        }
        fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
        element.appendChild(fragment);
    }

    // --- Rendering Logic ---
    function renderSwordDetails(sword, sourceInfo) {
        if (!sword) return;
        navigationContext = { view: 'swordDetails', ...sourceInfo };

        const swordInfoCard = document.getElementById('sword-info-card');
        swordInfoCard.className = ``; swordInfoCard.classList.add(sword.rarity);

        const demandIndicator = document.getElementById('sword-demand-indicator');
        if (sword.demand) {
            demandIndicator.className = '';
            demandIndicator.classList.add('sword-demand-indicator');
            demandIndicator.classList.add(sword.demand);
            demandIndicator.style.display = 'block';
        } else {
            demandIndicator.style.display = 'none';
        }

        document.getElementById('sword-details-image-container').innerHTML = `<img src="${sword.image}" alt="${sword.name}">`;
        document.getElementById('sword-details-name').textContent = sword.name;
        
        const descriptionEl = document.getElementById('sword-details-description');
        const fullDescription = sword.description || (sourceInfo.type === 'case' ? `This sword is obtainable from the [case:${sourceInfo.id}].` : 'A special item, not available in cases.');
        parseAndSetDescription(descriptionEl, fullDescription);

        const valueEl = document.getElementById('sword-details-value');
        if (typeof sword.value === 'string' && sword.value.toUpperCase().startsWith('O/C')) {
            const match = sword.value.match(/\[(.*?)\]/);
            valueEl.textContent = 'O/C';
            valueEl.classList.add('value-oc');
            valueEl.title = match ? `Owner's Choice: ${match[1]}` : 'Owner\'s Choice - No range specified';
        } else {
            valueEl.textContent = typeof sword.value === 'number' ? sword.value.toLocaleString() : sword.value;
            valueEl.classList.remove('value-oc');
            valueEl.title = '';
        }

        document.getElementById('sword-details-stats').textContent = sword.stats;
        const moreEl = document.getElementById('sword-details-more');
        const existCount = typeof sword.exist === 'number' ? sword.exist.toLocaleString() : sword.exist;
        moreEl.innerHTML = `
            ${sword.chance ? `Chance - ${sword.chance}%<br>` : ''}
            Exist - ${existCount}<br>
            Rarity - <span class="rarity-text ${sword.rarity}">${sword.rarity}</span>
        `;
        const updatedEl = document.getElementById('sword-details-updated');
        const updateSwordTime = () => updatedEl.textContent = formatTimeAgo(sword.lastUpdated);
        updateSwordTime();
        swordUpdateInterval = setInterval(updateSwordTime, 60000);
        showView('swordDetails');
    }
    
    function createRewardItemHTML(reward, source) {
        let valueDisplayHTML;
        if (typeof reward.value === 'string' && reward.value.toUpperCase().startsWith('O/C')) {
            const match = reward.value.match(/\[(.*?)\]/);
            valueDisplayHTML = `<span class="value-oc" title="${match ? match[1] : ''}">O/C</span>`;
        } else {
            valueDisplayHTML = typeof reward.value === 'number' ? reward.value.toLocaleString() : reward.value;
        }

        const isCaseReward = source.type === 'case';
        return `
            <div class="reward-info">
                <div class="reward-image-placeholder"><img src="${reward.image}" alt="${reward.name}"></div>
                <span class="reward-name">${reward.name}</span>
            </div>
            <div class="reward-stats">
               ${isCaseReward ? `<span>${reward.chance}%</span>` : '<span class="no-chance">--</span>'}
               <span class="reward-value">${valueDisplayHTML}</span>
               <span>${reward.stats}</span>
            </div>
        `;
    }

    function renderCaseDetails(caseId) {
        const data = appData.cases[caseId];
        if (!data) return;
        navigationContext = { view: 'caseDetails', id: caseId };
        appState.currentCaseIdForCalc = caseId;
        document.getElementById('details-case-image').src = data.image;
        document.getElementById('details-case-name').textContent = data.name;
        document.getElementById('details-case-price').innerHTML = getCurrencyHTML(data.currency, data.price);
        const infoColumn = document.querySelector('.info-column');
        infoColumn.style.setProperty('--case-border-color', data.borderColor || 'var(--main-green)');
        containers.rewards.innerHTML = '';
        data.rewards.forEach(reward => {
            const item = document.createElement('div');
            item.className = `reward-item ${reward.rarity}`;
            item.innerHTML = createRewardItemHTML(reward, { type: 'case' });
            item.addEventListener('click', () => renderSwordDetails(reward, { type: 'case', id: caseId }));
            containers.rewards.appendChild(item);
        });
        clearCalculator();
        showView('caseDetails');
    }

    function renderCaseSelection() {
        containers.cases.innerHTML = '';
        Object.keys(appData.cases).forEach(caseId => {
            const data = appData.cases[caseId];
            const link = document.createElement('a');
            link.href = '#'; link.className = 'case-link';
            link.innerHTML = `<div class="case-item"></div>`;
            const caseItem = link.querySelector('.case-item');
            caseItem.style.setProperty('--case-border-color', data.borderColor || 'var(--main-green)');
            caseItem.innerHTML = `<img class="case-content-image" src="${data.image}" alt="${data.name}"><h3 class="case-title">${data.name}</h3><div class="case-price">${getCurrencyHTML(data.currency, data.price)}</div>`;
            link.addEventListener('click', (e) => { e.preventDefault(); renderCaseDetails(caseId); });
            containers.cases.appendChild(link);
        });
    }
    
    function renderOtherSwords() {
        const { currentPage, itemsPerPage } = appState;
        containers.otherSwords.innerHTML = '';
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const pagedItems = appData.otherSwords.slice(start, end);
        pagedItems.forEach(reward => {
            const item = document.createElement('div');
            item.className = `reward-item ${reward.rarity}`;
            item.innerHTML = createRewardItemHTML(reward, { type: 'other' });
            item.addEventListener('click', () => renderSwordDetails(reward, { type: 'other' }));
            containers.otherSwords.appendChild(item);
        });
        updatePaginationControls();
    }
    function updatePaginationControls() {
        const { currentPage, itemsPerPage } = appState;
        const totalPages = Math.ceil(appData.otherSwords.length / itemsPerPage);
        buttons.otherPrev.disabled = currentPage === 1;
        buttons.otherNext.disabled = currentPage === totalPages;
    }

    // ===================================================================================
    // === SECCIÓN DE LA CALCULADORA (ACTUALIZADA CON GRÁFICO DE LÍNEAS) ===
    // ===================================================================================

// REEMPLAZA ESTA FUNCIÓN EN TU SCRIPT.JS
function clearCalculator() {
    containers.simulationLoot.style.display = 'none';
    containers.resultsTable.innerHTML = '';
    containers.graph.style.display = 'none';
    document.getElementById('graph-plot-area').querySelector('svg').innerHTML = '';
    document.getElementById('graph-labels').innerHTML = '';

    const calculateBtn = document.getElementById('calculate-btn');
    const isGraphMode = appState.calculatorMode === 'graph';
    const isUntilBestMode = appState.calculatorMode === 'untilBest';
    
    // Ocultar/mostrar los controles principales vs los del gráfico
    controls.standard.style.display = isGraphMode ? 'none' : 'flex';
    controls.graph.style.display = isGraphMode ? 'flex' : 'none';

    // Lógica final y correcta para el estado de los controles
    if (isUntilBestMode) {
        inputs.caseQuantity.value = '';
        inputs.caseQuantity.placeholder = "Not applicable in this mode";
        inputs.caseQuantity.disabled = true; // Deshabilitar el input
        calculateBtn.textContent = 'Start Hunt'; // Cambiar texto del botón
    } else {
        inputs.caseQuantity.placeholder = "Enter amount of cases...";
        inputs.caseQuantity.disabled = false; // Habilitar el input
        calculateBtn.textContent = 'Calculate'; // Restaurar texto del botón
    }
}

    function setActiveModeButton(activeButton) {
        Object.values(buttons).forEach(btn => {
            if (btn.id && btn.id.startsWith('mode-')) {
                btn.classList.remove('active');
            }
        });
        activeButton.classList.add('active');
    }

// REEMPLAZA ESTA FUNCIÓN
function handleCalculate() {
    const quantity = parseInt(inputs.caseQuantity.value, 10);
    const caseId = appState.currentCaseIdForCalc;

    if (!caseId || !appData.cases[caseId]) {
        containers.resultsTable.innerHTML = `<p style="text-align:center; color: var(--insane);">Error: Case data not found.</p>`;
        return;
    }
    
    containers.resultsTable.innerHTML = ''; // Limpiar resultados previos
    containers.simulationLoot.style.display = 'none';

    // Tu validación correcta: solo se requiere cantidad si NO es "Until Best"
    if (appState.calculatorMode !== 'untilBest' && (isNaN(quantity) || quantity <= 0)) {
        containers.resultsTable.innerHTML = `<p style="text-align:center; color: var(--insane);">Please enter a valid number of cases.</p>`;
        return;
    }
    
    if (appState.calculatorMode === 'theoretical') {
        runTheoreticalCalculation(quantity, caseId);
    } else if (appState.calculatorMode === 'simulate') {
        runRealisticSimulation(quantity, caseId);
    } else if (appState.calculatorMode === 'untilBest') {
        runUntilBestSimulation(caseId);
    }
}
    
    function runTheoreticalCalculation(quantity, caseId) {
        const caseData = appData.cases[caseId];
        let expectedValuePerCase = 0;
        caseData.rewards.forEach(reward => {
            const numericValue = parseValue(reward.value);
            const chance = reward.chance / 100;
            if (numericValue > 0 && !isNaN(chance)) {
                expectedValuePerCase += (numericValue * chance);
            }
        });
        const totalValueGained = expectedValuePerCase * quantity;
        const totalCost = calculateTotalCost(caseData.currency, caseData.price, quantity);
        renderResultsTable({ totalCost, totalValueGained, result: totalValueGained - totalCost });
    }
    function runRealisticSimulation(quantity, caseId) {
        const caseData = appData.cases[caseId];
        const { rewardsWithCumulativeChance, totalChanceSum } = prepareSimulationData(caseData);
        let totalValueGained = 0;
        const wonItems = {};
        for (let i = 0; i < quantity; i++) {
            const random = Math.random() * totalChanceSum;
            const wonReward = rewardsWithCumulativeChance.find(r => random <= r.cumulative);
            if (wonReward) {
                totalValueGained += parseValue(wonReward.value);
                wonItems[wonReward.id] = (wonItems[wonReward.id] || 0) + 1;
            }
        }
        const totalCost = calculateTotalCost(caseData.currency, caseData.price, quantity);
        renderSimulationLoot(wonItems, caseData.rewards);
        renderResultsTable({ totalCost, totalValueGained, result: totalValueGained - totalCost });
    }
// REEMPLAZA ESTA FUNCIÓN
function runUntilBestSimulation(caseId) {
    const caseData = appData.cases[caseId];
    // Tu lógica correcta para encontrar la recompensa más rara (menor probabilidad)
    const bestReward = caseData.rewards.reduce((prev, current) => (prev.chance < current.chance) ? prev : current);

    const { rewardsWithCumulativeChance, totalChanceSum } = prepareSimulationData(caseData);

    let casesOpened = 0;
    let totalValueGained = 0;
    let hasFoundBest = false;
    const MAX_ATTEMPTS = 500000; // Límite de seguridad para evitar bucles infinitos

    while (!hasFoundBest && casesOpened < MAX_ATTEMPTS) {
        casesOpened++;
        const random = Math.random() * totalChanceSum;
        const wonReward = rewardsWithCumulativeChance.find(r => random <= r.cumulative);

        if (wonReward) {
            totalValueGained += parseValue(wonReward.value);
            if (wonReward.id === bestReward.id) {
                hasFoundBest = true;
            }
        }
    }
    
    const totalCost = calculateTotalCost(caseData.currency, caseData.price, casesOpened);
    
    // Mostrar el resumen de la "caza"
    containers.simulationLoot.style.display = 'block';
    if (hasFoundBest) {
        containers.simulationLoot.innerHTML = `<h4>Hunt Result</h4><p>It took <strong>${casesOpened.toLocaleString()}</strong> cases to find <span class="rarity-text ${bestReward.rarity}">${bestReward.name}</span>!</p>`;
    } else {
        containers.simulationLoot.innerHTML = `<h4>Hunt Result</h4><p style="color:var(--insane);">Did not find the ${bestReward.name} within ${MAX_ATTEMPTS.toLocaleString()} cases. This is a super rare item!</p>`;
    }
    
    // Renderizar la tabla de resultados con los datos de esta simulación
    renderResultsTable({
        totalCost,
        totalValueGained,
        result: totalValueGained - totalCost,
        quantityOverride: casesOpened // Clave para que los cálculos de la tabla sean correctos
    });
}
    function prepareSimulationData(caseData) {
        const rewardsWithCumulativeChance = [];
        let cumulative = 0;
        caseData.rewards.forEach(reward => {
            cumulative += reward.chance;
            rewardsWithCumulativeChance.push({ ...reward, cumulative });
        });
        return { rewardsWithCumulativeChance, totalChanceSum: cumulative };
    }

// REEMPLAZA ESTA FUNCIÓN EN TU SCRIPT.JS
function handleGraphCalculate() {
    const step = parseInt(inputs.graphStep.value, 10);
    const max = parseInt(inputs.graphMax.value, 10);
    const caseId = appState.currentCaseIdForCalc;

    // Limpiar siempre los resultados anteriores para evitar confusiones
    containers.resultsTable.innerHTML = '';
    containers.simulationLoot.style.display = 'none';
    containers.graph.style.display = 'none'; // Ocultar el gráfico al inicio
    document.getElementById('graph-plot-area').querySelector('svg').innerHTML = '';
    document.getElementById('graph-labels').innerHTML = '';

    if (!caseId || !appData.cases[caseId]) {
        containers.resultsTable.innerHTML = `<p style="text-align:center; color: var(--insane);">Error: Case data not found.</p>`;
        return; // Salida clara con mensaje
    }
    
    const numSections = max / step;
    if (isNaN(step) || isNaN(max) || step <= 0 || max <= 0 || max < step) {
        // Usar el contenedor de la tabla de resultados para los mensajes de error
        containers.resultsTable.innerHTML = `<p style="text-align:center; color: var(--insane);">Please enter a valid range and maximum value.</p>`;
        return;
    }
    if (numSections > MAX_GRAPH_SECTIONS) {
        containers.resultsTable.innerHTML = `<p style="text-align:center; color: var(--insane);">Too many sections requested (Max: ${MAX_GRAPH_SECTIONS}). Please increase the range or decrease the maximum.</p>`;
        return;
    }

    runGraphSimulation(step, max, caseId);
}
    
    // REEMPLAZA ESTA FUNCIÓN
    function runGraphSimulation(step, max, caseId) {
        const caseData = appData.cases[caseId];
        const { rewardsWithCumulativeChance, totalChanceSum } = prepareSimulationData(caseData);
        const results = [];
        
        let totalValueGained = 0;
        
        for (let i = 1; i <= max; i++) {
            const random = Math.random() * totalChanceSum;
            const wonReward = rewardsWithCumulativeChance.find(r => random <= r.cumulative);
            if (wonReward) {
                totalValueGained += parseValue(wonReward.value);
            }

            if (i % step === 0 || i === max) {
                const totalCost = calculateTotalCost(caseData.currency, caseData.price, i);
                
                // Lógica clave: decidir si se calcula porcentaje o valor absoluto
                if (totalCost > 0) {
                    const profitPercentage = ((totalValueGained - totalCost) / totalCost) * 100;
                    results.push({ cases: i, value: profitPercentage, isPercentage: true });
                } else {
                    // Para cajas 'cooldown' (coste 0), el profit es la ganancia neta
                    results.push({ cases: i, value: totalValueGained, isPercentage: false });
                }
            }
        }
        renderProfitGraph(results);
    }
    
    // REEMPLAZA ESTA FUNCIÓN
    function renderProfitGraph(results) {
        containers.graph.style.display = 'block';
        const plotArea = document.getElementById('graph-plot-area');
        const svg = plotArea.querySelector('svg');
        const labelsArea = document.getElementById('graph-labels');
        const tooltip = plotArea.querySelector('.graph-tooltip');
        svg.innerHTML = '';
        labelsArea.innerHTML = '';

        if (results.length < 2) return;

        const isPercentage = results[0].isPercentage;
        const yAxisLabel = isPercentage ? 'Profit %' : 'Net Gain (Time)';

        const padding = { top: 20, right: 20, bottom: 20, left: 20 };
        const width = svg.clientWidth, height = svg.clientHeight;
        if (width === 0 || height === 0) return;

        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;

        const minCases = results[0].cases;
        const maxCases = results[results.length - 1].cases;
        const yValues = results.map(r => r.value);
        const yMin = Math.min(0, ...yValues);
        const yMax = Math.max(0, ...yValues);
        
        // Evitar división por cero y dar un poco de margen
        const yRange = (yMax - yMin) === 0 ? 1 : (yMax - yMin);
        const yDomainMin = yMin - yRange * 0.1;
        const yDomainMax = yMax + yRange * 0.1;

        const xScale = (cases) => padding.left + ((cases - minCases) / (maxCases - minCases)) * chartWidth;
        const yScale = (val) => padding.top + chartHeight - ((val - yDomainMin) / (yDomainMax - yDomainMin)) * chartHeight;

        const createLineSegment = (p1, p2, isPositive) => {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', p1.x); line.setAttribute('y1', p1.y);
            line.setAttribute('x2', p2.x); line.setAttribute('y2', p2.y);
            line.setAttribute('class', isPositive ? 'graph-profit-line' : 'graph-loss-line');
            svg.appendChild(line);
        };
        
        const zeroY = yScale(0);
        if (zeroY >= padding.top && zeroY <= height - padding.bottom) {
             const zeroLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            zeroLine.setAttribute('x1', padding.left); zeroLine.setAttribute('y1', zeroY);
            zeroLine.setAttribute('x2', width - padding.right); zeroLine.setAttribute('y2', zeroY);
            zeroLine.setAttribute('class', 'graph-zero-line');
            svg.appendChild(zeroLine);
        }

        for (let i = 0; i < results.length - 1; i++) {
            const p1 = results[i]; const p2 = results[i+1];
            const p1_coords = { x: xScale(p1.cases), y: yScale(p1.value) };
            const p2_coords = { x: xScale(p2.cases), y: yScale(p2.value) };

            if (p1.value * p2.value < 0) {
                const m = (p2.value - p1.value) / (p2.cases - p1.cases);
                const x_intersect = p1.cases - p1.value / m;
                const intersect_coords = { x: xScale(x_intersect), y: yScale(0) };
                createLineSegment(p1_coords, intersect_coords, p1.value >= 0);
                createLineSegment(intersect_coords, p2_coords, p2.value >= 0);
            } else {
                createLineSegment(p1_coords, p2_coords, p1.value >= 0);
            }
        }

        results.forEach(d => {
            const cx = xScale(d.cases); const cy = yScale(d.value);
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', cx); circle.setAttribute('cy', cy);
            circle.setAttribute('class', `graph-data-point ${d.value >= 0 ? 'profit' : 'loss'}`);
            
            circle.addEventListener('mouseover', () => {
                tooltip.style.display = 'block';
                const profitClass = d.value >= 0 ? 'profit' : 'loss';
                const sign = d.value > 0 ? '+' : '';
                const valueText = isPercentage ? `${sign}${d.value.toFixed(2)}%` : `${sign}${formatLargeNumber(d.value)}`;
                
                tooltip.innerHTML = `Cases: <strong>${d.cases.toLocaleString()}</strong><br>${yAxisLabel}: <strong class="tooltip-value ${profitClass}">${valueText}</strong>`;
                tooltip.style.left = `${cx}px`;
                tooltip.style.top = `${cy}px`;
            });
            circle.addEventListener('mouseout', () => { tooltip.style.display = 'none'; });
            svg.appendChild(circle);
        });

        const numLabels = Math.min(results.length, 6);
        const labelIndices = numLabels <= 1 ? [0] : Array.from({ length: numLabels }, (_, i) => Math.floor(i * (results.length - 1) / (numLabels - 1)));
        if (results.length > 0) {
            labelsArea.innerHTML = labelIndices.map(i => `<span>${formatLargeNumber(results[i].cases)}</span>`).join('');
        }
    }

    // === Lógica de renderizado de resultados (sin cambios) ===
    function renderSimulationLoot(wonItems, allRewards) {
        containers.simulationLoot.style.display = 'block';
        if (Object.keys(wonItems).length === 0) {
            containers.simulationLoot.innerHTML = '<h4>Loot Summary</h4><p>No items won in this simulation.</p>';
            return;
        }
        let listHTML = '<h4>Loot Summary</h4><ul>';
        for (const rewardId in wonItems) {
            const rewardData = allRewards.find(r => r.id === rewardId);
            if(rewardData) listHTML += `<li>${wonItems[rewardId]}x <span class="rarity-text ${rewardData.rarity}">${rewardData.name}</span></li>`;
        }
        listHTML += '</ul>';
        containers.simulationLoot.innerHTML = listHTML;
    }
// MODIFICA ESTA LÍNEA DENTRO DE LA FUNCIÓN
function renderResultsTable(data) {
    containers.resultsTable.innerHTML = ''; // Limpiar antes de renderizar
    // --> CAMBIA ESTA LÍNEA:
    const quantity = data.quantityOverride || parseInt(inputs.caseQuantity.value, 10) || 1;
    // ...el resto de la función sigue igual...
    const resultClass = data.result >= 0 ? 'profit' : 'loss';
    const resultSign = data.result >= 0 ? '+' : '';
    const profitPerCase = data.result / quantity;
    const profitPercentage = data.totalCost > 0 ? (data.result / data.totalCost) * 100 : 0;
    let totalCostDisplay;
    const currentCaseData = appData.cases[appState.currentCaseIdForCalc];
    if (currentCaseData && currentCaseData.currency === 'cooldown') {
        totalCostDisplay = formatHours(data.totalCost);
    } else {
        totalCostDisplay = formatLargeNumber(data.totalCost);
    }
    const tableHTML = `<table id="results-table"><thead><tr><th>${appState.calculatorMode === 'theoretical' ? 'Expected Value' : 'Total Value'}</th><th>Total Cost</th><th>Net Result</th><th>Result/Case</th><th>Profit %</th></tr></thead><tbody><tr><td>${formatLargeNumber(data.totalValueGained)}</td><td>${totalCostDisplay}</td><td class="${resultClass}">${resultSign}${formatLargeNumber(data.result)}</td><td class="${resultClass}">${resultSign}${formatLargeNumber(profitPerCase)}</td><td class="${resultClass}">${resultSign}${profitPercentage.toFixed(2)}%</td></tr></tbody></table>`;
    containers.resultsTable.innerHTML = tableHTML;
}

    // --- Navigation & Event Setup ---
    buttons.detailsToSelection.addEventListener('click', () => { navigationContext = { view: 'selection', id: null }; showView('selection'); });
    buttons.swordToDetails.addEventListener('click', () => {
        if (navigationContext.type === 'case') renderCaseDetails(navigationContext.id);
        else showView('selection');
    });
    buttons.otherPrev.addEventListener('click', () => { if (appState.currentPage > 1) { appState.currentPage--; renderOtherSwords(); } });
    buttons.otherNext.addEventListener('click', () => { const totalPages = Math.ceil(appData.otherSwords.length / appState.itemsPerPage); if (appState.currentPage < totalPages) { appState.currentPage++; renderOtherSwords(); } });
    buttons.calculate.addEventListener('click', handleCalculate);
    buttons.calculateGraph.addEventListener('click', handleGraphCalculate);

// REEMPLAZA ESTE BLOQUE EN TU SCRIPT.JS
[buttons.modeTheoretical, buttons.modeSimulate, buttons.modeUntilBest, buttons.modeGraph].forEach(button => {
    button.addEventListener('click', (e) => {
        // Corrige la extracción del nombre del modo para IDs compuestos como 'mode-until-best-btn'
        const rawId = e.target.id.replace('mode-', '').replace('-btn', ''); // Ej: "until-best"
        const modeParts = rawId.split('-'); // Ej: ["until", "best"]
        const newMode = modeParts[0] + modeParts.slice(1).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(''); // Ej: "untilBest"

        if (appState.calculatorMode !== newMode) {
            appState.calculatorMode = newMode;
            setActiveModeButton(e.target);
            clearCalculator(); // Ahora se llamará con el modo correcto: 'untilBest'
        }
    });
});

    // ===================================================================================
    // === UI SUPERIOR (LÓGICA REDISEÑADA) ===
    // ===================================================================================
    function initializeTopUI() {
        const allSwords = [];
        Object.values(appData.cases).forEach(c => allSwords.push(...c.rewards));
        allSwords.push(...appData.otherSwords);

        // --- Búsqueda (Lógica sin cambios, UI mejorada por CSS) ---
        const searchBar = document.getElementById('search-bar');
        const searchResultsContainer = document.getElementById('search-results');
        searchBar.addEventListener('input', () => {
            const query = searchBar.value.toLowerCase().trim();
            if (!query) { searchResultsContainer.style.display = 'none'; return; }
            const results = allSwords.filter(sword => sword.name.toLowerCase().includes(query)).slice(0, 10);
            searchResultsContainer.innerHTML = '';
            if (results.length > 0) {
                results.forEach(reward => {
                    const item = document.createElement('div');
                    item.className = `reward-item ${reward.rarity}`;
                    item.innerHTML = createRewardItemHTML(reward, findSwordById(reward.id)?.source || { type: 'other' });
                    item.querySelector('.reward-stats').style.display = 'none';
                    item.addEventListener('click', () => {
                        const source = findSwordById(reward.id);
                        renderSwordDetails(reward, source ? source.source : { type: 'other' });
                        searchBar.value = '';
                        searchResultsContainer.style.display = 'none';
                    });
                    searchResultsContainer.appendChild(item);
                });
                searchResultsContainer.style.display = 'block';
            } else { searchResultsContainer.style.display = 'none'; }
        });
        document.addEventListener('click', (e) => { if (!document.getElementById('search-module').contains(e.target)) { searchResultsContainer.style.display = 'none'; } });
        
        // --- Conversor (Lógica completamente nueva) ---
        const fromInput = document.getElementById('converter-from-input');
        const toInput = document.getElementById('converter-to-input');
        const fromCurrencySelect = document.getElementById('converter-from-currency');
        const toCurrencySelect = document.getElementById('converter-to-currency');
        const fromWrapper = document.getElementById('converter-from-wrapper');
        const toWrapper = document.getElementById('converter-to-wrapper');
        const currencyKeys = Object.keys(appData.currencies);

        currencyKeys.forEach(key => {
            fromCurrencySelect.innerHTML += `<option value="${key}">${appData.currencies[key].name}</option>`;
            toCurrencySelect.innerHTML += `<option value="${key}">${appData.currencies[key].name}</option>`;
        });
        fromCurrencySelect.value = 'time';
        toCurrencySelect.value = 'diamonds';

        function updateConverterUI() {
            // From
            const fromKey = fromCurrencySelect.value;
            const fromCurrency = appData.currencies[fromKey];
            document.getElementById('converter-from-name').textContent = fromCurrency.name;
            const fromIcon = document.getElementById('converter-from-icon');
            fromIcon.src = fromCurrency.icon || '';
            fromIcon.style.display = fromCurrency.icon ? 'block' : 'none';
            
            // To
            const toKey = toCurrencySelect.value;
            const toCurrency = appData.currencies[toKey];
            document.getElementById('converter-to-name').textContent = toCurrency.name;
            const toIcon = document.getElementById('converter-to-icon');
            toIcon.src = toCurrency.icon || '';
            toIcon.style.display = toCurrency.icon ? 'block' : 'none';
        }

        function runConversion() {
            const fromAmount = parseValue(fromInput.value);
            const fromCurrency = fromCurrencySelect.value;
            const toCurrency = toCurrencySelect.value;

            if (isNaN(fromAmount) || fromAmount <= 0) {
                toInput.value = '';
                return;
            }

            const totalTimeValue = fromAmount * getUnitValue(fromCurrency, fromAmount);
            const finalAmount = convertTimeValueToCurrency(totalTimeValue, toCurrency);

            toInput.value = finalAmount > 0 ? formatLargeNumber(finalAmount) : 'N/A';
        }

        function cycleCurrency(selectElement) {
            const currentIndex = currencyKeys.indexOf(selectElement.value);
            const nextIndex = (currentIndex + 1) % currencyKeys.length;
            selectElement.value = currencyKeys[nextIndex];
            updateConverterUI();
            runConversion();
        }

        fromInput.addEventListener('input', runConversion);
        fromWrapper.addEventListener('click', (e) => {
            if (e.target.id !== 'converter-from-input') { // No ciclar si se hace clic en el input
                cycleCurrency(fromCurrencySelect);
            }
        });
        toWrapper.addEventListener('click', () => cycleCurrency(toCurrencySelect));
        
        // Initial setup
        updateConverterUI();
        runConversion();
    }

    // --- APPLICATION START ---
    initializeTopUI();
    renderCaseSelection();
    renderOtherSwords();
    showView('selection');
});