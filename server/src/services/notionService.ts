/**
 * Notion Service for VC Context Import
 * 
 * Handles Notion OAuth and page/database fetching for importing as VC context
 */

import { Client } from '@notionhq/client';

// Notion OAuth configuration
const NOTION_AUTH_URL = 'https://api.notion.com/v1/oauth/authorize';
const NOTION_TOKEN_URL = 'https://api.notion.com/v1/oauth/token';

export interface NotionPage {
  id: string;
  title: string;
  url: string;
  createdTime: string;
  lastEditedTime: string;
  icon?: string;
  cover?: string;
  content: string; // Full text content
  blocks: NotionBlock[];
}

export interface NotionBlock {
  id: string;
  type: string;
  content: string;
  hasChildren: boolean;
}

export interface NotionDatabase {
  id: string;
  title: string;
  description: string;
  url: string;
  icon?: string;
  cover?: string;
}

export interface NotionSearchFilters {
  query?: string;
  filter?: 'page' | 'database';
  sort?: {
    direction: 'ascending' | 'descending';
    timestamp: 'last_edited_time';
  };
  pageSize?: number;
}

class NotionService {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private notionClient: Client | null = null;

  constructor() {
    this.clientId = process.env.NOTION_CLIENT_ID || '';
    this.clientSecret = process.env.NOTION_CLIENT_SECRET || '';
    this.redirectUri = process.env.NOTION_REDIRECT_URI || 
      (process.env.NODE_ENV === 'production' 
        ? 'https://team-sso-frontend-u7tvbw2hpq-uc.a.run.app/notion-callback.html'
        : 'http://localhost:3001/notion-callback.html');
  }

