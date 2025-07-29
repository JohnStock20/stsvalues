/*
=======================================================================
============ */
/* === ARCHIVO: main.js (NUEVO CEREBRO DE LA APLICACIÓN) === */
/*
=======================================================================
============ */

// --- MÓDULOS ---
import { appData, parseValue, currencyTiers } from './data.js';
import { findSwordById, getUnitValue, convertTimeValueToCurrency, formatLargeNumber } from './utils.js';
import * as UI from './ui.js';
import * as Calculator from './calculator.js';
import { initializeAuth } from './auth.js';

// --- ESTADO GLOBAL DE LA APLICACIÓN ---
let currentUser = null;
let activeGiveaways = [];
let giveawayParticipants = []; // Se podría llenar desde una API en el futuro
let timerInterval = null;

const appState = {
    currentPage: 1,
    itemsPerPage: 10,
    currentCaseIdForCalc: null,
    calculatorMode: 'theoretical',
    currentTitleSelection: null,
};

const MAX_GRAPH_SECTIONS = 50;


// --- GESTIÓN DE VISTAS ---
async function navigateToView(viewName) {
    UI.showView(viewName);

    if (viewName === 'titles') {
        if (!currentUser) {
            UI.containers.titlesList.innerHTML = '<p>You must be logged in to view your titles.</p>';
            UI.containers.titleDetailsPanel.innerHTML = '';
            return;
        }
        await loadAndRenderTitles();
    } else if (viewName === 'giveaways') {
        // La obtención de datos ya se hace periódicamente, aquí solo renderizamos
        UI.renderMainGiveawayPage(activeGiveaways, currentUser, handleJoinGiveaway, handleCreateGiveaway, showGiveawayCreationModal);
        UI.renderGiveawayParticipants(giveawayParticipants);
        startTimer(); // Asegurarse de que el timer esté corriendo
    } else if (viewName === 'devtools') {
        if (currentUser && currentUser.role === 'owner') {
           // UI.renderAdminTools(handleGrantTitle); // Implementación futura
        } else {
            const devtoolsView = document.getElementById('devtools-view');
            devtoolsView.innerHTML = `<h2 class="section-title">ACCESS DENIED</h2><p>You do not have permission to view this page.</p>`;
        }
    }
}

function navigateToSubView(view, data) {
    switch (view) {
        case 'caseDetails':
            appState.currentCaseIdForCalc = data;
            UI.renderCaseDetails(data, navigateToSubView);
            break;
        case 'swordDetails':
            let swordUpdateInterval = null;
            const onNewInterval = (intervalId) => {
                if(swordUpdateInterval) clearInterval(swordUpdateInterval);
                swordUpdateInterval = intervalId;
            };
            UI.renderSwordDetails(data.sword, data.source, navigateToSubView, onNewInterval);
            break;
        case 'selection':
        default:
            UI.showView('main');
            break;
    }
}


// --- LÓGICA DE NEGOCIO ---

// TÍTULOS
async function loadAndRenderTitles() {
    console.log("Fetching user titles...");
    try {
        // Aquí iría la llamada fetch real
        const titlesData = [ // Datos simulados
            { key: 'player', text: 'Player', unlocked: true, equipped: false },
            { key: 'member', text: 'Member', unlocked: true, equipped: false },
            { key: 'gamedeveloper', text: 'Game Developer', unlocked: false, equipped: false },
            { key: '100t', text: '+100T Value', unlocked: false, equipped: false },
            { key: '250t', text: '+250T Time', unlocked: false, equipped: false },
            { key: 'tester', text: 'Tester', unlocked: true, equipped: true },
            { key: 'owner', text: 'Owner', unlocked: false, equipped: false },
        ];
        UI.renderTitlesPage(titlesData, handleTitleSelection, handleEquipTitle);
    } catch (e) {
        console.error("Error loading titles:", e);
        UI.containers.titlesList.innerHTML = `<p class="error-message">Error loading titles.</p>`;
    }
}

function handleTitleSelection(titleKey) {
    appState.currentTitleSelection = titleKey;
    console.log(`Title selected: ${titleKey}`);
}

async function handleEquipTitle(newTitleKey) {
    console.log(`Equipping title: ${newTitleKey}`);
    alert(`Title "${newTitleKey}" equipped! (Simulation)`);
    await loadAndRenderTitles();
}


