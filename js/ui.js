// =================================================================================
// ARCHIVO: ui.js (Controlador de la Interfaz de Usuario)
// =================================================================================

import { appData } from './data.js';
import { findSwordById, formatLargeNumber, formatTimeAgo, getPrizeItemHtml } from './utils.js';
import { titleStyles } from './auth.js'; // Importamos los estilos de título

// --- Selectores del DOM ---
const dom = {
    // Vistas principales
    views: {
        cases: document.getElementById('cases-view'),
        caseDetails: document.getElementById('case-details-view'),
        swordDetails: document.getElementById('sword-details-view'),
        titles: document.getElementById('titles-view'),
        giveaways: document.getElementById('giveaways-view'),
        devtools: document.getElementById('devtools-view'),
    },
    // Contenedores de contenido
    containers: {
        cases: document.querySelector('#cases-view .cases-container'),
        otherSwords: document.getElementById('other-swords-container'),
        rewards: document.getElementById('rewards-list-container'),
        titlesList: document.getElementById('titles-list-container'),
        titleDetails: document.getElementById('title-details-view'),
        activeGiveaway: document.getElementById('active-giveaway-container'),
        upcomingGiveaways: document.getElementById('upcoming-giveaways-container'),
        participantsList: document.getElementById('giveaway-participants-list'),
        hostGiveawayBtn: document.getElementById('host-giveaway-btn-container'),
        adminTools: document.getElementById('devtools-view'),
    },
    // Botones
    buttons: {
        backToCases: document.getElementById('details-to-cases-btn'),
        backToSwordList: document.getElementById('details-to-sword-list-btn'),
        prevPage: document.getElementById('other-prev-btn'),
        nextPage: document.getElementById('other-next-btn'),
    },
    // Modales
    modals: {
        createGiveaway: document.getElementById('create-giveaway-modal-overlay'),
        createGiveawayContent: document.getElementById('create-giveaway-modal'),
        closeGiveaway: document.querySelector('#create-giveaway-modal .close-modal-btn'),
    }
};

// --- Funciones de Control de Vistas ---

export function showView(viewName) {
    Object.values(dom.views).forEach(view => {
        if (view) view.style.display = 'none';
    });
    if (dom.views[viewName]) {
        dom.views[viewName].style.display = 'block';
    } else {
        dom.views.cases.style.display = 'block'; // Vista por defecto
    }
    window.scrollTo(0, 0);
}


// --- Renderizado de la Página Principal (Cajas y Espadas) ---

function getCurrencyHTML(currencyKey, price) {
    if (currencyKey === 'cooldown') return `<span class="currency-text">Free (Every ${price} hr)</span>`;
    const currency = appData.currencies[currencyKey];
    if (currency.icon) return `<img src="${currency.icon}" alt="${currency.name}" class="currency-icon"> <span class="value">${price.toLocaleString()}</span>`;
    return `<span class="currency-text">${currency.name}</span> <span class="value">${price.toLocaleString()}</span>`;
}

export function renderCaseSelection(navigateTo) {
    dom.containers.cases.innerHTML = '';
    Object.keys(appData.cases).forEach(caseId => {
        const data = appData.cases[caseId];
        const link = document.createElement('a');
        link.href = '#';
        link.className = 'case-link';
        link.onclick = (e) => { e.preventDefault(); navigateTo('caseDetails', caseId); };

        const caseItem = document.createElement('div');
        caseItem.className = 'case-item';
        caseItem.style.setProperty('--case-border-color', data.borderColor || 'var(--main-green)');
        caseItem.innerHTML = `
            <img class="case-content-image" src="${data.image}" alt="${data.name}">
            <h3 class="case-title">${data.name}</h3>
            <div class="case-price">${getCurrencyHTML(data.currency, data.price)}</div>`;
        link.appendChild(caseItem);
        dom.containers.cases.appendChild(link);
    });
}

