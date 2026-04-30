// ===== Stock Suggester & Investment Ideas Engine =====

// ─── Universe of stocks to scan for investment ideas ───────────────────────
const UNIVERSE = [
  // Tech
  { symbol:'AAPL',  name:'Apple Inc.',            sector:'Technology' },
  { symbol:'MSFT',  name:'Microsoft Corp.',        sector:'Technology' },
  { symbol:'NVDA',  name:'NVIDIA Corp.',           sector:'Technology' },
  { symbol:'GOOGL', name:'Alphabet Inc.',          sector:'Technology' },
  { symbol:'META',  name:'Meta Platforms',         sector:'Technology' },
  { symbol:'AMD',   name:'Advanced Micro Devices', sector:'Technology' },
  { symbol:'AVGO',  name:'Broadcom Inc.',          sector:'Technology' },
  { symbol:'CRM',   name:'Salesforce Inc.',        sector:'Technology' },
  // AI / Cloud
  { symbol:'PLTR',  name:'Palantir Technologies',  sector:'AI & Cloud' },
  { symbol:'CRWD',  name:'CrowdStrike Holdings',   sector:'AI & Cloud' },
  { symbol:'SNOW',  name:'Snowflake Inc.',         sector:'AI & Cloud' },
  { symbol:'NET',   name:'Cloudflare Inc.',        sector:'AI & Cloud' },
  { symbol:'DDOG',  name:'Datadog Inc.',           sector:'AI & Cloud' },
  { symbol:'MDB',   name:'MongoDB Inc.',           sector:'AI & Cloud' },
  // Consumer / E-commerce
  { symbol:'AMZN',  name:'Amazon.com Inc.',        sector:'Consumer' },
  { symbol:'TSLA',  name:'Tesla Inc.',             sector:'Consumer' },
  { symbol:'SHOP',  name:'Shopify Inc.',           sector:'Consumer' },
  { symbol:'ABNB',  name:'Airbnb Inc.',            sector:'Consumer' },
  { symbol:'UBER',  name:'Uber Technologies',      sector:'Consumer' },
  { symbol:'DASH',  name:'DoorDash Inc.',          sector:'Consumer' },
  // Finance
  { symbol:'V',     name:'Visa Inc.',              sector:'Finance' },
  { symbol:'MA',    name:'Mastercard Inc.',        sector:'Finance' },
  { symbol:'JPM',   name:'JPMorgan Chase',         sector:'Finance' },
  { symbol:'COIN',  name:'Coinbase Global',        sector:'Finance' },
  { symbol:'SQ',    name:'Block Inc.',             sector:'Finance' },
  // Media / Entertainment
  { symbol:'NFLX',  name:'Netflix Inc.',           sector:'Media' },
  { symbol:'DIS',   name:'Walt Disney Co.',        sector:'Media' },
  { symbol:'SPOT',  name:'Spotify Technology',     sector:'Media' },
  { symbol:'RBLX',  name:'Roblox Corp.',           sector:'Media' },
  // Healthcare
  { symbol:'LLY',   name:'Eli Lilly & Co.',        sector:'Healthcare' },
  { symbol:'UNH',   name:'UnitedHealth Group',     sector:'Healthcare' },
  { symbol:'ABBV',  name:'AbbVie Inc.',            sector:'Healthcare' },
  { symbol:'MRNA',  name:'Moderna Inc.',           sector:'Healthcare' },
  // Energy
  { symbol:'XOM',   name:'Exxon Mobil Corp.',      sector:'Energy' },
  { symbol:'CVX',   name:'Chevron Corp.',          sector:'Energy' },
  { symbol:'NEE',   name:'NextEra Energy',         sector:'Energy' },
  // Defensive / Dividend
  { symbol:'WMT',   name:'Walmart Inc.',           sector:'Defensive' },
  { symbol:'KO',    name:'Coca-Cola Co.',          sector:'Defensive' },
  { symbol:'JNJ',   name:'Johnson & Johnson',      sector:'Defensive' },
  { symbol:'PG',    name:'Procter & Gamble',       sector:'Defensive' },
];

const SECTOR_ICONS = {
  'Technology':  '💻',
  'AI & Cloud':  '🤖',
  'Consumer':    '🛒',
  'Finance':     '💳',
  'Media':       '🎬',
  'Healthcare':  '💊',
  'Energy':      '⚡',
  'Defensive':   '🛡️',
};

