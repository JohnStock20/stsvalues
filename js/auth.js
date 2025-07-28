/* =================================================================================== */
/* === ARCHIVO: auth.js (VERSIÓN COMPLETA, FINAL Y FUNCIONAL) === */
/* === Lógica para el sistema de autenticación de usuarios (login, registro, logout). === */
/* =================================================================================== */

// ¡NO definimos las constantes aquí fuera!

// --- Inicialización de los Event Listeners ---
export function initializeAuth() {
    // === EL CAMBIO CLAVE ESTÁ AQUÍ ===
    // Buscamos los elementos del DOM DENTRO de la función de inicialización.
    // Esto garantiza que el DOM está completamente cargado cuando se ejecuta este código.
    const authModalOverlay = document.getElementById('auth-modal-overlay');
    const loginModal = document.getElementById('login-modal');
    const registerModalStep1 = document.getElementById('register-modal-step1');
    const registerModalStep2 = document.getElementById('register-modal-step2');
    const loginNavBtn = document.getElementById('login-nav-btn');
    const userProfileNav = document.getElementById('user-profile-nav');
    const logoutBtn = document.getElementById('logout-btn');

    // --- Funciones para controlar la visibilidad de los modales ---
    function showModal(modalElement) {
        authModalOverlay.classList.add('visible');
        [loginModal, registerModalStep1, registerModalStep2].forEach(m => m.style.display = 'none');
        modalElement.style.display = 'block';
    }

    function hideModals() {
        authModalOverlay.classList.remove('visible');
    }

    // --- Manejadores de eventos de formularios (Simulados) ---
    async function handleLogin(event) {
        event.preventDefault();
        const form = event.target;
        const username = form.username.value;
        const password = form.password.value;
        const errorElement = document.getElementById('login-error');
        errorElement.style.display = 'none';

        if (username === "testuser" && password === "password") {
            console.log("Login exitoso (simulado)");
            updateUIAfterLogin({ username: "testuser", avatar: "images/placeholder.png" });
            hideModals();
        } else {
            errorElement.textContent = "Invalid username or password.";
            errorElement.style.display = 'block';
        }
    }

    async function handleRegisterStep1(event) {
        event.preventDefault();
        const form = event.target;
        const username = form.username.value;
        const password = form.password.value;
        const confirmPassword = form.confirm_password.value;
        const errorElement = document.getElementById('register-error-step1');
        errorElement.style.display = 'none';

        if (password !== confirmPassword) {
            errorElement.textContent = "Passwords do not match.";
            errorElement.style.display = 'block';
            return;
        }

        document.getElementById('verification-code').textContent = `code-${Math.random().toString(36).substr(2, 9)}`;
        showModal(registerModalStep2);
    }

    async function handleVerifyAndCreateAccount() {
        const username = document.querySelector('#register-form-step1 input[name="username"]').value;
        const errorElement = document.getElementById('register-error-step2');
        errorElement.style.display = 'none';

        setTimeout(() => {
            alert(`Account for ${username} created successfully! Please log in.`);
            showModal(loginModal);
        }, 1500);
    }

    function handleLogout() {
        loginNavBtn.style.display = 'block';
        userProfileNav.style.display = 'none';
    }

    function updateUIAfterLogin(userData) {
        loginNavBtn.style.display = 'none';
        userProfileNav.style.display = 'flex';
        document.getElementById('user-name').textContent = userData.username;
        document.getElementById('user-avatar').src = userData.avatar;
    }

    // --- Conexión de todos los Event Listeners ---
    if (loginNavBtn) {
        loginNavBtn.addEventListener('click', () => showModal(loginModal));
    }
    
    document.getElementById('show-register-link').addEventListener('click', (e) => {
        e.preventDefault();
        showModal(registerModalStep1);
    });
    
    document.getElementById('show-login-link').addEventListener('click', (e) => {
        e.preventDefault();
        showModal(loginModal);
    });

    authModalOverlay.addEventListener('click', (e) => {
        if (e.target === authModalOverlay) {
            hideModals();
        }
    });

    document.querySelectorAll('.close-modal-btn').forEach(btn => {
        btn.addEventListener('click', hideModals);
    });

    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('register-form-step1').addEventListener('submit', handleRegisterStep1);
    document.getElementById('verify-account-btn').addEventListener('click', handleVerifyAndCreateAccount);

    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    document.getElementById('copy-code-btn').addEventListener('click', () => {
        const code = document.getElementById('verification-code').textContent;
        navigator.clipboard.writeText(code).then(() => {
            alert('Code copied to clipboard!');
        });
    });

    console.log("Auth system initialized.");
}