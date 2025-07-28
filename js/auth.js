/* =================================================================================== */
/* === ARCHIVO: auth.js (VERSIÓN CORREGIDA Y FUNCIONAL) === */
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
        // Usamos clases para una transición suave, en lugar de cambiar 'display' directamente.
        authModalOverlay.style.display = 'flex'; // Primero lo hacemos un flex container
        setTimeout(() => {
            authModalOverlay.classList.add('visible');
        }, 10); // Un pequeño retardo para que la transición CSS se active
        
        [loginModal, registerModalStep1, registerModalStep2].forEach(m => m.style.display = 'none');
        modalElement.style.display = 'block';
    }

    function hideModals() {
        authModalOverlay.classList.remove('visible');
        // Esperamos a que la transición de opacidad termine antes de ocultarlo completamente
        setTimeout(() => {
            authModalOverlay.style.display = 'none';
        }, 300); // 300ms es la duración de la transición en auth.css
    }

// En js/auth.js

// Reemplaza tu vieja función handleLogin con esta:
async function handleLogin(event) {
    event.preventDefault();
    const form = event.target;
    const username = form.username.value;
    const password = form.password.value;
    const errorElement = document.getElementById('login-error');
    errorElement.style.display = 'none';

    const loginButton = form.querySelector('button');
    loginButton.disabled = true;
    loginButton.textContent = 'Logging in...';

    try {
        const response = await fetch('/.netlify/functions/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (!response.ok) {
            errorElement.textContent = data.message;
            errorElement.style.display = 'block';
        } else {
            // ¡Éxito! El backend nos ha dado un token.
            // Guardamos el token en la memoria del navegador para recordar al usuario.
            localStorage.setItem('sts-token', data.token);

            // Actualizamos la UI para mostrar el perfil del usuario.
            updateUIAfterLogin(data.user); // Esta función ya la tenías
            hideModals(); // Esta también
        }
    } catch (error) {
        console.error('Login fetch error:', error);
        errorElement.textContent = "Could not connect to the server.";
        errorElement.style.display = 'block';
    } finally {
        loginButton.disabled = false;
        loginButton.textContent = 'Login';
    }
}

// 1. MODIFICA la función que maneja el primer paso del registro
async function handleRegisterStep1(event) {
    event.preventDefault();
    const form = event.target;
    const username = form.username.value;
    const password = form.password.value;
    const confirmPassword = form.confirm_password.value;
    const errorElement = document.getElementById('register-error-step1');
    errorElement.style.display = 'none';

    if (password !== confirmPassword) {
        errorElement.textContent = "Las contraseñas no coinciden.";
        errorElement.style.display = 'block';
        return;
    }
    
    // --- ESTA PARTE ES NUEVA ---
    // Simulación: Generamos un código aleatorio en el frontend por ahora.
    // Más adelante, una función de backend haría esto.
    const verificationCode = `verify-my-account-${Math.random().toString(36).substr(2, 9)}`;
    document.getElementById('verification-code').textContent = verificationCode;
    
    // Guardamos los datos temporalmente para usarlos en el paso 2
    // Usamos el `sessionStorage` que es como una memoria temporal del navegador
    sessionStorage.setItem('pending_username', username);
    sessionStorage.setItem('pending_password', password);
    sessionStorage.setItem('pending_code', verificationCode);

    // Mostramos el segundo modal con las instrucciones
    showModal(registerModalStep2);
}

// 2. MODIFICA la función que maneja el botón "Verificar y Crear Cuenta"
async function handleVerifyAndCreateAccount() {
    const errorElement = document.getElementById('register-error-step2');
    errorElement.style.display = 'none';

    // Recuperamos los datos que guardamos del paso 1
    const username = sessionStorage.getItem('pending_username');
    const password = sessionStorage.getItem('pending_password');
    const verificationCode = sessionStorage.getItem('pending_code');

    if (!username || !password || !verificationCode) {
        errorElement.textContent = "Error de sesión. Por favor, empieza el registro de nuevo.";
        errorElement.style.display = 'block';
        return;
    }

    const verifyButton = document.getElementById('verify-account-btn');
    verifyButton.disabled = true;
    verifyButton.textContent = 'Verificando...';

    try {
        // Llamamos a nuestra nueva función de backend para verificar
        const response = await fetch('/.netlify/functions/verify-and-register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                username: username, 
                password: password,
                verificationCode: verificationCode
            })
        });

        const data = await response.json();

        if (!response.ok) {
            errorElement.textContent = data.message;
            errorElement.style.display = 'block';
        } else {
            // Limpiamos los datos temporales
            sessionStorage.removeItem('pending_username');
            sessionStorage.removeItem('pending_password');
            sessionStorage.removeItem('pending_code');
            
            alert(data.message);
            showModal(loginModal);
        }
    } catch (error) {
        console.error('Error de verificación:', error);
        errorElement.textContent = "No se pudo conectar al servidor. Inténtalo más tarde.";
        errorElement.style.display = 'block';
    } finally {
        verifyButton.disabled = false;
        verifyButton.textContent = 'Verificar & Crear Cuenta';
    }
}
    function handleLogout() {
        loginNavBtn.style.display = 'block';
        userProfileNav.style.display = 'none';
        console.log("Logout exitoso (simulado)");
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
        // Si se hace clic directamente en el overlay (el fondo oscuro), se cierra.
        if (e.target === authModalOverlay) {
            hideModals();
        }
    });

    // Añade el listener a todos los botones de cerrar
    document.querySelectorAll('.close-modal-btn').forEach(btn => {
        btn.addEventListener('click', hideModals);
    });

    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('register-form-step1').addEventListener('submit', handleRegisterStep1);
    document.getElementById('verify-account-btn').addEventListener('click', handleVerifyAndCreateAccount);

    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault(); // Previene que el enlace '#' recargue la página
            handleLogout();
        });
    }

    document.getElementById('copy-code-btn').addEventListener('click', () => {
        const code = document.getElementById('verification-code').textContent;
        navigator.clipboard.writeText(code).then(() => {
            alert('Code copied to clipboard!');
        });
    });

    console.log("Auth system initialized correctly.");
}