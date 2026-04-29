// ===== Chart Manager =====
const ChartManager = (() => {
  let chart = null;
  let currentType = 'line';

  function destroy() {
    if (chart) { chart.destroy(); chart = null; }
  }

  function yAxisBounds(data) {
    const allVals = data.flatMap(d => [d.high, d.low, d.open, d.close]).filter(v => v > 0);
    const min = Math.min(...allVals);
    const max = Math.max(...allVals);
    const pad = (max - min) * 0.08 || max * 0.02;
    return { min: parseFloat((min - pad).toFixed(2)), max: parseFloat((max + pad).toFixed(2)) };
  }

  function themeVars() {
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    return {
      isDark,
      gridColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
      textColor: isDark ? '#9ea3c0' : '#5a5f7a',
      tooltipBg: isDark ? '#1a1d27' : '#ffffff',
      tooltipTitle: isDark ? '#e8eaf6' : '#1a1d27',
      tooltipBody: isDark ? '#9ea3c0' : '#5a5f7a',
      tooltipBorder: isDark ? '#2e3250' : '#d0d4e8',
    };
  }

  function baseOptions(data, tv, yOverride = {}) {
    const { min, max } = yAxisBounds(data);
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 250 },
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: tv.tooltipBg,
          titleColor: tv.tooltipTitle,
          bodyColor: tv.tooltipBody,
          borderColor: tv.tooltipBorder,
          borderWidth: 1,
          padding: 10,
        },
      },
      scales: {
        x: {
          ticks: { color: tv.textColor, maxTicksLimit: 10, maxRotation: 0 },
          grid: { color: tv.gridColor },
        },
        y: {
          min,
          max,
          position: 'right',
          ticks: { color: tv.textColor, callback: v => '$' + v.toFixed(2) },
          grid: { color: tv.gridColor },
          ...yOverride,
        },
      },
    };
  }

  function render(symbol, data, type = currentType) {
    if (!data || data.length === 0) return;
    currentType = type;
    destroy();

    const canvas = document.getElementById('stockChart');
    const ctx = canvas.getContext('2d');
    document.getElementById('chartPlaceholder').classList.add('hidden');

    const tv = themeVars();
    const labels = data.map(d => d.date);
    const closes = data.map(d => d.close);
    const volumes = data.map(d => d.volume);
    const isUp = closes[closes.length - 1] >= closes[0];
    const mainColor = isUp ? '#26c281' : '#e74c3c';

    if (type === 'line') {
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.offsetHeight || 400);
      gradient.addColorStop(0, isUp ? 'rgba(38,194,129,0.25)' : 'rgba(231,76,60,0.25)');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');

      chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: symbol,
            data: closes,
            borderColor: mainColor,
            backgroundColor: gradient,
            borderWidth: 2,
            pointRadius: data.length > 60 ? 0 : 2,
            pointHoverRadius: 5,
            fill: true,
            tension: 0.3,
          }],
        },
        options: baseOptions(data, tv),
      });

    } else if (type === 'bar') {
      chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Volume',
            data: volumes,
            backgroundColor: closes.map((c, i) =>
              i === 0 ? 'rgba(79,142,247,0.7)' : (c >= closes[i - 1] ? 'rgba(38,194,129,0.75)' : 'rgba(231,76,60,0.75)')
            ),
            borderRadius: 2,
          }],
        },
        options: {
          ...baseOptions(data, tv, {
            min: 0,
            max: undefined,
            ticks: { color: tv.textColor, callback: v => v >= 1e6 ? (v / 1e6).toFixed(1) + 'M' : v >= 1e3 ? (v / 1e3).toFixed(0) + 'K' : v },
          }),
        },
      });

    } else if (type === 'candlestick') {
      const upColor = 'rgba(38,194,129,0.9)';
      const downColor = 'rgba(231,76,60,0.9)';
      const colors = data.map(d => d.close >= d.open ? upColor : downColor);
      const borders = data.map(d => d.close >= d.open ? '#26c281' : '#e74c3c');
      const opts = baseOptions(data, tv);

      chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Wick',
              data: data.map(d => [d.low, d.high]),
              backgroundColor: colors,
              borderColor: borders,
              borderWidth: 0,
              barPercentage: 0.12,
              categoryPercentage: 1.0,
              order: 2,
            },
            {
              label: 'Body',
              data: data.map(d => [
                parseFloat(Math.min(d.open, d.close).toFixed(2)),
                parseFloat(Math.max(d.open, d.close).toFixed(2)),
              ]),
              backgroundColor: colors,
              borderColor: borders,
              borderWidth: 1,
              barPercentage: 0.6,
              categoryPercentage: 0.8,
              order: 1,
            },
          ],
        },
        options: {
          ...opts,
          plugins: {
            ...opts.plugins,
            tooltip: {
              ...opts.plugins.tooltip,
              callbacks: {
                title: items => labels[items[0].dataIndex],
                label: item => {
                  const d = data[item.dataIndex];
                  if (!d) return '';
                  return [`O: $${d.open.toFixed(2)}`, `H: $${d.high.toFixed(2)}`, `L: $${d.low.toFixed(2)}`, `C: $${d.close.toFixed(2)}`];
                },
                filter: item => item.datasetIndex === 1,
              },
            },
          },
        },
      });
    }
  }

  // ===== 10-Year growth chart =====
  function renderGrowth(symbol, data) {
    if (!data || data.length === 0) return;
    destroy();

    const canvas = document.getElementById('stockChart');
    const ctx = canvas.getContext('2d');
    document.getElementById('chartPlaceholder').classList.add('hidden');

    const tv = themeVars();
    const labels = data.map(d => d.date);
    const closes = data.map(d => d.close);
    const startPrice = closes[0];
    const endPrice = closes[closes.length - 1];
    const totalGrowth = ((endPrice - startPrice) / startPrice) * 100;
    const isUp = totalGrowth >= 0;
    const mainColor = isUp ? '#26c281' : '#e74c3c';

    // Convert to % growth from start
    const growthPct = closes.map(c => parseFloat(((c - startPrice) / startPrice * 100).toFixed(2)));

    // Update growth badge
    const badge = document.getElementById('growthBadge');
    if (badge) {
      const years = data.length > 0
        ? Math.round((data.length) / 12 * 10) / 10
        : 10;
      badge.style.display = 'inline-flex';
      badge.className = `growth-badge ${isUp ? 'up' : 'down'}`;
      badge.textContent = `${isUp ? '▲' : '▼'} ${Math.abs(totalGrowth).toFixed(1)}% over ${years}Y`;
    }

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.offsetHeight || 400);
    gradient.addColorStop(0, isUp ? 'rgba(38,194,129,0.3)' : 'rgba(231,76,60,0.3)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');

    // Zero line annotation
    const zeroLinePlugin = {
      id: 'zeroLine',
      afterDraw(chart) {
        const { ctx, scales: { y, x } } = chart;
        if (!y || !x) return;
        const yZero = y.getPixelForValue(0);
        ctx.save();
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 1;
        ctx.setLineDash([6, 4]);
        ctx.moveTo(x.left, yZero);
        ctx.lineTo(x.right, yZero);
        ctx.stroke();
        ctx.restore();
      },
    };

    const allVals = growthPct.filter(v => isFinite(v));
    const minV = Math.min(...allVals);
    const maxV = Math.max(...allVals);
    const pad = (maxV - minV) * 0.1 || 5;

    chart = new Chart(ctx, {
      type: 'line',
      plugins: [zeroLinePlugin],
      data: {
        labels,
        datasets: [{
          label: `${symbol} Growth %`,
          data: growthPct,
          borderColor: mainColor,
          backgroundColor: gradient,
          borderWidth: 2.5,
          pointRadius: 0,
          pointHoverRadius: 5,
          fill: true,
          tension: 0.3,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 400 },
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: tv.tooltipBg,
            titleColor: tv.tooltipTitle,
            bodyColor: tv.tooltipBody,
            borderColor: tv.tooltipBorder,
            borderWidth: 1,
            padding: 10,
            callbacks: {
              label: item => `Growth: ${item.raw >= 0 ? '+' : ''}${item.raw}%  ($${closes[item.dataIndex].toFixed(2)})`,
            },
          },
        },
        scales: {
          x: {
            ticks: { color: tv.textColor, maxTicksLimit: 12, maxRotation: 0 },
            grid: { color: tv.gridColor },
          },
          y: {
            min: parseFloat((minV - pad).toFixed(1)),
            max: parseFloat((maxV + pad).toFixed(1)),
            position: 'right',
            ticks: {
              color: tv.textColor,
              callback: v => (v >= 0 ? '+' : '') + v.toFixed(0) + '%',
            },
            grid: { color: tv.gridColor },
          },
        },
      },
    });
  }

  function setType(type) { currentType = type; }
  function getType() { return currentType; }

  return { render, renderGrowth, destroy, setType, getType };
})();
