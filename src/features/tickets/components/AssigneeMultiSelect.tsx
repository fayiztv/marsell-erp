import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User as UserIcon, ChevronDown, Check, X, Search, ShieldCheck } from 'lucide-react';
import { cn } from '@/utils/cn';
import { dropdownVariants } from '@/utils/animations';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';

export interface AssigneeCandidate {
  uid: string;
  name: string;
  role: 'admin' | 'manager' | 'employee';
  homeDepartmentId?: string | null | undefined;
  homeDepartmentName?: string | undefined;
  isSelf?: boolean | undefined;
  displayName?: string | undefined;
}

export interface AssigneeMultiSelectProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  candidates: AssigneeCandidate[];
  hasSelectedDepartments: boolean;
  disabled?: boolean | undefined;
  error?: string | undefined;
  label?: string | undefined;
  helperText?: string | undefined;
}

export function AssigneeMultiSelect({
  selectedIds = [],
  onChange,
  candidates,
  hasSelectedDepartments,
  disabled = false,
  error,
  label = 'Assign To',
  helperText,
}: AssigneeMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const hasError = Boolean(error);
  const isFieldDisabled = disabled || !hasSelectedDepartments;

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

  const filteredCandidates = candidates.filter((c) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      (c.homeDepartmentName && c.homeDepartmentName.toLowerCase().includes(q)) ||
      c.role.toLowerCase().includes(q)
    );
  });

  const handleToggle = (uid: string) => {
    if (selectedIds.includes(uid)) {
      onChange(selectedIds.filter((id) => id !== uid));
    } else {
      onChange([...selectedIds, uid]);
    }
  };

  const handleRemove = (uid: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedIds.filter((id) => id !== uid));
  };

  // Find candidate details for selected IDs (even if candidate list is still loading, fallback gracefully)
  const selectedCandidates = selectedIds.map((id) => {
    const found = candidates.find((c) => c.uid === id);
    return (
      found || {
        uid: id,
        name: 'Assignee',
        role: 'employee' as const,
        displayName: 'Assignee',
      }
    );
  });

  return (
    <div className="flex flex-col gap-1.5" ref={containerRef}>
      {label && (
        <div className="flex items-center justify-between">
          <label
            className={cn(
              'text-sm font-medium',
              hasError ? 'text-red-400' : 'text-gray-300',
              isFieldDisabled && 'opacity-50'
            )}
          >
            {label} <span className="text-red-400">*</span>
          </label>
          {selectedIds.length > 0 && (
            <span className="text-xs text-gray-400 font-medium">
              {selectedIds.length} assigned
            </span>
          )}
        </div>
      )}

      <div className="relative">
        {/* Trigger */}
        <div
          onClick={() => !isFieldDisabled && setIsOpen((prev) => !prev)}
          className={cn(
            'w-full min-h-10 px-3 py-1.5 rounded-lg text-sm text-left',
            'flex items-center justify-between gap-2',
            'bg-white/[0.04] border border-white/[0.08]',
            'transition-all duration-150 ease-out',
            !isFieldDisabled && [
              'cursor-pointer hover:bg-white/[0.06] hover:border-white/[0.12]',
              'focus-within:border-blue-500/60 focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]',
            ],
            isFieldDisabled && 'opacity-40 cursor-not-allowed',
            isOpen && 'border-blue-500/60 shadow-[0_0_0_3px_rgba(59,130,246,0.12)]',
            hasError && 'border-red-500/50'
          )}
        >
          <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
            <span className="text-gray-500 shrink-0">
              <UserIcon size={15} />
            </span>
            {!hasSelectedDepartments ? (
              <span className="text-gray-500 text-xs italic">
                Select department(s) first to assign members
              </span>
            ) : selectedCandidates.length === 0 ? (
              <span className="text-gray-500 text-sm">Select assignees...</span>
            ) : (
              <div className="flex items-center gap-1.5 flex-wrap">
                {selectedCandidates.map((c) => (
                  <span
                    key={c.uid}
                    className="inline-flex items-center gap-1.5 pl-1 pr-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/25 text-blue-200 text-xs font-medium"
                  >
                    <Avatar name={c.name} size="xs" className="size-4 text-[8px]" />
                    <span className="truncate max-w-[120px]">
                      {c.isSelf ? 'Self (You)' : c.name}
                    </span>
                    {!disabled && (
                      <button
                        type="button"
                        onClick={(e) => handleRemove(c.uid, e)}
                        className="p-0.5 hover:text-red-300 hover:bg-red-500/20 rounded-full transition-colors"
                      >
                        <X size={11} />
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
          {isOpen && hasSelectedDepartments && (
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
                  placeholder="Search assignees by name or dept..."
                  className={cn(
                    'w-full h-8 pl-8 pr-3 text-xs rounded-lg',
                    'bg-white/[0.04] border border-white/[0.08] text-gray-200 placeholder-gray-500',
                    'focus:outline-none focus:border-blue-500/60'
                  )}
                />
              </div>

              {/* Options List */}
              <ul className="max-h-56 overflow-y-auto space-y-0.5 pr-1">
                {filteredCandidates.length === 0 ? (
                  <li className="px-3 py-3 text-center text-xs text-gray-500">
                    No eligible assignees found in selected departments
                  </li>
                ) : (
                  filteredCandidates.map((candidate) => {
                    const isSelected = selectedIds.includes(candidate.uid);
                    return (
                      <li
                        key={candidate.uid}
                        onClick={() => handleToggle(candidate.uid)}
                        className={cn(
                          'flex items-center justify-between px-2.5 py-2 rounded-lg text-xs cursor-pointer',
                          'transition-colors duration-100',
                          isSelected
                            ? 'bg-blue-500/15 text-blue-200 border border-blue-500/25'
                            : 'text-gray-300 hover:bg-white/[0.06] hover:text-white border border-transparent',
                          candidate.isSelf && !isSelected && 'bg-blue-950/20'
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
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
                          <Avatar name={candidate.name} size="xs" className="size-6 text-[10px] shrink-0" />
                          <div className="min-w-0 flex flex-col">
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium truncate text-gray-200">
                                {candidate.displayName || candidate.name}
                              </span>
                              {candidate.isSelf && (
                                <ShieldCheck size={12} className="text-blue-400 shrink-0" />
                              )}
                            </div>
                            {candidate.homeDepartmentName && (
                              <span className="text-[10px] text-gray-500 truncate">
                                {candidate.homeDepartmentName}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          <Badge
                            variant={candidate.role === 'manager' ? 'purple' : 'default'}
                            className="text-[10px] uppercase font-bold px-1.5 py-0.2"
                          >
                            {candidate.role}
                          </Badge>
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
