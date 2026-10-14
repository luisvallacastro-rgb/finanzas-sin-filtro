(() => {
  const root = document.querySelector('#diagnostic-root');
  if (!root) return;

  const form = root.querySelector('.diagnostic-form');
  const views = [...root.querySelectorAll('.diagnostic-view')];
  const steps = [...root.querySelectorAll('.diagnostic-step')];
  const progressBar = document.querySelector('#diagnostic-progress-bar');
  const progressLabel = document.querySelector('#diagnostic-progress-label');
  const startButton = root.querySelector('#start-diagnostic');
  const nextButton = root.querySelector('[data-action="next"]');
  const backButton = root.querySelector('[data-action="back"]');
  const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
  let currentStep = 1;
  let lastResult = null;

  const number = name => Math.max(0, Number(new FormData(form).get(name)) || 0);
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const percent = value => Number.isFinite(value) ? `${value.toFixed(1)}%` : 'No calculable';

  function showView(name) {
    views.forEach(view => view.classList.toggle('is-current', view.dataset.view === name));
    root.classList.toggle('showing-results', name === 'results');
    const nativeToggle = document.querySelector('#start-test-toggle');
    if (nativeToggle) nativeToggle.checked = name === 'form';
    if (name === 'welcome') updateProgress(0, 'Inicio');
    if (name === 'results') updateProgress(100, 'Resultado');
    const app = document.querySelector('.diagnostic-app');
    if (app) app.scrollTop = 0;
  }

  function updateProgress(value, label) {
    progressBar.style.width = `${value}%`;
    progressLabel.textContent = label;
  }

  function showStep(step) {
    currentStep = clamp(step, 1, steps.length);
    steps.forEach(panel => panel.classList.toggle('is-current', Number(panel.dataset.step) === currentStep));
    const nativeStage = document.querySelector(`#native-step-${currentStep}`);
    if (nativeStage) nativeStage.checked = true;
    backButton.style.visibility = currentStep === 1 ? 'hidden' : 'visible';
    nextButton.textContent = currentStep === steps.length ? 'Ver mi radiografía →' : 'Continuar →';
    updateProgress(currentStep * 18, `Etapa ${currentStep} de ${steps.length}`);
    const app = document.querySelector('.diagnostic-app');
    if (app) app.scrollTop = 0;
  }

  function validateCurrentStep() {
    const panel = steps[currentStep - 1];
    const required = [...panel.querySelectorAll('[required]')];
    const invalid = required.find(field => !field.value || Number(field.value) < 0);
    if (!invalid) return true;
    invalid.focus();
    invalid.closest('label')?.classList.add('has-error');
    setTimeout(() => invalid.closest('label')?.classList.remove('has-error'), 1200);
    return false;
  }

  function calculate() {
    const frequency = new FormData(form).get('frequency');
    const frequencyFactor = { monthly: 1, biweekly: 2, weekly: 52 / 12, variable: 1 }[frequency] || 1;
    const income = (number('income') + number('extraIncome')) * frequencyFactor;
    const essential = ['housing','food','transport','utilities','educationHealth','otherEssential'].reduce((sum, key) => sum + number(key), 0);
    const discretionary = number('leisure') + number('personal');
    const debtPayment = ['personalDebt','cardDebt','securedDebt','otherDebt'].reduce((sum, key) => sum + number(key), 0);
    const totalExpense = essential + discretionary + debtPayment;
    const surplus = income - totalExpense;
    const margin = income > 0 ? surplus / income * 100 : NaN;
    const debtRatio = income > 0 ? debtPayment / income * 100 : NaN;
    const commitment = income > 0 ? totalExpense / income * 100 : NaN;
    const liquid = number('liquid') + number('emergency');
    const dailyObligations = (essential + debtPayment) / 30;
    const resistance = dailyObligations > 0 ? liquid / dailyObligations : NaN;
    const liabilities = number('debtBalance') + number('otherLiabilities');
    const totalAssets = liquid + number('assets');
    const netWorth = totalAssets - liabilities;
    const totalSolvency = liabilities > 0 ? totalAssets / liabilities * 100 : (totalAssets > 0 ? Infinity : NaN);
    const essentialRatio = income > 0 ? essential / income * 100 : NaN;
    const leisureRatio = income > 0 ? discretionary / income * 100 : NaN;
    const savingsRate = income > 0 ? Math.max(surplus, 0) / income * 100 : NaN;
    const savingShare = surplus < 0 ? .5 : .3;
    const suggestedSaving = discretionary * savingShare;

    const marginScore = Number.isFinite(margin) ? clamp((margin + 5) / 25 * 30, 0, 30) : 0;
    const debtScore = Number.isFinite(debtRatio) ? clamp(25 - debtRatio / 45 * 25, 0, 25) : 0;
    const reserveScore = Number.isFinite(resistance) ? clamp(resistance / 90 * 25, 0, 25) : 0;
    const balanceScore = Number.isFinite(commitment) ? clamp((110 - commitment) / 30 * 20, 0, 20) : 0;
    const score = Math.round(marginScore + debtScore + reserveScore + balanceScore);
    const classification = score < 40 ? 'Solvencia crítica' : score < 60 ? 'Solvencia baja' : score < 80 ? 'Solvencia moderada' : 'Solvencia sólida';

    return { income, essential, discretionary, debtPayment, totalExpense, surplus, margin, debtRatio, commitment, liquid, resistance, liabilities, totalAssets, netWorth, totalSolvency, essentialRatio, leisureRatio, savingsRate, savingShare, suggestedSaving, score, classification };
  }

  function mainMessage(result) {
    if (result.surplus < 0) return `Tus gastos superan tus ingresos por ${money.format(Math.abs(result.surplus))}. Antes de invertir, conviene recuperar el equilibrio mensual.`;
    if (result.debtRatio >= 35) return `De cada $100 que recibes, ${result.debtRatio.toFixed(0)} se destinan a obligaciones financieras. Revisa sus costos antes de asumir nuevas deudas.`;
    if (Number.isFinite(result.resistance) && result.resistance < 30) return `Tus reservas cubrirían aproximadamente ${result.resistance.toFixed(0)} días de gastos esenciales y cuotas, según los datos declarados.`;
    return `Tu margen disponible es ${percent(result.margin)}. Ese espacio puede convertirse en protección, objetivos y patrimonio con un plan consistente.`;
  }

  function solvencyMessage(result) {
    const totalText = result.totalSolvency === Infinity
      ? 'No declaraste obligaciones pendientes: tus activos no están presionados por deuda registrada.'
      : Number.isFinite(result.totalSolvency)
        ? `Por cada $100 de obligaciones pendientes declaraste ${money.format(result.totalSolvency)} en activos y reservas.`
        : 'Registra activos y obligaciones pendientes para medir tu solvencia total.';
    return totalText;
  }

  function renderResults() {
    const result = calculate();
    lastResult = result;
    document.querySelector('#health-score').textContent = result.score;
    document.querySelector('#result-status').textContent = result.classification;
    document.querySelector('#metric-income').textContent = money.format(result.income);
    document.querySelector('#metric-surplus').textContent = money.format(result.surplus);
    document.querySelector('#metric-surplus-rate').textContent = `${percent(result.margin)} del ingreso`;
    document.querySelector('#metric-total-solvency').textContent = result.totalSolvency === Infinity ? 'Sin deuda' : percent(result.totalSolvency);
    document.querySelector('#metric-total-solvency-value').textContent = `${money.format(result.totalAssets)} activos / ${money.format(result.liabilities)} obligaciones`;
    document.querySelector('#metric-debt').textContent = percent(result.debtRatio);
    document.querySelector('#metric-debt-value').textContent = `${money.format(result.debtPayment)} al mes`;
    document.querySelector('#metric-networth').textContent = money.format(result.netWorth);
    document.querySelector('#income-reading').textContent = result.income > 0 ? 'Este es el ingreso mensual normalizado contra el que se comparan todos los compromisos.' : 'Sin ingreso mensual no es posible sostener gastos ni calcular proporciones saludables.';
    document.querySelector('#surplus-reading').textContent = result.surplus < 0 ? 'El presupuesto termina en déficit: cada mes falta dinero para cubrir lo declarado.' : result.margin < 10 ? 'Existe excedente, pero el margen es estrecho ante cualquier imprevisto.' : 'El presupuesto genera un margen positivo que puede convertirse en reserva y objetivos.';
    document.querySelector('#total-solvency-reading').textContent = result.totalSolvency === Infinity ? 'No registraste obligaciones pendientes; los activos declarados están libres de esa presión.' : !Number.isFinite(result.totalSolvency) ? 'Faltan activos u obligaciones para interpretar esta relación.' : result.totalSolvency < 100 ? 'Las obligaciones superan los activos declarados; el patrimonio está en posición vulnerable.' : result.totalSolvency < 150 ? 'Los activos cubren las obligaciones, aunque con un colchón patrimonial limitado.' : 'Los activos superan ampliamente las obligaciones declaradas.';
    document.querySelector('#debt-metric-reading').textContent = result.debtRatio > 35 ? 'Más de 35% del ingreso va a cuotas: la deuda restringe fuertemente la capacidad de maniobra.' : result.debtRatio > 20 ? 'La deuda es relevante pero todavía manejable si no aumentan las cuotas.' : result.debtPayment > 0 ? 'La carga de deuda se mantiene en un rango moderado.' : 'No se registraron cuotas mensuales de deuda.';
    document.querySelector('#networth-reading').textContent = result.netWorth < 0 ? 'El saldo es negativo: las obligaciones pendientes superan las reservas y activos.' : result.netWorth === 0 ? 'Los activos y obligaciones se encuentran equilibrados, sin patrimonio neto acumulado.' : 'Existe patrimonio positivo después de descontar todas las obligaciones declaradas.';
    document.querySelector('#result-message').textContent = mainMessage(result);
    document.querySelector('#result-secondary-message').textContent = solvencyMessage(result);
    document.querySelector('#metric-essential-rate').textContent = percent(result.essentialRatio);
    document.querySelector('#metric-essential-value').textContent = money.format(result.essential);
    document.querySelector('#metric-leisure-rate').textContent = percent(result.leisureRatio);
    document.querySelector('#metric-leisure-value').textContent = money.format(result.discretionary);
    document.querySelector('#metric-debt-rate').textContent = percent(result.debtRatio);
    document.querySelector('#metric-debt-absolute').textContent = money.format(result.debtPayment);
    document.querySelector('#metric-saving-rate').textContent = percent(result.savingsRate);
    document.querySelector('#metric-saving-value').textContent = money.format(Math.max(result.surplus, 0));
    document.querySelector('#essential-reading').textContent = result.essentialRatio > 60 ? 'Tus necesidades consumen una parte alta del ingreso. Revisa vivienda, servicios y transporte antes de recortar rubros básicos indiscriminadamente.' : 'Tus gastos necesarios guardan una proporción manejable frente al ingreso declarado.';
    document.querySelector('#leisure-reading').textContent = result.discretionary > 0 ? `Este rubro es flexible. Redirigir ${Math.round(result.savingShare * 100)}% liberaría ${money.format(result.suggestedSaving)} cada mes sin eliminar completamente el ocio.` : 'No declaraste gastos de ocio o compras discrecionales; la mejora deberá venir de ingresos, costos esenciales o deuda.';
    document.querySelector('#debt-reading').textContent = result.debtRatio > 35 ? 'La deuda supera el rango prudente del ingreso. Prioriza las obligaciones de mayor costo y evita nuevas cuotas.' : result.debtPayment > 0 ? 'La carga mensual de deuda está por debajo del umbral de alerta, pero debe vigilarse junto con el resto de gastos.' : 'No declaraste cuotas mensuales de deuda.';
    document.querySelector('#saving-reading').textContent = result.suggestedSaving > 0 ? `Meta sugerida: trasladar ${money.format(result.suggestedSaving)} del ocio al ahorro; equivale a ${percent(result.income > 0 ? result.suggestedSaving / result.income * 100 : NaN)} del ingreso y ${money.format(result.suggestedSaving * 12)} al año.` : result.surplus > 0 ? `Tu excedente actual de ${money.format(result.surplus)} puede convertirse en ahorro automático mensual.` : 'Primero recupera un excedente mensual; actualmente no hay gasto discrecional declarado que pueda redirigirse.';
    document.querySelector('#formula-income').textContent = `${money.format(number('income'))} ingreso principal + ${money.format(number('extraIncome'))} adicionales, ajustados por frecuencia = ${money.format(result.income)} mensuales.`;
    document.querySelector('#formula-essential').textContent = `${money.format(number('housing'))} vivienda + ${money.format(number('food'))} alimentación + ${money.format(number('transport'))} transporte + ${money.format(number('utilities'))} servicios + ${money.format(number('educationHealth'))} educación/salud + ${money.format(number('otherEssential'))} otros = ${money.format(result.essential)}; ${money.format(result.essential)} ÷ ${money.format(result.income)} = ${percent(result.essentialRatio)}.`;
    document.querySelector('#formula-leisure').textContent = `${money.format(number('leisure'))} ocio/suscripciones + ${money.format(number('personal'))} compras = ${money.format(result.discretionary)}; ${money.format(result.discretionary)} ÷ ${money.format(result.income)} = ${percent(result.leisureRatio)}.`;
    document.querySelector('#formula-debt').textContent = `${money.format(number('personalDebt'))} préstamos + ${money.format(number('cardDebt'))} tarjetas + ${money.format(number('securedDebt'))} vehículo/hipoteca + ${money.format(number('otherDebt'))} otras cuotas = ${money.format(result.debtPayment)}; ${money.format(result.debtPayment)} ÷ ${money.format(result.income)} = ${percent(result.debtRatio)}.`;
    document.querySelector('#formula-total').textContent = `(${money.format(result.liquid)} reservas + ${money.format(number('assets'))} inversiones/activos) ÷ (${money.format(number('debtBalance'))} deuda pendiente + ${money.format(number('otherLiabilities'))} otras obligaciones) = ${result.totalSolvency === Infinity ? 'sin obligaciones registradas' : percent(result.totalSolvency)}.`;
    document.querySelector('#formula-saving').textContent = `${money.format(result.discretionary)} de ocio × ${Math.round(result.savingShare * 100)}% = ${money.format(result.suggestedSaving)} de ahorro mensual sugerido; × 12 = ${money.format(result.suggestedSaving * 12)} anual.`;

    const base = Math.max(result.income, result.totalExpense, 1);
    document.querySelector('#bar-essential').style.width = `${clamp(result.essential / base * 100, 0, 100)}%`;
    document.querySelector('#bar-debt').style.width = `${clamp(result.debtPayment / base * 100, 0, 100)}%`;
    document.querySelector('#bar-discretionary').style.width = `${clamp(result.discretionary / base * 100, 0, 100)}%`;
    document.querySelector('#bar-free').style.width = `${clamp(Math.max(result.surplus, 0) / base * 100, 0, 100)}%`;

    const slider = document.querySelector('#simulation-reduction');
    slider.max = Math.max(100, Math.ceil(result.discretionary));
    slider.value = 0;
    updateSimulation();
    showView('results');
  }

  function updateSimulation() {
    if (!lastResult) return;
    const reduction = Number(document.querySelector('#simulation-reduction').value);
    const newSurplus = lastResult.surplus + reduction;
    const newMargin = lastResult.income > 0 ? newSurplus / lastResult.income * 100 : NaN;
    document.querySelector('#simulation-label').textContent = money.format(reduction);
    document.querySelector('#simulation-result').textContent = `Nuevo excedente: ${money.format(newSurplus)} · Nuevo margen: ${percent(newMargin)}. Proyección educativa, no cambio realizado.`;
  }

  function resetDiagnostic() {
    form.reset();
    lastResult = null;
    showView('welcome');
    showStep(1);
  }

  function handleAction(button) {
    const action = button.dataset.action;
    if (action === 'start') { showView('form'); showStep(1); }
    if (action === 'back') showStep(currentStep - 1);
    if (action === 'next') {
      if (!validateCurrentStep()) return;
      if (currentStep < steps.length) showStep(currentStep + 1);
      else renderResults();
    }
    if (action === 'reset') resetDiagnostic();
    if (action === 'print') window.print();
    if (action === 'plan' && lastResult) {
      document.querySelector('#result-message').innerHTML = `<strong>Días 1–30:</strong> registra y controla. <strong>Días 31–60:</strong> reorganiza gastos y obligaciones. <strong>Días 61–90:</strong> construye reserva y patrimonio.`;
      button.textContent = 'Plan de 90 días visible';
    }
  }

  function startDiagnostic(event) {
    event?.preventDefault();
    event?.stopPropagation();
    showView('form');
    showStep(1);
    requestAnimationFrame(() => {
      const firstField = form.querySelector('[name="income"]');
      firstField?.focus({ preventScroll: true });
    });
  }

  startButton?.addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    document.querySelector('#start-test-toggle').checked = true;
    startDiagnostic(event);
  });

  startButton?.addEventListener('click', startDiagnostic);

  root.querySelectorAll('[data-action]:not([data-action="start"]):not([data-action="next"])').forEach(button => {
    button.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      handleAction(button);
    });
  });

  form.addEventListener('submit', event => {
    event.preventDefault();
    event.stopPropagation();
    handleAction(nextButton);
  });
  nextButton.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    handleAction(nextButton);
  });

  document.querySelector('#simulation-reduction')?.addEventListener('input', updateSimulation);
  showStep(1);
  showView('welcome');
  root.classList.add('js-ready');
  window.__financialDiagnosticReady = true;
})();
