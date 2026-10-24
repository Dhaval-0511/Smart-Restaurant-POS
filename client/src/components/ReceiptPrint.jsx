import React from "react";
import { QRCodeCanvas } from "qrcode.react";

export function ReceiptPrint({ order, customer, table, paymentMethodName, paymentRef, cashierName, products = [] }) {
  if (!order) return null;

  const orderLines = order.lines || [];
  const items = orderLines.map((l) => {
    const prod = products.find((p) => p.id === l.productId);
    return {
      name: prod?.name || "Item",
      qty: l.qty,
      price: l.unitPrice,
      total: l.qty * l.unitPrice,
    };
  });

  const subtotal = order.subtotal ?? items.reduce((s, i) => s + i.total, 0);
  const discountTotal = order.discountTotal ?? 0;
  const tax = order.tax ?? 0;
  const halfTax = tax / 2;
  const total = order.total ?? (subtotal - discountTotal + tax);

  const orderDate = order.createdAt ? new Date(order.createdAt) : new Date();
  const dateStr = orderDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const timeStr = orderDate.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const tableLabel = order.orderType === "TAKEAWAY"
    ? "🥡 Takeaway"
    : table?.number
    ? `Table ${table.number}`
    : "Dine-in";

  return (
    <div id="printable-receipt" className="hidden print:block print:w-[80mm] print:mx-auto print:p-2 text-black font-mono text-[11px] leading-tight bg-white">
      {/* Header */}
      <div className="text-center space-y-1 pb-2">
        <div className="text-2xl font-bold tracking-wider">☕ CAFE POS</div>
        <div className="text-[12px] font-semibold tracking-wide">Artisan Coffee & Kitchen</div>
        <div className="text-[10px] text-zinc-600">
          104 Heritage Boulevard, Ground Floor<br />
          Phone: +91 98765 43210<br />
          GSTIN: 27AABCS1429B1ZX
        </div>
      </div>

      <div className="border-t border-dashed border-black my-1.5" />

      {/* Metadata */}
      <div className="space-y-0.5 text-[10px]">
        <div className="flex justify-between">
          <span className="font-bold">Bill No:</span>
          <span>{order.number || "ORD-0001"}</span>
        </div>
        <div className="flex justify-between">
          <span>Date & Time:</span>
          <span>{dateStr}, {timeStr}</span>
        </div>
        <div className="flex justify-between">
          <span>Order Type:</span>
          <span className="font-bold">{tableLabel}</span>
        </div>
        {cashierName && (
          <div className="flex justify-between">
            <span>Cashier:</span>
            <span>{cashierName}</span>
          </div>
        )}
        {customer?.name && (
          <div className="flex justify-between">
            <span>Customer:</span>
            <span className="font-semibold">{customer.name} {customer.phone ? `(${customer.phone})` : ""}</span>
          </div>
        )}
      </div>

      <div className="border-t border-dashed border-black my-1.5" />

      {/* Items Table */}
      <table className="w-full text-[10px] text-left">
        <thead>
          <tr className="border-b border-dashed border-black">
            <th className="py-1">ITEM</th>
            <th className="py-1 text-center">QTY</th>
            <th className="py-1 text-right">RATE</th>
            <th className="py-1 text-right">AMOUNT</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, idx) => (
            <tr key={idx} className="border-b border-dotted border-zinc-300">
              <td className="py-1 font-medium pr-1">{it.name}</td>
              <td className="py-1 text-center">{it.qty}</td>
              <td className="py-1 text-right">₹{it.price.toFixed(2)}</td>
              <td className="py-1 text-right font-semibold">₹{it.total.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="border-t border-dashed border-black my-1.5" />

      {/* Totals */}
      <div className="space-y-0.5 text-[10.5px]">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>₹{subtotal.toFixed(2)}</span>
        </div>
        {discountTotal > 0 && (
          <div className="flex justify-between font-semibold">
            <span>Discount {order.discountLabel ? `(${order.discountLabel})` : ""}:</span>
            <span>-₹{discountTotal.toFixed(2)}</span>
          </div>
        )}
        {tax > 0 && (
          <>
            <div className="flex justify-between text-zinc-600 text-[10px]">
              <span>CGST (2.5%):</span>
              <span>₹{halfTax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-zinc-600 text-[10px]">
              <span>SGST (2.5%):</span>
              <span>₹{halfTax.toFixed(2)}</span>
            </div>
          </>
        )}
        <div className="border-t border-dashed border-black my-1" />
        <div className="flex justify-between text-sm font-black pt-0.5">
          <span>TOTAL AMOUNT:</span>
          <span>₹{Math.round(total).toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-[10px] pt-0.5">
          <span>Payment Mode:</span>
          <span className="font-bold uppercase">
            {paymentMethodName || "PAID"} {paymentRef ? `(Ref: ${paymentRef})` : ""}
          </span>
        </div>
      </div>

      <div className="border-t border-dashed border-black my-2" />

      {/* QR Code & Barcode */}
      <div className="flex flex-col items-center justify-center space-y-1.5 pt-1">
        <QRCodeCanvas value={`https://cafepos.in/bill/${order.number || order.id}`} size={70} />
        <div className="text-[9px] text-zinc-500">Scan for e-bill & feedback</div>

        {/* Faux barcode */}
        <div className="pt-1 font-mono text-[16px] tracking-[4px] select-none text-zinc-800">
          ||| | |||| | ||||| | |||
        </div>
        <div className="text-[8.5px] font-mono tracking-widest text-zinc-600">
          {order.number || "ORD-2026-0042"}
        </div>
      </div>

      {/* Footer message */}
      <div className="text-center pt-2 text-[10px] italic text-zinc-700">
        Thank you for visiting! Have a wonderful day. ☕
      </div>
    </div>
  );
}
