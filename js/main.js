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
let giveawayUpdateInterval = null;
let timerInterval = null;
let currentUser = null;
let navigationContext = { view: 'selection', id: null, type: null };
let activeGiveaways = []; // Cache para los sorteos

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
        if (!currentUser) { document.getElementById('titles-list-container').innerHTML = `<p>You must be logged in to view your titles.</p>`; return; }
        await loadAndRenderTitles();
    } else if (viewName === 'devtools') {
        if (currentUser && currentUser.role === 'owner') { UI.renderAdminTools(handleGrantTitle); }
        else { document.getElementById('devtools-view').innerHTML = `<h2 class="section-title">ACCESS DENIED</h2><p>You do not have permission to view this page.</p>`; }
    } else if (viewName === 'giveaways') {
        UI.renderMainGiveawayPage(activeGiveaways, currentUser, handleJoinGiveaway, handleCreateGiveaway);
        startTimer(); // Asegurarse de que el timer principal esté corriendo
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
    const token = localStorage.getItem('sts-token'); if (!token) return;
    try {
        const response = await fetch('/.netlify/functions/get-titles', { headers: { 'Authorization': `Bearer ${token}` } });
        if (!response.ok) throw new Error('Failed to fetch titles');
        const titlesData = await response.json();
        UI.renderTitlesPage(titlesData, handleTitleSelection);
    } catch (e) { console.error("Error loading titles:", e); }
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
    } catch (e) { console.error("Error updating title:", e); alert(`Error: ${e.message}`); }
}

async function handleGrantTitle(targetUsername, titleKey) {
    const token = localStorage.getItem('sts-token');
    const feedbackEl = document.getElementById('admin-feedback'), btn = document.querySelector('#grant-title-form button');
    feedbackEl.style.display = 'none'; btn.disabled = true; btn.textContent = 'Granting...';
    try {
        const response = await fetch('/.netlify/functions/admin-tools', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'grantTitle', targetUsername, titleKey })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message);
        feedbackEl.className = 'feedback-message success'; feedbackEl.textContent = result.message;
    } catch (e) {
        feedbackEl.className = 'feedback-message error'; feedbackEl.textContent = `Error: ${e.message}`;
    } finally {
        feedbackEl.style.display = 'block'; btn.disabled = false; btn.textContent = 'Grant Title';
    }
}

async function fetchGiveaways() {
    try {
        const response = await fetch('/.netlify/functions/giveaways-manager');
        if (!response.ok) throw new Error('Failed to fetch giveaways');
        activeGiveaways = await response.json();
        UI.renderSidebarGiveaways(activeGiveaways, []); // De momento sin participantes
        // Si estamos en la página de giveaways, la volvemos a renderizar
        if (document.getElementById('giveaways-view').style.display === 'block') {
            UI.renderMainGiveawayPage(activeGiveaways, currentUser, handleJoinGiveaway, handleCreateGiveaway);
        }
        startTimer();
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
                el.textContent = "Giveaway Ended";
                // Podríamos llamar a fetchGiveaways() aquí para actualizar al finalizar
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
    const token = localStorage.getItem('sts-token');
    if (!token) { alert("You must be logged in to join a giveaway."); return; }
    const btn = document.getElementById('join-giveaway-btn');
    btn.disabled = true; btn.textContent = 'Joining...';
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
        btn.disabled = false; btn.textContent = 'Join Giveaway';
    }
}

async function handleCreateGiveaway(event) {
    event.preventDefault();
    const token = localStorage.getItem('sts-token');
    const form = event.target;
    const btn = form.querySelector('button');
    const feedbackEl = document.getElementById('giveaway-feedback');
    btn.disabled = true; btn.textContent = 'Creating...';
    feedbackEl.style.display = 'none';

    try {
        const formData = new FormData(form);
        const prize_type = formData.get('prize_type');
        const prize_id = formData.get('prize_id');
        const prize_amount = parseInt(formData.get('prize_amount'));
        const startTimeLocal = formData.get('start_time');
        const endTimeLocal = formData.get('end_time');
        // NOTA: La conversión de zona horaria del lado del cliente es compleja.
        // Una solución robusta usaría una librería como date-fns-tz.
        // Por simplicidad, asumimos que el backend manejará la UTC.
        const start_time = new Date(startTimeLocal).toISOString();
        const end_time = new Date(endTimeLocal).toISOString();
        
        const response = await fetch('/.netlify/functions/giveaways-manager', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ prize_type, prize_id, prize_amount, start_time, end_time })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message);

        feedbackEl.className = 'feedback-message success';
        feedbackEl.textContent = result.message;
        form.reset();
        await fetchGiveaways();
    } catch (e) {
        feedbackEl.className = 'feedback-message error';
        feedbackEl.textContent = `Error: ${e.message}`;
    } finally {
        feedbackEl.style.display = 'block';
        btn.disabled = false; btn.textContent = 'Create Giveaway';
    }
}

