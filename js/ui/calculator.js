// Archivo: js/ui/calculator.js (NUEVO)
// Propósito: Renderizar todos los componentes de la UI de la calculadora y manejar sus eventos.

import { dom } from './dom.js';
import { appData } from '../data.js';
import * as Calculator from '../calculator.js';
import { findSwordById, formatLargeNumber, formatHours } from '../utils.js';

/**
 * Limpia y resetea la UI de la calculadora a un estado inicial.
 * @param {object} appState - El estado de la aplicación.
 */
export function clearCalculator(appState) {
    dom.containers.simulationLoot.style.display = 'none';
    dom.containers.resultsTable.innerHTML = '';
    dom.containers.graph.style.display = 'none';
    if (dom.containers.graphSvg) dom.containers.graphSvg.innerHTML = '';
    if (dom.containers.graphLabels) dom.containers.graphLabels.innerHTML = '';

    const isGraphMode = appState.calculatorMode === 'graph';
    const isUntilBestMode = appState.calculatorMode === 'untilBest';

    dom.controls.standardCalculator.style.display = isGraphMode ? 'none' : 'flex';
    dom.controls.graphCalculator.style.display = isGraphMode ? 'flex' : 'none';

    dom.inputs.caseQuantity.disabled = isUntilBestMode;
    dom.buttons.calculate.textContent = isUntilBestMode ? 'Start Hunt' : 'Calculate';
    
    if (isUntilBestMode) {
        dom.inputs.caseQuantity.value = '';
        dom.inputs.caseQuantity.placeholder = "Not applicable";
    } else {
        dom.inputs.caseQuantity.placeholder = "Enter amount...";
    }
}

/**
 * Renderiza la tabla de resultados de la calculadora.
 * @param {object} data - Los datos calculados.
 * @param {object} appState - El estado de la aplicación.
 */
