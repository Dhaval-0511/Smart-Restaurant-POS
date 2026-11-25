// A-2: KDS slice — kitchen display system state and actions
import { kitchenApi } from "../api.js";

export const kdsSlice = (set, get) => ({
  // ── KDS state ──────────────────────────────────────────
  kds: [],

  fetchKds: async (date = null) => {
    try {
      const orders = await kitchenApi.getAll(date);
      const groups = {};

      for (const item of orders) {
        if (!groups[item.orderId]) {
          groups[item.orderId] = {
            id: item.orderId,
            orderId: item.orderId,
            orderNumber: item.order?.orderNumber || '',
            orderType: item.order?.orderType || 'DINE_IN',
            tableId: item.order?.tableId || null,
            items: [],
            stage: 'ToCook',
            createdAt: new Date(item.createdAt).getTime(),
            rawItems: [],
          };
        }
        groups[item.orderId].items.push({
          kitchenOrderId: item.id,
          productId: item.productId,
          qty: Number(item.orderItem?.quantity || 1),
          done: item.isItemCompleted || item.status === 'COMPLETED',
        });
        groups[item.orderId].rawItems.push(item);
      }

      const ticketList = Object.values(groups).map((group) => {
        const statuses = group.rawItems.map((i) => i.status);
        let stage = 'ToCook';
        if (statuses.every((s) => s === 'COMPLETED')) {
          stage = 'Completed';
        } else if (statuses.some((s) => s === 'PREPARING' || s === 'COMPLETED')) {
          stage = 'Preparing';
        } else {
          stage = 'ToCook';
        }
        group.stage = stage;
        delete group.rawItems;
        return group;
      });

      ticketList.sort((a, b) => b.createdAt - a.createdAt);
      set({ kds: ticketList });
    } catch (e) {
      console.error("fetchKds error:", e);
    }
  },

  setKdsStage: async (ticketId, stage) => {
    const ticket = get().kds.find((k) => k.id === ticketId);
    if (!ticket) return;

    // Guard: a Completed ticket cannot be moved anywhere — it's done
    if (ticket.stage === 'Completed') return;

    // Optimistically update local stage
    set((s) => ({
      kds: s.kds.map((k) => (k.id === ticketId ? { ...k, stage } : k)),
    }));

    try {
      const mapStageToDbStatus = (stg) => {
        if (stg === 'ToCook') return 'TO_COOK';
        if (stg === 'Preparing') return 'PREPARING';
        if (stg === 'Completed') return 'COMPLETED';
        return 'TO_COOK';
      };
      const dbStatus = mapStageToDbStatus(stage);
      // For all items in the ticket, update their status on the backend sequentially
      for (const item of ticket.items) {
        await kitchenApi.updateStatus(item.kitchenOrderId, dbStatus);
      }
      await get().fetchKds();
    } catch (err) {
      console.error("setKdsStage failed:", err);
    }
  },

  toggleKdsItem: async (ticketId, productId) => {
    const ticket = get().kds.find((k) => k.id === ticketId);
    if (!ticket) return;

    // Guard: if the whole ticket is already Completed, items cannot be un-ticked
    if (ticket.stage === 'Completed') return;

    const item = ticket.items.find((i) => i.productId === productId);
    if (!item) return;

    const nextDone = !item.done;

    // Optimistically update local item state
    set((s) => ({
      kds: s.kds.map((k) =>
        k.id === ticketId
          ? { ...k, items: k.items.map((i) => (i.productId === productId ? { ...i, done: nextDone } : i)) }
          : k
      ),
    }));

    try {
      if (nextDone) {
        await kitchenApi.complete(item.kitchenOrderId);
      } else {
        // Un-ticking an item — revert to the ticket's current stage, never to COMPLETED
        const mapStageToDbStatus = (stg) => {
          if (stg === 'ToCook') return 'TO_COOK';
          if (stg === 'Preparing') return 'PREPARING';
          return 'TO_COOK'; // fallback — never re-send as COMPLETED
        };
        const dbStatus = mapStageToDbStatus(ticket.stage);
        await kitchenApi.updateStatus(item.kitchenOrderId, dbStatus);
      }
      await get().fetchKds();
    } catch (err) {
      console.error("toggleKdsItem failed:", err);
    }
  },
});
