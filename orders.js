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

    // Initialize the Three.js viewer for this part
    renderViewer(file, document.getElementById(`${id}-viewer`), (volume, mesh) => {
      card.dataset.volume = volume;
      card.mesh = mesh; // Store mesh reference as property
      mesh.userData.card = card; // Store card reference in mesh for calculation method updates
      updateCard(card);
    });

    // Material and color dropdowns
    const materialSelect = card.querySelector('.material');
    const colorSelect = card.querySelector('.color');

    // When material changes, update color options
    materialSelect.addEventListener('change', function() {
      const selectedMaterial = this.value;
      // Update color dropdown
      const colors = getColorsForMaterial(selectedMaterial);
      colorSelect.innerHTML = '<option value="" data-color="">Select Color</option>' +
        colors.map(c => `<option value="${c.hex}" data-color="${c.hex}"><span class="color-dot" style="background:${c.hex}"></span>${c.name}</option>`).join('');
      // Reset color selection
      colorSelect.value = '';
      colorSelect.classList.add('required-color');
      updateCard(card);
      updateMeshColor(card);
    });

    // When color changes, update mesh color
    colorSelect.addEventListener('change', function() {
      if (!this.value) {
        this.classList.add('required-color');
      } else {
        this.classList.remove('required-color');
      }
      updateMeshColor(card);
      updateCard(card);
    });

    // Recalculate whenever any control changes
    card.querySelectorAll("select, input").forEach((input) => 
      input.addEventListener("input", () => {
        console.log("Input changed:", input.className, input.value);
        updateCard(card);
        if (input.classList.contains('color')) updateMeshColor(card);
      })
    );

    // Add specific event listener for infill input
    const infillInput = card.querySelector(".infill");
    if (infillInput) {
      infillInput.addEventListener("change", () => {
        console.log("Infill changed to:", infillInput.value);
        updateCard(card);
      });
      infillInput.addEventListener("input", () => {
        console.log("Infill input event:", infillInput.value);
        updateCard(card);
      });
    }

    if (!colorSelect.value) colorSelect.classList.add('required-color');
    if (!materialSelect.value) materialSelect.classList.add('required');
  }

  // Render the STL file into a Three.js viewer within a given container
  function renderViewer(file, container, cb) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.set(0, 100, 200);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0xf0f0f0); // Light gray background
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // Add lighting and a grid helper
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(0, 1, 1).normalize();
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x888888));
    scene.add(new THREE.GridHelper(200, 20, "#666666", "#888888")); // Darker gray grid lines

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

      const mat = new THREE.MeshPhongMaterial({ color: 0xe6642e });
      const mesh = new THREE.Mesh(geometry, mat);
      scene.add(mesh);

      // Calculate volume using Three.js (fallback)
      const volume = computeVolume(geometry);
      
      // Also try to upload to backend for MeshLab calculation
      uploadSTLForMeshLabCalculation(file, volume, cb, mesh);

      animate();
    };
    reader.readAsArrayBuffer(file);

    function animate() {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
  }

  // Upload STL file to backend for wall+infill calculation
  async function uploadSTLForMeshLabCalculation(file, fallbackVolume, cb, mesh) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      // Optionally, add wallThickness, infill, correctionFactor, density here if you want user control
      // formData.append('wallThickness', ...);
      // formData.append('infill', ...);
      // formData.append('correctionFactor', ...);
      // formData.append('density', ...);

      const response = await fetch('/upload-stl', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        console.log("STL upload response:", result);
        if (result.success) {
          // Store all backend-calculated values on the card for later use
          const card = mesh.userData.card;
          if (card) {
            console.log("STL upload result:", result);
            card.dataset.materialVolume = result.materialVolume;
            card.dataset.shellWeight = result.shellWeight;
            card.dataset.infillWeight = result.infillWeight;
            card.dataset.totalWeight = result.totalWeight;
            card.dataset.shellVolume = result.shellVolume;
            card.dataset.innerVolume = result.innerVolume;
            card.dataset.totalVolume = result.totalVolume;
            console.log("Stored shellVolume:", card.dataset.shellVolume);
            console.log("Stored innerVolume:", card.dataset.innerVolume);
            console.log("Stored materialVolume:", card.dataset.materialVolume);
            
            // Trigger a cost recalculation with the new data
            setTimeout(() => updateCard(card), 100);
          }
          // Use backend material volume for cost calculation
          cb(parseFloat(result.materialVolume), mesh);
        } else {
          console.log("STL upload failed, using fallback");
          cb(fallbackVolume, mesh);
        }
      } else {
        console.log("STL upload HTTP error, using fallback");
        cb(fallbackVolume, mesh);
      }
    } catch (error) {
      cb(fallbackVolume, mesh);
    }
  }

  // Compute volume from the STL geometry (in cm³)
  function computeVolume(geometry) {
    let vol = 0;
    const pos = geometry.attributes.position;
    console.log("=== Frontend Volume Calculation Debug ===");
    console.log("Number of vertices:", pos.count);
    console.log("First few vertices:", {
      v1: [pos.getX(0), pos.getY(0), pos.getZ(0)],
      v2: [pos.getX(1), pos.getY(1), pos.getZ(1)],
      v3: [pos.getX(2), pos.getY(2), pos.getZ(2)]
    });
    
    // Calculate bounding box
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
    }
    
    console.log("Bounding box:", {
      min: [minX, minY, minZ],
      max: [maxX, maxY, maxZ],
      extents: [maxX - minX, maxY - minY, maxZ - minZ]
    });
    console.log("Expected cube size: 100mm = 10cm");
    console.log("Actual cube size from frontend:", maxX - minX, "units");
    
    for (let i = 0; i < pos.count; i += 3) {
      const ax = pos.getX(i), ay = pos.getY(i), az = pos.getZ(i);
      const bx = pos.getX(i + 1), by = pos.getY(i + 1), bz = pos.getZ(i + 1);
      const cx = pos.getX(i + 2), cy = pos.getY(i + 2), cz = pos.getZ(i + 2);
      vol += (1 / 6) * (
        -cx * by * az + bx * cy * az + cx * ay * bz
        - ax * cy * bz - bx * ay * cz + ax * by * cz
      );
    }
    
    const rawVolume = Math.abs(vol);
    const volumeCm3 = rawVolume / 1000;
    console.log("Raw volume:", rawVolume, "units³");
    console.log("Volume in cm³:", volumeCm3);
    console.log("Expected volume for 10cm cube: 1000 cm³");
    console.log("=== End Frontend Debug ===");
    
    return volumeCm3;
  }

  // Update the cost information on a part card using Firestore material data
  async function updateCard(card) {
    // Use backend-calculated values only; send all parameters to backend for robust calculation
    const materialName = card.querySelector(".material").value;
    const colorHex = card.querySelector(".color").value;
    let infill = parseFloat(card.querySelector(".infill").value) || 20;
    if (infill < 0) infill = 0;
    if (infill > 100) infill = 100;
    console.log("updateCard called with infill:", infill);
    const qty = parseInt(card.querySelector(".qty").value) || 1;
    const wallThickness = parseFloat(card.querySelector(".wall-thickness")?.value) || 1.2;
    const layerHeight = parseFloat(card.querySelector(".layer-height")?.value) || 0.2;
    const topBottomLayers = parseInt(card.querySelector(".top-bottom-layers")?.value) || 3;
    const perimeters = parseInt(card.querySelector(".perimeters")?.value) || 2;
    const totalVolume = card.dataset.totalVolume
      ? parseFloat(card.dataset.totalVolume)
      : parseFloat(card.dataset.volume || 0); // fallback if needed

    if (!materialName || !colorHex || totalVolume === 0) {
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
      // Send all parameters to backend for robust calculation
      const requestData = {
        material: materialName,
        color: colorHex,
        totalVolume: totalVolume,
        infill: infill,
        wallThickness: wallThickness,
        layerHeight: layerHeight,
        topBottomLayers: topBottomLayers,
        perimeters: perimeters
      };
      console.log("Sending to backend:", requestData);
      const response = await fetch('/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      if (result.error) throw new Error(result.error);
      console.log("Backend response:", result);
      const unit = result.cost;
      console.log("Unit cost from backend:", unit);
      const priceElem = card.querySelector(".price");
      const costElem = card.querySelector(".cost");
      priceElem.textContent = `$${unit.toFixed(2)}`;
      const total = unit * qty;
      costElem.textContent = `$${total.toFixed(2)}`;
      console.log("Updated price display to:", `$${unit.toFixed(2)}`);
      console.log("Updated cost display to:", `$${total.toFixed(2)}`);
      card.dataset.cost = total;
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
      const name = card.querySelector("h4") 
        ? card.querySelector("h4").textContent 
        : "Part";
      const cost = parseFloat(card.dataset.cost || 0);
      grandTotalCost += cost;

      const item = document.createElement("div");
      item.className = "summary-item";
      item.innerHTML = `<span>${name}</span><strong>$${cost.toFixed(2)}</strong>`;
      summaryList.appendChild(item);
    });

    summaryTotal.textContent = `$${grandTotalCost.toFixed(2)}`;
    
    // Show/hide checkout button based on cart contents
    if (grandTotalCost > 0) {
      checkoutBtn.style.display = "flex";
    } else {
      checkoutBtn.style.display = "none";
    }
  }

  // Open the delete confirmation modal for a part card
  function confirmDelete(card) {
    deleteTarget = card;
    document.getElementById("confirmModal").style.display = "flex";
  }

  // Update mesh color when color selection changes
  function updateMeshColor(card) {
    const colorValue = card.querySelector('.color').value;
    const mesh = card.mesh;
    if (mesh && mesh.material && colorValue) {
      mesh.material.color.set(colorValue);
    }
  }

  // Checkout Functions
  function openCheckout() {
    const parts = document.querySelectorAll(".part-card");
    if (parts.length === 0) {
      alert("Please add at least one part to your order.");
      return;
    }

    // Populate checkout items
    const checkoutItems = document.getElementById("checkoutItems");
    const checkoutTotal = document.getElementById("checkoutTotal");
    checkoutItems.innerHTML = "";
    
    let total = 0;
    parts.forEach(card => {
      const name = card.querySelector("h4")?.textContent || "Part";
      const cost = parseFloat(card.dataset.cost || 0);
      const material = card.querySelector(".material").value;
      const color = card.querySelector(".color").value;
      const infill = card.querySelector(".infill").value;
      const qty = card.querySelector(".qty").value;
      
      total += cost;
      
      const item = document.createElement("div");
      item.className = "checkout-item";
      item.innerHTML = `
        <div class="item-details">
          <div class="item-name">${name}</div>
          <div class="item-specs">${material} - ${color} - ${infill}% infill - Qty: ${qty}</div>
        </div>
        <div class="item-price">$${cost.toFixed(2)}</div>
      `;
      checkoutItems.appendChild(item);
    });
    
    checkoutTotal.textContent = `$${total.toFixed(2)}`;
    checkoutModal.style.display = "flex";
  }

  function closeCheckoutModal() {
    checkoutModal.style.display = "none";
  }

  async function processOrder() {
    const placeOrderBtn = document.getElementById("placeOrder");
    placeOrderBtn.disabled = true;
    placeOrderBtn.innerHTML = '<span class="material-icons">hourglass_empty</span> Processing...';

    try {
      // Validate required fields
      const requiredFields = ['firstName', 'lastName', 'email', 'address', 'city', 'state', 'zipCode'];
      const missingFields = [];
      
      requiredFields.forEach(field => {
        const input = document.getElementById(field);
        if (!input.value.trim()) {
          missingFields.push(field);
          input.style.borderColor = '#ef4444';
        } else {
          input.style.borderColor = '#d1d5db';
        }
      });

      if (missingFields.length > 0) {
        alert('Please fill in all required fields.');
        placeOrderBtn.disabled = false;
        placeOrderBtn.innerHTML = '<span class="material-icons">payment</span> Place Order';
        return;
      }

      // Collect order data
      const orderData = {
        customer: {
          firstName: document.getElementById('firstName').value,
          lastName: document.getElementById('lastName').value,
          email: document.getElementById('email').value,
          phone: document.getElementById('phone').value
        },
        shipping: {
          address: document.getElementById('address').value,
          city: document.getElementById('city').value,
          state: document.getElementById('state').value,
          zipCode: document.getElementById('zipCode').value,
          country: document.getElementById('country').value
        },
        payment: {
          method: document.querySelector('input[name="paymentMethod"]:checked').value,
          cardNumber: document.getElementById('cardNumber').value,
          expiry: document.getElementById('expiry').value,
          cvv: document.getElementById('cvv').value,
          cardName: document.getElementById('cardName').value
        },
        items: [],
        total: 0,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      // Collect items
      document.querySelectorAll(".part-card").forEach(card => {
        const name = card.querySelector("h4")?.textContent || "Part";
        const cost = parseFloat(card.dataset.cost || 0);
        const material = card.querySelector(".material").value;
        const color = card.querySelector(".color").value;
        const infill = card.querySelector(".infill").value;
        const qty = parseInt(card.querySelector(".qty").value);
        const volume = parseFloat(card.dataset.totalVolume || 0);
        
        orderData.items.push({
          name,
          material,
          color,
          infill: parseFloat(infill),
          quantity: qty,
          volume,
          unitCost: cost / qty,
          totalCost: cost
        });
        
        orderData.total += cost;
      });

      // Simulate payment processing
      await simulatePaymentProcessing();

      // Generate order number
      const orderNumber = generateOrderNumber();
      orderData.orderNumber = orderNumber;
      
      // Save order to Firestore
      try {
        if (window.FirebaseDB && window.FirebaseAuth) {
          const { db, collection, addDoc } = window.FirebaseDB;
          const { auth } = window.FirebaseAuth;
          
          // Add user ID if logged in
          if (auth.currentUser) {
            orderData.userId = auth.currentUser.uid;
            orderData.userEmail = auth.currentUser.email;
          }
          
          const orderRef = await addDoc(collection(db, 'orders'), orderData);
          console.log('Order saved to Firestore with ID:', orderRef.id);
        }
      } catch (firestoreError) {
        console.error('Error saving to Firestore:', firestoreError);
        // Continue with order processing even if Firestore fails
      }

      // Send order to backend API
      try {
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData)
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Order sent to backend:', result);
      } catch (apiError) {
        console.error('Error sending order to backend:', apiError);
        // Continue even if backend fails - order is already saved to Firestore
      }
      
      // Show success modal
      document.getElementById('orderNumber').textContent = `Order #${orderNumber}`;
      checkoutModal.style.display = "none";
      successModal.style.display = "flex";

      console.log('Order placed successfully:', orderData);

    } catch (error) {
      console.error('Error processing order:', error);
      alert('There was an error processing your order. Please try again.');
    } finally {
      placeOrderBtn.disabled = false;
      placeOrderBtn.innerHTML = '<span class="material-icons">payment</span> Place Order';
    }
  }

  function simulatePaymentProcessing() {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate random success/failure (90% success rate for demo)
        if (Math.random() > 0.1) {
          resolve();
        } else {
          throw new Error('Payment failed');
        }
      }, 2000);
    });
  }

  function generateOrderNumber() {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ORD${timestamp.slice(-6)}${random}`;
  }

  function clearCart() {
    // Remove all part cards
    document.querySelectorAll(".part-card").forEach(card => card.remove());
    updateSummary();
  }
});