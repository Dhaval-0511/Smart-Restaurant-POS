import { useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const login = useStore((s) => s.login);
  const openSession = useStore((s) => s.openSession);
  const navigate = useNavigate();

  useEffect(() => { document.title = "Sign In | Cafe POS"; }, []);

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!email || !password) { toast.error("Please fill in all fields."); return; }
    setIsLoading(true);
    try {
      const user = await login(email, password, rememberMe);
      if (!user) { toast.error("Invalid email or password."); return; }
      await openSession();
      toast.success(`Welcome back, ${user.name}!`);
      navigate("/pos");
    } catch (err) {
      toast.error(err.message || "Login failed. Check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-root">
      {/* Left coffee illustration panel */}
      <div className="auth-left">
        <div className="auth-left-glow" />
        <div className="auth-left-content">
          <div className="auth-logo-ring">
            <span className="auth-logo-icon">&#9749;</span>
          </div>
          <h1 className="auth-brand">Cafe POS</h1>
          <p className="auth-brand-sub">Point of Sale</p>
          <div className="auth-divider" />
          <div className="auth-features">
            <div className="auth-feature-item">
              <span className="auth-feature-icon">&#128179;</span>
              <div>
                <p className="auth-feature-title">Smart Billing</p>
                <p className="auth-feature-desc">Fast order processing with kitchen sync</p>
              </div>
            </div>
            <div className="auth-feature-item">
              <span className="auth-feature-icon">&#128202;</span>
              <div>
                <p className="auth-feature-title">Live Analytics</p>
                <p className="auth-feature-desc">Real-time sales &amp; inventory tracking</p>
              </div>
            </div>
            <div className="auth-feature-item">
              <span className="auth-feature-icon">&#128101;</span>
              <div>
                <p className="auth-feature-title">Team Management</p>
                <p className="auth-feature-desc">Role-based access for staff &amp; admins</p>
              </div>
            </div>
          </div>
          <div className="auth-coffee-circles">
            <div className="auth-circle auth-circle-1" />
            <div className="auth-circle auth-circle-2" />
            <div className="auth-circle auth-circle-3" />
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-card-header">
            <div className="auth-card-logo-wrap">
              <span className="auth-card-logo-icon">&#9749;</span>
            </div>
            <h2 className="auth-card-title">Welcome back</h2>
            <p className="auth-card-subtitle">Sign in to your workspace to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label htmlFor="signin-email" className="auth-label">Email Address</label>
              <input
                id="signin-email"
                type="email"
                placeholder="name@cafe.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="auth-input"
              />
            </div>

            <div className="auth-field">
              <div className="auth-label-row">
                <label htmlFor="signin-password" className="auth-label">Password</label>
                <Link to="/forgot-password" className="auth-link-small">Forgot password?</Link>
              </div>
              <div className="auth-input-wrap">
                <input
                  id="signin-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="auth-input"
                />
                <button
                  type="button"
                  className="auth-eye-btn"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="auth-remember-row">
              <label className="auth-checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="auth-checkbox"
                />
                <span className="auth-checkbox-text">Remember me for 30 days</span>
              </label>
            </div>

            <button
              type="submit"
              id="signin-submit"
              disabled={isLoading}
              className="auth-btn-primary"
            >
              {isLoading ? (
                <span className="auth-btn-loading">
                  <span className="auth-spinner" />
                  Signing in...
                </span>
              ) : "Sign in to workspace"}
            </button>
          </form>

          <div className="auth-divider-text">
            <span>Don&apos;t have an account?</span>
          </div>
          <Link to="/register" className="auth-btn-secondary">
            Request Access
          </Link>
        </div>
      </div>
    </div>
  );
}
