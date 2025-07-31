// =================================================================================
// ARCHIVO: ui.js (Controlador de la Interfaz de Usuario) - VERSIÓN 100% COMPLETA
// =================================================================================


import { appData, parseValue } from './data.js';
import { findSwordById, formatLargeNumber, formatTimeAgo, getPrizeItemHtml, formatHours } from './utils.js';
import { titleStyles } from './auth.js';


// --- Selectores del DOM ---
export const dom = {
    views: {
        cases: document.getElementById('cases-view'),
        caseDetails: document.getElementById('case-details-view'),
        swordDetails: document.getElementById('sword-details-view'),
        titles: document.getElementById('titles-view'),
        giveaways: document.getElementById('giveaways-view'),
        devtools: document.getElementById('devtools-view'),
    },
    containers: {
        cases: document.querySelector('#cases-view .cases-container'),
        otherSwords: document.getElementById('other-swords-container'),
        rewards: document.getElementById('rewards-list-container'),
        titlesList: document.getElementById('titles-list-container'),
        titleDetails: document.getElementById('title-details-view'),
        activeGiveaway: document.getElementById('active-giveaway-container'),
        upcomingGiveaways: document.getElementById('upcoming-giveaways-container'),
        participantsList: document.getElementById('giveaway-participants-list'),
        winnersList: document.getElementById('giveaway-winners-list'),
        hostGiveawayBtn: document.getElementById('host-giveaway-container'),
        adminTools: document.getElementById('devtools-view'),
        searchResults: document.getElementById('search-results'),
        resultsTable: document.getElementById('results-table-container'),
        simulationLoot: document.getElementById('simulation-loot-summary'),
        graph: document.getElementById('graph-container'),
        graphPlotArea: document.getElementById('graph-plot-area'),
        graphLabels: document.getElementById('graph-labels'),
        graphSvg: document.querySelector('#graph-plot-area svg'),
    },
    buttons: {
        backToCases: document.getElementById('details-to-cases-btn'),
        backToSwordList: document.getElementById('details-to-sword-list-btn'),
        prevPage: document.getElementById('other-prev-btn'),
        nextPage: document.getElementById('other-next-btn'),
        calculate: document.getElementById('calculate-btn'),
        calculateGraph: document.getElementById('calculate-graph-btn'),
    },
    inputs: {
        converterFrom: document.getElementById('converter-from-input'),
        converterTo: document.getElementById('converter-to-input'),
        searchBar: document.getElementById('search-bar'),
        caseQuantity: document.getElementById('case-quantity-input'),
        graphStep: document.getElementById('graph-step-input'),
        graphMax: document.getElementById('graph-max-input'),
    },
    modals: {
        createGiveaway: document.getElementById('create-giveaway-modal-overlay'),
        closeGiveaway: document.querySelector('#create-giveaway-modal .close-modal-btn'),
    },
    controls: {
        standard: document.getElementById('standard-controls'),
        graph: document.getElementById('graph-controls'),
    },
    converterFromName: document.getElementById('converter-from-name'),
    converterToName: document.getElementById('converter-to-name'),
};
// --- Funciones de Control de Vistas ---


export function showView(viewName) {
    Object.values(dom.views).forEach(view => { if (view) view.style.display = 'none'; });
    if (dom.views[viewName]) {
        dom.views[viewName].style.display = 'block';
    } else {
        dom.views.cases.style.display = 'block';
    }
    window.scrollTo(0, 0);
}




// --- Renderizado de la Página Principal ---


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

