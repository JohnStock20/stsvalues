// Archivo: js/auth.js (REFACTORIZADO)
// Propósito: Lógica para el sistema de autenticación de usuarios (login, registro, logout).

import { dom } from './ui/dom.js';
import * as api from './api.js';
import { currentUser, setCurrentUser } from './state.js';
import { formatBanTime } from './utils.js';

// Mapeo de claves de título a los estilos CSS y texto visible.
// Lo exportamos para que otros módulos como ui.js puedan usarlo.
export const titleStyles = {
 'player': { text: 'Player', style: 'var(--title-player-color)', description: 'The standard title for all players.' },
 'member': { text: 'Member', style: 'var(--title-member-gradient)', description: 'A special title for verified members of the community.' },
 'gamedeveloper': { text: 'Game Developer', style: 'var(--title-gamedeveloper-gradient)', description: 'This title is reserved for the developers of STS.' },
 '100t': { text: '+100T Value', style: 'var(--title-100t-gradient)', description: 'Awarded to players with exceptional in-game value.' },
 '250t': { text: '+250T Time', style: 'var(--title-250t-gradient)', description: 'For the most dedicated players who have spent countless hours in-game.' },
 'tester': { text: 'Tester', style: 'var(--title-tester-gradient)', description: 'For official testers who help improve the game.' },
 'owner': { text: 'Owner', style: 'var(--title-owner-gradient)', description: 'The highest rank, reserved for the project owner.' },
};

// --- Funciones de control de UI ---

function showModal(modalElement) {
  dom.modals.authOverlay.style.display = 'flex';
  setTimeout(() => dom.modals.authOverlay.classList.add('visible'), 10);
  
  // Ocultar todos los modales primero
  [dom.modals.login, dom.modals.registerStep1, dom.modals.registerStep2].forEach(m => {
      if(m) m.style.display = 'none';
  });

  // Mostrar el modal específico
  if(modalElement) modalElement.style.display = 'block';
}

function hideModals() {
  dom.modals.authOverlay.classList.remove('visible');
  setTimeout(() => { dom.modals.authOverlay.style.display = 'none'; }, 300);
}

function toggleDropdown() {
  const isVisible = dom.header.mainNavDropdown.classList.toggle('visible');
  dom.header.hamburgerMenu.classList.toggle('open', isVisible);
}

export function updateProfileUI(userData) {
  if (!userData) {
    dom.header.loginNavBtn.style.display = 'block';
    dom.header.userProfileNav.style.display = 'none';
    return;
  }

  dom.header.loginNavBtn.style.display = 'none';
  dom.header.userProfileNav.style.display = 'flex';
  dom.header.userName.textContent = `@${userData.username}`;
  dom.header.userAvatar.src = userData.avatar || 'images/placeholder.png';

  const styleInfo = titleStyles[userData.equippedTitle] || titleStyles['player'];
  const titleElement = dom.header.userTitle;
  
  titleElement.textContent = styleInfo.text;
  
  if (styleInfo.style.includes('gradient')) {
    titleElement.classList.add('gradient');
    titleElement.style.backgroundImage = styleInfo.style;
    titleElement.style.color = ''; // Limpiar color por si acaso
    dom.header.userProfileNav.style.setProperty('--border-gradient', styleInfo.style);
  } else {
    titleElement.classList.remove('gradient');
    titleElement.style.backgroundImage = '';
    titleElement.style.color = styleInfo.style;
    // Para colores sólidos, creamos un gradiente simple para el borde
    dom.header.userProfileNav.style.setProperty('--border-gradient', `linear-gradient(to right, ${styleInfo.style}, ${styleInfo.style})`);
  }

  // Mostrar herramientas de desarrollador si el rol es 'owner'
  dom.header.devToolsLink.style.display = userData.role === 'owner' ? 'block' : 'none';
}


// --- Lógica de negocio y Event Handlers ---

async function handleLogin(event) {
  event.preventDefault();
  const form = event.target;
  const errorElement = document.getElementById('login-error');
  const loginButton = form.querySelector('button');
  
  errorElement.style.display = 'none';
  loginButton.disabled = true;
  loginButton.textContent = 'Logging in...';

  try {
    const { token, user } = await api.auth.login(form.username.value, form.password.value);
    
    localStorage.setItem('sts-token', token);
    localStorage.setItem('sts-user', JSON.stringify(user));
    setCurrentUser(user);
    
    updateProfileUI(user);
    hideModals();
    // La notificación a main.js se hará desde el propio main.js
  } catch (error) {
    if (error.status === 403 && error.data.banInfo) {
        // Manejo específico para usuarios baneados
        const { reason, expiresAt } = error.data.banInfo;
        const expiryInfo = `Expires: ${formatBanTime(expiresAt)}`;
        errorElement.innerHTML = `<strong>Account Banned</strong><br>Reason: ${reason}<br>${expiryInfo}`;
    } else {
        errorElement.textContent = error.message || "Could not connect to the server.";
    }
    errorElement.style.display = 'block';
  } finally {
    loginButton.disabled = false;
    loginButton.textContent = 'Login';
  }
}

