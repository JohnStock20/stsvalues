// Archivo: main.js (NUEVO CEREBRO DE LA APLICACIÓN) - VERSIÓN FINAL CORREGIDA
// Propósito: Orquestar toda la aplicación, inicializar módulos y manejar la navegación.

// LA LÍNEA SIGUIENTE ES LA CORRECCIÓN:
import { appData } from './data.js'; 
import * as State from './state.js';
import * as api from './api.js';
import * as Utils from './utils.js';
import { initializeAuth, updateProfileUI } from './auth.js';
import * as Calculator from './calculator.js';

// Importar todos los módulos de la UI
import { dom } from './ui/dom.js';
import * as UICore from './ui/core.js';
import * as UICases from './ui/cases.js';
import * as UISwords from './ui/swords.js';
import * as UICalculator from './ui/calculator.js';
import * as UIGiveaways from './ui/giveaways.js';
import * as UITitles from './ui/titles.js';
import * as UIAdmin from './ui/admin.js';

// --- GESTIÓN DE VISTAS Y NAVEGACIÓN ---

function navigateToView(viewName) {
    if (State.giveawayUpdateInterval) clearInterval(State.giveawayUpdateInterval);
    if (State.timerInterval) clearInterval(State.timerInterval);

    UICore.showView(viewName);
    State.appState.currentNavigationView = { view: viewName, id: null, type: viewName };
    State.setNavigationContext({ ...State.appState.currentNavigationView });

    switch (viewName) {
        case 'titles':
            loadAndRenderTitles();
            break;
        case 'giveaways':
            fetchGiveaways();
            State.setGiveawayUpdateInterval(setInterval(fetchGiveaways, 30000));
            State.setTimerInterval(startTimer());
            break;
        case 'devtools':
            const adminHandlers = {
                onGrantTitle: handleGrantTitle,
                onWarnUser: handleWarnUser,
                onBanUser: handleBanUser,
            };
            UIAdmin.renderAdminTools(adminHandlers);
            break;
        case 'cases':
        default:
            UICases.renderCaseSelection(navigateToSubView);
            UISwords.renderOtherSwords(State.appState, navigateToSubView);
            break;
    }
}

function navigateToSubView(view, data) {
    if (window.swordUpdateInterval) clearInterval(window.swordUpdateInterval);
    
    State.setNavigationContext({ ...State.appState.currentNavigationView });
    State.appState.currentNavigationView = { view, id: data };

    switch (view) {
        case 'caseDetails':
            State.appState.currentCaseIdForCalc = data;
            UICases.renderCaseDetails(data, navigateToSubView);
            break;
        case 'swordDetails':
            UISwords.renderSwordDetails(data.sword, data.source, navigateToSubView, (intervalId) => {
                window.swordUpdateInterval = intervalId;
            });
            break;
        case 'cases':
        default:
            navigateToView('cases');
            break;
    }
}


// --- LÓGICA DE NEGOCIO (TÍTULOS, SORTEOS, ADMIN) ---

async function loadAndRenderTitles() {
    try {
        const titlesData = await api.user.getTitles();
        const defaultSelected = titlesData.find(t => t.equipped) || titlesData.find(t => t.unlocked);
        State.setSelectedTitleKey(defaultSelected ? defaultSelected.key : null);
        UITitles.renderTitlesPage(titlesData, State.selectedTitleKey, handleTitleSelection, handleTitleEquip);
    } catch (e) {
        console.error("Error loading titles:", e);
        dom.containers.titlesList.innerHTML = `<p>You must be logged in to view your titles.</p>`;
        dom.containers.titleDetails.innerHTML = '';
    }
}

function handleTitleSelection(newKey) {
    State.setSelectedTitleKey(newKey);
    loadAndRenderTitles(); // Recargar para reflejar la selección
}

async function handleTitleEquip(newTitleKey) {
    try {
        const result = await api.user.updateProfile({ newTitle: newTitleKey });
        const user = JSON.parse(localStorage.getItem('sts-user'));
        user.equippedTitle = result.equippedTitle;
        localStorage.setItem('sts-user', JSON.stringify(user));
        State.setCurrentUser(user);
        
        updateProfileUI(user);
        loadAndRenderTitles();
    } catch (e) {
        alert(`Error: ${e.message}`);
    }
}

