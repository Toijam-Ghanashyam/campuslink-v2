import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';

export function TagInput({
  tags = [],
  onChange,
  placeholder = 'Add a skill (press Enter)...',
  disabled = false,
  className,
}) {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const trimmed = inputValue.trim().replace(/^,+|,+$/g, '');
      if (trimmed && !tags.includes(trimmed)) {
        onChange([...tags, trimmed]);
        setInputValue('');
      }
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  const removeTag = (indexToRemove) => {
    onChange(tags.filter((_, idx) => idx !== indexToRemove));
  };

  return (
    <div
      className={cn(
        'min-h-[46px] p-2 bg-paper rounded-xl border border-line flex flex-wrap items-center gap-2 focus-within:ring-2 focus-within:ring-ochre focus-within:border-transparent transition-all',
        disabled && 'opacity-60 pointer-events-none bg-bone/30',
        className
      )}
    >
      <AnimatePresence mode="popLayout">
        {tags.map((tag, idx) => (
          <motion.span
            key={tag}
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-bone text-ink text-xs font-medium border border-line select-none"
          >
            <span>{tag}</span>
            {!disabled && (
              <button
                type="button"
                onClick={() => removeTag(idx)}
                className="w-3.5 h-3.5 rounded-full hover:bg-ink-soft/20 inline-flex items-center justify-center text-ink-soft hover:text-ink transition-colors"
              >
                <X className="w-2.5 h-2.5 stroke-[2.5]" />
              </button>
            )}
          </motion.span>
        ))}
      </AnimatePresence>

      {!disabled && (
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? placeholder : '+ Add...'}
          className="flex-1 min-w-[120px] bg-transparent text-sm text-ink placeholder:text-ink-soft/60 focus:outline-none px-1 py-1"
        />
      )}
    </div>
  );
}

