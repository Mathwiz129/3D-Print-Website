// Admin Page Material Management (no admin check for now)

// (import statement removed)

document.addEventListener('DOMContentLoaded', function() {
  const adminContent = document.getElementById('admin-content');
  adminContent.innerHTML = `
    <div class="admin-section">
      <div id="admin-add-material"></div>
      <div id="admin-materials-table"></div>
    </div>
  `;
  console.log('Rendering admin material management UI (Firestore)');
  renderAdminAddMaterialForm();
  // Listen to Firestore for real-time updates
  let unsubscribe = null;
  function startMaterialsListener() {
    if (unsubscribe) unsubscribe();
    unsubscribe = window.MaterialsFirestore.listenToMaterialsInFirestore(renderAdminMaterialsTable);
  }
  startMaterialsListener();
  window.showAdminMaterialEditor = showAdminMaterialEditor;
  window.editAdminMaterial = editAdminMaterial;
  window.deleteAdminMaterial = deleteAdminMaterial;

  function renderAdminAddMaterialForm() {
    const container = document.getElementById('admin-add-material');
    container.innerHTML = `
      <form id="adminAddMaterialForm" class="admin-add-material-form">
        <h3>Add New Material</h3>
        <div class="form-group">
          <label>Material Name</label>
          <input type="text" id="addMatName" required />
        </div>
        <div class="form-group">
          <label>Density (g/cm³)</label>
          <input type="number" id="addMatDensity" step="0.01" required />
        </div>
        <div class="form-group">
          <label>Price per gram ($)</label>
          <input type="number" id="addMatPrice" step="0.01" required />
        </div>
        <div class="form-group">
          <label>Colors (format: name:#hex, e.g. Red:#f00,Blue:#00f)</label>
          <input type="text" id="addMatColors" placeholder="Red:#f00,Blue:#00f" />
        </div>
        <button type="submit" class="cta-button">Add Material</button>
      </form>
    `;
    document.getElementById('adminAddMaterialForm').onsubmit = async function(e) {
      e.preventDefault();
      const name = document.getElementById('addMatName').value.trim();
      const density = parseFloat(document.getElementById('addMatDensity').value);
      const price = parseFloat(document.getElementById('addMatPrice').value);
      const colorsRaw = document.getElementById('addMatColors').value.trim();
      const colors = colorsRaw ? colorsRaw.split(',').map(s => {
        const [n, h] = s.split(':');
        return { name: n.trim(), hex: (h||'').trim() };
      }) : [];
      try {
        await window.MaterialsFirestore.addMaterialToFirestore({ name, density, price, colors });
        e.target.reset();
      } catch (err) {
        alert('Error adding material: ' + (err.message || err));
      }
    };
  }

  function renderAdminMaterialsTable(materials) {
    const container = document.getElementById('admin-materials-table');
    if (!container) return;
    if (!materials || materials.length === 0) {
      container.innerHTML = '<p>No materials found.</p>';
      return;
    }
    let html = `<table class="materials-table">
      <thead><tr>
        <th>Material</th>
        <th>Density (g/cm³)</th>
        <th>Price/gram ($)</th>
        <th>Colors</th>
        <th></th>
      </tr></thead><tbody>`;
    for (let i = 0; i < materials.length; i++) {
      const m = materials[i];
      html += `<tr>
        <td>${m.name}</td>
        <td>${m.density}</td>
        <td>${m.price}</td>
        <td>${(m.colors||[]).map(c => `<span class=\"material-color\" style=\"background:${c.hex}\"></span>${c.name}`).join(', ')}</td>
        <td><button onclick=\"editAdminMaterial('${m.id}')\">Edit</button> <button onclick=\"deleteAdminMaterial('${m.id}')\">Delete</button></td>
      </tr>`;
    }
    html += '</tbody></table>';
    container.innerHTML = html;
  }

  function showAdminMaterialEditor(id) {
    // Find the material by id
    window.MaterialsFirestore.getMaterialsFromFirestore().then(materials => {
      let m = { name: '', density: '', price: '', colors: [] };
      if (id) {
        m = materials.find(mat => mat.id === id) || m;
      }
      const colorStr = (m.colors||[]).map(c => `${c.name}:${c.hex}`).join(',');
      const formHtml = `
        <div id="material-editor-modal" class="modal" style="display:block;">
          <div class="modal-content">
            <span class="close" onclick="closeMaterialEditor()">&times;</span>
            <h2>${id ? 'Edit' : 'Add'} Material</h2>
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
              <button type="button" class="cta-button secondary" onclick="closeMaterialEditor()">Cancel</button>
            </form>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', formHtml);
      document.getElementById('materialForm').onsubmit = async function(e) {
        e.preventDefault();
        const name = document.getElementById('matName').value.trim();
        const density = parseFloat(document.getElementById('matDensity').value);
        const price = parseFloat(document.getElementById('matPrice').value);
        const colorsRaw = document.getElementById('matColors').value.trim();
        const colors = colorsRaw ? colorsRaw.split(',').map(s => {
          const [n, h] = s.split(':');
          return { name: n.trim(), hex: (h||'').trim() };
        }) : [];
        try {
          if (id) {
            await window.MaterialsFirestore.updateMaterialInFirestore(id, { name, density, price, colors });
          } else {
            await window.MaterialsFirestore.addMaterialToFirestore({ name, density, price, colors });
          }
          closeMaterialEditor();
        } catch (err) {
          alert('Error saving material: ' + (err.message || err));
        }
      };
    });
  }

  function closeMaterialEditor() {
    const modal = document.getElementById('material-editor-modal');
    if (modal) modal.remove();
  }

  function editAdminMaterial(id) {
    showAdminMaterialEditor(id);
  }

  function deleteAdminMaterial(id) {
    if (!confirm('Delete this material?')) return;
    window.MaterialsFirestore.deleteMaterialFromFirestore(id).catch(err => {
      alert('Error deleting material: ' + (err.message || err));
    });
  }
}); 