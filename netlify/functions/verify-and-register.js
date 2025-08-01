// Archivo: netlify/functions/verify-and-register.js (VERSIÓN ACTUALIZADA)

const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const axios = require('axios');

// Configuración de la conexión a la base de datos de Neon
const pool = new Pool({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { 
        rejectUnauthorized: false 
    }
});

// --- Funciones de la API de Roblox (sin cambios) ---
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

async function getRobloxUserDescription(userId) {
    try {
        const response = await axios.get(`https://users.roblox.com/v1/users/${userId}`);
        return response.data.description;
    } catch (error) {
        console.error("Error fetching Roblox user description:", error);
        return null;
    }
}

async function getRobloxAvatarUrl(userId) {
    try {
        const response = await axios.get(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png&isCircular=false`);
        if (response.data.data.length > 0) {
            return response.data.data[0].imageUrl;
        }
        return null;
    } catch (error) {
        console.error("Error fetching Roblox avatar:", error);
        return null;
    }
}

// NUEVO: Función auxiliar para obtener el perfil completo del usuario
async function getRobloxUserProfile(userId) {
  try {
    const response = await axios.get(`https://users.roblox.com/v1/users/${userId}`);
    return response.data; // Devuelve el objeto completo del usuario
  } catch (error) {
    console.error("Error fetching Roblox user profile:", error);
    return null;
  }
}


exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { username, password, verificationCode } = JSON.parse(event.body);

        // Paso 1: Verificación con la API de Roblox
        const userId = await getRobloxUserId(username);
        if (!userId) {
            return { statusCode: 404, body: JSON.stringify({ message: "Roblox user not found." }) };
        }

        const description = await getRobloxUserDescription(userId);
        if (!description || !description.includes(verificationCode)) {
            return { statusCode: 400, body: JSON.stringify({ message: "Verification failed. Did you add the code to your Roblox 'About' section?" }) };
        }

            // CORRECCIÓN: Obtenemos el perfil completo para el nombre correcto
    const userProfile = await getRobloxUserProfile(userId);
    const correctUsername = userProfile ? userProfile.name : username; // Usamos el nombre oficial
        
        const avatarUrl = await getRobloxAvatarUrl(userId);

 // Paso 2: Proceder con el registro en nuestra base de datos
    const client = await pool.connect();
    try {
      // Usamos el nombre de usuario que el usuario escribió (insensible) para la comprobación
      const result = await client.query('SELECT id FROM users WHERE username ILIKE $1', [username]); 
      if (result.rows.length > 0) {
        return { statusCode: 409, body: JSON.stringify({ message: "This Roblox user is already registered." }) };
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
            
            // --- CAMBIO PRINCIPAL: INSERTAR EL NUEVO USUARIO CON LOS VALORES POR DEFECTO ---
            // Añadimos las columnas 'role', 'equipped_title', y 'unlocked_titles' en la inserción.
            // PostgreSQL manejará la conversión del array de JS a su tipo TEXT[].
      // PERO guardamos en la base de datos el nombre con las mayúsculas/minúsculas correctas
      await client.query(
        `INSERT INTO users (username, password_hash, roblox_avatar_url, role, equipped_title, unlocked_titles)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [correctUsername, hashedPassword, avatarUrl, 'player', 'player', ['player']]
      );
            
            return {
                statusCode: 201,
                body: JSON.stringify({ message: "Account verified and created successfully! Please log in." })
            };
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Error in registration:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "An internal error occurred." })
        };
    }
};