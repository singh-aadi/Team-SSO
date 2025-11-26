/**
 * Gmail API Routes for VC Context Import
 * 
 * Handles Gmail OAuth flow and email import endpoints
 */

import { Router, Request, Response } from 'express';
import gmailService, { EmailSearchFilters } from '../services/gmailService';
import { query } from '../db';

const router = Router();

// Store tokens temporarily (in production, store securely per user)
const userTokens: Map<string, { access_token: string; refresh_token?: string }> = new Map();

/**
 * GET /api/gmail/auth/url
 * Get Gmail OAuth URL for connecting Gmail account
 */
router.get('/auth/url', (req: Request, res: Response) => {
  try {
    const authUrl = gmailService.getAuthUrl();
    res.json({ 
      success: true, 
      authUrl,
      message: 'Redirect user to this URL to authorize Gmail access'
    });
  } catch (error: any) {
    console.error('Error generating Gmail auth URL:', error);
    res.status(500).json({ error: 'Failed to generate auth URL', details: error.message });
  }
});

/**
 * POST /api/gmail/auth/callback
 * OAuth callback - exchange code for tokens
 */
router.post('/auth/callback', async (req: Request, res: Response) => {
  const { code } = req.body;
  
  if (!code) {
    return res.status(400).json({ error: 'Authorization code is required' });
  }

  try {
    const tokens = await gmailService.getTokens(code as string);
    
    // Return tokens to frontend
    console.log(`✅ Gmail OAuth tokens obtained`);
    
    res.json({
      success: true,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      message: 'Gmail connected successfully'
    });
  } catch (error: any) {
    console.error('Error exchanging Gmail code:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to exchange authorization code', 
      details: error.message 
    });
  }
});

/**
 * GET /api/gmail/status/:userId
 * Check if Gmail is connected for a user
 */
router.get('/status/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  const connected = userTokens.has(userId) || userTokens.has('default');
  
  res.json({
    connected,
    message: connected ? 'Gmail is connected' : 'Gmail is not connected'
  });
});

/**
 * POST /api/gmail/disconnect/:userId
 * Disconnect Gmail for a user
 */
router.post('/disconnect/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  userTokens.delete(userId);
  userTokens.delete('default');
  
  res.json({ success: true, message: 'Gmail disconnected' });
});

/**
 * POST /api/gmail/search
 * Search emails with access token in body
 */
router.post('/search', async (req: Request, res: Response) => {
  const { accessToken, filters } = req.body;
  
  if (!accessToken) {
    return res.status(401).json({ error: 'Access token is required', needsAuth: true });
  }

  try {
    gmailService.setCredentials({ access_token: accessToken });
    const emails = await gmailService.searchEmails(filters || {});
    
    // Return preview-friendly format
    const previews = emails.map(email => ({
      id: email.id,
      threadId: email.threadId,
      subject: email.subject,
      from: email.from,
      date: email.date,
      snippet: email.snippet,
      labels: email.labels,
      hasAttachments: email.attachments?.length > 0 || false,
      attachmentCount: email.attachments?.length || 0
    }));
    
    res.json({ 
      success: true, 
      count: emails.length,
      emails: previews 
    });
  } catch (error: any) {
    console.error('Error searching emails:', error);
    res.status(500).json({ error: 'Failed to search emails', details: error.message });
  }
});

/**
 * GET /api/gmail/email/:emailId
 * Get full email content
 */
router.get('/email/:emailId', async (req: Request, res: Response) => {
  const { emailId } = req.params;
  const accessToken = req.headers.authorization?.replace('Bearer ', '');
  
  if (!accessToken) {
    return res.status(401).json({ error: 'Access token is required', needsAuth: true });
  }

  try {
    gmailService.setCredentials({ access_token: accessToken });
    const email = await gmailService.getEmail(emailId);
    
    res.json({ success: true, email });
  } catch (error: any) {
    console.error('Error fetching email:', error);
    res.status(500).json({ error: 'Failed to fetch email', details: error.message });
  }
});

