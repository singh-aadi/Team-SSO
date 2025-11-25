/**
 * DEALBREAKER MATRIX COMPONENT
 * 
 * Layer 1 of VC Mode Agentic System
 * Configure hard rules that auto-reject or flag deals
 */

import { useState } from 'react';
import { AlertTriangle, XCircle, Flag, Plus, Trash2, Edit2, Check, X } from 'lucide-react';

interface Dealbreaker {
  id: string;
  description: string;
  category: 'team' | 'market' | 'product' | 'traction' | 'compliance' | 'strategy';
  severity: 'HARD_NO' | 'SOFT_NO' | 'FLAG';
  enabled: boolean;
}

interface DealbreakerMatrixProps {
  dealbreakers: Dealbreaker[];
  onChange: (dealbreakers: Dealbreaker[]) => void;
}

const DEFAULT_DEALBREAKERS: Dealbreaker[] = [
  { id: '1', description: 'Single founder with no co-founder commitment', category: 'team', severity: 'HARD_NO', enabled: true },
  { id: '2', description: 'No domain expertise (< 3 years in industry)', category: 'team', severity: 'HARD_NO', enabled: true },
  { id: '3', description: 'Founders not working full-time', category: 'team', severity: 'SOFT_NO', enabled: true },
  { id: '4', description: 'Market size < $1B TAM', category: 'market', severity: 'HARD_NO', enabled: true },
  { id: '5', description: 'Highly regulated industry (healthcare, fintech) without compliance team', category: 'market', severity: 'SOFT_NO', enabled: true },
  { id: '6', description: 'Saturated market with 10+ funded competitors', category: 'market', severity: 'FLAG', enabled: true },
  { id: '7', description: 'No working product/prototype', category: 'product', severity: 'HARD_NO', enabled: false },
  { id: '8', description: 'Technology easily replicable by incumbents', category: 'product', severity: 'FLAG', enabled: true },
  { id: '9', description: 'Zero revenue after 2+ years operation', category: 'traction', severity: 'SOFT_NO', enabled: true },
  { id: '10', description: 'No customer testimonials or LOIs', category: 'traction', severity: 'FLAG', enabled: true },
  { id: '11', description: 'Active IP litigation or disputes', category: 'compliance', severity: 'HARD_NO', enabled: true },
  { id: '12', description: 'Unclear go-to-market strategy', category: 'strategy', severity: 'FLAG', enabled: true },
];

const CATEGORY_COLORS = {
  team: 'bg-blue-100 text-blue-800 border-blue-300',
  market: 'bg-green-100 text-green-800 border-green-300',
  product: 'bg-purple-100 text-purple-800 border-purple-300',
  traction: 'bg-orange-100 text-orange-800 border-orange-300',
  compliance: 'bg-red-100 text-red-800 border-red-300',
  strategy: 'bg-indigo-100 text-indigo-800 border-indigo-300',
};

