// =================================================================================
// ARCHIVO: ui.js (Controlador de la Interfaz de Usuario) - VERSIÓN 100% COMPLETA
// =================================================================================

import { findSwordById, formatLargeNumber, formatTimeAgo, getPrizeItemHtml, formatHours, parseValue } from './utils.js';
import { titleStyles } from './auth.js';


// --- Selectores del DOM ---
export const dom = {
    views: {
        cases: document.getElementById('cases-view'),
        caseDetails: document.getElementById('case-details-view'),
        swordDetails: document.getElementById('sword-details-view'),
        titles: document.getElementById('titles-view'),
        giveaways: document.getElementById('giveaways-view'),
        notifications: document.getElementById('notifications-view'),
        devtools: document.getElementById('devtools-view'),
        adminDataView: document.getElementById('admin-data-view'),
        swordEditorView: document.getElementById('sword-editor-view'),
        updateLogView: document.getElementById('update-log-view'),
    },
    containers: {
        cases: document.querySelector('#cases-view .cases-container'),
        otherSwords: document.getElementById('other-swords-container'),
        rewards: document.getElementById('rewards-list-container'),
        titlesList: document.getElementById('titles-list-container'),
        titleDetails: document.getElementById('title-details-view'),
        activeGiveaway: document.getElementById('active-giveaway-container'),
        upcomingGiveaways: document.getElementById('upcoming-giveaways-container'),
        participantsList: document.getElementById('giveaway-participants-list'),
        winnersList: document.getElementById('giveaway-winners-list'),
        hostGiveawayBtn: document.getElementById('host-giveaway-container'),
        adminTools: document.getElementById('devtools-view'),
        searchResults: document.getElementById('search-results'),
        resultsTable: document.getElementById('results-table-container'),
        simulationLoot: document.getElementById('simulation-loot-summary'),
        graph: document.getElementById('graph-container'),
        graphPlotArea: document.getElementById('graph-plot-area'),
        graphLabels: document.getElementById('graph-labels'),
        graphSvg: document.querySelector('#graph-plot-area svg'),
    },
    buttons: {
        backToCases: document.getElementById('details-to-cases-btn'),
        backToSwordList: document.getElementById('details-to-sword-list-btn'),
        prevPage: document.getElementById('other-prev-btn'),
        nextPage: document.getElementById('other-next-btn'),
        calculate: document.getElementById('calculate-btn'),
        calculateGraph: document.getElementById('calculate-graph-btn'),
            // CORRECCIÓN: Se añaden los selectores que faltaban para los botones de modo.
    modeTheoretical: document.getElementById('mode-theoretical-btn'),
    modeSimulate: document.getElementById('mode-simulate-btn'),
    modeUntilBest: document.getElementById('mode-until-best-btn'),
    modeGraph: document.getElementById('mode-graph-btn'),
    },
    inputs: {
        converterFrom: document.getElementById('converter-from-input'),
        converterTo: document.getElementById('converter-to-input'),
        searchBar: document.getElementById('search-bar'),
        caseQuantity: document.getElementById('case-quantity-input'),
        graphStep: document.getElementById('graph-step-input'),
        graphMax: document.getElementById('graph-max-input'),
    },
    modals: {
        createGiveaway: document.getElementById('create-giveaway-modal-overlay'),
        closeGiveaway: document.querySelector('#create-giveaway-modal .close-modal-btn'),
    },
    controls: {
    standard: document.getElementById('standard-controls'),
    graph: document.getElementById('graph-controls'),
    },
    converterFromName: document.getElementById('converter-from-name'),
    converterToName: document.getElementById('converter-to-name'),
};
// --- Funciones de Control de Vistas ---


export function showView(viewName) {
    Object.values(dom.views).forEach(view => { if (view) view.style.display = 'none'; });
    if (dom.views[viewName]) {
        dom.views[viewName].style.display = 'block';
    } else {
        dom.views.cases.style.display = 'block';
    }
    window.scrollTo(0, 0);
}




// --- Renderizado de la Página Principal ---


// ¡VERSIÓN CORREGIDA Y FINAL!
// Acepta appData, currencyKey y price en el orden correcto.
function getCurrencyHTML(appData, currencyKey, price) {
    if (currencyKey === 'cooldown') {
        return `<span class="currency-text">Free (Every ${price} hr)</span>`;
    }
    
    // Comprobación de seguridad
    if (!appData || !appData.currencies) {
        console.error("appData.currencies is not available in getCurrencyHTML");
        return `<span>${price}</span>`;
    }
    
    const currency = appData.currencies[currencyKey];
    
    if (!currency) {
        console.error(`Currency with key "${currencyKey}" not found.`);
        return `<span>${price}</span>`;
    }
    
    if (currency.icon) {
        return `<img src="${currency.icon}" alt="${currency.name}" class="currency-icon"> <span class="value">${price.toLocaleString()}</span>`;
    }
    
    return `<span class="currency-text">${currency.name}</span> <span class="value">${price.toLocaleString()}</span>`;
}


function generateChangeHTML(prev, curr) {
    let html = '';
    const demandOrder = { 'insane': 5, 'high': 4, 'medium': 3, 'low': 2, 'N/A': 1 };

    if (prev.value_text !== curr.value_text) {
        const prevVal = parseValue(prev.value_text);
        const currVal = parseValue(curr.value_text);
        const prevColor = prevVal > currVal ? 'new-value' : 'old-value';
        const currColor = currVal > prevVal ? 'new-value' : 'old-value';
        html += `<div class="change-row"><strong>Value:</strong> <span class="${prevColor}">${prev.value_text}</span> → <span class="${currColor}">${curr.value_text}</span></div>`;
    }
    if (prev.demand !== curr.demand) {
        const prevDemandVal = demandOrder[prev.demand] || 0;
        const currDemandVal = demandOrder[curr.demand] || 0;
        const prevColor = prevDemandVal > currDemandVal ? 'new-value' : 'old-value';
        const currColor = currDemandVal > prevDemandVal ? 'new-value' : 'old-value';
        html += `<div class="change-row"><strong>Demand:</strong> <span class="${prevColor}">${prev.demand}</span> → <span class="${currColor}">${curr.demand}</span></div>`;
    }
    return html;
}

export function renderUpdateLogPage(logData) {
    const container = document.getElementById('update-log-container');
    if (!logData || logData.length === 0) {
        container.innerHTML = '<p>No updates have been logged yet.</p>';
        return;
    }
    container.innerHTML = logData.map(log => {
        const changes = generateChangeHTML(log.previous_values, log.new_values);
        if (!changes) return ''; // No mostrar si no hay cambios relevantes
        
        return `
        <div class="reward-item ${log.sword_rarity}">
            <div class="reward-info">
                <div class="reward-image-placeholder"><img src="${log.sword_image}" alt="${log.sword_name}"></div>
                <div style="display: flex; flex-direction: column;">
                    <span class="reward-name">${log.sword_name}</span>
                    <span class="timestamp" style="font-size:0.8em; color:var(--text-secondary);">${formatTimeAgo(log.created_at)}</span>
                </div>
            </div>
            <div class="change-details">
                ${changes}
            </div>
        </div>
        `;
    }).join('');
}


