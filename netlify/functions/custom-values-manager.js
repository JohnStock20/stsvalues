const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const axios = require('axios');

// =====================================================================
// COPIA DE LA FUNCIÓN parseValue DEL FRONTEND (data.js)
// Esto hace que la función del backend sea autosuficiente.
// =====================================================================
function parseValue(value) {
    if (typeof value === 'number') return value;
    if (typeof value !== 'string' || !value) return 0;
    let processableValue = value.trim().toUpperCase();
    if (processableValue.startsWith('O/C')) {
        const match = processableValue.match(/\[(.*?)\]/);
        if (match && match[1]) {
            processableValue = match[1];
        } else {
            return 0;
        }
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

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

async function sendDiscordNotification(username, caseName, customValues, isUpdate) {
    if (!DISCORD_WEBHOOK_URL) {
        console.log("Discord Webhook URL no configurada. Saltando notificación.");
        return;
    }
    try {
        const fields = Object.entries(customValues).map(([swordId, value]) => ({
            name: swordId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            value: `\`${parseValue(value).toLocaleString()}\``, // AHORA FUNCIONA
            inline: true
        }));
        const embed = {
            title: isUpdate ? `Custom Values Updated for "${caseName}"` : `New Custom Values Submitted for "${caseName}"`,
            color: isUpdate ? 16766720 : 3066993,
            author: { name: username },
            fields: fields,
            footer: { text: "STS Values" },
            timestamp: new Date().toISOString()
        };
        await axios.post(DISCORD_WEBHOOK_URL, { embeds: [embed] });
    } catch (error) {
        console.error("Error al enviar la notificación a Discord:", error.message);
    }
}

exports.handler = async (event) => {
    // ... (el resto del archivo es el mismo, lo pongo completo por seguridad)
    const token = event.headers.authorization?.split(' ')[1];
    if (!token) return { statusCode: 401, body: JSON.stringify({ message: 'Not authorized' }) };
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

async function handleGetValueList(userId, caseId) {
    if (!caseId) return { statusCode: 400, body: JSON.stringify({ message: 'Case ID is required.' }) };
    const client = await pool.connect();
    try {
        const res = await client.query('SELECT custom_values FROM user_case_values WHERE user_id = $1 AND case_id = $2', [userId, caseId]);
        return {
            statusCode: 200,
            body: JSON.stringify(res.rows[0]?.custom_values || null)
        };
    } catch (error) {
        console.error("Error fetching values:", error);
        return { statusCode: 500, body: JSON.stringify({ message: "Internal server error." }) };
    } finally {
        client.release();
    }
}

async function handleSaveValueList(userId, username, body) {
    const { caseId, customValues, caseName } = body;
    const client = await pool.connect();
    try {
        const query = `
            INSERT INTO user_case_values (user_id, case_id, custom_values)
            VALUES ($1, $2, $3)
            ON CONFLICT (user_id, case_id)
            DO UPDATE SET custom_values = $3, updated_at = NOW()
            RETURNING xmax
        `;
        const result = await client.query(query, [userId, caseId, JSON.stringify(customValues)]);
        const isUpdate = result.rows[0].xmax !== '0';
        sendDiscordNotification(username, caseName, customValues, isUpdate);
        return { statusCode: 200, body: JSON.stringify({ message: 'Values saved successfully!' }) };
    } catch (error) {
        console.error("Error saving custom values:", error);
        return { statusCode: 500, body: JSON.stringify({ message: "Error saving values to the database." }) };
    } finally {
        client.release();
    }
}