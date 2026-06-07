// ===== Stock Suggester and Investment Ideas Engine =====

const UNIVERSE_US = [
  { symbol:'AAPL',  name:'Apple Inc.',                  sector:'Technology' },
  { symbol:'MSFT',  name:'Microsoft Corp.',              sector:'Technology' },
  { symbol:'NVDA',  name:'NVIDIA Corp.',                 sector:'Technology' },
  { symbol:'GOOGL', name:'Alphabet Inc.',                sector:'Technology' },
  { symbol:'META',  name:'Meta Platforms',               sector:'Technology' },
  { symbol:'AMD',   name:'Advanced Micro Devices',       sector:'Technology' },
  { symbol:'AVGO',  name:'Broadcom Inc.',                sector:'Technology' },
  { symbol:'CRM',   name:'Salesforce Inc.',              sector:'Technology' },
  { symbol:'ORCL',  name:'Oracle Corp.',                 sector:'Technology' },
  { symbol:'INTC',  name:'Intel Corp.',                  sector:'Technology' },
  { symbol:'QCOM',  name:'Qualcomm Inc.',                sector:'Technology' },
  { symbol:'TXN',   name:'Texas Instruments',            sector:'Technology' },
  { symbol:'AMAT',  name:'Applied Materials',            sector:'Technology' },
  { symbol:'LRCX',  name:'Lam Research',                 sector:'Technology' },
  { symbol:'KLAC',  name:'KLA Corp.',                    sector:'Technology' },
  { symbol:'MRVL',  name:'Marvell Technology',           sector:'Technology' },
  { symbol:'ADBE',  name:'Adobe Inc.',                   sector:'Technology' },
  { symbol:'NOW',   name:'ServiceNow Inc.',              sector:'Technology' },
  { symbol:'INTU',  name:'Intuit Inc.',                  sector:'Technology' },
  { symbol:'PANW',  name:'Palo Alto Networks',           sector:'Technology' },
  { symbol:'PLTR',  name:'Palantir Technologies',        sector:'AI & Cloud' },
  { symbol:'CRWD',  name:'CrowdStrike Holdings',         sector:'AI & Cloud' },
  { symbol:'SNOW',  name:'Snowflake Inc.',               sector:'AI & Cloud' },
  { symbol:'NET',   name:'Cloudflare Inc.',              sector:'AI & Cloud' },
  { symbol:'DDOG',  name:'Datadog Inc.',                 sector:'AI & Cloud' },
  { symbol:'MDB',   name:'MongoDB Inc.',                 sector:'AI & Cloud' },
  { symbol:'OKTA',  name:'Okta Inc.',                    sector:'AI & Cloud' },
  { symbol:'ZS',    name:'Zscaler Inc.',                 sector:'AI & Cloud' },
  { symbol:'TWLO',  name:'Twilio Inc.',                  sector:'AI & Cloud' },
  { symbol:'HUBS',  name:'HubSpot Inc.',                 sector:'AI & Cloud' },
  { symbol:'WDAY',  name:'Workday Inc.',                 sector:'AI & Cloud' },
  { symbol:'VEEV',  name:'Veeva Systems',                sector:'AI & Cloud' },
  { symbol:'DOCN',  name:'DigitalOcean',                 sector:'AI & Cloud' },
  { symbol:'AMZN',  name:'Amazon.com Inc.',              sector:'Consumer' },
  { symbol:'TSLA',  name:'Tesla Inc.',                   sector:'Consumer' },
  { symbol:'SHOP',  name:'Shopify Inc.',                 sector:'Consumer' },
  { symbol:'ABNB',  name:'Airbnb Inc.',                  sector:'Consumer' },
  { symbol:'UBER',  name:'Uber Technologies',            sector:'Consumer' },
  { symbol:'DASH',  name:'DoorDash Inc.',                sector:'Consumer' },
  { symbol:'LYFT',  name:'Lyft Inc.',                    sector:'Consumer' },
  { symbol:'BKNG',  name:'Booking Holdings',             sector:'Consumer' },
  { symbol:'EXPE',  name:'Expedia Group',                sector:'Consumer' },
  { symbol:'ETSY',  name:'Etsy Inc.',                    sector:'Consumer' },
  { symbol:'EBAY',  name:'eBay Inc.',                    sector:'Consumer' },
  { symbol:'NKE',   name:'Nike Inc.',                    sector:'Consumer' },
  { symbol:'LULU',  name:'Lululemon Athletica',          sector:'Consumer' },
  { symbol:'SBUX',  name:'Starbucks Corp.',              sector:'Consumer' },
  { symbol:'MCD',   name:'McDonalds Corp.',              sector:'Consumer' },
  { symbol:'V',     name:'Visa Inc.',                    sector:'Finance' },
  { symbol:'MA',    name:'Mastercard Inc.',              sector:'Finance' },
  { symbol:'JPM',   name:'JPMorgan Chase',               sector:'Finance' },
  { symbol:'COIN',  name:'Coinbase Global',              sector:'Finance' },
  { symbol:'SQ',    name:'Block Inc.',                   sector:'Finance' },
  { symbol:'PYPL',  name:'PayPal Holdings',              sector:'Finance' },
  { symbol:'GS',    name:'Goldman Sachs',                sector:'Finance' },
  { symbol:'MS',    name:'Morgan Stanley',               sector:'Finance' },
  { symbol:'BAC',   name:'Bank of America',              sector:'Finance' },
  { symbol:'WFC',   name:'Wells Fargo',                  sector:'Finance' },
  { symbol:'C',     name:'Citigroup Inc.',               sector:'Finance' },
  { symbol:'AXP',   name:'American Express',             sector:'Finance' },
  { symbol:'BLK',   name:'BlackRock Inc.',               sector:'Finance' },
  { symbol:'SCHW',  name:'Charles Schwab',               sector:'Finance' },
  { symbol:'HOOD',  name:'Robinhood Markets',            sector:'Finance' },
  { symbol:'NFLX',  name:'Netflix Inc.',                 sector:'Media' },
  { symbol:'DIS',   name:'Walt Disney Co.',              sector:'Media' },
  { symbol:'SPOT',  name:'Spotify Technology',           sector:'Media' },
  { symbol:'RBLX',  name:'Roblox Corp.',                 sector:'Media' },
  { symbol:'SNAP',  name:'Snap Inc.',                    sector:'Media' },
  { symbol:'PINS',  name:'Pinterest Inc.',               sector:'Media' },
  { symbol:'RDDT',  name:'Reddit Inc.',                  sector:'Media' },
  { symbol:'WBD',   name:'Warner Bros. Discovery',       sector:'Media' },
  { symbol:'EA',    name:'Electronic Arts',              sector:'Media' },
  { symbol:'TTWO',  name:'Take-Two Interactive',         sector:'Media' },
  { symbol:'LLY',   name:'Eli Lilly and Co.',            sector:'Healthcare' },
  { symbol:'UNH',   name:'UnitedHealth Group',           sector:'Healthcare' },
  { symbol:'ABBV',  name:'AbbVie Inc.',                  sector:'Healthcare' },
  { symbol:'MRNA',  name:'Moderna Inc.',                 sector:'Healthcare' },
  { symbol:'JNJ',   name:'Johnson and Johnson',          sector:'Healthcare' },
  { symbol:'PFE',   name:'Pfizer Inc.',                  sector:'Healthcare' },
  { symbol:'MRK',   name:'Merck and Co.',                sector:'Healthcare' },
  { symbol:'BMY',   name:'Bristol-Myers Squibb',         sector:'Healthcare' },
  { symbol:'GILD',  name:'Gilead Sciences',              sector:'Healthcare' },
  { symbol:'REGN',  name:'Regeneron Pharmaceuticals',    sector:'Healthcare' },
  { symbol:'ISRG',  name:'Intuitive Surgical',           sector:'Healthcare' },
  { symbol:'TMO',   name:'Thermo Fisher Scientific',     sector:'Healthcare' },
  { symbol:'DHR',   name:'Danaher Corp.',                sector:'Healthcare' },
  { symbol:'CVS',   name:'CVS Health Corp.',             sector:'Healthcare' },
  { symbol:'XOM',   name:'Exxon Mobil Corp.',            sector:'Energy' },
  { symbol:'CVX',   name:'Chevron Corp.',                sector:'Energy' },
  { symbol:'NEE',   name:'NextEra Energy',               sector:'Energy' },
  { symbol:'COP',   name:'ConocoPhillips',               sector:'Energy' },
  { symbol:'SLB',   name:'Schlumberger Ltd.',            sector:'Energy' },
  { symbol:'OXY',   name:'Occidental Petroleum',         sector:'Energy' },
  { symbol:'FSLR',  name:'First Solar Inc.',             sector:'Energy' },
  { symbol:'ENPH',  name:'Enphase Energy',               sector:'Energy' },
  { symbol:'WMT',   name:'Walmart Inc.',                 sector:'Defensive' },
  { symbol:'KO',    name:'Coca-Cola Co.',                sector:'Defensive' },
  { symbol:'PG',    name:'Procter and Gamble',           sector:'Defensive' },
  { symbol:'PEP',   name:'PepsiCo Inc.',                 sector:'Defensive' },
  { symbol:'COST',  name:'Costco Wholesale',             sector:'Defensive' },
  { symbol:'TGT',   name:'Target Corp.',                 sector:'Defensive' },
  { symbol:'HD',    name:'Home Depot Inc.',              sector:'Defensive' },
  { symbol:'LOW',   name:'Lowes Companies',              sector:'Defensive' },
  { symbol:'CL',    name:'Colgate-Palmolive',            sector:'Defensive' },
  { symbol:'GIS',   name:'General Mills',                sector:'Defensive' },
  { symbol:'BA',    name:'Boeing Co.',                   sector:'Industrial' },
  { symbol:'CAT',   name:'Caterpillar Inc.',             sector:'Industrial' },
  { symbol:'DE',    name:'Deere and Company',            sector:'Industrial' },
  { symbol:'GE',    name:'GE Aerospace',                 sector:'Industrial' },
  { symbol:'HON',   name:'Honeywell International',      sector:'Industrial' },
  { symbol:'RTX',   name:'RTX Corp.',                    sector:'Industrial' },
  { symbol:'LMT',   name:'Lockheed Martin',              sector:'Industrial' },
  { symbol:'UPS',   name:'United Parcel Service',        sector:'Industrial' },
  { symbol:'FDX',   name:'FedEx Corp.',                  sector:'Industrial' },
  { symbol:'AMT',   name:'American Tower Corp.',         sector:'Real Estate' },
  { symbol:'PLD',   name:'Prologis Inc.',                sector:'Real Estate' },
  { symbol:'EQIX',  name:'Equinix Inc.',                 sector:'Real Estate' },
  { symbol:'O',     name:'Realty Income Corp.',          sector:'Real Estate' },
];

