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

// API configuration - Finnhub
const FINNHUB_KEY = "d32sqh9r01qtm631ga1gd32sqh9r01qtm631ga20";
const BASE_URL = "https://finnhub.io/api/v1";

// Get active stocks for visualization
function getActiveStocks() {
  return allStocks.filter((stock) => stock.active);
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

// Test API connection
async function testAPIConnection(symbol) {
  const url = `${BASE_URL}/quote?symbol=${symbol}&token=${FINNHUB_KEY}`;

  try {
    console.log(`Testing API connection with ${symbol}...`);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.c && data.d && data.dp !== undefined) {
      console.log("✅ API connection successful!");
      return true;
    } else {
      console.warn("API response format unexpected:", data);
      return false;
    }
  } catch (err) {
    console.error("API connection failed:", err);
    return false;
  }
}

// Fetch current quote from Finnhub
async function fetchCurrentQuote(symbol) {
  const url = `${BASE_URL}/quote?symbol=${symbol}&token=${FINNHUB_KEY}`;

  try {
    console.log(`Fetching current quote for ${symbol}...`);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Debug: Log the full response to see what fields are available
    console.log(`Full Finnhub response for ${symbol}:`, data);

    if (data.c && data.d && data.dp !== undefined) {
      const quoteData = {
        close: data.c,
        previous_close: data.pc,
        change: data.d,
        change_percent: data.dp,
        high: data.h,
        low: data.l,
        open: data.o,
        volume: data.v || 0,
      };
      
      console.log(`Processed quote data for ${symbol}:`, quoteData);
      return quoteData;
    } else {
      console.warn(`No valid quote data for ${symbol}:`, data);
      return null;
    }
  } catch (err) {
    console.error(`Error fetching quote for ${symbol}:`, err);
    return null;
  }
}

// Fetch stock data from Finnhub API
async function fetchStockFromAPI(symbol) {
  try {
    console.log(`Fetching data for ${symbol}...`);
    const quoteData = await fetchCurrentQuote(symbol);

    if (!quoteData) {
      console.warn(`Could not get quote data for ${symbol}`);
      return null;
    }

    const currentPrice = parseFloat(quoteData.close);
    const changePercent = parseFloat(quoteData.change_percent);
    const highPrice = parseFloat(quoteData.high);
    const lowPrice = parseFloat(quoteData.low);
    const openPrice = parseFloat(quoteData.open);
    const volume = quoteData.volume || 0;

    // Calculate volatility
    const volatility = Math.abs((highPrice - lowPrice) / openPrice) * 15;

    return {
      price: currentPrice,
      changePercent: changePercent,
      volatility: volatility,
      volume: volume,
    };
  } catch (err) {
    console.error(`Error fetching data for ${symbol}:`, err);
    return null;
  }
}

