import { getCurrentGeminiModel } from '../routes/settings';

/**
 * Gets the currently selected Gemini model from settings
 * This allows all AI services to use the user-selected model dynamically
 */
export function getActiveGeminiModel(): string {
  const model = getCurrentGeminiModel();
  console.log(`🤖 Using Gemini model: ${model}`);
  return model;
}

/**
 * Model information for reference
 */
export const GEMINI_MODELS = {
  '2.0-flash-exp': {
    id: 'gemini-2.0-flash-exp',
    name: 'Gemini 2.0 Flash (Experimental)',
    description: 'Fast experimental model for testing',
    speed: 'Very Fast',
    cost: 'Free'
  },
  '2.5-flash': {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    description: 'Best price-performance, production-ready',
    speed: 'Fast',
    cost: 'Low'
  },
  '2.5-pro': {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    description: 'Advanced reasoning for complex tasks',
    speed: 'Medium',
    cost: 'Medium'
  },
  '3-pro': {
    id: 'gemini-3-pro-preview',
    name: 'Gemini 3 Pro Preview',
    description: 'Most advanced multimodal model',
    speed: 'Slower',
    cost: 'High'
  }
} as const;
