import { Link, useNavigate, useLocation } from "react-router-dom";
import { useStore } from "@/lib/store";
import { Coffee, Package, Tags, CreditCard, Ticket, BookOpen, UserCog, Monitor, BarChart3, LogOut, ArrowLeft, Warehouse } from "lucide-react";
import { Button } from "@/components/ui/button";

const items = [
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/categories", label: "Category", icon: Tags },
  { to: "/admin/inventory", label: "Inventory", icon: Warehouse },
  { to: "/admin/payment-methods", label: "Payment Method", icon: CreditCard },
  { to: "/admin/coupons", label: "Coupon & Promotion", icon: Ticket },
  { to: "/admin/booking", label: "Booking", icon: BookOpen },
  { to: "/admin/users", label: "User / Employee", icon: UserCog },
  { to: "/admin/reports", label: "Reports", icon: BarChart3 },
];

export function AdminShell({ children, title }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const logout = useStore((s) => s.logout);
  const userId = useStore((s) => s.currentUserId);
  const user = useStore((s) => s.users.find((u) => u.id === userId));

  // Role-based sidebar menu items filtering
  const navItems = items.filter((it) => {
    if (user?.role === "INVENTORY_MANAGER") {
      // Inventory manager sees Products, Categories, and Inventory
      return ["/admin/products", "/admin/categories", "/admin/inventory"].includes(it.to);
    }
    // SUPER_ADMIN, BRANCH_MANAGER, ADMIN see all
    return true;
  });

  return (
    <div className="min-h-screen flex bg-[#FAF3E0] text-[#2B2118] select-none">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-[#6F4E37]/15 flex flex-col shadow-sm">
        {/* Logo */}
        <div className="p-4 flex items-center justify-between border-b border-[#6F4E37]/15">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#6F4E37] flex items-center justify-center">
              <Coffee className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-extrabold tracking-tight text-[#2B2118] text-sm block">Cafe POS</span>
              <span className="text-[10px] text-[#6F4E37]/60 font-medium tracking-wider uppercase">Admin Panel</span>
            </div>
          </div>
        </div>

        {/* User Role Card in Sidebar */}
        <div className="mx-3 my-2 p-2.5 bg-[#FAF3E0]/70 rounded-xl border border-[#6F4E37]/15 flex flex-col">
          <span className="text-xs font-bold text-[#2B2118] truncate">{user?.name || "Admin"}</span>
          <span className="text-[10px] font-semibold text-[#6F4E37]">{user?.roleLabel || user?.role || "Administrator"}</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2.5 space-y-0.5">
          {navItems.map((it) => {
            const Icon = it.icon;
            const active = pathname === it.to;
            return (
              <Link
                key={it.to}
                to={it.to}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  active
                    ? "bg-[#6F4E37] text-white shadow-md shadow-[#6F4E37]/20"
                    : "text-[#2B2118]/70 hover:bg-[#FAF3E0] hover:text-[#6F4E37]"
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? "text-white" : "text-[#6F4E37]/70"}`} />
                {it.label}
              </Link>
            );
          })}
          {user?.canAccessKds && (
            <Link
              to="/kds"
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-[#2B2118]/70 hover:bg-[#FAF3E0] hover:text-[#6F4E37] transition-all"
            >
              <Monitor className="w-4 h-4 text-[#6F4E37]/70" /> KDS
            </Link>
          )}
        </nav>

        {/* Footer actions */}
        <div className="p-2.5 border-t border-[#6F4E37]/15 space-y-0.5">
          {user?.canAccessPos && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-[#6F4E37] hover:bg-[#FAF3E0] hover:text-[#6F4E37] font-semibold"
              onClick={() => navigate("/pos")}
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to POS
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 font-semibold"
            onClick={() => {
              logout();
              navigate("/login");
            }}
          >
            <LogOut className="w-4 h-4 mr-1.5" /> Log Out
          </Button>
        </div>
      </aside>

      {/* Main content area */}
      <main className="flex-1 p-8 overflow-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold tracking-tight text-[#2B2118]">{title}</h1>
          <div className="mt-1 h-0.5 w-12 bg-[#6F4E37] rounded-full" />
        </div>
        {children}
      </main>
    </div>
  );
}
