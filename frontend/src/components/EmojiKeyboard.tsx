import React from 'react';
import EmojiPicker, { EmojiClickData, EmojiStyle, Theme } from 'emoji-picker-react';
import { X } from 'lucide-react';

interface EmojiKeyboardProps {
  onEmojiClick: (emojiData: EmojiClickData, event: MouseEvent) => void;
  onClose: () => void;
}

export function EmojiKeyboard({ onEmojiClick, onClose }: EmojiKeyboardProps) {
  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="relative w-full max-w-3xl bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 p-2 rounded-full transition-colors"
        >
          <X size={20} />
        </button>
        <div className="p-6">
          <EmojiPicker
            onEmojiClick={onEmojiClick}
            theme={Theme.DARK}
            emojiStyle={EmojiStyle.APPLE}
            lazyLoadEmojis={true}
            width="100%"
            height={500}
            searchDisabled={false}
            skinTonesDisabled={false}
          />
        </div>
      </div>
    </div>
  );
}
