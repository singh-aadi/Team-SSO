import { useState, useEffect } from 'react';
import { Upload, FileText, Trash2, Sparkles, AlertCircle, CheckCircle, XCircle, Clock, ArrowLeft, Send } from 'lucide-react';
import { vcContextApi, ContextItem, ContextSummary } from '../services/vcContextApi';
import { useNavigate, useParams } from 'react-router';

interface Props {
  deckId?: string;
  companyName?: string;
}

export function VCContextManager({ deckId: propDeckId, companyName = 'Unknown Company' }: Props) {
  const params = useParams();
  const deckId = propDeckId || params.deckId || 'demo';
  const navigate = useNavigate();
  const [items, setItems] = useState<ContextItem[]>([]);
  const [summary, setSummary] = useState<ContextSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState(false);

  useEffect(() => {
    loadItems();
    loadSummary();
  }, [deckId]);

  const loadItems = async () => {
    try {
      console.log('🔍 Loading context items for deckId:', deckId);
      const data = await vcContextApi.getContextItems(deckId);
      console.log('✅ Context items loaded:', data.items.length);
      setItems(data.items);
    } catch (err: any) {
      console.error('❌ Failed to load context items:', err);
      setError(`Failed to load context items: ${err.message}`);
    }
  };

  const loadSummary = async () => {
    try {
      const data = await vcContextApi.getLatestSummary(deckId);
      if (data.success && data.summary) {
        setSummary(data.summary);
      }
    } catch (err: any) {
      // No summary yet, that's okay
      console.log('No summary available yet');
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      await vcContextApi.uploadContext(deckId, file, 'meeting-notes');
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
    setLoading(true);
    setError(null);

    try {
      const result = await vcContextApi.synthesizeContext(deckId);
      setSummary(result.summary);
    } catch (err: any) {
      console.error('Synthesis failed:', err);
      setError(err.message || 'Failed to generate summary');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this context item?')) {
      return;
    }

    try {
      await vcContextApi.deleteContext(id);
      await loadItems();
      // If we had a summary, it might be outdated now
      if (summary) {
        setError('Context changed. Consider regenerating the summary.');
      }
    } catch (err: any) {
      console.error('Delete failed:', err);
      setError('Failed to delete context item');
    }
  };

  const handleExportToDeckIntelligence = () => {
    if (!summary) {
      setError('Please generate an AI summary before exporting');
      return;
    }

    try {
      // Create context object to export
      const contextToExport = {
        deckId,
        companyName,
        summary: {
          executiveSummary: summary.executiveSummary,
          keyInsights: summary.keyInsights,
          opportunities: summary.opportunities,
          risks: summary.risks,
          teamAssessment: summary.teamAssessment,
          nextSteps: summary.nextSteps,
          recommendation: summary.recommendation
        },
        items: items.map(item => ({
          fileName: item.file_name,
          fileType: item.file_type,
          uploadDate: item.created_at,
          contentLength: item.content_length
        })),
        exportedAt: new Date().toISOString(),
        itemCount: items.length
      };

      // Store in localStorage
      localStorage.setItem('importedContext', JSON.stringify(contextToExport));
      
      console.log('✅ Context exported to Deck Intelligence:', contextToExport);
      setExportSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (err: any) {
      console.error('Export failed:', err);
      setError('Failed to export context');
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
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
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
                      {summary.opportunities?.map((opp, idx) => (
                        <li key={idx} className="flex items-start space-x-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-slate-700">{opp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-orange-900 mb-3 uppercase tracking-wide">
                      Risk Factors
                    </h3>
                    <ul className="space-y-2">
                      {summary.risks?.map((risk, idx) => (
                        <li key={idx} className="flex items-start space-x-2 text-sm">
                          <AlertCircle className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
                          <span className="text-slate-700">{risk}</span>
                        </li>
                      ))}
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
                      {summary.nextSteps.map((step, idx) => (
                        <li key={idx} className="flex items-start space-x-3">
                          <span className="text-slate-400 font-mono text-sm mt-0.5">{idx + 1}.</span>
                          <span className="text-slate-700">{step}</span>
                        </li>
                      ))}
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
                  <span className="text-xs text-slate-500 ml-3">
                    Generated {new Date(summary.generatedAt).toLocaleString()}
                  </span>
                </div>

                {/* Export to Deck Intelligence */}
                <div className="pt-4 border-t border-slate-200">
                  <button
                    onClick={handleExportToDeckIntelligence}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 flex items-center space-x-2 transition-all shadow-md hover:shadow-lg"
                  >
                    <Send className="h-5 w-5" />
                    <span>Export to Deck Intelligence</span>
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
