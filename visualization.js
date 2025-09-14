// Three.js setup and visualization logic
let scene, camera, renderer;
let stocks = [];
const clusters = [];
const labels = [];
const pulseRings = [];
const holographicSpheres = []; // New array to store holographic spheres
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

  // Create starfield background
  createStarfield();

  // Initialize stocks
  stocks = getActiveStocks();
  createInitialVisualization();
}

// Create holographic sphere container for a stock cluster
function createHolographicSphere(stock, index) {
  const score = stock.sentiment && typeof stock.sentiment.score === "number" ? stock.sentiment.score : 0;
  const baseColor = getSentimentColor(score);
  
  // Create sphere geometry (smaller radius)
  const sphereGeometry = new THREE.SphereGeometry(5, 32, 32);
  
  // Create holographic material (very subtle)
  const sphereMaterial = new THREE.MeshBasicMaterial({
    color: baseColor.getHex(),
    transparent: true,
    opacity: 0.015, // Much more subtle to let particles stand out
    wireframe: true,
    side: THREE.DoubleSide
  });
  
  // Create the sphere mesh
  const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
  
  // Position the sphere
  const angle = (index / stocks.length) * Math.PI * 2;
  const radius = 30; // Increased radius for better separation
  sphere.position.x = Math.cos(angle) * radius;
  sphere.position.z = Math.sin(angle) * radius;
  sphere.position.y = score * 12; // Vertical positioning based on sentiment
  
  // Add very subtle glow effect
  const glowGeometry = new THREE.SphereGeometry(5.3, 32, 32);
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: baseColor.getHex(),
    transparent: true,
    opacity: 0.005, // Very subtle glow
    side: THREE.BackSide
  });
  const glow = new THREE.Mesh(glowGeometry, glowMaterial);
  sphere.add(glow);
  
  // Add very subtle outline effect
  const outlineGeometry = new THREE.SphereGeometry(5.1, 32, 32);
  const outlineMaterial = new THREE.MeshBasicMaterial({
    color: baseColor.getHex(),
    transparent: true,
    opacity: 0.05, // Very subtle outline
    wireframe: true,
    side: THREE.DoubleSide
  });
  const outline = new THREE.Mesh(outlineGeometry, outlineMaterial);
  sphere.add(outline);
  
  // Store reference data
  sphere.userData = {
    stock: stock,
    index: index,
    originalOpacity: 0.015,
    glowOpacity: 0.005,
    initialPrice: stock.price, // Store initial price for normalization
    baseRadius: 5 // Store base radius for scaling
  };
  
  return sphere;
}

// Create a starfield background
function createStarfield() {
  const starGeometry = new THREE.BufferGeometry();
  const starCount = 2000; // Number of stars
  const positions = new Float32Array(starCount * 3);
  const colors = new Float32Array(starCount * 3);
  const sizes = new Float32Array(starCount);

  for (let i = 0; i < starCount; i++) {
    const i3 = i * 3;
    
    // Random positions in a large sphere around the scene
    const radius = 200 + Math.random() * 300; // Stars at various distances
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    
    positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i3 + 2] = radius * Math.cos(phi);
    
    // Random star colors (white to blue-white)
    const colorVariation = Math.random();
    colors[i3] = 0.8 + colorVariation * 0.2; // Red
    colors[i3 + 1] = 0.8 + colorVariation * 0.2; // Green
    colors[i3 + 2] = 1.0; // Blue (slightly more blue for space feel)
    
    // Random star sizes
    sizes[i] = Math.random() * 2 + 0.5;
  }

  starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  starGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const starMaterial = new THREE.PointsMaterial({
    size: 1,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.8,
    vertexColors: true,
    blending: THREE.AdditiveBlending
  });

  const stars = new THREE.Points(starGeometry, starMaterial);
  stars.userData = { type: 'starfield' };
  scene.add(stars);
}