// ¡VERSIÓN CORREGIDA Y FINAL!
// Asegura que los parámetros se pasen en el orden correcto a getCurrencyHTML.
export function renderCaseSelection(appData, navigateTo) {
    const container = dom.containers.cases;
    if (!container) return; // Comprobación de seguridad
    container.innerHTML = '';

    if (!appData || !appData.cases) {
        console.error("appData.cases is not available in renderCaseSelection");
        return;
    }

    Object.keys(appData.cases).forEach(caseId => {
        const data = appData.cases[caseId];
        const link = document.createElement('a');
        link.href = '#';
        link.className = 'case-link';
        link.onclick = (e) => { e.preventDefault(); navigateTo('caseDetails', caseId); };
        
        const caseItem = document.createElement('div');
        caseItem.className = 'case-item';
        caseItem.style.setProperty('--case-border-color', data.borderColor || 'var(--main-green)');
        
        // La llamada aquí es la parte crucial.
        caseItem.innerHTML = `
            <img class="case-content-image" src="${data.image}" alt="${data.name}">
            <h3 class="case-title">${data.name}</h3>
            <div class="case-price">${getCurrencyHTML(appData, data.currency, data.price)}</div>`;
            
        link.appendChild(caseItem);
        container.appendChild(link);
    });
}


export function renderOtherSwords(appData, appState, navigateTo) {
    const { currentPage, itemsPerPage } = appState;
    dom.containers.otherSwords.innerHTML = '';
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pagedItems = appData.otherSwords.slice(start, end);
    pagedItems.forEach(reward => {
        const item = createRewardItem(reward, { type: 'other' }, navigateTo);
        dom.containers.otherSwords.appendChild(item);
    });
    updatePaginationControls(appData, appState);
}

// Reemplaza esta función completa en ui.js

// Reemplaza tu función renderAdminDataView completa en ui.js

export function renderAdminDataView(appData, swords, cases, onAddSword, onEditSword, onDeleteSword, onBack, onAddCase, onEditCase, onSaveCaseOrder) {
    const container = dom.views.adminDataView;

    // --- HTML para la lista de Espadas ---
    let swordsListHTML = '<p>No swords found in the database.</p>';
    if (swords && swords.length > 0) {
        swordsListHTML = swords.map(sword => `
            <div class="reward-item ${sword.rarity || 'common'}">
                <div class="reward-info">
                    <div class="reward-image-placeholder"><img src="${sword.image_path || 'images/placeholder.png'}" alt="${sword.name}"></div>
                    <span class="reward-name">${sword.name}</span>
                </div>
                <div class="item-actions">
                    <button class="value-action-btn edit-sword-btn" data-sword-id="${sword.id}">Edit</button>
                    <button class="value-action-btn danger-btn delete-sword-btn" data-sword-id="${sword.id}">Delete</button>
                </div>
            </div>
        `).join('');
    }

// --- HTML para la lista de Cajas ---
    let casesListHTML = '<p>No cases found in the database.</p>';
    if (cases && cases.length > 0) {
        // 1. Ordenamos las cajas por su sort_order para mostrarlas correctamente
        const sortedCases = [...cases].sort((a, b) => a.sort_order - b.sort_order);
        
        // 2. Generamos el HTML para cada caja con el input de orden
        casesListHTML = sortedCases.map(caseItem => `
            <div class="admin-list-item">
                <input type="number" class="case-order-input" value="${caseItem.sort_order}" data-case-id="${caseItem.id}" title="Edit order number">
                <span class="admin-item-name">${caseItem.name}</span>
                <div class="item-actions">
                    <button class="value-action-btn edit-case-btn" data-case-id="${caseItem.id}">Edit</button>
                </div>
            </div>
        `).join('');
    }

    // --- Construimos el HTML completo de la vista ---
    container.innerHTML = `
        <button id="back-to-devtools-btn" class="back-btn">← Back to Admin Tools</button>
        <h2 class="section-title">~Manage Game Data~</h2>

        <div class="admin-section">
            <h3>Cases</h3>
            <div class="admin-controls">
                 <button id="add-new-case-btn" class="auth-button">Add New Case</button>
                 <button id="save-case-order-btn" class="auth-button">Save Order</button>
            </div>
            <div id="cases-management-list" class="admin-item-list">
                ${casesListHTML} <!-- Aquí se inserta el HTML que acabamos de generar -->
            </div>
        </div>

        <div class="admin-section">
            <h3>Swords</h3>
            <div class="admin-controls">
                <input type="text" id="admin-sword-search" placeholder="Search swords...">
                <button id="add-new-sword-btn" class="auth-button">Add New Sword</button>
            </div>
            <div id="swords-management-list" class="admin-item-list">
                ${swordsListHTML}
            </div>
        </div>
    `;

    // --- Añadimos TODOS los Event Listeners ---
    
    // Botones Generales
    document.getElementById('back-to-devtools-btn').addEventListener('click', onBack);
    
    // Sección de Espadas
    document.getElementById('add-new-sword-btn').addEventListener('click', onAddSword);
    const searchInput = document.getElementById('admin-sword-search');
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filteredSwords = swords.filter(sword => sword.name.toLowerCase().includes(query));
        
        // Para la búsqueda, necesitamos volver a renderizar la lista y re-atachar los listeners
        // Es más simple filtrar y volver a llamar a la función que renderiza la lista.
        renderAdminSwordsList(filteredSwords, onEditSword, onDeleteSword);
    });
    
    container.querySelectorAll('.edit-sword-btn').forEach(button => {
        button.addEventListener('click', () => onEditSword(button.dataset.swordId));
    });
    container.querySelectorAll('.delete-sword-btn').forEach(button => {
        button.addEventListener('click', () => onDeleteSword(button.dataset.swordId));
    });

        // --- Vinculamos el listener al nuevo botón "Save Order" ---
    document.getElementById('save-case-order-btn').addEventListener('click', onSaveCaseOrder);

    // Sección de Cajas
    document.getElementById('add-new-case-btn').addEventListener('click', onAddCase);
    container.querySelectorAll('.edit-case-btn').forEach(button => {
        button.addEventListener('click', () => onEditCase(button.dataset.caseId));
    });
}


// ¡NUEVA FUNCIÓN AUXILIAR!
// Creamos una función separada para renderizar la lista de espadas,
// así podemos llamarla desde la búsqueda sin redibujar toda la página.
export function renderAdminSwordsList(swords, onEdit, onDelete) {
    const listContainer = document.getElementById('swords-management-list');
    if (!listContainer) return;

    if (!swords || swords.length === 0) {
        listContainer.innerHTML = '<p>No swords match your search.</p>';
        return;
    }

    listContainer.innerHTML = swords.map(sword => `
        <div class="reward-item ${sword.rarity || 'common'}">
            <div class="reward-info">
                 <div class="reward-image-placeholder"><img src="${sword.image_path || 'images/placeholder.png'}" alt="${sword.name}"></div>
                 <span class="reward-name">${sword.name}</span>
            </div>
            <div class="item-actions">
                <button class="value-action-btn edit-sword-btn" data-sword-id="${sword.id}">Edit</button>
                <button class="value-action-btn danger-btn delete-sword-btn" data-sword-id="${sword.id}">Delete</button>
            </div>
        </div>
    `).join('');

    // Re-atachamos los listeners a los nuevos botones
    listContainer.querySelectorAll('.edit-sword-btn').forEach(button => {
        button.addEventListener('click', () => onEdit(button.dataset.swordId));
    });
    listContainer.querySelectorAll('.delete-sword-btn').forEach(button => {
        button.addEventListener('click', () => onDelete(button.dataset.swordId));
    });
}