// 1. Modifica createRewardItemHTML para que acepte el nuevo parámetro
function createRewardItemHTML(reward, source, isSimpleView = false) {
  const isCaseReward = source.type === 'case';
  const valueDisplayHTML = (typeof reward.value === 'string' && reward.value.toUpperCase().startsWith('O/C'))
    ? `<span class="value-oc" title="Owner's Choice">O/C</span>`
    : formatLargeNumber(parseValue(reward.value));
  
  // Si se solicita la vista simple, devolvemos solo imagen y nombre.
  if (isSimpleView) {
    return `
      <div class="reward-info">
        <div class="reward-image-placeholder"><img src="${reward.image}" alt="${reward.name}"></div>
        <span class="reward-name">${reward.name}</span>
      </div>
    `;
  }

  // De lo contrario, devolvemos la vista completa con estadísticas.
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

// 2. Modifica createRewardItem para que pase el nuevo parámetro
export function createRewardItem(reward, source, navigateTo, isSimpleView = false) {
  const item = document.createElement('div');
  item.className = `reward-item ${reward.rarity}`;
  
  // Le pasamos el parámetro a la función que genera el HTML
  const itemHTML = createRewardItemHTML(reward, source, isSimpleView);
  item.innerHTML = itemHTML;
  
  item.addEventListener('click', () => navigateTo('swordDetails', { sword: reward, source }));
  return item;
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
    clearCalculator({ calculatorMode: 'theoretical' });
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




// --- Renderizado de la Calculadora ---


export function clearCalculator(appState) {
    dom.containers.simulationLoot.style.display = 'none';
    dom.containers.resultsTable.innerHTML = '';
    dom.containers.graph.style.display = 'none';
    if (dom.containers.graphSvg) dom.containers.graphSvg.innerHTML = '';
    if (dom.containers.graphLabels) dom.containers.graphLabels.innerHTML = '';


    const isGraphMode = appState.calculatorMode === 'graph';
    const isUntilBestMode = appState.calculatorMode === 'untilBest';


    dom.controls.standard.style.display = isGraphMode ? 'none' : 'flex';
    dom.controls.graph.style.display = isGraphMode ? 'flex' : 'none';


    if (isUntilBestMode) {
        dom.inputs.caseQuantity.value = '';
        dom.inputs.caseQuantity.placeholder = "Not applicable";
        dom.inputs.caseQuantity.disabled = true;
        dom.buttons.calculate.textContent = 'Start Hunt';
    } else {
        dom.inputs.caseQuantity.placeholder = "Enter amount...";
        dom.inputs.caseQuantity.disabled = false;
        dom.buttons.calculate.textContent = 'Calculate';
    }
}


export function renderResultsTable(data, appState) {
    dom.containers.resultsTable.innerHTML = '';
    const quantity = data.quantityOverride || parseInt(dom.inputs.caseQuantity.value, 10) || 1;
    const resultClass = data.result >= 0 ? 'profit' : 'loss';
    const resultSign = data.result >= 0 ? '+' : '';
    const profitPerCase = data.result / quantity;
    const profitPercentage = data.totalCost > 0 ? (data.result / data.totalCost) * 100 : (data.result > 0 ? Infinity : 0);
    const profitPercentageDisplay = isFinite(profitPercentage) ? `${profitPercentage.toFixed(2)}%` : `∞%`;
    let totalCostDisplay;
    const currentCaseData = appData.cases[appState.currentCaseIdForCalc];
    if (currentCaseData && currentCaseData.currency === 'cooldown') {
        totalCostDisplay = formatHours(data.totalCost);
    } else {
        totalCostDisplay = formatLargeNumber(data.totalCost);
    }
    const tableHTML = `
        <table id="results-table">
            <thead>
                <tr>
                    <th>${appState.calculatorMode === 'theoretical' ? 'Expected Value' : 'Total Value'}</th>
                    <th>Total Cost</th>
                    <th>Net Result</th>
                    <th>Result/Case</th>
                    <th>Profit %</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>${formatLargeNumber(data.totalValueGained)}</td>
                    <td>${totalCostDisplay}</td>
                    <td class="${resultClass}">${resultSign}${formatLargeNumber(data.result)}</td>
                    <td class="${resultClass}">${resultSign}${formatLargeNumber(profitPerCase)}</td>
                    <td class="${resultClass}">${profitPercentageDisplay}</td>
                </tr>
            </tbody>
        </table>`;
    dom.containers.resultsTable.innerHTML = tableHTML;
}


export function renderSimulationLoot(wonItems) {
    dom.containers.simulationLoot.style.display = 'block';
    if (Object.keys(wonItems).length === 0) {
        dom.containers.simulationLoot.innerHTML = '<h4>Loot Summary</h4><p>No items won in this simulation.</p>';
        return;
    }
    let listHTML = '<h4>Loot Summary</h4><ul>';
    for (const rewardId in wonItems) {
        const rewardData = findSwordById(rewardId)?.sword;
        if (rewardData) {
            listHTML += `<li>${wonItems[rewardId]}x <span class="rarity-text ${rewardData.rarity}">${rewardData.name}</span></li>`;
        }
    }
    listHTML += '</ul>';
    dom.containers.simulationLoot.innerHTML = listHTML;
}


export function renderHuntResult(result) {
    dom.containers.simulationLoot.style.display = 'block';
    if (result.found) {
        dom.containers.simulationLoot.innerHTML = `<h4>Hunt Result</h4><p>It took <strong>${result.casesOpened.toLocaleString()}</strong> cases to find <span class="rarity-text ${result.bestReward.rarity}">${result.bestReward.name}</span>!</p>`;
    } else {
        dom.containers.simulationLoot.innerHTML = `<h4>Hunt Result</h4><p style="color:var(--insane);">Did not find the ${result.bestReward.name} within ${result.maxAttempts.toLocaleString()} cases. This is a super rare item!</p>`;
    }
}


export function renderProfitGraph(results, MAX_GRAPH_SECTIONS) {
    if (results.length > MAX_GRAPH_SECTIONS) {
        dom.containers.resultsTable.innerHTML = `<p class="error-message" style="display:block;">Too many sections requested (Max: ${MAX_GRAPH_SECTIONS}).</p>`;
        return;
    }
    dom.containers.graph.style.display = 'block';
    const tooltip = document.querySelector('.graph-tooltip');
    dom.containers.graphSvg.innerHTML = '';
    dom.containers.graphLabels.innerHTML = '';
    if (results.length < 2) return;
   
    const isPercentage = results[0].isPercentage;
    const yAxisLabel = isPercentage ? 'Profit %' : 'Net Gain (Time)';
    const padding = { top: 20, right: 20, bottom: 20, left: 20 };
    const width = dom.containers.graphSvg.clientWidth;
    const height = dom.containers.graphSvg.clientHeight;
    if (width === 0 || height === 0) return;
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const minCases = results[0].cases;
    const maxCases = results[results.length - 1].cases;
    const yValues = results.map(r => r.value);
    const yMin = Math.min(0, ...yValues);
    const yMax = Math.max(0, ...yValues);
    const yRange = (yMax - yMin) === 0 ? 1 : (yMax - yMin);
    const yDomainMin = yMin - yRange * 0.1;
    const yDomainMax = yMax + yRange * 0.1;


    const xScale = (cases) => padding.left + ((cases - minCases) / (maxCases - minCases)) * chartWidth;
    const yScale = (val) => padding.top + chartHeight - ((val - yDomainMin) / (yDomainMax - yDomainMin)) * chartHeight;


    const createLineSegment = (p1, p2, isPositive) => {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', p1.x); line.setAttribute('y1', p1.y);
        line.setAttribute('x2', p2.x); line.setAttribute('y2', p2.y);
        line.setAttribute('class', isPositive ? 'graph-profit-line' : 'graph-loss-line');
        dom.containers.graphSvg.appendChild(line);
    };


    const zeroY = yScale(0);
    if (zeroY >= padding.top && zeroY <= height - padding.bottom) {
        const zeroLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        zeroLine.setAttribute('x1', padding.left); zeroLine.setAttribute('y1', zeroY);
        zeroLine.setAttribute('x2', width - padding.right); zeroLine.setAttribute('y2', zeroY);
        zeroLine.setAttribute('class', 'graph-zero-line');
        dom.containers.graphSvg.appendChild(zeroLine);
    }
    for (let i = 0; i < results.length - 1; i++) {
        const p1 = results[i]; const p2 = results[i + 1];
        const p1_coords = { x: xScale(p1.cases), y: yScale(p1.value) };
        const p2_coords = { x: xScale(p2.cases), y: yScale(p2.value) };
        if (p1.value * p2.value < 0) {
            const m = (p2.value - p1.value) / (p2.cases - p1.cases);
            const x_intersect = p1.cases - p1.value / m;
            const intersect_coords = { x: xScale(x_intersect), y: yScale(0) };
            createLineSegment(p1_coords, intersect_coords, p1.value >= 0);
            createLineSegment(intersect_coords, p2_coords, p2.value >= 0);
        } else { createLineSegment(p1_coords, p2_coords, p1.value >= 0); }
    }
    results.forEach(d => {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        const cx = xScale(d.cases); const cy = yScale(d.value);
        circle.setAttribute('cx', cx); circle.setAttribute('cy', cy);
        circle.setAttribute('class', `graph-data-point ${d.value >= 0 ? 'profit' : 'loss'}`);
        circle.addEventListener('mouseover', () => {
            tooltip.style.display = 'block';
            tooltip.style.left = `${cx}px`; tooltip.style.top = `${cy}px`;
            const sign = d.value > 0 ? '+' : '';
            const valueText = isPercentage ? `${sign}${d.value.toFixed(2)}%` : `${sign}${formatLargeNumber(d.value)}`;
            tooltip.innerHTML = `Cases: <strong>${d.cases.toLocaleString()}</strong><br>${yAxisLabel}: <strong class="tooltip-value ${d.value >= 0 ? 'profit' : 'loss'}">${valueText}</strong>`;
        });
        circle.addEventListener('mouseout', () => { tooltip.style.display = 'none'; });
        dom.containers.graphSvg.appendChild(circle);
    });


    const numLabels = Math.min(results.length, 6);
    const labelIndices = numLabels <= 1 ? [0] : Array.from({ length: numLabels }, (_, i) => Math.floor(i * (results.length - 1) / (numLabels - 1)));
    if (results.length > 0) {
        dom.containers.graphLabels.innerHTML = labelIndices.map(i => `<span>${formatLargeNumber(results[i].cases)}</span>`).join('');
    }
}




// --- Renderizado de Títulos, Sorteos y Admin ---
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
    if (title.key === selectedKey) item.classList.add('selected');
    
    // CORREGIDO: Se eliminan los guiones de los nombres de las variables.
    const titleBorderStyle = styleInfo.style.includes('gradient') ? styleInfo.style : styleInfo.style;
    const titleGlowColor = styleInfo.style.includes('gradient') ? 'rgba(255,255,255,0.4)' : styleInfo.style;

    item.style.setProperty('--title-border-style', titleBorderStyle);
    item.style.setProperty('--title-glow-color', titleGlowColor);

    item.onclick = () => { if (title.unlocked) onSelect(title.key); };
    item.innerHTML = `
      <span class="title-name ${styleInfo.style.includes('gradient') ? 'gradient' : ''}"
            style="${styleInfo.style.includes('gradient') ? `background-image: ${styleInfo.style}` : `color: ${styleInfo.style}`}">
        ${styleInfo.text}
      </span>
      ${!title.unlocked ? '<span class="lock-icon">🔒</span>' : ''}`;
    dom.containers.titlesList.appendChild(item);
  });
  renderTitleDetails(titlesData.find(t => t.key === selectedKey), onEquip);
}

