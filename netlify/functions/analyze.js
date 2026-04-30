// Netlify function: fetches 3-month history for up to 10 symbols,
// computes profit/loss metrics from the chart, returns analysis.
// Called as /.netlify/functions/analyze?symbols=AAPL,TCS.NS

const https = require('https');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Referer': 'https://finance.yahoo.com/',
        'Origin': 'https://finance.yahoo.com',
      },
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.setTimeout(8000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

// ── Technical analysis helpers ──────────────────────────────────────────────

function sma(arr, n) {
  if (arr.length < n) return null;
  return arr.slice(-n).reduce((a, b) => a + b, 0) / n;
}

function ema(arr, n) {
  if (arr.length < n) return null;
  const k = 2 / (n + 1);
  let e = arr.slice(0, n).reduce((a, b) => a + b, 0) / n;
  for (let i = n; i < arr.length; i++) e = arr[i] * k + e * (1 - k);
  return e;
}

function rsi(closes, period = 14) {
  if (closes.length < period + 1) return null;
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i - 1];
    if (d > 0) gains += d; else losses -= d;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    avgGain = (avgGain * (period - 1) + Math.max(d, 0)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(-d, 0)) / period;
  }
  if (avgLoss === 0) return 100;
  return 100 - 100 / (1 + avgGain / avgLoss);
}

function linearTrend(arr) {
  // Returns slope as % per period (positive = uptrend)
  const n = arr.length;
  if (n < 2) return 0;
  const xMean = (n - 1) / 2;
  const yMean = arr.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (arr[i] - yMean);
    den += (i - xMean) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  return (slope / yMean) * 100; // % per period
}

function volatility(closes) {
  if (closes.length < 2) return 0;
  const returns = [];
  for (let i = 1; i < closes.length; i++) {
    returns.push((closes[i] - closes[i - 1]) / closes[i - 1]);
  }
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, b) => a + (b - mean) ** 2, 0) / returns.length;
  return Math.sqrt(variance) * 100; // daily vol %
}

function maxDrawdown(closes) {
  let peak = closes[0], maxDD = 0;
  for (const c of closes) {
    if (c > peak) peak = c;
    const dd = (peak - c) / peak;
    if (dd > maxDD) maxDD = dd;
  }
  return maxDD * 100; // %
}

function supportResistance(closes) {
  const sorted = [...closes].sort((a, b) => a - b);
  const support    = sorted[Math.floor(sorted.length * 0.1)];  // 10th percentile
  const resistance = sorted[Math.floor(sorted.length * 0.9)];  // 90th percentile
  return { support, resistance };
}

// ── Main analysis ────────────────────────────────────────────────────────────

