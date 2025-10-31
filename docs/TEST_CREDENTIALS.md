# Test Credentials for Development

## Email/Password Login Accounts

The following test accounts are available for development and testing purposes:

### 1. Demo User
- **Email:** `demo@startup-scout.com`
- **Password:** `demo123`
- **Name:** Demo User
- **Use Case:** General testing and demo purposes

### 2. Admin User
- **Email:** `admin@startup-scout.com`
- **Password:** `admin123`
- **Name:** Admin User
- **Use Case:** Admin features testing

### 3. VC Partner
- **Email:** `vc@startup-scout.com`
- **Password:** `vc123`
- **Name:** VC Partner
- **Use Case:** VC-specific workflow testing

## Google SSO

Google SSO login is still available and works alongside the email/password login.

## Security Note

⚠️ **IMPORTANT:** These are hardcoded test credentials for development only!

For production deployment:
1. Remove or disable the `testAccounts` array in `src/context/AuthContext.tsx`
2. Implement proper backend authentication with:
   - Password hashing (bcrypt)
   - JWT tokens
   - Database user storage
   - Rate limiting
   - Password reset functionality

## How to Use

1. Navigate to the login page
2. Enter any of the test email addresses above
3. Enter the corresponding password
4. Click "Sign in"
5. You'll be redirected to the dashboard

Alternatively, you can still use the Google Sign-In button for SSO authentication.
