// Apply Page Dynamic Logic

document.addEventListener('DOMContentLoaded', function() {
  // Printer Presets
  const PRINTERS = window.PRINTER_PRESETS || [];

  // Elements
  const printersList = document.getElementById('printers-list');
  const addPrinterBtn = document.getElementById('add-printer-btn');
  const form = document.getElementById('printer-application-form');

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
    entry.appendChild(selectLabel); entry.appendChild(select);
    entry.appendChild(qtyLabel); entry.appendChild(qty);
    entry.appendChild(bedLabel); entry.appendChild(bedSize);
    entry.appendChild(matLabel); entry.appendChild(materials);
    entry.appendChild(speedLabel); entry.appendChild(speed);
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