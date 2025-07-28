/* =================================================================================== */
/* === ARCHIVO: main.js (VERSIÓN COMPLETA, FINAL Y FUNCIONAL) === */
/* =================================================================================== */

// --- MÓDULOS ---
import { appData, parseValue } from './data.js';
import { findSwordById, getUnitValue, convertTimeValueToCurrency, formatLargeNumber } from './utils.js';
import * as UI from './ui.js';
import * as Calculator from './calculator.js';
import { initializeAuth } from './auth.js';

// --- ESTADO DE LA APLICACIÓN ---
let swordUpdateInterval = null;
let navigationContext = { view: 'selection', id: null };
const appState = {
    currentPage: 1,
    itemsPerPage: 10,
    currentCaseIdForCalc: null,
    calculatorMode: 'theoretical'
};
const MAX_GRAPH_SECTIONS = 50;

// --- NAVEGACIÓN ---
function navigateTo(view, data) {
    if (swordUpdateInterval) {
        clearInterval(swordUpdateInterval);
        swordUpdateInterval = null;
    }

    switch (view) {
        case 'caseDetails':
            appState.currentCaseIdForCalc = data;
            navigationContext = { view: 'caseDetails', id: data };
            UI.renderCaseDetails(data, navigateTo);
            break;
        case 'swordDetails':
            const { sword, source } = data;
            navigationContext = { ...source }; // Guardamos de dónde vinimos {type, id}
            UI.renderSwordDetails(sword, source, navigateTo, (intervalId) => {
                swordUpdateInterval = intervalId;
            });
            break;
        case 'selection':
        default:
            navigationContext = { view: 'selection', id: null };
            UI.showView('selection');
            break;
    }
}

// --- LÓGICA DE LA UI SUPERIOR (CONVERSOR Y BÚSQUEDA) ---
function initializeTopUI() {
    const allSwords = [
        ...Object.values(appData.cases).flatMap(c => c.rewards),
        ...appData.otherSwords
    ];
    const searchResultsContainer = document.getElementById('search-results');
    
    UI.inputs.searchBar.addEventListener('input', () => {
        const query = UI.inputs.searchBar.value.toLowerCase().trim();
        if (!query) {
            searchResultsContainer.style.display = 'none';
            return;
        }
        const results = allSwords.filter(s => s.name.toLowerCase().includes(query)).slice(0, 10);
        searchResultsContainer.innerHTML = '';
        if (results.length > 0) {
            results.forEach(reward => {
                const sourceInfo = findSwordById(reward.id)?.source || { type: 'other' };
                const item = document.createElement('div');
                item.className = `reward-item ${reward.rarity}`;
                item.innerHTML = UI.createRewardItemHTML(reward, sourceInfo);
                item.addEventListener('click', () => {
                    navigateTo('swordDetails', { sword: reward, source: sourceInfo });
                    UI.inputs.searchBar.value = '';
                    searchResultsContainer.style.display = 'none';
                });
                searchResultsContainer.appendChild(item);
            });
            searchResultsContainer.style.display = 'block';
        } else {
            searchResultsContainer.style.display = 'none';
        }
    });

    document.addEventListener('click', (e) => {
        if (!document.getElementById('search-module').contains(e.target)) {
            searchResultsContainer.style.display = 'none';
        }
    });

    const fromCurrencySelect = document.getElementById('converter-from-currency');
    const toCurrencySelect = document.getElementById('converter-to-currency');
    const currencyKeys = Object.keys(appData.currencies);
    currencyKeys.forEach(key => {
        fromCurrencySelect.innerHTML += `<option value="${key}">${appData.currencies[key].name}</option>`;
        toCurrencySelect.innerHTML += `<option value="${key}">${appData.currencies[key].name}</option>`;
    });
    fromCurrencySelect.value = 'time'; toCurrencySelect.value = 'diamonds';

    function updateConverterUI() {
        const fromCurrency = appData.currencies[fromCurrencySelect.value];
        document.getElementById('converter-from-name').textContent = fromCurrency.name;
        const fromIcon = document.getElementById('converter-from-icon');
        fromIcon.src = fromCurrency.icon || ''; fromIcon.style.display = fromCurrency.icon ? 'block' : 'none';
        const toCurrency = appData.currencies[toCurrencySelect.value];
        document.getElementById('converter-to-name').textContent = toCurrency.name;
        const toIcon = document.getElementById('converter-to-icon');
        toIcon.src = toCurrency.icon || ''; toIcon.style.display = toCurrency.icon ? 'block' : 'none';
    }
    function runConversion() {
        const fromAmount = parseValue(UI.inputs.converterFrom.value);
        if (isNaN(fromAmount) || fromAmount <= 0) { UI.inputs.converterTo.value = ''; return; }
        const totalTimeValue = fromAmount * getUnitValue(fromCurrencySelect.value, fromAmount);
        const finalAmount = convertTimeValueToCurrency(totalTimeValue, toCurrencySelect.value);
        UI.inputs.converterTo.value = finalAmount > 0 ? formatLargeNumber(finalAmount) : 'N/A';
    }
    function cycleCurrency(selectElement) {
        const currentIndex = currencyKeys.indexOf(selectElement.value);
        selectElement.value = currencyKeys[(currentIndex + 1) % currencyKeys.length];
        updateConverterUI(); runConversion();
    }
    UI.inputs.converterFrom.addEventListener('input', runConversion);
    document.getElementById('converter-from-wrapper').addEventListener('click', (e) => { if (e.target.id !== 'converter-from-input') cycleCurrency(fromCurrencySelect); });
    document.getElementById('converter-to-wrapper').addEventListener('click', () => cycleCurrency(toCurrencySelect));
    updateConverterUI(); runConversion();
}

