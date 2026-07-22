import { Menu } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Avatar } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';

interface TopbarProps {
  /** Page title shown in the center/left area */
  title?: string;
  /** Mobile: toggle sidebar drawer */
  onMenuClick?: () => void;
}

/**
 * Topbar — sticky header for the authenticated shell.
 * Shows the page title (if provided), and user info on the right.
 * Sidebar toggle button appears on mobile.
 */
export function Topbar({ title, onMenuClick }: TopbarProps) {
  const { firebaseUser, role } = useAuth();
  const displayName = firebaseUser?.displayName ?? firebaseUser?.email ?? 'User';

  return (
    <header
      className={cn(
        'h-14 shrink-0 flex items-center gap-4',
        'px-4 sm:px-6',
        'bg-gray-950/80 backdrop-blur-md',
        'border-b border-white/[0.06]',
        'sticky top-0 z-20',
      )}
    >
      {/* Mobile menu button */}
      {onMenuClick && (
        <button
          onClick={onMenuClick}
          aria-label="Open navigation"
          className="size-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-300 hover:bg-white/[0.06] transition-all duration-150 sm:hidden"
        >
          <Menu size={16} />
        </button>
      )}

      {/* Page title */}
      {title && (
        <h1 className="text-sm font-semibold text-gray-200 truncate flex-1">{title}</h1>
      )}
      {!title && <div className="flex-1" />}

      {/* User info */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-xs font-medium text-gray-300 leading-none">
            {displayName}
          </span>
          <span className="text-[10px] text-gray-600 leading-none mt-0.5 capitalize">
            {role ?? 'User'}
          </span>
        </div>
        <Avatar name={displayName} size="sm" />
      </div>
    </header>
  );
}
