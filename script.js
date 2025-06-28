async function fetchData() {
  try {
    const response = await fetch('/api/sheets-data');
    const data = await response.json();

    if (data.printers && data.orders) {
      document.getElementById("printers").textContent = data.printers;
      document.getElementById("orders").textContent = data.orders;
    } else if (data.error) {
      console.error("Error fetching data:", data.error);
    }
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

if (document.getElementById("printers") && document.getElementById("orders")) {
  fetchData();
}