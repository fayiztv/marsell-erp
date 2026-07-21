import { useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isLoading?: boolean;
  className?: string;
  id?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function SearchBar({
  value,
  onChange,
  placeholder = 'Search...',
  isLoading = false,
  className,
  id,
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleClear() {
    onChange('');
    inputRef.current?.focus();
  }

  return (
    <div
      className={cn(
        'relative flex items-center',
        'h-9 rounded-lg',
        'bg-white/[0.04] border border-white/[0.08]',
        'transition-all duration-150 ease-out',
        'focus-within:border-blue-500/50 focus-within:bg-white/[0.06]',
        'focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.1)]',
        className,
      )}
    >
      {/* Search / loading icon */}
      <span className="absolute left-3 flex items-center text-gray-500 pointer-events-none">
        {isLoading ? (
          <Loader2 size={15} className="animate-spin" />
        ) : (
          <Search size={15} />
        )}
      </span>

      <input
        ref={inputRef}
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'w-full h-full bg-transparent',
          'pl-8 pr-8 text-sm',
          'text-gray-100 placeholder:text-gray-600',
          'focus:outline-none',
        )}
        aria-label={placeholder}
      />

      {/* Clear button */}
      {value && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className={cn(
            'absolute right-2.5 size-5 rounded-md',
            'flex items-center justify-center',
            'text-gray-500 hover:text-gray-300 hover:bg-white/[0.08]',
            'transition-all duration-100',
          )}
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
}
