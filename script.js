async function getPriceData(limit = 100) {
  const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1m&limit=${limit}`);
  const data = await response.json();
  return data.map(d => ({
    time: d[0],
    close: parseFloat(d[4])
  }));
}

async function getCurrentPrice() {
  const res = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT");
  const data = await res.json();
  return parseFloat(data.price);
}

function calculateEMA(data, period = 14) {
  return technicalindicators.EMA.calculate({
    period,
    values: data
  });
}

function calculateRSI(data, period = 14) {
  return technicalindicators.RSI.calculate({
    period,
    values: data
  });
}

async function predictPrice() {
  const targetPrice = parseFloat(document.getElementById("target-price").value);
  const targetTimeStr = document.getElementById("target-time").value;
  const targetTime = new Date(targetTimeStr.split('.').reverse().join('-'));

  const priceData = await getPriceData();
  const closes = priceData.map(p => p.close);
  const ema = calculateEMA(closes).slice(-1)[0];
  const rsi = calculateRSI(closes).slice(-1)[0];
  const currentPrice = await getCurrentPrice();

  // Basic logic
  let prediction = currentPrice > targetPrice ? "Yes" : "No";
  let confidence = 60;
  if (currentPrice > ema && rsi > 50) confidence = 75;
  else if (currentPrice < ema && rsi < 50) confidence = 65;

  const resultDiv = document.getElementById("prediction-result");
  resultDiv.innerHTML = `
    <div>📌 <b>Prediction:</b> Will price be <b>ABOVE</b> ${targetPrice} at <b>${targetTimeStr}</b>? — <b>${prediction}</b></div>
    <div>🔍 <b>Confidence:</b> ${confidence}%</div>
    <div>✅ <b>Current Price:</b> <span id="current-price">${currentPrice.toFixed(2)}</span></div>
    <div>📉 <b>EMA(14):</b> ${ema.toFixed(2)} | <b>RSI(14):</b> ${rsi.toFixed(2)}</div>
  `;
}

// ⏱️ Auto-refresh current price every 10 seconds
setInterval(async () => {
  const price = await getCurrentPrice();
  const el = document.getElementById("current-price");
  if (el) el.innerText = price.toFixed(2);
}, 10000);
