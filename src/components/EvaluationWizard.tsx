import { useState, useEffect } from 'react';
import { 
  Upload, 
  CheckCircle, 
  MessageSquare, 
  Settings, 
  Sparkles,
  ArrowRight,
  ArrowLeft,
  SkipForward,
  AlertCircle,
  Loader2,
  FileText,
  X,
  BarChart3,
  TrendingUp,
  Award,
  Target
} from 'lucide-react';
import { VCContextManager } from './VCContextManager';
import { AdvancedVCEvaluation } from './AdvancedVCEvaluation';
import { api } from '../services/api';
import { vcContextApi } from '../services/vcContextApi';

interface EvaluationWizardProps {
  onComplete: (deckId: string, hasContext: boolean, hasPreferences: boolean) => void;
  onCancel: () => void;
  userId: string;
}

type WizardStep = 'upload' | 'context' | 'preferences' | 'analyzing' | 'benchmark';

export function EvaluationWizard({ onComplete, onCancel, userId }: EvaluationWizardProps) {
  // Step navigation
  const [currentStep, setCurrentStep] = useState<WizardStep>('upload');
  
  // Upload step
  const [deckFile, setDeckFile] = useState<File | null>(null);
  const [checklistFile, setChecklistFile] = useState<File | null>(null);
  const [additionalDocs, setAdditionalDocs] = useState<File[]>([]);
  const [selectedStage, setSelectedStage] = useState<string>('');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [uploadedDeckId, setUploadedDeckId] = useState<string | null>(null);
  const [importedContext, setImportedContext] = useState<any>(null);
  
  // Context step
  const [hasContext, setHasContext] = useState(false);
  
  // Preferences step - using full criteria structure like VCMode
  const [criteria, setCriteria] = useState<Array<{
    id: string;
    name: string;
    weight: number;
    description: string;
    subcriteria: Array<{ id: string; name: string; weight: number }>;
    customizable?: boolean;
  }>>([
    {
      id: 'team',
      name: 'Team',
      weight: 25,
      description: 'Founder backgrounds, expertise, and ability to execute. Assesses technical skills, domain knowledge, and leadership capabilities.',
      subcriteria: []
    },
    {
      id: 'market',
      name: 'Market Opportunity',
      weight: 25,
      description: 'Total addressable market size, growth rate, and competitive landscape. Evaluates market timing and expansion potential.',
      subcriteria: []
    },
    {
      id: 'product',
      name: 'Product & Technology',
      weight: 25,
      description: 'Problem-solution fit, innovation level, and technical moat. Includes product differentiation and scalability assessment.',
      subcriteria: []
    },
    {
      id: 'traction',
      name: 'Traction & Metrics',
      weight: 15,
      description: 'User growth, revenue metrics, and retention rates. Measures product-market fit through quantifiable business indicators.',
      subcriteria: []
    },
    {
      id: 'finance',
      name: 'Finance',
      weight: 10,
      description: 'Unit economics, burn rate, and path to profitability. Analyzes capital efficiency and financial sustainability.',
      subcriteria: []
    }
  ]);
  const [hasCustomPreferences, setHasCustomPreferences] = useState(false);
  
  // Analysis tracking
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  
  // Benchmark step
  const [benchmarkData, setBenchmarkData] = useState<any>(null);
  const [benchmarkLoading, setBenchmarkLoading] = useState(false);
  
  // General
  const [error, setError] = useState<string>('');
  const [companies, setCompanies] = useState<any[]>([]);
  
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  useEffect(() => {
    loadCompanies();
    loadImportedContext();
  }, []);

  const loadCompanies = async () => {
    try {
      const data = await api.getCompanies();
      setCompanies(data);
    } catch (err) {
      console.error('Failed to load companies:', err);
    }
  };

  const loadImportedContext = () => {
    try {
      const contextStr = localStorage.getItem('importedContext');
      if (contextStr) {
        const context = JSON.parse(contextStr);
        console.log('✅ Loaded imported context for wizard:', context);
        setImportedContext(context);
      }
    } catch (err) {
      console.error('Failed to load imported context:', err);
    }
  };

  const clearImportedContext = () => {
    localStorage.removeItem('importedContext');
    setImportedContext(null);
    console.log('🗑️ Cleared imported context');
  };

  // Step 1: Upload Deck + Optional Checklist + Additional Docs
  const handleUploadStep = async () => {
    if (!deckFile) {
      setError('Please select a pitch deck');
      return;
    }

    if (!selectedStage || !selectedIndustry) {
      setError('Please select funding stage and industry');
      return;
    }

    setUploading(true);
    setError('');

    try {
      // Find matching company
      let companyId = '';
      if (companies.length > 0) {
        const matchingCompany = companies.find(
          c => c.stage === selectedStage && c.industry === selectedIndustry
        );
        companyId = matchingCompany?.id || companies[0].id;
      }

      console.log('📤 Uploading deck for wizard flow...', {
        deck: deckFile.name,
        checklist: checklistFile?.name || 'none',
        additionalDocs: additionalDocs.length,
        hasImportedContext: !!importedContext
      });
      
      const deck = await api.uploadDualDeck(
        deckFile,
        checklistFile,           // Optional
        additionalDocs,          // Array of additional files
        companyId,
        userId,
        selectedIndustry,        // Pass selected industry
        selectedStage,           // Pass selected stage
        importedContext          // Pass imported context if available
      );

      setUploadedDeckId(deck.id);
      console.log('✅ Deck uploaded:', deck.id);
      
      // Move to context step
      setCurrentStep('context');
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload deck');
    } finally {
      setUploading(false);
    }
  };

  // Step 2: Skip context or proceed
  const handleSkipContext = () => {
    console.log('⏭️ Skipping VC Context step');
    setHasContext(false);
    setCurrentStep('preferences');
  };

  const handleContextComplete = async () => {
    if (!uploadedDeckId) return;

    try {
      // Check if any context items were uploaded
      const response = await vcContextApi.getContextItems(uploadedDeckId);
      const itemsArray = response.items || [];
      setHasContext(itemsArray.length > 0);
      console.log(`✅ Context step complete: ${itemsArray.length} items uploaded`);
      
      // Move to preferences
      setCurrentStep('preferences');
    } catch (err) {
      console.error('Failed to check context:', err);
      setCurrentStep('preferences'); // Proceed anyway
    }
  };

  // Step 3: Skip preferences or save
  const handleSkipPreferences = () => {
    console.log('⏭️ Skipping VC Preferences step');
    setHasCustomPreferences(false);
    startAnalysis();
  };

  const handleSavePreferences = async () => {
    setError('');
    
    try {
      console.log('💾 Saving VC preferences with full criteria...');
      
      // Convert criteria to the format expected by backend
      const criteriaPayload = {
        mainCriteria: criteria.map(c => ({
          id: c.id,
          name: c.name,
          weight: c.weight,
          description: c.description,
          subcriteria: c.subcriteria
        })),
        customCriteria: criteria.filter(c => c.customizable).map(c => ({
          name: c.name,
          weight: c.weight,
          subCriteria: c.subcriteria.map(sc => sc.name)
        }))
      };
      
      // Trigger prompt regeneration (agentic system) via API
      const response = await fetch(`${import.meta.env.VITE_API_URL}/vc-agent/save-preferences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          industry: selectedIndustry,
          criteria: criteriaPayload
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅✅✅ PREFERENCES SAVED SUCCESSFULLY! ✅✅✅');
        console.log('📊 Result:', result);
        console.log('🎯 Preference ID:', result.preferenceId);
        console.log('🤖 Prompt Version:', result.promptVersion);
        console.log('📝 Criteria sent:', criteriaPayload);
        console.log('🏭 Industry:', selectedIndustry);
        console.log('👤 User ID:', userId);
        
        // Show visual alert
        alert(`✅ VC PREFERENCES SAVED!\n\n` +
              `Preference ID: ${result.preferenceId}\n` +
              `Prompt Version: ${result.promptVersion}\n` +
              `Industry: ${selectedIndustry}\n` +
              `Criteria: ${criteria.length} evaluation areas\n\n` +
              `These preferences will be used in Premium PDF analysis!`);
        
        setHasCustomPreferences(true);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ Backend error:', errorData);
        alert(`❌ FAILED TO SAVE PREFERENCES!\n\nError: ${errorData.details || errorData.error}`);
        throw new Error(errorData.details || errorData.error || 'Failed to save preferences');
      }

      console.log('✅ Preferences saved with custom criteria - continuing to analysis...');
      startAnalysis();
    } catch (err: any) {
      console.error('Failed to save preferences:', err);
      setError(`Failed to save preferences: ${err.message}. Analysis will use defaults.`);
      // Proceed anyway after showing error
      setTimeout(startAnalysis, 3000);
    }
  };

  const startAnalysis = () => {
    console.log('🚀 Starting final analysis...');
    setCurrentStep('analyzing');
    setAnalysisComplete(false);
    
    // Start polling for analysis completion
    if (uploadedDeckId) {
      pollForAnalysisCompletion(uploadedDeckId);
    }
  };

  const pollForAnalysisCompletion = async (deckId: string) => {
    const maxAttempts = 120; // 2 minutes max (1 second intervals)
    let attempts = 0;

    const poll = setInterval(async () => {
      attempts++;
      
      try {
        const deck = await api.getDeck(deckId);
        console.log(`[Poll ${attempts}] Deck status:`, deck.status, 'Has analysis:', !!deck.analysis, 'Error:', deck.error_message);
        
        // Check if analysis is complete
        if (deck.status === 'completed' || deck.status === 'analyzed') {
          console.log('✅ Analysis completed!');
          clearInterval(poll);
          setAnalysisComplete(true);
          setAnalysisData(deck);
          setError(''); // Clear any previous errors
        } else if (deck.status === 'failed') {
          const errorMsg = deck.error_message || 'Analysis failed';
          console.error('❌ Analysis failed:', errorMsg);
          clearInterval(poll);
          setAnalysisComplete(false);
          setAnalysisData(null);
          setError(`Analysis failed: ${errorMsg}. Please try uploading again or contact support.`);
        } else if (attempts >= maxAttempts) {
          console.warn('⏱️ Analysis polling timeout');
          clearInterval(poll);
          setError('Analysis is taking longer than expected. Please check back later.');
        }
      } catch (err: any) {
        console.error('Polling error:', err);
        if (attempts >= maxAttempts) {
          clearInterval(poll);
          setError(`Failed to check analysis status: ${err.message || 'Network error'}`);
        }
      }
    }, 1000); // Poll every second

    setPollingInterval(poll);
  };

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  // Load benchmark data when entering benchmark step
  useEffect(() => {
    if (currentStep === 'benchmark' && uploadedDeckId && !benchmarkData) {
      loadBenchmarkData();
    }
  }, [currentStep, uploadedDeckId]);

  const loadBenchmarkData = async () => {
    if (!uploadedDeckId) return;

    setBenchmarkLoading(true);
    try {
      const response = await fetch(`${API_URL}/sector-benchmarks/decks/${uploadedDeckId}/benchmark`);
      const data = await response.json();
      
      if (data.success) {
        setBenchmarkData(data.data);
        console.log('✅ Benchmark data loaded:', data.data);
      } else {
        setError(data.error || 'Failed to load benchmark data');
      }
    } catch (err: any) {
      console.error('Error loading benchmark data:', err);
      setError('Failed to load benchmark comparison. Please try again.');
    } finally {
      setBenchmarkLoading(false);
    }
  };

  const formatMetricValue = (metric: any) => {
    if (!metric || !metric.value) return 'N/A';
    
    const value = metric.value;
    const unit = metric.unit || '';

    if (unit === 'USD') {
      if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B`;
      if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
      if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
      return `$${value}`;
    }

    if (unit === 'percent') return `${value}%`;
    
    return `${value}${unit ? ` ${unit}` : ''}`;
  };

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600 bg-green-50';
    if (percentage >= 70) return 'text-blue-600 bg-blue-50';
    if (percentage >= 50) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  // Render different steps
  const renderUploadStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <Upload className="h-8 w-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Upload Pitch Deck</h2>
        <p className="text-slate-600">
          Start by uploading your pitch deck and optional evaluation materials
        </p>
      </div>

      {/* Imported Context Banner */}
      {importedContext && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-purple-600" />
              <div>
                <h3 className="text-sm font-semibold text-purple-900">
                  Using Context from: {importedContext.companyName}
                </h3>
                <p className="text-xs text-purple-700 mt-0.5">
                  {importedContext.itemCount} documents • Exported {new Date(importedContext.exportedAt).toLocaleString()}
                </p>
              </div>
            </div>
            <button
              onClick={clearImportedContext}
              className="text-purple-600 hover:text-purple-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {importedContext.summary && (
            <p className="text-xs text-purple-700 mt-2">
              {importedContext.summary.executiveSummary}
            </p>
          )}
        </div>
      )}

      {/* Deck Upload */}
      <div className="bg-white rounded-lg border-2 border-slate-200 p-6">
        <label className="block mb-4">
          <span className="text-sm font-medium text-slate-700 mb-2 block">Pitch Deck (PDF, DOCX, PPT) *</span>
          <input
            type="file"
            accept=".pdf,.docx,.doc,.pptx,.ppt"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                // Check file size (100MB limit)
                if (file.size > 100 * 1024 * 1024) {
                  setError('Pitch deck file size must be under 100MB');
                  setDeckFile(null);
                  e.target.value = '';
                  return;
                }
                setDeckFile(file);
                setError('');
              }
            }}
            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {deckFile && (
            <div className="mt-2 flex items-center justify-between text-sm">
              <div className="flex items-center text-green-600">
                <CheckCircle className="h-4 w-4 mr-1" />
                {deckFile.name}
              </div>
              <span className="text-slate-500">{(deckFile.size / (1024 * 1024)).toFixed(2)} MB</span>
            </div>
          )}
          <p className="mt-1 text-xs text-slate-500">Max 100MB • PDF, DOCX, or PowerPoint</p>
        </label>

        <label className="block mb-4">
          <span className="text-sm font-medium text-slate-700 mb-2 block">
            Evaluation Checklist (Optional)
            <span className="ml-2 text-xs text-slate-500 font-normal">PDF, DOCX, PPT</span>
          </span>
          <input
            type="file"
            accept=".pdf,.docx,.doc,.pptx,.ppt"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                // Check file size (100MB limit)
                if (file.size > 100 * 1024 * 1024) {
                  setError('Checklist file size must be under 100MB');
                  setChecklistFile(null);
                  e.target.value = '';
                  return;
                }
                setChecklistFile(file);
                setError('');
              }
            }}
            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
          />
          {checklistFile && (
            <div className="mt-2 flex items-center justify-between text-sm">
              <div className="flex items-center text-green-600">
                <CheckCircle className="h-4 w-4 mr-1" />
                {checklistFile.name}
              </div>
              <span className="text-slate-500">{(checklistFile.size / (1024 * 1024)).toFixed(2)} MB</span>
            </div>
          )}
          <p className="mt-1 text-xs text-slate-500">Optional custom evaluation criteria</p>
        </label>

        <label className="block mb-4">
          <span className="text-sm font-medium text-slate-700 mb-2 block">
            Additional Documents (Optional)
            <span className="ml-2 text-xs text-slate-500 font-normal">Financial models, cap tables, etc.</span>
          </span>
          <input
            type="file"
            accept=".pdf,.docx,.doc,.pptx,.ppt,.xlsx,.xls,.csv"
            multiple
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              const validFiles: File[] = [];
              let hasError = false;

              for (const file of files) {
                if (file.size > 100 * 1024 * 1024) {
                  setError(`File ${file.name} exceeds 100MB limit`);
                  hasError = true;
                  break;
                }
                validFiles.push(file);
              }

              if (!hasError) {
                setAdditionalDocs(prev => [...prev, ...validFiles]);
                setError('');
              }
              e.target.value = '';
            }}
            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
          />
          {additionalDocs.length > 0 && (
            <div className="mt-2 space-y-1">
              {additionalDocs.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm bg-slate-50 rounded px-2 py-1">
                  <div className="flex items-center text-slate-700">
                    <FileText className="h-4 w-4 mr-1 text-slate-400" />
                    <span className="truncate max-w-[300px]">{file.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-500 text-xs">{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                    <button
                      onClick={() => setAdditionalDocs(prev => prev.filter((_, i) => i !== idx))}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="mt-1 text-xs text-slate-500">Max 100MB per file • Multiple files supported</p>
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-700 mb-2 block">Funding Stage *</span>
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select stage...</option>
              <option value="Pre-Seed">Pre-Seed</option>
              <option value="Seed">Seed</option>
              <option value="Series A">Series A</option>
              <option value="Series B">Series B</option>
              <option value="Series C+">Series C+</option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700 mb-2 block">Industry *</span>
            <select
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select industry...</option>
              <option value="SaaS">SaaS</option>
              <option value="Fintech">Fintech</option>
              <option value="Healthcare">Healthcare</option>
              <option value="E-commerce">E-commerce</option>
              <option value="AI/ML">AI/ML</option>
              <option value="Other">Other</option>
            </select>
          </label>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="flex justify-between">
        <button
          onClick={onCancel}
          className="px-6 py-2.5 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleUploadStep}
          disabled={uploading || !deckFile || !selectedStage || !selectedIndustry}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
        >
          {uploading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Uploading...</span>
            </>
          ) : (
            <>
              <span>Next: Add Context</span>
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );

  const renderContextStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
          <MessageSquare className="h-8 w-8 text-purple-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Add VC Context</h2>
        <p className="text-slate-600">
          Upload meeting notes, transcripts, or other due diligence materials (optional)
        </p>
      </div>

      {uploadedDeckId && (
        <div className="bg-white rounded-lg border-2 border-slate-200 p-6">
          <VCContextManager 
            deckId={uploadedDeckId} 
            companyName={`Deck ${uploadedDeckId.slice(0, 8)}`}
            embedded={true}
          />
        </div>
      )}

      <div className="flex justify-between">
        <button
          onClick={() => setCurrentStep('upload')}
          className="px-6 py-2.5 text-slate-700 hover:bg-slate-100 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back</span>
        </button>
        <div className="flex space-x-3">
          <button
            onClick={handleSkipContext}
            className="px-6 py-2.5 text-slate-700 hover:bg-slate-100 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <SkipForward className="h-5 w-5" />
            <span>Skip Context</span>
          </button>
          <button
            onClick={handleContextComplete}
            className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center space-x-2 transition-colors"
          >
            <span>Next: Preferences</span>
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );

  const renderPreferencesStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
          <Settings className="h-8 w-8 text-indigo-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Evaluation Preferences</h2>
        <p className="text-slate-600">
          Customize evaluation criteria, add custom factors, and set weights
        </p>
      </div>

      <div className="bg-white rounded-lg border-2 border-slate-200 p-6">
        <AdvancedVCEvaluation
          userId={userId}
          onPreferencesUpdate={() => setHasCustomPreferences(true)}
        />
      </div>

      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700">{error}</p>
        </div>
      )}

      <div className="flex justify-between items-center">
        <button
          onClick={() => setCurrentStep('context')}
          className="px-6 py-2.5 text-slate-700 hover:bg-slate-100 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back</span>
        </button>
        <div className="flex space-x-3">
          <button
            onClick={handleSkipPreferences}
            className="px-6 py-2.5 text-slate-700 hover:bg-slate-100 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <SkipForward className="h-5 w-5" />
            <span>Use Defaults</span>
          </button>
          <button
            onClick={handleSavePreferences}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2 transition-colors"
          >
            <span>Save & Analyze</span>
            <Sparkles className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );

  const renderAnalyzingStep = () => (
    <div className="space-y-6">
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full mb-6">
          {error ? (
            <AlertCircle className="h-10 w-10 text-red-600" />
          ) : analysisComplete ? (
            <CheckCircle className="h-10 w-10 text-green-600" />
          ) : (
            <Sparkles className="h-10 w-10 text-blue-600 animate-pulse" />
          )}
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          {error ? 'Analysis Failed' : analysisComplete ? 'Analysis Complete!' : 'Analyzing Your Deck'}
        </h2>
        <p className="text-slate-600 mb-6">
          {error ? (
            'There was an issue analyzing your pitch deck. Please see details below.'
          ) : analysisComplete ? (
            'Your pitch deck has been thoroughly analyzed. Proceed to sector benchmarking to see how it compares.'
          ) : (
            <>AI is processing your deck{hasContext && ' with context'}{hasCustomPreferences && ' using custom preferences'}...</>
          )}
        </p>
        {!analysisComplete && !error && (
          <div className="flex items-center justify-center space-x-2 text-sm text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <span>This may take 1-2 minutes</span>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-900 mb-2">Analysis Error</h3>
              <p className="text-sm text-red-800 mb-4">{error}</p>
              <div className="bg-red-100 rounded-lg p-4 text-xs text-red-900 mb-4">
                <p className="font-semibold mb-2">Common causes:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>API rate limits exceeded (try again in a few minutes)</li>
                  <li>File format issues (ensure PDF/DOCX/PPT are valid)</li>
                  <li>Network connectivity problems</li>
                  <li>Large files timing out (try smaller files)</li>
                </ul>
              </div>
              <button
                onClick={() => {
                  setError('');
                  setAnalysisComplete(false);
                  if (uploadedDeckId) {
                    console.log('🔄 Retrying analysis...');
                    startAnalysis();
                  }
                }}
                className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center space-x-2 transition-colors"
              >
                <ArrowRight className="h-5 w-5" />
                <span>Retry Analysis</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {analysisComplete && !error && (
        <div className="flex justify-between">
          <button
            onClick={() => setCurrentStep('preferences')}
            className="px-6 py-2.5 text-slate-700 hover:bg-slate-100 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back</span>
          </button>
          <button
            onClick={() => setCurrentStep('benchmark')}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 flex items-center space-x-2 transition-colors shadow-md"
          >
            <span>Next: Sector Benchmark</span>
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Back button when there's an error */}
      {error && (
        <div className="flex justify-between">
          <button
            onClick={() => setCurrentStep('upload')}
            className="px-6 py-2.5 text-slate-700 hover:bg-slate-100 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Upload</span>
          </button>
        </div>
      )}
    </div>
  );

  const renderBenchmarkStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-100 to-blue-100 rounded-full mb-4">
          <BarChart3 className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Sector Benchmarking</h2>
        <p className="text-slate-600">
          Compare your pitch deck against top companies in the sector
        </p>
      </div>

      {benchmarkLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-3 text-slate-600">Loading benchmark data...</span>
        </div>
      )}

      {!benchmarkLoading && !benchmarkData && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <AlertCircle className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
          <p className="text-yellow-800">No benchmark data available for this deck.</p>
          <p className="text-sm text-yellow-700 mt-2">
            Make sure the deck has been analyzed and sector information is available.
          </p>
        </div>
      )}

      {!benchmarkLoading && benchmarkData && (
        <div className="space-y-6">
          {/* Overview Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <Target className="h-5 w-5 text-blue-600" />
                <span className="text-xs font-medium text-blue-700">Sector</span>
              </div>
              <div className="text-xl font-bold text-blue-900">
                {benchmarkData.deck?.sector || 'N/A'}
              </div>
              <div className="text-xs text-blue-700 mt-1">
                vs {benchmarkData.benchmark_companies?.length || 0} companies
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span className="text-xs font-medium text-green-700">Avg Score</span>
              </div>
              <div className="text-xl font-bold text-green-900">
                {benchmarkData.comparison?.overall_score || 'N/A'}
              </div>
              <div className="text-xs text-green-700 mt-1">
                Percentile rank
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <Award className="h-5 w-5 text-purple-600" />
                <span className="text-xs font-medium text-purple-700">Position</span>
              </div>
              <div className="text-xl font-bold text-purple-900">
                #{benchmarkData.comparison?.rank || 'N/A'}
              </div>
              <div className="text-xs text-purple-700 mt-1">
                Out of {(benchmarkData.benchmark_companies?.length || 0) + 1}
              </div>
            </div>
          </div>

          {/* Common Metrics Comparison */}
          {benchmarkData.comparison?.common_metrics && (
            <div className="bg-white rounded-lg border-2 border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                Common Metrics Comparison
              </h3>
              <div className="space-y-3">
                {Object.entries(benchmarkData.comparison.common_metrics).map(([key, data]: [string, any]) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-slate-900 capitalize">
                        {key.replace(/_/g, ' ')}
                      </div>
                      <div className="text-sm text-slate-600 mt-1">
                        Your Value: <span className="font-semibold">{formatMetricValue(data.deck_value)}</span>
                        {' | '}
                        Avg: <span className="font-semibold">{formatMetricValue(data.sector_average)}</span>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getPercentageColor(data.percentile || 0)}`}>
                      {data.percentile || 0}th %ile
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sector-Specific Metrics */}
          {benchmarkData.comparison?.sector_metrics && Object.keys(benchmarkData.comparison.sector_metrics).length > 0 && (
            <div className="bg-white rounded-lg border-2 border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                <Target className="h-5 w-5 mr-2 text-green-600" />
                Sector-Specific Metrics
              </h3>
              <div className="space-y-3">
                {Object.entries(benchmarkData.comparison.sector_metrics).map(([key, data]: [string, any]) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-slate-900 capitalize">
                        {key.replace(/_/g, ' ')}
                      </div>
                      <div className="text-sm text-slate-600 mt-1">
                        Your Value: <span className="font-semibold">{formatMetricValue(data.deck_value)}</span>
                        {' | '}
                        Avg: <span className="font-semibold">{formatMetricValue(data.sector_average)}</span>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getPercentageColor(data.percentile || 0)}`}>
                      {data.percentile || 0}th %ile
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Benchmark Companies */}
          {benchmarkData.benchmark_companies && benchmarkData.benchmark_companies.length > 0 && (
            <div className="bg-white rounded-lg border-2 border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Top Companies in {benchmarkData.deck?.sector || 'Sector'}
              </h3>
              <div className="space-y-2">
                {benchmarkData.benchmark_companies.slice(0, 5).map((company: any, idx: number) => (
                  <div key={company.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{company.company_name}</div>
                        <div className="text-xs text-slate-600">{company.description?.slice(0, 60)}...</div>
                      </div>
                    </div>
                    <div className="text-sm font-medium text-slate-700">
                      Rank #{company.rank}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between">
        <button
          onClick={() => setCurrentStep('analyzing')}
          className="px-6 py-2.5 text-slate-700 hover:bg-slate-100 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Analysis</span>
        </button>
        <button
          onClick={() => {
            if (uploadedDeckId) {
              onComplete(uploadedDeckId, hasContext, hasCustomPreferences);
            }
          }}
          className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 flex items-center space-x-2 transition-colors shadow-md"
        >
          <CheckCircle className="h-5 w-5" />
          <span>Complete Evaluation</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className={`flex items-center space-x-2 ${currentStep === 'upload' ? 'text-blue-600' : 'text-slate-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === 'upload' ? 'bg-blue-600 text-white' : 'bg-slate-200'
              }`}>
                1
              </div>
              <span className="text-sm font-medium">Upload</span>
            </div>
            <div className="flex-1 h-0.5 bg-slate-200 mx-2"></div>
            <div className={`flex items-center space-x-2 ${currentStep === 'context' ? 'text-purple-600' : 'text-slate-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === 'context' ? 'bg-purple-600 text-white' : 'bg-slate-200'
              }`}>
                2
              </div>
              <span className="text-sm font-medium">Context</span>
            </div>
            <div className="flex-1 h-0.5 bg-slate-200 mx-2"></div>
            <div className={`flex items-center space-x-2 ${currentStep === 'preferences' ? 'text-indigo-600' : 'text-slate-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === 'preferences' ? 'bg-indigo-600 text-white' : 'bg-slate-200'
              }`}>
                3
              </div>
              <span className="text-sm font-medium">Preferences</span>
            </div>
            <div className="flex-1 h-0.5 bg-slate-200 mx-2"></div>
            <div className={`flex items-center space-x-2 ${currentStep === 'analyzing' ? 'text-blue-600' : 'text-slate-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === 'analyzing' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' : 'bg-slate-200'
              }`}>
                4
              </div>
              <span className="text-sm font-medium">Analyze</span>
            </div>
            <div className="flex-1 h-0.5 bg-slate-200 mx-2"></div>
            <div className={`flex items-center space-x-2 ${currentStep === 'benchmark' ? 'text-green-600' : 'text-slate-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === 'benchmark' ? 'bg-gradient-to-r from-green-600 to-blue-600 text-white' : 'bg-slate-200'
              }`}>
                5
              </div>
              <span className="text-sm font-medium">Benchmark</span>
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          {currentStep === 'upload' && renderUploadStep()}
          {currentStep === 'context' && renderContextStep()}
          {currentStep === 'preferences' && renderPreferencesStep()}
          {currentStep === 'analyzing' && renderAnalyzingStep()}
          {currentStep === 'benchmark' && renderBenchmarkStep()}
        </div>
      </div>
    </div>
  );
}
