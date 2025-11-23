import { useState } from 'react';
import { Cpu, Check, ChevronDown, Zap, Brain, Sparkles, TestTube } from 'lucide-react';
import { useGeminiModel, GeminiModel } from '../context/GeminiModelContext';

export function CompetitiveInfo() {
  const [isOpen, setIsOpen] = useState(false);
  const { selectedModel, setSelectedModel, modelInfo } = useGeminiModel();

  const models: Array<{
    id: GeminiModel;
    name: string;
    description: string;
    icon: typeof Zap;
    color: string;
    badge?: string;
  }> = [
    {
      id: 'gemini-2.0-flash',
      name: 'Gemini 2.0 Flash',
      description: 'Workhorse model',
      icon: TestTube,
      color: 'text-orange-600',
      badge: 'Fast'
    },
    {
      id: 'gemini-2.5-flash',
      name: 'Gemini 2.5 Flash',
      description: 'Best price-performance',
      icon: Zap,
      color: 'text-blue-600',
      badge: 'Recommended'
    },
    {
      id: 'gemini-2.5-pro',
      name: 'Gemini 2.5 Pro',
      description: 'Advanced thinking model',
      icon: Brain,
      color: 'text-purple-600',
      badge: 'Advanced'
    },
    {
      id: 'gemini-3-pro',
      name: 'Gemini 3 Pro',
      description: 'Most intelligent model',
      icon: Sparkles,
      color: 'text-indigo-600',
      badge: 'Latest'
    }
  ];

  const currentModel = models.find(m => m.id === selectedModel);
  const CurrentIcon = currentModel?.icon || Cpu;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200"
      >
        <CurrentIcon className={`h-5 w-5 ${currentModel?.color}`} />
        <span className="text-sm font-medium">AI Model</span>
        <ChevronDown className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-slate-200 z-50">
          <div className="p-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-slate-900 mb-1">Select AI Model</h3>
              <p className="text-xs text-slate-500">Changes apply to all analysis operations</p>
            </div>
            
            <div className="space-y-2">
              {models.map((model) => {
                const Icon = model.icon;
                const isSelected = selectedModel === model.id;
                
                return (
                  <button
                    key={model.id}
                    onClick={() => {
                      setSelectedModel(model.id);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <Icon className={`h-5 w-5 mt-0.5 ${model.color}`} />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-slate-900 text-sm">
                              {model.name}
                            </span>
                            {model.badge && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                {model.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600">{model.description}</p>
                        </div>
                      </div>
                      {isSelected && (
                        <Check className="h-5 w-5 text-blue-600 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t">
              <div className="text-xs text-slate-500">
                <p className="font-medium mb-1">Current: {modelInfo.name}</p>
                <p>{modelInfo.description}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
