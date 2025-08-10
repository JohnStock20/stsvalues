/* =================================================================================== */
/* === ARCHIVO: data.js === */
/* === Contiene todos los datos estáticos de la aplicación (cajas, espadas, etc.). === */
/* =================================================================================== */

// Función de parsing que vive junto a los datos que la necesitan.
export function parseValue(value) {
    if (typeof value === 'number') return value;
    if (typeof value !== 'string' || !value) return 0;

    let processableValue = value.trim().toUpperCase();

    // Maneja el formato O/C [Over-Clause, Owner's Choice]
    if (processableValue.startsWith('O/C')) {
        const match = processableValue.match(/\[(.*?)\]/);
        if (match && match[1]) {
            processableValue = match[1];
        } else {
            // Si es O/C sin rango, no podemos asignarle un valor numérico para cálculos.
            return 0;
        }
    }

    // Si es un rango (ej: "8T-10T"), toma el primer valor.
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

export const currencyTiers = {
    'diamonds': [
        { threshold: 50000, value: parseValue("3B") },
        { threshold: 35000, value: parseValue("2.7B") },
        { threshold: 25000, value: parseValue("2.4B") },
        { threshold: 15000, value: 2.2e9 },
        { threshold: 10000, value: 2e9 },
        { threshold: 5000, value: 1.8e9 },
        { threshold: 3000, value: 1.7e9 },
        { threshold: 1000, value: 1.6e9 },
        { threshold: 0, value: 1.5e9 }
    ],
    'heartstones': [
        { threshold: 50000, value: parseValue("775M") },
        { threshold: 35000, value: parseValue("725M") },
        { threshold: 25000, value: parseValue("650M") },
        { threshold: 15000, value: 625e6 },
        { threshold: 10000, value: 600e6 },
        { threshold: 5000, value: 575e6 },
        { threshold: 3000, value: 550e6 },
        { threshold: 1000, value: 525e6 },
        { threshold: 0, value: 500e6 }
    ]
};

export const appData = {
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
         { id: "limited_1", name: "Chroma Fin", image: "images/placeholder.png", value: 40000, stats: "x400", rarity: "limited", exist: 5000, lastUpdated: "2025-07-17T12:00:00Z", description: "A special item from a past limited-time event." },
         { id: "exclusive_1", name: "Golden Star", image: "images/placeholder.png", value: 35000, stats: "x350", rarity: "exclusive", exist: 8000, lastUpdated: "2025-07-17T10:00:00Z", description: "An exclusive reward for veteran players." },
         { id: "legendary_lim_1", name: "Golden Fish", image: "images/placeholder.png", value: 30330, stats: "x303.3", rarity: "legendary", exist: 12000, lastUpdated: "2025-07-17T12:00:00Z", description: "It's a fish. But golden." },
         { id: "event_1", name: "2024 Holly", image: "images/placeholder.png", value: 15500, stats: "x155", rarity: "event", exist: 25000, lastUpdated: "2025-07-16T18:00:00Z", description: "Commemorative item from the 2024 Winter event." },
         { id: "easter_1", name: "Carrot Dagger", image: "images/placeholder.png", value: 8200, stats: "x82", rarity: "easter", exist: 50000, lastUpdated: "2025-07-16T15:00:00Z", description: "A sharp, healthy snack from the Easter event." },
         { id: "epic_lim_1", name: "My Tent Is In Here", image: "images/placeholder.png", value: 5160, stats: "x51.6", rarity: "epic", exist: "N/A", lastUpdated: "2025-07-16T15:00:00Z", description: "For the dedicated camper." },
         { id: "unobtainable_1", name: "Beta Tester's Blade", image: "images/placeholder.png", value: "250K", stats: "x1000", rarity: "unobtainable", exist: 100, lastUpdated: "2025-07-15T10:00:00Z", description: "This item is no longer obtainable in any way." }
    ]
};