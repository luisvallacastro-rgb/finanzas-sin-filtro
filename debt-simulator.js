(function () {
  const api = window.debtCases;
  const lab = document.querySelector('#debt-lab');
  if (!api || !lab) return;

  const assetsInput = document.querySelector('#lab-assets');
  const salesInput = document.querySelector('#lab-sales');
  const costRateInput = document.querySelector('#lab-cost-rate');
  const debtInput = document.querySelector('#lab-debt');
  const debtSalesInput = document.querySelector('#lab-debt-sales');
  const growthInput = document.querySelector('#lab-growth');
  const rateInput = document.querySelector('#lab-rate');
  const termInput = document.querySelector('#lab-term');
  const status = document.querySelector('#lab-status');
  const defaults = { assets: 10000, sales: 1500, costRate: 70, debt: 1500, debtSales: 100, growth: 20, rate: 12, term: 6 };
  const names = [];

  const money = value => `${value < 0 ? '−' : ''}$${Math.abs(value).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  const moneyExact = value => `${value < 0 ? '−' : ''}$${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const percent = value => `${value < 0 ? '−' : ''}${Math.abs(value * 100).toFixed(1).replace('.0', '')}%`;
  const pp = value => `${value > 0 ? '+' : value < 0 ? '−' : ''}${Math.abs(value * 100).toFixed(1).replace('.0', '')} pp`;
  const number = (input, emptyValue = Number.NaN) => input.value.trim() === '' ? emptyValue : Number.parseFloat(input.value);

  function setText(node, value) { if (node) node.textContent = value; }

  function paintScenario(name, result) {
    const slide = document.querySelector(`[data-slide="${name === 'favorable' ? 12 : name === 'unfavorable' ? 13 : 14}"]`);
    if (!slide) return;
    const cards = slide.querySelectorAll('.roe-stage article');
    const classification = result.roa < 0 ? 'Pérdida amplificada' : result.roa > result.debtRate ? 'Apalancamiento favorable' : result.roa < result.debtRate ? 'Apalancamiento desfavorable' : 'Punto de equilibrio financiero';
    slide.classList.toggle('is-good', result.roa >= 0 && result.roa > result.debtRate);
    slide.classList.toggle('is-bad', result.roa < result.debtRate);
    setText(slide.querySelector(`[data-scenario-label="${name}"]`), `ROA ${percent(result.roa)} · costo de deuda ${percent(result.debtRate)}`);

    const comparison = slide.querySelector('.finance-comparison');
    if (comparison) {
      const output = key => comparison.querySelector(`[data-compare="${key}"]`);
      const favorable = result.roa > result.debtRate;
      const neutral = result.roa === result.debtRate;
      setText(output('assets-a'), money(result.assets)); setText(output('assets-b'), money(result.assets));
      setText(output('equity-a'), money(result.equityUnleveraged)); setText(output('equity-b'), money(result.equityLeveraged));
      setText(output('debt'), money(result.debt));
      setText(output('leverage'), result.debt === 0 ? 'Sin deuda' : `$${(result.debt / result.equityLeveraged).toFixed(2)} por $1`);
      setText(output('operating-a'), money(result.operatingResult)); setText(output('operating-b'), money(result.operatingResult));
      setText(output('interest'), money(-result.interest));
      setText(output('profit-a'), money(result.unleveragedResult)); setText(output('profit-b'), money(result.leveragedResult));
      setText(output('roe-a'), percent(result.roeUnleveraged)); setText(output('roe-b'), percent(result.roeLeveraged));
      setText(output('delta'), `${pp(result.delta)} de ROE`);
      setText(output('explanation'), `El mismo activo produce ${money(result.operatingResult)}. Después de ${money(result.interest)} de intereses, ${money(result.leveragedResult)} corresponden a un capital de ${money(result.equityLeveraged)}.`);
      setText(slide.querySelector('.comparison-title h2 strong'), favorable ? 'La deuda mejora el ROE.' : neutral ? 'La deuda no cambia el ROE.' : 'El costo supera al rendimiento.');
      setText(slide.querySelector('.comparison-title>p'), favorable
        ? 'La deuda cuesta menos de lo que producen los activos; el excedente favorece al propietario.'
        : neutral ? 'El rendimiento de los activos apenas cubre el costo de la deuda.'
        : 'La operación puede ganar dinero, pero la deuda cuesta más de lo que los activos producen.');
      setText(slide.querySelector('.debt-conclusion'), favorable
        ? `Lectura: el ROE sube de ${percent(result.roeUnleveraged)} a ${percent(result.roeLeveraged)} porque el ROA supera la tasa de la deuda.`
        : neutral ? `Lectura: el ROE permanece en ${percent(result.roeLeveraged)} porque el ROA y la tasa de deuda son iguales.`
        : `Lectura: el ROE baja de ${percent(result.roeUnleveraged)} a ${percent(result.roeLeveraged)} porque los intereses consumen parte de la ganancia.`);
    } else if (cards.length === 2) {
      setText(cards[0].querySelector('.roe-number'), percent(result.roeUnleveraged));
      setText(cards[1].querySelector('.roe-number'), percent(result.roeLeveraged));
      const left = cards[0].querySelectorAll('li b');
      const right = cards[1].querySelectorAll('li b');
      [money(result.operatingResult), '$0', money(result.unleveragedResult), money(result.equityUnleveraged)].forEach((v, i) => setText(left[i], v));
      [money(result.operatingResult), `−${money(result.interest)}`, money(result.leveragedResult), money(result.equityLeveraged)].forEach((v, i) => setText(right[i], v));
      setText(cards[0].querySelector('small'), `ROE = ${money(result.unleveragedResult)} ÷ ${money(result.equityUnleveraged)}`);
      setText(cards[1].querySelector('small'), `ROE = ${money(result.leveragedResult)} ÷ ${money(result.equityLeveraged)}`);
      setText(slide.querySelector('.roe-delta strong'), pp(result.delta));
      const spread = slide.querySelectorAll('.spread-line span b');
      setText(spread[0], percent(result.roa)); setText(spread[1], percent(result.debtRate));
      setText(slide.querySelector('.spread-line>strong'), `${classification}: ${pp(result.roa - result.debtRate)}`);
      setText(slide.querySelector('.debt-conclusion'), result.roa > result.debtRate
        ? `Consecuencia: después de pagar ${money(result.interest)} de intereses, el ROE sube a ${percent(result.roeLeveraged)}.`
        : `Consecuencia: los intereses absorben parte del resultado y el ROE cae a ${percent(result.roeLeveraged)}.`);
    } else {
      const articles = slide.querySelectorAll('.loss-visual article');
      const bars = slide.querySelectorAll('.negative-bar b');
      setText(bars[0], percent(result.roeUnleveraged)); setText(bars[1], percent(result.roeLeveraged));
      if (articles.length === 2) {
        const left = articles[0].querySelectorAll('p strong');
        const right = articles[1].querySelectorAll('p strong');
        [money(result.operatingResult), '$0', money(result.unleveragedResult)].forEach((v, i) => setText(left[i], v));
        [money(result.operatingResult), `−${money(result.interest)}`, money(result.leveragedResult)].forEach((v, i) => setText(right[i], v));
      }
      setText(slide.querySelector('.damage-callout>strong'), pp(result.delta));
      setText(slide.querySelector('.debt-conclusion'), `Consecuencia: el mismo activo deja ${money(result.leveragedResult)} al propietario y lleva su ROE a ${percent(result.roeLeveraged)}.`);
    }

    const summary = document.querySelector(`.scenario-strip article:nth-child(${names.indexOf(name) + 1})`);
    if (summary) {
      setText(summary.querySelector('b'), `ROA ${percent(result.roa)}`);
      setText(summary.querySelector('i'), `Costo ${percent(result.debtRate)}`);
      setText(summary.querySelector('strong'), `ROE ${percent(result.roeLeveraged)}`);
    }
  }

  function render() {
    const sales = number(salesInput, 0);
    const costRate = number(costRateInput, 0) / 100;
    const debt = number(debtInput, 0);
    const debtSalesRate = number(debtSalesInput, 0) / 100;
    const growthRate = number(growthInput, 0) / 100;
    const debtRate = number(rateInput, 0) / 100;
    const term = number(termInput, 0);
    const assets = Math.max(number(assetsInput, defaults.assets), debt * 2, 1);
    assetsInput.value = assets;
    const valid = [sales, costRate, debt, debtSalesRate, growthRate, debtRate, term].every(Number.isFinite)
      && sales >= 0 && costRate >= 0 && costRate <= 1 && debt >= 0 && debtSalesRate >= 0 && growthRate > -1 && debtRate >= 0 && term >= 1;
    lab.classList.toggle('has-error', !valid);
    if (!valid) {
      status.textContent = 'Revisa los campos amarillos: costos entre 0% y 100%, crecimiento mayor que −100%, tasa no negativa y plazo mínimo de un mes.';
      return;
    }

    const extraSales = debt * debtSalesRate;
    const preSalesA = sales;
    const preSalesB = sales + extraSales;
    const projectedA = preSalesA * (1 + growthRate);
    const projectedB = preSalesB * (1 + growthRate);
    const costsA = projectedA * costRate;
    const costsB = projectedB * costRate;
    const operatingA = projectedA - costsA;
    const operatingB = projectedB - costsB;
    const netA = operatingA;
    const netB = operatingB;
    const difference = netB - netA;
    const monthlyRate = debtRate / 12;
    const payment = debt === 0 ? 0 : monthlyRate === 0 ? debt / term : debt * monthlyRate / (1 - Math.pow(1 + monthlyRate, -term));
    const cashAfterPayment = difference - payment;
    const leverageOutput = key => document.querySelector(`[data-leverage="${key}"]`);
    setText(leverageOutput('base-sales-b'), money(sales));
    setText(leverageOutput('cost-rate-b'), percent(costRate));
    setText(leverageOutput('pre-sales-a'), money(preSalesA)); setText(leverageOutput('pre-sales-b'), money(preSalesB));
    setText(leverageOutput('growth-b'), percent(growthRate));
    setText(leverageOutput('projected-a'), money(projectedA)); setText(leverageOutput('projected-b'), money(projectedB));
    setText(leverageOutput('costs-a'), `−${money(costsA)}`); setText(leverageOutput('costs-b'), `−${money(costsB)}`);
    setText(leverageOutput('net-a'), money(netA)); setText(leverageOutput('net-b'), money(netB));
    setText(leverageOutput('difference-formula'), `${money(netB)} − ${money(netA)}`);
    setText(leverageOutput('difference'), `= ${difference > 0 ? '+' : difference < 0 ? '−' : ''}${money(Math.abs(difference))}`);
    const verdict = lab.querySelector('.leverage-verdict');
    verdict.classList.toggle('is-positive', difference > 0);
    verdict.classList.toggle('is-negative', difference < 0);
    status.textContent = debt === 0
      ? `Sin deuda no existe apalancamiento: ambos casos terminan con ${money(netA)} de utilidad neta.`
      : difference > 0
        ? `La inyección añade ${money(extraSales)} de capacidad de venta y genera ${money(difference)} adicionales de utilidad neta al mes.`
        : difference < 0
          ? `El caso con deuda produce ${money(Math.abs(difference))} menos utilidad neta que el caso sin deuda.`
          : 'La inyección no modifica la utilidad neta frente al caso sin deuda.';

    const loanOutput = key => document.querySelector(`[data-loan="${key}"]`);
    setText(loanOutput('amount'), money(debt));
    setText(loanOutput('payment'), moneyExact(payment));
    setText(loanOutput('extra-profit'), money(difference));
    setText(loanOutput('balance'), moneyExact(cashAfterPayment));
    setText(loanOutput('reading'), debt === 0
      ? 'No existe financiamiento ni cuota en este escenario.'
      : cashAfterPayment >= 0
        ? `La utilidad adicional cubre la cuota de ${moneyExact(payment)} y deja ${moneyExact(cashAfterPayment)} mensuales durante ${term} meses. Al terminar el mes ${term}, los ${money(difference)} adicionales quedan libres para el propietario.`
        : `La utilidad adicional no cubre la cuota de ${moneyExact(payment)}: faltan ${moneyExact(Math.abs(cashAfterPayment))} al mes durante ${term} meses. En estas condiciones, la deuda presiona el flujo de efectivo.`);
    const reference = lab.querySelector('.loan-reference');
    reference.classList.toggle('is-covered', debt > 0 && cashAfterPayment >= 0);
    reference.classList.toggle('is-short', debt > 0 && cashAfterPayment < 0);

    names.forEach(name => {
      const roa = number(document.querySelector(`[data-roa-input="${name}"]`)) / 100;
      if (Number.isFinite(roa)) paintScenario(name, api.calculate({ assets, debt, debtRate, roa }));
    });
  }

  lab.addEventListener('submit', event => event.preventDefault());
  document.querySelectorAll('#debt-lab input,[data-roa-input]').forEach(input => input.addEventListener('input', render));
  [salesInput, costRateInput, debtInput, debtSalesInput, growthInput, rateInput, termInput].forEach(input => input.addEventListener('blur', () => {
    if (input.value.trim() === '') input.value = '0';
    render();
  }));
  document.querySelector('#reset-debt-lab').addEventListener('click', () => {
    assetsInput.value = defaults.assets; salesInput.value = defaults.sales; costRateInput.value = defaults.costRate;
    debtInput.value = defaults.debt; debtSalesInput.value = defaults.debtSales; growthInput.value = defaults.growth; rateInput.value = defaults.rate; termInput.value = defaults.term;
    names.forEach(name => { document.querySelector(`[data-roa-input="${name}"]`).value = defaults[name]; });
    render();
  });
  render();
})();
