import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type GeminiModel = 
  | 'gemini-2.0-flash'
  | 'gemini-2.5-flash'
  | 'gemini-2.5-pro'
  | 'gemini-3-pro-preview';

interface GeminiModelContextType {
  selectedModel: GeminiModel;
  setSelectedModel: (model: GeminiModel) => void;
  modelInfo: {
    name: string;
    description: string;
    speed: string;
    cost: string;
  };
}

const GeminiModelContext = createContext<GeminiModelContextType | undefined>(undefined);

const MODEL_INFO = {
  'gemini-2.0-flash': {
    name: 'Gemini 2.0 Flash',
    description: 'Second generation workhorse model',
    speed: 'Very Fast',
    cost: 'Low'
  },
  'gemini-2.5-flash': {
    name: 'Gemini 2.5 Flash',
    description: 'Best price-performance for high volume tasks',
    speed: 'Fast',
    cost: 'Low'
  },
  'gemini-2.5-pro': {
    name: 'Gemini 2.5 Pro',
    description: 'Advanced thinking and reasoning model',
    speed: 'Medium',
    cost: 'Medium'
  },
  'gemini-3-pro-preview': {
    name: 'Gemini 3 Pro Preview',
    description: 'Most intelligent multimodal model',
    speed: 'Medium',
    cost: 'Premium'
  }
};

export function GeminiModelProvider({ children }: { children: ReactNode }) {
  // Load saved model from localStorage or default to 1.5 Flash
  const [selectedModel, setSelectedModelState] = useState<GeminiModel>(() => {
    const saved = localStorage.getItem('gemini-model') as GeminiModel;
    // Validate saved model against current valid models
    const validModels: GeminiModel[] = [
      'gemini-2.0-flash',
      'gemini-2.5-flash',
      'gemini-2.5-pro',
      'gemini-3-pro-preview'
    ];
    if (saved && validModels.includes(saved)) {
      return saved;
    }
    // Default to 2.5 Flash if no valid saved model
    return 'gemini-2.5-flash';
  });

  // Save to localStorage whenever model changes
  useEffect(() => {
    localStorage.setItem('gemini-model', selectedModel);
  }, [selectedModel]);

  // Sync initial model selection to backend on mount
  useEffect(() => {
    const syncModelToBackend = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/settings/gemini-model', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: selectedModel })
        });
        if (response.ok) {
          console.log(`✅ Initial model synced to backend: ${selectedModel}`);
        }
      } catch (err) {
        console.error('Failed to sync initial model to backend:', err);
      }
    };
    
    syncModelToBackend();
  }, []); // Run once on mount

  const setSelectedModel = async (model: GeminiModel) => {
    console.log(`🔄 Switching to model: ${model}`);
    setSelectedModelState(model);
    
    // Also send to backend to update server-side model
    try {
      const response = await fetch('http://localhost:3000/api/settings/gemini-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model })
      });
      
      const data = await response.json();
      if (response.ok) {
        console.log(`✅ Backend model updated:`, data);
      } else {
        console.error('❌ Failed to update backend model:', data);
      }
    } catch (err) {
      console.error('❌ Network error updating backend model:', err);
    }
  };

  const modelInfo = MODEL_INFO[selectedModel];

  return (
    <GeminiModelContext.Provider value={{ selectedModel, setSelectedModel, modelInfo }}>
      {children}
    </GeminiModelContext.Provider>
  );
}

export function useGeminiModel() {
  const context = useContext(GeminiModelContext);
  if (!context) {
    throw new Error('useGeminiModel must be used within GeminiModelProvider');
  }
  return context;
}
