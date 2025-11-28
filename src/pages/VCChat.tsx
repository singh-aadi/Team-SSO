import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Database, Globe, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../services/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  source?: 'database' | 'web';
  sourceDetails?: string;
  confidence?: number;
  timestamp: Date;
  isError?: boolean;
}

export default function VCChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your AI assistant for querying pitch deck data. Ask me anything about companies in our database, like "What\'s the ARR of We360.ai?" or "Tell me about the team size of Company X".',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

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
      const response = await api.chatQuery(input);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.answer || 'I couldn\'t find an answer to your question.',
        source: response.source,
        sourceDetails: response.sourceDetails,
        confidence: response.confidence,
        timestamp: new Date(),
        isError: !response.success
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

  const getSourceIcon = (source?: 'database' | 'web') => {
    if (source === 'database') return <Database className="w-4 h-4" />;
    if (source === 'web') return <Globe className="w-4 h-4" />;
    return null;
  };

  const getSourceLabel = (source?: 'database' | 'web') => {
    if (source === 'database') return 'From Pitch Deck Database';
    if (source === 'web') return 'From Web Search';
    return '';
  };

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'text-gray-400';
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const exampleQuestions = [
    "What's the ARR of We360.ai?",
    "Tell me about the founding team",
    "What's the market size?",
    "What problem does the company solve?"
  ];

  const handleExampleClick = (question: string) => {
    setInput(question);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">VC Chat Assistant</h1>
        <p className="text-gray-600">
          Ask questions about companies in natural language. I'll search our pitch deck database first, then the web if needed.
        </p>
      </div>

      {/* Example Questions */}
      {messages.length === 1 && (
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
                      <div className="mt-1 text-xs text-gray-500 max-w-full overflow-hidden text-ellipsis">
                        {message.sourceDetails}
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
              <li>First, I'll search our pitch deck database for the answer</li>
              <li>If not found, I'll search the web using Google's advanced search</li>
              <li>I'll always tell you where the information came from</li>
              <li>You can ask in natural language - just like talking to a person!</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
