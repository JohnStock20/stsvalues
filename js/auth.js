/* =================================================================================== */
/* === ARCHIVO: auth.js === */
/* === Lógica para el sistema de autenticación de usuarios (login, registro, logout). === */
/* =================================================================================== */

// Mapeo de claves de título a los estilos CSS (variables de gradiente) y texto visible
const titleStyles = {
    'player': { text: 'Player', gradient: 'var(--title-player-color)' },
    'member': { text: 'Member', gradient: 'var(--title-member-gradient)' },
    'gamedeveloper': { text: 'Game Developer', gradient: 'var(--title-gamedeveloper-gradient)' },
    '100t': { text: '+100T Value', gradient: 'var(--title-100t-gradient)' },
    '250t': { text: '+250T Time', gradient: 'var(--title-250t-gradient)' },
    'tester': { text: 'Tester', gradient: 'var(--title-tester-gradient)' },
    'owner': { text: 'Owner', gradient: 'var(--title-owner-gradient)' },
};

// --- Función principal de inicialización ---
export function initializeAuth(onLoginSuccess) {
    // --- Obtención de elementos del DOM ---
    const authModalOverlay = document.getElementById('auth-modal-overlay');
    const loginModal = document.getElementById('login-modal');
    const registerModalStep1 = document.getElementById('register-modal-step1');
    const registerModalStep2 = document.getElementById('register-modal-step2');
    
    const loginNavBtn = document.getElementById('login-nav-btn');
    const userProfileNav = document.getElementById('user-profile-nav');
    const logoutBtn = document.getElementById('logout-btn');
    const hamburgerMenu = document.getElementById('hamburger-menu');
    const mainNavDropdown = document.getElementById('main-nav-dropdown');
    const devToolsLink = document.getElementById('dev-tools-link');

    // --- Funciones de control de UI ---

    function showModal(modalElement) {
        authModalOverlay.style.display = 'flex';
        setTimeout(() => authModalOverlay.classList.add('visible'), 10);
        [loginModal, registerModalStep1, registerModalStep2].forEach(m => m.style.display = 'none');
        modalElement.style.display = 'block';
    }

    function hideModals() {
        authModalOverlay.classList.remove('visible');
        setTimeout(() => { authModalOverlay.style.display = 'none'; }, 300);
    }

    function toggleDropdown() {
        const isVisible = mainNavDropdown.classList.toggle('visible');
        hamburgerMenu.classList.toggle('open', isVisible);
    }

    function updateProfileUI(userData) {
        if (!userData) return;

        loginNavBtn.style.display = 'none';
        userProfileNav.style.display = 'flex';
        
        document.getElementById('user-name').textContent = `@${userData.username}`;
        document.getElementById('user-avatar').src = userData.avatar || 'images/placeholder.png';

        // Actualizar título y borde del perfil
        const style = titleStyles[userData.equippedTitle] || titleStyles['player'];
        const titleElement = document.getElementById('user-title');
        titleElement.textContent = style.text;
        
        if (style.gradient.startsWith('var')) {
             titleElement.classList.remove('gradient');
             titleElement.style.color = style.gradient;
             userProfileNav.style.setProperty('--border-gradient', `linear-gradient(to right, ${style.gradient}, ${style.gradient})`);
        } else {
            titleElement.classList.add('gradient');
            titleElement.style.backgroundImage = style.gradient;
            userProfileNav.style.setProperty('--border-gradient', style.gradient);
        }

        // Mostrar herramientas de desarrollador si el rol es 'owner'
        if (userData.role === 'owner') {
            devToolsLink.style.display = 'block';
        }
    }

    // --- Lógica de negocio y Event Handlers ---

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
                localStorage.setItem('sts-token', data.token);
                localStorage.setItem('sts-user', JSON.stringify(data.user)); // Guardamos el perfil del usuario
                updateProfileUI(data.user);
                hideModals();
                onLoginSuccess(data.user); // Notificamos a main.js del éxito
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
        
        const verificationCode = `verify-my-account-${Math.random().toString(36).substr(2, 9)}`;
        document.getElementById('verification-code').textContent = verificationCode;
        
        sessionStorage.setItem('pending_username', username);
        sessionStorage.setItem('pending_password', password);
        sessionStorage.setItem('pending_code', verificationCode);

        showModal(registerModalStep2);
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
            const response = await fetch('/.netlify/functions/verify-and-register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, verificationCode })
            });
            const data = await response.json();

            if (!response.ok) {
                errorElement.textContent = data.message;
                errorElement.style.display = 'block';
            } else {
                sessionStorage.clear();
                alert(data.message);
                showModal(loginModal);
            }
        } catch (error) {
            console.error('Verification error:', error);
            errorElement.textContent = "Could not connect to the server. Try again later.";
            errorElement.style.display = 'block';
        } finally {
            verifyButton.disabled = false;
            verifyButton.textContent = 'Verify & Create Account';
        }
    }

    function handleLogout() {
        localStorage.removeItem('sts-token');
        localStorage.removeItem('sts-user');
        window.location.reload(); // La forma más sencilla de resetear el estado de la app
    }

    // --- Vinculación de Event Listeners ---
    loginNavBtn.addEventListener('click', () => showModal(loginModal));
    logoutBtn.addEventListener('click', handleLogout);
    hamburgerMenu.addEventListener('click', toggleDropdown);

    document.getElementById('show-register-link').addEventListener('click', (e) => { e.preventDefault(); showModal(registerModalStep1); });
    document.getElementById('show-login-link').addEventListener('click', (e) => { e.preventDefault(); showModal(loginModal); });

    authModalOverlay.addEventListener('click', (e) => { if (e.target === authModalOverlay) hideModals(); });
    document.querySelectorAll('.close-modal-btn').forEach(btn => btn.addEventListener('click', hideModals));
    
    document.addEventListener('click', (e) => {
        if (!userProfileNav.contains(e.target) && !mainNavDropdown.contains(e.target) && mainNavDropdown.classList.contains('visible')) {
            toggleDropdown();
        }
    });

    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('register-form-step1').addEventListener('submit', handleRegisterStep1);
    document.getElementById('verify-account-btn').addEventListener('click', handleVerifyAndCreateAccount);
    document.getElementById('copy-code-btn').addEventListener('click', () => {
        navigator.clipboard.writeText(document.getElementById('verification-code').textContent)
            .then(() => alert('Code copied to clipboard!'));
    });

    // --- Comprobación de sesión al cargar la página ---
    const savedUser = localStorage.getItem('sts-user');
    if (savedUser) {
        const userData = JSON.parse(savedUser);
        updateProfileUI(userData);
        onLoginSuccess(userData);
    }

    console.log("Auth system initialized.");
}