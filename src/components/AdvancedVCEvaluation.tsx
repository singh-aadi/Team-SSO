/**
 * ADVANCED VC EVALUATION COMPONENT
 * 
 * 4-Layer Agentic System Orchestrator
 * - Layer 1: Dealbreaker Matrix
 * - Layer 2: Pattern Memory Bank  
 * - Layer 3: Context Weights (Stage-specific)
 * - Layer 4: Thesis Alignment
 */

import { useState, useEffect } from 'react';
import { Save, AlertCircle, CheckCircle, Download } from 'lucide-react';
import { DealbreakerMatrix } from './DealbreakerMatrix';
import { PatternMemoryBank } from './PatternMemoryBank';

interface Dealbreaker {
  id: string;
  description: string;
  category: 'team' | 'market' | 'product' | 'traction' | 'compliance' | 'strategy';
  severity: 'HARD_NO' | 'SOFT_NO' | 'FLAG';
  enabled: boolean;
}

interface Pattern {
  id: string;
  pattern: string;
  type: 'success' | 'failure' | 'warning';
  weight: number;
  examples?: string;
}

interface ContextWeights {
  stage: 'Pre-seed' | 'Seed' | 'Series A' | 'Series B+';
  weights: {
    team: number;
    market: number;
    product: number;
    traction: number;
    finance: number;
  };
}

interface ThesisAlignment {
  target_sectors: string[];
  target_stages: string[];
  check_size_range: { min: number; max: number };
  geography: string[];
  strategic_priorities: string;
}

interface VCPreferences {
  dealbreakers: Dealbreaker[];
  patterns: Pattern[];
  context_weights: ContextWeights[];
  thesis_alignment: ThesisAlignment;
}

interface AdvancedVCEvaluationProps {
  userId: string;
  onSave?: () => void;
  onPreferencesUpdate?: () => void;
}

const DEFAULT_CONTEXT_WEIGHTS: ContextWeights[] = [
  {
    stage: 'Pre-seed',
    weights: { team: 40, market: 30, product: 20, traction: 5, finance: 5 }
  },
  {
    stage: 'Seed',
    weights: { team: 35, market: 25, product: 20, traction: 15, finance: 5 }
  },
  {
    stage: 'Series A',
    weights: { team: 25, market: 20, product: 20, traction: 25, finance: 10 }
  },
  {
    stage: 'Series B+',
    weights: { team: 20, market: 15, product: 15, traction: 30, finance: 20 }
  },
];

const DEFAULT_THESIS: ThesisAlignment = {
  target_sectors: ['SaaS', 'FinTech', 'AI/ML'],
  target_stages: ['Seed', 'Series A'],
  check_size_range: { min: 500000, max: 5000000 },
  geography: ['North America', 'Europe'],
  strategic_priorities: 'B2B SaaS with strong product-market fit, recurring revenue, and technical founders'
};