// AÑADE ESTA NUEVA FUNCIÓN en ui.js

export function renderAdminCasesList(cases, onEdit) {
    const container = document.getElementById('cases-management-list');
    if (!container) return;

    if (!cases || cases.length === 0) {
        container.innerHTML = '<p>No cases found in the database.</p>';
        return;
    }

    container.innerHTML = cases.map(caseItem => `
        <div class="admin-list-item">
            <span>${caseItem.name}</span>
            <div class="item-actions">
                <button class="value-action-btn edit-case-btn" data-case-id="${caseItem.id}">Edit</button>
            </div>
        </div>
    `).join('');

    container.querySelectorAll('.edit-case-btn').forEach(button => {
        button.addEventListener('click', () => onEdit(button.dataset.caseId));
    });
}

// En ui.js, añade esta nueva función
export function renderNotificationsPage(notifications, timeFormatter) {
    const container = document.getElementById('notifications-list-container');
    if (!notifications || notifications.length === 0) {
        container.innerHTML = `<p>You have no notifications.</p>`;
        return;
    }

    container.innerHTML = notifications.map(n => {
        let contentHtml = '';
        switch (n.type) {
            case 'ban':
                contentHtml = `You have been <strong>BANNED</strong> by ${n.content.issued_by}. Reason: <em>${n.content.reason || 'Not specified'}</em>.`;
                break;
            // --- ¡NUEVO! Se añade el caso para 'unban' ---
            case 'unban':
                contentHtml = `Your account has been <strong>UNBANNED</strong> by ${n.content.unbanned_by}. Welcome back!`;
                break;
            case 'warning':
                contentHtml = `You received a <strong>WARNING</strong> from ${n.content.issued_by}. Reason: <em>${n.content.reason}</em>.`;
                break;
            case 'title_grant':
                const titleText = titleStyles[n.content.title_key]?.text || n.content.title_key;
                contentHtml = `You have been granted the title "<strong>${titleText}</strong>" by ${n.content.granted_by}.`;
                break;
            // --- ¡NUEVO! Se añade el caso para 'giveaway_win' ---
            case 'giveaway_win':
                contentHtml = `Congratulations! You won the giveaway for: <strong>${n.content.prize_summary}</strong>.`;
                break;
            default:
                contentHtml = `<p>New notification of type '${n.type}'.</p>`; // Mejoramos el default para depurar
        }
        return `
            <div class="notification-item ${n.type}">
                <p>${contentHtml}</p>
                <p class.timestamp">${timeFormatter(n.created_at)}</p>
            </div>
        `;
    }).join('');
}

// AÑADE ESTA NUEVA FUNCIÓN en ui.js

// Reemplaza tu función renderSwordEditor completa con esta versión

export function renderSwordEditor(swordData, onSave, onCancel) {
    const container = dom.views.swordEditorView;
    const isCreating = !swordData;
    // Usamos un objeto por defecto para no tener errores con 'undefined'
    const sword = swordData || { name: '', image_path: '', rarity: 'common', value_text: '0', stats_text: 'x1', exist_text: 'N/A', demand: 'N/A', description: '', is_custom: true };

    const rarities = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'godly', 'insane', 'subzero', 'staff', 'limited', 'exclusive', 'event', 'easter', 'unobtainable', 'hell', 'evil'];
    const demands = ['insane', 'high', 'medium', 'low', 'N/A'];

    container.innerHTML = `
<div class="editor-actions">
    <button id="cancel-sword-edit-btn" class="back-btn">← Cancel</button>
    <button id="save-sword-changes-btn" class="auth-button">💾 ${isCreating ? 'Create Sword' : 'Save Changes'}</button>
</div>

            <div class="form-checkbox">
                <input type="checkbox" id="edit-sword-is_custom" name="is_custom" ${sword.is_custom ? 'checked' : ''}>
                <label for="edit-sword-is_custom">Is this a custom sword? (Belongs to "Other Swords")</label>
            </div>

        <div class="sword-details-content">
            <!-- Columna Izquierda: Tarjeta de Información Editable -->
            <div id="sword-info-card" class="sword-info-card ${sword.rarity}">
                <div id="sword-demand-indicator" class="sword-demand-indicator ${sword.demand}"></div>
                <div id="sword-details-image-container">
                    <img src="${sword.image_path || 'images/placeholder.png'}" alt="${sword.name}">
                </div>
                <input type="text" id="edit-sword-name" class="editable-title" value="${sword.name}">
                <textarea id="edit-sword-description" class="editable-description">${sword.description}</textarea>
            </div>

            <!-- Columna Derecha: Cajas de Estadísticas Editables -->
            <div class="sword-stats-container">
                <div class="stat-box">
                    <h4>VALUE</h4>
                    <input type="text" id="edit-sword-value" class="editable-stat-p" value="${sword.value_text}">
                    <input type="text" id="edit-sword-image" class="editable-sub-text" placeholder="Image path..." value="${sword.image_path || ''}">
                </div>
                <div class="stat-box">
                    <h4>STATS</h4>
                    <input type="text" id="edit-sword-stats" class="editable-stat-p" value="${sword.stats_text}">
                </div>
                <div class="stat-box">
                    <h4>MORE</h4>
                    <div class="editable-more">
                        <span>Chance - <input type="text" id="edit-sword-chance" value="N/A (Set in Case)" disabled></span>
                        <span>Exist - <input type="text" id="edit-sword-exist" value="${sword.exist_text}"></span>
                        <span>Rarity - 
                            <select id="edit-sword-rarity">
                                ${rarities.map(r => `<option value="${r}" ${sword.rarity === r ? 'selected' : ''}>${r}</option>`).join('')}
                            </select>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    `;

    // --- Lógica para recolectar los datos y guardar ---
    const saveButton = document.getElementById('save-sword-changes-btn');
    saveButton.addEventListener('click', () => {
        const updatedSwordData = {
            id: sword.id, // Mantenemos el ID si estamos editando
            name: document.getElementById('edit-sword-name').value,
            image_path: document.getElementById('edit-sword-image').value,
            rarity: document.getElementById('edit-sword-rarity').value,
            value_text: document.getElementById('edit-sword-value').value,
            stats_text: document.getElementById('edit-sword-stats').value,
            exist_text: document.getElementById('edit-sword-exist').value,
            demand: sword.demand, // Por ahora lo mantenemos simple, luego lo haremos interactivo
            description: document.getElementById('edit-sword-description').value,
        // ¡CORRECCIÓN! Leemos el valor del checkbox
        is_custom: document.getElementById('edit-sword-is_custom').checked
        };
        onSave(updatedSwordData);
    });

    document.getElementById('cancel-sword-edit-btn').addEventListener('click', onCancel);
}

