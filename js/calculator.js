/* =================================================================================== */
/* === ARCHIVO: calculator.js === */
/* === Toda la lógica de negocio y cálculos para la calculadora de profit. === */
/* =================================================================================== */

import { appData } from './data.js';
import { parseValue } from './data.js';
import { getUnitValue } from './utils.js';
import { renderResultsTable, renderSimulationLoot, renderHuntResult, renderProfitGraph } from './ui.js';

// --- Funciones de Cálculo de Coste ---

function calculateTotalCost(currencyKey, pricePerCase, quantity) {
    if (currencyKey === 'time' || currencyKey === 'cooldown') {
        return pricePerCase * quantity;
    }
    const totalUnits = pricePerCase * quantity;
    const valuePerUnit = getUnitValue(currencyKey, totalUnits);
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
    return { rewardsWithCumulativeChance, totalChanceSum: cumulative };
}

export function runTheoreticalCalculation(quantity, caseId, appState) {
    const caseData = appData.cases[caseId];
    let expectedValuePerCase = 0;
    
    caseData.rewards.forEach(reward => {
        const numericValue = parseValue(reward.value);
        const chance = reward.chance / 100;
        if (numericValue > 0 && !isNaN(chance)) {
            expectedValuePerCase += (numericValue * chance);
        }
    });

    const totalValueGained = expectedValuePerCase * quantity;
    const totalCost = calculateTotalCost(caseData.currency, caseData.price, quantity);

    renderResultsTable({
        totalCost,
        totalValueGained,
        result: totalValueGained - totalCost
    }, appState);
}

export function runRealisticSimulation(quantity, caseId, appState) {
    const caseData = appData.cases[caseId];
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

    const totalCost = calculateTotalCost(caseData.currency, caseData.price, quantity);
    renderSimulationLoot(wonItems);
    renderResultsTable({
        totalCost,
        totalValueGained,
        result: totalValueGained - totalCost
    }, appState);
}

export function runUntilBestSimulation(caseId, appState) {
    const caseData = appData.cases[caseId];
    const bestReward = caseData.rewards.reduce((prev, current) => (prev.chance < current.chance) ? prev : current);
    const { rewardsWithCumulativeChance, totalChanceSum } = prepareSimulationData(caseData);

    let casesOpened = 0;
    let totalValueGained = 0;
    let hasFoundBest = false;
    const MAX_ATTEMPTS = 500000; // Límite de seguridad

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

    const totalCost = calculateTotalCost(caseData.currency, caseData.price, casesOpened);
    
    renderHuntResult({
        found: hasFoundBest,
        casesOpened,
        bestReward,
        maxAttempts: MAX_ATTEMPTS
    });

    renderResultsTable({
        totalCost,
        totalValueGained,
        result: totalValueGained - totalCost,
        quantityOverride: casesOpened
    }, appState);
}

export function runGraphSimulation(step, max, caseId) {
    const caseData = appData.cases[caseId];
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
            const totalCost = calculateTotalCost(caseData.currency, caseData.price, i);
            
            if (totalCost > 0) {
                const profitPercentage = ((totalValueGained - totalCost) / totalCost) * 100;
                results.push({ cases: i, value: profitPercentage, isPercentage: true });
            } else {
                results.push({ cases: i, value: totalValueGained, isPercentage: false });
            }
        }
    }
    renderProfitGraph(results, 50); // El 50 es MAX_GRAPH_SECTIONS
}