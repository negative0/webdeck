import React from 'react';
import * as LucideIcons from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useButtonState } from '../hooks/useButtonState';

interface DeckButtonProps {
  label: string;
  icon?: string;
  activeIcon?: string;
  activeLabel?: string;
  checkCommand?: string;
  color?: string;
  onClick?: () => void;
  className?: string;
}

export const DeckButton: React.FC<DeckButtonProps> = ({
  label,
  icon,
  activeIcon,
  activeLabel,
  checkCommand,
  color,
  onClick,
  className,
}) => {
  const isActive = useButtonState({ checkCommand });
  const currentIcon = isActive ? activeIcon || icon : icon;
  const currentLabel = isActive ? activeLabel || label : label;
  
  const IconComponent = currentIcon && (LucideIcons as any)[currentIcon];

  return (
    <button
      onClick={onClick}
      className={twMerge(
        clsx(
          'flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 active:scale-95 group',
          'bg-gray-800 border-gray-700 hover:border-blue-500 hover:bg-gray-750',
          'shadow-lg shadow-black/20',
          className
        )
      )}
      style={{ borderColor: color ? `${color}44` : undefined }}
    >
      <div
        className="p-3 rounded-lg bg-gray-900 group-hover:bg-gray-800 transition-colors"
        style={{ color: color || '#3b82f6' }}
      >
        {IconComponent ? (
          <IconComponent size={32} />
        ) : (
          <LucideIcons.Command size={32} />
        )}
      </div>
      <span className="text-xs font-medium text-gray-300 group-hover:text-white truncate w-full text-center">
        {currentLabel}
      </span>
    </button>
  );
};
