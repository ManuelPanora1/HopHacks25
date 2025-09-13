// Main application initialization and coordination

// Initialize the entire application
async function initializeApp() {
  console.log("Initializing application...");

  // Initialize Three.js visualization first with placeholder data
  initThreeJS();

  // Setup mouse interaction
  setupMouseInteraction();

  // Setup resize handler
  setupResizeHandler();

  // Setup UI controls
  setupPanelControls();

  // Render initial stock panel (with placeholder data)
  renderStockPanel();

  // Update initial UI
  updateUI();

  // Initialize sentiment feed
  initializeSentimentFeed();

  // Start animation loop
  animate();

  // Start with simulated updates immediately so the visualization works
  startPeriodicUpdates();

  // Then start gradual real data loading in the background
  console.log("Starting gradual stock data loading...");
  if (typeof window.initializeStockDataGradually === "function") {
    try {
      window.initializeStockDataGradually();
    } catch (error) {
      console.error("Error starting gradual stock data loading:", error);
    }
  }
}

// Show loading indicator for real data
function showLoadingIndicator() {
  // Update the controls panel to show that real data is loading
  const controls = document.getElementById("controls");
  if (controls) {
    const realDataIndicator = document.createElement("div");
    realDataIndicator.id = "realDataIndicator";
    realDataIndicator.innerHTML = "📡 Loading real data gradually...";
    realDataIndicator.style.cssText = `
            color: #ffaa00;
            font-size: 10px;
            margin-top: 10px;
            opacity: 0.8;
            animation: pulse 2s infinite;
        `;
    controls.appendChild(realDataIndicator);

    // Remove indicator after 2 minutes
    setTimeout(() => {
      if (document.getElementById("realDataIndicator")) {
        controls.removeChild(realDataIndicator);
      }
    }, 120000);
  }
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM loaded, starting app initialization...");

  // Show loading indicator
  showLoadingIndicator();

  // Start app immediately with placeholder data
  setTimeout(initializeApp, 500);
});
