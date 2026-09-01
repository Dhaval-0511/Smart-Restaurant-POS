import { useState, useEffect, useCallback } from "react";
import { AdminShell } from "@/components/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus, Search, Pencil, Trash2, Loader2,
  Package, AlertTriangle, TrendingDown, BarChart3,
  ArrowDownToLine, RotateCcw, ClipboardList,
  RefreshCw, Droplets,
} from "lucide-react";
import { toast } from "sonner";
import { inventoryApi } from "@/lib/api";
import { format } from "date-fns";

const UNITS = ["g", "kg", "ml", "liter", "piece", "dozen", "slice", "cup", "tbsp", "tsp"];

const MOVEMENT_LABELS = {
  PURCHASE_RECEIPT:  { label: "Purchase",   color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  SALE_DEDUCTION:    { label: "Sale Used",  color: "bg-blue-100 text-blue-700 border-blue-200" },
  WASTAGE:           { label: "Wastage",    color: "bg-red-100 text-red-700 border-red-200" },
  MANUAL_ADJUSTMENT: { label: "Adjustment", color: "bg-amber-100 text-amber-700 border-amber-200" },
  RETURN:            { label: "Return",     color: "bg-purple-100 text-purple-700 border-purple-200" },
};

function StockStatusBadge({ current, minimum }) {
  const c = Number(current);
  const m = Number(minimum);
  if (c === 0)   return <Badge className="bg-red-100 text-red-700 border-red-200 border text-xs font-bold">Out of Stock</Badge>;
  if (c <= m)    return <Badge className="bg-amber-100 text-amber-700 border-amber-200 border text-xs font-bold">Low Stock</Badge>;
  return              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 border text-xs font-bold">In Stock</Badge>;
}

// ── Ingredient Form Dialog ────────────────────────────────────────────────────
function IngredientDialog({ open, onClose, editing, onSaved }) {
  const [form, setForm] = useState({
    name: "", unitOfMeasure: "g", currentStock: 0, minimumStock: 0,
    costPerUnit: 0, isPerishable: false, shelfLifeDays: 0,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) {
      setForm({
        name: editing.name,
        unitOfMeasure: editing.unitOfMeasure,
        currentStock: Number(editing.currentStock),
        minimumStock: Number(editing.minimumStock),
        costPerUnit: Number(editing.costPerUnit),
        isPerishable: Boolean(editing.isPerishable),
        shelfLifeDays: Number(editing.shelfLifeDays ?? 0),
      });
    } else {
      setForm({ name: "", unitOfMeasure: "g", currentStock: 0, minimumStock: 0,
        costPerUnit: 0, isPerishable: false, shelfLifeDays: 0 });
    }
  }, [editing, open]);

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      if (editing) {
        await inventoryApi.updateIngredient(editing.id, form);
        toast.success("Ingredient updated");
      } else {
        await inventoryApi.createIngredient(form);
        toast.success("Ingredient created");
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-white border border-[#6F4E37]/30 max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-[#6F4E37] font-extrabold text-lg">
            {editing ? "Edit Ingredient" : "Add Ingredient"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-xs font-bold text-[#6F4E37]">Name *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Coffee Beans" className="mt-1 rounded-xl border-[#6F4E37]/30 focus:border-[#6F4E37]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-bold text-[#6F4E37]">Unit of Measure</Label>
              <Select value={form.unitOfMeasure} onValueChange={(v) => setForm({ ...form, unitOfMeasure: v })}>
                <SelectTrigger className="mt-1 rounded-xl border-[#6F4E37]/30 focus:border-[#6F4E37]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-bold text-[#6F4E37]">Cost per Unit (₹)</Label>
              <Input type="number" min="0" step="0.01" value={form.costPerUnit}
                onChange={(e) => setForm({ ...form, costPerUnit: Number(e.target.value) })}
                className="mt-1 rounded-xl border-[#6F4E37]/30 focus:border-[#6F4E37]" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-bold text-[#6F4E37]">Current Stock</Label>
              <Input type="number" min="0" step="0.001" value={form.currentStock}
                onChange={(e) => setForm({ ...form, currentStock: Number(e.target.value) })}
                className="mt-1 rounded-xl border-[#6F4E37]/30 focus:border-[#6F4E37]" />
            </div>
            <div>
              <Label className="text-xs font-bold text-[#6F4E37]">Min. Stock (Alert)</Label>
              <Input type="number" min="0" step="0.001" value={form.minimumStock}
                onChange={(e) => setForm({ ...form, minimumStock: Number(e.target.value) })}
                className="mt-1 rounded-xl border-[#6F4E37]/30 focus:border-[#6F4E37]" />
            </div>
          </div>
          {/* Perishable Controls */}
          <div className="flex items-center gap-4 bg-blue-50/60 border border-blue-200/60 rounded-2xl px-4 py-3">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isPerishable}
                onChange={(e) => setForm({ ...form, isPerishable: e.target.checked, shelfLifeDays: e.target.checked ? (form.shelfLifeDays || 2) : 0 })}
                className="w-4 h-4 rounded text-blue-600 border-blue-300 focus:ring-blue-400"
              />
              <div>
                <span className="text-sm font-bold text-blue-800">🥛 Daily Fresh Item</span>
                <p className="text-xs text-blue-600/80">Enable to mark as perishable (milk, bread, veggies)</p>
              </div>
            </label>
            {form.isPerishable && (
              <div className="ml-auto">
                <Label className="text-xs font-bold text-blue-700">Shelf Life (days)</Label>
                <Input
                  type="number" min="1" max="30" value={form.shelfLifeDays}
                  onChange={(e) => setForm({ ...form, shelfLifeDays: Number(e.target.value) })}
                  className="mt-1 w-20 rounded-xl border-blue-300 text-center text-sm"
                />
              </div>
            )}
          </div>
        </div>
        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="rounded-xl border-[#6F4E37]/30 text-[#6F4E37] cursor-pointer">Cancel</Button>
          <Button onClick={handleSave} disabled={saving}
            className="bg-[#6F4E37] hover:bg-[#5A3A1A] text-white rounded-xl cursor-pointer">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
            {editing ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Stock Adjust Dialog ───────────────────────────────────────────────────────
function AdjustDialog({ open, onClose, ingredient, onSaved }) {
  const [qty, setQty] = useState(0);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (open) { setQty(0); setNotes(""); } }, [open]);

  const handleSave = async () => {
    if (!qty || qty === 0) { toast.error("Quantity cannot be zero"); return; }
    setSaving(true);
    try {
      await inventoryApi.adjustStock({ ingredientId: ingredient.id, quantityChange: Number(qty), notes });
      toast.success(`Stock ${qty > 0 ? "added" : "deducted"} successfully`);
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-white border border-[#6F4E37]/30 max-w-sm rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-[#6F4E37] font-extrabold text-lg">
            Adjust Stock — {ingredient?.name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="bg-[#FAF3E0]/60 rounded-2xl px-4 py-3 border border-[#6F4E37]/15">
            <p className="text-xs text-[#6F4E37]/70 font-semibold">Current Stock</p>
            <p className="font-extrabold text-[#6F4E37] text-lg">
              {Number(ingredient?.currentStock ?? 0).toFixed(3)} {ingredient?.unitOfMeasure}
            </p>
          </div>
          <div>
            <Label className="text-xs font-bold text-[#6F4E37]">
              Change Amount (+ to add, − to deduct)
            </Label>
            <Input type="number" step="0.001" value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder="e.g. 5 or -2.5"
              className="mt-1 rounded-xl border-[#6F4E37]/30 focus:border-[#6F4E37]" />
          </div>
          <div>
            <Label className="text-xs font-bold text-[#6F4E37]">Notes (optional)</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. New delivery received"
              className="mt-1 rounded-xl border-[#6F4E37]/30 focus:border-[#6F4E37]" />
          </div>
        </div>
        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="rounded-xl border-[#6F4E37]/30 text-[#6F4E37] cursor-pointer">Cancel</Button>
          <Button onClick={handleSave} disabled={saving}
            className="bg-[#6F4E37] hover:bg-[#5A3A1A] text-white rounded-xl cursor-pointer">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
            Confirm Adjustment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Wastage Dialog ────────────────────────────────────────────────────────────
function WastageDialog({ open, onClose, ingredient, onSaved }) {
  const [qty, setQty] = useState(0);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (open) { setQty(0); setReason(""); } }, [open]);

  const handleSave = async () => {
    if (!qty || Number(qty) <= 0) { toast.error("Quantity must be positive"); return; }
    if (!reason.trim()) { toast.error("Reason is required"); return; }
    setSaving(true);
    try {
      await inventoryApi.recordWastage({ ingredientId: ingredient.id, quantity: Number(qty), reason });
      toast.success("Wastage recorded");
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const WASTAGE_REASONS = ["Expired", "Spilled", "Damaged", "Overproduction", "Quality Rejected"];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-white border border-[#6F4E37]/30 max-w-sm rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-[#6F4E37] font-extrabold text-lg">
            Log Wastage — {ingredient?.name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="bg-red-50 rounded-2xl px-4 py-3 border border-red-100">
            <p className="text-xs text-red-600/70 font-semibold">Current Stock</p>
            <p className="font-extrabold text-red-700 text-lg">
              {Number(ingredient?.currentStock ?? 0).toFixed(3)} {ingredient?.unitOfMeasure}
            </p>
          </div>
          <div>
            <Label className="text-xs font-bold text-[#6F4E37]">Wasted Quantity</Label>
            <Input type="number" min="0.001" step="0.001" value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder="e.g. 0.5"
              className="mt-1 rounded-xl border-[#6F4E37]/30 focus:border-[#6F4E37]" />
          </div>
          <div>
            <Label className="text-xs font-bold text-[#6F4E37]">Reason *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="mt-1 rounded-xl border-[#6F4E37]/30">
                <SelectValue placeholder="Select reason…" />
              </SelectTrigger>
              <SelectContent>
                {WASTAGE_REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="rounded-xl border-[#6F4E37]/30 text-[#6F4E37] cursor-pointer">Cancel</Button>
          <Button onClick={handleSave} disabled={saving}
            className="bg-red-600 hover:bg-red-700 text-white rounded-xl cursor-pointer">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
            Record Wastage
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function InventoryPage() {
  const [ingredients, setIngredients] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("ingredients"); // ingredients | ledger
  const [q, setQ] = useState("");

  // Dialogs
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [adjustTarget, setAdjustTarget] = useState(null);
  const [wastageTarget, setWastageTarget] = useState(null);

  const loadIngredients = useCallback(async () => {
    try {
      const data = await inventoryApi.getIngredients();
      setIngredients(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error("Failed to load ingredients");
    }
  }, []);

  const loadLedger = useCallback(async () => {
    try {
      const data = await inventoryApi.getLedger({ limit: 100 });
      setLedger(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error("Failed to load stock ledger");
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadIngredients(), loadLedger()]);
    setLoading(false);
  }, [loadIngredients, loadLedger]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    if (!confirm("Delete this ingredient? This cannot be undone.")) return;
    try {
      await inventoryApi.deleteIngredient(id);
      toast.success("Ingredient deleted");
      loadIngredients();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const filtered = ingredients.filter((i) =>
    i.name.toLowerCase().includes(q.toLowerCase())
  );
  const perishableItems = ingredients.filter((i) => i.isPerishable);
  const lowStockCount = ingredients.filter((i) => Number(i.currentStock) <= Number(i.minimumStock)).length;
  const outOfStockCount = ingredients.filter((i) => Number(i.currentStock) === 0).length;
  const totalValue = ingredients.reduce((sum, i) => sum + Number(i.currentStock) * Number(i.costPerUnit), 0);
  const dailyFreshLowCount = perishableItems.filter((i) => Number(i.currentStock) <= Number(i.minimumStock)).length;

  return (
    <AdminShell title="Inventory">
      <div className="p-6 max-w-7xl mx-auto space-y-5 select-none">

        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-[#2B2118] tracking-tight">Ingredient Inventory</h1>
            <p className="text-sm text-[#6F4E37]/60 mt-0.5">Track stock, record wastage, and manage recipes</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={load}
              className="border-[#6F4E37]/30 text-[#6F4E37] hover:bg-[#FAF3E0] rounded-xl cursor-pointer h-10">
              <RefreshCw className="w-4 h-4 mr-1.5" /> Refresh
            </Button>
            <Button onClick={() => { setEditTarget(null); setShowAdd(true); }}
              className="bg-[#6F4E37] hover:bg-[#5A3A1A] text-white rounded-xl cursor-pointer h-10">
              <Plus className="w-4 h-4 mr-1.5" /> Add Ingredient
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Total Ingredients", value: ingredients.length, icon: Package, color: "bg-[#6F4E37]/10 text-[#6F4E37]" },
            { label: "Low Stock Alerts", value: lowStockCount, icon: AlertTriangle, color: "bg-amber-50 text-amber-700" },
            { label: "Out of Stock", value: outOfStockCount, icon: TrendingDown, color: "bg-red-50 text-red-600" },
            { label: "Stock Value (₹)", value: `₹${totalValue.toFixed(0)}`, icon: BarChart3, color: "bg-emerald-50 text-emerald-700" },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className={`rounded-2xl border border-[#6F4E37]/15 shadow-sm p-4 ${color}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold opacity-70 uppercase tracking-wider">{label}</p>
                  <p className="text-2xl font-extrabold mt-1">{value}</p>
                </div>
                <Icon className="w-8 h-8 opacity-30" />
              </div>
            </Card>
          ))}
        </div>

        {/* Daily Fresh Urgency Banner */}
        {dailyFreshLowCount > 0 && (
          <div className="flex items-center gap-3 bg-blue-50 border border-blue-300 rounded-2xl px-4 py-3">
            <Droplets className="w-5 h-5 text-blue-600 shrink-0 animate-pulse" />
            <div>
              <p className="font-extrabold text-blue-800 text-sm">
                🥛 {dailyFreshLowCount} daily fresh item{dailyFreshLowCount > 1 ? "s" : ""} need procurement TODAY
              </p>
              <p className="text-xs text-blue-600/80 mt-0.5">
                {perishableItems.filter((i) => Number(i.currentStock) <= Number(i.minimumStock)).map((i) => i.name).join(", ")}
              </p>
            </div>
          </div>
        )}
        {/* Low Stock Banner (bulk/non-perishable) */}
        {lowStockCount > 0 && (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-300 rounded-2xl px-4 py-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-extrabold text-amber-800 text-sm">
                {lowStockCount} ingredient{lowStockCount > 1 ? "s" : ""} at or below minimum stock level
              </p>
              <p className="text-xs text-amber-600/80 mt-0.5">
                {ingredients.filter((i) => Number(i.currentStock) <= Number(i.minimumStock)).map((i) => i.name).join(", ")}
              </p>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-1.5 bg-[#FAF3E0] p-1.5 rounded-2xl w-fit">
          {[
            { key: "ingredients", label: "All Ingredients", icon: Package },
            { key: "fresh", label: `🥛 Daily Fresh${dailyFreshLowCount > 0 ? ` (${dailyFreshLowCount} urgent)` : ""}`, icon: Droplets },
            { key: "ledger", label: "Stock Ledger", icon: ClipboardList },
          ].map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                tab === key
                  ? key === "fresh"
                    ? "bg-white text-blue-700 shadow-sm"
                    : "bg-white text-[#6F4E37] shadow-sm"
                  : "text-[#6F4E37]/60 hover:text-[#6F4E37]"
              }`}>
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {/* Ingredients Tab */}
        {tab === "ingredients" && (
          <Card className="bg-white border border-[#6F4E37]/20 rounded-3xl overflow-hidden shadow-sm">
            {/* Table Header Controls */}
            <div className="p-4 border-b border-[#6F4E37]/10 flex items-center justify-between">
              <div className="relative w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <Input value={q} onChange={(e) => setQ(e.target.value)}
                  placeholder="Search ingredients…"
                  className="pl-9 border-[#6F4E37]/25 rounded-xl bg-[#FAF3E0]/40 focus:bg-white" />
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-[#6F4E37]/40" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[#FAF3E0]/60 border-b border-[#6F4E37]/10">
                    <tr>
                      {["Ingredient", "Type", "Unit", "Current Stock", "Min. Stock", "Cost/Unit", "Status", "Actions"].map((h) => (
                        <th key={h} className="p-3 text-left font-bold text-[#6F4E37]/70 text-xs uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((ing) => {
                      const isLow = Number(ing.currentStock) <= Number(ing.minimumStock);
                      return (
                        <tr key={ing.id}
                          className={`border-b border-[#6F4E37]/8 last:border-0 hover:bg-[#FAF3E0]/20 transition-colors ${isLow ? "bg-amber-50/30" : ""}`}>
                          <td className="p-3 font-semibold text-[#2B2118]">{ing.name}</td>
                          <td className="p-3">
                            {ing.isPerishable
                              ? <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">🥛 Daily Fresh</span>
                              : <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200">📦 Bulk</span>
                            }
                          </td>
                          <td className="p-3 text-[#6F4E37]/70">{ing.unitOfMeasure}</td>
                          <td className="p-3 font-bold text-[#2B2118]">
                            {Number(ing.currentStock).toFixed(3)}
                          </td>
                          <td className="p-3 text-[#6F4E37]/70">{Number(ing.minimumStock).toFixed(3)}</td>
                          <td className="p-3 text-[#6F4E37]/70">₹{Number(ing.costPerUnit).toFixed(2)}</td>
                          <td className="p-3">
                            <StockStatusBadge current={ing.currentStock} minimum={ing.minimumStock} />
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1">
                              <button title="Adjust Stock"
                                onClick={() => setAdjustTarget(ing)}
                                className="h-8 w-8 rounded-lg flex items-center justify-center text-emerald-600 hover:bg-emerald-50 border border-transparent hover:border-emerald-200 transition cursor-pointer">
                                <ArrowDownToLine className="w-3.5 h-3.5" />
                              </button>
                              <button title="Log Wastage"
                                onClick={() => setWastageTarget(ing)}
                                className="h-8 w-8 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50 border border-transparent hover:border-red-200 transition cursor-pointer">
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                              <button title="Edit"
                                onClick={() => { setEditTarget(ing); setShowAdd(true); }}
                                className="h-8 w-8 rounded-lg flex items-center justify-center text-[#6F4E37] hover:bg-[#FAF3E0] border border-transparent hover:border-[#6F4E37]/25 transition cursor-pointer">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button title="Delete"
                                onClick={() => handleDelete(ing.id)}
                                className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-400 hover:bg-red-50 hover:text-red-500 border border-transparent hover:border-red-200 transition cursor-pointer">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {!filtered.length && (
                      <tr>
                        <td colSpan={8} className="p-12 text-center text-zinc-400 font-semibold">
                          {q ? "No ingredients match your search." : "No ingredients yet. Add your first ingredient."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {/* Daily Fresh Tab */}
        {tab === "fresh" && (
          <Card className="bg-white border border-blue-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-blue-100 flex items-center gap-3">
              <Droplets className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-extrabold text-blue-800">Daily Fresh Procurement View</p>
                <p className="text-xs text-blue-600/70">Perishable items that need daily restocking check. Items must be procured fresh each day.</p>
              </div>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-blue-50/60 border-b border-blue-100">
                    <tr>
                      {["Ingredient", "Unit", "Current Stock", "Min. Stock", "Shelf Life", "Urgency", "Actions"].map((h) => (
                        <th key={h} className="p-3 text-left font-bold text-blue-700/70 text-xs uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {perishableItems.map((ing) => {
                      const isLow = Number(ing.currentStock) <= Number(ing.minimumStock);
                      const isOut = Number(ing.currentStock) === 0;
                      return (
                        <tr key={ing.id}
                          className={`border-b border-blue-50 last:border-0 transition-colors ${
                            isOut ? "bg-red-50/40" : isLow ? "bg-amber-50/40" : "hover:bg-blue-50/20"
                          }`}>
                          <td className="p-3 font-semibold text-[#2B2118]">{ing.name}</td>
                          <td className="p-3 text-[#6F4E37]/70">{ing.unitOfMeasure}</td>
                          <td className="p-3 font-bold text-[#2B2118]">{Number(ing.currentStock).toFixed(3)}</td>
                          <td className="p-3 text-[#6F4E37]/70">{Number(ing.minimumStock).toFixed(3)}</td>
                          <td className="p-3">
                            <span className="text-xs font-bold text-blue-700">
                              {ing.shelfLifeDays > 0 ? `${ing.shelfLifeDays} day${ing.shelfLifeDays > 1 ? "s" : ""}` : "—"}
                            </span>
                          </td>
                          <td className="p-3">
                            {isOut
                              ? <span className="text-xs font-extrabold px-2 py-1 bg-red-100 text-red-700 border border-red-200 rounded-full">🚨 OUT — Procure Now!</span>
                              : isLow
                                ? <span className="text-xs font-extrabold px-2 py-1 bg-amber-100 text-amber-700 border border-amber-200 rounded-full">⚠️ Low — Buy Today</span>
                                : <span className="text-xs font-bold px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">✅ OK for Today</span>
                            }
                          </td>
                          <td className="p-3">
                            <button title="Receive Delivery / Adjust Stock"
                              onClick={() => setAdjustTarget(ing)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition cursor-pointer">
                              <ArrowDownToLine className="w-3 h-3" /> Receive Delivery
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {!perishableItems.length && (
                      <tr>
                        <td colSpan={7} className="p-12 text-center text-blue-400 font-semibold">
                          No perishable ingredients added yet. Enable the "Daily Fresh" flag when adding ingredients.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {/* Stock Ledger Tab */}
        {tab === "ledger" && (
          <Card className="bg-white border border-[#6F4E37]/20 rounded-3xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-[#6F4E37]/10">
              <h2 className="font-extrabold text-[#2B2118]">Stock Movement Ledger</h2>
              <p className="text-xs text-[#6F4E37]/60 mt-0.5">Complete audit trail of all stock changes</p>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-[#6F4E37]/40" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[#FAF3E0]/60 border-b border-[#6F4E37]/10">
                    <tr>
                      {["Date & Time", "Ingredient", "Type", "Change", "Resulting Stock", "Recorded By", "Notes"].map((h) => (
                        <th key={h} className="p-3 text-left font-bold text-[#6F4E37]/70 text-xs uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ledger.map((l) => {
                      const movCfg = MOVEMENT_LABELS[l.movementType] || { label: l.movementType, color: "bg-gray-100 text-gray-600 border-gray-200" };
                      const change = Number(l.quantityChange);
                      return (
                        <tr key={l.id} className="border-b border-[#6F4E37]/8 last:border-0 hover:bg-[#FAF3E0]/10 transition-colors">
                          <td className="p-3 text-xs text-[#6F4E37]/70 font-mono whitespace-nowrap">
                            {l.createdAt ? format(new Date(l.createdAt), "d MMM yy, HH:mm") : "—"}
                          </td>
                          <td className="p-3 font-semibold text-[#2B2118]">
                            {l.ingredient?.name ?? "—"} <span className="text-[#6F4E37]/50 text-xs">({l.ingredient?.unitOfMeasure})</span>
                          </td>
                          <td className="p-3">
                            <Badge className={`text-xs font-bold border ${movCfg.color}`}>{movCfg.label}</Badge>
                          </td>
                          <td className={`p-3 font-bold ${change >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                            {change >= 0 ? "+" : ""}{change.toFixed(3)}
                          </td>
                          <td className="p-3 font-semibold text-[#2B2118]">
                            {Number(l.resultingStock).toFixed(3)}
                          </td>
                          <td className="p-3 text-[#6F4E37]/70">{l.recordedBy?.name ?? "System"}</td>
                          <td className="p-3 text-xs text-zinc-500 max-w-[180px] truncate">{l.notes ?? "—"}</td>
                        </tr>
                      );
                    })}
                    {!ledger.length && (
                      <tr>
                        <td colSpan={7} className="p-12 text-center text-zinc-400 font-semibold">
                          No stock movements recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Dialogs */}
      <IngredientDialog
        open={showAdd}
        onClose={() => { setShowAdd(false); setEditTarget(null); }}
        editing={editTarget}
        onSaved={loadIngredients}
      />
      <AdjustDialog
        open={!!adjustTarget}
        onClose={() => setAdjustTarget(null)}
        ingredient={adjustTarget}
        onSaved={load}
      />
      <WastageDialog
        open={!!wastageTarget}
        onClose={() => setWastageTarget(null)}
        ingredient={wastageTarget}
        onSaved={load}
      />
    </AdminShell>
  );
}
