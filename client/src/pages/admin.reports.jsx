import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { useStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid,
} from "recharts";
import {
  format, startOfDay, startOfWeek, startOfMonth,
  subWeeks, subMonths, getDay, getHours,
} from "date-fns";
import {
  Download, TrendingUp, TrendingDown, AlertTriangle,
  ShoppingCart, Package, Flame, Clock, Star, Activity,
  BarChart2, ChevronDown, ChevronUp,
} from "lucide-react";
// Heavy export libraries are dynamically imported on-demand (not at startup)
// This prevents ~1.3 MB of extra memory at initial page load

// ─── Constants ──────────────────────────────────────────────────────────────
const BRAND      = "#6F4E37";
const BRAND_LIGHT= "#FAF3E0";
const COLORS     = ["#6F4E37","#C8A97E","#A0522D","#D2691E","#8B4513","#DEB887","#CD853F","#F4A460","#BC8F5F","#E8C9A0"];
const DAY_LABELS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const RUSH_WINDOWS = [
  { label:"🌅 Morning Rush", emoji:"🌅", start:8,  end:11, color:"#FFA726" },
  { label:"🍱 Lunch Peak",   emoji:"🍱", start:12, end:16, color:"#66BB6A" },
  { label:"☕ Evening Rush", emoji:"☕", start:17, end:21, color:"#AB47BC" },
  { label:"🌙 Late Night",   emoji:"🌙", start:21, end:24, color:"#42A5F5" },
];

function pct(a, b) { if (!b) return null; return ((a - b) / b) * 100; }

function StatCard({ label, value, sub, trend, icon: Icon, color }) {
  const up = trend > 0;
  return (
    <Card className="p-5 bg-white border border-[#6F4E37]/15 rounded-3xl shadow-md flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-widest text-[#6F4E37]/60">{label}</span>
        {Icon && (
          <span className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: color + "22" }}>
            <Icon className="w-4 h-4" style={{ color }} />
          </span>
        )}
      </div>
      <div className="text-3xl font-extrabold text-[#2B2118]">{value}</div>
      {sub != null && (
        <div className="flex items-center gap-1 text-xs font-semibold"
          style={{ color: up ? "#22c55e" : trend < 0 ? "#ef4444" : "#6b7280" }}>
          {trend != null && trend !== 0 && (up
            ? <TrendingUp className="w-3.5 h-3.5" />
            : <TrendingDown className="w-3.5 h-3.5" />)}
          {sub}
        </div>
      )}
    </Card>
  );
}

function SectionHeader({ title, icon: Icon, color }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <span className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: (color || BRAND) + "22" }}>
        <Icon className="w-4 h-4" style={{ color: color || BRAND }} />
      </span>
      <h2 className="text-base font-extrabold uppercase tracking-wider text-[#2B2118]">{title}</h2>
    </div>
  );
}

