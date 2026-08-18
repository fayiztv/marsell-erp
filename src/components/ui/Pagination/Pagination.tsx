import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/utils/cn";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PaginationProps {
  currentPage: number;
  hasMore: boolean;
  onPrevious: () => void;
  onNext: () => void;
  isLoading?: boolean;
  /** Total item count for current page (to know if we're on the last partial page) */
  pageSize: number;
  itemCount: number;
  className?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function Pagination({
  currentPage,
  hasMore,
  onPrevious,
  onNext,
  isLoading = false,
  pageSize,
  itemCount,
  className,
}: PaginationProps) {
  const canGoPrevious = currentPage > 1;

  // If no items and on page 1, show nothing
  if (itemCount === 0 && currentPage === 1 && !isLoading) {
    return null;
  }

  const handlePrevious = () => {
    onPrevious();
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleNext = () => {
    onNext();
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 pt-4",
        "border-t border-white/[0.06]",
        "pb-10",
        className,
      )}
    >
      {/* Page indicator */}
      <p className="text-sm text-gray-500 tabular-nums">
        Page <span className="font-medium text-gray-300">{currentPage}</span>
        {" · "}
        <span className="font-medium text-gray-300">{itemCount}</span>
        {itemCount === pageSize ? " +" : ""} result{itemCount !== 1 ? "s" : ""}
      </p>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePrevious}
          disabled={!canGoPrevious || isLoading}
          leftIcon={<ChevronLeft size={14} />}
          aria-label="Previous page"
        >
          Previous
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleNext}
          disabled={!hasMore || isLoading}
          rightIcon={<ChevronRight size={14} />}
          aria-label="Next page"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