export function renderOtherSwords(appState, navigateTo) {
    const { currentPage, itemsPerPage } = appState;
    dom.containers.otherSwords.innerHTML = '';
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pagedItems = appData.otherSwords.slice(start, end);

    pagedItems.forEach(reward => {
        const item = createRewardItem(reward, { type: 'other' }, navigateTo);
        dom.containers.otherSwords.appendChild(item);
    });
    updatePaginationControls(appState);
}

export function updatePaginationControls(appState) {
    const totalPages = Math.ceil(appData.otherSwords.length / appState.itemsPerPage);
    dom.buttons.prevPage.disabled = appState.currentPage === 1;
    dom.buttons.nextPage.disabled = appState.currentPage === totalPages;
}


// --- Renderizado de Detalles (Caja y Espada) ---

function createRewardItem(reward, source, navigateTo) {
    const item = document.createElement('div');
    item.className = `reward-item ${reward.rarity}`;
    item.onclick = () => navigateTo('swordDetails', { sword: reward, source });
    item.innerHTML = createRewardItemHTML(reward, source);
    return item;
}

function createRewardItemHTML(reward, source) {
    const isCaseReward = source.type === 'case';
    const valueDisplayHTML = (typeof reward.value === 'string' && reward.value.toUpperCase().startsWith('O/C'))
        ? `<span class="value-oc" title="Owner's Choice">O/C</span>`
        : formatLargeNumber(parseValue(reward.value));

    return `
        <div class="reward-info">
            <div class="reward-image-placeholder"><img src="${reward.image}" alt="${reward.name}"></div>
            <span class="reward-name">${reward.name}</span>
        </div>
        <div class="reward-stats">
            ${isCaseReward ? `<span>${reward.chance}%</span>` : '<span class="no-chance">--</span>'}
            <span class="reward-value">${valueDisplayHTML}</span>
            <span>${reward.stats}</span>
        </div>`;
}

export function renderCaseDetails(caseId, navigateTo) {
    const data = appData.cases[caseId];
    if (!data) return;

    document.getElementById('details-case-image').src = data.image;
    document.getElementById('details-case-name').textContent = data.name;
    document.getElementById('details-case-price').innerHTML = getCurrencyHTML(data.currency, data.price);
    document.querySelector('#case-details-view .info-column').style.setProperty('--case-border-color', data.borderColor || 'var(--main-green)');
    
    dom.containers.rewards.innerHTML = '';
    data.rewards.forEach(reward => {
        const source = { type: 'case', id: caseId };
        const item = createRewardItem(reward, source, navigateTo);
        dom.containers.rewards.appendChild(item);
    });
    showView('caseDetails');
}

function parseAndSetDescription(element, text, navigateTo) {
    element.innerHTML = '';
    if (!text) { element.textContent = 'No description available.'; return; }
    
    const fragment = document.createDocumentFragment();
    const regex = /\[(case|sword):([a-zA-Z0-9_-]+)\]/g;
    let lastIndex = 0, match;

    while ((match = regex.exec(text)) !== null) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
        const [fullMatch, type, id] = match;
        const link = document.createElement('a');
        link.href = '#';
        
        let linkData;
        if (type === 'case') {
            linkData = appData.cases[id];
            if (linkData) {
                link.textContent = linkData.name;
                link.className = 'case-link-in-description';
                link.onclick = (e) => { e.preventDefault(); navigateTo('caseDetails', id); };
            }
        } else if (type === 'sword') {
            linkData = findSwordById(id);
            if (linkData) {
                link.textContent = linkData.sword.name;
                link.className = 'sword-link-in-description';
                link.onclick = (e) => { e.preventDefault(); navigateTo('swordDetails', linkData); };
            }
        }
        
        if (link.textContent) fragment.appendChild(link);
        else fragment.appendChild(document.createTextNode(fullMatch));
        lastIndex = regex.lastIndex;
    }
    fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
    element.appendChild(fragment);
}

