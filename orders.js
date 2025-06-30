document.addEventListener("DOMContentLoaded", () => {
  let currentId = 0;
  let materials = [];
  let deleteTarget = null;

  const uploadBox = document.getElementById("uploadBox");
  const stlInput = document.getElementById("stlInput");
  const partsArea = document.getElementById("partsArea");
  const summaryList = document.getElementById("summaryList");
  const summaryTotal = document.getElementById("summaryTotal");
  const checkoutBtn = document.getElementById("checkoutBtn");

  // Checkout modal elements
  const checkoutModal = document.getElementById("checkoutModal");
  const closeCheckout = document.getElementById("closeCheckout");
  const cancelCheckout = document.getElementById("cancelCheckout");
  const placeOrder = document.getElementById("placeOrder");
  const successModal = document.getElementById("successModal");
  const continueShopping = document.getElementById("continueShopping");

  // Checkout event listeners
  checkoutBtn.addEventListener("click", openCheckout);
  closeCheckout.addEventListener("click", closeCheckoutModal);
  cancelCheckout.addEventListener("click", closeCheckoutModal);
  placeOrder.addEventListener("click", processOrder);
  continueShopping.addEventListener("click", () => {
    successModal.style.display = "none";
    clearCart();
  });

  // Close modals when clicking outside
  window.addEventListener("click", (e) => {
    if (e.target === checkoutModal) closeCheckoutModal();
    if (e.target === successModal) successModal.style.display = "none";
  });

  // Input formatting
  document.addEventListener('DOMContentLoaded', function() {
    // Card number formatting
    const cardNumber = document.getElementById('cardNumber');
    if (cardNumber) {
      cardNumber.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
        e.target.value = formattedValue;
      });
    }

    // Expiry date formatting
    const expiry = document.getElementById('expiry');
    if (expiry) {
      expiry.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        if (value.length >= 2) {
          value = value.slice(0, 2) + '/' + value.slice(2, 4);
        }
        e.target.value = value;
      });
    }

    // CVV formatting
    const cvv = document.getElementById('cvv');
    if (cvv) {
      cvv.addEventListener('input', function(e) {
        e.target.value = e.target.value.replace(/[^0-9]/gi, '');
      });
    }

    // Phone number formatting
    const phone = document.getElementById('phone');
    if (phone) {
      phone.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        if (value.length >= 6) {
          value = value.slice(0, 3) + '-' + value.slice(3, 6) + '-' + value.slice(6, 10);
        } else if (value.length >= 3) {
          value = value.slice(0, 3) + '-' + value.slice(3);
        }
        e.target.value = value;
      });
    }
  });

  // Load materials from Firestore
  async function loadConfiguration() {
    try {
      materials = await window.MaterialsFirestore.getMaterialsFromFirestore();
    } catch (error) {
      console.error('Failed to load configuration:', error);
      materials = [];
    }
  }

  // Initialize configuration when Firebase is ready
  function initializeOrders() {
    // Check if Firebase is already loaded
    if (typeof window.MaterialsFirestore !== 'undefined') {
      loadConfiguration().then(() => {
        // You can enable/disable upload UI here if needed
      });
    } else {
      // Listen for Firebase ready event
      window.addEventListener('firebaseReady', () => {
        loadConfiguration().then(() => {
          // You can enable/disable upload UI here if needed
        });
      });
      window.addEventListener('firebaseError', (event) => {
        console.error('Firebase initialization failed:', event.detail);
      });
    }
  }

  // Initialize orders functionality
  initializeOrders();

  // Helper: get unique material names
  function getUniqueMaterialNames() {
    const names = materials.map(m => m.name);
    return [...new Set(names)];
  }

  // Helper: get all colors for a material name
  function getColorsForMaterial(materialName) {
    // Find all materials with this name, collect all their colors
    const colorMap = {};
    materials.filter(m => m.name === materialName).forEach(m => {
      (m.colors || []).forEach(c => {
        colorMap[c.hex] = c.name; // Use hex as key to avoid duplicates
      });
    });
    // Return array of { name, hex }
    return Object.entries(colorMap).map(([hex, name]) => ({ name, hex }));
  }

  // Helper: get material object by name and color hex
  function getMaterialByNameAndColor(name, colorHex) {
    return materials.find(m => m.name === name && (m.colors || []).some(c => c.hex === colorHex));
  }

  // Helper: get material density by name
  function getMaterialDensity(materialName) {
    const material = materials.find(m => m.name === materialName);
    return material ? material.density : 1.24; // Default to PLA density
  }

  // Modal event listeners for delete confirmation
  document.getElementById("cancelDelete").addEventListener("click", () => {
    document.getElementById("confirmModal").style.display = "none";
    deleteTarget = null;
  });
  document.getElementById("confirmDelete").addEventListener("click", () => {
    if (deleteTarget) {
      deleteTarget.remove();
      updateSummary();
    }
    document.getElementById("confirmModal").style.display = "none";
  });

  // Handle file input via click and drag/drop
  uploadBox.addEventListener("click", () => stlInput.click());
  uploadBox.addEventListener("dragover", (e) => e.preventDefault());
  uploadBox.addEventListener("drop", (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) addPart(file);
  });
  stlInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) addPart(file);
  });

  // Create a new part card with three columns: render, controls, and price info
  function addPart(file) {
    const id = "part-" + (++currentId);
    const card = document.createElement("div");
    card.className = "part-card";
    card.dataset.id = id;

    // Default part name is the file name
    let partName = file.name || "Part";

    // Extract base name and extension
    let partBaseName = partName.replace(/\.stl$/i, '');
    const partExt = '.stl';

    // Generate material options (unique names)
    const materialOptions = getUniqueMaterialNames().map(name => 
      `<option value="${name}">${name}</option>`
    ).join('');

    card.innerHTML = `
      <div class="part-card-row" style="display:grid; grid-template-columns:auto 260px 1fr auto; align-items:center; gap:24px; min-height:150px; width:100%;">
        <div class="col-render-name" style="display:flex; flex-direction:column; align-items:center; min-width:170px; height:100%; justify-content:center;">
          <h4 class="part-name" tabindex="0" style="cursor:pointer; color:#222; font-size:1.1em; font-weight:bold; margin:0 0 6px 0; padding:0; text-align:center;">${partName}</h4>
          <div class="viewer" id="${id}-viewer" style="width:140px; height:140px; background:#fafafa; border-radius:10px;"></div>
        </div>
        <div class="col-controls" style="display:flex; flex-direction:column; gap:10px; align-items:flex-start; min-width:180px; width:180px;">
          <div class="control" style="display:flex; flex-direction:column; align-items:flex-start; width:100%;">
            <label style="font-size:15px; color:#888; margin-bottom:2px;">Material</label>
            <select class="material required" style="width:100%;">
              <option value="">Select Material</option>
              ${materialOptions}
            </select>
          </div>
          <div class="control" style="display:flex; flex-direction:column; align-items:flex-start; width:100%;">
            <label style="font-size:15px; color:#888; margin-bottom:2px;">Color</label>
            <select class="color required-color" style="width:100%;">
              <option value="" data-color="">Select Color</option>
            </select>
          </div>
          <div class="control" style="display:flex; flex-direction:column; align-items:flex-start; width:100%;">
            <label style="font-size:15px; color:#888; margin-bottom:2px;">Infill (%)</label>
            <input type="number" class="infill" value="20" min="0" max="100" style="width:100%;" />
          </div>
          <div class="control" style="display:flex; flex-direction:column; align-items:flex-start; width:100%;">
            <label style="font-size:15px; color:#888; margin-bottom:2px;">Quantity</label>
            <input type="number" class="qty" value="1" min="1" style="width:100%; text-align:center; font-size:1em; padding:2px 0;" />
          </div>
        </div>
        <div class="col-price" style="display:flex; flex-direction:column; align-items:flex-end; justify-content:center; min-width:90px; gap:8px; text-align:right; height:140px;">
          <div style="display:flex; flex-direction:column; align-items:flex-end;">
            <span style="font-size:15px; color:#888;">$/per</span>
            <span class="price" style="font-weight:bold; font-size:1.1em; color:#e6642e;">$0.00</span>
          </div>
          <div style="display:flex; flex-direction:column; align-items:flex-end;">
            <span style="font-size:15px; color:#888;">total</span>
            <span class="cost" style="font-weight:bold; font-size:1.1em; color:#e6642e;">$0.00</span>
          </div>
          <span class="material-icons delete-btn" style="color:#e6642e; cursor:pointer; margin-top:8px;">delete</span>
        </div>
      </div>
    `;

    partsArea.appendChild(card);

    // --- Part name editing logic ---
    function makePartNameEditable(elem) {
      elem.onclick = function(e) {
        e.stopPropagation();
        startEditPartName(elem);
      };
      elem.onkeydown = function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          startEditPartName(elem);
        }
      };
      elem.style.cursor = 'pointer';
    }
    let partNameElem = card.querySelector('.part-name');
    makePartNameEditable(partNameElem);
    function startEditPartName(currentElem) {
      const input = document.createElement('input');
      input.type = 'text';
      input.value = partBaseName;
      input.className = 'edit-part-name-input';
      input.style.fontSize = '1.1em';
      input.style.fontWeight = 'bold';
      input.style.width = '90%';
      input.style.margin = '0 0 6px 4px';
      input.style.color = '#222';
      input.style.background = '#fff';
      input.style.border = '1px solid #bbb';
      input.style.borderRadius = '4px';
      input.style.padding = '4px 8px';
      input.style.textAlign = 'left';
      // Add .stl extension visually next to the input
      const extSpan = document.createElement('span');
      extSpan.textContent = partExt;
      extSpan.style.marginLeft = '4px';
      extSpan.style.color = '#888';
      extSpan.style.fontWeight = 'normal';
      extSpan.style.fontSize = '1.1em';
      const wrapper = document.createElement('div');
      wrapper.style.display = 'flex';
      wrapper.style.alignItems = 'center';
      wrapper.appendChild(input);
      wrapper.appendChild(extSpan);
      currentElem.replaceWith(wrapper);
      input.focus();
      input.select();
      let finished = false;
      function finishEditPartName() {
        if (finished) return;
        finished = true;
        partBaseName = input.value.trim() || 'Part';
        partName = partBaseName + partExt;
        const newElem = document.createElement('h4');
        newElem.className = 'part-name';
        newElem.tabIndex = 0;
        newElem.textContent = partName;
        newElem.style.cursor = 'pointer';
        newElem.style.color = '#222';
        newElem.style.fontSize = '1.1em';
        newElem.style.fontWeight = 'bold';
        newElem.style.margin = '0 0 6px 4px';
        newElem.style.padding = '0';
        newElem.style.textAlign = 'left';
        wrapper.replaceWith(newElem);
        makePartNameEditable(newElem); // Always re-enable editing on the new element
        partNameElem = newElem; // Update reference for future edits
        updateSummary();
      }
      input.addEventListener('blur', finishEditPartName);
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          finishEditPartName();
        }
      });
    }
    // --- End part name editing logic ---

    // Set up delete action for this card
    card.querySelector(".delete-btn").addEventListener("click", () => confirmDelete(card));

    // Store the STL file reference in the card for API calls
    card._stlFile = file;

    // Initialize the Three.js viewer for this part
    renderViewer(file, document.getElementById(`${id}-viewer`), (mesh) => {
      card._mesh = mesh;
      // Trigger initial weight calculation when mesh is ready
      calculateWeightWithAPI(card);
    });

    // Material and color dropdowns
    const materialSelect = card.querySelector('.material');
    const colorSelect = card.querySelector('.color');

    // When material changes, update color options and recalculate
    materialSelect.addEventListener('change', function() {
      const selectedMaterial = this.value;
      // Update color dropdown
      const colors = getColorsForMaterial(selectedMaterial);
      colorSelect.innerHTML = '<option value="" data-color="">Select Color</option>' +
        colors.map(c => `<option value="${c.hex}" data-color="${c.hex}"><span class="color-dot" style="background:${c.hex}"></span>${c.name}</option>`).join('');
      // Reset color selection
      colorSelect.value = '';
      colorSelect.classList.add('required-color');
      // Recalculate weight with new material density
      calculateWeightWithAPI(card);
      updateMeshColor(card);
    });

    // When color changes, update mesh color and recalculate
    colorSelect.addEventListener('change', function() {
      if (!this.value) {
        this.classList.add('required-color');
      } else {
        this.classList.remove('required-color');
      }
      updateMeshColor(card);
      calculateWeightWithAPI(card);
    });

    // When infill changes, recalculate weight
    const infillInput = card.querySelector(".infill");
    if (infillInput) {
      infillInput.addEventListener("change", () => {
        console.log("Infill changed to:", infillInput.value);
        calculateWeightWithAPI(card);
      });
    }

    // When quantity changes, update cost display
    const qtyInput = card.querySelector(".qty");
    if (qtyInput) {
      qtyInput.addEventListener("change", () => {
        updateCardCost(card);
      });
    }
  }

  // NEW: Calculate weight using the STL Weight Estimator API
  async function calculateWeightWithAPI(card) {
    const stlFile = card._stlFile;
    const materialName = card.querySelector(".material").value;
    const infillPercentage = parseFloat(card.querySelector(".infill").value) || 20;
    
    if (!stlFile || !materialName) {
      console.log("Missing STL file or material selection");
      return;
    }

    // Get material density from Firestore
    const materialDensity = getMaterialDensity(materialName);
    
    console.log(`Calculating weight: material=${materialName}, infill=${infillPercentage}%, density=${materialDensity}g/cm³`);

    try {
      const formData = new FormData();
      formData.append('file', stlFile);
      formData.append('infill_percentage', infillPercentage);
      formData.append('material_density', materialDensity);
      formData.append('line_thickness', 0.2); // Hard-coded as requested
      formData.append('layer_height', 0.2);   // Hard-coded as requested
      formData.append('shell_count', 2);      // Hard-coded as requested

      const response = await fetch('https://stl-api-66l8.onrender.com/estimate-weight', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        console.log("API Response:", result);
        
        // Store the weight and volume data
        card.dataset.weight = result.weight_grams;
        card.dataset.totalVolume = result.total_volume_cm3;
        card.dataset.solidVolume = result.solid_volume_cm3;
        card.dataset.infillVolume = result.infill_volume_cm3;
        card.dataset.shellVolume = result.shell_volume_cm3;
        
        console.log("Updated weight:", result.weight_grams, "grams");
        
        // Update the cost display
        updateCardCost(card);
      } else {
        console.error("API Error:", response.status, response.statusText);
        const errorText = await response.text();
        console.error("Error details:", errorText);
      }
    } catch (error) {
      console.error("Error calculating weight:", error);
    }
  }

  // NEW: Update card cost based on weight and material price
  async function updateCardCost(card) {
    const materialName = card.querySelector(".material").value;
    const colorHex = card.querySelector(".color").value;
    const qty = parseInt(card.querySelector(".qty").value) || 1;
    const weight = parseFloat(card.dataset.weight) || 0;

    if (!materialName || !colorHex || weight === 0) {
      card.querySelector(".price").textContent = "$0.00";
      card.querySelector(".cost").textContent = "$0.00";
      card.dataset.cost = 0;
      updateSummary();
      return;
    }

    const materialObj = getMaterialByNameAndColor(materialName, colorHex);
    if (!materialObj) {
      card.querySelector(".price").textContent = "$0.00";
      card.querySelector(".cost").textContent = "$0.00";
      card.dataset.cost = 0;
      updateSummary();
      return;
    }

    try {
      // Calculate cost using weight and material price
      const pricePerGram = materialObj.price;
      const unitCost = weight * pricePerGram;
      const totalCost = unitCost * qty;
      
      console.log(`Cost calculation: weight=${weight}g, price/g=${pricePerGram}, unit=${unitCost}, total=${totalCost}`);
      
      const priceElem = card.querySelector(".price");
      const costElem = card.querySelector(".cost");
      
      priceElem.textContent = `$${unitCost.toFixed(2)}`;
      costElem.textContent = `$${totalCost.toFixed(2)}`;
      
      card.dataset.cost = totalCost;
      updateSummary();
      
      flashUpdate(priceElem);
      flashUpdate(costElem);
    } catch (error) {
      console.error('Error calculating cost:', error);
      card.querySelector(".price").textContent = "$0.00";
      card.querySelector(".cost").textContent = "$0.00";
      card.dataset.cost = 0;
      updateSummary();
    }
  }

  // Simple function to add a CSS flash class and remove it after a short delay
  function flashUpdate(element) {
    element.classList.add("update-flash");
    setTimeout(() => element.classList.remove("update-flash"), 500);
  }

  // Update the global order summary panel
  function updateSummary() {
    summaryList.innerHTML = "";
    let grandTotalCost = 0;

    document.querySelectorAll(".part-card").forEach(card => {
      const name = card.querySelector("h4").textContent;
      const cost = parseFloat(card.dataset.cost) || 0;
      const qty = parseInt(card.querySelector(".qty").value) || 1;
      const material = card.querySelector(".material").value;
      const color = card.querySelector(".color").value;
      const weight = parseFloat(card.dataset.weight) || 0;

      if (cost > 0) {
        grandTotalCost += cost;
        const summaryItem = document.createElement("div");
        summaryItem.className = "summary-item";
        summaryItem.innerHTML = `
          <div class="summary-item-name">${name} (${qty}x)</div>
          <div class="summary-item-details">
            ${material} - ${weight.toFixed(1)}g
          </div>
          <div class="summary-item-price">$${cost.toFixed(2)}</div>
        `;
        summaryList.appendChild(summaryItem);
      }
    });

    summaryTotal.textContent = `$${grandTotalCost.toFixed(2)}`;
    checkoutBtn.style.display = grandTotalCost > 0 ? "flex" : "none";
  }

  function confirmDelete(card) {
    deleteTarget = card;
    document.getElementById("confirmModal").style.display = "flex";
  }

  function updateMeshColor(card) {
    const mesh = card._mesh;
    const colorHex = card.querySelector(".color").value;
    
    if (mesh && colorHex) {
      const color = new THREE.Color(colorHex);
      mesh.material.color = color;
    }
  }

  // Three.js viewer setup
  function renderViewer(file, container, cb) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    
    renderer.setSize(140, 140);
    renderer.setClearColor(0xf0f0f0); // Light gray background
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // Add lighting and a grid helper
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(0, 1, 1).normalize();
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x888888));
    scene.add(new THREE.GridHelper(200, 20, "#666666", "#888888")); // Darker gray grid lines

    // Set up camera position for side angle view
    camera.position.set(130, 130, 130);
    camera.lookAt(0, 0, 0);

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    const reader = new FileReader();
    reader.onload = function(e) {
      const loader = new THREE.STLLoader();
      const geometry = loader.parse(e.target.result);

      // Center and ground the geometry
      geometry.computeBoundingBox();
      const box = geometry.boundingBox;
      const center = new THREE.Vector3();
      box.getCenter(center);
      const yOffset = box.min.y;
      geometry.translate(-center.x, -yOffset, -center.z);

      const mat = new THREE.MeshPhongMaterial({ 
        color: 0xe6642e,
        transparent: false,
        opacity: 1.0 // 100% opacity
      });
      const mesh = new THREE.Mesh(geometry, mat);
      scene.add(mesh);

      // Call callback with mesh
      if (cb) cb(mesh);

      animate();
    };
    reader.readAsArrayBuffer(file);

    function animate() {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
  }

  function openCheckout() {
    const items = [];
    document.querySelectorAll(".part-card").forEach(card => {
      const name = card.querySelector("h4").textContent;
      const cost = parseFloat(card.dataset.cost) || 0;
      const qty = parseInt(card.querySelector(".qty").value) || 1;
      const material = card.querySelector(".material").value;
      const color = card.querySelector(".color").value;
      const weight = parseFloat(card.dataset.weight) || 0;

      if (cost > 0) {
        items.push({ name, cost, qty, material, color, weight });
      }
    });

    if (items.length === 0) {
      alert("Please add at least one item to your cart.");
      return;
    }

    // Populate checkout modal
    const checkoutItems = document.getElementById("checkoutItems");
    const checkoutTotal = document.getElementById("checkoutTotal");
    
    checkoutItems.innerHTML = "";
    let total = 0;
    
    items.forEach(item => {
      total += item.cost;
      const itemDiv = document.createElement("div");
      itemDiv.className = "checkout-item";
      itemDiv.innerHTML = `
        <div class="checkout-item-name">${item.name} (${item.qty}x)</div>
        <div class="checkout-item-details">${item.material} - ${item.weight.toFixed(1)}g</div>
        <div class="checkout-item-price">$${item.cost.toFixed(2)}</div>
      `;
      checkoutItems.appendChild(itemDiv);
    });
    
    checkoutTotal.textContent = `$${total.toFixed(2)}`;
    checkoutModal.style.display = "flex";
  }

  function closeCheckoutModal() {
    checkoutModal.style.display = "none";
  }

  async function processOrder() {
    const placeOrderBtn = document.getElementById("placeOrder");
    const originalText = placeOrderBtn.innerHTML;
    
    // Show loading state
    placeOrderBtn.innerHTML = '<span class="material-icons rotating">refresh</span> Processing...';
    placeOrderBtn.disabled = true;

    try {
      // Simulate payment processing
      await simulatePaymentProcessing();
      
      // Generate order number
      const orderNumber = generateOrderNumber();
      document.getElementById("orderNumber").textContent = `Order #${orderNumber}`;
      
      // Close checkout modal and show success
      closeCheckoutModal();
      successModal.style.display = "flex";
      
      // Clear cart after successful order
      clearCart();
      
    } catch (error) {
      console.error("Order processing failed:", error);
      alert("There was an error processing your order. Please try again.");
    } finally {
      // Restore button state
      placeOrderBtn.innerHTML = originalText;
      placeOrderBtn.disabled = false;
    }
  }

  function simulatePaymentProcessing() {
    return new Promise((resolve) => {
      setTimeout(resolve, 2000); // Simulate 2-second processing time
    });
  }

  function generateOrderNumber() {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ORD${timestamp.slice(-6)}${random}`;
  }

  function clearCart() {
    document.querySelectorAll(".part-card").forEach(card => card.remove());
    updateSummary();
  }
});