function analyzeHistory(symbol, rows) {
  const closes  = rows.map(r => r.close).filter(v => v > 0);
  const volumes = rows.map(r => r.volume).filter(v => v > 0);
  if (closes.length < 10) return null;

  const current   = closes[closes.length - 1];
  const startPrice= closes[0];
  const weekAgo   = closes[Math.max(0, closes.length - 6)];
  const monthAgo  = closes[Math.max(0, closes.length - 22)];

  // Returns
  const totalReturn   = ((current - startPrice) / startPrice) * 100;
  const weekReturn    = ((current - weekAgo)    / weekAgo)    * 100;
  const monthReturn   = ((current - monthAgo)   / monthAgo)   * 100;

  // Moving averages
  const sma20  = sma(closes, 20);
  const sma50  = sma(closes, Math.min(50, closes.length));
  const ema12  = ema(closes, Math.min(12, closes.length));
  const ema26  = ema(closes, Math.min(26, closes.length));
  const macd   = (ema12 && ema26) ? ema12 - ema26 : null;

  // Momentum
  const rsiVal = rsi(closes);
  const trend  = linearTrend(closes);
  const vol    = volatility(closes);
  const dd     = maxDrawdown(closes);
  const { support, resistance } = supportResistance(closes);

  // Volume trend (recent avg vs overall avg)
  const recentVol = volumes.slice(-10).reduce((a, b) => a + b, 0) / 10;
  const avgVol    = volumes.reduce((a, b) => a + b, 0) / volumes.length;
  const volRatio  = avgVol > 0 ? recentVol / avgVol : 1;

  // Price position vs support/resistance (0=at support, 1=at resistance)
  const pricePosition = resistance > support
    ? (current - support) / (resistance - support)
    : 0.5;

  // ── Profit potential score (0–100) ──────────────────────────────────────
  let score = 50;
  const signals = [];

  // 1. Trend strength (25 pts) — slope of price over 3 months
  if      (trend >= 0.5)  { score += 25; signals.push({ text: `Strong uptrend (+${trend.toFixed(2)}%/day)`,  bull: true  }); }
  else if (trend >= 0.15) { score += 15; signals.push({ text: `Moderate uptrend`,                            bull: true  }); }
  else if (trend >= 0)    { score += 5;  signals.push({ text: `Slight uptrend`,                              bull: true  }); }
  else if (trend >= -0.15){ score -= 8;  signals.push({ text: `Slight downtrend`,                            bull: false }); }
  else if (trend >= -0.5) { score -= 18; signals.push({ text: `Moderate downtrend`,                          bull: false }); }
  else                    { score -= 25; signals.push({ text: `Strong downtrend`,                             bull: false }); }

  // 2. RSI momentum (20 pts) — oversold = buy opportunity, overbought = risk
  if (rsiVal !== null) {
    if      (rsiVal >= 30 && rsiVal <= 50) { score += 20; signals.push({ text: `RSI ${rsiVal.toFixed(0)} — recovering from oversold`, bull: true  }); }
    else if (rsiVal >= 50 && rsiVal <= 65) { score += 15; signals.push({ text: `RSI ${rsiVal.toFixed(0)} — healthy momentum`,         bull: true  }); }
    else if (rsiVal > 65  && rsiVal <= 75) { score += 5;  signals.push({ text: `RSI ${rsiVal.toFixed(0)} — strong but watch for peak`,bull: null  }); }
    else if (rsiVal > 75)                  { score -= 10; signals.push({ text: `RSI ${rsiVal.toFixed(0)} — overbought, pullback risk`, bull: false }); }
    else if (rsiVal < 30)                  { score += 12; signals.push({ text: `RSI ${rsiVal.toFixed(0)} — oversold, bounce likely`,   bull: true  }); }
  }

  // 3. MACD signal (15 pts)
  if (macd !== null) {
    if      (macd > 0 && trend > 0) { score += 15; signals.push({ text: 'MACD bullish crossover',  bull: true  }); }
    else if (macd > 0)              { score += 8;  signals.push({ text: 'MACD positive',            bull: true  }); }
    else if (macd < 0 && trend < 0) { score -= 12; signals.push({ text: 'MACD bearish crossover',  bull: false }); }
    else if (macd < 0)              { score -= 5;  signals.push({ text: 'MACD negative',            bull: false }); }
  }

  // 4. Price vs support/resistance (15 pts)
  if      (pricePosition <= 0.2) { score += 15; signals.push({ text: `Near support ($${support.toFixed(2)}) — low risk entry`, bull: true  }); }
  else if (pricePosition <= 0.4) { score += 8;  signals.push({ text: 'Price in lower range — good entry zone',                 bull: true  }); }
  else if (pricePosition >= 0.85){ score -= 10; signals.push({ text: `Near resistance ($${resistance.toFixed(2)}) — risky`,    bull: false }); }

  // 5. Volume confirmation (10 pts)
  if      (volRatio >= 1.5 && trend > 0) { score += 10; signals.push({ text: 'Rising volume confirms uptrend',  bull: true  }); }
  else if (volRatio >= 1.2 && trend > 0) { score += 6;  signals.push({ text: 'Above-avg volume on uptrend',     bull: true  }); }
  else if (volRatio >= 1.5 && trend < 0) { score -= 8;  signals.push({ text: 'Rising volume on downtrend',      bull: false }); }

  // 6. Drawdown penalty (risk-adjusted)
  if      (dd > 30) { score -= 15; signals.push({ text: `High drawdown ${dd.toFixed(1)}% — volatile`,  bull: false }); }
  else if (dd > 15) { score -= 5;  signals.push({ text: `Moderate drawdown ${dd.toFixed(1)}%`,          bull: null  }); }
  else              { score += 5;  signals.push({ text: `Low drawdown ${dd.toFixed(1)}% — stable`,      bull: true  }); }

  // 7. Recent momentum bonus
  if      (weekReturn >= 3)  { score += 8;  signals.push({ text: `+${weekReturn.toFixed(1)}% this week`,  bull: true  }); }
  else if (weekReturn >= 1)  { score += 4;  signals.push({ text: `+${weekReturn.toFixed(1)}% this week`,  bull: true  }); }
  else if (weekReturn <= -3) { score -= 8;  signals.push({ text: `${weekReturn.toFixed(1)}% this week`,   bull: false }); }

  score = Math.max(0, Math.min(100, Math.round(score)));

  // Estimated upside: distance to resistance as profit target
  const upsidePct = pricePosition < 0.8 && resistance > current
    ? parseFloat(((resistance - current) / current * 100).toFixed(1))
    : 0;
  const targetPrice = parseFloat((current * (1 + upsidePct / 100)).toFixed(2));

  // Profit/loss summary
  const profitSummary = {
    totalReturn:  parseFloat(totalReturn.toFixed(2)),
    weekReturn:   parseFloat(weekReturn.toFixed(2)),
    monthReturn:  parseFloat(monthReturn.toFixed(2)),
    maxDrawdown:  parseFloat(dd.toFixed(2)),
    volatility:   parseFloat(vol.toFixed(2)),
    rsi:          rsiVal !== null ? parseFloat(rsiVal.toFixed(1)) : null,
    trend:        parseFloat(trend.toFixed(3)),
    support:      parseFloat(support.toFixed(2)),
    resistance:   parseFloat(resistance.toFixed(2)),
    pricePosition:parseFloat(pricePosition.toFixed(2)),
  };

  return { symbol, score, signals, upsidePct, targetPrice, profitSummary, currentPrice: current };
}

