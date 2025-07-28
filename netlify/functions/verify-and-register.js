// Archivo: netlify/functions/verify-and-register.js

const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const axios = require('axios'); // La librería para llamar a la API de Roblox

// Configuración de la conexión a la base de datos de Neon
const pool = new Pool({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { 
        rejectUnauthorized: false 
    }
});

// --- FUNCIONES PARA INTERACTUAR CON LA API DE ROBLOX ---

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

// Función para obtener la URL del avatar de un usuario de Roblox
async function getRobloxAvatarUrl(userId) {
    try {
        const response = await axios.get(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png&isCircular=false`);
        if (response.data.data.length > 0) {
            return response.data.data[0].imageUrl;
        }
        return null; // O puedes devolver una URL de avatar por defecto
    } catch (error) {
        console.error("Error fetching Roblox avatar:", error);
        return null;
    }
}


// --- LÓGICA PRINCIPAL DEL SCRIPT ---

exports.handler = async (event) => {
    // Solo permitimos peticiones de tipo POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        // Obtenemos los datos enviados desde el frontend
        const { username, password, verificationCode } = JSON.parse(event.body);

        // Paso 1: Verificar la cuenta con la API de Roblox
        const userId = await getRobloxUserId(username);
        if (!userId) {
            return { statusCode: 404, body: JSON.stringify({ message: "No se encontró el usuario de Roblox." }) };
        }

        const description = await getRobloxUserDescription(userId);
        if (!description || !description.includes(verificationCode)) {
            return { statusCode: 400, body: JSON.stringify({ message: "Verificación fallida. ¿Añadiste el código a tu descripción de Roblox?" }) };
        }
        
        // Paso 2: Obtener la URL del avatar
        const avatarUrl = await getRobloxAvatarUrl(userId);

        // Paso 3: Proceder con el registro en nuestra base de datos
        const client = await pool.connect();
        try {
            // Comprobar si el usuario ya existe en nuestra BD
            const result = await client.query('SELECT id FROM users WHERE username = $1', [username]);
            if (result.rows.length > 0) {
                return { statusCode: 409, body: JSON.stringify({ message: "Este usuario de Roblox ya está registrado." }) };
            }

            // Encriptar la contraseña
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            
            // Insertar el nuevo usuario con su avatar en la BD
            await client.query(
                'INSERT INTO users (username, password_hash, roblox_avatar_url) VALUES ($1, $2, $3)',
                [username, hashedPassword, avatarUrl]
            );
            
            // Devolver respuesta de éxito
            return {
                statusCode: 201,
                body: JSON.stringify({ message: "¡Cuenta verificada y creada con éxito! Por favor, inicia sesión." })
            };
        } finally {
            // Asegurarse de liberar la conexión a la BD
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