// ===== StockPulse App =====

const POPULAR_SYMBOLS = [
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'MSFT', name: 'Microsoft Corp.' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.' },
  { symbol: 'TSLA', name: 'Tesla Inc.' },
  { symbol: 'META', name: 'Meta Platforms' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.' },
  { symbol: 'NFLX', name: 'Netflix Inc.' },
  { symbol: 'AMD', name: 'Advanced Micro Devices' },
  { symbol: 'INTC', name: 'Intel Corp.' },
  { symbol: 'JPM', name: 'JPMorgan Chase' },
  { symbol: 'BAC', name: 'Bank of America' },
  { symbol: 'DIS', name: 'Walt Disney Co.' },
  { symbol: 'UBER', name: 'Uber Technologies' },
  { symbol: 'SPOT', name: 'Spotify Technology' },
  { symbol: 'PYPL', name: 'PayPal Holdings' },
  { symbol: 'SQ', name: 'Block Inc.' },
  { symbol: 'COIN', name: 'Coinbase Global' },
  { symbol: 'SHOP', name: 'Shopify Inc.' },
  { symbol: 'SNAP', name: 'Snap Inc.' },
  { symbol: 'BABA', name: 'Alibaba Group' },
  { symbol: 'V', name: 'Visa Inc.' },
  { symbol: 'MA', name: 'Mastercard Inc.' },
  { symbol: 'WMT', name: 'Walmart Inc.' },
  { symbol: 'KO', name: 'Coca-Cola Co.' },
  { symbol: 'PEP', name: 'PepsiCo Inc.' },
  { symbol: 'MCD', name: "McDonald's Corp." },
  { symbol: 'SBUX', name: 'Starbucks Corp.' },
  { symbol: 'NKE', name: 'Nike Inc.' },
  { symbol: 'PLTR', name: 'Palantir Technologies' },
  { symbol: 'RIVN', name: 'Rivian Automotive' },
  { symbol: 'LCID', name: 'Lucid Group' },
  { symbol: 'SOFI', name: 'SoFi Technologies' },
  { symbol: 'HOOD', name: 'Robinhood Markets' },
  { symbol: 'RBLX', name: 'Roblox Corp.' },
  { symbol: 'DKNG', name: 'DraftKings Inc.' },
  { symbol: 'ABNB', name: 'Airbnb Inc.' },
  { symbol: 'DASH', name: 'DoorDash Inc.' },
  { symbol: 'LYFT', name: 'Lyft Inc.' },
  { symbol: 'PINS', name: 'Pinterest Inc.' },
  { symbol: 'TWLO', name: 'Twilio Inc.' },
  { symbol: 'ZM', name: 'Zoom Video' },
  { symbol: 'DOCN', name: 'DigitalOcean' },
  { symbol: 'NET', name: 'Cloudflare Inc.' },
  { symbol: 'CRWD', name: 'CrowdStrike Holdings' },
  { symbol: 'SNOW', name: 'Snowflake Inc.' },
  { symbol: 'DDOG', name: 'Datadog Inc.' },
  { symbol: 'MDB', name: 'MongoDB Inc.' },
  { symbol: 'OKTA', name: 'Okta Inc.' },
];

// ===== State =====
const DEFAULT_WATCHLIST = ["AAPL","MSFT","TSLA","NVDA","GOOGL","META","AMZN","NFLX","AMD","COIN","PLTR","CRWD","SNOW","NET","UBER"];
const WL_VERSION = '2';

// Reset watchlist if it's from an older version or first visit
if (localStorage.getItem('wl_version') !== WL_VERSION) {
  localStorage.setItem('watchlist', JSON.stringify(DEFAULT_WATCHLIST));
  localStorage.setItem('wl_version', WL_VERSION);
}

let watchlist = JSON.parse(localStorage.getItem('watchlist') || JSON.stringify(DEFAULT_WATCHLIST));
let stockData = {};
let historyCache = {};
let selectedSymbol = null;
let selectedRange = '1d';
const REFRESH_MS = 5000;   // poll quotes every 5s (fastest safe rate)
const HISTORY_TTL = 60000;
let refreshCountdown = 5;
let prevPrices = {};        // track previous price per symbol for flash animation

// ===== Seeded RNG =====
function seededRand(seed) {
  let s = seed >>> 0;
  return function () {
    s += 0x6D2B79F5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function strSeed(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  return Math.abs(h);
}

// ===== Mock data =====
const BASE_PRICES = {
  AAPL:192, MSFT:415, TSLA:175, NVDA:875, GOOGL:175, AMZN:185, META:505,
  NFLX:635, AMD:165, INTC:30, JPM:198, BAC:38, DIS:112, UBER:72, SPOT:305,
  PYPL:62, SQ:72, COIN:225, SHOP:78, SNAP:11, BABA:82, V:275, MA:465,
  WMT:68, KO:62, PEP:175, MCD:295, SBUX:78, NKE:92, PLTR:25, RIVN:12,
  LCID:3, SOFI:8, HOOD:18, RBLX:35, DKNG:42, ABNB:145, DASH:165, LYFT:14,
  PINS:28, TWLO:55, ZM:62, DOCN:38, NET:95, CRWD:320, SNOW:155, DDOG:115,
  MDB:245, OKTA:88,
};

function getMockHistory(symbol, range) {
  const seed = strSeed(symbol + range + Math.floor(Date.now() / 3600000));
  const rand = seededRand(seed);
  const base = BASE_PRICES[symbol] || (strSeed(symbol) % 400 + 20);
  const counts = { '1d': 78, '5d': 65, '1mo': 22, '3mo': 65, '10y': 120 };
  const n = counts[range] || 30;
  const data = [];
  let price = range === '10y' ? base * (0.2 + rand() * 0.3) : base * (0.94 + rand() * 0.12);
  const now = new Date();
  for (let i = 0; i < n; i++) {
    const open = parseFloat(price.toFixed(2));
    // 10Y: slight upward bias to simulate long-term growth
    const bias = range === '10y' ? 0.003 : 0;
    const close = parseFloat(Math.max(open + (rand() - 0.48 + bias) * price * (range === '10y' ? 0.04 : 0.014), 0.01).toFixed(2));
    const high = parseFloat((Math.max(open, close) * (1 + rand() * 0.007)).toFixed(2));
    const low = parseFloat((Math.min(open, close) * (1 - rand() * 0.007)).toFixed(2));
    const volume = Math.floor(rand() * 5e6 + 1e6);
    let label;
    if (range === '1d') {
      const mins = Math.floor((i / n) * 390);
      const h = Math.floor(9 + (30 + mins) / 60);
      const m = (30 + mins) % 60;
      label = `${h}:${m.toString().padStart(2, '0')}`;
    } else if (range === '10y') {
      const d = new Date(now);
      d.setMonth(d.getMonth() - (n - i));
      label = d.toLocaleDateString([], { month: 'short', year: '2-digit' });
    } else {
      const d = new Date(now);
      d.setDate(d.getDate() - (n - i) * (range === '3mo' ? 3 : 1));
      label = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
    data.push({ date: label, open, high, low, close, volume });
    price = close;
  }
  return data;
}

function getMockQuote(symbol) {
  const history = getMockHistory(symbol, '1d');
  const last = history[history.length - 1];
  const first = history[0];
  const price = last.close;
  const prevClose = first.open;
  const change = parseFloat((price - prevClose).toFixed(2));
  const changePct = parseFloat(((change / prevClose) * 100).toFixed(2));
  return {
    symbol,
    name: POPULAR_SYMBOLS.find(s => s.symbol === symbol)?.name || symbol,
    price, prevClose, change, changePct,
    volume: last.volume * 15,
    dayHigh: Math.max(...history.map(d => d.high)),
    dayLow: Math.min(...history.map(d => d.low)),
    isMock: true,
  };
}

// ===== API =====
async function proxyFetch(yahooUrl) {
  const proxies = [
    `https://corsproxy.io/?${encodeURIComponent(yahooUrl)}`,
    `https://api.allorigins.win/get?url=${encodeURIComponent(yahooUrl)}`,
  ];
  for (const proxy of proxies) {
    try {
      const res = await fetch(proxy, { signal: AbortSignal.timeout(7000) });
      if (!res.ok) continue;
      const text = await res.text();
      const json = JSON.parse(text);
      if (json.contents) return JSON.parse(json.contents);
      return json;
    } catch { continue; }
  }
  throw new Error('All proxies failed');
}

async function fetchQuote(symbol) {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
    const data = await proxyFetch(url);
    const result = data?.chart?.result?.[0];
    if (!result) throw new Error('No data');
    const meta = result.meta;
    const price = meta.regularMarketPrice;
    const prevClose = meta.chartPreviousClose || meta.previousClose || price;
    return {
      symbol,
      name: meta.longName || meta.shortName || symbol,
      price,
      prevClose,
      change: parseFloat((price - prevClose).toFixed(2)),
      changePct: parseFloat(((price - prevClose) / prevClose * 100).toFixed(2)),
      volume: meta.regularMarketVolume || 0,
      dayHigh: meta.regularMarketDayHigh || price,
      dayLow: meta.regularMarketDayLow || price,
      isMock: false,
    };
  } catch {
    return getMockQuote(symbol);
  }
}

async function fetchHistory(symbol, range) {
  const key = `${symbol}_${range}`;
  const cached = historyCache[key];
  if (cached && (Date.now() - cached.ts) < HISTORY_TTL) return cached.data;
  try {
    const intervalMap = { '1d': '5m', '5d': '30m', '1mo': '1d', '3mo': '1d', '10y': '1mo' };
    const yahooRange = range === '10y' ? 'max' : range;
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${intervalMap[range]}&range=${yahooRange}`;
    const data = await proxyFetch(url);
    const result = data?.chart?.result?.[0];
    if (!result) throw new Error('No history');
    const timestamps = result.timestamp || [];
    const ohlcv = result.indicators?.quote?.[0] || {};
    const adjclose = result.indicators?.adjclose?.[0]?.adjclose || ohlcv.close;

    let rows = timestamps.map((ts, i) => {
      const d = new Date(ts * 1000);
      const label = (range === '1d')
        ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : d.toLocaleDateString([], { month: 'short', day: 'numeric', year: range === '10y' ? '2-digit' : undefined });
      return {
        date: label,
        open: ohlcv.open?.[i] ?? 0,
        high: ohlcv.high?.[i] ?? 0,
        low: ohlcv.low?.[i] ?? 0,
        close: adjclose?.[i] ?? ohlcv.close?.[i] ?? 0,
        volume: ohlcv.volume?.[i] ?? 0,
      };
    }).filter(d => d.close > 0);

    // For 10Y, trim to last 10 years max
    if (range === '10y') {
      const cutoff = Date.now() - 10 * 365.25 * 24 * 3600 * 1000;
      const cutRows = timestamps
        .map((ts, i) => ({ ts: ts * 1000, i }))
        .filter(x => x.ts >= cutoff)
        .map(x => rows[x.i])
        .filter(Boolean);
      if (cutRows.length > 0) rows = cutRows;
    }

    if (rows.length === 0) throw new Error('Empty');
    historyCache[key] = { data: rows, ts: Date.now() };
    return rows;
  } catch {
    const mock = getMockHistory(symbol, range);
    historyCache[key] = { data: mock, ts: Date.now() };
    return mock;
  }
}

// ===== Toast =====
function toast(msg, type = 'info', duration = 4000) {
  const container = document.getElementById('toastContainer');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  el.innerHTML = `<span>${icons[type] || ''}</span><span>${msg}</span>`;
  container.appendChild(el);
  setTimeout(() => { el.classList.add('removing'); setTimeout(() => el.remove(), 300); }, duration);
}

// ===== Watchlist render (HTML only, no listeners) =====
function saveWatchlist() { localStorage.setItem('watchlist', JSON.stringify(watchlist)); }

function addSymbol(symbol) {
  symbol = symbol.trim().toUpperCase().replace(/[^A-Z0-9.]/g, '');
  if (!symbol) return;
  if (watchlist.includes(symbol)) { toast(`${symbol} already in watchlist`, 'warning'); return; }
  if (watchlist.length >= 50) { toast('Watchlist limit reached (50)', 'error'); return; }
  watchlist.push(symbol);
  saveWatchlist();
  renderWatchlist();
  AlertManager.updateSymbolSelect(watchlist);
  fetchAndUpdateSymbol(symbol);
  toast(`${symbol} added`, 'success');
}

function removeSymbol(symbol) {
  watchlist = watchlist.filter(s => s !== symbol);
  delete stockData[symbol];
  Object.keys(historyCache).filter(k => k.startsWith(symbol + '_')).forEach(k => delete historyCache[k]);
  saveWatchlist();
  if (selectedSymbol === symbol) {
    selectedSymbol = null;
    document.getElementById('chartTitle').textContent = 'Select a stock';
    document.getElementById('chartSubtitle').textContent = '';
    document.getElementById('chartPlaceholder').classList.remove('hidden');
    ChartManager.destroy();
  }
  renderWatchlist();
  AlertManager.updateSymbolSelect(watchlist);
  toast(`${symbol} removed`, 'info');
}

function renderWatchlist() {
  const container = document.getElementById('watchlist');
  const emptyState = document.getElementById('emptyState');
  document.getElementById('watchlistCount').textContent = `${watchlist.length}/50`;

  if (watchlist.length === 0) {
    container.innerHTML = '';
    container.appendChild(emptyState);
    emptyState.classList.remove('hidden');
    return;
  }
  emptyState.classList.add('hidden');

  container.innerHTML = watchlist.map(symbol => {
    const d = stockData[symbol];
    if (!d) {
      return `<div class="stock-card" data-symbol="${symbol}">
        <span class="stock-symbol">${symbol}</span>
        <span class="stock-price" style="color:var(--text2)">—</span>
        <span class="stock-name" style="color:var(--text2)">Loading...</span>
        <span></span>
        <button class="remove-btn" data-symbol="${symbol}">✕</button>
      </div>`;
    }
    const cls = d.changePct > 0 ? 'up' : d.changePct < 0 ? 'down' : 'neutral';
    const arrow = d.changePct > 0 ? '▲' : d.changePct < 0 ? '▼' : '–';
    const trendPct = Math.min(Math.abs(d.changePct) * 10, 100);
    const trendColor = d.changePct >= 0 ? 'var(--green)' : 'var(--red)';
    const vol = d.volume >= 1e6 ? (d.volume / 1e6).toFixed(1) + 'M'
              : d.volume >= 1e3 ? (d.volume / 1e3).toFixed(0) + 'K'
              : String(d.volume);
    const mockDot = d.isMock ? '<span style="color:var(--yellow);font-size:0.65rem" title="Demo data">● </span>' : '';
    const activeClass = selectedSymbol === symbol ? 'active' : '';
    return `<div class="stock-card ${activeClass}" data-symbol="${symbol}">
      <span class="stock-symbol">${mockDot}${symbol}</span>
      <span class="stock-price">$${d.price.toFixed(2)}</span>
      <span class="stock-name">${d.name || symbol}</span>
      <span class="stock-change ${cls}">${arrow} ${Math.abs(d.changePct).toFixed(2)}%</span>
      <div class="stock-meta" style="grid-column:1/-1">
        <span>Vol: ${vol}</span>
        <span class="${cls}">${d.change >= 0 ? '+' : ''}$${d.change.toFixed(2)}</span>
      </div>
      <div class="trend-bar"><div class="trend-fill" style="width:${trendPct}%;background:${trendColor}"></div></div>
      <button class="remove-btn" data-symbol="${symbol}">✕</button>
    </div>`;
  }).join('');
}

// Delegated listener — attached ONCE, never re-attached
function initWatchlistEvents() {
  document.getElementById('watchlist').addEventListener('click', e => {
    const removeBtn = e.target.closest('.remove-btn');
    if (removeBtn) { e.stopPropagation(); removeSymbol(removeBtn.dataset.symbol); return; }
    const card = e.target.closest('.stock-card');
    if (card && card.dataset.symbol) selectSymbol(card.dataset.symbol);
  });
}

// ===== Fetch & Update =====
async function fetchAndUpdateSymbol(symbol) {
  const prev = stockData[symbol];
  const data = await fetchQuote(symbol);
  if (prev && prev.price !== data.price) {
    prevPrices[symbol] = { price: prev.price, dir: data.price > prev.price ? 'up' : 'down' };
  }
  stockData[symbol] = data;
  renderWatchlist();
  flashPriceCard(symbol, prevPrices[symbol]?.dir);
  const triggered = AlertManager.check(symbol, data.price);
  triggered.forEach(a => {
    toast(`🔔 ${symbol} ${a.condition} $${a.price.toFixed(2)} — now $${data.price.toFixed(2)}`, 'warning', 8000);
    AlertManager.render();
  });
  if (selectedSymbol === symbol) updateChartSubtitle(data);
  // Re-score after every quote update
  Suggester.render(stockData, historyCache);
}

function flashPriceCard(symbol, dir) {
  if (!dir) return;
  const card = document.querySelector(`.stock-card[data-symbol="${symbol}"] .stock-price`);
  if (!card) return;
  card.classList.remove('flash-up', 'flash-down');
  // Force reflow so animation restarts
  void card.offsetWidth;
  card.classList.add(dir === 'up' ? 'flash-up' : 'flash-down');
  setTimeout(() => card.classList.remove('flash-up', 'flash-down'), 800);
}

async function refreshAll() {
  await Promise.allSettled(watchlist.map(s => fetchAndUpdateSymbol(s)));
}

// ===== Chart =====
function selectSymbol(symbol) {
  selectedSymbol = symbol;
  renderWatchlist(); // update active highlight
  loadChart(symbol, selectedRange);
}

async function loadChart(symbol, range) {
  const loadingFor = symbol;

  document.getElementById('chartTitle').textContent = symbol;
  document.getElementById('chartSubtitle').textContent = '';
  document.getElementById('chartPlaceholder').classList.add('hidden');

  // Hide growth badge unless 10Y
  const badge = document.getElementById('growthBadge');
  if (badge && range !== '10y') badge.style.display = 'none';

  const key = `${symbol}_${range}`;
  const renderFn = (rows) => {
    if (range === '10y') ChartManager.renderGrowth(symbol, rows, ChartManager.getType());
    else ChartManager.render(symbol, rows, ChartManager.getType());
  };

  if (historyCache[key]) {
    renderFn(historyCache[key].data);
    const d = stockData[symbol];
    if (d) updateChartSubtitle(d);
    if ((Date.now() - historyCache[key].ts) >= HISTORY_TTL) {
      fetchHistory(symbol, range).then(rows => {
        if (selectedSymbol !== loadingFor) return;
        renderFn(rows);
        const d2 = stockData[symbol];
        if (d2) updateChartSubtitle(d2);
      });
    }
    return;
  }

  document.getElementById('chartSubtitle').textContent = 'Loading chart...';
  const rows = await fetchHistory(symbol, range);
  if (selectedSymbol !== loadingFor) return;
  renderFn(rows);
  const d = stockData[symbol];
  if (d) updateChartSubtitle(d);
  else document.getElementById('chartSubtitle').textContent = '';
}

function updateChartSubtitle(d) {
  const subtitleEl = document.getElementById('chartSubtitle');
  const cls = d.changePct > 0 ? 'up' : d.changePct < 0 ? 'down' : 'neutral';
  const arrow = d.changePct > 0 ? '▲' : d.changePct < 0 ? '▼' : '–';
  const mockBadge = d.isMock
    ? ' <span style="font-size:0.7rem;background:var(--yellow);color:#000;padding:1px 6px;border-radius:4px;font-weight:700">DEMO</span>'
    : '';
  subtitleEl.innerHTML = `<span style="font-size:1.1rem;font-weight:700">$${d.price.toFixed(2)}</span>
    <span class="${cls}" style="margin-left:8px">${arrow} ${d.change >= 0 ? '+' : ''}$${d.change.toFixed(2)} (${d.changePct.toFixed(2)}%)</span>${mockBadge}`;
}

// ===== Search =====
function initSearch() {
  const input = document.getElementById('searchInput');
  const dropdown = document.getElementById('searchDropdown');

  input.addEventListener('input', () => {
    const q = input.value.trim().toUpperCase();
    if (!q) { dropdown.classList.remove('open'); return; }
    const matches = POPULAR_SYMBOLS.filter(s =>
      s.symbol.startsWith(q) || s.name.toUpperCase().includes(q)
    ).slice(0, 8);

    if (matches.length > 0) {
      dropdown.innerHTML = matches.map(s =>
        `<div class="search-item" data-symbol="${s.symbol}">
          <span class="sym">${s.symbol}</span>
          <span class="name">${s.name}</span>
        </div>`
      ).join('');
    } else {
      // Allow any ticker — show "Add [TICKER]" option
      dropdown.innerHTML = `<div class="search-item" data-symbol="${q}">
        <span class="sym">${q}</span>
        <span class="name">Add to watchlist</span>
      </div>`;
    }
    dropdown.classList.add('open');
    dropdown.querySelectorAll('.search-item[data-symbol]').forEach(item => {
      item.addEventListener('click', () => {
        addSymbol(item.dataset.symbol);
        input.value = '';
        dropdown.classList.remove('open');
      });
    });
  });

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const q = input.value.trim();
      if (q) { addSymbol(q); input.value = ''; dropdown.classList.remove('open'); }
    }
    if (e.key === 'Escape') dropdown.classList.remove('open');
  });
  document.addEventListener('click', e => {
    if (!e.target.closest('.search-wrapper')) dropdown.classList.remove('open');
  });
}

// ===== Theme =====
function initTheme() {
  const btn = document.getElementById('themeToggle');
  const saved = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  btn.textContent = saved === 'dark' ? '☀️' : '🌙';
  btn.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    btn.textContent = next === 'dark' ? '☀️' : '🌙';
    const cached = historyCache[`${selectedSymbol}_${selectedRange}`];
    if (selectedSymbol && cached) ChartManager.render(selectedSymbol, cached.data, ChartManager.getType());
  });
}

// ===== Alerts Panel =====
function initAlerts() {
  const panel = document.getElementById('alertsPanel');
  document.getElementById('alertsBtn').addEventListener('click', () => panel.classList.toggle('open'));
  document.getElementById('closeAlerts').addEventListener('click', () => panel.classList.remove('open'));
  document.getElementById('addAlertBtn').addEventListener('click', () => {
    const symbol = document.getElementById('alertSymbol').value;
    const condition = document.getElementById('alertCondition').value;
    const price = document.getElementById('alertPrice').value;
    if (!symbol) { toast('Select a symbol', 'warning'); return; }
    if (!price || isNaN(price) || parseFloat(price) <= 0) { toast('Enter a valid price', 'warning'); return; }
    AlertManager.add(symbol, condition, price);
    AlertManager.render();
    document.getElementById('alertPrice').value = '';
    toast(`Alert set for ${symbol}`, 'success');
  });
  AlertManager.render();
}

// ===== Chart Controls =====
function initChartControls() {
  document.querySelectorAll('.chart-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.chart-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const type = btn.dataset.type;
      ChartManager.setType(type);
      if (!selectedSymbol) return;
      // 10Y supports all three chart types via renderGrowth
      const cached = historyCache[`${selectedSymbol}_${selectedRange}`];
      if (cached) {
        if (selectedRange === '10y') ChartManager.renderGrowth(selectedSymbol, cached.data, type);
        else ChartManager.render(selectedSymbol, cached.data, type);
      } else {
        loadChart(selectedSymbol, selectedRange);
      }
    });
  });

  document.querySelectorAll('.range-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.range-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedRange = btn.dataset.range;
      if (selectedSymbol) loadChart(selectedSymbol, selectedRange);
    });
  });
}

// ===== Add Symbol Form =====
function initAddForm() {
  const form = document.getElementById('addSymbolForm');
  const input = document.getElementById('symbolInput');
  document.getElementById('addSymbolBtn').addEventListener('click', () => { form.classList.remove('hidden'); input.focus(); });
  document.getElementById('cancelAdd').addEventListener('click', () => { form.classList.add('hidden'); input.value = ''; });
  document.getElementById('confirmAdd').addEventListener('click', () => {
    if (input.value.trim()) { addSymbol(input.value); input.value = ''; form.classList.add('hidden'); }
  });
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && input.value.trim()) { addSymbol(input.value); input.value = ''; form.classList.add('hidden'); }
    if (e.key === 'Escape') { form.classList.add('hidden'); input.value = ''; }
  });
}

// ===== Auto Refresh =====
function startRefresh() {
  let initialDone = false;

  // Initial load
  Promise.allSettled(watchlist.map(s => fetchAndUpdateSymbol(s))).then(() => {
    if (!initialDone && watchlist.length > 0) {
      initialDone = true;
      selectSymbol(watchlist[0]);
    }
  });

  // 1-second ticker: updates countdown badge every second, fires full refresh every REFRESH_MS
  refreshCountdown = REFRESH_MS / 1000;
  setInterval(() => {
    refreshCountdown--;
    updateRefreshBadge();

    if (refreshCountdown <= 0) {
      refreshCountdown = REFRESH_MS / 1000;
      // Expire history cache so chart re-fetches on next view
      Object.keys(historyCache).forEach(k => { historyCache[k].ts = 0; });
      refreshAll();
    }
  }, 1000);
}

function updateRefreshBadge() {
  const badge = document.getElementById('refreshBadge');
  if (!badge) return;
  badge.textContent = `● LIVE  ${refreshCountdown}s`;
}

async function refreshAll() {
  await Promise.allSettled(watchlist.map(s => fetchAndUpdateSymbol(s)));
}

// ===== Init =====
function init() {
  initTheme();
  initSearch();
  initAlerts();
  initChartControls();
  initAddForm();
  initWatchlistEvents();
  InvestmentIdeas.init();
  AlertManager.updateSymbolSelect(watchlist);
  renderWatchlist();
  startRefresh();
}

document.addEventListener('DOMContentLoaded', init);
