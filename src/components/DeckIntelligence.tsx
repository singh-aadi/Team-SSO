import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { flushSync } from 'react-dom';
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
  X,
  BookOpen,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Wand2,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { api, PitchDeck, Company } from '../services/api';
import { VisualizationPanel } from './VisualizationPanel';
import { useAuth } from '../context/AuthContext';
import { useGeminiModel } from '../context/GeminiModelContext';
import { EvaluationWizard } from './EvaluationWizard';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const GLOBAL_VC_CONTEXT_ID = '00000000-0000-0000-0000-000000000002';

interface DeckIntelligenceProps {
  userType: 'founder' | 'vc';
}

export function DeckIntelligence({ userType }: DeckIntelligenceProps) {
  const { user } = useAuth(); // Get the logged-in user
  const { modelInfo } = useGeminiModel(); // Get current AI model info
  
  // Tab State
  const [activeTab, setActiveTab] = useState<'analysis' | 'comparison'>('analysis');
  
  // Wizard Mode
  const [useWizardMode, setUseWizardMode] = useState(false);
  
  // Dual PDF Upload State
  const [deckFile, setDeckFile] = useState<File | null>(null);
  const [checklistFile, setChecklistFile] = useState<File | null>(null);
  
  // Comparison State
  const [showComparisonUpload, setShowComparisonUpload] = useState(false);
  const [comparisonDeck1, setComparisonDeck1] = useState<File | null>(null);
  const [comparisonDeck2, setComparisonDeck2] = useState<File | null>(null);
  const [comparingDecks, setComparingDecks] = useState(false);
  const [comparisonProgress, setComparisonProgress] = useState(0);
  const [comparisonStage, setComparisonStage] = useState<string>('Initializing...');
  const [comparisonConfidence, setComparisonConfidence] = useState<number>(0);
  const [completedComparisonId, setCompletedComparisonId] = useState<string | null>(null);
  const [comparisonPreview, setComparisonPreview] = useState<any>(null);
  const [showComparisonPreview, setShowComparisonPreview] = useState(false);
  
  // Deck Selection Mode (analyzed vs upload)
  const [deck1Mode, setDeck1Mode] = useState<'analyzed' | 'upload'>('analyzed');
  const [deck2Mode, setDeck2Mode] = useState<'analyzed' | 'upload'>('analyzed');
  const [analyzedDecks, setAnalyzedDecks] = useState<PitchDeck[]>([]);
  const [previousComparisons, setPreviousComparisons] = useState<any[]>([]);
  const [selectedDeck1Id, setSelectedDeck1Id] = useState<string>('');
  const [selectedDeck2Id, setSelectedDeck2Id] = useState<string>('');

  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [currentDeck, setCurrentDeck] = useState<PitchDeck | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [selectedStage, setSelectedStage] = useState<string>('');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [analysisProgress, setAnalysisProgress] = useState(0); // Track polling attempts
  const [analysisStage, setAnalysisStage] = useState<string>('Initializing...');
  const [confidence, setConfidence] = useState<number>(0);
  
  // Additional documents state
  const [additionalDocs, setAdditionalDocs] = useState<File[]>([]);
  const [totalUploadSize, setTotalUploadSize] = useState(0);
  const MAX_ADDITIONAL_DOCS = 5;
  const MAX_TOTAL_SIZE = 500 * 1024 * 1024; // 500MB

  // Imported Context State
  const [importedContext, setImportedContext] = useState<any>(null);
  const [showContextDetails, setShowContextDetails] = useState(false);
  
  // VC Context State (from VC Mode)
  const [vcContext, setVcContext] = useState<any>(null);
  const [showVcContextDetails, setShowVcContextDetails] = useState(false);

  // Delete functionality state
  const [selectedDecks, setSelectedDecks] = useState<Set<string>>(new Set());
  const [selectedComparisons, setSelectedComparisons] = useState<Set<string>>(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteType, setDeleteType] = useState<'deck' | 'comparison'>('deck');
  const [deleteMode, setDeleteMode] = useState<'single' | 'bulk'>('single');
  const [itemToDelete, setItemToDelete] = useState<string>('');
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Refresh functionality state
  const [refreshingDecks, setRefreshingDecks] = useState(false);
  const [refreshingComparisons, setRefreshingComparisons] = useState(false);

  useEffect(() => {
    loadCompanies();
    loadImportedContext();
    loadVCContext();
    loadAnalyzedDecks();
    loadPreviousComparisons();
  }, []);

  // Calculate total upload size
  useEffect(() => {
    const deckSize = deckFile?.size || 0;
    const checklistSize = checklistFile?.size || 0;
    const additionalSize = additionalDocs.reduce((sum, f) => sum + f.size, 0);
    setTotalUploadSize(deckSize + checklistSize + additionalSize);
  }, [deckFile, checklistFile, additionalDocs]);

  // Debug effect to track modal state changes
  useEffect(() => {
    console.log('🔄 showDeleteModal changed:', showDeleteModal);
    console.log('🔄 deleteMode:', deleteMode);
    console.log('🔄 deleteType:', deleteType);
    console.log('🎨 COMPONENT RE-RENDERED at:', new Date().toISOString());
  }, [showDeleteModal, deleteMode, deleteType]);

  const loadAnalyzedDecks = async () => {
    try {
      // Fetch only completed/analyzed decks
      const decks = await api.getDecks(undefined, 'completed');
      console.log('✅ Loaded analyzed decks:', decks);
      setAnalyzedDecks(decks);
    } catch (err) {
      console.error('Error loading analyzed decks:', err);
    }
  };

  const loadPreviousComparisons = async () => {
    try {
      const response = await fetch(`${API_URL}/decks/comparisons/recent?limit=20`);
      const data = await response.json();
      console.log('✅ Loaded previous comparisons:', data.comparisons);
      // Filter only completed comparisons
      const completed = data.comparisons.filter((comp: any) => comp.analysis_status === 'completed');
      setPreviousComparisons(completed);
    } catch (err) {
      console.error('Error loading previous comparisons:', err);
    }
  };

  const handleShowComparisonResults = async (comparisonId: string) => {
    try {
      setComparingDecks(true);
      setError('');
      console.log('📂 Loading comparison results for:', comparisonId);
      
      const response = await fetch(`${API_URL}/decks/compare/${comparisonId}`);
      const comparison = await response.json();
      
      if (comparison.analysis_status === 'completed' && comparison.comparison_analysis) {
        setComparisonPreview(comparison.comparison_analysis);
        setCompletedComparisonId(comparisonId);
        setShowComparisonPreview(true);
      }
    } catch (err) {
      console.error('Error loading comparison:', err);
      setError('Failed to load comparison results');
    } finally {
      setComparingDecks(false);
    }
  };

  const handleShowDeckResults = async (deckId: string) => {
    try {
      setAnalyzing(true);
      setError('');
      console.log('📂 Loading deck results for:', deckId);
      
      const deck = await api.getDeck(deckId);
      console.log('✅ Deck loaded:', deck);
      
      setCurrentDeck(deck);
      setAnalyzing(false);
    } catch (err: any) {
      console.error('❌ Failed to load deck:', err);
      setError(err.message || 'Failed to load deck results');
      setAnalyzing(false);
    }
  };

  const loadImportedContext = () => {
    try {
      const contextStr = localStorage.getItem('importedContext');
      if (contextStr) {
        const context = JSON.parse(contextStr);
        console.log('✅ Loaded imported context:', context);
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

  const loadVCContext = async () => {
    try {
      const userId = user?.id || '1';
      
      // Check if there's exported VC context
      const response = await fetch(`${API_URL}/vc-context/deck-intelligence/${GLOBAL_VC_CONTEXT_ID}/${userId}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.context) {
          console.log('✅ Loaded VC Context from VC Mode:', data.context);
          setVcContext(data.context);
        }
      }
    } catch (err) {
      console.error('Failed to load VC context:', err);
    }
  };

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

  // Delete functionality functions
  const toggleDeckSelection = (deckId: string) => {
    const newSelection = new Set(selectedDecks);
    if (newSelection.has(deckId)) {
      newSelection.delete(deckId);
    } else {
      newSelection.add(deckId);
    }
    setSelectedDecks(newSelection);
  };

  const toggleComparisonSelection = (comparisonId: string) => {
    const newSelection = new Set(selectedComparisons);
    if (newSelection.has(comparisonId)) {
      newSelection.delete(comparisonId);
    } else {
      newSelection.add(comparisonId);
    }
    setSelectedComparisons(newSelection);
  };

  const selectAllDecks = () => {
    if (selectedDecks.size === analyzedDecks.length) {
      setSelectedDecks(new Set());
    } else {
      setSelectedDecks(new Set(analyzedDecks.map(deck => deck.id)));
    }
  };

  const selectAllComparisons = () => {
    if (selectedComparisons.size === previousComparisons.length) {
      setSelectedComparisons(new Set());
    } else {
      setSelectedComparisons(new Set(previousComparisons.map(comp => comp.id)));
    }
  };

  const handleSingleDelete = (id: string, type: 'deck' | 'comparison') => {
    console.log('🗑️ handleSingleDelete called:', { id, type });
    
    // Use flushSync to force synchronous state updates and immediate re-render
    flushSync(() => {
      setItemToDelete(id);
      setDeleteType(type);
      setDeleteMode('single');
    });
    
    flushSync(() => {
      setShowDeleteModal(true);
      console.log('✅ Single delete modal state set with flushSync');
    });
  };

  const handleBulkDelete = (type: 'deck' | 'comparison') => {
    console.log('🗑️ handleBulkDelete called:', type);
    console.log('Selected decks:', selectedDecks);
    console.log('Selected comparisons:', selectedComparisons);
    console.log('Setting modal state...');
    
    // Use flushSync to force synchronous state updates and immediate re-render
    flushSync(() => {
      setDeleteType(type);
      setDeleteMode('bulk');
    });
    
    flushSync(() => {
      setShowDeleteModal(true);
      console.log('✅ Modal state set with flushSync. showDeleteModal should now be true and rendered!');
    });
  };

  const confirmDelete = async () => {
    setBulkDeleting(true);
    try {
      if (deleteMode === 'single') {
        // Single delete
        console.log('🗑️ Single delete mode:', deleteType, itemToDelete);
        const endpoint = deleteType === 'deck' ? 
          `/decks/${itemToDelete}` : 
          `/decks/comparisons/${itemToDelete}`;
        
        const response = await fetch(`${API_URL}${endpoint}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('✅ Delete result:', result);
      } else {
        // Bulk delete
        const items = deleteType === 'deck' ? 
          Array.from(selectedDecks) : 
          Array.from(selectedComparisons);
        
        console.log('🗑️ Bulk delete mode:', deleteType, 'Selected items:', items);
        
        if (items.length === 0) {
          throw new Error('No items selected for deletion');
        }
        
        const endpoint = deleteType === 'deck' ? 
          '/decks/bulk' : 
          '/decks/comparisons/bulk';
        
        const body = deleteType === 'deck' ? 
          { deckIds: items } : 
          { comparisonIds: items };

        console.log('📡 Making bulk delete request to:', `${API_URL}${endpoint}`, 'Body:', body);

        const response = await fetch(`${API_URL}${endpoint}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('✅ Bulk delete result:', result);
      }

      // Refresh the appropriate list
      if (deleteType === 'deck') {
        await loadAnalyzedDecks();
        setSelectedDecks(new Set());
      } else {
        await loadPreviousComparisons();
        setSelectedComparisons(new Set());
      }
      
      setShowDeleteModal(false);
      setError('');
    } catch (err: any) {
      console.error('❌ Delete failed:', err);
      setError(`Failed to delete ${deleteType}: ${err.message}`);
    } finally {
      setBulkDeleting(false);
    }
  };

  // Refresh functions
  const handleRefreshDecks = async () => {
    setRefreshingDecks(true);
    try {
      await loadAnalyzedDecks();
      setSelectedDecks(new Set()); // Clear selections after refresh
    } catch (err: any) {
      console.error('❌ Refresh decks failed:', err);
      setError(`Failed to refresh decks: ${err.message}`);
    } finally {
      setRefreshingDecks(false);
    }
  };

  const handleRefreshComparisons = async () => {
    setRefreshingComparisons(true);
    try {
      await loadPreviousComparisons();
      setSelectedComparisons(new Set()); // Clear selections after refresh
    } catch (err: any) {
      console.error('❌ Refresh comparisons failed:', err);
      setError(`Failed to refresh comparisons: ${err.message}`);
    } finally {
      setRefreshingComparisons(false);
    }
  };

  // Additional documents handlers
  const handleAdditionalDocsChange = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const newFiles = Array.from(files);
    
    // Validate count
    if (additionalDocs.length + newFiles.length > MAX_ADDITIONAL_DOCS) {
      setError(`Maximum ${MAX_ADDITIONAL_DOCS} additional documents allowed`);
      return;
    }
    
    // Validate total size
    const deckSize = deckFile?.size || 0;
    const checklistSize = checklistFile?.size || 0;
    const currentAdditionalSize = additionalDocs.reduce((sum, f) => sum + f.size, 0);
    const newFilesSize = newFiles.reduce((sum, f) => sum + f.size, 0);
    const newTotalSize = deckSize + checklistSize + currentAdditionalSize + newFilesSize;
    
    if (newTotalSize > MAX_TOTAL_SIZE) {
      setError(`Total upload size would exceed 500MB limit`);
      return;
    }
    
    // Validate file types
    const validTypes = ['.pdf', '.docx', '.doc', '.ppt', '.pptx'];
    const invalidFiles = newFiles.filter(f => {
      const ext = '.' + f.name.split('.').pop()?.toLowerCase();
      return !validTypes.includes(ext);
    });
    
    if (invalidFiles.length > 0) {
      setError('Only PDF, Word, and PowerPoint files allowed');
      return;
    }
    
    // Validate individual file sizes
    const oversizedFiles = newFiles.filter(f => f.size > 100 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setError('Each file must be less than 100MB');
      return;
    }
    
    setAdditionalDocs([...additionalDocs, ...newFiles]);
    setError('');
  };

  const removeAdditionalDoc = (index: number) => {
    const newDocs = [...additionalDocs];
    newDocs.splice(index, 1);
    setAdditionalDocs(newDocs);
  };

  const validateFile = (file: File, isPitchDeck: boolean = false): string | null => {
    // 100MB limit for all files
    if (file.size > 100 * 1024 * 1024) {
      return 'File size must be less than 100MB';
    }
    
    // Accept PDF, Word, and PowerPoint for both deck and checklist
    if (!file.name.match(/\.(pdf|docx|doc|pptx|ppt)$/i)) {
      return 'File must be PDF, Word (.docx, .doc), or PowerPoint (.pptx, .ppt)';
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

  const handleComparison1FileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validationError = validateFile(file, false); // Accepts PDF, Word, PPT
      if (validationError) {
        setError(validationError);
        return;
      }
      setComparisonDeck1(file);
      setError('');
    }
  };

  const handleComparison2FileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validationError = validateFile(file, false); // Accepts PDF, Word, PPT
      if (validationError) {
        setError(validationError);
        return;
      }
      setComparisonDeck2(file);
      setError('');
    }
  };

  const handleCompareDecks = async () => {
    setComparingDecks(true);
    setComparisonProgress(0);
    setComparisonConfidence(0);
    setError('');

    try {
      const userId = user?.id || crypto.randomUUID();
      
      // Determine comparison scenario
      const scenario = `${deck1Mode}-${deck2Mode}`;
      console.log('📊 Comparison scenario:', scenario);

      let result;

      switch (scenario) {
        case 'analyzed-analyzed':
          // Both decks are already analyzed - use new compareAnalyzedDecks endpoint
          if (!selectedDeck1Id || !selectedDeck2Id) {
            setError('Please select both pitch decks from the dropdown');
            setComparingDecks(false);
            return;
          }
          
          setComparisonStage('🔍 Fetching analyzed decks...');
          console.log('📊 Comparing analyzed decks:', selectedDeck1Id, 'vs', selectedDeck2Id);
          
          result = await api.compareAnalyzedDecks(selectedDeck1Id, selectedDeck2Id, userId);
          console.log('✅ Analyzed decks comparison started:', result);
          break;

        case 'upload-upload':
          // Both are new uploads - use existing compareDecks endpoint
          if (!comparisonDeck1 || !comparisonDeck2) {
            setError('Please upload both pitch decks');
            setComparingDecks(false);
            return;
          }
          
          setComparisonStage('📤 Uploading files...');
          console.log('📊 Comparing uploaded files:', comparisonDeck1.name, 'vs', comparisonDeck2.name);
          
          result = await api.compareDecks(comparisonDeck1, comparisonDeck2, userId);
          console.log('✅ Upload comparison started:', result);
          break;

        case 'analyzed-upload':
          // Deck 1 is analyzed, Deck 2 is uploaded
          if (!selectedDeck1Id || !comparisonDeck2) {
            setError('Please select an analyzed deck and upload the second deck');
            setComparingDecks(false);
            return;
          }
          
          setComparisonStage('📤 Processing mixed comparison...');
          console.log('📊 Mixed comparison: Analyzed deck 1 vs Uploaded deck 2');
          
          result = await api.compareMixedDecks(selectedDeck1Id, comparisonDeck2, 'deck2', userId);
          console.log('✅ Mixed comparison started:', result);
          break;

        case 'upload-analyzed':
          // Deck 1 is uploaded, Deck 2 is analyzed
          if (!comparisonDeck1 || !selectedDeck2Id) {
            setError('Please upload the first deck and select an analyzed deck');
            setComparingDecks(false);
            return;
          }
          
          setComparisonStage('📤 Processing mixed comparison...');
          console.log('📊 Mixed comparison: Uploaded deck 1 vs Analyzed deck 2');
          
          result = await api.compareMixedDecks(selectedDeck2Id, comparisonDeck1, 'deck1', userId);
          console.log('✅ Mixed comparison started:', result);
          break;

        default:
          setError('Invalid comparison scenario');
          setComparingDecks(false);
          return;
      }
      
      // Start polling for comparison completion
      pollForComparison(result.id, scenario);
    } catch (err: any) {
      console.error('Comparison error:', err);
      setError(err.message || 'Failed to compare decks');
      setComparingDecks(false);
      setComparisonProgress(0);
      setComparisonConfidence(0);
    }
  };

  const pollForComparison = async (comparisonId: string, scenario: string = 'upload-upload') => {
    const maxAttempts = 300; // 10 minutes max
    let attempts = 0;

    const poll = setInterval(async () => {
      attempts++;
      setComparisonProgress(attempts);
      
      // Update stage and confidence based on progress and scenario
      if (scenario === 'analyzed-analyzed') {
        // Faster progression for pre-analyzed decks (no extraction/individual analysis needed)
        if (attempts <= 3) {
          setComparisonStage('🔍 Loading analyzed decks...');
          setComparisonConfidence(20);
        } else if (attempts <= 8) {
          setComparisonStage('⚖️ Running comparative AI analysis...');
          setComparisonConfidence(50);
        } else if (attempts <= 15) {
          setComparisonStage('🌐 Validating with web search...');
          setComparisonConfidence(70);
        } else if (attempts <= 25) {
          setComparisonStage('📊 Identifying key differences...');
          setComparisonConfidence(85);
        } else {
          setComparisonStage('✨ Generating recommendations...');
          setComparisonConfidence(95);
        }
      } else if (scenario === 'analyzed-upload' || scenario === 'upload-analyzed') {
        // Mixed scenario: One analyzed + one uploaded
        if (attempts <= 5) {
          setComparisonStage('📤 Uploading new pitch deck...');
          setComparisonConfidence(15);
        } else if (attempts <= 15) {
          setComparisonStage('📄 Extracting text from uploaded deck...');
          setComparisonConfidence(35);
        } else if (attempts <= 30) {
          setComparisonStage('🔍 Loading analyzed deck data...');
          setComparisonConfidence(50);
        } else if (attempts <= 60) {
          setComparisonStage('⚖️ Running comparative AI analysis...');
          setComparisonConfidence(75);
        } else if (attempts <= 90) {
          setComparisonStage('🌐 Validating with web search...');
          setComparisonConfidence(85);
        } else {
          setComparisonStage('✨ Generating recommendations...');
          setComparisonConfidence(95);
        }
      } else {
        // Standard progression for uploaded files
        if (attempts <= 5) {
          setComparisonStage('📤 Uploading pitch decks...');
          setComparisonConfidence(10);
        } else if (attempts <= 15) {
          setComparisonStage('📄 Extracting text from Deck 1...');
          setComparisonConfidence(20);
        } else if (attempts <= 25) {
          setComparisonStage('📄 Extracting text from Deck 2...');
          setComparisonConfidence(30);
        } else if (attempts <= 45) {
          setComparisonStage('🔍 Analyzing Deck 1 individually...');
          setComparisonConfidence(45);
        } else if (attempts <= 65) {
          setComparisonStage('🔍 Analyzing Deck 2 individually...');
          setComparisonConfidence(60);
        } else if (attempts <= 100) {
          setComparisonStage('⚖️ Running comparative AI analysis...');
          setComparisonConfidence(75);
        } else if (attempts <= 150) {
          setComparisonStage('📊 Identifying strengths & weaknesses...');
          setComparisonConfidence(85);
        } else {
          setComparisonStage('✨ Generating recommendations...');
          setComparisonConfidence(95);
        }
      }
      
      try {
        // Check comparison status
        const response = await fetch(`${API_URL}/decks/compare/${comparisonId}`);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.analysis_status === 'completed') {
            console.log('✓ Comparison analysis complete!');
            console.log('📊 Comparison data:', data);
            console.log('📄 Comparison analysis:', data.comparison_analysis);
            clearInterval(poll);
            setComparingDecks(false);
            setComparisonConfidence(100);
            setComparisonStage('✅ Complete!');
            setCompletedComparisonId(comparisonId);
            
            // Parse comparison_analysis if it's a string
            let analysisResult = data.comparison_analysis;
            if (typeof analysisResult === 'string') {
              try {
                analysisResult = JSON.parse(analysisResult);
                console.log('✓ Parsed comparison analysis:', analysisResult);
              } catch (parseError) {
                console.error('Failed to parse comparison_analysis:', parseError);
              }
            }
            
            setComparisonPreview(analysisResult);
            setShowComparisonPreview(true);
            
            // Refresh the previous comparisons list
            loadPreviousComparisons();
            
            // Don't auto-download, log success message
            console.log('Comparison analysis complete! You can now download the report in your preferred format.');
            
          } else if (data.analysis_status === 'failed') {
            clearInterval(poll);
            setComparingDecks(false);
            const errorMsg = data.error_message 
              ? `Comparison failed: ${data.error_message}` 
              : 'Comparison analysis failed. Please try again.';
            setError(errorMsg);
          }
        }

        if (attempts >= maxAttempts) {
          console.log('⏱️ Polling timeout after', maxAttempts, 'attempts');
          clearInterval(poll);
          setComparingDecks(false);
          setError('Comparison timed out. Please try again.');
        }
      } catch (err) {
        console.error('Error polling for comparison:', err);
      }
    }, 2000); // Poll every 2 seconds
  };

  const handleUpload = async () => {
    // Only deck is required now
    if (!deckFile) {
      setError('Please select a pitch deck');
      return;
    }

    if (!selectedStage || !selectedIndustry) {
      setError('Please select both funding stage and industry vertical');
      return;
    }
    
    // Validate total upload size
    if (totalUploadSize > MAX_TOTAL_SIZE) {
      setError(`Total upload size (${(totalUploadSize / 1024 / 1024).toFixed(1)}MB) exceeds 500MB limit`);
      return;
    }

    setUploading(true);
    setError('');

    try {
      // Use the actual logged-in user's ID
      const userId = user?.id || crypto.randomUUID(); // Fallback to random UUID only if not logged in
      
      console.log('📤 Upload initiated by user:', userId, user?.email);
      console.log('📁 Files:', {
        deck: deckFile.name,
        checklist: checklistFile?.name || 'none',
        additionalDocs: additionalDocs.length
      });
      
      // Find matching company or use first available
      // This maintains backward compatibility with existing API
      let companyId = selectedCompany;
      
      // Try to find a company matching the selected stage and industry
      if (!companyId && companies.length > 0) {
        const matchingCompany = companies.find(
          c => c.stage === selectedStage && c.industry === selectedIndustry
        );
        companyId = matchingCompany?.id || companies[0].id;
      }
      
      // Fallback to first company if still not set
      if (!companyId && companies.length > 0) {
        companyId = companies[0].id;
      }
      
      console.log('Context: Stage:', selectedStage, '| Industry:', selectedIndustry);
      
      // Upload with optional checklist and additional docs
      const deck = await api.uploadDualDeck(
        deckFile, 
        checklistFile, // Can be null
        additionalDocs, // Can be empty array
        companyId, 
        userId,
        selectedIndustry, // Pass selected industry
        selectedStage, // Pass selected stage
        vcContext || importedContext // Pass VC context or imported context
      );
      
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
    const maxAttempts = 300; // 300 attempts = 10 minutes max (AI analysis can be slow)
    let attempts = 0;

    const poll = setInterval(async () => {
      attempts++;
      setAnalysisProgress(attempts); // Update progress
      
      // Update stage and confidence based on progress
      if (attempts <= 5) {
        setAnalysisStage('📤 Uploading files...');
        setConfidence(10);
      } else if (attempts <= 15) {
        setAnalysisStage('📄 Extracting text from documents...');
        setConfidence(25);
      } else if (attempts <= 30) {
        setAnalysisStage('🔍 Analyzing pitch deck structure...');
        setConfidence(40);
      } else if (attempts <= 60) {
        setAnalysisStage('🧠 AI evaluating market opportunity...');
        setConfidence(55);
      } else if (attempts <= 90) {
        setAnalysisStage('📊 Calculating traction metrics...');
        setConfidence(70);
      } else if (attempts <= 120) {
        setAnalysisStage('💰 Analyzing unit economics...');
        setConfidence(80);
      } else if (attempts <= 180) {
        setAnalysisStage('🌐 Web grounding & fact-checking...');
        setConfidence(90);
      } else {
        setAnalysisStage('✨ Finalizing comprehensive analysis...');
        setConfidence(95);
      }
      
      try {
        const deck = await api.getDeck(deckId);
        console.log(`[Poll ${attempts}] Deck status:`, deck.status, 'Has analysis:', !!deck.analysis);
        
        setCurrentDeck(deck);
        
        // Populate stage and industry from deck's company data
        if (deck.stage && !selectedStage) {
          setSelectedStage(deck.stage);
        }
        if (deck.industry && !selectedIndustry) {
          setSelectedIndustry(deck.industry);
        }

        // Backend uses 'completed' not 'analyzed'
        if (deck.status === 'completed' || deck.status === 'analyzed' || deck.status === 'failed') {
          console.log('✓ Analysis finished with status:', deck.status);
          clearInterval(poll);
          setUploading(false);
          setAnalyzing(false);
          setConfidence(100);
          setAnalysisStage('✅ Complete!');
          
          if (deck.status === 'failed') {
            setError('Analysis failed. Please try again.');
          } else {
            console.log('✓ Analysis data:', deck.analysis);
            // Refresh the analyzed decks list to include the newly completed analysis
            loadAnalyzedDecks();
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

  // Handle wizard completion
  const handleWizardComplete = async (deckId: string, hasContext: boolean, hasPreferences: boolean) => {
    console.log('🎉 Wizard complete:', { deckId, hasContext, hasPreferences });
    setUseWizardMode(false);
    
    // Load the deck and poll for analysis
    try {
      const deck = await api.getDeck(deckId);
      setCurrentDeck(deck);
      
      // Populate stage and industry from deck's company data
      if (deck.stage) setSelectedStage(deck.stage);
      if (deck.industry) setSelectedIndustry(deck.industry);
      
      setAnalyzing(true);
      pollForAnalysis(deckId);
    } catch (err) {
      console.error('Failed to load deck after wizard:', err);
      setError('Failed to load deck. Please refresh the page.');
    }
  };

  // Render delete modal at top level so it's available in all views
  const deleteModal = showDeleteModal && createPortal(
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]" 
      onClick={(e) => e.stopPropagation()}
      ref={(el) => {
        if (el) console.log('🎭 MODAL DIV RENDERED IN DOM!', { showDeleteModal, deleteMode, deleteType });
      }}
    >
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex items-center space-x-3 mb-4">
          <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <Trash2 className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Confirm {deleteMode === 'single' ? 'Delete' : 'Bulk Delete'}
            </h3>
            <p className="text-sm text-slate-600">
              {deleteMode === 'single' 
                ? `Are you sure you want to delete this ${deleteType}?`
                : `Are you sure you want to delete ${deleteType === 'deck' ? selectedDecks.size : selectedComparisons.size} selected ${deleteType}${(deleteType === 'deck' ? selectedDecks.size : selectedComparisons.size) !== 1 ? 's' : ''}?`
              }
            </p>
          </div>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-red-800">
            ⚠️ This action cannot be undone. {deleteType === 'deck' ? 'The pitch deck and all its analysis data will be permanently deleted.' : 'The comparison results will be permanently deleted.'}
          </p>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={() => setShowDeleteModal(false)}
            disabled={bulkDeleting}
            className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={confirmDelete}
            disabled={bulkDeleting}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            {bulkDeleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                <span>
                  Delete {deleteMode === 'bulk' ? `${deleteType === 'deck' ? selectedDecks.size : selectedComparisons.size} ` : ''}
                  {deleteType === 'deck' ? 'Deck' : 'Comparison'}{deleteMode === 'bulk' && (deleteType === 'deck' ? selectedDecks.size : selectedComparisons.size) !== 1 ? 's' : ''}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );

  // Show wizard if enabled
  if (useWizardMode && !currentDeck) {
    return (
      <>
        {deleteModal}
        <EvaluationWizard
          onComplete={handleWizardComplete}
          onCancel={() => setUseWizardMode(false)}
          userId={user?.id || crypto.randomUUID()}
        />
      </>
    );
  }

  // Show upload form if no deck uploaded yet
  if (!currentDeck) {
    return (
      <>
        {deleteModal}
        <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Deck Intelligence</h1>
            <p className="text-slate-600 mt-1">
              {userType === 'founder' 
                ? 'Analyze your pitch deck or compare multiple decks'
                : 'Analyze multiple decks and compare them side-by-side'}
            </p>
          </div>
          
          {/* Wizard Mode Toggle - Only show on Analysis tab */}
          {activeTab === 'analysis' && (
            <div className="flex gap-3">
              <button
                onClick={() => setUseWizardMode(true)}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 flex items-center space-x-2 transition-all shadow-md hover:shadow-lg"
              >
                <Wand2 className="h-5 w-5" />
                <span>Guided Evaluation</span>
              </button>
              
              <button
                onClick={() => window.location.href = '/vc-mode'}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 flex items-center space-x-2 transition-all shadow-md hover:shadow-lg"
                title="Configure Advanced VC Evaluation preferences"
              >
                <Target className="h-5 w-5" />
                <span>Advanced VC Eval</span>
              </button>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-slate-200 -mx-6">
          <div className="flex px-6">
            <button
              onClick={() => setActiveTab('analysis')}
              className={`flex-1 px-6 py-4 font-medium transition-all relative ${
                activeTab === 'analysis'
                  ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Pitch Deck & Memo Intelligence</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('comparison')}
              className={`flex-1 px-6 py-4 font-medium transition-all relative ${
                activeTab === 'comparison'
                  ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <BarChart className="h-5 w-5" />
                <span>Compare Pitch Decks</span>
              </div>
            </button>
          </div>
        </div>

        {/* VC Context Badge (from VC Mode) */}
        {vcContext && vcContext.summary && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Trophy className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold text-slate-900">
                  VC Intelligence Context Active
                </h3>
              </div>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded font-medium">
                ENABLED
              </span>
            </div>
            
            <p className="text-sm text-slate-700 mb-3 font-medium">
              {vcContext.summary.executiveSummary || 'Personal VC knowledge base loaded'}
            </p>
            
            <div className="grid grid-cols-3 gap-3 mb-3">
              {vcContext.summary.companiesMentioned && vcContext.summary.companiesMentioned.length > 0 && (
                <div className="bg-white rounded-lg p-2">
                  <p className="text-xs text-slate-500">Companies Tracked</p>
                  <p className="text-lg font-bold text-slate-900">{vcContext.summary.companiesMentioned.length}</p>
                </div>
              )}
              {vcContext.summary.marketInsights && vcContext.summary.marketInsights.length > 0 && (
                <div className="bg-white rounded-lg p-2">
                  <p className="text-xs text-slate-500">Market Insights</p>
                  <p className="text-lg font-bold text-slate-900">{vcContext.summary.marketInsights.length}</p>
                </div>
              )}
              {vcContext.summary.peopleNetwork && vcContext.summary.peopleNetwork.length > 0 && (
                <div className="bg-white rounded-lg p-2">
                  <p className="text-xs text-slate-500">Network Contacts</p>
                  <p className="text-lg font-bold text-slate-900">{vcContext.summary.peopleNetwork.length}</p>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowVcContextDetails(!showVcContextDetails)}
              className="flex items-center space-x-1 text-sm text-green-600 hover:text-green-700 font-medium"
            >
              <span>{showVcContextDetails ? 'Hide' : 'Show'} Intelligence Details</span>
              {showVcContextDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {showVcContextDetails && (
              <div className="mt-4 space-y-3 border-t border-green-200 pt-4">
                {vcContext.summary.investmentThesis && (
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm mb-2">Investment Thesis</h4>
                    <div className="text-sm text-slate-700 space-y-1">
                      {vcContext.summary.investmentThesis.focusAreas && (
                        <p><strong>Focus:</strong> {vcContext.summary.investmentThesis.focusAreas.join(', ')}</p>
                      )}
                      {vcContext.summary.investmentThesis.dealbreakers && vcContext.summary.investmentThesis.dealbreakers.length > 0 && (
                        <p><strong>Dealbreakers:</strong> {vcContext.summary.investmentThesis.dealbreakers.join(', ')}</p>
                      )}
                    </div>
                  </div>
                )}
                
                {vcContext.summary.decisionPatterns && (
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm mb-2">Decision Patterns</h4>
                    <div className="text-sm text-slate-700 space-y-1">
                      {vcContext.summary.decisionPatterns.whatVCValuesMost && (
                        <p><strong>Values Most:</strong> {vcContext.summary.decisionPatterns.whatVCValuesMost.join(', ')}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Imported Context Badge - Only show on Analysis tab */}
        {activeTab === 'analysis' && importedContext && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-slate-900">
                  Using Context from: {importedContext.companyName}
                </h3>
              </div>
              <button
                onClick={clearImportedContext}
                className="p-1 hover:bg-white rounded transition-colors"
                title="Clear context"
              >
                <X className="h-4 w-4 text-slate-600" />
              </button>
            </div>
            
            <p className="text-sm text-slate-600 mb-3">
              {importedContext.itemCount} documents • Exported {new Date(importedContext.exportedAt).toLocaleString()}
            </p>

            <button
              onClick={() => setShowContextDetails(!showContextDetails)}
              className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              <span>{showContextDetails ? 'Hide' : 'Show'} Context Details</span>
              {showContextDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {showContextDetails && (
              <div className="mt-4 space-y-3 border-t border-blue-200 pt-4">
                <div>
                  <p className="text-xs font-semibold text-slate-700 uppercase mb-1">Executive Summary</p>
                  <p className="text-sm text-slate-600">{importedContext.summary.executiveSummary}</p>
                </div>
                
                <div>
                  <p className="text-xs font-semibold text-slate-700 uppercase mb-1">Source Documents</p>
                  <div className="space-y-1">
                    {importedContext.items.slice(0, 5).map((item: any, idx: number) => (
                      <div key={idx} className="text-sm text-slate-600 flex items-center space-x-2">
                        <FileText className="h-3 w-3 text-blue-600" />
                        <span>{item.fileName}</span>
                      </div>
                    ))}
                    {importedContext.items.length > 5 && (
                      <p className="text-xs text-slate-500">+ {importedContext.items.length - 5} more</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab Content - Analysis Tab */}
        {activeTab === 'analysis' && (
        <div className="grid grid-cols-1 gap-6">
          {/* Dual PDF Upload */}
          <div className="bg-white rounded-xl border-2 border-dashed border-slate-300 p-8 hover:border-blue-400 transition-colors">
            <div className="flex items-start space-x-6">
              <Upload className="h-12 w-12 text-slate-400 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Upload Documents</h3>
                <p className="text-slate-600 mb-6">
                  Upload your <strong>Pitch Deck</strong> (required) and optionally include a <strong>Founder Checklist</strong> for detailed analysis and <strong>additional supporting documents</strong> (audits, research, memos)
                </p>
                
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}
                
                {/* Enhanced Company Context Selection */}
                <div className="mb-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
                  <div className="flex items-start mb-4">
                    <div className="flex-shrink-0 bg-blue-600 rounded-full p-2 mr-3">
                      <Target className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-800 mb-1">
                        Analyse Your Pitch Documents
                      </h3>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        Intelligent industry-specific analysis
                      </p>
                    </div>
                  </div>

                  {/* Two-Column Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Funding Stage Dropdown */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center">
                        <TrendingUp className="h-4 w-4 mr-2 text-blue-600" />
                        Funding Stage <span className="text-red-500 ml-1">*</span>
                      </label>
                      <select
                        value={selectedStage}
                        onChange={(e) => setSelectedStage(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-800 font-medium transition-all"
                      >
                        <option value="">Select funding stage...</option>
                        <option value="Pre-Seed">Pre-Seed (Idea Stage)</option>
                        <option value="Seed">Seed ($500K - $2M)</option>
                        <option value="Series A">Series A ($2M - $15M)</option>
                        <option value="Series B">Series B ($15M - $50M)</option>
                        <option value="Series C">Series C ($50M - $100M)</option>
                        <option value="Series D+">Series D+ ($100M+)</option>
                      </select>
                      <p className="mt-1 text-xs text-slate-500 italic">
                        VCs expect different metrics at each stage
                      </p>
                    </div>

                    {/* Industry Dropdown */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center">
                        <BarChart className="h-4 w-4 mr-2 text-blue-600" />
                        Industry Vertical <span className="text-red-500 ml-1">*</span>
                      </label>
                      <select
                        value={selectedIndustry}
                        onChange={(e) => setSelectedIndustry(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-800 font-medium transition-all"
                      >
                        <option value="">Select industry...</option>
                        <option value="Artificial Intelligence">🤖 Artificial Intelligence & ML</option>
                        <option value="HealthTech">🏥 HealthTech & Biotech</option>
                        <option value="FinTech">💰 FinTech & Payments</option>
                        <option value="CleanTech">🌱 CleanTech & Sustainability</option>
                        <option value="EdTech">📚 EdTech & Learning</option>
                        <option value="Food Tech">🍽️ Food Tech & AgTech</option>
                        <option value="SaaS B2B">💼 SaaS & Enterprise B2B</option>
                        <option value="E-commerce">🛒 E-commerce & Retail</option>
                        <option value="Mobility">🚗 Mobility & Transportation</option>
                        <option value="PropTech">🏠 PropTech & Real Estate</option>
                        <option value="Cybersecurity">🔒 Cybersecurity</option>
                        <option value="Web3">⛓️ Web3 & Blockchain</option>
                        <option value="Other">🔧 Other / General Tech</option>
                      </select>
                      <p className="mt-1 text-xs text-slate-500 italic">
                        Each industry has unique KPIs & metrics
                      </p>
                    </div>
                  </div>
                </div>

                {/* Legacy Company Selector - Hidden but functional for backward compatibility */}
                <input 
                  type="hidden" 
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* Pitch Deck Upload */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      1. Pitch Deck (PDF/PPT/DOCX) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.ppt,.pptx,.docx,.doc"
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
                    <p className="mt-1 text-xs text-slate-500">
                      Max 100MB • Supports PDF, PowerPoint, Word
                    </p>
                  </div>
                  
                  {/* Checklist Upload - Optional */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      2. Founder Checklist <span className="text-slate-500">(Optional - Recommended)</span>
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.ppt,.pptx,.docx,.doc"
                      onChange={handleChecklistFileSelect}
                      className="hidden"
                      id="checklist-upload"
                    />
                    <label
                      htmlFor="checklist-upload"
                      className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-teal-400 text-teal-600 rounded-lg font-medium hover:bg-teal-50 transition-all cursor-pointer"
                    >
                      <FileText className="h-5 w-5 mr-2" />
                      {checklistFile ? 'Change Checklist' : 'Choose Checklist'}
                    </label>
                    {checklistFile && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-800 flex items-center">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        {checklistFile.name}
                        <button
                          onClick={() => setChecklistFile(null)}
                          className="ml-auto text-green-700 hover:text-green-900"
                        >
                          ×
                        </button>
                      </div>
                    )}
                    <p className="mt-1 text-xs text-slate-500">
                      Recommended for detailed unit economics analysis
                    </p>
                  </div>
                </div>
                
                {/* Additional Documents Upload - Optional */}
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Additional Documents <span className="text-slate-500">(Optional - Up to 5 files)</span>
                  </label>
                  <p className="text-xs text-slate-600 mb-3">
                    Upload supporting documents: financial audits, market research, memos, technical documentation
                  </p>
                  <input
                    type="file"
                    accept=".pdf,.ppt,.pptx,.docx,.doc"
                    onChange={(e) => handleAdditionalDocsChange(e.target.files)}
                    className="hidden"
                    id="additional-docs-upload"
                    multiple
                  />
                  <label
                    htmlFor="additional-docs-upload"
                    className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-slate-300 text-slate-600 rounded-lg font-medium hover:bg-slate-50 transition-all cursor-pointer"
                  >
                    <FileText className="h-5 w-5 mr-2" />
                    {additionalDocs.length > 0 ? 'Add More Documents' : 'Choose Documents'}
                  </label>
                  
                  {/* Additional Docs List */}
                  {additionalDocs.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-medium text-slate-700">
                        Files ({additionalDocs.length} of {MAX_ADDITIONAL_DOCS}):
                      </p>
                      {additionalDocs.map((doc, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                          <div className="flex items-center flex-1">
                            <FileText className="h-4 w-4 mr-2 text-blue-600" />
                            <span className="text-blue-900 truncate">{doc.name}</span>
                            <span className="text-blue-600 ml-2">({(doc.size / 1024).toFixed(0)} KB)</span>
                          </div>
                          <button
                            onClick={() => removeAdditionalDoc(index)}
                            className="ml-2 text-blue-700 hover:text-blue-900 font-bold"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      <p className="text-xs text-slate-500">
                        Total: {(totalUploadSize / 1024 / 1024).toFixed(1)} MB / 500 MB
                      </p>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={handleUpload}
                  disabled={uploading || !deckFile || !selectedStage || !selectedIndustry}
                  className="w-full bg-gradient-to-r from-blue-800 to-teal-600 text-white px-6 py-4 rounded-lg font-medium hover:from-blue-900 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {uploading ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      {analyzing ? 'Analyzing...' : 'Uploading...'}
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <Upload className="h-5 w-5 mr-2" />
                      Upload & Analyze with Industry Benchmarks
                    </span>
                  )}
                </button>

                {/* Enhanced Progress Indicator */}
                {uploading && analyzing && (
                  <div className="mt-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6 shadow-sm">
                    <div className="space-y-4">
                      {/* Progress Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
                            <div className="absolute inset-0 bg-blue-400 blur-sm opacity-30 animate-pulse"></div>
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900">{analysisStage}</h3>
                            <p className="text-xs text-slate-600">
                              {selectedIndustry} • {selectedStage}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">{confidence}%</div>
                          <div className="text-xs text-slate-500">Confidence</div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="relative">
                        <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-teal-500 transition-all duration-500 ease-out relative"
                            style={{ width: `${confidence}%` }}
                          >
                            <div className="absolute inset-0 bg-white opacity-30 animate-pulse"></div>
                          </div>
                        </div>
                        <div className="flex justify-between mt-2 text-xs text-slate-500">
                          <span>Started</span>
                          <span className="font-medium text-slate-700">
                            {Math.floor(analysisProgress * 2 / 60)}:{String(Math.floor((analysisProgress * 2) % 60)).padStart(2, '0')} elapsed
                          </span>
                          <span>Complete</span>
                        </div>
                      </div>

                      {/* Analysis Steps */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                        <div className={`p-2 rounded-lg border ${confidence >= 10 ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                          <div className="flex items-center space-x-1">
                            {confidence >= 10 ? <CheckCircle className="h-3 w-3" /> : <div className="h-3 w-3 border-2 border-slate-300 rounded-full"></div>}
                            <span className="font-medium">Upload</span>
                          </div>
                        </div>
                        <div className={`p-2 rounded-lg border ${confidence >= 40 ? 'bg-green-50 border-green-200 text-green-700' : confidence >= 25 ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                          <div className="flex items-center space-x-1">
                            {confidence >= 40 ? <CheckCircle className="h-3 w-3" /> : confidence >= 25 ? <Loader2 className="h-3 w-3 animate-spin" /> : <div className="h-3 w-3 border-2 border-slate-300 rounded-full"></div>}
                            <span className="font-medium">Extract</span>
                          </div>
                        </div>
                        <div className={`p-2 rounded-lg border ${confidence >= 80 ? 'bg-green-50 border-green-200 text-green-700' : confidence >= 40 ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                          <div className="flex items-center space-x-1">
                            {confidence >= 80 ? <CheckCircle className="h-3 w-3" /> : confidence >= 40 ? <Loader2 className="h-3 w-3 animate-spin" /> : <div className="h-3 w-3 border-2 border-slate-300 rounded-full"></div>}
                            <span className="font-medium">AI Analysis</span>
                          </div>
                        </div>
                        <div className={`p-2 rounded-lg border ${confidence >= 95 ? 'bg-green-50 border-green-200 text-green-700' : confidence >= 90 ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                          <div className="flex items-center space-x-1">
                            {confidence >= 95 ? <CheckCircle className="h-3 w-3" /> : confidence >= 90 ? <Loader2 className="h-3 w-3 animate-spin" /> : <div className="h-3 w-3 border-2 border-slate-300 rounded-full"></div>}
                            <span className="font-medium">Finalize</span>
                          </div>
                        </div>
                      </div>

                      {/* Fun Facts */}
                      <div className="pt-3 border-t border-slate-200">
                        <div className="flex items-start space-x-2 text-xs text-slate-600">
                          <Target className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-500" />
                          <p>
                            <strong className="text-slate-700">Did you know?</strong> Our AI analyzes {confidence < 50 ? 'market size, TAM/SAM/SOM' : confidence < 70 ? 'traction metrics, burn rate, runway' : confidence < 90 ? 'unit economics, CAC, LTV, payback period' : 'web grounding, competitive landscape & defensibility'} to give you institutional-grade insights.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Previously Analyzed Decks Section */}
        {activeTab === 'analysis' && !analyzing && !uploading && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-600 rounded-lg p-2">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Previously Analyzed Decks</h3>
                  <p className="text-sm text-slate-600">View past analysis results</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-slate-500">{analyzedDecks.length} deck{analyzedDecks.length !== 1 ? 's' : ''}</span>
                
                {/* Refresh Button */}
                <button
                  onClick={handleRefreshDecks}
                  disabled={refreshingDecks}
                  className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`h-4 w-4 ${refreshingDecks ? 'animate-spin' : ''}`} />
                  <span>{refreshingDecks ? 'Refreshing...' : 'Refresh'}</span>
                </button>
                
                {/* Bulk Actions */}
                {analyzedDecks.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={selectAllDecks}
                      className="text-sm text-blue-600 hover:text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      {selectedDecks.size === analyzedDecks.length ? 'Deselect All' : 'Select All'}
                    </button>
                    
                    {selectedDecks.size > 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('🖱️ Bulk delete button clicked for decks');
                          handleBulkDelete('deck');
                        }}
                        className="flex items-center space-x-1 text-sm text-red-600 hover:text-red-700 px-3 py-1 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Delete ({selectedDecks.size})</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {analyzedDecks.length > 0 ? (
                analyzedDecks.map((deck) => (
                  <div 
                    key={deck.id} 
                    className="bg-white rounded-lg border border-blue-200 p-4 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        {/* Selection checkbox */}
                        <input
                          type="checkbox"
                          checked={selectedDecks.has(deck.id)}
                          onChange={() => toggleDeckSelection(deck.id)}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-semibold text-slate-900">{deck.file_name}</h4>
                            {deck.sso_score && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded">
                                {(parseFloat(deck.sso_score.toString()) * 10).toFixed(1)}/10
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-slate-600">
                            {deck.company_name && (
                              <span className="flex items-center space-x-1">
                                <span>🏢</span>
                                <span>{deck.company_name}</span>
                              </span>
                            )}
                            {deck.stage && (
                              <span className="flex items-center space-x-1">
                                <TrendingUp className="h-3 w-3" />
                                <span>{deck.stage}</span>
                              </span>
                            )}
                            {deck.industry && (
                              <span className="flex items-center space-x-1">
                                <BarChart className="h-3 w-3" />
                                <span>{deck.industry}</span>
                              </span>
                            )}
                          </div>
                          
                          {deck.analyzed_at && (
                            <p className="text-xs text-slate-500 mt-1">
                              Analyzed: {new Date(deck.analyzed_at).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        {/* Individual delete button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSingleDelete(deck.id, 'deck');
                          }}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete this deck"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        
                        {/* Show Results button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShowDeckResults(deck.id);
                          }}
                          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                          <span>Show Results</span>
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 mb-2">No analyzed decks found</p>
                  <p className="text-sm text-slate-400">Upload and analyze a deck to see it here</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab Content - Comparison Tab */}
        {activeTab === 'comparison' && (
          <div className="bg-white rounded-xl border-2 border-slate-200 p-8">
            <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Compare Two Pitch Decks</h3>
                  <p className="text-sm text-slate-600 mt-1">Upload both decks for side-by-side comparison</p>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Deck 1 Selection */}
                  <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-4">
                    <label className="block text-sm font-semibold text-slate-900 mb-3">
                      First Pitch Deck <span className="text-red-500">*</span>
                    </label>
                    
                    {/* Mode Toggle for Deck 1 */}
                    <div className="flex gap-2 mb-4">
                      <button
                        onClick={() => {
                          setDeck1Mode('analyzed');
                          setComparisonDeck1(null);
                        }}
                        className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          deck1Mode === 'analyzed'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Select Analyzed
                      </button>
                      <button
                        onClick={() => {
                          setDeck1Mode('upload');
                          setSelectedDeck1Id('');
                        }}
                        className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          deck1Mode === 'upload'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Upload New
                      </button>
                    </div>

                    {/* Analyzed Deck Selection */}
                    {deck1Mode === 'analyzed' && (
                      <div>
                        <select
                          value={selectedDeck1Id}
                          onChange={(e) => setSelectedDeck1Id(e.target.value)}
                          className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white"
                        >
                          <option value="">Select a deck...</option>
                          {analyzedDecks.map(deck => (
                            <option key={deck.id} value={deck.id}>
                              {deck.file_name} {deck.company_name ? `(${deck.company_name})` : ''}
                            </option>
                          ))}
                        </select>
                        {selectedDeck1Id && (
                          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800 flex items-center">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Selected: {analyzedDecks.find(d => d.id === selectedDeck1Id)?.file_name}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Upload New Deck */}
                    {deck1Mode === 'upload' && (
                      <div>
                        <input
                          type="file"
                          accept=".pdf,.ppt,.pptx,.docx,.doc"
                          onChange={handleComparison1FileSelect}
                          className="hidden"
                          id="comparison-deck-1"
                        />
                        <label
                          htmlFor="comparison-deck-1"
                          className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-blue-400 text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-all cursor-pointer"
                        >
                          <Upload className="h-5 w-5 mr-2" />
                          {comparisonDeck1 ? 'Change File' : 'Upload Deck'}
                        </label>
                        {comparisonDeck1 && (
                          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-800 flex items-center">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            {comparisonDeck1.name}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Deck 2 Selection */}
                  <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-4">
                    <label className="block text-sm font-semibold text-slate-900 mb-3">
                      Second Pitch Deck <span className="text-red-500">*</span>
                    </label>
                    
                    {/* Mode Toggle for Deck 2 */}
                    <div className="flex gap-2 mb-4">
                      <button
                        onClick={() => {
                          setDeck2Mode('analyzed');
                          setComparisonDeck2(null);
                        }}
                        className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          deck2Mode === 'analyzed'
                            ? 'bg-teal-600 text-white'
                            : 'bg-white text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Select Analyzed
                      </button>
                      <button
                        onClick={() => {
                          setDeck2Mode('upload');
                          setSelectedDeck2Id('');
                        }}
                        className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          deck2Mode === 'upload'
                            ? 'bg-teal-600 text-white'
                            : 'bg-white text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Upload New
                      </button>
                    </div>

                    {/* Analyzed Deck Selection */}
                    {deck2Mode === 'analyzed' && (
                      <div>
                        <select
                          value={selectedDeck2Id}
                          onChange={(e) => setSelectedDeck2Id(e.target.value)}
                          className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-teal-500 focus:ring-2 focus:ring-teal-200 bg-white"
                        >
                          <option value="">Select a deck...</option>
                          {analyzedDecks.map(deck => (
                            <option key={deck.id} value={deck.id}>
                              {deck.file_name} {deck.company_name ? `(${deck.company_name})` : ''}
                            </option>
                          ))}
                        </select>
                        {selectedDeck2Id && (
                          <div className="mt-2 p-2 bg-teal-50 border border-teal-200 rounded text-xs text-teal-800 flex items-center">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Selected: {analyzedDecks.find(d => d.id === selectedDeck2Id)?.file_name}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Upload New Deck */}
                    {deck2Mode === 'upload' && (
                      <div>
                        <input
                          type="file"
                          accept=".pdf,.ppt,.pptx,.docx,.doc"
                          onChange={handleComparison2FileSelect}
                          className="hidden"
                          id="comparison-deck-2"
                        />
                        <label
                          htmlFor="comparison-deck-2"
                          className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-teal-400 text-teal-600 rounded-lg font-medium hover:bg-teal-50 transition-all cursor-pointer"
                        >
                          <Upload className="h-5 w-5 mr-2" />
                          {comparisonDeck2 ? 'Change File' : 'Upload Deck'}
                        </label>
                        {comparisonDeck2 && (
                          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-800 flex items-center">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            {comparisonDeck2.name}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-500">
                  Supported formats: PDF, PowerPoint (.ppt, .pptx), Word (.doc, .docx) • Max 100MB per file
                </p>

                <button
                  onClick={handleCompareDecks}
                  disabled={
                    comparingDecks || 
                    (deck1Mode === 'upload' && !comparisonDeck1) || 
                    (deck1Mode === 'analyzed' && !selectedDeck1Id) ||
                    (deck2Mode === 'upload' && !comparisonDeck2) || 
                    (deck2Mode === 'analyzed' && !selectedDeck2Id)
                  }
                  className="w-full bg-gradient-to-r from-blue-800 to-teal-600 text-white px-6 py-4 rounded-lg font-medium hover:from-blue-900 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {comparingDecks ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Comparing Decks...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <BarChart className="h-5 w-5 mr-2" />
                      Compare & Generate Report
                    </span>
                  )}
                </button>

                {/* Enhanced Progress Indicator for Comparison */}
                {comparingDecks && (
                  <div className="mt-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6 shadow-sm">
                    <div className="space-y-4">
                      {/* Progress Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
                            <div className="absolute inset-0 bg-blue-400 blur-sm opacity-30 animate-pulse"></div>
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900">{comparisonStage}</h3>
                            <p className="text-xs text-slate-600">
                              Comparing: {comparisonDeck1?.name} vs {comparisonDeck2?.name}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">{comparisonConfidence}%</div>
                          <div className="text-xs text-slate-500">Progress</div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="relative">
                        <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-teal-500 transition-all duration-500 ease-out relative"
                            style={{ width: `${comparisonConfidence}%` }}
                          >
                            <div className="absolute inset-0 bg-white opacity-30 animate-pulse"></div>
                          </div>
                        </div>
                        <div className="flex justify-between mt-2 text-xs text-slate-500">
                          <span>Started</span>
                          <span className="font-medium text-slate-700">
                            {Math.floor(comparisonProgress * 2 / 60)}:{String(Math.floor((comparisonProgress * 2) % 60)).padStart(2, '0')} elapsed
                          </span>
                          <span>Complete</span>
                        </div>
                      </div>

                      {/* Analysis Steps */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                        <div className={`p-2 rounded-lg border ${comparisonConfidence >= 10 ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                          <div className="flex items-center space-x-1">
                            {comparisonConfidence >= 10 ? <CheckCircle className="h-3 w-3" /> : <div className="h-3 w-3 border-2 border-slate-300 rounded-full"></div>}
                            <span className="font-medium">Upload</span>
                          </div>
                        </div>
                        <div className={`p-2 rounded-lg border ${comparisonConfidence >= 30 ? 'bg-green-50 border-green-200 text-green-700' : comparisonConfidence >= 20 ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                          <div className="flex items-center space-x-1">
                            {comparisonConfidence >= 30 ? <CheckCircle className="h-3 w-3" /> : comparisonConfidence >= 20 ? <Loader2 className="h-3 w-3 animate-spin" /> : <div className="h-3 w-3 border-2 border-slate-300 rounded-full"></div>}
                            <span className="font-medium">Extract</span>
                          </div>
                        </div>
                        <div className={`p-2 rounded-lg border ${comparisonConfidence >= 75 ? 'bg-green-50 border-green-200 text-green-700' : comparisonConfidence >= 45 ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                          <div className="flex items-center space-x-1">
                            {comparisonConfidence >= 75 ? <CheckCircle className="h-3 w-3" /> : comparisonConfidence >= 45 ? <Loader2 className="h-3 w-3 animate-spin" /> : <div className="h-3 w-3 border-2 border-slate-300 rounded-full"></div>}
                            <span className="font-medium">Analyze</span>
                          </div>
                        </div>
                        <div className={`p-2 rounded-lg border ${comparisonConfidence >= 95 ? 'bg-green-50 border-green-200 text-green-700' : comparisonConfidence >= 85 ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                          <div className="flex items-center space-x-1">
                            {comparisonConfidence >= 95 ? <CheckCircle className="h-3 w-3" /> : comparisonConfidence >= 85 ? <Loader2 className="h-3 w-3 animate-spin" /> : <div className="h-3 w-3 border-2 border-slate-300 rounded-full"></div>}
                            <span className="font-medium">Compare</span>
                          </div>
                        </div>
                      </div>

                      {/* Fun Facts */}
                      <div className="pt-3 border-t border-slate-200">
                        <div className="flex items-start space-x-2 text-xs text-slate-600">
                          <Target className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-500" />
                          <p>
                            <strong className="text-slate-700">Did you know?</strong> Our AI analyzes {comparisonConfidence < 50 ? 'both decks individually' : comparisonConfidence < 75 ? 'team strength, market opportunity & product differentiation' : comparisonConfidence < 90 ? 'traction metrics, unit economics & competitive positioning' : 'comparative strengths, weaknesses & actionable recommendations'} to give you institutional-grade insights.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Comparison Preview (shown after completion) */}
                {showComparisonPreview && comparisonPreview && completedComparisonId && !comparingDecks && (
                  <div className="mt-6 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                    {/* Preview Header */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-slate-200 p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-white rounded-lg shadow-sm">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-slate-900">Comparison Analysis Complete</h3>
                            <p className="text-sm text-slate-600 mt-1">Review the comparison results below</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setShowComparisonPreview(false);
                            setComparisonPreview(null);
                            setCompletedComparisonId(null);
                            setComparisonDeck1(null);
                            setComparisonDeck2(null);
                            setComparisonProgress(0);
                            setComparisonConfidence(0);
                          }}
                          className="text-slate-400 hover:text-slate-600 p-2 hover:bg-white rounded-lg transition-all"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    {/* Preview Content */}
                    <div className="p-6 max-h-[600px] overflow-y-auto">
                      {/* Winner Badge */}
                      {comparisonPreview?.comparison?.winnerOverall && (
                        <div className="mb-6 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-lg p-4 text-center">
                          <div className="text-white">
                            <Trophy className="h-8 w-8 mx-auto mb-2" />
                            <h3 className="text-xl font-bold">
                              Winner: {comparisonPreview.comparison.winnerOverall === 'deck1' ? 'Deck 1' : comparisonPreview.comparison.winnerOverall === 'deck2' ? 'Deck 2' : 'Tie'}
                            </h3>
                          </div>
                        </div>
                      )}
                      
                      {/* Executive Summary */}
                      {comparisonPreview?.comparison?.summary && (
                        <div className="mb-6">
                          <h4 className="text-lg font-semibold text-slate-900 mb-3 flex items-center">
                            <BarChart className="h-5 w-5 mr-2 text-blue-600" />
                            Executive Summary
                          </h4>
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-slate-700">{comparisonPreview.comparison.summary}</p>
                          </div>
                        </div>
                      )}

                      {/* Category Winners */}
                      {comparisonPreview?.comparison?.categoryWinners && (
                        <div className="mb-6">
                          <h4 className="text-lg font-semibold text-slate-900 mb-3 flex items-center">
                            <Target className="h-5 w-5 mr-2 text-purple-600" />
                            Category Winners
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            {Object.entries(comparisonPreview.comparison.categoryWinners).map(([category, winner]) => (
                              <div key={category} className={`p-3 rounded-lg border-2 ${
                                (winner as string) === 'deck1' ? 'bg-purple-50 border-purple-300' :
                                (winner as string) === 'deck2' ? 'bg-teal-50 border-teal-300' :
                                'bg-gray-50 border-gray-300'
                              }`}>
                                <div className="text-xs font-medium text-slate-600 uppercase mb-1">
                                  {category}
                                </div>
                                <div className="text-sm font-bold text-slate-900">
                                  {(winner as string) === 'deck1' ? 'Deck 1' : (winner as string) === 'deck2' ? 'Deck 2' : 'Tie'}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Individual Deck Scores */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        {/* Deck 1 Score */}
                        {comparisonPreview?.deck1Analysis?.analysis?.overallScore !== undefined && (
                          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                            <h4 className="text-md font-semibold text-purple-900 mb-2 flex items-center">
                              <FileText className="h-4 w-4 mr-2" />
                              Deck 1 Overall Score
                            </h4>
                            <div className="text-3xl font-bold text-purple-700">
                              {comparisonPreview.deck1Analysis.analysis.overallScore}/100
                            </div>
                          </div>
                        )}

                        {/* Deck 2 Score */}
                        {comparisonPreview?.deck2Analysis?.analysis?.overallScore !== undefined && (
                          <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                            <h4 className="text-md font-semibold text-teal-900 mb-2 flex items-center">
                              <FileText className="h-4 w-4 mr-2" />
                              Deck 2 Overall Score
                            </h4>
                            <div className="text-3xl font-bold text-teal-700">
                              {comparisonPreview.deck2Analysis.analysis.overallScore}/100
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Comparative Strengths & Weaknesses */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        {/* Deck 1 */}
                        <div>
                          <h4 className="text-md font-semibold text-slate-900 mb-3 flex items-center">
                            <FileText className="h-4 w-4 mr-2 text-purple-600" />
                            Deck 1 Analysis
                          </h4>
                          
                          {comparisonPreview?.comparison?.strengths?.deck1 && comparisonPreview.comparison.strengths.deck1.length > 0 && (
                            <div className="mb-3">
                              <h5 className="text-sm font-medium text-green-700 mb-2 flex items-center">
                                <TrendingUp className="h-4 w-4 mr-1" />
                                Strengths
                              </h5>
                              <ul className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2">
                                {comparisonPreview.comparison.strengths.deck1.map((strength: string, idx: number) => (
                                  <li key={idx} className="text-sm text-slate-700 flex items-start">
                                    <span className="text-green-600 mr-2">✓</span>
                                    <span>{strength}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {comparisonPreview?.comparison?.weaknesses?.deck1 && comparisonPreview.comparison.weaknesses.deck1.length > 0 && (
                            <div className="mb-3">
                              <h5 className="text-sm font-medium text-orange-700 mb-2 flex items-center">
                                <AlertTriangle className="h-4 w-4 mr-1" />
                                Weaknesses
                              </h5>
                              <ul className="bg-orange-50 border border-orange-200 rounded-lg p-3 space-y-2">
                                {comparisonPreview.comparison.weaknesses.deck1.map((weakness: string, idx: number) => (
                                  <li key={idx} className="text-sm text-slate-700 flex items-start">
                                    <span className="text-orange-600 mr-2">⚠</span>
                                    <span>{weakness}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {comparisonPreview?.comparison?.recommendations?.deck1 && comparisonPreview.comparison.recommendations.deck1.length > 0 && (
                            <div>
                              <h5 className="text-sm font-medium text-blue-700 mb-2 flex items-center">
                                <Target className="h-4 w-4 mr-1" />
                                Recommendations
                              </h5>
                              <ul className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
                                {comparisonPreview.comparison.recommendations.deck1.map((rec: string, idx: number) => (
                                  <li key={idx} className="text-sm text-slate-700 flex items-start">
                                    <span className="text-blue-600 mr-2">→</span>
                                    <span>{rec}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        {/* Deck 2 */}
                        <div>
                          <h4 className="text-md font-semibold text-slate-900 mb-3 flex items-center">
                            <FileText className="h-4 w-4 mr-2 text-teal-600" />
                            Deck 2 Analysis
                          </h4>
                          
                          {comparisonPreview?.comparison?.strengths?.deck2 && comparisonPreview.comparison.strengths.deck2.length > 0 && (
                            <div className="mb-3">
                              <h5 className="text-sm font-medium text-green-700 mb-2 flex items-center">
                                <TrendingUp className="h-4 w-4 mr-1" />
                                Strengths
                              </h5>
                              <ul className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2">
                                {comparisonPreview.comparison.strengths.deck2.map((strength: string, idx: number) => (
                                  <li key={idx} className="text-sm text-slate-700 flex items-start">
                                    <span className="text-green-600 mr-2">✓</span>
                                    <span>{strength}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {comparisonPreview?.comparison?.weaknesses?.deck2 && comparisonPreview.comparison.weaknesses.deck2.length > 0 && (
                            <div className="mb-3">
                              <h5 className="text-sm font-medium text-orange-700 mb-2 flex items-center">
                                <AlertTriangle className="h-4 w-4 mr-1" />
                                Weaknesses
                              </h5>
                              <ul className="bg-orange-50 border border-orange-200 rounded-lg p-3 space-y-2">
                                {comparisonPreview.comparison.weaknesses.deck2.map((weakness: string, idx: number) => (
                                  <li key={idx} className="text-sm text-slate-700 flex items-start">
                                    <span className="text-orange-600 mr-2">⚠</span>
                                    <span>{weakness}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {comparisonPreview?.comparison?.recommendations?.deck2 && comparisonPreview.comparison.recommendations.deck2.length > 0 && (
                            <div>
                              <h5 className="text-sm font-medium text-blue-700 mb-2 flex items-center">
                                <Target className="h-4 w-4 mr-1" />
                                Recommendations
                              </h5>
                              <ul className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
                                {comparisonPreview.comparison.recommendations.deck2.map((rec: string, idx: number) => (
                                  <li key={idx} className="text-sm text-slate-700 flex items-start">
                                    <span className="text-blue-600 mr-2">→</span>
                                    <span>{rec}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Key Differences */}
                      {comparisonPreview?.comparison?.keyDifferences && comparisonPreview.comparison.keyDifferences.length > 0 && (
                        <div className="mb-6">
                          <h4 className="text-lg font-semibold text-slate-900 mb-3 flex items-center">
                            <AlertTriangle className="h-5 w-5 mr-2 text-yellow-600" />
                            Key Differences
                          </h4>
                          <ul className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-2">
                            {comparisonPreview.comparison.keyDifferences.map((diff: string, idx: number) => (
                              <li key={idx} className="text-slate-700 flex items-start">
                                <span className="text-yellow-600 font-bold mr-2">{idx + 1}.</span>
                                <span>{diff}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Export Options at Bottom */}
                    <div className="border-t border-slate-200 bg-slate-50 p-6">
                      <h4 className="text-md font-semibold text-slate-900 mb-4">Export Comparison Report</h4>
                      
                      {/* Premium PDF - Featured */}
                      <div className="mb-4">
                        <a
                          href={`${API_URL}/decks/compare/${completedComparisonId}/report/premium`}
                          download
                          className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
                        >
                          <Download className="h-5 w-5" />
                          <span>Premium PDF Report</span>
                        </a>
                      </div>
                      
                      {/* Standard Formats */}
                      <div className="grid grid-cols-3 gap-3">
                        <a
                          href={`${API_URL}/decks/compare/${completedComparisonId}/report/pdf`}
                          download
                          className="flex items-center justify-center space-x-2 bg-white border-2 border-blue-600 text-blue-600 px-4 py-3 rounded-lg font-medium hover:bg-blue-600 hover:text-white transition-all"
                        >
                          <Download className="h-4 w-4" />
                          <span>PDF</span>
                        </a>
                        <a
                          href={`${API_URL}/decks/compare/${completedComparisonId}/report/txt`}
                          download
                          className="flex items-center justify-center space-x-2 bg-white border-2 border-teal-600 text-teal-600 px-4 py-3 rounded-lg font-medium hover:bg-teal-600 hover:text-white transition-all"
                        >
                          <Download className="h-4 w-4" />
                          <span>TXT</span>
                        </a>
                        <a
                          href={`${API_URL}/decks/compare/${completedComparisonId}/report/md`}
                          download
                          className="flex items-center justify-center space-x-2 bg-white border-2 border-purple-600 text-purple-600 px-4 py-3 rounded-lg font-medium hover:bg-purple-600 hover:text-white transition-all"
                        >
                          <Download className="h-4 w-4" />
                          <span>Markdown</span>
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* Old Download Options - Remove or keep as fallback */}
                {completedComparisonId && !comparingDecks && !showComparisonPreview && (
                  <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                        <div>
                          <h3 className="font-semibold text-slate-900">Comparison Complete!</h3>
                          <p className="text-sm text-slate-600">Download your report in your preferred format</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setCompletedComparisonId(null);
                          setComparisonDeck1(null);
                          setComparisonDeck2(null);
                          setComparisonProgress(0);
                          setComparisonConfidence(0);
                        }}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <a
                        href={`${API_URL}/decks/compare/${completedComparisonId}/report/pdf`}
                        download
                        className="flex items-center justify-center space-x-2 bg-white border-2 border-blue-600 text-blue-600 px-4 py-3 rounded-lg font-medium hover:bg-blue-50 transition-all"
                      >
                        <FileText className="h-4 w-4" />
                        <span>PDF</span>
                      </a>
                      <a
                        href={`${API_URL}/decks/compare/${completedComparisonId}/report/txt`}
                        download
                        className="flex items-center justify-center space-x-2 bg-white border-2 border-teal-600 text-teal-600 px-4 py-3 rounded-lg font-medium hover:bg-teal-50 transition-all"
                      >
                        <FileText className="h-4 w-4" />
                        <span>TXT</span>
                      </a>
                      <a
                        href={`${API_URL}/decks/compare/${completedComparisonId}/report/md`}
                        download
                        className="flex items-center justify-center space-x-2 bg-white border-2 border-purple-600 text-purple-600 px-4 py-3 rounded-lg font-medium hover:bg-purple-50 transition-all"
                      >
                        <FileText className="h-4 w-4" />
                        <span>Markdown</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>
          </div>
        )}

        {/* Previously Compared Decks Section */}
        {activeTab === 'comparison' && !comparingDecks && !showComparisonPreview && (
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-purple-600 rounded-lg p-2">
                  <BarChart className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Previously Compared Decks</h3>
                  <p className="text-sm text-slate-600">View past comparison results</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-slate-500">{previousComparisons.length} comparison{previousComparisons.length !== 1 ? 's' : ''}</span>
                
                {/* Refresh Button */}
                <button
                  onClick={handleRefreshComparisons}
                  disabled={refreshingComparisons}
                  className="flex items-center space-x-1 text-sm text-purple-600 hover:text-purple-700 px-3 py-1 rounded-lg hover:bg-purple-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`h-4 w-4 ${refreshingComparisons ? 'animate-spin' : ''}`} />
                  <span>{refreshingComparisons ? 'Refreshing...' : 'Refresh'}</span>
                </button>
                
                {/* Bulk Actions for Comparisons */}
                {previousComparisons.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={selectAllComparisons}
                      className="text-sm text-purple-600 hover:text-purple-700 px-3 py-1 rounded-lg hover:bg-purple-50 transition-colors"
                    >
                      {selectedComparisons.size === previousComparisons.length ? 'Deselect All' : 'Select All'}
                    </button>
                    
                    {selectedComparisons.size > 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('🖱️ Bulk delete button clicked for comparisons');
                          handleBulkDelete('comparison');
                        }}
                        className="flex items-center space-x-1 text-sm text-red-600 hover:text-red-700 px-3 py-1 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Delete ({selectedComparisons.size})</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {previousComparisons.length > 0 ? (
                previousComparisons.map((comparison) => (
                  <div 
                    key={comparison.id} 
                    className="bg-white rounded-lg border border-purple-200 p-4 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        {/* Selection checkbox */}
                        <input
                          type="checkbox"
                          checked={selectedComparisons.has(comparison.id)}
                          onChange={() => toggleComparisonSelection(comparison.id)}
                          className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                        />
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-semibold text-slate-900">
                              {comparison.deck1_filename} <span className="text-slate-400">vs</span> {comparison.deck2_filename}
                            </h4>
                          </div>
                          
                          {comparison.analyzed_at && (
                            <p className="text-xs text-slate-500 mt-1">
                              Compared: {new Date(comparison.analyzed_at).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        {/* Individual delete button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSingleDelete(comparison.id, 'comparison');
                          }}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete this comparison"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        
                        {/* Show Results button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShowComparisonResults(comparison.id);
                          }}
                          className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium"
                        >
                          <span>Show Results</span>
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <BarChart className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 mb-2">No deck comparisons found</p>
                  <p className="text-sm text-slate-400">Compare two decks to see the results here</p>
                </div>
              )}
            </div>
          </div>
        )}

        </div>
      </>
    );
  }

  return (
    <>
      {deleteModal}
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                setCurrentDeck(null);
                setAnalyzing(false);
                setError('');
                setAdditionalDocs([]);
              }}
              className="flex items-center space-x-2 text-slate-600 hover:text-blue-600 transition-colors"
              title="Back to upload / deck list"
            >
              <ChevronLeft className="h-5 w-5" />
              <span className="font-medium">Back</span>
            </button>
            <div className="h-6 w-px bg-slate-300"></div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Deck Intelligence</h1>
              <p className="text-slate-600 mt-1">
                {analyzing ? 'Analyzing your deck...' : `Analysis for: "${currentDeck.file_name}"`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-slate-200 -mx-6">
        <div className="flex px-6">
          <button
            onClick={() => setActiveTab('analysis')}
            className={`flex-1 px-6 py-4 font-medium transition-all relative ${
              activeTab === 'analysis'
                ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-600'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Pitch Deck & Memo Intelligence</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('comparison')}
            className={`flex-1 px-6 py-4 font-medium transition-all relative ${
              activeTab === 'comparison'
                ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-600'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <BarChart className="h-5 w-5" />
              <span>Compare Pitch Decks</span>
            </div>
          </button>
        </div>
      </div>

      {/* Analysis Results Section */}
      {activeTab === 'analysis' && (
      <>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-3xl font-bold text-blue-800">{ssoScore}/10</p>
              <p className="text-sm text-slate-600">SSO Readiness Score™</p>
            </div>
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
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                {/* PREMIUM REPORT - 25-30 Pages */}
                <a
                  href={`${API_URL}/decks/${currentDeck.id}/report/premium`}
                  download
                  className="flex items-center justify-between px-4 py-3 text-slate-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 first:rounded-t-lg border-b border-slate-100"
                >
                  <div className="flex flex-col">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-purple-600" />
                      <span className="font-bold">Premium Report</span>
                    </div>
                    <span className="text-xs text-slate-500 ml-6">25-30 pages comprehensive</span>
                  </div>
                  <span className="text-xs bg-gradient-to-r from-purple-600 to-pink-600 text-white px-2 py-0.5 rounded font-semibold">PREMIUM</span>
                </a>

                {/* Enhanced PDF Option */}
                <a
                  href={`${API_URL}/decks/${currentDeck.id}/report/pdf`}
                  download
                  className="flex items-center justify-between px-4 py-3 text-slate-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 border-b border-slate-100"
                >
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span className="font-semibold">Enhanced PDF</span>
                  </div>
                  <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded">WEB DATA</span>
                </a>
                
                {/* Standard Export Options */}
                <a
                  href={`${API_URL}/decks/${currentDeck.id}/report/txt`}
                  download
                  className="flex items-center space-x-2 px-4 py-2 text-slate-700 hover:bg-slate-50"
                >
                  <FileText className="h-4 w-4" />
                  <span>Download as TXT</span>
                </a>
                <a
                  href={`${API_URL}/decks/${currentDeck.id}/report/md`}
                  download
                  className="flex items-center space-x-2 px-4 py-2 text-slate-700 hover:bg-slate-50 last:rounded-b-lg"
                >
                  <FileText className="h-4 w-4" />
                  <span>Download as Markdown</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

        {/* Industry Benchmark Context Card - Separate Section */}
        {selectedStage && selectedIndustry && (
        <div className="bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="bg-indigo-600 rounded-lg p-3">
                <Target className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Industry Context & Benchmarks</h2>
                <p className="text-sm text-slate-600">Your deck was analyzed against {selectedStage} {selectedIndustry} standards</p>
              </div>
            </div>
          </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Funding Stage Context */}
          <div className="bg-white rounded-lg p-4 border border-indigo-200">
            <div className="flex items-center mb-2">
              <TrendingUp className="h-5 w-5 text-indigo-600 mr-2" />
              <h3 className="font-semibold text-slate-800">Funding Stage</h3>
            </div>
            <p className="text-2xl font-bold text-indigo-700 mb-1">{selectedStage}</p>
            <p className="text-xs text-slate-600 leading-relaxed">
              {selectedStage === 'Seed' && 'VCs expect: MVP, early traction, 10-50K MRR, 3-6 month runway'}
              {selectedStage === 'Series A' && 'VCs expect: Product-market fit, $1M+ ARR, proven unit economics, 12-18 month runway'}
              {selectedStage === 'Series B' && 'VCs expect: Scaling metrics, $10M+ ARR, clear path to profitability, strong retention'}
              {selectedStage === 'Series C' && 'VCs expect: Market leadership, $50M+ ARR, proven profitability or clear path, expansion ready'}
              {selectedStage === 'Pre-Seed' && 'VCs expect: Strong team, clear problem-solution fit, early prototypes or beta users'}
              {selectedStage === 'Series D+' && 'VCs expect: Market dominance, $100M+ ARR, international expansion, acquisition targets'}
            </p>
          </div>

          {/* Industry Vertical Context */}
          <div className="bg-white rounded-lg p-4 border border-indigo-200">
            <div className="flex items-center mb-2">
              <BarChart className="h-5 w-5 text-purple-600 mr-2" />
              <h3 className="font-semibold text-slate-800">Industry Vertical</h3>
            </div>
            <p className="text-2xl font-bold text-purple-700 mb-1">{selectedIndustry}</p>
            <p className="text-xs text-slate-600 leading-relaxed">
              {selectedIndustry === 'HealthTech' && 'Key metrics: Patient acquisition cost, clinical validation, FDA/regulatory timeline'}
              {selectedIndustry === 'FinTech' && 'Key metrics: Transaction volume, AUM, regulatory compliance, fraud prevention'}
              {selectedIndustry === 'CleanTech' && 'Key metrics: Carbon impact, sustainability ROI, environmental certifications, ESG scores'}
              {selectedIndustry === 'Artificial Intelligence' && 'Key metrics: Model accuracy, training costs, inference speed, data quality'}
              {selectedIndustry === 'SaaS B2B' && 'Key metrics: MRR/ARR, churn rate, CAC/LTV ratio, net revenue retention'}
              {selectedIndustry === 'EdTech' && 'Key metrics: User engagement, learning outcomes, retention rates, content quality'}
              {selectedIndustry === 'Food Tech' && 'Key metrics: Unit economics, supply chain efficiency, food safety, sustainability'}
              {selectedIndustry === 'E-commerce' && 'Key metrics: GMV, average order value, customer acquisition cost, repeat purchase rate'}
              {selectedIndustry === 'Mobility' && 'Key metrics: Rides/shipments per day, unit economics, network effects, regulatory compliance'}
              {selectedIndustry === 'PropTech' && 'Key metrics: Properties listed, transaction volume, commission rates, market penetration'}
              {selectedIndustry === 'Cybersecurity' && 'Key metrics: Threat detection rate, false positives, compliance certifications, enterprise contracts'}
              {selectedIndustry === 'Web3' && 'Key metrics: Active wallets, transaction volume, TVL (Total Value Locked), community growth'}
              {selectedIndustry === 'Other' && 'Key metrics: Revenue growth, customer acquisition, retention rates, unit economics'}
            </p>
          </div>

          {/* VC Expectations */}
          <div className="bg-white rounded-lg p-4 border border-indigo-200">
            <div className="flex items-center mb-2">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <h3 className="font-semibold text-slate-800">What VCs Want</h3>
            </div>
            <ul className="text-xs text-slate-700 space-y-2">
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>Clear market opportunity & TAM sizing</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>Strong founding team with domain expertise</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>Proven traction or early validation</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>Competitive moat & differentiation</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>Realistic financial projections</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-4 bg-white rounded-lg p-4 border border-indigo-200">
          <p className="text-xs text-slate-600">
            <strong className="text-indigo-700">💡 Pro Tip:</strong> Your analysis has been tailored specifically for <strong>{selectedStage} {selectedIndustry}</strong> companies. 
            The feedback below compares your deck against successful companies in your sector and stage, 
            helping you meet investor expectations for your specific vertical.
          </p>
        </div>
        </div>
      )}

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
            <p className="text-sm text-blue-100 mb-1">{modelInfo.name}</p>
            <p className="text-xs text-blue-200 mb-4 opacity-80">{modelInfo.description}</p>
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
            {analyzing ? (
              <div className="flex items-center space-x-3">
                <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">{analysisStage}</span>
                    <span className="text-sm font-bold text-blue-600">{confidence}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-teal-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${confidence}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-700">{overall?.recommendation || 'Analysis pending...'}</p>
            )}
          </div>
        </div>
      </div>

      <div className="text-center py-4 mt-6">
        <p className="text-xs text-slate-400">Analysis powered by Team SSO Intelligence Engine</p>
      </div>
      </>
      )}

      {/* Comparison Tab Content */}
      {activeTab === 'comparison' && (
        <div className="text-center py-12">
          <p className="text-slate-600">Please return to the main page to access the comparison tool.</p>
          <button
            onClick={() => {
              setCurrentDeck(null);
              setActiveTab('comparison');
            }}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Comparison Tool
          </button>
        </div>
      )}
      
      </div>
    </>
  );
}
