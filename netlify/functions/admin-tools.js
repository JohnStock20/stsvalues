// Archivo: netlify/functions/admin-tools.js (NUEVO Y MEJORADO)
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

// --- Funciones de Ayuda ---

// Función para obtener el ID de un usuario por su nombre de usuario
async function getUserId(client, username) {
    const userResult = await client.query('SELECT id FROM users WHERE username = $1', [username]);
    if (userResult.rowCount === 0) {
        throw new Error(`User '${username}' not found.`);
    }
    return userResult.rows[0].id;
}


// --- Handler Principal ---

exports.handler = async (event) => {
  // Solo aceptamos peticiones POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // 1. Verificación del Token y Rol de 'owner'
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

  if (decoded.role !== 'owner') {
    return { statusCode: 403, body: JSON.stringify({ message: 'Forbidden: You do not have permission to perform this action.' }) };
  }

  const issuerUsername = decoded.username;
  const client = await pool.connect();

  try {
    const { action, targetUsername, titleKey, reason, durationHours } = JSON.parse(event.body);

    // 2. Procesar la acción solicitada
    switch (action) {
      case 'grantTitle':
        if (!targetUsername || !titleKey) {
            return { statusCode: 400, body: JSON.stringify({ message: 'Target username and title key are required.' }) };
        }
        const grantResult = await client.query(
          `UPDATE users
           SET unlocked_titles = array_append(unlocked_titles, $1)
           WHERE username = $2 AND NOT ($1 = ANY(unlocked_titles))
           RETURNING username, unlocked_titles`,
          [titleKey, targetUsername]
        );
        if (grantResult.rowCount === 0) {
            return { statusCode: 404, body: JSON.stringify({ message: `User '${targetUsername}' not found or already has the title.` }) };
        }
        return { statusCode: 200, body: JSON.stringify({ message: `Title '${titleKey}' successfully granted to user '${targetUsername}'.` }) };

      case 'warnUser':
        if (!targetUsername || !reason) {
            return { statusCode: 400, body: JSON.stringify({ message: 'Target username and reason are required for a warning.' }) };
        }
        const targetUserIdWarn = await getUserId(client, targetUsername);
        await client.query(
            `INSERT INTO user_sanctions (user_id, sanction_type, reason, issuer_username)
             VALUES ($1, 'warn', $2, $3)`,
            [targetUserIdWarn, reason, issuerUsername]
        );
        return { statusCode: 200, body: JSON.stringify({ message: `User '${targetUsername}' has been warned. Reason: ${reason}` }) };

      case 'banUser':
        if (!targetUsername || !reason) {
            return { statusCode: 400, body: JSON.stringify({ message: 'Target username and reason are required for a ban.' }) };
        }
        const targetUserIdBan = await getUserId(client, targetUsername);
        const isPermanent = !durationHours || durationHours <= 0;
        const expires_at = isPermanent ? null : new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString();
        
        await client.query(
            `INSERT INTO user_sanctions (user_id, sanction_type, reason, issuer_username, expires_at)
             VALUES ($1, 'ban', $2, $3, $4)`,
            [targetUserIdBan, reason, issuerUsername, expires_at]
        );
        const banMessage = isPermanent
            ? `User '${targetUsername}' has been permanently banned. Reason: ${reason}`
            : `User '${targetUsername}' has been banned for ${durationHours} hours. Reason: ${reason}`;
        return { statusCode: 200, body: JSON.stringify({ message: banMessage }) };
        
      default:
        return { statusCode: 400, body: JSON.stringify({ message: 'Invalid action specified.' }) };
    }
  } catch (error) {
    console.error("Error in admin tools:", error);
    return {
      statusCode: error.message.includes('not found') ? 404 : 500,
      body: JSON.stringify({ message: error.message || "An internal server error occurred." })
    };
  } finally {
    client.release();
  }
};