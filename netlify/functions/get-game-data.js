// Archivo: netlify/functions/get-game-data.js

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

exports.handler = async (event) => {
    // Esta función es pública, no necesita token de autenticación.
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const client = await pool.connect();
    try {
        // 1. Obtenemos todas las cajas, espadas y recompensas en paralelo
        const casesPromise = client.query('SELECT * FROM cases');
        const swordsPromise = client.query('SELECT * FROM swords');
        const rewardsPromise = client.query('SELECT * FROM case_rewards');

        const [casesResult, swordsResult, rewardsResult] = await Promise.all([
            casesPromise,
            swordsPromise,
            rewardsPromise,
        ]);

        // 2. Procesamos los datos para reconstruir la estructura de appData

        // Creamos un mapa de espadas para un acceso rápido (id -> datos de la espada)
        const swordsMap = new Map(swordsResult.rows.map(s => [s.id, s]));

        const appData = {
            cases: {},
            otherSwords: []
        };

        // Llenamos el objeto de cajas
        for (const caseRow of casesResult.rows) {
            appData.cases[caseRow.id] = {
                id: caseRow.id,
                name: caseRow.name,
                image: caseRow.image_path,
                price: caseRow.price,
                currency: caseRow.currency,
                borderColor: caseRow.border_color,
                rewards: [] // Preparamos el array para las recompensas
            };
        }

        // Llenamos el array de recompensas para cada caja
        for (const rewardRow of rewardsResult.rows) {
            const swordData = swordsMap.get(rewardRow.sword_id);
            if (swordData && appData.cases[rewardRow.case_id]) {
                appData.cases[rewardRow.case_id].rewards.push({
                    id: swordData.id,
                    name: swordData.name,
                    image: swordData.image_path,
                    rarity: swordData.rarity,
                    value: swordData.value_text,
                    stats: swordData.stats_text,
                    exist: swordData.exist_text,
                    demand: swordData.demand,
                    description: swordData.description,
                    chance: parseFloat(rewardRow.chance) // Aseguramos que sea un número
                });
            }
        }

        // Llenamos el array de otherSwords
        for (const swordRow of swordsResult.rows) {
            if (swordRow.is_custom) {
                appData.otherSwords.push({
                    id: swordRow.id,
                    name: swordRow.name,
                    image: swordRow.image_path,
                    rarity: swordRow.rarity,
                    value: swordRow.value_text,
                    stats: swordRow.stats_text,
                    exist: swordRow.exist_text,
                    demand: swordRow.demand,
                    description: swordRow.description,
                    lastUpdated: swordRow.updated_at // ¡Ahora tenemos la fecha de actualización real!
                });
            }
        }

        // 3. Devolvemos el objeto completo
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