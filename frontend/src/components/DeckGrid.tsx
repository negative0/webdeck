import React, { useState, useEffect } from 'react';
import { Maximize2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { DeckButton } from './DeckButton';
import { DeckButton as IDeckButton } from '../services/deck.service';

interface DeckGridProps {
  buttons: IDeckButton[];
  onExecute: (button: IDeckButton) => void;
  onAdd?: (row: number, col: number) => void;
  onMove?: (source: { row: number; col: number }, target: { row: number; col: number }) => void;
  onNextDeck?: () => void;
  onPrevDeck?: () => void;
  rows?: number;
  cols?: number;
}

export const DeckGrid: React.FC<DeckGridProps> = ({
  buttons,
  onExecute,
  onAdd,
  onMove,
  rows = 3,
  cols = 5,
}) => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [dragOverCell, setDragOverCell] = useState<{ row: number; col: number } | null>(null);
  const wakeLockRef = useRef<any>(null);

  useEffect(() => {
    const handleFullScreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullScreen(false);
        // Release wake lock
        if (wakeLockRef.current) {
          wakeLockRef.current.release().catch(() => {});
          wakeLockRef.current = null;
        }
        // Unlock orientation
        if (screen.orientation && 'unlock' in screen.orientation) {
          (screen.orientation as any).unlock();
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
      // Cleanup wake lock on unmount
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
      }
    };
  }, []);

  const handleEnterFullScreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
      setIsFullScreen(true);
      
      // Request wake lock
      if ('wakeLock' in navigator) {
        try {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        } catch (err) {
          console.error('Wake Lock error:', err);
        }
      }

      // Lock orientation to landscape
      if (screen.orientation && 'lock' in screen.orientation) {
        try {
          await (screen.orientation as any).lock('landscape');
        } catch (err) {
          console.error('Orientation Lock error:', err);
        }
      }
    } catch (e) {
      console.log(e);
    }
  };

  const handleExitFullScreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
      setIsFullScreen(false);
      
      // Release wake lock
      if (wakeLockRef.current) {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
      
      // Unlock orientation
      if (screen.orientation && 'unlock' in screen.orientation) {
        (screen.orientation as any).unlock();
      }
    } catch (e) {
      console.log(e);
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
          row.map((button, cIdx) => {
            const isDragOver = dragOverCell?.row === rIdx && dragOverCell?.col === cIdx;
            
            return (
              <div 
                key={`${rIdx}-${cIdx}`} 
                className={`aspect-square relative transition-all duration-200 ${
                  isDragOver ? 'scale-105 z-10' : ''
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                }}
                onDragEnter={(e) => {
                  e.preventDefault();
                  if (onMove) setDragOverCell({ row: rIdx, col: cIdx });
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  // Check if we're actually leaving the cell logic if needed, 
                  // but simplest is to let the next onDragEnter handle the switch
                  // or clear it if we leave the grid entirely (handled by container if needed)
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverCell(null);
                  if (!onMove) return;
                  
                  try {
                    const data = e.dataTransfer.getData('application/json');
                    if (data) {
                      const source = JSON.parse(data);
                      if (source.row !== rIdx || source.col !== cIdx) {
                        onMove(source, { row: rIdx, col: cIdx });
                      }
                    }
                  } catch (err) {
                    console.error('Drop error:', err);
                  }
                }}
              >
                {button ? (
                  <div
                    draggable={!!onMove}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('application/json', JSON.stringify({ row: rIdx, col: cIdx }));
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragEnd={() => {
                      setDragOverCell(null);
                    }}
                    className={`w-full h-full ${onMove ? 'cursor-grab active:cursor-grabbing' : ''}`}
                  >
                    <DeckButton
                      label={button.label}
                      icon={button.icon}
                      activeIcon={button.activeIcon}
                      activeLabel={button.activeLabel}
                      checkCommand={button.checkCommand}
                      color={button.color}
                      onClick={() => onExecute(button)}
                      className={`w-full h-full ${isDragOver ? 'ring-2 ring-blue-500 rounded-xl' : ''} ${onMove ? 'cursor-grab active:cursor-grabbing' : ''}`}
                    />
                  </div>
                ) : (
                  <button 
                    disabled={!onAdd}
                    onClick={() => onAdd?.(rIdx, cIdx)}
                    className={`w-full h-full rounded-xl border-2 border-dashed flex items-center justify-center transition-all group ${
                      isDragOver 
                        ? 'border-blue-500 bg-blue-500/10 text-blue-500' 
                        : (onAdd ? 'border-gray-800 text-gray-700 hover:border-blue-500/50 hover:bg-blue-500/5 cursor-pointer' : 'border-gray-800/30 text-transparent cursor-default')
                    }`}
                  >
                    <span className={`text-[10px] uppercase tracking-widest font-bold ${onAdd ? 'group-hover:text-blue-500' : ''}`}>
                      {isDragOver ? 'Drop Here' : (onAdd ? 'Empty' : '')}
                    </span>
                  </button>
                )}
              </div>
            );
          })
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
          
          {onPrevDeck && (
             <button 
                onClick={(e) => { e.stopPropagation(); onPrevDeck(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-4 bg-gray-800/50 hover:bg-gray-700/80 rounded-full text-white z-50 transition-all backdrop-blur-sm border border-gray-700/50"
             >
                <ChevronLeft size={32} />
             </button>
          )}
          
          {onNextDeck && (
             <button 
                onClick={(e) => { e.stopPropagation(); onNextDeck(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-4 bg-gray-800/50 hover:bg-gray-700/80 rounded-full text-white z-50 transition-all backdrop-blur-sm border border-gray-700/50"
             >
                <ChevronRight size={32} />
             </button>
          )}

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
                      activeIcon={button.activeIcon}
                      activeLabel={button.activeLabel}
                      checkCommand={button.checkCommand}
                      color={button.color}
                      onClick={() => onExecute(button)}
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
