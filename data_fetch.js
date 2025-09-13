// Alpha Vantage API integration for allStocks
const API_KEY = "OAOP6RAZ9HCQDLQH";
const STOCK_SYMBOLS = [
  "AAPL",
  "GOOGL",
  "MSFT",
  "TSLA",
  "AMZN",
  "META",
  "NVDA",
  "NFLX",
];
let allStocks = {};

// Helper to get last Thursday's date in YYYY-MM-DD format
function getLastThursday() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  // 4 = Thursday
  let daysAgo = dayOfWeek >= 4 ? dayOfWeek - 4 : dayOfWeek + 3;
  const lastThursday = new Date(today);
  lastThursday.setDate(today.getDate() - daysAgo);
  // Format YYYY-MM-DD
  return lastThursday.toISOString().slice(0, 10);
}

async function fetchStockData(symbol) {
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${symbol}&apikey=${API_KEY}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    const lastThursday = getLastThursday();
    const timeSeries = data["Time Series (Daily)"];
    if (timeSeries && timeSeries[lastThursday]) {
      return {
        symbol,
        date: lastThursday,
        ...timeSeries[lastThursday],
      };
    } else {
      return { symbol, error: "No data for last Thursday" };
    }
  } catch (err) {
    return { symbol, error: err.message };
  }
}

async function updateAllStocks() {
  const promises = STOCK_SYMBOLS.map(fetchStockData);
  const results = await Promise.all(promises);
  allStocks = {};
  results.forEach((stock) => {
    allStocks[stock.symbol] = stock;
  });
  // Optionally, trigger UI update here
  console.log("Updated allStocks:", allStocks);
}

// Initial fetch and set interval for updates every 30 seconds
updateAllStocks();
setInterval(updateAllStocks, 10000); // Update every 10 seconds
