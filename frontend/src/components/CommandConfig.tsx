import React, { useState } from 'react';
import { deckService, DeckButton as IDeckButton } from '../services/deck.service';
import * as LucideIcons from 'lucide-react';
import { X, Save, Trash2, Plus, Sparkles, Loader2 } from 'lucide-react';

interface CommandConfigProps {
  button?: IDeckButton;
  onSave: (button: IDeckButton) => void;
  onDelete?: (id: string) => void;
  onCancel: () => void;
  availablePositions: { row: number; col: number }[];
  autoFocusAI?: boolean;
}

const ICON_LIST = Object.keys(LucideIcons).filter(
  (key) => typeof (LucideIcons as any)[key] === 'function' && key !== 'createLucideIcon'
).slice(0, 50); // Limit icons for performance and simplicity

export const CommandConfig: React.FC<CommandConfigProps> = ({
  button,
  onSave,
  onDelete,
  onCancel,
  availablePositions,
  autoFocusAI,
}) => {
  const [formData, setFormData] = useState<IDeckButton>(
    button || {
      id: crypto.randomUUID(),
      label: '',
      command: '',
      type: 'COMMAND',
      icon: 'Command',
      color: '#3b82f6',
      row: availablePositions[0]?.row ?? 0,
      col: availablePositions[0]?.col ?? 0,
    }
  );
  const [aiPrompt, setAiPrompt] = useState('');
  const [isSuggesting, setIsSuggesting] = useState(false);
  const aiInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (autoFocusAI && aiInputRef.current) {
      aiInputRef.current.focus();
    }
  }, [autoFocusAI]);

  const handleSuggest = async () => {
    if (!aiPrompt.trim()) return;
    setIsSuggesting(true);
    try {
      const suggestion = await deckService.suggestCommand(aiPrompt);
      setFormData({
        ...formData,
        label: suggestion.label || formData.label,
        command: suggestion.command || formData.command,
        type: (suggestion.type as any) || formData.type,
        icon: suggestion.icon || formData.icon,
        color: suggestion.color || formData.color,
      });
      setAiPrompt('');
    } catch (error) {
      console.error('Failed to get suggestion:', error);
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-gray-800 flex items-center justify-between bg-gray-900/50">
          <h2 className="text-xl font-bold text-white">
            {button ? 'Edit Button' : 'New Button'}
          </h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* AI Suggestion Section */}
          <div className="bg-blue-600/10 border border-blue-500/20 rounded-2xl p-4 space-y-3">
            <label className="block text-xs font-bold text-blue-400 uppercase tracking-widest">AI Command Generator</label>
            <div className="flex gap-2">
              <input
                ref={aiInputRef}
                type="text"
                className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="e.g. Open my browser to Google"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
              />
              <button
                type="button"
                onClick={handleSuggest}
                disabled={isSuggesting || !aiPrompt.trim()}
                className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white p-2 rounded-xl transition-all"
              >
                {isSuggesting ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
              </button>
            </div>
          </div>

          <div className="flex gap-2 p-1 bg-gray-800 rounded-xl border border-gray-700">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'COMMAND' })}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all ${
                formData.type === 'COMMAND'
                  ? 'bg-gray-700 text-white shadow-lg'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Command
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'SHORTCUT' })}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all ${
                formData.type === 'SHORTCUT'
                  ? 'bg-gray-700 text-white shadow-lg'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Shortcut
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Label</label>
            <input
              type="text"
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              placeholder="e.g. Open Browser"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              {formData.type === 'COMMAND' ? 'Shell Command' : 'Shortcut (e.g. F5, ctrl+c)'}
            </label>
            <textarea
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono text-sm"
              rows={formData.type === 'COMMAND' ? 3 : 1}
              value={formData.command}
              onChange={(e) => setFormData({ ...formData, command: e.target.value })}
              placeholder={formData.type === 'COMMAND' ? 'e.g. google-chrome' : 'e.g. F5'}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Row</label>
              <select
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white focus:outline-none"
                value={formData.row}
                onChange={(e) => setFormData({ ...formData, row: parseInt(e.target.value) })}
              >
                {[0, 1, 2].map((r) => (
                  <option key={r} value={r}>
                    Row {r + 1}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Column</label>
              <select
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white focus:outline-none"
                value={formData.col}
                onChange={(e) => setFormData({ ...formData, col: parseInt(e.target.value) })}
              >
                {[0, 1, 2, 3, 4].map((c) => (
                  <option key={c} value={c}>
                    Col {c + 1}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Color</label>
            <div className="flex gap-2 flex-wrap">
              {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: c })}
                  className={`w-8 h-8 rounded-full border-2 transition-transform active:scale-90 ${
                    formData.color === c ? 'border-white scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <input
                type="color"
                className="w-8 h-8 bg-transparent border-none p-0 cursor-pointer"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Icon</label>
            <div className="grid grid-cols-5 gap-2 h-32 overflow-y-auto p-2 bg-gray-800 rounded-xl border border-gray-700">
              {ICON_LIST.map((iconName) => {
                const Icon = (LucideIcons as any)[iconName];
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setFormData({ ...formData, icon: iconName })}
                    className={`p-2 rounded-lg flex items-center justify-center transition-colors ${
                      formData.icon === iconName ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    <Icon size={20} />
                  </button>
                );
              })}
            </div>
          </div>
        </form>

        <div className="p-6 border-t border-gray-800 bg-gray-900/50 flex gap-3">
          <button
            onClick={handleSubmit}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20"
          >
            <Save size={20} />
            Save
          </button>
          {button && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(button.id)}
              className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white font-bold p-3 rounded-xl transition-all border border-red-500/20"
            >
              <Trash2 size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
