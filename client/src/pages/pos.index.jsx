import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { FloorPopup } from "@/components/FloorPopup";
import { CustomerCaptureModal } from "@/components/CustomerCaptureModal";
import { TableStatusBar } from "@/components/TableStatusBar";
import { PaymentModal } from "@/components/PaymentModal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Minus,
  Plus,
  Trash2,
  Send,
  Tag,
  Mail,
  User as UserIcon,
  Coffee,
  Package,
  CreditCard,
} from "lucide-react";

// Smart emoji mapper based on product name keywords
const getProductEmoji = (name = "") => {
  const n = name.toLowerCase();
  if (n.includes("espresso")) return "☕";
  if (n.includes("cappuccino")) return "🍵";
  if (n.includes("latte")) return "🥛";
  if (n.includes("americano")) return "☕";
  if (n.includes("cold brew") || n.includes("cold coffee")) return "🧋";
  if (n.includes("frappuccino") || n.includes("frappe")) return "🥤";
  if (n.includes("iced")) return "🧊";
  if (n.includes("mocha")) return "☕";
  if (n.includes("chai") || n.includes("tea")) return "🫖";
  if (n.includes("green tea")) return "🍵";
  if (n.includes("peach")) return "🍑";
  if (n.includes("smoothie") || n.includes("shake")) return "🥤";
  if (n.includes("juice")) return "🍹";
  if (n.includes("lemonade")) return "🍋";
  if (n.includes("croissant")) return "🥐";
  if (n.includes("muffin")) return "🧁";
  if (n.includes("cheesecake") || n.includes("cake")) return "🍰";
  if (n.includes("banana bread") || n.includes("bread")) return "🍞";
  if (n.includes("cookie") || n.includes("biscuit")) return "🍪";
  if (n.includes("brownie")) return "🍫";
  if (n.includes("donut") || n.includes("doughnut")) return "🍩";
  if (n.includes("waffle")) return "🧇";
  if (n.includes("pancake")) return "🥞";
  if (n.includes("sandwich")) return "🥪";
  if (n.includes("wrap")) return "🌯";
  if (n.includes("burger")) return "🍔";
  if (n.includes("pizza")) return "🍕";
  if (n.includes("pasta") || n.includes("noodle")) return "🍝";
  if (n.includes("salad")) return "🥗";
  if (n.includes("soup")) return "🍜";
  if (n.includes("chicken")) return "🍗";
  if (n.includes("paneer")) return "🧀";
  if (n.includes("egg")) return "🍳";
  if (n.includes("rice")) return "🍚";
  if (n.includes("biryani")) return "🍛";
  if (n.includes("ice cream") || n.includes("gelato")) return "🍨";
  if (n.includes("chocolate")) return "🍫";
  if (n.includes("fruit") || n.includes("berry") || n.includes("blueberry")) return "🫐";
  if (n.includes("water")) return "💧";
  if (n.includes("coffee")) return "☕";
  return "🍽️";
};

