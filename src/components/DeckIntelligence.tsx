import { useState, useEffect } from 'react';
import {
  Upload,
  FileText,
  CheckCircle,
  AlertTriangle,
  BarChart,
  Target,
  TrendingUp,
  Download,
  Loader2,
  XCircle,
  FileDown
} from 'lucide-react';
import { api, PitchDeck, Company } from '../services/api';
import { VisualizationPanel } from './VisualizationPanel';

interface DeckIntelligenceProps {
  userType: 'founder' | 'vc';
}

export function DeckIntelligence({ userType }: DeckIntelligenceProps) {
  // Dual PDF Upload State
  const [deckFile, setDeckFile] = useState<File | null>(null);
  const [checklistFile, setChecklistFile] = useState<File | null>(null);
  
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [currentDeck, setCurrentDeck] = useState<PitchDeck | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      const data = await api.getCompanies();
      setCompanies(data);
      if (data.length > 0) {
        setSelectedCompany(data[0].id);
      }
    } catch (err) {
      console.error('Error loading companies:', err);
      setError('Failed to load companies');
    }
  };

  const validateFile = (file: File, isPitchDeck: boolean = false): string | null => {
    if (file.size > 15 * 1024 * 1024) {
      return 'File size must be less than 15MB';
    }
    if (isPitchDeck) {
      // Pitch deck must be PDF (for visual analysis)
      if (!file.name.match(/\.pdf$/i)) {
        return 'Pitch deck must be a PDF file';
      }
    } else {
      // Checklist can be PDF or Word
      if (!file.name.match(/\.(pdf|docx|doc)$/i)) {
        return 'Checklist must be a PDF or Word document (.docx, .doc)';
      }
    }
    return null;
  };

  const handleDeckFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validationError = validateFile(file, true); // true = isPitchDeck
      if (validationError) {
        setError(validationError);
        return;
      }
      setDeckFile(file);
      setError('');
    }
  };

  const handleChecklistFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validationError = validateFile(file, false); // false = isChecklist
      if (validationError) {
        setError(validationError);
        return;
      }
      setChecklistFile(file);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!deckFile || !checklistFile || !selectedCompany) {
      setError('Please select both pitch deck PDF, checklist PDF, and company');
      return;
    }

    setUploading(true);
    setError('');

    try {
      // Generate a valid UUID v4 for demo user
      const userId = crypto.randomUUID();
      
      console.log('Uploading dual PDFs:', deckFile.name, checklistFile.name);
      const deck = await api.uploadDualDeck(deckFile, checklistFile, selectedCompany, userId);
      
      setCurrentDeck(deck);
      setAnalyzing(true);

      // Poll for analysis completion
      pollForAnalysis(deck.id);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload decks');
      setUploading(false);
    }
  };

  const pollForAnalysis = async (deckId: string) => {
    const maxAttempts = 60; // 60 seconds max (increased for AI processing)
    let attempts = 0;

    const poll = setInterval(async () => {
      attempts++;
      
      try {
        const deck = await api.getDeck(deckId);
        console.log(`[Poll ${attempts}] Deck status:`, deck.status, 'Has analysis:', !!deck.analysis);
        
        setCurrentDeck(deck);

        // Backend uses 'completed' not 'analyzed'
        if (deck.status === 'completed' || deck.status === 'analyzed' || deck.status === 'failed') {
          console.log('✓ Analysis finished with status:', deck.status);
          clearInterval(poll);
          setUploading(false);
          setAnalyzing(false);
          
          if (deck.status === 'failed') {
            setError('Analysis failed. Please try again.');
          } else {
            console.log('✓ Analysis data:', deck.analysis);
          }
        }

        if (attempts >= maxAttempts) {
          console.log('⏱️ Polling timeout after', maxAttempts, 'attempts');
          clearInterval(poll);
          setUploading(false);
          setAnalyzing(false);
          setError('Analysis timed out. Please refresh to check status.');
        }
      } catch (err) {
        console.error('Error polling for analysis:', err);
      }
    }, 2000); // Poll every 2 seconds (less aggressive)
  };

  const deckSections = currentDeck?.analysis?.analysis?.sections || [];
  const overall = currentDeck?.analysis?.analysis?.overall;
  const ssoScore = currentDeck?.analysis?.sso_score 
    ? (parseFloat(currentDeck.analysis.sso_score.toString()) * 10).toFixed(1) 
    : '0.0';

  // Show upload form if no deck uploaded yet
  if (!currentDeck) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pitch Deck & Memo Intelligence</h1>
          <p className="text-slate-600 mt-1">
            {userType === 'founder' 
              ? 'Upload your deck to get instant feedback and SSO Readiness Score™'
              : 'Analyze multiple decks and compare them side-by-side'}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Dual PDF Upload */}
          <div className="bg-white rounded-xl border-2 border-dashed border-slate-300 p-8 hover:border-blue-400 transition-colors">
            <div className="flex items-start space-x-6">
              <Upload className="h-12 w-12 text-slate-400 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Upload Documents</h3>
                <p className="text-slate-600 mb-6">
                  Upload <strong>both</strong> the Pitch Deck PDF (with images/charts) and Founder Checklist PDF (unit economics, growth metrics, payment info)
                </p>
                
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Select Company
                  </label>
                  <select
                    value={selectedCompany}
                    onChange={(e) => setSelectedCompany(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose company...</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name} - {company.industry} ({company.stage})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* Pitch Deck Upload */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      1. Pitch Deck PDF <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleDeckFileSelect}
                      className="hidden"
                      id="deck-upload"
                    />
                    <label
                      htmlFor="deck-upload"
                      className="flex items-center justify-center px-4 py-3 border-2 border-blue-600 text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-all cursor-pointer"
                    >
                      <FileText className="h-5 w-5 mr-2" />
                      {deckFile ? 'Change Deck' : 'Choose Deck'}
                    </label>
                    {deckFile && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-800 flex items-center">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        {deckFile.name}
                      </div>
                    )}
                  </div>
                  
                  {/* Checklist Upload */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      2. Checklist (PDF or Word) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.docx,.doc"
                      onChange={handleChecklistFileSelect}
                      className="hidden"
                      id="checklist-upload"
                    />
                    <label
                      htmlFor="checklist-upload"
                      className="flex items-center justify-center px-4 py-3 border-2 border-teal-600 text-teal-600 rounded-lg font-medium hover:bg-teal-50 transition-all cursor-pointer"
                    >
                      <FileText className="h-5 w-5 mr-2" />
                      {checklistFile ? 'Change Checklist' : 'Choose Checklist'}
                    </label>
                    {checklistFile && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-800 flex items-center">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        {checklistFile.name}
                      </div>
                    )}
                    <p className="mt-1 text-xs text-slate-500">PDF or Word document (.docx, .doc)</p>
                  </div>
                </div>
                
                <button
                  onClick={handleUpload}
                  disabled={uploading || !deckFile || !checklistFile || !selectedCompany}
                  className="w-full bg-gradient-to-r from-blue-800 to-teal-600 text-white px-6 py-4 rounded-lg font-medium hover:from-blue-900 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      {analyzing ? 'AI analyzing visuals + checklist...' : 'Uploading...'}
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <Upload className="h-5 w-5 mr-2" />
                      Upload & Analyze Both Documents
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
          
          {/* Compare Reports - Coming Soon */}
          <div className="bg-white rounded-xl border-2 border-slate-200 p-12 text-center hover:border-blue-200 transition-colors">
            <FileText className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Compare Reports</h3>
            <p className="text-slate-600 mb-6">
              Compare multiple decks side by side with detailed analysis
            </p>
            <button
              className="bg-white border-2 border-blue-600 text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-blue-50 transition-all"
            >
              Select Reports to Compare
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: 'Instant Analysis',
              description: 'Get feedback in under 30 seconds',
              icon: Target
            },
            {
              title: 'Benchmark Comparison',
              description: 'Compare against 50+ top decks',
              icon: BarChart
            },
            {
              title: 'SSO Readiness Score™',
              description: 'Proprietary scoring system',
              icon: TrendingUp
            }
          ].map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="bg-white rounded-lg border border-slate-200 p-6">
                <Icon className="h-8 w-8 text-blue-600 mb-4" />
                <h3 className="font-semibold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-600">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Deck Analysis Complete</h1>
          <p className="text-slate-600 mt-1">
            Analysis for: "{currentDeck.file_name}" 
            {currentDeck.company_name && ` - ${currentDeck.company_name}`}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-3xl font-bold text-blue-800">{ssoScore}/10</p>
            <p className="text-sm text-slate-600">SSO Readiness Score™</p>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={() => window.location.href = '/benchmarks'}
              className="flex items-center space-x-2 bg-blue-800 text-white px-4 py-2 rounded-lg hover:bg-blue-900 transition-colors"
            >
              <BarChart className="h-4 w-4" />
              <span>View Industry Benchmarks</span>
            </button>
            <div className="relative group">
              <button className="flex items-center space-x-2 bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors">
                <Download className="h-4 w-4" />
                <span>Export Report</span>
              </button>
              {/* Dropdown menu */}
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                <a
                  href={`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/decks/${currentDeck.id}/report/txt`}
                  download
                  className="flex items-center space-x-2 px-4 py-2 text-slate-700 hover:bg-slate-50 first:rounded-t-lg"
                >
                  <FileText className="h-4 w-4" />
                  <span>Download as TXT</span>
                </a>
                <a
                  href={`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/decks/${currentDeck.id}/report/md`}
                  download
                  className="flex items-center space-x-2 px-4 py-2 text-slate-700 hover:bg-slate-50"
                >
                  <FileText className="h-4 w-4" />
                  <span>Download as Markdown</span>
                </a>
                <a
                  href={`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/decks/${currentDeck.id}/report/pdf`}
                  download
                  className="flex items-center space-x-2 px-4 py-2 text-slate-700 hover:bg-slate-50 last:rounded-b-lg"
                >
                  <FileText className="h-4 w-4" />
                  <span>Download as PDF</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Analytics Dashboard */}
      {overall && (
        <VisualizationPanel
          analysis={overall}
          sections={deckSections}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Section Analysis */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Section Analysis</h2>
          </div>
          <div className="p-6 space-y-4">
            {deckSections.map((section, index) => {
              const score = section.sectionScore || 0;
              const status = score >= 8 ? 'complete' : score >= 6 ? 'warning' : 'missing';
              
              const statusColors = {
                complete: 'text-green-600',
                warning: 'text-orange-600',
                missing: 'text-red-600'
              };
              
              const StatusIcon = status === 'complete' ? CheckCircle : AlertTriangle;
              
              return (
                <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <StatusIcon className={`h-5 w-5 ${statusColors[status]}`} />
                    <div>
                      <h3 className="font-medium text-slate-900">{section.sectionName}</h3>
                      <p className="text-sm text-slate-600">{section.feedback}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-semibold text-slate-900">{(score / 10).toFixed(1)}/10</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Key Insights */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Key Insights</h3>
            <div className="space-y-4">
              {overall?.weaknesses?.slice(0, 2).map((weakness, i) => (
                <div key={i} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium text-red-800">Improve: {weakness.split(':')[0]}</p>
                    <p className="text-sm text-slate-600">{weakness.split(':')[1] || weakness}</p>
                  </div>
                </div>
              ))}
              {overall?.strengths?.slice(0, 1).map((strength, i) => (
                <div key={i} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium text-green-800">Strong: {strength.split(':')[0]}</p>
                    <p className="text-sm text-slate-600">{strength.split(':')[1] || strength}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-800 to-teal-600 text-white rounded-lg p-6">
            <h3 className="font-semibold mb-2">AI-Powered Analysis</h3>
            <p className="text-sm text-blue-100 mb-4">Gemini Pro Intelligence</p>
            <div className="space-y-3">
              {overall?.keyInsights?.slice(0, 3).map((insight, i) => (
                <div key={i} className="flex justify-between">
                  <span className="text-sm">{insight}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Recommendation</h3>
            <p className="text-sm text-slate-700">{overall?.recommendation || 'Analysis pending...'}</p>
          </div>
        </div>
      </div>

      <div className="text-center py-4">
        <p className="text-xs text-slate-400">Analysis powered by Team SSO Intelligence Engine</p>
      </div>
    </div>
  );
}