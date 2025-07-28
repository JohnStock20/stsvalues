// Archivo: netlify/functions/register.js

const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

// Lógica de la función que se ejecuta cuando se llama a la API
exports.handler = async (event) => {
    // Solo permitimos peticiones POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        // 1. Parsear los datos que envía el frontend (username, password)
        const { username, password } = JSON.parse(event.body);

        // --- Validación básica ---
        if (!username || !password) {
            return { statusCode: 400, body: JSON.stringify({ message: "Username and password are required." }) };
        }
        if (password.length < 8) {
             return { statusCode: 400, body: JSON.stringify({ message: "Password must be at least 8 characters long." }) };
        }

        // 2. Conectar a la base de datos
        // ¡IMPORTANTE! Estas credenciales deben estar en las variables de entorno de Netlify, no aquí.
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            ssl: {"rejectUnauthorized":true} // Necesario para PlanetScale
        });

        // 3. Comprobar si el usuario ya existe
        const [rows] = await connection.execute('SELECT id FROM users WHERE username = ?', [username]);
        if (rows.length > 0) {
            await connection.end();
            return { statusCode: 409, body: JSON.stringify({ message: "Roblox username already registered." }) };
        }

        // 4. "Hashear" la contraseña para guardarla de forma segura
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 5. TODO: Lógica de verificación con la API de Roblox
        //    - Aquí harías una llamada a la API de Roblox para obtener el perfil del `username`.
        //    - Comprobarías si su descripción contiene el código de verificación.
        //    - Si no es válido, devolverías un error. Por ahora, lo saltamos.
        //    const isVerified = await verifyRobloxAccount(username, verificationCode);
        //    if (!isVerified) { /* devolver error */ }

        // 6. Insertar el nuevo usuario en la base de datos
        await connection.execute(
            'INSERT INTO users (username, password_hash) VALUES (?, ?)',
            [username, hashedPassword]
        );
        
        await connection.end();

        // 7. Devolver una respuesta de éxito
        return {
            statusCode: 201, // 201 = Created
            body: JSON.stringify({ message: "Account created successfully! Please log in." })
        };

    } catch (error) {
        console.error("Error in registration:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "An internal error occurred." })
        };
    }
};