// Archivo: js/ui/admin.js (NUEVO)
// Propósito: Renderizar las herramientas de administrador (otorgar títulos, banear, advertir).

import { dom } from './dom.js';
import { titleStyles } from '../auth.js';
import { showView } from './core.js';

/**
 * Muestra un mensaje de feedback en un formulario de admin.
 * @param {string} formId - El ID del formulario.
 * @param {string} message - El mensaje a mostrar.
 * @param {boolean} isError - Si el mensaje es de error.
 */
function showAdminFeedback(formId, message, isError = false) {
    const feedbackEl = document.querySelector(`#${formId} .feedback-message`);
    if (feedbackEl) {
        feedbackEl.textContent = message;
        feedbackEl.className = `feedback-message ${isError ? 'error' : 'success'}`;
        feedbackEl.style.display = 'block';
    }
}

/**
 * Renderiza todas las herramientas de administrador en la vista devtools.
 * @param {object} handlers - Un objeto con las funciones callback para las acciones.
 */
export function renderAdminTools(handlers) {
  const { onGrantTitle, onWarnUser, onBanUser } = handlers;
  
  dom.containers.adminTools.innerHTML = `
    <!-- Tarjeta para Otorgar Título -->
    <div class="admin-tool-card">
      <h3>Grant Title to User</h3>
      <form id="grant-title-form">
        <input type="text" name="targetUsername" placeholder="Enter Roblox Username..." required>
        <select name="titleKey" required>
          <option value="" disabled selected>Select a Title to Grant</option>
          ${Object.keys(titleStyles).map(key => `<option value="${key}">${titleStyles[key].text}</option>`).join('')}
        </select>
        <button type="submit" class="auth-button">Grant Title</button>
        <div class="feedback-message" style="display: none;"></div>
      </form>
    </div>

    <!-- Tarjeta para Advertir a Usuario -->
    <div class="admin-tool-card">
        <h3>Warn User</h3>
        <form id="warn-user-form">
            <input type="text" name="targetUsername" placeholder="Enter Roblox Username..." required>
            <textarea name="reason" placeholder="Reason for the warning..." required></textarea>
            <button type="submit" class="auth-button">Issue Warning</button>
            <div class="feedback-message" style="display: none;"></div>
        </form>
    </div>

    <!-- Tarjeta para Banear a Usuario -->
    <div class="admin-tool-card">
        <h3>Ban User</h3>
        <form id="ban-user-form">
            <input type="text" name="targetUsername" placeholder="Enter Roblox Username..." required>
            <textarea name="reason" placeholder="Reason for the ban..." required></textarea>
            <input type="number" name="duration" placeholder="Duration in hours (leave empty for permanent)">
            <button type="submit" class="auth-button">Issue Ban</button>
            <div class="feedback-message" style="display: none;"></div>
        </form>
    </div>
  `;

  // --- Asignar Event Listeners ---

  // Formulario de Grant Title
  const grantTitleForm = document.getElementById('grant-title-form');
  grantTitleForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = grantTitleForm.querySelector('button');
    btn.disabled = true;
    try {
        const message = await onGrantTitle(grantTitleForm.targetUsername.value, grantTitleForm.titleKey.value);
        showAdminFeedback('grant-title-form', message);
        grantTitleForm.reset();
    } catch (error) {
        showAdminFeedback('grant-title-form', error.message, true);
    } finally {
        btn.disabled = false;
    }
  });

  // Formulario de Warn User
  const warnUserForm = document.getElementById('warn-user-form');
  warnUserForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = warnUserForm.querySelector('button');
    btn.disabled = true;
     try {
        const message = await onWarnUser(warnUserForm.targetUsername.value, warnUserForm.reason.value);
        showAdminFeedback('warn-user-form', message);
        warnUserForm.reset();
    } catch (error) {
        showAdminFeedback('warn-user-form', error.message, true);
    } finally {
        btn.disabled = false;
    }
  });

  // Formulario de Ban User
  const banUserForm = document.getElementById('ban-user-form');
  banUserForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = banUserForm.querySelector('button');
    btn.disabled = true;
    try {
        const duration = banUserForm.duration.value ? parseInt(banUserForm.duration.value, 10) : null;
        const message = await onBanUser(banUserForm.targetUsername.value, banUserForm.reason.value, duration);
        showAdminFeedback('ban-user-form', message);
        banUserForm.reset();
    } catch (error) {
        showAdminFeedback('ban-user-form', error.message, true);
    } finally {
        btn.disabled = false;
    }
  });

  showView('devtools');
}