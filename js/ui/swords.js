// Archivo: js/ui/swords.js (REESCRITO Y CORREGIDO)
// Propósito: Renderizar la lista de "Other Swords" y la vista de detalles de una espada.

import { dom } from './dom.js';
import { appData, parseValue } from '../data.js';
import { createRewardItem, showView } from './core.js';
import { findSwordById, formatLargeNumber, formatTimeAgo } from '../utils.js';
import { titleStyles } from '../auth.js'; // Necesario para obtener los gradientes

// --- RAREZAS QUE USAN GRADIENTES ---
// Necesitamos saber qué rarezas usan un gradiente para aplicar el estilo de borde correcto.
const gradientRarities = [
    'godly', 'subzero', 'mythic', 'staff', 'limited', 'exclusive',
    'event', 'easter', 'unobtainable', 'hell', 'evil'
];

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
 * Renderiza la vista de detalles para una espada específica (RECONSTRUIDA).
 */
export function renderSwordDetails(sword, sourceInfo, navigateTo, onNewInterval) {
    const container = document.querySelector('#sword-details-view .sword-details-content');
    if (!container) return;

    // Determinar el color del borde de la rareza
    const rarityClass = sword.rarity || 'common';
    const isGradient = gradientRarities.includes(rarityClass);
    const borderColor = isGradient ? `var(--${rarityClass}-gradient)` : `var(--${rarityClass})`;

    // Limpiar contenedor y reconstruir
    container.innerHTML = `
        <!-- Columna Izquierda: Tarjeta de Información -->
        <div id="sword-info-card" class="card-base" style="--card-border-color: ${borderColor};">
            <div id="sword-demand-indicator"></div>
            <div id="sword-details-image-container">
                <img src="${sword.image || 'images/placeholder.png'}" alt="${sword.name}">
            </div>
            <h3 id="sword-details-name">${sword.name}</h3>
            <p id="sword-details-description"></p>
        </div>

        <!-- Columna Derecha: Contenedor de Estadísticas -->
        <div class="sword-stats-container">
            <div class="stat-box card-base" style="--card-border-color: var(--main-green);">
                <h4>VALUE</h4>
                <p id="sword-details-value"></p>
                <span id="sword-details-updated" class="sub-text"></span>
            </div>
            <div class="stat-box card-base" style="--card-border-color: var(--main-green);">
                <h4>STATS</h4>
                <p id="sword-details-stats"></p>
            </div>
            <div class="stat-box card-base" style="--card-border-color: var(--main-green);">
                <h4>MORE</h4>
                <p id="sword-details-more"></p>
            </div>
        </div>
    `;

    // Poblar datos
    const demandIndicator = document.getElementById('sword-demand-indicator');
    if (sword.demand) {
        demandIndicator.className = 'sword-demand-indicator ' + sword.demand;
        demandIndicator.style.display = 'block';
    } else {
        demandIndicator.style.display = 'none';
    }

    const fullDescription = sword.description || (sourceInfo.id ? `This sword is obtainable from the [case:${sourceInfo.id}].` : 'No origin specified.');
    parseAndSetDescription(document.getElementById('sword-details-description'), fullDescription, navigateTo);
    
    document.getElementById('sword-details-value').textContent = formatLargeNumber(parseValue(sword.value));
    document.getElementById('sword-details-stats').textContent = sword.stats;
    
    document.getElementById('sword-details-more').innerHTML = `
      ${sword.chance ? `Chance - ${sword.chance}%<br>` : ''}
      Exist - ${sword.exist === "N/A" ? "N/A" : formatLargeNumber(sword.exist)}<br>
      Rarity - <span class="rarity-text ${rarityClass}">${rarityClass}</span>
    `;

    const updatedEl = document.getElementById('sword-details-updated');
    const updateSwordTime = () => updatedEl.textContent = formatTimeAgo(sword.lastUpdated);
    updateSwordTime();
    onNewInterval(setInterval(updateSwordTime, 60000));
    
    showView('swordDetails');
}