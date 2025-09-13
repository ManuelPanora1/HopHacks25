// Three.js setup and visualization logic
let scene, camera, renderer;
let stocks = [];
const clusters = [];
const labels = [];
const pulseRings = [];
const mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();

let mouseX = 0,
  mouseY = 0;
let isRotating = true;
let time = 0;

let controls; // declare at top with scene, camera, renderer

function initThreeJS() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);
  document.body.appendChild(renderer.domElement);

  camera.position.z = 35;

  // 👉 Add OrbitControls here
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.zoomSpeed = 0.3;
  controls.enableZoom = true;         // allow zoom with scroll/trackpad
  controls.enableDamping = true;      // smooth movement
  controls.dampingFactor = 0.05;
  controls.minDistance = 10;          // zoom-in limit
  controls.maxDistance = 200;         // zoom-out limit

  // Add enhanced lighting
  const ambientLight = new THREE.AmbientLight(0x004444, 0.4);
  scene.add(ambientLight);

  // Initialize stocks
  stocks = getActiveStocks();
  createInitialVisualization();
}

// Helper function to calculate sentiment color with white neutral
function getSentimentColor(score) {
  // Clamp score to -1 to 1 range
  const clampedScore = Math.max(-1, Math.min(1, score));
  
  if (Math.abs(clampedScore) <= 0.1) {
    // Neutral sentiment - White
    return new THREE.Color(1, 1, 1);
  } else if (clampedScore > 0.1) {
    // Positive sentiment - gradient from white to bright green
    const intensity = (clampedScore - 0.1) / 0.9; // Normalize to 0-1 range
    const r = 1 - intensity * 0.8; // Start from white (1) and go down
    const g = 1; // Keep green at maximum
    const b = 1 - intensity * 0.8; // Start from white (1) and go down
    return new THREE.Color(r, g, b);
  } else {
    // Negative sentiment - gradient from white to darker red
    const intensity = Math.abs(clampedScore + 0.1) / 0.9; // Normalize to 0-1 range
    const r = 1; // Keep red at maximum
    const g = 1 - intensity * 0.8; // Start from white (1) and go down
    const b = 1 - intensity * 0.8; // Start from white (1) and go down
    return new THREE.Color(r, g, b);
  }
}

// Create particle systems with enhanced sentiment visualization
function createStockCluster(stock, index) {
  if (
    !stock ||
    !stock.sentiment ||
    typeof stock.sentiment.sources !== "number"
  ) {
    // Fallback: return empty Object3D if data is missing
    return new THREE.Object3D();
  }
  const particleCount = Math.floor(150 + stock.sentiment.sources * 3);
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);

  // Color based on sentiment using new color scheme
  const score =
    stock.sentiment && typeof stock.sentiment.score === "number"
      ? stock.sentiment.score
      : 0;
  
  const baseColor = getSentimentColor(score);

  for (let j = 0; j < particleCount; j++) {
    const i3 = j * 3;

    // Create distribution based on volatility
    const volatilityFactor =
      1 + (typeof stock.volatility === "number" ? stock.volatility : 0) * 3;
    const radius = (Math.random() * 4 + 1) * volatilityFactor;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;

    positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i3 + 2] = radius * Math.cos(phi);

    // Color variation based on sentiment confidence (reduced for brighter colors)
    const colorVariation = 0.15 * (1 - Math.abs(score));
    colors[i3] = Math.max(
      0.2, // Minimum brightness floor
      Math.min(1.5, baseColor.r + (Math.random() - 0.5) * colorVariation)
    );
    colors[i3 + 1] = Math.max(
      0.2, // Minimum brightness floor
      Math.min(1.5, baseColor.g + (Math.random() - 0.5) * colorVariation)
    );
    colors[i3 + 2] = Math.max(
      0.2, // Minimum brightness floor
      Math.min(1.5, baseColor.b + (Math.random() - 0.5) * colorVariation)
    );
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 4 + (typeof stock.volatility === "number" ? stock.volatility : 0) * 3,
    sizeAttenuation: false,
    transparent: true,
    opacity: 0.7 + Math.abs(score) * 0.3,
    vertexColors: true,
  });

  // Enhanced glowing effect
  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 32;
  const context = canvas.getContext("2d");
  const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.3, "rgba(255,255,255,0.8)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 32, 32);

  const texture = new THREE.CanvasTexture(canvas);
  material.map = texture;

  const particles = new THREE.Points(geometry, material);
  particles.userData = {
    stock: stock,
    originalPositions: positions.slice(),
    index: index,
    pulseIntensity: typeof stock.volatility === "number" ? stock.volatility : 0,
  };

  // Position based on sentiment
  const angle = (index / stocks.length) * Math.PI * 2;
  const radius = 20;
  particles.position.x = Math.cos(angle) * radius;
  particles.position.z = Math.sin(angle) * radius;
  particles.position.y = score * 8;

  if (scene && particles) {
    scene.add(particles);
  }

  // Add pulse ring for high volatility stocks
  if (typeof stock.volatility === "number" && stock.volatility > 0.6) {
    const ringGeometry = new THREE.RingGeometry(8, 9, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: baseColor.getHex(), // Use the same color as the particles
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.copy(particles.position);
    ring.rotation.x = Math.PI / 2;
    scene.add(ring);
    pulseRings.push({ ring: ring, intensity: stock.volatility });
  }

  return particles;
}

