import { useState, useEffect } from 'react';
import { Upload, FileText, Trash2, Sparkles, AlertCircle, CheckCircle, XCircle, Clock, ArrowLeft, Send, Mail, BookOpen, FileStack, MessageSquare } from 'lucide-react';
import { vcContextApi, ContextItem, ContextSummary } from '../services/vcContextApi';
import { useNavigate, useParams } from 'react-router';

interface Props {
  deckId?: string;
  companyName?: string;
  embedded?: boolean; // When true, hides navigation and makes it wizard-friendly
  onContextUpdate?: () => void; // Callback when context is updated
  globalMode?: boolean; // When true, works without deck selection (for VC Mode)
}

export function VCContextManager({ deckId: propDeckId, companyName = 'Unknown Company', embedded = false, onContextUpdate, globalMode = false }: Props) {
  const params = useParams();
  const navigate = useNavigate();
  
  // In global mode, use a special UUID for the global context deck
  // This matches the deck created in migration 008_add_global_vc_context_deck.sql
  const GLOBAL_VC_CONTEXT_ID = '00000000-0000-0000-0000-000000000002';
  const deckId = globalMode ? GLOBAL_VC_CONTEXT_ID : (propDeckId || params.deckId);
  const [items, setItems] = useState<ContextItem[]>([]);
  const [summary, setSummary] = useState<ContextSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [availableDecks, setAvailableDecks] = useState<any[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string>('');

  // Load available decks if no deckId provided
  useEffect(() => {
    if (!deckId) {
      loadAvailableDecks();
    }
  }, [deckId]);

  // Load context items and summary when deck is selected
  useEffect(() => {
    if (deckId || selectedDeckId) {
      loadItems();
      loadSummary();
    }
  }, [deckId, selectedDeckId]);

  const loadAvailableDecks = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/decks');
      const data = await response.json();
      setAvailableDecks(data.decks || []);
      if (data.decks && data.decks.length > 0) {
        setSelectedDeckId(data.decks[0].id);
      }
    } catch (err) {
      console.error('Failed to load decks:', err);
    }
  };

  const loadItems = async () => {
    const currentDeckId = deckId || selectedDeckId;
    if (!currentDeckId) return;

    try {
      console.log('🔍 Loading context items for deckId:', currentDeckId);
      const data = await vcContextApi.getContextItems(currentDeckId);
      console.log('✅ Context items loaded:', data.items.length);
      setItems(data.items);
    } catch (err: any) {
      console.error('❌ Failed to load context items:', err);
      setError(`Failed to load context items: ${err.message}`);
    }
  };

  const loadSummary = async () => {
    const currentDeckId = deckId || selectedDeckId;
    if (!currentDeckId) return;

    try {
      const data = await vcContextApi.getLatestSummary(currentDeckId);
      if (data.success && data.summary) {
        setSummary(data.summary);
      }
    } catch (err: any) {
      // No summary yet, that's okay
      console.log('No summary available yet');
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const currentDeckId = deckId || selectedDeckId;
    if (!currentDeckId) {
      setError('Please select a deck first');
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (25MB)
    if (file.size > 25 * 1024 * 1024) {
      setError('File size must be less than 25MB');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      await vcContextApi.uploadContext(currentDeckId, file, 'meeting-notes');
      await loadItems();
      e.target.value = ''; // Reset input
    } catch (err: any) {
      console.error('Upload failed:', err);
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSynthesize = async () => {
    const currentDeckId = deckId || selectedDeckId;
    if (!currentDeckId) {
      setError('Please select a deck first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await vcContextApi.synthesizeContext(currentDeckId);
      setSummary(result.summary);
    } catch (err: any) {
      console.error('Synthesis failed:', err);
      setError(err.message || 'Failed to generate summary');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await vcContextApi.deleteContext(id);
      await loadItems();
      // If we had a summary, it might be outdated now
      if (summary) {
        setError('Context changed. Consider regenerating the summary.');
      }
      console.log('Context item deleted successfully');
    } catch (err: any) {
      console.error('Delete failed:', err);
      setError('Failed to delete context item');
    }
  };

  const handleExportToDeckIntelligence = async () => {
    const currentDeckId = deckId || selectedDeckId;
    
    if (!currentDeckId) {
      setError('Please select a deck first');
      return;
    }

    if (!summary) {
      setError('Please generate an AI summary before exporting');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Call API to export to database
      const response = await fetch('http://localhost:3000/api/vc-context/export-to-deck-intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deckId: currentDeckId,
          userId: '1' // TODO: Get from auth context
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Export failed');
      }

      const data = await response.json();
      console.log('✅ Context exported to Deck Intelligence:', data);
      
      setExportSuccess(true);
      
      // Notify parent component
      if (onContextUpdate) {
        onContextUpdate();
      }
      
      // Hide success message after 5 seconds
      setTimeout(() => setExportSuccess(false), 5000);
    } catch (err: any) {
      console.error('Export failed:', err);
      setError(err.message || 'Failed to export context');
    } finally {
      setLoading(false);
    }
  };

  const getRecommendationColor = (decision: string) => {
    switch (decision) {
      case 'Proceed':
        return 'bg-green-50 border-green-200 text-green-900';
      case 'Pause':
        return 'bg-yellow-50 border-yellow-200 text-yellow-900';
      case 'Pass':
        return 'bg-red-50 border-red-200 text-red-900';
      default:
        return 'bg-slate-50 border-slate-200 text-slate-900';
    }
  };

  const getRecommendationIcon = (decision: string) => {
    switch (decision) {
      case 'Proceed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'Pause':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'Pass':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-slate-600" />;
    }
  };

  return (
    <div className={embedded ? 'space-y-6' : 'min-h-screen bg-slate-50 p-6'}>
      <div className={embedded ? 'space-y-6' : 'max-w-5xl mx-auto space-y-6'}>
        {/* Header */}
        {!embedded && (
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => navigate('/vc-journey')}
                className="flex items-center space-x-2 text-sm text-slate-600 hover:text-slate-900 mb-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to VC Journey</span>
              </button>
              <h1 className="text-3xl font-bold text-slate-900">VC Context Manager</h1>
              <p className="text-slate-600 mt-1">
                {companyName} • Collect and synthesize interaction context
              </p>
            </div>
          </div>
        )}
        
        {embedded && (
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">Upload Context Materials</h3>
            <p className="text-sm text-slate-600">
              Add meeting notes, transcripts, or due diligence documents
            </p>
          </div>
        )}

        {/* Deck Selector (when no deckId prop provided AND not in global mode) */}
        {!globalMode && !deckId && availableDecks.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Select a Deck to Manage Context
            </label>
            <select
              value={selectedDeckId}
              onChange={(e) => setSelectedDeckId(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a deck...</option>
              {availableDecks.map((deck) => (
                <option key={deck.id} value={deck.id}>
                  {deck.company_name} - {deck.founder_name || 'No founder name'}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-900">Error</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-900"
            >
              ×
            </button>
          </div>
        )}

        {/* Upload Section */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Upload Context</h2>
          <label className="block w-full border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-colors">
            <Upload className={`h-12 w-12 mx-auto mb-4 ${uploading ? 'text-blue-600 animate-pulse' : 'text-slate-400'}`} />
            <span className="block text-sm font-medium text-slate-700 mb-1">
              {uploading ? 'Uploading & Processing...' : 'Click to upload or drag and drop'}
            </span>
            <span className="block text-xs text-slate-500">
              Documents: .txt, .pdf, .docx, .ppt, .pptx | Audio/Video: .mp3, .wav, .m4a, .mp4
            </span>
            <span className="block text-xs text-slate-400 mt-1">
              Max 100MB • Audio/video will be transcribed automatically
            </span>
            <input
              type="file"
              className="hidden"
              accept=".txt,.pdf,.docx,.doc,.ppt,.pptx,.mp3,.wav,.m4a,.mp4"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
        </div>

        {/* Import from Apps */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Import from Apps</h2>
          <p className="text-sm text-slate-600 mb-4">
            Connect your tools to automatically import meeting notes, emails, and documents
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Gmail */}
            <button
              onClick={() => setError('Gmail integration coming soon! For now, export emails as PDF and upload them.')}
              className="flex items-center space-x-3 p-4 border-2 border-slate-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors group"
            >
              <div className="p-2 bg-red-50 rounded-lg group-hover:bg-red-100">
                <Mail className="h-5 w-5 text-red-600" />
              </div>
              <div className="text-left flex-1">
                <p className="font-medium text-slate-900">Gmail</p>
                <p className="text-xs text-slate-500">Import email threads</p>
              </div>
              <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">Coming Soon</span>
            </button>

            {/* Slack */}
            <button
              onClick={() => setError('Slack integration coming soon! For now, copy/paste conversations into a text file.')}
              className="flex items-center space-x-3 p-4 border-2 border-slate-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors group"
            >
              <div className="p-2 bg-purple-50 rounded-lg group-hover:bg-purple-100">
                <MessageSquare className="h-5 w-5 text-purple-600" />
              </div>
              <div className="text-left flex-1">
                <p className="font-medium text-slate-900">Slack</p>
                <p className="text-xs text-slate-500">Import conversations</p>
              </div>
              <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">Coming Soon</span>
            </button>

            {/* Notion */}
            <button
              onClick={() => setError('Notion integration coming soon! For now, export pages as PDF or Markdown.')}
              className="flex items-center space-x-3 p-4 border-2 border-slate-200 rounded-lg hover:border-slate-400 hover:bg-slate-50 transition-colors group"
            >
              <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-slate-100">
                <BookOpen className="h-5 w-5 text-slate-700" />
              </div>
              <div className="text-left flex-1">
                <p className="font-medium text-slate-900">Notion</p>
                <p className="text-xs text-slate-500">Import pages & databases</p>
              </div>
              <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">Coming Soon</span>
            </button>

            {/* Obsidian */}
            <button
              onClick={() => setError('Obsidian integration coming soon! For now, copy vault files and upload as .txt or .md.')}
              className="flex items-center space-x-3 p-4 border-2 border-slate-200 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition-colors group"
            >
              <div className="p-2 bg-indigo-50 rounded-lg group-hover:bg-indigo-100">
                <FileStack className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="text-left flex-1">
                <p className="font-medium text-slate-900">Obsidian</p>
                <p className="text-xs text-slate-500">Import vault notes</p>
              </div>
              <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">Coming Soon</span>
            </button>
          </div>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              💡 <strong>Tip:</strong> While we build these integrations, you can manually export data from these apps and upload as files above.
            </p>
          </div>
        </div>

        {/* Context Items */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Context Items ({items.length})
          </h2>
          {items.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 mb-2">No context items yet</p>
              <p className="text-sm text-slate-400">
                Upload meeting notes, emails, or call transcripts to get started
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map(item => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center space-x-3 flex-1">
                    <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-900 truncate">{item.file_name}</p>
                      <p className="text-sm text-slate-500">
                        {new Date(item.created_at).toLocaleDateString()} • 
                        {' '}{(item.content_length / 1000).toFixed(1)}K characters
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Summary Section */}
        {items.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              <span>AI Context Summary</span>
            </h2>
            
            {!summary ? (
              <div className="text-center py-8">
                <button
                  onClick={handleSynthesize}
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 flex items-center space-x-2 mx-auto transition-colors"
                >
                  <Sparkles className="h-5 w-5" />
                  <span>{loading ? 'Generating Summary...' : 'Generate AI Summary'}</span>
                </button>
                <p className="text-sm text-slate-500 mt-3">
                  AI will analyze all {items.length} context {items.length === 1 ? 'item' : 'items'}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Executive Summary */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-2 uppercase tracking-wide">
                    Executive Summary
                  </h3>
                  <p className="text-slate-700 leading-relaxed">{summary.executiveSummary}</p>
                </div>

                {/* Key Insights */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-3 uppercase tracking-wide">
                    Key Insights
                  </h3>
                  <ul className="space-y-2">
                    {summary.keyInsights?.map((insight, idx) => (
                      <li key={idx} className="flex items-start space-x-3">
                        <span className="text-blue-600 font-bold mt-1">•</span>
                        <span className="text-slate-700 flex-1">{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Opportunities & Risks - Side by Side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-semibold text-green-900 mb-3 uppercase tracking-wide">
                      Opportunities
                    </h3>
                    <ul className="space-y-2">
                      {summary.opportunities?.map((opp, idx) => {
                        const text = typeof opp === 'string' ? opp : opp.insight;
                        const impact = typeof opp === 'object' && opp.impact;
                        return (
                          <li key={idx} className="flex items-start space-x-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <span className="text-slate-700">{text}</span>
                              {impact && (
                                <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
                                  impact === 'High' ? 'bg-green-100 text-green-700' :
                                  impact === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-gray-100 text-gray-600'
                                }`}>{impact}</span>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-orange-900 mb-3 uppercase tracking-wide">
                      Risk Factors
                    </h3>
                    <ul className="space-y-2">
                      {summary.risks?.map((risk, idx) => {
                        const text = typeof risk === 'string' ? risk : risk.concern;
                        const severity = typeof risk === 'object' && risk.severity;
                        return (
                          <li key={idx} className="flex items-start space-x-2 text-sm">
                            <AlertCircle className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <span className="text-slate-700">{text}</span>
                              {severity && (
                                <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
                                  severity === 'Critical' ? 'bg-red-100 text-red-700' :
                                  severity === 'High' ? 'bg-orange-100 text-orange-700' :
                                  severity === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-gray-100 text-gray-600'
                                }`}>{severity}</span>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>

                {/* Team Assessment */}
                {summary.teamAssessment && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-2 uppercase tracking-wide">
                      Team Assessment
                    </h3>
                    <p className="text-slate-700 leading-relaxed">{summary.teamAssessment}</p>
                  </div>
                )}

                {/* Next Steps */}
                {summary.nextSteps && summary.nextSteps.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-3 uppercase tracking-wide">
                      Recommended Next Steps
                    </h3>
                    <ul className="space-y-2">
                      {summary.nextSteps.map((step, idx) => {
                        const text = typeof step === 'string' ? step : step.action;
                        const priority = typeof step === 'object' && step.priority;
                        return (
                          <li key={idx} className="flex items-start space-x-3">
                            <span className="text-slate-400 font-mono text-sm mt-0.5">{idx + 1}.</span>
                            <div className="flex-1">
                              <span className="text-slate-700">{text}</span>
                              {priority && (
                                <span className={`ml-2 text-xs px-1.5 py-0.5 rounded font-medium ${
                                  priority === 'Critical' ? 'bg-red-100 text-red-700' :
                                  priority === 'High' ? 'bg-orange-100 text-orange-700' :
                                  'bg-blue-100 text-blue-700'
                                }`}>{priority}</span>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {/* Investment Recommendation */}
                {summary.recommendation && (
                  <div className={`p-6 rounded-lg border-2 ${getRecommendationColor(summary.recommendation.decision)}`}>
                    <div className="flex items-center space-x-3 mb-3">
                      {getRecommendationIcon(summary.recommendation.decision)}
                      <div>
                        <h3 className="text-lg font-bold">
                          Investment Recommendation: {summary.recommendation.decision.toUpperCase()}
                        </h3>
                        <p className="text-sm opacity-75">
                          Confidence: {summary.recommendation.confidence}%
                        </p>
                      </div>
                    </div>
                    <p className="leading-relaxed">{summary.recommendation.rationale}</p>
                  </div>
                )}

                {/* Regenerate Button */}
                <div className="pt-4 border-t border-slate-200">
                  <button
                    onClick={handleSynthesize}
                    disabled={loading}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {loading ? 'Regenerating...' : '🔄 Regenerate Summary'}
                  </button>
                  {summary.generatedAt && (
                    <span className="text-xs text-slate-500 ml-3">
                      Generated {new Date(summary.generatedAt).toLocaleString()}
                    </span>
                  )}
                </div>

                {/* Export to Deck Intelligence */}
                <div className="pt-4 border-t border-slate-200">
                  <button
                    onClick={handleExportToDeckIntelligence}
                    disabled={loading}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 flex items-center space-x-2 transition-all shadow-md hover:shadow-lg"
                  >
                    <Send className="h-5 w-5" />
                    <span>{loading ? 'Exporting...' : 'Export to Deck Intelligence'}</span>
                  </button>
                  <p className="text-sm text-slate-500 mt-2">
                    Send this context to enhance pitch deck analysis with background information
                  </p>
                </div>

                {/* Export Success Message */}
                {exportSuccess && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-900">Context Exported!</p>
                      <p className="text-sm text-green-700">
                        Your context has been saved. Go to Deck Intelligence to upload and analyze a pitch deck with this context.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
