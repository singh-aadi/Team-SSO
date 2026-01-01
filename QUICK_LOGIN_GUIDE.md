# Quick Login Guide

Pre-configured test credentials for development and testing.

---

## Test Credentials

### VC Mode (Venture Capital)
```
Email: vc@startup-scout.com
Password: vc123
Role: VC (pre-configured)
```

**Access**: Deal flow analysis, portfolio tracking, investment metrics

### Founder Mode (Startup)
```
Email: founder@startup-scout.com
Password: founder123
Role: Founder (pre-configured)
```

**Access**: Pitch deck intelligence, fundraising tools, benchmark engine

---

## Google OAuth

Google Sign-In is available and defaults to **VC role**.

To use:
1. Click "Sign in with Google"
2. Select your Google account
3. Grant necessary permissions
4. Redirects to VC dashboard

---

## Switching Roles

To switch between VC and Founder mode:
1. Log out from sidebar
2. Log in with different credentials
3. Access dashboard with new role

---

## Authentication Flow

1. **Login** - Email/password or Google OAuth
2. **Role Assignment** - Automatic (no modal)
3. **Dashboard Redirect** - Role-specific interface
4. **Session Management** - JWT token stored in localStorage

---

## Troubleshooting

**Clear Browser State**:
1. Open DevTools (F12)
2. Application → Local Storage
3. Clear `user` and `auth_token` keys
4. Refresh and log in again

**Common Issues**:
- Stuck on login? Clear localStorage
- Role not loading? Check network tab for API errors
- OAuth redirect failing? Verify GOOGLE_CLIENT_ID in .env

---

For production deployment, configure OAuth credentials in Google Cloud Console.
See [docs/AUTHENTICATION_SETUP.md](./docs/AUTHENTICATION_SETUP.md) for details.
