import { Link, useNavigate, Navigate } from "react-router-dom";
import { useState, useEffect, useCallback, useRef } from "react";
import { useStore } from "@/lib/store";
import { kitchenApi } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Coffee, Search, X, Clock, LogOut,
  LayoutDashboard, CalendarDays, ChevronLeft, ChevronRight,
  CheckCircle2, ChefHat, Flame,
} from "lucide-react";

// ── Ticket timer ──────────────────────────────────────────────────────────────
const TicketTimer = ({ createdAt, stage }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (stage === "Completed") return;
    const calc = () => Math.floor((Date.now() - createdAt) / 1000);
    setElapsed(calc());
    const iv = setInterval(() => setElapsed(calc()), 1000);
    return () => clearInterval(iv);
  }, [createdAt, stage]);

  if (stage === "Completed") {
    return (
      <span className="text-[11px] font-bold text-zinc-400 flex items-center gap-1">
        <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Done
      </span>
    );
  }

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const isUrgent = mins >= 15;
  const isWarning = mins >= 10;
  const color = isUrgent ? "text-rose-500" : isWarning ? "text-amber-500" : "text-[#6F4E37]/80";

  return (
    <span className={`text-[11px] font-bold flex items-center gap-1 ${color} ${isUrgent ? "animate-pulse" : ""}`}>
      <Clock className="w-3 h-3" />
      {mins}:{secs.toString().padStart(2, "0")}
      {isUrgent && <span className="text-[10px]"> ⚠️</span>}
    </span>
  );
};

// ── Date Picker for Admin/Manager ─────────────────────────────────────────────
const DatePicker = ({ selectedDate, onChange }) => {
  const today = new Date().toISOString().split("T")[0];

  const shift = (days) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    onChange(d.toISOString().split("T")[0]);
  };

  const isToday = selectedDate === today;

  return (
    <div className="flex items-center gap-1.5 bg-[#FAF3E0] border border-[#6F4E37]/20 rounded-2xl p-1.5">
      <button
        onClick={() => shift(-1)}
        className="p-1.5 rounded-xl hover:bg-white text-[#6F4E37]/70 hover:text-[#6F4E37] transition cursor-pointer"
        title="Previous day"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <div className="flex items-center gap-2 px-2">
        <CalendarDays className="w-4 h-4 text-[#6F4E37]/70" />
        <input
          type="date"
          value={selectedDate}
          max={today}
          onChange={(e) => onChange(e.target.value)}
          className="bg-transparent text-sm font-bold text-[#2B2118] border-none outline-none cursor-pointer"
        />
      </div>
      <button
        onClick={() => shift(1)}
        disabled={isToday}
        className="p-1.5 rounded-xl hover:bg-white text-[#6F4E37]/70 hover:text-[#6F4E37] transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
        title="Next day"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
      {!isToday && (
        <button
          onClick={() => onChange(today)}
          className="px-2.5 py-1 rounded-xl bg-[#6F4E37] text-white text-xs font-bold cursor-pointer hover:bg-[#5A3A1A] transition"
        >
          Today
        </button>
      )}
    </div>
  );
};

// ── Stage config ──────────────────────────────────────────────────────────────
const STAGES = [
  { key: "all",       label: "All",       color: "" },
  { key: "ToCook",    label: "To Cook",   color: "text-rose-600" },
  { key: "Preparing", label: "Preparing", color: "text-amber-600" },
  { key: "Completed", label: "Completed", color: "text-emerald-600" },
];

const NEXT = { ToCook: "Preparing", Preparing: "Completed", Completed: null };

const STAGE_BORDER = {
  ToCook:    "border-rose-400/60",
  Preparing: "border-amber-400/60",
  Completed: "border-emerald-400/60",
};

const STAGE_HEADER_BG = {
  ToCook:    "bg-rose-50",
  Preparing: "bg-amber-50",
  Completed: "bg-emerald-50",
};

