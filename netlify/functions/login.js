// Archivo: netlify/functions/login.js

const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken'); // La librería para crear el "pase VIP"

const pool = new Pool({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
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
            // 1. Buscamos al usuario por su nombre
            const result = await client.query('SELECT * FROM users WHERE username = $1', [username]);

            // 2. Si no encontramos ninguna fila, el usuario no existe.
            if (result.rows.length === 0) {
                // Devolvemos el mismo error genérico por seguridad.
                return { statusCode: 401, body: JSON.stringify({ message: "Invalid username or password." }) };
            }

            const user = result.rows[0];

            // 3. Comparamos la contraseña enviada con la contraseña encriptada de la BD.
            const passwordIsValid = await bcrypt.compare(password, user.password_hash);

            if (!passwordIsValid) {
                // Si la contraseña no coincide, devolvemos el mismo error.
                return { statusCode: 401, body: JSON.stringify({ message: "Invalid username or password." }) };
            }

            // 4. ¡Éxito! La contraseña es correcta. Creamos el "pase VIP" (JWT).
            const token = jwt.sign(
                { userId: user.id, username: user.username }, // La información que guardamos en el pase
                process.env.JWT_SECRET, // Una clave secreta que SOLO el servidor conoce
                { expiresIn: '1d' } // El pase caduca en 1 día
            );
            
            // 5. Devolvemos el token al frontend
            return {
                statusCode: 200,
                body: JSON.stringify({ 
                    message: "Login successful!",
                    token: token,
                    user: {
                        username: user.username
                        // Puedes añadir aquí la URL del avatar de roblox si la guardas
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