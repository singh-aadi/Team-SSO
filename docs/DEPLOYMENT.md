# Vercel Deployment Guide for Startup Scout & Optioneers

## 🚀 Quick Deployment Steps

### Method 1: Vercel CLI (Recommended)

1. **Install Vercel CLI globally:**
   ```bash
   npm install -g vercel
   ```

2. **Navigate to your project directory:**
   ```bash
   cd "d:\TeamSSO 2025\Team-SSO"
   ```

3. **Login to Vercel:**
   ```bash
   vercel login
   ```

4. **Deploy to Vercel:**
   ```bash
   vercel --prod
   ```

### Method 2: GitHub + Vercel Dashboard

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Vite configuration

## 🔧 Environment Variables Setup

After deployment, add these environment variables in Vercel dashboard:

### Production Environment Variables
```
VITE_GOOGLE_CLIENT_ID = 520480129735-0jbk8o94o55lhlin7u5jp3ei9gtdpf4f.apps.googleusercontent.com
```

## 🌐 Post-Deployment Steps

### 1. Update Google OAuth Settings
Once deployed, update your Google Cloud Console:

**Authorized JavaScript origins:**
```
https://your-app-name.vercel.app
```

**Authorized redirect URIs:**
```
https://your-app-name.vercel.app
https://your-app-name.vercel.app/login
```

### 2. Custom Domain (Optional)
- Add custom domain in Vercel dashboard
- Update OAuth settings with your custom domain

## 📁 Project Structure
```
├── src/
│   ├── components/
│   ├── pages/
│   ├── context/
│   └── App.tsx
├── public/
├── vercel.json
├── package.json
└── vite.config.ts
```

## ⚡ Build Command
```bash
npm run build
```

## 📦 Output Directory
```
dist/
```

## 🔄 Automatic Deployments
- Every push to `main` branch triggers auto-deployment
- Preview deployments for pull requests
- Branch deployments for feature branches

## 🐛 Troubleshooting

### Build Fails
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### OAuth Issues
- Check environment variables are set
- Verify OAuth URLs match deployment URL
- Ensure HTTPS is used in production

## 📊 Performance Optimization
- Vercel automatically optimizes static assets
- CDN distribution worldwide
- Automatic image optimization
- Edge functions ready

## 🎯 Next Steps After Deployment
1. Test all authentication flows
2. Verify all routes work correctly
3. Check mobile responsiveness
4. Monitor performance metrics
5. Set up analytics (optional)

---

**Deployment URL will be:** `https://startup-scout-optioneers.vercel.app`