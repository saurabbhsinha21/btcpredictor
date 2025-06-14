async function getPriceData(limit = 100) {
  const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1m&limit=${limit}`);
  const data = await response.json();
  return data.map(d => ({
    time: d[0],
    close: parseFloat(d[4])
  }));
}

async function getCurrentPrice() {
  try {
    const res = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT");
    const data = await res.json();
    return parseFloat(data.price);
  } catch (err) {
    console.error("Error fetching current price:", err);
    return null;
  }
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

function showError(message) {
  const resultDiv = document.getElementById("prediction-result");
  resultDiv.innerHTML = `<div style="color:red"><b>Error:</b> ${message}</div>`;
}

async function predictPrice() {
  const resultDiv = document.getElementById("prediction-result");
  resultDiv.innerHTML = "⏳ Please wait...";

  try {
    const targetPriceInput = document.getElementById("target-price").value;
    const targetTimeInput = document.getElementById("target-time").value;

    if (!targetPriceInput || !targetTimeInput) {
      showError("Please fill both Target Price and Target Time.");
      return;
    }

    const targetPrice = parseFloat(targetPriceInput);
    const targetTime = new Date(targetTimeInput.split('.').reverse().join('-').replace(' ', 'T'));

    const priceData = await getPriceData();
    const closes = priceData.map(p => p.close);
    const ema = calculateEMA(closes).slice(-1)[0];
    const rsi = calculateRSI(closes).slice(-1)[0];
    const currentPrice = await getCurrentPrice();

    if (!currentPrice || isNaN(currentPrice)) {
      showError("Unable to fetch current price.");
      return;
    }

    let prediction = currentPrice > targetPrice ? "Yes" : "No";
    let confidence = 60;

    if (currentPrice > ema && rsi > 50) confidence = 75;
    else if (currentPrice < ema && rsi < 50) confidence = 65;

    resultDiv.innerHTML = `
      <div>📌 <b>Prediction:</b> Will price be <b>ABOVE</b> ${targetPrice} at <b>${targetTimeInput}</b>? — <b>${prediction}</b></div>
      <div>🔍 <b>Confidence:</b> ${confidence}%</div>
      <div>✅ <b>Current Price:</b> <span id="current-price">${currentPrice.toFixed(2)}</span></div>
      <div>📉 <b>EMA(14):</b> ${ema.toFixed(2)} | <b>RSI(14):</b> ${rsi.toFixed(2)}</div>
    `;
  } catch (err) {
    console.error("Prediction error:", err);
    showError("An unexpected error occurred.");
  }
}

// ⏱️ Auto-refresh current price every 10 seconds
setInterval(async () => {
  const price = await getCurrentPrice();
  const el = document.getElementById("current-price");
  if (el && price) el.innerText = price.toFixed(2);
}, 10000);
