import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, ChevronDown, Check, X, Search } from 'lucide-react';
import { cn } from '@/utils/cn';
import { dropdownVariants } from '@/utils/animations';

export interface DepartmentOption {
  id: string;
  name: string;
  code?: string | undefined;
}

export interface DepartmentMultiSelectProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  departments: DepartmentOption[];
  disabled?: boolean | undefined;
  error?: string | undefined;
  label?: string | undefined;
  helperText?: string | undefined;
}

export function DepartmentMultiSelect({
  selectedIds = [],
  onChange,
  departments,
  disabled = false,
  error,
  label = 'Departments',
  helperText,
}: DepartmentMultiSelectProps) {
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

  const filteredDepartments = departments.filter((d) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      d.name.toLowerCase().includes(q) ||
      (d.code && d.code.toLowerCase().includes(q))
    );
  });

  const handleToggle = (deptId: string) => {
    if (selectedIds.includes(deptId)) {
      onChange(selectedIds.filter((id) => id !== deptId));
    } else {
      onChange([...selectedIds, deptId]);
    }
  };

  const handleRemove = (deptId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedIds.filter((id) => id !== deptId));
  };

  const selectedDepts = departments.filter((d) => selectedIds.includes(d.id));

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
            {label} <span className="text-red-400">*</span>
          </label>
          {selectedIds.length > 0 && (
            <span className="text-xs text-gray-400 font-medium">
              {selectedIds.length} selected
            </span>
          )}
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
              <Layers size={15} />
            </span>
            {selectedDepts.length === 0 ? (
              <span className="text-gray-500 text-sm">Select departments...</span>
            ) : (
              <div className="flex items-center gap-1.5 flex-wrap">
                {selectedDepts.map((d) => (
                  <span
                    key={d.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/15 border border-purple-500/25 text-purple-300 text-xs font-medium"
                  >
                    <span>{d.name}</span>
                    {d.code && <span className="text-purple-400/80 text-[10px]">({d.code})</span>}
                    {!disabled && (
                      <button
                        type="button"
                        onClick={(e) => handleRemove(d.id, e)}
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
                  placeholder="Search departments..."
                  className={cn(
                    'w-full h-8 pl-8 pr-3 text-xs rounded-lg',
                    'bg-white/[0.04] border border-white/[0.08] text-gray-200 placeholder-gray-500',
                    'focus:outline-none focus:border-blue-500/60'
                  )}
                />
              </div>

              {/* Options List */}
              <ul className="max-h-48 overflow-y-auto space-y-0.5 pr-1">
                {filteredDepartments.length === 0 ? (
                  <li className="px-3 py-3 text-center text-xs text-gray-500">
                    No departments found
                  </li>
                ) : (
                  filteredDepartments.map((dept) => {
                    const isSelected = selectedIds.includes(dept.id);
                    return (
                      <li
                        key={dept.id}
                        onClick={() => handleToggle(dept.id)}
                        className={cn(
                          'flex items-center justify-between px-2.5 py-2 rounded-lg text-xs cursor-pointer',
                          'transition-colors duration-100',
                          isSelected
                            ? 'bg-purple-500/15 text-purple-200 border border-purple-500/25'
                            : 'text-gray-300 hover:bg-white/[0.06] hover:text-white border border-transparent'
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={cn(
                              'size-4 rounded flex items-center justify-center border transition-colors',
                              isSelected
                                ? 'bg-purple-600 border-purple-500 text-white'
                                : 'border-white/20 bg-white/[0.02]'
                            )}
                          >
                            {isSelected && <Check size={12} strokeWidth={3} />}
                          </div>
                          <span className="font-medium truncate">{dept.name}</span>
                        </div>
                        {dept.code && (
                          <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-white/[0.06] text-gray-400">
                            {dept.code}
                          </span>
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

      {hasError && <p className="text-xs text-red-400">{error}</p>}
      {!hasError && helperText && <p className="text-xs text-gray-500">{helperText}</p>}
    </div>
  );
}
