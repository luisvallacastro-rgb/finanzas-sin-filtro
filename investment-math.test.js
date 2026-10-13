const assert = require('assert');
const finance = require('./investment-math.js');

const close = (actual, expected, tolerance, label) => assert.ok(Math.abs(actual - expected) <= tolerance, `${label}: ${actual} != ${expected}`);
const base = finance.evaluate(5000, [2200, 2200, 2200], 0.12);
close(base.npv, 284.028790087463, 1e-8, 'Base NPV');
close(base.irr.roots[0], 0.152783406, 1e-7, 'Base IRR');
assert.strictEqual(base.irr.status, 'unique');
assert.ok(finance.npv(5000, [1000, 1000, 1000], 0.12) < 0, 'Negative NPV');
close(finance.npv(5000, [5000], 0), 0, 1e-9, 'Zero rate and zero NPV');
assert.ok(finance.npv(5000, [-500, 7000], 0.1) > 0, 'Variable flows');
assert.strictEqual(finance.irr(5000, [-100, -200]).status, 'none');
assert.strictEqual(finance.payback(5000, [1000, 1000], 0.1, false), null);
assert.ok(finance.payback(5000, [3000, 3000], 0.1, false) > 1);
assert.ok(Number.isFinite(finance.npv(5000, [2200, 2200, 2200], -0.1)), 'Valid negative discount rate');
console.log('Investment math verified: NPV, IRR, payback, variable and negative flows.');
