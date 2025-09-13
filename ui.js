// UI Management and Panel Controls

// Update market health display
function updateUI() {
    const sentimentEl = document.getElementById('sentimentValue');
    const riskEl = document.getElementById('riskLevel');
    
    if (marketData.overallSentiment > 0.3) {
        sentimentEl.textContent = 'BULLISH';
        sentimentEl.style.color = '#00ff44';
    } else if (marketData.overallSentiment < -0.3) {
        sentimentEl.textContent = 'BEARISH';
        sentimentEl.style.color = '#ff4400';
    } else {
        sentimentEl.textContent = 'NEUTRAL';
        sentimentEl.style.color = '#ffaa00';
    }
    
    if (marketData.riskLevel > 0.7) {
        riskEl.textContent = 'HIGH';
        riskEl.style.color = '#ff4400';
    } else if (marketData.riskLevel > 0.4) {
        riskEl.textContent = 'MODERATE';
        riskEl.style.color = '#ffaa00';
    } else {
        riskEl.textContent = 'LOW';
        riskEl.style.color = '#00ff44';
    }
    
    // Update market stats
    document.getElementById('marketStats').innerHTML = `
        <div class="data-row"><span>Overall Sentiment:</span><span>${marketData.overallSentiment.toFixed(2)}</span></div>
        <div class="data-row"><span>Volatility Index:</span><span>${marketData.riskLevel.toFixed(2)}</span></div>
        <div class="data-row"><span>News Volume:</span><span>${marketData.newsVolume}</span></div>
        <div class="data-row"><span>Social Mentions:</span><span>${marketData.socialMentions}</span></div>
        <div class="data-row"><span>Last Update:</span><span>${marketData.lastUpdate.toLocaleTimeString()}</span></div>
    `;
    
    // Update sentiment feed
    const feed = document.getElementById('sentimentFeed');
    const newItem = document.createElement('div');
    newItem.style.fontSize = '10px';
    newItem.style.marginBottom = '3px';
    newItem.innerHTML = `${new Date().toLocaleTimeString()}: Market sentiment ${marketData.overallSentiment > 0 ? 'improving' : 'declining'}`;
    feed.insertBefore(newItem, feed.firstChild);
    
    // Keep only last 10 items
    while (feed.children.length > 10) {
        feed.removeChild(feed.lastChild);
    }
}

// Render stock selection panel
function renderStockPanel() {
    const stockList = document.getElementById('stockList');
    stockList.innerHTML = '';
    
    allStocks.forEach(stock => {
        const stockItem = document.createElement('div');
        stockItem.className = `stock-item ${stock.active ? 'active' : ''}`;
        
        const sentimentClass = stock.sentiment.score > 0 ? 'positive' : 
                             stock.sentiment.score < 0 ? 'negative' : 'neutral';
        
        stockItem.innerHTML = `
            <div style="flex: 1;">
                <div style="display: flex; align-items: center; margin-bottom: 4px;">
                    <span class="sentiment-indicator ${sentimentClass}"></span>
                    <strong>${stock.name}</strong>
                    <span style="margin-left: 10px; font-size: 12px; color: rgba(0,255,255,0.7);">
                        ${stock.change > 0 ? '+' : ''}${stock.change.toFixed(1)}%
                    </span>
                </div>
                <div class="stock-info">
                    $${stock.price.toFixed(2)} • Vol: ${stock.volume} • Sent: ${stock.sentiment.score.toFixed(2)}
                </div>
            </div>
            <div class="stock-toggle ${stock.active ? 'checked' : ''}" data-symbol="${stock.name}"></div>
        `;
        
        stockList.appendChild(stockItem);
    });
    
    // Add event listeners to toggles
    document.querySelectorAll('.stock-toggle').forEach(toggle => {
        toggle.addEventListener('click', function() {
            const symbol = this.dataset.symbol;
            const stock = allStocks.find(s => s.name === symbol);
            if (stock) {
                stock.active = !stock.active;
                renderStockPanel();
                
                // Update visualization
                const activeStocks = getActiveStocks();
                if (activeStocks.length > 0) {
                    recreateVisualization();
                } else {
                    clearVisualization();
                }
                updateUI();
            }
        });
    });
}

// Add new stock to the system
function addNewStock(symbol) {
    const newStock = createNewStock(symbol);
    
    if (!newStock) {
        if (!symbol || symbol.length > 5) {
            alert('Please enter a valid stock symbol (1-5 characters)');
        } else {
            alert('Stock already exists in the list');
        }
        return;
    }
    
    allStocks.push(newStock);
    renderStockPanel();
    
    // Update visualization
    recreateVisualization();
    updateUI();
    
    // Clear input
    document.getElementById('newStockSymbol').value = '';
}

// Select/Deselect all stocks
function selectAllStocks() {
    allStocks.forEach(stock => stock.active = true);
    renderStockPanel();
    recreateVisualization();
    updateUI();
}

function deselectAllStocks() {
    allStocks.forEach(stock => stock.active = false);
    renderStockPanel();
    clearVisualization();
    updateUI();
}

// Panel toggle functionality
function setupPanelControls() {
    const panel = document.getElementById('stockPanel');
    const toggleBtn = document.getElementById('togglePanel');
    const addStockBtn = document.getElementById('addStockBtn');
    const newStockInput = document.getElementById('newStockSymbol');
    const selectAllBtn = document.getElementById('selectAllBtn');
    const deselectAllBtn = document.getElementById('deselectAllBtn');
    
    // Toggle panel
    toggleBtn.addEventListener('click', function() {
        panel.classList.toggle('open');
    });
    
    // Add stock button
    addStockBtn.addEventListener('click', function() {
        const symbol = newStockInput.value;
        addNewStock(symbol);
    });
    
    // Enter key for adding stock
    newStockInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addNewStock(this.value);
        }
    });
    
    // Select/Deselect all buttons
    selectAllBtn.addEventListener('click', selectAllStocks);
    deselectAllBtn.addEventListener('click', deselectAllStocks);
}

// Initialize sentiment feed with some sample data
function initializeSentimentFeed() {
    setTimeout(() => {
        document.getElementById('sentimentFeed').innerHTML = `
            <div style="font-size: 10px; margin-bottom: 3px;">System initialized - analyzing ${allStocks.length} stocks</div>
            <div style="font-size: 10px; margin-bottom: 3px;">Sentiment analysis: Mixed signals detected</div>
            <div style="font-size: 10px; margin-bottom: 3px;">High volatility in TSLA and NVDA</div>
            <div style="font-size: 10px; margin-bottom: 3px;">Social sentiment trending positive for tech</div>
        `;
    }, 2000);
}