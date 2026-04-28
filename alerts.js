// ===== Alert Manager =====
const AlertManager = (() => {
  let alerts = JSON.parse(localStorage.getItem('stockAlerts') || '[]');

  function save() {
    localStorage.setItem('stockAlerts', JSON.stringify(alerts));
  }

  function add(symbol, condition, price) {
    if (alerts.length >= 100) return false;
    alerts.push({ id: Date.now(), symbol, condition, price: parseFloat(price), triggered: false });
    save();
    return true;
  }

  function remove(id) {
    alerts = alerts.filter(a => a.id !== id);
    save();
  }

  function check(symbol, currentPrice) {
    const triggered = [];
    alerts.forEach(alert => {
      if (alert.triggered || alert.symbol !== symbol) return;
      const hit = (alert.condition === 'above' && currentPrice >= alert.price) ||
                  (alert.condition === 'below' && currentPrice <= alert.price);
      if (hit) {
        alert.triggered = true;
        triggered.push(alert);
      }
    });
    if (triggered.length) save();
    return triggered;
  }

  function getAll() { return [...alerts]; }

  function updateSymbolSelect(symbols) {
    const sel = document.getElementById('alertSymbol');
    const current = sel.value;
    sel.innerHTML = '<option value="">Select symbol</option>';
    symbols.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s;
      opt.textContent = s;
      sel.appendChild(opt);
    });
    if (current) sel.value = current;
  }

  function render() {
    const list = document.getElementById('alertsList');
    const count = document.getElementById('alertCount');
    const active = alerts.filter(a => !a.triggered);
    count.textContent = active.length;
    count.classList.toggle('visible', active.length > 0);

    if (alerts.length === 0) {
      list.innerHTML = '<p class="empty-state">No alerts set.</p>';
      return;
    }

    list.innerHTML = alerts.map(a => `
      <div class="alert-item ${a.triggered ? 'triggered' : ''}" data-id="${a.id}">
        <div class="alert-info">
          <span class="alert-sym">${a.symbol}</span>
          <span class="alert-cond">${a.condition === 'above' ? '▲ Above' : '▼ Below'} $${a.price.toFixed(2)}${a.triggered ? ' ✓ Triggered' : ''}</span>
        </div>
        <button class="alert-del" data-id="${a.id}">✕</button>
      </div>
    `).join('');

    list.querySelectorAll('.alert-del').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        remove(parseInt(btn.dataset.id));
        render();
      });
    });
  }

  return { add, remove, check, getAll, render, updateSymbolSelect };
})();
