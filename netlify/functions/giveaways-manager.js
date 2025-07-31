// Archivo: netlify/functions/giveaways-manager.js (VERSIÓN FINAL CORREGIDA)
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const AUTHORIZED_ROLES = ['owner', 'tester'];

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

exports.handler = async (event) => {
  switch (event.httpMethod) {
    case 'GET': return handleGetGiveaways(event);
    case 'POST': return handleCreateGiveaway(event);
    case 'PUT': return handleJoinGiveaway(event);
    default: return { statusCode: 405, body: 'Method Not Allowed' };
  }
};

async function handleGetGiveaways(event) {
  const client = await pool.connect();
  try {
    const now = new Date();
    
    // 1. Obtener todos los sorteos que no estén finalizados.
    const giveawaysResult = await client.query(
      `SELECT id, prize_pool, start_time, end_time, status, created_by, participants
       FROM giveaways 
       WHERE status != 'finished'
       ORDER BY start_time ASC`
    );

    // 2. Procesar y actualizar el estado de cada sorteo dinámicamente.
    for (const gw of giveawaysResult.rows) {
      const startTime = new Date(gw.start_time);
      const endTime = new Date(gw.end_time);

      // LÓGICA CORREGIDA Y MEJORADA
      // Comprobación 1: ¿Debería pasar de 'upcoming' a 'active'?
      if (gw.status === 'upcoming' && now >= startTime && now < endTime) {
        gw.status = 'active';
        // Actualizamos la base de datos para que el cambio sea permanente.
        await client.query('UPDATE giveaways SET status = $1 WHERE id = $2', ['active', gw.id]);
      }
      
      // Comprobación 2: ¿Debería pasar de 'active' a 'finished'?
      if (gw.status === 'active' && now >= endTime) {
        gw.status = 'finished';
        let winner = null;
        // Seleccionar un ganador si hay participantes.
        if (gw.participants && gw.participants.length > 0) {
          winner = gw.participants[Math.floor(Math.random() * gw.participants.length)];
        }
        // Actualizamos la base de datos con el estado 'finished' y el ganador.
        await client.query('UPDATE giveaways SET status = $1, winner = $2 WHERE id = $3', ['finished', winner, gw.id]);
      }
    }

    // 3. Obtener los últimos 5 ganadores.
    const winnersResult = await client.query(
      `SELECT winner, prize_pool FROM giveaways
       WHERE status = 'finished' AND winner IS NOT NULL
       ORDER BY end_time DESC LIMIT 5`
    );

    // 4. Enriquecer los datos de los participantes (sin cambios aquí).
    const activeGiveaway = giveawaysResult.rows.find(gw => gw.status === 'active');
     if (activeGiveaway && activeGiveaway.participants && activeGiveaway.participants.length > 0) {
        const usersResult = await client.query(
            'SELECT username, roblox_avatar_url as avatar, equipped_title FROM users WHERE username = ANY($1::text[])',
            [activeGiveaway.participants]
        );
        // CORREGIDO: Mapeamos de snake_case a camelCase
        activeGiveaway.participants = usersResult.rows.map(p => ({
            username: p.username,
            avatar: p.avatar,
            equippedTitle: p.equipped_title
        }));
    }

    let enrichedWinners = [];
    if (winnersResult.rows.length > 0) {
        const winnerUsernames = winnersResult.rows.map(w => w.winner);
        const profilesResult = await client.query(
            'SELECT username, roblox_avatar_url as avatar, equipped_title FROM users WHERE username = ANY($1::text[])',
            [winnerUsernames]
        );
        // CORREGIDO: Mapeamos de snake_case a camelCase al crear el mapa de perfiles
        const profilesMap = new Map(profilesResult.rows.map(p => [p.username, {
            username: p.username,
            avatar: p.avatar,
            equippedTitle: p.equipped_title
        }]));
        
        enrichedWinners = winnersResult.rows.map(w => ({
            ...w,
            profile: profilesMap.get(w.winner) || { username: w.winner, avatar: 'images/placeholder.png', equippedTitle: 'player' }
        }));
    }

    // 5. Devolver datos (sin cambios aquí)
    return {
      statusCode: 200,
      body: JSON.stringify({
        giveaways: giveawaysResult.rows.filter(gw => gw.status === 'active' || gw.status === 'upcoming'),
        recentWinners: enrichedWinners
      })
    };
  } catch (error) {
    console.error("Error getting giveaways:", error);
    return { statusCode: 500, body: JSON.stringify({ message: 'Internal Server Error' }) };
  } finally {
    client.release();
  }
}

async function handleCreateGiveaway(event) {
    const decodedToken = verifyToken(event);
    if (!decodedToken || !AUTHORIZED_ROLES.includes(decodedToken.role)) {
        return { statusCode: 403, body: JSON.stringify({ message: 'Forbidden' }) };
    }

    try {
        const { prize_pool, start_time, end_time } = JSON.parse(event.body);
        if (!prize_pool || prize_pool.length === 0 || !start_time || !end_time || new Date(start_time) >= new Date(end_time)) {
            return { statusCode: 400, body: JSON.stringify({ message: 'Invalid giveaway data.' }) };
        }

        const client = await pool.connect();
        try {
            await client.query(
                `INSERT INTO giveaways (prize_pool, start_time, end_time, created_by) VALUES ($1, $2, $3, $4)`,
                [JSON.stringify(prize_pool), start_time, end_time, decodedToken.username]
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

async function handleJoinGiveaway(event) {
    const decodedToken = verifyToken(event);
    if (!decodedToken) return { statusCode: 401, body: JSON.stringify({ message: 'Invalid token' }) };

    try {
        const { giveawayId } = JSON.parse(event.body);
        if (!giveawayId) return { statusCode: 400, body: JSON.stringify({ message: 'Giveaway ID required.' }) };

        const client = await pool.connect();
        try {
            const result = await client.query(
                `UPDATE giveaways SET participants = array_append(participants, $1) WHERE id = $2 AND status = 'active' AND NOT ($1 = ANY(participants))`,
                [decodedToken.username, giveawayId]
            );
            if (result.rowCount === 0) {
                return { statusCode: 409, body: JSON.stringify({ message: 'Could not join. Giveaway may not be active or you already joined.' }) };
            }
            return { statusCode: 200, body: JSON.stringify({ message: 'Successfully joined!' }) };
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Error joining giveaway:", error);
        return { statusCode: 500, body: JSON.stringify({ message: 'Internal Server Error' }) };
    }
}