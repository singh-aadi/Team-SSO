import { useState } from 'react';
import { Plus, Trash2, AlertCircle, CheckCircle } from 'lucide-react';

interface Subcriteria {
  id: string;
  name: string;
  weight: number;
}

interface EvaluationCriteria {
  id: string;
  name: string;
  weight: number;
  description: string;
  subcriteria: Subcriteria[];
  industry?: string;
  customizable?: boolean;
}

interface VCPreferencesEditorProps {
  criteria: EvaluationCriteria[];
  onCriteriaChange: (criteria: EvaluationCriteria[]) => void;
  onSave?: () => void;
  embedded?: boolean; // When true, removes padding and headers
}

export function VCPreferencesEditor({ 
  criteria, 
  onCriteriaChange, 
  onSave,
  embedded = false 
}: VCPreferencesEditorProps) {
  const [customCriteria, setCustomCriteria] = useState<string>('');
  const [customSubcriteria, setCustomSubcriteria] = useState<string>('');
  const [selectedCriteriaId, setSelectedCriteriaId] = useState<string>(criteria[0]?.id || '');

  const updateWeight = (criteriaId: string, subcriteriaId: string | null, newWeight: number) => {
    onCriteriaChange(criteria.map(c => {
      if (c.id === criteriaId) {
        if (subcriteriaId) {
          return {
            ...c,
            subcriteria: c.subcriteria.map(sc => 
              sc.id === subcriteriaId ? { ...sc, weight: Math.max(0, Math.min(100, newWeight)) } : sc
            )
          };
        } else {
          return { ...c, weight: Math.max(0, Math.min(100, newWeight)) };
        }
      }
      return c;
    }));
  };

  const addMainCriteria = () => {
    if (customCriteria.trim()) {
      onCriteriaChange([
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
  };

  const addSubcriteria = () => {
    if (customSubcriteria.trim() && selectedCriteriaId) {
      onCriteriaChange(
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
  };

  const removeCriteria = (criteriaId: string) => {
    onCriteriaChange(criteria.filter(c => c.id !== criteriaId && !c.customizable));
  };

  const removeSubcriteria = (criteriaId: string, subcriteriaId: string) => {
    onCriteriaChange(
      criteria.map(c =>
        c.id === criteriaId
          ? { ...c, subcriteria: c.subcriteria.filter(sc => sc.id !== subcriteriaId) }
          : c
      )
    );
  };

  const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
  const isBalanced = totalWeight === 100;

  return (
    <div className={embedded ? 'space-y-6' : 'bg-white rounded-lg shadow-sm border border-slate-200 p-6 space-y-6'}>
      {!embedded && (
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Evaluation Criteria</h3>
          <p className="text-sm text-slate-600">
            Customize weights and add custom criteria to personalize your evaluation framework
          </p>
        </div>
      )}

      {/* Main Criteria Weights */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-slate-700">Main Criteria Weights</h4>
        {criteria.map((criterion) => (
          <div key={criterion.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-slate-700">{criterion.name}</label>
                  {criterion.customizable && (
                    <button
                      onClick={() => removeCriteria(criterion.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Remove criterion"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{criterion.description}</p>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={criterion.weight}
                  onChange={(e) => updateWeight(criterion.id, null, parseInt(e.target.value))}
                  className="w-32 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <span className="text-sm font-semibold text-blue-600 w-12 text-right">
                  {criterion.weight}%
                </span>
              </div>
            </div>

            {/* Subcriteria */}
            {criterion.subcriteria.length > 0 && (
              <div className="ml-6 space-y-2 pl-4 border-l-2 border-slate-200">
                {criterion.subcriteria.map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-slate-600">{sub.name}</span>
                      <button
                        onClick={() => removeSubcriteria(criterion.id, sub.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Remove subcriteria"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="flex items-center space-x-3">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={sub.weight}
                        onChange={(e) => updateWeight(criterion.id, sub.id, parseInt(e.target.value))}
                        className="w-24 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                      />
                      <span className="text-xs font-medium text-purple-600 w-10 text-right">
                        {sub.weight}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Total Weight Indicator */}
      <div className={`p-4 rounded-lg border-2 ${
        isBalanced 
          ? 'bg-green-50 border-green-200' 
          : 'bg-amber-50 border-amber-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isBalanced ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-amber-600" />
            )}
            <span className="text-sm font-medium text-slate-700">Total Weight:</span>
          </div>
          <span className={`text-lg font-bold ${
            isBalanced ? 'text-green-600' : 'text-amber-600'
          }`}>
            {totalWeight}%
          </span>
        </div>
        {!isBalanced && (
          <p className="text-xs text-amber-700 mt-2">
            Weights should sum to 100% for balanced evaluation
          </p>
        )}
      </div>

      {/* Add Custom Criteria */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Add New Main Criteria
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={customCriteria}
              onChange={(e) => setCustomCriteria(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addMainCriteria()}
              placeholder="e.g., ESG Score, Diversity, etc."
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            <button
              onClick={addMainCriteria}
              disabled={!customCriteria.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add</span>
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Add Subcriteria
          </label>
          <div className="space-y-2">
            <select
              value={selectedCriteriaId}
              onChange={(e) => setSelectedCriteriaId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              {criteria.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <div className="flex space-x-2">
              <input
                type="text"
                value={customSubcriteria}
                onChange={(e) => setCustomSubcriteria(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addSubcriteria()}
                placeholder="e.g., Carbon Footprint, Gender Diversity, etc."
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
              <button
                onClick={addSubcriteria}
                disabled={!customSubcriteria.trim()}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button (optional, controlled by parent) */}
      {onSave && !embedded && (
        <button
          onClick={onSave}
          className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 font-medium transition-all shadow-md hover:shadow-lg"
        >
          Save Preferences & Regenerate AI Prompt
        </button>
      )}
    </div>
  );
}
