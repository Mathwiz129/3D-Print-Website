// Admin Page Material Management (no admin check for now)

// Global application management functions
window.acceptApplication = function(appId) {
  fetch(`/api/admin/applications/${appId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'accepted' })
  })
    .then(res => res.json())
    .then(() => {
      // Refresh the applications section
      if (window.renderAdminApplicationsSection) {
        window.renderAdminApplicationsSection();
      } else {
        location.reload();
      }
    })
    .catch(err => {
      console.error('Error accepting application:', err);
      alert('Failed to accept application. Please try again.');
    });
};

window.denyApplication = function(appId) {
  fetch(`/api/admin/applications/${appId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'denied' })
  })
    .then(res => res.json())
    .then(() => {
      // Refresh the applications section
      if (window.renderAdminApplicationsSection) {
        window.renderAdminApplicationsSection();
      } else {
        location.reload();
      }
    })
    .catch(err => {
      console.error('Error denying application:', err);
      alert('Failed to deny application. Please try again.');
    });
};

window.deleteApplication = function(appId) {
  if (!confirm('Are you sure you want to delete this application? This cannot be undone.')) return;
  fetch(`/api/admin/applications/${appId}`, {
    method: 'DELETE'
  })
    .then(res => res.json())
    .then(() => {
      // Refresh the applications section
      if (window.renderAdminApplicationsSection) {
        window.renderAdminApplicationsSection();
      } else {
        location.reload();
      }
    })
    .catch(err => {
      console.error('Error deleting application:', err);
      alert('Failed to delete application. Please try again.');
    });
};

document.addEventListener('DOMContentLoaded', function() {
  const adminContent = document.getElementById('admin-content');
  adminContent.innerHTML = `
    <div class="admin-section">
      <div id="admin-add-material"></div>
      <div id="admin-materials-table"></div>
      <div id="admin-applications-section"></div>
    </div>
  `;
  console.log('Rendering admin material management UI (Firestore)');
  renderAdminAddMaterialForm();
  renderAdminApplicationsSection();
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
  window.renderAdminApplicationsSection = renderAdminApplicationsSection;

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
          <input type="number" id="addMatPrice" step="0.0001" min="0" required />
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
        <td>$${parseFloat(m.price).toFixed(4)}</td>
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
                <input type="number" id="matPrice" value="${m.price}" step="0.0001" min="0" required />
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

  function renderAdminApplicationsSection() {
    const container = document.getElementById('admin-applications-section');
    container.innerHTML = `<h2>Printer Applications</h2>
      <button id="toggle-history-btn" class="cta-button" style="margin-bottom:12px;">Show Application History</button>
      <div id="admin-applications-list"><div class="loading">Loading applications...</div></div>
      <div id="admin-applications-history" style="display:none; max-height:350px; overflow-y:auto; margin-top:18px;"></div>`;
    fetch('/api/admin/applications')
      .then(res => {
        if (!res.ok) { console.error('Failed to fetch applications:', res.status, res.statusText); }
        return res.json();
      })
      .then(apps => {
        const list = document.getElementById('admin-applications-list');
        const history = document.getElementById('admin-applications-history');
        if (!Array.isArray(apps) || apps.length === 0) {
          list.innerHTML = '<div class="empty">No applications found.</div>';
          history.innerHTML = '';
          return;
        }
        // Helper to format Firestore timestamp or ISO string
        function formatDate(val) {
          if (!val) return '';
          if (typeof val === 'string') return new Date(val).toLocaleString();
          if (val.seconds) return new Date(val.seconds * 1000).toLocaleString();
          return '';
        }
        // Pending applications
        const pendingApps = apps.filter(app => (app.status || 'pending').toLowerCase() === 'pending');
        // History (accepted/denied)
        const historyApps = apps.filter(app => ['accepted','denied'].includes((app.status||'pending').toLowerCase()));
        list.innerHTML = pendingApps.length === 0 ? '<div class="empty">No pending applications.</div>' : pendingApps.map(app => {
          const status = (app.status || 'pending').toLowerCase();
          return `
            <div class="application-card ${status}">
              <div class="app-row"><span class="app-label">Date:</span> <span class="app-value">${formatDate(app.createdAt)}</span></div>
              <div class="app-row"><span class="app-label">Name:</span> <span class="app-value">${app.name || ''}</span></div>
              <div class="app-row"><span class="app-label">Email:</span> <span class="app-value">${app.email || ''}</span></div>
              <div class="app-row"><span class="app-label">Status:</span> <span class="app-value"><span class="app-status ${status}">${app.status || 'pending'}</span></span></div>
              <div class="app-row"><span class="app-label">Materials:</span> <span class="app-value">${app.materials || ''}</span></div>
              <div class="app-row"><span class="app-label">Colors:</span> <span class="app-value">${app.colors || ''}</span></div>
              <div class="app-row"><span class="app-label">Experience:</span> <span class="app-value">${app.bio || ''}</span></div>
              <div class="app-row"><span class="app-label">Printers:</span> <span class="app-value">${app.printers ? app.printers.length + ' printers' : ''}</span></div>
              <div class="app-row app-actions">
                <button class="accept-btn" onclick="acceptApplication('${app.id}')">Accept</button>
                <button class="deny-btn" onclick="denyApplication('${app.id}')">Deny</button>
                <button class="deny-btn" onclick="deleteApplication('${app.id}')">Delete</button>
              </div>
            </div>
          `;
        }).join('');
        history.innerHTML = historyApps.length === 0 ? '<div class="empty">No application history.</div>' : historyApps.map(app => {
          const status = (app.status || 'pending').toLowerCase();
          return `
            <div class="application-card ${status}">
              <div class="app-row"><span class="app-label">Date:</span> <span class="app-value">${formatDate(app.createdAt)}</span></div>
              <div class="app-row"><span class="app-label">Name:</span> <span class="app-value">${app.name || ''}</span></div>
              <div class="app-row"><span class="app-label">Email:</span> <span class="app-value">${app.email || ''}</span></div>
              <div class="app-row"><span class="app-label">Status:</span> <span class="app-value"><span class="app-status ${status}">${app.status || 'pending'}</span></span></div>
              <div class="app-row"><span class="app-label">Materials:</span> <span class="app-value">${app.materials || ''}</span></div>
              <div class="app-row"><span class="app-label">Colors:</span> <span class="app-value">${app.colors || ''}</span></div>
              <div class="app-row"><span class="app-label">Experience:</span> <span class="app-value">${app.bio || ''}</span></div>
              <div class="app-row"><span class="app-label">Printers:</span> <span class="app-value">${app.printers ? app.printers.length + ' printers' : ''}</span></div>
              <div class="app-row app-actions">
                <button class="accept-btn" onclick="acceptApplication('${app.id}')">Accept</button>
                <button class="deny-btn" onclick="denyApplication('${app.id}')">Deny</button>
                <button class="deny-btn" onclick="deleteApplication('${app.id}')">Delete</button>
              </div>
            </div>
          `;
        }).join('');
        // Toggle logic
        const toggleBtn = document.getElementById('toggle-history-btn');
        toggleBtn.onclick = function() {
          if (history.style.display === 'none') {
            history.style.display = 'block';
            toggleBtn.textContent = 'Hide Application History';
          } else {
            history.style.display = 'none';
            toggleBtn.textContent = 'Show Application History';
          }
        };
      })
      .catch((err) => {
        console.error('Error fetching applications:', err);
        document.getElementById('admin-applications-list').innerHTML = '<div class="error">Failed to load applications.</div>';
      });
  }
}); 