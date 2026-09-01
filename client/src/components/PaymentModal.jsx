import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { QRCodeCanvas } from "qrcode.react";
import {
  CheckCircle2,
  Printer,
  Mail,
  Banknote,
  CreditCard,
  Smartphone,
  X,
} from "lucide-react";

const PM_ICONS = {
  Cash: Banknote,
  Card: CreditCard,
  UPI: Smartphone,
};

export function PaymentModal({
  open,
  onOpenChange,
  order,
  customer,
  table,
  paymentMethods,
  onConfirmPay,   // (pmId, amount, ref) => void
  onEmailReceipt, // (email) => void
}) {
  const [selectedPM, setSelectedPM] = useState(null);
  const [cashReceived, setCashReceived] = useState("");
  const [cardRef, setCardRef] = useState("");
  const [payDone, setPayDone] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailVal, setEmailVal] = useState("");

  const displayOrder = order || {
    lines: [],
    subtotal: 0,
    tax: 0,
    discountTotal: 0,
    discountLabel: "",
    total: 0,
  };

  const activePMs = (paymentMethods || []).filter((p) => p.active);
  const selectedPMObj = activePMs.find((p) => p.id === selectedPM);
  const roundedTotal = Math.round(displayOrder.total);
  const change = parseFloat(cashReceived || "0") - roundedTotal;

  // Quick-tender amounts for cash
  const tenderAmounts = [50, 100, 200, 500, 1000, 2000].filter(
    (a) => a >= roundedTotal || a >= 50
  );

  const handlePay = () => {
    if (!selectedPM) return toast.error("Select a payment method");
    if (!displayOrder.total) return toast.error("Order total is ₹0");

    const pm = activePMs.find((p) => p.id === selectedPM);
    if (!pm) return;

    if (pm.type === "Cash") {
      const v = parseFloat(cashReceived);
      if (!v || v < displayOrder.total)
        return toast.error(`Cash received must be at least ₹${roundedTotal}`);
      onConfirmPay(selectedPM, v, undefined);
    } else if (pm.type === "Card") {
      if (!cardRef.trim()) return toast.error("Enter transaction reference");
      onConfirmPay(selectedPM, displayOrder.total, cardRef.trim());
    } else {
      onConfirmPay(selectedPM, displayOrder.total, undefined);
    }

    setPayDone(true);
    toast.success("Payment recorded successfully!");
  };

  const handleClose = () => {
    setSelectedPM(null);
    setCashReceived("");
    setCardRef("");
    setPayDone(false);
    setEmailOpen(false);
    setEmailVal("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl bg-white border border-[#6F4E37]/20 rounded-3xl shadow-2xl p-0 overflow-hidden" hideClose>
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-[#6F4E37]/15 bg-[#FAF3E0]/60">
          <div>
            <DialogTitle className="text-[#2B2118] font-extrabold text-xl tracking-tight">
              {payDone ? "Payment Complete ✓" : "Proceed to Payment"}
            </DialogTitle>
            <p className="text-xs text-[#6F4E37]/60 mt-0.5 font-medium">
              {table ? `Table ${table.number}` : "Quick Order"}{" "}
              {customer ? `· ${customer.name}` : ""}{" "}
              {order?.number ? `· Order #${order.number}` : ""}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-white border border-[#6F4E37]/20 hover:bg-[#6F4E37]/10 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4 text-[#6F4E37]/70" />
          </button>
        </div>

        {/* Main body */}
        <div className="flex h-[480px]">
          {/* LEFT: Bill Summary */}
          <div className="w-[45%] border-r border-[#6F4E37]/15 flex flex-col bg-[#FAF3E0]/30">
            <div className="px-6 py-4 border-b border-[#6F4E37]/10">
              <h3 className="text-xs font-extrabold text-[#6F4E37]/60 uppercase tracking-widest">
                Bill Summary
              </h3>
            </div>

            {/* Item list */}
            <div className="flex-1 overflow-y-auto px-6 py-3 space-y-2">
              {displayOrder.lines.length === 0 ? (
                <p className="text-xs text-zinc-400 text-center mt-8">No items</p>
              ) : (
                displayOrder.lines.map((l) => (
                  <div
                    key={l.productId}
                    className="flex justify-between items-start text-sm"
                  >
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-[#2B2118] text-xs leading-snug block truncate">
                        {l.name || `Item`}
                      </span>
                      <span className="text-[11px] text-[#6F4E37]/60 font-medium">
                        {l.qty} × ₹{l.unitPrice}
                      </span>
                    </div>
                    <span className="font-bold text-[#2B2118] text-xs shrink-0 ml-3">
                      ₹{(l.qty * l.unitPrice).toFixed(0)}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Totals */}
            <div className="px-6 py-4 border-t border-[#6F4E37]/15 space-y-1.5 bg-white">
              <div className="flex justify-between text-xs text-[#6F4E37]/70 font-medium">
                <span>Subtotal</span>
                <span className="font-bold text-[#2B2118]">
                  ₹{displayOrder.subtotal.toFixed(0)}
                </span>
              </div>
              <div className="flex justify-between text-xs text-[#6F4E37]/70 font-medium">
                <span>GST (5%)</span>
                <span className="font-bold text-[#2B2118]">
                  ₹{displayOrder.tax.toFixed(0)}
                </span>
              </div>
              {displayOrder.discountTotal > 0 && (
                <div className="flex justify-between text-xs text-emerald-600 font-bold">
                  <span>
                    Discount
                    {displayOrder.discountLabel
                      ? ` (${displayOrder.discountLabel})`
                      : ""}
                  </span>
                  <span>-₹{displayOrder.discountTotal.toFixed(0)}</span>
                </div>
              )}
              <div className="flex justify-between font-extrabold text-base pt-2 border-t border-[#6F4E37]/20 text-[#2B2118]">
                <span>Total Payable</span>
                <span className="text-[#6F4E37] text-xl">
                  ₹{roundedTotal}
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT: Payment */}
          <div className="flex-1 flex flex-col">
            {!payDone ? (
              <>
                <div className="px-6 py-4 border-b border-[#6F4E37]/10">
                  <h3 className="text-xs font-extrabold text-[#6F4E37]/60 uppercase tracking-widest">
                    Payment Method
                  </h3>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                  {/* PM Selector */}
                  <div className="grid grid-cols-1 gap-2">
                    {activePMs.map((pm) => {
                      const isActive = selectedPM === pm.id;
                      const Icon = PM_ICONS[pm.type] || Banknote;
                      return (
                        <button
                          key={pm.id}
                          onClick={() => {
                            setSelectedPM(pm.id);
                            setCashReceived("");
                            setCardRef("");
                          }}
                          className={`w-full p-3.5 border-2 rounded-2xl text-left flex items-center gap-3 transition-all duration-200 cursor-pointer ${
                            isActive
                              ? "border-[#6F4E37] bg-[#6F4E37]/8 shadow-sm"
                              : "border-[#6F4E37]/20 bg-[#FAF3E0]/40 hover:border-[#6F4E37]/50 hover:bg-[#FAF3E0]/70"
                          }`}
                        >
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                              isActive
                                ? "bg-[#6F4E37] text-white"
                                : "bg-white border border-[#6F4E37]/20 text-[#6F4E37]"
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div
                              className={`font-extrabold text-sm ${
                                isActive ? "text-[#6F4E37]" : "text-[#2B2118]"
                              }`}
                            >
                              {pm.name}
                            </div>
                            <div className="text-[10px] text-[#6F4E37]/50 font-semibold uppercase tracking-wider">
                              {pm.type}
                            </div>
                          </div>
                          {isActive && (
                            <CheckCircle2 className="w-5 h-5 text-[#6F4E37] ml-auto" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Cash inputs */}
                  {selectedPMObj?.type === "Cash" && (
                    <div className="space-y-3">
                      <div>
                        <Label className="text-[11px] font-extrabold text-[#6F4E37]/60 uppercase tracking-wider">
                          Amount Received
                        </Label>
                        <Input
                          type="number"
                          autoFocus
                          placeholder={`Min ₹${roundedTotal}`}
                          value={cashReceived}
                          onChange={(e) => setCashReceived(e.target.value)}
                          className="mt-1 bg-[#FAF3E0] border-[#6F4E37]/20 text-[#2B2118] rounded-xl h-10 focus:border-[#6F4E37]"
                        />
                      </div>

                      {/* Quick tender buttons */}
                      <div>
                        <p className="text-[10px] text-[#6F4E37]/50 font-extrabold uppercase tracking-wider mb-1.5">
                          Quick Tender
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => setCashReceived(String(roundedTotal))}
                            className="px-3 py-1.5 rounded-xl bg-[#6F4E37] text-white text-xs font-extrabold border border-[#6F4E37] cursor-pointer hover:bg-[#5A3A1A] transition"
                          >
                            Exact ₹{roundedTotal}
                          </button>
                          {[100, 200, 500, 1000, 2000]
                            .filter((a) => a >= roundedTotal)
                            .slice(0, 4)
                            .map((a) => (
                              <button
                                key={a}
                                onClick={() => setCashReceived(String(a))}
                                className="px-3 py-1.5 rounded-xl bg-[#FAF3E0] text-[#6F4E37] text-xs font-extrabold border border-[#6F4E37]/30 cursor-pointer hover:bg-[#6F4E37]/10 transition"
                              >
                                ₹{a}
                              </button>
                            ))}
                        </div>
                      </div>

                      {/* Change due */}
                      {cashReceived && change >= 0 && (
                        <div className="flex justify-between items-center bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl">
                          <span className="text-xs font-extrabold text-emerald-700">
                            Change Due
                          </span>
                          <span className="text-sm font-black text-emerald-700">
                            ₹{change.toFixed(0)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Card inputs */}
                  {selectedPMObj?.type === "Card" && (
                    <div>
                      <Label className="text-[11px] font-extrabold text-[#6F4E37]/60 uppercase tracking-wider">
                        Transaction Reference
                      </Label>
                      <Input
                        placeholder="Enter reference / approval code"
                        value={cardRef}
                        onChange={(e) => setCardRef(e.target.value)}
                        className="mt-1 bg-[#FAF3E0] border-[#6F4E37]/20 text-[#2B2118] rounded-xl h-10 focus:border-[#6F4E37]"
                        autoFocus
                      />
                    </div>
                  )}

                  {/* UPI QR */}
                  {selectedPMObj?.type === "UPI" && selectedPMObj.upiId && (
                    <div className="flex flex-col items-center bg-[#FAF3E0]/60 border border-[#6F4E37]/15 rounded-2xl p-5 gap-3">
                      <QRCodeCanvas
                        value={`upi://pay?pa=${selectedPMObj.upiId}&am=${displayOrder.total}&cu=INR`}
                        size={130}
                        bgColor="#FAF3E0"
                        fgColor="#6F4E37"
                        includeMargin={false}
                        className="rounded-xl"
                      />
                      <div className="text-center">
                        <p className="text-xs font-extrabold text-[#6F4E37]">
                          {selectedPMObj.upiId}
                        </p>
                        <p className="text-[10px] text-[#6F4E37]/60 mt-0.5">
                          Scan & pay ₹{roundedTotal}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm button */}
                <div className="px-6 py-4 border-t border-[#6F4E37]/15">
                  <button
                    onClick={handlePay}
                    disabled={!selectedPM || displayOrder.total === 0}
                    className="w-full bg-[#6F4E37] hover:bg-[#5A3A1A] disabled:bg-[#6F4E37]/30 disabled:cursor-not-allowed text-white font-extrabold py-3.5 rounded-2xl text-sm uppercase tracking-widest transition-all duration-200 shadow-md shadow-[#6F4E37]/20 cursor-pointer"
                  >
                    Confirm & Complete — ₹{roundedTotal}
                  </button>
                </div>
              </>
            ) : (
              /* Success state */
              <div className="flex-1 flex flex-col items-center justify-center px-8 gap-5">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="w-9 h-9 text-emerald-600" />
                </div>
                <div className="text-center">
                  <h3 className="font-extrabold text-xl text-[#2B2118]">
                    Payment Successful!
                  </h3>
                  <p className="text-sm text-[#6F4E37]/70 mt-1 font-medium">
                    ₹{roundedTotal} collected via{" "}
                    {selectedPMObj?.name || "payment"}
                  </p>
                </div>

                {/* Actions */}
                <div className="w-full space-y-2">
                  <button
                    onClick={() => window.print()}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-[#6F4E37]/30 text-[#6F4E37] font-extrabold text-sm hover:bg-[#FAF3E0] transition cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    Print Receipt
                  </button>

                  {!emailOpen ? (
                    <button
                      onClick={() => setEmailOpen(true)}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-blue-200 text-blue-600 font-extrabold text-sm hover:bg-blue-50 transition cursor-pointer"
                    >
                      <Mail className="w-4 h-4" />
                      Email Receipt to Customer
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        type="email"
                        autoFocus
                        placeholder="customer@email.com"
                        value={emailVal || customer?.email || ""}
                        onChange={(e) => setEmailVal(e.target.value)}
                        className="flex-1 bg-[#FAF3E0] border-[#6F4E37]/20 rounded-xl"
                      />
                      <button
                        onClick={() => {
                          const to = emailVal || customer?.email;
                          if (!to) return toast.error("Enter email address");
                          onEmailReceipt?.(to);
                          setEmailOpen(false);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl text-sm cursor-pointer hover:bg-blue-700 transition"
                      >
                        Send
                      </button>
                    </div>
                  )}

                  <button
                    onClick={handleClose}
                    className="w-full py-3 rounded-2xl bg-[#6F4E37] text-white font-extrabold text-sm hover:bg-[#5A3A1A] transition shadow-md cursor-pointer"
                  >
                    New Order
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
