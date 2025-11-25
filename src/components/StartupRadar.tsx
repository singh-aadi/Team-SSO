import { useState, useEffect } from 'react';
import { 
  Globe,
  Plus,
  TrendingUp,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Trash2,
  Loader2
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface RadarSource {
  id: string;
  name: string;
  url: string;
  source_type: 'custom' | 'built-in';
  is_active: boolean;
  last_scraped_at: string | null;
  created_at: string;
}

interface RadarDataItem {
  id: string;
  source_id: string;
  source_name: string;
  source_url: string;
  company_name: string;
  headline: string;
  description: string;
  category: string;
  funding_amount: number | null;
  funding_stage: string | null;
  investors: string[];
  url: string;
  image_url: string | null;
  published_date: string;
  scraped_at: string;
}

export function StartupRadar() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [radarData, setRadarData] = useState<RadarDataItem[]>([]);
  const [sources, setSources] = useState<RadarSource[]>([]);
  const [categories, setCategories] = useState<Array<{ category: string; count: number }>>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddSourcePopup, setShowAddSourcePopup] = useState(false);
  const [showSourcesPopup, setShowSourcesPopup] = useState(false);
  const [newSource, setNewSource] = useState({ name: '', url: '' });
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());
  const [selectedSources, setSelectedSources] = useState<Set<string>>(new Set());
  const [bulkDeleteMode, setBulkDeleteMode] = useState(false);
  const [sourceBulkDeleteMode, setSourceBulkDeleteMode] = useState(false);

  // Fetch radar data
  const fetchRadarData = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/radar/data?category=${selectedCategory}&limit=50`,
        { headers: { 'Content-Type': 'application/json' } }
      );
      const data = await response.json();
      setRadarData(data.data || []);
    } catch (error) {
      console.error('Error fetching radar data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch sources
  const fetchSources = async () => {
    try {
      const response = await fetch(`${API_URL}/radar/sources`);
      const data = await response.json();
      setSources(data.sources || []);
    } catch (error) {
      console.error('Error fetching sources:', error);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/radar/categories`);
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Add new source
  const handleAddSource = async () => {
    if (!newSource.name || !newSource.url) {
      console.warn('Source name and URL are required');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/radar/sources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSource.name,
          url: newSource.url,
          addedBy: 'vc-001' // Replace with actual user ID from auth context
        })
      });

      if (response.ok) {
        console.log('Source added and scraping initiated');
        setShowAddSourcePopup(false);
        setNewSource({ name: '', url: '' });
        fetchSources();
        fetchRadarData();
        fetchCategories();
      } else {
        const error = await response.json();
        console.error('Failed to add source:', error.error);
      }
    } catch (error) {
      console.error('Error adding source:', error);
    }
  };

  // Refresh sources
  const handleRefreshSources = async () => {
    setRefreshing(true);
    try {
      const response = await fetch(`${API_URL}/radar/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`Refresh complete: ${result.totalItemsScraped} items scraped from ${result.sourcesRefreshed} sources`);
        fetchRadarData();
        fetchCategories();
        fetchSources();
      } else {
        console.error('Failed to refresh sources');
      }
    } catch (error) {
      console.error('Error refreshing sources:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Delete source
  const handleDeleteSource = async (sourceId: string) => {
    try {
      const response = await fetch(`${API_URL}/radar/sources/${sourceId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        console.log('Source deleted successfully');
        fetchSources();
        fetchRadarData();
        fetchCategories();
      } else {
        console.error('Failed to delete source');
      }
    } catch (error) {
      console.error('Error deleting source:', error);
    }
  };

  // Delete radar data entry
  const handleDeleteEntry = async (entryId: string) => {
    try {
      const response = await fetch(`${API_URL}/radar/data/${entryId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        console.log('Entry deleted successfully');
        fetchRadarData();
        fetchCategories();
      } else {
        console.error('Failed to delete entry');
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
    }
  };

  // Toggle entry selection
  const toggleEntrySelection = (entryId: string) => {
    const newSelected = new Set(selectedEntries);
    if (newSelected.has(entryId)) {
      newSelected.delete(entryId);
    } else {
      newSelected.add(entryId);
    }
    setSelectedEntries(newSelected);
  };

  // Toggle source selection
  const toggleSourceSelection = (sourceId: string) => {
    const newSelected = new Set(selectedSources);
    if (newSelected.has(sourceId)) {
      newSelected.delete(sourceId);
    } else {
      newSelected.add(sourceId);
    }
    setSelectedSources(newSelected);
  };

  // Select all entries
  const selectAllEntries = () => {
    setSelectedEntries(new Set(radarData.map(item => item.id)));
  };

  // Select all sources
  const selectAllSources = () => {
    const allSourceIds = sources.map(s => s.id);
    setSelectedSources(new Set(allSourceIds));
  };

  // Bulk delete entries
  const handleBulkDeleteEntries = async () => {
    if (selectedEntries.size === 0) {
      console.warn('No entries selected for deletion');
      return;
    }

    try {
      const deletePromises = Array.from(selectedEntries).map(entryId =>
        fetch(`${API_URL}/radar/data/${entryId}`, { method: 'DELETE' })
      );

      await Promise.all(deletePromises);
      console.log(`${selectedEntries.size} entries deleted successfully`);
      setSelectedEntries(new Set());
      setBulkDeleteMode(false);
      fetchRadarData();
      fetchCategories();
    } catch (error) {
      console.error('Error bulk deleting entries:', error);
    }
  };

  // Bulk delete sources
  const handleBulkDeleteSources = async () => {
    if (selectedSources.size === 0) {
      console.warn('No sources selected for deletion');
      return;
    }

    try {
      const deletePromises = Array.from(selectedSources).map(sourceId =>
        fetch(`${API_URL}/radar/sources/${sourceId}`, { method: 'DELETE' })
      );

      await Promise.all(deletePromises);
      console.log(`${selectedSources.size} sources deleted successfully`);
      setSelectedSources(new Set());
      setSourceBulkDeleteMode(false);
      fetchSources();
      fetchRadarData();
      fetchCategories();
    } catch (error) {
      console.error('Error bulk deleting sources:', error);
    }
  };

  // Load data on mount and category change
  useEffect(() => {
    fetchRadarData();
  }, [selectedCategory]);

  useEffect(() => {
    fetchSources();
    fetchCategories();
  }, []);

  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Startup Radar</h1>
          <p className="text-slate-600 mt-1">AI-powered startup intelligence from curated sources</p>
        </div>
      </div>

      {/* Category Filter + Action Buttons */}
      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Market Intel</h2>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowAddSourcePopup(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
            >
              <Plus className="h-4 w-4" />
              <span>Add Custom Source</span>
            </button>
            <button
              onClick={handleRefreshSources}
              disabled={refreshing}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {refreshing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Refreshing...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  <span>Refresh Sources</span>
                </>
              )}
            </button>
            <button
              onClick={() => setShowSourcesPopup(!showSourcesPopup)}
              className="flex items-center space-x-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-sm font-medium"
            >
              {showSourcesPopup ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              <span>Show Current Sources</span>
            </button>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex items-center space-x-2 flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.category}
              onClick={() => setSelectedCategory(cat.category)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                selectedCategory === cat.category
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat.category} ({cat.count})
            </button>
          ))}
        </div>
      </div>

      {/* Sources List (Collapsible) */}
      {showSourcesPopup && (
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-md font-semibold text-slate-900">
              Current Sources ({sources.length})
              {sourceBulkDeleteMode && (
                <span className="ml-2 text-sm font-normal text-blue-600">
                  - Selection Mode Active
                </span>
              )}
            </h3>
            <div className="flex items-center space-x-2">
              {!sourceBulkDeleteMode ? (
                <>
                  {sources.length > 0 && (
                    <button
                      onClick={() => setSourceBulkDeleteMode(true)}
                      className="px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 border border-red-200 rounded hover:bg-red-50"
                    >
                      Bulk Delete
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button
                    onClick={selectAllSources}
                    className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-200 rounded hover:bg-blue-50"
                  >
                    Select All
                  </button>
                  <button
                    onClick={() => {
                      setSourceBulkDeleteMode(false);
                      setSelectedSources(new Set());
                    }}
                    className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-700 border border-slate-200 rounded hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBulkDeleteSources}
                    disabled={selectedSources.size === 0}
                    className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Delete ({selectedSources.size})
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="space-y-2">
            {sources.map((source) => (
              <div 
                key={source.id} 
                className={`flex items-center p-3 rounded-lg transition-colors ${
                  sourceBulkDeleteMode
                    ? selectedSources.has(source.id)
                      ? 'bg-blue-50 border-2 border-blue-300'
                      : 'bg-slate-50 border-2 border-slate-200 hover:border-slate-300'
                    : 'bg-slate-50'
                }`}
              >
                {sourceBulkDeleteMode && (
                  <label className="flex items-center mr-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedSources.has(source.id)}
                      onChange={() => toggleSourceSelection(source.id)}
                      className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </label>
                )}
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-slate-900">{source.name}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      source.source_type === 'built-in' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {source.source_type}
                    </span>
                  </div>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline flex items-center space-x-1 mt-1"
                  >
                    <span className="truncate max-w-md">{source.url}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  {source.last_scraped_at && (
                    <p className="text-xs text-slate-500 mt-1">
                      Last scraped: {new Date(source.last_scraped_at).toLocaleString()}
                    </p>
                  )}
                </div>
                {!sourceBulkDeleteMode && (
                  <button
                    onClick={() => handleDeleteSource(source.id)}
                    className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded"
                    title={source.source_type === 'built-in' ? 'Built-in sources cannot be deleted individually' : 'Delete source'}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          {sources.length === 0 && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> You currently have no sources. Add custom sources using the button below.
              </p>
            </div>
          )}
          <button
            onClick={() => setShowAddSourcePopup(true)}
            className="mt-4 flex items-center space-x-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            <Plus className="h-4 w-4" />
            <span>Add Custom Source</span>
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      )}

      {/* Bulk Delete Controls for Radar Data */}
      {!loading && radarData.length > 0 && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Startup Intelligence ({radarData.length})
          </h2>
          <div className="flex items-center space-x-2">
            {!bulkDeleteMode ? (
              <button
                onClick={() => setBulkDeleteMode(true)}
                className="px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 border border-red-200 rounded hover:bg-red-50"
              >
                Bulk Delete
              </button>
            ) : (
              <>
                <button
                  onClick={selectAllEntries}
                  className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Select All
                </button>
                <button
                  onClick={() => {
                    setBulkDeleteMode(false);
                    setSelectedEntries(new Set());
                  }}
                  className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkDeleteEntries}
                  disabled={selectedEntries.size === 0}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Delete ({selectedEntries.size})
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Radar Data Grid */}
      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {radarData.length === 0 ? (
            <div className="col-span-2 text-center py-12">
              <Globe className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 mb-2">No startup intelligence found</p>
              <p className="text-sm text-slate-400">Add sources and refresh to see the latest startup news</p>
            </div>
          ) : (
            radarData.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="p-4">
                  {bulkDeleteMode && (
                    <div className="mb-3">
                      <input
                        type="checkbox"
                        checked={selectedEntries.has(item.id)}
                        onChange={() => toggleEntrySelection(item.id)}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                    </div>
                  )}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">{item.company_name}</h3>
                      <p className="text-sm text-slate-500">
                        {item.source_name} • {new Date(item.published_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                        {item.category}
                      </span>
                      {!bulkDeleteMode && (
                        <button
                          onClick={() => handleDeleteEntry(item.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete entry"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <h4 className="text-md font-medium text-slate-800 mb-2">{item.headline}</h4>
                  <p className="text-sm text-slate-600 mb-4">{item.description}</p>

                  {/* Funding Info */}
                  {(item.funding_amount || item.funding_stage) && (
                    <div className="flex items-center space-x-4 mb-4 text-sm">
                      {item.funding_amount && (
                        <div className="flex items-center space-x-1">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          <span className="font-medium text-green-700">
                            ${item.funding_amount}M raised
                          </span>
                        </div>
                      )}
                      {item.funding_stage && (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700">
                          {item.funding_stage}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Investors */}
                  {item.investors && item.investors.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-slate-700 mb-1">Investors:</p>
                      <div className="flex flex-wrap gap-1">
                        {item.investors.map((investor, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700"
                          >
                            {investor}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-100 p-4">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center justify-between"
                  >
                    <span>Read Full Article</span>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Add Source Popup */}
      {showAddSourcePopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Add Custom Source</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Source Name
                </label>
                <input
                  type="text"
                  value={newSource.name}
                  onChange={(e) => setNewSource((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., TechCrunch AI"
                  className="w-full rounded-md border-slate-200 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Source URL
                </label>
                <input
                  type="url"
                  value={newSource.url}
                  onChange={(e) => setNewSource((prev) => ({ ...prev, url: e.target.value }))}
                  placeholder="https://techcrunch.com/ai"
                  className="w-full rounded-md border-slate-200 shadow-sm"
                />
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Adding a source will immediately trigger AI scraping to extract startup intelligence from that source.
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddSourcePopup(false);
                  setNewSource({ name: '', url: '' });
                }}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSource}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                Add Source & Scrape
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
