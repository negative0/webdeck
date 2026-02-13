import React, { useState, useEffect } from 'react';
import { Maximize2, X } from 'lucide-react';
import { DeckButton } from './DeckButton';
import { DeckButton as IDeckButton } from '../services/deck.service';

interface DeckGridProps {
  buttons: IDeckButton[];
  onExecute: (command: string, type: 'COMMAND' | 'SHORTCUT') => void;
  onAdd?: (row: number, col: number) => void;
  rows?: number;
  cols?: number;
}

export const DeckGrid: React.FC<DeckGridProps> = ({
  buttons,
  onExecute,
  onAdd,
  rows = 3,
  cols = 5,
}) => {
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    const handleFullScreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullScreen(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, []);

  const handleEnterFullScreen = () => {
    setIsFullScreen(true);
    document.documentElement.requestFullscreen().catch((e) => console.log(e));
  };

  const handleExitFullScreen = () => {
    setIsFullScreen(false);
    if (document.fullscreenElement) {
      document.exitFullscreen().catch((e) => console.log(e));
    }
  };

  // Create a grid representation
  const grid = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => {
      return buttons.find((b) => b.row === r && b.col === c);
    })
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end px-2">
        <button
          onClick={handleEnterFullScreen}
          className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/50 hover:bg-gray-800 rounded-full text-xs font-medium text-gray-400 hover:text-white transition-all border border-gray-700/50 hover:border-gray-600"
        >
          <Maximize2 size={14} />
          <span>Full Screen</span>
        </button>
      </div>

      <div 
        className="grid gap-4 p-6 bg-gray-900 rounded-3xl border border-gray-800 shadow-2xl"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
        }}
      >
        {grid.flatMap((row, rIdx) =>
          row.map((button, cIdx) => (
            <div key={`${rIdx}-${cIdx}`} className="aspect-square">
              {button ? (
                <DeckButton
                  label={button.label}
                  icon={button.icon}
                  color={button.color}
                  onClick={() => onExecute(button.command, button.type)}
                  className="w-full h-full"
                />
              ) : (
                <button 
                  onClick={() => onAdd?.(rIdx, cIdx)}
                  className="w-full h-full rounded-xl border-2 border-dashed border-gray-800 flex items-center justify-center text-gray-700 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group"
                >
                  <span className="text-[10px] uppercase tracking-widest font-bold group-hover:text-blue-500">Empty</span>
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {isFullScreen && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center p-4 overflow-hidden">
          <button 
            onClick={handleExitFullScreen}
            className="absolute top-4 right-4 p-3 bg-gray-800/50 backdrop-blur-sm rounded-full text-white z-10 hover:bg-gray-700 transition-all"
          >
            <X size={24} />
          </button>
          <div 
            className="grid gap-2"
            style={{
              gridTemplateColumns: `repeat(${cols}, 1fr)`,
              gridTemplateRows: `repeat(${rows}, 1fr)`,
              aspectRatio: `${cols}/${rows}`,
              width: '100%',
              height: '100%',
              maxHeight: '100vh',
              maxWidth: '100vw',
              margin: 'auto'
            }}
          >
            {grid.flatMap((row, rIdx) =>
              row.map((button, cIdx) => (
                <div key={`fs-${rIdx}-${cIdx}`} className="relative w-full h-full">
                  {button ? (
                    <DeckButton
                      label={button.label}
                      icon={button.icon}
                      color={button.color}
                      onClick={() => onExecute(button.command, button.type)}
                      className="w-full h-full text-lg shadow-none"
                    />
                  ) : (
                    <div className="w-full h-full" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
