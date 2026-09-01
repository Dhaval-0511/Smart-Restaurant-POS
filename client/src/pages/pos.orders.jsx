import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Search, Trash2, Edit, Clock, ChefHat, CheckCircle2, Flame, Timer } from "lucide-react";

// ─── Live Kitchen Status Badge ─────────────────────────────────────────────

const STAGE_CONFIG = {
  ToCook: {
    label: "To Cook",
    icon: ChefHat,
    dot: "bg-slate-400",
    bg: "bg-slate-50 border-slate-200 text-slate-600",
    pulse: false,
  },
  Preparing: {
    label: "Preparing",
    icon: Flame,
    dot: "bg-amber-500",
    bg: "bg-amber-50 border-amber-300 text-amber-700",
    pulse: true,
  },
  Completed: {
    label: "Ready",
    icon: CheckCircle2,
    dot: "bg-emerald-500",
    bg: "bg-emerald-50 border-emerald-300 text-emerald-700",
    pulse: false,
  },
};

function ElapsedTimer({ createdAt, stage }) {
  const [elapsed, setElapsed] = useState(() =>
    Math.floor((Date.now() - createdAt) / 1000)
  );

  useEffect(() => {
    if (stage === "Completed") return;
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - createdAt) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [createdAt, stage]);

  if (stage === "Completed") return null;

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const isLate = mins >= 15;
  const isWarning = mins >= 10;

  return (
    <span
      className={`flex items-center gap-0.5 text-[10px] font-bold ${
        isLate
          ? "text-rose-500"
          : isWarning
          ? "text-amber-600"
          : "text-[#6F4E37]/60"
      }`}
    >
      <Timer className="w-2.5 h-2.5" />
      {mins}:{secs.toString().padStart(2, "0")}
    </span>
  );
}

function KitchenBadge({ orderId }) {
  const ticket = useStore((s) => s.kds.find((k) => k.orderId === orderId));

  if (!ticket) return null; // order not sent to kitchen yet

  const cfg = STAGE_CONFIG[ticket.stage] || STAGE_CONFIG.ToCook;
  const Icon = cfg.icon;

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full border text-[11px] font-extrabold ${cfg.bg}`}>
      {cfg.pulse ? (
        <span className="relative flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${cfg.dot}`} />
          <span className={`relative inline-flex rounded-full h-2 w-2 ${cfg.dot}`} />
        </span>
      ) : (
        <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
      )}
      <Icon className="w-3 h-3" />
      {cfg.label}
      <ElapsedTimer createdAt={ticket.createdAt} stage={ticket.stage} />
    </div>
  );
}

// ─── Item-level status in detail modal ────────────────────────────────────

