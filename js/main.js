/* =================================================================================== */
/* === ARCHIVO: main.js (NUEVO CEREBRO DE LA APLICACIÓN) === */
/* =================================================================================== */

// --- MÓDULOS ---
import { appData, parseValue } from './data.js';
import { findSwordById, getUnitValue, convertTimeValueToCurrency, formatLargeNumber } from './utils.js';
import * as UI from './ui.js';
import * as Calculator from './calculator.js';
import { initializeAuth } from './auth.js';

// --- ESTADO GLOBAL DE LA APLICACIÓN ---
let swordUpdateInterval = null;
let currentUser = null;
let navigationContext = { view: 'selection', id: null, type: null };

const appState = {
    currentPage: 1,
    itemsPerPage: 10,
    currentCaseIdForCalc: null,
    calculatorMode: 'theoretical'
};

const MAX_GRAPH_SECTIONS = 50;

// --- GESTIÓN DE VISTAS ---
const mainViews = {
    main: document.getElementById('main-view'),
    titles: document.getElementById('titles-view'),
    giveaways: document.getElementById('giveaways-view'),
    devtools: document.getElementById('devtools-view'),
    caseDetails: document.getElementById('case-details-view'),
    swordDetails: document.getElementById('sword-details-view'),
};

function showMainView(viewName) {
    Object.values(mainViews).forEach(v => v.style.display = 'none');
    if (mainViews[viewName]) {
        mainViews[viewName].style.display = 'block';
    } else {
        mainViews.main.style.display = 'block';
    }
    if (viewName === 'main') {
        mainViews.main.querySelector('#case-selection-view').style.display = 'block';
    }
}

async function navigateToView(viewName) {
    showMainView(viewName);
    
    if (viewName === 'titles') {
        if (!currentUser) {
            document.getElementById('titles-list-container').innerHTML = `<p>You must be logged in to view your titles.</p>`;
            return;
        }
        await loadAndRenderTitles();
    } else if (viewName === 'devtools') {
        if (currentUser && currentUser.role === 'owner') {
            UI.renderAdminTools(handleGrantTitle);
        } else {
            document.getElementById('devtools-view').innerHTML = `<h2 class="section-title">ACCESS DENIED</h2><p>You do not have permission to view this page.</p>`;
        }
    }
    
    window.scrollTo(0, 0);
}

// --- NAVEGACIÓN SECUNDARIA (CASOS/ESPADAS) ---
function navigateToSubView(view, data) {
    if (swordUpdateInterval) { clearInterval(swordUpdateInterval); swordUpdateInterval = null; }
    switch (view) {
        case 'caseDetails':
            appState.currentCaseIdForCalc = data;
            navigationContext = { view: 'caseDetails', id: data, type: 'case' };
            UI.renderCaseDetails(data, navigateToSubView);
            break;
        case 'swordDetails':
            const { sword, source } = data;
            navigationContext = { view: 'swordDetails', type: source.type, id: source.id };
            UI.renderSwordDetails(sword, source, navigateToSubView, (intervalId) => { swordUpdateInterval = intervalId; });
            break;
        case 'selection':
        default:
            navigationContext = { view: 'selection', id: null };
            showMainView('main');
            UI.showView('selection');
            break;
    }
}

// --- LÓGICA DE NEGOCIO ---
async function loadAndRenderTitles() {
    const token = localStorage.getItem('sts-token');
    if (!token) return;
    try {
        const response = await fetch('/.netlify/functions/get-titles', { headers: { 'Authorization': `Bearer ${token}` } });
        if (!response.ok) throw new Error('Failed to fetch titles');
        const titlesData = await response.json();
        UI.renderTitlesPage(titlesData, handleTitleSelection);
    } catch (error) {
        console.error("Error loading titles:", error);
        document.getElementById('titles-list-container').innerHTML = `<p class="error-message" style="display:block;">Could not load titles.</p>`;
    }
}

async function handleTitleSelection(newTitleKey) {
    const token = localStorage.getItem('sts-token');
    try {
        const response = await fetch('/.netlify/functions/update-user-profile', {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ newTitle: newTitleKey })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message);
        currentUser.equippedTitle = result.equippedTitle;
        localStorage.setItem('sts-user', JSON.stringify(currentUser));
        UI.updateProfileHeader(currentUser);
        await loadAndRenderTitles();
    } catch (error) {
        console.error("Error updating title:", error);
        alert(`Error: ${error.message}`);
    }
}

