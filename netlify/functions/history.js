// Netlify serverless function — fetches Yahoo Finance chart history
// Called as /.netlify/functions/history?symbol=AAPL&range=1d

const https = require('https');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://finance.yahoo.com/',
        'Origin': 'https://finance.yahoo.com',
      },
    };
    https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=60',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const symbol = event.queryStringParameters?.symbol;
  const range  = event.queryStringParameters?.range || '1d';
  if (!symbol) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'No symbol' }) };
  }

  const intervalMap = { '1d': '5m', '5d': '30m', '1mo': '1d', '3mo': '1d', '10y': '1mo' };
  const yahooRange  = range === '10y' ? 'max' : range;
  const interval    = intervalMap[range] || '1d';

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${yahooRange}&includePrePost=false`;
    const { status, body } = await fetchUrl(url);
    if (status !== 200) throw new Error(`HTTP ${status}`);
    const json   = JSON.parse(body);
    const result = json?.chart?.result?.[0];
    if (!result) throw new Error('No result');

    const timestamps = result.timestamp || [];
    const ohlcv      = result.indicators?.quote?.[0] || {};
    const adjclose   = result.indicators?.adjclose?.[0]?.adjclose || ohlcv.close;

    let rows = timestamps.map((ts, i) => {
      const d     = new Date(ts * 1000);
      const label = range === '1d'
        ? d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
        : d.toLocaleDateString('en-US', {
            month: 'short', day: 'numeric',
            year: range === '10y' ? '2-digit' : undefined,
          });
      return {
        date:   label,
        open:   ohlcv.open?.[i]   ?? 0,
        high:   ohlcv.high?.[i]   ?? 0,
        low:    ohlcv.low?.[i]    ?? 0,
        close:  adjclose?.[i]     ?? ohlcv.close?.[i] ?? 0,
        volume: ohlcv.volume?.[i] ?? 0,
      };
    }).filter(d => d.close > 0);

    // For 10Y trim to last 10 years
    if (range === '10y') {
      const cutoff = Date.now() - 10 * 365.25 * 24 * 3600 * 1000;
      const cutRows = timestamps
        .map((ts, i) => ({ ts: ts * 1000, i }))
        .filter(x => x.ts >= cutoff)
        .map(x => rows[x.i])
        .filter(Boolean);
      if (cutRows.length > 0) rows = cutRows;
    }

    return { statusCode: 200, headers, body: JSON.stringify({ symbol, range, rows }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
