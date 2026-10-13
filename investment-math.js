(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.investmentMath = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  const EPSILON = 1e-9;

  function npv(initialInvestment, flows, rate) {
    if (!Number.isFinite(initialInvestment) || !Array.isArray(flows) || !Number.isFinite(rate) || rate <= -1) return Number.NaN;
    return -initialInvestment + flows.reduce((total, flow, index) => total + Number(flow || 0) / Math.pow(1 + rate, index + 1), 0);
  }

  function bisection(initialInvestment, flows, low, high) {
    let left = low;
    let right = high;
    let leftValue = npv(initialInvestment, flows, left);
    for (let iteration = 0; iteration < 160; iteration += 1) {
      const middle = (left + right) / 2;
      const middleValue = npv(initialInvestment, flows, middle);
      if (Math.abs(middleValue) < 1e-10 || Math.abs(right - left) < 1e-10) return middle;
      if (Math.sign(leftValue) === Math.sign(middleValue)) {
        left = middle;
        leftValue = middleValue;
      } else right = middle;
    }
    return (left + right) / 2;
  }

  function irr(initialInvestment, flows) {
    const cashFlows = [-initialInvestment].concat(flows.map(value => Number(value || 0)));
    const signChanges = cashFlows.slice(1).reduce((count, value, index) => {
      const previous = cashFlows[index];
      return value && previous && Math.sign(value) !== Math.sign(previous) ? count + 1 : count;
    }, 0);
    if (!cashFlows.some(value => value > 0) || !cashFlows.some(value => value < 0)) return { roots: [], status: 'none', signChanges };

    const grid = [];
    for (let i = 0; i <= 2400; i += 1) {
      const normalized = i / 2400;
      grid.push(-0.999 + Math.pow(normalized, 1.7) * 10.999);
    }
    const roots = [];
    let previousRate = grid[0];
    let previousValue = npv(initialInvestment, flows, previousRate);
    grid.slice(1).forEach(rate => {
      const value = npv(initialInvestment, flows, rate);
      if (Number.isFinite(previousValue) && Number.isFinite(value)) {
        if (Math.abs(value) < EPSILON) roots.push(rate);
        else if (Math.sign(previousValue) !== Math.sign(value)) roots.push(bisection(initialInvestment, flows, previousRate, rate));
      }
      previousRate = rate;
      previousValue = value;
    });
    const unique = roots.filter((rootValue, index) => index === 0 || Math.abs(rootValue - roots[index - 1]) > 1e-5);
    return { roots: unique, status: unique.length === 0 ? 'none' : unique.length === 1 && signChanges <= 1 ? 'unique' : 'multiple', signChanges };
  }

  function matrix(initialInvestment, flows, rate) {
    let nominal = -initialInvestment;
    let discounted = -initialInvestment;
    const rows = [{ period: 0, flow: -initialInvestment, factor: 1, presentValue: -initialInvestment, nominal, discounted }];
    flows.forEach((rawFlow, index) => {
      const flow = Number(rawFlow || 0);
      const factor = 1 / Math.pow(1 + rate, index + 1);
      const presentValue = flow * factor;
      nominal += flow;
      discounted += presentValue;
      rows.push({ period: index + 1, flow, factor, presentValue, nominal, discounted });
    });
    return rows;
  }

  function payback(initialInvestment, flows, rate, discounted) {
    let cumulative = -initialInvestment;
    for (let index = 0; index < flows.length; index += 1) {
      const flow = Number(flows[index] || 0) / (discounted ? Math.pow(1 + rate, index + 1) : 1);
      const previous = cumulative;
      cumulative += flow;
      if (cumulative >= 0 && flow > 0) return index + (-previous / flow);
    }
    return null;
  }

  function evaluate(initialInvestment, flows, rate) {
    const van = npv(initialInvestment, flows, rate);
    const tir = irr(initialInvestment, flows);
    return {
      npv: van,
      irr: tir,
      matrix: matrix(initialInvestment, flows, rate),
      simplePayback: payback(initialInvestment, flows, rate, false),
      discountedPayback: payback(initialInvestment, flows, rate, true)
    };
  }

  return { npv, irr, matrix, payback, evaluate };
});