// ─── Scoring engine ─────────────────────────────────────────────────────────
function scoreStock(d) {
  if (!d || !d.price) return null;
  let score = 50;
  const signals = [];

  // 1. Daily momentum (30 pts)
  const pct = d.changePct || 0;
  if      (pct >= 4)  { score += 30; signals.push({ text: 'Strong surge today',      bull: true  }); }
  else if (pct >= 2)  { score += 22; signals.push({ text: 'Solid upward momentum',   bull: true  }); }
  else if (pct >= 0.5){ score += 12; signals.push({ text: 'Positive momentum',       bull: true  }); }
  else if (pct >= 0)  { score += 4;  signals.push({ text: 'Flat / slightly positive', bull: null }); }
  else if (pct >= -1) { score -= 8;  signals.push({ text: 'Minor pullback',           bull: false }); }
  else if (pct >= -3) { score -= 20; signals.push({ text: 'Declining today',          bull: false }); }
  else                { score -= 30; signals.push({ text: 'Heavy selling pressure',   bull: false }); }

  // 2. Volume conviction (25 pts)
  const vol = d.volume || 0;
  if      (vol > 80e6 && pct > 0) { score += 25; signals.push({ text: 'Massive buying volume',    bull: true  }); }
  else if (vol > 40e6 && pct > 0) { score += 18; signals.push({ text: 'High volume breakout',     bull: true  }); }
  else if (vol > 15e6 && pct > 0) { score += 10; signals.push({ text: 'Above-average volume',     bull: true  }); }
  else if (vol > 80e6 && pct < 0) { score -= 20; signals.push({ text: 'Heavy distribution',       bull: false }); }
  else if (vol > 40e6 && pct < 0) { score -= 12; signals.push({ text: 'Elevated selling volume',  bull: false }); }
  else if (vol < 3e6)              { score -= 5;  signals.push({ text: 'Low liquidity',            bull: false }); }

  // 3. Day range position (20 pts) — near high = bullish
  if (d.dayHigh && d.dayLow && d.dayHigh > d.dayLow) {
    const pos = (d.price - d.dayLow) / (d.dayHigh - d.dayLow);
    if      (pos >= 0.85) { score += 20; signals.push({ text: 'Trading near day high',   bull: true  }); }
    else if (pos >= 0.6)  { score += 10; signals.push({ text: 'Upper range strength',    bull: true  }); }
    else if (pos <= 0.15) { score -= 15; signals.push({ text: 'Near day low — weak',     bull: false }); }
    else if (pos <= 0.4)  { score -= 5;  signals.push({ text: 'Lower half of range',     bull: false }); }
  }

  // 4. Price sanity (5 pts)
  if (d.price >= 20)  score += 5;
  if (d.price < 5)    score -= 15;

  score = Math.max(0, Math.min(100, Math.round(score)));

  // Estimated upside: simple momentum-based target (+3% to +12% depending on score)
  const upsidePct = score >= 80 ? 10 : score >= 65 ? 6 : score >= 50 ? 3 : 0;
  const targetPrice = parseFloat((d.price * (1 + upsidePct / 100)).toFixed(2));

  return {
    symbol: d.symbol, name: d.name, sector: d.sector,
    price: d.price, changePct: d.changePct, change: d.change,
    volume: d.volume, score, signals, targetPrice, upsidePct,
    isMock: d.isMock,
  };
}

function getRating(score) {
  if (score >= 80) return { label: 'Strong Buy', color: '#26c281', bg: 'rgba(38,194,129,0.12)', stars: '★★★★★' };
  if (score >= 65) return { label: 'Buy',         color: '#52d68a', bg: 'rgba(82,214,138,0.12)', stars: '★★★★☆' };
  if (score >= 50) return { label: 'Hold',        color: '#f39c12', bg: 'rgba(243,156,18,0.12)', stars: '★★★☆☆' };
  if (score >= 35) return { label: 'Weak',        color: '#e67e22', bg: 'rgba(230,126,34,0.12)', stars: '★★☆☆☆' };
  return                   { label: 'Avoid',      color: '#e74c3c', bg: 'rgba(231,76,60,0.12)',  stars: '★☆☆☆☆' };
}

