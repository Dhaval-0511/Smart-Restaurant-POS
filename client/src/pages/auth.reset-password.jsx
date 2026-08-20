import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { authApi } from "@/lib/api";
import { toast } from "sonner";
import { Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => { document.title = "Reset Password | Cafe POS"; }, []);

  if (!token) {
    return (
      <div className="auth-root">
        <div className="auth-left">
          <div className="auth-left-glow" />
          <div className="auth-left-content">
            <div className="auth-logo-ring"><span className="auth-logo-icon">&#9749;</span></div>
            <h1 className="auth-brand">Cafe POS</h1>
            <p className="auth-brand-sub">Point of Sale</p>
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
              <div className="auth-success-icon-wrap" style={{ background: "rgba(220,38,38,0.1)" }}>
                <AlertCircle size={56} color="#dc2626" />
              </div>
              <h2 className="auth-card-title" style={{ marginTop: "20px" }}>Invalid Reset Link</h2>
              <p className="auth-card-subtitle" style={{ marginTop: "8px", textAlign: "center" }}>
                This password reset link is invalid or has expired. Please request a new one.
              </p>
              <Link to="/forgot-password" className="auth-btn-primary" style={{ marginTop: "28px", display: "block", textAlign: "center", textDecoration: "none" }}>
                Request New Link
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!form.password) { toast.error("Please enter a new password."); return; }
    if (form.password.length < 6) { toast.error("Password must be at least 6 characters."); return; }
    if (form.password !== form.confirmPassword) { toast.error("Passwords do not match."); return; }
    setIsLoading(true);
    try {
      await authApi.resetPassword(token, form.password);
      setSuccess(true);
    } catch (err) {
      toast.error(err.message || "Failed to reset password. The link may have expired.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-root">
      <div className="auth-left">
        <div className="auth-left-glow" />
        <div className="auth-left-content">
          <div className="auth-logo-ring"><span className="auth-logo-icon">&#9749;</span></div>
          <h1 className="auth-brand">Cafe POS</h1>
          <p className="auth-brand-sub">Point of Sale</p>
          <div className="auth-divider" />
          <p className="auth-left-quote">"A fresh start — secure your account with a new password."</p>
          <div className="auth-info-box">
            <p className="auth-info-title">Password Tips</p>
            <p className="auth-info-desc">Use at least 6 characters. Mix letters, numbers, and symbols for a stronger password.</p>
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
          {success ? (
            <div className="auth-success-wrap">
              <div className="auth-success-icon-wrap">
                <CheckCircle className="auth-success-icon" size={56} />
              </div>
              <h2 className="auth-card-title" style={{ marginTop: "20px" }}>Password Updated!</h2>
              <p className="auth-card-subtitle" style={{ marginTop: "8px", textAlign: "center" }}>
                Your password has been reset successfully. You can now sign in with your new password.
              </p>
              <button onClick={() => navigate("/")} className="auth-btn-primary" style={{ marginTop: "28px" }}>
                Sign In Now
              </button>
            </div>
          ) : (
            <>
              <div className="auth-card-header">
                <div className="auth-card-logo-wrap"><span className="auth-card-logo-icon">&#9749;</span></div>
                <h2 className="auth-card-title">Set new password</h2>
                <p className="auth-card-subtitle">Choose a strong password for your account</p>
              </div>

              <form onSubmit={handleSubmit} className="auth-form">
                <div className="auth-field">
                  <label htmlFor="reset-password" className="auth-label">New Password</label>
                  <div className="auth-input-wrap">
                    <input
                      id="reset-password"
                      type={showPass ? "text" : "password"}
                      placeholder="Min. 6 characters"
                      value={form.password}
                      onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                      required
                      autoFocus
                      className="auth-input"
                    />
                    <button type="button" className="auth-eye-btn" onClick={() => setShowPass((s) => !s)}>
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="auth-field">
                  <label htmlFor="reset-confirm" className="auth-label">Confirm New Password</label>
                  <div className="auth-input-wrap">
                    <input
                      id="reset-confirm"
                      type={showConfirm ? "text" : "password"}
                      placeholder="Repeat new password"
                      value={form.confirmPassword}
                      onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                      required
                      className="auth-input"
                    />
                    <button type="button" className="auth-eye-btn" onClick={() => setShowConfirm((s) => !s)}>
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button type="submit" id="reset-submit" disabled={isLoading} className="auth-btn-primary" style={{ marginTop: "8px" }}>
                  {isLoading ? (<span className="auth-btn-loading"><span className="auth-spinner" />Updating...</span>) : "Update Password"}
                </button>
              </form>

              <div className="auth-back-link">
                <Link to="/" className="auth-back-btn">Back to Sign In</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