const UNIVERSE_IN = [
  { symbol:'TCS.NS',          name:'Tata Consultancy Services',   sector:'IT' },
  { symbol:'INFY.NS',         name:'Infosys Ltd.',                sector:'IT' },
  { symbol:'WIPRO.NS',        name:'Wipro Ltd.',                  sector:'IT' },
  { symbol:'HCLTECH.NS',      name:'HCL Technologies',            sector:'IT' },
  { symbol:'TECHM.NS',        name:'Tech Mahindra',               sector:'IT' },
  { symbol:'LTIM.NS',         name:'LTIMindtree',                 sector:'IT' },
  { symbol:'MPHASIS.NS',      name:'Mphasis Ltd.',                sector:'IT' },
  { symbol:'PERSISTENT.NS',   name:'Persistent Systems',          sector:'IT' },
  { symbol:'COFORGE.NS',      name:'Coforge Ltd.',                sector:'IT' },
  { symbol:'KPITTECH.NS',     name:'KPIT Technologies',           sector:'IT' },
  { symbol:'TATAELXSI.NS',    name:'Tata Elxsi',                  sector:'IT' },
  { symbol:'OFSS.NS',         name:'Oracle Financial Services',   sector:'IT' },
  { symbol:'HDFCBANK.NS',     name:'HDFC Bank',                   sector:'Banking' },
  { symbol:'ICICIBANK.NS',    name:'ICICI Bank',                  sector:'Banking' },
  { symbol:'SBIN.NS',         name:'State Bank of India',         sector:'Banking' },
  { symbol:'KOTAKBANK.NS',    name:'Kotak Mahindra Bank',         sector:'Banking' },
  { symbol:'AXISBANK.NS',     name:'Axis Bank',                   sector:'Banking' },
  { symbol:'INDUSINDBK.NS',   name:'IndusInd Bank',               sector:'Banking' },
  { symbol:'BANDHANBNK.NS',   name:'Bandhan Bank',                sector:'Banking' },
  { symbol:'FEDERALBNK.NS',   name:'Federal Bank',                sector:'Banking' },
  { symbol:'IDFCFIRSTB.NS',   name:'IDFC First Bank',             sector:'Banking' },
  { symbol:'PNB.NS',          name:'Punjab National Bank',        sector:'Banking' },
  { symbol:'BANKBARODA.NS',   name:'Bank of Baroda',              sector:'Banking' },
  { symbol:'CANBK.NS',        name:'Canara Bank',                 sector:'Banking' },
  { symbol:'BAJFINANCE.NS',   name:'Bajaj Finance',               sector:'Finance' },
  { symbol:'BAJAJFINSV.NS',   name:'Bajaj Finserv',               sector:'Finance' },
  { symbol:'HDFCLIFE.NS',     name:'HDFC Life Insurance',         sector:'Finance' },
  { symbol:'SBILIFE.NS',      name:'SBI Life Insurance',          sector:'Finance' },
  { symbol:'ICICIPRULI.NS',   name:'ICICI Prudential Life',       sector:'Finance' },
  { symbol:'CHOLAFIN.NS',     name:'Cholamandalam Finance',       sector:'Finance' },
  { symbol:'MUTHOOTFIN.NS',   name:'Muthoot Finance',             sector:'Finance' },
  { symbol:'LICHSGFIN.NS',    name:'LIC Housing Finance',         sector:'Finance' },
  { symbol:'RELIANCE.NS',     name:'Reliance Industries',         sector:'Conglomerate' },
  { symbol:'ADANIENT.NS',     name:'Adani Enterprises',           sector:'Conglomerate' },
  { symbol:'ADANIPORTS.NS',   name:'Adani Ports and SEZ',         sector:'Conglomerate' },
  { symbol:'ADANIGREEN.NS',   name:'Adani Green Energy',          sector:'Conglomerate' },
  { symbol:'TATACHEM.NS',     name:'Tata Chemicals',              sector:'Conglomerate' },
  { symbol:'TATACOMM.NS',     name:'Tata Communications',         sector:'Conglomerate' },
  { symbol:'LT.NS',           name:'Larsen and Toubro',           sector:'Industrial' },
  { symbol:'SIEMENS.NS',      name:'Siemens India',               sector:'Industrial' },
  { symbol:'ABB.NS',          name:'ABB India',                   sector:'Industrial' },
  { symbol:'BHEL.NS',         name:'Bharat Heavy Electricals',    sector:'Industrial' },
  { symbol:'HAL.NS',          name:'Hindustan Aeronautics',       sector:'Industrial' },
  { symbol:'BEL.NS',          name:'Bharat Electronics',          sector:'Industrial' },
  { symbol:'CUMMINSIND.NS',   name:'Cummins India',               sector:'Industrial' },
  { symbol:'THERMAX.NS',      name:'Thermax Ltd.',                sector:'Industrial' },
  { symbol:'HINDUNILVR.NS',   name:'Hindustan Unilever',          sector:'FMCG' },
  { symbol:'ITC.NS',          name:'ITC Ltd.',                    sector:'FMCG' },
  { symbol:'NESTLEIND.NS',    name:'Nestle India',                sector:'FMCG' },
  { symbol:'BRITANNIA.NS',    name:'Britannia Industries',        sector:'FMCG' },
  { symbol:'DABUR.NS',        name:'Dabur India',                 sector:'FMCG' },
  { symbol:'MARICO.NS',       name:'Marico Ltd.',                 sector:'FMCG' },
  { symbol:'GODREJCP.NS',     name:'Godrej Consumer Products',    sector:'FMCG' },
  { symbol:'COLPAL.NS',       name:'Colgate-Palmolive India',     sector:'FMCG' },
  { symbol:'VBL.NS',          name:'Varun Beverages',             sector:'FMCG' },
  { symbol:'TATACONSUM.NS',   name:'Tata Consumer Products',      sector:'FMCG' },
  { symbol:'MARUTI.NS',       name:'Maruti Suzuki',               sector:'Auto' },
  { symbol:'TATAMOTORS.NS',   name:'Tata Motors',                 sector:'Auto' },
  { symbol:'BAJAJ-AUTO.NS',   name:'Bajaj Auto',                  sector:'Auto' },
  { symbol:'HEROMOTOCO.NS',   name:'Hero MotoCorp',               sector:'Auto' },
  { symbol:'EICHERMOT.NS',    name:'Eicher Motors',               sector:'Auto' },
  { symbol:'TVSMOTORS.NS',    name:'TVS Motor Company',           sector:'Auto' },
  { symbol:'ASHOKLEY.NS',     name:'Ashok Leyland',               sector:'Auto' },
  { symbol:'MOTHERSON.NS',    name:'Samvardhana Motherson',       sector:'Auto' },
  { symbol:'BOSCHLTD.NS',     name:'Bosch Ltd.',                  sector:'Auto' },
  { symbol:'BALKRISIND.NS',   name:'Balkrishna Industries',       sector:'Auto' },
  { symbol:'SUNPHARMA.NS',    name:'Sun Pharmaceutical',          sector:'Pharma' },
  { symbol:'DRREDDY.NS',      name:'Dr. Reddys Laboratories',     sector:'Pharma' },
  { symbol:'CIPLA.NS',        name:'Cipla Ltd.',                  sector:'Pharma' },
  { symbol:'DIVISLAB.NS',     name:'Divis Laboratories',          sector:'Pharma' },
  { symbol:'BIOCON.NS',       name:'Biocon Ltd.',                 sector:'Pharma' },
  { symbol:'AUROPHARMA.NS',   name:'Aurobindo Pharma',            sector:'Pharma' },
  { symbol:'LUPIN.NS',        name:'Lupin Ltd.',                  sector:'Pharma' },
  { symbol:'TORNTPHARM.NS',   name:'Torrent Pharmaceuticals',     sector:'Pharma' },
  { symbol:'ALKEM.NS',        name:'Alkem Laboratories',          sector:'Pharma' },
  { symbol:'APOLLOHOSP.NS',   name:'Apollo Hospitals',            sector:'Pharma' },
  { symbol:'MAXHEALTH.NS',    name:'Max Healthcare',              sector:'Pharma' },
  { symbol:'ONGC.NS',         name:'Oil and Natural Gas Corp.',   sector:'Energy' },
  { symbol:'NTPC.NS',         name:'NTPC Ltd.',                   sector:'Energy' },
  { symbol:'POWERGRID.NS',    name:'Power Grid Corp.',            sector:'Energy' },
  { symbol:'TATAPOWER.NS',    name:'Tata Power',                  sector:'Energy' },
  { symbol:'COALINDIA.NS',    name:'Coal India Ltd.',             sector:'Energy' },
  { symbol:'IOC.NS',          name:'Indian Oil Corp.',            sector:'Energy' },
  { symbol:'BPCL.NS',         name:'Bharat Petroleum',           sector:'Energy' },
  { symbol:'GAIL.NS',         name:'GAIL India',                  sector:'Energy' },
  { symbol:'TORNTPOWER.NS',   name:'Torrent Power',               sector:'Energy' },
  { symbol:'BHARTIARTL.NS',   name:'Bharti Airtel',               sector:'Telecom' },
  { symbol:'INDUSTOWER.NS',   name:'Indus Towers',                sector:'Telecom' },
  { symbol:'SUNTV.NS',        name:'Sun TV Network',              sector:'Telecom' },
  { symbol:'TATASTEEL.NS',    name:'Tata Steel',                  sector:'Metals' },
  { symbol:'JSWSTEEL.NS',     name:'JSW Steel',                   sector:'Metals' },
  { symbol:'HINDALCO.NS',     name:'Hindalco Industries',         sector:'Metals' },
  { symbol:'VEDL.NS',         name:'Vedanta Ltd.',                sector:'Metals' },
  { symbol:'SAIL.NS',         name:'Steel Authority of India',    sector:'Metals' },
  { symbol:'NMDC.NS',         name:'NMDC Ltd.',                   sector:'Metals' },
  { symbol:'NATIONALUM.NS',   name:'National Aluminium Co.',      sector:'Metals' },
  { symbol:'ULTRACEMCO.NS',   name:'UltraTech Cement',            sector:'Cement' },
  { symbol:'SHREECEM.NS',     name:'Shree Cement',                sector:'Cement' },
  { symbol:'AMBUJACEM.NS',    name:'Ambuja Cements',              sector:'Cement' },
  { symbol:'ACC.NS',          name:'ACC Ltd.',                    sector:'Cement' },
  { symbol:'DALMIACEME.NS',   name:'Dalmia Bharat',               sector:'Cement' },
  { symbol:'DMART.NS',        name:'Avenue Supermarts DMart',     sector:'Retail' },
  { symbol:'NYKAA.NS',        name:'FSN E-Commerce Nykaa',        sector:'Retail' },
  { symbol:'ZOMATO.NS',       name:'Zomato Ltd.',                 sector:'Retail' },
  { symbol:'PAYTM.NS',        name:'One97 Communications Paytm',  sector:'Retail' },
  { symbol:'POLICYBZR.NS',    name:'PB Fintech PolicyBazaar',     sector:'Retail' },
  { symbol:'PIDILITIND.NS',   name:'Pidilite Industries',         sector:'Chemicals' },
  { symbol:'SRF.NS',          name:'SRF Ltd.',                    sector:'Chemicals' },
  { symbol:'AARTIIND.NS',     name:'Aarti Industries',            sector:'Chemicals' },
  { symbol:'DEEPAKNTR.NS',    name:'Deepak Nitrite',              sector:'Chemicals' },
  { symbol:'NAVINFLUOR.NS',   name:'Navin Fluorine',              sector:'Chemicals' },
];

