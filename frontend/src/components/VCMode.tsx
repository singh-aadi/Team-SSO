import { useState } from 'react';
import { Sliders, BarChart2, TrendingUp } from 'lucide-react';

interface Subcriteria {
  id: string;
  name: string;
  weight: number;
}

interface EvaluationCriteria {
  id: string;
  name: string;
  weight: number;
  subcriteria: Subcriteria[];
  industry?: string;
  customizable?: boolean;
}

export function VCMode() {
  const [activeTab, setActiveTab] = useState<'evaluation' | 'forecast' | 'customize'>('evaluation');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');
  const [customCriteria, setCustomCriteria] = useState<string>('');
  const [customSubcriteria, setCustomSubcriteria] = useState<string>('');
  const [criteria, setCriteria] = useState<EvaluationCriteria[]>([
    {
      id: 'team',
      name: 'Team',
      weight: 30,
      subcriteria: [
        { id: 'experience', name: 'Experience', weight: 40 },
        { id: 'technical', name: 'Technical Expertise', weight: 30 },
        { id: 'vision', name: 'Vision & Leadership', weight: 30 }
      ]
    },
    {
      id: 'market',
      name: 'Market Opportunity',
      weight: 25,
      subcriteria: [
        { id: 'size', name: 'Market Size', weight: 35 },
        { id: 'growth', name: 'Growth Rate', weight: 35 },
        { id: 'timing', name: 'Market Timing', weight: 30 }
      ]
    },
    {
      id: 'product',
      name: 'Product & Technology',
      weight: 25,
      subcriteria: [
        { id: 'innovation', name: 'Innovation Level', weight: 40 },
        { id: 'scalability', name: 'Scalability', weight: 30 },
        { id: 'moat', name: 'Competitive Moat', weight: 30 }
      ]
    },
    {
      id: 'traction',
      name: 'Traction & Metrics',
      weight: 20,
      subcriteria: [
        { id: 'growth', name: 'Growth Rate', weight: 40 },
        { id: 'retention', name: 'Retention', weight: 30 },
        { id: 'efficiency', name: 'Capital Efficiency', weight: 30 }
      ]
    }
  ]);

  const updateWeight = (criteriaId: string, subcriteriaId: string | null, newWeight: number) => {
    setCriteria(prev => prev.map(c => {
      if (c.id === criteriaId) {
        if (subcriteriaId) {
          return {
            ...c,
            subcriteria: c.subcriteria.map(sc => 
              sc.id === subcriteriaId ? { ...sc, weight: newWeight } : sc
            )
          };
        }
        return { ...c, weight: newWeight };
      }
      return c;
    }));
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
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">Investment Criteria Weights</h2>
            <div className="space-y-6">
              {criteria.map(criterion => (
                <div key={criterion.id} className="border-b pb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-medium text-slate-900">{criterion.name}</h3>
                      <p className="text-sm text-slate-500">Main weight: {criterion.weight}%</p>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={criterion.weight}
                      onChange={(e) => updateWeight(criterion.id, null, parseInt(e.target.value))}
                      className="w-48"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                    {criterion.subcriteria.map(sub => (
                      <div key={sub.id} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-700">{sub.name}</p>
                          <p className="text-xs text-slate-500">{sub.weight}%</p>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={sub.weight}
                          onChange={(e) => updateWeight(criterion.id, sub.id, parseInt(e.target.value))}
                          className="w-32"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
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
