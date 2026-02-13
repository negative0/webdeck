import React from 'react';
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
  // Create a grid representation
  const grid = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => {
      return buttons.find((b) => b.row === r && b.col === c);
    })
  );

  return (
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
  );
};
