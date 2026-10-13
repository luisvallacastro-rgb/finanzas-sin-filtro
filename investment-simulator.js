(function () {
  const finance = window.investmentMath;
  const form = document.querySelector('#investment-form');
  if (!finance || !form) return;
  const investmentInput = document.querySelector('#project-investment');
  const yearsInput = document.querySelector('#project-years');
  const rateInput = document.querySelector('#project-rate');
  const flowInputs = document.querySelector('#project-flow-inputs');
  const defaults = { investment: 5000, years: 3, rate: 12, flows: [2200, 2200, 2200], name: 'Pequeño emprendimiento' };
  let storedFlows = defaults.flows.slice();
  const money = value => `${value < 0 ? '−' : value > 0 ? '+' : ''}$${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const plainMoney = value => `${value < 0 ? '−' : ''}$${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const percent = value => `${value < 0 ? '−' : ''}${Math.abs(value * 100).toFixed(2)}%`;
  const number = (input, fallback = 0) => input && input.value.trim() !== '' && Number.isFinite(Number(input.value)) ? Number(input.value) : fallback;

  function makeFlowInputs(years) {
    const existing = Array.from(flowInputs.querySelectorAll('input')).map(input => number(input));
    if (existing.length) storedFlows = existing;
    while (storedFlows.length < years) storedFlows.push(storedFlows.length ? storedFlows[storedFlows.length - 1] : 0);
    storedFlows = storedFlows.slice(0, years);
    flowInputs.innerHTML = storedFlows.map((flow, index) => `<label><span>Año ${index + 1}</span><span>$ <input type="number" step="100" value="${flow}" data-flow-index="${index}" /></span></label>`).join('');
    flowInputs.querySelectorAll('input').forEach(input => input.addEventListener('input', render));
  }

  function inputs() {
    const years = Math.max(1, Math.min(20, Math.round(number(yearsInput, 3))));
    return { investment: Math.max(0, number(investmentInput)), years, rate: number(rateInput) / 100, flows: Array.from(flowInputs.querySelectorAll('input')).slice(0, years).map(input => number(input)) };
  }

  function irrText(irr) {
    if (irr.status === 'none') return 'No determinable';
    if (irr.status === 'multiple') return `${irr.roots.length} posibles`;
    return percent(irr.roots[0]);
  }

  function renderMatrix(result) {
    const table = document.querySelector('#cashflow-table');
    const columns = `minmax(120px,.8fr) repeat(${result.matrix.length},minmax(78px,1fr))`;
    const row = (label, values, className = '') => `<div class="cashflow-row ${className}" style="grid-template-columns:${columns}"><b class="cashflow-label">${label}</b>${values.map(value => `<span>${value}</span>`).join('')}</div>`;
    table.style.minWidth = `${Math.max(480, 120 + result.matrix.length * 78)}px`;
    table.innerHTML = row('Flujos', result.matrix.map(item => plainMoney(item.flow)), 'cashflow-primary') + row('Años', result.matrix.map(item => item.period)) + row('Flujos netos', result.matrix.map((item, index) => index === 0 ? '—' : plainMoney(item.presentValue)), 'cashflow-total');
  }

  function rateSet(config, result) {
    const values = [.08, .09, .10, config.rate, .13];
    if (result.irr.status === 'unique') values.push(result.irr.roots[0]);
    values.push(.20, .25, .30);
    return [...new Set(values.map(value => value.toFixed(6)))].map(Number).sort((a, b) => a - b);
  }

  function renderSummary(config, result) {
    const presentFlows = result.matrix.slice(1).reduce((sum, item) => sum + item.presentValue, 0);
    document.querySelector('#van-summary').innerHTML = `<div><span>Suma de flujos netos</span><strong>${plainMoney(presentFlows)}</strong></div><div><span>VAN</span><strong class="${result.npv >= 0 ? 'good' : 'bad'}">${money(result.npv)}</strong></div><div><span>TIR</span><strong>${irrText(result.irr)}</strong></div><div><span>Tasa de descuento</span><strong>${percent(config.rate)}</strong></div>`;
  }

  function renderRateTable(config, result) {
    document.querySelector('#van-rate-table').innerHTML = '<header><b>Tasa</b><b>VAN</b></header>' + rateSet(config, result).map(rate => {
      const value = finance.npv(config.investment, config.flows, rate);
      const isRequired = Math.abs(rate - config.rate) < 1e-6;
      const isIrr = result.irr.status === 'unique' && Math.abs(rate - result.irr.roots[0]) < 1e-5;
      return `<div class="${isRequired ? 'required' : ''} ${isIrr ? 'irr' : ''}"><span>${percent(rate)}</span><strong>${money(Math.abs(value) < .01 ? 0 : value)}</strong></div>`;
    }).join('');
  }

  function svgText(x, y, value, anchor = 'middle', color = '#789396', size = 11) { return `<text x="${x}" y="${y}" text-anchor="${anchor}" fill="${color}" font-size="${size}" font-family="Inter,Arial">${value}</text>`; }

  function renderNpvChart(config, result) {
    const svg = document.querySelector('#npv-chart');
    const maxRate = Math.max(.35, config.rate * 2.5, result.irr.status === 'unique' ? result.irr.roots[0] * 1.8 : 0);
    const points = Array.from({ length: 55 }, (_, index) => { const rate = index * maxRate / 54; return { rate, value: finance.npv(config.investment, config.flows, rate) }; });
    let minValue = Math.min(...points.map(point => point.value), 0); let maxValue = Math.max(...points.map(point => point.value), 0);
    if (Math.abs(maxValue - minValue) < 1) { maxValue += 1; minValue -= 1; }
    const x = rate => 62 + (rate / maxRate) * 525; const y = value => 285 - ((value - minValue) / (maxValue - minValue)) * 235; const zeroY = y(0);
    let html = '';
    for (let index = 0; index <= 5; index += 1) { const rate = index * maxRate / 5; html += `<line x1="${x(rate)}" y1="40" x2="${x(rate)}" y2="285" stroke="rgba(113,228,234,.10)"/>${svgText(x(rate),307,`${Math.round(rate * 100)}%`)}`; }
    for (let index = 0; index <= 4; index += 1) { const value = minValue + index * (maxValue - minValue) / 4; html += `<line x1="62" y1="${y(value)}" x2="587" y2="${y(value)}" stroke="rgba(113,228,234,.10)"/>${svgText(54,y(value)+4,plainMoney(value),'end','#789396',10)}`; }
    const path = points.map((point, index) => `${index ? 'L' : 'M'}${x(point.rate).toFixed(1)} ${y(point.value).toFixed(1)}`).join(' ');
    html += `<line x1="62" y1="${zeroY}" x2="587" y2="${zeroY}" stroke="#789396"/><path d="${path}" fill="none" stroke="#71e4ea" stroke-width="4"/>`;
    const requiredX = x(config.rate); html += `<line x1="${requiredX}" y1="40" x2="${requiredX}" y2="285" stroke="#f4cb7e" stroke-dasharray="6 6"/>${svgText(requiredX,28,`Tasa ${percent(config.rate)}`,'middle','#f4cb7e',10)}`;
    if (result.irr.status === 'unique' && result.irr.roots[0] >= 0 && result.irr.roots[0] <= maxRate) { const irrX = x(result.irr.roots[0]); html += `<circle cx="${irrX}" cy="${zeroY}" r="7" fill="#75d6a1"/>${svgText(irrX,zeroY-13,`TIR ${percent(result.irr.roots[0])}`,'middle','#75d6a1',10)}`; }
    svg.innerHTML = html;
  }

  function renderDecision(config, result) {
    const favorable = result.npv >= 0; const node = document.querySelector('#investment-decision');
    node.classList.toggle('is-bad', !favorable);
    node.innerHTML = `<span>${favorable ? 'VAN positivo' : 'VAN negativo'}</span><strong>${favorable ? 'La inversión crea valor.' : 'La inversión no alcanza la rentabilidad requerida.'}</strong><p>Con una tasa de ${percent(config.rate)}, el VAN es ${money(result.npv)}.</p>`;
  }

  function render() {
    const config = inputs(); storedFlows = config.flows.slice(); const result = finance.evaluate(config.investment, config.flows, config.rate);
    renderMatrix(result); renderSummary(config, result); renderRateTable(config, result); renderNpvChart(config, result); renderDecision(config, result);
  }

  yearsInput.addEventListener('change', () => { makeFlowInputs(Math.max(1, Math.min(20, Math.round(number(yearsInput, 3))))); render(); });
  form.querySelectorAll('input').forEach(input => input.addEventListener('input', render));
  document.querySelector('#reset-investment').addEventListener('click', () => { document.querySelector('#project-name').value = defaults.name; investmentInput.value = defaults.investment; yearsInput.value = defaults.years; rateInput.value = defaults.rate; storedFlows = defaults.flows.slice(); makeFlowInputs(defaults.years); render(); });
  makeFlowInputs(defaults.years); render();
})();