export function renderSwordDetails(sword, sourceInfo, navigateTo, onNewInterval) {
    const swordInfoCard = document.getElementById('sword-info-card');
    swordInfoCard.className = 'sword-info-card';
    swordInfoCard.classList.add(sword.rarity);

    const demandIndicator = document.getElementById('sword-demand-indicator');
    if (sword.demand) {
        demandIndicator.className = 'sword-demand-indicator ' + sword.demand;
        demandIndicator.style.display = 'block';
    } else {
        demandIndicator.style.display = 'none';
    }

    document.getElementById('sword-details-image-container').innerHTML = `<img src="${sword.image}" alt="${sword.name}">`;
    document.getElementById('sword-details-name').textContent = sword.name;
    
    const fullDescription = sword.description || (sourceInfo.id ? `This sword is obtainable from the [case:${sourceInfo.id}].` : 'No origin specified.');
    parseAndSetDescription(document.getElementById('sword-details-description'), fullDescription, navigateTo);

    document.getElementById('sword-details-value').textContent = formatLargeNumber(parseValue(sword.value));
    document.getElementById('sword-details-stats').textContent = sword.stats;
    document.getElementById('sword-details-more').innerHTML = `
        ${sword.chance ? `Chance - ${sword.chance}%<br>` : ''}
        Exist - ${formatLargeNumber(sword.exist)}<br>
        Rarity - <span class="rarity-text ${sword.rarity}">${sword.rarity}</span>`;

    const updatedEl = document.getElementById('sword-details-updated');
    const updateSwordTime = () => updatedEl.textContent = formatTimeAgo(sword.lastUpdated);
    updateSwordTime();
    onNewInterval(setInterval(updateSwordTime, 60000));

    showView('swordDetails');
}

// --- Renderizado de Títulos ---

export function renderTitlesPage(titlesData, selectedKey, onSelect, onEquip) {
    dom.containers.titlesList.innerHTML = '';
    if (!titlesData) {
        dom.containers.titlesList.innerHTML = '<p>Could not load titles.</p>';
        return;
    }

    titlesData.forEach(title => {
        const styleInfo = titleStyles[title.key] || titleStyles['player'];
        const item = document.createElement('div');
        item.className = `title-list-item ${title.unlocked ? 'unlocked' : 'locked'}`;
        if (title.key === selectedKey) {
            item.classList.add('selected');
        }
        item.onclick = () => { if (title.unlocked) onSelect(title.key); };

        const nameClass = styleInfo.style.includes('gradient') ? 'title-name gradient' : 'title-name';
        const nameStyle = nameClass === 'title-name gradient' ? `style="background-image: ${styleInfo.style};"` : `style="color: ${styleInfo.style};"`;
        
        item.innerHTML = `
            <span class="${nameClass}" ${nameStyle}>${styleInfo.text}</span>
            ${!title.unlocked ? '<span class="lock-icon">🔒</span>' : ''}
        `;
        dom.containers.titlesList.appendChild(item);
    });

    renderTitleDetails(titlesData.find(t => t.key === selectedKey), onEquip);
}

function renderTitleDetails(title, onEquip) {
    const container = dom.containers.titleDetails;
    if (!title) {
        container.innerHTML = '<p>Select a title from the list to see its details.</p>';
        return;
    }

    const styleInfo = titleStyles[title.key] || titleStyles['player'];
    const nameClass = styleInfo.style.includes('gradient') ? 'title-name gradient' : 'title-name';
    const nameStyle = nameClass === 'title-name gradient' ? `style="background-image: ${styleInfo.style};"` : `style="color: ${styleInfo.style};"`;

    container.innerHTML = `
        <h3 class="${nameClass}" ${nameStyle}>${styleInfo.text}</h3>
        <p>${title.description || 'This title has no special description.'}</p>
        <button id="equip-title-btn" class="auth-button ${title.equipped ? 'equipped' : ''}">
            ${title.equipped ? 'Equipped' : 'Equip Title'}
        </button>
    `;

    const equipBtn = document.getElementById('equip-title-btn');
    if (title.unlocked && !title.equipped) {
        equipBtn.onclick = () => onEquip(title.key);
    } else {
        equipBtn.disabled = true;
    }
}


// --- Renderizado de Sorteos ---

