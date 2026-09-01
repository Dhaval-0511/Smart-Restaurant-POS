import { Outlet, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { toast } from "sonner";

export default function AdminLayout() {
  const userId = useStore((s) => s.currentUserId);
  const user = useStore((s) => s.users.find((u) => u.id === userId));

  useEffect(() => {
    if (userId && user && !user.canAccessAdmin) {
      toast.error("Access denied: Admin role required");
    }
  }, [userId, user]);

  if (!userId) return <Navigate to="/" replace />;
  if (user && !user.canAccessAdmin) {
    if (user.role === "KITCHEN_STAFF") return <Navigate to="/kds" replace />;
    return <Navigate to="/pos" replace />;
  }

  return <Outlet />;
}
