/* =================================================================================== */
/* === ARCHIVO: ui.js === */
/* === Controla toda la manipulación del DOM y el renderizado de la interfaz de usuario. === */
/* =================================================================================== */

import { appData, parseValue } from './data.js';
import { findSwordById } from './utils.js'; // Lo crearemos después

// --- DOM Element Selection ---
// Mantener todos los selectores del DOM en un solo lugar dentro del módulo que los usa.
export const mainViews = {
    selection: document.getElementById('case-selection-view'),
    caseDetails: document.getElementById('case-details-view'),
    swordDetails: document.getElementById('sword-details-view')
};

export const containers = {
    cases: document.querySelector('#case-selection-view .cases-container'),
    rewards: document.getElementById('rewards-list-container'),
    otherSwords: document.getElementById('other-swords-container'),
    calculatorResults: document.getElementById('calculator-results-container'),
    simulationLoot: document.getElementById('simulation-loot-summary'),
    resultsTable: document.getElementById('results-table-container'),
    graph: document.getElementById('graph-container'),
    graphPlotArea: document.getElementById('graph-plot-area'),
    graphLabels: document.getElementById('graph-labels'),
    graphSvg: document.querySelector('#graph-plot-area svg')
};

export const inputs = {
    caseQuantity: document.getElementById('case-quantity-input'),
    graphStep: document.getElementById('graph-step-input'),
    graphMax: document.getElementById('graph-max-input'),
    converterFrom: document.getElementById('converter-from-input'),
    converterTo: document.getElementById('converter-to-input'),
    searchBar: document.getElementById('search-bar')
};

export const controls = {
    standard: document.getElementById('standard-controls'),
    graph: document.getElementById('graph-controls'),
};

// --- Helper & Formatting Functions ---

export function formatTimeAgo(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const seconds = Math.round((now - date) / 1000);
    if (seconds < 5) return `Updated just now`;
    if (seconds < 60) return `Updated ${seconds} seconds ago`;
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `Updated ${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `Updated ${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.round(hours / 24);
    return `Updated ${days} day${days > 1 ? 's' : ''} ago`;
}

export function formatLargeNumber(num) {
    if (typeof num !== 'number' || isNaN(num)) return 'N/A';
    if (Math.abs(num) < 1000) return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
    const units = ['K', 'M', 'B', 'T', 'Qd'];
    if (num === 0) return '0';
    const tier = Math.floor(Math.log10(Math.abs(num)) / 3);
    if (tier === 0) return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
    const unit = units[tier - 1];
    if (!unit) return num.toLocaleString();
    const scaled = num / Math.pow(1000, tier);
    return scaled.toFixed(2) + unit;
}

export function formatHours(totalHours) {
    if (totalHours < 24) return `${totalHours.toFixed(1)} hours`;
    const days = totalHours / 24;
    if (days < 7) return `${days.toFixed(1)} days`;
    const weeks = days / 7;
    if (weeks < 4.34) return `${weeks.toFixed(1)} weeks`;
    const months = days / 30.44;
    if (months < 12) return `${months.toFixed(1)} months`;
    const years = days / 365.25;
    return `${years.toFixed(2)} years`;
}


// --- Core UI Rendering Logic ---

export function showView(viewName, swordUpdateInterval) {
    if (swordUpdateInterval) {
        clearInterval(swordUpdateInterval);
    }
    Object.values(mainViews).forEach(view => view.style.display = 'none');
    mainViews[viewName].style.display = 'block';
    window.scrollTo(0, 0);
}

function getCurrencyHTML(currencyKey, price) {
    if (currencyKey === 'cooldown') {
        return `<span class="currency-text">Free (Every ${price} hr)</span>`;
    }
    const currency = appData.currencies[currencyKey];
    if (currency.icon) {
        return `<img src="${currency.icon}" alt="${currencyKey}" class="currency-icon"> <span class="value">${price.toLocaleString()}</span>`;
    }
    return `<span class="currency-text">${currency.name}</span> <span class="value">${price.toLocaleString()}</span>`;
}

function parseAndSetDescription(element, text, renderCaseDetails, renderSwordDetails) {
    element.innerHTML = '';
    if (!text) {
        element.textContent = 'No description available for this item.';
        return;
    }
    const fragment = document.createDocumentFragment();
    const regex = /\[(case|sword):([a-zA-Z0-9_-]+)\]/g;
    let lastIndex = 0;
    let match;
    while ((match = regex.exec(text)) !== null) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
        const [fullMatch, type, id] = match;
        const link = document.createElement('a');
        link.href = '#';
        if (type === 'case') {
            const data = appData.cases[id];
            if (data) {
                link.textContent = data.name;
                link.className = 'case-link-in-description';
                link.onclick = (e) => { e.preventDefault(); renderCaseDetails(id); };
            }
        } else if (type === 'sword') {
            const data = findSwordById(id);
            if (data) {
                link.textContent = data.sword.name;
                link.className = 'sword-link-in-description';
                link.onclick = (e) => { e.preventDefault(); renderSwordDetails(data.sword, data.source); };
            }
        }
        if (link.textContent) {
            fragment.appendChild(link);
        } else {
            fragment.appendChild(document.createTextNode(fullMatch));
        }
        lastIndex = regex.lastIndex;
    }
    fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
    element.appendChild(fragment);
}

