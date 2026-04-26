import React, { useState, useRef } from 'react';
import { X, Sparkles, Loader2 } from 'lucide-react';
import { deckService, DeckButton } from '../services/deck.service';

interface DeckGeneratorProps {
  onGenerate: (config: { name: string; contextApp?: string; rows: number; cols: number; buttons: DeckButton[] }) => void;
  onCancel: () => void;
}

export const DeckGenerator: React.FC<DeckGeneratorProps> = ({ onGenerate, onCancel }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const promptInputRef = useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    promptInputRef.current?.focus();
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const deckConfig = await deckService.generateDeck(prompt);
      onGenerate(deckConfig);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate deck. Please try again.');
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleGenerate();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl w-full max-w-md p-6 relative">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-2 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
            <Sparkles className="text-white" size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Generate Deck with AI</h2>
            <p className="text-xs text-gray-400 mt-1">Describe the deck you want to create</p>
          </div>
        </div>

        <textarea
          ref={promptInputRef}
          value={prompt}
          onChange={(e) => {
            setPrompt(e.target.value);
            setError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Example: Create a Spotify control deck for macOS with play, pause, next, previous, and volume controls"
          className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none h-32"
        />

        {error && (
          <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button
            onClick={onCancel}
            disabled={isGenerating}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-700 text-gray-300 hover:text-gray-200 hover:border-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-95"
          >
            {isGenerating ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Generate Deck</span>
              </>
            )}
          </button>
        </div>

        <div className="mt-4 p-3 bg-gray-800/30 rounded-lg border border-gray-700/50">
          <p className="text-xs text-gray-400">
            💡 <strong>Tip:</strong> Include the target application name (e.g., "for Spotify"), your OS (e.g., "macOS"), and the buttons you want.
          </p>
        </div>
      </div>
    </div>
  );
};
