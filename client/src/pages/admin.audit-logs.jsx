import { useState, useEffect } from "react";
import { AdminShell } from "@/components/AdminShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function getAuthHeaders() {
  const headers = { "Content-Type": "application/json" };
  try {
    const raw = localStorage.getItem("cafe-auth-token");
    const token = raw ? raw.replace(/^"|"$/g, "") : null;
    if (token) headers["Authorization"] = `Bearer ${token}`;
  } catch (e) {
    // no-op: access to localStorage failed (e.g. SSR or iframe)
  }
  return headers;
}

const ACTION_COLORS = {
  USER_LOGIN:       "bg-green-100 text-green-700 border-green-200",
  USER_APPROVED:    "bg-blue-100 text-blue-700 border-blue-200",
  USER_REJECTED:    "bg-red-100 text-red-700 border-red-200",
  PRODUCT_CREATED:  "bg-emerald-100 text-emerald-700 border-emerald-200",
  PRODUCT_UPDATED:  "bg-amber-100 text-amber-700 border-amber-200",
  PRODUCT_DELETED:  "bg-red-100 text-red-700 border-red-200",
  ORDER_PAID:       "bg-purple-100 text-purple-700 border-purple-200",
  ORDER_CANCELLED:  "bg-orange-100 text-orange-700 border-orange-200",
};

export default function AuditLogsPage() {
  const [logs, setLogs]     = useState([]);
  const [total, setTotal]   = useState(0);
  const [page, setPage]     = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);
  const limit = 50;

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`${BASE_URL}/auth/audit-logs?page=${page}&limit=${limit}`, {
      headers: getAuthHeaders(),
    })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json) => {
        // API returns { success, data: { logs, total } } via successResponse
        const payload = json.data ?? json;
        setLogs(Array.isArray(payload.logs) ? payload.logs : []);
        setTotal(typeof payload.total === "number" ? payload.total : 0);
      })
      .catch((err) => {
        setError(err.message);
        setLogs([]);
      })
      .finally(() => setLoading(false));
  }, [page]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <AdminShell title="Audit Logs">
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-[#6F4E37]/60">
            {total} total event{total !== 1 ? "s" : ""}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-semibold text-[#2B2118]">
              Page {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Body */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-[#6F4E37]" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-red-400 gap-2">
            <ShieldCheck className="w-10 h-10 stroke-[1.5]" />
            <span className="font-semibold">Failed to load audit logs</span>
            <span className="text-xs text-zinc-400">{error}</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-400 gap-2">
            <ShieldCheck className="w-10 h-10 stroke-[1.5]" />
            <span className="font-semibold">No audit logs found</span>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-[#6F4E37]/15 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-[#6F4E37]/10 bg-[#FAF3E0]/50">
                <tr>
                  {["Timestamp", "User", "Role", "Action", "Details", "IP"].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-xs font-extrabold uppercase tracking-wider text-[#6F4E37]/60"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#6F4E37]/8">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#FAF3E0]/30 transition">
                    <td className="px-4 py-3 text-xs text-[#6F4E37]/60 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#2B2118]">
                      {log.user?.name || "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-[#6F4E37]/70">
                      {log.user?.role || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full border ${
                          ACTION_COLORS[log.action] ??
                          "bg-zinc-100 text-zinc-600 border-zinc-200"
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-500 max-w-xs truncate">
                      {log.details || "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-400 font-mono">
                      {log.ipAddress || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