/**
 * POST /api/gmail/import
 * Import selected emails as VC context
 */
router.post('/import', async (req: Request, res: Response) => {
  const { accessToken, emailIds, importance = 'medium' } = req.body;
  
  if (!accessToken) {
    return res.status(401).json({ error: 'Access token is required', needsAuth: true });
  }

  if (!emailIds || !Array.isArray(emailIds) || emailIds.length === 0) {
    return res.status(400).json({ error: 'emailIds array is required' });
  }

  try {
    gmailService.setCredentials({ access_token: accessToken });
    
    const contextItems = [];
    
    for (const emailId of emailIds) {
      const email = await gmailService.getEmail(emailId);
      
      // Format as context item
      const contextItem = {
        source: `Email: ${email.subject} (from ${email.from})`,
        content: `Subject: ${email.subject}\nFrom: ${email.from}\nDate: ${email.date}\n\n${email.body}`,
        importance
      };
      
      contextItems.push(contextItem);
    }
    
    console.log(`✅ Prepared ${contextItems.length} emails for import`);
    
    res.json({ 
      success: true, 
      contextItems,
      message: `Prepared ${contextItems.length} emails for import`
    });
  } catch (error: any) {
    console.error('Error importing emails:', error);
    res.status(500).json({ error: 'Failed to import emails', details: error.message });
  }
});

/**
 * GET /api/gmail/labels/:userId
 * Get Gmail labels for filtering
 */
router.get('/labels/:userId', async (req: Request, res: Response) => {
  const { userId } = req.params;
  
  const tokens = userTokens.get(userId) || userTokens.get('default');
  if (!tokens) {
    return res.status(401).json({ error: 'Gmail not connected', needsAuth: true });
  }

  try {
    gmailService.setCredentials(tokens);
    const labels = await gmailService.getLabels();
    
    res.json({ success: true, labels });
  } catch (error: any) {
    console.error('Error fetching Gmail labels:', error);
    res.status(500).json({ error: 'Failed to fetch labels', details: error.message });
  }
});

/**
 * POST /api/gmail/search/:userId
 * Search emails with filters
 */
router.post('/search/:userId', async (req: Request, res: Response) => {
  const { userId } = req.params;
  const filters: EmailSearchFilters = req.body;
  
  const tokens = userTokens.get(userId) || userTokens.get('default');
  if (!tokens) {
    return res.status(401).json({ error: 'Gmail not connected', needsAuth: true });
  }

  try {
    gmailService.setCredentials(tokens);
    const emails = await gmailService.searchEmails(filters);
    
    // Return preview-friendly format
    const previews = emails.map(email => ({
      id: email.id,
      threadId: email.threadId,
      subject: email.subject,
      from: email.from,
      date: email.date,
      snippet: email.snippet,
      labels: email.labels,
      hasAttachments: email.attachments.length > 0,
      attachmentCount: email.attachments.length
    }));
    
    res.json({ 
      success: true, 
      count: emails.length,
      emails: previews 
    });
  } catch (error: any) {
    console.error('Error searching emails:', error);
    res.status(500).json({ error: 'Failed to search emails', details: error.message });
  }
});

/**
 * GET /api/gmail/email/:userId/:emailId
 * Get full email content
 */
router.get('/email/:userId/:emailId', async (req: Request, res: Response) => {
  const { userId, emailId } = req.params;
  
  const tokens = userTokens.get(userId) || userTokens.get('default');
  if (!tokens) {
    return res.status(401).json({ error: 'Gmail not connected', needsAuth: true });
  }

  try {
    gmailService.setCredentials(tokens);
    const email = await gmailService.getEmail(emailId);
    
    res.json({ success: true, email });
  } catch (error: any) {
    console.error('Error fetching email:', error);
    res.status(500).json({ error: 'Failed to fetch email', details: error.message });
  }
});

