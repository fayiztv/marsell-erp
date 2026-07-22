import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { cn } from '@/utils/cn';
import { useUIStore } from '@/app/stores/uiStore';

/**
 * AppLayout — authenticated shell.
 *
 * Structure:
 *   ┌──────────────┬──────────────────────────────────┐
 *   │   Sidebar    │  Topbar                          │
 *   │  (fixed     │ ────────────────────────────────  │
 *   │  collapsible │  <Outlet /> (scrollable content) │
 *   │  left rail)  │                                  │
 *   └──────────────┴──────────────────────────────────┘
 *
 * <Outlet /> is where child routes (Dashboard, Employees, etc.) render.
 * Must be used as the element in a React Router parent route with `children`.
 */
export function AppLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const activeDialog = useUIStore((s) => s.activeDialog);

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      {/* ── Desktop Sidebar ── */}
      <div className="hidden sm:flex">
        <Sidebar
          isCollapsed={isCollapsed}
          onToggle={() => setIsCollapsed((v) => !v)}
        />
      </div>

      {/* ── Mobile Sidebar Drawer ── */}
      {isMobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 sm:hidden"
            onClick={() => setIsMobileOpen(false)}
            aria-hidden="true"
          />
          {/* Drawer */}
          <div className="fixed left-0 inset-y-0 z-40 sm:hidden">
            <Sidebar
              isCollapsed={false}
              onToggle={() => setIsMobileOpen(false)}
            />
          </div>
        </>
      )}

      {/* ── Main column ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar onMenuClick={() => setIsMobileOpen(true)} />

        {/* Scrollable content area */}
        <main
          id="main-content"
          className={cn(
            'flex-1 overflow-y-auto',
            'p-4 sm:p-6',
            // Blur content when a dialog is open (subtle glass effect)
            activeDialog && 'pointer-events-none',
          )}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
