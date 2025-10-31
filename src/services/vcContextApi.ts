// VC Context API Service
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface ContextItem {
  id: string;
  deck_id: string;
  file_name: string;
  file_type: string;
  upload_date: string;
  metadata: any;
  content_length: number;
  created_at: string;
}

export interface ContextSummary {
  id: string;
  deckId: string;
  executiveSummary: string;
  keyInsights: string[];
  opportunities: string[];
  risks: string[];
  teamAssessment: string;
  nextSteps: string[];
  recommendation: {
    decision: 'Proceed' | 'Pause' | 'Pass';
    confidence: number;
    rationale: string;
  };
  generatedAt: string;
}

export const vcContextApi = {
  /**
   * Upload a context file
   */
  async uploadContext(
    deckId: string,
    file: File,
    type: string = 'meeting-notes',
    metadata: any = {}
  ): Promise<{ success: boolean; item: ContextItem }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('deckId', deckId);
    formData.append('type', type);
    formData.append('metadata', JSON.stringify(metadata));

    const response = await fetch(`${API_URL}/vc-context/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || error.error || 'Upload failed');
    }

    return response.json();
  },

  /**
   * Get all context items for a deck
   */
  async getContextItems(deckId: string): Promise<{ success: boolean; items: ContextItem[] }> {
    const url = `${API_URL}/vc-context/${deckId}`;
    console.log('📡 Fetching context items from:', url);
    const response = await fetch(url);

    if (!response.ok) {
      console.error('❌ HTTP Error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('❌ Response body:', errorText);
      throw new Error(`Failed to fetch context items: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Received context items:', data);
    return data;
  },

  /**
   * Get a specific context item with full content
   */
  async getContextItem(contextId: string): Promise<{ success: boolean; item: any }> {
    const response = await fetch(`${API_URL}/vc-context/item/${contextId}`);

    if (!response.ok) {
      throw new Error('Failed to fetch context item');
    }

    return response.json();
  },

  /**
   * Generate AI summary from context items
   */
  async synthesizeContext(deckId: string): Promise<{ success: boolean; summary: ContextSummary }> {
    const response = await fetch(`${API_URL}/vc-context/synthesize/${deckId}`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || error.error || 'Synthesis failed');
    }

    return response.json();
  },

  /**
   * Get latest summary for a deck
   */
  async getLatestSummary(deckId: string): Promise<{ success: boolean; summary: ContextSummary }> {
    const response = await fetch(`${API_URL}/vc-context/summary/${deckId}`);

    if (!response.ok) {
      if (response.status === 404) {
        return { success: false, summary: null as any };
      }
      throw new Error('Failed to fetch summary');
    }

    return response.json();
  },

  /**
   * Delete a context item
   */
  async deleteContext(contextId: string): Promise<{ success: boolean }> {
    const response = await fetch(`${API_URL}/vc-context/${contextId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete context');
    }

    return response.json();
  },
};
