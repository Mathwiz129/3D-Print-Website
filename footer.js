// Footer Component Loader

document.addEventListener('DOMContentLoaded', function() {
  const footerPlaceholder = document.getElementById('footer-placeholder');
  if (footerPlaceholder) {
    fetch('footer.html')
      .then(response => response.text())
      .then(html => {
        footerPlaceholder.innerHTML = html;
      })
      .catch(error => {
        console.error('Error loading footer:', error);
        // Fallback footer
        footerPlaceholder.innerHTML = `
          <footer class="footer">
            <div class="footer-content page-container">
              <div class="footer-left">
                <span class="footer-logo">OUTPRINT</span>
                <span class="footer-copyright">&copy; 2024 Outprint 3D Printing Network. All rights reserved.</span>
              </div>
              <div class="footer-links">
                <a href="about.html">About</a>
                <a href="apply.html">Join</a>
                <a href="orders.html">Order</a>
                <a href="account.html">Account</a>
              </div>
            </div>
          </footer>
        `;
      });
  }
}); 