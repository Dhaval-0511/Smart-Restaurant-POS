import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { User, KeyRound, Save, Eye, EyeOff, ShieldCheck } from "lucide-react";

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

const ROLE_STYLES = {
  SUPER_ADMIN:       { label: "Super Admin",       cls: "bg-purple-100 text-purple-700 border-purple-200" },
  BRANCH_MANAGER:    { label: "Branch Manager",     cls: "bg-blue-100 text-blue-700 border-blue-200" },
  ADMIN:             { label: "Admin",              cls: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  CASHIER:           { label: "Cashier",            cls: "bg-amber-100 text-amber-700 border-amber-200" },
  KITCHEN_STAFF:     { label: "Kitchen Staff",      cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  INVENTORY_MANAGER: { label: "Inventory Manager",  cls: "bg-teal-100 text-teal-700 border-teal-200" },
  EMPLOYEE:          { label: "Employee",           cls: "bg-zinc-100 text-zinc-600 border-zinc-200" },
};

export default function ProfilePage() {
  const userId    = useStore((s) => s.currentUserId);
  const storeUser = useStore((s) => s.users.find((u) => u.id === userId));

  const [profile,    setProfile]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [name,       setName]       = useState("");
  const [savingName, setSavingName] = useState(false);

  const [curPwd,    setCurPwd]    = useState("");
  const [newPwd,    setNewPwd]    = useState("");
  const [confPwd,   setConfPwd]   = useState("");
  const [savingPwd, setSavingPwd] = useState(false);
  const [showCur,   setShowCur]   = useState(false);
  const [showNew,   setShowNew]   = useState(false);
  const [showConf,  setShowConf]  = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/auth/profile`, { headers: getAuthHeaders() });
        if (!res.ok) throw new Error("Failed to load profile");
        const json = await res.json();
        const data = json.data || json;
        setProfile(data);
        setName(data.name ?? "");
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSaveName = async () => {
    if (!name.trim()) return toast.error("Name cannot be empty");
    setSavingName(true);
    try {
      const res = await fetch(`${BASE_URL}/auth/profile`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) throw new Error("Failed to update name");
      const json = await res.json();
      setProfile((p) => ({ ...p, name: json.data?.name ?? name.trim() }));
      toast.success("Name updated!");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingName(false);
    }
  };

  const handleSavePassword = async () => {
    if (!curPwd)  return toast.error("Current password is required");
    if (!newPwd)  return toast.error("New password is required");
    if (newPwd.length < 6) return toast.error("Password must be at least 6 characters");
    if (newPwd !== confPwd) return toast.error("Passwords do not match");
    setSavingPwd(true);
    try {
      const res = await fetch(`${BASE_URL}/auth/profile`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ currentPassword: curPwd, password: newPwd }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to update password");
      toast.success("Password changed successfully!");
      setCurPwd(""); setNewPwd(""); setConfPwd("");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingPwd(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FAF3E0]">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#6F4E37] border-t-transparent" />
      </div>
    );
  }

  const role     = profile?.role ?? storeUser?.role ?? "EMPLOYEE";
  const roleInfo = ROLE_STYLES[role] ?? ROLE_STYLES.EMPLOYEE;

  const pwdFields = [
    { label: "Current Password", val: curPwd, set: setCurPwd, show: showCur, toggle: () => setShowCur((v) => !v) },
    { label: "New Password",     val: newPwd, set: setNewPwd, show: showNew, toggle: () => setShowNew((v) => !v) },
    { label: "Confirm New Password", val: confPwd, set: setConfPwd, show: showConf, toggle: () => setShowConf((v) => !v) },
  ];

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-[#FAF3E0] text-[#2B2118] overflow-auto">
      <div className="px-6 pt-6 pb-4 shrink-0 max-w-2xl w-full mx-auto">
        <h1 className="text-2xl font-extrabold text-[#6F4E37] tracking-tight">My Profile</h1>
        <p className="text-xs text-[#6F4E37]/60 mt-0.5 font-medium">Manage your account details</p>
      </div>

      <div className="flex-1 px-6 pb-10 max-w-2xl w-full mx-auto space-y-5">

        {/* ── Identity Card ─────────────────────────── */}
        <Card className="bg-white border border-[#6F4E37]/20 rounded-2xl p-6 flex items-center gap-5 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-[#FAF3E0] border-2 border-[#6F4E37]/30 flex items-center justify-center shrink-0">
            <User className="w-8 h-8 text-[#6F4E37]" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-extrabold text-[#2B2118] truncate">{profile?.name ?? "—"}</h2>
            <p className="text-sm text-[#6F4E37]/70 truncate">{profile?.email ?? "—"}</p>
            <span className={`inline-flex items-center gap-1 mt-2 text-[11px] font-bold px-3 py-0.5 rounded-full border ${roleInfo.cls}`}>
              <ShieldCheck className="w-3 h-3" /> {roleInfo.label}
            </span>
          </div>
        </Card>

        {/* ── Update Name ───────────────────────────── */}
        <Card className="bg-white border border-[#6F4E37]/20 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-[#6F4E37]" />
            <h3 className="text-sm font-extrabold text-[#2B2118]">Update Display Name</h3>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-[#6F4E37]/70 font-semibold">Full Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              className="bg-[#FAF3E0] border-[#6F4E37]/30 focus:border-[#6F4E37] rounded-xl text-[#2B2118]"
            />
          </div>
          <Button
            onClick={handleSaveName}
            disabled={savingName || name.trim() === (profile?.name ?? "")}
            className="bg-[#6F4E37] hover:bg-[#6F4E37]/90 text-white font-bold rounded-xl px-5 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            {savingName ? "Saving…" : "Save Name"}
          </Button>
        </Card>

        {/* ── Change Password ───────────────────────── */}
        <Card className="bg-white border border-[#6F4E37]/20 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-[#6F4E37]" />
            <h3 className="text-sm font-extrabold text-[#2B2118]">Change Password</h3>
          </div>

          {pwdFields.map(({ label, val, set, show, toggle }) => (
            <div key={label} className="space-y-1.5">
              <Label className="text-xs text-[#6F4E37]/70 font-semibold">{label}</Label>
              <div className="relative">
                <Input
                  type={show ? "text" : "password"}
                  value={val}
                  onChange={(e) => set(e.target.value)}
                  placeholder="••••••••"
                  className="bg-[#FAF3E0] border-[#6F4E37]/30 focus:border-[#6F4E37] rounded-xl text-[#2B2118] pr-10"
                />
                <button
                  type="button"
                  onClick={toggle}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6F4E37]/50 hover:text-[#6F4E37] cursor-pointer"
                >
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}

          <Button
            onClick={handleSavePassword}
            disabled={savingPwd || !curPwd || !newPwd || !confPwd}
            className="bg-[#6F4E37] hover:bg-[#6F4E37]/90 text-white font-bold rounded-xl px-5 cursor-pointer disabled:opacity-50"
          >
            <KeyRound className="w-4 h-4 mr-2" />
            {savingPwd ? "Updating…" : "Update Password"}
          </Button>
        </Card>

      </div>
    </div>
  );
}
