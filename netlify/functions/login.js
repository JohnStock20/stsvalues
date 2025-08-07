// Archivo: netlify/functions/login.js (VERSIÓN FINAL Y CORREGIDA)

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

    const client = await pool.connect();
    try {
        const { username, password } = JSON.parse(event.body);

        if (!username || !password) {
            return { statusCode: 400, body: JSON.stringify({ message: "Username and password are required." }) };
        }

        // ¡CORRECCIÓN CLAVE! Ahora pedimos TODOS los campos necesarios, incluyendo los de baneo.
        const result = await client.query(
            'SELECT id, username, password_hash, roblox_avatar_url, role, equipped_title, unlocked_titles, is_banned, ban_reason, ban_expires_at FROM users WHERE username ILIKE $1',
            [username]
        );

        if (result.rows.length === 0) {
            return { statusCode: 401, body: JSON.stringify({ message: "Invalid username or password." }) };
        }

        const user = result.rows[0];

        // --- Comprobación de Baneo ---
        if (user.is_banned) {
            const now = new Date();
            const expires = user.ban_expires_at ? new Date(user.ban_expires_at) : null;

            // Si el baneo ha expirado, lo levantamos y permitimos el login
            if (expires && now > expires) {
                await client.query(
                    `UPDATE users SET is_banned = false, ban_reason = NULL, ban_expires_at = NULL WHERE id = $1`,
                    [user.id]
                );
                user.is_banned = false; // Actualizamos el objeto local para continuar.
            } else {
                // Si el baneo sigue activo, denegamos el login
                return {
                    statusCode: 403, // Forbidden
                    body: JSON.stringify({
                        message: 'This account is banned.',
                        ban_reason: user.ban_reason,
                        ban_expires_at: user.ban_expires_at
                    })
                };
            }
        }
        // --- Fin de la comprobación de Baneo ---

        const passwordIsValid = await bcrypt.compare(password, user.password_hash);
        if (!passwordIsValid) {
            return { statusCode: 401, body: JSON.stringify({ message: "Invalid username or password." }) };
        }

        // Creamos el token incluyendo el ROL del usuario
        const token = jwt.sign(
            { 
                userId: user.id, 
                username: user.username,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );
        
        // Devolvemos una respuesta de éxito con TODOS LOS DATOS del perfil
        return {
            statusCode: 200,
            body: JSON.stringify({ 
                message: "Login successful!",
                token: token,
                user: {
                    username: user.username,
                    avatar: user.roblox_avatar_url,
                    role: user.role,
                    equippedTitle: user.equipped_title,
                    unlockedTitles: user.unlocked_titles,
                    is_banned: user.is_banned // Incluimos el estado de baneo para el frontend
                }
            })
        };

    } catch (error) {
        console.error("Login error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "An internal server error occurred." })
        };
    } finally {
        // Aseguramos que la conexión con la base de datos se cierre siempre
        client.release();
    }
};