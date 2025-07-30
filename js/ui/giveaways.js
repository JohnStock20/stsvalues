// Archivo: js/ui/giveaways.js (VERSIÓN FINAL CORREGIDA)
// Propósito: Renderizar todos los componentes de la UI de la página de Sorteos.

import { dom } from './dom.js';
import { showView } from './core.js';
import { getPrizeItemHtml } from '../utils.js'; // ÚNICA importación de esta función

// --- Funciones de Renderizado de Componentes de Sorteos ---

function renderActiveGiveaway(giveaway, currentUser, onJoin) {
  const container = dom.containers.activeGiveaway;
  if (!giveaway) {
    container.innerHTML = `<div class="giveaway-card"><h2>There are no active giveaways right now. Check back soon!</h2></div>`;
    return;
  }

  const prizeListHTML = giveaway.prize_pool.map(prize => `<div class="prize-item">${getPrizeItemHtml(prize)}</div>`).join('');
  const isJoined = giveaway.participants?.some(p => p.username === currentUser?.username);
  
  container.innerHTML = `
    <div class="giveaway-card">
      <div class="card-header">
        <h2>A GIVEAWAY IS ACTIVE!</h2>
        <span class="host-info">Hosted by: <strong>${giveaway.created_by}</strong></span>
      </div>
      <div id="prize-pool-container">
        <div class="prize-pool-title">Prize Pool</div>
        <div id="prize-pool-list">${prizeListHTML}</div>
      </div>
      <div id="giveaway-timer-container">
        <div id="giveaway-timer" data-endtime="${giveaway.end_time}"></div>
        <span class="timer-label">TIME LEFT</span>
      </div>
      <button id="join-giveaway-btn" class="auth-button" ${isJoined || !currentUser ? 'disabled' : ''}>
        ${!currentUser ? 'Log in to Join' : (isJoined ? 'You Have Joined!' : 'Join Giveaway')}
      </button>
    </div>
  `;
  
  if (currentUser && !isJoined) {
    const joinBtn = document.getElementById('join-giveaway-btn');
    joinBtn.onclick = () => onJoin(giveaway.id);
  }
}

function renderUpcomingGiveaways(giveaways) {
  const container = dom.containers.upcomingGiveaways;
  container.innerHTML = '';
  if (!giveaways || giveaways.length === 0) return;

  container.innerHTML = '<h3>Upcoming Giveaways</h3>';
  const list = document.createElement('div');
  list.id = 'upcoming-giveaways-list';

  giveaways.slice(0, 5).forEach(gw => {
    const prizeText = gw.prize_pool.map(p => getPrizeItemHtml(p)).join(' + ');
    const itemDiv = document.createElement('div');
    itemDiv.className = 'upcoming-giveaway-item';
    itemDiv.innerHTML = `
      <span class="prize">${prizeText}</span>
      <span class="time">Starts: ${new Date(gw.start_time).toLocaleString()}</span>
    `;
    list.appendChild(itemDiv);
  });
  
  container.appendChild(list);
}

function renderParticipants(participants) {
    const list = dom.containers.participantsList;
    if (!participants || participants.length === 0) {
        list.innerHTML = '<p>No participants yet.</p>';
        return;
    }
    list.innerHTML = participants.map(p_user => `
      <div class="participant-item">
        <img src="${p_user.avatar || 'images/placeholder.png'}" alt="${p_user.username}">
        <span>${p_user.username}</span>
      </div>
    `).join('');
}

function renderRecentWinners(winners) {
    const list = dom.containers.winnersList;
    if (!winners || winners.length === 0) {
        list.innerHTML = '<p>No recent winners.</p>';
        return;
    }
    list.innerHTML = winners.map(w => {
        const prizeText = w.prize_pool.map(p => getPrizeItemHtml(p)).join(' + ');
        return `
          <div class="winner-item">
            <span class="winner-name">${w.winner}</span> won
            <span class="winner-prize">${prizeText}</span>
          </div>
        `;
    }).join('');
}


// --- Función Principal de Renderizado de la Página ---

export function renderGiveawayPage(giveaways, recentWinners, currentUser, onJoin, onHost) {
  const activeGiveaway = giveaways.find(gw => gw.status === 'active');
  const upcomingGiveaways = giveaways.filter(gw => gw.status === 'upcoming');

  renderActiveGiveaway(activeGiveaway, currentUser, onJoin);
  renderUpcomingGiveaways(upcomingGiveaways);
  renderParticipants(activeGiveaway ? activeGiveaway.participants : []);
  renderRecentWinners(recentWinners);

  dom.containers.hostGiveawayBtn.innerHTML = '';
  if (currentUser && ['owner', 'tester'].includes(currentUser.role)) {
    const hostBtn = document.createElement('button');
    hostBtn.id = 'host-giveaway-btn';
    hostBtn.className = 'auth-button';
    hostBtn.textContent = 'Host a Giveaway';
    hostBtn.style.width = '100%';
    hostBtn.onclick = onHost;
    dom.containers.hostGiveawayBtn.appendChild(hostBtn);
  }

  showView('giveaways');
}