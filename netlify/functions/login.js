// Archivo: netlify/functions/login.js (VERSIÓN ACTUALIZADA)
// Propósito: Autenticar usuarios, generar un token JWT y verificar el estado de baneo.

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

    // --- Paso 1: Buscar al usuario ---
    const userResult = await client.query(
      'SELECT id, username, password_hash, roblox_avatar_url, role, equipped_title, unlocked_titles FROM users WHERE username = $1',
      [username]
    );

    if (userResult.rows.length === 0) {
      return { statusCode: 401, body: JSON.stringify({ message: "Invalid username or password." }) };
    }

    const user = userResult.rows[0];

    // --- Paso 2: Comparar la contraseña ---
    const passwordIsValid = await bcrypt.compare(password, user.password_hash);

    if (!passwordIsValid) {
      return { statusCode: 401, body: JSON.stringify({ message: "Invalid username or password." }) };
    }

    // --- Paso 3: ¡NUEVO! Verificar si el usuario está baneado ---
    const banResult = await client.query(
        `SELECT reason, expires_at FROM user_sanctions 
         WHERE user_id = $1 AND sanction_type = 'ban' AND is_active = true 
         AND (expires_at IS NULL OR expires_at > NOW())
         ORDER BY created_at DESC LIMIT 1`,
        [user.id]
    );

    if (banResult.rows.length > 0) {
        // El usuario tiene un baneo activo
        const banDetails = banResult.rows[0];
        return {
            statusCode: 403, // Forbidden
            body: JSON.stringify({
                message: 'This account is banned.',
                banInfo: {
                    reason: banDetails.reason,
                    expiresAt: banDetails.expires_at // Puede ser null para baneos permanentes
                }
            })
        };
    }

    // --- Paso 4: Crear el token JWT (si no está baneado) ---
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role // Incluimos el rol para la seguridad del frontend/backend
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // --- Paso 5: Devolver respuesta de éxito con datos del perfil ---
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
          unlockedTitles: user.unlocked_titles
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
    // ¡Importante! Liberar el cliente para devolverlo al pool
    client.release();
  }
};