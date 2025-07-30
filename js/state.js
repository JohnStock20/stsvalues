// Archivo: js/state.js (NUEVO)
// Propósito: Centraliza y gestiona todo el estado global de la aplicación.

// --- Estado de Autenticación y Sesión ---
export let currentUser = null;

// --- Estado de la Interfaz de Usuario (UI) ---

// Estado general de la aplicación, como paginación y modo de la calculadora.
export const appState = {
  currentPage: 1,       // Para la paginación de "Other Swords"
  itemsPerPage: 10,
  currentCaseIdForCalc: null,
  calculatorMode: 'theoretical',
  currentNavigationView: { view: 'cases', id: null, type: 'cases' },
};

// Contexto de navegación para saber a qué vista "volver".
export let navigationContext = { view: 'cases', id: null, type: 'cases' };

// Clave del título seleccionado en la página de Títulos.
export let selectedTitleKey = null;

// --- Caché de Datos ---
// Almacena datos del backend para no tener que pedirlos constantemente.
export const appDataCache = {
  giveaways: [],
  recentWinners: [],
  notifications: [],
};


// --- Identificadores de Intervalos ---
// Para poder limpiarlos cuando sea necesario (ej. al cambiar de vista).
export let giveawayUpdateInterval = null;
export let timerInterval = null;
export let notificationUpdateInterval = null;


// --- Funciones Modificadoras de Estado (Setters) ---
// Es una buena práctica modificar el estado a través de funciones para tener un mayor control.

export function setCurrentUser(user) {
  currentUser = user;
}

export function setNavigationContext(context) {
  navigationContext = context;
}

export function setSelectedTitleKey(key) {
  selectedTitleKey = key;
}

export function setGiveawayUpdateInterval(id) {
  giveawayUpdateInterval = id;
}

export function setTimerInterval(id) {
  timerInterval = id;
}

export function setNotificationUpdateInterval(id) {
    notificationUpdateInterval = id;
}