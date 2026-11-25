// A-2: Store combiner — thin wrapper that merges all slices into one Zustand store.
// Each slice lives in ./slices/; this file only wires them together.
// All existing imports `import { useStore } from "@/lib/store"` continue to work unchanged.
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authSlice } from "./slices/authSlice.js";
import { referenceSlice } from "./slices/referenceSlice.js";
import { orderSlice } from "./slices/orderSlice.js";
import { kdsSlice } from "./slices/kdsSlice.js";

// Re-export normalise helpers so any file that previously imported them from store still works
export {
  normaliseUser,
  normaliseProduct,
  normaliseTable,
  normaliseOrder,
  normaliseSession,
  normaliseCoupon,
  normalisePayment,
} from "./normalise.js";

export const useStore = create(
  persist(
    (...a) => ({
      ...authSlice(...a),
      ...referenceSlice(...a),
      ...orderSlice(...a),
      ...kdsSlice(...a),
    }),
    {
      name: "cafe-pos-v3",  // bumped version — clears old incompatible cache
      // A-5: Only persist auth + lightweight UI state.
      // orders/sessions/kds are excluded: they're large, go stale fast, and
      // exceed the 5MB localStorage cap under heavy use.
      partialize: (s) => ({
        currentUserId:     s.currentUserId,
        currentTableId:    s.currentTableId,
        currentSessionId:  s.currentSessionId,
        lastClosedSession: s.lastClosedSession,
        authToken:         s.authToken,
        draftOrderId:      s.draftOrderId,
        bootstrapedAt:     s.bootstrapedAt,
      }),
    }
  )
);