// ── Handler ──────────────────────────────────────────────────────────────────

exports.handler = async (event) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=120',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: corsHeaders, body: '' };

  const symbols = (event.queryStringParameters?.symbols || '')
    .split(',').map(s => s.trim()).filter(Boolean).slice(0, 10);

  if (symbols.length === 0) {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'No symbols' }) };
  }

  const results = {};

  await Promise.allSettled(symbols.map(async (symbol) => {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=3mo&includePrePost=false`;
      const { status, body } = await fetchUrl(url);
      if (status !== 200) throw new Error(`HTTP ${status}`);
      const json   = JSON.parse(body);
      const result = json?.chart?.result?.[0];
      if (!result) throw new Error('No result');

      const timestamps = result.timestamp || [];
      const ohlcv      = result.indicators?.quote?.[0] || {};
      const adjclose   = result.indicators?.adjclose?.[0]?.adjclose || ohlcv.close;

      const rows = timestamps.map((ts, i) => ({
        date:   new Date(ts * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        open:   ohlcv.open?.[i]   ?? 0,
        high:   ohlcv.high?.[i]   ?? 0,
        low:    ohlcv.low?.[i]    ?? 0,
        close:  adjclose?.[i]     ?? ohlcv.close?.[i] ?? 0,
        volume: ohlcv.volume?.[i] ?? 0,
      })).filter(r => r.close > 0);

      const analysis = analyzeHistory(symbol, rows);
      if (analysis) results[symbol] = analysis;
    } catch (err) {
      results[symbol] = { symbol, error: err.message };
    }
  }));

  return { statusCode: 200, headers: corsHeaders, body: JSON.stringify(results) };
};

// deployed 2026-05-01 00:29:52
