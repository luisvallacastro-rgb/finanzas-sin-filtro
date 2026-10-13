(function () {
  const finance = window.investmentMath;
  const form = document.querySelector('#investment-form');
  if (!finance || !form) return;

  const investmentInput = document.querySelector('#project-investment');
  const yearsInput = document.querySelector('#project-years');
  const rateInput = document.querySelector('#project-rate');
  const flowInputs = document.querySelector('#project-flow-inputs');
  const slider = document.querySelector('#sensitivity-slider');
  const defaults = { investment: 5000, years: 3, rate: 12, flows: [2200, 2200, 2200], name: 'Pequeño emprendimiento' };
  let storedFlows = defaults.flows.slice();

  const money = value => `${value < 0 ? '−' : value > 0 ? '+' : ''}$${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const plainMoney = value => `${value < 0 ? '−' : ''}$${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const percent = value => `${value * 100 < 0 ? '−' : ''}${Math.abs(value * 100).toFixed(2)}%`;
  const number = (input, fallback = 0) => input && input.value.trim() !== '' && Number.isFinite(Number(input.value)) ? Number(input.value) : fallback;
  const setText = (selector, value) => document.querySelectorAll(selector).forEach(node => { node.textContent = value; });

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
    const flows = Array.from(flowInputs.querySelectorAll('input')).slice(0, years).map(input => number(input));
    return { investment: Math.max(0, number(investmentInput)), years, rate: number(rateInput) / 100, flows };
  }

  function paybackText(value) { return value === null ? 'No recuperada' : `${value.toFixed(2)} años`; }
  function irrText(result) {
    if (result.status === 'none') return 'No determinable';
    if (result.status === 'multiple') return `${result.roots.length} posibles`;
    return percent(result.roots[0]);
  }

  function renderMatrix(result) {
    const table = document.querySelector('#cashflow-table');
    const columns = `minmax(190px,1.1fr) repeat(${result.matrix.length},minmax(110px,1fr))`;
    const row = (label, values, className = '') => `<div class="cashflow-row ${className}" style="grid-template-columns:${columns}"><b class="cashflow-label">${label}</b>${values.map(value => `<span>${value}</span>`).join('')}</div>`;
    table.style.minWidth = `${Math.max(850, 190 + result.matrix.length * 110)}px`;
    table.innerHTML = row('Operación', result.matrix.map(item => `<b>Año ${item.period}</b>`), 'cashflow-head')
      + row('Inversión / flujo', result.matrix.map(item => plainMoney(item.flow)), 'cashflow-primary')
      + row('Factor de descuento', result.matrix.map(item => item.factor.toFixed(6)))
      + row('Valor presente', result.matrix.map(item => plainMoney(item.presentValue)), 'cashflow-primary')
      + row('Acumulado nominal', result.matrix.map(item => plainMoney(item.nominal)))
      + row('Acumulado descontado', result.matrix.map(item => plainMoney(item.discounted)), 'cashflow-total');
  }

  function svgText(x, y, value, anchor = 'middle', color = '#789396', size = 10) { return `<text x="${x}" y="${y}" text-anchor="${anchor}" fill="${color}" font-size="${size}" font-family="Inter,Arial">${value}</text>`; }
  function scale(values, minPixel, maxPixel) {
    let min = Math.min(...values, 0); let max = Math.max(...values, 0);
    if (Math.abs(max - min) < 1e-8) { max += 1; min -= 1; }
    return value => maxPixel - ((value - min) / (max - min)) * (maxPixel - minPixel);
  }

  function renderCashChart(data) {
    const svg = document.querySelector('#cashflow-chart');
    const nominal = data.matrix.slice(1).map(row => row.flow);
    const present = data.matrix.slice(1).map(row => row.presentValue);
    const y = scale(nominal.concat(present), 24, 205); const zero = y(0); const group = 420 / Math.max(1, nominal.length);
    let html = `<line x1="48" y1="${zero}" x2="496" y2="${zero}" stroke="#536c70" stroke-width="1"/>`;
    nominal.forEach((value, index) => {
      const x = 62 + index * group; const yValue = y(value); const yPresent = y(present[index]);
      html += `<rect x="${x}" y="${Math.min(zero, yValue)}" width="${Math.min(25, group * .25)}" height="${Math.max(2, Math.abs(zero - yValue))}" fill="#71e4ea" rx="2"/><rect x="${x + Math.min(28, group * .28)}" y="${Math.min(zero, yPresent)}" width="${Math.min(25, group * .25)}" height="${Math.max(2, Math.abs(zero - yPresent))}" fill="#f4cb7e" rx="2"/>`;
      html += svgText(x + 25, 228, `A${index + 1}`);
    });
    html += `${svgText(55,14,'Nominal','start','#71e4ea',9)}${svgText(120,14,'Presente','start','#f4cb7e',9)}`;
    svg.innerHTML = html;
  }

  function renderNpvChart(config, result) {
    const svg = document.querySelector('#npv-chart');
    const maxRate = Math.max(.5, config.rate * 2.5, result.irr.roots[0] ? result.irr.roots[0] * 1.8 : 0);
    const points = Array.from({ length: 45 }, (_, index) => ({ rate: -0.1 + index * (maxRate + .1) / 44, value: finance.npv(config.investment, config.flows, -0.1 + index * (maxRate + .1) / 44) }));
    const x = rate => 48 + ((rate + .1) / (maxRate + .1)) * 448; const y = scale(points.map(point => point.value), 24, 205); const zero = y(0);
    const path = points.map((point, index) => `${index ? 'L' : 'M'}${x(point.rate).toFixed(1)} ${y(point.value).toFixed(1)}`).join(' ');
    let html = `<line x1="48" y1="${zero}" x2="496" y2="${zero}" stroke="#536c70"/><path d="${path}" fill="none" stroke="#71e4ea" stroke-width="3"/>`;
    const requiredX = x(config.rate); html += `<line x1="${requiredX}" y1="22" x2="${requiredX}" y2="205" stroke="#f4cb7e" stroke-dasharray="5 5"/>${svgText(requiredX,220,percent(config.rate),'middle','#f4cb7e',9)}`;
    if (result.irr.status === 'unique') { const irrX = x(result.irr.roots[0]); html += `<circle cx="${irrX}" cy="${zero}" r="5" fill="#75d6a1"/>${svgText(irrX,Math.max(18,zero-10),'TIR','middle','#75d6a1',9)}`; }
    svg.innerHTML = html;
  }

  function renderPaybackChart(result) {
    const svg = document.querySelector('#payback-chart');
    const nominal = result.matrix.map(row => row.nominal); const discounted = result.matrix.map(row => row.discounted); const y = scale(nominal.concat(discounted), 24, 205); const step = 448 / Math.max(1, nominal.length - 1); const x = index => 48 + index * step;
    const path = values => values.map((value, index) => `${index ? 'L' : 'M'}${x(index)} ${y(value)}`).join(' ');
    let html = `<line x1="48" y1="${y(0)}" x2="496" y2="${y(0)}" stroke="#536c70"/><path d="${path(nominal)}" fill="none" stroke="#71e4ea" stroke-width="3"/><path d="${path(discounted)}" fill="none" stroke="#f4cb7e" stroke-width="3"/>`;
    nominal.forEach((_, index) => { html += svgText(x(index), 228, `A${index}`); });
    html += `${svgText(55,14,'Nominal','start','#71e4ea',9)}${svgText(120,14,'Descontado','start','#f4cb7e',9)}`;
    svg.innerHTML = html;
  }

  function scenarioRow(label, variation, config) {
    const flows = config.flows.map(flow => flow * (1 + variation)); const result = finance.evaluate(config.investment, flows, config.rate); const average = flows.reduce((sum, value) => sum + value, 0) / flows.length;
    return `<div><span>${label}<small>Hipotético ${variation > 0 ? '+' : ''}${variation * 100}%</small></span><b>${plainMoney(average)}</b><b class="${result.npv >= 0 ? 'good' : 'bad'}">${money(result.npv)}</b><b>${irrText(result.irr)}</b><strong class="${result.npv >= 0 ? 'good' : 'bad'}">${result.npv >= 0 ? 'Aceptar' : 'Rechazar'}</strong></div>`;
  }

  function renderSensitivity(config, base) {
    const variation = number(slider) / 100; const scenarioFlows = config.flows.map(flow => flow * (1 + variation)); const scenario = finance.evaluate(config.investment, scenarioFlows, config.rate);
    document.querySelector('#sensitivity-value').textContent = `${variation > 0 ? '+' : ''}${Math.round(variation * 100)}%`;
    setText('[data-investment="base-npv"]', money(base.npv)); setText('[data-investment="scenario-npv"]', money(scenario.npv));
    setText('[data-investment="base-irr"]', irrText(base.irr)); setText('[data-investment="scenario-irr"]', irrText(scenario.irr)); setText('[data-investment="npv-difference"]', money(scenario.npv - base.npv));
    document.querySelector('#scenario-table').innerHTML = `<header><span>Escenario</span><b>Flujo anual equivalente</b><b>VAN</b><b>TIR</b><strong>Decisión</strong></header>${scenarioRow('Pesimista', -.2, config)}${scenarioRow('Base', 0, config)}${scenarioRow('Optimista', .2, config)}`;
    const decision = document.querySelector('#sensitivity-decision'); decision.classList.toggle('is-bad', scenario.npv < 0); decision.querySelector('strong').textContent = scenario.npv >= 0 ? 'La inversión supera la rentabilidad requerida.' : 'La inversión destruye valor bajo este escenario.';
    decision.querySelector('p').textContent = scenario.npv >= 0 ? `El VAN del escenario es ${money(scenario.npv)}.` : `El VAN cae a ${money(scenario.npv)}; revisa los supuestos antes de invertir.`;
  }

  function render() {
    const config = inputs(); storedFlows = config.flows.slice(); const result = finance.evaluate(config.investment, config.flows, config.rate);
    renderMatrix(result); setText('[data-investment="npv"]', money(result.npv)); setText('[data-investment="npv-formula"]', `−${plainMoney(config.investment)} + valores presentes`);
    setText('[data-investment="irr"]', irrText(result.irr)); setText('[data-investment="irr-compare"]', `Frente a ${percent(config.rate)} requerido`);
    setText('[data-investment="simple-payback"]', paybackText(result.simplePayback)); setText('[data-investment="discounted-payback"]', paybackText(result.discountedPayback));
    const favorable = result.npv >= 0; const decision = document.querySelector('#investment-decision'); decision.classList.toggle('is-bad', !favorable); decision.querySelector('strong').textContent = favorable ? 'Proyecto financieramente aceptable' : 'Proyecto financieramente no aceptable bajo los supuestos actuales'; decision.querySelector('p').textContent = favorable ? 'El VAN es positivo: el proyecto genera valor sobre la tasa mínima requerida.' : 'El VAN es negativo: el proyecto no alcanza el rendimiento mínimo exigido.';
    setText('[data-investment="npv-reading"]', favorable ? 'Supera el rendimiento mínimo y genera valor económico adicional.' : 'No alcanza el rendimiento mínimo bajo los supuestos utilizados.');
    const irrReading = result.irr.status === 'unique' ? (result.irr.roots[0] > config.rate ? 'La TIR supera la tasa mínima exigida.' : 'La TIR no alcanza la tasa mínima exigida.') : result.irr.status === 'multiple' ? 'La TIR es ambigua; utiliza el VAN como criterio principal.' : 'No existe una TIR única determinable.'; setText('[data-investment="irr-reading"]', irrReading);
    renderCashChart(result); renderNpvChart(config, result); renderPaybackChart(result); renderSensitivity(config, result);
  }

  yearsInput.addEventListener('change', () => { makeFlowInputs(Math.max(1, Math.min(20, Math.round(number(yearsInput, 3))))); render(); });
  form.querySelectorAll('input').forEach(input => input.addEventListener('input', render)); slider.addEventListener('input', () => renderSensitivity(inputs(), finance.evaluate(inputs().investment, inputs().flows, inputs().rate)));
  document.querySelectorAll('[data-sensitivity]').forEach(button => button.addEventListener('click', () => { slider.value = button.dataset.sensitivity; render(); }));
  document.querySelectorAll('[data-reveal]').forEach(button => button.addEventListener('click', () => document.querySelector(`#${button.dataset.reveal}-card`).classList.toggle('is-hidden-result')));
  document.querySelector('#reset-investment').addEventListener('click', () => { document.querySelector('#project-name').value = defaults.name; investmentInput.value = defaults.investment; yearsInput.value = defaults.years; rateInput.value = defaults.rate; storedFlows = defaults.flows.slice(); slider.value = 0; makeFlowInputs(defaults.years); render(); });
  makeFlowInputs(defaults.years); render();
})();
