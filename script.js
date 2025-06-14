async function fetchBTCData() {
  const res = await fetch("https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1m&limit=100");
  const rawData = await res.json();
  return rawData.map(d => ({
    time: d[0],
    close: parseFloat(d[4]),
    high: parseFloat(d[2]),
    low: parseFloat(d[3]),
  }));
}

function calculateEMA(prices, period = 14) {
  const k = 2 / (period + 1);
  const emaArray = [prices[0]];
  for (let i = 1; i < prices.length; i++) {
    emaArray.push(prices[i] * k + emaArray[i - 1] * (1 - k));
  }
  return emaArray;
}

function calculateRSI(prices, period = 14) {
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) gains += change;
    else losses -= change;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period || 1;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

function predictTrend(prices, ema, rsi, currentPrice, targetPrice) {
  const emaNow = ema[ema.length - 1];
  const recentChange = (prices[prices.length - 1] - prices[prices.length - 6]) / prices[prices.length - 6];

  // Confidence-based rule logic
  let score = 0;

  if (emaNow > currentPrice) score += 1;
  if (rsi < 50) score += 1;
  if (recentChange > 0) score += 1;
  if (recentChange > 0.002) score += 1;

  if (targetPrice > currentPrice) {
    return score >= 2 ? "Yes" : "No";
  } else {
    return score <= 1 ? "Yes" : "No";
  }
}

async function predict() {
  const targetPrice = parseFloat(document.getElementById("targetPrice").value);
  const targetTime = document.getElementById("targetTime").value;

  if (!targetPrice || !targetTime) {
    alert("Please enter both Target Price and Target Time");
    return;
  }

  const data = await fetchBTCData();
  const prices = data.map(d => d.close);
  const currentPrice = prices[prices.length - 1];
  const ema = calculateEMA(prices, 14);
  const rsi = calculateRSI(prices, 14);

  const prediction = predictTrend(prices, ema, rsi, currentPrice, targetPrice);

  document.getElementById("predictionResult").innerHTML = `
    📌 Prediction: Will price be <b>ABOVE</b> ${targetPrice} at <b>${targetTime}</b>? — <b>${prediction}</b><br/><br/>
    Current Price: ${currentPrice.toFixed(2)} | RSI: ${rsi.toFixed(2)} | EMA: ${ema[ema.length - 1].toFixed(2)}
  `;
}
