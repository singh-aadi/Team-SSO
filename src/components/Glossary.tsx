import React, { useState } from 'react';
import { BookOpen, Search, AlertCircle, CheckCircle, Edit3, Plus } from 'lucide-react';

export function Glossary() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All Terms' },
    { id: 'revenue', name: 'Revenue' },
    { id: 'users', name: 'Users' },
    { id: 'growth', name: 'Growth' },
    { id: 'valuation', name: 'Valuation' }
  ];

  const glossaryTerms = [
    {
      id: 1,
      term: 'Monthly Recurring Revenue (MRR)',
      category: 'revenue',
      definition: 'Predictable revenue that a company expects to receive every month from its customers.',
      formula: 'MRR = Average Revenue Per User × Total Monthly Users',
      consistency: 'high',
      conflicts: 0,
      lastUpdated: '2 days ago'
    },
    {
      id: 2,
      term: 'Customer Acquisition Cost (CAC)',
      category: 'growth',
      definition: 'The total cost of acquiring a new customer, including marketing and sales expenses.',
      formula: 'CAC = Total Acquisition Costs / Number of Customers Acquired',
      consistency: 'medium',
      conflicts: 2,
      lastUpdated: '1 week ago'
    },
    {
      id: 3,
      term: 'Active User',
      category: 'users',
      definition: 'A user who has engaged with the product within a specific time period.',
      formula: 'Varies by company definition (Daily, Weekly, Monthly)',
      consistency: 'low',
      conflicts: 5,
      lastUpdated: '3 days ago'
    },
    {
      id: 4,
      term: 'Churn Rate',
      category: 'users',
      definition: 'The percentage of customers who stop using a product during a given time frame.',
      formula: 'Churn Rate = (Customers Lost / Total Customers at Start) × 100',
      consistency: 'high',
      conflicts: 0,
      lastUpdated: '1 day ago'
    },
    {
      id: 5,
      term: 'Lifetime Value (LTV)',
      category: 'revenue',
      definition: 'The predicted net profit from the entire relationship with a customer.',
      formula: 'LTV = Average Revenue Per User / Churn Rate',
      consistency: 'medium',
      conflicts: 1,
      lastUpdated: '5 days ago'
    },
    {
      id: 6,
      term: 'Burn Rate',
      category: 'growth',
      definition: 'The rate at which a company is spending its available cash.',
      formula: 'Burn Rate = (Starting Cash - Ending Cash) / Number of Months',
      consistency: 'high',
      conflicts: 0,
      lastUpdated: '1 week ago'
    }
  ];

  const filteredTerms = glossaryTerms.filter(term => {
    const matchesSearch = term.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         term.definition.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || term.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getConsistencyColor = (consistency: string) => {
    switch (consistency) {
      case 'high': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-orange-600 bg-orange-50';
      case 'low': return 'text-red-600 bg-red-50';
      default: return 'text-slate-600 bg-slate-50';
    }
  };

  const getConsistencyIcon = (consistency: string) => {
    return consistency === 'high' ? CheckCircle : AlertCircle;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">SSO Glossary™</h1>
          <p className="text-slate-600 mt-1">
            Standardized definitions for startup and VC metrics
          </p>
        </div>
        <button className="flex items-center space-x-2 bg-blue-800 text-white px-4 py-2 rounded-lg hover:bg-blue-900 transition-colors">
          <Plus className="h-4 w-4" />
          <span>Add Term</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search definitions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-blue-800 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Glossary Terms */}
      <div className="space-y-4">
        {filteredTerms.map((term) => {
          const ConsistencyIcon = getConsistencyIcon(term.consistency);
          
          return (
            <div key={term.id} className="bg-white rounded-lg border border-slate-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-slate-900">{term.term}</h3>
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded">
                      {term.category}
                    </span>
                    <div className={`flex items-center space-x-1 px-2 py-1 rounded ${getConsistencyColor(term.consistency)}`}>
                      <ConsistencyIcon className="h-3 w-3" />
                      <span className="text-xs font-medium">{term.consistency} consistency</span>
                    </div>
                  </div>
                  <p className="text-slate-700 mb-3">{term.definition}</p>
                  <div className="bg-slate-50 rounded-lg p-4 mb-3">
                    <h4 className="font-medium text-slate-900 mb-2">Formula</h4>
                    <code className="text-sm text-blue-800 bg-blue-50 px-2 py-1 rounded">
                      {term.formula}
                    </code>
                  </div>
                </div>
                <button className="ml-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded">
                  <Edit3 className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="flex items-center space-x-4">
                  {term.conflicts > 0 && (
                    <div className="flex items-center space-x-1 text-orange-600">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">{term.conflicts} definition conflicts</span>
                    </div>
                  )}
                  <span className="text-sm text-slate-500">Updated {term.lastUpdated}</span>
                </div>
                <div className="flex space-x-2">
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    View Usage
                  </button>
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    Resolve Conflicts
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Consistency Summary */}
      <div className="bg-gradient-to-br from-blue-800 to-teal-600 text-white rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <BookOpen className="h-6 w-6" />
          <h2 className="text-lg font-semibold">Glossary Health</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">87%</p>
            <p className="text-sm text-blue-100">Terms Standardized</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white">8</p>
            <p className="text-sm text-blue-100">Conflicts to Resolve</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white">156</p>
            <p className="text-sm text-blue-100">Total Definitions</p>
          </div>
        </div>
      </div>

      <div className="text-center py-4">
        <p className="text-xs text-slate-400">SSO Glossary™ - Standardized by Team SSO</p>
      </div>
    </div>
  );
}