export default function OrderView() {
  const {
    categories,
    products,
    currentTableId,
    setCurrentTable,
    draftOrderId,
    setDraftOrder,
    orders,
    customers,
    paymentMethods,
    createDraftOrder,
    addLine,
    setLineQty,
    recalcOrder,
    sendOrderToKitchen,
    updateOrder,
    payOrder,
  } = useStore();

  const navigate = useNavigate();
  const search = useStore((s) => s.searchQuery);

  // UI state
  const [showFloor, setShowFloor] = useState(false);
  const [activeCat, setActiveCat] = useState("all");
  const [couponOpen, setCouponOpen] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [customerOpen, setCustomerOpen] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailVal, setEmailVal] = useState("");

  // Customer capture for new table
  const [captureOpen, setCaptureOpen] = useState(false);
  const [pendingTable, setPendingTable] = useState(null);

  // Ensure draft order exists for selected table
  useEffect(() => {
    if (!currentTableId) return;
    const existing = orders.find(
      (o) => o.tableId === currentTableId && o.status === "Draft"
    );
    if (existing) {
      setDraftOrder(existing.id);
    }
  }, [currentTableId, orders]);

  const order = orders.find((o) => o.id === draftOrderId);
  const customer = customers.find((c) => c.id === order?.customerId);
  const table = useStore.getState().tables.find((t) => t.id === currentTableId);

  const filteredProducts = useMemo(() => {
    let list = products;
    if (activeCat !== "all") list = list.filter((p) => p.categoryId === activeCat);
    if (search)
      list = list.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase())
      );
    return list;
  }, [products, activeCat, search]);

  const handleSelectTable = (tid) => {
    const isOccupied = useStore
      .getState()
      .orders.some((o) => o.tableId === tid && o.status === "Draft");
    if (!isOccupied) {
      setPendingTable(tid);
      setCaptureOpen(true);
      setShowFloor(false);
    } else {
      setCurrentTable(tid);
      setShowFloor(false);
    }
  };

  const handleCustomerCaptured = (customerId) => {
    setCaptureOpen(false);
    const newId = createDraftOrder(pendingTable, customerId);
    setDraftOrder(newId);
    setCurrentTable(pendingTable);
  };

  const handleAdd = (pid) => {
    if (!order?.id) {
      toast.error("Please select a Table first.");
      setShowFloor(true);
      return;
    }
    // Guard: never add items to a completed or paid order
    if (order.status === "Paid" || order.status === "Cancelled") {
      toast.error("This order is already completed and cannot be modified.");
      return;
    }
    if (!order.customerId) {
      toast.error("Please assign a Customer to this order first.");
      return;
    }
    addLine(order.id, pid);
    updateOrder(order.id, { sentToKitchen: false });
  };

  const applyCoupon = () => {
    if (!order) return;
    recalcOrder(order.id, couponCode);
    const o = useStore.getState().orders.find((x) => x.id === order.id);
    if (o?.discountLabel?.toUpperCase().includes(couponCode.toUpperCase()))
      toast.success("Coupon applied");
    else toast.error("Invalid coupon");
    setCouponOpen(false);
    setCouponCode("");
  };

  const handleConfirmPay = (pmId, amount, ref) => {
    payOrder(order.id, pmId, amount, ref);
  };

  const handleEmailReceipt = async (email) => {
    if (!order?.id || order.id.length <= 15) {
      toast.error("Order must be processed before emailing receipt");
      return;
    }
    try {
      const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const raw = localStorage.getItem("cafe-auth-token");
      const token = raw ? raw.replace(/^"|"$/g, "") : null;
      const res = await fetch(`${BASE}/orders/${order.id}/send-receipt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ email }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || "Failed to send receipt");
      toast.success(`Receipt sent to ${email}`);
    } catch (err) {
      toast.error(err.message || "Failed to send receipt");
    }
  };

  const handlePayModalClose = (open) => {
    setPayModalOpen(open);
    if (!open) {
      // After payment completed and modal closed, reset POS for next order
      const latestOrder = useStore.getState().orders.find((o) => o.id === draftOrderId);
      if (latestOrder?.status === "Paid") {
        setCurrentTable(null);
        setDraftOrder(null);
        setShowFloor(true);
      }
    }
  };

  const displayOrder = order || {
    id: "temp",
    number: "NEW",
    lines: [],
    subtotal: 0,
    tax: 0,
    discountTotal: 0,
    total: 0,
    sentToKitchen: false,
  };

  // Lock the POS UI when the current order is already Paid or Cancelled
  const isOrderLocked = order?.status === "Paid" || order?.status === "Cancelled";

  // Enrich order lines with product names for payment modal
  const enrichedOrder = order
    ? {
        ...order,
        lines: order.lines.map((l) => {
          const p = products.find((x) => x.id === l.productId);
          return { ...l, name: p?.name || "Item" };
        }),
      }
    : null;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-[#FAF3E0] text-[#2B2118] overflow-hidden select-none p-3.5 gap-3">
      {/* Modals */}
      <FloorPopup open={showFloor} onSelect={handleSelectTable} onOpenChange={setShowFloor} />
      <CustomerCaptureModal
        open={captureOpen}
        onOpenChange={setCaptureOpen}
        tableId={pendingTable}
        onSuccess={handleCustomerCaptured}
      />
      <PaymentModal
        open={payModalOpen}
        onOpenChange={handlePayModalClose}
        order={enrichedOrder}
        customer={customer}
        table={table}
        paymentMethods={paymentMethods}
        onConfirmPay={handleConfirmPay}
        onEmailReceipt={handleEmailReceipt}
      />

      {/* ── Table Status Bar ────────────────────────────────────── */}
      <TableStatusBar onClick={() => setShowFloor(true)} />

      {/* ── 2-column POS layout ─────────────────────────────────── */}
      <div className="flex gap-3.5 flex-1 min-h-0 overflow-hidden">

        {/* ── LEFT (65%): MENU ────────────────────────────────────── */}
        <div
          className="flex overflow-hidden border border-[#6F4E37]/20 bg-white rounded-3xl shadow-md p-3"
          style={{ flex: "0 0 65%" }}
        >
          {/* Vertical Category Sidebar */}
          <div className="w-[120px] border-r border-[#6F4E37]/20 py-2 px-2 flex flex-col gap-2.5 overflow-y-auto scrollbar-none shrink-0 pr-3">
            <button
              onClick={() => setActiveCat("all")}
              className={`py-3.5 px-2 rounded-2xl text-center flex flex-col items-center justify-center transition border cursor-pointer select-none ${
                activeCat === "all"
                  ? "bg-[#6F4E37] text-white border-[#6F4E37] shadow-md shadow-[#6F4E37]/15"
                  : "border-[#6F4E37]/30 text-[#6F4E37] hover:bg-[#6F4E37]/10"
              }`}
            >
              <Coffee className="w-4 h-4 mb-1" />
              <span className="text-[10px] leading-snug tracking-wide font-extrabold uppercase whitespace-normal break-words">
                All Items
              </span>
            </button>

            {categories.map((c) => {
              const isActive = activeCat === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveCat(c.id)}
                  className="py-3.5 px-2 rounded-2xl text-center flex flex-col items-center justify-center transition border cursor-pointer select-none"
                  style={
                    isActive
                      ? { background: c.color, color: "white", borderColor: c.color }
                      : { color: c.color, borderColor: `${c.color}50` }
                  }
                >
                  <span className="text-[10px] leading-snug tracking-wide font-extrabold uppercase whitespace-normal break-words">
                    {c.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Product Grid */}
          <div className="flex-1 p-3 overflow-y-auto min-h-0 pl-4 pr-1 relative">
            {/* Lock overlay when order is Paid/Cancelled */}
            {isOrderLocked && (
              <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-[2px] flex flex-col items-center justify-center gap-3 rounded-2xl">
                <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
                  <span className="text-3xl">✅</span>
                </div>
                <div className="text-center">
                  <p className="font-extrabold text-sm text-emerald-700">Order Paid &amp; Completed</p>
                  <p className="text-xs text-zinc-500 mt-1">This order is locked. Select a new table to start a fresh order.</p>
                </div>
                <button
                  onClick={() => { setCurrentTable(null); setDraftOrder(null); setShowFloor(true); }}
                  className="mt-1 px-5 py-2 bg-[#6F4E37] text-white text-xs font-extrabold rounded-xl hover:bg-[#5A3A1A] transition cursor-pointer shadow-md"
                >
                  Select New Table
                </button>
              </div>
            )}
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredProducts.map((p) => {
                  const cat = categories.find((c) => c.id === p.categoryId);
                  return (
                    <button
                      key={p.id}
                      onClick={() => handleAdd(p.id)}
                      className="group relative rounded-2xl bg-[#FAF3E0]/30 hover:bg-[#FAF3E0]/80 border border-[#6F4E37]/20 hover:border-[#6F4E37]/50 p-3 text-left transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-xl cursor-pointer flex flex-col h-[115px] select-none overflow-hidden"
                    >
                      {/* Category dot top-right */}
                      {cat && (
                        <div
                          className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full border border-white shadow-sm"
                          style={{ backgroundColor: cat.color }}
                        />
                      )}

                      {/* Emoji image */}
                      <div className="text-3xl leading-none mb-1 select-none">
                        {getProductEmoji(p.name)}
                      </div>

                      {/* Product name */}
                      <div className="font-bold text-[#2B2118] group-hover:text-[#6F4E37] text-[11px] leading-snug line-clamp-2 flex-1">
                        {p.name}
                      </div>

                      {/* Price */}
                      <div className="text-[#6F4E37] font-extrabold text-sm tracking-tight mt-1">
                        ₹{p.price.toLocaleString()}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-zinc-500">
                <Package className="w-10 h-10 mb-2 stroke-[1.5]" />
                <span className="text-sm font-semibold">No products found</span>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT (35%): ORDER CART ──────────────────────────────── */}
        <div
          className="flex flex-col bg-white border border-[#6F4E37]/25 p-4 rounded-3xl shadow-md justify-between overflow-hidden"
          style={{ flex: "0 0 35%" }}
        >
          {/* Cart Header */}
          <div className="flex items-start justify-between pb-3 border-b border-[#6F4E37]/20 shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-[#2B2118]">
                  {table ? `Table ${table.number}` : "No Table Selected"}
                </span>
                {isOrderLocked && (
                  <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-700 border border-emerald-300 px-2 py-0.5 rounded-full uppercase tracking-wide">
                    Paid ✓
                  </span>
                )}
              </div>
              <div className="text-xs text-[#6F4E37]/60 mt-0.5 font-medium">
                Order #{displayOrder.number}
                {customer ? ` · ${customer.name}` : ""}
              </div>
            </div>
            <button
              onClick={() => setShowFloor(true)}
              className="text-[10px] font-extrabold text-[#6F4E37] bg-[#FAF3E0] border border-[#6F4E37]/25 px-2.5 py-1.5 rounded-xl hover:bg-[#6F4E37]/10 transition cursor-pointer uppercase tracking-wide"
            >
              {isOrderLocked ? "New Order" : "Change Table"}
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto py-3 space-y-2 min-h-0 pr-1">
            {displayOrder.lines.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-400 text-xs gap-2 py-10">
                <Package className="w-8 h-8 stroke-[1.5]" />
                <span className="font-semibold">Cart is empty</span>
                <span className="text-center leading-relaxed opacity-75">
                  {currentTableId
                    ? "Tap any product from the menu to add"
                    : "Select a table first, then add products"}
                </span>
              </div>
            ) : (
              displayOrder.lines.map((l) => {
                const p = products.find((x) => x.id === l.productId);
                if (!p) return null;

                return (
                  <div
                    key={l.productId}
                    className="border border-[#6F4E37]/15 bg-[#FAF3E0]/30 rounded-2xl p-3 flex flex-col gap-2"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold text-sm text-[#2B2118] leading-snug">
                          {p.name}
                        </div>
                        <div className="text-[11px] text-zinc-500 mt-0.5">
                          ₹{l.unitPrice} each
                        </div>
                      </div>
                      <div className="font-extrabold text-sm text-[#2B2118]">
                        ₹{(l.qty * l.unitPrice).toFixed(0)}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      {/* Qty stepper — hidden when order is locked */}
                      {!isOrderLocked ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            className="h-7 w-7 rounded-lg bg-[#FAF3E0] hover:bg-[#6F4E37]/20 text-[#6F4E37] flex items-center justify-center transition border border-[#6F4E37]/25 cursor-pointer"
                            onClick={() => {
                              setLineQty(order.id, l.productId, l.qty - 1);
                              updateOrder(order.id, { sentToKitchen: false });
                            }}
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-extrabold text-sm w-6 text-[#2B2118] text-center">
                            {l.qty}
                          </span>
                          <button
                            className="h-7 w-7 rounded-lg bg-[#FAF3E0] hover:bg-[#6F4E37]/20 text-[#6F4E37] flex items-center justify-center transition border border-[#6F4E37]/25 cursor-pointer"
                            onClick={() => {
                              setLineQty(order.id, l.productId, l.qty + 1);
                              updateOrder(order.id, { sentToKitchen: false });
                            }}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <span className="font-extrabold text-sm text-[#2B2118]/60">
                          × {l.qty}
                        </span>
                      )}

                      {/* Delete — hidden when locked */}
                      {!isOrderLocked && (
                        <button
                          className="h-7 w-7 rounded-lg hover:bg-red-50 text-zinc-400 hover:text-red-500 flex items-center justify-center transition cursor-pointer border border-transparent hover:border-red-200"
                          onClick={() => {
                            setLineQty(order.id, l.productId, 0);
                            updateOrder(order.id, { sentToKitchen: false });
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {l.productDiscount && (
                      <div className="text-[10px] bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-md self-start border border-emerald-200 font-bold">
                        {l.productDiscount.label}: -₹{l.productDiscount.amount.toFixed(0)}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Cart Footer: actions + totals + payment button */}
          <div className="space-y-3 shrink-0 pt-3 border-t border-[#6F4E37]/20">

            {isOrderLocked ? (
              /* ── Locked / Paid state ── */
              <div className="flex flex-col items-center gap-3 py-2">
                <div className="w-full bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-extrabold text-emerald-700">Order Completed</p>
                    <p className="text-[11px] text-emerald-600/70 mt-0.5">
                      Total paid: ₹{Math.round(displayOrder.total)}
                    </p>
                  </div>
                  <span className="text-2xl">✅</span>
                </div>
                <button
                  onClick={() => { setCurrentTable(null); setDraftOrder(null); setShowFloor(true); }}
                  className="w-full bg-[#6F4E37] hover:bg-[#5A3A1A] text-white font-extrabold py-3 rounded-2xl text-sm transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  Start New Order
                </button>
              </div>
            ) : (
              <>
                {/* Action row */}
                <div className="grid grid-cols-3 gap-2">
                  {/* Send to kitchen */}
                  {order?.sentToKitchen ? (
                    <span className="col-span-3 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-extrabold px-3 py-2.5 rounded-xl flex items-center justify-center gap-1 select-none">
                      ✓ Sent to Kitchen
                    </span>
                  ) : (
                    <button
                      onClick={async () => {
                        if (!order || order.lines.length === 0) {
                          toast.error("Cart is empty");
                          return;
                        }
                        try {
                          await sendOrderToKitchen(order.id);
                          toast.success("Order sent to kitchen!");
                        } catch (err) {
                          toast.error(err.message || "Failed to send order");
                        }
                      }}
                      className="col-span-3 bg-[#6F4E37]/10 text-[#6F4E37] hover:bg-[#6F4E37] hover:text-white border border-[#6F4E37]/25 text-xs font-extrabold px-3 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Send to Kitchen
                    </button>
                  )}

                  <button
                    onClick={() => setCustomerOpen(true)}
                    className="bg-[#FAF3E0] hover:bg-[#6F4E37]/10 text-[#6F4E37]/80 text-[11px] font-bold py-2 px-1 rounded-xl transition border border-[#6F4E37]/25 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <UserIcon className="w-3.5 h-3.5 text-[#6F4E37]" />
                    Customer
                  </button>
                  <button
                    onClick={() => setCouponOpen(true)}
                    className="bg-[#FAF3E0] hover:bg-[#6F4E37]/10 text-[#6F4E37]/80 text-[11px] font-bold py-2 px-1 rounded-xl transition border border-[#6F4E37]/25 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Tag className="w-3.5 h-3.5 text-[#6F4E37]" />
                    Discount
                  </button>
                  <button
                    onClick={() => setEmailOpen(true)}
                    className="bg-[#FAF3E0] hover:bg-[#6F4E37]/10 text-[#6F4E37]/80 text-[11px] font-bold py-2 px-1 rounded-xl transition border border-[#6F4E37]/25 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5 text-[#6F4E37]" />
                    Email
                  </button>
                </div>

                {/* Totals */}
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-[#6F4E37]/60 font-medium">
                    <span>Sub total</span>
                    <span className="font-bold text-[#2B2118]">₹{displayOrder.subtotal.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-[#6F4E37]/60 font-medium">
                    <span>Tax (GST 5%)</span>
                    <span className="font-bold text-[#2B2118]">₹{displayOrder.tax.toFixed(0)}</span>
                  </div>
                  {displayOrder.discountTotal > 0 && (
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>Discount</span>
                      <span>-₹{displayOrder.discountTotal.toFixed(0)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-extrabold text-base pt-2 border-t border-[#6F4E37]/20 text-[#2B2118]">
                    <span>Total</span>
                    <span>₹{Math.round(displayOrder.total)}</span>
                  </div>
                </div>

                {/* PROCEED TO PAYMENT — primary CTA */}
                <button
                  onClick={() => {
                    if (!order || order.lines.length === 0) {
                      toast.error("Cart is empty — add items first");
                      return;
                    }
                    setPayModalOpen(true);
                  }}
                  disabled={!order || displayOrder.total === 0}
                  className="w-full bg-[#6F4E37] hover:bg-[#5A3A1A] disabled:bg-[#6F4E37]/30 disabled:cursor-not-allowed text-white font-extrabold py-3.5 rounded-2xl text-sm transition-all shadow-md shadow-[#6F4E37]/20 cursor-pointer flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  Proceed to Payment
                  {displayOrder.total > 0 && (
                    <span className="ml-1 bg-white/20 px-2 py-0.5 rounded-lg text-xs font-black">
                      ₹{Math.round(displayOrder.total)}
                    </span>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Coupon Dialog ──────────────────────────────────────────── */}
      <Dialog open={couponOpen} onOpenChange={setCouponOpen}>
        <DialogContent className="bg-white border border-[#6F4E37]/30 text-[#2B2118] max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-[#6F4E37] font-bold">Apply Coupon</DialogTitle>
          </DialogHeader>
          <div className="py-2.5">
            <Input
              placeholder="Enter coupon code (e.g. SUMMER20)"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              className="bg-[#FAF3E0] text-[#2B2118] border-[#6F4E37]/30 rounded-xl"
              autoFocus
            />
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setCouponOpen(false)}
              className="border-[#6F4E37]/20 text-[#6F4E37]/60 hover:bg-[#FAF3E0] flex-1 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={applyCoupon}
              className="bg-[#6F4E37] hover:bg-[#6F4E37]/90 text-white flex-1 font-bold cursor-pointer"
            >
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Customer Dialog ──────────────────────────────────────── */}
      <Dialog open={customerOpen} onOpenChange={setCustomerOpen}>
        <DialogContent className="bg-white border border-[#6F4E37]/30 text-[#2B2118] max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-[#6F4E37] font-bold">Assign Customer</DialogTitle>
          </DialogHeader>
          <div className="max-h-72 overflow-y-auto space-y-1.5 py-2">
            {customers.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  if (order) updateOrder(order.id, { customerId: c.id });
                  setCustomerOpen(false);
                }}
                className="w-full text-left p-3 hover:bg-[#FAF3E0] border border-transparent hover:border-[#6F4E37]/30 rounded-xl text-sm transition cursor-pointer"
              >
                <div className="font-extrabold text-[#2B2118]">{c.name}</div>
                <div className="text-xs text-zinc-500 mt-0.5">
                  {c.email} · {c.phone}
                </div>
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCustomerOpen(false)}
              className="border-[#6F4E37]/20 text-[#6F4E37]/60 hover:bg-[#FAF3E0] w-full font-bold cursor-pointer"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Email Receipt Dialog ─────────────────────────────────── */}
      <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
        <DialogContent className="bg-white border border-[#6F4E37]/30 text-[#2B2118] max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-[#6F4E37] font-bold">Email Receipt</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2.5">
            <Label className="text-xs text-[#6F4E37]/60">Email Address</Label>
            <Input
              type="email"
              autoFocus
              placeholder="customer@example.com"
              value={emailVal || customer?.email || ""}
              onChange={(e) => setEmailVal(e.target.value)}
              className="bg-[#FAF3E0] text-[#2B2118] border-[#6F4E37]/30 rounded-xl"
            />
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setEmailOpen(false)}
              className="border-[#6F4E37]/20 text-[#6F4E37]/60 hover:bg-[#FAF3E0] flex-1 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                const to = emailVal || customer?.email;
                if (!to) return toast.error("Enter a valid email");
                await handleEmailReceipt(to);
                setEmailOpen(false);
                setEmailVal("");
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white flex-1 font-bold cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5 mr-1.5" /> Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
