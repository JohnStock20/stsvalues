// Archivo: js/ui/core.js (NUEVO)
// Propósito: Contiene funciones de UI fundamentales y reutilizables.

import { dom } from './dom.js';
import { appData, parseValue } from '../data.js';
import { formatLargeNumber } from '../utils.js';
import { titleStyles } from '../auth.js';

// --- Funciones de Control de Vistas ---

export function showView(viewName) {
  // Ocultar todas las vistas
  Object.values(dom.views).forEach(view => {
    if (view) view.style.display = 'none';
  });

  // Mostrar la vista correcta, o la de 'cases' por defecto
  const viewToShow = dom.views[viewName];
  if (viewToShow) {
    viewToShow.style.display = 'block';
  } else {
    dom.views.cases.style.display = 'block';
  }
  
  window.scrollTo(0, 0); // Volver al inicio de la página al cambiar de vista
}

// --- Funciones de Renderizado de Componentes Comunes ---

export function updateProfileHeader(userData) {
    const titleElement = dom.header.userTitle;
    const styleInfo = titleStyles[userData.equippedTitle] || titleStyles['player'];

    titleElement.textContent = styleInfo.text;
    if (styleInfo.style.includes('gradient')) {
        titleElement.classList.add('gradient');
        titleElement.style.backgroundImage = styleInfo.style;
        titleElement.style.color = '';
        dom.header.userProfileNav.style.setProperty('--border-gradient', styleInfo.style);
    } else {
        titleElement.classList.remove('gradient');
        titleElement.style.backgroundImage = '';
        titleElement.style.color = styleInfo.style;
        dom.header.userProfileNav.style.setProperty('--border-gradient', `linear-gradient(to right, ${styleInfo.style}, ${styleInfo.style})`);
    }
}


function createRewardItemHTML(reward, source) {
  const isCaseReward = source && source.type === 'case';
  
  const valueDisplayHTML = (typeof reward.value === 'string' && reward.value.toUpperCase().startsWith('O/C'))
    ? `<span class="value-oc" title="Owner's Choice">O/C</span>`
    : formatLargeNumber(parseValue(reward.value));

  // Aumentamos el brillo del hover modificando el shadow-color en el CSS
  // y podemos añadir un efecto más pronunciado aquí si es necesario.
  return `
    <div class="reward-info">
      <div class="reward-image-placeholder">
        <img src="${reward.image || 'images/placeholder.png'}" alt="${reward.name}">
      </div>
      <span class="reward-name">${reward.name}</span>
    </div>
    <div class="reward-stats">
      ${isCaseReward ? `<span>${reward.chance}%</span>` : '<span class="no-chance">--</span>'}
      <span class="reward-value">${valueDisplayHTML}</span>
      <span>${reward.stats}</span>
    </div>
  `;
}

export function createRewardItem(reward, source, navigateTo) {
  const item = document.createElement('div');
  // Se añade la clase de hover para el brillo prominente
  item.className = `reward-item ${reward.rarity}`;
  item.innerHTML = createRewardItemHTML(reward, source);

  item.addEventListener('click', () => {
      navigateTo('swordDetails', { sword: reward, source });
  });

  return item;
}

export function getCurrencyHTML(currencyKey, price) {
  if (currencyKey === 'cooldown') {
    return `<span class="currency-text">Free (Every ${formatHours(price)} hr)</span>`;
  }
  const currency = appData.currencies[currencyKey];
  if (!currency) return `<span>${price}</span>`;

  if (currency.icon) {
    return `<img src="${currency.icon}" alt="${currency.name}" class="currency-icon"> <span class="value">${price.toLocaleString()}</span>`;
  }
  return `<span class="currency-text">${currency.name}</span> <span class="value">${price.toLocaleString()}</span>`;
}