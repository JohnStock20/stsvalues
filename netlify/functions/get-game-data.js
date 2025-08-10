// Archivo: netlify/functions/get-game-data.js (Versión Corregida y Final)

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// --- ¡NUEVO! Definimos los datos estáticos de las divisas aquí ---
const currenciesData = {
    "time": { name: "Time", icon: null },
    "diamonds": { name: "Diamonds", icon: "images/diamonds.png" },
    "heartstones": { name: "Heartstones", icon: "images/heartstones.png" },
    "cooldown": { name: "Cooldown", icon: null } // Lo mantenemos por consistencia
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
            currencies: currenciesData, // <-- ¡CORRECCIÓN CLAVE! Añadimos las divisas aquí.
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
                    image: swordData.image_path,
                    rararidad: swordData.rarity,
                    value: swordData.value_text,
                    stats: swordData.stats_text,
                    exist: swordData.exist_text,
                    demand: swordData.demand,
                    description: swordData.description,
                    chance: parseFloat(rewardRow.chance)
                });
            }
        }

        for (const swordRow of swordsResult.rows) {
            if (swordRow.is_custom) {
                appData.otherSwords.push({
                    id: swordRow.id,
                    name: swordRow.name,
                    image: swordData.image_path,
                    rarity: swordData.rarity,
                    value: swordData.value_text,
                    stats: swordData.stats_text,
                    exist: swordData.exist_text,
                    demand: swordData.demand,
                    description: swordData.description,
                    lastUpdated: swordRow.updated_at
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
        return { statusCode: 500, body: JSON.stringify({ message: "An internal error occurred." }) };
    } finally {
        client.release();
    }
};