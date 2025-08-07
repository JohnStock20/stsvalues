// Archivo: netlify/functions/admin-tools.js

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
        const client = await pool.connect();

        try {
            // Obtenemos el ID del usuario objetivo para todas las acciones, así no repetimos código
            const userResult = await client.query(`SELECT id, username FROM users WHERE username ILIKE $1`, [targetUsername]);
            if (userResult.rowCount === 0) {
                return { statusCode: 404, body: JSON.stringify({ message: `User '${targetUsername}' not found.` }) };
            }
            const targetUser = userResult.rows[0];

            // --- Acción: Otorgar un Título ---
            if (action === 'grantTitle') {
                if (!titleKey) {
                    return { statusCode: 400, body: JSON.stringify({ message: 'Title key is required.' }) };
                }
                await client.query(
                    `UPDATE users SET unlocked_titles = array_append(unlocked_titles, $1) WHERE id = $2 AND NOT ($1 = ANY(unlocked_titles))`,
                    [titleKey, targetUser.id]
                );
                
                // Insertar notificación
                const content = { title_key: titleKey, granted_by: decoded.username };
                await client.query(
                    `INSERT INTO notifications (user_id, type, content) VALUES ($1, 'title_grant', $2)`,
                    [targetUser.id, JSON.stringify(content)]
                );
                
                return { statusCode: 200, body: JSON.stringify({ message: `Title '${titleKey}' successfully granted to user '${targetUser.username}'.` }) };
            }
            // --- Acción: Advertir a un Usuario ---
            else if (action === 'warnUser') {
                if (!reason) {
                    return { statusCode: 400, body: JSON.stringify({ message: 'Reason is required for a warning.' }) };
                }
                
                // Insertar notificación (esto reemplaza la antigua tabla 'warnings')
                const content = { reason: reason, issued_by: decoded.username };
                await client.query(
                    `INSERT INTO notifications (user_id, type, content) VALUES ($1, 'warning', $2)`,
                    [targetUser.id, JSON.stringify(content)]
                );
                
                return { statusCode: 200, body: JSON.stringify({ message: `Warning issued successfully to '${targetUser.username}'.` }) };
            }
            // --- Acción: Banear un Usuario ---
            else if (action === 'banUser') {
                await client.query(
                    `UPDATE users SET is_banned = true, ban_reason = $1, ban_expires_at = $2 WHERE id = $3`,
                    [reason, unbanDate || null, targetUser.id]
                );
                
                // Insertar notificación
                const content = { reason: reason, expires_at: unbanDate || null, issued_by: decoded.username };
                await client.query(
                    `INSERT INTO notifications (user_id, type, content) VALUES ($1, 'ban', $2)`,
                    [targetUser.id, JSON.stringify(content)]
                );

                return { statusCode: 200, body: JSON.stringify({ message: `User '${targetUser.username}' has been banned.` }) };
            }
            // --- Acción: Desbanear un Usuario ---
            else if (action === 'unbanUser') {
                await client.query(
                    `UPDATE users SET is_banned = false, ban_reason = NULL, ban_expires_at = NULL WHERE id = $1`,
                    [targetUser.id]
                );

                // Insertar notificación
                const content = { unbanned_by: decoded.username };
                await client.query(
                    `INSERT INTO notifications (user_id, type, content) VALUES ($1, 'unban', $2)`,
                    [targetUser.id, JSON.stringify(content)]
                );

                return { statusCode: 200, body: JSON.stringify({ message: `User '${targetUser.username}' has been unbanned.` }) };
            }
            // --- Acción no válida ---
            else {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ message: 'Invalid action specified.' })
                };
            }
        } finally {
            // Aseguramos que el cliente de la base de datos se libere siempre
            client.release();
        }
    } catch (error) {
        console.error("Error in admin tools:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "An internal server error occurred." })
        };
    }
};