import { useState, useRef, useEffect, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/utils/cn';
import { dropdownVariants } from '@/utils/animations';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  className?: string;
  wrapperClassName?: string;
  id?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function Select({
  options,
  value,
  onChange,
  label,
  placeholder = 'Select an option...',
  error,
  helperText,
  disabled = false,
  className,
  wrapperClassName,
  id: providedId,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const generatedId = useId();
  const id = providedId ?? generatedId;

  const hasError = Boolean(error);
  const selectedOption = options.find((o) => o.value === value);

  // Close on outside click
  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false);
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  function handleSelect(option: SelectOption) {
    if (option.disabled) return;
    onChange(option.value);
    setIsOpen(false);
  }

  return (
    <div className={cn('flex flex-col gap-1.5', wrapperClassName)} ref={containerRef}>
      {label && (
        <label
          htmlFor={id}
          className={cn(
            'text-sm font-medium',
            hasError ? 'text-red-400' : 'text-gray-300',
            disabled && 'opacity-50',
          )}
        >
          {label}
        </label>
      )}

      <div className="relative">
        {/* Trigger button */}
        <button
          id={id}
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen((prev) => !prev)}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-invalid={hasError}
          className={cn(
            'w-full h-10 px-3 rounded-lg text-sm text-left',
            'flex items-center justify-between gap-2',
            'bg-white/[0.04] border border-white/[0.08]',
            'transition-all duration-150 ease-out',
            'focus:outline-none focus:border-blue-500/60 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]',
            'disabled:opacity-40 disabled:cursor-not-allowed',
            isOpen && 'border-blue-500/60 shadow-[0_0_0_3px_rgba(59,130,246,0.12)]',
            hasError && 'border-red-500/50',
            className,
          )}
        >
          <span className={cn(selectedOption ? 'text-gray-100' : 'text-gray-600')}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <motion.span
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.15 }}
            className="shrink-0 text-gray-500"
          >
            <ChevronDown size={16} />
          </motion.span>
        </button>

        {/* Dropdown panel */}
        <AnimatePresence>
          {isOpen && (
            <motion.ul
              role="listbox"
              aria-label={label}
              variants={dropdownVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className={cn(
                'absolute z-50 top-[calc(100%+6px)] left-0 right-0',
                'bg-gray-900 border border-white/[0.10] rounded-xl',
                'shadow-[0_16px_48px_rgba(0,0,0,0.6)]',
                'py-1 max-h-56 overflow-y-auto',
                'origin-top',
              )}
            >
              {options.length === 0 ? (
                <li className="px-3 py-2 text-sm text-gray-500">No options available</li>
              ) : (
                options.map((option) => {
                  const isSelected = option.value === value;
                  return (
                    <li
                      key={option.value}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelect(option)}
                      className={cn(
                        'flex items-center justify-between',
                        'mx-1 px-3 py-2 rounded-lg text-sm cursor-pointer',
                        'transition-colors duration-100',
                        option.disabled
                          ? 'text-gray-600 cursor-not-allowed'
                          : isSelected
                            ? 'text-white bg-blue-600/20'
                            : 'text-gray-200 hover:bg-white/[0.06] hover:text-white',
                      )}
                    >
                      <span>{option.label}</span>
                      {isSelected && (
                        <Check size={14} className="text-blue-400 shrink-0" />
                      )}
                    </li>
                  );
                })
              )}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>

      {hasError && <p className="text-xs text-red-400">{error}</p>}
      {!hasError && helperText && <p className="text-xs text-gray-500">{helperText}</p>}
    </div>
  );
}
