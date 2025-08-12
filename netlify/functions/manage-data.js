// Archivo: netlify/functions/manage-data.js (VERSIÓN FINAL COMPLETA)

const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const pool = new Pool({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// --- FUNCIONES DE UTILIDAD DEL BACKEND ---

// Función para parsear valores (necesaria para el precio de las cajas)
function parseValue(value) {
    if (typeof value === 'number') return value;
    if (typeof value !== 'string' || !value) return 0;
    let processableValue = value.trim().toUpperCase();
    if (processableValue.startsWith('O/C')) {
        const match = processableValue.match(/\[(.*?)\]/);
        processableValue = (match && match[1]) ? match[1] : '0';
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

// Función para generar un ID amigable a partir del nombre
const generateId = (name) => {
    if (typeof name !== 'string' || !name) return `item-${Date.now()}`;
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
};


// --- HANDLER PRINCIPAL DE LA FUNCIÓN ---

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) };
    }

    const client = await pool.connect();
    try {
        // 1. Seguridad: Verificamos el token y el rol de 'owner'
        const token = event.headers.authorization?.split(' ')[1];
        if (!token) return { statusCode: 401, body: JSON.stringify({ message: 'Not authorized' }) };
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'owner') {
            return { statusCode: 403, body: JSON.stringify({ message: 'Forbidden: You do not have permission.' }) };
        }

        // 2. Procesamos la acción solicitada
        const { action, payload } = JSON.parse(event.body);

// En manage-data.js, reemplaza esta acción
if (action === 'createOrUpdateSword') {
    const { swordData } = payload;
    const swordId = swordData.id || generateId(swordData.name);

    await client.query('BEGIN'); // Iniciar transacción
    try {
        // 1. Obtenemos el estado actual de la espada ANTES de actualizarla
        const previousStateResult = await client.query('SELECT * FROM swords WHERE id = $1', [swordId]);
        const previousValues = previousStateResult.rows[0];

        // 2. Actualizamos o insertamos la espada (UPSERT)
        const query = `
            INSERT INTO swords (id, name, image_path, rarity, value_text, stats_text, exist_text, demand, description, is_custom, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name, image_path = EXCLUDED.image_path, rarity = EXCLUDED.rarity,
                value_text = EXCLUDED.value_text, stats_text = EXCLUDED.stats_text, exist_text = EXCLUDED.exist_text,
                demand = EXCLUDED.demand, description = EXCLUDED.description, is_custom = EXCLUDED.is_custom, updated_at = NOW()
            RETURNING *;`;
        const result = await client.query(query, [
            swordId, swordData.name, swordData.image_path, swordData.rarity, swordData.value_text,
            swordData.stats_text, swordData.exist_text, swordData.demand, swordData.description, swordData.is_custom
        ]);
        const newValues = result.rows[0];

        // 3. Si la espada existía y ha cambiado, creamos un registro en el log
        if (previousValues) {
             await client.query(
                `INSERT INTO update_log (sword_id, changed_by, previous_values, new_values) VALUES ($1, $2, $3, $4)`,
                [swordId, decoded.username, JSON.stringify(previousValues), JSON.stringify(newValues)]
            );
        }

        await client.query('COMMIT');
        return { statusCode: 200, body: JSON.stringify({ message: `Sword '${newValues.name}' saved successfully!`, sword: newValues }) };

    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    }
}
        
        // --- ACCIÓN: OBTENER TODAS LAS ESPADAS ---
        else if (action === 'getAllSwords') {
            const result = await client.query('SELECT * FROM swords ORDER BY name ASC');
            return { statusCode: 200, body: JSON.stringify({ swords: result.rows }) };
        } 
        
        // --- ACCIÓN: BORRAR UNA ESPADA ---
        else if (action === 'deleteSword') {
            const { swordId } = payload;
            if (!swordId) return { statusCode: 400, body: JSON.stringify({ message: 'Sword ID is required.' }) };
            const swordResult = await client.query('SELECT * FROM swords WHERE id = $1', [swordId]);
            if (swordResult.rowCount === 0) return { statusCode: 404, body: JSON.stringify({ message: 'Sword not found.' }) };
            const swordToDelete = swordResult.rows[0];
            await client.query('DELETE FROM swords WHERE id = $1', [swordId]);
            if (process.env.DISCORD_WEBHOOK_URL) {
            try {
                const embed = {
                    title: `Sword Deleted: ${swordToDelete.name}`, color: 15158332,
                    fields: [
                        { name: 'ID', value: `\`${swordToDelete.id}\``, inline: true }, { name: 'Rarity', value: swordToDelete.rarity, inline: true },
                        { name: 'Value', value: `\`${swordToDelete.value_text}\``, inline: true }, { name: 'Stats', value: swordToDelete.stats_text, inline: true },
                        { name: 'Exist', value: `\`${swordToDelete.exist_text}\``, inline: true }, { name: 'Demand', value: swordToDelete.demand, inline: true },
                    ],
                    footer: { text: `Deleted by: ${decoded.username}` }, timestamp: new Date().toISOString()
                };
                await axios.post(process.env.DISCORD_WEBHOOK_URL, { embeds: [embed] });
                        } catch (discordError) {
            console.error("Failed to send Discord notification:", discordError.message);
            // No devolvemos un error al usuario, solo lo registramos, ya que la espada SÍ se borró.
               }
            }
            return { statusCode: 200, body: JSON.stringify({ message: `Sword '${swordToDelete.name}' has been deleted.` }) };
        } 
        
        // --- ACCIÓN: OBTENER CAJAS CON SUS RECOMPENSAS ---
        else if (action === 'getAllCasesWithRewards') {
            const casesResult = await client.query('SELECT * FROM cases ORDER BY name ASC');
            const rewardsResult = await client.query('SELECT * FROM case_rewards');
            const casesWithRewards = casesResult.rows.map(c => ({
                ...c,
                rewards: rewardsResult.rows.filter(r => r.case_id === c.id)
            }));
            return { statusCode: 200, body: JSON.stringify({ cases: casesWithRewards }) };
        }
        
        // --- ACCIÓN: CREAR O ACTUALIZAR UNA CAJA Y SUS RECOMPENSAS ---
        else if (action === 'createOrUpdateCase') {
            const { caseData, rewards } = payload;
            const caseId = caseData.id || generateId(caseData.name);
            try {
                await client.query('BEGIN');
                const caseQuery = `
                    INSERT INTO cases (id, name, image_path, price, currency, border_color, updated_at)
                    VALUES ($1, $2, $3, $4, $5, $6, NOW())
                    ON CONFLICT (id) DO UPDATE SET
                        name = EXCLUDED.name, image_path = EXCLUDED.image_path, price = EXCLUDED.price,
                        currency = EXCLUDED.currency, border_color = EXCLUDED.border_color, updated_at = NOW()
                    RETURNING *;`;
                const savedCase = await client.query(caseQuery, [
                    caseId, caseData.name, caseData.image_path, parseValue(String(caseData.price)),
                    caseData.currency, caseData.border_color
                ]);
                if (rewards && Array.isArray(rewards)) {
                    await client.query('DELETE FROM case_rewards WHERE case_id = $1', [caseId]);
                    for (const reward of rewards) {
                        if (reward.sword_id && reward.chance) {
                            await client.query('INSERT INTO case_rewards (case_id, sword_id, chance) VALUES ($1, $2, $3)', [caseId, reward.sword_id, reward.chance]);
                        }
                    }
                }
                await client.query('COMMIT');
                return {
                    statusCode: 200,
                    body: JSON.stringify({ message: `Case '${savedCase.rows[0].name}' saved successfully!`, case: savedCase.rows[0] })
                };
            } catch (e) {
                await client.query('ROLLBACK');
                throw e;
            }
        }

        else if (action === 'updateCasesOrder') {
        const { orderedCaseIds } = payload; // Esperamos un array de IDs en el orden correcto
        
        // Usamos una transacción para asegurar que todo se haga de una vez
        try {
            await client.query('BEGIN');
            // Usamos un bucle para actualizar cada caja con su nueva posición (índice + 1)
            for (let i = 0; i < orderedCaseIds.length; i++) {
                const caseId = orderedCaseIds[i];
                const newOrder = i + 1;
                await client.query('UPDATE cases SET sort_order = $1 WHERE id = $2', [newOrder, caseId]);
            }
            await client.query('COMMIT');
            return { statusCode: 200, body: JSON.stringify({ message: 'Cases order updated successfully!' }) };
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        }
    }
        
        // --- SI NINGUNA ACCIÓN COINCIDE ---
        else {
            return { statusCode: 400, body: JSON.stringify({ message: 'Invalid action specified.' }) };
        }
    } catch (error) {
        console.error("Error in manage-data handler:", error);
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
             return { statusCode: 401, body: JSON.stringify({ message: error.message }) };
        }
        return { statusCode: 500, body: JSON.stringify({ message: "An internal server error occurred." }) };
    } finally {
        if (client) {
            client.release();
        }
    }
};