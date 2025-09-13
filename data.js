// Enhanced stock data with sentiment analysis and real API fetching
let allStocks = [
  {
    name: "AAPL",
    change: 2.4,
    price: 175.32,
    volume: "45.2M",
    sentiment: { score: 0.7, sources: 15, trend: "bullish" },
    volatility: 0.3,
    newsCount: 8,
    active: true,
  },
  {
    name: "GOOGL",
    change: -1.8,
    price: 135.67,
    volume: "28.1M",
    sentiment: { score: -0.3, sources: 12, trend: "bearish" },
    volatility: 0.5,
    newsCount: 5,
    active: true,
  },
  {
    name: "MSFT",
    change: 1.2,
    price: 342.89,
    volume: "32.5M",
    sentiment: { score: 0.4, sources: 18, trend: "bullish" },
    volatility: 0.2,
    newsCount: 12,
    active: true,
  },
  {
    name: "TSLA",
    change: -3.1,
    price: 248.15,
    volume: "67.8M",
    sentiment: { score: -0.8, sources: 25, trend: "very_bearish" },
    volatility: 0.9,
    newsCount: 23,
    active: true,
  },
  {
    name: "AMZN",
    change: 0.8,
    price: 142.78,
    volume: "38.9M",
    sentiment: { score: 0.1, sources: 14, trend: "neutral" },
    volatility: 0.4,
    newsCount: 7,
    active: true,
  },
  {
    name: "META",
    change: -2.2,
    price: 298.45,
    volume: "22.3M",
    sentiment: { score: -0.6, sources: 20, trend: "bearish" },
    volatility: 0.7,
    newsCount: 15,
    active: true,
  },
  {
    name: "NVDA",
    change: 4.5,
    price: 456.23,
    volume: "89.1M",
    sentiment: { score: 0.9, sources: 30, trend: "very_bullish" },
    volatility: 0.8,
    newsCount: 28,
    active: true,
  },
  {
    name: "NFLX",
    change: -1.1,
    price: 378.92,
    volume: "15.7M",
    sentiment: { score: -0.2, sources: 9, trend: "neutral" },
    volatility: 0.3,
    newsCount: 4,
    active: true,
  },
];

// Global market metrics
let marketData = {
  overallSentiment: 0.1,
  riskLevel: 0.5,
  volatilityIndex: 0.45,
  newsVolume: 102,
  socialMentions: 1543,
  lastUpdate: new Date(),
};

// API configuration - You may need to get a new API key from https://www.alphavantage.co/support/#api-key
const ALPHA_VANTAGE_KEY = "CJM042MJWC9X1OXH";

// Get active stocks for visualization
function getActiveStocks() {
  return allStocks.filter((stock) => stock.active);
}

// Get the most recent trading day (simplified approach)
function getRecentTradingDay() {
  const today = new Date();
  let daysBack = 0;

  // Go back up to 5 days to find a trading day
  while (daysBack < 5) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() - daysBack);
    const dayOfWeek = checkDate.getDay();

    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      return checkDate.toISOString().slice(0, 10);
    }
    daysBack++;
  }

  // Fallback to 3 days ago
  const fallback = new Date(today);
  fallback.setDate(today.getDate() - 3);
  return fallback.toISOString().slice(0, 10);
}

// Format volume to readable format
function formatVolume(volume) {
  const num = parseInt(volume);
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + "B";
  } else if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
}

