import { useState, useEffect, useCallback } from 'react';
import { Sliders, BarChart2, TrendingUp, Save, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Subcriteria {
  id: string;
  name: string;
  weight: number;
}

interface EvaluationCriteria {
  id: string;
  name: string;
  weight: number;
  description: string; // NEW: 2-line explanation
  subcriteria: Subcriteria[];
  industry?: string;
  customizable?: boolean;
}

export function VCMode() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'evaluation' | 'forecast' | 'customize'>('evaluation');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');
  const [customCriteria, setCustomCriteria] = useState<string>('');
  const [customSubcriteria, setCustomSubcriteria] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState<string>('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [criteria, setCriteria] = useState<EvaluationCriteria[]>([
    {
      id: 'team',
      name: 'Team',
      weight: 25,
      description: 'Founder backgrounds, expertise, and ability to execute. Assesses technical skills, domain knowledge, and leadership capabilities.',
      subcriteria: []
    },
    {
      id: 'market',
      name: 'Market Opportunity',
      weight: 25,
      description: 'Total addressable market size, growth rate, and competitive landscape. Evaluates market timing and expansion potential.',
      subcriteria: []
    },
    {
      id: 'product',
      name: 'Product & Technology',
      weight: 25,
      description: 'Problem-solution fit, innovation level, and technical moat. Includes product differentiation and scalability assessment.',
      subcriteria: []
    },
    {
      id: 'traction',
      name: 'Traction & Metrics',
      weight: 15,
      description: 'User growth, revenue metrics, and retention rates. Measures product-market fit through quantifiable business indicators.',
      subcriteria: []
    },
    {
      id: 'finance',
      name: 'Finance',
      weight: 10,
      description: 'Unit economics, burn rate, and path to profitability. Analyzes capital efficiency and financial sustainability.',
      subcriteria: []
    }
  ]);

  const updateWeight = (criteriaId: string, subcriteriaId: string | null, newWeight: number) => {
    // Calculate the sum of all OTHER sliders (excluding the current one being changed)
    const otherSlidersSum = criteria.reduce((sum, c) => {
      if (c.id === criteriaId) {
        return sum; // Skip the current criterion
      }
      return sum + c.weight;
    }, 0);
    
    // Maximum allowed value for this slider = 100 - (sum of all other sliders)
    const maxAllowed = 100 - otherSlidersSum;
    
    // Clamp the new weight between 0 and maxAllowed
    const clampedWeight = Math.min(Math.max(newWeight, 0), maxAllowed);
    
    setCriteria(prev => prev.map(c => {
      if (c.id === criteriaId) {
        if (subcriteriaId) {
          return {
            ...c,
            subcriteria: c.subcriteria.map(sc => 
              sc.id === subcriteriaId ? { ...sc, weight: clampedWeight } : sc
            )
          };
        }
        return { ...c, weight: clampedWeight };
      }
      return c;
    }));
    setHasUnsavedChanges(true); // Mark as changed
  };

  // Function to load preferences (wrapped in useCallback to prevent infinite loops)
  const loadPreferences = useCallback(async () => {
    if (!user?.id) {
      console.log('ℹ️ No user logged in, using default weights');
      return;
    }

    try {
      console.log('🔄 Loading VC preferences for user:', user.id, 'industry:', selectedIndustry);
      const response = await fetch(
        `http://localhost:3000/api/vc-preferences/${user.id}?industry=${selectedIndustry}`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.preferences?.criteria) {
          console.log('✅ Loaded preferences:', data.preferences.preferences_name);
          const parsedCriteria = typeof data.preferences.criteria === 'string' 
            ? JSON.parse(data.preferences.criteria) 
            : data.preferences.criteria;
          setCriteria(parsedCriteria);
          setHasUnsavedChanges(false); // Mark as saved after loading from DB
        } else {
          console.log('ℹ️ No criteria in response - keeping current weights');
        }
      } else if (response.status === 404) {
        console.log('ℹ️ No saved preferences found - using defaults');
        // Don't reset criteria - keep whatever is currently in state
      } else {
        console.warn('⚠️ Unexpected response status:', response.status);
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
      // Don't reset criteria on error - keep current state
    }
  }, [user?.id, selectedIndustry]);

  // Load saved preferences ONLY on initial mount
  useEffect(() => {
    if (user?.id) {
      console.log('🔄 Initial load of preferences for user:', user.id, user.email);
      loadPreferences();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // Only reload when user changes, NOT when industry changes

  // NOTE: Removed auto-reload on focus/visibility to prevent resetting unsaved changes
  // Users must click "Save Preferences" to persist their changes

  // Save preferences to database
  const handleSavePreferences = async () => {
    if (!user?.id) {
      setSaveStatus('error');
      setSaveMessage('You must be logged in to save preferences');
      setTimeout(() => setSaveStatus('idle'), 3000);
      return;
    }

    setIsSaving(true);
    setSaveStatus('idle');

    try {
      const response = await fetch('http://localhost:3000/api/vc-preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          preferencesName: 'Default',
          industry: selectedIndustry,
          criteria: criteria,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save preferences');
      }

      const data = await response.json();
      setSaveStatus('success');
      setSaveMessage('Preferences saved successfully!');
      setHasUnsavedChanges(false); // Clear unsaved changes flag
      console.log('Saved preferences:', data);

      // Reload preferences to ensure UI is in sync with database
      await loadPreferences();

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSaveStatus('idle');
        setSaveMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error saving preferences:', error);
      setSaveStatus('error');
      setSaveMessage('Failed to save preferences. Please try again.');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">VC Mode</h1>
          <p className="text-slate-600 mt-1">Customize evaluation criteria and analyze growth potential</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('evaluation')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              activeTab === 'evaluation'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            Evaluation Weights
          </button>
          <button
            onClick={() => setActiveTab('forecast')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              activeTab === 'forecast'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            Growth Forecast
          </button>
          <button
            onClick={() => setActiveTab('customize')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              activeTab === 'customize'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            Customize
          </button>
        </div>
      </div>

      <div className="mb-6">
        <label htmlFor="industry" className="block text-sm font-medium text-slate-700 mb-2">
          Industry Focus
        </label>
        <select
          id="industry"
          value={selectedIndustry}
          onChange={(e) => setSelectedIndustry(e.target.value)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
        >
          <option value="all">All Industries</option>
          <option value="healthcare">Healthcare</option>
          <option value="fintech">Fintech</option>
          <option value="enterprise">Enterprise Software</option>
          <option value="consumer">Consumer Tech</option>
          <option value="deeptech">Deep Tech</option>
          <option value="sustainability">Sustainability</option>
          <option value="ai">AI & ML</option>
          <option value="custom">Custom Industry</option>
        </select>
      </div>

      {activeTab === 'evaluation' && (
        <div className="space-y-6 pb-32">
          {/* Add bottom padding to prevent save button overlap */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">Investment Criteria Weights</h2>
            <p className="text-sm text-slate-600 mb-6">
              Adjust the importance of each criterion to match your investment thesis. Weights must total 100%.
            </p>
            
            {/* 2-Column Grid for Sliders */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              {criteria.map(criterion => {
                // Calculate max value for this slider (100 - sum of all other sliders)
                const otherSlidersSum = criteria.reduce((sum, c) => {
                  if (c.id === criterion.id) return sum;
                  return sum + c.weight;
                }, 0);
                const maxValue = 100 - otherSlidersSum;
                
                return (
                  <div key={criterion.id} className="border-b pb-6 last:border-b-0 md:last:border-b md:nth-last-child-2:border-b-0">
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-slate-900">{criterion.name}</h3>
                        <span className="text-lg font-bold text-blue-600">{criterion.weight}%</span>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed mb-3">
                        {criterion.description}
                      </p>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={maxValue}
                      value={criterion.weight}
                      onChange={(e) => updateWeight(criterion.id, null, parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                      <span>0%</span>
                      <span>{Math.round(maxValue / 2)}%</span>
                      <span>{maxValue}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Weight Total Indicator */}
            <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">Total Weight:</span>
                <span className={`text-lg font-bold ${
                  criteria.reduce((sum, c) => sum + c.weight, 0) === 100 
                    ? 'text-green-600' 
                    : 'text-orange-600'
                }`}>
                  {criteria.reduce((sum, c) => sum + c.weight, 0)}%
                </span>
              </div>
              {criteria.reduce((sum, c) => sum + c.weight, 0) !== 100 && (
                <p className="text-xs text-orange-600 mt-1">
                  ⚠️ Weights should total 100% for accurate scoring
                </p>
              )}
            </div>

            {/* Save Button */}
            <div className="mt-6">
              {hasUnsavedChanges && (
                <div className="flex items-center space-x-2 text-orange-600 mb-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">You have unsaved changes</span>
                </div>
              )}
              
              {saveStatus === 'success' && (
                <div className="flex items-center space-x-2 text-green-600 mb-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">{saveMessage}</span>
                </div>
              )}
              
              {saveStatus === 'error' && (
                <div className="flex items-center space-x-2 text-red-600 mb-3 p-3 bg-red-50 rounded-lg border border-red-200">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">{saveMessage}</span>
                </div>
              )}
              
              <button
                onClick={handleSavePreferences}
                disabled={isSaving || !user}
                className={`w-full flex items-center justify-center space-x-2 px-6 py-4 rounded-lg font-medium transition-all ${
                  isSaving || !user
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : hasUnsavedChanges
                    ? 'bg-orange-600 text-white hover:bg-orange-700 hover:shadow-lg active:scale-[0.99]'
                    : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg active:scale-[0.99]'
                }`}
              >
                <Save className="w-5 h-5" />
                <span className="text-lg">{isSaving ? 'Saving...' : hasUnsavedChanges ? 'Save Changes' : 'Save Preferences'}</span>
              </button>
              
              {!user && (
                <p className="text-xs text-slate-500 mt-2 text-center">
                  Please log in to save your preferences
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'customize' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Custom Evaluation Criteria</h2>
          <div className="space-y-6">
            <div>
              <label htmlFor="newCriteria" className="block text-sm font-medium text-slate-700 mb-2">
                Add New Main Criteria
              </label>
              <div className="flex space-x-4">
                <input
                  type="text"
                  id="newCriteria"
                  value={customCriteria}
                  onChange={(e) => setCustomCriteria(e.target.value)}
                  placeholder="Enter new criteria name"
                  className="flex-1 mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                />
                <button
                  onClick={() => {
                    if (customCriteria.trim()) {
                      setCriteria([
                        ...criteria,
                        {
                          id: customCriteria.toLowerCase().replace(/\s+/g, '-'),
                          name: customCriteria,
                          weight: 0,
                          description: 'Custom evaluation criterion',
                          subcriteria: [],
                          customizable: true,
                        },
                      ]);
                      setCustomCriteria('');
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="criteriaSelect" className="block text-sm font-medium text-slate-700 mb-2">
                Add Subcriteria to Existing Criteria
              </label>
              <div className="space-y-4">
                <select
                  id="criteriaSelect"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  {criteria.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <div className="flex space-x-4">
                  <input
                    type="text"
                    value={customSubcriteria}
                    onChange={(e) => setCustomSubcriteria(e.target.value)}
                    placeholder="Enter new subcriteria name"
                    className="flex-1 mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  />
                  <button
                    onClick={() => {
                      const selectedCriteriaId = (document.getElementById('criteriaSelect') as HTMLSelectElement).value;
                      if (customSubcriteria.trim() && selectedCriteriaId) {
                        setCriteria(
                          criteria.map((c) =>
                            c.id === selectedCriteriaId
                              ? {
                                  ...c,
                                  subcriteria: [
                                    ...c.subcriteria,
                                    {
                                      id: customSubcriteria.toLowerCase().replace(/\s+/g, '-'),
                                      name: customSubcriteria,
                                      weight: 0,
                                    },
                                  ],
                                }
                              : c
                          )
                        );
                        setCustomSubcriteria('');
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            {selectedIndustry === 'healthcare' && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="text-lg font-medium text-blue-900 mb-4">Healthcare Industry Specific Metrics</h3>
                <ul className="space-y-2">
                  <li className="flex items-center text-blue-700">
                    <span className="w-4 h-4 mr-2 rounded-full bg-blue-200 flex items-center justify-center">•</span>
                    Clinical Validation Status
                  </li>
                  <li className="flex items-center text-blue-700">
                    <span className="w-4 h-4 mr-2 rounded-full bg-blue-200 flex items-center justify-center">•</span>
                    Regulatory Compliance
                  </li>
                  <li className="flex items-center text-blue-700">
                    <span className="w-4 h-4 mr-2 rounded-full bg-blue-200 flex items-center justify-center">•</span>
                    Patient Outcome Metrics
                  </li>
                  <li className="flex items-center text-blue-700">
                    <span className="w-4 h-4 mr-2 rounded-full bg-blue-200 flex items-center justify-center">•</span>
                    Healthcare Integration Capabilities
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'forecast' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">Market Growth Analysis</h2>
            <div className="space-y-4">
              <div className="border-b pb-4">
                <h3 className="font-medium text-slate-900 mb-2">Market Size Projection</h3>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-slate-600">25% YoY Growth</span>
                </div>
              </div>
              <div className="border-b pb-4">
                <h3 className="font-medium text-slate-900 mb-2">Technology Adoption Curve</h3>
                <div className="h-32 bg-slate-50 rounded flex items-end justify-between p-2">
                  {/* Simplified S-curve visualization */}
                  <div className="h-4 w-6 bg-blue-200 rounded"></div>
                  <div className="h-8 w-6 bg-blue-300 rounded"></div>
                  <div className="h-20 w-6 bg-blue-400 rounded"></div>
                  <div className="h-24 w-6 bg-blue-500 rounded"></div>
                  <div className="h-28 w-6 bg-blue-600 rounded"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">AI-Powered Predictions</h2>
            <div className="space-y-4">
              <div className="border-b pb-4">
                <h3 className="font-medium text-slate-900 mb-2">Market Indicators</h3>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-center space-x-2">
                    <BarChart2 className="w-4 h-4 text-blue-500" />
                    <span>Strong growth potential in target segment</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <BarChart2 className="w-4 h-4 text-blue-500" />
                    <span>Technology adoption accelerating</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <BarChart2 className="w-4 h-4 text-blue-500" />
                    <span>Favorable regulatory environment</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-slate-900 mb-2">Risk Factors</h3>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-center space-x-2">
                    <Sliders className="w-4 h-4 text-orange-500" />
                    <span>Market competition intensifying</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Sliders className="w-4 h-4 text-orange-500" />
                    <span>Technology stack evolution</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
