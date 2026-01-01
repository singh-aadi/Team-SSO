import { useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface EmailItem {
  id: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
  selected?: boolean;
}

interface GmailImportProps {
  onImport: (items: Array<{
    source: string;
    content: string;
    importance: 'high' | 'medium' | 'low';
  }>) => void;
  onClose: () => void;
}

export default function GmailImport({ onImport, onClose }: GmailImportProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [emails, setEmails] = useState<EmailItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Search filters
  const [subject, setSubject] = useState('');
  const [from, setFrom] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [maxResults, setMaxResults] = useState(20);
  
  // Import settings
  const [defaultImportance, setDefaultImportance] = useState<'high' | 'medium' | 'low'>('medium');

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/gmail/auth/url`);
      const data = await response.json();
      
      if (data.success && data.authUrl) {
        // Open OAuth window
        const authWindow = window.open(
          data.authUrl,
          'Gmail Authorization',
          'width=600,height=700,left=100,top=100'
        );
        
        // Listen for OAuth callback
        const handleMessage = async (event: MessageEvent) => {
          if (event.data.type === 'GMAIL_AUTH_SUCCESS') {
            window.removeEventListener('message', handleMessage);
            authWindow?.close();
            
            // Exchange code for tokens
            const tokenResponse = await fetch(`${API_URL}/gmail/auth/callback`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ code: event.data.code })
            });
            
            const tokenData = await tokenResponse.json();
            if (tokenData.success) {
              setAccessToken(tokenData.accessToken);
              setIsConnected(true);
            } else {
              setError('Failed to complete authentication');
            }
          }
        };
        
        window.addEventListener('message', handleMessage);
        
        // Fallback: Check URL for callback
        const checkCallback = setInterval(async () => {
          try {
            if (authWindow?.closed) {
              clearInterval(checkCallback);
              window.removeEventListener('message', handleMessage);
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
          }
        }, 300000);
        
      } else {
        setError('Failed to get authorization URL');
      }
    } catch (err) {
      setError('Failed to connect to Gmail');
      console.error('Gmail connect error:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSearch = async () => {
    if (!accessToken) return;
    
    setIsSearching(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/gmail/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken,
          filters: {
            subject: subject || undefined,
            from: from || undefined,
            after: startDate ? new Date(startDate).toISOString().split('T')[0] : undefined,
            before: endDate ? new Date(endDate).toISOString().split('T')[0] : undefined,
            maxResults
          }
        })
      });
      
      const data = await response.json();
      
      if (data.success && data.emails) {
        setEmails(data.emails.map((email: EmailItem) => ({ ...email, selected: true })));
      } else {
        setError(data.error || 'Failed to search emails');
      }
    } catch (err) {
      setError('Failed to search emails');
      console.error('Gmail search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const toggleEmailSelection = (emailId: string) => {
    setEmails(emails.map(email => 
      email.id === emailId ? { ...email, selected: !email.selected } : email
    ));
  };

  const toggleSelectAll = () => {
    const allSelected = emails.every(e => e.selected);
    setEmails(emails.map(email => ({ ...email, selected: !allSelected })));
  };

  const handleImport = async () => {
    const selectedEmails = emails.filter(e => e.selected);
    if (selectedEmails.length === 0) {
      setError('Please select at least one email to import');
      return;
    }
    
    setIsImporting(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/gmail/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken,
          emailIds: selectedEmails.map(e => e.id),
          importance: defaultImportance
        })
      });
      
      const data = await response.json();
      
      if (data.success && data.contextItems) {
        onImport(data.contextItems);
        onClose();
      } else {
        setError(data.error || 'Failed to import emails');
      }
    } catch (err) {
      setError('Failed to import emails');
      console.error('Gmail import error:', err);
    } finally {
      setIsImporting(false);
    }
  };

  const selectedCount = emails.filter(e => e.selected).length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 18h-2V9.25L12 13 6 9.25V18H4V6h1.2l6.8 4.25L18.8 6H20v12zm0-14H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Import from Gmail</h2>
              <p className="text-sm text-slate-400">Search and import emails as VC context</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-180px)]">
          {!isConnected ? (
            /* Connect Step */
            <div className="p-8 text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 18h-2V9.25L12 13 6 9.25V18H4V6h1.2l6.8 4.25L18.8 6H20v12zm0-14H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z"/>
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Connect Your Gmail</h3>
              <p className="text-slate-400 mb-6 max-w-md mx-auto">
                Connect your Gmail account to search and import emails from VCs, founders, and deal discussions as context items.
              </p>
              
              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg font-medium hover:from-red-600 hover:to-orange-600 disabled:opacity-50 transition-all flex items-center gap-2 mx-auto"
              >
                {isConnecting ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Connecting...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
                    </svg>
                    Connect with Google
                  </>
                )}
              </button>
              
              <p className="text-xs text-slate-500 mt-4">
                We only read your emails. We never send emails or modify your mailbox.
              </p>
            </div>
          ) : (
            /* Search & Select Step */
            <div className="p-6">
              {/* Search Filters */}
              <div className="bg-slate-900/50 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Search Filters
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Subject Contains</label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g., term sheet, investment"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">From</label>
                    <input
                      type="text"
                      value={from}
                      onChange={(e) => setFrom(e.target.value)}
                      placeholder="e.g., @sequoia.com"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Max Results</label>
                    <select
                      value={maxResults}
                      onChange={(e) => setMaxResults(Number(e.target.value))}
                      className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                  <button
                    onClick={handleSearch}
                    disabled={isSearching}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2 mt-5"
                  >
                    {isSearching ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                        </svg>
                        Searching...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Search Emails
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Email Results */}
              {emails.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={toggleSelectAll}
                        className="text-sm text-blue-400 hover:text-blue-300"
                      >
                        {emails.every(e => e.selected) ? 'Deselect All' : 'Select All'}
                      </button>
                      <span className="text-sm text-slate-400">
                        {selectedCount} of {emails.length} selected
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-slate-400">Default Importance:</label>
                      <select
                        value={defaultImportance}
                        onChange={(e) => setDefaultImportance(e.target.value as 'high' | 'medium' | 'low')}
                        className="px-2 py-1 bg-slate-800 border border-slate-600 rounded text-white text-sm focus:border-blue-500 focus:outline-none"
                      >
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {emails.map((email) => (
                      <div
                        key={email.id}
                        onClick={() => toggleEmailSelection(email.id)}
                        className={`p-3 rounded-lg cursor-pointer transition-all ${
                          email.selected
                            ? 'bg-blue-900/30 border border-blue-500/50'
                            : 'bg-slate-900/50 border border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-5 h-5 rounded flex-shrink-0 mt-0.5 flex items-center justify-center ${
                            email.selected ? 'bg-blue-500' : 'bg-slate-700'
                          }`}>
                            {email.selected && (
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-sm font-medium text-white truncate">{email.subject}</h4>
                              <span className="text-xs text-slate-500 flex-shrink-0">{email.date}</span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">{email.from}</p>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{email.snippet}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {emails.length === 0 && !isSearching && (
                <div className="text-center py-8 text-slate-400">
                  <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <p>Use the filters above to search for emails</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mx-6 mb-4 p-3 bg-red-900/30 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700 bg-slate-900/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          {isConnected && emails.length > 0 && (
            <button
              onClick={handleImport}
              disabled={isImporting || selectedCount === 0}
              className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg font-medium hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {isImporting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Importing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Import {selectedCount} Email{selectedCount !== 1 ? 's' : ''}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