export function renderResultsTable(data, appState) {
    dom.containers.resultsTable.innerHTML = '';
    if (!data) return;

    const quantity = data.quantityOverride || parseInt(dom.inputs.caseQuantity.value, 10) || 1;
    const resultClass = data.result >= 0 ? 'profit' : 'loss';
    const resultSign = data.result >= 0 ? '+' : '';
    const profitPerCase = data.result / quantity;
    const profitPercentage = data.totalCost > 0 ? (data.result / data.totalCost) * 100 : (data.result > 0 ? Infinity : 0);
    const profitPercentageDisplay = isFinite(profitPercentage) ? `${resultSign}${profitPercentage.toFixed(2)}%` : '∞%';

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


export function renderSimulationLoot(wonItems) {
    dom.containers.simulationLoot.style.display = 'block';
    if (Object.keys(wonItems).length === 0) {
        dom.containers.simulationLoot.innerHTML = '<h4>Loot Summary</h4><p>No items won in this simulation.</p>';
        return;
    }
    let listHTML = '<h4>Loot Summary</h4><ul>';
    for (const rewardId in wonItems) {
        const rewardData = findSwordById(rewardId)?.sword;
        if (rewardData) {
            listHTML += `<li>${wonItems[rewardId]}x <span class="rarity-text ${rewardData.rarity}">${rewardData.name}</span></li>`;
        }
    }
    listHTML += '</ul>';
    dom.containers.simulationLoot.innerHTML = listHTML;
}

export function renderHuntResult(result) {
    dom.containers.simulationLoot.style.display = 'block';
    if (!result) return;
    if (result.found) {
        dom.containers.simulationLoot.innerHTML = `<h4>Hunt Result</h4><p>It took <strong>${result.casesOpened.toLocaleString()}</strong> cases to find <span class="rarity-text ${result.bestReward.rarity}">${result.bestReward.name}</span>!</p>`;
    } else {
        dom.containers.simulationLoot.innerHTML = `<h4>Hunt Result</h4><p style="color:var(--insane);">Did not find the ${result.bestReward.name} within ${result.maxAttempts.toLocaleString()} cases. This is a super rare item!</p>`;
    }
}

export function renderProfitGraph(results) {
    dom.containers.graph.style.display = 'block';
    const tooltip = document.querySelector('.graph-tooltip');
    dom.containers.graphSvg.innerHTML = '';
    dom.containers.graphLabels.innerHTML = '';
    if (!results || results.length < 2) return;

    const isPercentage = results[0].isPercentage;
    const yAxisLabel = isPercentage ? 'Profit %' : 'Net Gain (Time)';
    const padding = { top: 20, right: 20, bottom: 40, left: 60 };
    const width = dom.containers.graphPlotArea.clientWidth;
    const height = dom.containers.graphPlotArea.clientHeight;
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

        if (p1.value * p2.value < 0) { // Cruza la línea cero
            const m = (p2.value - p1.value) / (p2.cases - p1.cases);
            const x_intersect = p1.cases - p1.value / m;
            const intersect_coords = { x: xScale(x_intersect), y: yScale(0) };
            createLineSegment(p1_coords, intersect_coords, p1.value >= 0);
            createLineSegment(intersect_coords, p2_coords, p2.value >= 0);
        } else {
            createLineSegment(p1_coords, p2_coords, p1.value >= 0);
        }
    }

    results.forEach(d => {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        const cx = xScale(d.cases); const cy = yScale(d.value);
        circle.setAttribute('cx', cx); circle.setAttribute('cy', cy);
        circle.setAttribute('class', `graph-data-point ${d.value >= 0 ? 'profit' : 'loss'}`);
        
        circle.addEventListener('mouseover', () => {
            tooltip.style.display = 'block';
            tooltip.style.left = `${cx}px`;
            tooltip.style.top = `${cy}px`;
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

/**
 * Inicializa los listeners de la UI de la calculadora.
 * @param {object} appState - El estado global de la aplicación.
 */
export function initializeCalculatorUI(appState) {
    const handleCalculation = () => {
        const quantity = parseInt(dom.inputs.caseQuantity.value, 10);
        const caseId = appState.currentCaseIdForCalc;
        
        if (!caseId || !appData.cases[caseId]) {
            dom.containers.resultsTable.innerHTML = `<p class="error-message" style="display:block;">No case selected for calculation.</p>`;
            return;
        }

        clearCalculator(appState);

        switch(appState.calculatorMode) {
            case 'theoretical':
                if (isNaN(quantity) || quantity <= 0) {
                     dom.containers.resultsTable.innerHTML = `<p class="error-message" style="display:block;">Please enter a valid number of cases.</p>`;
                     return;
                }
                const theoreticalData = Calculator.runTheoreticalCalculation(quantity, caseId);
                renderResultsTable(theoreticalData, appState);
                break;
            case 'simulate':
                 if (isNaN(quantity) || quantity <= 0) {
                     dom.containers.resultsTable.innerHTML = `<p class="error-message" style="display:block;">Please enter a valid number of cases.</p>`;
                     return;
                }
                const realisticData = Calculator.runRealisticSimulation(quantity, caseId);
                renderSimulationLoot(realisticData.wonItems);
                renderResultsTable(realisticData.results, appState);
                break;
            case 'untilBest':
                const huntData = Calculator.runUntilBestSimulation(caseId);
                renderHuntResult(huntData.huntResult);
                renderResultsTable(huntData.results, appState);
                break;
        }
    };
    
    const handleGraphCalculation = () => {
        const step = parseInt(dom.inputs.graphStep.value, 10);
        const max = parseInt(dom.inputs.graphMax.value, 10);
        const caseId = appState.currentCaseIdForCalc;

        if (!caseId || !appData.cases[caseId] || isNaN(step) || isNaN(max) || step <= 0 || max <= 0 || step > max) {
            dom.containers.resultsTable.innerHTML = `<p class="error-message" style="display:block;">Please enter valid Range and Maximum values.</p>`;
            return;
        }
        
        const graphData = Calculator.runGraphSimulation(step, max, caseId);
        renderProfitGraph(graphData);
    };

    dom.buttons.calculate.addEventListener('click', handleCalculation);
    dom.buttons.calculateGraph.addEventListener('click', handleGraphCalculation);

    // Listeners para cambiar de modo
    const modeButtons = {
        theoretical: dom.buttons.modeTheoretical,
        simulate: dom.buttons.modeSimulate,
        untilBest: dom.buttons.modeUntilBest,
        graph: dom.buttons.modeGraph,
    };

    Object.entries(modeButtons).forEach(([mode, button]) => {
        button.addEventListener('click', () => {
            Object.values(modeButtons).forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            appState.calculatorMode = mode;
            clearCalculator(appState);
        });
    });
}