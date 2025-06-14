function parseDateTime(input) {
  const [datePart, timePart] = input.trim().split(" ");
  const [day, month, year] = datePart.split(".");
  return new Date(`${year}-${month}-${day}T${timePart}:00`);
}

async function getCurrentPrice() {
  const res = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT");
  const data = await res.json();
  return parseFloat(data.price);
}

async function getPriceData() {
  const res = await fetch("https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1m&limit=100");
  const data = await res.json();
  return data.map(d => ({
    time: d[0],
    close: parseFloat(d[4])
  }));
}

function calculateEMA(closes, period = 14) {
  return technicalindicators.EMA.calculate({ period, values: closes });
}

function calculateRSI(closes, period = 14) {
  return technicalindicators.RSI.calculate({ period, values: closes });
}

async function predictPrice() {
  const resultDiv = document.getElementById("prediction-result");
  resultDiv.innerHTML = "⏳ Please wait...";

  try {
    const targetPriceInput = document.getElementById("target-price").value;
    const targetTimeInput = document.getElementById("target-time").value;

    if (!targetPriceInput || !targetTimeInput) {
      resultDiv.innerHTML = `<span style="color:red;">⚠️ Please enter both target price and time.</span>`;
      return;
    }

    const targetPrice = parseFloat(targetPriceInput);
    const targetTime = parseDateTime(targetTimeInput);
    if (isNaN(targetTime.getTime())) {
      resultDiv.innerHTML = `<span style="color:red;">⚠️ Invalid time format. Use dd.mm.yyyy hh:mm</span>`;
      return;
    }

    const priceData = await getPriceData();
    const closes = priceData.map(p => p.close);
    const ema = calculateEMA(closes).slice(-1)[0];
    const rsi = calculateRSI(closes).slice(-1)[0];
    const currentPrice = await getCurrentPrice();

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
    console.error(err);
    resultDiv.innerHTML = `<span style="color:red;">❌ Error fetching data</span>`;
  }
}

// Auto refresh current price in result
setInterval(async () => {
  const el = document.getElementById("current-price");
  if (el) {
    const price = await getCurrentPrice();
    el.innerText = price.toFixed(2);
  }
}, 10000);

// TradingView Widget
new TradingView.widget({
  "width": "100%",
  "height": 500,
  "symbol": "BINANCE:BTCUSDT",
  "interval": "1",
  "timezone": "Etc/UTC",
  "theme": "light",
  "style": "1",
  "locale": "en",
  "toolbar_bg": "#f1f3f6",
  "enable_publishing": false,
  "container_id": "tv-widget"
});