// AÑADE ESTA NUEVA FUNCIÓN en ui.js

// Reemplaza tu función renderCaseEditor completa con esta versión en ui.js

export function renderCaseEditor(caseData, allSwords, onSave, onCancel) {
    const isCreating = !caseData;
    const caseItem = caseData || {};
    let currentRewards = caseData?.rewards || []; // Estado local para las recompensas

    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'auth-modal-overlay visible';
    modalOverlay.style.display = 'flex';

    // --- Función interna para renderizar la lista de recompensas ---
    const renderRewardList = () => {
        const container = document.getElementById('case-rewards-editor');
        if (!container) return;
        
        if (currentRewards.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No rewards added to this case yet.</p>';
            return;
        }

        container.innerHTML = currentRewards.map(reward => {
            const sword = allSwords.find(s => s.id === reward.sword_id);
            return `
                <div class="reward-item ${sword ? sword.rarity : 'common'}">
                    <div class="reward-info">
                        <div class="reward-image-placeholder"><img src="${sword ? sword.image_path : ''}" alt="${sword ? sword.name : ''}"></div>
                        <span class="reward-name">${sword ? sword.name : 'Unknown Sword'}</span>
                    </div>
                    <div class="item-actions">
                        <input type="number" class="chance-input" data-sword-id="${reward.sword_id}" value="${reward.chance}" step="0.01" placeholder="Chance %">
                        <button type="button" class="value-action-btn danger-btn remove-reward-btn" data-sword-id="${reward.sword_id}">Remove</button>
                    </div>
                </div>
            `;
        }).join('');
    };
    
    // --- Función interna para renderizar los resultados de búsqueda ---
    const renderSearchResults = (query) => {
        const container = document.getElementById('reward-search-results');
        if (!query) {
            container.style.display = 'none';
            return;
        }
        const existingRewardIds = new Set(currentRewards.map(r => r.sword_id));
        const results = allSwords.filter(s => 
            s.name.toLowerCase().includes(query) && !existingRewardIds.has(s.id)
        ).slice(0, 5);

        if (results.length > 0) {
            container.innerHTML = results.map(sword => `
                 <div class="reward-item ${sword.rarity}">
                    <div class="reward-info">
                        <div class="reward-image-placeholder"><img src="${sword.image_path}" alt="${sword.name}"></div>
                        <span class="reward-name">${sword.name}</span>
                    </div>
                    <div class="item-actions">
                        <button type="button" class="value-action-btn add-reward-btn" data-sword-id="${sword.id}">Add</button>
                    </div>
                </div>
            `).join('');
            container.style.display = 'block';
        } else {
            container.style.display = 'none';
        }
    };

    // Función para verificar si un string es un color hexadecimal válido de 6 dígitos
    const isValidHexColor = (str) => /^#[0-9A-F]{6}$/i.test(str);

    modalOverlay.innerHTML = `
        <div class="auth-modal" style="max-width: 800px; max-height: 90vh; display: flex; flex-direction: column;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <h2>${isCreating ? 'Create New Case' : 'Edit Case'}</h2>
                <button class="close-modal-btn">&times;</button>
            </div>
            <form id="case-editor-form" class="admin-form" style="overflow-y: auto; flex-grow: 1; padding-right: 15px;">
                <input type="hidden" name="id" value="${caseItem.id || ''}">
                <div class="form-grid">
                    <input type="text" name="name" placeholder="Case Name" value="${caseItem.name || ''}" required>
                    <input type="text" name="image_path" placeholder="Image Filename" value="${caseItem.image_path || ''}">
                    <input type="text" name="price" placeholder="Price (e.g., 10k)" value="${caseItem.price || ''}">
                    <input type="text" name="currency" placeholder="Currency (e.g., time)" value="${caseItem.currency || ''}">
    <div class="color-picker-wrapper">
        <input type="text" name="border_color" id="case-border-color-text" placeholder="Border Color (CSS value)" value="${caseItem.border_color || ''}">
        
        <!-- ¡CAMBIO! Usamos la función para poner un valor por defecto si no es válido -->
        <input type="color" id="case-border-color-picker" value="${isValidHexColor(caseItem.border_color) ? caseItem.border_color : '#000000'}">
    </div>
                </div>
                
                <hr style="border-color: var(--border-color); margin: 20px 0;">

                <h3>Rewards in this Case</h3>
                <div id="case-rewards-editor" class="admin-item-list"></div>
                
                <div class="reward-adder">
                    <input type="text" id="reward-search-input" placeholder="Search a sword to add...">
                    <div id="reward-search-results"></div>
                </div>
            </form>
            <div class="form-actions" style="margin-top: 20px;">
                 <button type="submit" form="case-editor-form" class="auth-button" style="width: 100%;">💾 ${isCreating ? 'Create Case' : 'Save Changes'}</button>
            </div>
        </div>
    `;

    document.body.appendChild(modalOverlay);
    renderRewardList(); // Renderizamos la lista inicial

    // --- Lógica de Event Listeners del Modal ---
    const closeModal = () => document.body.removeChild(modalOverlay);
    modalOverlay.querySelector('.close-modal-btn').addEventListener('click', closeModal);

       // ¡NUEVO! Sincronizamos el selector de color y el texto
    const colorText = document.getElementById('case-border-color-text');
    const colorPicker = document.getElementById('case-border-color-picker');
    colorText.addEventListener('input', (e) => colorPicker.value = e.target.value);
    colorPicker.addEventListener('input', (e) => colorText.value = e.target.value);

    const rewardsContainer = document.getElementById('case-rewards-editor');
    rewardsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-reward-btn')) {
            const swordId = e.target.dataset.swordId;
            currentRewards = currentRewards.filter(r => r.sword_id !== swordId);
            renderRewardList();
        }
    });
    rewardsContainer.addEventListener('input', (e) => {
        if (e.target.classList.contains('chance-input')) {
            const swordId = e.target.dataset.swordId;
            const reward = currentRewards.find(r => r.sword_id === swordId);
            if(reward) reward.chance = parseFloat(e.target.value) || 0;
        }
    });

    const searchInput = document.getElementById('reward-search-input');
    searchInput.addEventListener('input', () => renderSearchResults(searchInput.value.toLowerCase()));
    
    const searchResultsContainer = document.getElementById('reward-search-results');
    searchResultsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('add-reward-btn')) {
            const swordId = e.target.dataset.swordId;
            currentRewards.push({ case_id: caseItem.id, sword_id: swordId, chance: 0 });
            searchInput.value = '';
            renderSearchResults('');
            renderRewardList();
        }
    });

    modalOverlay.querySelector('#case-editor-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const updatedCaseData = Object.fromEntries(formData.entries());
        onSave(updatedCaseData, currentRewards); // ¡Ahora enviamos también las recompensas!
        closeModal();
    });
}

export function updatePaginationControls(appData, appState) {
    const totalPages = Math.ceil(appData.otherSwords.length / appState.itemsPerPage);
    dom.buttons.prevPage.disabled = appState.currentPage === 1;
    dom.buttons.nextPage.disabled = appState.currentPage === totalPages;
}




// --- Renderizado de Detalles (Caja y Espada) ---

