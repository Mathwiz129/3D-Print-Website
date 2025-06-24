document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById('costEstimator');
  const resultBox = document.getElementById('result');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const material = document.getElementById('material').value;
    const infill = parseFloat(document.getElementById('infill').value);
    const volume = parseFloat(document.getElementById('volume').value);

    try {
      const res = await fetch('http://localhost:5000/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ material, infill, volume })
      });

      const data = await res.json();
      resultBox.innerText = `Estimated Cost: $${data.cost}`;
    } catch (err) {
      resultBox.innerText = 'Error calculating cost. Please try again later.';
      console.error(err);
    }
  });
});