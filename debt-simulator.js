(function () {
  const api = window.debtCases;
  const lab = document.querySelector('#debt-lab');
  if (!api || !lab) return;

  const assetsInput = document.querySelector('#lab-assets');
  const debtInput = document.querySelector('#lab-debt');
  const rateInput = document.querySelector('#lab-rate');
  const status = document.querySelector('#lab-status');
  const defaults = { assets: 10000, debt: 5000, rate: 12, favorable: 20, unfavorable: 8, loss: -5 };
  const names = ['favorable', 'unfavorable', 'loss'];

  const money = value => `${value < 0 ? '−' : ''}$${Math.abs(value).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  const percent = value => `${value < 0 ? '−' : ''}${Math.abs(value * 100).toFixed(1).replace('.0', '')}%`;
  const pp = value => `${value > 0 ? '+' : value < 0 ? '−' : ''}${Math.abs(value * 100).toFixed(1).replace('.0', '')} pp`;
  const number = input => Number.parseFloat(input.value);

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
      setText(output('assets-a'), money(result.assets)); setText(output('assets-b'), money(result.assets));
      setText(output('equity-a'), money(result.equityUnleveraged)); setText(output('equity-b'), money(result.equityLeveraged));
      setText(output('debt'), money(result.debt));
      setText(output('leverage'), `${(result.debt / result.equityLeveraged).toFixed(2)}×`);
      setText(output('operating-a'), money(result.operatingResult)); setText(output('operating-b'), money(result.operatingResult));
      setText(output('interest'), money(-result.interest));
      setText(output('profit-a'), money(result.unleveragedResult)); setText(output('profit-b'), money(result.leveragedResult));
      setText(output('roe-a'), percent(result.roeUnleveraged)); setText(output('roe-b'), percent(result.roeLeveraged));
      setText(output('delta'), `${pp(result.delta)} de ROE`);
      setText(output('explanation'), `El mismo activo produce ${money(result.operatingResult)}. Después de ${money(result.interest)} de intereses, ${money(result.leveragedResult)} corresponden a un capital de ${money(result.equityLeveraged)}.`);
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
    const assets = number(assetsInput);
    const debt = number(debtInput);
    const debtRate = number(rateInput) / 100;
    const valid = Number.isFinite(assets) && Number.isFinite(debt) && Number.isFinite(debtRate) && assets > 0 && debt >= 0 && debt < assets && debtRate >= 0;
    lab.classList.toggle('has-error', !valid);
    if (!valid) {
      status.textContent = 'Para calcular, usa activos mayores que cero y una deuda entre $0 y un valor menor que los activos.';
      return;
    }

    const base = api.calculate({ assets, debt, debtRate, roa: 0 });
    const debtShare = debt / assets;
    const equityShare = base.equityLeveraged / assets;
    document.querySelectorAll('[data-capital="assets"]').forEach(node => setText(node, money(assets)));
    setText(document.querySelector('[data-capital="all-equity"]'), `${money(assets)} · 100%`);
    setText(document.querySelector('#capital-equity'), `${money(base.equityLeveraged)} · ${percent(equityShare)}`);
    setText(document.querySelector('#capital-debt'), `${money(debt)} · ${percent(debtShare)}`);
    setText(document.querySelector('#capital-ratio'), `${(debt / base.equityLeveraged).toFixed(2)}×`);
    document.querySelector('#capital-equity-bar').style.width = `${equityShare * 100}%`;
    document.querySelector('#capital-debt-bar').style.width = `${debtShare * 100}%`;
    status.textContent = `Consecuencia base: aportas ${money(base.equityLeveraged)} y asumes ${money(base.interest)} de intereses anuales.`;

    names.forEach(name => {
      const roa = number(document.querySelector(`[data-roa-input="${name}"]`)) / 100;
      if (Number.isFinite(roa)) paintScenario(name, api.calculate({ assets, debt, debtRate, roa }));
    });
  }

  lab.addEventListener('submit', event => event.preventDefault());
  document.querySelectorAll('#debt-lab input,[data-roa-input]').forEach(input => input.addEventListener('input', render));
  document.querySelector('#reset-debt-lab').addEventListener('click', () => {
    assetsInput.value = defaults.assets; debtInput.value = defaults.debt; rateInput.value = defaults.rate;
    names.forEach(name => { document.querySelector(`[data-roa-input="${name}"]`).value = defaults[name]; });
    render();
  });
  render();
})();
