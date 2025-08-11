const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const pool = new Pool({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Función para generar un ID amigable a partir del nombre (ej: "Neon Red Dilemma" -> "neon-red-dilemma")
const generateId = (name) => {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
};

exports.handler = async (event) => {
    // 1. Verificamos que sea un método POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) };
    }

    try {
        // 2. Seguridad: Verificamos el token y el rol de 'owner'
        const token = event.headers.authorization?.split(' ')[1];
        if (!token) return { statusCode: 401, body: JSON.stringify({ message: 'Not authorized' }) };
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'owner') {
            return { statusCode: 403, body: JSON.stringify({ message: 'Forbidden: You do not have permission.' }) };
        }

        // 3. Procesamos la acción
        const { action, payload } = JSON.parse(event.body);
        const client = await pool.connect();

        try {
            if (action === 'createOrUpdateSword') {
                const { swordData } = payload;
                // Si la espada no tiene ID, es nueva y lo generamos.
                const swordId = swordData.id || generateId(swordData.name);

                // Usamos una consulta "UPSERT": si el ID ya existe, actualiza. Si no, inserta.
                const query = `
                    INSERT INTO swords (id, name, image_path, rarity, value_text, stats_text, exist_text, demand, description, is_custom, updated_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
                    ON CONFLICT (id) DO UPDATE SET
                        name = EXCLUDED.name,
                        image_path = EXCLUDED.image_path,
                        rarity = EXCLUDED.rarity,
                        value_text = EXCLUDED.value_text,
                        stats_text = EXCLUDED.stats_text,
                        exist_text = EXCLUDED.exist_text,
                        demand = EXCLUDED.demand,
                        description = EXCLUDED.description,
                        is_custom = EXCLUDED.is_custom,
                        updated_at = NOW()
                    RETURNING *;
                `;
                
                const result = await client.query(query, [
                    swordId,
                    swordData.name,
                    swordData.image_path,
                    swordData.rarity,
                    swordData.value_text,
                    swordData.stats_text,
                    swordData.exist_text,
                    swordData.demand,
                    swordData.description,
                    swordData.is_custom
                ]);

                return {
                    statusCode: 200,
                    body: JSON.stringify({ message: `Sword '${result.rows[0].name}' saved successfully!`, sword: result.rows[0] })
                };
            }

                        // --- ¡AÑADE ESTE BLOQUE NUEVO! ---
            else if (action === 'getAllSwords') {
                const result = await client.query('SELECT * FROM swords ORDER BY name ASC');
                return {
                    statusCode: 200,
                    body: JSON.stringify({ swords: result.rows })
                };
            }

                        // --- ¡AÑADE ESTE BLOQUE NUEVO PARA OBTENER LAS CAJAS! ---
            else if (action === 'getAllCases') {
                const result = await client.query('SELECT * FROM cases ORDER BY name ASC');
                return {
                    statusCode: 200,
                    body: JSON.stringify({ cases: result.rows })
                };
            }

else if (action === 'createOrUpdateCase') {
    // Ahora esperamos 'caseData' y un array opcional 'rewards'
    const { caseData, rewards } = payload; 
    const caseId = caseData.id || generateId(caseData.name);

    // --- Transacción: Hacemos todo o no hacemos nada ---
    try {
        await client.query('BEGIN'); // Iniciar transacción

        // 1. Guardar los datos principales de la caja (como antes)
        const caseQuery = `
            INSERT INTO cases (id, name, image_path, price, currency, border_color, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name, image_path = EXCLUDED.image_path, price = EXCLUDED.price,
                currency = EXCLUDED.currency, border_color = EXCLUDED.border_color, updated_at = NOW()
            RETURNING *;
        `;
        const savedCase = await client.query(caseQuery, [
            caseId, caseData.name, caseData.image_path, parseValue(String(caseData.price)),
            caseData.currency, caseData.border_color
        ]);

        // 2. Gestionar las recompensas (si se han enviado)
        if (rewards && Array.isArray(rewards)) {
            // Borramos todas las recompensas antiguas para esta caja
            await client.query('DELETE FROM case_rewards WHERE case_id = $1', [caseId]);

            // Insertamos las nuevas recompensas una por una
            for (const reward of rewards) {
                if (reward.sword_id && reward.chance) { // Nos aseguramos de tener los datos necesarios
                    await client.query(
                        'INSERT INTO case_rewards (case_id, sword_id, chance) VALUES ($1, $2, $3)',
                        [caseId, reward.sword_id, reward.chance]
                    );
                }
            }
        }

        await client.query('COMMIT'); // Confirmar todos los cambios

        return {
            statusCode: 200,
            body: JSON.stringify({ message: `Case '${savedCase.rows[0].name}' saved successfully!`, case: savedCase.rows[0] })
        };

    } catch (e) {
        await client.query('ROLLBACK'); // Si algo falla, deshacer todo
        throw e; // Lanzar el error para que lo capture el catch principal
    }
}

// Añade este 'else if' a tu handler en manage-data.js
else if (action === 'getAllCasesWithRewards') {
    const casesResult = await client.query('SELECT * FROM cases ORDER BY name ASC');
    const rewardsResult = await client.query('SELECT * FROM case_rewards');
    
    const casesWithRewards = casesResult.rows.map(c => ({
        ...c,
        rewards: rewardsResult.rows.filter(r => r.case_id === c.id)
    }));

    return {
        statusCode: 200,
        body: JSON.stringify({ cases: casesWithRewards })
    };
}

            // Dentro de exports.handler, añade este nuevo 'else if'
else if (action === 'deleteSword') {
    const { swordId } = payload;
    if (!swordId) return { statusCode: 400, body: JSON.stringify({ message: 'Sword ID is required.' }) };

    // Primero, obtenemos los datos de la espada para la notificación
    const swordResult = await client.query('SELECT * FROM swords WHERE id = $1', [swordId]);
    if (swordResult.rowCount === 0) {
        return { statusCode: 404, body: JSON.stringify({ message: 'Sword not found.' }) };
    }
    const swordToDelete = swordResult.rows[0];

    // Luego, la borramos
    await client.query('DELETE FROM swords WHERE id = $1', [swordId]);

    // Finalmente, enviamos la notificación a Discord
    if (process.env.DISCORD_WEBHOOK_URL) {
        const embed = {
            title: `Sword Deleted: ${swordToDelete.name}`,
            color: 15158332, // Rojo
            fields: [
                { name: 'ID', value: `\`${swordToDelete.id}\``, inline: true },
                { name: 'Rarity', value: swordToDelete.rarity, inline: true },
                { name: 'Value', value: `\`${swordToDelete.value_text}\``, inline: true },
                { name: 'Stats', value: swordToDelete.stats_text, inline: true },
                { name: 'Exist', value: `\`${swordToDelete.exist_text}\``, inline: true },
                { name: 'Demand', value: swordToDelete.demand, inline: true },
            ],
            footer: { text: `Deleted by: ${decoded.username}` },
            timestamp: new Date().toISOString()
        };
        await axios.post(process.env.DISCORD_WEBHOOK_URL, { embeds: [embed] });
    }

    return { statusCode: 200, body: JSON.stringify({ message: `Sword '${swordToDelete.name}' has been deleted.` }) };
}
            
            // --- Aquí añadiremos más acciones en el futuro (createCase, etc.) ---

            return { statusCode: 400, body: JSON.stringify({ message: 'Invalid action' }) };

        } finally {
            client.release();
        }

    } catch (error) {
        console.error("Error in manage-data handler:", error);
        // Devolvemos el mensaje de error real si es un error de token, para que el frontend pueda reaccionar
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
             return { statusCode: 401, body: JSON.stringify({ message: error.message }) };
        }
        return { statusCode: 500, body: JSON.stringify({ message: error.message }) };
    }
};