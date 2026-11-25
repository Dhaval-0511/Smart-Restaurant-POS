/**
 * ErrorState — reusable empty/error placeholder for tables and lists.
 * Usage:
 *   <ErrorState message="Failed to load orders" onRetry={refetch} />
 */
import { AlertTriangle } from 'lucide-react';

export function ErrorState({ message = 'Something went wrong', onRetry }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-[#6F4E37]/60">
      <AlertTriangle className="w-8 h-8" />
      <p className="text-sm font-medium">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs underline hover:text-[#6F4E37] transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  );
}
