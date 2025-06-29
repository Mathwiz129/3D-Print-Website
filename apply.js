// Apply Page Dynamic Logic

document.addEventListener('DOMContentLoaded', function() {
  let isLoggedIn = false;
  const loginMsg = document.getElementById('login-required-message');
  const form = document.getElementById('printer-application-form');

  // Initialize Firebase auth when ready
  function initializeApplyAuth() {
    if (typeof FirebaseAuth === 'undefined') {
      console.error('Firebase not loaded. Make sure firebase-config.js is included.');
      return;
    }
    
    const { auth, onAuthStateChanged } = FirebaseAuth;
    onAuthStateChanged(auth, (user) => {
      if (!user) {
        isLoggedIn = false;
        if (loginMsg) loginMsg.style.display = 'block';
        if (form) {
          Array.from(form.elements).forEach(el => el.disabled = true);
        }
      } else {
        isLoggedIn = true;
        if (loginMsg) loginMsg.style.display = 'none';
        if (form) {
          Array.from(form.elements).forEach(el => el.disabled = false);
        }
        // Autofill name and email
        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');
        if (nameInput) {
          nameInput.value = user.displayName || user.email.split('@')[0];
          nameInput.readOnly = true;
          nameInput.style.background = '#f5f5f5';
        }
        if (emailInput) {
          emailInput.value = user.email;
          emailInput.readOnly = true;
          emailInput.style.background = '#f5f5f5';
        }
      }
    });
  }

  // Check if Firebase is already loaded
  if (typeof FirebaseAuth !== 'undefined') {
    initializeApplyAuth();
  } else {
    // Listen for Firebase ready event
    window.addEventListener('firebaseReady', initializeApplyAuth);
    window.addEventListener('firebaseError', (event) => {
      console.error('Firebase initialization failed:', event.detail);
    });
  }

  // If not logged in, flash message if user tries to type
  if (form) {
    form.addEventListener('input', function(e) {
      if (!isLoggedIn) {
        if (loginMsg) {
          loginMsg.style.display = 'block';
          loginMsg.classList.add('flash');
          setTimeout(() => loginMsg.classList.remove('flash'), 400);
        }
        e.preventDefault();
        e.target.value = '';
      }
    }, true);
  }

  // Printer Presets
  const PRINTERS = window.PRINTER_PRESETS || [];

  // Elements
  const printersList = document.getElementById('printers-list');
  const addPrinterBtn = document.getElementById('add-printer-btn');

  // Form submission handler
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Submitting...';
    submitBtn.disabled = true;

    try {
      // Collect form data
      const formData = {
        name: form.querySelector('#name').value,
        email: form.querySelector('#email').value,
        materials: form.querySelector('#materials').value,
        colors: form.querySelector('#colors').value,
        bio: form.querySelector('#bio').value || '',
        printers: [],
        submittedAt: new Date().toISOString(),
        status: 'pending'
      };

      // Collect printer data
      const printerEntries = document.querySelectorAll('.printer-entry');
      printerEntries.forEach(entry => {
        const modelSelect = entry.querySelector('select');
        const qtyInput = entry.querySelector('input[type="number"]');
        const bedSizeInput = entry.querySelector('input[placeholder="Bed Size (mm)"]');
        const materialsInput = entry.querySelector('input[placeholder="Materials"]');
        const speedInput = entry.querySelector('input[placeholder="Avg Speed (mm/s)"]');

        const printer = {
          model: modelSelect.value,
          modelName: modelSelect.options[modelSelect.selectedIndex].text,
          quantity: parseInt(qtyInput.value),
          bedSize: bedSizeInput.value,
          materials: materialsInput.value,
          speed: speedInput.value
        };
        formData.printers.push(printer);
      });

      // Send to backend API
      const response = await fetch('/api/submit-printer-application', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Show success message
      form.innerHTML = `
        <div class="success-message">
          <div class="success-icon">✓</div>
          <h2>Application Submitted Successfully!</h2>
          <p>Thank you for applying to be a printer on Outprint. Your application is now under review.</p>
          <p><strong>You should hear back within 2 business days.</strong></p>
          <p>We'll send you an email at <strong>${formData.email}</strong> with our decision.</p>
          <div class="application-details">
            <h3>Application Summary:</h3>
            <p><strong>Name:</strong> ${formData.name}</p>
            <p><strong>Printers:</strong> ${formData.printers.length} different models</p>
            <p><strong>Materials:</strong> ${formData.materials}</p>
            <p><strong>Colors:</strong> ${formData.colors}</p>
          </div>
        </div>
      `;

    } catch (error) {
      console.error('Error submitting application:', error);
      
      // Show error message
      const errorDiv = document.createElement('div');
      errorDiv.className = 'error-message';
      errorDiv.innerHTML = `
        <div class="error-icon">✗</div>
        <h3>Submission Failed</h3>
        <p>There was an error submitting your application. Please try again or contact support if the problem persists.</p>
        <button onclick="location.reload()">Try Again</button>
      `;
      form.appendChild(errorDiv);
    } finally {
      // Reset button
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  });

  // Printer entry logic
  let printerCount = 0;
  function renderPrinterEntry(printer = null) {
    printerCount++;
    const entry = document.createElement('div');
    entry.className = 'printer-entry';
    entry.dataset.index = printerCount;

    // Printer select
    const select = document.createElement('select');
    select.innerHTML = PRINTERS.map(p => `<option value="${p.id}">${p.brand} ${p.model}</option>`).join('');
    select.value = printer && printer.id ? printer.id : PRINTERS[0].id;

    // Quantity
    const qty = document.createElement('input');
    qty.type = 'number';
    qty.min = 1;
    qty.value = printer && printer.qty ? printer.qty : 1;
    qty.style.width = '60px';
    qty.placeholder = 'Qty';

    // Bed size
    const bedSize = document.createElement('input');
    bedSize.type = 'text';
    bedSize.readOnly = true;
    bedSize.placeholder = 'Bed Size (mm)';
    bedSize.style.width = '140px';

    // Supported materials
    const materials = document.createElement('input');
    materials.type = 'text';
    materials.readOnly = true;
    materials.placeholder = 'Materials';
    materials.style.width = '120px';

    // Avg speed
    const speed = document.createElement('input');
    speed.type = 'text';
    speed.readOnly = true;
    speed.placeholder = 'Avg Speed (mm/s)';
    speed.style.width = '90px';

    // Remove button
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'remove-printer-btn';
    removeBtn.innerHTML = '<span class="material-icons">delete</span>';
    removeBtn.onclick = () => entry.remove();

    // Update fields based on selected printer
    function updateFields() {
      const preset = PRINTERS.find(p => p.id === select.value);
      if (preset && preset.id !== 'custom') {
        bedSize.value = `${preset.bedSize.x} x ${preset.bedSize.y} x ${preset.bedSize.z}`;
        materials.value = preset.supportedMaterials.join(', ');
        speed.value = preset.avgSpeed ? `${preset.avgSpeed}` : '';
        bedSize.readOnly = true;
        materials.readOnly = true;
        speed.readOnly = true;
      } else {
        bedSize.value = '';
        materials.value = '';
        speed.value = '';
        bedSize.readOnly = false;
        materials.readOnly = false;
        speed.readOnly = false;
      }
    }
    select.onchange = updateFields;
    updateFields();

    // Labels
    const selectLabel = document.createElement('label');
    selectLabel.textContent = 'Model';
    const qtyLabel = document.createElement('label');
    qtyLabel.textContent = 'Qty';
    const bedLabel = document.createElement('label');
    bedLabel.textContent = 'Bed Size';
    const matLabel = document.createElement('label');
    matLabel.textContent = 'Materials';
    const speedLabel = document.createElement('label');
    speedLabel.textContent = 'Speed';

    // Layout
    function makeField(label, input) {
      const wrapper = document.createElement('div');
      wrapper.className = 'printer-field';
      wrapper.appendChild(label);
      wrapper.appendChild(input);
      return wrapper;
    }
    entry.appendChild(makeField(selectLabel, select));
    entry.appendChild(makeField(qtyLabel, qty));
    entry.appendChild(makeField(bedLabel, bedSize));
    entry.appendChild(makeField(matLabel, materials));
    entry.appendChild(makeField(speedLabel, speed));
    entry.appendChild(removeBtn);
    
    // Insert after the add button instead of at the end
    addPrinterBtn.parentNode.insertBefore(entry, addPrinterBtn.nextSibling);
  }

  // Add initial printer entry
  renderPrinterEntry();
  addPrinterBtn.onclick = function(e) {
    e.preventDefault();
    renderPrinterEntry();
  };
}); 