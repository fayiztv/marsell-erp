import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Building2,
  Ticket,
  Settings,
  ChevronLeft,
  LogOut,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/utils/cn";
import { Avatar } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { authService } from "@/features/authentication/services/authService";
import { useToast } from "@/hooks/useToast";
import { ROUTES } from "@/constants";

// ─── Types ───────────────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  /** Match only the exact path (default: prefix match) */
  end?: boolean;
}

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

// ─── Nav items by role ────────────────────────────────────────────────────────

const managerNav: NavItem[] = [
  {
    label: "Dashboard",
    href: ROUTES.MANAGER.DASHBOARD,
    icon: LayoutDashboard,
    end: true,
  },
  { label: "Employees", href: ROUTES.MANAGER.EMPLOYEES, icon: Users },
  { label: "Clients", href: ROUTES.MANAGER.CLIENTS, icon: Building2 },
  { label: "Tickets", href: ROUTES.MANAGER.TICKETS, icon: Ticket },
  { label: "Settings", href: ROUTES.MANAGER.SETTINGS, icon: Settings },
];

const employeeNav: NavItem[] = [
  { label: "My Tickets", href: ROUTES.EMPLOYEE.TICKETS, icon: Ticket },
  { label: "Settings", href: ROUTES.EMPLOYEE.SETTINGS, icon: Settings },
];

// ─── Component ───────────────────────────────────────────────────────────────

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const { firebaseUser, role, isManager } = useAuth();
  const toast = useToast();
  const location = useLocation();

  const navItems = isManager ? managerNav : employeeNav;
  const displayName =
    firebaseUser?.displayName ?? firebaseUser?.email ?? "User";

  async function handleSignOut() {
    try {
      await authService.signOut();
    } catch {
      toast.error("Sign out failed", "Please try again.");
    }
  }

  /** Returns true if the current route matches the nav item href */
  function isActive(item: NavItem) {
    if (item.end) {
      return location.pathname === item.href;
    }
    return location.pathname.startsWith(item.href);
  }

  return (
    <motion.aside
      animate={{ width: isCollapsed ? 85 : 240 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "flex flex-col h-full shrink-0",
        "bg-gray-950 border-r border-white/[0.06]",
        "overflow-hidden",
      )}
    >
      {/* ── Brand + Collapse button ── */}
      <div className="flex items-center h-14 px-3 border-b border-white/[0.06] shrink-0">
        <div className="size-7 rounded-lg bg-blue-600 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(59,130,246,0.3)]">
          <span className="text-white font-bold text-sm select-none">M</span>
        </div>

        <motion.span
          animate={{
            opacity: isCollapsed ? 0 : 1,
            width: isCollapsed ? 0 : "auto",
          }}
          transition={{ duration: 0.15 }}
          className="ml-2.5 font-semibold text-gray-100 text-sm whitespace-nowrap overflow-hidden"
        >
          Marsell
        </motion.span>

        <motion.button
          animate={{ marginLeft: isCollapsed ? "auto" : "auto" }}
          onClick={onToggle}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "ml-auto size-6 rounded-md flex items-center justify-center shrink-0",
            "text-gray-600 hover:text-gray-300 hover:bg-white/[0.06]",
            "transition-all duration-150",
          )}
        >
          <motion.span
            animate={{ rotate: isCollapsed ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronLeft size={14} />
          </motion.span>
        </motion.button>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;

          return (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.end}
              title={isCollapsed ? item.label : undefined}
              onClick={() => {
                if (window.innerWidth < 640) {
                  onToggle();
                }
              }}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm",
                "transition-all duration-150 ease-out",
                "min-w-0 whitespace-nowrap",
                isCollapsed
                  ? "justify-center w-12 h-12 mx-auto pl-5"
                  : "gap-2.5 px-2 py-2",
                active
                  ? "bg-blue-600/15 text-blue-300 border border-blue-500/20"
                  : "text-gray-400 hover:text-gray-200 hover:bg-white/[0.05] border border-transparent",
              )}
            >
              <Icon
                size={16}
                className={cn(
                  "shrink-0",
                  active ? "text-blue-400" : "text-gray-500",
                )}
              />
              <motion.span
                animate={{
                  opacity: isCollapsed ? 0 : 1,
                  width: isCollapsed ? 0 : "auto",
                }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden font-medium"
              >
                {item.label}
              </motion.span>
            </NavLink>
          );
        })}
      </nav>

      {/* ── User footer ── */}
      <div className="shrink-0 border-t border-white/[0.06] p-2 space-y-1">
        {/* Role badge */}
        <motion.div
          animate={{
            opacity: isCollapsed ? 0 : 1,
            height: isCollapsed ? 0 : "auto",
          }}
          transition={{ duration: 0.15 }}
          className="overflow-hidden"
        >
          <div className="px-2 py-1">
            <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">
              {role ?? "User"}
            </span>
          </div>
        </motion.div>

        {/* User row */}
        <div
          className={cn(
            "flex items-center gap-2.5 rounded-lg px-2 py-1.5 min-w-0",
            isCollapsed && "justify-center",
          )}
        >
          <Avatar name={displayName} size="sm" className="shrink-0" />
          <motion.div
            animate={{
              opacity: isCollapsed ? 0 : 1,
              width: isCollapsed ? 0 : "auto",
            }}
            transition={{ duration: 0.15 }}
            className="flex-1 min-w-0 overflow-hidden"
          >
            <p className="text-xs font-medium text-gray-200 truncate">
              {displayName}
            </p>
            <p className="text-[10px] text-gray-600 truncate">
              {firebaseUser?.email ?? ""}
            </p>
          </motion.div>
        </div>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          title="Sign out"
          className={cn(
            "w-full flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm",
            "text-gray-500 hover:text-red-400 hover:bg-red-500/[0.08]",
            "transition-all duration-150",
            isCollapsed && "justify-center",
          )}
        >
          <LogOut size={15} className="shrink-0" />
          <motion.span
            animate={{
              opacity: isCollapsed ? 0 : 1,
              width: isCollapsed ? 0 : "auto",
            }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden font-medium whitespace-nowrap"
          >
            Sign out
          </motion.span>
        </button>
      </div>
    </motion.aside>
  );
}
