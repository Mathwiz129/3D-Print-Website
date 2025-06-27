document.addEventListener("DOMContentLoaded", () => {
  let currentId = 0;
  let materials = [];
  let deleteTarget = null;

  const uploadBox = document.getElementById("uploadBox");
  const stlInput = document.getElementById("stlInput");
  const partsArea = document.getElementById("partsArea");
  const summaryList = document.getElementById("summaryList");
  const summaryTotal = document.getElementById("summaryTotal");

  // Load materials from Firestore
  async function loadConfiguration() {
    try {
      materials = await window.MaterialsFirestore.getMaterialsFromFirestore();
    } catch (error) {
      console.error('Failed to load configuration:', error);
      materials = [];
    }
  }

  // Initialize configuration
  loadConfiguration().then(() => {
    // You can enable/disable upload UI here if needed
  });

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
            <span style="font-size:15px; color:#888;">weight</span>
            <span class="weight" style="font-weight:bold; font-size:1.1em; color:#666;">0g</span>
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
        updateCard(card);
        if (input.classList.contains('color')) updateMeshColor(card);
      })
    );

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

      const volume = computeVolume(geometry);
      cb(volume, mesh);

      animate();
    };
    reader.readAsArrayBuffer(file);

    function animate() {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
  }

  // Compute volume from the STL geometry (in cm³)
  function computeVolume(geometry) {
    let vol = 0;
    const pos = geometry.attributes.position;
    for (let i = 0; i < pos.count; i += 3) {
      const ax = pos.getX(i), ay = pos.getY(i), az = pos.getZ(i);
      const bx = pos.getX(i + 1), by = pos.getY(i + 1), bz = pos.getZ(i + 1);
      const cx = pos.getX(i + 2), cy = pos.getY(i + 2), cz = pos.getZ(i + 2);
      vol += (1 / 6) * (
        -cx * by * az + bx * cy * az + cx * ay * bz
        - ax * cy * bz - bx * ay * cz + ax * by * cz
      );
    }
    return Math.abs(vol) / 1000;
  }

  // Update the cost information on a part card using Firestore material data
  async function updateCard(card) {
    const materialName = card.querySelector(".material").value;
    const colorHex = card.querySelector(".color").value;
    const infill = parseFloat(card.querySelector(".infill").value) || 20;
    const qty = parseInt(card.querySelector(".qty").value) || 1;
    const volume = parseFloat(card.dataset.volume || 0);

    if (!materialName || !colorHex || volume === 0) {
      card.querySelector(".price").textContent = "$0.00";
      card.querySelector(".cost").textContent = "$0.00";
      card.querySelector(".weight").textContent = "0g";
      card.dataset.cost = 0;
      updateSummary();
      return;
    }

    // Find the material object by name and color
    const materialObj = getMaterialByNameAndColor(materialName, colorHex);
    if (!materialObj) {
      card.querySelector(".price").textContent = "$0.00";
      card.querySelector(".cost").textContent = "$0.00";
      card.querySelector(".weight").textContent = "0g";
      card.dataset.cost = 0;
      updateSummary();
      return;
    }

    try {
      // Use the improved backend calculation
      const response = await fetch('/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          material: materialName,
          volume: volume,
          infill: infill,
          wallThickness: 1.2,
          layerHeight: 0.2,
          supportPercentage: 0
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }

      const unit = result.cost;
      const grams = result.breakdown.grams;
      const priceElem = card.querySelector(".price");
      const costElem = card.querySelector(".cost");
      const weightElem = card.querySelector(".weight");
      
      priceElem.textContent = `$${unit.toFixed(2)}`;
      const total = unit * qty;
      costElem.textContent = `$${total.toFixed(2)}`;
      weightElem.textContent = `${grams.toFixed(1)}g`;
      card.dataset.cost = total;
      updateSummary();
      flashUpdate(priceElem);
      flashUpdate(costElem);
      flashUpdate(weightElem);
      
    } catch (error) {
      console.error('Error calculating cost:', error);
      // Fallback to simple calculation if API fails
      const density = parseFloat(materialObj.density) || 1.0;
      const pricePerGram = parseFloat(materialObj.price) || 0.05;
      const grams = volume * (infill / 100) * density;
      const unit = grams * pricePerGram;
      const priceElem = card.querySelector(".price");
      const costElem = card.querySelector(".cost");
      const weightElem = card.querySelector(".weight");
      priceElem.textContent = `$${unit.toFixed(2)}`;
      const total = unit * qty;
      costElem.textContent = `$${total.toFixed(2)}`;
      weightElem.textContent = `${grams.toFixed(1)}g`;
      card.dataset.cost = total;
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
});