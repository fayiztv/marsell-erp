import { useState, useRef, useEffect, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, X, Search } from 'lucide-react';
import { cn } from '@/utils/cn';
import { dropdownVariants } from '@/utils/animations';
import { Avatar } from '@/components/ui/Avatar';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface MultiSelectOption {
  value: string;
  label: string;
  subLabel?: string | undefined;
  chipLabel?: string | undefined;
  avatar?: {
    name: string;
    src?: string | undefined;
  } | undefined;
  badge?: {
    text: string;
    variant?: BadgeVariant | undefined;
  } | undefined;
  icon?: React.ReactNode | undefined;
  isSpecial?: boolean | undefined;
  disabled?: boolean | undefined;
}

export interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  label?: string | undefined;
  placeholder?: string | undefined;
  searchPlaceholder?: string | undefined;
  emptySearchMessage?: string | undefined;
  emptyOptionsMessage?: string | undefined;
  error?: string | undefined;
  helperText?: string | undefined;
  disabled?: boolean | undefined;
  required?: boolean | undefined;
  leftIcon?: React.ReactNode | undefined;
  className?: string | undefined;
  wrapperClassName?: string | undefined;
  chipVariant?: 'blue' | 'purple' | 'emerald' | 'default' | undefined;
  id?: string | undefined;
}

const chipStyles: Record<'blue' | 'purple' | 'emerald' | 'default', string> = {
  blue: 'bg-blue-500/15 border-blue-500/25 text-blue-200',
  purple: 'bg-purple-500/15 border-purple-500/25 text-purple-200',
  emerald: 'bg-emerald-500/15 border-emerald-500/25 text-emerald-200',
  default: 'bg-white/[0.08] border-white/[0.12] text-gray-200',
};

// ─── Component ───────────────────────────────────────────────────────────────