// --- LÓGICA DE LA CALCULADORA ---
function initializeCalculator() {
    function handleCalculate() {
        const quantity = parseInt(UI.inputs.caseQuantity.value, 10);
        const caseId = appState.currentCaseIdForCalc;
        if (!caseId || !appData.cases[caseId]) return;
        UI.containers.resultsTable.innerHTML = ''; UI.containers.simulationLoot.style.display = 'none';
        if (appState.calculatorMode !== 'untilBest' && (isNaN(quantity) || quantity <= 0)) {
            UI.containers.resultsTable.innerHTML = `<p class="error-message" style="display:block;">Please enter a valid number of cases.</p>`;
            return;
        }
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
        if (!caseId || !appData.cases[caseId] || isNaN(step) || isNaN(max) || step <= 0 || max <= 0 || max < step || (max/step) > MAX_GRAPH_SECTIONS) {
            UI.containers.resultsTable.innerHTML = `<p class="error-message" style="display:block;">Please enter a valid range and maximum (max ${MAX_GRAPH_SECTIONS} sections).</p>`;
            return;
        }
        Calculator.runGraphSimulation(step, max, caseId);
    }
    document.getElementById('calculate-btn').addEventListener('click', handleCalculate);
    document.getElementById('calculate-graph-btn').addEventListener('click', handleGraphCalculate);
    ['mode-theoretical-btn', 'mode-simulate-btn', 'mode-until-best-btn', 'mode-graph-btn'].forEach(btnId => {
        document.getElementById(btnId).addEventListener('click', (e) => {
            document.querySelector('.calculator-mode-selector .active').classList.remove('active');
            e.target.classList.add('active');
            const newMode = e.target.id.replace('mode-','').replace('-btn','').replace(/-(\w)/g, (m,p1)=>p1.toUpperCase());
            appState.calculatorMode = newMode;
            UI.clearCalculator(appState);
        });
    });
}

// --- INICIALIZACIÓN DE LA APLICACIÓN ---
function initializeApp() {
    // 1. Inicializar sistema de autenticación (esto añade los listeners al botón de login)
    initializeAuth();

    // 2. Inicializar UI superior (búsqueda y conversor)
    initializeTopUI();

    // 3. Inicializar lógica de la calculadora
    initializeCalculator();

    // 4. Configurar listeners de navegación principal
    document.getElementById('details-to-selection-btn').addEventListener('click', () => navigateTo('selection'));
    document.getElementById('sword-to-details-btn').addEventListener('click', () => {
        if (navigationContext.type === 'case') {
            navigateTo('caseDetails', navigationContext.id);
        } else {
            navigateTo('selection');
        }
    });

    // 5. Configurar paginación
    document.getElementById('other-prev-btn').addEventListener('click', () => {
        if (appState.currentPage > 1) {
            appState.currentPage--;
            UI.renderOtherSwords(appState, navigateTo);
        }
    });
    document.getElementById('other-next-btn').addEventListener('click', () => {
        const totalPages = Math.ceil(appData.otherSwords.length / appState.itemsPerPage);
        if (appState.currentPage < totalPages) {
            appState.currentPage++;
            UI.renderOtherSwords(appState, navigateTo);
        }
    });

    // 6. Renderizar contenido inicial
    UI.renderCaseSelection(navigateTo);
    UI.renderOtherSwords(appState, navigateTo);
    
    // 7. Mostrar la vista inicial
    navigateTo('selection');
    
    console.log("STS Values App Initialized Correctly!");
}

// Punto de entrada: ejecutar todo cuando el DOM esté listo.
document.addEventListener('DOMContentLoaded', initializeApp);