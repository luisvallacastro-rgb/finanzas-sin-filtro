(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.debtCases = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const assets = 10000;
  const debt = 5000;
  const equityLeveraged = 5000;
  const equityUnleveraged = 10000;
  const debtRate = 0.12;
  const interest = debt * debtRate;

  function scenario(roa) {
    const operatingResult = assets * roa;
    const unleveragedResult = operatingResult;
    const leveragedResult = operatingResult - interest;
    return {
      roa,
      operatingResult,
      interest,
      unleveragedResult,
      leveragedResult,
      roeUnleveraged: unleveragedResult / equityUnleveraged,
      roeLeveraged: leveragedResult / equityLeveraged,
      roeLeveragedByFormula: roa + (roa - debtRate) * (debt / equityLeveraged),
    };
  }

  return {
    capital: {
      unleveraged: { assets, liabilities: 0, equity: equityUnleveraged },
      leveraged: { assets, liabilities: debt, equity: equityLeveraged },
      debtRate,
      interest,
    },
    favorable: scenario(0.20),
    unfavorable: scenario(0.08),
    loss: scenario(-0.05),
  };
});