// Update sphere size based on current price relative to initial price
function updateSphereSize(sphere) {
  if (!sphere.userData || !sphere.userData.stock) return;
  
  const currentPrice = sphere.userData.stock.price;
  const initialPrice = sphere.userData.initialPrice;
  const baseRadius = sphere.userData.baseRadius;
  
  // Calculate price ratio (normalized)
  const priceRatio = currentPrice / initialPrice;
  
  // Apply scaling with some bounds to prevent extreme sizes
  const minScale = 0.3; // Minimum 30% of original size
  const maxScale = 3.0; // Maximum 300% of original size
  const scaleFactor = Math.max(minScale, Math.min(maxScale, priceRatio));
  
  // Update sphere scale
  sphere.scale.setScalar(scaleFactor);
  sphere.userData.baseScale = scaleFactor; // Store for volatility pulsing
  
  // Update glow and outline scales to match
  if (sphere.children[0]) {
    sphere.children[0].scale.setScalar(scaleFactor);
  }
  if (sphere.children[1]) {
    sphere.children[1].scale.setScalar(scaleFactor);
  }
}

// Helper function to calculate sentiment color with white neutral
function getSentimentColor(score) {
  // Clamp score to -1 to 1 range
  const clampedScore = Math.max(-1, Math.min(1, score));
  
  
  // Gradient color mapping: closer to 0 = whiter, further from 0 = more saturated
  const intensity = Math.abs(clampedScore); // 0 to 1 (distance from 0)
  
  if (clampedScore < 0) {
    // Negative sentiment: RED gradient (closer to 0 = whiter)
    const r = 1; // Always full red
    const g = 1 - intensity; // More white when closer to 0
    const b = 1 - intensity; // More white when closer to 0
    return new THREE.Color(r, g, b);
  } else if (clampedScore > 0) {
    // Positive sentiment: GREEN gradient (closer to 0 = whiter)
    const r = 1 - intensity; // More white when closer to 0
    const g = 1; // Always full green
    const b = 1 - intensity; // More white when closer to 0
    return new THREE.Color(r, g, b);
  } else {
    // Zero sentiment: WHITE
    return new THREE.Color(1, 1, 1); // White
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

    // Create distribution within the sphere (proportionally smaller for smaller spheres)
    const volatilityFactor =
      1 + (typeof stock.volatility === "number" ? stock.volatility : 0) * 2;
    const radius = (Math.random() * 2 + 0.3) * volatilityFactor; // Proportionally smaller radius
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;

    positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i3 + 2] = radius * Math.cos(phi);

    // Use exact same color as sphere (no variation)
    colors[i3] = baseColor.r;
    colors[i3 + 1] = baseColor.g;
    colors[i3 + 2] = baseColor.b;
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 6 + (typeof stock.volatility === "number" ? stock.volatility : 0) * 4, // Much larger particles
    sizeAttenuation: false,
    transparent: true,
    opacity: 0.95 + Math.abs(score) * 0.05, // Much higher opacity for better visibility
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

  // Position particles at origin (they will be positioned by the parent sphere)
  particles.position.set(0, 0, 0);

  // Add pulse ring for high volatility stocks (proportionally smaller)
  if (typeof stock.volatility === "number" && stock.volatility > 0.6) {
    const ringGeometry = new THREE.RingGeometry(3.5, 4, 32); // Proportionally smaller ring
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: baseColor.getHex(), // Use the same color as the particles
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.set(0, 0, 0);
    ring.rotation.x = Math.PI / 2;
    particles.add(ring); // Add ring as child of particles
    pulseRings.push({ ring: ring, intensity: stock.volatility });
  }

  return particles;
}

// Helper function to get sentiment color for labels (CSS format)
function getSentimentColorCSS(score) {
  const clampedScore = Math.max(-1, Math.min(1, score));
  
  // Gradient color mapping: closer to 0 = whiter, further from 0 = more saturated
  const intensity = Math.abs(clampedScore); // 0 to 1 (distance from 0)
  
  if (clampedScore < 0) {
    // Negative sentiment: RED gradient (closer to 0 = whiter)
    const r = 255; // Always full red
    const g = Math.floor(255 * (1 - intensity)); // More white when closer to 0
    const b = Math.floor(255 * (1 - intensity)); // More white when closer to 0
    return { 
      bg: `rgba(${r}, ${g}, ${b}, 0.3)`,
      text: `rgb(${r}, ${g}, ${b})`
    };
  } else if (clampedScore > 0) {
    // Positive sentiment: GREEN gradient (closer to 0 = whiter)
    const r = Math.floor(255 * (1 - intensity)); // More white when closer to 0
    const g = 255; // Always full green
    const b = Math.floor(255 * (1 - intensity)); // More white when closer to 0
    return { 
      bg: `rgba(${r}, ${g}, ${b}, 0.3)`,
      text: `rgb(${r}, ${g}, ${b})`
    };
  } else {
    // Zero sentiment: WHITE
    return { 
      bg: `rgba(255, 255, 255, 0.3)`,
      text: `rgb(255, 255, 255)`
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
    // Create holographic sphere container
    const sphere = createHolographicSphere(stock, i);
    holographicSpheres.push(sphere);
    
    // Create particle cluster within the sphere
    const cluster = createStockCluster(stock, i);
    sphere.add(cluster); // Add particles as child of sphere
    clusters.push(cluster);

    // Create label positioned relative to the sphere
    const label = createStockLabel(stock, sphere.position);
    labels.push(label);
    
    // Add sphere to scene
    scene.add(sphere);
  });
}