// --- INICIALIZACIÓN DE MÓDULOS ---
function initializeTopUI() {
    const allSwords=[...Object.values(appData.cases).flatMap(c=>c.rewards),...appData.otherSwords],searchResultsContainer=document.getElementById("search-results");UI.inputs.searchBar.addEventListener("input",()=>{const e=UI.inputs.searchBar.value.toLowerCase().trim();if(!e)return void(searchResultsContainer.style.display="none");const t=allSwords.filter(t=>t.name.toLowerCase().includes(e)).slice(0,10);if(searchResultsContainer.innerHTML="",t.length>0){t.forEach(e=>{const t=findSwordById(e.id)?.source||{type:"other"},s=document.createElement("div");s.className=`reward-item ${e.rarity}`,s.innerHTML=UI.createRewardItemHTML(e,t),s.addEventListener("click",()=>{navigateToSubView("swordDetails",{sword:e,source:t}),UI.inputs.searchBar.value="",searchResultsContainer.style.display="none"}),searchResultsContainer.appendChild(s)}),searchResultsContainer.style.display="block"}else searchResultsContainer.style.display="none"}),document.addEventListener("click",e=>{document.getElementById("search-module").contains(e.target)|| (searchResultsContainer.style.display="none")});const e=Object.keys(appData.currencies);function t(t,s){const a=appData.currencies[s],i=document.getElementById(`converter-${t}-name`),n=document.getElementById(`converter-${t}-icon`);i.textContent=a.name,i.dataset.currencyKey=s,n.src=a.icon||"",n.style.display=a.icon?"block":"none"}function s(){const e=parseValue(UI.inputs.converterFrom.value);if(isNaN(e)||e<=0)return void(UI.inputs.converterTo.value="");const t=document.getElementById("converter-from-name").dataset.currencyKey,a=document.getElementById("converter-to-name").dataset.currencyKey,i=e*getUnitValue(t,e),n=convertTimeValueToCurrency(i,a);UI.inputs.converterTo.value=n>0?formatLargeNumber(n):"N/A"}function a(a){const i=a.querySelector(".converter-currency-name"),n=i.dataset.currencyKey,r=e.indexOf(n),o=(r+1)%e.length,c=e[o],d=a.id.includes("from")?"from":"to";t(d,c),s()}UI.inputs.converterFrom.addEventListener("input",s),document.getElementById("converter-from-wrapper").addEventListener("click",e=>{"INPUT"!==e.target.tagName&&a(e.currentTarget)}),document.getElementById("converter-to-wrapper").addEventListener("click",e=>a(e.currentTarget)),t("from","time"),t("to","diamonds")
}
function initializeCalculator() {
    function e(){const e=parseInt(UI.inputs.caseQuantity.value,10),t=appState.currentCaseIdForCalc;if(t&&appData.cases[t])if(UI.containers.resultsTable.innerHTML="",UI.containers.simulationLoot.style.display="none","untilBest"===appState.calculatorMode||!isNaN(e)&&e>0)switch(appState.calculatorMode){case"theoretical":Calculator.runTheoreticalCalculation(e,t,appState);break;case"simulate":Calculator.runRealisticSimulation(e,t,appState);break;case"untilBest":Calculator.runUntilBestSimulation(t,appState)}else UI.containers.resultsTable.innerHTML='<p class="error-message" style="display:block;">Please enter a valid number of cases.</p>'}function t(){const e=parseInt(UI.inputs.graphStep.value,10),t=parseInt(UI.inputs.graphMax.value,10),s=appState.currentCaseIdForCalc;UI.containers.resultsTable.innerHTML="",UI.containers.simulationLoot.style.display="none",UI.containers.graph.style.display="none",!s||!appData.cases[s]||isNaN(e)||isNaN(t)||e<=0||t<=0||t<e||t/e>MAX_GRAPH_SECTIONS?UI.containers.resultsTable.innerHTML=`<p class="error-message" style="display:block;">Please enter a valid range and maximum (max ${MAX_GRAPH_SECTIONS} sections).</p>`:Calculator.runGraphSimulation(e,t,s)}document.getElementById("calculate-btn").addEventListener("click",e),document.getElementById("calculate-graph-btn").addEventListener("click",t),["mode-theoretical-btn","mode-simulate-btn","mode-until-best-btn","mode-graph-btn"].forEach(e=>{document.getElementById(e).addEventListener("click",t=>{document.querySelector(".calculator-mode-selector .active").classList.remove("active"),t.target.classList.add("active"),appState.calculatorMode=t.target.id.replace("mode-","").replace("-btn","").replace(/-(\w)/g,(e,t)=>t.toUpperCase()),UI.clearCalculator(appState)})})
}

// --- FUNCIÓN PRINCIPAL DE INICIALIZACIÓN DE LA APP ---
function initializeApp() {
    initializeAuth((loggedInUser) => {
        currentUser = loggedInUser;
        if(loggedInUser) {
            UI.updateProfileHeader(loggedInUser);
            document.getElementById('dev-tools-link').style.display = loggedInUser.role === 'owner' ? 'block' : 'none';
        }
        // Iniciar fetching de giveaways después de saber si el usuario está logueado o no
        fetchGiveaways();
        giveawayUpdateInterval = setInterval(fetchGiveaways, 30000); // Actualizar cada 30 segundos
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

    document.getElementById('other-prev-btn').addEventListener('click', () => { if (appState.currentPage > 1) { appState.currentPage--; UI.renderOtherSwords(appState, navigateToSubView); } });
    document.getElementById('other-next-btn').addEventListener('click', () => { const t = Math.ceil(appData.otherSwords.length / appState.itemsPerPage); if (appState.currentPage < t) { appState.currentPage++; UI.renderOtherSwords(appState, navigateToSubView); } });

    UI.renderCaseSelection(navigateToSubView);
    UI.renderOtherSwords(appState, navigateToSubView);
    
    navigateToView('main');
    
    console.log("STS Values App Initialized!");
}

document.addEventListener('DOMContentLoaded', initializeApp);