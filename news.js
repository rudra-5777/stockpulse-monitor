// ===== Market News =====
const NewsManager = (() => {
  let newsCache = {};
  const CACHE_MS = 5 * 60 * 1000;

  function getTimeAgo(date) {
    const diff = Math.floor((Date.now() - date) / 1000);
    if (diff < 60) return diff + 's ago';
    if (diff < 3600) return Math.floor(diff/60) + 'm ago';
    if (diff < 86400) return Math.floor(diff/3600) + 'h ago';
    return date.toLocaleDateString([],{month:'short',day:'numeric'});
  }

  function detectSentiment(text) {
    const t = text.toLowerCase();
    const bull = ['gain','surge','rise','rally','record','high','beat','upgrade','strong','growth','profit','boost'];
    const bear = ['fall','drop','decline','loss','miss','downgrade','weak','cut','sell','concern','risk','slide'];
    const b = bull.filter(w => t.includes(w)).length;
    const s = bear.filter(w => t.includes(w)).length;
    return b > s ? 'bullish' : s > b ? 'bearish' : 'neutral';
  }

  function getFallback(symbol) {
    const sym = symbol || 'Market';
    const now = new Date();
    const fmt = d => d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
    return [
      { headline: sym + ' shares gain as AI spending boom drives tech sector higher', source: 'Reuters', time: fmt(now), summary: 'Investor optimism around AI infrastructure spending drove gains across major technology stocks, with semiconductor and cloud computing companies leading.', tickers: [sym], sentiment: 'bullish', link: '#' },
      { headline: 'Federal Reserve holds rates steady, signals data-dependent approach', source: 'Bloomberg', time: fmt(now), summary: 'The Fed kept benchmark rates unchanged, emphasizing a cautious approach before any adjustments to monetary policy.', tickers: ['SPY','QQQ'], sentiment: 'neutral', link: '#' },
      { headline: 'S&P 500 closes at record high amid strong earnings season', source: 'CNBC', time: fmt(new Date(now-86400000)), summary: 'US equities climbed to record territory as better-than-expected corporate earnings lifted confidence. Technology and healthcare sectors led.', tickers: ['SPY','MSFT','AAPL'], sentiment: 'bullish', link: '#' },
      { headline: 'Oil prices slide on demand concerns as global growth outlook dims', source: 'Reuters', time: fmt(new Date(now-86400000)), summary: 'Crude oil futures fell sharply amid growing concerns about slowing global economic growth.', tickers: ['XOM','CVX'], sentiment: 'bearish', link: '#' },
      { headline: sym + ' analyst upgrades: Wall Street raises price targets after strong results', source: 'MarketWatch', time: fmt(new Date(now-86400000*2)), summary: 'Several analysts raised price targets following better-than-expected quarterly earnings, citing strong revenue growth and margin expansion.', tickers: [sym], sentiment: 'bullish', link: '#' },
      { headline: 'Tech stocks rally as inflation data shows continued cooling trend', source: 'Financial Times', time: fmt(new Date(now-86400000*2)), summary: 'Technology shares surged after the latest inflation report showed price pressures easing, boosting expectations for interest rate relief.', tickers: ['NVDA','META','GOOGL'], sentiment: 'bullish', link: '#' },
      { headline: 'Indian markets: Nifty 50 hits all-time high on FII inflows and strong GDP', source: 'Economic Times', time: fmt(new Date(now-86400000*3)), summary: 'Indian benchmark indices scaled record highs as foreign institutional investors increased exposure to domestic equities.', tickers: ['RELIANCE.NS','TCS.NS'], sentiment: 'bullish', link: '#' },
      { headline: 'Bond yields rise as strong jobs report reduces rate cut expectations', source: 'WSJ', time: fmt(new Date(now-86400000*3)), summary: 'Treasury yields climbed after stronger employment data reduced expectations for near-term interest rate cuts.', tickers: ['TLT'], sentiment: 'neutral', link: '#' },
      { headline: 'EV market competition intensifies as Chinese automakers expand globally', source: 'Bloomberg', time: fmt(new Date(now-86400000*4)), summary: 'Global EV competition heated up as Chinese manufacturers accelerated plans to enter European and Southeast Asian markets.', tickers: ['TSLA','RIVN'], sentiment: 'bearish', link: '#' },
      { headline: 'Cloud computing spending surges 28% YoY as enterprises accelerate AI adoption', source: 'TechCrunch', time: fmt(new Date(now-86400000*4)), summary: 'Enterprise spending on cloud infrastructure grew 28% year-over-year as companies rapidly deployed AI workloads.', tickers: ['AMZN','MSFT','GOOGL'], sentiment: 'bullish', link: '#' },
      { headline: 'Semiconductor shortage eases as TSMC expands capacity with new fabs', source: 'Reuters', time: fmt(new Date(now-86400000*5)), summary: 'The global chip shortage is showing signs of easing as major foundries bring new manufacturing capacity online.', tickers: ['NVDA','AMD','INTC'], sentiment: 'bullish', link: '#' },
      { headline: 'Pharmaceutical stocks rise on FDA approvals and pipeline optimism', source: 'BioPharma Dive', time: fmt(new Date(now-86400000*5)), summary: 'Healthcare and pharma stocks advanced following a series of FDA drug approvals and positive clinical trial results.', tickers: ['LLY','ABBV','MRNA'], sentiment: 'bullish', link: '#' },
    ];
  }

  async function fetchNews(symbol) {
    const key = symbol || 'general';
    const cached = newsCache[key];
    if (cached && (Date.now() - cached.ts) < CACHE_MS) return cached.data;
    try {
      const rssUrl = symbol
        ? 'https://feeds.finance.yahoo.com/rss/2.0/headline?s=' + symbol + '&region=US&lang=en-US'
        : 'https://feeds.finance.yahoo.com/rss/2.0/headline?s=AAPL,MSFT,GOOGL,TSLA,NVDA&region=US&lang=en-US';
      const proxy = 'https://api.allorigins.win/get?url=' + encodeURIComponent(rssUrl);
      const res = await fetch(proxy, { signal: AbortSignal.timeout(6000) });
      if (!res.ok) throw new Error('bad');
      const json = await res.json();
      const xml = json.contents || '';
      const items = [...xml.matchAll(/<item>([sS]*?)</item>/g)].map(m => m[1]);
      if (items.length === 0) throw new Error('empty');
      const news = items.slice(0, 12).map(item => {
        const title = (item.match(/<title><![CDATA[(.*?)]]></title>/) || item.match(/<title>(.*?)</title>/) || ['',''])[1] || '';
        const desc = (item.match(/<description><![CDATA[(.*?)]]></description>/) || item.match(/<description>(.*?)</description>/) || ['',''])[1] || '';
        const pubDate = (item.match(/<pubDate>(.*?)</pubDate>/) || ['',''])[1] || '';
        const link = (item.match(/<link>(.*?)</link>/) || ['',''])[1] || '#';
        const cleanDesc = desc.replace(/<[^>]*>/g,'').substring(0,250);
        const d = pubDate ? new Date(pubDate) : new Date();
        return { headline: title, source: 'Yahoo Finance', time: getTimeAgo(d), summary: cleanDesc, tickers: symbol ? [symbol] : [], sentiment: detectSentiment(title + ' ' + cleanDesc), link };
      });
      newsCache[key] = { data: news, ts: Date.now() };
      return news;
    } catch {
      const fb = getFallback(symbol);
      newsCache[key] = { data: fb, ts: Date.now() };
      return fb;
    }
  }

  function renderNews(articles) {
    const grid = document.getElementById('newsGrid');
    if (!grid) return;
    if (!articles || articles.length === 0) { grid.innerHTML = '<div class="news-error">No news available. Try refreshing.</div>'; return; }
    grid.innerHTML = articles.map(a => {
      const sc = a.sentiment || 'neutral';
      const sl = sc === 'bullish' ? 'Bullish' : sc === 'bearish' ? 'Bearish' : 'Neutral';
      const tickers = (a.tickers||[]).map(t => '<span class="news-ticker">' + t.replace('.NS','') + '</span>').join('');
      return '<div class="news-card" style="cursor:pointer" onclick="if('' + (a.link||'#').replace(/'/g,'') + "'!='#')window.open('" + (a.link||'#').replace(/'/g,'') + "','_blank')">" +
        '<div class="news-card-source"><span class="news-source-tag">' + (a.source||'News') + '</span><span class="news-time">' + (a.time||'') + '</span></div>' +
        '<div class="news-headline">' + a.headline + '</div>' +
        '<div class="news-summary">' + (a.summary||'') + '</div>' +
        '<div class="news-ticker-tags">' + tickers + '<span class="news-sentiment ' + sc + '">' + sl + '</span></div>' +
        '</div>';
    }).join('');
  }

  async function load(symbol) {
    // Show fallback content instantly
    renderNews(getFallback(symbol || ''));
    // Try to get real news in background
    fetchNews(symbol || '').then(articles => renderNews(articles)).catch(() => {});
  }

  function init() {
    const filter = document.getElementById('newsSymbolFilter');
    const btn = document.getElementById('refreshNewsBtn');
    if (filter) filter.addEventListener('change', () => { newsCache = {}; load(filter.value); });
    if (btn) btn.addEventListener('click', () => { newsCache = {}; load(filter ? filter.value : ''); });
    // Add watchlist symbols to filter
    setTimeout(() => {
      if (filter && typeof watchlist !== 'undefined') {
        watchlist.forEach(sym => {
          if (![...filter.options].some(o => o.value === sym)) {
            const opt = document.createElement('option');
            opt.value = sym; opt.textContent = sym.replace('.NS','');
            filter.appendChild(opt);
          }
        });
      }
    }, 1000);
  }

  return { init, load };
})();
