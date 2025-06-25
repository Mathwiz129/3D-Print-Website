# Deploy to Render (Free Backend)

This guide will walk you through deploying your Node.js backend to Render's free tier.

## 🚀 Step 1: Prepare Your Code

1. **Choose Your Authentication Method**
   - **Option A**: Use Firebase (easier, no server needed)
   - **Option B**: Use Node.js backend (more control, deploy to Render)

2. **If using Node.js backend:**
   - Make sure you have `server.js`, `package.json`, and `auth-api.js`
   - Update `auth-api.js` with your Render URL once deployed

## 🔧 Step 2: Create Render Account

1. **Sign Up**
   - Go to [https://render.com](https://render.com)
   - Sign up with GitHub, GitLab, or email

2. **Connect Repository**
   - Connect your GitHub/GitLab account
   - Or use Render's direct deployment

## 📦 Step 3: Deploy to Render

### Method A: GitHub Integration (Recommended)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/outprint-3d-printing.git
   git push -u origin main
   ```

2. **Create Web Service on Render**
   - In Render dashboard, click "New +"
   - Select "Web Service"
   - Connect your GitHub repository
   - Choose the repository

3. **Configure Service**
   - **Name**: `outprint-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

4. **Environment Variables**
   - Click "Environment" tab
   - Add: `JWT_SECRET` = `your-super-secret-jwt-key-here`
   - Add: `NODE_ENV` = `production`

5. **Deploy**
   - Click "Create Web Service"
   - Render will automatically deploy your app

### Method B: Direct Deployment

1. **Upload Files**
   - In Render dashboard, click "New +"
   - Select "Web Service"
   - Choose "Deploy from existing code"
   - Upload your project files

2. **Configure as above**

## 🌐 Step 4: Update Your Frontend

1. **Get Your Render URL**
   - After deployment, Render gives you a URL like: `https://outprint-backend.onrender.com`

2. **Update API URL**
   - Open `auth-api.js`
   - Change the API_BASE_URL:
   ```javascript
   const API_BASE_URL = 'https://your-app-name.onrender.com/api';
   ```

3. **Update HTML Files**
   - In `login.html` and `signup.html`, replace:
   ```html
   <script src="auth.js"></script>
   ```
   with:
   ```html
   <script src="auth-api.js"></script>
   ```

## 🔒 Step 5: Security Setup

1. **Environment Variables**
   - In Render dashboard → Environment
   - Add: `JWT_SECRET` = `your-very-long-random-secret-key`
   - Add: `NODE_ENV` = `production`

2. **CORS Configuration**
   - Update `server.js` to allow your domain:
   ```javascript
   app.use(cors({
     origin: ['https://yourdomain.com', 'http://localhost:3000'],
     credentials: true
   }));
   ```

## 📊 Step 6: Test Your Deployment

1. **Check Health**
   - Visit your Render URL
   - Should see your website

2. **Test Authentication**
   - Try creating an account
   - Try logging in
   - Check if navigation updates

3. **Monitor Logs**
   - In Render dashboard → Logs
   - Check for any errors

## 💰 Free Tier Limits

**Render Free Tier:**
- 750 hours/month (about 31 days)
- Sleeps after 15 minutes of inactivity
- 512MB RAM
- Shared CPU
- Automatic deployments from Git

**Tips:**
- Free tier sleeps after inactivity
- First request after sleep takes 30-60 seconds
- Consider upgrading for production use

## 🔄 Step 7: Continuous Deployment

1. **Automatic Deployments**
   - Render automatically deploys when you push to GitHub
   - No manual deployment needed

2. **Custom Domain (Optional)**
   - In Render dashboard → Settings
   - Add custom domain
   - Update DNS records

## 🆘 Troubleshooting

### Common Issues:

1. **"Cannot find module" errors**
   - Check if `package.json` has all dependencies
   - Ensure `node_modules` is in `.gitignore`

2. **CORS errors**
   - Update CORS configuration in `server.js`
   - Add your frontend domain to allowed origins

3. **JWT errors**
   - Check if `JWT_SECRET` environment variable is set
   - Ensure secret is long and random

4. **Service not starting**
   - Check logs in Render dashboard
   - Verify start command is correct
   - Ensure port is set to `process.env.PORT`

### Debug Commands:

```bash
# Check if server starts locally
npm install
npm start

# Test API endpoints
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"test","password":"password123"}'
```

## 🎯 Next Steps

Once deployed, you can:

1. **Add Database**
   - Use MongoDB Atlas (free tier)
   - Or PostgreSQL on Render

2. **Add File Storage**
   - Use AWS S3 or similar
   - For STL file uploads

3. **Add Monitoring**
   - Set up error tracking
   - Monitor performance

4. **Scale Up**
   - Upgrade to paid plan when needed
   - Add more resources

## 📞 Support

- [Render Documentation](https://render.com/docs)
- [Render Community](https://community.render.com)
- [Node.js Documentation](https://nodejs.org/docs)

---

**Need Help?** Check the logs in your Render dashboard or reach out for support! 