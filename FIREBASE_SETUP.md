# Firebase Setup Guide for Outprint

This guide will walk you through setting up Firebase for your 3D printing website's authentication system.

## 🚀 Step 1: Create Firebase Project

1. **Go to Firebase Console**
   - Visit [https://console.firebase.google.com/](https://console.firebase.google.com/)
   - Sign in with your Google account

2. **Create New Project**
   - Click "Create a project"
   - Enter project name: `outprint-3d-printing`
   - Choose whether to enable Google Analytics (optional)
   - Click "Create project"

## 🔧 Step 2: Enable Authentication

1. **Navigate to Authentication**
   - In the Firebase console, click "Authentication" in the left sidebar
   - Click "Get started"

2. **Enable Email/Password Sign-in**
   - Click on the "Sign-in method" tab
   - Click "Email/Password"
   - Toggle "Enable" to ON
   - Click "Save"

## 📊 Step 3: Set Up Firestore Database

1. **Create Firestore Database**
   - Click "Firestore Database" in the left sidebar
   - Click "Create database"
   - Choose "Start in test mode" (for development)
   - Select a location close to your users
   - Click "Done"

2. **Set Up Security Rules**
   - In Firestore, click the "Rules" tab
   - Replace the rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read and write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow authenticated users to read other user profiles (for search)
    match /users/{userId} {
      allow read: if request.auth != null;
    }
    
    // Orders collection
    match /orders/{orderId} {
      allow read, write: if request.auth != null;
    }
    
    // Printer applications
    match /applications/{applicationId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 🔑 Step 4: Get Your Firebase Config

1. **Add Web App**
   - Click the gear icon (⚙️) next to "Project Overview"
   - Select "Project settings"
   - Scroll down to "Your apps" section
   - Click the web icon (</>)
   - Enter app nickname: `outprint-web`
   - Click "Register app"

2. **Copy Configuration**
   - Firebase will show you a configuration object
   - Copy the `firebaseConfig` object

3. **Update Your Code**
   - Open `firebase-config.js` in your project
   - Replace the placeholder config with your actual config:

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

## 🌐 Step 5: Configure Authentication Settings

1. **Authorized Domains**
   - In Authentication → Settings → Authorized domains
   - Add your domain (e.g., `yourdomain.com`)
   - For local development, `localhost` is already included

2. **Email Templates (Optional)**
   - In Authentication → Templates
   - Customize email verification and password reset templates
   - Add your logo and branding

## 📱 Step 6: Test Your Setup

1. **Local Testing**
   - Open your website locally
   - Try to create a new account
   - Check the Firebase console to see if users are created
   - Verify authentication works

2. **Check Firestore**
   - In Firebase console → Firestore Database
   - You should see a `users` collection with user documents

## 🔒 Step 7: Security Best Practices

1. **Environment Variables (Production)**
   - Don't commit your Firebase config to public repositories
   - Use environment variables in production
   - Consider using Firebase App Check for additional security

2. **Rate Limiting**
   - Firebase has built-in rate limiting
   - Monitor usage in the Firebase console

## 📈 Step 8: Monitor Usage

1. **Free Tier Limits**
   - Authentication: 10,000 users/month
   - Firestore: 50,000 reads/day, 20,000 writes/day
   - Storage: 1GB

2. **Monitoring**
   - Check usage in Firebase console
   - Set up billing alerts if needed

## 🚀 Step 9: Deploy

1. **Hosting (Optional)**
   - Firebase offers free hosting
   - Install Firebase CLI: `npm install -g firebase-tools`
   - Initialize: `firebase init hosting`
   - Deploy: `firebase deploy`

## 🆘 Troubleshooting

### Common Issues:

1. **"Firebase not loaded" error**
   - Check if `firebase-config.js` is included in your HTML
   - Verify the script tag has `type="module"`

2. **Authentication not working**
   - Check browser console for errors
   - Verify Firebase config is correct
   - Ensure Email/Password auth is enabled

3. **Database permission errors**
   - Check Firestore security rules
   - Verify user is authenticated before database operations

### Support:
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Community](https://firebase.google.com/community)

## 🎯 Next Steps

Once Firebase is set up, you can:

1. **Add User Profiles**
   - Create profile pages for users
   - Allow users to edit their information

2. **Implement Order System**
   - Store orders in Firestore
   - Track order status

3. **Add Printer Applications**
   - Store printer applications in Firestore
   - Admin approval system

4. **Real-time Features**
   - Use Firestore real-time listeners
   - Live order updates

5. **File Storage**
   - Use Firebase Storage for STL files
   - Secure file uploads

---

**Need Help?** Check the Firebase documentation or reach out for support! 