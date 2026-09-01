import { useStore } from "@/lib/store";
import { UtensilsCrossed, Users } from "lucide-react";

export function TableStatusBar({ onClick }) {
  const tables = useStore((s) => s.tables).filter((t) => t.active);
  const orders = useStore((s) => s.orders);

  const occupiedIds = new Set(
    orders.filter((o) => o.status === "Draft").map((o) => o.tableId)
  );

  const totalActive = tables.length;
  const occupiedCount = tables.filter((t) => occupiedIds.has(t.id)).length;
  const availableCount = totalActive - occupiedCount;
  const occupancyPct = totalActive > 0 ? Math.round((occupiedCount / totalActive) * 100) : 0;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between bg-white border border-[#6F4E37]/20 rounded-2xl px-5 py-3 shadow-sm hover:shadow-md hover:border-[#6F4E37]/40 transition-all duration-200 cursor-pointer group"
    >
      {/* Left: icon + title */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#FAF3E0] border border-[#6F4E37]/20 flex items-center justify-center shrink-0 group-hover:bg-[#6F4E37]/10 transition-colors">
          <UtensilsCrossed className="w-4 h-4 text-[#6F4E37]" />
        </div>
        <div className="text-left">
          <div className="font-extrabold text-sm text-[#2B2118] leading-tight">
            Table Status
          </div>
          <div className="text-[11px] text-[#6F4E37]/60 font-medium leading-tight mt-0.5">
            Live overview — click to select a table
          </div>
        </div>
      </div>

      {/* Right: stat pills */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Available */}
        <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-extrabold px-3 py-1.5 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          {availableCount} Available
        </div>

        {/* Occupied */}
        <div className="flex items-center gap-1.5 bg-[#6F4E37]/10 border border-[#6F4E37]/25 text-[#6F4E37] text-xs font-extrabold px-3 py-1.5 rounded-full">
          <span className="w-2 h-2 rounded-full bg-[#6F4E37] shrink-0" />
          {occupiedCount} Occupied
        </div>

        {/* Occupancy % badge */}
        <div className="text-[11px] font-extrabold text-[#6F4E37]/50 bg-[#FAF3E0] border border-[#6F4E37]/15 px-3 py-1.5 rounded-full tracking-wide uppercase">
          Occupancy {occupancyPct}%
        </div>
      </div>
    </button>
  );
}
