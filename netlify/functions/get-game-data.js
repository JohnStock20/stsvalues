// Archivo: netlify/functions/get-game-data.js (Versión Corregida y Final)

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const currenciesData = {
    "time": { name: "Time", icon: null },
    "diamonds": { name: "Diamonds", icon: "images/diamonds.png" },
    "heartstones": { name: "Heartstones", icon: "images/heartstones.png" },
    "cooldown": { name: "Cooldown", icon: null }
};

exports.handler = async (event) => {
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const client = await pool.connect();
    try {
        const casesPromise = client.query('SELECT * FROM cases');
        const swordsPromise = client.query('SELECT * FROM swords');
        const rewardsPromise = client.query('SELECT * FROM case_rewards');

        const [casesResult, swordsResult, rewardsResult] = await Promise.all([
            casesPromise,
            swordsPromise,
            rewardsPromise,
        ]);

        const swordsMap = new Map(swordsResult.rows.map(s => [s.id, s]));

        const appData = {
            currencies: currenciesData,
            cases: {},
            otherSwords: []
        };

        for (const caseRow of casesResult.rows) {
            appData.cases[caseRow.id] = {
                id: caseRow.id,
                name: caseRow.name,
                image: caseRow.image_path,
                price: caseRow.price,
                currency: caseRow.currency,
                borderColor: caseRow.border_color,
                rewards: []
            };
        }

        for (const rewardRow of rewardsResult.rows) {
            const swordData = swordsMap.get(rewardRow.sword_id);
            if (swordData && appData.cases[rewardRow.case_id]) {
                appData.cases[rewardRow.case_id].rewards.push({
                    id: swordData.id,
                    name: swordData.name,
                    image: swordData.image_path, // Mantendremos 'image' por simplicidad en el frontend
                    rarity: swordData.rarity,
                    value_text: swordData.value_text, // <-- CORREGIDO
                    stats_text: swordData.stats_text, // <-- CORREGIDO
                    exist_text: swordData.exist_text, // <-- CORREGIDO
                    demand: swordData.demand,
                    description: swordData.description,
                    chance: parseFloat(rewardRow.chance),
                    updated_at: swordData.updated_at // <-- AÑADIDO
                });
            }
        }

        for (const swordRow of swordsResult.rows) {
            if (swordRow.is_custom) {
                appData.otherSwords.push({
                    id: swordRow.id,
                    name: swordRow.name,
                    image: swordRow.image_path, // Mantendremos 'image'
                    rarity: swordRow.rarity,
                    value_text: swordRow.value_text, // <-- CORREGIDO
                    stats_text: swordRow.stats_text, // <-- CORREGIDO
                    exist_text: swordRow.exist_text, // <-- CORREGIDO
                    demand: swordRow.demand,
                    description: swordRow.description,
                    lastUpdated: swordRow.updated_at // <-- CORREGIDO (usamos lastUpdated para consistencia)
                });
            }
        }

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(appData)
        };

    } catch (error) {
        console.error("Error fetching game data:", error);
        return { statusCode: 500, body: JSON.stringify({ message: "An internal server error occurred." }) };
    } finally {
        client.release();
    }
};