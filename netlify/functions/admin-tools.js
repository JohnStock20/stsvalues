// Archivo: netlify/functions/admin-tools.js (NUEVO)
// Propósito: Endpoint protegido para que el Owner realice acciones administrativas.

const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

// Configuración de la conexión a la base de datos de Neon
const pool = new Pool({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

exports.handler = async (event) => {
    // Solo aceptamos peticiones POST para realizar acciones
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: 'Method Not Allowed' })
        };
    }

    try {
        // --- Paso 1: Verificación del Token y ROL del usuario que hace la llamada ---
        const authHeader = event.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return {
                statusCode: 401,
                body: JSON.stringify({ message: 'Authorization token is required.' })
            };
        }

        const token = authHeader.split(' ')[1];
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            return {
                statusCode: 401,
                body: JSON.stringify({ message: 'Invalid or expired token.' })
            };
        }

        // --- ¡LA CLAVE DE LA SEGURIDAD! ---
        // Verificamos que el rol dentro del token sea 'owner'.
        if (decoded.role !== 'owner') {
            return {
                statusCode: 403,
                body: JSON.stringify({ message: 'Forbidden: You do not have permission to perform this action.' })
            };
        }

        // --- Paso 2: Procesar la acción solicitada ---
        const { action, targetUsername, titleKey, reason, unbanDate } = JSON.parse(event.body);

        // --- Acción: Otorgar un Título ---
        if (action === 'grantTitle') {
            if (!targetUsername || !titleKey) {
                return { statusCode: 400, body: JSON.stringify({ message: 'Target username and title key are required.' }) };
            }
            const client = await pool.connect();
            try {
                const result = await client.query(
                    `UPDATE users SET unlocked_titles = array_append(unlocked_titles, $1) WHERE username ILIKE $2 AND NOT ($1 = ANY(unlocked_titles)) RETURNING username`,
                    [titleKey, targetUsername]
                );
                if (result.rowCount === 0) {
                    return { statusCode: 404, body: JSON.stringify({ message: `User '${targetUsername}' not found or already has the title.` }) };
                }
                return { statusCode: 200, body: JSON.stringify({ message: `Title '${titleKey}' successfully granted to user '${targetUsername}'.` }) };
            } finally {
                client.release();
            }
        }
        // --- Acción: Banear un Usuario ---
        else if (action === 'banUser') {
            if (!targetUsername) {
                return { statusCode: 400, body: JSON.stringify({ message: 'Target username is required to ban a user.' }) };
            }
            const client = await pool.connect();
            try {
                const result = await client.query(
                    `UPDATE users SET is_banned = true, ban_reason = $1, ban_expires_at = $2 WHERE username ILIKE $3 RETURNING username`,
                    [reason, unbanDate || null, targetUsername]
                );
                if (result.rowCount === 0) {
                    return { statusCode: 404, body: JSON.stringify({ message: `User '${targetUsername}' not found.` }) };
                }
                return { statusCode: 200, body: JSON.stringify({ message: `User '${result.rows[0].username}' has been banned.` }) };
            } finally {
                client.release();
            }
        }
        // --- Acción: Desbanear un Usuario ---
        else if (action === 'unbanUser') {
            if (!targetUsername) {
                return { statusCode: 400, body: JSON.stringify({ message: 'Target username is required to unban a user.' }) };
            }
            const client = await pool.connect();
            try {
                const result = await client.query(
                    `UPDATE users SET is_banned = false, ban_reason = NULL, ban_expires_at = NULL WHERE username ILIKE $1 RETURNING username`,
                    [targetUsername]
                );
                if (result.rowCount === 0) {
                    return { statusCode: 404, body: JSON.stringify({ message: `User '${targetUsername}' not found.` }) };
                }
                return { statusCode: 200, body: JSON.stringify({ message: `User '${result.rows[0].username}' has been unbanned.` }) };
            } finally {
                client.release();
            }
        }
        // --- Acción no válida ---
        else {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Invalid action specified.' })
            };
        }

    } catch (error) {
        console.error("Error in admin tools:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "An internal server error occurred." })
        };
    }
};