export function renderSwordDetails(sword, sourceInfo, onNavigate, onNewInterval) {
    if (!sword) return;

    const swordInfoCard = document.getElementById('sword-info-card');
    swordInfoCard.className = ``;
    swordInfoCard.classList.add(sword.rarity);

    const demandIndicator = document.getElementById('sword-demand-indicator');
    if (sword.demand) {
        demandIndicator.className = '';
        demandIndicator.classList.add('sword-demand-indicator');
        demandIndicator.classList.add(sword.demand);
        demandIndicator.style.display = 'block';
    } else {
        demandIndicator.style.display = 'none';
    }

    document.getElementById('sword-details-image-container').innerHTML = `<img src="${sword.image}" alt="${sword.name}">`;
    document.getElementById('sword-details-name').textContent = sword.name;

    const descriptionEl = document.getElementById('sword-details-description');
    const fullDescription = sword.description || (sourceInfo.type === 'case' ? `This sword is obtainable from the [case:${sourceInfo.id}].` : 'A special item, not available in cases.');
    parseAndSetDescription(descriptionEl, fullDescription, (caseId) => onNavigate('caseDetails', caseId), renderSwordDetails);

    const valueEl = document.getElementById('sword-details-value');
    if (typeof sword.value === 'string' && sword.value.toUpperCase().startsWith('O/C')) {
        const match = sword.value.match(/\[(.*?)\]/);
        valueEl.textContent = 'O/C';
        valueEl.classList.add('value-oc');
        valueEl.title = match ? `Owner's Choice: ${match[1]}` : 'Owner\'s Choice - No range specified';
    } else {
        valueEl.textContent = typeof sword.value === 'number' ? sword.value.toLocaleString() : sword.value;
        valueEl.classList.remove('value-oc');
        valueEl.title = '';
    }

    document.getElementById('sword-details-stats').textContent = sword.stats;
    const moreEl = document.getElementById('sword-details-more');
    const existCount = typeof sword.exist === 'number' ? sword.exist.toLocaleString() : sword.exist;
    moreEl.innerHTML = `
        ${sword.chance ? `Chance - ${sword.chance}%<br>` : ''}
        Exist - ${existCount}<br>
        Rarity - <span class="rarity-text ${sword.rarity}">${sword.rarity}</span>
    `;
    const updatedEl = document.getElementById('sword-details-updated');
    const updateSwordTime = () => updatedEl.textContent = formatTimeAgo(sword.lastUpdated);
    updateSwordTime();
    
    // Pass the new interval ID back to the main script to manage.
    onNewInterval(setInterval(updateSwordTime, 60000));
    
    showView('swordDetails');
}

export function createRewardItemHTML(reward, source) {
    let valueDisplayHTML;
    if (typeof reward.value === 'string' && reward.value.toUpperCase().startsWith('O/C')) {
        const match = reward.value.match(/\[(.*?)\]/);
        valueDisplayHTML = `<span class="value-oc" title="${match ? match[1] : ''}">O/C</span>`;
    } else {
        valueDisplayHTML = typeof reward.value === 'number' ? reward.value.toLocaleString() : reward.value;
    }

    const isCaseReward = source.type === 'case';
    return `
        <div class="reward-info">
            <div class="reward-image-placeholder"><img src="${reward.image}" alt="${reward.name}"></div>
            <span class="reward-name">${reward.name}</span>
        </div>
        <div class="reward-stats">
           ${isCaseReward ? `<span>${reward.chance}%</span>` : '<span class="no-chance">--</span>'}
           <span class="reward-value">${valueDisplayHTML}</span>
           <span>${reward.stats}</span>
        </div>
    `;
}

