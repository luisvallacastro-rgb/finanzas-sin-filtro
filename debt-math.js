(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.debtCases = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const defaults = { assets: 10000, debt: 5000, debtRate: 0.12 };

  function calculate({ assets = defaults.assets, debt = defaults.debt, debtRate = defaults.debtRate, roa = 0 } = {}) {
    const equityLeveraged = assets - debt;
    const equityUnleveraged = assets;
    const interest = debt * debtRate;
    const operatingResult = assets * roa;
    const unleveragedResult = operatingResult;
    const leveragedResult = operatingResult - interest;
    const valid = assets > 0 && debt >= 0 && equityLeveraged > 0;
    return {
      valid,
      assets,
      debt,
      debtRate,
      equityLeveraged,
      equityUnleveraged,
      roa,
      operatingResult,
      interest,
      unleveragedResult,
      leveragedResult,
      roeUnleveraged: unleveragedResult / equityUnleveraged,
      roeLeveraged: leveragedResult / equityLeveraged,
      roeLeveragedByFormula: roa + (roa - debtRate) * (debt / equityLeveraged),
      delta: leveragedResult / equityLeveraged - unleveragedResult / equityUnleveraged,
    };
  }

  function scenario(roa) { return calculate({ ...defaults, roa }); }

  const capitalCase = calculate({ ...defaults, roa: 0 });

  return {
    defaults,
    calculate,
    capital: {
      unleveraged: { assets: defaults.assets, liabilities: 0, equity: defaults.assets },
      leveraged: { assets: defaults.assets, liabilities: defaults.debt, equity: capitalCase.equityLeveraged },
      debtRate: defaults.debtRate,
      interest: capitalCase.interest,
    },
    favorable: scenario(0.20),
    unfavorable: scenario(0.08),
    loss: scenario(-0.05),
  };
});
