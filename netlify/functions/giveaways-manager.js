// Archivo: netlify/functions/giveaways-manager.js (NUEVO)
// Propósito: Gestionar todas las operaciones relacionadas con los sorteos.

const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

const pool = new Pool({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Roles autorizados para crear sorteos
const AUTHORIZED_ROLES = ['owner', 'tester'];

// --- HANDLER PRINCIPAL ---
exports.handler = async (event) => {
    const { httpMethod } = event;

    // Usamos un switch para dirigir la petición al manejador correcto según el método HTTP.
    switch (httpMethod) {
        case 'GET':
            return handleGetGiveaways(event);
        case 'POST':
            return handleCreateGiveaway(event);
        case 'PUT':
            return handleJoinGiveaway(event);
        default:
            return { statusCode: 405, body: 'Method Not Allowed' };
    }
};

// --- MANEJADOR PARA OBTENER SORTEOS (GET) ---
async function handleGetGiveaways(event) {
    const client = await pool.connect();
    try {
        // Obtenemos todos los sorteos que no han finalizado y los ordenamos por fecha de inicio.
        const result = await client.query(
            "SELECT id, prize_type, prize_id, prize_amount, start_time, end_time, status, created_by, array_length(participants, 1) as participant_count FROM giveaways WHERE status != 'finished' ORDER BY start_time ASC"
        );
        
        // Actualizar el estado de los sorteos en tiempo real antes de devolverlos
        const now = new Date();
        const updatedGiveaways = result.rows.map(gw => {
            const startTime = new Date(gw.start_time);
            const endTime = new Date(gw.end_time);
            let status = gw.status;

            if (status !== 'finished') {
                if (now >= startTime && now < endTime) {
                    status = 'active';
                } else if (now < startTime) {
                    status = 'upcoming';
                } else {
                    status = 'finished'; // Debería ser manejado por un cron job, pero esto es un fallback.
                }
            }
            
            // Si el estado ha cambiado en nuestra lógica, lo actualizamos en la BD (sin esperar)
            if (status !== gw.status) {
                 client.query('UPDATE giveaways SET status = $1 WHERE id = $2', [status, gw.id]);
            }

            return { ...gw, status };
        });

        return {
            statusCode: 200,
            body: JSON.stringify(updatedGiveaways)
        };
    } catch (error) {
        console.error("Error getting giveaways:", error);
        return { statusCode: 500, body: JSON.stringify({ message: 'Internal Server Error' }) };
    } finally {
        client.release();
    }
}

// --- MANEJADOR PARA CREAR UN SORTEO (POST) ---
async function handleCreateGiveaway(event) {
    // Seguridad: Verificar token y rol
    const decodedToken = verifyToken(event);
    if (!decodedToken) return { statusCode: 401, body: JSON.stringify({ message: 'Invalid or missing token.' }) };
    if (!AUTHORIZED_ROLES.includes(decodedToken.role)) {
        return { statusCode: 403, body: JSON.stringify({ message: 'Forbidden: You are not authorized to create giveaways.' }) };
    }

    try {
        const { prize_type, prize_id, prize_amount, start_time, end_time } = JSON.parse(event.body);

        // Validación de datos
        if (!prize_type || !prize_id || !prize_amount || !start_time || !end_time) {
            return { statusCode: 400, body: JSON.stringify({ message: 'Missing required giveaway fields.' }) };
        }
        if (new Date(start_time) >= new Date(end_time)) {
             return { statusCode: 400, body: JSON.stringify({ message: 'Start time must be before end time.' }) };
        }

        const client = await pool.connect();
        try {
            // Verificar que no haya un sorteo activo en el intervalo de tiempo solicitado
            const conflictCheck = await client.query(
                "SELECT id FROM giveaways WHERE status = 'active' AND ($1, $2) OVERLAPS (start_time, end_time)",
                [start_time, end_time]
            );
            if (conflictCheck.rows.length > 0) {
                return { statusCode: 409, body: JSON.stringify({ message: 'A giveaway is already scheduled during this time slot.' })};
            }

            // Insertar el nuevo sorteo
            await client.query(
                'INSERT INTO giveaways (prize_type, prize_id, prize_amount, start_time, end_time, created_by) VALUES ($1, $2, $3, $4, $5, $6)',
                [prize_type, prize_id, prize_amount, start_time, end_time, decodedToken.username]
            );

            return { statusCode: 201, body: JSON.stringify({ message: 'Giveaway created successfully!' }) };
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Error creating giveaway:", error);
        return { statusCode: 500, body: JSON.stringify({ message: 'Internal Server Error' }) };
    }
}

// --- MANEJADOR PARA UNIRSE A UN SORTEO (PUT) ---
async function handleJoinGiveaway(event) {
    // Seguridad: Verificar token
    const decodedToken = verifyToken(event);
    if (!decodedToken) return { statusCode: 401, body: JSON.stringify({ message: 'Invalid or missing token.' }) };

    try {
        const { giveawayId } = JSON.parse(event.body);
        if (!giveawayId) {
            return { statusCode: 400, body: JSON.stringify({ message: 'Giveaway ID is required.' }) };
        }

        const client = await pool.connect();
        try {
            // Añadir al usuario al array de participantes si no está ya dentro
            const result = await client.query(
                `UPDATE giveaways 
                 SET participants = array_append(participants, $1) 
                 WHERE id = $2 AND status = 'active' AND NOT ($1 = ANY(participants))`,
                [decodedToken.username, giveawayId]
            );

            if (result.rowCount === 0) {
                // Esto puede pasar si el sorteo no está activo, no existe, o el usuario ya se unió.
                return { statusCode: 409, body: JSON.stringify({ message: 'Could not join giveaway. It might not be active, or you have already joined.' }) };
            }

            return { statusCode: 200, body: JSON.stringify({ message: 'Successfully joined the giveaway!' }) };
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Error joining giveaway:", error);
        return { statusCode: 500, body: JSON.stringify({ message: 'Internal Server Error' }) };
    }
}

// --- FUNCIÓN DE UTILIDAD PARA VERIFICAR TOKEN ---
function verifyToken(event) {
    try {
        const authHeader = event.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
        const token = authHeader.split(' ')[1];
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        return null;
    }
}