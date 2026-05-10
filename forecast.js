// ===== Forecast Page =====
const ForecastPanel = (() => {
  let forecastChart = null;

  function getApiBase() {
    return (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
      ? 'https://stockpulse-live-2026.netlify.app/.netlify/functions'
      : '/.netlify/functions';
  }

  async function run(symbol, fcRange) {
    symbol = (symbol || '').trim().toUpperCase();
    if (!symbol) return;
    const content = document.getElementById('forecastPageContent');
    if (!content) return;
    if (forecastChart) { forecastChart.destroy(); forecastChart = null; }
    content.innerHTML = '<div class="fc-page-empty"><div class="ideas-spinner"></div><p>Fetching data for <strong>' + symbol + '</strong>...</p></div>';
    try {
      const res = await fetch(getApiBase() + '/forecast?symbol=' + encodeURIComponent(symbol), { signal: AbortSignal.timeout(20000) });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      render(data, fcRange || '1y');
    } catch (err) {
      content.innerHTML = '<div class="fc-page-empty"><span>⚠️</span><p>' + (err.message || 'Failed to load forecast') + '</p><p style="font-size:.78rem;color:#94a3b8">Try a valid ticker like AAPL, TCS.NS, TSLA</p></div>';
    }
  }

  function render(d, fcRange) {
    const content = document.getElementById('forecastPageContent');
    if (!content) return;
    const isIN = d.currency === 'INR';
    const curr = isIN ? '₹' : '$';
    const v = d.investmentVerdict;
    const proj1Y = d.projections && d.projections[0];
    const proj5Y = d.projections && d.projections[4];
    const projTarget = (fcRange === '5y') ? proj5Y : proj1Y;
    const targetRet = projTarget ? projTarget.baseRet : 0;
    const targetPrice = projTarget ? projTarget.base : d.currentPrice;
    const outlookLabel = d.outlook || 'Neutral';
    const outlookIsUp = outlookLabel.includes('Bull');
    const ratingLabel = v ? v.verdict : 'Hold';
    const confidence = v ? v.verdictScore : 50;
    const exchange = isIN ? 'NSE · India' : 'NASDAQ · Technology';
    const displaySym = d.symbol.replace('.NS','').replace('.BO','');
    const ratingColor = confidence >= 65 ? '#22c55e' : confidence >= 45 ? '#f59e0b' : '#ef4444';

    // Bull/Bear points from insights
    const insights = d.insights || [];
    const bull = insights.filter(i => ['🚀','��','🛡️','🏆','✅','🎯'].includes(i.icon)).map(i => i.text).slice(0,4);
    const bear = insights.filter(i => ['⚠️','❌','📉','💥'].includes(i.icon)).map(i => i.text).slice(0,3);
    if (bull.length === 0) { bull.push('Positive historical trend supports continued growth'); bull.push('Strong market position in its sector'); bull.push('Potential for revenue expansion in emerging markets'); }
    if (bear.length === 0) { bear.push('Market competition could pressure margins'); bear.push('Macroeconomic headwinds may impact growth'); bear.push('Regulatory changes could affect business model'); }

    function bbPoint(text, num, type) {
      const parts = text.split(' — ');
      const title = parts[0];
      const desc = parts.slice(1).join(' — ');
      return '<div class="fc-bb-point"><div class="fc-bb-num">' + num + '</div><div class="fc-bb-content"><div class="fc-bb-title">' + title + '</div>' + (desc ? '<div class="fc-bb-desc">' + desc + '</div>' : '') + '</div></div>';
    }

    const verdictHtml = v ? (
      '<div class="fc-verdict" style="background:' + (v.verdictBg||'rgba(59,130,246,.08)') + ';border:2px solid ' + (v.verdictColor||'#3b82f6') + '44;border-radius:12px;padding:16px;margin-bottom:20px">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">' +
      '<div style="display:flex;align-items:center;gap:10px">' +
      '<span style="font-size:2rem">' + (v.verdictScore >= 65 ? '🟢' : v.verdictScore >= 45 ? '🟡' : '🔴') + '</span>' +
      '<div><div style="font-size:.7rem;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:.05em">Investment Verdict</div>' +
      '<div style="font-size:1.4rem;font-weight:900;color:' + (v.verdictColor||'#3b82f6') + '">' + ratingLabel + '</div></div></div>' +
      '<div style="text-align:center"><div style="font-size:1.8rem;font-weight:800;color:' + (v.verdictColor||'#3b82f6') + '">' + confidence + '</div><div style="font-size:.7rem;color:#64748b">/ 100</div></div></div>' +
      '<p style="font-size:.82rem;color:#1e293b;line-height:1.6;margin-bottom:10px;padding:8px 12px;background:rgba(0,0,0,.04);border-radius:8px">' + (v.verdictSummary||'') + '</p>' +
      '<div style="display:flex;flex-direction:column;gap:4px;margin-bottom:10px">' +
      (v.verdictFactors||[]).map(f => '<div style="display:flex;align-items:center;gap:8px;font-size:.78rem"><span style="width:8px;height:8px;border-radius:50%;background:' + (f.positive===true?'#22c55e':f.positive===false?'#ef4444':'#f59e0b') + ';flex-shrink:0;display:inline-block"></span>' + f.text + '</div>').join('') +
      '</div>' +
      '<div style="border-top:1px solid #e2e8f0;padding-top:8px;display:flex;flex-direction:column;gap:6px">' +
      '<div><div style="font-size:.68rem;font-weight:700;color:#94a3b8;text-transform:uppercase">⏰ Best Time to Invest</div><div style="font-size:.78rem;color:#1e293b">' + (v.bestTimeToInvest||'') + '</div></div>' +
      '<div><div style="font-size:.68rem;font-weight:700;color:#94a3b8;text-transform:uppercase">📋 Suggested Strategy</div><div style="font-size:.78rem;color:#3b82f6">' + (v.suggestedStrategy||'') + '</div></div>' +
      '</div></div>'
    ) : '';

    content.innerHTML =
      verdictHtml +
      '<div class="fc-stock-bar"><span class="fc-market-tag">' + (isIN?'🇮🇳 IN':'🇺🇸 US') + '</span><span class="fc-sym-name">' + displaySym + ' ' + d.name + '</span><span class="fc-exchange">' + exchange + '</span><span class="fc-52w">History: ' + d.histYears + 'Y · CAGR: ' + (d.histCAGR>=0?'+':'') + d.histCAGR + '%</span></div>' +

      '<div class="fc-metric-cards">' +
      '<div class="fc-metric-card"><div class="fc-metric-label">Current Price</div><div class="fc-metric-value">' + curr + d.currentPrice.toFixed(2) + '</div><div class="fc-metric-sub ' + (d.annualReturn>=0?'up':'down') + '">' + (d.annualReturn>=0?'↑':'↓') + ' ' + Math.abs(d.annualReturn).toFixed(1) + '% annual avg</div></div>' +
      '<div class="fc-metric-card"><div class="fc-metric-label">' + (fcRange==='5y'?'5Y':'1Y') + ' Target</div><div class="fc-metric-value">' + curr + targetPrice.toFixed(2) + '</div><div class="fc-metric-sub ' + (targetRet>=0?'up':'down') + '">' + (targetRet>=0?'+':'') + targetRet.toFixed(1) + '% projected</div></div>' +
      '<div class="fc-metric-card outlook-card"><div class="fc-metric-label">Outlook</div><div class="fc-metric-value">' + (outlookIsUp?'↑':'↓') + ' ' + outlookLabel + '</div><div class="fc-metric-sub">' + curr + Math.abs(targetPrice-d.currentPrice).toFixed(2) + ' expected</div></div>' +
      '<div class="fc-metric-card rating-card"><div class="fc-metric-label">Analyst Rating</div><div class="fc-rating-row"><div class="fc-rating-dot" style="background:' + ratingColor + '"></div><div class="fc-rating-label">' + ratingLabel + '</div></div><div class="fc-confidence-bar-wrap"><div class="fc-confidence-bar" style="width:' + confidence + '%"></div></div><div class="fc-confidence-text">Confidence: ' + confidence + '/100</div></div>' +
      '</div>' +

      '<div class="fc-chart-card"><div class="fc-chart-title">' + displaySym + ' — ' + (fcRange==='5y'?'5-Year':'1-Year') + ' Price Projection</div>' +
      '<div class="fc-chart-legend"><div class="fc-legend-item"><div class="fc-legend-line historical"></div><span>Historical</span></div><div class="fc-legend-item"><div class="fc-legend-line forecast"></div><span>Forecast</span></div><div class="fc-legend-item"><div class="fc-legend-band"></div><span>Confidence Band</span></div></div>' +
      '<div class="fc-chart-wrap"><canvas id="fcProjectionChart"></canvas></div></div>' +

      '<div class="fc-bull-bear">' +
      '<div class="fc-bull-card"><div class="fc-bb-header">↑ Bull Case — Why It Could Rise</div><div class="fc-bb-points">' + bull.map((t,i) => bbPoint(t,i+1,'bull')).join('') + '</div></div>' +
      '<div class="fc-bear-card"><div class="fc-bb-header">↓ Bear Case — Why It Could Fall</div><div class="fc-bb-points">' + bear.map((t,i) => bbPoint(t,i+1,'bear')).join('') + '</div></div>' +
      '</div>' +

      '<div class="fc-disclaimer-bar"><strong>Disclaimer:</strong> Forecasts use trend-based statistical models for informational purposes only. Past performance does not guarantee future results. <strong>Not financial advice.</strong></div>';

    drawChart(d, fcRange, curr);
  }

  function drawChart(d, fcRange, curr) {
    const canvas = document.getElementById('fcProjectionChart');
    if (!canvas) return;
    if (forecastChart) { forecastChart.destroy(); forecastChart = null; }
    const ctx = canvas.getContext('2d');
    const historical = d.monthlyClosesLast24 || [];
    const current = d.currentPrice;
    const numYears = fcRange === '5y' ? 5 : 1;
    const baseAnnual = (d.scenarios && d.scenarios.base) || 8;
    const bullAnnual = (d.scenarios && d.scenarios.bull) || 15;
    const bearAnnual = (d.scenarios && d.scenarios.bear) || -5;
    const forecastMonths = numYears * 12;

    const histLabels = historical.map(function(_, i) {
      const dt = new Date(); dt.setMonth(dt.getMonth() - (historical.length - i));
      return dt.toLocaleDateString([], {month:'short',year:'2-digit'});
    });
    const fcLabels = Array.from({length: forecastMonths + 1}, function(_, i) {
      const dt = new Date(); dt.setMonth(dt.getMonth() + i);
      return dt.toLocaleDateString([], {month:'short',year:'2-digit'});
    });

    const allLabels = histLabels.concat(fcLabels.slice(1));
    const histFull = historical.concat(Array(fcLabels.length - 1).fill(null));
    const fcBase = Array.from({length: forecastMonths + 1}, function(_, i) { return current * Math.pow(1 + baseAnnual/100, i/12); });
    const fcBull = Array.from({length: forecastMonths + 1}, function(_, i) { return current * Math.pow(1 + bullAnnual/100, i/12); });
    const fcBear = Array.from({length: forecastMonths + 1}, function(_, i) { return current * Math.pow(1 + bearAnnual/100, i/12); });
    const fcBaseFull = Array(historical.length).fill(null).concat(fcBase);
    const fcBullFull = Array(historical.length).fill(null).concat(fcBull);
    const fcBearFull = Array(historical.length).fill(null).concat(fcBear);

    const gradient = ctx.createLinearGradient(0, 0, 0, 280);
    gradient.addColorStop(0, 'rgba(139,92,246,0.15)');
    gradient.addColorStop(1, 'rgba(139,92,246,0)');

    forecastChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: allLabels,
        datasets: [
          {label:'Historical', data:histFull, borderColor:'#3b82f6', borderWidth:2, pointRadius:0, fill:false, tension:0.3, spanGaps:false},
          {label:'Forecast', data:fcBaseFull, borderColor:'#8b5cf6', borderWidth:2, borderDash:[6,3], pointRadius:0, fill:false, tension:0.3, spanGaps:false},
          {label:'Bull', data:fcBullFull, borderColor:'rgba(139,92,246,0.3)', borderWidth:1, borderDash:[3,3], pointRadius:0, fill:'+1', backgroundColor:gradient, tension:0.3, spanGaps:false},
          {label:'Bear', data:fcBearFull, borderColor:'rgba(139,92,246,0.3)', borderWidth:1, borderDash:[3,3], pointRadius:0, fill:false, tension:0.3, spanGaps:false}
        ]
      },
      options: {
        responsive:true, maintainAspectRatio:false, animation:{duration:400},
        interaction:{mode:'index',intersect:false},
        plugins:{
          legend:{display:false},
          tooltip:{backgroundColor:'#fff',titleColor:'#1e293b',bodyColor:'#64748b',borderColor:'#e2e8f0',borderWidth:1,padding:10,
            callbacks:{label:function(item){return ' '+item.dataset.label+': '+curr+(item.raw?item.raw.toFixed(2):'');}}
          }
        },
        scales:{
          x:{ticks:{color:'#94a3b8',maxTicksLimit:10,maxRotation:0},grid:{color:'rgba(0,0,0,0.04)'}},
          y:{position:'right',ticks:{color:'#94a3b8',callback:function(v){return curr+v.toFixed(0);}},grid:{color:'rgba(0,0,0,0.04)'}}
        }
      }
    });
  }

  function open() {}
  function close() {}
  function init() {}

  return { init, run, open, close };
})();

const ForecastPage = ForecastPanel;