export function MultiSelect({
  options,
  value = [],
  onChange,
  label,
  placeholder = 'Select options...',
  searchPlaceholder = 'Search options...',
  emptySearchMessage = 'No options found',
  emptyOptionsMessage = 'No options available',
  error,
  helperText,
  disabled = false,
  required = false,
  leftIcon,
  className,
  wrapperClassName,
  chipVariant = 'default',
  id: providedId,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const generatedId = useId();
  const id = providedId ?? generatedId;

  const hasError = Boolean(error);

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

  // Focus search input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearch('');
    }
  }, [isOpen]);

  const filteredOptions = options.filter((option) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      option.label.toLowerCase().includes(q) ||
      (option.subLabel && option.subLabel.toLowerCase().includes(q)) ||
      (option.chipLabel && option.chipLabel.toLowerCase().includes(q)) ||
      (option.badge?.text && option.badge.text.toLowerCase().includes(q))
    );
  });

  const handleToggleOption = (optionValue: string, isOptionDisabled?: boolean) => {
    if (isOptionDisabled || disabled) return;
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const handleRemoveChip = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    onChange(value.filter((v) => v !== optionValue));
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    onChange([]);
  };

  // Find selected options metadata for chip rendering
  const selectedOptions = value.map((val) => {
    const found = options.find((o) => o.value === val);
    return (
      found || {
        value: val,
        label: val,
      }
    );
  });

  return (
    <div className={cn('flex flex-col gap-1.5', wrapperClassName)} ref={containerRef}>
      {/* Label and Clear All Action */}
      {label && (
        <div className="flex items-center justify-between">
          <label
            htmlFor={id}
            className={cn(
              'text-sm font-medium',
              hasError ? 'text-red-400' : 'text-gray-300',
              disabled && 'opacity-50'
            )}
          >
            {label} {required && <span className="text-red-400">*</span>}
          </label>
          <div className="flex items-center gap-2">
            {value.length > 0 && !disabled && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
              >
                Clear all ({value.length})
              </button>
            )}
          </div>
        </div>
      )}

      <div className="relative">
        {/* Trigger */}
        <div
          id={id}
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          tabIndex={disabled ? -1 : 0}
          onClick={() => !disabled && setIsOpen((prev) => !prev)}
          onKeyDown={(e) => {
            if (disabled) return;
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsOpen((prev) => !prev);
            }
          }}
          className={cn(
            'w-full min-h-10 px-3 py-1.5 rounded-lg text-sm text-left',
            'flex items-center justify-between gap-2',
            'bg-white/[0.04] border border-white/[0.08]',
            'transition-all duration-150 ease-out',
            !disabled && [
              'cursor-pointer hover:bg-white/[0.06] hover:border-white/[0.12]',
              'focus:outline-none focus:border-blue-500/60 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]',
            ],
            disabled && 'opacity-40 cursor-not-allowed',
            isOpen && 'border-blue-500/60 shadow-[0_0_0_3px_rgba(59,130,246,0.12)]',
            hasError && 'border-red-500/50',
            className
          )}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {leftIcon && <span className="text-gray-500 shrink-0">{leftIcon}</span>}

            {selectedOptions.length === 0 ? (
              <span className="text-gray-500 truncate select-none">{placeholder}</span>
            ) : (
              <div className="flex flex-wrap items-center gap-1.5 max-h-24 overflow-y-auto py-0.5 pr-1 flex-1">
                {selectedOptions.map((opt) => (
                  <span
                    key={opt.value}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border shrink-0',
                      chipStyles[chipVariant]
                    )}
                  >
                    {opt.avatar && (
                      <Avatar
                        name={opt.avatar.name}
                        src={opt.avatar.src}
                        size="xs"
                        className="size-4 text-[8px] shrink-0"
                      />
                    )}
                    {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                    <span className="truncate max-w-[150px]">
                      {opt.chipLabel || opt.label}
                    </span>
                    {!disabled && (
                      <button
                        type="button"
                        aria-label={`Remove ${opt.label}`}
                        onClick={(e) => handleRemoveChip(opt.value, e)}
                        className="p-0.5 text-gray-400 hover:text-red-300 hover:bg-red-500/20 rounded transition-colors"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            )}
          </div>

          <motion.span
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.15 }}
            className="shrink-0 text-gray-500 ml-1"
          >
            <ChevronDown size={16} />
          </motion.span>
        </div>

        {/* Popover Dropdown Panel */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              role="listbox"
              aria-multiselectable="true"
              variants={dropdownVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className={cn(
                'absolute z-50 top-[calc(100%+6px)] left-0 right-0',
                'bg-gray-900 border border-white/[0.10] rounded-xl',
                'shadow-[0_16px_48px_rgba(0,0,0,0.6)]',
                'p-2 overflow-hidden flex flex-col gap-1.5',
                'origin-top'
              )}
            >
              {/* Search Bar */}
              <div className="relative px-1 pt-1 pb-1">
                <Search size={14} className="absolute left-3.5 top-3.5 text-gray-500 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={searchPlaceholder}
                  className={cn(
                    'w-full h-8 pl-8 pr-3 text-xs rounded-lg',
                    'bg-white/[0.04] border border-white/[0.08] text-gray-200 placeholder-gray-500',
                    'focus:outline-none focus:border-blue-500/60 focus:bg-white/[0.06]',
                    'transition-colors'
                  )}
                />
              </div>

              {/* Options Checklist */}
              <ul className="max-h-56 overflow-y-auto space-y-0.5 pr-1">
                {options.length === 0 ? (
                  <li className="px-3 py-4 text-center text-xs text-gray-500">
                    {emptyOptionsMessage}
                  </li>
                ) : filteredOptions.length === 0 ? (
                  <li className="px-3 py-4 text-center text-xs text-gray-500">
                    {emptySearchMessage}
                  </li>
                ) : (
                  filteredOptions.map((opt) => {
                    const isSelected = value.includes(opt.value);
                    return (
                      <li
                        key={opt.value}
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => handleToggleOption(opt.value, opt.disabled)}
                        className={cn(
                          'flex items-center justify-between px-2.5 py-2 rounded-lg text-xs cursor-pointer',
                          'transition-colors duration-100',
                          opt.disabled && 'opacity-40 cursor-not-allowed',
                          isSelected
                            ? 'bg-blue-500/15 text-blue-200 border border-blue-500/25'
                            : 'text-gray-300 hover:bg-white/[0.06] hover:text-white border border-transparent',
                          opt.isSpecial && !isSelected && 'bg-blue-950/20'
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          {/* Checkbox */}
                          <div
                            className={cn(
                              'size-4 rounded flex items-center justify-center border transition-colors shrink-0',
                              isSelected
                                ? 'bg-blue-600 border-blue-500 text-white'
                                : 'border-white/20 bg-white/[0.02]'
                            )}
                          >
                            {isSelected && <Check size={12} strokeWidth={3} />}
                          </div>

                          {/* Avatar if available */}
                          {opt.avatar && (
                            <Avatar
                              name={opt.avatar.name}
                              src={opt.avatar.src}
                              size="xs"
                              className="size-6 text-[10px] shrink-0"
                            />
                          )}

                          {/* Icon if available */}
                          {opt.icon && !opt.avatar && (
                            <span className="text-gray-400 shrink-0">{opt.icon}</span>
                          )}

                          {/* Label and SubLabel */}
                          <div className="min-w-0 flex flex-col">
                            <span className="font-medium truncate text-gray-200">
                              {opt.label}
                            </span>
                            {opt.subLabel && (
                              <span className="text-[10px] text-gray-500 truncate">
                                {opt.subLabel}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Optional Right Badge */}
                        {opt.badge && (
                          <div className="flex items-center shrink-0 ml-2">
                            <Badge
                              variant={opt.badge.variant || 'default'}
                              className="text-[10px] uppercase font-bold px-1.5 py-0.2"
                            >
                              {opt.badge.text}
                            </Badge>
                          </div>
                        )}
                      </li>
                    );
                  })
                )}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Helper and Error text */}
      {hasError && <p className="text-xs text-red-400">{error}</p>}
      {!hasError && helperText && <p className="text-xs text-gray-500">{helperText}</p>}
    </div>
  );
}
