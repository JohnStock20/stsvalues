// Archivo: netlify/functions/login.js

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

// --- LÓGICA PRINCIPAL DEL SCRIPT ---

exports.handler = async (event) => {
    // Solo permitimos peticiones de tipo POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        // Obtenemos los datos enviados desde el frontend
        const { username, password } = JSON.parse(event.body);

        if (!username || !password) {
            return { statusCode: 400, body: JSON.stringify({ message: "Username and password are required." }) };
        }

        const client = await pool.connect();
        try {
            // Paso 1: Buscamos al usuario en nuestra base de datos
            const result = await client.query('SELECT * FROM users WHERE username = $1', [username]);

            // Si no devuelve filas, el usuario no existe
            if (result.rows.length === 0) {
                return { statusCode: 401, body: JSON.stringify({ message: "Invalid username or password." }) };
            }

            const user = result.rows[0];

            // Paso 2: Comparamos la contraseña enviada con la encriptada que tenemos
            const passwordIsValid = await bcrypt.compare(password, user.password_hash);

            if (!passwordIsValid) {
                return { statusCode: 401, body: JSON.stringify({ message: "Invalid username or password." }) };
            }

            // Paso 3: Si la contraseña es válida, creamos un token (el "pase VIP")
            const token = jwt.sign(
                { userId: user.id, username: user.username }, // Información dentro del token
                process.env.JWT_SECRET, // La clave secreta para firmarlo
                { expiresIn: '1d' } // El token caduca en 1 día
            );
            
            // Paso 4: Devolvemos una respuesta de éxito con el token y los datos del usuario
            return {
                statusCode: 200,
                body: JSON.stringify({ 
                    message: "Login successful!",
                    token: token,
                    user: {
                        username: user.username,
                        avatar: user.roblox_avatar_url // Aquí devolvemos el link del avatar
                    }
                })
            };
        } finally {
            // Asegurarse de liberar la conexión a la BD
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