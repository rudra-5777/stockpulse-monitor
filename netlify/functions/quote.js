// Netlify serverless function — proxies Yahoo Finance with proper headers
// Runs server-side so no CORS issues. Called as /.netlify/functions/quote?symbols=AAPL,MSFT

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
    'Cache-Control': 'no-cache',
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const symbols = (event.queryStringParameters?.symbols || '').split(',').map(s => s.trim()).filter(Boolean);
  if (symbols.length === 0) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'No symbols provided' }) };
  }

  // Limit to 20 symbols per call
  const batch = symbols.slice(0, 20);
  const results = {};

  await Promise.allSettled(batch.map(async (symbol) => {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d&includePrePost=false`;
      const { status, body } = await fetchUrl(url);
      if (status !== 200) throw new Error(`HTTP ${status}`);
      const json = JSON.parse(body);
      const result = json?.chart?.result?.[0];
      if (!result) throw new Error('No result');
      const meta = result.meta;
      const price = meta.regularMarketPrice;
      const prev  = meta.chartPreviousClose || meta.previousClose || price;
      results[symbol] = {
        symbol,
        name:      meta.longName || meta.shortName || symbol,
        price,
        prevClose: prev,
        change:    parseFloat((price - prev).toFixed(2)),
        changePct: parseFloat(((price - prev) / prev * 100).toFixed(2)),
        volume:    meta.regularMarketVolume || 0,
        dayHigh:   meta.regularMarketDayHigh || price,
        dayLow:    meta.regularMarketDayLow  || price,
        currency:  meta.currency || 'USD',
        isMock:    false,
      };
    } catch (err) {
      results[symbol] = { symbol, error: err.message };
    }
  }));

  return { statusCode: 200, headers, body: JSON.stringify(results) };
};
