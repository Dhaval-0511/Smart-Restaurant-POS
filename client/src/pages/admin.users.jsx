import { useState, useEffect } from "react";
import { AdminShell } from "@/components/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Archive, Key, Loader2, UserCheck, UserX, Users, UserPlus, Clock } from "lucide-react";
import { authApi } from "@/lib/api";
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

function normaliseUser(u) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role === "ADMIN" ? "User" : "Employee",
    active: !u.isArchived,
    createdAt: u.createdAt,
    password: "", // never returned from server
  };
}

export default function UsersPage() {
  const [tab, setTab] = useState("active"); // "active" | "pending"
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState({}); // { [userId]: "EMPLOYEE" | "ADMIN" }

  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [pwdFor, setPwdFor] = useState(null);
  const [pwd, setPwd] = useState("");
  const [deleteFor, setDeleteFor] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  useEffect(() => {
    fetchUsers();
    fetchPendingUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${BASE_URL}/auth/employees`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch users");
      const json = await res.json();
      const data = json.data || json;
      const array = Array.isArray(data) ? data : (data.users ?? []);
      setUsers(array.map(normaliseUser));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingUsers = async () => {
    setPendingLoading(true);
    try {
      const data = await authApi.getPendingUsers();
      const array = Array.isArray(data) ? data : [];
      setPendingUsers(array);

      // Initialize default roles for pending users
      const initialRoles = {};
      array.forEach((u) => {
        initialRoles[u.id] = "EMPLOYEE";
      });
      setSelectedRoles((prev) => ({ ...initialRoles, ...prev }));
    } catch (err) {
      console.error("Failed to fetch pending requests:", err);
    } finally {
      setPendingLoading(false);
    }
  };

  const handleApprove = async (user) => {
    const role = selectedRoles[user.id] || "EMPLOYEE";
    setActionLoadingId(user.id);
    try {
      await authApi.approveUser(user.id, role);
      toast.success(`Approved ${user.name} as ${role === "ADMIN" ? "Admin (User)" : "Employee"}!`);
      // Refresh both lists
      setPendingUsers((prev) => prev.filter((p) => p.id !== user.id));
      await fetchUsers();
    } catch (err) {
      toast.error(err.message || "Failed to approve user");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (user) => {
    setActionLoadingId(user.id);
    try {
      await authApi.rejectUser(user.id);
      toast.success(`Rejected registration request for ${user.name}`);
      setPendingUsers((prev) => prev.filter((p) => p.id !== user.id));
    } catch (err) {
      toast.error(err.message || "Failed to reject user");
    } finally {
      setActionLoadingId(null);
    }
  };

  const startNew = () => {
    setEditing({
      name: "",
      email: "",
      password: "",
      role: "Employee",
      active: true,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!editing?.name || !editing?.email) return toast.error("Name & email required");
    try {
      const isNew = !editing.id;
      const url = isNew ? `${BASE_URL}/auth/register` : `${BASE_URL}/auth/employees/${editing.id}`;
      const method = isNew ? "POST" : "PUT";

      const payload = { ...editing };
      if (payload.role === "User") payload.role = "ADMIN";
      else payload.role = "EMPLOYEE";

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save user");
      const json = await res.json();
      const saved = normaliseUser(json.user ?? json.data ?? json);

      if (isNew) {
        toast.success("User created. If registration was submitted, approve in Pending Requests tab.");
        await fetchPendingUsers();
      } else {
        setUsers((prev) => prev.map((u) => (u.id === saved.id ? saved : u)));
        toast.success("Saved");
      }
      setOpen(false);
    } catch (err) {
      toast.error(err.message || "Failed to save user");
    }
  };

  const archive = async (id) => {
    try {
      const u = users.find((x) => x.id === id);
      if (!u) return;
      const res = await fetch(`${BASE_URL}/auth/employees/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ isArchived: u.active }),
      });
      if (!res.ok) throw new Error("Failed to archive user");

      setUsers((prev) =>
        prev.map((x) => (x.id === id ? { ...x, active: !x.active } : x))
      );
      toast.success(u.active ? "Archived" : "Unarchived");
    } catch (err) {
      toast.error(err.message || "Failed to archive user");
    }
  };

  const del = async (id) => {
    try {
      const res = await fetch(`${BASE_URL}/auth/employees/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const d = await res.json().catch(()=>({}));
        throw new Error(d.message || "Failed to delete user. They might have existing orders.");
      }
      
      setUsers((prev) => prev.filter((x) => x.id !== id));
      toast.success("Deleted");
      setDeleteFor(null);
    } catch (err) {
      toast.error(err.message || "Failed to delete user");
    }
  };

  const changePwd = async () => {
    if (!pwdFor || !pwd) return;
    try {
      const res = await fetch(`${BASE_URL}/auth/employees/${pwdFor.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ password: pwd }),
      });
      if (!res.ok) throw new Error("Failed to change password");

      toast.success("Password updated");
      setPwdFor(null);
    } catch (err) {
      toast.error(err.message || "Failed to update password");
    }
  };

  const handleRoleChange = async (u, newRole) => {
    try {
      const res = await fetch(`${BASE_URL}/auth/employees/${u.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ role: newRole === "User" ? "ADMIN" : "EMPLOYEE" }),
      });
      if (!res.ok) throw new Error("Failed to update role");

      setUsers((prev) =>
        prev.map((x) => (x.id === u.id ? { ...x, role: newRole } : x))
      );
      toast.success("Role updated");
    } catch (err) {
      toast.error(err.message || "Failed to update role");
    }
  };

  return (
    <AdminShell title="Users & Access Management">
      {/* Top action row with Tabs & New User Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2 p-1 bg-[#6F4E37]/10 rounded-2xl">
          <button
            onClick={() => setTab("active")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              tab === "active"
                ? "bg-[#6F4E37] text-white shadow-sm"
                : "text-[#6F4E37] hover:bg-[#6F4E37]/10"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Active Staff & Users ({users.length})</span>
          </button>

          <button
            onClick={() => { setTab("pending"); fetchPendingUsers(); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              tab === "pending"
                ? "bg-[#6F4E37] text-white shadow-sm"
                : "text-[#6F4E37] hover:bg-[#6F4E37]/10"
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Pending Requests</span>
            {pendingUsers.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                tab === "pending"
                  ? "bg-[#FAF3E0] text-[#6F4E37]"
                  : "bg-amber-500 text-white animate-pulse"
              }`}>
                {pendingUsers.length}
              </span>
            )}
          </button>
        </div>

        {tab === "active" && (
          <Button 
            onClick={startNew} 
            className="bg-[#6F4E37] hover:bg-[#6F4E37]/90 text-white font-bold rounded-xl cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1" /> Add User
          </Button>
        )}
      </div>

      {/* ── Active Users Table ────────────────────────────────────── */}
      {tab === "active" && (
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
                    <th className="p-3.5 text-left font-bold text-[#6F4E37]/80">Name</th>
                    <th className="p-3.5 text-left font-bold text-[#6F4E37]/80">Email</th>
                    <th className="p-3.5 text-left font-bold text-[#6F4E37]/80">Role</th>
                    <th className="p-3.5 text-left font-bold text-[#6F4E37]/80">Status</th>
                    <th className="p-3.5 w-40 text-right"></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-[#6F4E37]/10 last:border-0 hover:bg-[#FAF3E0]/20 transition duration-150">
                      <td className="p-3.5 font-semibold text-[#2B2118]">{u.name}</td>
                      <td className="p-3.5 text-[#6F4E37]/80">{u.email}</td>
                      <td className="p-3.5">
                        <Select value={u.role} onValueChange={(v) => handleRoleChange(u, v)}>
                          <SelectTrigger className="w-28 bg-[#FAF3E0] border-[#6F4E37]/20 text-[#2B2118] rounded-xl font-medium">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-[#6F4E37]/35 text-[#2B2118]">
                            <SelectItem value="User">User (Admin)</SelectItem>
                            <SelectItem value="Employee">Employee</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-3.5">
                        <Badge 
                          className={`rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                            u.active 
                              ? "bg-emerald-500/10 border-emerald-500/35 text-emerald-600" 
                              : "bg-zinc-500/10 border-zinc-500/30 text-[#6F4E37]/60"
                          }`}
                        >
                          {u.active ? "Active" : "Archived"}
                        </Badge>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex gap-1 justify-end">
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            title="Change password" 
                            onClick={() => { setPwdFor(u); setPwd(""); }}
                            className="hover:bg-[#6F4E37]/10 text-[#6F4E37]/60 hover:text-[#6F4E37] h-8 w-8 rounded-lg cursor-pointer"
                          >
                            <Key className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            title="Archive" 
                            onClick={() => archive(u.id)}
                            className={`hover:bg-[#6F4E37]/10 text-[#6F4E37]/60 hover:text-[#6F4E37] h-8 w-8 rounded-lg cursor-pointer ${!u.active ? 'bg-[#6F4E37]/10 text-[#6F4E37]' : ''}`}
                          >
                            <Archive className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={() => setDeleteFor(u)}
                            className="hover:bg-red-500/10 text-[#6F4E37]/60 hover:text-red-500 h-8 w-8 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-[#6F4E37]/60">No active users found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* ── Pending Requests Tab ──────────────────────────────────── */}
      {tab === "pending" && (
        <Card className="bg-white border border-[#6F4E37]/25 rounded-3xl overflow-hidden shadow-md text-[#2B2118]">
          <div className="p-4 bg-[#FAF3E0]/60 border-b border-[#6F4E37]/15 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#6F4E37]" />
              <span className="text-xs font-bold text-[#6F4E37] uppercase tracking-wider">
                Pending Registration Approvals ({pendingUsers.length})
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchPendingUsers}
              disabled={pendingLoading}
              className="text-xs rounded-xl border-[#6F4E37]/30 text-[#6F4E37] hover:bg-[#FAF3E0]"
            >
              {pendingLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Refresh"}
            </Button>
          </div>

          {pendingLoading ? (
            <div className="flex justify-center p-8 text-[#6F4E37]/60">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#FAF3E0] border-b border-[#6F4E37]/20">
                  <tr>
                    <th className="p-3.5 text-left font-bold text-[#6F4E37]/80">Applicant Name</th>
                    <th className="p-3.5 text-left font-bold text-[#6F4E37]/80">Email</th>
                    <th className="p-3.5 text-left font-bold text-[#6F4E37]/80">Requested At</th>
                    <th className="p-3.5 text-left font-bold text-[#6F4E37]/80">Assign Role</th>
                    <th className="p-3.5 w-56 text-right font-bold text-[#6F4E37]/80 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingUsers.map((u) => (
                    <tr key={u.id} className="border-b border-[#6F4E37]/10 last:border-0 hover:bg-[#FAF3E0]/20 transition duration-150">
                      <td className="p-3.5 font-bold text-[#2B2118]">{u.name}</td>
                      <td className="p-3.5 text-[#6F4E37]/80">{u.email}</td>
                      <td className="p-3.5 text-xs text-[#6F4E37]/60">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString(undefined, {
                          month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit"
                        }) : "Just now"}
                      </td>
                      <td className="p-3.5">
                        <Select
                          value={selectedRoles[u.id] || "EMPLOYEE"}
                          onValueChange={(val) => setSelectedRoles((prev) => ({ ...prev, [u.id]: val }))}
                        >
                          <SelectTrigger className="w-36 bg-[#FAF3E0] border-[#6F4E37]/25 text-[#2B2118] rounded-xl font-semibold">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-[#6F4E37]/35 text-[#2B2118]">
                            <SelectItem value="EMPLOYEE">Employee (Cashier)</SelectItem>
                            <SelectItem value="ADMIN">Admin (Manager)</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-3.5 text-right pr-4">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            disabled={actionLoadingId === u.id}
                            onClick={() => handleApprove(u)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer shadow-sm"
                          >
                            {actionLoadingId === u.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <>
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>Approve</span>
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={actionLoadingId === u.id}
                            onClick={() => handleReject(u)}
                            className="border-red-400/40 text-red-600 hover:bg-red-50 font-semibold rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <UserX className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {pendingUsers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-[#6F4E37]/60">
                        <UserCheck className="w-10 h-10 mx-auto text-[#6F4E37]/30 mb-2" />
                        <p className="font-semibold text-sm">No pending registration requests</p>
                        <p className="text-xs text-[#6F4E37]/50 mt-1">
                          When new staff register via the sign up page, their requests will appear here for role assignment and approval.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Dialogs: Edit/Create, Change Password, Delete */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-white border border-[#6F4E37]/30 text-[#2B2118] max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-[#6F4E37] font-extrabold text-lg">
              {editing?.id ? "Edit" : "New"} User
            </DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4 py-2 text-sm text-[#6F4E37]/80">
              <div className="space-y-1">
                <Label className="text-xs text-[#6F4E37]/60">Name</Label>
                <Input 
                  value={editing.name} 
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })} 
                  className="bg-[#FAF3E0] text-[#2B2118] border-[#6F4E37]/25 rounded-xl font-semibold"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-[#6F4E37]/60">Email</Label>
                <Input 
                  value={editing.email} 
                  onChange={(e) => setEditing({ ...editing, email: e.target.value })} 
                  className="bg-[#FAF3E0] text-[#2B2118] border-[#6F4E37]/25 rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-[#6F4E37]/60">Password</Label>
                <Input 
                  type="password" 
                  value={editing.password} 
                  onChange={(e) => setEditing({ ...editing, password: e.target.value })} 
                  className="bg-[#FAF3E0] text-[#2B2118] border-[#6F4E37]/25 rounded-xl"
                  placeholder={editing?.id ? "Leave blank to keep unchanged" : ""}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-[#6F4E37]/60">Role</Label>
                <Select value={editing.role} onValueChange={(v) => setEditing({ ...editing, role: v })}>
                  <SelectTrigger className="bg-[#FAF3E0] border-[#6F4E37]/25 text-[#2B2118] rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-[#6F4E37]/35 text-[#2B2118]">
                    <SelectItem value="User">User (Admin)</SelectItem>
                    <SelectItem value="Employee">Employee (Cashier)</SelectItem>
                  </SelectContent>
                </Select>
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
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!pwdFor} onOpenChange={(v) => !v && setPwdFor(null)}>
        <DialogContent className="bg-white border border-[#6F4E37]/30 text-[#2B2118] max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-[#6F4E37] font-extrabold text-lg">Change password for {pwdFor?.name}</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-2">
            <Label className="text-xs text-[#6F4E37]/60">New Password</Label>
            <Input 
              type="password" 
              placeholder="New password..." 
              value={pwd} 
              onChange={(e) => setPwd(e.target.value)} 
              className="bg-[#FAF3E0] text-[#2B2118] border-[#6F4E37]/25 rounded-xl"
            />
          </div>
          <DialogFooter className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              onClick={() => setPwdFor(null)}
              className="border-[#6F4E37]/20 text-[#6F4E37]/60 hover:bg-[#FAF3E0] flex-1 cursor-pointer rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={changePwd}
              className="bg-[#6F4E37] hover:bg-[#6F4E37]/90 text-white flex-1 font-bold cursor-pointer rounded-xl"
            >
              Update Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteFor} onOpenChange={(v) => !v && setDeleteFor(null)}>
        <DialogContent className="bg-white border border-[#6F4E37]/30 text-[#2B2118] max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-red-500 font-extrabold text-lg">Are you sure?</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-2">
            <p className="text-sm text-[#2B2118]/80">
              Are you sure you want to delete the user <strong className="text-[#6F4E37]">{deleteFor?.name}</strong>? 
            </p>
            <p className="text-xs text-red-500/80 font-semibold">
              This action cannot be undone. If they have processed any orders, deletion might fail.
            </p>
          </div>
          <DialogFooter className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              onClick={() => setDeleteFor(null)}
              className="border-[#6F4E37]/20 text-[#6F4E37]/60 hover:bg-[#FAF3E0] flex-1 cursor-pointer rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={() => del(deleteFor.id)}
              className="bg-red-500 hover:bg-red-600 text-white flex-1 font-bold cursor-pointer rounded-xl"
            >
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