async function handleRegisterStep1(event) {
    event.preventDefault();
    const form = event.target;
    const { username, password, confirm_password } = form;
    const errorElement = document.getElementById('register-error-step1');
    errorElement.style.display = 'none';

    if (password.value !== confirm_password.value) {
        errorElement.textContent = "Passwords do not match.";
        errorElement.style.display = 'block';
        return;
    }

    const verificationCode = `verify-my-account-${Math.random().toString(36).substr(2, 9)}`;
    document.getElementById('verification-code').textContent = verificationCode;
    
    sessionStorage.setItem('pending_username', username.value);
    sessionStorage.setItem('pending_password', password.value);
    sessionStorage.setItem('pending_code', verificationCode);
    
    showModal(dom.modals.registerStep2);
}

async function handleVerifyAndCreateAccount() {
    const errorElement = document.getElementById('register-error-step2');
    errorElement.style.display = 'none';

    const username = sessionStorage.getItem('pending_username');
    const password = sessionStorage.getItem('pending_password');
    const verificationCode = sessionStorage.getItem('pending_code');

    if (!username || !password || !verificationCode) {
        errorElement.textContent = "Session error. Please start registration again.";
        errorElement.style.display = 'block';
        return;
    }

    const verifyButton = document.getElementById('verify-account-btn');
    verifyButton.disabled = true;
    verifyButton.textContent = 'Verifying...';

    try {
        const data = await api.auth.register(username, password, verificationCode);
        sessionStorage.clear();
        alert(data.message);
        showModal(dom.modals.login);
    } catch (error) {
        errorElement.textContent = error.message || "Could not connect to the server. Try again later.";
        errorElement.style.display = 'block';
    } finally {
        verifyButton.disabled = false;
        verifyButton.textContent = 'Verify & Create Account';
    }
}


function handleLogout() {
  localStorage.removeItem('sts-token');
  localStorage.removeItem('sts-user');
  setCurrentUser(null);
  window.location.reload(); // La forma más sencilla de resetear el estado de la app
}


// --- Función Principal de Inicialización ---
export function initializeAuth() {
  // --- Vinculación de Event Listeners ---
  dom.header.loginNavBtn.addEventListener('click', () => showModal(dom.modals.login));
  dom.header.logoutBtn.addEventListener('click', handleLogout);
  dom.header.hamburgerMenu.addEventListener('click', toggleDropdown);

  document.getElementById('show-register-link').addEventListener('click', (e) => { e.preventDefault(); showModal(dom.modals.registerStep1); });
  document.getElementById('show-login-link').addEventListener('click', (e) => { e.preventDefault(); showModal(dom.modals.login); });

  dom.modals.authOverlay.addEventListener('click', (e) => { if (e.target === dom.modals.authOverlay) hideModals(); });
  document.querySelectorAll('.close-modal-btn').forEach(btn => btn.addEventListener('click', hideModals));
  
  // Cerrar dropdown si se hace clic fuera
  document.addEventListener('click', (e) => {
    if (dom.header.mainNavDropdown.classList.contains('visible') && !dom.header.userProfileNav.contains(e.target) && !dom.header.mainNavDropdown.contains(e.target)) {
      toggleDropdown();
    }
  });

  // Listeners para formularios
  document.getElementById('login-form').addEventListener('submit', handleLogin);
  document.getElementById('register-form-step1').addEventListener('submit', handleRegisterStep1);
  document.getElementById('verify-account-btn').addEventListener('click', handleVerifyAndCreateAccount);
  
  // Listener para el botón de copiar código
  const copyBtn = document.getElementById('copy-code-btn');
  if(copyBtn) {
      copyBtn.addEventListener('click', () => {
        const code = document.getElementById('verification-code').textContent;
        navigator.clipboard.writeText(code).then(() => alert('Code copied to clipboard!'));
      });
  }

  // --- Comprobación de sesión al cargar la página ---
  const savedUser = localStorage.getItem('sts-user');
  if (savedUser) {
    const userData = JSON.parse(savedUser);
    setCurrentUser(userData);
    updateProfileUI(userData);
  }
  
  console.log("Auth system initialized.");
}