// Test API connection first
async function testAPIConnection() {
  const testUrl = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=AAPL&apikey=${ALPHA_VANTAGE_KEY}&outputsize=compact`;

  try {
    console.log("Testing API connection...");
    const response = await fetch(testUrl);
    const data = await response.json();

    console.log("API Response:", data);

    if (data["Error Message"]) {
      console.error("API Error:", data["Error Message"]);
      return false;
    }

    if (data["Note"]) {
      console.warn("API Note (likely rate limit):", data["Note"]);
      return false;
    }

    if (data["Time Series (Daily)"]) {
      console.log("API connection successful!");
      return true;
    }

    console.warn("Unexpected API response format:", Object.keys(data));
    return false;
  } catch (error) {
    console.error("API connection failed:", error);
    return false;
  }
}

// Fetch stock data from Alpha Vantage API with improved error handling
async function fetchStockFromAPI(symbol) {
  // Use simplified daily function instead of daily_adjusted to avoid potential issues
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${ALPHA_VANTAGE_KEY}&outputsize=compact`;

  try {
    console.log(`Fetching data for ${symbol}...`);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Debug: Log the actual response
    console.log(`Raw API response for ${symbol}:`, data);

    // Check for API limit or error
    if (data["Error Message"]) {
      console.error(`API Error for ${symbol}:`, data["Error Message"]);
      return null;
    }

    if (data["Note"]) {
      console.warn(`API limit reached for ${symbol}:`, data["Note"]);
      return null;
    }

    // Try both possible key names
    const timeSeries =
      data["Time Series (Daily)"] || data["Time Series (Daily Adjusted)"];
    if (!timeSeries) {
      console.warn(
        `No time series data for ${symbol}. Available keys:`,
        Object.keys(data)
      );
      return null;
    }

    // Get the most recent trading day
    const dates = Object.keys(timeSeries).sort().reverse();
    if (dates.length < 2) {
      console.warn(`Insufficient data for ${symbol}`);
      return null;
    }

    const currentDate = dates[0];
    const previousDate = dates[1];

    const currentData = timeSeries[currentDate];
    const previousData = timeSeries[previousDate];

    console.log(
      `Using dates for ${symbol}: Current=${currentDate}, Previous=${previousDate}`
    );

    if (currentData && previousData) {
      const currentClose = parseFloat(currentData["4. close"]);
      const previousClose = parseFloat(previousData["4. close"]);
      const change = ((currentClose - previousClose) / previousClose) * 100;

      console.log(
        `${symbol}: Current: ${currentClose}, Previous: ${previousClose}, Change: ${change.toFixed(
          2
        )}%`
      );

      return {
        price: currentClose,
        change: change,
        volume: formatVolume(currentData["5. volume"]),
        sentiment: {
          score: change > 1 ? 0.7 : change < -1 ? -0.7 : 0.0,
          sources: Math.floor(Math.random() * 20) + 10,
          trend: change > 1 ? "bullish" : change < -1 ? "bearish" : "neutral",
        },
        volatility: Math.min(Math.abs(change) / 10, 1),
      };
    } else {
      console.warn(`Could not find sufficient data for ${symbol}`);
      return null;
    }
  } catch (err) {
    console.error(`Error fetching data for ${symbol}:`, err);
    return null;
  }
}

// Update a single stock with real data and refresh visualization
async function updateSingleStock(stockIndex) {
  const stock = allStocks[stockIndex];
  if (!stock) return;

  console.log(`Updating ${stock.name}...`);
  const apiData = await fetchStockFromAPI(stock.name);

  if (apiData) {
    // Update stock with real data
    stock.price = apiData.price;
    stock.change = apiData.change;
    stock.volume = apiData.volume;
    stock.volatility = apiData.volatility;

    // Update sentiment trend based on real change
    if (apiData.change > 2) {
      stock.sentiment.trend = "very_bullish";
      stock.sentiment.score = Math.min(0.9, 0.5 + apiData.change / 10);
    } else if (apiData.change > 0.5) {
      stock.sentiment.trend = "bullish";
      stock.sentiment.score = Math.min(0.7, 0.3 + apiData.change / 10);
    } else if (apiData.change > -0.5) {
      stock.sentiment.trend = "neutral";
      stock.sentiment.score = apiData.change / 10;
    } else if (apiData.change > -2) {
      stock.sentiment.trend = "bearish";
      stock.sentiment.score = Math.max(-0.7, -0.3 + apiData.change / 10);
    } else {
      stock.sentiment.trend = "very_bearish";
      stock.sentiment.score = Math.max(-0.9, -0.5 + apiData.change / 10);
    }

    console.log(
      `✅ Updated ${stock.name}: $${stock.price.toFixed(2)} (${
        stock.change > 0 ? "+" : ""
      }${stock.change.toFixed(2)}%)`
    );

    // Update global market data
    updateGlobalMarketData();

    // Update UI and visualization
    if (typeof updateUI === "function") {
      updateUI();
    }

    if (typeof renderStockPanel === "function") {
      renderStockPanel();
    }

    if (typeof recreateVisualization === "function") {
      const activeStocks = getActiveStocks();
      if (activeStocks.length > 0) {
        recreateVisualization();
      }
    }
  } else {
    console.log(`❌ Failed to update ${stock.name} - using existing data`);
  }
}

