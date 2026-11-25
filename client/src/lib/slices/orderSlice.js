// A-2: Order slice — draft orders, cart operations, payment, kitchen sync
import { orderApi, sessionApi } from "../api.js";

const uid = () => Math.random().toString(36).slice(2, 10);

export const orderSlice = (set, get) => ({
  // ── Order state ────────────────────────────────────────
  orders: [],
  draftOrderId: null,

  // ── Orders (local for now, sync on pay) ───────────────
  createDraftOrder: (tableId, customerId = null, orderType = 'DINE_IN') => {
    const id = uid();
    const now = new Date();
    const d = String(now.getDate()).padStart(2, '0');
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const y = now.getFullYear();
    const sequence = String(get().orders.length + 1).padStart(4, "0");
    const number = `ORD-${d}${m}${y}${sequence}`;
    const o = {
      id, number, tableId, customerId,
      orderType,
      lines: [], subtotal: 0, tax: 0,
      discountTotal: 0, total: 0,
      isLocal: true,   // F-2: marks this as a local draft (not yet in DB)
      status: "Draft",
      createdAt: Date.now(),
      employeeId: get().currentUserId ?? undefined,
      sessionId: get().currentSessionId ?? undefined,
    };
    set({ orders: [o, ...get().orders], draftOrderId: id });
    return id;
  },
  setDraftOrder: (id) => set({ draftOrderId: id }),
  updateOrder: (id, patch) =>
    set((s) => ({ orders: s.orders.map((o) => (o.id === id ? { ...o, ...patch } : o)) })),
  deleteOrder: (id) =>
    set((s) => ({
      orders: s.orders.filter((o) => o.id !== id),
      draftOrderId: s.draftOrderId === id ? null : s.draftOrderId,
    })),

  addLine: (orderId, productId) => {
    // Guard: never mutate a cancelled order
    const targetOrder = get().orders.find((x) => x.id === orderId);
    if (!targetOrder || targetOrder.status === 'Cancelled') return;

    const p = get().products.find((x) => x.id === productId);
    if (!p) return;
    set((s) => ({
      orders: s.orders.map((o) => {
        if (o.id !== orderId) return o;
        const ex = o.lines.find((l) => l.productId === productId);
        const lines = ex
          ? o.lines.map((l) => (l.productId === productId ? { ...l, qty: l.qty + 1 } : l))
          : [...o.lines, { productId, qty: 1, unitPrice: p.price }];
        return { ...o, lines };
      }),
    }));
    get().recalcOrder(orderId);
  },

  setLineQty: (orderId, productId, qty) => {
    // Guard: never mutate a cancelled order
    const targetOrder = get().orders.find((x) => x.id === orderId);
    if (!targetOrder || targetOrder.status === 'Cancelled') return;

    set((s) => ({
      orders: s.orders.map((o) => {
        if (o.id !== orderId) return o;
        const lines =
          qty <= 0
            ? o.lines.filter((l) => l.productId !== productId)
            : o.lines.map((l) => (l.productId === productId ? { ...l, qty } : l));
        return { ...o, lines };
      }),
    }));
    get().recalcOrder(orderId);
  },
  removeLine: (orderId, productId) => get().setLineQty(orderId, productId, 0),

  recalcOrder: (orderId, couponCode, autoPromoId) => {
    const s = get();
    const o = s.orders.find((x) => x.id === orderId);
    if (!o) return;
    const products = s.products;

    // ── Step 1: evaluate product-level promotions ─────────────
    // Find all active PRODUCT promotions
    const productPromos = s.coupons.filter(
      (c) => c.active && c.type === "Promotion" && c.apply === "Product"
    );

    let subtotal = 0;
    let tax = 0;
    let productDiscountTotal = 0;

    const newLines = o.lines.map((l) => {
      const p = products.find((x) => x.id === l.productId);
      if (!p) return l;
      const lineGross = l.qty * l.unitPrice;
      subtotal += lineGross;
      tax += (lineGross * p.tax) / 100;

      // Check if any product-level promo matches this line
      const matchedPromo = productPromos.find(
        (c) => c.productId === l.productId && l.qty >= (c.minQty ?? 1)
      );

      if (matchedPromo) {
        const discAmt =
          matchedPromo.discountKind === "percent"
            ? (lineGross * matchedPromo.discountValue) / 100
            : Math.min(matchedPromo.discountValue, lineGross);
        productDiscountTotal += discAmt;
        return {
          ...l,
          productDiscount: {
            label:
              matchedPromo.discountKind === "percent"
                ? `${matchedPromo.discountValue}% off on ₹${lineGross.toFixed(0)}`
                : `₹${matchedPromo.discountValue} off on ₹${lineGross.toFixed(0)}`,
            amount: discAmt,
            promoId: matchedPromo.id,
          },
        };
      }
      // Clear stale productDiscount if promo no longer matches
      return { ...l, productDiscount: undefined };
    });

    // ── Step 2: evaluate order-level discount ──────────────────
    const baseForOrderDisc = subtotal;
    let orderDiscount = 0;
    let discountLabel;
    let appliedPromoId = null;

    const applyDisc = (kind, val, label, promoId = null) => {
      const amt = kind === "percent" ? (baseForOrderDisc * val) / 100 : val;
      orderDiscount = amt;
      discountLabel = label;
      appliedPromoId = promoId;
    };

    if (couponCode) {
      // Manual coupon code entry
      const c = s.coupons.find(
        (x) => x.active && x.type === "Coupon" && x.code?.toUpperCase() === couponCode.toUpperCase()
      );
      if (c) {
        applyDisc(
          c.discountKind,
          c.discountValue,
          `${c.code} (${c.discountKind === "percent" ? c.discountValue + "%" : "₹" + c.discountValue})`,
          c.id
        );
      }
    } else if (autoPromoId) {
      // Manually selected promo from the popup
      const c = s.coupons.find((x) => x.id === autoPromoId && x.active);
      if (c) applyDisc(c.discountKind, c.discountValue, `${c.name}`, c.id);
    } else {
      // Auto-evaluate Order-level promotions
      const validPromos = s.coupons.filter(
        (c) => c.active && c.type === "Promotion" && c.apply === "Order" && (c.minOrderAmount ?? 0) <= baseForOrderDisc
      );

      if (validPromos.length > 0) {
        // Pick highest discount
        const best = validPromos.reduce((prev, curr) => {
          const pAmt = prev.discountKind === "percent" ? (baseForOrderDisc * prev.discountValue) / 100 : prev.discountValue;
          const cAmt = curr.discountKind === "percent" ? (baseForOrderDisc * curr.discountValue) / 100 : curr.discountValue;
          return cAmt > pAmt ? curr : prev;
        });
        applyDisc(best.discountKind, best.discountValue, best.name, best.id);
      }
    }

    const discountTotal = productDiscountTotal + orderDiscount;
    // F-3: round all money values to 2 decimal places to prevent float drift
    const r2 = (n) => Math.round(n * 100) / 100;
    const total = r2(r2(subtotal) + r2(tax) - r2(discountTotal));
    set((st) => ({
      orders: st.orders.map((x) =>
        x.id === orderId
          ? {
              ...x,
              lines: newLines,
              subtotal:      r2(subtotal),
              tax:           r2(tax),
              discountTotal: r2(discountTotal),
              discountLabel,
              appliedCoupon: couponCode || null,
              appliedPromoId,
              total,
            }
          : x
      ),
    }));
  },

  sendOrderToKitchen: async (orderId) => {
    const s = get();
    const o = s.orders.find((x) => x.id === orderId);
    if (!o || !o.lines.length) return;

    let sessionId = get().currentSessionId;
    if (!sessionId) {
      throw new Error("No active session. Please log out and log in again.");
    }

    // Determine if this is a re-send to an existing DB order
    const isDbOrder = orderId.length > 15; // UUID = 36 chars; local uid = 8 chars

    // Calculate delta: lines added since the last kitchen send
    const lastSentLines = o.lastSentLines || []; // array of { productId, qty }
    const deltaLines = o.lines.filter((l) => {
      const prevLine = lastSentLines.find((ls) => ls.productId === l.productId);
      // Include if new product OR quantity increased
      if (!prevLine) return true;
      if (l.qty > prevLine.qty) return true;
      return false;
    }).map((l) => {
      const prevLine = lastSentLines.find((ls) => ls.productId === l.productId);
      const deltaQty = prevLine ? l.qty - prevLine.qty : l.qty;
      return { ...l, qty: deltaQty };
    });

    if (deltaLines.length === 0) {
      // Nothing new to send — just mark as sent
      set((state) => ({
        orders: state.orders.map((ord) =>
          ord.id === orderId
            ? { ...ord, sentToKitchen: true, lastSentLines: o.lines.map((l) => ({ productId: l.productId, qty: l.qty })) }
            : ord
        ),
      }));
      return;
    }

    try {
      if (isDbOrder) {
        // ── Re-send: append only new/changed items to the existing order ──
        await orderApi.appendItems(orderId, deltaLines.map((l) => ({
          productId: l.productId,
          quantity: l.qty,
          unitPrice: l.unitPrice,
        })));

        // Mark sent and update lastSentLines snapshot
        set((state) => ({
          orders: state.orders.map((ord) =>
            ord.id === orderId
              ? {
                  ...ord,
                  sentToKitchen: true,
                  lastSentLines: o.lines.map((l) => ({ productId: l.productId, qty: l.qty })),
                }
              : ord
          ),
        }));
      } else {
        // ── First send: create a new DB order ──
        let savedOrder;
        try {
          savedOrder = await orderApi.create({
            sessionId,
            tableId: o.tableId || null,
            customerId: o.customerId,
            employeeId: o.employeeId ?? get().currentUserId,
            orderType: o.orderType || 'DINE_IN',
            items: o.lines.map((l) => ({ productId: l.productId, quantity: l.qty, unitPrice: l.unitPrice })),
          });
        } catch (firstErr) {
          // Self-healing session recovery
          if (firstErr.message?.toLowerCase().includes("session")) {
            console.warn("Session error during order creation, attempting session recovery...");
            const activeSess = await sessionApi.getOpenSession().catch(() => null);
            let newSessionId = activeSess?.id;
            if (!newSessionId) {
              const sess = await sessionApi.open({ userId: get().currentUserId }).catch(() => null);
              newSessionId = sess?.id;
            }
            if (newSessionId) {
              sessionId = newSessionId;
              set({ currentSessionId: newSessionId });
              savedOrder = await orderApi.create({
                sessionId: newSessionId,
                tableId: o.tableId || null,
                customerId: o.customerId,
                employeeId: o.employeeId ?? get().currentUserId,
                orderType: o.orderType || 'DINE_IN',
                items: o.lines.map((l) => ({ productId: l.productId, quantity: l.qty, unitPrice: l.unitPrice })),
              });
            } else {
              throw firstErr;
            }
          } else {
            throw firstErr;
          }
        }

        // Replace local draft ID with the real DB ID and record lastSentLines
        set((state) => ({
          orders: state.orders.map((ord) =>
            ord.id === orderId
              ? {
                  ...ord,
                  id: savedOrder.id,
                  number: savedOrder.orderNumber,
                  sessionId,
                  sentToKitchen: true,
                  lastSentLines: o.lines.map((l) => ({ productId: l.productId, qty: l.qty })),
                }
              : ord
          ),
          draftOrderId: state.draftOrderId === orderId ? savedOrder.id : state.draftOrderId,
        }));
      }

      // Fetch fresh KDS state
      await get().fetchKds();
    } catch (err) {
      console.error("sendOrderToKitchen failed:", err);
      throw new Error(err.message || "Failed to send order to kitchen");
    }
  },

  payOrder: async (orderId, paymentMethodId, amountPaid, ref) => {
    const o = get().orders.find((x) => x.id === orderId);
    if (!o) return;
    // Mark paid locally immediately (optimistic update)
    get().updateOrder(orderId, { status: "Paid", paymentMethodId, amountPaid, paymentRef: ref });
    try {
      // A-7 fix: determine if this order already exists in DB or is a local draft
      // isLocal flag is set on drafts created by createDraftOrder; fall back to length heuristic
      const isLocal = o.isLocal ?? (orderId.length <= 15);
      if (!isLocal) {
        // ── Existing DB order: just update its status + payment details ──
        await orderApi.update(orderId, { status: "PAID", paymentMethod: paymentMethodId, paymentReference: ref });
      } else {
        // ── Local draft: create on server as DRAFT, then mark PAID ───────
        const sessionId = o.sessionId ?? get().currentSessionId;
        if (sessionId) {
          const created = await orderApi.create({
            sessionId,
            tableId:    o.tableId,
            employeeId: o.employeeId ?? get().currentUserId,
            orderType:  o.orderType ?? 'DINE_IN',
            items: o.lines.map((l) => ({ productId: l.productId, quantity: l.qty, unitPrice: l.unitPrice })),
          });
          // Now mark it PAID with payment details so they are persisted
          if (created?.id) {
            await orderApi.update(created.id, {
              status:           "PAID",
              paymentMethod:    paymentMethodId,
              paymentReference: ref,
            });
          }
        }
      }
    } catch (err) {
      console.error("Failed to sync payment to server:", err);
    }
  },

  fetchOrders: async () => {
    const sid = get().currentSessionId;
    if (!sid) return;
    try {
      const res = await orderApi.getBySession(sid);
      const raw = Array.isArray(res) ? res : [];

      const dbOrders = raw.map(o => ({
        id: o.id,
        number: o.orderNumber,
        sessionId: o.sessionId,
        tableId: o.tableId,
        customerId: o.customerId,
        employeeId: o.employeeId,
        status: o.status === "PAID" ? "Paid" : o.status === "CANCELLED" ? "Cancelled" : "Draft",
        subtotal: parseFloat(o.subtotal) || 0,
        tax: parseFloat(o.taxAmount) || 0,
        discountTotal: parseFloat(o.discountAmount) || 0,
        total: parseFloat(o.total) || 0,
        createdAt: o.createdAt ? new Date(o.createdAt).getTime() : Date.now(),
        sentToKitchen: o.kitchenOrders && o.kitchenOrders.length > 0,
        orderType: o.orderType || 'DINE_IN',
        lines: (o.orderItems || []).map(item => ({
          productId: item.productId,
          qty: parseFloat(item.quantity) || 1,
          unitPrice: parseFloat(item.unitPrice) || 0,
          productDiscount: item.promotionId ? { promoId: item.promotionId } : undefined
        }))
      }));

      set(st => {
        const merged = [...st.orders];
        dbOrders.forEach(dbo => {
          const idx = merged.findIndex(mo => mo.id === dbo.id);
          if (idx === -1) {
            merged.push(dbo);
          } else {
            if (dbo.status !== "Draft" || merged[idx].status === "Draft") {
              merged[idx] = { ...merged[idx], ...dbo };
            }
          }
        });
        return { orders: merged };
      });
    } catch (e) {
      console.error("fetchOrders error", e);
    }
  },
});