// Active universe â€” toggled by market selector
let activeMarket = 'US';
let UNIVERSE = UNIVERSE_US;

const SECTOR_ICONS = {
  'Technology':'💻','AI & Cloud':'🤖','Consumer':'🛒','Finance':'💳',
  'Media':'🎬','Healthcare':'💊','Energy':'⚡','Defensive':'🛡️',
  'Industrial':'⚙️','Real Estate':'🏢',
  'IT':'💻','Banking':'🏦','Conglomerate':'🏢','FMCG':'🧴',
  'Auto':'🚗','Pharma':'💊','Telecom':'📡','Metals':'🔩',
  'Cement':'🏗️','Retail':'🛍️','Chemicals':'🧪',
};

// â”€â”€â”€ Scoring engine â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function scoreStock(d) {
  if (!d || !d.price) return null;
  let score = 50;
  const signals = [];
  const isIndian = d.symbol && d.symbol.endsWith('.NS');
  // Indian stocks trade in â‚¹ â€” volume thresholds are different (lower float)
  const volHigh  = isIndian ? 5e6  : 80e6;
  const volMid   = isIndian ? 2e6  : 40e6;
  const volLow1  = isIndian ? 0.5e6: 15e6;
  const volSell  = isIndian ? 5e6  : 80e6;
  const volSell2 = isIndian ? 2e6  : 40e6;
  const volDead  = isIndian ? 0.1e6: 3e6;
  // Price sanity: Indian blue-chips are â‚¹100â€“â‚¹5000+, penny = <â‚¹10
  const pennyThreshold = isIndian ? 10  : 5;
  const goodThreshold  = isIndian ? 100 : 20;

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
  if      (vol > volHigh  && pct > 0) { score += 25; signals.push({ text: 'Massive buying volume',    bull: true  }); }
  else if (vol > volMid   && pct > 0) { score += 18; signals.push({ text: 'High volume breakout',     bull: true  }); }
  else if (vol > volLow1  && pct > 0) { score += 10; signals.push({ text: 'Above-average volume',     bull: true  }); }
  else if (vol > volSell  && pct < 0) { score -= 20; signals.push({ text: 'Heavy distribution',       bull: false }); }
  else if (vol > volSell2 && pct < 0) { score -= 12; signals.push({ text: 'Elevated selling volume',  bull: false }); }
  else if (vol < volDead)              { score -= 5;  signals.push({ text: 'Low liquidity',            bull: false }); }

  // 3. Day range position (20 pts) â€” near high = bullish
  if (d.dayHigh && d.dayLow && d.dayHigh > d.dayLow) {
    const pos = (d.price - d.dayLow) / (d.dayHigh - d.dayLow);
    if      (pos >= 0.85) { score += 20; signals.push({ text: 'Trading near day high',   bull: true  }); }
    else if (pos >= 0.6)  { score += 10; signals.push({ text: 'Upper range strength',    bull: true  }); }
    else if (pos <= 0.15) { score -= 15; signals.push({ text: 'Near day low â€” weak',     bull: false }); }
    else if (pos <= 0.4)  { score -= 5;  signals.push({ text: 'Lower half of range',     bull: false }); }
  }

  // 4. Price sanity (5 pts)
  if (d.price >= goodThreshold)  score += 5;
  if (d.price < pennyThreshold)  score -= 15;

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
  if (score >= 80) return { label: 'Strong Buy', color: '#26c281', bg: 'rgba(38,194,129,0.12)', stars: 'â˜…â˜…â˜…â˜…â˜…' };
  if (score >= 65) return { label: 'Buy',         color: '#52d68a', bg: 'rgba(82,214,138,0.12)', stars: 'â˜…â˜…â˜…â˜…â˜†' };
  if (score >= 50) return { label: 'Hold',        color: '#f39c12', bg: 'rgba(243,156,18,0.12)', stars: 'â˜…â˜…â˜…â˜†â˜†' };
  if (score >= 35) return { label: 'Weak',        color: '#e67e22', bg: 'rgba(230,126,34,0.12)', stars: 'â˜…â˜…â˜†â˜†â˜†' };
  return                   { label: 'Avoid',      color: '#e74c3c', bg: 'rgba(231,76,60,0.12)',  stars: 'â˜…â˜†â˜†â˜†â˜†' };
}

