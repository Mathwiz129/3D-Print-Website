const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting local development server...');
console.log('📁 Working directory:', process.cwd());

// Start Flask development server
const flaskProcess = spawn('python', ['app.py'], {
    stdio: 'inherit',
    env: {
        ...process.env,
        FLASK_ENV: 'development',
        FLASK_DEBUG: '1',
        PORT: '5000'
    }
});

flaskProcess.on('error', (error) => {
    console.error('❌ Failed to start Flask server:', error.message);
    console.log('💡 Make sure you have Python and the required packages installed:');
    console.log('   pip install -r requirements.txt');
    process.exit(1);
});

flaskProcess.on('close', (code) => {
    console.log(`\n🔚 Flask server exited with code ${code}`);
    process.exit(code);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down development server...');
    flaskProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down development server...');
    flaskProcess.kill('SIGTERM');
}); 