const assert = require('node:assert/strict');
const cases = require('./debt-math.js');
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-10, `${actual} ≠ ${expected}`);

assert.equal(cases.capital.unleveraged.assets, cases.capital.unleveraged.liabilities + cases.capital.unleveraged.equity);
assert.equal(cases.capital.leveraged.assets, cases.capital.leveraged.liabilities + cases.capital.leveraged.equity);
assert.equal(cases.capital.interest, 600);
const custom = cases.calculate({ assets: 12000, debt: 3000, debtRate: 0.1, roa: 0.15 });
assert.equal(custom.equityLeveraged, 9000);
assert.equal(custom.interest, 300);
assert.equal(custom.operatingResult, 1800);
close(custom.roeLeveraged, 1 / 6);

assert.equal(cases.favorable.operatingResult, 2000);
assert.equal(cases.favorable.roeUnleveraged, 0.20);
assert.equal(cases.favorable.roeLeveraged, 0.28);
close(cases.favorable.roeLeveraged, cases.favorable.roeLeveragedByFormula);

assert.equal(cases.unfavorable.operatingResult, 800);
assert.equal(cases.unfavorable.roeUnleveraged, 0.08);
assert.equal(cases.unfavorable.roeLeveraged, 0.04);
close(cases.unfavorable.roeLeveraged, cases.unfavorable.roeLeveragedByFormula);

assert.equal(cases.loss.operatingResult, -500);
assert.equal(cases.loss.roeUnleveraged, -0.05);
assert.equal(cases.loss.roeLeveraged, -0.22);
close(cases.loss.roeLeveraged, cases.loss.roeLeveragedByFormula);

close((cases.favorable.roeLeveraged - cases.favorable.roeUnleveraged) * 100, 8);
close((cases.unfavorable.roeLeveraged - cases.unfavorable.roeUnleveraged) * 100, -4);
close((cases.loss.roeLeveraged - cases.loss.roeUnleveraged) * 100, -17);

console.log('Debt scenarios verified: accounting equation, interest, ROA, ROE and percentage-point differences.');