// SORTEOS (GIVEAWAYS)
async function fetchGiveaways() {
    try {
        console.log("Fetching giveaways...");
        // Datos simulados
         activeGiveaways = [
             { id: 'gw1', status: 'active', end_time: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), prize_details: [{type: 'sword', id: 'excalibur', amount: 1}, {type: 'currency', id: 'diamonds', amount: 50000}], participants: ['user1', 'user2'] },
             { id: 'gw2', status: 'upcoming', start_time: new Date(Date.now() + 1000 * 60 * 60 * 25).toISOString(), prize_details: [{type: 'sword', id: 'claustrophobia', amount: 5}] },
         ];
        
        if (document.getElementById('giveaways-view').style.display === 'block') {
            UI.renderMainGiveawayPage(activeGiveaways, currentUser, handleJoinGiveaway, handleCreateGiveaway, showGiveawayCreationModal);
            UI.renderGiveawayParticipants(giveawayParticipants);
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
                el.innerHTML = "<strong>Giveaway Ended</strong>";
                return;
            }
            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            el.innerHTML = `Time Left: <strong>${days}d ${hours}h ${minutes}m ${seconds}s</strong>`;
        });
    }, 1000);
}

async function handleJoinGiveaway(giveawayId) {
    if (!currentUser) {
        alert("You must be logged in to join a giveaway.");
        return;
    }
    console.log(`Joining giveaway ${giveawayId}...`);
    alert("Successfully joined giveaway! (Simulation)");
    await fetchGiveaways();
}

async function handleCreateGiveaway(event) {
    event.preventDefault();
    console.log("Creating giveaway...");
    alert("Giveaway created successfully! (Simulation)");
    UI.hideModals();
    await fetchGiveaways();
}

function showGiveawayCreationModal() {
    UI.renderGiveawayCreationForm(handleCreateGiveaway);
    UI.showModal(UI.modals.giveawayCreation);
}


// --- INICIALIZACIÓN DE MÓDULOS ---
function initializeTopUI() {
    const allSwords = [...Object.values(appData.cases).flatMap(c => c.rewards), ...appData.otherSwords];
    const searchResultsContainer = document.getElementById("search-results");

    UI.inputs.searchBar.addEventListener("input", () => {
        const query = UI.inputs.searchBar.value.toLowerCase().trim();
        if (!query) {
            searchResultsContainer.style.display = "none";
            return;
        }
        const filtered = allSwords.filter(s => s.name.toLowerCase().includes(query)).slice(0, 10);
        searchResultsContainer.innerHTML = "";
        if (filtered.length > 0) {
            filtered.forEach(sword => {
                const source = findSwordById(sword.id)?.source || { type: "other" };
                const itemDiv = document.createElement("div");
                itemDiv.className = `reward-item ${sword.rarity}`;
                itemDiv.innerHTML = UI.createRewardItemHTML(sword, source);
                itemDiv.addEventListener("click", () => {
                    navigateToSubView("swordDetails", { sword: sword, source: source });
                    UI.inputs.searchBar.value = "";
                    searchResultsContainer.style.display = "none";
                });
                searchResultsContainer.appendChild(itemDiv);
            });
            searchResultsContainer.style.display = "block";
        } else {
            searchResultsContainer.style.display = "none";
        }
    });

    document.addEventListener("click", e => {
        if (!document.getElementById("search-module").contains(e.target)) {
            searchResultsContainer.style.display = "none";
        }
    });

    const currencies = Object.keys(appData.currencies);
    function setCurrency(direction, key) {
        const currency = appData.currencies[key];
        const nameEl = document.getElementById(`converter-${direction}-name`);
        const iconEl = document.getElementById(`converter-${direction}-icon`);
        nameEl.textContent = currency.name;
        nameEl.dataset.currencyKey = key;
        if (currency.icon) {
            iconEl.src = currency.icon;
            iconEl.style.display = "block";
        } else {
            iconEl.style.display = "none";
        }
    }

    function updateConversion() {
        const fromValue = parseValue(UI.inputs.converterFrom.value);
        if (isNaN(fromValue) || fromValue <= 0) {
            UI.inputs.converterTo.value = "";
            return;
        }
        const fromKey = document.getElementById("converter-from-name").dataset.currencyKey;
        const toKey = document.getElementById("converter-to-name").dataset.currencyKey;
        const timeValue = fromValue * getUnitValue(fromKey, fromValue);
        const toValue = convertTimeValueToCurrency(timeValue, toKey);

        UI.inputs.converterTo.value = toValue > 0 ? formatLargeNumber(toValue) : "N/A";
    }

    function cycleCurrency(wrapper) {
        const nameEl = wrapper.querySelector(".converter-currency-name");
        const currentKey = nameEl.dataset.currencyKey;
        const currentIndex = currencies.indexOf(currentKey);
        const nextIndex = (currentIndex + 1) % currencies.length;
        const nextKey = currencies[nextIndex];
        const direction = wrapper.id.includes("from") ? "from" : "to";
        setCurrency(direction, nextKey);
        updateConversion();
    }

    UI.inputs.converterFrom.addEventListener("input", updateConversion);
    document.getElementById("converter-from-wrapper").addEventListener("click", e => {
        if (e.target.tagName !== "INPUT") cycleCurrency(e.currentTarget);
    });
    document.getElementById("converter-to-wrapper").addEventListener("click", e => cycleCurrency(e.currentTarget));

    setCurrency("from", "time");
    setCurrency("to", "diamonds");
}