export default function ReportsPage() {
  const orders     = useStore((s) => s.orders);
  const products   = useStore((s) => s.products);
  const categories = useStore((s) => s.categories);
  const users      = useStore((s) => s.users);

  const [interval_, setInterval_] = useState("today");
  const [employee,  setEmployee]  = useState("all");
  const [expandDeadstock, setExpandDeadstock] = useState(false);
  const [expandReorder,   setExpandReorder]   = useState(true);

  // ── Ingredients & Recipes from API ─────────────────────────────────────────
  const [ingredients, setIngredients] = useState([]);
  const [recipes,     setRecipes]     = useState({});

  useEffect(() => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token") || "";
    const headers = { Authorization: `Bearer ${token}` };
    const base = (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) || "";
    fetch(`${base}/api/inventory/ingredients`, { headers })
      .then((r) => r.ok ? r.json() : [])
      .then((d) => setIngredients(Array.isArray(d) ? d : d.ingredients || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token") || "";
    const headers = { Authorization: `Bearer ${token}` };
    const base = (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) || "";
    products.forEach((p) => {
      fetch(`${base}/api/inventory/products/${p.id}/recipe`, { headers })
        .then((r) => r.ok ? r.json() : null)
        .then((d) => {
          // API returns { success, data: RecipeItem[] }
          const items = Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : [];
          if (items.length > 0) setRecipes((prev) => ({ ...prev, [p.id]: items }));
        })
        .catch(() => {});
    });
  }, [products]);

  // ── Time bounds ─────────────────────────────────────────────────────────────
  const { from, compareFrom, compareTo } = useMemo(() => {
    const now = Date.now();
    if (interval_ === "today")  return { from: startOfDay(now).getTime(),   compareFrom: startOfDay(subWeeks(now,1)).getTime(),   compareTo: now - 7*86400000 };
    if (interval_ === "week")   return { from: startOfWeek(now).getTime(),  compareFrom: startOfWeek(subWeeks(now,1)).getTime(),  compareTo: startOfWeek(now).getTime() };
    if (interval_ === "month")  return { from: startOfMonth(now).getTime(), compareFrom: startOfMonth(subMonths(now,1)).getTime(),compareTo: startOfMonth(now).getTime() };
    return { from: 0, compareFrom: 0, compareTo: 0 };
  }, [interval_]);

  // ── Filtered orders ─────────────────────────────────────────────────────────
  const paidOrders = useMemo(() => orders.filter((o) => o.status === "Paid"), [orders]);

  const filtered = useMemo(() =>
    paidOrders.filter((o) => {
      if (from && o.createdAt < from) return false;
      if (employee !== "all" && o.employeeId !== employee) return false;
      return true;
    }), [paidOrders, from, employee]);

  const compared = useMemo(() =>
    compareFrom ? paidOrders.filter((o) => o.createdAt >= compareFrom && o.createdAt < (compareTo || from)) : [],
    [paidOrders, compareFrom, compareTo, from]);

  // ── KPIs ────────────────────────────────────────────────────────────────────
  const revenue  = filtered.reduce((s, o) => s + o.total, 0);
  const prevRev  = compared.reduce((s, o) => s + o.total, 0);
  const revTrend = pct(revenue, prevRev);
  const avgOrder = filtered.length ? revenue / filtered.length : 0;
  const prevAvg  = compared.length ? prevRev / compared.length : 0;
  const avgTrend = pct(avgOrder, prevAvg);

  // ── A. Product sales maps ───────────────────────────────────────────────────
  const productSalesAll = useMemo(() => {
    const map = {};
    paidOrders.forEach((o) => o.lines.forEach((l) => {
      if (!map[l.productId]) map[l.productId] = { qty: 0, rev: 0 };
      map[l.productId].qty += l.qty;
      map[l.productId].rev += l.qty * l.unitPrice;
    }));
    return map;
  }, [paidOrders]);

  const productSalesFiltered = useMemo(() => {
    const map = {};
    filtered.forEach((o) => o.lines.forEach((l) => {
      if (!map[l.productId]) map[l.productId] = { qty: 0, rev: 0 };
      map[l.productId].qty += l.qty;
      map[l.productId].rev += l.qty * l.unitPrice;
    }));
    return map;
  }, [filtered]);

  const top10 = useMemo(() =>
    Object.entries(productSalesFiltered)
      .map(([pid, v]) => ({ pid, name: products.find((p) => p.id === pid)?.name ?? "?", ...v }))
      .sort((a, b) => b.rev - a.rev).slice(0, 10),
    [productSalesFiltered, products]);

  const deadstock = useMemo(() =>
    products.filter((p) => { const s = productSalesFiltered[p.id]; return !s || s.qty === 0; })
      .map((p) => ({ ...p, allTimeQty: productSalesAll[p.id]?.qty ?? 0 })),
    [products, productSalesFiltered, productSalesAll]);

  // ── B. Hourly & Day-of-week data ────────────────────────────────────────────
  const hourlyData = useMemo(() => {
    const map = {};
    for (let h = 0; h < 24; h++) map[h] = { hour: `${String(h).padStart(2,"0")}:00`, orders: 0, rev: 0 };
    filtered.forEach((o) => { const h = getHours(new Date(o.createdAt)); map[h].orders++; map[h].rev += o.total; });
    return Object.values(map);
  }, [filtered]);

  const dowData = useMemo(() => {
    const map = {};
    for (let d = 0; d < 7; d++) map[d] = { day: DAY_LABELS[d], orders: 0, rev: 0 };
    filtered.forEach((o) => { const d = getDay(new Date(o.createdAt)); map[d].orders++; map[d].rev += o.total; });
    return Object.values(map);
  }, [filtered]);

  const maxDowOrders = useMemo(() => Math.max(...dowData.map((d) => d.orders), 1), [dowData]);
  const bestDay = useMemo(() => dowData.reduce((a, b) => b.orders > a.orders ? b : a, dowData[0]), [dowData]);

  // ── C. Rush windows ─────────────────────────────────────────────────────────
  const rushData = useMemo(() =>
    RUSH_WINDOWS.map((w) => {
      const wo = filtered.filter((o) => { const h = getHours(new Date(o.createdAt)); return h >= w.start && h < w.end; });
      return { ...w, orders: wo.length, rev: wo.reduce((s,o) => s+o.total, 0), pct: filtered.length ? ((wo.length/filtered.length)*100).toFixed(1) : "0.0" };
    }), [filtered]);

  const busiest = useMemo(() => rushData.reduce((a, b) => b.orders > a.orders ? b : a, rushData[0]), [rushData]);

  // ── D. Reorder suggestions ──────────────────────────────────────────────────
  const reorderSuggestions = useMemo(() => {
    if (!ingredients.length || !Object.keys(recipes).length) return [];
    const consumption = {};
    paidOrders.forEach((o) => o.lines.forEach((l) => {
      (recipes[l.productId] || []).forEach((ri) => {
        consumption[ri.ingredientId] = (consumption[ri.ingredientId] ?? 0) + ri.qty * l.qty;
      });
    }));
    const oldestOrder = paidOrders.reduce((m, o) => Math.min(m, o.createdAt), Date.now());
    const daysCovered = Math.max(1, (Date.now() - oldestOrder) / 86400000);
    const dailyRate = {};
    Object.entries(consumption).forEach(([id, qty]) => { dailyRate[id] = qty / daysCovered; });
    return ingredients.filter((ing) => dailyRate[ing.id]).map((ing) => {
      const daily     = dailyRate[ing.id] ?? 0;
      const stock     = Number(ing.currentStock ?? 0);
      const daysLeft  = daily > 0 ? stock / daily : Infinity;
      const urgency   = daysLeft < 3 ? "critical" : daysLeft < 7 ? "warning" : "ok";
      return { ...ing, daily, daysLeft, urgency, suggest7d: daily * 7 };
    }).sort((a, b) => a.daysLeft - b.daysLeft);
  }, [ingredients, recipes, paidOrders]);

  // ── Category pie data ───────────────────────────────────────────────────────
  const catData = useMemo(() => {
    const map = {};
    filtered.forEach((o) => o.lines.forEach((l) => {
      const p = products.find((pr) => pr.id === l.productId);
      if (!p) return;
      map[p.categoryId] = (map[p.categoryId] ?? 0) + l.qty * l.unitPrice;
    }));
    return Object.entries(map).map(([cid, rev]) => {
      const c = categories.find((cat) => cat.id === cid);
      return { name: c?.name ?? "?", value: rev, color: c?.color ?? "#888" };
    });
  }, [filtered, products, categories]);

  // ── Exports — libraries loaded on-demand only when user clicks ──────────────
  const exportExcel = async () => {
    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
        ["Smart POS – Analytics Report"], [],
        ["Period", interval_.toUpperCase()],
        ["Total Orders", filtered.length],
        ["Total Revenue", `₹${revenue.toFixed(2)}`],
        ["Avg Order",    `₹${avgOrder.toFixed(2)}`],
        ["Busiest Window", busiest?.label ?? "—"],
        ["Best Day", bestDay?.day ?? "—"],
      ]), "Summary");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
        ["Rank","Product","Qty Sold","Revenue"],
        ...top10.map((p,i) => [i+1, p.name, p.qty, p.rev]),
      ]), "Top Products");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
        ["Product","Category","All-Time Sales"],
        ...deadstock.map((p) => [p.name, categories.find((c)=>c.id===p.categoryId)?.name ?? "?", p.allTimeQty]),
      ]), "Deadstock");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
        ["Window","Orders","Revenue","% of Orders"],
        ...rushData.map((r) => [r.label, r.orders, r.rev.toFixed(2), r.pct+"%"]),
      ]), "Rush Hours");
      if (reorderSuggestions.length) {
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
          ["Ingredient","Current Stock","Unit","Daily Use","Days Left","Order (7d)","Status"],
          ...reorderSuggestions.map((r) => [r.name, r.currentStock, r.unit, r.daily.toFixed(3), r.daysLeft===Infinity?"∞":r.daysLeft.toFixed(1), r.suggest7d.toFixed(2), r.urgency]),
        ]), "Reorder");
      }
      XLSX.writeFile(wb, `SmartPOS_Analytics_${format(new Date(),"yyyyMMdd_HHmm")}.xlsx`);
    } catch (err) {
      console.error("Excel export failed:", err);
      alert("Excel export failed. Please try again.");
    }
  };

  const exportPDF = async () => {
    try {
      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);
      const doc = new jsPDF();
      doc.setFontSize(18); doc.setTextColor(111,78,55);
      doc.text("Smart POS – Analytics Report", 14, 20);
      doc.setFontSize(10); doc.setTextColor(120);
      doc.text(`Period: ${interval_.toUpperCase()}   |   Generated: ${format(new Date(),"PPP p")}`, 14, 28);
      autoTable(doc, { startY: 35, head:[["Metric","Value"]], body:[
        ["Total Orders", filtered.length.toString()],
        ["Total Revenue", `₹${revenue.toFixed(2)}`],
        ["Avg Order", `₹${avgOrder.toFixed(2)}`],
        ["Busiest Window", busiest?.label ?? "—"],
      ], headStyles:{ fillColor:[111,78,55] }, alternateRowStyles:{ fillColor:[250,243,224] } });
      const finalY1 = doc.lastAutoTable ? doc.lastAutoTable.finalY : 70;
      doc.setFontSize(13); doc.setTextColor(111,78,55);
      doc.text("Top Products", 14, finalY1 + 12);
      autoTable(doc, { startY: finalY1 + 16, head:[["#","Product","Qty","Revenue"]],
        body: top10.map((p,i) => [i+1, p.name, p.qty, `₹${p.rev.toFixed(2)}`]),
        headStyles:{ fillColor:[111,78,55] }, alternateRowStyles:{ fillColor:[250,243,224] } });
      doc.save(`SmartPOS_Analytics_${format(new Date(),"yyyyMMdd_HHmm")}.pdf`);
    } catch (err) {
      console.error("PDF export failed:", err);
      alert("PDF export failed. Please try again.");
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <AdminShell title="Analytics &amp; Reports">
      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2.5 mb-6">
        {[{v:"today",l:"Today"},{v:"week",l:"This Week"},{v:"month",l:"This Month"}].map(({v,l}) => (
          <button key={v} onClick={() => setInterval_(v)}
            className="px-4 py-1.5 rounded-xl text-sm font-bold transition-all cursor-pointer"
            style={{ background: interval_===v ? BRAND : BRAND_LIGHT, color: interval_===v ? "#fff" : BRAND, border: `1.5px solid ${BRAND}55` }}>
            {l}
          </button>
        ))}
        <select value={employee} onChange={(e) => setEmployee(e.target.value)}
          className="ml-2 px-3 py-1.5 rounded-xl border text-sm font-semibold bg-[#FAF3E0] border-[#6F4E37]/25 text-[#2B2118] cursor-pointer">
          <option value="all">All Employees</option>
          {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" onClick={exportExcel}
            className="border-[#6F4E37]/25 text-[#6F4E37]/80 hover:bg-[#FAF3E0] rounded-xl cursor-pointer text-sm">
            <Download className="w-3.5 h-3.5 mr-1" /> Excel
          </Button>
          <Button variant="outline" onClick={exportPDF}
            className="border-[#6F4E37]/25 text-[#6F4E37]/80 hover:bg-[#FAF3E0] rounded-xl cursor-pointer text-sm">
            <Download className="w-3.5 h-3.5 mr-1" /> PDF
          </Button>
        </div>
      </div>

      {/* ── KPI Cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Orders" value={filtered.length} icon={ShoppingCart} color={BRAND}
          trend={pct(filtered.length, compared.length)}
          sub={compared.length > 0 ? `${pct(filtered.length,compared.length)>=0?"+":""}${pct(filtered.length,compared.length)?.toFixed(1)}% vs prev period` : "No comparison"} />
        <StatCard label="Revenue" value={`₹${revenue.toFixed(0)}`} icon={TrendingUp} color="#22c55e"
          trend={revTrend}
          sub={prevRev > 0 ? `${revTrend>=0?"+":""}${revTrend?.toFixed(1)}% vs prev period` : "No comparison"} />
        <StatCard label="Avg Order" value={`₹${avgOrder.toFixed(0)}`} icon={Activity} color="#A0522D"
          trend={avgTrend}
          sub={prevAvg > 0 ? `${avgTrend>=0?"+":""}${avgTrend?.toFixed(1)}% vs prev` : null} />
        <StatCard label="Busiest Window" value={busiest?.emoji ?? "—"} icon={Flame} color="#f97316"
          sub={busiest ? `${busiest.label.split(" ").slice(1).join(" ")} · ${busiest.pct}% orders` : null} />
      </div>

      {/* ══════════ SECTION A – Best Sellers & Deadstock ══════════════════ */}
      <div className="mb-6">
        <SectionHeader title="A · Best-Sellers vs Deadstock" icon={Star} color={BRAND} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Top 10 horizontal bar */}
          <Card className="p-5 bg-white border border-[#6F4E37]/15 rounded-3xl shadow-md">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-[#6F4E37]/70 mb-4">Top 10 by Revenue</h3>
            {top10.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-[#6F4E37]/40 text-sm">No sales data for this period</div>
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={top10} layout="vertical" margin={{ left:6, right:28 }}>
                    <XAxis type="number" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false}
                      tickFormatter={(v) => `₹${(v/1000).toFixed(1)}k`} />
                    <YAxis type="category" dataKey="name" stroke="#71717a" fontSize={11} width={100} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor:"#fff", borderColor:BRAND, borderRadius:12, color:"#2B2118" }}
                      formatter={(v) => [`₹${Number(v).toFixed(2)}`, "Revenue"]} />
                    <Bar dataKey="rev" radius={[0,6,6,0]}>
                      {top10.map((_,i) => (
                        <Cell key={i} fill={i===0?"#D2691E":i===1?"#A0522D":i===2?"#8B4513":BRAND+"99"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          {/* Deadstock panel */}
          <Card className="p-5 bg-white border border-[#6F4E37]/15 rounded-3xl shadow-md">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-[#6F4E37]/70">
                Deadstock / Underperformers
                <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-100 text-red-600 text-[10px] font-black">
                  {deadstock.length}
                </span>
              </h3>
              <button onClick={() => setExpandDeadstock((e) => !e)}
                className="text-xs text-[#6F4E37]/60 hover:text-[#6F4E37] font-semibold flex items-center gap-1 cursor-pointer">
                {expandDeadstock ? <ChevronUp className="w-3.5 h-3.5"/> : <ChevronDown className="w-3.5 h-3.5"/>}
                {expandDeadstock ? "Collapse" : "Expand All"}
              </button>
            </div>
            {deadstock.length === 0 ? (
              <div className="flex items-center gap-2 text-green-600 text-sm font-semibold">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> All products have sales in this period!
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto max-h-72 pr-1">
                {(expandDeadstock ? deadstock : deadstock.slice(0,5)).map((p) => {
                  const cat = categories.find((c) => c.id === p.categoryId);
                  return (
                    <div key={p.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-red-50 border border-red-100">
                      <div>
                        <div className="font-bold text-sm text-[#2B2118]">{p.name}</div>
                        <div className="text-[11px] text-[#6F4E37]/60">{cat?.name ?? "—"}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-black text-red-500">0 sold</div>
                        <div className="text-[11px] text-[#6F4E37]/50">All-time: {p.allTimeQty}</div>
                      </div>
                    </div>
                  );
                })}
                {!expandDeadstock && deadstock.length > 5 && (
                  <button onClick={() => setExpandDeadstock(true)} className="text-xs text-[#6F4E37] font-bold underline cursor-pointer mt-1">
                    + {deadstock.length - 5} more items
                  </button>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Detailed top 10 table */}
        <Card className="p-5 bg-white border border-[#6F4E37]/15 rounded-3xl shadow-md mt-4">
          <h3 className="font-extrabold text-xs uppercase tracking-wider text-[#6F4E37]/70 mb-3">Top Performers Detail</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-[#6F4E37]/20 bg-[#FAF3E0]/60">
                <tr>{["Rank","Product","Category","Qty Sold","Revenue","Avg Price"].map((h) => (
                  <th key={h} className="text-left p-2.5 font-bold text-[#6F4E37]/70 text-xs uppercase">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {top10.map((p,i) => {
                  const pr  = products.find((pr) => pr.id === p.pid);
                  const cat = categories.find((c) => c.id === pr?.categoryId);
                  const medals = ["🥇","🥈","🥉"];
                  return (
                    <tr key={i} className="border-b border-[#6F4E37]/10 last:border-0 hover:bg-[#FAF3E0]/30 transition-colors">
                      <td className="p-2.5 font-bold text-center text-base">{medals[i] ?? `#${i+1}`}</td>
                      <td className="p-2.5 font-semibold text-[#2B2118]">{p.name}</td>
                      <td className="p-2.5 text-[#6F4E37]/70">{cat?.name ?? "—"}</td>
                      <td className="p-2.5 text-right font-bold text-[#2B2118]">{p.qty}</td>
                      <td className="p-2.5 text-right font-extrabold text-[#6F4E37]">₹{p.rev.toFixed(2)}</td>
                      <td className="p-2.5 text-right text-[#6F4E37]/70">₹{(p.rev/p.qty).toFixed(2)}</td>
                    </tr>
                  );
                })}
                {top10.length === 0 && (
                  <tr><td colSpan={6} className="p-6 text-center text-[#6F4E37]/40 text-sm">No sales in this period</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* ══════════ SECTION B – Trend & Day-of-Week Heatmap ══════════════ */}
      <div className="mb-6">
        <SectionHeader title="B · Sales Trend &amp; Day-of-Week Heatmap" icon={BarChart2} color="#A0522D" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Hourly bar chart */}
          <Card className="p-5 bg-white border border-[#6F4E37]/15 rounded-3xl shadow-md">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-[#6F4E37]/70 mb-4">Revenue by Hour</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyData} margin={{ left:-16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#6F4E3712" />
                  <XAxis dataKey="hour" stroke="#71717a" fontSize={10} tickLine={false} interval={2} />
                  <YAxis stroke="#71717a" fontSize={10} tickLine={false} axisLine={false}
                    tickFormatter={(v) => v>=1000?`₹${(v/1000).toFixed(0)}k`:`₹${v}`} />
                  <Tooltip contentStyle={{ backgroundColor:"#fff", borderColor:BRAND, borderRadius:12, color:"#2B2118" }}
                    formatter={(v) => [`₹${Number(v).toFixed(2)}`, "Revenue"]} />
                  <Bar dataKey="rev" radius={[4,4,0,0]} fill={BRAND} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Day-of-week heatmap bars */}
          <Card className="p-5 bg-white border border-[#6F4E37]/15 rounded-3xl shadow-md">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-[#6F4E37]/70 mb-4">
              Day-of-Week Distribution
              {bestDay?.orders > 0 && (
                <span className="ml-2 text-[10px] font-black text-amber-600 bg-amber-50 rounded-lg px-2 py-0.5 border border-amber-200">
                  🏆 Best: {bestDay.day} ({bestDay.orders} orders)
                </span>
              )}
            </h3>
            <div className="space-y-2.5">
              {dowData.map((d) => {
                const w = maxDowOrders ? (d.orders/maxDowOrders)*100 : 0;
                const isTop = d.day === bestDay?.day && d.orders > 0;
                return (
                  <div key={d.day} className="flex items-center gap-3">
                    <div className="w-9 text-xs font-bold text-[#6F4E37]/70 shrink-0">{d.day}</div>
                    <div className="flex-1 h-7 rounded-lg bg-[#FAF3E0] overflow-hidden relative">
                      <div className="h-full rounded-lg transition-all duration-700"
                        style={{ width:`${w}%`, background: isTop ? "linear-gradient(90deg,#D2691E,#F4A460)" : `linear-gradient(90deg,${BRAND}CC,${BRAND}66)` }} />
                      <span className="absolute right-2 top-0 bottom-0 flex items-center text-[11px] font-bold text-[#2B2118]">
                        {d.orders} ord · ₹{d.rev.toFixed(0)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Category donut + order count line */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          <Card className="p-5 bg-white border border-[#6F4E37]/15 rounded-3xl shadow-md">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-[#6F4E37]/70 mb-4">Revenue by Category</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={catData} dataKey="value" nameKey="name" outerRadius={80} innerRadius={36} labelLine={false}
                    label={({ name, percent }) => percent > 0.05 ? `${name} ${(percent*100).toFixed(0)}%` : ""}>
                    {catData.map((c,i) => <Cell key={i} fill={c.color || COLORS[i%COLORS.length]} />)}
                  </Pie>
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  <Tooltip contentStyle={{ backgroundColor:"#fff", borderColor:BRAND, borderRadius:12 }}
                    formatter={(v) => [`₹${Number(v).toFixed(2)}`]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-5 bg-white border border-[#6F4E37]/15 rounded-3xl shadow-md">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-[#6F4E37]/70 mb-4">Order Count by Hour</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hourlyData} margin={{ left:-16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#6F4E3712" />
                  <XAxis dataKey="hour" stroke="#71717a" fontSize={10} tickLine={false} interval={2} />
                  <YAxis stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor:"#fff", borderColor:BRAND, borderRadius:12 }}
                    formatter={(v) => [v, "Orders"]} />
                  <Line type="monotone" dataKey="orders" stroke="#D2691E" strokeWidth={2.5} dot={false}
                    activeDot={{ r:5, fill:BRAND }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>

      {/* ══════════ SECTION C – Rush Hour Intelligence ═══════════════════ */}
      <div className="mb-6">
        <SectionHeader title="C · Rush Hour / Peak Time Intelligence" icon={Clock} color="#f97316" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {rushData.map((w) => (
            <Card key={w.label}
              className="p-4 rounded-3xl shadow-md border flex flex-col gap-2 transition-transform hover:scale-[1.02]"
              style={{ borderColor: w.label===busiest?.label ? w.color : "#6F4E3725", background: w.label===busiest?.label ? w.color+"18" : "#fff" }}>
              <div className="text-2xl">{w.emoji}</div>
              <div className="text-xs font-black uppercase tracking-wider text-[#2B2118]/70">
                {w.label.split(" ").slice(1).join(" ")}
              </div>
              <div className="text-2xl font-extrabold text-[#2B2118]">{w.orders}</div>
              <div className="text-xs text-[#6F4E37]/70">orders · ₹{w.rev.toFixed(0)}</div>
              <div className="mt-1">
                <div className="h-1.5 rounded-full bg-[#6F4E3715] overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width:`${w.pct}%`, background:w.color }} />
                </div>
                <div className="text-[11px] font-bold mt-1" style={{ color:w.color }}>{w.pct}% of orders</div>
              </div>
              {w.label === busiest?.label && (
                <div className="mt-1 text-[10px] font-black rounded-lg px-2 py-0.5 inline-flex items-center gap-1"
                  style={{ background:w.color+"30", color:w.color }}>🔥 BUSIEST WINDOW</div>
              )}
            </Card>
          ))}
        </div>

        {/* 24-h heatmap grid */}
        <Card className="p-5 bg-white border border-[#6F4E37]/15 rounded-3xl shadow-md">
          <h3 className="font-extrabold text-xs uppercase tracking-wider text-[#6F4E37]/70 mb-4">
            24-Hour Order Heatmap
            <span className="ml-2 text-[10px] text-[#6F4E37]/40 font-normal normal-case">Darker = More orders</span>
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {hourlyData.map((h) => {
              const maxO = Math.max(...hourlyData.map((x) => x.orders), 1);
              const intensity = maxO > 0 ? h.orders / maxO : 0;
              return (
                <div key={h.hour} title={`${h.hour} – ${h.orders} orders · ₹${h.rev.toFixed(0)}`}
                  className="flex flex-col items-center gap-0.5 cursor-help">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all"
                    style={{ background: intensity>0 ? `rgba(111,78,55,${Math.max(0.1,intensity)})` : "#FAF3E020",
                      color: intensity>0.5 ? "#fff" : "#6F4E37" }}>
                    {h.orders || "—"}
                  </div>
                  <div className="text-[9px] text-[#6F4E37]/50 font-semibold">{h.hour.slice(0,2)}</div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* ══════════ SECTION D – Predictive Reorder ═══════════════════════ */}
      <div className="mb-6">
        <SectionHeader title="D · Predictive Ingredient Reorder Suggestions" icon={Package} color="#8B4513" />
        {ingredients.length === 0 ? (
          <Card className="p-6 bg-amber-50 border border-amber-200 rounded-3xl text-amber-800 text-sm font-semibold">
            <AlertTriangle className="w-5 h-5 inline mr-2 text-amber-500" />
            No ingredient data loaded. Please add ingredients in the Inventory module and set recipes for each product.
          </Card>
        ) : reorderSuggestions.length === 0 ? (
          <Card className="p-6 bg-[#FAF3E0] border border-[#6F4E37]/20 rounded-3xl text-[#6F4E37]/70 text-sm font-semibold">
            <Package className="w-5 h-5 inline mr-2" />
            No recipe-linked consumption data found. Set up product recipes in Inventory to enable predictive suggestions.
          </Card>
        ) : (
          <Card className="p-5 bg-white border border-[#6F4E37]/15 rounded-3xl shadow-md">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs text-[#6F4E37]/60 font-semibold">
                Based on all-time sales velocity · {reorderSuggestions.length} tracked ingredients
              </div>
              <button onClick={() => setExpandReorder((e) => !e)}
                className="text-xs text-[#6F4E37]/60 hover:text-[#6F4E37] font-semibold flex items-center gap-1 cursor-pointer">
                {expandReorder ? <ChevronUp className="w-3.5 h-3.5"/> : <ChevronDown className="w-3.5 h-3.5"/>}
                {expandReorder ? "Collapse" : "Expand"}
              </button>
            </div>
            {expandReorder && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-[#6F4E37]/20 bg-[#FAF3E0]/60">
                    <tr>{["Ingredient","Stock","Unit","Daily Use","Days Left","Order (7d qty)","Status"].map((h) => (
                      <th key={h} className="text-left p-2.5 font-bold text-[#6F4E37]/70 text-xs uppercase whitespace-nowrap">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {reorderSuggestions.map((ing) => {
                      const C = { critical:{bg:"#fef2f2",text:"#dc2626",badge:"#fee2e2",icon:"🔴"},
                                  warning: {bg:"#fffbeb",text:"#d97706",badge:"#fef3c7",icon:"🟡"},
                                  ok:      {bg:"#f0fdf4",text:"#16a34a",badge:"#dcfce7",icon:"🟢"} }[ing.urgency];
                      return (
                        <tr key={ing.id} className="border-b border-[#6F4E37]/10 last:border-0 hover:bg-[#FAF3E0]/20 transition-colors">
                          <td className="p-2.5 font-semibold text-[#2B2118]">{ing.name}</td>
                          <td className="p-2.5 font-bold text-[#2B2118]">{Number(ing.currentStock).toFixed(2)}</td>
                          <td className="p-2.5 text-[#6F4E37]/60">{ing.unit}</td>
                          <td className="p-2.5 text-[#6F4E37]/80">{ing.daily.toFixed(3)}</td>
                          <td className="p-2.5 font-bold" style={{ color:C.text }}>
                            {ing.daysLeft===Infinity?"∞":ing.daysLeft.toFixed(1)+"d"}
                          </td>
                          <td className="p-2.5 font-extrabold text-[#2B2118]">{ing.suggest7d.toFixed(2)} {ing.unit}</td>
                          <td className="p-2.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black"
                              style={{ background:C.badge, color:C.text }}>
                              {C.icon} {ing.urgency.charAt(0).toUpperCase()+ing.urgency.slice(1)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}
      </div>
    </AdminShell>
  );
}