// 1. REEMPLAZA tu función createRewardItemHTML con esta
function createRewardItemHTML(reward, source) {
    const isCaseReward = source.type === 'case';
    // Usamos 'value_text' para el parseo, ya que es el que viene de la DB
    const numericValue = parseValue(reward.value_text); 
    
    // El tooltip debe mostrar el texto original
    const valueDisplayHTML = (typeof reward.value_text === 'string' && reward.value_text.toUpperCase().startsWith('O/C'))
      ? `<span class="value-oc" title="Estimated Value: ${reward.value_text}">O/C</span>`
      : formatLargeNumber(numericValue);

    return `
      <div class="reward-info">
        <div class="reward-image-placeholder"><img src="${reward.image}" alt="${reward.name}"></div>
        <span class="reward-name">${reward.name}</span>
      </div>
      <div class="reward-stats">
        ${isCaseReward ? `<span>${reward.chance}%</span>` : '<span class="no-chance">--</span>'}
        <div class="reward-value">
          <span class="value-display">${valueDisplayHTML}</span>
          <div class="value-input-wrapper">
              <input type="text" class="value-input" data-sword-id="${reward.id}" value="${numericValue}">
          </div>
        </div>
        <span>${reward.stats_text}</span>
      </div>`;
}

// REEMPLAZA tu función createRewardItem con esta versión
export function createRewardItem(reward, source, navigateTo) {
  const item = document.createElement('div');
  item.className = `reward-item ${reward.rarity}`;
  const itemHTML = createRewardItemHTML(reward, source);
  item.innerHTML = itemHTML;
  
  // CORRECCIÓN: Se añade una comprobación para el modo edición
  item.addEventListener('click', (event) => {
    // Si el ítem está en modo edición o si el clic fue en el input, no navegamos.
    if (item.classList.contains('edit-mode') || event.target.tagName === 'INPUT') {
      return;
    }
    navigateTo('swordDetails', { sword: reward, source });
  });
  
  return item;
}

// AÑADE ESTA NUEVA FUNCIÓN en ui.js
// Esta función crea una versión SIMPLIFICADA de un ítem solo para la búsqueda.
export function createSearchResultItem(reward, source, navigateTo) {
    const item = document.createElement('div');
    // Aplicamos las mismas clases para que herede los estilos de borde y rareza
    item.className = `reward-item ${reward.rarity}`;
    
    // HTML mucho más simple: solo imagen y nombre.
    item.innerHTML = `
        <div class="reward-info">
            <div class="reward-image-placeholder">
                <img src="${reward.image}" alt="${reward.name}">
            </div>
            <span class="reward-name">${reward.name}</span>
        </div>
    `;
    
    // El evento de clic sigue funcionando igual para llevar a los detalles.
    item.addEventListener('click', () => {
        navigateTo('swordDetails', { sword: reward, source });
    });

    return item;
}


export function renderCaseDetailsHeader(appData, caseData) {
    if (!caseData) return;
    document.getElementById('details-case-image').src = caseData.image;
    document.getElementById('details-case-name').textContent = caseData.name;
    document.getElementById('details-case-price').innerHTML = getCurrencyHTML(appData, caseData.currency, caseData.price);
    document.querySelector('#case-details-view .info-column').style.setProperty('--case-border-color', caseData.borderColor || 'var(--main-green)');
}

// Esta función (que antes era todo renderCaseDetails) ahora se llama desde main.js
// y solo se encarga de mostrar la vista. Los datos ya han sido procesados.
export function renderCaseDetails(caseId, navigateTo) {
    // La lógica de renderizado ahora está en `renderRewardSection` en main.js
    // Esta función mantiene la estructura por si se necesita en el futuro,
    // pero la acción principal es solo mostrar la vista.
    clearCalculator({ calculatorMode: 'theoretical' }); // Resetea la calculadora
    showView('caseDetails');
}


function parseAndSetDescription(appData, element, text, navigateTo) {
    element.innerHTML = '';
    if (!text) { element.textContent = 'No description available.'; return; }
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
            linkData = findSwordById(appData, id);
            if (linkData) {
                link.textContent = linkData.sword.name;
                link.className = 'sword-link-in-description';
                link.onclick = (e) => { e.preventDefault(); navigateTo('swordDetails', linkData); };
            }
        }
        if (link.textContent) fragment.appendChild(link);
        else fragment.appendChild(document.createTextNode(fullMatch));
        lastIndex = regex.lastIndex;
    }
    fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
    element.appendChild(fragment);
}


export function renderSwordDetails(appData, sword, sourceInfo, navigateTo, onNewInterval) {
    const swordInfoCard = document.getElementById('sword-info-card');
    swordInfoCard.className = 'sword-info-card';
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
    
    const fullDescription = sword.description || (sourceInfo.id ? `This sword is obtainable from the [case:${sourceInfo.id}].` : 'No origin specified.');
    parseAndSetDescription(appData, document.getElementById('sword-details-description'), fullDescription, navigateTo);

    // ¡AQUÍ ESTÁ LA CORRECCIÓN FINAL!
    document.getElementById('sword-details-value').textContent = sword.value_text;
    document.getElementById('sword-details-stats').textContent = sword.stats_text;
    
    document.getElementById('sword-details-more').innerHTML = `
        ${sword.chance ? `Chance - ${sword.chance}%<br>` : ''}
        Exist - ${sword.exist_text}<br>
        Rarity - <span class="rarity-text ${sword.rarity}">${sword.rarity}</span>`;
    
    const lastUpdated = sword.lastUpdated || sword.updated_at;
    const updatedEl = document.getElementById('sword-details-updated');
    const updateSwordTime = () => updatedEl.textContent = formatTimeAgo(lastUpdated);
    
    updateSwordTime();
    if (onNewInterval) {
        onNewInterval(setInterval(updateSwordTime, 60000));
    }
    showView('swordDetails');
}

// --- Renderizado de la Calculadora ---


// REEMPLAZA TU FUNCIÓN ANTIGUA CON ESTA VERSIÓN COMPLETA
export function clearCalculator(appState) {
  // 1. Limpia cualquier resultado de un cálculo anterior
  dom.containers.simulationLoot.style.display = 'none';
  dom.containers.resultsTable.innerHTML = '';
  dom.containers.graph.style.display = 'none';
  if (dom.containers.graphSvg) dom.containers.graphSvg.innerHTML = '';
  if (dom.containers.graphLabels) dom.containers.graphLabels.innerHTML = '';

  // 2. Muestra/oculta los paneles de control según el modo seleccionado
  const isGraphMode = appState.calculatorMode === 'graph';
  dom.controls.standard.style.display = isGraphMode ? 'none' : 'flex';
  dom.controls.graph.style.display = isGraphMode ? 'flex' : 'none';

  // 3. Ajusta los inputs y botones para el modo "Until Best"
  const isUntilBestMode = appState.calculatorMode === 'untilBest';
  if (isUntilBestMode) {
    dom.inputs.caseQuantity.value = '';
    dom.inputs.caseQuantity.placeholder = "Not applicable";
    dom.inputs.caseQuantity.disabled = true;
    dom.buttons.calculate.textContent = 'Start Hunt';
  } else {
    dom.inputs.caseQuantity.placeholder = "Enter amount...";
    dom.inputs.caseQuantity.disabled = false;
    dom.buttons.calculate.textContent = 'Calculate';
  }
}

