// ===== 5-Year Stock Forecast Engine =====
const ForecastPanel = (() => {
  let forecastChart = null;
  const API_BASE = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
    ? 'https://stockpulse-monitor.netlify.app/.netlify/functions'
    : '/.netlify/functions';

  function open() { document.getElementById('forecastPanel').classList.add('open'); }
  function close() { document.getElementById('forecastPanel').classList.remove('open'); }

  function showLoading(sym) {
    document.getElementById('forecastContent').innerHTML = `
      <div class="fc-loading">
        <div class="ideas-spinner"></div>
        <p>Fetching full history for <strong>${sym}</strong> and computing 5-year forecast…</p>
        <p style="font-size:0.75rem;color:var(--text2);margin-top:0.5rem">This analyses all available historical data</p>
      </div>`;
  }

  function showError(msg) {
    document.getElementById('forecastContent').innerHTML = `
      <div class="fc-error">
        <span style="font-size:2rem">⚠️</span>
        <p>${msg}</p>
        <p style="font-size:0.75rem;color:var(--text2)">Try a valid ticker like AAPL, TSLA, TCS.NS</p>
      </div>`;
  }

  async function run(symbol) {
    symbol = symbol.trim().toUpperCase();
    if (!symbol) return;
    open();
    showLoading(symbol);
    if (forecastChart) { forecastChart.destroy(); forecastChart = null; }
    try {
      const res = await fetch(`${API_BASE}/forecast?symbol=${encodeURIComponent(symbol)}`, { signal: AbortSignal.timeout(20000) });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      render(data);
    } catch (err) {
      showError(err.message || 'Failed to fetch forecast data');
    }
  }

  function fmt(price, currency) {
    const sym = currency === 'INR' ? '₹' : '$';
    return `${sym}${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  function retColor(v) { return v >= 0 ? '#26c281' : '#e74c3c'; }
  function retArrow(v) { return v >= 0 ? '▲' : '▼'; }
  function retStr(v)   { return `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`; }

  function render(d) {
    const curr = d.currency === 'INR' ? '₹' : '$';
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';

    const html = `
      <!-- Investment Verdict — shown first, most prominent -->
      ${d.investmentVerdict ? (() => {
        const v = d.investmentVerdict;
        return `<div class="fc-verdict" style="background:${v.verdictBg};border:2px solid ${v.verdictColor}44">
          <div class="fc-verdict-top">
            <div class="fc-verdict-left">
              <span class="fc-verdict-emoji">${v.verdictEmoji}</span>
              <div>
                <div class="fc-verdict-label">Investment Verdict</div>
                <div class="fc-verdict-name" style="color:${v.verdictColor}">${v.verdict}</div>
              </div>
            </div>
            <div class="fc-verdict-score-wrap">
              <svg class="fc-score-ring" viewBox="0 0 60 60">
                <circle cx="30" cy="30" r="24" fill="none" stroke="var(--border)" stroke-width="5"/>
                <circle cx="30" cy="30" r="24" fill="none" stroke="${v.verdictColor}" stroke-width="5"
                  stroke-dasharray="${(v.verdictScore / 100) * 150.8} 150.8"
                  stroke-dashoffset="37.7" stroke-linecap="round"/>
                <text x="30" y="35" text-anchor="middle" fill="${v.verdictColor}" font-size="13" font-weight="800">${v.verdictScore}</text>
              </svg>
              <span class="fc-score-label">/ 100</span>
            </div>
          </div>
          <p class="fc-verdict-summary">${v.verdictSummary}</p>
          <div class="fc-verdict-factors">
            ${v.verdictFactors.map(f => `
              <div class="fc-vf-row">
                <span class="fc-vf-dot" style="background:${f.positive === true ? '#26c281' : f.positive === false ? '#e74c3c' : '#f39c12'}"></span>
                <span class="fc-vf-text">${f.text}</span>
              </div>`).join('')}
          </div>
          <div class="fc-verdict-actions">
            <div class="fc-va-item">
              <span class="fc-va-label">⏰ Best Time to Invest</span>
              <span class="fc-va-val">${v.bestTimeToInvest}</span>
            </div>
            <div class="fc-va-item">
              <span class="fc-va-label">📋 Suggested Strategy</span>
              <span class="fc-va-val">${v.suggestedStrategy}</span>
            </div>
          </div>
        </div>`;
      })() : ''}

      <!-- Header -->
      <div class="fc-header">
      <div class="fc-header">
        <div class="fc-title-group">
          <h3 class="fc-sym">${d.symbol.replace('.NS','').replace('.BO','')}</h3>
          <span class="fc-name">${d.name}</span>
          <span class="fc-price">${fmt(d.currentPrice, d.currency)}</span>
        </div>
        <div class="fc-badges">
          <span class="fc-badge" style="background:${d.outlookColor}22;color:${d.outlookColor};border:1px solid ${d.outlookColor}44">${d.outlook}</span>
          <span class="fc-badge" style="background:${d.riskColor}22;color:${d.riskColor};border:1px solid ${d.riskColor}44">Risk: ${d.riskLevel}</span>
          <span class="fc-badge" style="background:rgba(79,142,247,0.12);color:var(--accent)">RSI ${d.rsi}</span>
        </div>
      </div>

      <!-- Historical stats row -->
      <div class="fc-stats-grid">
        <div class="fc-stat">
          <span class="fc-stat-label">Historical CAGR</span>
          <span class="fc-stat-val" style="color:${retColor(d.histCAGR)}">${retStr(d.histCAGR)}</span>
          <span class="fc-stat-sub">${d.histYears}Y of data</span>
        </div>
        <div class="fc-stat">
          <span class="fc-stat-label">Annual Volatility</span>
          <span class="fc-stat-val" style="color:${d.riskColor}">${d.annualVolatility.toFixed(1)}%</span>
          <span class="fc-stat-sub">Price swing risk</span>
        </div>
        <div class="fc-stat">
          <span class="fc-stat-label">Max Drawdown</span>
          <span class="fc-stat-val" style="color:#e74c3c">-${d.maxDrawdown.toFixed(1)}%</span>
          <span class="fc-stat-sub">Worst peak-to-trough</span>
        </div>
        <div class="fc-stat">
          <span class="fc-stat-label">Sharpe Ratio</span>
          <span class="fc-stat-val" style="color:${d.sharpeRatio > 1 ? '#26c281' : d.sharpeRatio > 0 ? '#f39c12' : '#e74c3c'}">${d.sharpeRatio.toFixed(2)}</span>
          <span class="fc-stat-sub">Risk-adjusted return</span>
        </div>
        <div class="fc-stat">
          <span class="fc-stat-label">Best Year</span>
          <span class="fc-stat-val" style="color:#26c281">+${d.bestYear}%</span>
          <span class="fc-stat-sub">Historical best</span>
        </div>
        <div class="fc-stat">
          <span class="fc-stat-label">Worst Year</span>
          <span class="fc-stat-val" style="color:#e74c3c">${d.worstYear}%</span>
          <span class="fc-stat-sub">Historical worst</span>
        </div>
      </div>

      <!-- Scenario assumptions -->
      <div class="fc-section-title">📐 Forecast Assumptions (Annual Growth Rate)</div>
      <div class="fc-scenarios-row">
        <div class="fc-scenario bull">
          <span class="fc-sc-label">🐂 Bull Case</span>
          <span class="fc-sc-val">+${d.scenarios.bull.toFixed(1)}%/yr</span>
          <span class="fc-sc-desc">Strong momentum, favourable market</span>
        </div>
        <div class="fc-scenario base">
          <span class="fc-sc-label">📊 Base Case</span>
          <span class="fc-sc-val">${d.scenarios.base >= 0 ? '+' : ''}${d.scenarios.base.toFixed(1)}%/yr</span>
          <span class="fc-sc-desc">Historical trend continues</span>
        </div>
        <div class="fc-scenario bear">
          <span class="fc-sc-label">🐻 Bear Case</span>
          <span class="fc-sc-val">${d.scenarios.bear >= 0 ? '+' : ''}${d.scenarios.bear.toFixed(1)}%/yr</span>
          <span class="fc-sc-desc">Headwinds, market downturn</span>
        </div>
      </div>

      <!-- Year-by-year table -->
      <div class="fc-section-title">📅 Year-by-Year Price Projections</div>
      <div class="fc-table-wrap">
        <table class="fc-table">
          <thead>
            <tr>
              <th>Year</th>
              <th>🐂 Bull Price</th>
              <th>Bull Return</th>
              <th>📊 Base Price</th>
              <th>Base Return</th>
              <th>🐻 Bear Price</th>
              <th>Bear Return</th>
            </tr>
          </thead>
          <tbody>
            <tr class="fc-current-row">
              <td><strong>Now (${new Date().getFullYear()})</strong></td>
              <td colspan="2" style="color:var(--text2)">—</td>
              <td><strong>${fmt(d.currentPrice, d.currency)}</strong></td>
              <td style="color:var(--text2)">—</td>
              <td colspan="2" style="color:var(--text2)">—</td>
            </tr>
            ${d.projections.map(p => `
            <tr>
              <td><strong>${p.label}</strong> <span style="color:var(--text2);font-size:0.75rem">(+${p.year}Y)</span></td>
              <td style="color:#26c281;font-weight:700">${fmt(p.bull, d.currency)}</td>
              <td><span class="fc-ret-badge bull">+${p.bullRet}%</span></td>
              <td style="color:${retColor(p.baseRet)};font-weight:700">${fmt(p.base, d.currency)}</td>
              <td><span class="fc-ret-badge ${p.baseRet >= 0 ? 'bull' : 'bear'}">${retStr(p.baseRet)}</span></td>
              <td style="color:#e74c3c;font-weight:700">${fmt(p.bear, d.currency)}</td>
              <td><span class="fc-ret-badge bear">${retStr(p.bearRet)}</span></td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>

      <!-- Forecast chart -->
      <div class="fc-section-title">📈 5-Year Price Forecast Chart</div>
      <div class="fc-chart-wrap">
        <canvas id="forecastChart"></canvas>
      </div>

      <!-- Key insights -->
      <div class="fc-section-title">🔍 Key Insights & Analysis</div>
      <div class="fc-insights">
        ${d.insights.map(ins => `
          <div class="fc-insight">
            <span class="fc-insight-icon">${ins.icon}</span>
            <span class="fc-insight-text">${ins.text}</span>
          </div>`).join('')}
      </div>

      <!-- Annual returns history -->
      ${d.annualReturnsHistory.length > 1 ? `
      <div class="fc-section-title">📆 Historical Annual Returns (Last ${d.annualReturnsHistory.length} Years)</div>
      <div class="fc-annual-bars">
        ${d.annualReturnsHistory.map((ret, i) => {
          const yr = new Date().getFullYear() - d.annualReturnsHistory.length + i;
          const w  = Math.min(Math.abs(ret) * 1.5, 100);
          return `<div class="fc-ann-row">
            <span class="fc-ann-yr">${yr}</span>
            <div class="fc-ann-bar-wrap">
              <div class="fc-ann-bar ${ret >= 0 ? 'pos' : 'neg'}" style="width:${w}%"></div>
            </div>
            <span class="fc-ann-val" style="color:${retColor(ret)}">${retStr(ret)}</span>
          </div>`;
        }).join('')}
      </div>` : ''}

      <p class="fc-disclaimer">
        ⚠ This forecast is generated algorithmically from historical price data using statistical models
        (CAGR, linear regression, volatility analysis). It is <strong>not financial advice</strong>.
        Stock prices are inherently unpredictable. Past performance does not guarantee future results.
        Always consult a qualified financial advisor before investing.
      </p>`;

    document.getElementById('forecastContent').innerHTML = html;

    // Draw forecast chart
    const canvas = document.getElementById('forecastChart');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      const isDarkMode = document.documentElement.getAttribute('data-theme') !== 'light';
      const gridColor  = isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
      const textColor  = isDarkMode ? '#9ea3c0' : '#5a5f7a';
      const labels = ['Now', ...d.projections.map(p => p.label)];
      const bullData = [d.currentPrice, ...d.projections.map(p => p.bull)];
      const baseData = [d.currentPrice, ...d.projections.map(p => p.base)];
      const bearData = [d.currentPrice, ...d.projections.map(p => p.bear)];

      if (forecastChart) forecastChart.destroy();
      forecastChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Bull Case',
              data: bullData,
              borderColor: '#26c281',
              backgroundColor: 'rgba(38,194,129,0.08)',
              borderWidth: 2.5,
              borderDash: [],
              pointRadius: 5,
              pointHoverRadius: 7,
              fill: false,
              tension: 0.3,
            },
            {
              label: 'Base Case',
              data: baseData,
              borderColor: '#4f8ef7',
              backgroundColor: 'rgba(79,142,247,0.08)',
              borderWidth: 3,
              pointRadius: 5,
              pointHoverRadius: 7,
              fill: false,
              tension: 0.3,
            },
            {
              label: 'Bear Case',
              data: bearData,
              borderColor: '#e74c3c',
              backgroundColor: 'rgba(231,76,60,0.08)',
              borderWidth: 2.5,
              borderDash: [6, 3],
              pointRadius: 5,
              pointHoverRadius: 7,
              fill: false,
              tension: 0.3,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: {
              display: true,
              labels: { color: textColor, usePointStyle: true, pointStyleWidth: 12 },
            },
            tooltip: {
              backgroundColor: isDarkMode ? '#1a1d27' : '#fff',
              titleColor: isDarkMode ? '#e8eaf6' : '#1a1d27',
              bodyColor: textColor,
              borderColor: isDarkMode ? '#2e3250' : '#d0d4e8',
              borderWidth: 1,
              padding: 12,
              callbacks: {
                label: item => ` ${item.dataset.label}: ${d.currency === 'INR' ? '₹' : '$'}${item.raw.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              },
            },
          },
          scales: {
            x: { ticks: { color: textColor }, grid: { color: gridColor } },
            y: {
              position: 'right',
              ticks: { color: textColor, callback: v => `${d.currency === 'INR' ? '₹' : '$'}${v.toLocaleString()}` },
              grid: { color: gridColor },
            },
          },
        },
      });
    }
  }

  function init() {
    document.getElementById('forecastBtn').addEventListener('click', () => {
      const sym = document.getElementById('forecastInput').value.trim();
      if (sym) run(sym);
    });
    document.getElementById('forecastInput').addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        const sym = document.getElementById('forecastInput').value.trim();
        if (sym) run(sym);
      }
    });
    document.getElementById('closeForecast').addEventListener('click', close);
    // Quick buttons
    document.querySelectorAll('.fc-quick').forEach(btn => {
      btn.addEventListener('click', () => {
        document.getElementById('forecastInput').value = btn.dataset.sym;
        run(btn.dataset.sym);
      });
    });
    window.runForecast = run;
  }

  return { init, run, open, close };
})();
