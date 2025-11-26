/**
 * Gmail Service for VC Context Import
 * 
 * Handles Gmail OAuth and email fetching for importing emails as VC context
 */

import { google, gmail_v1 } from 'googleapis';

// Gmail OAuth configuration
const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.labels'
];

export interface EmailMessage {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  snippet: string;
  body: string;
  labels: string[];
  attachments: Array<{
    filename: string;
    mimeType: string;
    size: number;
  }>;
}

export interface EmailSearchFilters {
  query?: string;           // General search query
  subject?: string;         // Subject contains
  from?: string;           // From email address
  to?: string;             // To email address
  after?: string;          // After date (YYYY/MM/DD)
  before?: string;         // Before date (YYYY/MM/DD)
  hasAttachment?: boolean; // Has attachment
  label?: string;          // Gmail label
  maxResults?: number;     // Max results to return
}

export interface GmailLabel {
  id: string;
  name: string;
  type: string;
  messagesTotal?: number;
  messagesUnread?: number;
}

class GmailService {
  private oauth2Client: any;

  constructor() {
    // Initialize OAuth2 client
    // Redirect URI should point to the frontend callback page
    const redirectUri = process.env.GMAIL_REDIRECT_URI || 
      (process.env.NODE_ENV === 'production' 
        ? 'https://team-sso-frontend-u7tvbw2hpq-uc.a.run.app/gmail-callback.html'
        : 'http://localhost:3001/gmail-callback.html');
        
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );
  }

  /**
   * Generate OAuth URL for Gmail access
   */
  getAuthUrl(): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: GMAIL_SCOPES,
      prompt: 'consent'
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async getTokens(code: string): Promise<{ access_token: string; refresh_token?: string }> {
    const { tokens } = await this.oauth2Client.getToken(code);
    return tokens;
  }

  /**
   * Set credentials for API calls
   */
  setCredentials(tokens: { access_token: string; refresh_token?: string }): void {
    this.oauth2Client.setCredentials(tokens);
  }

  /**
   * Get Gmail client instance
   */
  private getGmailClient(): gmail_v1.Gmail {
    return google.gmail({ version: 'v1', auth: this.oauth2Client });
  }

  /**
   * Build Gmail search query from filters
   */
  private buildSearchQuery(filters: EmailSearchFilters): string {
    const queryParts: string[] = [];

    if (filters.query) {
      queryParts.push(filters.query);
    }
    if (filters.subject) {
      queryParts.push(`subject:${filters.subject}`);
    }
    if (filters.from) {
      queryParts.push(`from:${filters.from}`);
    }
    if (filters.to) {
      queryParts.push(`to:${filters.to}`);
    }
    if (filters.after) {
      queryParts.push(`after:${filters.after}`);
    }
    if (filters.before) {
      queryParts.push(`before:${filters.before}`);
    }
    if (filters.hasAttachment) {
      queryParts.push('has:attachment');
    }
    if (filters.label) {
      queryParts.push(`label:${filters.label}`);
    }

    return queryParts.join(' ');
  }

  /**
   * Get user's Gmail labels
   */
  async getLabels(): Promise<GmailLabel[]> {
    const gmail = this.getGmailClient();
    
    try {
      const response = await gmail.users.labels.list({ userId: 'me' });
      const labels = response.data.labels || [];
      
      return labels.map(label => ({
        id: label.id || '',
        name: label.name || '',
        type: label.type || 'user',
        messagesTotal: label.messagesTotal || 0,
        messagesUnread: label.messagesUnread || 0
      }));
    } catch (error) {
      console.error('Error fetching Gmail labels:', error);
      throw error;
    }
  }

  /**
   * Search emails with filters
   */
  async searchEmails(filters: EmailSearchFilters): Promise<EmailMessage[]> {
    const gmail = this.getGmailClient();
    const query = this.buildSearchQuery(filters);
    const maxResults = filters.maxResults || 20;

    try {
      console.log(`📧 Searching Gmail with query: ${query}`);
      
      // Search for messages
      const listResponse = await gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults
      });

      const messageIds = listResponse.data.messages || [];
      console.log(`📧 Found ${messageIds.length} matching emails`);

      // Fetch full message details
      const messages: EmailMessage[] = [];
      
      for (const msg of messageIds) {
        if (!msg.id) continue;
        
        try {
          const messageResponse = await gmail.users.messages.get({
            userId: 'me',
            id: msg.id,
            format: 'full'
          });
          
          const email = this.parseMessage(messageResponse.data);
          messages.push(email);
        } catch (err) {
          console.error(`Error fetching message ${msg.id}:`, err);
        }
      }

      return messages;
    } catch (error) {
      console.error('Error searching emails:', error);
      throw error;
    }
  }

  /**
   * Get a single email by ID
   */
  async getEmail(messageId: string): Promise<EmailMessage> {
    const gmail = this.getGmailClient();

    const response = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full'
    });

    return this.parseMessage(response.data);
  }

  /**
   * Parse Gmail message into our EmailMessage format
   */
  private parseMessage(message: gmail_v1.Schema$Message): EmailMessage {
    const headers = message.payload?.headers || [];
    
    const getHeader = (name: string): string => {
      const header = headers.find(h => h.name?.toLowerCase() === name.toLowerCase());
      return header?.value || '';
    };

    // Extract body
    let body = '';
    const payload = message.payload;
    
    if (payload?.body?.data) {
      body = Buffer.from(payload.body.data, 'base64').toString('utf-8');
    } else if (payload?.parts) {
      // Handle multipart messages
      for (const part of payload.parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          body = Buffer.from(part.body.data, 'base64').toString('utf-8');
          break;
        } else if (part.mimeType === 'text/html' && part.body?.data && !body) {
          // Fallback to HTML if no plain text
          const htmlBody = Buffer.from(part.body.data, 'base64').toString('utf-8');
          // Strip HTML tags for context
          body = htmlBody.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        }
      }
    }

    // Extract attachments info
    const attachments: Array<{ filename: string; mimeType: string; size: number }> = [];
    if (payload?.parts) {
      for (const part of payload.parts) {
        if (part.filename && part.filename.length > 0) {
          attachments.push({
            filename: part.filename,
            mimeType: part.mimeType || 'application/octet-stream',
            size: part.body?.size || 0
          });
        }
      }
    }

    return {
      id: message.id || '',
      threadId: message.threadId || '',
      subject: getHeader('Subject'),
      from: getHeader('From'),
      to: getHeader('To'),
      date: getHeader('Date'),
      snippet: message.snippet || '',
      body,
      labels: message.labelIds || [],
      attachments
    };
  }

  /**
   * Convert email to VC context format
   */
  emailToContext(email: EmailMessage): {
    type: string;
    content: string;
    metadata: Record<string, any>;
  } {
    // Build rich context from email
    const contextParts = [
      `Subject: ${email.subject}`,
      `From: ${email.from}`,
      `Date: ${email.date}`,
      '',
      email.body
    ];

    if (email.attachments.length > 0) {
      contextParts.push('');
      contextParts.push(`Attachments: ${email.attachments.map(a => a.filename).join(', ')}`);
    }

    return {
      type: 'email',
      content: contextParts.join('\n'),
      metadata: {
        emailId: email.id,
        threadId: email.threadId,
        subject: email.subject,
        from: email.from,
        to: email.to,
        date: email.date,
        labels: email.labels,
        hasAttachments: email.attachments.length > 0,
        attachmentCount: email.attachments.length,
        source: 'gmail'
      }
    };
  }
}

export const gmailService = new GmailService();
export default gmailService;