export function renderResultsTable(appData, data, appState) {
    dom.containers.resultsTable.innerHTML = '';
    const quantity = data.quantityOverride || parseInt(dom.inputs.caseQuantity.value, 10) || 1;
    const resultClass = data.result >= 0 ? 'profit' : 'loss';
    const resultSign = data.result >= 0 ? '+' : '';
    const profitPerCase = data.result / quantity;
    const profitPercentage = data.totalCost > 0 ? (data.result / data.totalCost) * 100 : (data.result > 0 ? Infinity : 0);
    const profitPercentageDisplay = isFinite(profitPercentage) ? `${profitPercentage.toFixed(2)}%` : `∞%`;
    let totalCostDisplay;
    const currentCaseData = appData.cases[appState.currentCaseIdForCalc];
    if (currentCaseData && currentCaseData.currency === 'cooldown') {
        totalCostDisplay = formatHours(data.totalCost);
    } else {
        totalCostDisplay = formatLargeNumber(data.totalCost);
    }
    const tableHTML = `
        <table id="results-table">
            <thead>
                <tr>
                    <th>${appState.calculatorMode === 'theoretical' ? 'Expected Value' : 'Total Value'}</th>
                    <th>Total Cost</th>
                    <th>Net Result</th>
                    <th>Result/Case</th>
                    <th>Profit %</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>${formatLargeNumber(data.totalValueGained)}</td>
                    <td>${totalCostDisplay}</td>
                    <td class="${resultClass}">${resultSign}${formatLargeNumber(data.result)}</td>
                    <td class="${resultClass}">${resultSign}${formatLargeNumber(profitPerCase)}</td>
                    <td class="${resultClass}">${profitPercentageDisplay}</td>
                </tr>
            </tbody>
        </table>`;
    dom.containers.resultsTable.innerHTML = tableHTML;
}


export function renderSimulationLoot(appData, wonItems) {
    dom.containers.simulationLoot.style.display = 'block';
    if (Object.keys(wonItems).length === 0) {
        dom.containers.simulationLoot.innerHTML = '<h4>Loot Summary</h4><p>No items won in this simulation.</p>';
        return;
    }
    let listHTML = '<h4>Loot Summary</h4><ul>';
    for (const rewardId in wonItems) {
          // ¡CAMBIO! Pasamos appData a findSwordById
        const rewardData = findSwordById(appData, rewardId)?.sword;
        if (rewardData) {
            listHTML += `<li>${wonItems[rewardId]}x <span class="rarity-text ${rewardData.rarity}">${rewardData.name}</span></li>`;
        }
    }
    listHTML += '</ul>';
    dom.containers.simulationLoot.innerHTML = listHTML;
}


export function renderHuntResult(appData, result) {
    dom.containers.simulationLoot.style.display = 'block';
    if (result.found) {
        dom.containers.simulationLoot.innerHTML = `<h4>Hunt Result</h4><p>It took <strong>${result.casesOpened.toLocaleString()}</strong> cases to find <span class="rarity-text ${result.bestReward.rarity}">${result.bestReward.name}</span>!</p>`;
    } else {
        dom.containers.simulationLoot.innerHTML = `<h4>Hunt Result</h4><p style="color:var(--insane);">Did not find the ${result.bestReward.name} within ${result.maxAttempts.toLocaleString()} cases. This is a super rare item!</p>`;
    }
}


export function renderProfitGraph(appData, results, MAX_GRAPH_SECTIONS) {
    if (results.length > MAX_GRAPH_SECTIONS) {
        dom.containers.resultsTable.innerHTML = `<p class="error-message" style="display:block;">Too many sections requested (Max: ${MAX_GRAPH_SECTIONS}).</p>`;
        return;
    }
    dom.containers.graph.style.display = 'block';
    const tooltip = document.querySelector('.graph-tooltip');
    dom.containers.graphSvg.innerHTML = '';
    dom.containers.graphLabels.innerHTML = '';
    if (results.length < 2) return;
   
    const isPercentage = results[0].isPercentage;
    const yAxisLabel = isPercentage ? 'Profit %' : 'Net Gain (Time)';
    const padding = { top: 20, right: 20, bottom: 20, left: 20 };
    const width = dom.containers.graphSvg.clientWidth;
    const height = dom.containers.graphSvg.clientHeight;
    if (width === 0 || height === 0) return;
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const minCases = results[0].cases;
    const maxCases = results[results.length - 1].cases;
    const yValues = results.map(r => r.value);
    const yMin = Math.min(0, ...yValues);
    const yMax = Math.max(0, ...yValues);
    const yRange = (yMax - yMin) === 0 ? 1 : (yMax - yMin);
    const yDomainMin = yMin - yRange * 0.1;
    const yDomainMax = yMax + yRange * 0.1;


    const xScale = (cases) => padding.left + ((cases - minCases) / (maxCases - minCases)) * chartWidth;
    const yScale = (val) => padding.top + chartHeight - ((val - yDomainMin) / (yDomainMax - yDomainMin)) * chartHeight;


    const createLineSegment = (p1, p2, isPositive) => {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', p1.x); line.setAttribute('y1', p1.y);
        line.setAttribute('x2', p2.x); line.setAttribute('y2', p2.y);
        line.setAttribute('class', isPositive ? 'graph-profit-line' : 'graph-loss-line');
        dom.containers.graphSvg.appendChild(line);
    };


    const zeroY = yScale(0);
    if (zeroY >= padding.top && zeroY <= height - padding.bottom) {
        const zeroLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        zeroLine.setAttribute('x1', padding.left); zeroLine.setAttribute('y1', zeroY);
        zeroLine.setAttribute('x2', width - padding.right); zeroLine.setAttribute('y2', zeroY);
        zeroLine.setAttribute('class', 'graph-zero-line');
        dom.containers.graphSvg.appendChild(zeroLine);
    }
    for (let i = 0; i < results.length - 1; i++) {
        const p1 = results[i]; const p2 = results[i + 1];
        const p1_coords = { x: xScale(p1.cases), y: yScale(p1.value) };
        const p2_coords = { x: xScale(p2.cases), y: yScale(p2.value) };
        if (p1.value * p2.value < 0) {
            const m = (p2.value - p1.value) / (p2.cases - p1.cases);
            const x_intersect = p1.cases - p1.value / m;
            const intersect_coords = { x: xScale(x_intersect), y: yScale(0) };
            createLineSegment(p1_coords, intersect_coords, p1.value >= 0);
            createLineSegment(intersect_coords, p2_coords, p2.value >= 0);
        } else { createLineSegment(p1_coords, p2_coords, p1.value >= 0); }
    }
    results.forEach(d => {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        const cx = xScale(d.cases); const cy = yScale(d.value);
        circle.setAttribute('cx', cx); circle.setAttribute('cy', cy);
        circle.setAttribute('class', `graph-data-point ${d.value >= 0 ? 'profit' : 'loss'}`);
        circle.addEventListener('mouseover', () => {
            tooltip.style.display = 'block';
            tooltip.style.left = `${cx}px`; tooltip.style.top = `${cy}px`;
            const sign = d.value > 0 ? '+' : '';
            const valueText = isPercentage ? `${sign}${d.value.toFixed(2)}%` : `${sign}${formatLargeNumber(d.value)}`;
            tooltip.innerHTML = `Cases: <strong>${d.cases.toLocaleString()}</strong><br>${yAxisLabel}: <strong class="tooltip-value ${d.value >= 0 ? 'profit' : 'loss'}">${valueText}</strong>`;
        });
        circle.addEventListener('mouseout', () => { tooltip.style.display = 'none'; });
        dom.containers.graphSvg.appendChild(circle);
    });


    const numLabels = Math.min(results.length, 6);
    const labelIndices = numLabels <= 1 ? [0] : Array.from({ length: numLabels }, (_, i) => Math.floor(i * (results.length - 1) / (numLabels - 1)));
    if (results.length > 0) {
        dom.containers.graphLabels.innerHTML = labelIndices.map(i => `<span>${formatLargeNumber(results[i].cases)}</span>`).join('');
    }
}




