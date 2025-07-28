/* =================================================================================== */
/* === ARCHIVO: utils.js === */
/* === Contiene funciones de utilidad reutilizables en toda la aplicación. === */
/* =================================================================================== */

import { appData, currencyTiers } from './data.js';

/**
 * Busca una espada por su ID en todas las cajas y en la lista de otras espadas.
 * @param {string} swordId - El ID de la espada a buscar.
 * @returns {{sword: object, source: object}|null} - El objeto de la espada y su origen, o null si no se encuentra.
 */
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

/**
 * Obtiene el valor base (en 'Time') de una unidad de una moneda específica, considerando los tiers.
 * @param {string} currencyKey - La clave de la moneda ('diamonds', 'heartstones').
 * @param {number} totalUnits - La cantidad total de la moneda que se está usando, para determinar el tier.
 * @returns {number} - El valor de una unidad de esa moneda.
 */
export function getUnitValue(currencyKey, totalUnits = 1) {
    if (currencyKey === 'time' || currencyKey === 'cooldown') return 1;

    const tiers = currencyTiers[currencyKey];
    if (!tiers) return 0;

    const applicableTier = tiers.find(tier => totalUnits >= tier.threshold);
    return applicableTier ? applicableTier.value : 0;
}

/**
 * Convierte un valor total de 'Time' a otra moneda.
 * @param {number} timeValue - El valor total en 'Time'.
 * @param {string} targetCurrency - La moneda a la que se quiere convertir.
 * @returns {number} - La cantidad en la moneda de destino.
 */
export function convertTimeValueToCurrency(timeValue, targetCurrency) {
    if (targetCurrency === 'time') return timeValue;
    if (targetCurrency === 'cooldown') return timeValue; // Asumimos que cooldown se mide en horas, que es un tipo de "time"

    const tiers = currencyTiers[targetCurrency];
    if (!tiers || timeValue <= 0) return 0;

    // Itera desde el tier más alto al más bajo para encontrar el mejor tipo de cambio posible
    for (const tier of tiers) {
        const calculatedQuantity = timeValue / tier.value;
        if (calculatedQuantity >= tier.threshold) {
            return calculatedQuantity;
        }
    }
    
    // Si no alcanza ningún umbral, usa el valor del tier más bajo (base)
    return timeValue / tiers[tiers.length - 1].value;
}