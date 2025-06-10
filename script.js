async function fetchData() {
  const sheetID = "1H6XhzxP4rr6gXOBdhGBhIory9gBKWudl2FD7p8cdgrU";
  const apiKey = "AIzaSyBhJmoT7U_-R_ewsOs2E0uTqC_1IXIbQC0";
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetID}/values/A2:B2?alt=json&key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.values && data.values[0]) {
      document.getElementById("printers").textContent = data.values[0][0];
      document.getElementById("orders").textContent = data.values[0][1];
    }
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

if (document.getElementById("printers") && document.getElementById("orders")) {
  fetchData();
}