function initializeCalculator() {
    const calculateBtn = document.getElementById('calculate-btn');
    const graphBtn = document.getElementById('calculate-graph-btn');
    
    const runCalculation = () => {
        const quantity = parseInt(UI.inputs.caseQuantity.value, 10);
        const caseId = appState.currentCaseIdForCalc;
        if (!caseId || !appData.cases[caseId]) return;

        UI.containers.resultsTable.innerHTML = '';
        UI.containers.simulationLoot.style.display = 'none';

        if (appState.calculatorMode === 'untilBest') {
            Calculator.runUntilBestSimulation(caseId, appState);
        } else if (!isNaN(quantity) && quantity > 0) {
            switch(appState.calculatorMode) {
                case 'theoretical':
                    Calculator.runTheoreticalCalculation(quantity, caseId, appState);
                    break;
                case 'simulate':
                    Calculator.runRealisticSimulation(quantity, caseId, appState);
                    break;
            }
        } else {
             UI.containers.resultsTable.innerHTML = `<p class="error-message" style="display:block;">Please enter a valid number of cases.</p>`;
        }
    };

    const runGraph = () => {
        const step = parseInt(UI.inputs.graphStep.value, 10);
        const max = parseInt(UI.inputs.graphMax.value, 10);
        const caseId = appState.currentCaseIdForCalc;
        UI.containers.resultsTable.innerHTML = "";
        UI.containers.simulationLoot.style.display = "none";
        UI.containers.graph.style.display = "none";
        if (!caseId || !appData.cases[caseId] || isNaN(step) || isNaN(max) || step <= 0 || max <= 0 || max < step || max / step > MAX_GRAPH_SECTIONS) {
            UI.containers.resultsTable.innerHTML = `<p class="error-message" style="display:block;">Please enter a valid range and maximum (max ${MAX_GRAPH_SECTIONS} sections).</p>`;
            return;
        }
        Calculator.runGraphSimulation(step, max, caseId);
    };

    calculateBtn.addEventListener('click', runCalculation);
    graphBtn.addEventListener('click', runGraph);

    ["mode-theoretical-btn", "mode-simulate-btn", "mode-until-best-btn", "mode-graph-btn"].forEach(id => {
        document.getElementById(id).addEventListener("click", (e) => {
            document.querySelector(".calculator-mode-selector .active").classList.remove("active");
            e.target.classList.add("active");
            appState.calculatorMode = e.target.id.replace("mode-", "").replace("-btn", "");
            UI.clearCalculator(appState);
        });
    });
}

function onLoginSuccess(user) {
    currentUser = user;
    fetchGiveaways();
    setInterval(fetchGiveaways, 30000);
}

// --- FUNCIÓN PRINCIPAL DE INICIALIZACIÓN DE LA APP ---
function initializeApp() {
    initializeAuth(onLoginSuccess);
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
    document.getElementById('sword-to-details-btn').addEventListener('click', () => navigateToSubView('selection'));

    document.getElementById('other-prev-btn').addEventListener('click', () => {
        if (appState.currentPage > 1) {
            appState.currentPage--;
            UI.renderOtherSwords(appState, navigateToSubView);
        }
    });
    document.getElementById('other-next-btn').addEventListener('click', () => {
        const totalPages = Math.ceil(appData.otherSwords.length / appState.itemsPerPage);
        if (appState.currentPage < totalPages) {
            appState.currentPage++;
            UI.renderOtherSwords(appState, navigateToSubView);
        }
    });

    UI.renderCaseSelection(navigateToSubView);
    UI.renderOtherSwords(appState, navigateToSubView);
    navigateToView('main');

    console.log("STS Values App Initialized!");
}

document.addEventListener('DOMContentLoaded', initializeApp);