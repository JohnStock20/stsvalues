// Archivo: netlify/functions/register.js (VERSIÓN PARA NEON / POSTGRESQL)

const bcrypt = require('bcryptjs');
const { Pool } = require('pg'); // Usamos el paquete 'pg'

// Configuración de la conexión usando la URL de Neon de las variables de entorno
const pool = new Pool({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Puede ser necesario para la conexión desde Netlify
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
        if (password.length < 8) {
             return { statusCode: 400, body: JSON.stringify({ message: "Password must be at least 8 characters long." }) };
        }

        const client = await pool.connect(); // Conectamos al pool

        try {
            // Comprobar si el usuario ya existe (la sintaxis de la consulta cambia un poco)
            const result = await client.query('SELECT id FROM users WHERE username = $1', [username]);
            if (result.rows.length > 0) {
                return { statusCode: 409, body: JSON.stringify({ message: "Roblox username already registered." }) };
            }

            // Hashear la contraseña
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            
            // Insertar el nuevo usuario
            await client.query(
                'INSERT INTO users (username, password_hash) VALUES ($1, $2)',
                [username, hashedPassword]
            );
            
            return {
                statusCode: 201,
                body: JSON.stringify({ message: "Account created successfully! Please log in." })
            };

        } finally {
            client.release(); // ¡Importante! Liberar el cliente para devolverlo al pool
        }

    } catch (error) {
        console.error("Error in registration:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "An internal error occurred." })
        };
    }
};