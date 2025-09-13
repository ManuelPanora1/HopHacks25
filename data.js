// Enhanced stock data with sentiment analysis
let allStocks = [
    { 
        name: 'AAPL', 
        change: 2.4, 
        price: 175.32, 
        volume: '45.2M',
        sentiment: { score: 0.7, sources: 15, trend: 'bullish' },
        volatility: 0.3,
        newsCount: 8,
        active: true
    },
    { 
        name: 'GOOGL', 
        change: -1.8, 
        price: 135.67, 
        volume: '28.1M',
        sentiment: { score: -0.3, sources: 12, trend: 'bearish' },
        volatility: 0.5,
        newsCount: 5,
        active: true
    },
    { 
        name: 'MSFT', 
        change: 1.2, 
        price: 342.89, 
        volume: '32.5M',
        sentiment: { score: 0.4, sources: 18, trend: 'bullish' },
        volatility: 0.2,
        newsCount: 12,
        active: true
    },
    { 
        name: 'TSLA', 
        change: -3.1, 
        price: 248.15, 
        volume: '67.8M',
        sentiment: { score: -0.8, sources: 25, trend: 'very_bearish' },
        volatility: 0.9,
        newsCount: 23,
        active: true
    },
    { 
        name: 'AMZN', 
        change: 0.8, 
        price: 142.78, 
        volume: '38.9M',
        sentiment: { score: 0.1, sources: 14, trend: 'neutral' },
        volatility: 0.4,
        newsCount: 7,
        active: true
    },
    { 
        name: 'META', 
        change: -2.2, 
        price: 298.45, 
        volume: '22.3M',
        sentiment: { score: -0.6, sources: 20, trend: 'bearish' },
        volatility: 0.7,
        newsCount: 15,
        active: true
    },
    { 
        name: 'NVDA', 
        change: 4.5, 
        price: 456.23, 
        volume: '89.1M',
        sentiment: { score: 0.9, sources: 30, trend: 'very_bullish' },
        volatility: 0.8,
        newsCount: 28,
        active: true
    },
    { 
        name: 'NFLX', 
        change: -1.1, 
        price: 378.92, 
        volume: '15.7M',
        sentiment: { score: -0.2, sources: 9, trend: 'neutral' },
        volatility: 0.3,
        newsCount: 4,
        active: true
    }
];

// Global market metrics
let marketData = {
    overallSentiment: 0.1,
    riskLevel: 0.5,
    volatilityIndex: 0.45,
    newsVolume: 102,
    socialMentions: 1543,
    lastUpdate: new Date()
};

// Get active stocks for visualization
function getActiveStocks() {
    return allStocks.filter(stock => stock.active);
}

// Simulate live data updates
function updateMarketData() {
    allStocks.forEach(stock => {
        // Simulate price changes
        const priceChange = (Math.random() - 0.5) * 0.5;
        stock.change += priceChange;
        stock.price *= (1 + priceChange / 100);
        
        // Simulate sentiment changes
        stock.sentiment.score += (Math.random() - 0.5) * 0.2;
        stock.sentiment.score = Math.max(-1, Math.min(1, stock.sentiment.score));
        stock.sentiment.sources += Math.floor((Math.random() - 0.5) * 5);
        stock.sentiment.sources = Math.max(1, stock.sentiment.sources);
        
        // Update volatility
        stock.volatility += (Math.random() - 0.5) * 0.1;
        stock.volatility = Math.max(0.1, Math.min(1, stock.volatility));
    });
    
    // Update active stocks reference
    const stocks = getActiveStocks();
    
    // Update global metrics
    marketData.overallSentiment = stocks.reduce((sum, s) => sum + s.sentiment.score, 0) / Math.max(stocks.length, 1);
    marketData.riskLevel = stocks.reduce((sum, s) => sum + s.volatility, 0) / Math.max(stocks.length, 1);
    marketData.lastUpdate = new Date();
    
    // Trigger UI updates if functions are available
    if (typeof updateUI === 'function') {
        updateUI();
    }
    if (typeof recreateVisualization === 'function' && stocks.length > 0) {
        recreateVisualization();
    }
}

// Create new stock with simulated data
function createNewStock(symbol) {
    symbol = symbol.toUpperCase().trim();
    
    if (!symbol || symbol.length > 5) {
        return null;
    }
    
    if (allStocks.find(s => s.name === symbol)) {
        return null; // Already exists
    }
    
    const newStock = {
        name: symbol,
        change: (Math.random() - 0.5) * 6, // -3% to +3%
        price: Math.random() * 500 + 50, // $50 to $550
        volume: (Math.random() * 100 + 10).toFixed(1) + 'M',
        sentiment: {
            score: (Math.random() - 0.5) * 1.8, // -0.9 to +0.9
            sources: Math.floor(Math.random() * 30) + 5,
            trend: 'neutral'
        },
        volatility: Math.random() * 0.8 + 0.1, // 0.1 to 0.9
        newsCount: Math.floor(Math.random() * 25) + 1,
        active: true
    };
    
    // Set trend based on sentiment score
    if (newStock.sentiment.score > 0.5) {
        newStock.sentiment.trend = 'very_bullish';
    } else if (newStock.sentiment.score > 0) {
        newStock.sentiment.trend = 'bullish';
    } else if (newStock.sentiment.score > -0.5) {
        newStock.sentiment.trend = 'neutral';
    } else {
        newStock.sentiment.trend = 'bearish';
    }
    
    return newStock;
}