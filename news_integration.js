// News Sentiment Integration with existing stock visualization
// This file integrates news sentiment data with the existing stock market hologram

class NewsSentimentIntegration {
    constructor() {
        this.apiBaseUrl = 'http://localhost:5002'; // Flask API URL
        this.updateInterval = 60000; // 60 seconds for more stable updates
        this.isUpdating = false;
        this.newsData = {};
        this.sentimentHistory = {};
        
        // Initialize the integration
        this.initialize();
    }

    async initialize() {
        console.log('🚀 Initializing News Sentiment Integration...');
        
        // Test API connection
        const isConnected = await this.testAPIConnection();
        if (!isConnected) {
            console.warn('⚠️ News API not available. Using simulated data.');
            this.useSimulatedData = true;
        } else {
            console.log('✅ News API connected successfully!');
            this.useSimulatedData = false;
        }

        // Start periodic updates
        this.startPeriodicUpdates();
        
        // Wait a bit before first update to let the initial visualization settle
        setTimeout(() => {
            this.updateAllStocksWithNewsSentiment();
        }, 2000); // 2 second delay
    }

    async testAPIConnection() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/health`);
            const data = await response.json();
            return data.status === 'healthy';
        } catch (error) {
            console.error('API connection test failed:', error);
            return false;
        }
    }

    async fetchNewsSentiment(symbol, daysBack = 7) {
        if (this.useSimulatedData) {
            return this.generateSimulatedNewsSentiment(symbol);
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/sentiment/${symbol}?days=${daysBack}`);
            const data = await response.json();
            
            if (data.error) {
                console.error(`Error fetching news sentiment for ${symbol}:`, data.error);
                return this.generateSimulatedNewsSentiment(symbol);
            }
            
            return data;
        } catch (error) {
            console.error(`Failed to fetch news sentiment for ${symbol}:`, error);
            return this.generateSimulatedNewsSentiment(symbol);
        }
    }

    // Helper function to create a simple hash from string
    hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash);
    }

    // Seeded random number generator for consistent results
    seededRandom(seed) {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    }

    generateSimulatedNewsSentiment(symbol) {
        // Generate more stable simulated sentiment using symbol-based seed
        const seed = this.hashCode(symbol);
        const timeVariation = Math.sin(Date.now() / 10000 + seed) * 0.3; // Slow variation over time
        const baseSentiment = (this.seededRandom(seed) * 2 - 1) + timeVariation; // -1 to 1 with slow variation
        const articlesCount = Math.floor(this.seededRandom(seed + 1) * 20) + 5;
        
        return {
            symbol: symbol,
            analysis_date: new Date().toISOString(),
            days_analyzed: 7,
            articles_analyzed: articlesCount,
            aggregate_sentiment: {
                average_sentiment: baseSentiment,
                positive_count: Math.floor(articlesCount * (0.3 + Math.random() * 0.4)),
                negative_count: Math.floor(articlesCount * (0.1 + Math.random() * 0.3)),
                neutral_count: articlesCount - Math.floor(articlesCount * (0.4 + Math.random() * 0.4)),
                total_articles: articlesCount,
                sentiment_confidence: 0.6 + Math.random() * 0.3
            },
            recent_articles: this.generateSimulatedArticles(symbol, articlesCount)
        };
    }

    generateSimulatedArticles(symbol, count) {
        const articles = [];
        const templates = [
            `${symbol} stock shows strong performance in recent trading`,
            `Analysts upgrade ${symbol} following positive earnings report`,
            `${symbol} faces headwinds in current market conditions`,
            `Investors remain bullish on ${symbol} long-term prospects`,
            `${symbol} volatility increases amid market uncertainty`,
            `Breaking: ${symbol} announces major partnership deal`,
            `${symbol} stock price target raised by major investment bank`,
            `Concerns grow over ${symbol} market position`,
            `${symbol} demonstrates resilience in challenging market`,
            `Market experts divided on ${symbol} future outlook`
        ];

        for (let i = 0; i < Math.min(count, 10); i++) {
            const template = templates[Math.floor(Math.random() * templates.length)];
            const sentiment = (Math.random() - 0.5) * 2;
            
            articles.push({
                title: template,
                sentiment_score: sentiment,
                sentiment_label: sentiment > 0.1 ? 'positive' : sentiment < -0.1 ? 'negative' : 'neutral',
                source: ['Reuters', 'Bloomberg', 'CNBC', 'MarketWatch', 'Yahoo Finance'][Math.floor(Math.random() * 5)],
                published_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
            });
        }

        return articles;
    }

    async updateAllStocksWithNewsSentiment() {
        if (this.isUpdating) return;
        
        this.isUpdating = true;

        const activeStocks = getActiveStocks();
        const updatePromises = activeStocks.map(async (stock) => {
            try {
                const newsData = await this.fetchNewsSentiment(stock.name);
                this.newsData[stock.name] = newsData;
                
                // Update stock sentiment with news data
                this.updateStockWithNewsSentiment(stock, newsData);
            } catch (error) {
                console.error(`❌ Failed to update ${stock.name} with news sentiment:`, error);
            }
        });

        await Promise.all(updatePromises);
        
        // Update UI only - don't recreate visualization
        if (typeof updateUI === 'function') {
            updateUI();
        }
        
        // Update existing visualization colors without recreating
        this.updateVisualizationColors();
        
        this.isUpdating = false;
    }

    updateVisualizationColors() {
        console.log('🎨 Updating visualization colors...');
        // Update existing particle colors without recreating the visualization
        if (typeof clusters !== 'undefined' && clusters.length > 0) {
            clusters.forEach((cluster, index) => {
                const stock = getActiveStocks()[index];
                if (stock && stock.sentiment && stock.sentiment.score !== undefined) {
                    console.log(`📊 Stock ${stock.name}: sentiment = ${stock.sentiment.score.toFixed(3)}`);
                    const sentimentColor = getSentimentColor(stock.sentiment.score);
                    cluster.material.color = sentimentColor;
                    console.log(`🎨 Applied color to cluster ${index}:`, sentimentColor);
                }
            });
        }

        // Update existing holographic sphere colors
        if (typeof holographicSpheres !== 'undefined' && holographicSpheres.length > 0) {
            holographicSpheres.forEach((sphere, index) => {
                const stock = getActiveStocks()[index];
                if (stock && stock.sentiment && stock.sentiment.score !== undefined) {
                    const sentimentColor = getSentimentColor(stock.sentiment.score);
                    sphere.material.color = sentimentColor;
                }
            });
        }

        // Update existing label colors
        if (typeof labels !== 'undefined' && labels.length > 0) {
            labels.forEach((label, index) => {
                const stock = getActiveStocks()[index];
                if (stock && stock.sentiment && stock.sentiment.score !== undefined) {
                    const colorData = getSentimentColorCSS(stock.sentiment.score);
                    label.element.style.backgroundColor = colorData.bg;
                    label.element.style.color = colorData.text;
                }
            });
        }
    }

    updateStockWithNewsSentiment(stock, newsData) {
        if (!newsData || !newsData.aggregate_sentiment) return;

        const newsSentiment = newsData.aggregate_sentiment.average_sentiment;
        const confidence = newsData.aggregate_sentiment.sentiment_confidence || 0.5;
        
        // For simulated data, use the news sentiment directly with EXTREME variation
        let blendedSentiment;
        if (newsData.aggregate_sentiment.total_articles === 0) {
            // Generate completely new simulated sentiment when no articles
            blendedSentiment = (Math.random() - 0.5) * 2; // Full -1 to 1 range
        } else {
            // Blend news sentiment with existing sentiment (weighted average)
            const existingSentiment = stock.sentiment.score || 0;
            const newsWeight = 0.8; // 80% news, 20% existing (balanced changes)
            blendedSentiment = (newsSentiment * newsWeight) + (existingSentiment * (1 - newsWeight));
        }
        
        // Clamp sentiment to valid range
        blendedSentiment = Math.max(-1, Math.min(1, blendedSentiment));
        
        // Update stock sentiment
        stock.sentiment.score = blendedSentiment;
        stock.sentiment.sources = newsData.aggregate_sentiment.total_articles || stock.sentiment.sources;
        stock.sentiment.confidence = confidence;
        
        // Update trend based on news sentiment
        if (blendedSentiment > 0.3) {
            stock.sentiment.trend = 'very_bullish';
        } else if (blendedSentiment > 0.1) {
            stock.sentiment.trend = 'bullish';
        } else if (blendedSentiment > -0.1) {
            stock.sentiment.trend = 'neutral';
        } else if (blendedSentiment > -0.3) {
            stock.sentiment.trend = 'bearish';
        } else {
            stock.sentiment.trend = 'very_bearish';
        }

        // Update news count
        stock.newsCount = newsData.aggregate_sentiment.total_articles || stock.newsCount;
        
        // Store sentiment history for trend analysis
        if (!this.sentimentHistory[stock.name]) {
            this.sentimentHistory[stock.name] = [];
        }
        this.sentimentHistory[stock.name].push({
            timestamp: new Date(),
            sentiment: blendedSentiment,
            newsCount: newsData.aggregate_sentiment.total_articles
        });
        
        // Keep only last 20 entries
        if (this.sentimentHistory[stock.name].length > 20) {
            this.sentimentHistory[stock.name] = this.sentimentHistory[stock.name].slice(-20);
        }
        
        console.log(`📊 Updated ${stock.name}: sentiment=${blendedSentiment.toFixed(3)}, trend=${stock.sentiment.trend}`);
    }

    startPeriodicUpdates() {
        // Clear any existing interval
        if (this.updateIntervalId) {
            clearInterval(this.updateIntervalId);
        }

        console.log(`Starting periodic news sentiment updates every ${this.updateInterval / 1000} seconds`);
        
        this.updateIntervalId = setInterval(() => {
            this.updateAllStocksWithNewsSentiment();
        }, this.updateInterval);
    }

    stopPeriodicUpdates() {
        if (this.updateIntervalId) {
            clearInterval(this.updateIntervalId);
            this.updateIntervalId = null;
            console.log('Stopped periodic news sentiment updates');
        }
    }

    // Get news sentiment data for a specific stock
    getNewsData(symbol) {
        return this.newsData[symbol] || null;
    }

    // Get sentiment history for trend analysis
    getSentimentHistory(symbol) {
        return this.sentimentHistory[symbol] || [];
    }

    // Get overall market news sentiment
    getMarketNewsSentiment() {
        const activeStocks = getActiveStocks();
        if (activeStocks.length === 0) return null;

        const totalSentiment = activeStocks.reduce((sum, stock) => {
            return sum + (stock.sentiment.score || 0);
        }, 0);

        const totalNewsCount = activeStocks.reduce((sum, stock) => {
            return sum + (stock.newsCount || 0);
        }, 0);

        return {
            averageSentiment: totalSentiment / activeStocks.length,
            totalNewsCount: totalNewsCount,
            stockCount: activeStocks.length,
            lastUpdate: new Date()
        };
    }

    // Force update for a specific stock
    async updateStockNewsSentiment(symbol) {
        try {
            const newsData = await this.fetchNewsSentiment(symbol);
            this.newsData[symbol] = newsData;
            
            const stock = allStocks.find(s => s.name === symbol);
            if (stock) {
                this.updateStockWithNewsSentiment(stock, newsData);
                
                // Update UI
                if (typeof updateUI === 'function') {
                    updateUI();
                }
                if (typeof recreateVisualization === 'function') {
                    recreateVisualization();
                }
            }
            
            return newsData;
        } catch (error) {
            console.error(`Failed to update news sentiment for ${symbol}:`, error);
            return null;
        }
    }

    // Manual trigger for immediate sentiment update (for testing)
    async triggerImmediateUpdate() {
        console.log('🔄 Triggering immediate sentiment update...');
        await this.updateAllStocksWithNewsSentiment();
    }
}

// Initialize news sentiment integration when DOM is loaded
let newsIntegration;

document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit for the main app to initialize
    setTimeout(() => {
        newsIntegration = new NewsSentimentIntegration();
        
        // Make it globally available
        window.newsIntegration = newsIntegration;
        
        // Add event listener for manual sentiment update button
        const updateBtn = document.getElementById('updateSentimentBtn');
        if (updateBtn) {
            updateBtn.addEventListener('click', async () => {
                console.log('🔄 Manual sentiment update triggered');
                await newsIntegration.triggerImmediateUpdate();
            });
        }
        
        console.log('News Sentiment Integration initialized');
    }, 1000);
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NewsSentimentIntegration;
}
