// =================================================================================
// ARCHIVO: main.js (NUEVO CEREBRO DE LA APLICACIÓN) - VERSIÓN CORREGIDA
// =================================================================================

// --- MÓDulos ---
import { appData, parseValue } from './data.js';
import { findSwordById, getPrizeItemHtml } from './utils.js';
import * as UI from './ui.js';
import { initializeAuth, titleStyles } from './auth.js';

// --- ESTADO GLOBAL DE LA APLICACIÓN ---
let currentUser = null;
let navigationContext = { view: 'cases', id: null, type: null }; // Rastrea la vista anterior para los botones "Back"
let activeGiveaways = [];
let giveawayUpdateInterval = null;
let timerInterval = null;
let selectedTitleKey = null; // Para la página de títulos

const appState = {
    currentPage: 1,
    itemsPerPage: 10,
    // FIX: Inicializamos el estado de la vista actual para evitar errores
    currentNavigationView: { view: 'cases', id: null, type: 'cases' }
};

// --- GESTIÓN DE VISTAS Y NAVEGACIÓN ---

function navigateToView(viewName) {
    UI.showView(viewName);
    appState.currentNavigationView = { view: viewName, id: null, type: viewName };

    if (viewName === 'titles') {
        loadAndRenderTitles();
    } else if (viewName === 'giveaways') {
        UI.renderGiveawayPage(activeGiveaways, currentUser, handleJoinGiveaway, openCreateGiveawayModal);
    } else if (viewName === 'devtools') {
        if (currentUser && currentUser.role === 'owner') {
            UI.renderAdminTools(handleGrantTitle);
        } else {
            document.getElementById('devtools-view').innerHTML = `<h2 class="section-title">ACCESS DENIED</h2><p>You do not have permission to view this page.</p>`;
        }
    }
}

function navigateToSubView(view, data) {
    if (window.swordUpdateInterval) clearInterval(window.swordUpdateInterval);

    // FIX: Guardamos el contexto de la vista *actual* ANTES de navegar a la nueva.
    navigationContext = { ...appState.currentNavigationView };
    
    // Actualizamos la vista actual en el estado global
    appState.currentNavigationView = { view, id: data, type: view === 'caseDetails' ? 'case' : 'sword' };

    switch (view) {
        case 'caseDetails':
            UI.renderCaseDetails(data, navigateToSubView);
            break;
        case 'swordDetails':
            UI.renderSwordDetails(data.sword, data.source, navigateToSubView, (intervalId) => {
                window.swordUpdateInterval = intervalId;
            });
            break;
        case 'cases':
        default:
            navigationContext = { view: 'cases', id: null, type: 'cases' };
            UI.showView('cases');
            break;
    }
}


// --- LÓGICA DE NEGOCIO (TÍTULOS, SORTEOS, ADMIN) ---

async function loadAndRenderTitles() {
    const token = localStorage.getItem('sts-token');
    if (!token) {
        document.getElementById('titles-view').innerHTML = `<p>You must be logged in to view your titles.</p>`;
        return;
    }
    try {
        const response = await fetch('/.netlify/functions/get-titles', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch titles');
        const titlesData = await response.json();
        
        const defaultSelected = titlesData.find(t => t.equipped) || titlesData.find(t => t.unlocked);
        selectedTitleKey = defaultSelected ? defaultSelected.key : null;

        UI.renderTitlesPage(titlesData, selectedTitleKey, handleTitleSelection, handleTitleEquip);

    } catch (e) {
        console.error("Error loading titles:", e);
        UI.dom.containers.titlesList.innerHTML = `<p class="error-message" style="display:block;">Could not load titles.</p>`;
    }
}

function handleTitleSelection(newKey) {
    selectedTitleKey = newKey;
    // La UI se actualiza sin necesidad de volver a llamar a la API
    loadAndRenderTitles();
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
        
        // Llamada a la función específica de auth para actualizar solo el header
        initializeAuth(onLoginSuccess);
        // Volver a cargar los títulos para mostrar el estado "Equipped"
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
        if (!response.ok) return; // No hacer nada si falla la petición
        activeGiveaways = await response.json();
        
        if (document.getElementById('giveaways-view').style.display === 'block') {
            UI.renderGiveawayPage(activeGiveaways, currentUser, handleJoinGiveaway, openCreateGiveawayModal);
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
                    fetchGiveaways(); // Actualiza la lista cuando un sorteo termina
                }
                return;
            }
            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            el.innerHTML = `<strong>${days}d ${hours}h ${minutes}m ${seconds}s</strong>`;
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
        await fetchGiveaways(); // Refrescar datos
    } catch(e) {
        alert(`Error: ${e.message}`);
        btn.disabled = false;
        btn.textContent = 'Join Giveaway';
    }
}

// Lógica del modal de creación
let prizePool = [];
function openCreateGiveawayModal() {
    prizePool = []; // Resetea el prize pool
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

function setupGiveawayModal() {
    const prizeTypeSelect = document.getElementById('prize-type');
    const prizeIdContainer = document.getElementById('prize-id-container');
    const prizeAmountInput = document.getElementById('prize-amount');
    
    const allSwords = [...Object.values(appData.cases).flatMap(c => c.rewards), ...appData.otherSwords];

    const updatePrizeIdField = () => {
        if (prizeTypeSelect.value === 'currency') {
            prizeIdContainer.innerHTML = `<select id="prize-id">
                ${Object.keys(appData.currencies).filter(c => c !== 'time' && c !== 'cooldown')
                .map(c => `<option value="${c}">${appData.currencies[c].name}</option>`).join('')}
            </select>`;
        } else { // sword
            prizeIdContainer.innerHTML = `
                <input type="text" id="prize-id-search" placeholder="Search for a sword..." autocomplete="off">
                <input type="hidden" id="prize-id">
                <div id="prize-search-results-modal" style="position: absolute; background: var(--panel-bg); border: 1px solid var(--border-color); z-index: 1002; width: 100%; display: none;"></div>`;
            
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
    updatePrizeIdField(); // Carga inicial

    document.getElementById('add-prize-btn').addEventListener('click', () => {
        const type = prizeTypeSelect.value;
        const id = document.getElementById('prize-id').value;
        const amount = parseInt(prizeAmountInput.value, 10);

        if (!id || isNaN(amount) || amount < 1) {
            alert("Please select a valid item and amount.");
            return;
        }
        prizePool.push({ type, id, amount });
        renderPrizePoolInModal();
        // Reset fields
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

async function handleCreateGiveaway(event) {
    event.preventDefault();
    if (prizePool.length === 0) {
        alert("The prize pool cannot be empty.");
        return;
    }
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


// --- INICIALIZACIÓN DE LA APP ---

function onLoginSuccess(loggedInUser) {
    currentUser = loggedInUser;
    const currentViewKey = Object.keys(UI.dom.views).find(key => UI.dom.views[key].style.display === 'block') || 'cases';
    navigateToView(currentViewKey);
}

function initializeApp() {
    initializeAuth(onLoginSuccess);
    
    fetchGiveaways();
    giveawayUpdateInterval = setInterval(fetchGiveaways, 30000); // Actualizar cada 30 segundos
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
        if (navigationContext && navigationContext.view) {
            if(navigationContext.type === 'case') {
                 navigateToSubView('caseDetails', navigationContext.id);
            } else {
                 navigateToSubView('cases');
            }
        } else {
            navigateToSubView('cases');
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