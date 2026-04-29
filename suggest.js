// ===== Stock Suggester Engine =====
const Suggester = (() => {

  // Score a single stock from 0–100 based on available quote data
  function scoreStock(d) {
    if (!d) return null;
    let score = 50; // baseline
    const reasons = [];

    // 1. Momentum: today's % change (weight: 30pts)
    const pct = d.changePct;
    if (pct >= 3)       { score += 30; reasons.push('Strong upward momentum'); }
    else if (pct >= 1)  { score += 18; reasons.push('Positive momentum'); }
    else if (pct >= 0)  { score += 8;  reasons.push('Slightly positive'); }
    else if (pct >= -1) { score -= 5;  reasons.push('Slightly negative'); }
    else if (pct >= -3) { score -= 18; reasons.push('Negative momentum'); }
    else                { score -= 30; reasons.push('Strong downward momentum'); }

    // 2. Volume signal (weight: 20pts) — high volume on up day = bullish
    const vol = d.volume;
    if (vol > 50e6 && pct > 0)       { score += 20; reasons.push('High volume buying'); }
    else if (vol > 20e6 && pct > 0)  { score += 12; reasons.push('Above-avg volume'); }
    else if (vol > 50e6 && pct < 0)  { score -= 15; reasons.push('High volume selling'); }
    else if (vol < 5e6)               { score -= 5;  reasons.push('Low volume'); }

    // 3. Day range position (weight: 15pts) — price near high = bullish
    if (d.dayHigh && d.dayLow && d.dayHigh !== d.dayLow) {
      const rangePct = (d.price - d.dayLow) / (d.dayHigh - d.dayLow);
      if (rangePct >= 0.8)      { score += 15; reasons.push('Near day high'); }
      else if (rangePct >= 0.5) { score += 7;  reasons.push('Upper half of range'); }
      else if (rangePct <= 0.2) { score -= 12; reasons.push('Near day low'); }
    }

    // 4. Price level sanity (weight: 5pts) — penalise penny stocks
    if (d.price < 5)  score -= 10;
    if (d.price > 10) score += 5;

    score = Math.max(0, Math.min(100, Math.round(score)));
    return { symbol: d.symbol, name: d.name, price: d.price, changePct: d.changePct,
             change: d.change, score, reasons, isMock: d.isMock };
  }

  function getRating(score) {
    if (score >= 80) return { label: 'Strong Buy',  color: '#26c281', stars: '★★★★★' };
    if (score >= 65) return { label: 'Buy',          color: '#52d68a', stars: '★★★★☆' };
    if (score >= 50) return { label: 'Hold',         color: '#f39c12', stars: '★★★☆☆' };
    if (score >= 35) return { label: 'Weak',         color: '#e67e22', stars: '★★☆☆☆' };
    return             { label: 'Avoid',             color: '#e74c3c', stars: '★☆☆☆☆' };
  }

  function render(stockData, historyCache) {
    const panel = document.getElementById('bestPick');
    const body  = document.getElementById('bestPickBody');
    const reason = document.getElementById('bestPickReason');
    if (!panel || !body) return;

    const scored = Object.values(stockData)
      .map(d => scoreStock(d))
      .filter(Boolean)
      .sort((a, b) => b.score - a.score);

    if (scored.length === 0) { panel.style.display = 'none'; return; }

    const top = scored[0];
    const rating = getRating(top.score);
    const arrow = top.changePct >= 0 ? '▲' : '▼';
    const cls   = top.changePct >= 0 ? 'up' : 'down';

    panel.style.display = 'block';
    reason.textContent = rating.label;
    reason.style.color = rating.color;

    body.innerHTML = `
      <div class="bp-main" data-symbol="${top.symbol}">
        <div class="bp-left">
          <span class="bp-symbol">${top.symbol}</span>
          <span class="bp-name">${top.name || top.symbol}</span>
          <span class="bp-stars" style="color:${rating.color}">${rating.stars}</span>
        </div>
        <div class="bp-right">
          <span class="bp-price">$${top.price.toFixed(2)}</span>
          <span class="bp-change ${cls}">${arrow} ${Math.abs(top.changePct).toFixed(2)}%</span>
          <span class="bp-score" style="background:${rating.color}22;color:${rating.color}">Score ${top.score}/100</span>
        </div>
      </div>
      <div class="bp-reasons">
        ${top.reasons.slice(0, 3).map(r => `<span class="bp-tag">✓ ${r}</span>`).join('')}
      </div>
      <div class="bp-ranking">
        ${scored.slice(0, 5).map((s, i) => {
          const r = getRating(s.score);
          const a = s.changePct >= 0 ? '▲' : '▼';
          const c = s.changePct >= 0 ? 'up' : 'down';
          return `<div class="bp-rank-row ${i === 0 ? 'bp-rank-top' : ''}" data-symbol="${s.symbol}">
            <span class="bp-rank-pos">#${i + 1}</span>
            <span class="bp-rank-sym">${s.symbol}</span>
            <span class="bp-rank-label" style="color:${r.color}">${r.label}</span>
            <span class="bp-rank-chg ${c}">${a}${Math.abs(s.changePct).toFixed(2)}%</span>
            <div class="bp-rank-bar"><div style="width:${s.score}%;background:${r.color};height:100%;border-radius:2px"></div></div>
          </div>`;
        }).join('')}
      </div>
      ${top.isMock ? '<p class="bp-disclaimer">⚠ Demo data — not real market data</p>' : '<p class="bp-disclaimer">ℹ For informational purposes only. Not financial advice.</p>'}
    `;

    // Click any rank row or main card to select that stock
    body.querySelectorAll('[data-symbol]').forEach(el => {
      el.style.cursor = 'pointer';
      el.addEventListener('click', () => {
        if (typeof selectSymbol === 'function') selectSymbol(el.dataset.symbol);
      });
    });
  }

  return { render, scoreStock, getRating };
})();