function renderTitleDetails(title, onEquip) {
  const container = dom.containers.titleDetails;
  if (!title) {
    container.innerHTML = '<p>Select a title from the list to see its details.</p>';
    container.style.setProperty('--selected-title-border', 'var(--border-color)');
    return;
  }
  const styleInfo = titleStyles[title.key] || titleStyles['player'];
  
  // CORREGIDO: Se eliminan los guiones del nombre de la variable.
  const titleBorderStyle = styleInfo.style.includes('gradient') ? styleInfo.style : styleInfo.style;
  container.style.setProperty('--selected-title-border', titleBorderStyle);

  container.innerHTML = `
    <h3 class="${styleInfo.style.includes('gradient') ? 'gradient' : ''}"
        style="${styleInfo.style.includes('gradient') ? `background-image: ${styleInfo.style}` : `color: ${styleInfo.style}`}">
      ${styleInfo.text}
    </h3>
    <p>${titleStyles[title.key]?.description || 'No description available.'}</p>
    <button id="equip-title-btn" class="auth-button ${title.equipped ? 'equipped' : ''}">
      ${title.equipped ? 'Equipped' : 'Equip Title'}
    </button>`;
  const equipBtn = document.getElementById('equip-title-btn');
  if (title.unlocked && !title.equipped) {
    equipBtn.onclick = () => onEquip(title.key);
  } else {
    equipBtn.disabled = true;
  }
}

