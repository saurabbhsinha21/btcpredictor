async function fetchBTCData() {
  const response = await fetch("https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1m&limit=100");
  const data = await response.json();
  return data.map(d => ({
    time: d[0],
    close: parseFloat(d[4]),
    high: parseFloat(d[2]),
    low: parseFloat(d[3]),
  }));
}

function calculateEMA(prices, period = 14) {
  const k = 2 / (period + 1);
  let emaArray = [prices[0]];
  for (let i = 1; i < prices.length; i++) {
    emaArray.push(prices[i] * k + emaArray[i - 1] * (1 - k));
  }
  return emaArray;
}

function calculateRSI(prices, period = 14) {
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    let delta = prices[i] - prices[i - 1];
    if (delta > 0) gains += delta;
    else losses -= delta;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;
  let rs = avgGain / avgLoss;
  let rsi = 100 - 100 / (1 + rs);
  return rsi;
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
  const ema = calculateEMA(prices);
  const rsi = calculateRSI(prices);

  let prediction = "No"; // default
  if (ema[ema.length - 1] > currentPrice && rsi < 30 && targetPrice > currentPrice) {
    prediction = "Yes";
  } else if (ema[ema.length - 1] < currentPrice && rsi > 70 && targetPrice < currentPrice) {
    prediction = "Yes";
  }

  document.getElementById("predictionResult").innerText =
    `📌 Prediction: Will price be ABOVE ${targetPrice} at ${targetTime}? — ${prediction}`;
}
