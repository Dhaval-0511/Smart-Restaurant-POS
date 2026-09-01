import { useState, useEffect } from "react";
import { AdminShell } from "@/components/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Plus, Search, Pencil, Trash2, Loader2, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { inventoryApi } from "@/lib/api";

const TAXES = [0, 5, 12, 18, 28];
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

function normaliseProduct(p) {
  return {
    id: p.id,
    name: p.name,
    categoryId: p.categoryId,
    price: Number(p.price),
    unit: p.unitOfMeasure ?? "piece",
    tax: Number(p.tax ?? 0),
    description: p.description ?? "",
    imageUrl: p.imageUrl ?? null,
    sendToKitchen: p.showInKds ?? false,
  };
}

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [selected, setSelected] = useState([]);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [catOpen, setCatOpen] = useState(false);

  // Recipe Builder state
  const [recipeOpen, setRecipeOpen] = useState(false);
  const [recipeProduct, setRecipeProduct] = useState(null);
  const [recipeItems, setRecipeItems] = useState([]);
  const [allIngredients, setAllIngredients] = useState([]);
  const [recipeSaving, setRecipeSaving] = useState(false);
  const [recipeLoading, setRecipeLoading] = useState(false);

  useEffect(() => {
    fetchData();
    // Load all ingredients for the recipe builder
    inventoryApi.getIngredients().then((data) => {
      setAllIngredients(Array.isArray(data) ? data : []);
    }).catch(() => {});
  }, []);

  const fetchData = async () => {
    try {
      const [prodsRes, catsRes] = await Promise.all([
        fetch(`${BASE_URL}/products`, { headers: getAuthHeaders() }),
        fetch(`${BASE_URL}/categories`, { headers: getAuthHeaders() }),
      ]);
      
      if (!prodsRes.ok || !catsRes.ok) throw new Error("Failed to fetch data");
      
      const prodsJson = await prodsRes.json();
      const catsJson = await catsRes.json();
      
      const pData = prodsJson.data || prodsJson;
      const cData = catsJson.data || catsJson;

      setProducts(Array.isArray(pData) ? pData.map(normaliseProduct) : []);
      setCategories(Array.isArray(cData) ? cData : []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filtered = products.filter((p) => !q || p.name.toLowerCase().includes(q.toLowerCase()));

  const startNew = () => {
    setEditing({
      name: "",
      categoryId: categories[0]?.id ?? "",
      price: 0,
      unit: "piece",
      tax: 5,
      description: "",
      sendToKitchen: true,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!editing?.name) return toast.error("Name required");
    try {
      const payload = {
        name: editing.name,
        categoryId: editing.categoryId,
        price: editing.price,
        unitOfMeasure: editing.unit,
        tax: editing.tax,
        description: editing.description,
        imageUrl: editing.imageUrl,
        showInKds: editing.sendToKitchen,
      };

      const isNew = !editing.id;
      const url = isNew ? `${BASE_URL}/products` : `${BASE_URL}/products/${editing.id}`;
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save product");
      const json = await res.json();
      const saved = normaliseProduct(json.data || json);

      setProducts((prev) =>
        isNew ? [...prev, saved] : prev.map((p) => (p.id === saved.id ? saved : p))
      );
      setOpen(false);
      toast.success("Product saved successfully");
    } catch (err) {
      toast.error(err.message || "Failed to save product");
    }
  };

  const deleteProduct = async (id) => {
    try {
      const res = await fetch(`${BASE_URL}/products/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to delete product");
      
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setSelected((prev) => prev.filter((x) => x !== id));
      toast.success("Product deleted successfully");
    } catch (err) {
      toast.error(err.message || "Failed to delete product");
    }
  };

  const createCat = async () => {
    if (!newCatName?.trim()) return;
    const colors = ["#F59E0B", "#EC4899", "#10B981", "#3B82F6", "#8B5CF6"];
    const color = colors[Math.floor(Math.random() * colors.length)];
    try {
      const res = await fetch(`${BASE_URL}/categories`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ name: newCatName, color }),
      });
      if (!res.ok) throw new Error("Failed to create category");
      const json = await res.json();
      const savedCat = json.data || json;

      setCategories((prev) => [...prev, savedCat]);
      if (editing) setEditing({ ...editing, categoryId: savedCat.id });
      setNewCatName("");
      setCatOpen(false);
      toast.success("Category created successfully");
    } catch (err) {
      toast.error(err.message || "Failed to create category");
    }
  };

  const createTable = async () => {
    if (!newTableName?.trim()) return;
    const colors = ["#F59E0B", "#EC4899", "#10B981", "#3B82F6", "#8B5CF6"];
    const color = colors[Math.floor(Math.random() * colors.length)];
    try {
      const res = await fetch(`${BASE_URL}/tables`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ name: newTableName, color }),
      });
      if (!res.ok) throw new Error("Failed to create table");
      const json = await res.json();
      const savedTable = json.data || json;

      setTables((prev) => [...prev, savedTable]);
      if (editing) setEditing({ ...editing, tableId: savedTable.id });
      setNewTableName("");
      setTableOpen(false);
      toast.success("Table created successfully");
    } catch (err) {
      toast.error(err.message || "Failed to create table");
    }
  };

  const openRecipeBuilder = async (product) => {
    setRecipeProduct(product);
    setRecipeOpen(true);
    setRecipeLoading(true);
    try {
      const items = await inventoryApi.getRecipe(product.id);
      setRecipeItems(Array.isArray(items) ? items.map((ri) => ({
        ingredientId: ri.ingredientId,
        ingredientName: ri.ingredient?.name ?? "",
        unit: ri.ingredient?.unitOfMeasure ?? "",
        quantity: Number(ri.quantity),
        wastagePercent: Number(ri.wastagePercent),
      })) : []);
    } catch {
      setRecipeItems([]);
    } finally {
      setRecipeLoading(false);
    }
  };

  const saveRecipe = async () => {
    if (!recipeProduct) return;
    setRecipeSaving(true);
    try {
      await inventoryApi.setRecipe(recipeProduct.id, recipeItems.map((ri) => ({
        ingredientId: ri.ingredientId,
        quantity: ri.quantity,
        wastagePercent: ri.wastagePercent,
      })));
      toast.success("Recipe saved successfully");
      setRecipeOpen(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setRecipeSaving(false);
    }
  };

  const addRecipeRow = () => {
    const first = allIngredients[0];
    if (!first) { toast.error("No ingredients found — add some in Inventory first"); return; }
    // Avoid duplicate ingredient
    const used = new Set(recipeItems.map((r) => r.ingredientId));
    const next = allIngredients.find((i) => !used.has(i.id));
    if (!next) { toast.error("All ingredients already added"); return; }
    setRecipeItems((prev) => [...prev, {
      ingredientId: next.id,
      ingredientName: next.name,
      unit: next.unitOfMeasure,
      quantity: 0,
      wastagePercent: 0,
    }]);
  };

  return (
    <AdminShell title="Products">
      <div className="flex items-center gap-2 mb-4">
        <Button 
          onClick={startNew}
          className="bg-[#6F4E37] hover:bg-[#6F4E37]/90 text-white font-bold rounded-xl cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-1" /> New Product
        </Button>
        {selected.length > 0 && (
          <Button
            variant="destructive"
            onClick={() => {
              selected.forEach(deleteProduct);
            }}
            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/25 font-bold rounded-xl cursor-pointer"
          >
            <Trash2 className="w-4 h-4 mr-1 inline" /> Delete ({selected.length})
          </Button>
        )}
        <div className="relative ml-auto w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <Input 
            placeholder="Search products..." 
            value={q} 
            onChange={(e) => setQ(e.target.value)} 
            className="pl-9 bg-[#FAF3E0] text-[#2B2118] border-[#6F4E37]/30 focus:border-[#6F4E37] focus:bg-white rounded-xl"
          />
        </div>
      </div>

      <Card className="bg-white border border-[#6F4E37]/25 rounded-3xl overflow-hidden shadow-md text-[#2B2118]">
        {loading ? (
          <div className="flex justify-center p-8 text-[#6F4E37]/60">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#FAF3E0] border-b border-[#6F4E37]/20">
                <tr>
                  <th className="p-3 w-10 text-center"></th>
                  <th className="p-3 text-left font-bold text-[#6F4E37]/80">Name</th>
                  <th className="p-3 text-left font-bold text-[#6F4E37]/80">Category</th>
                  <th className="p-3 text-right font-bold text-[#6F4E37]/80">Price</th>
                  <th className="p-3 text-right font-bold text-[#6F4E37]/80">Tax</th>
                  <th className="p-3 w-20 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const c = categories.find((cat) => cat.id === p.categoryId);
                  return (
                    <tr key={p.id} className="border-b border-[#6F4E37]/10 last:border-0 hover:bg-[#FAF3E0]/10 transition duration-150">
                      <td className="p-3 text-center">
                        <Checkbox
                          checked={selected.includes(p.id)}
                          onCheckedChange={(v) =>
                            setSelected(v ? [...selected, p.id] : selected.filter((x) => x !== p.id))
                          }
                          className="border-[#6F4E37]/30 text-[#6F4E37] data-[state=checked]:bg-[#6F4E37]"
                        />
                      </td>
                      <td className="p-3 font-semibold text-[#2B2118]">{p.name}</td>
                      <td className="p-3">
                        {c && (
                          <span
                            className="px-2 py-0.5 rounded-full text-xs font-bold text-white shadow-sm"
                            style={{ background: c.color }}
                          >
                            {c.name}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right font-extrabold text-[#6F4E37]">₹{p.price}</td>
                      <td className="p-3 text-right text-[#6F4E37]/80">{p.tax}%</td>
                      <td className="p-3 text-right">
                        <div className="flex gap-1 justify-end">
                          <Button
                            size="icon"
                            variant="ghost"
                            title="Recipe Builder"
                            onClick={() => openRecipeBuilder(p)}
                            className="hover:bg-amber-50 text-amber-600/60 hover:text-amber-600 h-8 w-8 rounded-lg cursor-pointer"
                          >
                            <BookOpen className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={() => { setEditing(p); setOpen(true); }}
                            className="hover:bg-[#6F4E37]/10 text-[#6F4E37]/60 hover:text-[#6F4E37] h-8 w-8 rounded-lg cursor-pointer"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={() => deleteProduct(p.id)}
                            className="hover:bg-red-500/10 text-[#6F4E37]/60 hover:text-red-400 h-8 w-8 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-[#6F4E37]/60">No products found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-white border border-[#6F4E37]/30 text-[#2B2118] max-w-lg rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-[#6F4E37] font-extrabold text-lg">
              {editing?.id ? "Edit" : "New"} Product
            </DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="grid grid-cols-2 gap-4 py-2 text-sm text-[#6F4E37]/80">
              <div className="col-span-2 space-y-1">
                <Label className="text-xs text-[#6F4E37]/60">Name</Label>
                <Input 
                  value={editing.name} 
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })} 
                  className="bg-[#FAF3E0] text-[#2B2118] border-[#6F4E37]/25 rounded-xl font-semibold"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-[#6F4E37]/60">Category</Label>
                <Select
                  value={editing.categoryId}
                  onValueChange={(v) => {
                    if (v === "__new") setCatOpen(true);
                    else setEditing({ ...editing, categoryId: v });
                  }}
                >
                  <SelectTrigger className="bg-[#FAF3E0] border-[#6F4E37]/25 text-[#2B2118] rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-[#6F4E37]/35 text-[#2B2118]">
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                    <SelectItem value="__new">+ Create new...</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-[#6F4E37]/60">Price (₹)</Label>
                <Input 
                  type="number" 
                  value={editing.price} 
                  onChange={(e) => setEditing({ ...editing, price: parseFloat(e.target.value) || 0 })} 
                  className="bg-[#FAF3E0] text-[#2B2118] border-[#6F4E37]/25 rounded-xl font-bold text-[#6F4E37]"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-[#6F4E37]/60">Unit</Label>
                <Input 
                  value={editing.unit} 
                  onChange={(e) => setEditing({ ...editing, unit: e.target.value })} 
                  className="bg-[#FAF3E0] text-[#2B2118] border-[#6F4E37]/25 rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-[#6F4E37]/60">Tax</Label>
                <Select value={String(editing.tax)} onValueChange={(v) => setEditing({ ...editing, tax: parseInt(v) })}>
                  <SelectTrigger className="bg-[#FAF3E0] border-[#6F4E37]/25 text-[#2B2118] rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-[#6F4E37]/35 text-[#2B2118]">
                    {TAXES.map((t) => (
                      <SelectItem key={t} value={String(t)}>{t}%</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-xs text-[#6F4E37]/60">Description</Label>
                <Input 
                  value={editing.description ?? ""} 
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })} 
                  className="bg-[#FAF3E0] text-[#2B2118] border-[#6F4E37]/25 rounded-xl"
                />
              </div>
              <div className="col-span-2 flex items-center gap-3 pt-2">
                <Checkbox
                  id="k"
                  checked={editing.sendToKitchen}
                  onCheckedChange={(v) => setEditing({ ...editing, sendToKitchen: !!v })}
                  className="border-[#6F4E37]/30 text-[#6F4E37] data-[state=checked]:bg-[#6F4E37]"
                />
                <Label htmlFor="k" className="cursor-pointer font-semibold">Send to Kitchen Display</Label>
              </div>
            </div>
          )}
          <DialogFooter className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              onClick={() => setOpen(false)}
              className="border-[#6F4E37]/20 text-[#6F4E37]/60 hover:bg-[#FAF3E0] flex-1 cursor-pointer rounded-xl"
            >
              Discard
            </Button>
            <Button 
              onClick={save}
              className="bg-[#6F4E37] hover:bg-[#6F4E37]/90 text-white flex-1 font-bold cursor-pointer rounded-xl"
            >
              Save Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={catOpen} onOpenChange={setCatOpen}>
        <DialogContent className="bg-white border border-[#6F4E37]/30 text-[#2B2118] max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-[#6F4E37] font-extrabold text-lg">New Category</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-2">
            <Label className="text-xs text-[#6F4E37]/60">Category Name</Label>
            <Input 
              value={newCatName} 
              onChange={(e) => setNewCatName(e.target.value)} 
              className="bg-[#FAF3E0] text-[#2B2118] border-[#6F4E37]/25 rounded-xl"
            />
          </div>
          <DialogFooter className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              onClick={() => setCatOpen(false)}
              className="border-[#6F4E37]/20 text-[#6F4E37]/60 hover:bg-[#FAF3E0] flex-1 cursor-pointer rounded-xl"
            >
              Cancel
            </Button>
            <Button 
              onClick={createCat}
              className="bg-[#6F4E37] hover:bg-[#6F4E37]/90 text-white flex-1 font-bold cursor-pointer rounded-xl"
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Recipe Builder Dialog ── */}
      <Dialog open={recipeOpen} onOpenChange={(v) => { if (!v) setRecipeOpen(false); }}>
        <DialogContent className="bg-white border border-[#6F4E37]/30 max-w-2xl rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-[#6F4E37] font-extrabold text-lg flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Recipe Builder — {recipeProduct?.name}
            </DialogTitle>
            <p className="text-xs text-zinc-500 mt-0.5">
              Define ingredient quantities used per 1 unit of this product. Stock will be auto-deducted on sale.
            </p>
          </DialogHeader>

          {recipeLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-7 h-7 animate-spin text-[#6F4E37]/40" />
            </div>
          ) : (
            <div className="space-y-3 py-2 max-h-[55vh] overflow-y-auto pr-1">
              {recipeItems.length === 0 && (
                <div className="text-center py-8 text-zinc-400 text-sm font-semibold">
                  No recipe items yet. Click "Add Ingredient" to start.
                </div>
              )}
              {recipeItems.map((ri, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center bg-[#FAF3E0]/40 border border-[#6F4E37]/15 rounded-2xl p-3">
                  {/* Ingredient Selector */}
                  <Select
                    value={ri.ingredientId}
                    onValueChange={(val) => {
                      const ing = allIngredients.find((i) => i.id === val);
                      setRecipeItems((prev) => prev.map((r, i) =>
                        i === idx ? { ...r, ingredientId: val, ingredientName: ing?.name ?? "", unit: ing?.unitOfMeasure ?? "" } : r
                      ));
                    }}
                  >
                    <SelectTrigger className="rounded-xl border-[#6F4E37]/25 bg-white text-sm">
                      <SelectValue placeholder="Select ingredient…" />
                    </SelectTrigger>
                    <SelectContent>
                      {allIngredients.map((ing) => (
                        <SelectItem key={ing.id} value={ing.id}>
                          {ing.name} ({ing.unitOfMeasure})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Quantity */}
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number" min="0.001" step="0.001"
                      value={ri.quantity}
                      onChange={(e) => setRecipeItems((prev) => prev.map((r, i) =>
                        i === idx ? { ...r, quantity: Number(e.target.value) } : r
                      ))}
                      className="w-24 rounded-xl border-[#6F4E37]/25 text-sm text-center"
                      placeholder="Qty"
                    />
                    <span className="text-xs text-[#6F4E37]/70 font-bold w-8 shrink-0">{ri.unit}</span>
                  </div>

                  {/* Wastage % */}
                  <div className="flex items-center gap-1">
                    <Input
                      type="number" min="0" max="100" step="0.5"
                      value={ri.wastagePercent}
                      onChange={(e) => setRecipeItems((prev) => prev.map((r, i) =>
                        i === idx ? { ...r, wastagePercent: Number(e.target.value) } : r
                      ))}
                      className="w-20 rounded-xl border-[#6F4E37]/25 text-sm text-center"
                      placeholder="0"
                    />
                    <span className="text-xs text-[#6F4E37]/70 font-bold shrink-0">% waste</span>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => setRecipeItems((prev) => prev.filter((_, i) => i !== idx))}
                    className="h-8 w-8 rounded-lg hover:bg-red-50 text-zinc-400 hover:text-red-500 flex items-center justify-center border border-transparent hover:border-red-200 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              <Button
                variant="outline"
                onClick={addRecipeRow}
                className="w-full border-dashed border-[#6F4E37]/40 text-[#6F4E37] hover:bg-[#FAF3E0] rounded-xl cursor-pointer font-bold"
              >
                <Plus className="w-4 h-4 mr-1.5" /> Add Ingredient
              </Button>
            </div>
          )}

          <DialogFooter className="flex gap-2 pt-2 border-t border-[#6F4E37]/10">
            <Button variant="outline" onClick={() => setRecipeOpen(false)}
              className="border-[#6F4E37]/25 text-[#6F4E37] rounded-xl cursor-pointer">
              Cancel
            </Button>
            <Button onClick={saveRecipe} disabled={recipeSaving}
              className="bg-[#6F4E37] hover:bg-[#5A3A1A] text-white rounded-xl cursor-pointer font-bold">
              {recipeSaving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Save Recipe
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