export function AdvancedVCEvaluation({ userId, onSave, onPreferencesUpdate }: AdvancedVCEvaluationProps) {
  const [activeLayer, setActiveLayer] = useState<number>(1);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState('');

  // Layer 1: Dealbreakers
  const [dealbreakers, setDealbreakers] = useState<Dealbreaker[]>([]);

  // Layer 2: Patterns (Initialize with default patterns)
  const [patterns, setPatterns] = useState<Pattern[]>([
    {
      id: '1',
      pattern: 'FAANG engineer background',
      type: 'success',
      weight: 80,
      examples: 'Ex-Google ML engineer, Ex-Amazon senior SDE'
    },
    {
      id: '2',
      pattern: 'Second-time founder with successful exit',
      type: 'success',
      weight: 90,
      examples: 'Sold previous startup for $50M+, IPO experience'
    },
    {
      id: '3',
      pattern: 'Strong network effects in product',
      type: 'success',
      weight: 75,
      examples: 'Marketplace dynamics, viral growth loops'
    },
    {
      id: '4',
      pattern: 'First-time founder, no industry experience',
      type: 'failure',
      weight: 60,
      examples: 'Career switcher with < 1 year domain knowledge'
    },
    {
      id: '5',
      pattern: 'Pivot from original idea',
      type: 'warning',
      weight: 50,
      examples: 'Changed business model or target market post-funding'
    },
    {
      id: '6',
      pattern: 'Reliant on single customer for >50% revenue',
      type: 'failure',
      weight: 70,
      examples: 'Enterprise deal concentration risk'
    },
    {
      id: '7',
      pattern: 'Strong organic growth (>20% MoM)',
      type: 'success',
      weight: 85,
      examples: 'Viral coefficient >1.0, low CAC'
    }
  ]);

  // Layer 3: Context Weights
  const [contextWeights, setContextWeights] = useState<ContextWeights[]>(DEFAULT_CONTEXT_WEIGHTS);

  // Layer 4: Thesis Alignment
  const [thesis, setThesis] = useState<ThesisAlignment>(DEFAULT_THESIS);
  const [newSector, setNewSector] = useState('');
  const [newStage, setNewStage] = useState('');
  const [newGeo, setNewGeo] = useState('');

  // Load existing preferences
  useEffect(() => {
    loadPreferences();
  }, [userId]);

  const loadPreferences = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/vc-preferences/${userId}`);
      if (response.ok) {
        const data = await response.json();
        const prefs = data.preferences;
        
        // Parse criteria JSON if it's a string
        const criteria = typeof prefs.criteria === 'string' 
          ? JSON.parse(prefs.criteria) 
          : prefs.criteria;

        if (criteria.dealbreakers) setDealbreakers(criteria.dealbreakers);
        if (criteria.patterns) setPatterns(criteria.patterns);
        if (criteria.context_weights) setContextWeights(criteria.context_weights);
        if (criteria.thesis_alignment) setThesis(criteria.thesis_alignment);
      }
    } catch (error) {
      console.log('No existing preferences found, using defaults');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');

    try {
      const preferences: VCPreferences = {
        dealbreakers,
        patterns,
        context_weights: contextWeights,
        thesis_alignment: thesis
      };

      const response = await fetch('http://localhost:3000/api/vc-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          preferencesName: 'Default',
          industry: 'all',
          criteria: preferences
        })
      });

      if (response.ok) {
        setSaveStatus('success');
        setSaveMessage('✓ Preferences saved successfully!');
        if (onSave) onSave();
        if (onPreferencesUpdate) onPreferencesUpdate();
      } else {
        const errorData = await response.json();
        console.error('Save failed:', errorData);
        throw new Error(errorData.error || 'Failed to save');
      }
    } catch (error: any) {
      console.error('Save error:', error);
      setSaveStatus('error');
      setSaveMessage(error.message || 'Failed to save preferences. Please try again.');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveStatus('idle'), 5000);
    }
  };

  const handleExportToDeckIntelligence = async () => {
    try {
      // First save the preferences
      const preferences: VCPreferences = {
        dealbreakers,
        patterns,
        context_weights: contextWeights,
        thesis_alignment: thesis
      };

      const saveResponse = await fetch('http://localhost:3000/api/vc-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          preferencesName: 'Advanced VC Evaluation',
          industry: 'all',
          criteria: preferences
        })
      });

      if (!saveResponse.ok) {
        throw new Error('Failed to save preferences');
      }

      setSaveStatus('success');
      setSaveMessage('✓ Preferences saved globally! Will be automatically used for ALL deck evaluations.');
      setTimeout(() => setSaveStatus('idle'), 3000);
      
      if (onPreferencesUpdate) onPreferencesUpdate();
    } catch (error: any) {
      console.error('Export failed:', error);
      setSaveStatus('error');
      setSaveMessage('Failed to export: ' + error.message);
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleWeightChange = (stage: string, category: string, value: number) => {
    const updated = contextWeights.map(cw => {
      if (cw.stage === stage) {
        return {
          ...cw,
          weights: { ...cw.weights, [category]: value }
        };
      }
      return cw;
    });
    setContextWeights(updated);
  };

  const addSector = () => {
    if (newSector.trim() && !thesis.target_sectors.includes(newSector.trim())) {
      setThesis({ ...thesis, target_sectors: [...thesis.target_sectors, newSector.trim()] });
      setNewSector('');
    }
  };

  const removeSector = (sector: string) => {
    setThesis({ ...thesis, target_sectors: thesis.target_sectors.filter(s => s !== sector) });
  };

  const addStage = () => {
    if (newStage.trim() && !thesis.target_stages.includes(newStage.trim())) {
      setThesis({ ...thesis, target_stages: [...thesis.target_stages, newStage.trim()] });
      setNewStage('');
    }
  };

  const removeStage = (stage: string) => {
    setThesis({ ...thesis, target_stages: thesis.target_stages.filter(s => s !== stage) });
  };

  const addGeography = () => {
    if (newGeo.trim() && !thesis.geography.includes(newGeo.trim())) {
      setThesis({ ...thesis, geography: [...thesis.geography, newGeo.trim()] });
      setNewGeo('');
    }
  };

  const removeGeography = (geo: string) => {
    setThesis({ ...thesis, geography: thesis.geography.filter(g => g !== geo) });
  };

  const layers = [
    { id: 1, name: 'Dealbreakers', desc: 'Hard rules & filters' },
    { id: 2, name: 'Patterns', desc: 'Success/failure recognition' },
    { id: 3, name: 'Context Weights', desc: 'Stage-specific scoring' },
    { id: 4, name: 'Thesis Alignment', desc: 'Strategic fit & bias detection' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Advanced VC Evaluation</h2>
          <p className="text-gray-600 mt-1">
            4-layer agentic system for psychology-informed investment decisions
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExportToDeckIntelligence}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold shadow-md hover:shadow-lg"
            title="Save preferences globally for all future deck evaluations"
          >
            <Download className="w-5 h-5" />
            Save Globally
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            <Save className="w-5 h-5" />
            {isSaving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>

      {/* Save Status */}
      {saveStatus !== 'idle' && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${
          saveStatus === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          {saveStatus === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600" />
          )}
          <p className={`text-sm font-medium ${saveStatus === 'success' ? 'text-green-800' : 'text-red-800'}`}>
            {saveMessage}
          </p>
        </div>
      )}

      {/* Layer Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-1">
          {layers.map((layer) => (
            <button
              key={layer.id}
              onClick={() => setActiveLayer(layer.id)}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeLayer === layer.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-xs font-semibold">
                  {layer.id}
                </span>
                <div className="text-left">
                  <div>{layer.name}</div>
                  <div className="text-xs font-normal text-gray-500">{layer.desc}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Layer Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {activeLayer === 1 && (
          <DealbreakerMatrix dealbreakers={dealbreakers} onChange={setDealbreakers} />
        )}

        {activeLayer === 2 && (
          <PatternMemoryBank patterns={patterns} onChange={setPatterns} />
        )}

        {activeLayer === 3 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Context Weights</h3>
              <p className="text-sm text-gray-600 mt-1">
                Adjust evaluation criteria weights based on company stage. Early-stage: focus on team. Later-stage: focus on traction.
              </p>
            </div>

            {contextWeights.map((cw) => (
              <div key={cw.stage} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-4">{cw.stage} Stage</h4>
                <div className="space-y-4">
                  {Object.entries(cw.weights).map(([category, weight]) => (
                    <div key={category}>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="capitalize text-gray-700 font-medium">{category}</span>
                        <span className="font-semibold text-blue-600">{weight}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="50"
                        step="5"
                        value={weight}
                        onChange={(e) => handleWeightChange(cw.stage, category, parseInt(e.target.value))}
                        className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  ))}
                  <div className="pt-2 border-t border-gray-300">
                    <span className="text-sm font-medium text-gray-700">
                      Total: {Object.values(cw.weights).reduce((sum, w) => sum + w, 0)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeLayer === 4 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Investment Thesis Alignment</h3>
              <p className="text-sm text-gray-600 mt-1">
                Define your strategic priorities. AI will calculate fit and detect cognitive biases (HALO/HORN effects).
              </p>
            </div>

            {/* Target Sectors */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Target Sectors</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {thesis.target_sectors.map((sector) => (
                  <span
                    key={sector}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-2"
                  >
                    {sector}
                    <button onClick={() => removeSector(sector)} className="hover:text-blue-900">×</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSector}
                  onChange={(e) => setNewSector(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addSector()}
                  placeholder="Add sector (e.g., SaaS, FinTech)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <button onClick={addSector} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Add
                </button>
              </div>
            </div>

            {/* Target Stages */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Target Stages</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {thesis.target_stages.map((stage) => (
                  <span
                    key={stage}
                    className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm flex items-center gap-2"
                  >
                    {stage}
                    <button onClick={() => removeStage(stage)} className="hover:text-green-900">×</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newStage}
                  onChange={(e) => setNewStage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addStage()}
                  placeholder="Add stage (e.g., Seed, Series A)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <button onClick={addStage} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                  Add
                </button>
              </div>
            </div>

            {/* Check Size Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Check Size Range</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-600">Minimum ($)</label>
                  <input
                    type="number"
                    value={thesis.check_size_range.min}
                    onChange={(e) => setThesis({
                      ...thesis,
                      check_size_range: { ...thesis.check_size_range, min: parseInt(e.target.value) || 0 }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Maximum ($)</label>
                  <input
                    type="number"
                    value={thesis.check_size_range.max}
                    onChange={(e) => setThesis({
                      ...thesis,
                      check_size_range: { ...thesis.check_size_range, max: parseInt(e.target.value) || 0 }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Geography */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Geography Focus</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {thesis.geography.map((geo) => (
                  <span
                    key={geo}
                    className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm flex items-center gap-2"
                  >
                    {geo}
                    <button onClick={() => removeGeography(geo)} className="hover:text-purple-900">×</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newGeo}
                  onChange={(e) => setNewGeo(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addGeography()}
                  placeholder="Add geography (e.g., North America, Europe)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <button onClick={addGeography} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                  Add
                </button>
              </div>
            </div>

            {/* Strategic Priorities */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Strategic Priorities</label>
              <textarea
                value={thesis.strategic_priorities}
                onChange={(e) => setThesis({ ...thesis, strategic_priorities: e.target.value })}
                rows={4}
                placeholder="Describe your investment priorities, focus areas, and strategic goals..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
