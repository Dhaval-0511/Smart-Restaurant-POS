import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Search, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function getAuthHeaders() {
  const headers = { "Content-Type": "application/json" };
  try {
    const raw = localStorage.getItem("cafe-auth-token");
    const token = raw ? raw.replace(/^"|"$/g, "") : null;
    if (token) headers["Authorization"] = `Bearer ${token}`;
  } catch (e) {}
  return headers;
}

function normaliseCustomer(c) {
  return {
    id: c.id,
    name: c.name,
    email: c.email ?? "",
    phone: c.phone ?? "",
  };
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Reset to page 1 on search change
  useEffect(() => { setPage(1); }, [q]);

  const fetchCustomers = async () => {
    try {
      const res = await fetch(`${BASE_URL}/customers`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch customers");
      const json = await res.json();
      const data = json.data || json;
      setCustomers(Array.isArray(data) ? data.map(normaliseCustomer) : []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filtered = customers.filter(
    (c) =>
      !q ||
      c.name.toLowerCase().includes(q.toLowerCase()) ||
      (c.email && c.email.toLowerCase().includes(q.toLowerCase())) ||
      (c.phone && c.phone.includes(q))
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const startRow   = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endRow     = Math.min(page * PAGE_SIZE, filtered.length);

  const startNew = () => {
    setEditing({ name: "", email: "", phone: "" });
    setOpen(true);
  };

  const save = async () => {
    if (!editing?.name?.trim()) return toast.error("Customer name is required");
    if (!editing?.phone?.trim()) return toast.error("Phone number is required");
    try {
      const isNew = !editing.id;
      const url = isNew ? `${BASE_URL}/customers` : `${BASE_URL}/customers/${editing.id}`;
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: editing.name.trim(),
          phone: editing.phone.trim(),
          email: editing.email?.trim() || null,
        }),
      });

      if (!res.ok) throw new Error("Failed to save customer");
      const json = await res.json();
      const saved = normaliseCustomer(json.data || json);

      setCustomers((prev) =>
        isNew ? [...prev, saved] : prev.map((c) => (c.id === saved.id ? saved : c))
      );
      setOpen(false);
      toast.success("Saved");
    } catch (err) {
      toast.error(err.message || "Failed to save customer");
    }
  };

  const del = async (id) => {
    try {
      const res = await fetch(`${BASE_URL}/customers/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to delete customer");

      setCustomers((prev) => prev.filter((c) => c.id !== id));
      toast.success("Customer deleted");
    } catch (err) {
      toast.error(err.message || "Failed to delete customer");
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-[#FAF3E0] text-[#2B2118] select-none">
      {/* ── Fixed top section ─────────────────────────────────── */}
      <div className="px-6 pt-6 pb-3 shrink-0 max-w-4xl w-full mx-auto space-y-3">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-extrabold text-[#6F4E37] tracking-tight">Customers</h1>
            <p className="text-xs text-[#6F4E37]/60 mt-0.5 font-medium">
              {filtered.length} of {customers.length} customers{q ? " matching search" : ""}
            </p>
          </div>
          <Button onClick={startNew} className="bg-[#6F4E37] hover:bg-[#6F4E37]/90 text-white font-bold px-4 py-2 rounded-xl transition border border-[#6F4E37]/20 cursor-pointer">
            <Plus className="w-4 h-4 mr-1" /> New Customer
          </Button>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <Input
            placeholder="Search customers by name or phone..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9 bg-[#FAF3E0] text-[#2B2118] border-[#6F4E37]/30 focus:border-[#6F4E37] focus:bg-white rounded-xl"
          />
        </div>
      </div>

      {/* ── Scrollable card fills remaining height ──────────────── */}
      <div className="flex-1 min-h-0 px-6 pb-6 max-w-4xl w-full mx-auto">
        <Card className="bg-white border border-[#6F4E37]/25 rounded-3xl overflow-hidden shadow-md h-full flex flex-col">
          {loading ? (
            <div className="flex-1 flex justify-center items-center text-[#6F4E37]/60">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <>
              {/* List — scrolls inside the card */}
              <div className="flex-1 overflow-auto min-h-0">
                {paginated.map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-4 border-b border-[#6F4E37]/10 last:border-0 hover:bg-[#FAF3E0]/20 transition-all duration-200">
                    <div>
                      <div className="font-bold text-[#2B2118] text-sm">{c.name}</div>
                      <div className="text-xs text-[#6F4E37]/60 mt-1">
                        {c.phone || "No phone"}{c.email ? ` • ${c.email}` : ""}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => { setEditing(c); setOpen(true); }}
                        className="hover:bg-[#6F4E37]/10 text-[#6F4E37]/60 hover:text-[#6F4E37] cursor-pointer h-8 w-8 rounded-lg"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => del(c.id)}
                        className="hover:bg-red-500/10 text-[#6F4E37]/60 hover:text-red-400 cursor-pointer h-8 w-8 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {!paginated.length && (
                  <div className="p-10 text-center text-zinc-500 font-semibold">
                    {q ? "No customers match your search." : "No customers yet."}
                  </div>
                )}
              </div>

              {/* ── Pagination bar — always pinned to bottom of card ── */}
              <div className="shrink-0 flex items-center justify-between px-4 py-3 border-t border-[#6F4E37]/15 bg-[#FAF3E0]/40">
                <span className="text-xs font-semibold text-[#6F4E37]/70">
                  {filtered.length === 0
                    ? "No records"
                    : <>Showing <span className="font-extrabold text-[#6F4E37]">{startRow}–{endRow}</span> of{" "}
                       <span className="font-extrabold text-[#6F4E37]">{filtered.length}</span> customers</>
                  }
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 text-xs font-bold rounded-xl border border-[#6F4E37]/25 bg-white text-[#6F4E37] hover:bg-[#6F4E37]/10 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    ← Prev
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                    .reduce((acc, p, idx, arr) => {
                      if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, i) =>
                      p === '...' ? (
                        <span key={`dots-${i}`} className="px-1 text-xs text-[#6F4E37]/50">…</span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`w-8 h-8 text-xs font-bold rounded-xl border transition cursor-pointer ${
                            page === p
                              ? 'bg-[#6F4E37] text-white border-[#6F4E37] shadow-sm'
                              : 'bg-white text-[#6F4E37] border-[#6F4E37]/25 hover:bg-[#6F4E37]/10'
                          }`}
                        >
                          {p}
                        </button>
                      )
                    )}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1.5 text-xs font-bold rounded-xl border border-[#6F4E37]/25 bg-white text-[#6F4E37] hover:bg-[#6F4E37]/10 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    Next →
                  </button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-white border border-[#6F4E37]/30 text-[#2B2118] max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-[#6F4E37] font-bold">
              {editing?.id ? "Edit Customer Details" : "New Customer"}
            </DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4 py-2">
              <div className="space-y-1">
                <Label className="text-xs text-[#6F4E37]/70 font-semibold">Full Name *</Label>
                <Input 
                  value={editing.name} 
                  placeholder="Customer Name"
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })} 
                  className="bg-[#FAF3E0] text-[#2B2118] border-[#6F4E37]/30 rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-[#6F4E37]/70 font-semibold">Phone Number *</Label>
                <Input 
                  value={editing.phone} 
                  placeholder="e.g. 9876543210"
                  onChange={(e) => setEditing({ ...editing, phone: e.target.value })} 
                  className="bg-[#FAF3E0] text-[#2B2118] border-[#6F4E37]/30 rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-[#6F4E37]/70 font-semibold">Email Address</Label>
                  <span className="text-[10px] text-[#6F4E37]/60 font-semibold bg-[#FAF3E0] px-2 py-0.5 rounded-full border border-[#6F4E37]/15">Optional</span>
                </div>
                <Input 
                  type="email"
                  value={editing.email} 
                  placeholder="customer@example.com (optional)"
                  onChange={(e) => setEditing({ ...editing, email: e.target.value })} 
                  className="bg-[#FAF3E0] text-[#2B2118] border-[#6F4E37]/30 rounded-xl"
                />
              </div>
            </div>
          )}
          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setOpen(false)}
              className="border-[#6F4E37]/20 text-[#6F4E37]/60 hover:bg-[#FAF3E0] flex-1 cursor-pointer"
            >
              Discard
            </Button>
            <Button 
              onClick={save}
              className="bg-[#6F4E37] hover:bg-[#6F4E37]/90 text-white flex-1 font-bold cursor-pointer"
            >
              Save Customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
