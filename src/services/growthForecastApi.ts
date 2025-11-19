/**
 * Growth Forecast API Service
 * Frontend interface for agentic growth forecasting system
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface GrowthScenario {
  year: number;
  revenue: {
    pessimistic: number;
    baseCase: number;
    optimistic: number;
  };
  users: {
    pessimistic: number;
    baseCase: number;
    optimistic: number;
  };
  marketShare: {
    pessimistic: number;
    baseCase: number;
    optimistic: number;
  };
  confidenceInterval: {
    lower: number;
    upper: number;
  };
}

export interface GrowthForecast {
  companyName: string;
  generatedAt: string;
  forecastHorizon: string;
  scenarios: GrowthScenario[];
  keyDrivers: string[];
  riskFactors: string[];
  capitalRequirements: Array<{
    year: number;
    estimatedRaise: number;
    estimatedValuation: number;
    dilution: number;
  }>;
  assumptions: string[];
  methodology: string;
}

/**
 * Generate growth forecast for a pitch deck
 */
export async function generateForecast(
  deckId: string,
  horizonYears: number = 5
): Promise<GrowthForecast> {
  const response = await fetch(`${API_BASE_URL}/vc-agent/forecast/${deckId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ horizonYears }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to generate forecast');
  }

  const data = await response.json();
  return data.forecast;
}

/**
 * Get saved forecast for a pitch deck
 */
export async function getForecast(
  deckId: string,
  horizon: string = '5-year'
): Promise<GrowthForecast | null> {
  const response = await fetch(
    `${API_BASE_URL}/vc-agent/forecast/${deckId}?horizon=${horizon}`
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch forecast');
  }

  const data = await response.json();
  return data.forecast;
}

/**
 * Regenerate evaluation prompt based on custom criteria
 */
export async function regeneratePrompt(
  userId: string,
  industry: string,
  criteria: any[]
): Promise<{
  success: boolean;
  version: string;
  metadata: any;
}> {
  const response = await fetch(`${API_BASE_URL}/vc-agent/regenerate-prompt`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId, industry, criteria }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to regenerate prompt');
  }

  return await response.json();
}

/**
 * Get prompt history for user
 */
export async function getPromptHistory(
  userId: string,
  limit: number = 10
): Promise<Array<{
  version: string;
  createdAt: string;
  metadata: any;
}>> {
  const response = await fetch(
    `${API_BASE_URL}/vc-agent/prompt-history/${userId}?limit=${limit}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch prompt history');
  }

  const data = await response.json();
  return data.history;
}
