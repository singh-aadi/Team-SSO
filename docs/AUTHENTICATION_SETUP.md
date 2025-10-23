# 🔐 Authentication System - Setup Guide

## ✅ Authentication Fully Restored!

Your authentication system has been **completely restored** on the `auth-restore` branch with full Google OAuth integration.

---

## 🚀 **Quick Setup (Required)**

### 1. **Environment Variables**
Create a `.env` file in your project root:

```bash
# Copy the example file
cp .env.example .env
```

Then edit `.env` and add your Google Client ID:
```env
VITE_GOOGLE_CLIENT_ID=your_actual_google_client_id_here
```

### 2. **Google Cloud Console Setup**

#### Step A: Create OAuth Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Google+ API** (or Identity API)
4. Navigate to **APIs & Services** → **Credentials**
5. Click **Create Credentials** → **OAuth 2.0 Client ID**

#### Step B: Configure OAuth Client
- **Application Type**: Web application
- **Name**: Startup Scout & Optioneers
- **Authorized JavaScript origins**:
  - `http://localhost:3001` (development)
  - `https://yourdomain.com` (production)
- **Authorized redirect URIs**:
  - `http://localhost:3001` (development)
  - `https://yourdomain.com` (production)

#### Step C: OAuth Consent Screen
- **App name**: Startup Scout & Optioneers
- **User support email**: your-email@domain.com
- **Developer email**: your-email@domain.com
- **App domain**: your-domain.com (optional)
- **Scopes**: email, profile, openid

---

## 🔧 **What's Been Restored**

### ✅ **App.tsx**
- Google OAuth Provider wrapper
- Authentication context provider
- Protected route wrapper
- Login page routing

### ✅ **LandingPage.tsx**
- Full marketing page with VC-focused content
- "Sign In" and "Get Started" buttons
- Professional gradient design
- Feature showcase grid

### ✅ **Sidebar.tsx**
- Authentication context integration
- "Sign Out" button with logout functionality
- User session management

### ✅ **Authentication Flow**
```
Landing Page → Sign In → Google OAuth → Dashboard
                ↓
            Protected Routes
```

---

## 🌐 **Branch Information**

- **Current Branch**: `auth-restore`
- **Demo Branch**: `main` (auth disabled)
- **Status**: Ready for production with Google OAuth

### Switch Between Branches:
```bash
# Demo version (no auth)
git checkout main

# Full auth version
git checkout auth-restore
```

---

## 🧪 **Testing the Authentication**

### Without Google Client ID:
```bash
npm run dev
# → Landing page will show but login will fail
```

### With Valid Google Client ID:
```bash
# 1. Add VITE_GOOGLE_CLIENT_ID to .env
# 2. Run development server
npm run dev
# → Full authentication flow will work
```

---

## 🚨 **Important Notes**

### **Google OAuth Requirements:**
- ✅ **HTTPS required** for production (Vercel provides this)
- ✅ **Domain verification** may be required for production
- ✅ **OAuth consent screen** must be configured
- ✅ **Scopes** should include: email, profile, openid

### **Development vs Production:**
- **Development**: Works with `http://localhost:3001`
- **Production**: Requires HTTPS domain in OAuth settings

### **Security Best Practices:**
- ✅ Never commit `.env` file to git
- ✅ Use different Client IDs for dev/prod
- ✅ Regularly rotate OAuth credentials
- ✅ Monitor OAuth usage in Google Console

---

## 🔄 **Next Steps**

1. **Setup Google OAuth** (follow steps above)
2. **Test locally** with your Client ID
3. **Deploy to production** with production OAuth settings
4. **Configure domain** in Google Cloud Console

---

## 📞 **Need Help?**

If you need assistance with:
- Google Cloud Console setup
- OAuth configuration
- Environment variables
- Production deployment

Just let me know and I'll help you through each step! 🚀