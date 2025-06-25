const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, './')));

// In-memory storage (replace with database in production)
let users = [];
let orders = [];
let applications = [];

// JWT Secret (use environment variable in production)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// Routes

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Authentication Routes
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { email, username, password } = req.body;

        // Validation
        if (!email || !username || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Check if user already exists
        const existingUser = users.find(u => u.email === email || u.username === username);
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = {
            id: Date.now().toString(),
            email,
            username,
            password: hashedPassword,
            createdAt: new Date(),
            role: 'customer'
        };

        users.push(user);

        // Create JWT token
        const token = jwt.sign(
            { userId: user.id, email: user.email, username: user.username },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;

        res.status(201).json({
            message: 'User created successfully',
            user: userWithoutPassword,
            token
        });

    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user
        const user = users.find(u => u.email === email);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Create JWT token
        const token = jwt.sign(
            { userId: user.id, email: user.email, username: user.username },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;

        res.json({
            message: 'Login successful',
            user: userWithoutPassword,
            token
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// User Routes
app.get('/api/user/profile', authenticateToken, (req, res) => {
    const user = users.find(u => u.id === req.user.userId);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
});

app.put('/api/user/profile', authenticateToken, (req, res) => {
    try {
        const { displayName, bio, location, phone } = req.body;
        const userIndex = users.findIndex(u => u.id === req.user.userId);

        if (userIndex === -1) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Update user profile
        users[userIndex] = {
            ...users[userIndex],
            profile: {
                displayName: displayName || users[userIndex].profile?.displayName || users[userIndex].username,
                bio: bio || users[userIndex].profile?.bio || '',
                location: location || users[userIndex].profile?.location || '',
                phone: phone || users[userIndex].profile?.phone || ''
            }
        };

        const { password: _, ...userWithoutPassword } = users[userIndex];
        res.json(userWithoutPassword);

    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Order Routes
app.post('/api/orders', authenticateToken, (req, res) => {
    try {
        const { parts, totalPrice, shippingAddress } = req.body;

        const order = {
            id: Date.now().toString(),
            userId: req.user.userId,
            parts,
            totalPrice,
            shippingAddress,
            status: 'pending',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        orders.push(order);
        res.status(201).json(order);

    } catch (error) {
        console.error('Order creation error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/orders', authenticateToken, (req, res) => {
    const userOrders = orders.filter(order => order.userId === req.user.userId);
    res.json(userOrders);
});

app.get('/api/orders/:id', authenticateToken, (req, res) => {
    const order = orders.find(o => o.id === req.params.id && o.userId === req.user.userId);
    if (!order) {
        return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
});

// Application Routes
app.post('/api/applications', authenticateToken, (req, res) => {
    try {
        const { printerInfo, experience, materials, availability } = req.body;

        const application = {
            id: Date.now().toString(),
            userId: req.user.userId,
            printerInfo,
            experience,
            materials,
            availability,
            status: 'pending',
            createdAt: new Date()
        };

        applications.push(application);
        res.status(201).json(application);

    } catch (error) {
        console.error('Application creation error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/applications', authenticateToken, (req, res) => {
    const userApplications = applications.filter(app => app.userId === req.user.userId);
    res.json(userApplications);
});

// Admin Routes (for future use)
app.get('/api/admin/stats', authenticateToken, (req, res) => {
    // Check if user is admin (you can add admin role later)
    const stats = {
        totalUsers: users.length,
        totalOrders: orders.length,
        totalApplications: applications.length,
        pendingOrders: orders.filter(o => o.status === 'pending').length,
        pendingApplications: applications.filter(a => a.status === 'pending').length
    };
    res.json(stats);
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} to view your app`);
}); 