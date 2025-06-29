// Interactive Materials Table for Transparent Pricing

// Remove any remaining getMaterials, saveMaterials, or localStorage references. All rendering is now Firestore-based.

// --- FIRESTORE MATERIALS TABLE RENDERING ---

async function renderMaterialsTable() {
  const container = document.getElementById('materials-table-container');
  if (!container) return;
  
  // Wait for Firebase to be initialized
  if (!window.MaterialsFirestore) {
    // Listen for Firebase ready event
    window.addEventListener('firebaseReady', async () => {
      await renderMaterialsTableInternal();
    });
    
    // Also listen for Firebase error
    window.addEventListener('firebaseError', (event) => {
      console.error('Firebase initialization failed:', event.detail);
      container.innerHTML = '<p>Error loading materials. Please refresh the page.</p>';
    });
    
    return;
  }
  
  await renderMaterialsTableInternal();
}

async function renderMaterialsTableInternal() {
  const container = document.getElementById('materials-table-container');
  if (!container) return;
  
  try {
    // Option 1: Real-time updates (uncomment to use)
    // window.MaterialsFirestore.listenToMaterialsInFirestore(materials => renderTable(materials, container));
    // Option 2: One-time fetch
    const materials = await window.MaterialsFirestore.getMaterialsFromFirestore();
    renderTable(materials, container);
  } catch (error) {
    console.error('Error loading materials:', error);
    container.innerHTML = '<p>Error loading materials. Please try again.</p>';
  }
}

function renderTable(materials, container) {
  if (!materials || materials.length === 0) {
    container.innerHTML = '';
    return;
  }
  // Group materials by name
  const grouped = {};
  for (const m of materials) {
    if (!grouped[m.name]) {
      grouped[m.name] = { ...m, colors: [] };
    }
    // Merge all unique colors for this material
    if (Array.isArray(m.colors)) {
      for (const c of m.colors) {
        if (!grouped[m.name].colors.some(col => col.hex === c.hex)) {
          grouped[m.name].colors.push(c);
        }
      }
    }
  }
  let html = `<table class="materials-table">
    <thead><tr>
      <th>Material</th>
      <th>Density (g/cm³)</th>
      <th>Price/gram ($)</th>
      <th>Colors</th>
    </tr></thead><tbody>`;
  for (const matName in grouped) {
    const m = grouped[matName];
    const colorDots = (m.colors||[]).slice(0,3).map(c => `<span class=\"material-color\" style=\"background:${c.hex}\"></span>`).join(' ');
    let moreDot = '';
    if ((m.colors||[]).length > 3) {
      moreDot = `<span class=\"material-color\" style=\"background:#bbb; cursor:pointer;\" title=\"Show more colors\"></span>`;
    }
    html += `<tr>
      <td>${m.name}</td>
      <td>${m.density}</td>
      <td>${m.price}</td>
      <td>${colorDots}${moreDot}</td>
    </tr>`;
  }
  html += '</tbody></table>';
  container.innerHTML = html;
}

function showMaterialEditor(index) {
  // Prevent editing on public page
  if (!window.location.pathname.includes('admin.html')) {
    window.location.href = 'index.html';
    return;
  }
  let m = { name: '', density: '', price: '', colors: [] };
  if (typeof index === 'number') m = { ...materials[index] };
  const colorStr = (m.colors||[]).map(c => `${c.name}:${c.hex}`).join(',');
  const formHtml = `
    <div id="material-editor-modal" class="modal" style="display:block;">
      <div class="modal-content">
        <span class="close" onclick="closeMaterialEditor()">&times;</span>
        <h2>${typeof index === 'number' ? 'Edit' : 'Add'} Material</h2>
        <form id="materialForm">
          <div class="form-group">
            <label>Material Name</label>
            <input type="text" id="matName" value="${m.name}" required />
          </div>
          <div class="form-group">
            <label>Density (g/cm³)</label>
            <input type="number" id="matDensity" value="${m.density}" step="0.01" required />
          </div>
          <div class="form-group">
            <label>Price per gram ($)</label>
            <input type="number" id="matPrice" value="${m.price}" step="0.01" required />
          </div>
          <div class="form-group">
            <label>Colors (format: name:#hex, e.g. Red:#f00,Blue:#00f)</label>
            <input type="text" id="matColors" value="${colorStr}" placeholder="Red:#f00,Blue:#00f" />
          </div>
          <button type="submit" class="cta-button">Save</button>
        </form>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', formHtml);
  document.getElementById('materialForm').onsubmit = function(e) {
    e.preventDefault();
    const name = document.getElementById('matName').value.trim();
    const density = parseFloat(document.getElementById('matDensity').value);
    const price = parseFloat(document.getElementById('matPrice').value);
    const colorsRaw = document.getElementById('matColors').value.trim();
    const colors = colorsRaw ? colorsRaw.split(',').map(s => {
      const [n, h] = s.split(':');
      return { name: n.trim(), hex: (h||'').trim() };
    }) : [];
    const newMat = { name, density, price, colors };
    if (typeof index === 'number') {
      materials[index] = newMat;
    } else {
      materials.push(newMat);
    }
    renderMaterialsTable();
  };
}

function closeMaterialEditor() {
  const modal = document.getElementById('material-editor-modal');
  if (modal) modal.remove();
}

function editMaterial(index) {
  showMaterialEditor(index);
}

function deleteMaterial(index) {
  // Prevent deleting on public page
  if (!window.location.pathname.includes('admin.html')) {
    window.location.href = 'index.html';
    return;
  }
  if (!confirm('Delete this material?')) return;
  renderMaterialsTable();
}

window.showMaterialEditor = showMaterialEditor;
window.editMaterial = editMaterial;
window.deleteMaterial = deleteMaterial;

document.addEventListener('DOMContentLoaded', renderMaterialsTable); 