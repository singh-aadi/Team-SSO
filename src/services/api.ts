// API Service for Backend Communication
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface Company {
  id: string;
  name: string;
  description: string;
  industry: string;
  stage: string;
  website?: string;
  founded_year?: number;
}

export interface DeckAnalysis {
  id: string;
  deck_id: string;
  sso_score: number;
  overall_feedback?: string;
  created_at: string;
  analysis: {
    overall: {
      problemScore: number;
      solutionScore: number;
      marketScore: number;
      tractionScore: number;
      teamScore: number;
      financialsScore: number;
      overallScore: number;
      strengths: string[];
      weaknesses: string[];
      keyInsights: string[];
      recommendation: string;
    };
    sections: Array<{
      sectionName: string;
      sectionScore: number;
      feedback: string;
      strengths: string[];
      improvements: string[];
    }>;
  };
}

export interface PitchDeck {
  id: string;
  company_id: string;
  company_name?: string;
  stage?: string;
  industry?: string;
  file_path: string;
  file_name: string;
  version?: string;
  uploaded_by: string;
  uploaded_at: string;
  analyzed_at?: string;
  sso_score?: number;
  status: 'pending' | 'processing' | 'analyzing' | 'completed' | 'analyzed' | 'failed';
  analysis?: DeckAnalysis;
}

