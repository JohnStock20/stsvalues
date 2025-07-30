// Archivo: netlify/functions/giveaways-manager.js (VERSIÓN FINAL CORREGIDA)
// Propósito: Gestionar todo el ciclo de vida de los sorteos, incluyendo actualizaciones de estado y selección de ganador.

const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const AUTHORIZED_ROLES = ['owner', 'tester'];

// --- Función de Ayuda para verificar Token ---
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

// --- Handler Principal ---
exports.handler = async (event) => {
  switch (event.httpMethod) {
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


// --- Lógica para GET (Obtener y Actualizar Sorteos) ---
async function handleGetGiveaways(event) {
  const client = await pool.connect();
  try {
    // 1. Obtener todos los sorteos que no han sido marcados como 'finished' aún.
    const pendingGiveawaysResult = await client.query(
      `SELECT id, prize_pool, start_time, end_time, status, created_by, participants 
       FROM giveaways WHERE status != 'finished' ORDER BY start_time ASC`
    );

    const now = new Date();

    // 2. Procesar y actualizar el estado de cada sorteo pendiente.
    for (const gw of pendingGiveawaysResult.rows) {
      const startTime = new Date(gw.start_time);
      const endTime = new Date(gw.end_time);
      let newStatus = gw.status;

      if (gw.status === 'upcoming' && startTime <= now) {
        newStatus = 'active';
        await client.query('UPDATE giveaways SET status = $1 WHERE id = $2', [newStatus, gw.id]);
      }
      
      if (gw.status !== 'finished' && endTime <= now) {
        newStatus = 'finished';
        let winner = null;
        if (gw.participants && gw.participants.length > 0) {
          winner = gw.participants[Math.floor(Math.random() * gw.participants.length)];
        }
        await client.query(
          'UPDATE giveaways SET status = $1, winner = $2 WHERE id = $3',
          [newStatus, winner, gw.id]
        );
      }
    }
    
    // 3. Obtener la lista actualizada de sorteos activos y próximos.
    const activeUpcomingResult = await client.query(
      `SELECT id, prize_pool, start_time, end_time, status, created_by, participants 
       FROM giveaways WHERE status != 'finished' ORDER BY start_time ASC`
    );
    
    // 4. Enriquecer los datos de los participantes con sus avatares.
    const giveaways = await Promise.all(activeUpcomingResult.rows.map(async gw => {
        let participantsData = [];
        if (gw.participants && gw.participants.length > 0) {
            const usersResult = await client.query(
               `SELECT username, roblox_avatar_url as avatar FROM users WHERE username = ANY($1::text[])`,
               [gw.participants]
            );
            participantsData = usersResult.rows;
        }
        return { ...gw, participants: participantsData };
    }));


    // 5. Obtener los últimos 5 ganadores.
    const winnersResult = await client.query(
      `SELECT winner, prize_pool, end_time FROM giveaways 
       WHERE status = 'finished' AND winner IS NOT NULL 
       ORDER BY end_time DESC LIMIT 5`
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        giveaways: giveaways, // Solo se envían los activos y próximos
        recentWinners: winnersResult.rows
      })
    };
  } catch (error) {
    console.error("Error getting giveaways:", error);
    return { statusCode: 500, body: JSON.stringify({ message: 'Internal Server Error' }) };
  } finally {
    client.release();
  }
}

// --- Lógica para POST (Crear Sorteo) ---
async function handleCreateGiveaway(event) {
  const decodedToken = verifyToken(event);
  if (!decodedToken || !AUTHORIZED_ROLES.includes(decodedToken.role)) {
    return { statusCode: 403, body: JSON.stringify({ message: 'Forbidden' }) };
  }

  const client = await pool.connect();
  try {
    const { prize_pool, start_time, end_time } = JSON.parse(event.body);

    if (!prize_pool || prize_pool.length === 0 || !start_time || !end_time || new Date(start_time) >= new Date(end_time)) {
      return { statusCode: 400, body: JSON.stringify({ message: 'Invalid giveaway data.' }) };
    }

    await client.query(
      `INSERT INTO giveaways (prize_pool, start_time, end_time, created_by, status) 
       VALUES ($1, $2, $3, $4, 'upcoming')`,
      [JSON.stringify(prize_pool), start_time, end_time, decodedToken.username]
    );

    return { statusCode: 201, body: JSON.stringify({ message: 'Giveaway created successfully!' }) };
  } catch (error) {
    console.error("Error creating giveaway:", error);
    return { statusCode: 500, body: JSON.stringify({ message: 'Internal Server Error' }) };
  } finally {
    client.release();
  }
}

// --- Lógica para PUT (Unirse a Sorteo) ---
async function handleJoinGiveaway(event) {
  const decodedToken = verifyToken(event);
  if (!decodedToken) {
    return { statusCode: 401, body: JSON.stringify({ message: 'Invalid token' }) };
  }

  const client = await pool.connect();
  try {
    const { giveawayId } = JSON.parse(event.body);
    if (!giveawayId) {
      return { statusCode: 400, body: JSON.stringify({ message: 'Giveaway ID required.' }) };
    }

    const result = await client.query(
      `UPDATE giveaways SET participants = array_append(participants, $1) 
       WHERE id = $2 AND status = 'active' AND NOT ($1 = ANY(participants))`,
      [decodedToken.username, giveawayId]
    );

    if (result.rowCount === 0) {
      return { statusCode: 409, body: JSON.stringify({ message: 'Could not join. Giveaway may not be active or you already joined.' }) };
    }

    return { statusCode: 200, body: JSON.stringify({ message: 'Successfully joined!' }) };
  } catch (error) {
    console.error("Error joining giveaway:", error);
    return { statusCode: 500, body: JSON.stringify({ message: 'Internal Server Error' }) };
  } finally {
    client.release();
  }
}