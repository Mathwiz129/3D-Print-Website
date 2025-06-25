document.addEventListener("DOMContentLoaded", () => {
  let currentId = 0;
  const density = { PLA: 1.24, ABS: 1.04, PETG: 1.27 };
  let deleteTarget = null;

  const uploadBox = document.getElementById("uploadBox");
  const stlInput = document.getElementById("stlInput");
  const partsArea = document.getElementById("partsArea");
  const summaryList = document.getElementById("summaryList");
  const summaryTotal = document.getElementById("summaryTotal");

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

    // New layout:
    // Left Column (.col-render): 3D viewer
    // Middle Column (.col-controls): Material, Color, and Infill input
    // Right Column (.col-price): Quantity, Price per Part, Total, and Delete button.
    card.innerHTML = `
      <div class="col-render">
        <div class="viewer" id="${id}-viewer"></div>
      </div>
      <div class="col-controls">
        <div class="control">
          <label>Material</label>
          <select class="material">
            <option value="PLA">PLA</option>
            <option value="ABS">ABS</option>
            <option value="PETG">PETG</option>
          </select>
        </div>
        <div class="control">
          <label>Color</label>
          <select class="color">
            <option value="default">Default</option>
            <option value="red">Red</option>
            <option value="blue">Blue</option>
            <option value="green">Green</option>
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
    renderViewer(file, document.getElementById(`${id}-viewer`), (volume) => {
      card.dataset.volume = volume;
      updateCard(card);
    });

    // Recalculate whenever any control changes
    card.querySelectorAll("select, input").forEach((input) => 
      input.addEventListener("input", () => updateCard(card))
    );
  }

  // Render the STL file into a Three.js viewer within a given container
  function renderViewer(file, container, cb) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.set(0, 40, 80);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // Add lighting and a grid helper
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(0, 1, 1).normalize();
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x888888));
    scene.add(new THREE.GridHelper(200, 20, "#aaa", "#ccc"));

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
      cb(volume);

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
    const infill = parseFloat(card.querySelector(".infill").value) || 0;
    const qty = parseInt(card.querySelector(".qty").value) || 1;
    const volume = parseFloat(card.dataset.volume || 0);

    // Optional: you can use card.querySelector(".color").value if color affects cost.
    fetch("https://threed-print-website.onrender.com/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ material, infill, volume })
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
});