// ─── Watchlist Best Pick panel (compact, inside sidebar) ────────────────────
const Suggester = (() => {
  function render(stockData) {
    const panel  = document.getElementById('bestPick');
    const body   = document.getElementById('bestPickBody');
    const reason = document.getElementById('bestPickReason');
    if (!panel || !body) return;

    const scored = Object.values(stockData)
      .map(d => scoreStock(d))
      .filter(Boolean)
      .sort((a, b) => b.score - a.score);

    if (scored.length === 0) { panel.style.display = 'none'; return; }

    const top    = scored[0];
    const rating = getRating(top.score);
    const arrow  = top.changePct >= 0 ? '▲' : '▼';
    const cls    = top.changePct >= 0 ? 'up' : 'down';

    panel.style.display = 'block';
    reason.textContent  = rating.label;
    reason.style.color  = rating.color;

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
          <span class="bp-score" style="background:${rating.bg};color:${rating.color}">Score ${top.score}/100</span>
        </div>
      </div>
      <div class="bp-reasons">
        ${top.signals.filter(s => s.bull !== false).slice(0, 3).map(s =>
          `<span class="bp-tag">✓ ${s.text}</span>`).join('')}
      </div>
      <div class="bp-ranking">
        ${scored.slice(0, 5).map((s, i) => {
          const r = getRating(s.score);
          const a = s.changePct >= 0 ? '▲' : '▼';
          const c = s.changePct >= 0 ? 'up' : 'down';
          return `<div class="bp-rank-row ${i === 0 ? 'bp-rank-top' : ''}" data-symbol="${s.symbol}">
            <span class="bp-rank-pos">#${i+1}</span>
            <span class="bp-rank-sym">${s.symbol}</span>
            <span class="bp-rank-label" style="color:${r.color}">${r.label}</span>
            <span class="bp-rank-chg ${c}">${a}${Math.abs(s.changePct).toFixed(2)}%</span>
            <div class="bp-rank-bar"><div style="width:${s.score}%;background:${r.color};height:100%;border-radius:2px"></div></div>
          </div>`;
        }).join('')}
      </div>
      ${top.isMock
        ? '<p class="bp-disclaimer">⚠ Demo data — not real market data</p>'
        : '<p class="bp-disclaimer">ℹ Informational only. Not financial advice.</p>'}
    `;

    body.querySelectorAll('[data-symbol]').forEach(el => {
      el.style.cursor = 'pointer';
      el.addEventListener('click', () => {
        if (typeof selectSymbol === 'function') selectSymbol(el.dataset.symbol);
      });
    });
  }

  return { render, scoreStock, getRating };
})();

// ─── Investment Ideas Panel ──────────────────────────────────────────────────
const InvestmentIdeas = (() => {
  let ideaData   = {};   // fetched quotes for universe stocks
  let isLoading  = false;
  let lastFetch  = 0;
  const CACHE_MS = 30000; // re-fetch universe every 30s

  async function fetchUniverseQuotes() {
    if (isLoading) return;
    if (Date.now() - lastFetch < CACHE_MS && Object.keys(ideaData).length > 0) {
      renderPanel();
      return;
    }
    isLoading = true;
    showLoading();

    // Fetch in batches of 8 to avoid hammering the proxy
    const batches = [];
    for (let i = 0; i < UNIVERSE.length; i += 8) batches.push(UNIVERSE.slice(i, i + 8));

    for (const batch of batches) {
      await Promise.allSettled(batch.map(async ({ symbol, name, sector }) => {
        try {
          const url   = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
          const proxy = `https://corsproxy.io/?${encodeURIComponent(url)}`;
          const res   = await fetch(proxy, { signal: AbortSignal.timeout(6000) });
          if (!res.ok) throw new Error('bad response');
          const text  = await res.text();
          const json  = JSON.parse(text);
          const result = json?.chart?.result?.[0];
          if (!result) throw new Error('no result');
          const meta = result.meta;
          const price = meta.regularMarketPrice;
          const prev  = meta.chartPreviousClose || meta.previousClose || price;
          ideaData[symbol] = {
            symbol, name, sector,
            price,
            prevClose:  prev,
            change:     parseFloat((price - prev).toFixed(2)),
            changePct:  parseFloat(((price - prev) / prev * 100).toFixed(2)),
            volume:     meta.regularMarketVolume || 0,
            dayHigh:    meta.regularMarketDayHigh || price,
            dayLow:     meta.regularMarketDayLow  || price,
            isMock: false,
          };
        } catch {
          // Fallback to seeded mock
          if (typeof getMockQuote === 'function') {
            const m = getMockQuote(symbol);
            ideaData[symbol] = { ...m, sector, isMock: true };
          }
        }
      }));
    }

    lastFetch = Date.now();
    isLoading = false;
    renderPanel();
  }

  function showLoading() {
    const body = document.getElementById('ideasBody');
    if (!body) return;
    body.innerHTML = `
      <div class="ideas-loading">
        <div class="ideas-spinner"></div>
        <p>Scanning ${UNIVERSE.length} stocks across 8 sectors…</p>
      </div>`;
  }

  function renderPanel() {
    const body = document.getElementById('ideasBody');
    if (!body) return;

    const scored = Object.values(ideaData)
      .map(d => scoreStock(d))
      .filter(Boolean)
      .sort((a, b) => b.score - a.score);

    if (scored.length === 0) {
      body.innerHTML = '<p class="empty-state">No data available yet.</p>';
      return;
    }

    // Top 3 picks
    const topPicks = scored.filter(s => s.score >= 60).slice(0, 3);
    // Group by sector — best per sector
    const bySector = {};
    scored.forEach(s => {
      if (!bySector[s.sector] || s.score > bySector[s.sector].score) bySector[s.sector] = s;
    });

    const hasMock = scored.some(s => s.isMock);

    body.innerHTML = `
      ${hasMock ? `<div class="ideas-mock-warn">⚠ Some data is simulated (DEMO). Live data loads when market is open.</div>` : ''}

      <!-- Top Picks -->
      <div class="ideas-section-title">🔥 Top Picks Right Now</div>
      <div class="ideas-top-grid">
        ${topPicks.length > 0 ? topPicks.map(s => ideaCard(s, true)).join('') :
          '<p class="ideas-empty">No strong buys at the moment — market may be down.</p>'}
      </div>

      <!-- Sector Leaders -->
      <div class="ideas-section-title" style="margin-top:1rem">📊 Best Pick Per Sector</div>
      <div class="ideas-sector-grid">
        ${Object.entries(bySector).map(([sector, s]) => sectorCard(sector, s)).join('')}
      </div>

      <!-- Full Ranked List -->
      <div class="ideas-section-title" style="margin-top:1rem">
        📋 All ${scored.length} Stocks Ranked
        <span class="ideas-filter-btns" id="ideasFilterBtns">
          <button class="ideas-filter active" data-filter="all">All</button>
          <button class="ideas-filter" data-filter="buy">Buy+</button>
          <button class="ideas-filter" data-filter="sector">By Sector</button>
        </span>
      </div>
      <div class="ideas-full-list" id="ideasFullList">
        ${fullList(scored, 'all')}
      </div>

      <p class="ideas-disclaimer">
        ⚠ This analysis is based on intraday price signals only. It is not financial advice.
        Always do your own research before investing.
      </p>
    `;

    // Filter buttons
    body.querySelectorAll('.ideas-filter').forEach(btn => {
      btn.addEventListener('click', () => {
        body.querySelectorAll('.ideas-filter').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('ideasFullList').innerHTML = fullList(scored, btn.dataset.filter);
        attachCardClicks(body);
      });
    });

    attachCardClicks(body);
  }

  function ideaCard(s, showTarget) {
    const r     = getRating(s.score);
    const arrow = s.changePct >= 0 ? '▲' : '▼';
    const cls   = s.changePct >= 0 ? 'up' : 'down';
    const bullSignals = s.signals.filter(sig => sig.bull === true).slice(0, 2);
    return `
      <div class="idea-card" data-symbol="${s.symbol}">
        <div class="idea-card-top">
          <div>
            <span class="idea-sym">${s.symbol}</span>
            <span class="idea-sector-tag">${SECTOR_ICONS[s.sector] || ''} ${s.sector}</span>
          </div>
          <span class="idea-rating-badge" style="background:${r.bg};color:${r.color}">${r.label}</span>
        </div>
        <div class="idea-card-mid">
          <span class="idea-price">$${s.price.toFixed(2)}</span>
          <span class="idea-chg ${cls}">${arrow} ${Math.abs(s.changePct).toFixed(2)}%</span>
        </div>
        <div class="idea-score-row">
          <div class="idea-score-bar-wrap">
            <div class="idea-score-bar" style="width:${s.score}%;background:${r.color}"></div>
          </div>
          <span class="idea-score-num" style="color:${r.color}">${s.score}/100</span>
        </div>
        ${bullSignals.length ? `<div class="idea-signals">
          ${bullSignals.map(sig => `<span class="idea-sig-tag">✓ ${sig.text}</span>`).join('')}
        </div>` : ''}
        ${showTarget && s.upsidePct > 0 ? `
          <div class="idea-target">
            🎯 Target: <strong>$${s.targetPrice.toFixed(2)}</strong>
            <span class="up">+${s.upsidePct}% upside</span>
          </div>` : ''}
        <div class="idea-card-actions">
          <button class="idea-btn-view" data-symbol="${s.symbol}">View Chart</button>
          <button class="idea-btn-add"  data-symbol="${s.symbol}">+ Watchlist</button>
        </div>
      </div>`;
  }

  function sectorCard(sector, s) {
    const r   = getRating(s.score);
    const cls = s.changePct >= 0 ? 'up' : 'down';
    const arrow = s.changePct >= 0 ? '▲' : '▼';
    return `
      <div class="sector-card" data-symbol="${s.symbol}">
        <div class="sector-card-header">
          <span class="sector-icon">${SECTOR_ICONS[sector] || '📈'}</span>
          <span class="sector-name">${sector}</span>
        </div>
        <div class="sector-sym">${s.symbol}</div>
        <div class="sector-price">$${s.price.toFixed(2)} <span class="${cls}">${arrow}${Math.abs(s.changePct).toFixed(2)}%</span></div>
        <span class="sector-rating" style="color:${r.color}">${r.label} · ${s.score}/100</span>
      </div>`;
  }

  function fullList(scored, filter) {
    let list = scored;
    if (filter === 'buy')   list = scored.filter(s => s.score >= 65);
    if (filter === 'sector') {
      // Group by sector, show sector headers
      const groups = {};
      scored.forEach(s => { (groups[s.sector] = groups[s.sector] || []).push(s); });
      return Object.entries(groups).map(([sector, stocks]) => `
        <div class="ideas-sector-header">${SECTOR_ICONS[sector] || ''} ${sector}</div>
        ${stocks.map(s => listRow(s)).join('')}
      `).join('');
    }
    return list.map(s => listRow(s)).join('');
  }

  function listRow(s) {
    const r   = getRating(s.score);
    const cls = s.changePct >= 0 ? 'up' : 'down';
    const arrow = s.changePct >= 0 ? '▲' : '▼';
    const vol = s.volume >= 1e9 ? (s.volume/1e9).toFixed(1)+'B'
              : s.volume >= 1e6 ? (s.volume/1e6).toFixed(1)+'M'
              : s.volume >= 1e3 ? (s.volume/1e3).toFixed(0)+'K' : String(s.volume);
    return `
      <div class="ideas-row" data-symbol="${s.symbol}">
        <span class="ir-sym">${s.symbol}</span>
        <span class="ir-name">${s.name}</span>
        <span class="ir-price">$${s.price.toFixed(2)}</span>
        <span class="ir-chg ${cls}">${arrow}${Math.abs(s.changePct).toFixed(2)}%</span>
        <span class="ir-vol">${vol}</span>
        <div class="ir-bar-wrap"><div class="ir-bar" style="width:${s.score}%;background:${r.color}"></div></div>
        <span class="ir-rating" style="color:${r.color};background:${r.bg}">${r.label}</span>
        <button class="ir-add" data-symbol="${s.symbol}">+</button>
      </div>`;
  }

  function attachCardClicks(body) {
    body.querySelectorAll('[data-symbol]').forEach(el => {
      el.addEventListener('click', e => {
        const sym = el.dataset.symbol;
        if (e.target.classList.contains('idea-btn-view') || e.target.classList.contains('ir-sym') || el.classList.contains('sector-card')) {
          if (typeof selectSymbol === 'function') selectSymbol(sym);
          closePanel();
        }
        if (e.target.classList.contains('idea-btn-add') || e.target.classList.contains('ir-add')) {
          if (typeof addSymbol === 'function') addSymbol(sym);
        }
      });
    });
  }

  function openPanel() {
    document.getElementById('ideasPanel').classList.add('open');
    fetchUniverseQuotes();
  }

  function closePanel() {
    document.getElementById('ideasPanel').classList.remove('open');
  }

  function init() {
    document.getElementById('ideasBtn').addEventListener('click', openPanel);
    document.getElementById('closeIdeas').addEventListener('click', closePanel);
    // Refresh ideas every 30s when panel is open
    setInterval(() => {
      if (document.getElementById('ideasPanel').classList.contains('open')) {
        lastFetch = 0;
        fetchUniverseQuotes();
      }
    }, 30000);
  }

  return { init, openPanel, closePanel };
})();
