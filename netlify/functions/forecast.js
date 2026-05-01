// Netlify function: fetches max history for a symbol, computes 5-year forecast
// GET /.netlify/functions/forecast?symbol=AAPL

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
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

// ── Math helpers ─────────────────────────────────────────────────────────────
function mean(arr) { return arr.reduce((a, b) => a + b, 0) / arr.length; }
function stddev(arr) {
  const m = mean(arr);
  return Math.sqrt(arr.reduce((a, b) => a + (b - m) ** 2, 0) / arr.length);
}
function cagr(start, end, years) {
  if (start <= 0 || years <= 0) return 0;
  return (Math.pow(end / start, 1 / years) - 1) * 100;
}
function linearRegression(y) {
  const n = y.length;
  const x = Array.from({ length: n }, (_, i) => i);
  const xm = mean(x), ym = mean(y);
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) { num += (x[i] - xm) * (y[i] - ym); den += (x[i] - xm) ** 2; }
  const slope = den ? num / den : 0;
  const intercept = ym - slope * xm;
  return { slope, intercept, slopePercentPerPeriod: (slope / ym) * 100 };
}
function rsi(closes, period = 14) {
  if (closes.length < period + 1) return 50;
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i - 1];
    if (d > 0) gains += d; else losses -= d;
  }
  let ag = gains / period, al = losses / period;
  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    ag = (ag * (period - 1) + Math.max(d, 0)) / period;
    al = (al * (period - 1) + Math.max(-d, 0)) / period;
  }
  return al === 0 ? 100 : 100 - 100 / (1 + ag / al);
}
function maxDrawdown(closes) {
  let peak = closes[0], dd = 0;
  for (const c of closes) { if (c > peak) peak = c; dd = Math.max(dd, (peak - c) / peak); }
  return dd * 100;
}
function annualReturns(monthlyCloses) {
  // Group monthly closes into years, compute annual return per year
  const years = {};
  monthlyCloses.forEach((c, i) => {
    const yr = Math.floor(i / 12);
    if (!years[yr]) years[yr] = [];
    years[yr].push(c);
  });
  return Object.values(years).map(arr => {
    const ret = (arr[arr.length - 1] - arr[0]) / arr[0] * 100;
    return parseFloat(ret.toFixed(2));
  });
}

