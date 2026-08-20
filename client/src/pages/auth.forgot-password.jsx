import { useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { authApi } from "@/lib/api";
import { toast } from "sonner";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { document.title = "Forgot Password | Cafe POS"; }, []);

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!email) { toast.error("Please enter your email address."); return; }
    setIsLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch (err) {
      toast.error(err.message || "Something went wrong. Try again.");
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
          <p className="auth-left-quote">"No worries — we will help you get back in."</p>
          <div className="auth-info-box">
            <p className="auth-info-title">What happens next?</p>
            <p className="auth-info-desc">We will send a password reset link to your email. The link expires in 1 hour for security.</p>
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
          {sent ? (
            <div className="auth-success-wrap">
              <div className="auth-success-icon-wrap">
                <CheckCircle className="auth-success-icon" size={56} />
              </div>
              <h2 className="auth-card-title" style={{ marginTop: "20px" }}>Check your email</h2>
              <p className="auth-card-subtitle" style={{ marginTop: "8px", textAlign: "center" }}>
                If an account exists for <strong>{email}</strong>, we have sent a password reset link. Check your inbox and spam folder.
              </p>
              <button onClick={() => navigate("/")} className="auth-btn-primary" style={{ marginTop: "28px" }}>
                Back to Sign In
              </button>
              <button onClick={() => setSent(false)} className="auth-btn-secondary" style={{ marginTop: "10px" }}>
                Try a different email
              </button>
            </div>
          ) : (
            <>
              <div className="auth-card-header">
                <div className="auth-card-logo-wrap" style={{ background: "rgba(111,78,55,0.1)" }}>
                  <Mail size={24} color="#6F4E37" />
                </div>
                <h2 className="auth-card-title">Forgot password?</h2>
                <p className="auth-card-subtitle">Enter your email and we will send you a reset link</p>
              </div>

              <form onSubmit={handleSubmit} className="auth-form">
                <div className="auth-field">
                  <label htmlFor="forgot-email" className="auth-label">Email Address</label>
                  <input
                    id="forgot-email"
                    type="email"
                    placeholder="name@cafe.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="auth-input"
                    autoFocus
                  />
                </div>

                <button type="submit" id="forgot-submit" disabled={isLoading} className="auth-btn-primary" style={{ marginTop: "8px" }}>
                  {isLoading ? (<span className="auth-btn-loading"><span className="auth-spinner" />Sending...</span>) : "Send Reset Link"}
                </button>
              </form>

              <div className="auth-back-link">
                <Link to="/" className="auth-back-btn">
                  <ArrowLeft size={15} />
                  Back to Sign In
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