// Helper function to get sentiment color for labels (CSS format)
function getSentimentColorCSS(score) {
  const clampedScore = Math.max(-1, Math.min(1, score));
  
  if (Math.abs(clampedScore) <= 0.1) {
    // Neutral - White
    return { bg: "rgba(255, 255, 255, 0.2)", text: "#ffffff" };
  } else if (clampedScore > 0.1) {
    // Positive - gradient from white to bright green
    const intensity = (clampedScore - 0.1) / 0.9;
    const r = Math.floor(255 * (1 - intensity * 0.8));
    const g = 255;
    const b = Math.floor(255 * (1 - intensity * 0.8));
    return { 
      bg: `rgba(${r}, ${g}, ${b}, 0.2)`,
      text: `rgb(${r}, ${g}, ${b})`
    };
  } else {
    // Negative - gradient from white to darker red
    const intensity = Math.abs(clampedScore + 0.1) / 0.9;
    const r = 255;
    const g = Math.floor(255 * (1 - intensity * 0.8));
    const b = Math.floor(255 * (1 - intensity * 0.8));
    return { 
      bg: `rgba(${r}, ${g}, ${b}, 0.2)`,
      text: `rgb(${r}, ${g}, ${b})`
    };
  }
}

// Create enhanced labels with sentiment indicators
function createStockLabel(stock, position) {
  const canvas = document.createElement("canvas");
  canvas.width = 300;
  canvas.height = 100;
  const context = canvas.getContext("2d");

  // Background with sentiment-based gradient color
  const score =
    stock.sentiment && typeof stock.sentiment.score === "number"
      ? stock.sentiment.score
      : 0;
  
  const colors = getSentimentColorCSS(score);
  
  context.fillStyle = colors.bg;
  context.fillRect(0, 0, 300, 100);

  // Main text
  context.fillStyle = colors.text;
  context.font = "bold 28px Courier New";
  context.textAlign = "center";
  context.fillText(stock.name, 150, 35);

  // Price change
  context.font = "bold 18px Courier New";
  const changeVal = typeof stock.change === "number" ? stock.change : 0;
  context.fillText(
    (changeVal > 0 ? "+" : "") + changeVal.toFixed(1) + "%",
    150,
    58
  );

  // Sentiment indicator
  context.font = "12px Courier New";
  const sentimentText = stock.sentiment.trend ? stock.sentiment.trend.toUpperCase().replace("_", " ") : "NEUTRAL";
  context.fillText(`${sentimentText} (${stock.sentiment.sources || 0})`, 150, 78);

  const labelTexture = new THREE.CanvasTexture(canvas);
  const labelGeometry = new THREE.PlaneGeometry(10, 3.3);
  const labelMaterial = new THREE.MeshBasicMaterial({
    map: labelTexture,
    transparent: true,
    opacity: 0.9,
  });

  const label = new THREE.Mesh(labelGeometry, labelMaterial);
  if (position && label.position) {
    label.position.copy(position);
    label.position.y += 10;
    if (typeof camera !== "undefined" && camera.position) {
      label.lookAt(camera.position);
    }
  }

  scene.add(label);
  return label;
}

// Create initial visualization
function createInitialVisualization() {
  stocks.forEach((stock, i) => {
    const cluster = createStockCluster(stock, i);
    clusters.push(cluster);

    const label = createStockLabel(stock, cluster.position);
    labels.push(label);
  });
}

// Clear all visualization objects
function clearVisualization() {
  clusters.forEach((cluster) => scene.remove(cluster));
  labels.forEach((label) => scene.remove(label));
  pulseRings.forEach((ring) => scene.remove(ring.ring));

  clusters.length = 0;
  labels.length = 0;
  pulseRings.length = 0;
}

// Recreate visualization with updated data
function recreateVisualization() {
  clearVisualization();
  stocks = getActiveStocks();

  stocks.forEach((stock, i) => {
    const cluster = createStockCluster(stock, i);
    clusters.push(cluster);

    const label = createStockLabel(stock, cluster.position);
    labels.push(label);
  });
}

