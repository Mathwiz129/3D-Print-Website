document.addEventListener("DOMContentLoaded", () => {
  let currentId = 0;
  let materials = [];
  let colors = [];
  let deleteTarget = null;

  // API base URL - update this to your Render.com URL
  const API_BASE_URL = 'https://threed-print-website.onrender.com';

  const uploadBox = document.getElementById("uploadBox");
  const stlInput = document.getElementById("stlInput");
  const partsArea = document.getElementById("partsArea");
  const summaryList = document.getElementById("summaryList");
  const summaryTotal = document.getElementById("summaryTotal");

  // Load materials and colors from backend
  async function loadConfiguration() {
    try {
      const [materialsResponse, colorsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/admin/materials`),
        fetch(`${API_BASE_URL}/admin/colors`)
      ]);
      
      const materialsData = await materialsResponse.json();
      const colorsData = await colorsResponse.json();
      
      materials = materialsData.materials || [];
      colors = colorsData.colors || [];
    } catch (error) {
      console.error('Failed to load configuration:', error);
      // Fallback to default values
      materials = [
        { name: 'PLA', pricePerGram: 0.05, density: 1.24 },
        { name: 'ABS', pricePerGram: 0.07, density: 1.04 },
        { name: 'PETG', pricePerGram: 0.06, density: 1.27 }
      ];
      colors = [
        { name: 'Red', value: '#ff3333', multiplier: 1.0 },
        { name: 'Blue', value: '#1565c0', multiplier: 1.0 },
        { name: 'Green', value: '#43a047', multiplier: 1.0 },
        { name: 'Black', value: '#222222', multiplier: 1.0 },
        { name: 'White', value: '#f5f5f5', multiplier: 1.0 }
      ];
    }
  }

  // Initialize configuration
  loadConfiguration();

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

    // Generate material options
    const materialOptions = materials.map(material => 
      `<option value="${material.name}">${material.name}</option>`
    ).join('');

    // Generate color options
    const colorOptions = colors.map(color => 
      `<option value="${color.value}" data-color="${color.value}">
        <span class="color-dot" style="background:${color.value}"></span>${color.name}
      </option>`
    ).join('');

    card.innerHTML = `
      <div class="col-render">
        <div class="viewer" id="${id}-viewer"></div>
      </div>
      <div class="col-controls">
        <div class="control">
          <label>Material</label>
          <select class="material required">
            <option value="">Select Material</option>
            ${materialOptions}
          </select>
        </div>
        <div class="control">
          <label>Color</label>
          <select class="color required-color">
            <option value="" data-color="#ff3333"><span class="color-dot" style="background:#ff3333"></span>Select Color</option>
            ${colorOptions}
          </select>
        </div>
        <div class="control">
          <label>Infill (%)</label>
          <input type="number" class="infill" value="20" min="0" max="100" />
        </div>
      </div>
      <div class="col-price">
        <div class="control">
          <label>Quantity</label>
          <input type="number" class="qty" value="1" min="1" />
        </div>
        <div class="control">
          <label>Price per Part</label>
          <span class="price">$0.00</span>
        </div>
        <div class="control">
          <label>Total</label>
          <span class="cost">$0.00</span>
        </div>
        <div class="control">
          <span class="material-icons delete-btn">delete</span>
        </div>
      </div>
    `;

    partsArea.appendChild(card);

    // Set up delete action for this card
    card.querySelector(".delete-btn").addEventListener("click", () => confirmDelete(card));

    // Initialize the Three.js viewer for this part
    renderViewer(file, document.getElementById(`${id}-viewer`), (volume, mesh) => {
      card.dataset.volume = volume;
      card.mesh = mesh; // Store mesh reference as property
      updateCard(card);
    });

    // Recalculate whenever any control changes
    card.querySelectorAll("select, input").forEach((input) => 
      input.addEventListener("input", () => {
        updateCard(card);
        updateMeshColor(card); // Update mesh color when color changes
      })
    );

    const colorSelect = card.querySelector('.color');
    colorSelect.addEventListener('change', function() {
      if (!this.value) {
        this.classList.add('required-color');
      } else {
        this.classList.remove('required-color');
      }
      updateMeshColor(card);
    });
    if (!colorSelect.value) colorSelect.classList.add('required-color');

    const materialSelect = card.querySelector('.material');
    materialSelect.addEventListener('change', function() {
      if (!this.value) {
        this.classList.add('required');
      } else {
        this.classList.remove('required');
      }
    });
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

  // Update the cost information on a part card using an API call
  function updateCard(card) {
    const material = card.querySelector(".material").value;
    const color = card.querySelector(".color").value;
    const infill = parseFloat(card.querySelector(".infill").value) || 0;
    const qty = parseInt(card.querySelector(".qty").value) || 1;
    const volume = parseFloat(card.dataset.volume || 0);

    if (!material || !color || volume === 0) {
      card.querySelector(".price").textContent = "$0.00";
      card.querySelector(".cost").textContent = "$0.00";
      card.dataset.cost = 0;
      updateSummary();
      return;
    }

    fetch(`${API_BASE_URL}/calculate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ material, color, infill, volume })
    })
      .then(r => r.json())
      .then(data => {
        const unit = data.cost || 0;
        const priceElem = card.querySelector(".price");
        const costElem = card.querySelector(".cost");
        priceElem.textContent = `$${unit.toFixed(2)}`;
        const total = unit * qty;
        costElem.textContent = `$${total.toFixed(2)}`;
        card.dataset.cost = total;
        updateSummary();

        // Trigger a flash effect for visual update
        flashUpdate(priceElem);
        flashUpdate(costElem);
      })
      .catch(() => {
        card.querySelector(".price").textContent = "–";
        card.querySelector(".cost").textContent = "–";
        card.dataset.cost = 0;
        updateSummary();
      });
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