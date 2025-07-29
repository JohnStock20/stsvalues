// Archivo: netlify/functions/get-titles.js (NUEVO)
// Propósito: Obtener la lista de todos los títulos y el estado de desbloqueo para el usuario actual.

const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

// Configuración de la conexión a la base de datos de Neon
const pool = new Pool({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { 
        rejectUnauthorized: false 
    }
});

// --- LISTA MAESTRA DE TÍTULOS ---
// Esta es la fuente de verdad para todos los títulos disponibles en el juego.
const ALL_TITLES = [
    { key: 'player', text: 'Player' },
    { key: 'member', text: 'Member' },
    { key: 'gamedeveloper', text: 'Game Developer' },
    { key: '100t', text: '+100T Value' },
    { key: '250t', text: '+250T Time' },
    { key: 'tester', text: 'Tester' },
    { key: 'owner', text: 'Owner' },
];

exports.handler = async (event) => {
    // Esta función solo acepta peticiones GET
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        // --- Verificación del Token de Usuario ---
        const authHeader = event.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return { statusCode: 401, body: JSON.stringify({ message: 'Authorization token is required.' }) };
        }
        
        const token = authHeader.split(' ')[1];
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            return { statusCode: 401, body: JSON.stringify({ message: 'Invalid or expired token.' }) };
        }

        const { username } = decoded;

        // --- Obtención de datos de la Base de Datos ---
        const client = await pool.connect();
        try {
            const result = await client.query(
                'SELECT unlocked_titles, equipped_title FROM users WHERE username = $1',
                [username]
            );

            if (result.rows.length === 0) {
                return { statusCode: 404, body: JSON.stringify({ message: 'User not found.' }) };
            }

            const user = result.rows[0];
            const userUnlockedTitles = user.unlocked_titles || [];
            const userEquippedTitle = user.equipped_title;

            // --- Procesamiento de los Títulos ---
            // Comparamos la lista maestra con los datos del usuario para construir la respuesta.
            const titlesWithStatus = ALL_TITLES.map(title => ({
                key: title.key,
                text: title.text,
                unlocked: userUnlockedTitles.includes(title.key),
                equipped: title.key === userEquippedTitle
            }));
            
            // --- Respuesta Exitosa ---
            return {
                statusCode: 200,
                body: JSON.stringify(titlesWithStatus)
            };

        } finally {
            client.release();
        }

    } catch (error) {
        console.error("Error fetching titles:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "An internal error occurred." })
        };
    }
};