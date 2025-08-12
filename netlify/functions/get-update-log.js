// Archivo: netlify/functions/get-update-log.js

const { Pool } = require('pg');
const pool = new Pool({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

exports.handler = async (event) => {
    // Es una función pública
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }
    const client = await pool.connect();
    try {
        // Obtenemos los últimos 50 cambios, uniendo con la tabla de espadas para tener los datos actuales
        const result = await client.query(`
            SELECT 
                log.id, log.previous_values, log.new_values, log.created_at,
                s.name as sword_name, s.image_path as sword_image, s.rarity as sword_rarity
            FROM update_log log
            JOIN swords s ON log.sword_id = s.id
            ORDER BY log.created_at DESC
            LIMIT 50
        `);
        return { statusCode: 200, body: JSON.stringify(result.rows) };
    } catch (error) {
        console.error("Error fetching update log:", error);
        return { statusCode: 500, body: JSON.stringify({ message: "An internal error occurred." }) };
    } finally {
        client.release();
    }
};