// Clear all visualization objects
function clearVisualization() {
  holographicSpheres.forEach((sphere) => scene.remove(sphere));
  labels.forEach((label) => scene.remove(label));
  pulseRings.forEach((ring) => scene.remove(ring.ring));

  holographicSpheres.length = 0;
  clusters.length = 0;
  labels.length = 0;
  pulseRings.length = 0;
}

// Recreate visualization with updated data
function recreateVisualization() {
  clearVisualization();
  stocks = getActiveStocks();

  stocks.forEach((stock, i) => {
    // Create holographic sphere container
    const sphere = createHolographicSphere(stock, i);
    holographicSpheres.push(sphere);
    
    // Create particle cluster within the sphere
    const cluster = createStockCluster(stock, i);
    sphere.add(cluster); // Add particles as child of sphere
    clusters.push(cluster);

    // Create label positioned relative to the sphere
    const label = createStockLabel(stock, sphere.position);
    labels.push(label);
    
    // Add sphere to scene
    scene.add(sphere);
  });
}

// Animation loop with enhanced effects
function animate() {
  requestAnimationFrame(animate);
  time += 0.01;

  // Animate holographic spheres
  holographicSpheres.forEach((sphere, index) => {
    if (!sphere.userData) return;
    
    const stock = sphere.userData.stock;
    const sentimentScore = stock.sentiment && typeof stock.sentiment.score === "number" ? stock.sentiment.score : 0;
    const volatility = typeof stock.volatility === "number" ? stock.volatility : 0;
    
    // Update sphere size based on current price
    updateSphereSize(sphere);
    
    // Animate sphere opacity and glow with reduced intensity to let particles stand out
    const volatilityMultiplier = 1 + volatility * 2; // Reduced multiplier to make spheres more subtle
    const pulseIntensity = (0.1 + Math.abs(sentimentScore) * 0.05) * volatilityMultiplier; // Reduced base intensity
    sphere.material.opacity = sphere.userData.originalOpacity + Math.sin(time * (3 + volatility * 2) + index) * pulseIntensity;
    
    // Animate glow effect with reduced variation
    if (sphere.children[0] && sphere.children[0].material) {
      const glowVariation = (0.05 + volatility * 0.1) * volatilityMultiplier; // Reduced variation
      sphere.children[0].material.opacity = sphere.userData.glowOpacity + Math.sin(time * (2.5 + volatility * 1.5) + index) * glowVariation;
    }
    
    // Animate outline effect with reduced variation
    if (sphere.children[1] && sphere.children[1].material) {
      const outlineVariation = (0.05 + volatility * 0.1) * volatilityMultiplier; // Reduced variation
      sphere.children[1].material.opacity = 0.05 + Math.sin(time * (3.5 + volatility * 2) + index) * outlineVariation;
    }
    
    // Rotate sphere slowly
    sphere.rotation.y += 0.002 + volatility * 0.003;
    sphere.rotation.x = Math.sin(time * 0.5 + index) * 0.1;
    
    // Add dramatically enhanced volatility-based pulsing on top of price-based scaling
    const volatilityPulse = 1 + Math.sin(time * (2.5 + volatility * 2.5) + index) * volatility * (0.1 + volatility * 0.2); // Much more dramatic scaling
    const baseScale = sphere.userData.baseScale || 1;
    sphere.scale.setScalar(baseScale * volatilityPulse);
  });

  // Animate particles with sentiment-based pulsing
  clusters.forEach((cluster, index) => {
    if (!cluster.geometry || !cluster.geometry.attributes || !cluster.userData) return;
    
    const positions = cluster.geometry.attributes.position.array;
    const originalPositions = cluster.userData.originalPositions;
    const pulseIntensity = cluster.userData.pulseIntensity || 0;
    const stock = cluster.userData.stock;

    // Create dramatically enhanced volatility-based pulsing effect for particles
    const volatilityMultiplier = 1 + pulseIntensity * 3; // Much higher volatility = up to 4x more intense particle movement
    const pulseSpeed = (0.04 + pulseIntensity * 0.06) * volatilityMultiplier; // Much faster pulsing for volatile stocks
    const pulseAmplitude = (0.6 + pulseIntensity * 1.0) * volatilityMultiplier; // Dramatically more amplitude for volatile stocks

    for (let i = 0; i < positions.length; i += 3) {
      const pulse =
        Math.sin(time * pulseSpeed + index + i * 0.01) * pulseAmplitude;
      const movementMultiplier = 0.8 + pulseIntensity * 0.6; // Much more movement for volatile stocks
      positions[i] = originalPositions[i] + pulse * movementMultiplier;
      positions[i + 1] =
        originalPositions[i + 1] +
        Math.cos(time * pulseSpeed + index + i * 0.01) * pulseAmplitude * (0.6 + pulseIntensity * 0.4);
      positions[i + 2] = originalPositions[i + 2] + pulse * (0.6 + pulseIntensity * 0.4);
    }

    cluster.geometry.attributes.position.needsUpdate = true;
    cluster.rotation.y += 0.003 + pulseIntensity * 0.005; // Slower rotation
    cluster.rotation.x = Math.sin(time + index) * 0.05;

    // Animate opacity based on sentiment confidence with dramatically enhanced volatility-based pulsing
    const sentimentScore = stock.sentiment && typeof stock.sentiment.score === "number" ? stock.sentiment.score : 0;
    const volatilityOpacityMultiplier = 1 + pulseIntensity * 2.5; // Much higher volatility = up to 3.5x more opacity variation
    const opacityVariation = (0.15 + pulseIntensity * 0.3) * volatilityOpacityMultiplier; // Reduced variation to keep particles more visible
    cluster.material.opacity = 0.95 + Math.abs(sentimentScore) * 0.05 + Math.sin(time * (4 + pulseIntensity * 3) + index) * opacityVariation;
  });

  // Animate pulse rings with dramatically enhanced volatility-based effects
  pulseRings.forEach((ringData) => {
    const volatilityMultiplier = 1 + ringData.intensity * 3; // Much higher volatility = up to 4x more intense ring effects
    const scaleVariation = 0.6 * ringData.intensity * volatilityMultiplier; // Much more scaling variation
    const opacityVariation = 0.4 * volatilityMultiplier; // Much more opacity variation
    const pulseSpeed = 6 + ringData.intensity * 4; // Much faster pulsing for more volatile stocks
    
    ringData.ring.scale.x = 1 + Math.sin(time * pulseSpeed) * scaleVariation;
    ringData.ring.scale.y = 1 + Math.sin(time * pulseSpeed) * scaleVariation;
    ringData.ring.material.opacity = 0.4 + Math.sin(time * (5 + ringData.intensity * 3)) * opacityVariation;
  });

  // Update label rotations
  labels.forEach((label) => {
    label.lookAt(camera.position);
  });

  // Animate starfield twinkling
  scene.children.forEach((child) => {
    if (child.userData && child.userData.type === 'starfield') {
      const positions = child.geometry.attributes.position.array;
      const colors = child.geometry.attributes.color.array;
      
      // Make stars twinkle by varying their opacity
      for (let i = 0; i < positions.length; i += 3) {
        const twinkle = Math.sin(time * 2 + i * 0.01) * 0.3 + 0.7;
        child.material.opacity = twinkle * 0.8;
      }
      
      // Slowly rotate the starfield
      child.rotation.y += 0.0005;
      child.rotation.x += 0.0002;
    }
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
    const intersects = raycaster.intersectObjects(holographicSpheres);

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
