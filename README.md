# 📈 StockPulse — Real-Time Stock Monitor

A fully responsive, real-time stock monitoring and alert system built with vanilla JavaScript, Chart.js, and Yahoo Finance data.

🔗 **Live Demo:** https://stockpulse-monitor.netlify.app

## Features

- Live stock prices refreshed every 5 seconds
- Watchlist with up to 50 symbols
- Line, Bar, and Candlestick charts (1D / 5D / 1M / 3M ranges)
- Price alerts with above/below thresholds and toast notifications
- Real-time search — add any ticker symbol
- Dark / Light mode toggle
- Fully responsive (desktop, tablet, mobile)
- Security hardened: CSP, SRI hashes, X-Frame-Options, HSTS

## Stack

- Vanilla JS (no framework)
- Chart.js 4.4.9
- Yahoo Finance via CORS proxy
- Netlify (hosting + security headers)

## Run Locally

```bash
npx serve . -p 3000
```

Then open http://localhost:3000
