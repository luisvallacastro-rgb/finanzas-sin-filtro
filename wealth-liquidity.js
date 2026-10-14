(() => {
  const assetsInput = document.querySelector('#wealth-assets');
  if (!assetsInput) return;
  const liabilitiesInput = document.querySelector('#wealth-liabilities');
  const cashInput = document.querySelector('#wealth-cash');
  const dueInput = document.querySelector('#wealth-due');
  const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  const value = input => Math.max(0, Number(input.value) || 0);
  const signedMoney = amount => amount < 0 ? `−${currency.format(Math.abs(amount))}` : currency.format(amount);

  function render() {
    const assets = value(assetsInput);
    const liabilities = value(liabilitiesInput);
    const cash = value(cashInput);
    const due = value(dueInput);
    const netWorth = assets - liabilities;
    const gap = cash - due;
    const scale = Math.max(cash, due, 1);
    const netWorthNode = document.querySelector('#wealth-net-worth');
    const gapNode = document.querySelector('#wealth-gap');
    netWorthNode.textContent = signedMoney(netWorth);
    gapNode.textContent = signedMoney(gap);
    netWorthNode.classList.toggle('is-negative', netWorth < 0);
    gapNode.classList.toggle('is-positive', gap >= 0);
    document.querySelector('#wealth-cash-label').textContent = currency.format(cash);
    document.querySelector('#wealth-due-label').textContent = currency.format(due);
    document.querySelector('#wealth-cash-bar').style.width = `${cash / scale * 100}%`;
    document.querySelector('#wealth-due-bar').style.width = `${due / scale * 100}%`;
  }

  [assetsInput, liabilitiesInput, cashInput, dueInput].forEach(input => input.addEventListener('input', render));
  render();
})();
