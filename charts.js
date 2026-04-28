// ===== Chart Manager =====
const ChartManager = (() => {
  let chart = null;
  let currentType = 'line';

  function destroy() {
    if (chart) { chart.destroy(); chart = null; }
  }

  function yAxisBounds(data) {
    // Tight Y-axis: pad 2% above/below the high/low range so candles fill the chart
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
      // Volume bar chart — Y-axis shows volume, not price
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
      const upBorder = '#26c281';
      const downBorder = '#e74c3c';

      const colors = data.map(d => d.close >= d.open ? upColor : downColor);
      const borders = data.map(d => d.close >= d.open ? upBorder : downBorder);

      const opts = baseOptions(data, tv);

      chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              // Wick: full high-low range, very thin
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
              // Body: open-close range, wider
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
                title: (items) => labels[items[0].dataIndex],
                label: (item) => {
                  const d = data[item.dataIndex];
                  if (!d) return '';
                  return [
                    `O: $${d.open.toFixed(2)}`,
                    `H: $${d.high.toFixed(2)}`,
                    `L: $${d.low.toFixed(2)}`,
                    `C: $${d.close.toFixed(2)}`,
                  ];
                },
                // Only show tooltip once (not twice for 2 datasets)
                filter: (item) => item.datasetIndex === 1,
              },
            },
          },
        },
      });
    }
  }

  function setType(type) { currentType = type; }
  function getType() { return currentType; }

  return { render, destroy, setType, getType };
})();