// Initialize stock data gradually with API testing
async function initializeStockDataGradually() {
  console.log("Starting stock data initialization...");

  // First test the API connection
  const apiWorking = await testAPIConnection();

  if (!apiWorking) {
    console.warn("⚠️  API connection failed. Using simulated data only.");
    console.log("To get real data:");
    console.log(
      "1. Get a free API key from https://www.alphavantage.co/support/#api-key"
    );
    console.log("2. Replace the ALPHA_VANTAGE_KEY in data.js");
    return;
  }

  console.log("✅ API connection successful! Starting gradual updates...");

  // Update stocks one by one with delays
  for (let i = 0; i < allStocks.length; i++) {
    setTimeout(async () => {
      await updateSingleStock(i);
    }, i * 15000); // 15 second delay between each stock
  }
}

// Update global market metrics based on current stock data
function updateGlobalMarketData() {
  const stocks = getActiveStocks();

  if (stocks.length > 0) {
    marketData.overallSentiment =
      stocks.reduce((sum, s) => sum + s.sentiment.score, 0) / stocks.length;
    marketData.riskLevel =
      stocks.reduce((sum, s) => sum + s.volatility, 0) / stocks.length;
    marketData.volatilityIndex = marketData.riskLevel;
    marketData.newsVolume = stocks.reduce((sum, s) => sum + s.newsCount, 0);
    marketData.lastUpdate = new Date();
  }
}

// Simulate live data updates with small variations
async function updateMarketData() {
  console.log("🔄 Simulated market update...");

  // Add small random variations to simulate live updates
  allStocks.forEach((stock) => {
    if (stock.active) {
      // Add small random variation (±0.2%)
      const variation = (Math.random() - 0.5) * 0.4;
      stock.change += variation;
      stock.price *= 1 + variation / 100;

      // Keep price positive
      if (stock.price < 1) stock.price = 1;

      // Update sentiment based on change
      if (stock.change > 1) {
        stock.sentiment.score = Math.min(0.9, stock.sentiment.score + 0.05);
      } else if (stock.change < -1) {
        stock.sentiment.score = Math.max(-0.9, stock.sentiment.score - 0.05);
      }

      // Update trend
      if (stock.sentiment.score > 0.5) {
        stock.sentiment.trend = "very_bullish";
      } else if (stock.sentiment.score > 0) {
        stock.sentiment.trend = "bullish";
      } else if (stock.sentiment.score > -0.5) {
        stock.sentiment.trend = "neutral";
      } else {
        stock.sentiment.trend = "bearish";
      }
    }
  });

  // Update global metrics
  updateGlobalMarketData();

  // Trigger UI updates
  if (typeof updateUI === "function") {
    updateUI();
  }
  if (typeof recreateVisualization === "function") {
    const activeStocks = getActiveStocks();
    if (activeStocks.length > 0) {
      recreateVisualization();
    }
  }
}

// Start periodic updates
let updateInterval;
function startPeriodicUpdates() {
  // Clear any existing interval
  if (updateInterval) {
    clearInterval(updateInterval);
  }

  console.log("🚀 Starting periodic updates (every 30 seconds)");
  updateInterval = setInterval(updateMarketData, 30000);
}

// Create new stock with simulated data
function createNewStock(symbol) {
  symbol = symbol.toUpperCase().trim();

  if (!symbol || symbol.length > 5) {
    return null;
  }

  if (allStocks.find((s) => s.name === symbol)) {
    return null; // Already exists
  }

  const newStock = {
    name: symbol,
    change: (Math.random() - 0.5) * 6, // -3% to +3%
    price: Math.random() * 500 + 50, // $50 to $550
    volume: (Math.random() * 100 + 10).toFixed(1) + "M",
    sentiment: {
      score: (Math.random() - 0.5) * 1.8, // -0.9 to +0.9
      sources: Math.floor(Math.random() * 30) + 5,
      trend: "neutral",
    },
    volatility: Math.random() * 0.8 + 0.1, // 0.1 to 0.9
    newsCount: Math.floor(Math.random() * 25) + 1,
    active: true,
  };

  // Set trend based on sentiment score
  if (newStock.sentiment.score > 0.5) {
    newStock.sentiment.trend = "very_bullish";
  } else if (newStock.sentiment.score > 0) {
    newStock.sentiment.trend = "bullish";
  } else if (newStock.sentiment.score > -0.5) {
    newStock.sentiment.trend = "neutral";
  } else {
    newStock.sentiment.trend = "bearish";
  }

  return newStock;
}

// Export functions for main.js
window.initializeStockDataGradually = initializeStockDataGradually;
window.startPeriodicUpdates = startPeriodicUpdates;
