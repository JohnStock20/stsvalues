// =================================================================================
// ARCHIVO: main.js (NUEVO CEREBRO DE LA APLICACIÓN) - VERSIÓN FINAL CORREGIDA
// =================================================================================

// --- MÓDULOS ---
import { appData, parseValue } from './data.js';
import { findSwordById, getPrizeItemHtml, getUnitValue, convertTimeValueToCurrency, formatLargeNumber } from './utils.js';
import * as UI from './ui.js';
import { initializeAuth, titleStyles } from './auth.js';
import * as Calculator from './calculator.js';

// --- ESTADO GLOBAL DE LA APLICACIÓN ---
let currentUser = null;
let navigationContext = { view: 'cases', id: null, type: null };
let appDataCache = {
    giveaways: [],
    recentWinners: []
};
let giveawayUpdateInterval = null;
let timerInterval = null;
let selectedTitleKey = null;

// --- AÑADE ESTAS VARIABLES AL ESTADO GLOBAL ---
let customCaseValues = {};
let isEditMode = false;
let activeValueSource = 'official'; // 'official' o 'custom'

const appState = {
    currentPage: 1,
    itemsPerPage: 10,
    currentCaseIdForCalc: null,
    calculatorMode: 'theoretical',
    currentNavigationView: { view: 'cases', id: null, type: 'cases' }
};

// --- GESTIÓN DE VISTAS Y NAVEGÁCIÓn ---

function navigateToView(viewName) {
    UI.showView(viewName);
    appState.currentNavigationView = { view: viewName, id: null, type: viewName };

    if (viewName === 'titles') {
        loadAndRenderTitles();
    } else if (viewName === 'giveaways') {
        UI.renderGiveawayPage(appDataCache.giveaways, appDataCache.recentWinners, currentUser, handleJoinGiveaway, openCreateGiveawayModal);
    } else if (viewName === 'devtools') {
        if (currentUser && currentUser.role === 'owner') {
            UI.renderAdminTools(handleGrantTitle);
        } else {
            document.getElementById('devtools-view').innerHTML = `<h2 class="section-title">ACCESS DENIED</h2><p>You do not have permission to view this page.</p>`;
        }
    }
}

