// A-2: Auth slice — login, logout, bootstrap, user status, low-stock alerts
import {
  authApi, categoryApi, productApi, paymentApi, floorApi,
  tableApi, couponApi, customerApi, sessionApi, kitchenApi,
  saveToken, clearToken,
} from "../api.js";
import socket from "../socket.js";
import { toast } from "sonner";
import {
  normaliseUser, normaliseProduct, normaliseTable,
  normaliseCoupon, normalisePayment, normaliseSession,
} from "../normalise.js";

const uid = () => Math.random().toString(36).slice(2, 10);

export const authSlice = (set, get) => ({
  // ── Auth state ─────────────────────────────────────────
  currentUserId: null,
  currentTableId: null,
  currentSessionId: null,
  lastClosedSession: null,
  authToken: null,

  // ── Meta ───────────────────────────────────────────────
  users: [],
  loading: false,
  bootstrapped: false,
  bootstrapedAt: null,   // F-4: timestamp for 5-min TTL re-fetch
  lowStockAlerts: [],

  setSearchQuery: (query) => set({ searchQuery: query }),
  dismissLowStockAlert: (ingredientId) =>
    set((s) => ({ lowStockAlerts: s.lowStockAlerts.filter((a) => a.ingredientId !== ingredientId) })),
  clearLowStockAlerts: () => set({ lowStockAlerts: [] }),

  // ── Bootstrap: load all reference data from DB ─────────
  // F-4: Re-fetches if data is older than 5 minutes (stale TTL)
  bootstrap: async () => {
    const isStale = !get().bootstrapedAt || (Date.now() - get().bootstrapedAt) > 5 * 60 * 1000;
    if (get().bootstrapped && !isStale) return;
    set({ loading: true });
    try {
      const [cats, prods, floors, tables, payments, coupons, customers, users] =
        await Promise.all([
          categoryApi.getAll().catch(() => []),
          productApi.getAll().catch(() => []),
          floorApi.getAll().catch(() => []),
          tableApi.getAll().catch(() => []),
          paymentApi.getAll().catch(() => []),
          couponApi.getAll().catch(() => []),
          customerApi.getAll().catch(() => []),
          authApi.getAllUsers().catch(() => []),
        ]);

      set({
        categories: Array.isArray(cats) ? cats : [],
        products: Array.isArray(prods) ? prods.map(normaliseProduct) : [],
        floors: Array.isArray(floors) ? floors : [],
        tables: Array.isArray(tables) ? tables.map(normaliseTable) : [],
        paymentMethods: Array.isArray(payments) ? payments.map(normalisePayment) : [],
        coupons: Array.isArray(coupons) ? (coupons.coupons ?? coupons).map(normaliseCoupon) : [],
        customers: Array.isArray(customers) ? customers : [],
        users: Array.isArray(users)
          ? users.map(normaliseUser)
          : (users.users ?? []).map(normaliseUser),
        bootstrapped: true,
        bootstrapedAt: Date.now(),  // F-4: timestamp for 5-min TTL
        loading: false,
      });

      // Ensure we have a valid active backend session synced on startup
      if (get().authToken) {
        try {
          const activeSess = await sessionApi.getOpenSession();
          if (activeSess && activeSess.id) {
            if (get().currentSessionId !== activeSess.id) {
              set({ currentSessionId: activeSess.id });
            }
          } else {
            // No open session on backend, let's open one
            await get().openSession();
          }
        } catch (err) {
          console.error("Session sync failed:", err);
          if (!get().currentSessionId) {
            const s = { id: uid(), openedAt: Date.now(), openingAmount: 0, employeeId: get().currentUserId };
            set((st) => ({ sessions: [...st.sessions, s], currentSessionId: s.id }));
          }
        }
      }

      // Fetch fresh KDS state on startup
      await get().fetchKds().catch((err) => console.error("KDS bootstrap fetch failed:", err));

      // Fetch fresh orders from backend
      await get().fetchOrders().catch((err) => console.error("Orders bootstrap fetch failed:", err));

      // Migrate legacy draft order numbers
      set((state) => ({
        orders: state.orders.map(o => {
          if (o.status === "Draft" && o.number && !o.number.startsWith("ORD-")) {
            const now = new Date(o.createdAt || Date.now());
            const d = String(now.getDate()).padStart(2, '0');
            const m = String(now.getMonth() + 1).padStart(2, '0');
            const y = now.getFullYear();
            return { ...o, number: `ORD-${d}${m}${y}${o.number.padStart(4, '0')}` };
          }
          return o;
        })
      }));

      // Connect real-time socket and setup listeners
      socket.connect();
      socket.off("kds:ticket-created");
      socket.off("kds:ticket-updated");
      socket.off("inventory:low-stock");

      socket.on("kds:ticket-created", () => {
        get().fetchKds().catch((err) => console.error("Real-time fetchKds failed:", err));
      });

      socket.on("kds:ticket-updated", () => {
        get().fetchKds().catch((err) => console.error("Real-time fetchKds failed:", err));
      });

      // ── Low-stock real-time alerts ──────────────────────
      socket.on("inventory:low-stock", (data) => {
        set((s) => ({
          lowStockAlerts: [
            // Replace existing alert for same ingredient or prepend new one
            { ...data, seenAt: Date.now() },
            ...s.lowStockAlerts.filter((a) => a.ingredientId !== data.ingredientId),
          ].slice(0, 20), // keep max 20 alerts
        }));
      });

      // ── Real-time ingredient stock updates ───────────────
      socket.off("inventory:updated");
      socket.on("inventory:updated", (data) => {
        // Update currentStock of the matching ingredient in state
        set((s) => ({
          ingredients: s.ingredients.map((ing) =>
            ing.id === data.ingredientId
              ? { ...ing, currentStock: data.currentStock }
              : ing
          ),
        }));
      });

      // ── Forced logout when admin deactivates this user ───
      socket.off("user:deactivated");
      socket.on("user:deactivated", ({ userId }) => {
        if (get().currentUserId === userId) {
          clearToken();
          set({
            currentUserId: null,
            currentTableId: null,
            currentSessionId: null,
            authToken: null,
            bootstrapped: false,
            bootstrapedAt: null,   // F-4: timestamp for 5-min TTL re-fetch
          });
          toast.error("Your account has been deactivated by an administrator. You have been logged out.", { duration: 6000 });
          setTimeout(() => { window.dispatchEvent(new CustomEvent('force-logout', { detail: { redirectTo: '/login' } })); }, 1500);
        }
      });

      // ── Single Active Session: forced logout when user logs in elsewhere ──
      socket.off("user:session-displaced");
      socket.on("user:session-displaced", ({ userId, activeSessionId, message }) => {
        const myId = get().currentUserId;
        if (myId !== userId) return; // Not for this user
        // Check if this tab's session is the new one (the tab that just logged in)
        let mySessionId = null;
        try { mySessionId = localStorage.getItem('cafe-session-id'); } catch (e) {}
        if (mySessionId === activeSessionId) return; // This IS the new login — stay logged in
        // This tab holds the old session — force logout
        clearToken();
        try { localStorage.removeItem('cafe-session-id'); } catch (e) {}
        set({
          currentUserId: null, currentTableId: null,
          currentSessionId: null, authToken: null, bootstrapped: false,
        });
        toast.error(message || "You were logged out because this account logged in from another browser or device.", { duration: 7000 });
        setTimeout(() => { window.dispatchEvent(new CustomEvent('force-logout', { detail: { redirectTo: '/login' } })); }, 1800);
      });
    } catch (e) {
      console.error("Bootstrap error:", e);
      set({ loading: false });
    }
  },

  // ── Auth ───────────────────────────────────────────────
  login: async (email, password, rememberMe = false) => {
    const result = await authApi.login(email, password, rememberMe);
    const user = normaliseUser(result.user ?? result);
    const token = result.token ?? result.accessToken ?? null;
    const sessionId = result.sessionId ?? null;
    if (token) {
      saveToken(token);
      set({ authToken: token });
    }
    // Store sessionId so we can detect displacement events
    if (sessionId) {
      try { localStorage.setItem('cafe-session-id', sessionId); } catch (e) {}
    }
    set({ currentUserId: user.id, users: [user] });
    set({ bootstrapped: false });
    // Broadcast login to other tabs in the same browser
    try {
      const ch = new BroadcastChannel('cafe_auth_channel');
      ch.postMessage({ type: 'AUTH_LOGIN', userId: user.id, role: user.role, token, sessionId });
      ch.close();
    } catch (e) {}
    await get().bootstrap();
    return user;
  },

  logout: () => {
    clearToken();
    try { localStorage.removeItem('cafe-session-id'); } catch (e) {}
    // Broadcast logout to all other open tabs in the same browser
    try {
      const ch = new BroadcastChannel('cafe_auth_channel');
      ch.postMessage({ type: 'AUTH_LOGOUT' });
      ch.close();
    } catch (e) {}
    set({
      currentUserId: null,
      currentTableId: null,
      currentSessionId: null,
      authToken: null,
      bootstrapped: false,
      bootstrapedAt: null,   // F-4: timestamp for 5-min TTL re-fetch
    });
  },
});