const ITEM_STATUS_CFG = {
  ToCook:    { label: "To Cook",    cls: "bg-slate-100 text-slate-500 border-slate-200" },
  Preparing: { label: "Preparing",  cls: "bg-amber-50 text-amber-700 border-amber-200" },
  Completed: { label: "Ready ✓",   cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

function KitchenDetailPanel({ orderId, lines, products }) {
  const ticket = useStore((s) => s.kds.find((k) => k.orderId === orderId));
  if (!ticket) return null;

  const cfg = STAGE_CONFIG[ticket.stage] || STAGE_CONFIG.ToCook;

  return (
    <div className="border border-[#6F4E37]/15 rounded-2xl overflow-hidden">
      {/* header */}
      <div className={`flex items-center justify-between px-3 py-2 ${cfg.bg} border-b border-[#6F4E37]/10`}>
        <div className="flex items-center gap-2">
          <ChefHat className="w-3.5 h-3.5" />
          <span className="font-extrabold text-xs uppercase tracking-wider">Kitchen Status</span>
        </div>
        <div className="flex items-center gap-1.5">
          <KitchenBadge orderId={orderId} />
        </div>
      </div>

      {/* per-item statuses */}
      <div className="divide-y divide-[#6F4E37]/8">
        {lines.map((l) => {
          const p = products.find((x) => x.id === l.productId);
          const kdsItem = ticket.items.find((ki) => ki.productId === l.productId);
          const itemStage = kdsItem?.done ? "Completed" : ticket.stage;
          const statusCfg = ITEM_STATUS_CFG[itemStage] || ITEM_STATUS_CFG.ToCook;

          return (
            <div
              key={l.productId}
              className="flex items-center justify-between px-3 py-2 bg-white"
            >
              <span className="text-xs font-semibold text-[#2B2118]">
                {p?.name || "Unknown"}{" "}
                <span className="text-[#6F4E37]/60">× {l.qty}</span>
              </span>
              <span
                className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusCfg.cls}`}
              >
                {statusCfg.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const orders = useStore((s) => s.orders);
  const customers = useStore((s) => s.customers);
  const products = useStore((s) => s.products);
  const deleteOrder = useStore((s) => s.deleteOrder);
  const setDraftOrder = useStore((s) => s.setDraftOrder);
  const setCurrentTable = useStore((s) => s.setCurrentTable);
  const fetchKds = useStore((s) => s.fetchKds);
  const navigate = useNavigate();

  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(null);

  // Keep KDS data fresh while this page is open
  useEffect(() => {
    fetchKds();
    const id = setInterval(fetchKds, 5000);
    return () => clearInterval(id);
  }, [fetchKds]);

  const filtered = orders.filter((o) => {
    if (!q) return true;
    const c = customers.find((x) => x.id === o.customerId);
    const s = q.toLowerCase();
    return (
      c?.name?.toLowerCase().includes(s) ||
      String(o.number || "").toLowerCase().includes(s)
    );
  });

  const order = orders.find((o) => o.id === selected);

  const editOrder = (id) => {
    const o = orders.find((x) => x.id === id);
    if (!o) return;
    setDraftOrder(id);
    if (o.tableId) setCurrentTable(o.tableId);
    navigate("/pos");
  };

  return (
    <div className="p-6 bg-[#FAF3E0] text-[#2B2118] min-h-[calc(100vh-4rem)] max-w-6xl mx-auto space-y-4 select-none">

      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-extrabold text-[#6F4E37] tracking-tight">Orders</h1>
        <div className="relative w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <Input
            placeholder="Search by order # or customer…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9 bg-[#FAF3E0] text-[#2B2118] border-[#6F4E37]/30 focus:border-[#6F4E37] focus:bg-white rounded-xl"
          />
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-[11px] font-semibold text-[#6F4E37]/70 bg-white border border-[#6F4E37]/15 rounded-2xl px-4 py-2.5 w-fit shadow-sm">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-slate-400" />To Cook
        </div>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-amber-500" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
          </span>
          Preparing (live timer)
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />Ready for Pickup
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#6F4E37]/30" />Not yet sent to kitchen
        </div>
      </div>

      {/* Orders table */}
      <Card className="bg-white border border-[#6F4E37]/25 rounded-3xl overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#FAF3E0] border-b border-[#6F4E37]/20">
              <tr>
                <th className="p-3 text-left font-bold text-[#6F4E37]/80">Date</th>
                <th className="p-3 text-left font-bold text-[#6F4E37]/80">Order</th>
                <th className="p-3 text-left font-bold text-[#6F4E37]/80">Table</th>
                <th className="p-3 text-left font-bold text-[#6F4E37]/80">Customer</th>
                <th className="p-3 text-right font-bold text-[#6F4E37]/80">Amount</th>
                <th className="p-3 text-left font-bold text-[#6F4E37]/80">Status</th>
                <th className="p-3 text-left font-bold text-[#6F4E37]/80 flex items-center gap-1">
                  <ChefHat className="w-3.5 h-3.5 text-[#6F4E37]/60" /> Kitchen
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => {
                const c = customers.find((x) => x.id === o.customerId);
                const t = useStore.getState().tables.find((x) => x.id === o.tableId);

                let dateStr = "-";
                try {
                  if (o.createdAt) {
                    const d = new Date(o.createdAt);
                    if (!isNaN(d.getTime())) dateStr = format(d, "M/d HH:mm");
                  }
                } catch (e) {}

                const orderNum = o.number || (o.id ? o.id.toString().slice(0, 6) : "NEW");
                const totalAmt = (
                  typeof o.total === "number" ? o.total : parseFloat(o.total) || 0
                ).toFixed(2);

                return (
                  <tr
                    key={o.id || Math.random()}
                    className="border-b border-[#6F4E37]/10 last:border-0 hover:bg-[#FAF3E0]/20 transition-all duration-200 cursor-pointer"
                    onClick={() => o.id && setSelected(o.id)}
                  >
                    <td className="p-3 text-[#6F4E37]/80 text-xs">{dateStr}</td>
                    <td className="p-3 font-mono font-bold text-[#6F4E37]">#{orderNum}</td>
                    <td className="p-3 font-bold text-[#6F4E37]">{t ? `T-${t.number}` : "-"}</td>
                    <td className="p-3 text-[#2B2118] font-semibold">{c?.name ?? "-"}</td>
                    <td className="p-3 text-right font-extrabold text-[#6F4E37]">₹{totalAmt}</td>

                    {/* Billing status */}
                    <td className="p-3">
                      <Badge
                        className={`rounded-full px-2 py-0.5 text-xs font-bold border ${
                          o.status === "Paid"
                            ? "bg-emerald-500/10 border-emerald-500/35 text-emerald-600"
                            : o.status === "Draft"
                            ? "bg-[#6F4E37]/10 border-[#6F4E37]/30 text-[#6F4E37]"
                            : "bg-rose-500/10 border-rose-500/30 text-rose-500"
                        }`}
                      >
                        {o.status || "Unknown"}
                      </Badge>
                    </td>

                    {/* Kitchen status */}
                    <td className="p-3">
                      {o.sentToKitchen ? (
                        <KitchenBadge orderId={o.id} />
                      ) : (
                        <span className="text-[11px] text-[#6F4E37]/35 font-semibold italic">
                          — not sent
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {!filtered.length && (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-zinc-500 font-semibold">
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Order Detail Modal */}
      <Dialog open={!!order} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="bg-white border border-[#6F4E37]/30 text-[#2B2118] max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-[#6F4E37] font-extrabold text-lg">
              Order #{order?.number || (order?.id ? order.id.toString().slice(0, 6) : "NEW")}
            </DialogTitle>
          </DialogHeader>

          {order && (
            <div className="space-y-3 py-2 text-sm text-[#6F4E37]/80">
              {/* Meta */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[#FAF3E0]/50 rounded-xl px-3 py-2 border border-[#6F4E37]/10">
                  <div className="text-[10px] uppercase tracking-wider font-bold text-[#6F4E37]/50 mb-0.5">Date</div>
                  <div className="font-bold text-[#2B2118] text-xs">
                    {(() => {
                      try {
                        if (order.createdAt) {
                          const d = new Date(order.createdAt);
                          if (!isNaN(d.getTime())) return format(d, "M/d HH:mm");
                        }
                      } catch (e) {}
                      return "-";
                    })()}
                  </div>
                </div>
                <div className="bg-[#FAF3E0]/50 rounded-xl px-3 py-2 border border-[#6F4E37]/10">
                  <div className="text-[10px] uppercase tracking-wider font-bold text-[#6F4E37]/50 mb-0.5">Customer</div>
                  <div className="font-bold text-[#2B2118] text-xs">
                    {customers.find((c) => c.id === order.customerId)?.name ?? "Walk-in"}
                  </div>
                </div>
                <div className="bg-[#FAF3E0]/50 rounded-xl px-3 py-2 border border-[#6F4E37]/10">
                  <div className="text-[10px] uppercase tracking-wider font-bold text-[#6F4E37]/50 mb-0.5">Amount</div>
                  <div className="font-extrabold text-[#6F4E37] text-sm">
                    ₹{(typeof order.total === "number" ? order.total : parseFloat(order.total) || 0).toFixed(2)}
                  </div>
                </div>
                <div className="bg-[#FAF3E0]/50 rounded-xl px-3 py-2 border border-[#6F4E37]/10">
                  <div className="text-[10px] uppercase tracking-wider font-bold text-[#6F4E37]/50 mb-0.5">Billing</div>
                  <Badge
                    className={`rounded-full px-2 py-0.5 text-xs font-bold border ${
                      order.status === "Paid"
                        ? "bg-emerald-500/10 border-emerald-500/35 text-emerald-600"
                        : order.status === "Draft"
                        ? "bg-[#6F4E37]/10 border-[#6F4E37]/30 text-[#6F4E37]"
                        : "bg-rose-500/10 border-rose-500/30 text-rose-500"
                    }`}
                  >
                    {order.status || "Unknown"}
                  </Badge>
                </div>
              </div>

              {/* Kitchen detail panel */}
              {order.sentToKitchen && (
                <KitchenDetailPanel
                  orderId={order.id}
                  lines={order.lines || []}
                  products={products}
                />
              )}

              {/* Items list */}
              <div>
                <div className="font-bold text-[#6F4E37] text-xs uppercase tracking-wider mb-2">
                  Items
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {(order.lines || []).map((l) => {
                    const p = products.find((x) => x.id === l.productId);
                    const lineQty = typeof l.qty === "number" ? l.qty : parseFloat(l.qty) || 0;
                    const linePrice = typeof l.unitPrice === "number" ? l.unitPrice : parseFloat(l.unitPrice) || 0;
                    return (
                      <div
                        key={l.productId || Math.random()}
                        className="flex justify-between bg-[#FAF3E0]/40 p-2.5 rounded-xl border border-[#6F4E37]/10"
                      >
                        <span className="text-[#2B2118] font-semibold text-xs">
                          {p?.name || "Unknown Product"}{" "}
                          <span className="text-[#6F4E37] font-bold">× {lineQty}</span>
                        </span>
                        <span className="font-bold text-[#2B2118] text-xs">
                          ₹{(lineQty * linePrice).toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {order?.status === "Draft" && (
            <DialogFooter className="flex gap-2">
              <Button
                variant="destructive"
                onClick={() => {
                  deleteOrder(order.id);
                  setSelected(null);
                }}
                className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/25 flex-1 font-bold cursor-pointer rounded-xl py-2"
              >
                <Trash2 className="w-4 h-4 mr-1 inline" /> Delete
              </Button>
              <Button
                onClick={() => editOrder(order.id)}
                className="bg-[#6F4E37] hover:bg-[#6F4E37]/90 text-white flex-1 font-bold cursor-pointer rounded-xl py-2"
              >
                <Edit className="w-4 h-4 mr-1 inline" /> Edit Order
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