export function renderGiveawayPage(giveaways, recentWinners, currentUser, onJoin, onHost) {
    const activeGiveaway = giveaways.find(gw => gw.status === 'active');
    renderActiveGiveaway(activeGiveaway, currentUser, onJoin);
    renderUpcomingGiveaways(giveaways.filter(gw => gw.status === 'upcoming'));
    renderParticipants(activeGiveaway ? activeGiveaway.participants : []);
    renderRecentWinners(recentWinners);
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
    const isJoined = giveaway.participants?.some(p => p.username === currentUser?.username);
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
        const prizeText = gw.prize_pool.map(p => `${formatLargeNumber(p.amount)}${p.type === 'sword' ? 'x' : ''} ${p.type === 'currency' ? (appData.currencies[p.id] ? appData.currencies[p.id].name : p.id) : (findSwordById(p.id) ? findSwordById(p.id).sword.name : p.id)}`).join(' + ');
        list.innerHTML += `
            <div class="upcoming-giveaway-item">
                <span class="prize">${prizeText}</span>
                <span class="time">Starts: ${new Date(gw.start_time).toLocaleString()}</span>
            </div>`;
    });
    container.appendChild(list);
}

// NUEVO: Función auxiliar para crear la tarjeta de usuario estilizada
function createUserProfileCardHTML(user) {
  if (!user) return ''; // Guarda contra usuarios nulos
  const styleInfo = titleStyles[user.equippedTitle] || titleStyles['player'];
  const titleBorderStyle = styleInfo.style.includes('gradient') ? styleInfo.style : styleInfo.style;
  
  return `
    <div class="giveaway-user-card" style="--user-title-border: ${titleBorderStyle};">
      <img class="user-avatar" src="${user.avatar || 'images/placeholder.png'}" alt="${user.username}">
      <div class="user-info">
        <span class="user-name">@${user.username}</span>
        <span class="user-title ${styleInfo.style.includes('gradient') ? 'gradient' : ''}" 
              style="${styleInfo.style.includes('gradient') ? `background-image: ${styleInfo.style}` : `color: ${styleInfo.style}`}">
          ${styleInfo.text}
        </span>
      </div>
    </div>
  `;
}