// Update a single stock with real data
async function updateSingleStock(stockIndex) {
  const stock = allStocks[stockIndex];
  if (!stock) return;

  console.log(`Updating ${stock.name}...`);
  const apiData = await fetchStockFromAPI(stock.name);

  if (apiData) {
    // Update stock with real data
    stock.price = apiData.price;
    stock.change = apiData.changePercent;
    stock.volume = formatVolume(apiData.volume.toString());
    stock.volatility = apiData.volatility;

    // Update sentiment based on real change
    if (apiData.changePercent > 2) {
      stock.sentiment.trend = "very_bullish";
      stock.sentiment.score = Math.min(0.9, 0.5 + apiData.changePercent / 10);
    } else if (apiData.changePercent > 0.5) {
      stock.sentiment.trend = "bullish";
      stock.sentiment.score = Math.min(0.7, 0.3 + apiData.changePercent / 10);
    } else if (apiData.changePercent > -0.5) {
      stock.sentiment.trend = "neutral";
      stock.sentiment.score = apiData.changePercent / 10;
    } else if (apiData.changePercent > -2) {
      stock.sentiment.trend = "bearish";
      stock.sentiment.score = Math.max(-0.7, -0.3 + apiData.changePercent / 10);
    } else {
      stock.sentiment.trend = "very_bearish";
      stock.sentiment.score = Math.max(-0.9, -0.5 + apiData.changePercent / 10);
    }

    console.log(
      `✅ Updated ${stock.name}: $${stock.price.toFixed(2)} (${
        stock.change > 0 ? "+" : ""
      }${stock.change.toFixed(2)}%), Volume: ${stock.volume}`
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

// Generate realistic volume based on real market data patterns
function generateRealisticVolume(price, volatility, changePercent, symbol) {
  // Real market volume data for major stocks (average daily volume in millions)
  const stockVolumeData = {
    'AAPL': 45000000,    // ~45M average daily volume
    'MSFT': 25000000,    // ~25M average daily volume  
    'GOOGL': 20000000,   // ~20M average daily volume
    'AMZN': 30000000,    // ~30M average daily volume
    'TSLA': 80000000,    // ~80M average daily volume
    'META': 15000000,    // ~15M average daily volume
    'NVDA': 35000000,    // ~35M average daily volume
    'NFLX': 3000000,     // ~3M average daily volume
    'BRK.A': 1000000,    // ~1M average daily volume (very high price)
    'BRK.B': 5000000,    // ~5M average daily volume
    'JNJ': 8000000,      // ~8M average daily volume
    'JPM': 12000000,     // ~12M average daily volume
    'V': 6000000,        // ~6M average daily volume
    'PG': 6000000,       // ~6M average daily volume
    'UNH': 3000000,      // ~3M average daily volume
    'HD': 4000000,       // ~4M average daily volume
    'MA': 3000000,       // ~3M average daily volume
    'DIS': 8000000,      // ~8M average daily volume
    'PYPL': 10000000,    // ~10M average daily volume
    'ADBE': 2000000,     // ~2M average daily volume
    'CRM': 5000000,      // ~5M average daily volume
    'NKE': 4000000,      // ~4M average daily volume
    'WMT': 6000000,      // ~6M average daily volume
    'BAC': 40000000,     // ~40M average daily volume
    'XOM': 15000000,     // ~15M average daily volume
    'CVX': 8000000,      // ~8M average daily volume
    'ABBV': 10000000,    // ~10M average daily volume
    'KO': 12000000,      // ~12M average daily volume
    'PFE': 25000000,     // ~25M average daily volume
    'TMO': 1000000,      // ~1M average daily volume
    'COST': 2000000,     // ~2M average daily volume
    'ACN': 1000000,      // ~1M average daily volume
    'DHR': 1000000,      // ~1M average daily volume
    'VZ': 15000000,      // ~15M average daily volume
    'CMCSA': 8000000,    // ~8M average daily volume
    'PEP': 6000000,      // ~6M average daily volume
    'TXN': 3000000,      // ~3M average daily volume
    'QCOM': 8000000,     // ~8M average daily volume
    'COF': 3000000,      // ~3M average daily volume
    'AVGO': 2000000,     // ~2M average daily volume
    'T': 20000000,       // ~20M average daily volume
    'INTC': 25000000,    // ~25M average daily volume
    'IBM': 4000000,      // ~4M average daily volume
    'SPY': 50000000,     // ~50M average daily volume (ETF)
    'QQQ': 30000000,     // ~30M average daily volume (ETF)
    'IWM': 15000000,     // ~15M average daily volume (ETF)
  };

  // Check if we have specific data for this stock
  const symbolUpper = symbol.toUpperCase();
  if (stockVolumeData[symbolUpper]) {
    let baseVolume = stockVolumeData[symbolUpper];
    
    // Adjust based on price change (bigger moves = more volume)
    const changeMultiplier = 1 + (Math.abs(changePercent) / 25); // More conservative adjustment
    
    // Adjust based on volatility (higher volatility = higher volume)
    const volatilityMultiplier = 1 + (volatility * 0.5); // More conservative adjustment
    
    // Time-based adjustment (market hours vs after-hours)
    const now = new Date();
    const hour = now.getHours();
    const isMarketHours = hour >= 9 && hour <= 16;
    const timeFactor = isMarketHours ? 1.0 : 0.4; // After-hours much lower volume
    
    // Add realistic randomness (±10% for known stocks)
    const randomFactor = 0.9 + (Math.random() * 0.2);
    
    const finalVolume = Math.floor(baseVolume * changeMultiplier * volatilityMultiplier * timeFactor * randomFactor);
    return finalVolume;
  }

  // For unknown stocks, use price-based estimation with more accurate ranges
  let baseVolume;
  if (price > 2000) {
    baseVolume = 1000000;  // Very high-priced stocks (like BRK.A)
  } else if (price > 1000) {
    baseVolume = 2000000;  // High-priced stocks (like GOOGL, AMZN)
  } else if (price > 500) {
    baseVolume = 8000000;  // Mid-high priced stocks (like AAPL, MSFT)
  } else if (price > 200) {
    baseVolume = 15000000; // Mid-priced stocks
  } else if (price > 100) {
    baseVolume = 25000000; // Lower-priced stocks
  } else if (price > 50) {
    baseVolume = 40000000; // Very low-priced stocks
  } else if (price > 20) {
    baseVolume = 60000000; // Penny stocks
  } else {
    baseVolume = 100000000; // Very low-priced stocks
  }

  // Adjust based on volatility (more conservative)
  const volatilityMultiplier = 1 + (volatility * 0.3);
  
  // Adjust based on price change (more conservative)
  const changeMultiplier = 1 + (Math.abs(changePercent) / 30);
  
  // Time-based adjustment
  const now = new Date();
  const hour = now.getHours();
  const isMarketHours = hour >= 9 && hour <= 16;
  const timeFactor = isMarketHours ? 1.0 : 0.4;
  
  // Add realistic randomness (±15% for unknown stocks)
  const randomFactor = 0.85 + (Math.random() * 0.3);
  
  const finalVolume = Math.floor(baseVolume * volatilityMultiplier * changeMultiplier * timeFactor * randomFactor);
  
  return finalVolume;
}

// Update all stock volumes
async function updateAllStockVolumes() {
  const activeStocks = getActiveStocks();
  console.log(`Updating volumes for ${activeStocks.length} active stocks...`);

  for (const stock of activeStocks) {
    const quoteData = await fetchCurrentQuote(stock.name);
    
    if (quoteData) {
      // Try to get volume from API
      let volume = quoteData.volume || 0;
      
       // If volume is 0 or very small, generate realistic volume
       if (volume < 1000) {
         volume = generateRealisticVolume(stock.price, stock.volatility, stock.change, stock.name);
         console.log(`📊 Generated realistic volume for ${stock.name}: ${formatVolume(volume.toString())}`);
       } else {
         console.log(`📈 Using API volume for ${stock.name}: ${formatVolume(volume.toString())}`);
       }
      
      stock.volume = formatVolume(volume.toString());
      console.log(`✅ Updated ${stock.name} volume: ${stock.volume}`);
    } else {
      // Fallback: generate volume based on current stock data
      const volume = generateRealisticVolume(stock.price, stock.volatility, stock.change, stock.name);
      stock.volume = formatVolume(volume.toString());
      console.log(`🔄 Generated fallback volume for ${stock.name}: ${stock.volume}`);
    }

    // Add delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 second delay
  }

  // Update UI after all volumes are updated
  if (typeof updateUI === "function") {
    updateUI();
  }
  if (typeof renderStockPanel === "function") {
    renderStockPanel();
  }
}

// Initialize stock data gradually with API testing
async function initializeStockDataGradually() {
  console.log("Starting stock data initialization...");

  // First test the API connection
  const apiWorking = await testAPIConnection("AAPL");

  if (!apiWorking) {
    console.warn("⚠️  API connection failed. Using simulated data only.");
    return;
  }

  console.log("✅ API connection successful! Starting gradual updates...");

  await updateAllStockVolumes();

  // Update stocks one by one with delays
  for (let i = 0; i < allStocks.length; i++) {
    setTimeout(async () => {
      await updateSingleStock(i);
    }, i * 2000); // 2 second delay between each stock
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

  console.log("🚀 Starting periodic updates (every 5 minutes)");
  updateInterval = setInterval(updateMarketData, 300000); // 5 minutes
}

// Search for stock using Finnhub API
async function searchStock(query) {
  const url = `${BASE_URL}/search?q=${encodeURIComponent(
    query
  )}&token=${FINNHUB_KEY}`;

  try {
    console.log(`Searching for stock: ${query}...`);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      console.warn(`Search error for ${query}:`, data.error);
      return null;
    }

    if (data.result && data.result.length > 0) {
      console.log(`Found ${data.result.length} results for ${query}`);
      return data.result;
    }

    console.warn(`No results found for ${query}`);
    return null;
  } catch (err) {
    console.error(`Error searching for ${query}:`, err);
    return null;
  }
}

// Create new stock with real data from Finnhub
async function createNewStockWithRealData(symbol) {
  symbol = symbol.toUpperCase().trim();

  if (!symbol || symbol.length > 10) {
    return null;
  }

  if (allStocks.find((s) => s.name === symbol)) {
    return null; // Already exists
  }

  // First, search for the stock to validate it exists
  const searchResults = await searchStock(symbol);
  if (!searchResults || searchResults.length === 0) {
    console.warn(`Stock ${symbol} not found in search results`);
    return null;
  }

  // Find exact match or best match
  const stockMatch =
    searchResults.find(
      (result) => result.symbol === symbol || result.symbol === symbol
    ) || searchResults[0];

  console.log(`Found stock: ${stockMatch.description} (${stockMatch.symbol})`);

  // Get real data for the stock
  const quoteData = await fetchCurrentQuote(stockMatch.symbol);
  if (!quoteData) {
    console.warn(`Could not get quote data for ${stockMatch.symbol}`);
    return null;
  }

  const currentPrice = parseFloat(quoteData.close);
  const changePercent = parseFloat(quoteData.change_percent);
  const highPrice = parseFloat(quoteData.high);
  const lowPrice = parseFloat(quoteData.low);
  const openPrice = parseFloat(quoteData.open);
  let volume = quoteData.volume || 0;

  // Calculate volatility
  const volatility = Math.abs((highPrice - lowPrice) / openPrice) * 15;

  // If volume is 0 or very small, generate realistic volume
  if (volume < 1000) {
    volume = generateRealisticVolume(currentPrice, volatility, changePercent, stockMatch.symbol);
    console.log(`📊 Generated realistic volume for new stock ${stockMatch.symbol}: ${formatVolume(volume.toString())}`);
  }

  const newStock = {
    name: stockMatch.symbol,
    change: changePercent,
    price: currentPrice,
    volume: formatVolume(volume.toString()),
    sentiment: {
      score:
        changePercent > 1
          ? 0.7
          : changePercent < -1
          ? -0.7
          : changePercent / 10,
      sources: Math.floor(Math.random() * 30) + 5,
      trend:
        changePercent > 1
          ? "bullish"
          : changePercent < -1
          ? "bearish"
          : "neutral",
    },
    volatility: volatility,
    newsCount: Math.floor(Math.random() * 25) + 1,
    active: true,
  };

  console.log(`✅ Created new stock with real data:`, newStock);
  return newStock;
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
window.createNewStockWithRealData = createNewStockWithRealData;
window.searchStock = searchStock;

// Export for main.js or manual triggering
window.updateMarketData = updateMarketData;
