// Archivo: js/ui/titles.js (NUEVO)
// Propósito: Renderizar la página de Títulos y manejar su interactividad.

import { dom } from './dom.js';
import { titleStyles } from '../auth.js';
import { showView } from './core.js';


/**
 * Renderiza los detalles del título seleccionado en el panel derecho.
 * @param {object} title - El objeto del título seleccionado.
 * @param {function} onEquip - Callback para equipar el título.
 */
function renderTitleDetails(title, onEquip) {
  const container = dom.containers.titleDetails;
  if (!title) {
    container.innerHTML = '<p>Select a title from the list to see its details.</p>';
    return;
  }

  const styleInfo = titleStyles[title.key] || titleStyles['player'];
  
  container.innerHTML = `
    <h3 class="
      ${styleInfo.style.includes('gradient') ? 'gradient' : ''}"
      style="
        ${styleInfo.style.includes('gradient') 
          ? `background-image: ${styleInfo.style}` 
          : `color: ${styleInfo.style}`}">
      ${styleInfo.text}
    </h3>
    <p>${styleInfo.description || 'No description available.'}</p>
    <button id="equip-title-btn" class="auth-button ${title.equipped ? 'equipped' : ''}">
      ${title.equipped ? 'Equipped' : 'Equip Title'}
    </button>
  `;

  const equipBtn = document.getElementById('equip-title-btn');
  if (title.unlocked && !title.equipped) {
    equipBtn.onclick = () => onEquip(title.key);
  } else {
    equipBtn.disabled = true;
  }
}


/**
 * Renderiza la lista completa de títulos y sus detalles.
 * @param {Array} titlesData - La lista de todos los títulos con su estado.
 * @param {string} selectedKey - La clave del título actualmente seleccionado.
 * @param {function} onSelect - Callback para cuando se selecciona un título.
 * @param {function} onEquip - Callback para cuando se equipa un título.
 */
export function renderTitlesPage(titlesData, selectedKey, onSelect, onEquip) {
  dom.containers.titlesList.innerHTML = '';
  if (!titlesData) {
    dom.containers.titlesList.innerHTML = '<p>Could not load titles.</p>';
    return;
  }

  titlesData.forEach(title => {
    const styleInfo = titleStyles[title.key] || titleStyles['player'];
    const item = document.createElement('div');
    
    item.className = `title-list-item ${title.unlocked ? 'unlocked' : 'locked'}`;
    if (title.key === selectedKey) {
      item.classList.add('selected');
    }
    
    // Aplicar el borde característico usando una variable CSS
    item.style.setProperty('--border-color', styleInfo.style);

    item.onclick = () => {
      if (title.unlocked) {
        onSelect(title.key);
      }
    };

    item.innerHTML = `
      <span class="title-name 
        ${styleInfo.style.includes('gradient') ? 'gradient' : ''}"
        style="
          ${styleInfo.style.includes('gradient') 
            ? `background-image: ${styleInfo.style}` 
            : `color: ${styleInfo.style}`}">
        ${styleInfo.text}
      </span>
      ${!title.unlocked ? '<span class="lock-icon">🔒</span>' : ''}
    `;
    
    dom.containers.titlesList.appendChild(item);
  });

  const selectedTitleData = titlesData.find(t => t.key === selectedKey);
  renderTitleDetails(selectedTitleData, onEquip);
  showView('titles');
}