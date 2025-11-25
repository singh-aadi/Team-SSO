/**
 * PATTERN MEMORY BANK COMPONENT
 * 
 * Layer 2 of VC Mode Agentic System
 * Learn from past investments - codify success/failure patterns
 */

import { useState } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, Plus, Trash2, Edit2, Check, X } from 'lucide-react';

interface Pattern {
  id: string;
  pattern: string;
  type: 'success' | 'failure' | 'warning';
  weight: number; // 0-100%
  examples?: string;
}

interface PatternMemoryBankProps {
  patterns: Pattern[];
  onChange: (patterns: Pattern[]) => void;
}

const DEFAULT_PATTERNS: Pattern[] = [
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
  },
];

const TYPE_CONFIG = {
  success: {
    icon: TrendingUp,
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200',
    label: 'Success Pattern',
    desc: 'Historically led to good outcomes'
  },
  failure: {
    icon: TrendingDown,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    label: 'Failure Pattern',
    desc: 'Historically led to poor outcomes'
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    label: 'Warning Pattern',
    desc: 'Requires extra diligence'
  },
};

export function PatternMemoryBank({ patterns, onChange }: PatternMemoryBankProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<{ pattern: string; examples: string }>({ pattern: '', examples: '' });
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newPattern, setNewPattern] = useState({
    pattern: '',
    type: 'success' as Pattern['type'],
    weight: 75,
    examples: '',
  });

  const currentPatterns = patterns.length > 0 ? patterns : DEFAULT_PATTERNS;

  const handleWeightChange = (id: string, weight: number) => {
    const updated = currentPatterns.map(p =>
      p.id === id ? { ...p, weight } : p
    );
    onChange(updated);
  };

  const handleTypeChange = (id: string, type: Pattern['type']) => {
    const updated = currentPatterns.map(p =>
      p.id === id ? { ...p, type } : p
    );
    onChange(updated);
  };

  const handleEdit = (id: string, pattern: string, examples?: string) => {
    setEditingId(id);
    setEditData({ pattern, examples: examples || '' });
  };

  const handleSaveEdit = (id: string) => {
    const updated = currentPatterns.map(p =>
      p.id === id ? { ...p, pattern: editData.pattern, examples: editData.examples } : p
    );
    onChange(updated);
    setEditingId(null);
    setEditData({ pattern: '', examples: '' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({ pattern: '', examples: '' });
  };

  const handleDelete = (id: string) => {
    const updated = currentPatterns.filter(p => p.id !== id);
    onChange(updated);
  };

  const handleAddNew = () => {
    if (!newPattern.pattern.trim()) return;

    const pattern: Pattern = {
      id: Date.now().toString(),
      pattern: newPattern.pattern,
      type: newPattern.type,
      weight: newPattern.weight,
      examples: newPattern.examples || undefined,
    };

    onChange([...currentPatterns, pattern]);
    setNewPattern({
      pattern: '',
      type: 'success',
      weight: 75,
      examples: '',
    });
    setIsAddingNew(false);
  };

  // Calculate bias warning
  const successCount = currentPatterns.filter(p => p.type === 'success').length;
  const failureCount = currentPatterns.filter(p => p.type === 'failure').length;
  const hasConfirmationBias = failureCount > 0 && successCount / failureCount > 2;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Pattern Memory Bank</h3>
          <p className="text-sm text-gray-600 mt-1">
            Codify patterns from your past investments. AI will match these against new deals.
          </p>
          <div className="flex gap-4 mt-3 text-sm">
            <span className="text-gray-700">
              <span className="font-semibold text-green-600">{successCount}</span> success patterns
            </span>
            <span className="text-gray-700">
              <span className="font-semibold text-red-600">{failureCount}</span> failure patterns
            </span>
          </div>
          {hasConfirmationBias && (
            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <p className="text-xs text-yellow-800">
                <strong>Confirmation Bias Alert:</strong> You have {successCount}x more success patterns than failure patterns.
                Consider adding more failure patterns to maintain balanced evaluation.
              </p>
            </div>
          )}
        </div>
        <button
          onClick={() => setIsAddingNew(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Pattern
        </button>
      </div>

      {/* Type Legend */}
      <div className="flex gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        {Object.entries(TYPE_CONFIG).map(([key, config]) => {
          const Icon = config.icon;
          return (
            <div key={key} className="flex items-center gap-2">
              <Icon className={`w-5 h-5 ${config.color}`} />
              <div>
                <div className="text-sm font-medium text-gray-900">{config.label}</div>
                <div className="text-xs text-gray-600">{config.desc}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add New Form */}
      {isAddingNew && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
          <h4 className="font-medium text-gray-900">Add New Pattern</h4>
          <input
            type="text"
            value={newPattern.pattern}
            onChange={(e) => setNewPattern({ ...newPattern, pattern: e.target.value })}
            placeholder="Describe the pattern (e.g., 'Y Combinator alumnus')"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <textarea
            value={newPattern.examples}
            onChange={(e) => setNewPattern({ ...newPattern, examples: e.target.value })}
            placeholder="Examples (optional): 'Airbnb, Stripe, Dropbox founders...'"
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="flex gap-3 items-center">
            <select
              value={newPattern.type}
              onChange={(e) => setNewPattern({ ...newPattern, type: e.target.value as Pattern['type'] })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="success">Success Pattern</option>
              <option value="failure">Failure Pattern</option>
              <option value="warning">Warning Pattern</option>
            </select>
            <div className="flex-1">
              <label className="text-sm text-gray-700 mb-1 block">Weight (Confidence): {newPattern.weight}%</label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={newPattern.weight}
                onChange={(e) => setNewPattern({ ...newPattern, weight: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAddNew}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add
            </button>
            <button
              onClick={() => setIsAddingNew(false)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Pattern List */}
      <div className="space-y-3">
        {currentPatterns.map((pattern) => {
          const TypeIcon = TYPE_CONFIG[pattern.type].icon;
          const isEditing = editingId === pattern.id;

          return (
            <div
              key={pattern.id}
              className={`p-4 rounded-lg border-2 ${TYPE_CONFIG[pattern.type].bg} ${TYPE_CONFIG[pattern.type].border}`}
            >
              <div className="flex items-start gap-3">
                <TypeIcon className={`w-5 h-5 mt-1 flex-shrink-0 ${TYPE_CONFIG[pattern.type].color}`} />

                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editData.pattern}
                        onChange={(e) => setEditData({ ...editData, pattern: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Pattern description"
                      />
                      <textarea
                        value={editData.examples}
                        onChange={(e) => setEditData({ ...editData, examples: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Examples (optional)"
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveEdit(pattern.id)}
                          className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                          <Check className="w-4 h-4" />
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="flex items-center gap-1 px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                        >
                          <X className="w-4 h-4" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{pattern.pattern}</p>
                          {pattern.examples && (
                            <p className="text-xs text-gray-600 mt-1">
                              <span className="font-medium">Examples:</span> {pattern.examples}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          {/* Type Selector */}
                          <div className="flex gap-1">
                            {(['success', 'failure', 'warning'] as const).map((type) => {
                              const Icon = TYPE_CONFIG[type].icon;
                              const isActive = pattern.type === type;
                              return (
                                <button
                                  key={type}
                                  onClick={() => handleTypeChange(pattern.id, type)}
                                  className={`p-1.5 rounded border-2 transition-all ${
                                    isActive
                                      ? `${TYPE_CONFIG[type].bg} border-current ${TYPE_CONFIG[type].color}`
                                      : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'
                                  }`}
                                  title={TYPE_CONFIG[type].label}
                                >
                                  <Icon className="w-3.5 h-3.5" />
                                </button>
                              );
                            })}
                          </div>

                          <button
                            onClick={() => handleEdit(pattern.id, pattern.pattern, pattern.examples)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(pattern.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Weight Slider */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                          <span>Confidence Weight</span>
                          <span className="font-medium">{pattern.weight}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={pattern.weight}
                          onChange={(e) => handleWeightChange(pattern.id, parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {currentPatterns.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p>No patterns configured. Click "Add Pattern" to get started.</p>
        </div>
      )}
    </div>
  );
}
