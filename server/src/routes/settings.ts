import express, { Request, Response } from 'express';

const router = express.Router();

// Store the current Gemini model selection
let currentGeminiModel = 'gemini-2.5-flash';

// GET current model
router.get('/gemini-model', (req: Request, res: Response) => {
  res.json({ model: currentGeminiModel });
});

// POST/PUT to update model
router.post('/gemini-model', (req: Request, res: Response) => {
  const { model } = req.body;
  
  console.log('📥 Received model update request:', { 
    requestedModel: model, 
    currentModel: currentGeminiModel 
  });
  
  const validModels = [
    'gemini-2.0-flash',
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-3-pro'
  ];
  
  if (!model || !validModels.includes(model)) {
    console.error('❌ Invalid model requested:', model);
    return res.status(400).json({ 
      error: 'Invalid model. Must be one of: ' + validModels.join(', ') 
    });
  }
  
  const oldModel = currentGeminiModel;
  currentGeminiModel = model;
  console.log(`✅ Gemini model updated: ${oldModel} → ${model}`);
  
  res.json({ 
    success: true, 
    model: currentGeminiModel,
    message: `Model updated from ${oldModel} to ${model}`,
    previousModel: oldModel
  });
});

// Export function to get current model from other services
export function getCurrentGeminiModel(): string {
  return currentGeminiModel;
}

export default router;
