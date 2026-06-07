// ===== Should I Buy? — Full Database Scanner =====
const StockScanner = (() => {
  let scanResults = {};
  let scanMarket  = 'US';
  let isScanning  = false;
  const API_BASE  = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
    ? 'https://stockpulse-monitor.netlify.app/.netlify/functions'
    : '/.netlify/functions';

  function getUniverse() {
    return scanMarket === 'IN' ? UNIVERSE_IN : UNIVERSE_US;
  }

  function verdictColor(v) {
    if (!v) return '#9ea3c0';
    const map = {
      'Strong Buy':'#26c281','Buy':'#52d68a','Cautious Buy':'#f39c12',
      'Hold / Wait':'#e67e22','Avoid':'#e74c3c','Strong Avoid':'#c0392b'
    };
    return map[v] || '#9ea3c0';
  }
  function verdictBg(v) {
    if (!v) return 'transparent';
    const map = {
      'Strong Buy':'rgba(38,194,129,0.12)','Buy':'rgba(82,214,138,0.10)',
      'Cautious Buy':'rgba(243,156,18,0.10)','Hold / Wait':'rgba(230,126,34,0.10)',
      'Avoid':'rgba(231,76,60,0.10)','Strong Avoid':'rgba(192,57,43,0.10)'
    };
    return map[v] || 'transparent';
  }
  function verdictEmoji(v) {
    if (!v) return '⬜';
    if (v === 'Strong Buy' || v === 'Buy') return '🟢';
    if (v === 'Cautious Buy') return '🟡';
    if (v === 'Hold / Wait') return '🟡';
    return '🔴';
  }

  async function scanAll() {
    if (isScanning) return;
    isScanning = true;
    scanResults = {};
    const universe = getUniverse();
    const total = universe.length;
    let done = 0;

    showProgress(0, total, 'Starting scan…');

    // Process in batches of 5 (forecast is heavier than quote)
    const batches = [];
    for (let i = 0; i < universe.length; i += 5) batches.push(universe.slice(i, i + 5));

    for (const batch of batches) {
      await Promise.allSettled(batch.map(async ({ symbol, name, sector }) => {
        try {
          const res = await fetch(`${API_BASE}/forecast?symbol=${encodeURIComponent(symbol)}`, {
            signal: AbortSignal.timeout(15000)
          });
          if (!res.ok) throw new Error('bad');
          const data = await res.json();
          if (data.error) throw new Error(data.error);
          scanResults[symbol] = {
            symbol, name, sector,
            currentPrice:      data.currentPrice,
            currency:          data.currency,
            histCAGR:          data.histCAGR,
            annualVolatility:  data.annualVolatility,
            maxDrawdown:       data.maxDrawdown,
            sharpeRatio:       data.sharpeRatio,
            rsi:               data.rsi,
            outlook:           data.outlook,
            riskLevel:         data.riskLevel,
            riskColor:         data.riskColor,
            proj5YBase:        data.projections?.[4]?.baseRet,
            proj5YBull:        data.projections?.[4]?.bullRet,
            proj5YBear:        data.projections?.[4]?.bearRet,
            verdict:           data.investmentVerdict?.verdict,
            verdictScore:      data.investmentVerdict?.verdictScore,
            verdictSummary:    data.investmentVerdict?.verdictSummary,
            strategy:          data.investmentVerdict?.suggestedStrategy,
            timing:            data.investmentVerdict?.bestTimeToInvest,
            verdictFactors:    data.investmentVerdict?.verdictFactors || [],
          };
        } catch {
          scanResults[symbol] = { symbol, name, sector, error: true };
        }
        done++;
        showProgress(done, total, `Analysed ${done}/${total}: ${symbol}`);
      }));
    }

    isScanning = false;
    renderResults();
  }

  function showProgress(done, total, msg) {
    const body = document.getElementById('scannerBody');
    if (!body) return;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    body.innerHTML = `
      <div class="scanner-progress">
        <div class="scanner-prog-bar-wrap">
          <div class="scanner-prog-bar" style="width:${pct}%"></div>
        </div>
        <div class="scanner-prog-text">${msg}</div>
        <div class="scanner-prog-pct">${pct}% complete — ${done}/${total} stocks analysed</div>
        ${done > 0 ? `<p style="font-size:0.75rem;color:var(--text2);margin-top:0.5rem">Results will appear below as each stock is analysed…</p>` : ''}
      </div>
      ${done > 0 ? renderPartialResults() : ''}`;
  }

  function renderPartialResults() {
    const ready = Object.values(scanResults).filter(r => !r.error && r.verdict);
    if (ready.length === 0) return '';
    const sorted = ready.sort((a, b) => (b.verdictScore || 0) - (a.verdictScore || 0));
    return `<div style="margin-top:1rem">
      <div class="scanner-section-title">Results so far (${ready.length} stocks)</div>
      ${sorted.slice(0, 10).map(r => scanRow(r)).join('')}
    </div>`;
  }

  function renderResults() {
    const body = document.getElementById('scannerBody');
    if (!body) return;
    const all    = Object.values(scanResults);
    const valid  = all.filter(r => !r.error && r.verdict).sort((a, b) => (b.verdictScore || 0) - (a.verdictScore || 0));
    const errors = all.filter(r => r.error);

    const buyNow    = valid.filter(r => r.verdict === 'Strong Buy' || r.verdict === 'Buy');
    const cautious  = valid.filter(r => r.verdict === 'Cautious Buy');
    const hold      = valid.filter(r => r.verdict === 'Hold / Wait');
    const avoid     = valid.filter(r => r.verdict === 'Avoid' || r.verdict === 'Strong Avoid');

    body.innerHTML = `
      <div class="scanner-summary">
        <div class="scanner-sum-item" style="background:rgba(38,194,129,0.1);border-color:rgba(38,194,129,0.3)">
          <span class="scanner-sum-num" style="color:#26c281">${buyNow.length}</span>
          <span class="scanner-sum-label">Buy Now</span>
        </div>
        <div class="scanner-sum-item" style="background:rgba(243,156,18,0.1);border-color:rgba(243,156,18,0.3)">
          <span class="scanner-sum-num" style="color:#f39c12">${cautious.length}</span>
          <span class="scanner-sum-label">Cautious</span>
        </div>
        <div class="scanner-sum-item" style="background:rgba(230,126,34,0.1);border-color:rgba(230,126,34,0.3)">
          <span class="scanner-sum-num" style="color:#e67e22">${hold.length}</span>
          <span class="scanner-sum-label">Hold/Wait</span>
        </div>
        <div class="scanner-sum-item" style="background:rgba(231,76,60,0.1);border-color:rgba(231,76,60,0.3)">
          <span class="scanner-sum-num" style="color:#e74c3c">${avoid.length}</span>
          <span class="scanner-sum-label">Avoid</span>
        </div>
      </div>

      <!-- Filter tabs -->
      <div class="scanner-filter-row">
        <button class="scanner-filter active" data-sf="all">All (${valid.length})</button>
        <button class="scanner-filter" data-sf="buy">🟢 Buy (${buyNow.length})</button>
        <button class="scanner-filter" data-sf="cautious">🟡 Cautious (${cautious.length})</button>
        <button class="scanner-filter" data-sf="avoid">🔴 Avoid (${avoid.length})</button>
      </div>

      <div id="scannerList">
        ${valid.map(r => scanRow(r)).join('')}
      </div>

      ${errors.length > 0 ? `<p style="font-size:0.72rem;color:var(--text2);margin-top:0.5rem">${errors.length} stocks could not be analysed (data unavailable)</p>` : ''}
      <p class="ideas-disclaimer">Analysis based on full historical data. Not financial advice. Always do your own research.</p>`;

    // Filter buttons
    body.querySelectorAll('.scanner-filter').forEach(btn => {
      btn.addEventListener('click', () => {
        body.querySelectorAll('.scanner-filter').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const f = btn.dataset.sf;
        let list = valid;
        if (f === 'buy')      list = buyNow;
        if (f === 'cautious') list = cautious;
        if (f === 'avoid')    list = avoid;
        document.getElementById('scannerList').innerHTML = list.map(r => scanRow(r)).join('');
        attachScannerClicks(body);
      });
    });

    attachScannerClicks(body);
  }

  function scanRow(r) {
    const vc   = verdictColor(r.verdict);
    const vb   = verdictBg(r.verdict);
    const ve   = verdictEmoji(r.verdict);
    const curr = r.currency === 'INR' ? '₹' : '$';
    const sym  = r.symbol.replace('.NS','').replace('.BO','');
    const proj = r.proj5YBase !== undefined ? `${r.proj5YBase >= 0 ? '+' : ''}${r.proj5YBase?.toFixed(1)}%` : '—';
    const projCls = r.proj5YBase >= 0 ? 'up' : 'down';
    const score = r.verdictScore || 0;
    return `
      <div class="scanner-row" data-symbol="${r.symbol}">
        <div class="scanner-row-main">
          <div class="scanner-row-left">
            <span class="scanner-sym">${sym}</span>
            <span class="scanner-sector">${SECTOR_ICONS[r.sector] || ''} ${r.sector || ''}</span>
          </div>
          <div class="scanner-row-mid">
            <span class="scanner-price">${curr}${(r.currentPrice || 0).toFixed(2)}</span>
            <span class="scanner-cagr ${r.histCAGR >= 0 ? 'up' : 'down'}">${r.histCAGR >= 0 ? '+' : ''}${r.histCAGR?.toFixed(1)}% CAGR</span>
          </div>
          <div class="scanner-row-right">
            <span class="scanner-verdict-badge" style="background:${vb};color:${vc};border:1px solid ${vc}44">${ve} ${r.verdict || '—'}</span>
            <span class="scanner-score" style="color:${vc}">${score}/100</span>
          </div>
        </div>
        <div class="scanner-row-bar">
          <div class="scanner-score-bar" style="width:${score}%;background:${vc}"></div>
        </div>
        <div class="scanner-row-detail">
          <span class="scanner-detail-item">5Y Base: <strong class="${projCls}">${proj}</strong></span>
          <span class="scanner-detail-item">Risk: <strong style="color:${r.riskColor}">${r.riskLevel || '—'}</strong></span>
          <span class="scanner-detail-item">Sharpe: <strong>${r.sharpeRatio?.toFixed(2) || '—'}</strong></span>
          <span class="scanner-detail-item">RSI: <strong>${r.rsi?.toFixed(0) || '—'}</strong></span>
        </div>
        ${r.verdictSummary ? `<div class="scanner-row-summary">${r.verdictSummary}</div>` : ''}
        ${r.strategy ? `<div class="scanner-row-strategy">📋 ${r.strategy}</div>` : ''}
        <div class="scanner-row-actions">
          <button class="scanner-btn-chart" data-symbol="${r.symbol}">📈 Chart</button>
          <button class="scanner-btn-forecast" data-symbol="${r.symbol}">🔮 Full Forecast</button>
          <button class="scanner-btn-add" data-symbol="${r.symbol}">+ Watchlist</button>
        </div>
      </div>`;
  }

  function attachScannerClicks(body) {
    body.querySelectorAll('.scanner-btn-chart').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        if (typeof selectSymbol === 'function') selectSymbol(btn.dataset.symbol);
        document.getElementById('ideasPanel').classList.remove('open');
      });
    });
    body.querySelectorAll('.scanner-btn-forecast').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        if (typeof ForecastPanel !== 'undefined') {
          ForecastPanel.run(btn.dataset.symbol);
          document.getElementById('ideasPanel').classList.remove('open');
        }
      });
    });
    body.querySelectorAll('.scanner-btn-add').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        if (typeof addSymbol === 'function') addSymbol(btn.dataset.symbol);
      });
    });
  }

  function init() {
    // Tab switching
    document.querySelectorAll('.ideas-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.ideas-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        document.querySelectorAll('.ideas-tab-content').forEach(c => c.classList.add('hidden'));
        document.getElementById(`ideasTab${tab.dataset.tab.charAt(0).toUpperCase() + tab.dataset.tab.slice(1)}`).classList.remove('hidden');
      });
    });

    // Market toggle in scanner
    document.querySelectorAll('[data-smkt]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-smkt]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        scanMarket = btn.dataset.smkt;
        scanResults = {};
        document.getElementById('scannerBody').innerHTML = `
          <div class="scanner-empty">
            <span style="font-size:2.5rem">🔍</span>
            <p>Click "Scan All Stocks" to analyse ${scanMarket === 'IN' ? 'Indian (NSE)' : 'US'} stocks.</p>
          </div>`;
      });
    });

    // Run scanner button
    document.getElementById('runScannerBtn').addEventListener('click', () => {
      if (!isScanning) scanAll();
    });
  }

  return { init };
})();