class ApiService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('auth_token');
    return {
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  // Companies
  async getCompanies(): Promise<Company[]> {
    try {
      const response = await fetch(`${API_URL}/companies`, {
        headers: this.getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch companies');
      const data = await response.json();
      return data.companies || [];
    } catch (error) {
      console.error('Error fetching companies:', error);
      // Return fallback companies if backend is not available
      return this.getFallbackCompanies();
    }
  }

  private getFallbackCompanies(): Company[] {
    return [
      {
        id: '1',
        name: 'TechFlow AI',
        description: 'AI-powered workflow automation for enterprises',
        industry: 'Enterprise SaaS',
        stage: 'Series A',
        website: 'techflow.ai',
        founded_year: 2022
      },
      {
        id: '2',
        name: 'HealthMetrics',
        description: 'Predictive analytics for healthcare providers',
        industry: 'HealthTech',
        stage: 'Seed',
        website: 'healthmetrics.io',
        founded_year: 2023
      },
      {
        id: '3',
        name: 'GreenChain',
        description: 'Supply chain sustainability tracking',
        industry: 'ClimateeTech',
        stage: 'Pre-Seed',
        website: 'greenchain.com',
        founded_year: 2024
      },
      {
        id: '4',
        name: 'FinSync',
        description: 'Embedded finance for e-commerce platforms',
        industry: 'FinTech',
        stage: 'Series A',
        website: 'finsync.co',
        founded_year: 2021
      },
      {
        id: '5',
        name: 'EduConnect',
        description: 'Personalized learning platform for K-12',
        industry: 'EdTech',
        stage: 'Seed',
        website: 'educonnect.app',
        founded_year: 2023
      }
    ];
  }

  // Pitch Decks - DUAL PDF UPLOAD (Pitch Deck + Checklist)
  async uploadDualDeck(
    deckFile: File, 
    checklistFile: File, 
    companyId: string, 
    userId: string,
    additionalContext?: any,
    industry?: string,
    stage?: string
  ): Promise<PitchDeck> {
    console.log('📤 Uploading dual PDFs:', {
      deckName: deckFile.name,
      deckSize: deckFile.size,
      checklistName: checklistFile.name,
      checklistSize: checklistFile.size,
      companyId,
      userId,
      industry,
      stage,
      hasContext: !!additionalContext
    });

    const formData = new FormData();
    formData.append('deck', deckFile);
    formData.append('checklist', checklistFile);
    formData.append('company_id', companyId);
    formData.append('uploaded_by', userId);
    
    // Include industry and stage from frontend selection
    if (industry) {
      formData.append('industry', industry);
    }
    if (stage) {
      formData.append('stage', stage);
    }
    
    // Include additional context if provided
    if (additionalContext) {
      formData.append('additional_context', JSON.stringify(additionalContext));
      console.log('📝 Including additional context:', additionalContext);
    }

    try {
      const response = await fetch(`${API_URL}/decks/upload-dual`, {
        method: 'POST',
        // Don't set Content-Type header - let browser set it with boundary for multipart/form-data
        body: formData,
      });

      console.log('📡 Upload response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Upload failed:', errorText);
        let error;
        try {
          error = JSON.parse(errorText);
        } catch {
          error = { error: errorText };
        }
        throw new Error(error.error || 'Failed to upload decks');
      }

      const data = await response.json();
      console.log('✅ Upload successful:', data);
      
      // Map backend response to frontend interface
      const deck = data.deck;
      return {
        ...deck,
        status: deck.analysis_status || deck.status || 'pending',
        file_path: deck.file_url || deck.deck_file_path,
        file_name: deck.filename,
        uploaded_at: deck.created_at
      };
    } catch (error) {
      console.error('❌ Upload error:', error);
      throw error;
    }
  }

  // Single deck upload (backward compatibility)
  async uploadDeck(file: File, companyId: string, userId: string, version: string = '1.0'): Promise<PitchDeck> {
    const formData = new FormData();
    formData.append('deck', file);
    formData.append('company_id', companyId);
    formData.append('uploaded_by', userId);
    formData.append('version', version);

    const response = await fetch(`${API_URL}/decks/upload`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to upload deck');
    }

    const data = await response.json();
    return data.deck;
  }

  // Compare two pitch decks
  async compareDecks(deck1: File, deck2: File, userId: string): Promise<any> {
    console.log('📊 Comparing decks:', {
      deck1Name: deck1.name,
      deck1Size: deck1.size,
      deck2Name: deck2.name,
      deck2Size: deck2.size,
      userId
    });

    const formData = new FormData();
    formData.append('deck1', deck1);
    formData.append('deck2', deck2);
    formData.append('uploaded_by', userId);

    try {
      const response = await fetch(`${API_URL}/decks/compare`, {
        method: 'POST',
        body: formData,
      });

      console.log('📡 Comparison response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Comparison failed:', errorText);
        let error;
        try {
          error = JSON.parse(errorText);
        } catch {
          error = { error: errorText };
        }
        throw new Error(error.error || 'Failed to compare decks');
      }

      const data = await response.json();
      console.log('✅ Comparison successful:', data);
      return data;
    } catch (error) {
      console.error('❌ Comparison error:', error);
      throw error;
    }
  }

  // Get recent deck comparisons
  async getRecentComparisons(userId?: string, limit: number = 10): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      params.append('limit', limit.toString());

      const response = await fetch(`${API_URL}/decks/comparisons/recent?${params.toString()}`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        console.error('Failed to fetch recent comparisons');
        return [];
      }

      const data = await response.json();
      return data.comparisons || [];
    } catch (error) {
      console.error('Error fetching recent comparisons:', error);
      return [];
    }
  }

  // Get recent deck analyses (for founders)
  async getRecentAnalyses(userId?: string, limit: number = 10): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      params.append('limit', limit.toString());

      const response = await fetch(`${API_URL}/decks/recent-analyses?${params.toString()}`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        console.error('Failed to fetch recent analyses');
        return [];
      }

      const data = await response.json();
      return data.analyses || [];
    } catch (error) {
      console.error('Error fetching recent analyses:', error);
      return [];
    }
  }

  async getDeck(deckId: string): Promise<PitchDeck> {
    const response = await fetch(`${API_URL}/decks/${deckId}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) throw new Error('Failed to fetch deck');
    const data = await response.json();
    
    console.log('📥 Backend response:', {
      hasDeck: !!data.deck,
      analysis_status: data.deck?.analysis_status,
      status: data.deck?.status,
      hasAnalysis: !!data.deck?.analysis
    });
    
    // Map backend's analysis_status to frontend's status
    if (data.deck) {
      return {
        ...data.deck,
        status: data.deck.analysis_status || data.deck.status || 'pending',
        file_path: data.deck.file_url || data.deck.deck_file_path,
        file_name: data.deck.filename
      };
    }
    
    return data;
  }

  async getDecks(companyId?: string, status?: string): Promise<PitchDeck[]> {
    const params = new URLSearchParams();
    if (companyId) params.append('company_id', companyId);
    if (status) params.append('status', status);

    const response = await fetch(`${API_URL}/decks?${params.toString()}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) throw new Error('Failed to fetch decks');
    const data = await response.json();
    
    // Map backend field names to frontend expectations
    const decks = (data.decks || []).map((deck: any) => ({
      ...deck,
      status: deck.analysis_status || deck.status || 'pending',
      file_path: deck.file_url || deck.deck_file_path,
      file_name: deck.filename || deck.file_name
    }));
    
    return decks;
  }

  async analyzeDeck(deckId: string): Promise<DeckAnalysis> {
    const response = await fetch(`${API_URL}/decks/${deckId}/analyze`, {
      method: 'POST',
      headers: {
        ...this.getAuthHeaders(),
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to analyze deck');
    }

    return response.json();
  }

  async compareAnalyzedDecks(deck1Id: string, deck2Id: string, userId?: string): Promise<{ id: string; message: string; decks: any }> {
    const response = await fetch(`${API_URL}/decks/compare-analyzed`, {
      method: 'POST',
      headers: {
        ...this.getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        deck1_id: deck1Id,
        deck2_id: deck2Id,
        user_id: userId
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to compare analyzed decks');
    }

    return response.json();
  }

  async compareMixedDecks(analyzedDeckId: string, uploadedDeck: File, uploadedDeckPosition: 'deck1' | 'deck2', userId?: string): Promise<{ id: string; message: string; decks: any }> {
    const formData = new FormData();
    formData.append('uploadedDeck', uploadedDeck);
    formData.append('analyzedDeckId', analyzedDeckId);
    formData.append('uploadedDeckPosition', uploadedDeckPosition);
    if (userId) formData.append('user_id', userId);

    const response = await fetch(`${API_URL}/decks/compare-mixed`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to compare mixed decks');
    }

    return response.json();
  }

  // Health Check
  async healthCheck(): Promise<{ status: string; message: string }> {
    try {
      const response = await fetch(`${API_URL}/health`);
      if (!response.ok) throw new Error('Health check failed');
      return response.json();
    } catch (error) {
      console.error('Backend health check failed:', error);
      return { status: 'offline', message: 'Backend is not available' };
    }
  }
}

export const api = new ApiService();
