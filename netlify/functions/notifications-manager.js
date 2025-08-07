const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

const pool = new Pool({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

exports.handler = async (event) => {
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

    const client = await pool.connect();
    try {
        if (event.httpMethod === 'GET') {
            // Obtener todas las notificaciones del usuario
            const result = await client.query(
                `SELECT id, type, content, is_read, created_at FROM notifications WHERE user_id = $1 ORDER BY created_at DESC`,
                [decoded.userId]
            );
            return { statusCode: 200, body: JSON.stringify(result.rows) };
        } else if (event.httpMethod === 'POST') {
            // Marcar todas las notificaciones como leídas
            await client.query(
                `UPDATE notifications SET is_read = true WHERE user_id = $1`,
                [decoded.userId]
            );
            return { statusCode: 200, body: JSON.stringify({ message: 'Notifications marked as read.' }) };
        } else {
            return { statusCode: 405, body: 'Method Not Allowed' };
        }
    } catch (error) {
        console.error("Error in notifications manager:", error);
        return { statusCode: 500, body: JSON.stringify({ message: "An internal server error occurred." }) };
    } finally {
        client.release();
    }
};