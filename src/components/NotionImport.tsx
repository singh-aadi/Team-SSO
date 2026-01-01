import { useState } from 'react';
import { FileText, Search, Loader2, CheckCircle, Database } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface NotionPageItem {
  id: string;
  title: string;
  url: string;
  icon?: string;
  snippet: string;
  lastEditedTime: string;
  selected?: boolean;
}

interface NotionDatabaseItem {
  id: string;
  title: string;
  description: string;
  url: string;
  icon?: string;
}

interface NotionImportProps {
  onImport: (items: Array<{
    source: string;
    content: string;
    importance: 'high' | 'medium' | 'low';
  }>) => void;
  onClose: () => void;
}

export default function NotionImport({ onImport, onClose }: NotionImportProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [workspaceName, setWorkspaceName] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [pages, setPages] = useState<NotionPageItem[]>([]);
  const [databases, setDatabases] = useState<NotionDatabaseItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Search filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'page' | 'database'>('page');
  
  // Import settings
  const [defaultImportance, setDefaultImportance] = useState<'high' | 'medium' | 'low'>('medium');

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/notion/auth/url`);
      const data = await response.json();
      
      if (data.success && data.authUrl) {
        // Open OAuth window
        const authWindow = window.open(
          data.authUrl,
          'Notion Authorization',
          'width=600,height=700,left=100,top=100'
        );
        
        // Listen for OAuth callback
        const handleMessage = async (event: MessageEvent) => {
          if (event.data.type === 'NOTION_AUTH_SUCCESS') {
            window.removeEventListener('message', handleMessage);
            authWindow?.close();
            
            // Exchange code for tokens
            const tokenResponse = await fetch(`${API_URL}/notion/auth/callback`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ code: event.data.code })
            });
            
            const tokenData = await tokenResponse.json();
            if (tokenData.success) {
              setAccessToken(tokenData.accessToken);
              setWorkspaceName(tokenData.workspaceName || 'My Workspace');
              setIsConnected(true);
              setIsConnecting(false);
              
              // Auto-search after connecting
              await performSearch(tokenData.accessToken);
            } else {
              setError('Failed to complete authentication');
              setIsConnecting(false);
            }
          }
        };
        
        window.addEventListener('message', handleMessage);
        
        // Fallback: Check if window was closed
        const checkCallback = setInterval(async () => {
          try {
            if (authWindow?.closed) {
              clearInterval(checkCallback);
              window.removeEventListener('message', handleMessage);
              setIsConnecting(false);
            }
          } catch (e) {
            // Cross-origin error - window still open
          }
        }, 1000);
        
        // Timeout after 5 minutes
        setTimeout(() => {
          clearInterval(checkCallback);
          window.removeEventListener('message', handleMessage);
          if (!isConnected) {
            setIsConnecting(false);
            setError('Authentication timeout. Please try again.');
          }
        }, 300000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initiate Notion connection');
      setIsConnecting(false);
    }
  };

  const performSearch = async (token?: string) => {
    const searchToken = token || accessToken;
    if (!searchToken) return;

    setIsSearching(true);
    setError(null);
    
    try {
      const filters: any = {};
      
      if (searchQuery.trim()) {
        filters.query = searchQuery.trim();
      }
      
      if (filterType !== 'all') {
        filters.filter = filterType;
      }
      
      const response = await fetch(`${API_URL}/notion/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          accessToken: searchToken,
          filters 
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setPages(data.pages || []);
        setDatabases(data.databases || []);
      } else {
        setError(data.error || 'Search failed');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to search Notion');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = () => {
    performSearch();
  };

  const togglePageSelection = (pageId: string) => {
    setPages(pages.map(page => 
      page.id === pageId ? { ...page, selected: !page.selected } : page
    ));
  };

  const handleImport = async () => {
    const selectedPages = pages.filter(page => page.selected);
    
    if (selectedPages.length === 0) {
      setError('Please select at least one page to import');
      return;
    }

    setIsImporting(true);
    setError(null);
    
    try {
      const pageIds = selectedPages.map(page => page.id);
      
      const response = await fetch(`${API_URL}/notion/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          accessToken,
          pageIds,
          importance: defaultImportance
        })
      });
      
      const data = await response.json();
      
      if (data.success && data.contextItems) {
        onImport(data.contextItems);
        onClose();
      } else {
        setError(data.error || 'Import failed');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to import pages');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="h-8 w-8" />
              <div>
                <h2 className="text-2xl font-bold">Import from Notion</h2>
                <p className="text-slate-300 text-sm">Add pages from your Notion workspace</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-300 hover:text-white transition-colors"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!isConnected ? (
            <div className="text-center py-12">
              <div className="mb-6">
                <FileText className="h-24 w-24 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Connect Your Notion Workspace</h3>
                <p className="text-slate-600 max-w-md mx-auto">
                  Grant access to your Notion workspace to import pages as VC context
                </p>
              </div>
              
              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="bg-slate-900 text-white px-8 py-3 rounded-lg font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 mx-auto"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <FileText className="h-5 w-5" />
                    <span>Connect Notion</span>
                  </>
                )}
              </button>
              
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm max-w-md mx-auto">
                  {error}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Connected Status */}
              <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <div>
                    <p className="font-semibold text-slate-900">Connected to {workspaceName}</p>
                    <p className="text-sm text-slate-600">Ready to import pages</p>
                  </div>
                </div>
              </div>

              {/* Search Section */}
              <div className="space-y-3">
                <div className="flex space-x-3">
                  <input
                    type="text"
                    placeholder="Search pages..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="flex-1 border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as any)}
                    className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All</option>
                    <option value="page">Pages Only</option>
                    <option value="database">Databases Only</option>
                  </select>
                  <button
                    onClick={handleSearch}
                    disabled={isSearching}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                  >
                    {isSearching ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Search className="h-5 w-5" />
                    )}
                    <span>Search</span>
                  </button>
                </div>
              </div>

              {/* Results */}
              {pages.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900">Pages ({pages.length})</h3>
                    <button
                      onClick={() => setPages(pages.map(p => ({ ...p, selected: !pages.every(p => p.selected) })))}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      {pages.every(p => p.selected) ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  
                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {pages.map((page) => (
                      <div
                        key={page.id}
                        onClick={() => togglePageSelection(page.id)}
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${
                          page.selected
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <input
                            type="checkbox"
                            checked={page.selected || false}
                            onChange={() => togglePageSelection(page.id)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              {page.icon && <span className="text-xl">{page.icon}</span>}
                              <h4 className="font-semibold text-slate-900">{page.title}</h4>
                            </div>
                            <p className="text-sm text-slate-600 mb-2">{page.snippet}...</p>
                            <div className="flex items-center space-x-4 text-xs text-slate-500">
                              <span>Last edited: {new Date(page.lastEditedTime).toLocaleDateString()}</span>
                              <a
                                href={page.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-blue-600 hover:underline"
                              >
                                Open in Notion →
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Databases */}
              {databases.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-slate-900 flex items-center space-x-2">
                    <Database className="h-5 w-5" />
                    <span>Databases ({databases.length})</span>
                  </h3>
                  <div className="space-y-2">
                    {databases.map((db) => (
                      <div key={db.id} className="border border-slate-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-1">
                          {db.icon && <span className="text-xl">{db.icon}</span>}
                          <h4 className="font-semibold text-slate-900">{db.title}</h4>
                        </div>
                        {db.description && (
                          <p className="text-sm text-slate-600 mb-2">{db.description}</p>
                        )}
                        <a
                          href={db.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Open in Notion →
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {isConnected && pages.length > 0 && (
          <div className="border-t border-slate-200 p-6 bg-slate-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <label className="text-sm text-slate-700">
                  Importance:
                  <select
                    value={defaultImportance}
                    onChange={(e) => setDefaultImportance(e.target.value as any)}
                    className="ml-2 border border-slate-300 rounded px-3 py-1 text-sm"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </label>
                <span className="text-sm text-slate-600">
                  {pages.filter(p => p.selected).length} page(s) selected
                </span>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="px-6 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={isImporting || pages.filter(p => p.selected).length === 0}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Importing...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5" />
                      <span>Import Selected</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