// ── Main KDS Page ─────────────────────────────────────────────────────────────
export default function KDSPage() {
  const navigate   = useNavigate();
  const userId     = useStore((s) => s.currentUserId);
  const user       = useStore((s) => s.users.find((u) => u.id === userId));
  const logout     = useStore((s) => s.logout);
  const tickets    = useStore((s) => s.kds);
  const products   = useStore((s) => s.products);
  const categories = useStore((s) => s.categories);
  const setStage   = useStore((s) => s.setKdsStage);
  const toggleItem = useStore((s) => s.toggleKdsItem);
  const fetchKds   = useStore((s) => s.fetchKds);

  const today = new Date().toISOString().split("T")[0];

  // Roles that can browse historical dates
  const canPickDate = ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER"].includes(user?.role);
  const isViewOnly  = user?.role === "CASHIER";
  // Past date = all ticket controls read-only
  const [selectedDate, setSelectedDate] = useState(today);
  const isPastDate = selectedDate !== today;
  const isReadOnly = isViewOnly || isPastDate;

  const [tab,       setTab]       = useState("all");
  const [q,         setQ]         = useState("");
  const [prodFilter,setProdFilter]= useState([]);
  const [catFilter, setCatFilter] = useState([]);

  // Stats for header bar
  const [stats, setStats] = useState({ total: 0, pending: 0, preparing: 0, completed: 0 });

  const loadStats = useCallback(async (date) => {
    try {
      const s = await kitchenApi.getStats(date);
      setStats(s);
    } catch { /* silent */ }
  }, []);

  // Fetch tickets + stats whenever selectedDate changes
  useEffect(() => {
    fetchKds(selectedDate);
    loadStats(selectedDate);
  }, [selectedDate, fetchKds, loadStats]);

  // Auto-poll every 5 s for TODAY only (no point polling past dates)
  useEffect(() => {
    if (isPastDate) return;
    const iv = setInterval(() => {
      fetchKds(selectedDate);
      loadStats(selectedDate);
    }, 5000);
    return () => clearInterval(iv);
  }, [isPastDate, selectedDate, fetchKds, loadStats]);

  if (!userId) return <Navigate to="/" replace />;

  const counts = {
    all:       tickets.length,
    ToCook:    tickets.filter((t) => t.stage === "ToCook").length,
    Preparing: tickets.filter((t) => t.stage === "Preparing").length,
    Completed: tickets.filter((t) => t.stage === "Completed").length,
  };

  let filtered = tab === "all" ? tickets : tickets.filter((t) => t.stage === tab);
  if (q) filtered = filtered.filter((t) => t.orderNumber?.includes(q));

  const hasProdFilter = prodFilter.length > 0;
  const hasCatFilter  = catFilter.length > 0;
  if (hasProdFilter || hasCatFilter) {
    filtered = filtered.filter((t) =>
      t.items.some((i) => {
        const matchProd = hasProdFilter && prodFilter.includes(i.productId);
        const p = products.find((x) => x.id === i.productId);
        const matchCat  = hasCatFilter && p && catFilter.includes(p.categoryId);
        return matchProd || matchCat;
      })
    );
  }

  const toggleArr = (arr, v, set) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <div className="min-h-screen bg-[#FAF3E0] text-[#2B2118]">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="border-b border-[#6F4E37]/30 px-5 py-3.5 flex items-center justify-between gap-4 bg-white shadow-sm flex-wrap">
        {/* Left: nav + title */}
        <div className="flex items-center gap-3">
          {user?.canAccessPos && (
            <Link to="/pos"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition cursor-pointer bg-[#6F4E37] text-white hover:bg-[#6F4E37]/90 shadow-md shrink-0">
              <ArrowLeft className="w-4 h-4" /><span>POS</span>
            </Link>
          )}
          {user?.canAccessAdmin && !user?.canAccessPos && (
            <Link to="/admin/reports"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition cursor-pointer bg-[#6F4E37] text-white hover:bg-[#6F4E37]/90 shadow-md shrink-0">
              <LayoutDashboard className="w-4 h-4" /><span>Admin</span>
            </Link>
          )}
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#6F4E37] flex items-center justify-center shadow">
              <ChefHat className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg text-[#2B2118] leading-none tracking-tight">Kitchen Display</h1>
              {isPastDate
                ? <p className="text-[11px] text-amber-600 font-bold">📅 Viewing: {selectedDate} (Read-Only)</p>
                : <p className="text-[11px] text-[#6F4E37]/60 font-medium">Live — Today's Orders</p>
              }
            </div>
          </div>
        </div>

        {/* Center: Live Stats Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { label: "Total", value: stats.total,     bg: "bg-zinc-100",    text: "text-zinc-700" },
            { label: "To Cook", value: stats.pending,  bg: "bg-rose-100",    text: "text-rose-700" },
            { label: "Cooking", value: stats.preparing,bg: "bg-amber-100",   text: "text-amber-700" },
            { label: "Done",  value: stats.completed,  bg: "bg-emerald-100", text: "text-emerald-700" },
          ].map(({ label, value, bg, text }) => (
            <div key={label} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${bg} ${text} font-extrabold text-xs`}>
              <span>{label}</span>
              <span className="text-base leading-none">{value}</span>
            </div>
          ))}
        </div>

        {/* Right: Date picker (admin only) + stage tabs + search + user + logout */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Date picker — only for admin/manager */}
          {canPickDate && (
            <DatePicker selectedDate={selectedDate} onChange={(d) => { setSelectedDate(d); }} />
          )}

          {/* View-Only Banner */}
          {isViewOnly && (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              View-Only
            </div>
          )}

          {/* Stage Filter Pills */}
          <div className="flex gap-1 bg-[#FAF3E0] p-1 rounded-2xl">
            {STAGES.map((s) => {
              const isSelected = tab === s.key;
              return (
                <button key={s.key} onClick={() => setTab(s.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? "bg-white text-[#6F4E37] shadow-sm ring-1 ring-black/5"
                      : "text-[#6F4E37]/60 hover:text-[#6F4E37] hover:bg-white/50"
                  }`}>
                  {s.label}
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isSelected ? "bg-[#6F4E37]/10 text-[#6F4E37]" : "bg-[#6F4E37]/5 text-[#6F4E37]/50"
                  }`}>{counts[s.key]}</span>
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="relative w-44">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <Input placeholder="Search #..." value={q} onChange={(e) => setQ(e.target.value)}
              className="pl-8 h-9 bg-zinc-50 border-[#6F4E37]/20 rounded-xl text-sm" />
          </div>

          {/* User + Logout */}
          <div className="hidden md:flex flex-col items-end">
            <span className="text-xs font-bold text-[#2B2118]">{user?.name || "Staff"}</span>
            <span className="text-[10px] text-[#6F4E37]/70 font-semibold px-2 py-0.5 bg-[#FAF3E0] rounded-full">
              {user?.roleLabel || user?.role}
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}
            className="text-rose-600 border-rose-200 hover:bg-rose-50 rounded-xl h-9 px-3 cursor-pointer text-xs font-bold">
            <LogOut className="w-3.5 h-3.5 mr-1" />Logout
          </Button>
        </div>
      </header>

      {/* ── Body: Sidebar + Ticket Grid ─────────────────────────────────────── */}
      <div className="flex">
        {/* Sidebar filters */}
        <aside className="w-52 border-r border-[#6F4E37]/20 p-3 space-y-4 min-h-[calc(100vh-3.8rem)] bg-white text-[#2B2118] shrink-0">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase text-[#6F4E37]/80">Product</h3>
              {prodFilter.length > 0 && (
                <button onClick={() => setProdFilter([])} className="text-xs text-[#6F4E37]/60 hover:text-red-500 cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
              {products.map((p) => (
                <label key={p.id} className="flex items-center gap-2 text-xs cursor-pointer text-[#2B2118]/80 hover:text-[#6F4E37] font-medium py-0.5">
                  <input type="checkbox" checked={prodFilter.includes(p.id)}
                    onChange={() => toggleArr(prodFilter, p.id, setProdFilter)}
                    className="rounded text-[#6F4E37] border-[#6F4E37]/30 focus:ring-[#6F4E37]/30 w-3.5 h-3.5" />
                  {p.name}
                </label>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase text-[#6F4E37]/80">Category</h3>
              {catFilter.length > 0 && (
                <button onClick={() => setCatFilter([])} className="text-xs text-[#6F4E37]/60 hover:text-red-500 cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
              {categories.map((c) => (
                <label key={c.id} className="flex items-center gap-2 text-xs cursor-pointer text-[#2B2118]/80 hover:text-[#6F4E37] font-medium py-0.5">
                  <input type="checkbox" checked={catFilter.includes(c.id)}
                    onChange={() => toggleArr(catFilter, c.id, setCatFilter)}
                    className="rounded text-[#6F4E37] border-[#6F4E37]/30 focus:ring-[#6F4E37]/30 w-3.5 h-3.5" />
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.color }} />
                  {c.name}
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* Ticket grid */}
        <div className="flex-1 p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 bg-[#FAF3E0] content-start">

          {/* Past-date read-only notice */}
          {isPastDate && (
            <div className="col-span-full flex items-center gap-3 bg-amber-50 border border-amber-300 rounded-2xl px-4 py-3 mb-1">
              <CalendarDays className="w-5 h-5 text-amber-600 shrink-0" />
              <p className="text-sm font-bold text-amber-800">
                Historical view for <span className="font-extrabold">{selectedDate}</span> — Tickets are read-only. Stage changes are disabled for past dates.
              </p>
            </div>
          )}

          {filtered.map((t) => {
            const stageColor  = STAGE_BORDER[t.stage] || "border-zinc-300/50";
            const headerBg    = STAGE_HEADER_BG[t.stage] || "bg-zinc-50";

            return (
              <Card key={t.id}
                className={`bg-white border-2 ${stageColor} rounded-3xl flex flex-col shadow-sm hover:shadow-md transition duration-200 overflow-hidden ${
                  isReadOnly ? "cursor-default" : "cursor-pointer"
                }`}
                onClick={() => {
                  if (isReadOnly) return;
                  const nx = NEXT[t.stage];
                  if (nx) setStage(t.id, nx);
                }}>

                {/* Card header */}
                <div className={`${headerBg} px-4 py-2.5 flex items-center justify-between border-b border-[#6F4E37]/10`}>
                  <div>
                    <span className="font-extrabold text-lg text-[#2B2118]">#{t.orderNumber}</span>
                    <div className="mt-0.5"><TicketTimer createdAt={t.createdAt} stage={t.stage} /></div>
                  </div>
                  <Badge variant="outline" className="text-[#6F4E37] border-[#6F4E37]/25 bg-white/80 font-bold text-xs">
                    {t.stage}
                  </Badge>
                </div>

                {/* Items list */}
                <div className="flex-1 p-3 space-y-1.5 overflow-y-auto max-h-52">
                  {t.items.map((i) => {
                    const p = products.find((x) => x.id === i.productId);
                    return (
                      <button key={i.productId}
                        disabled={isReadOnly}
                        onClick={(e) => { e.stopPropagation(); if (!isReadOnly) toggleItem(t.id, i.productId); }}
                        className={`block w-full text-left px-3 py-2 rounded-xl text-sm transition ${
                          isReadOnly ? "cursor-default" : "hover:bg-[#FAF3E0]/60 cursor-pointer"
                        } ${i.done ? "line-through text-zinc-400 bg-zinc-50" : "text-[#2B2118] font-semibold"}`}>
                        <span className="font-extrabold text-[#6F4E37] mr-2">{i.qty}×</span>
                        {p?.name}
                      </button>
                    );
                  })}
                </div>

                {/* Action hint */}
                {!isReadOnly && NEXT[t.stage] && (
                  <div className="px-4 py-2.5 border-t border-[#6F4E37]/10 text-center text-xs text-zinc-400 font-bold bg-zinc-50/50">
                    <Flame className="w-3 h-3 inline mr-1 text-[#6F4E37]/50" />
                    Click → {NEXT[t.stage]}
                  </div>
                )}
                {isPastDate && (
                  <div className="px-4 py-2 border-t border-amber-100 text-center text-[10px] text-amber-600 font-bold bg-amber-50/50">
                    Historical Record
                  </div>
                )}
              </Card>
            );
          })}

          {!filtered.length && (
            <div className="col-span-full text-center py-16">
              <ChefHat className="w-12 h-12 text-[#6F4E37]/20 mx-auto mb-3" />
              <p className="text-[#6F4E37]/50 font-bold text-base">
                {isPastDate ? `No kitchen tickets found for ${selectedDate}.` : "No active tickets right now."}
              </p>
              {!isPastDate && <p className="text-xs text-zinc-400 mt-1">New orders will appear here automatically.</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
