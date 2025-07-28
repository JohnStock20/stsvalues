// Archivo: netlify/functions/verify-and-register.js

const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const axios = require('axios'); // La librería para llamar a la API de Roblox

const pool = new Pool({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Función para obtener el ID de usuario de Roblox a partir del nombre
async function getRobloxUserId(username) {
    try {
        const response = await axios.post('https://users.roblox.com/v1/usernames/users', {
            "usernames": [username],
            "excludeBannedUsers": true
        });
        if (response.data.data.length > 0) {
            return response.data.data[0].id;
        }
        return null;
    } catch (error) {
        console.error("Error fetching Roblox user ID:", error);
        return null;
    }
}

// Función para obtener la descripción del perfil de un usuario de Roblox
async function getRobloxUserDescription(userId) {
    try {
        const response = await axios.get(`https://users.roblox.com/v1/users/${userId}`);
        return response.data.description;
    } catch (error) {
        console.error("Error fetching Roblox user description:", error);
        return null;
    }
}


exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { username, password, verificationCode } = JSON.parse(event.body);

        // --- VERIFICACIÓN CON ROBLOX ---
        const userId = await getRobloxUserId(username);
        if (!userId) {
            return { statusCode: 404, body: JSON.stringify({ message: "No se encontró el usuario de Roblox." }) };
        }

        const description = await getRobloxUserDescription(userId);
        if (!description || !description.includes(verificationCode)) {
            return { statusCode: 400, body: JSON.stringify({ message: "Verificación fallida. ¿Añadiste el código a tu descripción de Roblox?" }) };
        }

        // --- SI LA VERIFICACIÓN ES CORRECTA, PROCEDEMOS A REGISTRAR ---
        const client = await pool.connect();
        try {
            const result = await client.query('SELECT id FROM users WHERE username = $1', [username]);
            if (result.rows.length > 0) {
                return { statusCode: 409, body: JSON.stringify({ message: "Este usuario de Roblox ya está registrado." }) };
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            
            await client.query('INSERT INTO users (username, password_hash) VALUES ($1, $2)', [username, hashedPassword]);
            
            return {
                statusCode: 201,
                body: JSON.stringify({ message: "¡Cuenta verificada y creada con éxito! Por favor, inicia sesión." })
            };
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Error in registration:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Ocurrió un error interno." })
        };
    }
};