// Archivo: js/calculator.js (REFACTORIZADO)
// Propósito: Contiene toda la lógica de negocio y cálculos para la calculadora de profit. NO MANIPULA EL DOM.

import { appData, parseValue } from './data.js';
import { getUnitValue } from './utils.js';

// --- Funciones de Cálculo de Coste ---

function calculateTotalCost(caseData, quantity) {
  if (!caseData) return 0;
  const { currency, price } = caseData;
  if (currency === 'time' || currency === 'cooldown') {
    return price * quantity;
  }
  const totalUnits = price * quantity;
  const valuePerUnit = getUnitValue(currency, totalUnits);
  return totalUnits * valuePerUnit;
}

// --- Lógica de Simulación y Cálculo ---

function prepareSimulationData(caseData) {
  const rewardsWithCumulativeChance = [];
  let cumulative = 0;
  caseData.rewards.forEach(reward => {
    cumulative += reward.chance;
    rewardsWithCumulativeChance.push({ ...reward, cumulative });
  });
  // Se usa 100 como total en caso de que las probabilidades no sumen exactamente 100.
  return { rewardsWithCumulativeChance, totalChanceSum: cumulative > 0 ? cumulative : 100 };
}

/**
 * Ejecuta un cálculo teórico basado en el valor esperado.
 * @returns {object} Un objeto con los resultados del cálculo.
 */
export function runTheoreticalCalculation(quantity, caseId) {
  const caseData = appData.cases[caseId];
  if (!caseData) return null;

  let expectedValuePerCase = 0;
  caseData.rewards.forEach(reward => {
    const numericValue = parseValue(reward.value);
    const chance = reward.chance / 100;
    if (numericValue > 0 && !isNaN(chance)) {
      expectedValuePerCase += (numericValue * chance);
    }
  });

  const totalValueGained = expectedValuePerCase * quantity;
  const totalCost = calculateTotalCost(caseData, quantity);

  return {
    totalCost,
    totalValueGained,
    result: totalValueGained - totalCost
  };
}

/**
 * Ejecuta una simulación realista abriendo una cantidad N de cajas.
 * @returns {object} Un objeto que contiene la lista de items ganados y los resultados.
 */
export function runRealisticSimulation(quantity, caseId) {
  const caseData = appData.cases[caseId];
  if (!caseData) return null;

  const { rewardsWithCumulativeChance, totalChanceSum } = prepareSimulationData(caseData);
  let totalValueGained = 0;
  const wonItems = {};

  for (let i = 0; i < quantity; i++) {
    const random = Math.random() * totalChanceSum;
    const wonReward = rewardsWithCumulativeChance.find(r => random <= r.cumulative);
    if (wonReward) {
      totalValueGained += parseValue(wonReward.value);
      wonItems[wonReward.id] = (wonItems[wonReward.id] || 0) + 1;
    }
  }

  const totalCost = calculateTotalCost(caseData, quantity);

  return {
    wonItems,
    results: {
      totalCost,
      totalValueGained,
      result: totalValueGained - totalCost
    }
  };
}

/**
 * Simula hasta encontrar el mejor item de la caja o alcanzar un límite.
 * @returns {object} Un objeto con los detalles de la "caza" y los resultados.
 */
export function runUntilBestSimulation(caseId) {
    const caseData = appData.cases[caseId];
    if (!caseData || caseData.rewards.length === 0) return null;

    const bestReward = caseData.rewards.reduce((prev, current) => (prev.chance < current.chance) ? prev : current);
    const { rewardsWithCumulativeChance, totalChanceSum } = prepareSimulationData(caseData);

    let casesOpened = 0;
    let totalValueGained = 0;
    let hasFoundBest = false;
    const MAX_ATTEMPTS = 500000; // Límite de seguridad para evitar bucles infinitos

    while (!hasFoundBest && casesOpened < MAX_ATTEMPTS) {
        casesOpened++;
        const random = Math.random() * totalChanceSum;
        const wonReward = rewardsWithCumulativeChance.find(r => random <= r.cumulative);

        if (wonReward) {
            totalValueGained += parseValue(wonReward.value);
            if (wonReward.id === bestReward.id) {
                hasFoundBest = true;
            }
        }
    }

    const totalCost = calculateTotalCost(caseData, casesOpened);

    return {
        huntResult: {
            found: hasFoundBest,
            casesOpened,
            bestReward,
            maxAttempts: MAX_ATTEMPTS
        },
        results: {
            totalCost,
            totalValueGained,
            result: totalValueGained - totalCost,
            quantityOverride: casesOpened
        }
    };
}


/**
 * Genera los puntos de datos para el gráfico de profit.
 * @returns {array} Un array de puntos de datos para el gráfico.
 */
export function runGraphSimulation(step, max, caseId) {
  const caseData = appData.cases[caseId];
  if (!caseData) return null;

  const { rewardsWithCumulativeChance, totalChanceSum } = prepareSimulationData(caseData);
  const results = [];
  let totalValueGained = 0;

  for (let i = 1; i <= max; i++) {
    const random = Math.random() * totalChanceSum;
    const wonReward = rewardsWithCumulativeChance.find(r => random <= r.cumulative);

    if (wonReward) {
      totalValueGained += parseValue(wonReward.value);
    }

    if (i % step === 0 || i === max) {
      const totalCost = calculateTotalCost(caseData, i);
      
      if (totalCost > 0) {
        const profitPercentage = ((totalValueGained - totalCost) / totalCost) * 100;
        results.push({ cases: i, value: profitPercentage, isPercentage: true });
      } else {
        // Si el coste es 0, mostramos el valor ganado en lugar de un porcentaje infinito.
        results.push({ cases: i, value: totalValueGained, isPercentage: false });
      }
    }
  }
  return results;
}