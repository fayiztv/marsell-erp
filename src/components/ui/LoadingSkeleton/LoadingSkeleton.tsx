import { cn } from '@/utils/cn';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface LoadingSkeletonProps {
  className?: string;
  /** Render multiple skeleton blocks stacked vertically */
  count?: number;
  /** Height of each block */
  height?: string;
  /** Width of each block */
  width?: string;
}

/** A single shimmer skeleton block */
export function LoadingSkeleton({ className, height, width }: Omit<LoadingSkeletonProps, 'count'>) {
  return (
    <div
      className={cn('skeleton', className)}
      style={{
        ...(height ? { height } : {}),
        ...(width ? { width } : {}),
      }}
      aria-hidden="true"
    />
  );
}

/** Stacked skeleton blocks for paragraph/list simulation */
export function SkeletonList({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton h-[72px] rounded-xl" aria-hidden="true" />
      ))}
    </div>
  );
}

/** Full card skeleton that mirrors TicketCard / EmployeeCard layout */
export function CardSkeleton() {
  return (
    <div
      className="rounded-xl bg-gray-900/80 border border-white/[0.06] p-5 space-y-3"
      aria-hidden="true"
    >
      {/* Header row */}
      <div className="flex items-center justify-between gap-3">
        <div className="skeleton h-4 rounded-full" style={{ width: '45%' }} />
        <div className="skeleton h-5 w-16 rounded-full" />
      </div>
      {/* Body */}
      <div className="space-y-2">
        <div className="skeleton h-3 rounded-full" style={{ width: '80%' }} />
        <div className="skeleton h-3 rounded-full" style={{ width: '60%' }} />
      </div>
      {/* Footer row */}
      <div className="flex items-center gap-2 pt-1">
        <div className="skeleton size-6 rounded-full shrink-0" />
        <div className="skeleton h-3 rounded-full" style={{ width: '30%' }} />
        <div className="ml-auto skeleton h-3 rounded-full" style={{ width: '20%' }} />
      </div>
    </div>
  );
}

/** Grid of card skeletons for list loading state */
export function CardSkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3" aria-label="Loading..." aria-busy="true">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

/** Stat card skeleton for dashboard */
export function StatCardSkeleton() {
  return (
    <div
      className="rounded-xl bg-gray-900/80 border border-white/[0.06] p-5 space-y-3"
      aria-hidden="true"
    >
      <div className="skeleton h-3 rounded-full" style={{ width: '40%' }} />
      <div className="skeleton h-8 rounded-lg" style={{ width: '55%' }} />
      <div className="skeleton h-3 rounded-full" style={{ width: '30%' }} />
    </div>
  );
}