const SEVERITY_CONFIG = {
  HARD_NO: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', label: 'Hard No', desc: 'Auto-reject' },
  SOFT_NO: { icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50', label: 'Soft No', desc: 'Major concern' },
  FLAG: { icon: Flag, color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Flag', desc: 'Investigate' },
};

export function DealbreakerMatrix({ dealbreakers, onChange }: DealbreakerMatrixProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newDealbreaker, setNewDealbreaker] = useState({
    description: '',
    category: 'team' as Dealbreaker['category'],
    severity: 'FLAG' as Dealbreaker['severity'],
  });

  // Initialize with defaults if empty
  const currentDealbreakers = dealbreakers.length > 0 ? dealbreakers : DEFAULT_DEALBREAKERS;

  const handleToggle = (id: string) => {
    const updated = currentDealbreakers.map(db =>
      db.id === id ? { ...db, enabled: !db.enabled } : db
    );
    onChange(updated);
  };

  const handleSeverityChange = (id: string, severity: Dealbreaker['severity']) => {
    const updated = currentDealbreakers.map(db =>
      db.id === id ? { ...db, severity } : db
    );
    onChange(updated);
  };

  const handleEdit = (id: string, description: string) => {
    setEditingId(id);
    setEditText(description);
  };

  const handleSaveEdit = (id: string) => {
    const updated = currentDealbreakers.map(db =>
      db.id === id ? { ...db, description: editText } : db
    );
    onChange(updated);
    setEditingId(null);
    setEditText('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const handleDelete = (id: string) => {
    const updated = currentDealbreakers.filter(db => db.id !== id);
    onChange(updated);
  };

  const handleAddNew = () => {
    if (!newDealbreaker.description.trim()) return;

    const newDb: Dealbreaker = {
      id: Date.now().toString(),
      description: newDealbreaker.description,
      category: newDealbreaker.category,
      severity: newDealbreaker.severity,
      enabled: true,
    };

    onChange([...currentDealbreakers, newDb]);
    setNewDealbreaker({
      description: '',
      category: 'team',
      severity: 'FLAG',
    });
    setIsAddingNew(false);
  };

  const enabledCount = currentDealbreakers.filter(db => db.enabled).length;
  const hardNoCount = currentDealbreakers.filter(db => db.enabled && db.severity === 'HARD_NO').length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Dealbreaker Matrix</h3>
          <p className="text-sm text-gray-600 mt-1">
            Define hard rules that automatically filter deals. AI will check each deck against these criteria.
          </p>
          <div className="flex gap-4 mt-3 text-sm">
            <span className="text-gray-700">
              <span className="font-semibold text-blue-600">{enabledCount}</span> enabled
            </span>
            <span className="text-gray-700">
              <span className="font-semibold text-red-600">{hardNoCount}</span> Hard No rules
            </span>
          </div>
        </div>
        <button
          onClick={() => setIsAddingNew(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Dealbreaker
        </button>
      </div>

      {/* Severity Legend */}
      <div className="flex gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        {Object.entries(SEVERITY_CONFIG).map(([key, config]) => {
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
          <h4 className="font-medium text-gray-900">Add New Dealbreaker</h4>
          <input
            type="text"
            value={newDealbreaker.description}
            onChange={(e) => setNewDealbreaker({ ...newDealbreaker, description: e.target.value })}
            placeholder="Describe the dealbreaker condition..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="flex gap-3">
            <select
              value={newDealbreaker.category}
              onChange={(e) => setNewDealbreaker({ ...newDealbreaker, category: e.target.value as Dealbreaker['category'] })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="team">Team</option>
              <option value="market">Market</option>
              <option value="product">Product</option>
              <option value="traction">Traction</option>
              <option value="compliance">Compliance</option>
              <option value="strategy">Strategy</option>
            </select>
            <select
              value={newDealbreaker.severity}
              onChange={(e) => setNewDealbreaker({ ...newDealbreaker, severity: e.target.value as Dealbreaker['severity'] })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="HARD_NO">Hard No (Auto-reject)</option>
              <option value="SOFT_NO">Soft No (Major concern)</option>
              <option value="FLAG">Flag (Investigate)</option>
            </select>
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

      {/* Dealbreaker List */}
      <div className="space-y-2">
        {currentDealbreakers.map((db) => {
          const isEditing = editingId === db.id;

          return (
            <div
              key={db.id}
              className={`p-4 rounded-lg border-2 transition-all ${
                db.enabled ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-300 opacity-60'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Toggle Switch */}
                <button
                  onClick={() => handleToggle(db.id)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    db.enabled ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      db.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      {isEditing ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSaveEdit(db.id)}
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
                          <p className={`text-sm font-medium ${db.enabled ? 'text-gray-900' : 'text-gray-600'}`}>
                            {db.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded border ${CATEGORY_COLORS[db.category]}`}>
                              {db.category}
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Severity & Actions */}
                    {!isEditing && (
                      <div className="flex items-center gap-3">
                        {/* Severity Selector */}
                        <div className="flex gap-1">
                          {(['HARD_NO', 'SOFT_NO', 'FLAG'] as const).map((sev) => {
                            const Icon = SEVERITY_CONFIG[sev].icon;
                            const isActive = db.severity === sev;
                            return (
                              <button
                                key={sev}
                                onClick={() => handleSeverityChange(db.id, sev)}
                                className={`p-2 rounded-lg border-2 transition-all ${
                                  isActive
                                    ? `${SEVERITY_CONFIG[sev].bg} border-current ${SEVERITY_CONFIG[sev].color}`
                                    : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'
                                }`}
                                title={SEVERITY_CONFIG[sev].label}
                              >
                                <Icon className="w-4 h-4" />
                              </button>
                            );
                          })}
                        </div>

                        {/* Edit/Delete */}
                        <button
                          onClick={() => handleEdit(db.id, db.description)}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(db.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {currentDealbreakers.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p>No dealbreakers configured. Click "Add Dealbreaker" to get started.</p>
        </div>
      )}
    </div>
  );
}