// REEMPLAZA tu función navigateToSubView con esta versión corregida
async function navigateToSubView(view, data) {
    if (window.swordUpdateInterval) clearInterval(window.swordUpdateInterval);
    
    navigationContext = { ...appState.currentNavigationView };
    appState.currentNavigationView = { view, id: data };

    switch (view) {
        case 'caseDetails':
            appState.currentCaseIdForCalc = data;
            isEditMode = false;
            activeValueSource = 'official';

            const caseData = appData.cases[data];
            
            // CORRECCIÓN CLAVE: Nos aseguramos de que customCaseValues sea siempre un objeto
            let fetchedValues = null; 
            if (currentUser) {
                const token = localStorage.getItem('sts-token');
                try {
                    const response = await fetch(`/.netlify/functions/custom-values-manager?caseId=${data}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (response.ok) {
                        fetchedValues = await response.json();
                    }
                } catch (error) {
                    console.error("Could not fetch custom values:", error);
                }
            }
            // Si fetchedValues es null o undefined, lo convertimos en un objeto vacío.
            customCaseValues = fetchedValues || {};
            
            renderRewardSection(caseData);
            UI.renderCaseDetailsHeader(caseData);
            UI.showView('caseDetails');
            break;

        case 'swordDetails':
            UI.renderSwordDetails(data.sword, data.source, navigateToSubView, (intervalId) => {
                window.swordUpdateInterval = intervalId;
            });
            break;
            
        case 'cases':
        default:
            UI.showView('cases');
            break;
    }
}

// NUEVA FUNCIÓN: Se encarga de renderizar y re-renderizar la sección de recompensas
function renderRewardSection(caseData) {
    const rewards = caseData.rewards;
    const hasCustomValues = Object.keys(customCaseValues).length > 0;

    // Decide qué fuente de datos usar
    const displayRewards = activeValueSource === 'custom' && hasCustomValues
        ? rewards.map(r => ({ ...r, value: customCaseValues[r.id] || r.value }))
        : rewards;
    
    // Renderiza la lista de espadas
    UI.dom.containers.rewards.innerHTML = '';
    displayRewards.forEach(reward => {
        const source = { type: 'case', id: caseData.id };
        const item = UI.createRewardItem(reward, source, navigateToSubView);
        if (isEditMode) item.classList.add('edit-mode');
        UI.dom.containers.rewards.appendChild(item);
    });

    // Renderiza los controles (botón de editar, toggle, etc.)
    const controlsContainer = document.getElementById('value-controls-container');
    let controlsHTML = '';

    if (isEditMode) {
        controlsHTML = `<button id="save-values-btn" class="value-action-btn">Save</button>`;
    } else {
        controlsHTML = `<button id="edit-values-btn" class="value-action-btn" ${!currentUser ? 'disabled' : ''}>Edit Values</button>`;
    }
    
    if (hasCustomValues && !isEditMode) {
        controlsHTML += `
            <div class="value-toggle">
                <button class="${activeValueSource === 'official' ? 'active' : ''}" data-source="official">Official</button>
                <button class="${activeValueSource === 'custom' ? 'active' : ''}" data-source="custom">Custom</button>
            </div>
        `;
    }
    controlsContainer.innerHTML = controlsHTML;
    
    // Añade los event listeners a los nuevos botones
    addControlListeners(caseData);
}

// REEMPLAZA tu función addControlListeners con esta versión definitiva
function addControlListeners(caseData) {
    const editBtn = document.getElementById('edit-values-btn');
    const saveBtn = document.getElementById('save-values-btn');
    const toggleBtns = document.querySelectorAll('.value-toggle button');

    if (editBtn) {
        editBtn.onclick = () => {
            if (!currentUser) {
                alert('You must be logged in to edit values.');
                return;
            }
            isEditMode = true;
            renderRewardSection(caseData);
        };
    }

    if (saveBtn) {
        saveBtn.onclick = async () => {
            // CORRECCIÓN CLAVE: Buscamos los inputs solo dentro del contenedor visible.
            const inputs = document.querySelectorAll('#rewards-list-container .value-input');
            
            const newValues = {};
            inputs.forEach(input => {
                newValues[input.dataset.swordId] = parseValue(input.value);
            });

            const token = localStorage.getItem('sts-token');
            try {
                const response = await fetch('/.netlify/functions/custom-values-manager', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        // Usamos el caseId del estado global, que es el correcto.
                        caseId: appState.currentCaseIdForCalc, 
                        caseName: caseData.name,
                        customValues: newValues
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to save values.');
                }

                customCaseValues = newValues;
                isEditMode = false;
                activeValueSource = 'custom';
                renderRewardSection(caseData);

            } catch (error) {
                console.error("Save values error:", error);
                alert(`Error: ${error.message}`);
            }
        };
    }

    toggleBtns.forEach(btn => {
        btn.onclick = () => {
            activeValueSource = btn.dataset.source;
            renderRewardSection(caseData);
        };
    });
}

// --- LÓGICA DE NEGOCIO (TÍTULOS, SORTEOS, ADMIN) ---

async function loadAndRenderTitles() {
  const token = localStorage.getItem('sts-token');
  if (!token) {
    // ... (código de no-logueado)
    return;
  }
  try {
    const response = await fetch('/.netlify/functions/get-titles', { headers: { 'Authorization': `Bearer ${token}` } });
    if (!response.ok) throw new Error('Failed to fetch titles');
    const titlesData = await response.json();
    
    // CORRECCIÓN: Si no hay ningún título seleccionado, seleccionamos el equipado o el primero desbloqueado.
    if (!selectedTitleKey) {
      const defaultSelected = titlesData.find(t => t.equipped) || titlesData.find(t => t.unlocked);
      if (defaultSelected) {
        selectedTitleKey = defaultSelected.key;
      }
    }
    
    // Le pasamos la función que manejará la selección.
    UI.renderTitlesPage(titlesData, selectedTitleKey, handleTitleSelection, handleTitleEquip);
  } catch (e) {
    console.error("Error loading titles:", e);
  }
}

// CORRECCIÓN: Esta es la función clave que faltaba.
// Se ejecuta al hacer clic en un título de la lista.
function handleTitleSelection(newKey) {
  selectedTitleKey = newKey; // 1. Actualiza el estado
  loadAndRenderTitles();      // 2. Vuelve a renderizar la página con el nuevo estado
}


async function handleTitleEquip(newTitleKey) {
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
        loadAndRenderTitles();
    } catch (e) {
        console.error("Error updating title:", e);
        alert(`Error: ${e.message}`);
    }
}

async function handleGrantTitle(targetUsername, titleKey) {
    const token = localStorage.getItem('sts-token');
    const feedbackEl = document.getElementById('admin-feedback');
    const btn = document.querySelector('#grant-title-form button');
    feedbackEl.style.display = 'none';
    btn.disabled = true;
    btn.textContent = 'Granting...';

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
    } catch (e) {
        feedbackEl.className = 'feedback-message error';
        feedbackEl.textContent = `Error: ${e.message}`;
    } finally {
        feedbackEl.style.display = 'block';
        btn.disabled = false;
        btn.textContent = 'Grant Title';
    }
}


// --- LÓGICA DE SORTEOS ---

async function fetchGiveaways() {
    try {
        const response = await fetch('/.netlify/functions/giveaways-manager');
        if (!response.ok) throw new Error('Failed to fetch giveaways');
        const data = await response.json();
        appDataCache.giveaways = data.giveaways;
        appDataCache.recentWinners = data.recentWinners;
        
        if (document.getElementById('giveaways-view').style.display === 'block') {
            UI.renderGiveawayPage(appDataCache.giveaways, appDataCache.recentWinners, currentUser, handleJoinGiveaway, openCreateGiveawayModal);
        }
    } catch (error) {
        console.error("Error fetching giveaways:", error);
    }
}

function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        document.querySelectorAll('[data-endtime]').forEach(el => {
            const endTime = new Date(el.dataset.endtime).getTime();
            const now = new Date().getTime();
            const distance = endTime - now;
            if (distance < 0) {
                if (el.textContent !== "Giveaway Ended") {
                    el.textContent = "Giveaway Ended";
                    fetchGiveaways();
                }
                return;
            }
            const d = Math.floor(distance / (1000 * 60 * 60 * 24));
            const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((distance % (1000 * 60)) / 1000);
            el.innerHTML = `<strong>${d}d ${h}h ${m}m ${s}s</strong>`;
        });
    }, 1000);
}

async function handleJoinGiveaway(giveawayId) {
    const token = localStorage.getItem('sts-token');
    if (!token) { alert("You must be logged in to join a giveaway."); return; }

    const btn = document.getElementById('join-giveaway-btn');
    btn.disabled = true;
    btn.textContent = 'Joining...';

    try {
        const response = await fetch('/.netlify/functions/giveaways-manager', {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ giveawayId })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message);
        btn.textContent = 'Successfully Joined!';
        await fetchGiveaways();
    } catch(e) {
        alert(`Error: ${e.message}`);
        btn.disabled = false;
        btn.textContent = 'Join Giveaway';
    }
}

let prizePool = [];
function openCreateGiveawayModal() {
    prizePool = [];
    renderPrizePoolInModal();
    UI.openGiveawayModal();
}

function renderPrizePoolInModal() {
    const list = document.getElementById('added-prizes-list');
    list.innerHTML = prizePool.map((prize, index) => {
        return `<div class="added-prize-item">
            <span>${getPrizeItemHtml(prize)}</span>
            <button type="button" class="remove-prize-btn" data-index="${index}">×</button>
        </div>`;
    }).join('');
}

async function handleCreateGiveaway(event) {
    event.preventDefault();
    if (prizePool.length === 0) { alert("The prize pool cannot be empty."); return; }
    const token = localStorage.getItem('sts-token');
    const form = event.target;
    const btn = form.querySelector('button[type="submit"]');
    const feedbackEl = document.getElementById('giveaway-feedback');

    btn.disabled = true;
    btn.textContent = 'Creating...';
    feedbackEl.style.display = 'none';

    try {
        const body = {
            prize_pool: prizePool,
            start_time: new Date(form.start_time.value).toISOString(),
            end_time: new Date(form.end_time.value).toISOString(),
        };
        const response = await fetch('/.netlify/functions/giveaways-manager', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message);
        
        feedbackEl.className = 'feedback-message success';
        feedbackEl.textContent = 'Giveaway created successfully!';
        form.reset();
        prizePool = [];
        await fetchGiveaways();
        setTimeout(UI.closeGiveawayModal, 1500);
    } catch (e) {
        feedbackEl.className = 'feedback-message error';
        feedbackEl.textContent = `Error: ${e.message}`;
    } finally {
        feedbackEl.style.display = 'block';
        btn.disabled = false;
        btn.textContent = 'Create Giveaway';
    }
}

function setupGiveawayModal() {
    const prizeTypeSelect = document.getElementById('prize-type');
    const prizeIdContainer = document.getElementById('prize-id-container');
    const prizeAmountInput = document.getElementById('prize-amount');
    const allSwords = [...Object.values(appData.cases).flatMap(c => c.rewards), ...appData.otherSwords];

    const updatePrizeIdField = () => {
        if (prizeTypeSelect.value === 'currency') {
            prizeIdContainer.innerHTML = `<select id="prize-id">
                ${Object.keys(appData.currencies).filter(c => c !== 'cooldown')
                .map(c => `<option value="${c}">${appData.currencies[c].name}</option>`).join('')}
            </select>`;
        } else {
            prizeIdContainer.innerHTML = `
                <div style="position: relative;">
                    <input type="text" id="prize-id-search" placeholder="Search for a sword..." autocomplete="off">
                    <input type="hidden" id="prize-id">
                    <div id="prize-search-results-modal" style="position: absolute; background: var(--panel-bg); border: 1px solid var(--border-color); z-index: 1002; width: 100%; display: none;"></div>
                </div>`;
            
            const searchInput = document.getElementById('prize-id-search');
            const hiddenInput = document.getElementById('prize-id');
            const resultsContainer = document.getElementById('prize-search-results-modal');
            
            searchInput.addEventListener('input', () => {
                const query = searchInput.value.toLowerCase();
                if (!query) { resultsContainer.style.display = 'none'; return; }
                const filtered = allSwords.filter(s => s.name.toLowerCase().includes(query)).slice(0, 5);
                resultsContainer.innerHTML = filtered.map(s => `<div data-id="${s.id}" data-name="${s.name}" style="padding: 10px; cursor: pointer;">${s.name}</div>`).join('');
                resultsContainer.style.display = 'block';
            });
            resultsContainer.addEventListener('click', (e) => {
                if (e.target.dataset.id) {
                    searchInput.value = e.target.dataset.name;
                    hiddenInput.value = e.target.dataset.id;
                    resultsContainer.style.display = 'none';
                }
            });
        }
    };
    prizeTypeSelect.addEventListener('change', updatePrizeIdField);
    updatePrizeIdField();

    document.getElementById('add-prize-btn').addEventListener('click', () => {
        const type = prizeTypeSelect.value;
        const id = document.getElementById('prize-id').value;
        const amount = parseInt(prizeAmountInput.value, 10);
        if (!id || isNaN(amount) || amount < 1) { alert("Please select a valid item and amount."); return; }
        prizePool.push({ type, id, amount });
        renderPrizePoolInModal();
        prizeAmountInput.value = 1;
        if(type === 'sword') {
            document.getElementById('prize-id-search').value = '';
            document.getElementById('prize-id').value = '';
        }
    });

    document.getElementById('added-prizes-list').addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-prize-btn')) {
            prizePool.splice(parseInt(e.target.dataset.index, 10), 1);
            renderPrizePoolInModal();
        }
    });
}


// --- INICIALIZACIÓN DE COMPONENTES DE UI ---

function initializeTopUI() {
    const currencySelectors = [
        document.getElementById('converter-from-wrapper'),
        document.getElementById('converter-to-wrapper')
    ];
    const currencies = Object.keys(appData.currencies).filter(c => c !== 'cooldown');

    function setCurrency(wrapperId, key) {
        const currency = appData.currencies[key];
        const nameEl = document.getElementById(`${wrapperId}-name`);
        const iconEl = document.getElementById(`${wrapperId}-icon`);
        nameEl.textContent = currency.name;
        nameEl.dataset.currencyKey = key;
        iconEl.src = currency.icon || '';
        iconEl.style.display = currency.icon ? 'block' : 'none';
        updateConverter();
    }

    function updateConverter() {
        const fromValue = parseFloat(UI.dom.inputs.converterFrom.value); // FIX: Use UI.dom.inputs
        if (isNaN(fromValue) || fromValue <= 0) { UI.dom.inputs.converterTo.value = ''; return; }
        const fromKey = document.getElementById('converter-from-name').dataset.currencyKey;
        const toKey = document.getElementById('converter-to-name').dataset.currencyKey;
        const timeValue = fromValue * getUnitValue(fromKey, fromValue);
        const result = convertTimeValueToCurrency(timeValue, toKey);
        UI.dom.inputs.converterTo.value = result > 0 ? formatLargeNumber(result) : 'N/A';
    }

    UI.dom.inputs.converterFrom.addEventListener('input', updateConverter); // FIX: Use UI.dom.inputs

    currencySelectors.forEach(wrapper => {
        wrapper.addEventListener('click', (e) => {
            if (e.target.tagName === 'INPUT') return;
            const wrapperId = wrapper.id.replace('-wrapper', '');
            const currentKey = document.getElementById(`${wrapperId}-name`).dataset.currencyKey;
            const currentIndex = currencies.indexOf(currentKey);
            const nextIndex = (currentIndex + 1) % currencies.length;
            setCurrency(wrapperId, currencies[nextIndex]);
        });
    });

    setCurrency('converter-from', 'time');
    setCurrency('converter-to', 'diamonds');

    const allSwords = [...Object.values(appData.cases).flatMap(c=>c.rewards), ...appData.otherSwords];
  UI.dom.inputs.searchBar.addEventListener("input", () => {
    const query = UI.dom.inputs.searchBar.value.toLowerCase().trim();
    if (!query) {
      UI.dom.containers.searchResults.style.display = 'none';
      return;
    }
    const results = allSwords.filter(s => s.name.toLowerCase().includes(query)).slice(0, 10);
    UI.dom.containers.searchResults.innerHTML = '';

    if (results.length > 0) {
      results.forEach(sword => {
        const source = findSwordById(sword.id)?.source || { type: 'other' };
        
        // MODIFICACIÓN CLAVE:
        // Llamamos a la función de ui.js y le pasamos 'true' como
        // último argumento para indicarle que queremos la vista simple.
        const item = UI.createRewardItem(sword, source, navigateToSubView, true);
        
        // El resto de la lógica para el clic
        item.addEventListener('click', () => {
          navigateToSubView("swordDetails", { sword, source });
          UI.dom.inputs.searchBar.value = '';
          UI.dom.containers.searchResults.style.display = 'none';
        });
        UI.dom.containers.searchResults.appendChild(item);
      });
      UI.dom.containers.searchResults.style.display = 'block';
    } else {
      UI.dom.containers.searchResults.style.display = 'none';
    }
  });

    document.addEventListener('click', (e) => {
        if (!document.getElementById('search-module').contains(e.target)) {
            UI.dom.containers.searchResults.style.display = 'none';
        }
    });
}

// REEMPLAZA tu función initializeCalculator con esta versión
function initializeCalculator() {
  const modeButtons = {
    theoretical: UI.dom.buttons.modeTheoretical,
    simulate: UI.dom.buttons.modeSimulate,
    untilBest: UI.dom.buttons.modeUntilBest,
    graph: UI.dom.buttons.modeGraph,
  };

  const updateCalculatorUI = () => {
    for (const mode in modeButtons) {
      if (mode === appState.calculatorMode) {
        modeButtons[mode].classList.add('active');
      } else {
        modeButtons[mode].classList.remove('active');
      }
    }
    UI.clearCalculator(appState);
  };

  for (const mode in modeButtons) {
    modeButtons[mode].addEventListener('click', () => {
      appState.calculatorMode = mode;
      updateCalculatorUI();
    });
  }

 // REEMPLAZA TU FUNCIÓN handleCalculate (dentro de initializeCalculator) CON ESTA VERSIÓN
const handleCalculate = () => {
    const quantity = parseInt(UI.dom.inputs.caseQuantity.value, 10);
    const caseId = appState.currentCaseIdForCalc;
    const step = parseInt(UI.dom.inputs.graphStep.value, 10);
    const max = parseInt(UI.dom.inputs.graphMax.value, 10);
    
    if (!caseId || !appData.cases[caseId]) {
      UI.dom.containers.resultsTable.innerHTML = `<p class="error-message" style="display:block;">Please select a case first.</p>`;
      return;
    }

    // =====================================================================
    // LÓGICA CLAVE: PREPARA LOS DATOS PARA EL CÁLCULO
    // =====================================================================
    const originalCaseData = appData.cases[caseId];
    const hasCustomValues = Object.keys(customCaseValues).length > 0;
    
    // 1. Decide qué fuente de valores usar (oficial o personalizada)
    const rewardsForCalc = (activeValueSource === 'custom' && hasCustomValues)
        ? originalCaseData.rewards.map(r => ({ ...r, value: customCaseValues[r.id] !== undefined ? customCaseValues[r.id] : r.value }))
        : originalCaseData.rewards;
    
    // 2. Crea un objeto de datos de la caja temporal con los valores correctos
    const caseDataForCalc = { ...originalCaseData, rewards: rewardsForCalc };
    // =====================================================================

    // 3. Llama a las funciones de cálculo pasándoles el objeto de datos completo
    switch (appState.calculatorMode) {
      case 'theoretical':
        if (isNaN(quantity) || quantity <= 0) return;
        Calculator.runTheoreticalCalculation(quantity, caseDataForCalc, appState);
        break;
      case 'simulate':
        if (isNaN(quantity) || quantity <= 0) return;
        Calculator.runRealisticSimulation(quantity, caseDataForCalc, appState);
        break;
      case 'untilBest':
        Calculator.runUntilBestSimulation(caseDataForCalc, appState);
        break;
      case 'graph':
        if (isNaN(step) || isNaN(max) || step <= 0 || max <= 0 || step > max) return;
        Calculator.runGraphSimulation(step, max, caseDataForCalc);
        break;
    }
};
  
  UI.dom.buttons.calculate.addEventListener('click', handleCalculate);
  UI.dom.buttons.calculateGraph.addEventListener('click', handleCalculate);

  updateCalculatorUI();
}
// --- INICIALIZACIÓN DE LA APP ---

function onLoginSuccess(loggedInUser) {
    currentUser = loggedInUser;
    const currentViewKey = Object.keys(UI.dom.views).find(key => UI.dom.views[key] && UI.dom.views[key].style.display === 'block') || 'cases';
    navigateToView(currentViewKey);
}

function initializeApp() {
    initializeAuth(onLoginSuccess);
    initializeTopUI();
    initializeCalculator();
    
    fetchGiveaways();
    giveawayUpdateInterval = setInterval(fetchGiveaways, 30000);
    startTimer();

    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            if (e.target.classList.contains('disabled')) return;
            e.preventDefault();
            navigateToView(e.target.dataset.view);
            document.getElementById('main-nav-dropdown').classList.remove('visible');
            document.getElementById('hamburger-menu').classList.remove('open');
        });
    });

    UI.dom.buttons.backToCases.addEventListener('click', () => navigateToSubView('cases'));
    UI.dom.buttons.backToSwordList.addEventListener('click', () => {
        if (navigationContext && navigationContext.view === 'caseDetails') {
            navigateToSubView('caseDetails', navigationContext.id);
        } else {
            navigateToView('cases');
        }
    });
    
    UI.dom.buttons.prevPage.addEventListener('click', () => {
        if (appState.currentPage > 1) {
            appState.currentPage--;
            UI.renderOtherSwords(appState, navigateToSubView);
        }
    });
    UI.dom.buttons.nextPage.addEventListener('click', () => {
        const totalPages = Math.ceil(appData.otherSwords.length / appState.itemsPerPage);
        if (appState.currentPage < totalPages) {
            appState.currentPage++;
            UI.renderOtherSwords(appState, navigateToSubView);
        }
    });

    setupGiveawayModal();
    UI.dom.modals.closeGiveaway.addEventListener('click', UI.closeGiveawayModal);
    UI.dom.modals.createGiveaway.addEventListener('click', (e) => {
        if (e.target === UI.dom.modals.createGiveaway) UI.closeGiveawayModal();
    });
    document.getElementById('giveaway-creation-form').addEventListener('submit', handleCreateGiveaway);
    
    UI.renderCaseSelection(navigateToSubView);
    UI.renderOtherSwords(appState, navigateToSubView);
    navigateToView('cases');

    console.log("STS Values App Initialized!");
}

document.addEventListener('DOMContentLoaded', initializeApp);