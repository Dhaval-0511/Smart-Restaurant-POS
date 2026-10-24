/**
 * LowStockBanner
 * Reads lowStockAlerts from Zustand store (filled via socket inventory:low-stock event).
 * Renders dismissible amber warning chips at bottom-right of the viewport.
 * Safe to mount in any layout — renders nothing when alerts array is empty.
 */
import { useStore } from "@/lib/store";
import { AlertTriangle, X, XCircle } from "lucide-react";

export function LowStockBanner() {
  const alerts         = useStore((s) => s.lowStockAlerts);
  const dismissAlert   = useStore((s) => s.dismissLowStockAlert);
  const clearAllAlerts = useStore((s) => s.clearLowStockAlerts);

  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {alerts.length > 1 && (
        <button
          onClick={clearAllAlerts}
          className="self-end text-[10px] font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-2.5 py-1 rounded-lg transition pointer-events-auto cursor-pointer flex items-center gap-1"
        >
          <XCircle className="w-3 h-3" /> Clear all ({alerts.length})
        </button>
      )}
      {alerts.map((alert) => (
        <div
          key={alert.ingredientId}
          className="pointer-events-auto flex items-start gap-3 bg-amber-50 border border-amber-300 rounded-2xl px-4 py-3 shadow-xl shadow-amber-100/60"
        >
          <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-black text-amber-800 uppercase tracking-wide">Low Stock Warning</div>
            <div className="text-sm font-semibold text-amber-900 mt-0.5 leading-snug">{alert.name}</div>
            <div className="text-[11px] text-amber-700 mt-0.5">
              Available: <span className="font-black text-red-600">{Number(alert.currentStock).toFixed(2)} {alert.unit}</span>
              {" · "}Minimum: {Number(alert.minimumStock).toFixed(2)} {alert.unit}
            </div>
            <div className="text-[10px] text-amber-600 mt-1 font-semibold">Please restock immediately</div>
          </div>
          <button
            onClick={() => dismissAlert(alert.ingredientId)}
            className="shrink-0 text-amber-500 hover:text-amber-800 transition cursor-pointer mt-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
