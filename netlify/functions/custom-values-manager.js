const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const axios = require('axios'); // Para enviar el webhook a Discord

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL; // ¡Añade esto a tus variables de entorno en Netlify!

// Función principal que enruta las peticiones
exports.handler = async (event) => {
  const token = event.headers.authorization?.split(' ')[1];
  if (!token) {
    return { statusCode: 401, body: JSON.stringify({ message: 'Not authorized' }) };
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (event.httpMethod === 'GET') {
      return await handleGetValueList(decoded.userId, event.queryStringParameters.caseId);
    }
    if (event.httpMethod === 'POST') {
      return await handleSaveValueList(decoded.userId, decoded.username, JSON.parse(event.body));
    }
    return { statusCode: 405, body: 'Method Not Allowed' };
  } catch (error) {
    return { statusCode: 401, body: JSON.stringify({ message: 'Invalid token' }) };
  }
};

// Obtiene la lista de un usuario
async function handleGetValueList(userId, caseId) {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT custom_values FROM user_case_values WHERE user_id = $1 AND case_id = $2', [userId, caseId]);
    return {
      statusCode: 200,
      body: JSON.stringify(res.rows[0]?.custom_values || {})
    };
  } catch (error) {
    // ... manejo de errores
  } finally {
    client.release();
  }
}

// REEMPLAZA tu función handleSaveValueList con esta versión
async function handleSaveValueList(userId, username, body) {
  const { caseId, customValues, caseName } = body;
  const client = await pool.connect();
  try {
    // CORRECCIÓN: La consulta ahora especifica sobre qué columnas es el conflicto
    // y usa RETURNING xmax para saber si fue un INSERT (nuevo) o un UPDATE (modificado).
    const query = `
      INSERT INTO user_case_values (user_id, case_id, custom_values)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, case_id)
      DO UPDATE SET custom_values = $3, updated_at = NOW()
      RETURNING xmax
    `;
    const result = await client.query(query, [userId, caseId, JSON.stringify(customValues)]);

    // xmax = 0 significa que fue una inserción (fila nueva). No-cero significa que fue una actualización.
    const isUpdate = result.rows[0].xmax !== '0';

    // Enviamos la notificación a Discord con la información correcta
    sendDiscordNotification(username, caseName, customValues, isUpdate);

    return { statusCode: 200, body: JSON.stringify({ message: 'Values saved successfully!' }) };
  } catch (error) {
    console.error("Error saving custom values:", error);
    return { statusCode: 500, body: JSON.stringify({ message: "Internal server error." }) };
  } finally {
    client.release();
  }
}

// REEMPLAZA tu función sendDiscordNotification con esta versión
function sendDiscordNotification(username, caseName, customValues, isUpdate) {
    if (!DISCORD_WEBHOOK_URL) return;

    const fields = Object.entries(customValues).map(([swordName, value]) => ({
        name: swordName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), // Formatea el nombre
        value: `\`${parseValue(value).toLocaleString()}\``, // Usa tu función parseValue y formatea
        inline: true
    }));

    const embed = {
        title: isUpdate ? `Custom Values Updated for "${caseName}"` : `New Custom Values Submitted for "${caseName}"`,
        color: isUpdate ? 16766720 : 3066993, // Amarillo para update, Verde para create
        author: {
            name: username
        },
        fields: fields,
        footer: {
            text: "STS Values"
        },
        timestamp: new Date().toISOString()
    };

    axios.post(DISCORD_WEBHOOK_URL, { embeds: [embed] }).catch(err => console.error("Discord Webhook Error:", err.message));
}