// ── Main forecast engine ──────────────────────────────────────────────────────
function buildForecast(symbol, name, currency, rows) {
  const closes  = rows.map(r => r.close);
  const current = closes[closes.length - 1];
  const n       = closes.length; // months of history

  // Historical metrics
  const histYears   = n / 12;
  const histCAGR    = cagr(closes[0], current, histYears);
  const monthlyRets = [];
  for (let i = 1; i < closes.length; i++) monthlyRets.push((closes[i] - closes[i-1]) / closes[i-1] * 100);
  const avgMonthlyRet = mean(monthlyRets);
  const monthlyVol    = stddev(monthlyRets);
  const annualVol     = monthlyVol * Math.sqrt(12);
  const annualRet     = avgMonthlyRet * 12;
  const maxDD         = maxDrawdown(closes);
  const rsiVal        = rsi(closes.slice(-30));
  const regression    = linearRegression(closes);
  const annRetArr     = annualReturns(closes);
  const bestYear      = Math.max(...annRetArr);
  const worstYear     = Math.min(...annRetArr);
  const sharpe        = annualVol > 0 ? (annualRet - 4) / annualVol : 0; // assume 4% risk-free

  // Trend strength: slope as % per month
  const trendStrength = regression.slopePercentPerPeriod;

  // Scenario multipliers based on historical volatility
  // Bull: historical CAGR + 1 stddev of annual returns
  // Base: historical CAGR (regression-adjusted)
  // Bear: historical CAGR - 1.5 stddev
  const annRetStd = stddev(annRetArr.length > 1 ? annRetArr : [annualRet]);
  // Cap scenarios to realistic bounds — even the best stocks rarely sustain >50%/yr
  const baseAnnual = Math.min(Math.max(histCAGR * 0.75 + trendStrength * 1.5, -25), 45);
  const bullAnnual = Math.min(baseAnnual + Math.min(annRetStd * 0.6, 20), 60);
  const bearAnnual = Math.max(baseAnnual - Math.min(annRetStd * 0.8, 25), -40);

  // Year-by-year projections
  const years = [1, 2, 3, 4, 5];
  const projections = years.map(yr => {
    const bull = parseFloat((current * Math.pow(1 + bullAnnual / 100, yr)).toFixed(2));
    const base = parseFloat((current * Math.pow(1 + baseAnnual / 100, yr)).toFixed(2));
    const bear = parseFloat((current * Math.pow(1 + bearAnnual / 100, yr)).toFixed(2));
    const bullRet = parseFloat(((bull - current) / current * 100).toFixed(1));
    const baseRet = parseFloat(((base - current) / current * 100).toFixed(1));
    const bearRet = parseFloat(((bear - current) / current * 100).toFixed(1));
    return { year: yr, label: `${new Date().getFullYear() + yr}`, bull, base, bear, bullRet, baseRet, bearRet };
  });

  // Risk assessment
  let riskLevel, riskColor;
  if (annualVol > 50 || maxDD > 60)      { riskLevel = 'Very High'; riskColor = '#e74c3c'; }
  else if (annualVol > 30 || maxDD > 40) { riskLevel = 'High';      riskColor = '#e67e22'; }
  else if (annualVol > 20 || maxDD > 25) { riskLevel = 'Medium';    riskColor = '#f39c12'; }
  else if (annualVol > 10 || maxDD > 15) { riskLevel = 'Low-Med';   riskColor = '#52d68a'; }
  else                                    { riskLevel = 'Low';       riskColor = '#26c281'; }

  // Outlook
  let outlook, outlookColor;
  if      (baseAnnual >= 20) { outlook = 'Very Bullish'; outlookColor = '#26c281'; }
  else if (baseAnnual >= 10) { outlook = 'Bullish';      outlookColor = '#52d68a'; }
  else if (baseAnnual >= 3)  { outlook = 'Mildly Bullish'; outlookColor = '#f39c12'; }
  else if (baseAnnual >= -5) { outlook = 'Neutral';      outlookColor = '#9ea3c0'; }
  else if (baseAnnual >= -15){ outlook = 'Bearish';      outlookColor = '#e67e22'; }
  else                        { outlook = 'Very Bearish'; outlookColor = '#e74c3c'; }

  // Key insights
  const insights = [];
  if (histCAGR > 20)  insights.push({ icon:'🚀', text:`Strong historical growth: ${histCAGR.toFixed(1)}% CAGR over ${histYears.toFixed(1)} years` });
  else if (histCAGR > 10) insights.push({ icon:'📈', text:`Solid historical growth: ${histCAGR.toFixed(1)}% CAGR` });
  else if (histCAGR > 0)  insights.push({ icon:'📊', text:`Modest historical growth: ${histCAGR.toFixed(1)}% CAGR` });
  else                    insights.push({ icon:'📉', text:`Negative historical trend: ${histCAGR.toFixed(1)}% CAGR` });

  if (annualVol > 40) insights.push({ icon:'⚡', text:`Very high volatility (${annualVol.toFixed(1)}% annual) — large price swings expected` });
  else if (annualVol > 20) insights.push({ icon:'〰️', text:`Moderate volatility (${annualVol.toFixed(1)}% annual)` });
  else insights.push({ icon:'🛡️', text:`Low volatility (${annualVol.toFixed(1)}% annual) — relatively stable` });

  if (maxDD > 50) insights.push({ icon:'⚠️', text:`Has experienced severe drawdowns up to ${maxDD.toFixed(1)}% — high risk` });
  else if (maxDD > 30) insights.push({ icon:'⚠️', text:`Max historical drawdown: ${maxDD.toFixed(1)}%` });

  if (sharpe > 1.5) insights.push({ icon:'🏆', text:`Excellent risk-adjusted returns (Sharpe: ${sharpe.toFixed(2)})` });
  else if (sharpe > 0.8) insights.push({ icon:'✅', text:`Good risk-adjusted returns (Sharpe: ${sharpe.toFixed(2)})` });
  else if (sharpe < 0) insights.push({ icon:'❌', text:`Poor risk-adjusted returns (Sharpe: ${sharpe.toFixed(2)})` });

  if (bestYear > 50)  insights.push({ icon:'🎯', text:`Best single year: +${bestYear.toFixed(1)}%` });
  if (worstYear < -30) insights.push({ icon:'💥', text:`Worst single year: ${worstYear.toFixed(1)}%` });

  if (trendStrength > 0.5) insights.push({ icon:'📐', text:'Strong upward price trend (regression analysis)' });
  else if (trendStrength < -0.5) insights.push({ icon:'📐', text:'Downward price trend detected' });

  return {
    symbol, name, currency,
    currentPrice: parseFloat(current.toFixed(2)),
    historyMonths: n,
    histYears: parseFloat(histYears.toFixed(1)),
    histCAGR: parseFloat(histCAGR.toFixed(2)),
    annualReturn: parseFloat(annualRet.toFixed(2)),
    annualVolatility: parseFloat(annualVol.toFixed(2)),
    maxDrawdown: parseFloat(maxDD.toFixed(2)),
    sharpeRatio: parseFloat(sharpe.toFixed(2)),
    rsi: parseFloat(rsiVal.toFixed(1)),
    trendStrength: parseFloat(trendStrength.toFixed(3)),
    bestYear: parseFloat(bestYear.toFixed(1)),
    worstYear: parseFloat(worstYear.toFixed(1)),
    scenarios: { bull: parseFloat(bullAnnual.toFixed(2)), base: parseFloat(baseAnnual.toFixed(2)), bear: parseFloat(bearAnnual.toFixed(2)) },
    projections,
    riskLevel, riskColor,
    outlook, outlookColor,
    insights,
    annualReturnsHistory: annRetArr.slice(-10),
    monthlyClosesLast24: closes.slice(-24).map(c => parseFloat(c.toFixed(2))),
  };
}

exports.handler = async (event) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=3600',
  };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: corsHeaders, body: '' };

  const symbol = (event.queryStringParameters?.symbol || '').trim().toUpperCase();
  if (!symbol) return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'No symbol provided' }) };

  try {
    // Fetch max history with monthly intervals
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1mo&range=max&includePrePost=false`;
    const { status, body } = await fetchUrl(url);
    if (status !== 200) throw new Error(`Yahoo returned HTTP ${status}`);

    const json   = JSON.parse(body);
    const result = json?.chart?.result?.[0];
    if (!result) throw new Error('No data returned from Yahoo Finance');

    const meta       = result.meta;
    const timestamps = result.timestamp || [];
    const ohlcv      = result.indicators?.quote?.[0] || {};
    const adjclose   = result.indicators?.adjclose?.[0]?.adjclose || ohlcv.close;

    const rows = timestamps.map((ts, i) => ({
      ts,
      close: adjclose?.[i] ?? ohlcv.close?.[i] ?? 0,
    })).filter(r => r.close > 0);

    if (rows.length < 12) throw new Error('Not enough history (need at least 12 months)');

    const name     = meta.longName || meta.shortName || symbol;
    const currency = meta.currency || 'USD';
    const forecast = buildForecast(symbol, name, currency, rows);

    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify(forecast) };
  } catch (err) {
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: err.message }) };
  }
};

// v2