// Handlers para herramientas de admin
async function handleGrantTitle(username, titleKey) {
    const response = await api.admin.grantTitle(username, titleKey);
    return response.message;
}
async function handleWarnUser(username, reason) {
    const response = await api.admin.warnUser(username, reason);
    return response.message;
}
async function handleBanUser(username, reason, duration) {
    const response = await api.admin.banUser(username, reason, duration);
    return response.message;
}


// --- LÓGICA DE SORTEOS ---
async function fetchGiveaways() {
    try {
        const data = await api.giveaways.get();
        State.appDataCache.giveaways = data.giveaways;
        State.appDataCache.recentWinners = data.recentWinners;
        
        if (dom.views.giveaways.style.display === 'block') {
            UIGiveaways.renderGiveawayPage(data.giveaways, data.recentWinners, State.currentUser, handleJoinGiveaway, openCreateGiveawayModal);
        }
    } catch (error) {
        console.error("Error fetching giveaways:", error);
    }
}

function startTimer() {
    return setInterval(() => {
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
    const btn = document.getElementById('join-giveaway-btn');
    btn.disabled = true;
    btn.textContent = 'Joining...';
    try {
        await api.giveaways.join(giveawayId);
        btn.textContent = 'Successfully Joined!';
        await fetchGiveaways();
    } catch (e) {
        alert(`Error: ${e.message}`);
        btn.disabled = false;
        btn.textContent = 'Join Giveaway';
    }
}

function openCreateGiveawayModal() {
    console.log("Opening create giveaway modal...");
}


// --- INICIALIZACIÓN DE COMPONENTES DE UI ---

function initializeTopUI() {
    const allSwords = [...Object.values(appData.cases).flatMap(c => c.rewards), ...appData.otherSwords];

    dom.inputs.searchBar.addEventListener("input", () => {
        const query = dom.inputs.searchBar.value.toLowerCase().trim();
        if (!query) {
            dom.containers.searchResults.style.display = 'none';
            return;
        }
        const results = allSwords.filter(s => s.name.toLowerCase().includes(query)).slice(0, 5);
        dom.containers.searchResults.innerHTML = '';
        if (results.length > 0) {
            results.forEach(sword => {
                const source = Utils.findSwordById(sword.id)?.source || { type: 'other' };
                const item = UICore.createRewardItem(sword, source, navigateToSubView);
                dom.containers.searchResults.appendChild(item);
            });
            dom.containers.searchResults.style.display = 'block';
        } else {
            dom.containers.searchResults.style.display = 'none';
        }
    });
    
    document.addEventListener('click', (e) => {
        if (!document.getElementById('search-module').contains(e.target)) {
            dom.containers.searchResults.style.display = 'none';
        }
    });
}


// --- INICIALIZACIÓN DE LA APP ---
function onLoginSuccess(loggedInUser) {
    State.setCurrentUser(loggedInUser);
    navigateToView(State.appState.currentNavigationView.view);
}

function initializeApp() {
    initializeAuth(onLoginSuccess);
    initializeTopUI();
    UICalculator.initializeCalculatorUI(State.appState);

    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            if (e.target.classList.contains('disabled')) return;
            e.preventDefault();
            navigateToView(e.target.dataset.view);
            dom.header.mainNavDropdown.classList.remove('visible');
            dom.header.hamburgerMenu.classList.remove('open');
        });
    });

    dom.buttons.backToCases.addEventListener('click', () => navigateToSubView('cases'));
    dom.buttons.backToSwordList.addEventListener('click', () => {
        if (State.navigationContext && State.navigationContext.view === 'caseDetails') {
            navigateToSubView('caseDetails', State.navigationContext.id);
        } else {
            navigateToView('cases');
        }
    });

    dom.buttons.prevPage.addEventListener('click', () => {
        if (State.appState.currentPage > 1) {
            State.appState.currentPage--;
            UISwords.renderOtherSwords(State.appState, navigateToSubView);
        }
    });
    dom.buttons.nextPage.addEventListener('click', () => {
        const totalPages = Math.ceil(appData.otherSwords.length / State.appState.itemsPerPage);
        if (State.appState.currentPage < totalPages) {
            State.appState.currentPage++;
            UISwords.renderOtherSwords(State.appState, navigateToSubView);
        }
    });
    
    navigateToView('cases');
    console.log("STS Values App Initialized!");
}

document.addEventListener('DOMContentLoaded', initializeApp);