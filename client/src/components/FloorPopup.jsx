import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useStore } from "@/lib/store";
import { Users, X } from "lucide-react";

export function FloorPopup({ open, onSelect, onOpenChange }) {
  const floors = useStore((s) => s.floors);
  const tables = useStore((s) => s.tables);
  const orders = useStore((s) => s.orders);
  const customers = useStore((s) => s.customers);

  const getActiveOrder = (tid) =>
    orders.find((o) => o.tableId === tid && o.status === "Draft");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-[#FAF3E0] border border-[#6F4E37]/20 text-[#2B2118] rounded-3xl shadow-2xl p-0 overflow-hidden" hideClose>
        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-[#6F4E37]/15 bg-white">
          <DialogTitle className="text-[#2B2118] font-extrabold text-xl tracking-tight">
            Select a Table
          </DialogTitle>
          <button
            onClick={() => onOpenChange(false)}
            className="w-8 h-8 rounded-full bg-[#FAF3E0] hover:bg-[#6F4E37]/15 flex items-center justify-center transition cursor-pointer text-[#6F4E37]/70"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6 max-h-[72vh] overflow-y-auto px-7 py-6">
          {floors.map((f) => {
            const floorTables = tables.filter((t) => t.floorId === f.id && t.active);
            if (floorTables.length === 0) return null;

            return (
              <div key={f.id}>
                {/* Floor name */}
                <h3 className="font-extrabold text-sm text-[#6F4E37] uppercase tracking-widest mb-4">
                  {f.name}
                </h3>

                {/* Table grid */}
                <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 gap-3">
                  {floorTables.map((t) => {
                    const activeOrder = getActiveOrder(t.id);
                    const busy = !!activeOrder;
                    const customer = busy
                      ? customers.find((c) => c.id === activeOrder.customerId)
                      : null;
                    const orderTotal = busy ? activeOrder.total : 0;

                    return (
                      <button
                        key={t.id}
                        onClick={() => onSelect(t.id)}
                        className={`
                          relative flex flex-col items-center justify-center
                          rounded-2xl border-2 transition-all duration-200
                          hover:scale-[1.04] hover:shadow-md cursor-pointer
                          aspect-square p-2 select-none
                          ${busy
                            ? "border-[#6F4E37] bg-[#6F4E37]/10 shadow-sm"
                            : "border-[#6F4E37]/20 bg-white hover:border-[#6F4E37]/50 hover:bg-[#FAF3E0]"
                          }
                        `}
                      >
                        {/* Table number — large */}
                        <span className="text-3xl font-black text-[#2B2118] leading-none">
                          {t.number}
                        </span>

                        {/* Seat count */}
                        <div className="flex items-center gap-1 mt-1.5 text-[#6F4E37]/60">
                          <Users className="w-3 h-3" />
                          <span className="text-[11px] font-semibold">{t.seats}</span>
                        </div>

                        {/* Status label */}
                        {busy ? (
                          <div className="mt-1.5 flex flex-col items-center">
                            <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#6F4E37]">
                              Occupied
                            </span>
                            {customer && (
                              <span className="text-[9px] text-[#2B2118] font-bold truncate max-w-[60px] leading-tight mt-0.5">
                                {customer.name.split(" ")[0]}
                              </span>
                            )}
                            {orderTotal > 0 && (
                              <span className="text-[9px] text-[#6F4E37] font-extrabold mt-0.5">
                                ₹{Math.round(orderTotal)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[9px] font-extrabold uppercase tracking-widest text-emerald-600 mt-1.5">
                            Available
                          </span>
                        )}

                        {/* Occupied dot indicator */}
                        {busy && (
                          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#6F4E37]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {floors.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-[#6F4E37]/50">
              <Users className="w-10 h-10 mb-3 stroke-[1.5]" />
              <p className="text-sm font-semibold">No floors configured</p>
              <p className="text-xs mt-1">Add floors and tables in Admin settings</p>
            </div>
          )}
        </div>

        {/* Legend footer */}
        <div className="px-7 py-3 border-t border-[#6F4E37]/15 bg-white flex items-center gap-6 text-xs font-semibold text-[#6F4E37]/60">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded border-2 border-[#6F4E37]/25 bg-white inline-block" />
            Available — click to start new order
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded border-2 border-[#6F4E37] bg-[#6F4E37]/10 inline-block" />
            Occupied — click to view existing order
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
