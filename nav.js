// Navigation Component Loader
document.addEventListener('DOMContentLoaded', function() {
    // Create a placeholder for the navigation
    const navPlaceholder = document.getElementById('nav-placeholder');
    
    if (navPlaceholder) {
        // Load the navigation component
        fetch('nav.html')
            .then(response => response.text())
            .then(html => {
                // Insert the navigation HTML
                navPlaceholder.innerHTML = html;
                
                // Highlight the current page in navigation
                highlightCurrentPage();
            })
            .catch(error => {
                console.error('Error loading navigation:', error);
                // Fallback navigation if nav.html fails to load
                navPlaceholder.innerHTML = `
                    <nav class="main-nav">
                        <div class="nav-left">
                            <a href="index.html" class="logo">OUTPRINT</a>
                        </div>
                        <ul class="nav-center">
                            <li><a href="about.html">About</a></li>
                            <li><a href="apply.html">Join</a></li>
                            <li><a href="orders.html">Order</a></li>
                        </ul>
                        <div class="nav-right">
                            <a href="#"><i class="material-icons">search</i></a>
                            <a href="#"><i class="material-icons">account_circle</i></a>
                            <span class="username">name</span>
                        </div>
                    </nav>
                `;
                highlightCurrentPage();
            });
    }
});

// Function to highlight the current page in navigation
function highlightCurrentPage() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-center a');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage) {
            link.style.color = '#c55020'; // Darker orange for current page
            link.style.fontWeight = 'bold';
        }
    });
} 