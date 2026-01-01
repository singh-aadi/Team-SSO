/**
 * Notion API Routes for VC Context Import
 * 
 * Handles Notion OAuth flow and page/database import endpoints
 */

import { Router, Request, Response } from 'express';
import notionService, { NotionSearchFilters } from '../services/notionService';

const router = Router();

/**
 * GET /api/notion/auth/url
 * Get Notion OAuth URL for connecting Notion workspace
 */
router.get('/auth/url', (req: Request, res: Response) => {
  try {
    const authUrl = notionService.getAuthUrl();
    res.json({ 
      success: true, 
      authUrl,
      message: 'Redirect user to this URL to authorize Notion access'
    });
  } catch (error: any) {
    console.error('Error generating Notion auth URL:', error);
    res.status(500).json({ error: 'Failed to generate auth URL', details: error.message });
  }
});

/**
 * POST /api/notion/auth/callback
 * OAuth callback - exchange code for tokens
 */
router.post('/auth/callback', async (req: Request, res: Response) => {
  const { code } = req.body;
  
  if (!code) {
    return res.status(400).json({ error: 'Authorization code is required' });
  }

  try {
    const tokens = await notionService.getTokens(code as string);
    
    console.log(`✅ Notion OAuth tokens obtained for workspace: ${tokens.workspace_name}`);
    
    res.json({
      success: true,
      accessToken: tokens.access_token,
      workspaceName: tokens.workspace_name,
      workspaceIcon: tokens.workspace_icon,
      message: 'Notion connected successfully'
    });
  } catch (error: any) {
    console.error('Error exchanging Notion code:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to exchange authorization code', 
      details: error.message 
    });
  }
});

/**
 * POST /api/notion/search
 * Search pages and databases with access token in body
 */
router.post('/search', async (req: Request, res: Response) => {
  const { accessToken, filters } = req.body;
  
  if (!accessToken) {
    return res.status(401).json({ error: 'Access token is required', needsAuth: true });
  }

  try {
    notionService.setCredentials(accessToken);
    const searchFilters: NotionSearchFilters = filters || {};
    const results = await notionService.search(searchFilters);
    
    // Return preview-friendly format
    const pagePreviews = results.pages.map(page => ({
      id: page.id,
      title: page.title,
      url: page.url,
      icon: page.icon,
      lastEditedTime: page.lastEditedTime,
      snippet: page.content.substring(0, 200) // First 200 chars as preview
    }));

    const databasePreviews = results.databases.map(db => ({
      id: db.id,
      title: db.title,
      description: db.description,
      url: db.url,
      icon: db.icon
    }));
    
    res.json({ 
      success: true, 
      pages: pagePreviews,
      databases: databasePreviews,
      totalPages: results.pages.length,
      totalDatabases: results.databases.length
    });
  } catch (error: any) {
    console.error('Error searching Notion:', error);
    res.status(500).json({ error: 'Failed to search Notion', details: error.message });
  }
});

/**
 * GET /api/notion/page/:pageId
 * Get full page content
 */
router.get('/page/:pageId', async (req: Request, res: Response) => {
  const { pageId } = req.params;
  const accessToken = req.headers.authorization?.replace('Bearer ', '');
  
  if (!accessToken) {
    return res.status(401).json({ error: 'Access token is required', needsAuth: true });
  }

  try {
    notionService.setCredentials(accessToken);
    const page = await notionService.getPage(pageId);
    
    res.json({ success: true, page });
  } catch (error: any) {
    console.error('Error fetching Notion page:', error);
    res.status(500).json({ error: 'Failed to fetch page', details: error.message });
  }
});

/**
 * POST /api/notion/database/:databaseId/query
 * Query database pages
 */
router.post('/database/:databaseId/query', async (req: Request, res: Response) => {
  const { databaseId } = req.params;
  const { accessToken, filters } = req.body;
  
  if (!accessToken) {
    return res.status(401).json({ error: 'Access token is required', needsAuth: true });
  }

  try {
    notionService.setCredentials(accessToken);
    const pages = await notionService.queryDatabase(databaseId, filters);
    
    // Return preview format
    const pagePreviews = pages.map(page => ({
      id: page.id,
      title: page.title,
      url: page.url,
      icon: page.icon,
      lastEditedTime: page.lastEditedTime,
      snippet: page.content.substring(0, 200)
    }));
    
    res.json({ 
      success: true, 
      pages: pagePreviews,
      count: pages.length
    });
  } catch (error: any) {
    console.error('Error querying Notion database:', error);
    res.status(500).json({ error: 'Failed to query database', details: error.message });
  }
});

/**
 * POST /api/notion/import
 * Import selected pages as VC context
 */
router.post('/import', async (req: Request, res: Response) => {
  const { accessToken, pageIds, importance = 'medium' } = req.body;
  
  if (!accessToken) {
    return res.status(401).json({ error: 'Access token is required', needsAuth: true });
  }

  if (!pageIds || !Array.isArray(pageIds) || pageIds.length === 0) {
    return res.status(400).json({ error: 'pageIds array is required' });
  }

  try {
    notionService.setCredentials(accessToken);
    
    const contextItems = [];
    
    for (const pageId of pageIds) {
      const page = await notionService.getPage(pageId);
      
      // Format as context item
      const contextItem = {
        source: `Notion Page: ${page.title}`,
        content: `Title: ${page.title}\nURL: ${page.url}\nLast Edited: ${new Date(page.lastEditedTime).toLocaleDateString()}\n\n${page.content}`,
        importance,
        metadata: {
          pageId: page.id,
          url: page.url,
          source: 'notion'
        }
      };
      
      contextItems.push(contextItem);
    }
    
    console.log(`✅ Prepared ${contextItems.length} Notion pages for import`);
    
    res.json({ 
      success: true, 
      contextItems,
      message: `Prepared ${contextItems.length} pages for import`
    });
  } catch (error: any) {
    console.error('Error importing Notion pages:', error);
    res.status(500).json({ error: 'Failed to import pages', details: error.message });
  }
});

export default router;