export function renderCaseDetails(caseId, onNavigate) {
    const data = appData.cases[caseId];
    if (!data) return;

    document.getElementById('details-case-image').src = data.image;
    document.getElementById('details-case-name').textContent = data.name;
    document.getElementById('details-case-price').innerHTML = getCurrencyHTML(data.currency, data.price);
    
    const infoColumn = document.querySelector('.info-column');
    infoColumn.style.setProperty('--case-border-color', data.borderColor || 'var(--main-green)');
    
    containers.rewards.innerHTML = '';
    data.rewards.forEach(reward => {
        const item = document.createElement('div');
        item.className = `reward-item ${reward.rarity}`;
        item.innerHTML = createRewardItemHTML(reward, { type: 'case' });
        item.addEventListener('click', () => onNavigate('swordDetails', { sword: reward, source: { type: 'case', id: caseId } }));
        containers.rewards.appendChild(item);
    });
    
    clearCalculator();
    showView('caseDetails');
}

export function renderCaseSelection(onNavigate) {
    containers.cases.innerHTML = '';
    Object.keys(appData.cases).forEach(caseId => {
        const data = appData.cases[caseId];
        const link = document.createElement('a');
        link.href = '#';
        link.className = 'case-link';
        link.innerHTML = `<div class="case-item"></div>`;
        const caseItem = link.querySelector('.case-item');
        caseItem.style.setProperty('--case-border-color', data.borderColor || 'var(--main-green)');
        caseItem.innerHTML = `<img class="case-content-image" src="${data.image}" alt="${data.name}"><h3 class="case-title">${data.name}</h3><div class="case-price">${getCurrencyHTML(data.currency, data.price)}</div>`;
        link.addEventListener('click', (e) => { e.preventDefault(); onNavigate('caseDetails', caseId); });
        containers.cases.appendChild(link);
    });
}

export function renderOtherSwords(appState, onNavigate) {
    const { currentPage, itemsPerPage } = appState;
    containers.otherSwords.innerHTML = '';
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pagedItems = appData.otherSwords.slice(start, end);

    pagedItems.forEach(reward => {
        const item = document.createElement('div');
        item.className = `reward-item ${reward.rarity}`;
        item.innerHTML = createRewardItemHTML(reward, { type: 'other' });
        item.addEventListener('click', () => onNavigate('swordDetails', { sword: reward, source: { type: 'other' } }));
        containers.otherSwords.appendChild(item);
    });
    updatePaginationControls(appState);
}

export function updatePaginationControls(appState) {
    const { currentPage, itemsPerPage } = appState;
    const totalPages = Math.ceil(appData.otherSwords.length / itemsPerPage);
    document.getElementById('other-prev-btn').disabled = currentPage === 1;
    document.getElementById('other-next-btn').disabled = currentPage === totalPages;
}


// --- Calculator UI ---

export function clearCalculator(appState) {
    containers.simulationLoot.style.display = 'none';
    containers.resultsTable.innerHTML = '';
    containers.graph.style.display = 'none';
    if (containers.graphSvg) containers.graphSvg.innerHTML = '';
    if (containers.graphLabels) containers.graphLabels.innerHTML = '';

    const calculateBtn = document.getElementById('calculate-btn');
    const isGraphMode = appState.calculatorMode === 'graph';
    const isUntilBestMode = appState.calculatorMode === 'untilBest';

    controls.standard.style.display = isGraphMode ? 'none' : 'flex';
    controls.graph.style.display = isGraphMode ? 'flex' : 'none';

    if (isUntilBestMode) {
        inputs.caseQuantity.value = '';
        inputs.caseQuantity.placeholder = "Not applicable";
        inputs.caseQuantity.disabled = true;
        calculateBtn.textContent = 'Start Hunt';
    } else {
        inputs.caseQuantity.placeholder = "Enter amount...";
        inputs.caseQuantity.disabled = false;
        calculateBtn.textContent = 'Calculate';
    }
}

export function renderResultsTable(data, appState) {
    containers.resultsTable.innerHTML = '';
    const quantity = data.quantityOverride || parseInt(inputs.caseQuantity.value, 10) || 1;
    const resultClass = data.result >= 0 ? 'profit' : 'loss';
    const resultSign = data.result >= 0 ? '+' : '';
    const profitPerCase = data.result / quantity;
    const profitPercentage = data.totalCost > 0 ? (data.result / data.totalCost) * 100 : (data.result > 0 ? Infinity : 0);
    
    let totalCostDisplay;
    const currentCaseData = appData.cases[appState.currentCaseIdForCalc];
    if (currentCaseData && currentCaseData.currency === 'cooldown') {
        totalCostDisplay = formatHours(data.totalCost);
    } else {
        totalCostDisplay = formatLargeNumber(data.totalCost);
    }
    
    const profitPercentageDisplay = isFinite(profitPercentage) ? `${profitPercentage.toFixed(2)}%` : `∞%`;

    const tableHTML = `<table id="results-table"><thead><tr><th>${appState.calculatorMode === 'theoretical' ? 'Expected Value' : 'Total Value'}</th><th>Total Cost</th><th>Net Result</th><th>Result/Case</th><th>Profit %</th></tr></thead><tbody><tr><td>${formatLargeNumber(data.totalValueGained)}</td><td>${totalCostDisplay}</td><td class="${resultClass}">${resultSign}${formatLargeNumber(data.result)}</td><td class="${resultClass}">${resultSign}${formatLargeNumber(profitPerCase)}</td><td class="${resultClass}">${resultSign}${profitPercentageDisplay}</td></tr></tbody></table>`;
    containers.resultsTable.innerHTML = tableHTML;
}

