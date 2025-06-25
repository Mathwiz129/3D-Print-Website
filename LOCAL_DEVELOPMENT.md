# Local Development Setup

This guide will help you run your 3D printing website locally without CORS errors.

## 🚨 The Problem

When you open HTML files directly in your browser (using `file://` protocol), modern browsers block:
- ES6 modules (import/export)
- Fetch requests to local files
- Some JavaScript features for security

## ✅ The Solution

Run a local development server instead!

## 🚀 Quick Start

### Option 1: Using Node.js (Recommended)

1. **Install dependencies** (if you haven't already):
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm run dev-server
   ```

3. **Open your browser** and go to:
   ```
   http://localhost:8080
   ```

### Option 2: Using Python (if you have Python installed)

1. **Navigate to your project folder** in terminal/command prompt

2. **Start Python server**:
   ```bash
   # Python 3
   python -m http.server 8080
   
   # Python 2
   python -m SimpleHTTPServer 8080
   ```

3. **Open your browser** and go to:
   ```
   http://localhost:8080
   ```

### Option 3: Using Live Server (VS Code Extension)

1. **Install Live Server extension** in VS Code
2. **Right-click on `index.html`**
3. **Select "Open with Live Server"**

## 🔧 What This Fixes

✅ **Firebase modules** will load properly  
✅ **Navigation component** will work  
✅ **Authentication** will function  
✅ **No more CORS errors**  
✅ **Form submissions** will work  

## 📋 Available Pages

Once the server is running, you can access:

- **Home**: http://localhost:8080/
- **Login**: http://localhost:8080/login.html
- **Signup**: http://localhost:8080/signup.html
- **About**: http://localhost:8080/about.html
- **Apply**: http://localhost:8080/apply.html
- **Orders**: http://localhost:8080/orders.html

## 🧪 Testing Your Setup

1. **Start the server** using one of the methods above
2. **Go to** http://localhost:8080/login.html
3. **Try creating an account** with:
   - Email: test@example.com
   - Username: testuser
   - Password: password123
4. **Check the browser console** for any errors
5. **Verify Firebase is working** by checking the console logs

## 🔍 Troubleshooting

### "npm not found"
- Install Node.js from https://nodejs.org/
- Restart your terminal/command prompt

### "Port 8080 already in use"
- Try a different port: `npm run dev-server -- --port 3000`
- Or kill the process using port 8080

### "Firebase not loaded"
- Make sure you're using `http://localhost:8080` not `file://`
- Check that `firebase-config.js` is included in your HTML files
- Verify your Firebase config is correct

### "Cannot find module"
- Run `npm install` to install dependencies
- Make sure you're in the correct directory

## 🎯 Next Steps

Once your local development is working:

1. **Test authentication** - Create accounts and log in
2. **Test navigation** - Make sure all pages load
3. **Test forms** - Verify form submissions work
4. **Check Firebase console** - See if users are being created

## 📞 Need Help?

If you're still having issues:

1. **Check the browser console** (F12) for error messages
2. **Make sure you're using** `http://localhost:8080` not `file://`
3. **Verify Firebase config** is correct
4. **Try a different browser** (Chrome, Firefox, Edge)

---

**Remember**: Always use `http://localhost:8080` instead of opening files directly! 