/**
 * POST /api/gmail/import/:userId
 * Import selected emails as VC context
 */
router.post('/import/:userId', async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { emailIds, deckId } = req.body;
  
  if (!emailIds || !Array.isArray(emailIds) || emailIds.length === 0) {
    return res.status(400).json({ error: 'emailIds array is required' });
  }

  const tokens = userTokens.get(userId) || userTokens.get('default');
  if (!tokens) {
    return res.status(401).json({ error: 'Gmail not connected', needsAuth: true });
  }

  try {
    gmailService.setCredentials(tokens);
    
    const importedItems = [];
    const targetDeckId = deckId || '00000000-0000-0000-0000-000000000002'; // Default global VC context
    
    for (const emailId of emailIds) {
      try {
        // Fetch full email
        const email = await gmailService.getEmail(emailId);
        
        // Convert to context format
        const contextData = gmailService.emailToContext(email);
        
        // Save to database
        const result = await query(
          `INSERT INTO vc_context (deck_id, user_id, content_type, content, metadata, source_type, source_name)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id, content_type, created_at`,
          [
            targetDeckId,
            userId,
            'email',
            contextData.content,
            JSON.stringify(contextData.metadata),
            'gmail',
            `Email: ${email.subject.substring(0, 50)}...`
          ]
        );
        
        importedItems.push({
          id: result.rows[0].id,
          emailId: email.id,
          subject: email.subject,
          from: email.from,
          importedAt: result.rows[0].created_at
        });
        
        console.log(`📧 Imported email: ${email.subject}`);
      } catch (err: any) {
        console.error(`Failed to import email ${emailId}:`, err);
      }
    }
    
    res.json({
      success: true,
      message: `Imported ${importedItems.length} of ${emailIds.length} emails`,
      imported: importedItems
    });
  } catch (error: any) {
    console.error('Error importing emails:', error);
    res.status(500).json({ error: 'Failed to import emails', details: error.message });
  }
});

/**
 * POST /api/gmail/quick-import/:userId
 * Quick import - search and import in one step
 */
router.post('/quick-import/:userId', async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { filters, deckId, maxEmails = 10 } = req.body;
  
  const tokens = userTokens.get(userId) || userTokens.get('default');
  if (!tokens) {
    return res.status(401).json({ error: 'Gmail not connected', needsAuth: true });
  }

  try {
    gmailService.setCredentials(tokens);
    
    // Search emails
    const searchFilters: EmailSearchFilters = {
      ...filters,
      maxResults: maxEmails
    };
    const emails = await gmailService.searchEmails(searchFilters);
    
    if (emails.length === 0) {
      return res.json({
        success: true,
        message: 'No matching emails found',
        imported: []
      });
    }

    // Import all found emails
    const importedItems = [];
    const targetDeckId = deckId || '00000000-0000-0000-0000-000000000002';
    
    for (const email of emails) {
      try {
        const contextData = gmailService.emailToContext(email);
        
        const result = await query(
          `INSERT INTO vc_context (deck_id, user_id, content_type, content, metadata, source_type, source_name)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id, created_at`,
          [
            targetDeckId,
            userId,
            'email',
            contextData.content,
            JSON.stringify(contextData.metadata),
            'gmail',
            `Email: ${email.subject.substring(0, 50)}...`
          ]
        );
        
        importedItems.push({
          id: result.rows[0].id,
          emailId: email.id,
          subject: email.subject,
          from: email.from
        });
      } catch (err: any) {
        console.error(`Failed to import email ${email.id}:`, err);
      }
    }
    
    res.json({
      success: true,
      message: `Found ${emails.length} emails, imported ${importedItems.length}`,
      imported: importedItems
    });
  } catch (error: any) {
    console.error('Error in quick import:', error);
    res.status(500).json({ error: 'Failed to quick import', details: error.message });
  }
});

export default router;