export function renderSimulationLoot(wonItems) {
    containers.simulationLoot.style.display = 'block';
    if (Object.keys(wonItems).length === 0) {
        containers.simulationLoot.innerHTML = '<h4>Loot Summary</h4><p>No items won in this simulation.</p>';
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
    containers.simulationLoot.innerHTML = listHTML;
}

export function renderHuntResult(result) {
    containers.simulationLoot.style.display = 'block';
    if (result.found) {
        containers.simulationLoot.innerHTML = `<h4>Hunt Result</h4><p>It took <strong>${result.casesOpened.toLocaleString()}</strong> cases to find <span class="rarity-text ${result.bestReward.rarity}">${result.bestReward.name}</span>!</p>`;
    } else {
        containers.simulationLoot.innerHTML = `<h4>Hunt Result</h4><p style="color:var(--insane);">Did not find the ${result.bestReward.name} within ${result.maxAttempts.toLocaleString()} cases. This is a super rare item!</p>`;
    }
}

export function renderProfitGraph(results, MAX_GRAPH_SECTIONS) {
    if (results.length > MAX_GRAPH_SECTIONS) {
        containers.resultsTable.innerHTML = `<p class="error-message" style="display:block;">Too many sections requested (Max: ${MAX_GRAPH_SECTIONS}). Please increase the range or decrease the maximum.</p>`;
        return;
    }
    containers.graph.style.display = 'block';
    const tooltip = document.querySelector('.graph-tooltip');
    containers.graphSvg.innerHTML = '';
    containers.graphLabels.innerHTML = '';

    if (results.length < 2) return;

    const isPercentage = results[0].isPercentage;
    const yAxisLabel = isPercentage ? 'Profit %' : 'Net Gain (Time)';
    const padding = { top: 20, right: 20, bottom: 20, left: 20 };
    const width = containers.graphSvg.clientWidth;
    const height = containers.graphSvg.clientHeight;
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
        containers.graphSvg.appendChild(line);
    };
    
    const zeroY = yScale(0);
    if (zeroY >= padding.top && zeroY <= height - padding.bottom) {
         const zeroLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        zeroLine.setAttribute('x1', padding.left); zeroLine.setAttribute('y1', zeroY);
        zeroLine.setAttribute('x2', width - padding.right); zeroLine.setAttribute('y2', zeroY);
        zeroLine.setAttribute('class', 'graph-zero-line');
        containers.graphSvg.appendChild(zeroLine);
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
        } else {
            createLineSegment(p1_coords, p2_coords, p1.value >= 0);
        }
    }
    results.forEach(d => {
        const cx = xScale(d.cases); const cy = yScale(d.value);
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', cx); circle.setAttribute('cy', cy);
        circle.setAttribute('class', `graph-data-point ${d.value >= 0 ? 'profit' : 'loss'}`);
        circle.addEventListener('mouseover', () => {
            tooltip.style.display = 'block';
            const profitClass = d.value >= 0 ? 'profit' : 'loss';
            const sign = d.value > 0 ? '+' : '';
            const valueText = isPercentage ? `${sign}${d.value.toFixed(2)}%` : `${sign}${formatLargeNumber(d.value)}`;
            tooltip.innerHTML = `Cases: <strong>${d.cases.toLocaleString()}</strong><br>${yAxisLabel}: <strong class="tooltip-value ${profitClass}">${valueText}</strong>`;
            tooltip.style.left = `${cx}px`;
            tooltip.style.top = `${cy}px`;
        });
        circle.addEventListener('mouseout', () => { tooltip.style.display = 'none'; });
        containers.graphSvg.appendChild(circle);
    });
    const numLabels = Math.min(results.length, 6);
    const labelIndices = numLabels <= 1 ? [0] : Array.from({ length: numLabels }, (_, i) => Math.floor(i * (results.length - 1) / (numLabels - 1)));
    if (results.length > 0) {
        containers.graphLabels.innerHTML = labelIndices.map(i => `<span>${formatLargeNumber(results[i].cases)}</span>`).join('');
    }
}