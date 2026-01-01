# Notion Integration Setup Guide

## Prerequisites

You need to create a Notion Integration to get the OAuth credentials.

## Step 1: Create Notion Integration

1. Go to https://www.notion.so/my-integrations
2. Click "+ New integration"
3. Fill in the details:
   - **Name**: Team SSO VC Context
   - **Associated workspace**: Select your workspace
   - **Logo**: Optional
4. Under "Capabilities", ensure these are checked:
   - ✅ Read content
   - ✅ Read user information including email addresses
5. Click "Submit"

## Step 2: Configure OAuth

1. In your integration settings, go to "Distribution" → "Public integration"
2. Click "Manage distribution"
3. Fill in OAuth configuration:
   - **Redirect URIs**:
     - Development: `http://localhost:3001/notion-callback.html`
     - Production: `https://your-domain.com/notion-callback.html`
   - **Organization**: Optional

## Step 3: Get Credentials

1. Copy the **OAuth client ID**
2. Copy the **OAuth client secret**

## Step 4: Add to Environment Variables

### Backend (.env in /server directory)

```bash
# Notion Integration
NOTION_CLIENT_ID=your_notion_client_id_here
NOTION_CLIENT_SECRET=your_notion_client_secret_here
NOTION_REDIRECT_URI=http://localhost:3001/notion-callback.html  # or production URL
```

### Frontend (.env in root directory)

```bash
# API URL (should already be set)
VITE_API_URL=http://localhost:3000/api
```

## Step 5: Install Dependencies

```bash
cd server
npm install @notionhq/client
```

## Step 6: Test the Integration

1. Start the backend server: `cd server && npm run dev`
2. Start the frontend: `npm run dev`
3. Navigate to VC Context Manager
4. Click "Notion" integration button
5. Authorize the integration in Notion
6. Search and import pages

## How It Works

1. **OAuth Flow**:
   - User clicks "Connect Notion"
   - Opens Notion OAuth window
   - User authorizes in their workspace
   - Notion redirects to callback URL with code
   - Backend exchanges code for access token

2. **Data Access**:
   - Search pages and databases
   - Read page content (title, blocks, properties)
   - Convert to VC context format

3. **Import**:
   - Select pages to import
   - Content extracted and formatted
   - Stored in vc_context table
   - Used in pitch deck analysis

## Scopes Required

The integration requires these Notion API permissions:
- `read:content` - Read page and database content
- `read:user` - Read user information

## Security Notes

- Access tokens are stored temporarily in component state (not persisted)
- Tokens are sent via POST body (not in URL)
- Backend validates all requests
- Users must explicitly authorize each time

## Troubleshooting

### "Invalid client_id"
- Check NOTION_CLIENT_ID in .env matches integration settings
- Ensure no extra spaces or quotes

### "Redirect URI mismatch"
- Verify NOTION_REDIRECT_URI matches exactly what's configured in Notion
- Include the full path including `/notion-callback.html`

### "Cannot read pages"
- User must share pages/databases with the integration
- In Notion, go to page → Share → Invite your integration

### "CORS error"
- Ensure frontend URL is in CORS allowed origins
- Check browser console for specific origin

## API Endpoints

- `GET /api/notion/auth/url` - Get OAuth URL
- `POST /api/notion/auth/callback` - Exchange code for token
- `POST /api/notion/search` - Search pages/databases
- `GET /api/notion/page/:pageId` - Get page content
- `POST /api/notion/import` - Import pages as context

## Example Usage

```typescript
// 1. Get auth URL
const { authUrl } = await fetch('/api/notion/auth/url').then(r => r.json());

// 2. User authorizes, get code back

// 3. Exchange for token
const { accessToken } = await fetch('/api/notion/auth/callback', {
  method: 'POST',
  body: JSON.stringify({ code })
}).then(r => r.json());

// 4. Search pages
const { pages } = await fetch('/api/notion/search', {
  method: 'POST',
  body: JSON.stringify({ 
    accessToken,
    filters: { query: 'pitch deck' }
  })
}).then(r => r.json());

// 5. Import selected pages
await fetch('/api/notion/import', {
  method: 'POST',
  body: JSON.stringify({
    accessToken,
    pageIds: ['page-id-1', 'page-id-2'],
    importance: 'high'
  })
});
```

## References

- [Notion API Documentation](https://developers.notion.com/)
- [Notion OAuth Guide](https://developers.notion.com/docs/authorization)
- [Notion SDK for JavaScript](https://github.com/makenotion/notion-sdk-js)