// Animation loop with enhanced effects
function animate() {
  requestAnimationFrame(animate);
  time += 0.01;

  // Animate particles with sentiment-based pulsing
  clusters.forEach((cluster, index) => {
    if (!cluster.geometry || !cluster.geometry.attributes || !cluster.userData) return;
    
    const positions = cluster.geometry.attributes.position.array;
    const originalPositions = cluster.userData.originalPositions;
    const pulseIntensity = cluster.userData.pulseIntensity || 0;
    const stock = cluster.userData.stock;

    // Create pulsing effect based on volatility and sentiment
    const pulseSpeed = 0.01 + pulseIntensity * 0.02;
    const pulseAmplitude = 0.3 + pulseIntensity * 0.7;

    for (let i = 0; i < positions.length; i += 3) {
      const pulse =
        Math.sin(time * pulseSpeed + index + i * 0.01) * pulseAmplitude;
      positions[i] = originalPositions[i] + pulse * 0.5;
      positions[i + 1] =
        originalPositions[i + 1] +
        Math.cos(time * pulseSpeed + index + i * 0.01) * pulseAmplitude * 0.3;
      positions[i + 2] = originalPositions[i + 2] + pulse * 0.4;
    }

    cluster.geometry.attributes.position.needsUpdate = true;
    cluster.rotation.y += 0.005 + pulseIntensity * 0.01;
    cluster.rotation.x = Math.sin(time + index) * 0.1;

    // Animate opacity based on sentiment confidence
    const sentimentScore = stock.sentiment && typeof stock.sentiment.score === "number" ? stock.sentiment.score : 0;
    cluster.material.opacity = 0.7 + Math.abs(sentimentScore) * 0.3 + Math.sin(time * 2) * 0.1;
  });

  // Animate pulse rings
  pulseRings.forEach((ringData) => {
    ringData.ring.scale.x = 1 + Math.sin(time * 3) * 0.3 * ringData.intensity;
    ringData.ring.scale.y = 1 + Math.sin(time * 3) * 0.3 * ringData.intensity;
    ringData.ring.material.opacity = 0.3 + Math.sin(time * 2) * 0.2;
  });

  // Update label rotations
  labels.forEach((label) => {
    label.lookAt(camera.position);
  });

  if (isRotating && typeof marketData !== "undefined") {
    const globalPulse = 1 + Math.sin(time * 0.5) * 0.1 * marketData.riskLevel;
    scene.rotation.y = mouseX * 0.3 + time * 0.1 * globalPulse;
    scene.rotation.x = mouseY * 0.2 + Math.sin(time * 0.7) * 0.1;
  }

  controls.update();
  renderer.render(scene, camera);
}

// Mouse interaction handlers
function setupMouseInteraction() {
  const tooltip = document.getElementById("tooltip");

  document.addEventListener("mousemove", function (event) {
    mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(event.clientY / window.innerHeight) * 2 + 1;

    mouse.x = mouseX;
    mouse.y = mouseY;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(clusters);

    if (intersects.length > 0) {
      const stock = intersects[0].object.userData.stock;
      const score = stock.sentiment && typeof stock.sentiment.score === "number" ? stock.sentiment.score : 0;
      const sentimentClass = score > 0.1 ? "positive" : score < -0.1 ? "negative" : "neutral";

      tooltip.innerHTML = `
                <div style="font-size: 16px; margin-bottom: 6px; display: flex; align-items: center;">
                    <span class="sentiment-indicator ${sentimentClass}"></span>${
        stock.name
      }
                </div>
                <div>Price: ${
                  typeof stock.price === "number"
                    ? stock.price.toFixed(2)
                    : "N/A"
                }</div>
                <div>Change: ${
                  typeof stock.change === "number"
                    ? (stock.change > 0 ? "+" : "") +
                      stock.change.toFixed(2) +
                      "%"
                    : "N/A"
                }</div>
                <div>Volume: ${stock.volume ? stock.volume : "N/A"}</div>
                <div>Sentiment: ${
                  score.toFixed(2)
                } (${
        stock.sentiment && typeof stock.sentiment.sources === "number"
          ? stock.sentiment.sources
          : "N/A"
      } sources)</div>
                <div>Volatility: ${
                  typeof stock.volatility === "number"
                    ? (stock.volatility * 100).toFixed(0) + "%"
                    : "N/A"
                }</div>
                <div>News Articles: ${
                  typeof stock.newsCount === "number" ? stock.newsCount : "N/A"
                }</div>
            `;
      tooltip.style.display = "block";
      tooltip.style.left = event.clientX + 15 + "px";
      tooltip.style.top = event.clientY - 80 + "px";
    } else {
      tooltip.style.display = "none";
    }
  });

  document.addEventListener("click", function () {
    isRotating = !isRotating;
  });
}

// Resize handler
function setupResizeHandler() {
  window.addEventListener("resize", function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}