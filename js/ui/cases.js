// Archivo: js/ui/cases.js (NUEVO)
// Propósito: Renderizar la selección de cajas y la vista de detalles de una caja.

import { dom } from './dom.js';
import { appData } from '../data.js';
import { createRewardItem, getCurrencyHTML, showView } from './core.js';
import { clearCalculator } from './calculator.js';

/**
 * Renderiza la página principal con la selección de todas las cajas.
 * @param {function} navigateTo - Función del main.js para manejar la navegación.
 */
export function renderCaseSelection(navigateTo) {
  dom.containers.cases.innerHTML = '';
  Object.keys(appData.cases).forEach(caseId => {
    const data = appData.cases[caseId];
    const link = document.createElement('a');
    link.href = '#';
    link.className = 'case-link';
    link.onclick = (e) => {
      e.preventDefault();
      navigateTo('caseDetails', caseId);
    };

    const caseItem = document.createElement('div');
    caseItem.className = 'case-item';
    caseItem.style.setProperty('--case-border-color', data.borderColor || 'var(--main-green)');
    
    caseItem.innerHTML = `
      <img class="case-content-image" src="${data.image}" alt="${data.name}">
      <h3 class="case-title">${data.name}</h3>
      <div class="case-price">${getCurrencyHTML(data.currency, data.price)}</div>
    `;

    link.appendChild(caseItem);
    dom.containers.cases.appendChild(link);
  });
}

/**
 * Renderiza la vista de detalles para una caja específica.
 * @param {string} caseId - El ID de la caja a renderizar.
 * @param {function} navigateTo - Función del main.js para manejar la navegación.
 */
export function renderCaseDetails(caseId, navigateTo) {
  const data = appData.cases[caseId];
  if (!data) return;

  // Poblar la columna de información (panel derecho)
  document.getElementById('details-case-image').src = data.image;
  document.getElementById('details-case-name').textContent = data.name;
  document.getElementById('details-case-price').innerHTML = getCurrencyHTML(data.currency, data.price);
  
  // Asignar el color de borde correcto al panel
  const infoColumn = document.querySelector('#case-details-view .info-column');
  infoColumn.style.setProperty('--case-border-color', data.borderColor || 'var(--main-green)');

  // Renderizar la lista de recompensas (panel izquierdo)
  dom.containers.rewards.innerHTML = '';
  data.rewards.forEach(reward => {
    const source = { type: 'case', id: caseId };
    const item = createRewardItem(reward, source, navigateTo);
    dom.containers.rewards.appendChild(item);
  });

  // Limpiar y resetear la calculadora
  clearCalculator({ calculatorMode: 'theoretical' });

  // Mostrar la vista de detalles
  showView('caseDetails');
}