// --- Renderizado de Títulos, Sorteos y Admin ---
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
    if (title.key === selectedKey) item.classList.add('selected');

    // CORRECCIÓN: Calculamos el estilo de borde y brillo específico para CADA título.
    const titleBorderStyle = styleInfo.style; // Puede ser un color o un gradiente
    const titleGlowColor = styleInfo.style.includes('gradient') ? 'rgba(255,255,255,0.4)' : styleInfo.style;

    // Asignamos estos estilos a las variables CSS del elemento.
    item.style.setProperty('--title-border-style', titleBorderStyle);
    item.style.setProperty('--title-glow-color', titleGlowColor);

    // El onClick ahora llama a la función `onSelect` que le pasamos (handleTitleSelection).
     item.onclick = () => onSelect(title.key);
    
    item.innerHTML = `
      <span class="title-name ${styleInfo.style.includes('gradient') ? 'gradient' : ''}"
            style="${styleInfo.style.includes('gradient') ? `background-image: ${styleInfo.style}` : `color: ${styleInfo.style}`}">
        ${styleInfo.text}
      </span>
      ${!title.unlocked ? '<span class="lock-icon">🔒</span>' : ''}`;
    dom.containers.titlesList.appendChild(item);
  });
  renderTitleDetails(titlesData.find(t => t.key === selectedKey), onEquip);
}

function renderTitleDetails(title, onEquip) {
   const container = dom.containers.titleDetails;
  if (!title) {
    container.innerHTML = '<p>Select a title from the list to see its details.</p>';
    container.style.setProperty('--selected-title-border', 'var(--border-color)');
    return;
  }
  const styleInfo = titleStyles[title.key] || titleStyles['player'];

  // CORRECCIÓN: Actualizamos dinámicamente el color del borde del panel derecho.
  const titleBorderStyle = styleInfo.style;
  container.style.setProperty('--selected-title-border', titleBorderStyle);

  container.innerHTML = `
    <h3 class="${styleInfo.style.includes('gradient') ? 'gradient' : ''}"
        style="${styleInfo.style.includes('gradient') ? `background-image: ${styleInfo.style}` : `color: ${styleInfo.style}`}">
      ${styleInfo.text}
    </h3>
    <p>${titleStyles[title.key]?.description || 'No description available.'}</p>
    <button id="equip-title-btn" class="auth-button ${title.equipped ? 'equipped' : ''}">
      ${title.equipped ? 'Equipped' : 'Equip Title'}
    </button>`;
  const equipBtn = document.getElementById('equip-title-btn');
  if (title.unlocked && !title.equipped) {
    equipBtn.onclick = () => onEquip(title.key);
  } else {
    equipBtn.disabled = true;
  }
}

export function renderGiveawayPage(appData, giveaways, recentWinners, currentUser, onJoin, onHost) {
    const activeGiveaway = giveaways.find(gw => gw.status === 'active');
    renderActiveGiveaway(appData, activeGiveaway, currentUser, onJoin);
    renderUpcomingGiveaways(appData, giveaways.filter(gw => gw.status === 'upcoming'));
    renderParticipants(activeGiveaway ? activeGiveaway.participants : []);
    renderRecentWinners(appData, recentWinners);
    dom.containers.hostGiveawayBtn.innerHTML = '';
    if (currentUser && ['owner', 'tester'].includes(currentUser.role)) {
        const hostBtn = document.createElement('button');
        hostBtn.id = 'host-giveaway-btn';
        hostBtn.className = 'auth-button';
        hostBtn.textContent = 'Host a Giveaway';
        hostBtn.onclick = onHost;
        dom.containers.hostGiveawayBtn.appendChild(hostBtn);
    }
    showView('giveaways');
}


function renderActiveGiveaway(appData, giveaway, currentUser, onJoin) {
    const container = dom.containers.activeGiveaway;
    if (!giveaway) {
        container.innerHTML = `<div class="giveaway-card"><h2>There are no active giveaways right now. Check back soon!</h2></div>`;
        return;
    }
    const prizeListHTML = giveaway.prize_pool.map(prize => `<div class="prize-item">${getPrizeItemHtml(appData, prize)}</div>`).join('');
    const isJoined = giveaway.participants?.some(p => p.username === currentUser?.username);
    container.innerHTML = `
        <div id="active-giveaway-card" class="giveaway-card">
            <div class="card-header">
                <h2>A GIVEAWAY IS ACTIVE!</h2>
                <span class="host-info">Hosted by: <strong>${giveaway.created_by}</strong></span>
            </div>
            <div id="prize-pool-container">
                <div class="prize-pool-title">Prize Pool</div>
                <div id="prize-pool-list">${prizeListHTML}</div>
            </div>
            <div id="giveaway-timer-container">
                <div id="giveaway-timer" data-endtime="${giveaway.end_time}"></div>
                <span class="timer-label">TIME LEFT</span>
            </div>
            <button id="join-giveaway-btn" class="auth-button" ${isJoined || !currentUser ? 'disabled' : ''}>
                ${!currentUser ? 'Log in to Join' : isJoined ? 'You Have Joined!' : 'Join Giveaway'}
            </button>
        </div>`;
    if (currentUser && !isJoined) {
        document.getElementById('join-giveaway-btn').onclick = () => onJoin(giveaway.id);
    }
}


function renderUpcomingGiveaways(appData, giveaways) {
    const container = dom.containers.upcomingGiveaways;
    container.innerHTML = '';
    if (giveaways.length === 0) return;
    container.innerHTML = '<h3>Upcoming Giveaways</h3>';
    const list = document.createElement('div');
    list.id = 'upcoming-giveaways-list';
    giveaways.slice(0, 5).forEach(gw => {
        const prizeText = gw.prize_pool.map(p => `${formatLargeNumber(p.amount)}${p.type === 'sword' ? 'x' : ''} ${p.type === 'currency' ? (appData.currencies[p.id] ? appData.currencies[p.id].name : p.id) : (findSwordById(p.id) ? findSwordById(p.id).sword.name : p.id)}`).join(' + ');
        list.innerHTML += `
            <div class="upcoming-giveaway-item">
                <span class="prize">${prizeText}</span>
                <span class="time">Starts: ${new Date(gw.start_time).toLocaleString()}</span>
            </div>`;
    });
    container.appendChild(list);
}

