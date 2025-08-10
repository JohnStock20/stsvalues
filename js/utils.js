// =================================================================================
// ARCHIVO: utils.js
// Contiene funciones de utilidad reutilizables en toda la aplicación.
// =================================================================================

// --- Funciones de Búsqueda ---
export function findSwordById(swordId) {
    // Buscar en las recompensas de las cajas
    for (const caseId in appData.cases) {
        const reward = appData.cases[caseId].rewards.find(r => r.id === swordId);
        if (reward) {
            return { sword: reward, source: { type: 'case', id: caseId } };
        }
    }
    // Buscar en la lista de otras espadas
    const otherSword = appData.otherSwords.find(s => s.id === swordId);
    if (otherSword) {
        return { sword: otherSword, source: { type: 'other', id: null } };
    }
    return null;
}

// --- Funciones de Moneda ---
export function getUnitValue(currencyKey, totalUnits = 1) {
    if (currencyKey === 'time' || currencyKey === 'cooldown') return 1;
    const tiers = currencyTiers[currencyKey];
    if (!tiers) return 0;

    // Encuentra el primer tier cuyo umbral sea menor o igual al total de unidades
    const applicableTier = tiers.find(tier => totalUnits >= tier.threshold);
    return applicableTier ? applicableTier.value : 0;
}

export function convertTimeValueToCurrency(timeValue, targetCurrency) {
    if (targetCurrency === 'time' || targetCurrency === 'cooldown') return timeValue;
    const tiers = currencyTiers[targetCurrency];
    if (!tiers || timeValue <= 0) return 0;

    // Lógica para encontrar el mejor ratio posible
    for (const tier of tiers) {
        const calculatedQuantity = timeValue / tier.value;
        if (calculatedQuantity >= tier.threshold) {
            return calculatedQuantity;
        }
    }
    // Si no alcanza ningún umbral, usa el valor más bajo (último en la lista)
    return timeValue / tiers[tiers.length - 1].value;
}


// --- Funciones de Formato ---
export function formatTimeAgo(isoString) {
    if (!isoString) return 'date not available';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return 'invalid date';

    const now = new Date();
    const seconds = Math.round((now - date) / 1000);

    if (seconds < 5) return `Updated just now`;
    if (seconds < 60) return `Updated ${seconds} seconds ago`;

    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `Updated ${minutes} minute${minutes > 1 ? 's' : ''} ago`;

    const hours = Math.round(minutes / 60);
    if (hours < 24) return `Updated ${hours} hour${hours > 1 ? 's' : ''} ago`;

    const days = Math.round(hours / 24);
    return `Updated ${days} day${days > 1 ? 's' : ''} ago`;
}

export function formatLargeNumber(num) {
    if (typeof num !== 'number' || isNaN(num)) return 'N/A';
    if (num === Infinity) return '∞';

    const units = ['K', 'M', 'B', 'T', 'Qd', 'Qn', 'Sx', 'Sp', 'Oc', 'No'];
    if (Math.abs(num) < 1000) {
        return num.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        });
    }

    const tier = Math.floor(Math.log10(Math.abs(num)) / 3);
    if (tier === 0) return num.toLocaleString();

    const unit = units[tier - 1];
    if (!unit) return num.toExponential(2);

    const scaled = num / Math.pow(1000, tier);
    return scaled.toFixed(2) + unit;
}

export function formatHours(totalHours) {
    if (totalHours < 24) return `${totalHours.toFixed(1)} hours`;
    const days = totalHours / 24;
    if (days < 7) return `${days.toFixed(1)} days`;
    const weeks = days / 7;
    if (weeks < 4.34) return `${weeks.toFixed(1)} weeks`;
    const months = days / 30.44;
    if (months < 12) return `${months.toFixed(1)} months`;
    const years = days / 365.25;
    return `${years.toFixed(2)} years`;
}

export function getPrizeItemHtml(prize) {
    const amount = formatLargeNumber(prize.amount);
    if (prize.type === 'currency') {
        const currency = appData.currencies[prize.id] || { name: 'Unknown', icon: '' };
        return `
            <img src="${currency.icon || 'images/placeholder.png'}" alt="${currency.name}">
            <span>${amount} ${currency.name}</span>`;
    } else { // 'sword'
        const sword = findSwordById(prize.id)?.sword || { name: 'Unknown Sword', image: 'images/placeholder.png' };
        return `
            <img src="${sword.image}" alt="${sword.name}">
            <span>${amount > 1 ? `${amount}x ` : ''}${sword.name}</span>`;
    }
}

// Función de parsing que vive junto a los datos que la necesitan.
export function parseValue(value) {
    if (typeof value === 'number') return value;
    if (typeof value !== 'string' || !value) return 0;

    let processableValue = value.trim().toUpperCase();

    // Maneja el formato O/C [Over-Clause, Owner's Choice]
    if (processableValue.startsWith('O/C')) {
        const match = processableValue.match(/\[(.*?)\]/);
        if (match && match[1]) {
            processableValue = match[1];
        } else {
            // Si es O/C sin rango, no podemos asignarle un valor numérico para cálculos.
            return 0;
        }
    }

    // Si es un rango (ej: "8T-10T"), toma el primer valor.
    if (processableValue.includes('-')) {
        processableValue = processableValue.split('-')[0].trim();
    }

    const multipliers = { 'K': 1e3, 'M': 1e6, 'B': 1e9, 'T': 1e12, 'QD': 1e15 };
    const lastChar = processableValue.slice(-1);
    const multiplier = multipliers[lastChar];

    if (multiplier) {
        const numberPart = parseFloat(processableValue.slice(0, -1));
        return isNaN(numberPart) ? 0 : numberPart * multiplier;
    }

    const plainNumber = parseFloat(processableValue);
    return isNaN(plainNumber) ? 0 : plainNumber;
}

export const currencyTiers = {
    'diamonds': [
        { threshold: 50000, value: parseValue("3B") },
        { threshold: 35000, value: parseValue("2.7B") },
        { threshold: 25000, value: parseValue("2.4B") },
        { threshold: 15000, value: 2.2e9 },
        { threshold: 10000, value: 2e9 },
        { threshold: 5000, value: 1.8e9 },
        { threshold: 3000, value: 1.7e9 },
        { threshold: 1000, value: 1.6e9 },
        { threshold: 0, value: 1.5e9 }
    ],
    'heartstones': [
        { threshold: 50000, value: parseValue("775M") },
        { threshold: 35000, value: parseValue("725M") },
        { threshold: 25000, value: parseValue("650M") },
        { threshold: 15000, value: 625e6 },
        { threshold: 10000, value: 600e6 },
        { threshold: 5000, value: 575e6 },
        { threshold: 3000, value: 550e6 },
        { threshold: 1000, value: 525e6 },
        { threshold: 0, value: 500e6 }
    ]
};