  /**
   * Generate OAuth URL for Notion access
   */
  getAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      owner: 'user',
      redirect_uri: this.redirectUri
    });

    return `${NOTION_AUTH_URL}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  async getTokens(code: string): Promise<{ access_token: string; workspace_name?: string; workspace_icon?: string }> {
    const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    
    const response = await fetch(NOTION_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.redirectUri
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Notion OAuth failed: ${error.error || 'Unknown error'}`);
    }

    const data = await response.json();
    
    return {
      access_token: data.access_token,
      workspace_name: data.workspace_name,
      workspace_icon: data.workspace_icon
    };
  }

  /**
   * Set credentials for API calls
   */
  setCredentials(accessToken: string): void {
    this.notionClient = new Client({
      auth: accessToken,
      notionVersion: '2022-06-28' // Use stable API version
    });
  }

  /**
   * Search pages and databases
   */
  async search(filters: NotionSearchFilters = {}): Promise<{ pages: NotionPage[]; databases: NotionDatabase[] }> {
    if (!this.notionClient) {
      throw new Error('Notion client not initialized. Call setCredentials first.');
    }

    try {
      console.log(`🔍 Searching Notion with filters:`, filters);

      const searchParams: any = {
        page_size: filters.pageSize || 20
      };

      if (filters.query) {
        searchParams.query = filters.query;
      }

      if (filters.filter) {
        searchParams.filter = { property: 'object', value: filters.filter };
      }

      if (filters.sort) {
        searchParams.sort = filters.sort;
      }

      const response = await this.notionClient.search(searchParams);

      const pages: NotionPage[] = [];
      const databases: NotionDatabase[] = [];

      for (const result of response.results) {
        if (result.object === 'page') {
          const page = await this.parsePage(result);
          pages.push(page);
        } else if (result.object === 'database') {
          databases.push(this.parseDatabase(result));
        }
      }

      console.log(`✅ Found ${pages.length} pages and ${databases.length} databases`);

      return { pages, databases };
    } catch (error: any) {
      console.error('Error searching Notion:', error);
      throw error;
    }
  }

  /**
   * Get a specific page with full content
   */
  async getPage(pageId: string): Promise<NotionPage> {
    if (!this.notionClient) {
      throw new Error('Notion client not initialized. Call setCredentials first.');
    }

    try {
      const page = await this.notionClient.pages.retrieve({ page_id: pageId });
      return await this.parsePage(page);
    } catch (error: any) {
      console.error(`Error fetching Notion page ${pageId}:`, error);
      throw error;
    }
  }

  /**
   * Get page content (all blocks)
   */
  async getPageContent(pageId: string): Promise<NotionBlock[]> {
    if (!this.notionClient) {
      throw new Error('Notion client not initialized. Call setCredentials first.');
    }

    try {
      const blocks: NotionBlock[] = [];
      let cursor: string | undefined = undefined;

      // Paginate through all blocks
      do {
        const response: any = await this.notionClient.blocks.children.list({
          block_id: pageId,
          start_cursor: cursor,
          page_size: 100
        });

        for (const block of response.results) {
          blocks.push(this.parseBlock(block));
        }

        cursor = response.has_more ? response.next_cursor : undefined;
      } while (cursor);

      return blocks;
    } catch (error: any) {
      console.error(`Error fetching page content for ${pageId}:`, error);
      throw error;
    }
  }

  /**
   * Parse Notion page object
   */
  private async parsePage(page: any): Promise<NotionPage> {
    const pageId = page.id;
    
    // Extract title from properties
    let title = 'Untitled';
    if (page.properties) {
      const titleProp = Object.values(page.properties).find((prop: any) => prop.type === 'title');
      if (titleProp && Array.isArray((titleProp as any).title) && (titleProp as any).title.length > 0) {
        title = (titleProp as any).title[0].plain_text;
      }
    }

    // Get full content
    const blocks = await this.getPageContent(pageId);
    const content = blocks.map(b => b.content).join('\n');

    return {
      id: pageId,
      title,
      url: page.url || '',
      createdTime: page.created_time || '',
      lastEditedTime: page.last_edited_time || '',
      icon: this.extractIcon(page.icon),
      cover: this.extractCover(page.cover),
      content,
      blocks
    };
  }

  /**
   * Parse Notion database object
   */
  private parseDatabase(database: any): NotionDatabase {
    let title = 'Untitled Database';
    if (database.title && Array.isArray(database.title) && database.title.length > 0) {
      title = database.title[0].plain_text;
    }

    let description = '';
    if (database.description && Array.isArray(database.description) && database.description.length > 0) {
      description = database.description.map((d: any) => d.plain_text).join('');
    }

    return {
      id: database.id,
      title,
      description,
      url: database.url || '',
      icon: this.extractIcon(database.icon),
      cover: this.extractCover(database.cover)
    };
  }

  /**
   * Parse Notion block to extract text content
   */
  private parseBlock(block: any): NotionBlock {
    let content = '';
    const blockType = block.type;

    // Extract text based on block type
    if (block[blockType] && block[blockType].rich_text) {
      content = block[blockType].rich_text
        .map((text: any) => text.plain_text)
        .join('');
    } else if (blockType === 'code' && block.code?.rich_text) {
      content = block.code.rich_text
        .map((text: any) => text.plain_text)
        .join('');
    } else if (blockType === 'equation' && block.equation?.expression) {
      content = block.equation.expression;
    } else if (blockType === 'bookmark' && block.bookmark?.url) {
      content = block.bookmark.url;
    } else if (blockType === 'image' && block.image?.file?.url) {
      content = `[Image: ${block.image.file.url}]`;
    }

    return {
      id: block.id,
      type: blockType,
      content,
      hasChildren: block.has_children || false
    };
  }

  /**
   * Extract icon URL
   */
  private extractIcon(icon: any): string | undefined {
    if (!icon) return undefined;
    if (icon.type === 'emoji') return icon.emoji;
    if (icon.type === 'external') return icon.external?.url;
    if (icon.type === 'file') return icon.file?.url;
    return undefined;
  }

  /**
   * Extract cover URL
   */
  private extractCover(cover: any): string | undefined {
    if (!cover) return undefined;
    if (cover.type === 'external') return cover.external?.url;
    if (cover.type === 'file') return cover.file?.url;
    return undefined;
  }

  /**
   * Convert Notion page to VC context format
   */
  pageToContext(page: NotionPage): {
    type: string;
    content: string;
    metadata: Record<string, any>;
  } {
    const contextParts = [
      `Title: ${page.title}`,
      `URL: ${page.url}`,
      `Last Edited: ${new Date(page.lastEditedTime).toLocaleDateString()}`,
      '',
      page.content
    ];

    return {
      type: 'notion_page',
      content: contextParts.join('\n'),
      metadata: {
        pageId: page.id,
        title: page.title,
        url: page.url,
        createdTime: page.createdTime,
        lastEditedTime: page.lastEditedTime,
        blockCount: page.blocks.length,
        source: 'notion'
      }
    };
  }

  /**
   * Query database pages
   */
  async queryDatabase(databaseId: string, filters?: any): Promise<NotionPage[]> {
    if (!this.notionClient) {
      throw new Error('Notion client not initialized. Call setCredentials first.');
    }

    try {
      console.log(`📊 Querying Notion database: ${databaseId}`);

      const response: any = await this.notionClient.databases.query({
        database_id: databaseId,
        filter: filters,
        page_size: 100
      });

      const pages: NotionPage[] = [];
      for (const result of response.results) {
        const page = await this.parsePage(result);
        pages.push(page);
      }

      console.log(`✅ Found ${pages.length} pages in database`);
      return pages;
    } catch (error: any) {
      console.error('Error querying database:', error);
      throw error;
    }
  }
}

export const notionService = new NotionService();
export default notionService;