// NUEVO: Función auxiliar para crear la tarjeta de usuario estilizada
function createUserProfileCardHTML(user) {
  if (!user) return ''; // Guarda contra usuarios nulos
  const styleInfo = titleStyles[user.equippedTitle] || titleStyles['player'];
  const titleBorderStyle = styleInfo.style.includes('gradient') ? styleInfo.style : styleInfo.style;
  
  return `
    <div class="giveaway-user-card" style="--user-title-border: ${titleBorderStyle};">
      <img class="user-avatar" src="${user.avatar || 'images/placeholder.png'}" alt="${user.username}">
      <div class="user-info">
        <span class="user-name">@${user.username}</span>
        <span class="user-title ${styleInfo.style.includes('gradient') ? 'gradient' : ''}" 
              style="${styleInfo.style.includes('gradient') ? `background-image: ${styleInfo.style}` : `color: ${styleInfo.style}`}">
          ${styleInfo.text}
        </span>
      </div>
    </div>
  `;
}

// MODIFICADO: renderParticipants ahora usa la nueva tarjeta
function renderParticipants(participants) {
  const list = dom.containers.participantsList;
  if (!participants || participants.length === 0) {
    list.innerHTML = '<p>No participants yet.</p>';
    return;
  }
  // Mapeamos cada participante a la nueva tarjeta HTML
  list.innerHTML = participants.map(pUser => createUserProfileCardHTML(pUser)).join('');
}

// MODIFICADO: renderRecentWinners ahora usa la nueva tarjeta
function renderRecentWinners(appData, winners) {
  const list = dom.containers.winnersList;
  if (!winners || winners.length === 0) {
    list.innerHTML = '<p>No recent winners.</p>';
    return;
  }
  list.innerHTML = winners.map(w => {
    const prizeText = w.prize_pool.map(p =>
      `${formatLargeNumber(p.amount)}${p.type === 'sword' ? 'x' : ''} ${p.type === 'currency' ? (appData.currencies[p.id]?.name || p.id) : (findSwordById(p.id)?.sword.name || p.id)}`
    ).join(' + ');
    
    // Creamos una tarjeta para el ganador y debajo mostramos el premio
    return `
      <div class="winner-item">
        ${createUserProfileCardHTML(w.profile)}
        <div class="winner-prize">Won: <strong>${prizeText}</strong></div>
      </div>
    `;
  }).join('');
}



export function openGiveawayModal() {
    dom.modals.createGiveaway.style.display = 'flex';
    setTimeout(() => dom.modals.createGiveaway.classList.add('visible'), 10);
}


export function closeGiveawayModal() {
    dom.modals.createGiveaway.classList.remove('visible');
    setTimeout(() => dom.modals.createGiveaway.style.display = 'none', 300);
}

// Reemplaza tu función renderAdminTools por esta versión completa y corregida
export function renderAdminTools(onAdminAction, onManageDataClick) {
    const container = dom.containers.adminTools;
    container.innerHTML = `
    <!-- ¡ESTE BLOQUE FALTABA! LO AÑADIMOS DE NUEVO -->
    <div class="admin-tool-card">
        <h3>Admin Panel</h3>
        <p>Manage game data, users, and more.</p>
        <button id="manage-data-btn" class="auth-button">Manage Game Data</button>
    </div>
    
    <div class="admin-tool-card">
        <h3>Grant Title to User</h3>
        <form id="grant-title-form" class="admin-form">
            <input type="text" name="targetUsername" placeholder="Enter Roblox Username..." required>
            <select name="titleKey" required>
                <option value="" disabled selected>Select a Title to Grant</option>
                ${Object.keys(titleStyles).map(key => `<option value="${key}">${titleStyles[key].text}</option>`).join('')}
            </select>
            <button type="submit" class="auth-button">Grant Title</button>
            <div id="grant-title-feedback" class="feedback-message"></div>
        </form>
    </div>

    <div class="admin-tool-card">
        <h3>Warn User</h3>
        <form id="warn-user-form" class="admin-form">
            <input type="text" name="targetUsername" placeholder="Enter Roblox Username..." required>
            <textarea name="reason" placeholder="Reason for the warning..." required></textarea>
            <button type="submit" name="action" value="warnUser" class="auth-button warning-btn">Issue Warning</button>
            <div id="warn-user-feedback" class="feedback-message"></div>
        </form>
    </div>

    <div class="admin-tool-card">
        <h3>Ban / Unban User</h3>
        <form id="ban-user-form" class="admin-form">
            <input type="text" name="targetUsername" placeholder="Enter Roblox Username..." required>
            <textarea name="reason" placeholder="Ban reason (optional for unban)"></textarea>
            <label for="unbanDate">Ban expires at (leave empty for permanent)</label>
            <input type="datetime-local" name="unbanDate">
            <div class="form-actions">
                <button type="submit" name="action" value="banUser" class="auth-button danger-btn">Ban User</button>
                <button type="submit" name="action" value="unbanUser" class="auth-button">Unban User</button>
            </div>
            <div id="ban-user-feedback" class="feedback-message"></div>
        </form>
    </div>
    `;

    // Ahora esta línea encontrará el botón que acabamos de añadir
    document.getElementById('manage-data-btn').addEventListener('click', onManageDataClick);

    // El resto de los event listeners ya estaban bien
    document.getElementById('grant-title-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const form = e.target;
        onAdminAction('grantTitle', form.targetUsername.value, { titleKey: form.titleKey.value }, 'grant-title-feedback');
    });

    document.getElementById('warn-user-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const form = e.target;
        onAdminAction('warnUser', form.targetUsername.value, { reason: form.reason.value }, 'warn-user-feedback');
    });

    document.getElementById('ban-user-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const form = e.target;
        const action = e.submitter.value;
        const payload = {
            reason: form.reason.value,
            unbanDate: form.unbanDate.value ? new Date(form.unbanDate.value).toISOString() : null
        };
        onAdminAction(action, form.targetUsername.value, payload, 'ban-user-feedback');
    });
}

export function updateProfileHeader(userData) {
    const userProfileNav = document.getElementById('user-profile-nav');
    const titleElement = document.getElementById('user-title');
    document.getElementById('user-name').textContent = `@${userData.username}`;
    document.getElementById('user-avatar').src = userData.avatar || 'images/placeholder.png';


    const styleInfo = titleStyles[userData.equippedTitle] || titleStyles['player'];
    titleElement.textContent = styleInfo.text;


    if (styleInfo.style.includes('gradient')) {
        titleElement.classList.add('gradient');
        titleElement.style.backgroundImage = styleInfo.style;
        titleElement.style.color = '';
        userProfileNav.style.setProperty('--border-gradient', styleInfo.style);
    } else {
        titleElement.classList.remove('gradient');
        titleElement.style.backgroundImage = '';
        titleElement.style.color = styleInfo.style;
        userProfileNav.style.setProperty('--border-gradient', `linear-gradient(to right, ${styleInfo.style}, ${styleInfo.style})`);
    }
}