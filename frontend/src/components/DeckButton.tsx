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
  const { isActive, setIsActive, revalidate } = useButtonState({ checkCommand });
  const currentLabel = isActive ? activeLabel || label : label;

  const handleClick = async () => {
    if (checkCommand) {
      setIsActive(!isActive);
    }
    
    onClick?.();

    // Check state immediately after action (with slight delay for command execution)
    if (checkCommand) {
      setTimeout(() => {
        revalidate();
      }, 500);
      // Double check after a longer delay in case of slow commands
      setTimeout(() => {
        revalidate();
      }, 1500);
    }
  };

  const DefaultIcon = (icon && (LucideIcons as any)[icon]) || LucideIcons.Command;
  const ActiveIcon = (activeIcon && (LucideIcons as any)[activeIcon]) || DefaultIcon;
  const hasActiveState = !!activeIcon && activeIcon !== icon;

  return (
    <button
      onClick={handleClick}
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
        className="p-3 rounded-lg bg-gray-900 group-hover:bg-gray-800 transition-colors relative overflow-hidden"
        style={{ color: color || '#3b82f6' }}
      >
        {hasActiveState ? (
          <div className="grid place-items-center w-8 h-8 relative">
            <div
              className={clsx(
                'absolute inset-0 transition-all duration-300 ease-in-out transform flex items-center justify-center',
                isActive
                  ? 'opacity-0 scale-75 rotate-12'
                  : 'opacity-100 scale-100 rotate-0'
              )}
            >
              <DefaultIcon size={32} />
            </div>
            <div
              className={clsx(
                'absolute inset-0 transition-all duration-300 ease-in-out transform flex items-center justify-center',
                isActive
                  ? 'opacity-100 scale-100 rotate-0'
                  : 'opacity-0 scale-75 -rotate-12'
              )}
            >
              <ActiveIcon size={32} />
            </div>
          </div>
        ) : (
          <DefaultIcon size={32} />
        )}
      </div>
      <span className="text-xs font-medium text-gray-300 group-hover:text-white truncate w-full text-center">
        {currentLabel}
      </span>
    </button>
  );
};
