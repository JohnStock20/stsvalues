// Archivo: netlify/functions/login.js (VERSIÓN ACTUALIZADA)

const bcrypt = require('bcryptjs');
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
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { username, password } = JSON.parse(event.body);

        if (!username || !password) {
            return { statusCode: 400, body: JSON.stringify({ message: "Username and password are required." }) };
        }

        const client = await pool.connect();
        try {
            // Paso 1: Buscamos al usuario y OBTENEMOS LOS NUEVOS DATOS (role, titles, etc.)
            const result = await client.query(
                'SELECT id, username, password_hash, roblox_avatar_url, role, equipped_title, unlocked_titles FROM users WHERE username ILIKE $1',
                [username]
            );

            if (result.rows.length === 0) {
                return { statusCode: 401, body: JSON.stringify({ message: "Invalid username or password." }) };
            }

            const user = result.rows[0];

            // Paso 2: Comparamos la contraseña (sin cambios)
            const passwordIsValid = await bcrypt.compare(password, user.password_hash);

            if (!passwordIsValid) {
                return { statusCode: 401, body: JSON.stringify({ message: "Invalid username or password." }) };
            }

            // Paso 3: Creamos el token incluyendo el ROL del usuario para usarlo en el frontend
            const token = jwt.sign(
                { 
                    userId: user.id, 
                    username: user.username,
                    role: user.role // ¡Importante! Incluimos el rol en el "pase VIP"
                },
                process.env.JWT_SECRET,
                { expiresIn: '1d' }
            );
            
            // Paso 4: Devolvemos una respuesta de éxito con TODOS LOS DATOS del perfil
            return {
                statusCode: 200,
                body: JSON.stringify({ 
                    message: "Login successful!",
                    token: token,
                    user: {
                        username: user.username,
                        avatar: user.roblox_avatar_url,
                        // --- NUEVOS DATOS DEL PERFIL ---
                        role: user.role,
                        equippedTitle: user.equipped_title,
                        unlockedTitles: user.unlocked_titles
                    }
                })
            };
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Login error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "An internal error occurred." })
        };
    }
};