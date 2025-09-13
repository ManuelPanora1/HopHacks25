// Main application initialization and coordination

// Initialize the entire application
function initializeApp() {
    // Initialize Three.js visualization
    initThreeJS();
    
    // Setup mouse interaction
    setupMouseInteraction();
    
    // Setup resize handler
    setupResizeHandler();
    
    // Setup UI controls
    setupPanelControls();
    
    // Render initial stock panel
    renderStockPanel();
    
    // Update initial UI
    updateUI();
    
    // Initialize sentiment feed
    initializeSentimentFeed();
    
    // Start animation loop
    animate();
    
    // Start live data updates (every 10 seconds for demo)
    setInterval(updateMarketData, 10000);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Small delay to ensure all scripts are loaded
    setTimeout(initializeApp, 100);
});