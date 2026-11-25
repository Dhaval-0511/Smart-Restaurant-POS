// A-2: Reference data slice — floors, tables, payment methods, sessions, products, etc.
import { floorApi, tableApi, sessionApi } from "../api.js";
import { normaliseTable, normaliseSession } from "../normalise.js";

const uid = () => Math.random().toString(36).slice(2, 10);

export const referenceSlice = (set, get) => ({
  // ── Reference data ─────────────────────────────────────
  categories: [],
  products: [],
  paymentMethods: [],
  floors: [],
  tables: [],
  coupons: [],
  customers: [],
  sessions: [],
  searchQuery: "",
  isTakeaway: false,

  // ── Floors ─────────────────────────────────────────────
  upsertFloor: async (f) => {
    try {
      const saved = f.id ? await floorApi.update(f.id, f) : await floorApi.create(f);
      set((s) => ({
        floors: s.floors.some((x) => x.id === saved.id)
          ? s.floors.map((x) => (x.id === saved.id ? saved : x))
          : [...s.floors, saved],
      }));
    } catch (e) { console.error(e); }
  },
  // Sync-only: update local state without API call (used by admin booking page)
  syncFloor: (f) => set((s) => ({
    floors: s.floors.some((x) => x.id === f.id)
      ? s.floors.map((x) => (x.id === f.id ? f : x))
      : [...s.floors, f],
  })),
  deleteFloor: async (id) => {
    try {
      await floorApi.delete(id);
      set((s) => ({
        floors: s.floors.filter((x) => x.id !== id),
        tables: s.tables.filter((t) => t.floorId !== id),
      }));
    } catch (e) { console.error(e); }
  },
  syncDeleteFloor: (id) => set((s) => ({
    floors: s.floors.filter((x) => x.id !== id),
    tables: s.tables.filter((t) => t.floorId !== id),
  })),

  // ── Tables ─────────────────────────────────────────────
  upsertTable: async (t) => {
    try {
      const payload = {
        floorId: t.floorId,
        tableNumber: String(t.number),
        seats: t.seats,
        isActive: t.active,
      };
      const saved = t.id ? await tableApi.update(t.id, payload) : await tableApi.create(payload);
      const norm = normaliseTable(saved);
      set((s) => ({
        tables: s.tables.some((x) => x.id === norm.id)
          ? s.tables.map((x) => (x.id === norm.id ? norm : x))
          : [...s.tables, norm],
      }));
    } catch (e) { console.error(e); }
  },
  // Sync-only: update local state without API call (used by admin booking page)
  syncTable: (t) => set((s) => ({
    tables: s.tables.some((x) => x.id === t.id)
      ? s.tables.map((x) => (x.id === t.id ? t : x))
      : [...s.tables, t],
  })),
  deleteTable: async (id) => {
    try {
      await tableApi.delete(id);
      set((s) => ({ tables: s.tables.filter((x) => x.id !== id) }));
    } catch (e) { console.error(e); }
  },
  syncDeleteTable: (id) => set((s) => ({ tables: s.tables.filter((x) => x.id !== id) })),

  // ── Payment Methods ────────────────────────────────────
  syncPaymentMethod: (p) => set((s) => ({
    paymentMethods: s.paymentMethods.some((x) => x.id === p.id)
      ? s.paymentMethods.map((x) => (x.id === p.id ? p : x))
      : [...s.paymentMethods, p],
  })),
  syncDeletePaymentMethod: (id) => set((s) => ({
    paymentMethods: s.paymentMethods.filter((x) => x.id !== id),
  })),

  // ── Sessions ───────────────────────────────────────────
  openSession: async () => {
    const uid_ = get().currentUserId;
    if (!uid_) return;
    try {
      const sess = await sessionApi.open({ userId: uid_ });
      const norm = normaliseSession(sess);
      set((s) => ({
        sessions: [...s.sessions, norm],
        currentSessionId: norm.id,
      }));
    } catch {
      // fallback local session
      const s = { id: uid(), openedAt: Date.now(), openingAmount: 0, employeeId: uid_ };
      set((st) => ({ sessions: [...st.sessions, s], currentSessionId: s.id }));
    }
  },
  closeSession: async () => {
    const sid = get().currentSessionId;
    if (!sid) return;
    const total = get()
      .orders.filter((o) => o.sessionId === sid && o.status === "Paid")
      .reduce((s, o) => s + o.total, 0);
    try {
      await sessionApi.close(sid, { closingAmount: total });
    } catch { /* best effort */ }
    set((s) => ({
      sessions: s.sessions.map((x) =>
        x.id === sid ? { ...x, closedAt: Date.now(), closingAmount: total } : x
      ),
      currentSessionId: null,
      lastClosedSession: { date: Date.now(), amount: total },
    }));
  },

  // ── Tables (UI only state) ─────────────────────────────
  setCurrentTable: (id) => set({ currentTableId: id }),
  setTakeawayMode: (val) => set({ isTakeaway: val }),
});
