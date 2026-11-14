import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Store, Sliders, Save } from "lucide-react";

const SETTINGS_KEY = "cafe-settings-v1";
const PREFS_KEY    = "cafe-ui-prefs-v1";

function loadSettings() {
  try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}"); } catch { return {}; }
}
function loadPrefs() {
  try { return JSON.parse(localStorage.getItem(PREFS_KEY) || "{}"); } catch { return {}; }
}

export default function SettingsPage() {
  const userId    = useStore((s) => s.currentUserId);
  const storeUser = useStore((s) => s.users.find((u) => u.id === userId));
  const isManager = ["SUPER_ADMIN", "BRANCH_MANAGER", "ADMIN"].includes(storeUser?.role);

  // Store Info (managers only)
  const [info, setInfo] = useState({
    cafeName:    "",
    address:     "",
    phone:       "",
    gstNumber:   "",
    receiptHeader: "",
    receiptFooter: "Thank you for visiting!",
    ...loadSettings(),
  });

  // UI Prefs (all users)
  const [prefs, setPrefs] = useState({
    soundAlerts: true,
    compactMode: false,
    ...loadPrefs(),
  });

  const [activeTab, setActiveTab] = useState(isManager ? "store" : "prefs");

  // Save store info
  const handleSaveInfo = () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(info));
    toast.success("Store settings saved!");
  };

  // Toggle pref + auto-save
  const togglePref = (key) => {
    setPrefs((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      localStorage.setItem(PREFS_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const tabs = [
    ...(isManager ? [{ id: "store", label: "Store Info", icon: Store }] : []),
    { id: "prefs", label: "Preferences", icon: Sliders },
  ];

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-[#FAF3E0] text-[#2B2118] overflow-auto">
      <div className="px-6 pt-6 pb-4 shrink-0 max-w-2xl w-full mx-auto">
        <h1 className="text-2xl font-extrabold text-[#6F4E37] tracking-tight">Settings</h1>
        <p className="text-xs text-[#6F4E37]/60 mt-0.5 font-medium">Configure your cafe & preferences</p>
      </div>

      <div className="flex-1 px-6 pb-10 max-w-2xl w-full mx-auto space-y-5">

        {/* Tab Switcher */}
        <div className="flex gap-2 bg-white border border-[#6F4E37]/20 rounded-2xl p-1.5 shadow-sm">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition cursor-pointer ${
                activeTab === id
                  ? "bg-[#6F4E37] text-white shadow-sm"
                  : "text-[#6F4E37]/70 hover:bg-[#FAF3E0] hover:text-[#6F4E37]"
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {/* ── Store Info Tab ──────────────────────── */}
        {activeTab === "store" && isManager && (
          <Card className="bg-white border border-[#6F4E37]/20 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-[#2B2118] flex items-center gap-2">
              <Store className="w-4 h-4 text-[#6F4E37]" /> Store Information
            </h3>

            {[
              { label: "Cafe / Restaurant Name", key: "cafeName",    placeholder: "e.g. Odoo Cafe" },
              { label: "Address",                key: "address",     placeholder: "Full address" },
              { label: "Contact Phone",          key: "phone",       placeholder: "e.g. +91 98765 43210" },
              { label: "GST Number",             key: "gstNumber",   placeholder: "e.g. 27AABCU9603R1ZX" },
            ].map(({ label, key, placeholder }) => (
              <div key={key} className="space-y-1.5">
                <Label className="text-xs text-[#6F4E37]/70 font-semibold">{label}</Label>
                <Input
                  value={info[key]}
                  onChange={(e) => setInfo((p) => ({ ...p, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="bg-[#FAF3E0] border-[#6F4E37]/30 focus:border-[#6F4E37] rounded-xl text-[#2B2118]"
                />
              </div>
            ))}

            <div className="pt-1 border-t border-[#6F4E37]/10">
              <p className="text-xs font-bold text-[#6F4E37]/60 mb-3 uppercase tracking-wider">Receipt Customisation</p>
              {[
                { label: "Receipt Header Text", key: "receiptHeader", placeholder: "Printed at top of receipt" },
                { label: "Receipt Footer Text", key: "receiptFooter", placeholder: "e.g. Thank you for visiting!" },
              ].map(({ label, key, placeholder }) => (
                <div key={key} className="space-y-1.5 mb-4">
                  <Label className="text-xs text-[#6F4E37]/70 font-semibold">{label}</Label>
                  <Input
                    value={info[key]}
                    onChange={(e) => setInfo((p) => ({ ...p, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="bg-[#FAF3E0] border-[#6F4E37]/30 focus:border-[#6F4E37] rounded-xl text-[#2B2118]"
                  />
                </div>
              ))}
            </div>

            <Button
              onClick={handleSaveInfo}
              className="bg-[#6F4E37] hover:bg-[#6F4E37]/90 text-white font-bold rounded-xl px-5 cursor-pointer"
            >
              <Save className="w-4 h-4 mr-2" /> Save Store Settings
            </Button>
          </Card>
        )}

        {/* ── Preferences Tab ─────────────────────── */}
        {activeTab === "prefs" && (
          <Card className="bg-white border border-[#6F4E37]/20 rounded-2xl p-6 shadow-sm space-y-5">
            <h3 className="text-sm font-extrabold text-[#2B2118] flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#6F4E37]" /> UI Preferences
            </h3>

            {[
              { key: "soundAlerts",  label: "Sound Alerts",  desc: "Play a sound when a new order arrives on KDS" },
              { key: "compactMode",  label: "Compact Mode",  desc: "Use denser layout for menu & order items" },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between gap-4 py-2 border-b border-[#6F4E37]/10 last:border-0">
                <div>
                  <p className="text-sm font-bold text-[#2B2118]">{label}</p>
                  <p className="text-xs text-[#6F4E37]/60">{desc}</p>
                </div>
                <button
                  onClick={() => togglePref(key)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    prefs[key] ? "bg-[#6F4E37]" : "bg-zinc-200"
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      prefs[key] ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            ))}

            <p className="text-[11px] text-[#6F4E37]/50 font-medium pt-1">
              Preferences are saved locally on this device.
            </p>
          </Card>
        )}

      </div>
    </div>
  );
}