export function renderGiveawayPage(giveaways, currentUser, onJoin, onHost) {
    const activeGiveaway = giveaways.find(gw => gw.status === 'active');
    const upcomingGiveaways = giveaways.filter(gw => gw.status === 'upcoming');
    
    renderActiveGiveaway(activeGiveaway, currentUser, onJoin);
    renderUpcomingGiveaways(upcomingGiveaways);
    renderParticipants(activeGiveaway ? activeGiveaway.participants : []);
    
    // Botón de hostear
    dom.containers.hostGiveawayBtn.innerHTML = '';
    if (currentUser && ['owner', 'tester'].includes(currentUser.role)) {
        const hostBtn = document.createElement('button');
        hostBtn.id = 'host-giveaway-btn';
        hostBtn.className = 'auth-button';
        hostBtn.textContent = 'Host a Giveaway';
        hostBtn.onclick = onHost;
        dom.containers.hostGiveawayBtn.appendChild(hostBtn);
    }

    showView('giveaways');
}

function renderActiveGiveaway(giveaway, currentUser, onJoin) {
    const container = dom.containers.activeGiveaway;
    if (!giveaway) {
        container.innerHTML = `<div class="giveaway-card"><h2>There are no active giveaways right now. Check back soon!</h2></div>`;
        return;
    }
    
    const prizeListHTML = giveaway.prize_pool.map(prize => `<div class="prize-item">${getPrizeItemHtml(prize)}</div>`).join('');
    const isJoined = giveaway.participants?.includes(currentUser?.username);

    container.innerHTML = `
        <div id="active-giveaway-card" class="giveaway-card">
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
                ${!currentUser ? 'Log in to Join' : isJoined ? 'You Have Joined!' : 'Join Giveaway'}
            </button>
        </div>`;

    if (currentUser && !isJoined) {
        document.getElementById('join-giveaway-btn').onclick = () => onJoin(giveaway.id);
    }
}

function renderUpcomingGiveaways(giveaways) {
    const container = dom.containers.upcomingGiveaways;
    container.innerHTML = '';
    if (giveaways.length === 0) return;
    
    container.innerHTML = '<h3>Upcoming Giveaways</h3>';
    const list = document.createElement('div');
    list.id = 'upcoming-giveaways-list';

    giveaways.slice(0, 5).forEach(gw => {
        const prizeText = gw.prize_pool.map(p => {
             const amount = formatLargeNumber(p.amount);
             const name = p.type === 'currency' ? appData.currencies[p.id]?.name : findSwordById(p.id)?.sword.name;
             return `${amount > 1 ? `${amount}x ` : ''}${name}`;
        }).join(' + ');
        list.innerHTML += `
            <div class="upcoming-giveaway-item">
                <span class="prize">${prizeText}</span>
                <span class="time">Starts: ${new Date(gw.start_time).toLocaleString()}</span>
            </div>`;
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

export function openGiveawayModal() {
    dom.modals.createGiveaway.style.display = 'flex';
    setTimeout(() => dom.modals.createGiveaway.classList.add('visible'), 10);
}

export function closeGiveawayModal() {
    dom.modals.createGiveaway.classList.remove('visible');
    setTimeout(() => dom.modals.createGiveaway.style.display = 'none', 300);
}


export function renderAdminTools(onGrantTitle) {
    const container = dom.containers.adminTools;
    container.innerHTML = `<div class="admin-tool-card">
        <h3>Grant Title to User</h3>
        <form id="grant-title-form">
            <input type="text" name="targetUsername" placeholder="Enter Roblox Username..." required>
            <select name="titleKey" required>
                <option value="" disabled selected>Select a Title to Grant</option>
                ${Object.keys(titleStyles).map(key => `<option value="${key}">${titleStyles[key].text}</option>`).join('')}
            </select>
            <button type="submit" class="auth-button">Grant Title</button>
        </form>
        <div id="admin-feedback" class="feedback-message"></div>
    </div>`;

    document.getElementById('grant-title-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const form = e.target;
        const targetUsername = form.targetUsername.value;
        const titleKey = form.titleKey.value;
        onGrantTitle(targetUsername, titleKey);
    });
}