async function handleGrantTitle(targetUsername, titleKey) {
    const token = localStorage.getItem('sts-token');
    const feedbackEl = document.getElementById('admin-feedback');
    const button = document.querySelector('#grant-title-form button');
    
    feedbackEl.style.display = 'none';
    button.disabled = true;
    button.textContent = 'Granting...';

    try {
        const response = await fetch('/.netlify/functions/admin-tools', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'grantTitle', targetUsername, titleKey })
        });
        const result = await response.json();

        if (!response.ok) throw new Error(result.message);

        feedbackEl.className = 'feedback-message success';
        feedbackEl.textContent = result.message;
        feedbackEl.style.display = 'block';

    } catch (error) {
        console.error("Admin action failed:", error);
        feedbackEl.className = 'feedback-message error';
        feedbackEl.textContent = `Error: ${error.message}`;
        feedbackEl.style.display = 'block';
    } finally {
        button.disabled = false;
        button.textContent = 'Grant Title';
    }
}

// --- INICIALIZACIÓN DE MÓDULOS ---
function initializeTopUI() {
    const allSwords = [...Object.values(appData.cases).flatMap(c => c.rewards), ...appData.otherSwords];
    const searchResultsContainer = document.getElementById('search-results');
    UI.inputs.searchBar.addEventListener('input', () => {
        const query = UI.inputs.searchBar.value.toLowerCase().trim();
        if (!query) { searchResultsContainer.style.display = 'none'; return; }
        const results = allSwords.filter(s => s.name.toLowerCase().includes(query)).slice(0, 10);
        searchResultsContainer.innerHTML = '';
        if (results.length > 0) {
            results.forEach(reward => {
                const sourceInfo = findSwordById(reward.id)?.source || { type: 'other' };
                const item = document.createElement('div');
                item.className = `reward-item ${reward.rarity}`;
                item.innerHTML = UI.createRewardItemHTML(reward, sourceInfo);
                item.addEventListener('click', () => {
                    navigateToSubView('swordDetails', { sword: reward, source: sourceInfo });
                    UI.inputs.searchBar.value = '';
                    searchResultsContainer.style.display = 'none';
                });
                searchResultsContainer.appendChild(item);
            });
            searchResultsContainer.style.display = 'block';
        } else { searchResultsContainer.style.display = 'none'; }
    });
    document.addEventListener('click', (e) => {
        if (!document.getElementById('search-module').contains(e.target)) {
            searchResultsContainer.style.display = 'none';
        }
    });
    const currencyKeys = Object.keys(appData.currencies);
    function updateConverterUI(elementId, newCurrencyKey) {
        const currency = appData.currencies[newCurrencyKey];
        const nameEl = document.getElementById(`converter-${elementId}-name`);
        const iconEl = document.getElementById(`converter-${elementId}-icon`);
        nameEl.textContent = currency.name; nameEl.dataset.currencyKey = newCurrencyKey;
        iconEl.src = currency.icon || ''; iconEl.style.display = currency.icon ? 'block' : 'none';
    }
    function runConversion() {
        const fromAmount = parseValue(UI.inputs.converterFrom.value);
        if (isNaN(fromAmount) || fromAmount <= 0) { UI.inputs.converterTo.value = ''; return; }
        const fromKey = document.getElementById('converter-from-name').dataset.currencyKey;
        const toKey = document.getElementById('converter-to-name').dataset.currencyKey;
        const totalTimeValue = fromAmount * getUnitValue(fromKey, fromAmount);
        const finalAmount = convertTimeValueToCurrency(totalTimeValue, toKey);
        UI.inputs.converterTo.value = finalAmount > 0 ? formatLargeNumber(finalAmount) : 'N/A';
    }
    function cycleCurrency(wrapperElement) {
        const nameEl = wrapperElement.querySelector('.converter-currency-name');
        const currentKey = nameEl.dataset.currencyKey;
        const currentIndex = currencyKeys.indexOf(currentKey);
        const nextIndex = (currentIndex + 1) % currencyKeys.length;
        const newKey = currencyKeys[nextIndex];
        const elementId = wrapperElement.id.includes('from') ? 'from' : 'to';
        updateConverterUI(elementId, newKey);
        runConversion();
    }
    UI.inputs.converterFrom.addEventListener('input', runConversion);
    document.getElementById('converter-from-wrapper').addEventListener('click', (e) => { if (e.target.tagName !== 'INPUT') cycleCurrency(e.currentTarget); });
    document.getElementById('converter-to-wrapper').addEventListener('click', (e) => cycleCurrency(e.currentTarget));
    updateConverterUI('from', 'time'); updateConverterUI('to', 'diamonds');
}

