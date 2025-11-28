import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Globe, AlertCircle, Loader2, FileText, ChevronDown } from 'lucide-react';
import { api } from '../services/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  source?: 'deck_analysis' | 'web_search' | 'both';
  sourceDetails?: {
    deckName?: string;
    sections?: string[];
    webSources?: string[];
  };
  confidence?: number;
  timestamp: Date;
  isError?: boolean;
}

interface Deck {
  id: string;
  filename?: string;
  file_name?: string;
  company_name?: string;
  analyzed_at?: string;
  sso_score?: number;
}

export default function VCChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your AI assistant for analyzing pitch decks. Select a pitch deck from the dropdown above, then ask me any questions about it. I\'ll search the deck first, and if needed, supplement with web data.',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string>('');
  const [loadingDecks, setLoadingDecks] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadCompletedDecks();
  }, []);

  const loadCompletedDecks = async () => {
    setLoadingDecks(true);
    try {
      const response = await api.getDecks(undefined, 'completed');
      setDecks(response);
      console.log('✅ Loaded completed decks:', response.length);
    } catch (error) {
      console.error('Failed to load decks:', error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Failed to load pitch decks. Please refresh the page.',
        timestamp: new Date(),
        isError: true
      }]);
    } finally {
      setLoadingDecks(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    if (!selectedDeckId) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Please select a pitch deck from the dropdown above before asking questions.',
        timestamp: new Date(),
        isError: true
      }]);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await api.chatQueryWithDeck(selectedDeckId, input);

      if (!response.success) {
        throw new Error(response.error || 'Failed to get answer');
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.answer,
        source: response.source,
        sourceDetails: {
          deckName: response.deckName,
          sections: response.sectionsUsed || [],
          webSources: response.webSources || []
        },
        confidence: response.confidence,
        timestamp: new Date(),
        isError: false
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: error.message || 'An error occurred while processing your query.',
        timestamp: new Date(),
        isError: true
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const getSourceIcon = (source?: 'deck_analysis' | 'web_search' | 'both') => {
    if (source === 'deck_analysis') return <FileText className="w-4 h-4" />;
    if (source === 'web_search') return <Globe className="w-4 h-4" />;
    if (source === 'both') return <><FileText className="w-4 h-4" /><Globe className="w-4 h-4 ml-1" /></>;
    return null;
  };

  const getSourceLabel = (source?: 'deck_analysis' | 'web_search' | 'both') => {
    if (source === 'deck_analysis') return 'From Pitch Deck Analysis';
    if (source === 'web_search') return 'From Web Search';
    if (source === 'both') return 'From Pitch Deck + Web';
    return '';
  };

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'text-gray-400';
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const exampleQuestions = [
    "What's the company's ARR or revenue?",
    "Tell me about the founding team",
    "What's the market size and opportunity?",
    "What problem does the company solve?",
    "What are the key metrics and traction?",
    "Who are the main competitors?"
  ];

  const handleExampleClick = (question: string) => {
    setInput(question);
  };

  const selectedDeck = decks.find(d => d.id === selectedDeckId);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">VC Chat Assistant</h1>
        <p className="text-gray-600">
          Select a pitch deck and ask questions about it. I'll analyze the deck data and supplement with web search if needed.
        </p>
      </div>

      {/* Deck Selector */}
      <div className="mb-6 bg-white rounded-lg shadow-md border border-gray-200 p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Pitch Deck to Analyze
        </label>
        {loadingDecks ? (
          <div className="flex items-center space-x-2 text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading pitch decks...</span>
          </div>
        ) : (
          <div className="relative">
            <select
              value={selectedDeckId}
              onChange={(e) => setSelectedDeckId(e.target.value)}
              className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none"
            >
              <option value="">-- Select a pitch deck --</option>
              {decks.map((deck) => (
                <option key={deck.id} value={deck.id}>
                  {deck.filename || deck.file_name || 'Unknown'} 
                  {deck.company_name && ` (${deck.company_name})`}
                  {deck.sso_score && ` - Score: ${(deck.sso_score * 100).toFixed(0)}/100`}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
        )}
        {selectedDeck && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2 text-sm">
              <FileText className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-blue-900">
                Selected: {selectedDeck.filename || selectedDeck.file_name || 'Unknown'}
              </span>
            </div>
            {selectedDeck.analyzed_at && (
              <p className="text-xs text-blue-700 mt-1">
                Analyzed: {new Date(selectedDeck.analyzed_at).toLocaleDateString()}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Example Questions */}
      {messages.length === 1 && selectedDeckId && (
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 mb-3">Try asking:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {exampleQuestions.map((question, idx) => (
              <button
                key={idx}
                onClick={() => handleExampleClick(question)}
                className="text-left p-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm transition-colors"
              >
                "{question}"
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 mb-4" style={{ height: '500px' }}>
        <div className="h-full flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-3 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Avatar */}
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.role === 'user' ? 'bg-blue-600' : message.isError ? 'bg-red-100' : 'bg-green-100'
                  }`}>
                    {message.role === 'user' ? (
                      <User className="w-5 h-5 text-white" />
                    ) : message.isError ? (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    ) : (
                      <Bot className="w-5 h-5 text-green-600" />
                    )}
                  </div>

                  {/* Message Content */}
                  <div className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`rounded-lg p-3 ${
                      message.role === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : message.isError
                        ? 'bg-red-50 text-red-900 border border-red-200'
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>

                    {/* Source Info */}
                    {message.source && !message.isError && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                        {getSourceIcon(message.source)}
                        <span>{getSourceLabel(message.source)}</span>
                        {message.confidence && (
                          <span className={`ml-2 font-medium ${getConfidenceColor(message.confidence)}`}>
                            {(message.confidence * 100).toFixed(0)}% confident
                          </span>
                        )}
                      </div>
                    )}

                    {message.sourceDetails && (
                      <div className="mt-2 text-xs space-y-1">
                        {message.sourceDetails.deckName && (
                          <div className="text-gray-600">
                            <span className="font-medium">Deck:</span> {message.sourceDetails.deckName}
                          </div>
                        )}
                        {message.sourceDetails.sections && message.sourceDetails.sections.length > 0 && (
                          <div className="text-gray-600">
                            <span className="font-medium">Sections used:</span> {message.sourceDetails.sections.join(', ')}
                          </div>
                        )}
                        {message.sourceDetails.webSources && message.sourceDetails.webSources.length > 0 && (
                          <div className="text-gray-600">
                            <span className="font-medium">Web sources:</span> {message.sourceDetails.webSources.length} result(s)
                          </div>
                        )}
                      </div>
                    )}

                    <span className="mt-1 text-xs text-gray-400">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex gap-3 max-w-[80%]">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="rounded-lg p-3 bg-gray-100">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <div className="border-t border-gray-200 p-4">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question about any company..."
                disabled={isLoading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">How it works:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-800">
              <li>Select a completed pitch deck from the dropdown above</li>
              <li>Ask questions about the company, metrics, team, market, etc.</li>
              <li>I'll search the pitch deck analysis first for accurate data</li>
              <li>If needed, I'll supplement with web search for additional context</li>
              <li>Each answer shows exactly where the information came from</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
