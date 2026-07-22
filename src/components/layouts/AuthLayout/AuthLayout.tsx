import { cn } from '@/utils/cn';

interface AuthLayoutProps {
  children: React.ReactNode;
  /** Card heading (e.g. "Welcome back") */
  title: string;
  /** Subtitle below the heading */
  subtitle: string;
  className?: string;
}

/**
 * AuthLayout — centered auth shell.
 * Renders a glassmorphism card on a dark background with a subtle gradient.
 * Used by LoginPage and ForgotPasswordPage.
 */
export function AuthLayout({ children, title, subtitle, className }: AuthLayoutProps) {
  return (
    <div
      className={cn(
        'min-h-screen bg-gray-950 flex flex-col items-center justify-center',
        'px-4 py-12',
        // Subtle radial gradient behind the card
        'relative overflow-hidden',
      )}
    >
      {/* Background glow — purely decorative */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% -10%, rgba(59,130,246,0.10) 0%, transparent 70%)',
        }}
      />

      {/* Brand mark */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="size-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-[0_0_24px_rgba(59,130,246,0.35)]">
          <span className="font-bold text-white text-lg select-none">M</span>
        </div>
        <span className="text-base font-semibold text-gray-200 tracking-tight">
          Marsell
        </span>
      </div>

      {/* Card */}
      <div
        className={cn(
          'w-full max-w-sm',
          'bg-gray-900/80 backdrop-blur-md',
          'border border-white/[0.08]',
          'rounded-2xl',
          'shadow-[0_24px_80px_rgba(0,0,0,0.7)]',
          'px-7 py-8',
          className,
        )}
      >
        {/* Heading */}
        <div className="mb-6 space-y-1.5">
          <h1 className="text-xl font-semibold text-gray-100 tracking-tight">{title}</h1>
          <p className="text-sm text-gray-400">{subtitle}</p>
        </div>

        {children}
      </div>

      {/* Footer */}
      <p className="mt-8 text-xs text-gray-700 select-none">
        &copy; {new Date().getFullYear()} Marsell. All rights reserved.
      </p>
    </div>
  );
}
