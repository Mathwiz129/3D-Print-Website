# Setting Up Firebase Credentials on Render

## 🔑 Step 1: Get Firebase Service Account Key

1. **Go to Firebase Console**
   - Visit [https://console.firebase.google.com/](https://console.firebase.google.com/)
   - Select your project: `outprint-3d-printing`

2. **Generate Service Account Key**
   - Click the gear icon (⚙️) next to "Project Overview"
   - Select "Project settings"
   - Go to "Service accounts" tab
   - Click "Generate new private key"
   - Save the JSON file (e.g., `firebase-service-account.json`)

## 🌐 Step 2: Set Up Environment Variable on Render

1. **Go to Render Dashboard**
   - Visit [https://dashboard.render.com/](https://dashboard.render.com/)
   - Select your web service

2. **Add Environment Variable**
   - Click "Environment" tab
   - Add new environment variable:
     - **Key**: `GOOGLE_APPLICATION_CREDENTIALS`
     - **Value**: Copy the entire contents of your Firebase service account JSON file

3. **Alternative: Upload File**
   - If the JSON is too large for environment variable:
   - Upload the `firebase-service-account.json` file to your repository
   - Set the environment variable to the file path: `./firebase-service-account.json`

## 🔧 Step 3: Update Your Code

The app is already configured to use the environment variable. It will:

1. **Check for environment variable first** (for Render deployment)
2. **Fall back to local file** (for development)
3. **Use fallback materials** if neither is available

## 🧪 Step 4: Test the Setup

1. **Deploy to Render**
   - Push your changes to GitHub
   - Render will automatically redeploy

2. **Test Database Connection**
   - Visit: `https://your-app.onrender.com/test-db`
   - Should show database connection status and available materials

3. **Test Cost Calculation**
   - Try uploading an STL file and calculating cost
   - Should work without 500 errors

## 🆘 Troubleshooting

### Common Issues:

1. **"Database not connected" error**
   - Check if `GOOGLE_APPLICATION_CREDENTIALS` environment variable is set
   - Verify the JSON content is correct
   - Check Render logs for Firebase initialization errors

2. **"Permission denied" errors**
   - Ensure the service account has proper permissions
   - Check Firestore security rules

3. **"Material not found" errors**
   - The app will use fallback materials if database is unavailable
   - Check if materials exist in your Firestore database

### Debug Steps:

1. **Check Render Logs**
   - Go to Render dashboard → Logs
   - Look for Firebase initialization messages

2. **Test Database Endpoint**
   - Visit `/test-db` endpoint
   - Check the response for connection status

3. **Check Environment Variables**
   - In Render dashboard → Environment
   - Verify `GOOGLE_APPLICATION_CREDENTIALS` is set

## 📋 Fallback Materials

If Firebase is unavailable, the app uses these fallback materials:

- **PLA**: $0.05/g, 1.24 g/cm³
- **ABS**: $0.06/g, 1.04 g/cm³  
- **PETG**: $0.07/g, 1.27 g/cm³

## 🎯 Next Steps

Once Firebase is working:

1. **Add More Materials**
   - Use the admin panel to add materials
   - Or add them directly in Firestore

2. **Monitor Usage**
   - Check Firebase console for usage
   - Set up billing alerts if needed

3. **Improve Security**
   - Review Firestore security rules
   - Consider using Firebase App Check

---

**Need Help?** Check the Firebase documentation or Render support! 