// API Service for Backend Communication
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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
  file_path: string;
  file_name: string;
  version?: string;
  uploaded_by: string;
  uploaded_at: string;
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
      const response = await fetch(`${API_URL}/api/companies`, {
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
    userId: string
  ): Promise<PitchDeck> {
    console.log('📤 Uploading dual PDFs:', {
      deckName: deckFile.name,
      deckSize: deckFile.size,
      checklistName: checklistFile.name,
      checklistSize: checklistFile.size,
      companyId,
      userId
    });

    const formData = new FormData();
    formData.append('deck', deckFile);
    formData.append('checklist', checklistFile);
    formData.append('company_id', companyId);
    formData.append('uploaded_by', userId);

    try {
      const response = await fetch(`${API_URL}/api/decks/upload-dual`, {
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

    const response = await fetch(`${API_URL}/api/decks/upload`, {
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

  async getDeck(deckId: string): Promise<PitchDeck> {
    const response = await fetch(`${API_URL}/api/decks/${deckId}`, {
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

    const response = await fetch(`${API_URL}/api/decks?${params.toString()}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) throw new Error('Failed to fetch decks');
    const data = await response.json();
    return data.decks || [];
  }

  async analyzeDeck(deckId: string): Promise<DeckAnalysis> {
    const response = await fetch(`${API_URL}/api/decks/${deckId}/analyze`, {
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
