import React, { useState } from 'react';
import { Modal } from './Modal';
import { MAC_OS_PRESETS } from '../constants/macOsCommands';
import * as LucideIcons from 'lucide-react';
import { Search, Monitor, Music, AppWindow } from 'lucide-react';

interface PresetSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (preset: any) => void;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  System: <Monitor size={20} />,
  Media: <Music size={20} />,
  Apps: <AppWindow size={20} />,
};

export const PresetSelector: React.FC<PresetSelectorProps> = ({
  isOpen,
  onClose,
  onSelect,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | 'All'>('All');

  const filteredPresets = MAC_OS_PRESETS.flatMap(category => 
    category.items.map(item => ({ ...item, category: category.category }))
  ).filter(item => {
    const matchesSearch = item.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.command.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['All', ...MAC_OS_PRESETS.map(c => c.category)];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Select Preset Command"
      size="lg"
      className="max-h-[85vh] flex flex-col"
    >
      <div className="space-y-6">
        {/* Search Bar */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl 
                     text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 
                     transition-all duration-200 backdrop-blur-sm"
            placeholder="Search commands (e.g., 'volume', 'spotify')..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 flex items-center gap-2
                ${activeCategory === cat 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20 scale-105' 
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'}`}
            >
              {CATEGORY_ICONS[cat]}
              {cat}
            </button>
          ))}
        </div>

        {/* Grid of Presets */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredPresets.map((preset, idx) => {
            const IconComponent = (LucideIcons as any)[preset.icon] || LucideIcons.Command;
            
            return (
              <button
                key={`${preset.category}-${idx}`}
                onClick={() => {
                  onSelect(preset);
                  onClose();
                }}
                className="group relative flex flex-col items-center justify-center p-6 bg-gray-800/30 border border-gray-700/30 rounded-2xl 
                         hover:bg-gray-800 hover:border-blue-500/30 hover:shadow-xl hover:shadow-blue-900/10 
                         transition-all duration-300 text-center gap-3 overflow-hidden"
              >
                {/* Hover Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="p-3 bg-gray-800 rounded-xl text-gray-400 group-hover:text-blue-400 group-hover:scale-110 group-hover:bg-gray-700 transition-all duration-300 shadow-sm">
                  <IconComponent size={28} strokeWidth={1.5} />
                </div>
                
                <div className="relative z-10">
                  <h3 className="font-medium text-gray-200 group-hover:text-white transition-colors">
                    {preset.label}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 truncate max-w-[120px] mx-auto group-hover:text-gray-400">
                    {preset.category}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
        
        {filteredPresets.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Search className="mx-auto h-12 w-12 opacity-20 mb-4" />
            <p>No commands found matching "{searchTerm}"</p>
          </div>
        )}
      </div>
    </Modal>
  );
};
