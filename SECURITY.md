# Security Guidelines

Security best practices and guidelines for Team-SSO.

---

## Protected Files

The following files contain sensitive information and are excluded from version control:

### Environment Variables
- `.env` - Frontend environment variables
- `.env.local` - Local development overrides
- `server/.env` - Backend environment variables
- `server/.env.local` - Backend local overrides
- `.env.development` - Development-specific variables

### Service Account Keys
- `service-account-key.json` - Google Cloud service account credentials
- `server/service-account-key.json` - Backend service account credentials
- `**/service-account-key.json` - Any service account keys in subdirectories

**CRITICAL**: Never commit these files to version control. They are protected by `.gitignore`.

---

## Environment Variable Security

### Required Secrets

**Backend (server/.env)**:
```env
# Database credentials
DB_PASSWORD=<strong-password>
DATABASE_URL=postgresql://user:password@host:port/database

# API keys
GEMINI_API_KEY=<your-gemini-api-key>
JWT_SECRET=<random-32-char-string>

# OAuth credentials
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
NOTION_CLIENT_SECRET=<your-notion-client-secret>
```

**Frontend (.env)**:
```env
# Public variables only (VITE_ prefix is exposed to browser)
VITE_GOOGLE_CLIENT_ID=<your-google-client-id>
VITE_API_URL=http://localhost:3000/api
```

### Best Practices

1. **Never hardcode secrets** in source code
2. **Use environment variables** for all sensitive data
3. **Rotate credentials regularly** (every 90 days recommended)
4. **Use strong passwords** (minimum 16 characters, mixed case, numbers, symbols)
5. **Limit API key permissions** to only what's needed
6. **Use different credentials** for development and production

---

## Google Cloud Security

### Service Account Best Practices

1. **Principle of Least Privilege**: Grant only necessary permissions
2. **Separate service accounts** for different environments (dev, staging, prod)
3. **Key rotation**: Rotate service account keys every 90 days
4. **Key storage**: Store keys in Google Secret Manager (production) or local encrypted storage (development)

### Required IAM Roles

Minimum required roles for Team-SSO service account:
- `roles/cloudsql.client` - Database access
- `roles/secretmanager.secretAccessor` - Access secrets
- `roles/storage.objectAdmin` - File storage (if using GCS)

### Secret Manager

For production deployments, store secrets in Google Secret Manager:

```bash
# Store database password
echo -n "your-db-password" | gcloud secrets create db-password --data-file=-

# Store Gemini API key
echo -n "your-gemini-api-key" | gcloud secrets create gemini-api-key --data-file=-

# Store JWT secret
echo -n "your-jwt-secret" | gcloud secrets create jwt-secret --data-file=-
```

---

## Database Security

### Connection Security

1. **Use Cloud SQL Proxy** for secure connections
2. **Enable SSL** for direct connections
3. **Restrict IP access** to known IP addresses only
4. **Use strong passwords** for database users

### Data Protection

1. **Encryption at rest**: Enabled by default on Cloud SQL
2. **Encryption in transit**: Use SSL/TLS connections
3. **Regular backups**: Configure automated backups (daily recommended)
4. **Access logs**: Enable and monitor database access logs

---

## API Security

### Authentication

1. **Google OAuth 2.0** for user authentication
2. **JWT tokens** for session management
3. **Token expiration**: 7 days (configurable)
4. **Secure cookie flags**: HttpOnly, Secure, SameSite

### Authorization

1. **Role-based access control** (RBAC)
2. **Company-level data isolation**
3. **API endpoint protection** with middleware
4. **Rate limiting** to prevent abuse

### CORS Configuration

```javascript
// Allowed origins (server/src/index.ts)
const allowedOrigins = [
  'http://localhost:5173',
  'https://your-production-domain.com'
];
```

Update CORS settings for production deployments.

---

## File Upload Security

### Validation

1. **File type checking**: PDF, MP3, PPTX only
2. **File size limits**: Maximum 100MB
3. **Virus scanning**: Recommended for production
4. **File name sanitization**: Remove special characters

### Storage

1. **Temporary storage**: Files deleted after processing
2. **Secure file paths**: No direct user input in file paths
3. **Access control**: Files associated with company/user only

---

## Development Security

### Local Development

1. **Never commit `.env` files**
2. **Use `.env.example` templates** with placeholder values
3. **Don't share credentials** in chat, email, or documentation
4. **Use separate databases** for development and testing

### Code Security

1. **Dependency scanning**: Run `npm audit` regularly
2. **Security updates**: Keep dependencies up-to-date
3. **Code review**: Review all changes before merging
4. **Input validation**: Sanitize all user inputs
5. **SQL injection prevention**: Use parameterized queries

---

## Production Security Checklist

Before deploying to production:

- [ ] All secrets stored in Google Secret Manager
- [ ] Service account keys not committed to repository
- [ ] Environment variables configured in Cloud Run
- [ ] CORS settings updated with production domain
- [ ] Database password changed from default
- [ ] JWT secret is strong random string (32+ characters)
- [ ] SSL/TLS enabled for all connections
- [ ] Rate limiting configured
- [ ] Access logs enabled
- [ ] Backup strategy implemented
- [ ] Monitoring and alerting configured

---

## Incident Response

### If Credentials Are Compromised

1. **Immediately revoke** the compromised credentials
2. **Generate new credentials** in Google Cloud Console
3. **Update Secret Manager** with new values
4. **Redeploy application** with new credentials
5. **Audit access logs** for unauthorized access
6. **Notify users** if data was exposed

### Reporting Security Issues

If you discover a security vulnerability:
1. **Do not** open a public GitHub issue
2. Email security concerns to: [your-security-email]
3. Provide detailed description and steps to reproduce
4. Allow time for fix before public disclosure

---

## Compliance

### Data Privacy

1. **GDPR compliance**: If serving EU users
2. **Data retention policies**: Define and implement
3. **User data deletion**: Provide mechanism for users to delete data
4. **Privacy policy**: Maintain up-to-date privacy policy

### Audit Logging

Enable comprehensive logging for:
- User authentication attempts
- Data access and modifications
- API requests and responses
- Error conditions and exceptions

---

## Security Updates

**Last Security Review**: January 2026  
**Next Review**: April 2026

Regular security reviews should be conducted quarterly.

---

For questions or concerns, refer to the main [README.md](./README.md) or contact the security team.