// â”€â”€â”€ Watchlist Best Pick panel (compact, inside sidebar) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
    const arrow  = top.changePct >= 0 ? 'â–²' : 'â–¼';
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
          `<span class="bp-tag">âœ“ ${s.text}</span>`).join('')}
      </div>
      <div class="bp-ranking">
        ${scored.slice(0, 5).map((s, i) => {
          const r = getRating(s.score);
          const a = s.changePct >= 0 ? 'â–²' : 'â–¼';
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
        ? '<p class="bp-disclaimer">âš  Demo data â€” not real market data</p>'
        : '<p class="bp-disclaimer">â„¹ Informational only. Not financial advice.</p>'}
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

// â”€â”€â”€ Investment Ideas Panel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const InvestmentIdeas = (() => {
  let ideaData   = {};   // fetched quotes for universe stocks
  let isLoading  = false;
  let lastFetch  = 0;
  const CACHE_MS = 30000;

  async function fetchUniverseQuotes() {
    if (isLoading) return;
    if (Date.now() - lastFetch < CACHE_MS && Object.keys(ideaData).length > 0) {
      renderPanel(); return;
    }
    isLoading = true;
    ideaData  = {};   // clear on market switch
    showLoading();

    const batches = [];
    for (let i = 0; i < UNIVERSE.length; i += 8) batches.push(UNIVERSE.slice(i, i + 8));

    for (const batch of batches) {
      await Promise.allSettled(batch.map(async ({ symbol, name, sector }) => {
        try {
          const apiBase = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
            ? 'https://stockpulse-monitor.netlify.app/.netlify/functions'
            : '/.netlify/functions';
          const res = await fetch(`${apiBase}/quote?symbols=${encodeURIComponent(symbol)}`, { signal: AbortSignal.timeout(8000) });
          if (!res.ok) throw new Error('bad');
          const data = await res.json();
          const q = data[symbol];
          if (!q || q.error) throw new Error(q?.error || 'no data');
          ideaData[symbol] = { ...q, sector, isMock: false };
        } catch {
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
        <p>Scanning ${UNIVERSE.length} stocks across 8 sectorsâ€¦</p>
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
      body.innerHTML = '<p class="empty-state">No data available yet. Try again in a moment.</p>';
      return;
    }

    const topPicks = scored.filter(s => s.score >= 60).slice(0, 3);
    const bySector = {};
    scored.forEach(s => {
      if (!bySector[s.sector] || s.score > bySector[s.sector].score) bySector[s.sector] = s;
    });
    const hasMock = scored.some(s => s.isMock);
    const isIN    = activeMarket === 'IN';
    const curr    = isIN ? 'â‚¹' : '$';
    const flag    = isIN ? 'ðŸ‡®ðŸ‡³' : 'ðŸ‡ºðŸ‡¸';
    const mktLabel= isIN ? 'NSE India' : 'US Markets';

    body.innerHTML = `
      <!-- Market toggle -->
      <div class="ideas-market-toggle">
        <button class="mkt-btn ${activeMarket==='US'?'active':''}" data-mkt="US">ðŸ‡ºðŸ‡¸ US Markets</button>
        <button class="mkt-btn ${activeMarket==='IN'?'active':''}" data-mkt="IN">ðŸ‡®ðŸ‡³ India (NSE)</button>
      </div>

      ${hasMock ? `<div class="ideas-mock-warn">âš  Some data is simulated (DEMO). Live data loads when market is open.</div>` : ''}

      <div class="ideas-section-title">ðŸ”¥ Top Picks â€” ${flag} ${mktLabel}</div>
      <div class="ideas-top-grid">
        ${topPicks.length > 0
          ? topPicks.map(s => ideaCard(s, true, curr)).join('')
          : '<p class="ideas-empty">No strong buys right now â€” market may be closed or down.</p>'}
      </div>

      <div class="ideas-section-title" style="margin-top:1rem">ðŸ“Š Best Pick Per Sector</div>
      <div class="ideas-sector-grid">
        ${Object.entries(bySector).map(([sector, s]) => sectorCard(sector, s, curr)).join('')}
      </div>

      <div class="ideas-section-title" style="margin-top:1rem">
        ðŸ“‹ All ${scored.length} Stocks Ranked
        <span class="ideas-filter-btns" id="ideasFilterBtns">
          <button class="ideas-filter active" data-filter="all">All</button>
          <button class="ideas-filter" data-filter="buy">Buy+</button>
          <button class="ideas-filter" data-filter="sector">By Sector</button>
        </span>
      </div>
      <div class="ideas-full-list" id="ideasFullList">
        ${fullList(scored, 'all', curr)}
      </div>

      <p class="ideas-disclaimer">
        âš  Analysis based on intraday price signals only. Not financial advice.
        Always do your own research before investing.
      </p>
    `;

    // Market toggle
    body.querySelectorAll('.mkt-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const mkt = btn.dataset.mkt;
        if (mkt === activeMarket) return;
        activeMarket = mkt;
        UNIVERSE     = mkt === 'IN' ? UNIVERSE_IN : UNIVERSE_US;
        lastFetch    = 0;
        ideaData     = {};
        fetchUniverseQuotes();
      });
    });

    // Filter buttons
    body.querySelectorAll('.ideas-filter').forEach(btn => {
      btn.addEventListener('click', () => {
        body.querySelectorAll('.ideas-filter').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('ideasFullList').innerHTML = fullList(scored, btn.dataset.filter, curr);
        attachCardClicks(body);
      });
    });

    attachCardClicks(body);
  }

  function ideaCard(s, showTarget, curr = '$') {
    const r     = getRating(s.score);
    const arrow = s.changePct >= 0 ? 'â–²' : 'â–¼';
    const cls   = s.changePct >= 0 ? 'up' : 'down';
    const bullSignals = s.signals.filter(sig => sig.bull === true).slice(0, 2);
    const displaySym  = s.symbol.replace('.NS','').replace('.BO','');
    return `
      <div class="idea-card" data-symbol="${s.symbol}">
        <div class="idea-card-top">
          <div>
            <span class="idea-sym">${displaySym}</span>
            <span class="idea-sector-tag">${SECTOR_ICONS[s.sector] || ''} ${s.sector}</span>
          </div>
          <span class="idea-rating-badge" style="background:${r.bg};color:${r.color}">${r.label}</span>
        </div>
        <div class="idea-card-mid">
          <span class="idea-price">${curr}${s.price.toFixed(2)}</span>
          <span class="idea-chg ${cls}">${arrow} ${Math.abs(s.changePct).toFixed(2)}%</span>
        </div>
        <div class="idea-score-row">
          <div class="idea-score-bar-wrap">
            <div class="idea-score-bar" style="width:${s.score}%;background:${r.color}"></div>
          </div>
          <span class="idea-score-num" style="color:${r.color}">${s.score}/100</span>
        </div>
        ${bullSignals.length ? `<div class="idea-signals">
          ${bullSignals.map(sig => `<span class="idea-sig-tag">âœ“ ${sig.text}</span>`).join('')}
        </div>` : ''}
        ${showTarget && s.upsidePct > 0 ? `
          <div class="idea-target">
            ðŸŽ¯ Target: <strong>${curr}${s.targetPrice.toFixed(2)}</strong>
            <span class="up">+${s.upsidePct}% upside</span>
          </div>` : ''}
        <div class="idea-card-actions">
          <button class="idea-btn-view" data-symbol="${s.symbol}">View Chart</button>
          <button class="idea-btn-add"  data-symbol="${s.symbol}">+ Watchlist</button>
        </div>
      </div>`;
  }

  function sectorCard(sector, s, curr = '$') {
    const r   = getRating(s.score);
    const cls = s.changePct >= 0 ? 'up' : 'down';
    const arrow = s.changePct >= 0 ? 'â–²' : 'â–¼';
    const displaySym = s.symbol.replace('.NS','').replace('.BO','');
    return `
      <div class="sector-card" data-symbol="${s.symbol}">
        <div class="sector-card-header">
          <span class="sector-icon">${SECTOR_ICONS[sector] || 'ðŸ“ˆ'}</span>
          <span class="sector-name">${sector}</span>
        </div>
        <div class="sector-sym">${displaySym}</div>
        <div class="sector-price">${curr}${s.price.toFixed(2)} <span class="${cls}">${arrow}${Math.abs(s.changePct).toFixed(2)}%</span></div>
        <span class="sector-rating" style="color:${r.color}">${r.label} Â· ${s.score}/100</span>
      </div>`;
  }

  function fullList(scored, filter, curr = '$') {
    let list = scored;
    if (filter === 'buy') list = scored.filter(s => s.score >= 65);
    if (filter === 'sector') {
      const groups = {};
      scored.forEach(s => { (groups[s.sector] = groups[s.sector] || []).push(s); });
      return Object.entries(groups).map(([sector, stocks]) => `
        <div class="ideas-sector-header">${SECTOR_ICONS[sector] || ''} ${sector}</div>
        ${stocks.map(s => listRow(s, curr)).join('')}
      `).join('');
    }
    return list.map(s => listRow(s, curr)).join('');
  }

  function listRow(s, curr = '$') {
    const r   = getRating(s.score);
    const cls = s.changePct >= 0 ? 'up' : 'down';
    const arrow = s.changePct >= 0 ? 'â–²' : 'â–¼';
    const vol = s.volume >= 1e9 ? (s.volume/1e9).toFixed(1)+'B'
              : s.volume >= 1e6 ? (s.volume/1e6).toFixed(1)+'M'
              : s.volume >= 1e3 ? (s.volume/1e3).toFixed(0)+'K' : String(s.volume);
    const displaySym = s.symbol.replace('.NS','').replace('.BO','');
    return `
      <div class="ideas-row" data-symbol="${s.symbol}">
        <span class="ir-sym">${displaySym}</span>
        <span class="ir-name">${s.name}</span>
        <span class="ir-price">${curr}${s.price.toFixed(2)}</span>
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


