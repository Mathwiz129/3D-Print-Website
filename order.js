document.addEventListener("DOMContentLoaded", () => {
  let scene, camera, renderer, mesh, controls, currentVolume = 0;

  const dropArea = document.getElementById("drop-area");
  const fileInput = document.getElementById("stlInput");
  const uploadPanel = document.getElementById("uploadPanel");
  const customizePanel = document.getElementById("customizePanel");
  const materialField = document.getElementById("material");
  const infillField = document.getElementById("infill");
  const weightDisplay = document.getElementById("weightDisplay");
  const costDisplay = document.getElementById("costDisplay");

  const densityMap = { PLA: 1.24, ABS: 1.04, PETG: 1.27 }; // in g/cm³

  function initViewer() {
    const container = document.getElementById("viewer");
    scene = new THREE.Scene();
    scene.background = new THREE.Color("#f8f8f8");

    camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 50, 100);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(0, 1, 1).normalize();
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x888888));

    const grid = new THREE.GridHelper(200, 20, "#aaa", "#ccc");
    scene.add(grid);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    animate();
  }

  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }

  function computeVolume(geometry) {
    let volumeMM3 = 0;
    const pos = geometry.attributes.position;
    for (let i = 0; i < pos.count; i += 3) {
      const ax = pos.getX(i), ay = pos.getY(i), az = pos.getZ(i);
      const bx = pos.getX(i + 1), by = pos.getY(i + 1), bz = pos.getZ(i + 1);
      const cx = pos.getX(i + 2), cy = pos.getY(i + 2), cz = pos.getZ(i + 2);
      volumeMM3 +=
        (1 / 6) *
        (-cx * by * az + bx * cy * az + cx * ay * bz -
         ax * cy * bz - bx * ay * cz + ax * by * cz);
    }
    return Math.abs(volumeMM3) / 1000; // to cm³
  }

  function updateEstimates() {
    const material = materialField.value;
    const infill = parseFloat(infillField.value);
    const density = densityMap[material] || 1.2;

    const effectiveVolume = currentVolume * (infill / 100);
    const weight = effectiveVolume * density;

    weightDisplay.textContent = `${weight.toFixed(1)} g`;
    costDisplay.textContent = "Calculating...";

    fetch("https://threed-print-website.onrender.com/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ material, infill, volume: currentVolume }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.cost !== undefined) {
          costDisplay.textContent = `$${data.cost.toFixed(2)}`;
        } else {
          costDisplay.textContent = "–";
        }
      })
      .catch(() => {
        costDisplay.textContent = "Error";
      });
  }

  function loadSTLFile(file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const loader = new THREE.STLLoader();
        const geometry = loader.parse(e.target.result);
        const material = new THREE.MeshPhongMaterial({ color: 0xe6642e });

        if (mesh) scene.remove(mesh);
        mesh = new THREE.Mesh(geometry, material);

        geometry.computeBoundingBox();
        const box = geometry.boundingBox;
        const center = new THREE.Vector3();
        box.getCenter(center);
        const yOffset = box.min.y;
        geometry.translate(-center.x, -yOffset, -center.z);

        scene.add(mesh);

        currentVolume = computeVolume(geometry);
        updateEstimates();

        uploadPanel.style.display = "none";
        customizePanel.style.display = "flex";
      } catch (err) {
        console.error("Failed to load STL:", err);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  dropArea.addEventListener("click", () => fileInput.click());

  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) loadSTLFile(file);
  });

  dropArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropArea.style.backgroundColor = "#f0f0f0";
  });

  dropArea.addEventListener("dragleave", () => {
    dropArea.style.backgroundColor = "#f9f9f9";
  });

  dropArea.addEventListener("drop", (e) => {
    e.preventDefault();
    dropArea.style.backgroundColor = "#f9f9f9";
    const file = e.dataTransfer.files[0];
    if (file) loadSTLFile(file);
  });

  document.getElementById("material").addEventListener("change", updateEstimates);
  document.getElementById("infill").addEventListener("input", updateEstimates);

  document.getElementById("reuploadBtn").addEventListener("click", () => {
    if (mesh) scene.remove(mesh);
    mesh = null;
    fileInput.value = "";
    customizePanel.style.display = "none";
    uploadPanel.style.display = "block";
    weightDisplay.textContent = "–";
    costDisplay.textContent = "–";
  });

  initViewer();
});