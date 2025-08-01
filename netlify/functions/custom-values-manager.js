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

// Guarda (o actualiza) la lista de un usuario
async function handleSaveValueList(userId, username, body) {
  const { caseId, customValues, caseName } = body;
  const client = await pool.connect();
  try {
    // Usamos una consulta "UPSERT" para insertar o actualizar si ya existe
    const query = `
      INSERT INTO user_case_values (user_id, case_id, custom_values)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, case_id)
      DO UPDATE SET custom_values = $3, updated_at = NOW()
    `;
    await client.query(query, [userId, caseId, JSON.stringify(customValues)]);

    // Enviar notificación a Discord (¡no bloquea la respuesta al usuario!)
    sendDiscordNotification(username, caseName, customValues);

    return { statusCode: 200, body: JSON.stringify({ message: 'Values saved successfully!' }) };
  } catch (error) {
    // ... manejo de errores
  } finally {
    client.release();
  }
}

// Prepara y envía el mensaje a Discord
function sendDiscordNotification(username, caseName, customValues) {
    if (!DISCORD_WEBHOOK_URL) return;

    const fields = Object.entries(customValues).map(([swordName, value]) => ({
        name: swordName,
        value: `\`${value.toLocaleString()}\``, // Formatea el número
        inline: true
    }));

    const embed = {
        title: `New Custom Values Submitted for "${caseName}"`,
        color: 0x2dd4bf, // Color cian
        author: {
            name: username
        },
        fields: fields,
        timestamp: new Date().toISOString()
    };

    axios.post(DISCORD_WEBHOOK_URL, { embeds: [embed] }).catch(console.error);
}