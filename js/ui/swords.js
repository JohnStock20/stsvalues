// Archivo: js/ui/swords.js (NUEVO)
// Propósito: Renderizar la lista de "Other Swords" y la vista de detalles de una espada.

import { dom } from './dom.js';
import { appData, parseValue } from '../data.js';
import { createRewardItem, showView } from './core.js';
import { findSwordById, formatLargeNumber, formatTimeAgo } from '../utils.js';

/**
 * Renderiza la lista paginada de espadas que no están en cajas.
 * @param {object} appState - El estado actual de la aplicación (para paginación).
 * @param {function} navigateTo - Función del main.js para manejar la navegación.
 */
export function renderOtherSwords(appState, navigateTo) {
  const { currentPage, itemsPerPage } = appState;
  dom.containers.otherSwords.innerHTML = '';
  
  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const pagedItems = appData.otherSwords.slice(start, end);

  pagedItems.forEach(reward => {
    const item = createRewardItem(reward, { type: 'other' }, navigateTo);
    dom.containers.otherSwords.appendChild(item);
  });

  updatePaginationControls(appState);
}

/**
 * Actualiza el estado de los botones de paginación (activado/desactivado).
 * @param {object} appState - El estado actual de la aplicación.
 */
export function updatePaginationControls(appState) {
  const totalPages = Math.ceil(appData.otherSwords.length / appState.itemsPerPage);
  dom.buttons.prevPage.disabled = appState.currentPage === 1;
  dom.buttons.nextPage.disabled = appState.currentPage === totalPages;
}


function parseAndSetDescription(element, text, navigateTo) {
    element.innerHTML = '';
    if (!text) {
        element.textContent = 'No description available.';
        return;
    }

    const fragment = document.createDocumentFragment();
    const regex = /\[(case|sword):([a-zA-Z0-9_-]+)\]/g;
    let lastIndex = 0, match;

    while ((match = regex.exec(text)) !== null) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
        const [fullMatch, type, id] = match;
        const link = document.createElement('a');
        link.href = '#';
        let linkData;

        if (type === 'case') {
            linkData = appData.cases[id];
            if (linkData) {
                link.textContent = linkData.name;
                link.className = 'case-link-in-description';
                link.onclick = (e) => { e.preventDefault(); navigateTo('caseDetails', id); };
            }
        } else if (type === 'sword') {
            linkData = findSwordById(id);
            if (linkData) {
                link.textContent = linkData.sword.name;
                link.className = 'sword-link-in-description';
                link.onclick = (e) => { e.preventDefault(); navigateTo('swordDetails', linkData); };
            }
        }

        if (link.textContent) {
            fragment.appendChild(link);
        } else {
            fragment.appendChild(document.createTextNode(fullMatch));
        }
        lastIndex = regex.lastIndex;
    }

    fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
    element.appendChild(fragment);
}


/**
 * Renderiza la vista de detalles para una espada específica.
 * @param {object} sword - El objeto de la espada.
 * @param {object} sourceInfo - Información sobre de dónde viene la espada.
 * @param {function} navigateTo - Función del main.js para manejar la navegación.
 * @param {function} onNewInterval - Callback para registrar el nuevo intervalo de actualización.
 */
export function renderSwordDetails(sword, sourceInfo, navigateTo, onNewInterval) {
    const swordInfoCard = document.getElementById('sword-info-card');
    swordInfoCard.className = 'sword-info-card'; // Reset classes
    swordInfoCard.classList.add(sword.rarity);

    const demandIndicator = document.getElementById('sword-demand-indicator');
    if (sword.demand) {
        demandIndicator.className = 'sword-demand-indicator ' + sword.demand;
        demandIndicator.style.display = 'block';
    } else {
        demandIndicator.style.display = 'none';
    }

    document.getElementById('sword-details-image-container').innerHTML = `<img src="${sword.image}" alt="${sword.name}">`;
    document.getElementById('sword-details-name').textContent = sword.name;
    
    // Descripción con enlaces parseados
    const descriptionElement = document.getElementById('sword-details-description');
    const fullDescription = sword.description || (sourceInfo.id ? `This sword is obtainable from the [case:${sourceInfo.id}].` : 'No origin specified.');
    parseAndSetDescription(descriptionElement, fullDescription, navigateTo);

    // Stats y valor
    document.getElementById('sword-details-value').textContent = formatLargeNumber(parseValue(sword.value));
    document.getElementById('sword-details-stats').textContent = sword.stats;
    
    // "More" info
    document.getElementById('sword-details-more').innerHTML = `
      ${sword.chance ? `Chance - ${sword.chance}%<br>` : ''}
      Exist - ${sword.exist === "N/A" ? "N/A" : formatLargeNumber(sword.exist)}<br>
      Rarity - <span class="rarity-text ${sword.rarity}">${sword.rarity}</span>
    `;

    // Fecha de última actualización
    const updatedEl = document.getElementById('sword-details-updated');
    const updateSwordTime = () => updatedEl.textContent = formatTimeAgo(sword.lastUpdated);
    updateSwordTime();
    // Limpiamos el intervalo anterior en main.js y creamos uno nuevo
    onNewInterval(setInterval(updateSwordTime, 60000));
    
    showView('swordDetails');
}