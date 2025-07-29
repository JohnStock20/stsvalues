// Archivo: netlify/functions/update-user-profile.js (NUEVO)
// Propósito: Permitir a un usuario actualizar partes de su perfil, como el título equipado.

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
    // Esta función solo acepta peticiones PUT o PATCH, que son estándar para actualizaciones.
    if (event.httpMethod !== 'PUT' && event.httpMethod !== 'PATCH') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        // --- Verificación del Token de Usuario (similar a get-titles) ---
        const authHeader = event.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return { statusCode: 401, body: JSON.stringify({ message: 'Authorization token is required.' }) };
        }
        
        const token = authHeader.split(' ')[1];
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            return { statusCode: 401, body: JSON.stringify({ message: 'Invalid or expired token.' }) };
        }

        const { username } = decoded;
        const { newTitle } = JSON.parse(event.body);

        // Validar que se ha enviado un nuevo título
        if (!newTitle) {
            return { statusCode: 400, body: JSON.stringify({ message: 'A new title key is required.' }) };
        }

        // --- Lógica de Actualización en la Base de Datos ---
        const client = await pool.connect();
        try {
            // Paso 1: Primero, verificar que el usuario realmente tiene desbloqueado el título que intenta equipar.
            // Esto es una medida de seguridad crucial.
            const userResult = await client.query(
                'SELECT unlocked_titles FROM users WHERE username = $1',
                [username]
            );

            if (userResult.rows.length === 0) {
                return { statusCode: 404, body: JSON.stringify({ message: 'User not found.' }) };
            }

            const unlockedTitles = userResult.rows[0].unlocked_titles || [];
            if (!unlockedTitles.includes(newTitle)) {
                return { statusCode: 403, body: JSON.stringify({ message: 'You have not unlocked this title.' }) };
            }

            // Paso 2: Si la verificación es exitosa, actualizar el campo 'equipped_title'.
            await client.query(
                'UPDATE users SET equipped_title = $1 WHERE username = $2',
                [newTitle, username]
            );
            
            // --- Respuesta Exitosa ---
            return {
                statusCode: 200,
                body: JSON.stringify({ message: 'Title updated successfully!', equippedTitle: newTitle })
            };

        } finally {
            client.release();
        }

    } catch (error) {
        console.error("Error updating user profile:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "An internal error occurred." })
        };
    }
};