// MODIFICADO: renderParticipants ahora usa la nueva tarjeta
function renderParticipants(participants) {
  const list = dom.containers.participantsList;
  if (!participants || participants.length === 0) {
    list.innerHTML = '<p>No participants yet.</p>';
    return;
  }
  // Mapeamos cada participante a la nueva tarjeta HTML
  list.innerHTML = participants.map(pUser => createUserProfileCardHTML(pUser)).join('');
}

// MODIFICADO: renderRecentWinners ahora usa la nueva tarjeta
function renderRecentWinners(winners) {
  const list = dom.containers.winnersList;
  if (!winners || winners.length === 0) {
    list.innerHTML = '<p>No recent winners.</p>';
    return;
  }
  list.innerHTML = winners.map(w => {
    const prizeText = w.prize_pool.map(p =>
      `${formatLargeNumber(p.amount)}${p.type === 'sword' ? 'x' : ''} ${p.type === 'currency' ? (appData.currencies[p.id]?.name || p.id) : (findSwordById(p.id)?.sword.name || p.id)}`
    ).join(' + ');
    
    // Creamos una tarjeta para el ganador y debajo mostramos el premio
    return `
      <div class="winner-item">
        ${createUserProfileCardHTML(w.profile)}
        <div class="winner-prize">Won: <strong>${prizeText}</strong></div>
      </div>
    `;
  }).join('');
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
        onGrantTitle(form.targetUsername.value, form.titleKey.value);
    });
}


export function updateProfileHeader(userData) {
    const userProfileNav = document.getElementById('user-profile-nav');
    const titleElement = document.getElementById('user-title');
    document.getElementById('user-name').textContent = `@${userData.username}`;
    document.getElementById('user-avatar').src = userData.avatar || 'images/placeholder.png';


    const styleInfo = titleStyles[userData.equippedTitle] || titleStyles['player'];
    titleElement.textContent = styleInfo.text;


    if (styleInfo.style.includes('gradient')) {
        titleElement.classList.add('gradient');
        titleElement.style.backgroundImage = styleInfo.style;
        titleElement.style.color = '';
        userProfileNav.style.setProperty('--border-gradient', styleInfo.style);
    } else {
        titleElement.classList.remove('gradient');
        titleElement.style.backgroundImage = '';
        titleElement.style.color = styleInfo.style;
        userProfileNav.style.setProperty('--border-gradient', `linear-gradient(to right, ${styleInfo.style}, ${styleInfo.style})`);
    }
}