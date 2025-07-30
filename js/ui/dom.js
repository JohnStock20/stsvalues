// Archivo: js/ui/dom.js (NUEVO)
// Propósito: Centralizar todos los selectores del DOM en un único objeto para fácil acceso y mantenimiento.

export const dom = {
  // Vistas principales que se muestran/ocultan
  views: {
    cases: document.getElementById('cases-view'),
    caseDetails: document.getElementById('case-details-view'),
    swordDetails: document.getElementById('sword-details-view'),
    titles: document.getElementById('titles-view'),
    giveaways: document.getElementById('giveaways-view'),
    devtools: document.getElementById('devtools-view'),
  },
  // Contenedores donde se inyecta contenido dinámico
  containers: {
    // Página principal
    cases: document.querySelector('#cases-view .cases-container'),
    otherSwords: document.getElementById('other-swords-container'),
    
    // Detalles de Cajas y Espadas
    rewards: document.getElementById('rewards-list-container'),
    
    // Títulos
    titlesList: document.getElementById('titles-list-container'),
    titleDetails: document.getElementById('title-details-view'),
    
    // Sorteos
    activeGiveaway: document.getElementById('active-giveaway-container'),
    upcomingGiveaways: document.getElementById('upcoming-giveaways-container'),
    participantsList: document.getElementById('giveaway-participants-list'),
    winnersList: document.getElementById('giveaway-winners-list'),
    hostGiveawayBtn: document.getElementById('host-giveaway-btn-container'),
    
    // Herramientas de Admin
    adminTools: document.getElementById('devtools-view'), // El contenido de devtools se renderiza aquí
    
    // Búsqueda
    searchResults: document.getElementById('search-results'),
    
    // Calculadora
    resultsTable: document.getElementById('results-table-container'),
    simulationLoot: document.getElementById('simulation-loot-summary'),
    graph: document.getElementById('graph-container'),
    graphPlotArea: document.getElementById('graph-plot-area'),
    graphLabels: document.getElementById('graph-labels'),
    graphSvg: document.querySelector('#graph-plot-area svg'),
  },
  // Botones de acción
  buttons: {
    // Navegación
    backToCases: document.getElementById('details-to-cases-btn'),
    backToSwordList: document.getElementById('details-to-sword-list-btn'),
    prevPage: document.getElementById('other-prev-btn'),
    nextPage: document.getElementById('other-next-btn'),

    // Calculadora
    calculate: document.getElementById('calculate-btn'),
    calculateGraph: document.getElementById('calculate-graph-btn'),
    modeTheoretical: document.getElementById('mode-theoretical-btn'),
    modeSimulate: document.getElementById('mode-simulate-btn'),
    modeUntilBest: document.getElementById('mode-until-best-btn'),
    modeGraph: document.getElementById('mode-graph-btn'),
  },
  // Campos de entrada de datos
  inputs: {
    converterFrom: document.getElementById('converter-from-input'),
    converterTo: document.getElementById('converter-to-input'),
    searchBar: document.getElementById('search-bar'),
    caseQuantity: document.getElementById('case-quantity-input'),
    graphStep: document.getElementById('graph-step-input'),
    graphMax: document.getElementById('graph-max-input'),
  },
  // Elementos de Modales
  modals: {
    authOverlay: document.getElementById('auth-modal-overlay'),
    login: document.getElementById('login-modal'),
    registerStep1: document.getElementById('register-modal-step1'),
    registerStep2: document.getElementById('register-modal-step2'),
    createGiveaway: document.getElementById('create-giveaway-modal-overlay'),
    closeGiveaway: document.querySelector('#create-giveaway-modal .close-modal-btn'),
  },
  // Grupos de controles específicos
  controls: {
    standardCalculator: document.getElementById('standard-controls'),
    graphCalculator: document.getElementById('graph-controls'),
  },
  // Otros elementos importantes
  header: {
    loginNavBtn: document.getElementById('login-nav-btn'),
    userProfileNav: document.getElementById('user-profile-nav'),
    userName: document.getElementById('user-name'),
    userAvatar: document.getElementById('user-avatar'),
    userTitle: document.getElementById('user-title'),
    hamburgerMenu: document.getElementById('hamburger-menu'),
    mainNavDropdown: document.getElementById('main-nav-dropdown'),
    devToolsLink: document.getElementById('dev-tools-link'),
    logoutBtn: document.getElementById('logout-btn'),
  }
};