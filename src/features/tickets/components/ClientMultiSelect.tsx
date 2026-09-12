import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, ChevronDown, Check, X, Search, UserCheck } from 'lucide-react';
import { cn } from '@/utils/cn';
import { dropdownVariants } from '@/utils/animations';

export interface ClientOption {
  id: string;
  companyName: string;
  contactPerson?: string | null | undefined;
}

export interface ClientMultiSelectProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  clients: ClientOption[];
  disabled?: boolean | undefined;
  error?: string | undefined;
  label?: string | undefined;
  helperText?: string | undefined;
}

export function ClientMultiSelect({
  selectedIds = [],
  onChange,
  clients,
  disabled = false,
  error,
  label = 'Clients (Optional)',
  helperText,
}: ClientMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  // Focus search on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearch('');
    }
  }, [isOpen]);

  const filteredClients = clients.filter((c) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      c.companyName.toLowerCase().includes(q) ||
      (c.contactPerson && c.contactPerson.toLowerCase().includes(q))
    );
  });

  const handleToggle = (clientId: string) => {
    if (selectedIds.includes(clientId)) {
      onChange(selectedIds.filter((id) => id !== clientId));
    } else {
      onChange([...selectedIds, clientId]);
    }
  };

  const handleRemove = (clientId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedIds.filter((id) => id !== clientId));
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  const selectedClients = selectedIds.map((id) => {
    const found = clients.find((c) => c.id === id);
    return found || { id, companyName: 'Client' };
  });

  return (
    <div className="flex flex-col gap-1.5" ref={containerRef}>
      {label && (
        <div className="flex items-center justify-between">
          <label
            className={cn(
              'text-sm font-medium',
              hasError ? 'text-red-400' : 'text-gray-300',
              disabled && 'opacity-50'
            )}
          >
            {label}
          </label>
          <div className="flex items-center gap-2">
            {selectedIds.length > 0 ? (
              <>
                <span className="text-xs text-gray-400 font-medium">
                  {selectedIds.length} selected
                </span>
                {!disabled && (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2"
                  >
                    Clear (Internal)
                  </button>
                )}
              </>
            ) : (
              <span className="text-[11px] text-gray-500 font-medium">
                Internal / No Client
              </span>
            )}
          </div>
        </div>
      )}

      <div className="relative">
        {/* Trigger */}
        <div
          onClick={() => !disabled && setIsOpen((prev) => !prev)}
          className={cn(
            'w-full min-h-10 px-3 py-1.5 rounded-lg text-sm text-left cursor-pointer',
            'flex items-center justify-between gap-2',
            'bg-white/[0.04] border border-white/[0.08]',
            'transition-all duration-150 ease-out',
            'hover:bg-white/[0.06] hover:border-white/[0.12]',
            'focus-within:border-blue-500/60 focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]',
            disabled && 'opacity-40 cursor-not-allowed hover:bg-white/[0.04] hover:border-white/[0.08]',
            isOpen && 'border-blue-500/60 shadow-[0_0_0_3px_rgba(59,130,246,0.12)]',
            hasError && 'border-red-500/50'
          )}
        >
          <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
            <span className="text-gray-500 shrink-0">
              <Building2 size={15} />
            </span>
            {selectedClients.length === 0 ? (
              <span className="text-gray-500 text-sm">
                Internal / No Client <span className="text-gray-600 text-xs">(Click to add clients)</span>
              </span>
            ) : (
              <div className="flex items-center gap-1.5 flex-wrap">
                {selectedClients.map((c) => (
                  <span
                    key={c.id}
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 text-xs font-medium"
                  >
                    <span className="truncate max-w-[140px]">{c.companyName}</span>
                    {!disabled && (
                      <button
                        type="button"
                        onClick={(e) => handleRemove(c.id, e)}
                        className="p-0.5 hover:text-red-300 hover:bg-red-500/20 rounded transition-colors"
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
            className="shrink-0 text-gray-500"
          >
            <ChevronDown size={16} />
          </motion.span>
        </div>

        {/* Dropdown Panel */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
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
                <Search size={14} className="absolute left-3.5 top-3.5 text-gray-500" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search clients by company name..."
                  className={cn(
                    'w-full h-8 pl-8 pr-3 text-xs rounded-lg',
                    'bg-white/[0.04] border border-white/[0.08] text-gray-200 placeholder-gray-500',
                    'focus:outline-none focus:border-blue-500/60'
                  )}
                />
              </div>

              {/* Options List */}
              <ul className="max-h-52 overflow-y-auto space-y-0.5 pr-1">
                {filteredClients.length === 0 ? (
                  <li className="px-3 py-3 text-center text-xs text-gray-500">
                    No clients found
                  </li>
                ) : (
                  filteredClients.map((client) => {
                    const isSelected = selectedIds.includes(client.id);
                    return (
                      <li
                        key={client.id}
                        onClick={() => handleToggle(client.id)}
                        className={cn(
                          'flex items-center justify-between px-2.5 py-2 rounded-lg text-xs cursor-pointer',
                          'transition-colors duration-100',
                          isSelected
                            ? 'bg-emerald-500/15 text-emerald-200 border border-emerald-500/25'
                            : 'text-gray-300 hover:bg-white/[0.06] hover:text-white border border-transparent'
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={cn(
                              'size-4 rounded flex items-center justify-center border transition-colors shrink-0',
                              isSelected
                                ? 'bg-emerald-600 border-emerald-500 text-white'
                                : 'border-white/20 bg-white/[0.02]'
                            )}
                          >
                            {isSelected && <Check size={12} strokeWidth={3} />}
                          </div>
                          <div className="min-w-0 flex flex-col">
                            <span className="font-medium truncate">{client.companyName}</span>
                            {client.contactPerson && (
                              <span className="text-[10px] text-gray-500 truncate flex items-center gap-1">
                                <UserCheck size={10} />
                                {client.contactPerson}
                              </span>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })
                )}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {hasError && <p className="text-xs text-red-400">{error}</p>}
      {!hasError && helperText && <p className="text-xs text-gray-500">{helperText}</p>}
    </div>
  );
}
