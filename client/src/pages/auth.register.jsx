import { useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { authApi } from "@/lib/api";
import { toast } from "sonner";
import { Eye, EyeOff, CheckCircle, CheckCheck, X as XIcon } from "lucide-react";

// Password rules for strong password
const PWD_RULES = [
  { id: "length",  label: "At least 8 characters",   test: (v) => v.length >= 8 },
  { id: "upper",   label: "One uppercase letter (A-Z)", test: (v) => /[A-Z]/.test(v) },
  { id: "lower",   label: "One lowercase letter (a-z)", test: (v) => /[a-z]/.test(v) },
  { id: "number",  label: "One number (0-9)",           test: (v) => /[0-9]/.test(v) },
  { id: "special", label: "One special character (!@#$...)", test: (v) => /[!@#$%^&*(),.?":{}|<>_\-]/.test(v) },
];

function passwordStrength(pwd) {
  return PWD_RULES.filter((r) => r.test(pwd)).length;
}

export default function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [pwdFocused, setPwdFocused] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { document.title = "Register | Cafe POS"; }, []);

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!form.name || !form.email || !form.password) { toast.error("Please fill in all fields."); return; }
    if (form.password !== form.confirmPassword) { toast.error("Passwords do not match."); return; }
    // Strong password check
    const failedRules = PWD_RULES.filter((r) => !r.test(form.password));
    if (failedRules.length > 0) {
      toast.error(`Password needs: ${failedRules.map((r) => r.label).join(", ")}`);
      return;
    }
    setIsLoading(true);
    try {
      await authApi.register({ name: form.name, email: form.email, password: form.password });
      setSubmitted(true);
    } catch (err) {
      toast.error(err.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="auth-root">
        <div className="auth-left">
          <div className="auth-left-glow" />
          <div className="auth-left-content">
            <div className="auth-logo-ring"><span className="auth-logo-icon">&#9749;</span></div>
            <h1 className="auth-brand">Cafe POS</h1>
            <p className="auth-brand-sub">Point of Sale</p>
            <div className="auth-divider" />
            <p className="auth-left-quote">"Great coffee, seamless operations."</p>
            <div className="auth-coffee-circles">
              <div className="auth-circle auth-circle-1" />
              <div className="auth-circle auth-circle-2" />
              <div className="auth-circle auth-circle-3" />
            </div>
          </div>
        </div>
        <div className="auth-right">
          <div className="auth-card">
            <div className="auth-success-wrap">
              <div className="auth-success-icon-wrap">
                <CheckCircle className="auth-success-icon" size={56} />
              </div>
              <h2 className="auth-card-title" style={{ marginTop: "20px" }}>Request Submitted!</h2>
              <p className="auth-card-subtitle" style={{ marginTop: "8px", textAlign: "center" }}>
                Your registration request has been sent to the admin.
                You will be notified once your account is approved and a role is assigned.
              </p>
              <div className="auth-success-steps">
                <div className="auth-success-step">
                  <span className="auth-step-num">1</span>
                  <span>Admin reviews your request</span>
                </div>
                <div className="auth-success-step">
                  <span className="auth-step-num">2</span>
                  <span>Role is assigned (Admin / Employee)</span>
                </div>
                <div className="auth-success-step">
                  <span className="auth-step-num">3</span>
                  <span>You can sign in with your credentials</span>
                </div>
              </div>
              <button onClick={() => navigate("/login")} className="auth-btn-primary" style={{ marginTop: "28px" }}>
                Back to Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-root">
      <div className="auth-left">
        <div className="auth-left-glow" />
        <div className="auth-left-content">
          <div className="auth-logo-ring"><span className="auth-logo-icon">&#9749;</span></div>
          <h1 className="auth-brand">Cafe POS</h1>
          <p className="auth-brand-sub">Point of Sale</p>
          <div className="auth-divider" />
          <p className="auth-left-quote">"Join the team and start brewing great experiences."</p>
          <div className="auth-info-box">
            <p className="auth-info-title">How it works</p>
            <p className="auth-info-desc">Submit your registration request. The admin will review it, assign your role, and approve your access.</p>
          </div>
          <div className="auth-coffee-circles">
            <div className="auth-circle auth-circle-1" />
            <div className="auth-circle auth-circle-2" />
            <div className="auth-circle auth-circle-3" />
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-card-header">
            <div className="auth-card-logo-wrap"><span className="auth-card-logo-icon">&#9749;</span></div>
            <h2 className="auth-card-title">Create an account</h2>
            <p className="auth-card-subtitle">Request access to Cafe POS workspace</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label htmlFor="reg-name" className="auth-label">Full Name</label>
              <input id="reg-name" type="text" placeholder="John Doe" value={form.name} onChange={update("name")} required className="auth-input" />
            </div>

            <div className="auth-field">
              <label htmlFor="reg-email" className="auth-label">Email Address</label>
              <input id="reg-email" type="email" placeholder="name@cafe.com" value={form.email} onChange={update("email")} required autoComplete="email" className="auth-input" />
            </div>

            <div className="auth-field">
              <label htmlFor="reg-password" className="auth-label">Password</label>
              <div className="auth-input-wrap">
                <input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 chars with upper, lower, number"
                  value={form.password}
                  onChange={update("password")}
                  onFocus={() => setPwdFocused(true)}
                  required
                  className="auth-input"
                />
                <button type="button" className="auth-eye-btn" onClick={() => setShowPassword((s) => !s)}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {/* Password strength checklist */}
              {(pwdFocused || form.password.length > 0) && (
                <div style={{ marginTop: 8, padding: "10px 12px", background: "#FAF3E0", borderRadius: 10, border: "1px solid rgba(111,78,55,0.15)" }}>
                  <div style={{ marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#6F4E37", textTransform: "uppercase", letterSpacing: "0.5px" }}>Password strength</span>
                    <div style={{ flex: 1, height: 4, background: "rgba(111,78,55,0.1)", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{
                        height: "100%", borderRadius: 4, transition: "all 0.3s",
                        width: `${(passwordStrength(form.password) / PWD_RULES.length) * 100}%`,
                        background: passwordStrength(form.password) <= 2 ? "#ef4444" : passwordStrength(form.password) <= 3 ? "#f97316" : passwordStrength(form.password) <= 4 ? "#eab308" : "#22c55e",
                      }} />
                    </div>
                  </div>
                  {PWD_RULES.map((r) => {
                    const pass = r.test(form.password);
                    return (
                      <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
                        {pass
                          ? <CheckCheck size={12} color="#22c55e" />
                          : <XIcon size={12} color="#ef4444" />}
                        <span style={{ fontSize: 12, color: pass ? "#22c55e" : "#ef4444", fontWeight: 600 }}>{r.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="auth-field">
              <label htmlFor="reg-confirm" className="auth-label">Confirm Password</label>
              <div className="auth-input-wrap">
                <input id="reg-confirm" type={showConfirm ? "text" : "password"} placeholder="Repeat password" value={form.confirmPassword} onChange={update("confirmPassword")} required className="auth-input" />
                <button type="button" className="auth-eye-btn" onClick={() => setShowConfirm((s) => !s)}>
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" id="register-submit" disabled={isLoading} className="auth-btn-primary">
              {isLoading ? (<span className="auth-btn-loading"><span className="auth-spinner" />Submitting...</span>) : "Submit Request"}
            </button>
          </form>

          <div className="auth-divider-text"><span>Already have an account?</span></div>
          <Link to="/login" className="auth-btn-secondary">Sign In</Link>
        </div>
      </div>
    </div>
  );
}
