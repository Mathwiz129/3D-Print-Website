const express = require('express');
const path = require('path');

const app = express();
const PORT = 8080;

// Serve static files
app.use(express.static(__dirname));

// Handle all routes by serving index.html (for SPA-like behavior)
app.get('*', (req, res) => {
    // Check if the request is for a specific HTML file
    if (req.path.endsWith('.html')) {
        res.sendFile(path.join(__dirname, req.path));
    } else {
        // For other routes, serve index.html
        res.sendFile(path.join(__dirname, 'index.html'));
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Development server running at http://localhost:${PORT}`);
    console.log(`📁 Serving files from: ${__dirname}`);
    console.log(`🔥 Firebase should now work properly!`);
    console.log(`\n📋 Available pages:`);
    console.log(`   - Home: http://localhost:${PORT}/`);
    console.log(`   - Login: http://localhost:${PORT}/login.html`);
    console.log(`   - Signup: http://localhost:${PORT}/signup.html`);
    console.log(`   - About: http://localhost:${PORT}/about.html`);
    console.log(`   - Apply: http://localhost:${PORT}/apply.html`);
    console.log(`   - Orders: http://localhost:${PORT}/orders.html`);
}); 