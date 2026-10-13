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
    const netWorth = liquid + number('assets') - liabilities;

    const marginScore = Number.isFinite(margin) ? clamp((margin + 5) / 25 * 30, 0, 30) : 0;
    const debtScore = Number.isFinite(debtRatio) ? clamp(25 - debtRatio / 45 * 25, 0, 25) : 0;
    const reserveScore = Number.isFinite(resistance) ? clamp(resistance / 90 * 25, 0, 25) : 0;
    const balanceScore = Number.isFinite(commitment) ? clamp((110 - commitment) / 30 * 20, 0, 20) : 0;
    const score = Math.round(marginScore + debtScore + reserveScore + balanceScore);
    const classification = score < 40 ? 'Solvencia crítica' : score < 60 ? 'Solvencia baja' : score < 80 ? 'Solvencia moderada' : 'Solvencia sólida';

    return { income, essential, discretionary, debtPayment, totalExpense, surplus, margin, debtRatio, commitment, resistance, netWorth, score, classification };
  }

  function mainMessage(result) {
    if (result.surplus < 0) return `Tus gastos superan tus ingresos por ${money.format(Math.abs(result.surplus))}. Antes de invertir, conviene recuperar el equilibrio mensual.`;
    if (result.debtRatio >= 35) return `De cada $100 que recibes, ${result.debtRatio.toFixed(0)} se destinan a obligaciones financieras. Revisa sus costos antes de asumir nuevas deudas.`;
    if (Number.isFinite(result.resistance) && result.resistance < 30) return `Tus reservas cubrirían aproximadamente ${result.resistance.toFixed(0)} días de gastos esenciales y cuotas, según los datos declarados.`;
    return `Tu margen disponible es ${percent(result.margin)}. Ese espacio puede convertirse en protección, objetivos y patrimonio con un plan consistente.`;
  }

  function renderResults() {
    const result = calculate();
    lastResult = result;
    document.querySelector('#health-score').textContent = result.score;
    document.querySelector('#result-status').textContent = result.classification;
    document.querySelector('#metric-income').textContent = money.format(result.income);
    document.querySelector('#metric-surplus').textContent = money.format(result.surplus);
    document.querySelector('#metric-debt').textContent = percent(result.debtRatio);
    document.querySelector('#metric-commitment').textContent = percent(result.commitment);
    document.querySelector('#metric-resistance').textContent = Number.isFinite(result.resistance) ? `${result.resistance.toFixed(1)} días` : 'No calculable';
    document.querySelector('#metric-networth').textContent = money.format(result.netWorth);
    document.querySelector('#result-message').textContent = mainMessage(result);

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
    event?.stopPropagation();
    showView('form');
    showStep(1);
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

  root.addEventListener('click', event => {
    const trigger = event.target.closest('#start-diagnostic');
    if (trigger) startDiagnostic(event);
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
