/* =================================================================================== */
/* === ARCHIVO: utils.js (VERSIÓN COMPLETA Y FINAL) === */
/* === Contiene funciones de utilidad reutilizables en toda la aplicación. === */
/* =================================================================================== */

import { appData, currencyTiers } from './data.js';

// --- Funciones de Búsqueda ---
export function findSwordById(swordId) {
    for (const caseId in appData.cases) {
        const foundSword = appData.cases[caseId].rewards.find(r => r.id === swordId);
        if (foundSword) {
            return { sword: foundSword, source: { type: 'case', id: caseId } };
        }
    }
    const foundOtherSword = appData.otherSwords.find(s => s.id === swordId);
    if (foundOtherSword) {
        return { sword: foundOtherSword, source: { type: 'other' } };
    }
    return null;
}

// --- Funciones de Moneda ---
export function getUnitValue(currencyKey, totalUnits = 1) {
    if (currencyKey === 'time' || currencyKey === 'cooldown') return 1;
    const tiers = currencyTiers[currencyKey];
    if (!tiers) return 0;
    const applicableTier = tiers.find(tier => totalUnits >= tier.threshold);
    return applicableTier ? applicableTier.value : 0;
}

export function convertTimeValueToCurrency(timeValue, targetCurrency) {
    if (targetCurrency === 'time' || targetCurrency === 'cooldown') return timeValue;
    const tiers = currencyTiers[targetCurrency];
    if (!tiers || timeValue <= 0) return 0;
    for (const tier of tiers) {
        const calculatedQuantity = timeValue / tier.value;
        if (calculatedQuantity >= tier.threshold) {
            return calculatedQuantity;
        }
    }
    return timeValue / tiers[tiers.length - 1].value;
}

// --- Funciones de Formato ---
export function formatTimeAgo(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
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
    if (Math.abs(num) < 1000) return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
    const units = ['K', 'M', 'B', 'T', 'Qd'];
    if (num === 0) return '0';
    const tier = Math.floor(Math.log10(Math.abs(num)) / 3);
    if (tier === 0) return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
    const unit = units[tier - 1];
    if (!unit) return num.toLocaleString();
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