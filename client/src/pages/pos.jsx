import { Outlet, Navigate } from "react-router-dom";
import { useStore } from "@/lib/store";
import { PosHeader } from "@/components/PosHeader";

export default function PosLayout() {
  const userId = useStore((s) => s.currentUserId);
  const user = useStore((s) => s.users.find((u) => u.id === userId));

  if (!userId) return <Navigate to="/" />;

  if (user && !user.canAccessPos) {
    if (user.role === "KITCHEN_STAFF") return <Navigate to="/kds" replace />;
    if (user.role === "INVENTORY_MANAGER") return <Navigate to="/admin/products" replace />;
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF3E0] text-[#6F4E37] select-none" style={{ fontFamily: '"Inter", sans-serif' }}>
      <PosHeader />
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
