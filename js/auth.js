/* =================================================================================== */
/* === ARCHIVO: auth.js === */
/* === Lógica para el sistema de autenticación de usuarios (login, registro, logout). === */
/* =================================================================================== */

// --- Selección de Elementos del DOM ---
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
    // Oculta todos los modales primero
    [loginModal, registerModalStep1, registerModalStep2].forEach(m => m.style.display = 'none');
    // Muestra solo el modal deseado
    modalElement.style.display = 'block';
}

function hideModals() {
    authModalOverlay.classList.remove('visible');
}


// --- Manejadores de eventos de formularios (Simulados por ahora) ---

async function handleLogin(event) {
    event.preventDefault();
    const form = event.target;
    const username = form.username.value;
    const password = form.password.value;
    const errorElement = document.getElementById('login-error');

    console.log(`Intentando login para: ${username}`);
    errorElement.style.display = 'none'; // Ocultar errores previos

    // === LÓGICA DE BACKEND SIMULADA ===
    // En el futuro, aquí se haría una llamada a Netlify Function:
    // const response = await fetch('/.netlify/functions/login', { ... });
    // const data = await response.json();
    // if (data.success) { ... } else { ... }

    // Simulación:
    if (username === "testuser" && password === "password") {
        console.log("Login exitoso (simulado)");
        updateUIAfterLogin({ username: "testuser", avatar: "images/placeholder.png" });
        hideModals();
    } else {
        console.log("Fallo de login (simulado)");
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

    // Aquí también se haría una llamada al backend para verificar si el usuario ya existe
    // y para validar el token de reCAPTCHA.

    console.log(`Iniciando registro para: ${username}`);
    
    // Simulación exitosa, pasamos al paso 2
    document.getElementById('verification-code').textContent = `code-${Math.random().toString(36).substr(2, 9)}`;
    showModal(registerModalStep2);
}

async function handleVerifyAndCreateAccount() {
    const username = document.querySelector('#register-form-step1 input[name="username"]').value;
    const verificationCode = document.getElementById('verification-code').textContent;
    const errorElement = document.getElementById('register-error-step2');

    console.log(`Verificando cuenta de Roblox para ${username} con código ${verificationCode}`);
    errorElement.style.display = 'none';

    // === LÓGICA DE BACKEND SIMULADA ===
    // Esta es la parte más compleja. La función del backend haría:
    // 1. Recibir el username y el código.
    // 2. Usar una API de Roblox para leer la descripción del perfil del usuario.
    // 3. Comprobar si la descripción contiene el `verificationCode`.
    // 4. Si es así, crea la cuenta en la base de datos y devuelve éxito.
    // 5. Si no, devuelve un error.

    // Simulación:
    setTimeout(() => {
        console.log("Verificación exitosa (simulada)");
        alert(`Account for ${username} created successfully! Please log in.`);
        showModal(loginModal); // Llevamos al usuario al login
    }, 1500); // Simulamos una pequeña espera
}

function handleLogout() {
    console.log("Usuario ha hecho logout (simulado)");
    loginNavBtn.style.display = 'block';
    userProfileNav.style.display = 'none';
    // Aquí se borrarían los tokens o cookies de sesión.
}


// --- Actualización de la UI ---

function updateUIAfterLogin(userData) {
    loginNavBtn.style.display = 'none';
    userProfileNav.style.display = 'flex';
    document.getElementById('user-name').textContent = userData.username;
    document.getElementById('user-avatar').src = userData.avatar;
}


// --- Inicialización de los Event Listeners ---

export function initializeAuth() {
    // Abrir modales
    loginNavBtn.addEventListener('click', () => showModal(loginModal));
    document.getElementById('show-register-link').addEventListener('click', (e) => {
        e.preventDefault();
        showModal(registerModalStep1);
    });
    document.getElementById('show-login-link').addEventListener('click', (e) => {
        e.preventDefault();
        showModal(loginModal);
    });

    // Cerrar modales
    authModalOverlay.addEventListener('click', (e) => {
        if (e.target === authModalOverlay) {
            hideModals();
        }
    });
    document.querySelectorAll('.close-modal-btn').forEach(btn => {
        btn.addEventListener('click', hideModals);
    });

    // Formularios
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('register-form-step1').addEventListener('submit', handleRegisterStep1);
    document.getElementById('verify-account-btn').addEventListener('click', handleVerifyAndCreateAccount);

    // Otros botones
    logoutBtn.addEventListener('click', handleLogout);
    document.getElementById('copy-code-btn').addEventListener('click', () => {
        const code = document.getElementById('verification-code').textContent;
        navigator.clipboard.writeText(code).then(() => {
            alert('Code copied to clipboard!');
        });
    });

    console.log("Auth system initialized.");
}