function initializeCalculator() {
    function handleCalculate() {
        const quantity = parseInt(UI.inputs.caseQuantity.value, 10);
        const caseId = appState.currentCaseIdForCalc;
        if (!caseId || !appData.cases[caseId]) return;
        UI.containers.resultsTable.innerHTML = ''; UI.containers.simulationLoot.style.display = 'none';
        if (appState.calculatorMode !== 'untilBest' && (isNaN(quantity) || quantity <= 0)) { UI.containers.resultsTable.innerHTML = `<p class="error-message" style="display:block;">Please enter a valid number of cases.</p>`; return; }
        switch (appState.calculatorMode) {
            case 'theoretical': Calculator.runTheoreticalCalculation(quantity, caseId, appState); break;
            case 'simulate': Calculator.runRealisticSimulation(quantity, caseId, appState); break;
            case 'untilBest': Calculator.runUntilBestSimulation(caseId, appState); break;
        }
    }
    function handleGraphCalculate() {
        const step = parseInt(UI.inputs.graphStep.value, 10);
        const max = parseInt(UI.inputs.graphMax.value, 10);
        const caseId = appState.currentCaseIdForCalc;
        UI.containers.resultsTable.innerHTML = ''; UI.containers.simulationLoot.style.display = 'none'; UI.containers.graph.style.display = 'none';
        if (!caseId || !appData.cases[caseId] || isNaN(step) || isNaN(max) || step <= 0 || max <= 0 || max < step || (max/step) > MAX_GRAPH_SECTIONS) { UI.containers.resultsTable.innerHTML = `<p class="error-message" style="display:block;">Please enter a valid range and maximum (max ${MAX_GRAPH_SECTIONS} sections).</p>`; return; }
        Calculator.runGraphSimulation(step, max, caseId);
    }
    document.getElementById('calculate-btn').addEventListener('click', handleCalculate);
    document.getElementById('calculate-graph-btn').addEventListener('click', handleGraphCalculate);
    ['mode-theoretical-btn', 'mode-simulate-btn', 'mode-until-best-btn', 'mode-graph-btn'].forEach(btnId => {
        document.getElementById(btnId).addEventListener('click', (e) => {
            document.querySelector('.calculator-mode-selector .active').classList.remove('active');
            e.target.classList.add('active');
            appState.calculatorMode = e.target.id.replace('mode-','').replace('-btn','').replace(/-(\w)/g, (m,p1)=>p1.toUpperCase());
            UI.clearCalculator(appState);
        });
    });
}

// --- FUNCIÓN PRINCIPAL DE INICIALIZACIÓN DE LA APP ---
function initializeApp() {
    initializeAuth((loggedInUser) => {
        currentUser = loggedInUser;
        if(loggedInUser) {
            UI.updateProfileHeader(loggedInUser);
            // Mostrar enlace de dev tools si es owner
            document.getElementById('dev-tools-link').style.display = loggedInUser.role === 'owner' ? 'block' : 'none';
        }
    });

    initializeTopUI();
    initializeCalculator();

    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const view = e.target.dataset.view;
            if (view && !e.target.classList.contains('disabled')) {
                navigateToView(view);
                document.getElementById('main-nav-dropdown').classList.remove('visible');
                document.getElementById('hamburger-menu').classList.remove('open');
            }
        });
    });

    document.getElementById('details-to-selection-btn').addEventListener('click', () => navigateToSubView('selection'));
    document.getElementById('sword-to-details-btn').addEventListener('click', () => {
        if (navigationContext.type === 'case' && navigationContext.id) {
            navigateToSubView('caseDetails', navigationContext.id);
        } else {
            navigateToSubView('selection');
        }
    });

    document.getElementById('other-prev-btn').addEventListener('click', () => {
        if (appState.currentPage > 1) { appState.currentPage--; UI.renderOtherSwords(appState, navigateToSubView); }
    });
    document.getElementById('other-next-btn').addEventListener('click', () => {
        const totalPages = Math.ceil(appData.otherSwords.length / appState.itemsPerPage);
        if (appState.currentPage < totalPages) { appState.currentPage++; UI.renderOtherSwords(appState, navigateToSubView); }
    });

    UI.renderCaseSelection(navigateToSubView);
    UI.renderOtherSwords(appState, navigateToSubView);
    
    navigateToView('main');
    
    console.log("STS Values App Initialized!");
}

document.addEventListener('DOMContentLoaded', initializeApp);