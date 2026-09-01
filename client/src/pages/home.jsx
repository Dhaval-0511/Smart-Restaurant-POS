import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  ChefHat, BarChart3, ShoppingCart, Users, Boxes, UtensilsCrossed,
  Zap, Shield, Clock, Star, ArrowRight, Menu, X, Coffee, Check
} from "lucide-react";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how" },
  { label: "Why Us", href: "#why" },
];

const FEATURES = [
  {
    icon: ShoppingCart,
    title: "POS Terminal",
    desc: "Lightning-fast order creation with table management, custom discounts, and one-click checkout. Built for speed.",
    color: "#6F4E37",
    bg: "#FAF3E0",
  },
  {
    icon: ChefHat,
    title: "Kitchen Display",
    desc: "Real-time ticket delivery to kitchen staff. Visual stage tracking from To Cook → Preparing → Ready.",
    color: "#7C3D1E",
    bg: "#FDF0E0",
  },
  {
    icon: Boxes,
    title: "Inventory Control",
    desc: "Ingredient-level stock tracking with auto-deduction on sale, low-stock alerts, and waste logging.",
    color: "#5A3A1A",
    bg: "#FAF3E0",
  },
  {
    icon: BarChart3,
    title: "Reports & Analytics",
    desc: "Deep sales insights, top products, session summaries, and revenue charts in one clean dashboard.",
    color: "#6F4E37",
    bg: "#FDF0E0",
  },
  {
    icon: Users,
    title: "Role-Based Access",
    desc: "5 distinct roles — Super Admin, Branch Manager, Inventory Manager, Cashier, and Kitchen Staff.",
    color: "#7C3D1E",
    bg: "#FAF3E0",
  },
  {
    icon: UtensilsCrossed,
    title: "Coupon & Promotions",
    desc: "Auto-apply order-level and product-level promos. Coupon codes with expiry and usage caps.",
    color: "#5A3A1A",
    bg: "#FDF0E0",
  },
];

const STEPS = [
  { num: "01", title: "Admin Configures", desc: "Set up menu, tables, staff accounts, and payment methods from the Admin dashboard." },
  { num: "02", title: "Cashier Takes Orders", desc: "Open a session, select a table, add items to cart, and send to kitchen in one tap." },
  { num: "03", title: "Kitchen Fulfils", desc: "Kitchen Display shows live tickets. Staff mark stages and complete the ticket." },
  { num: "04", title: "Payment & Close", desc: "Accept Cash, Card, or UPI. Email receipt to customer. Close session with summary." },
];

const STATS = [
  { value: "5", label: "Staff Roles" },
  { value: "3", label: "Payment Modes" },
  { value: "Real‑time", label: "Kitchen Sync" },
  { value: "Full", label: "Audit Logs" },
];

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    document.title = "Smart Restaurant POS | Cafe Operations Platform";
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (href) => {
    setMenuOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif", background: "#FAF3E0", color: "#2B2118", minHeight: "100vh", overflowY: "auto", overflowX: "hidden" }}>

      {/* ── Navbar ──────────────────────────────────────────────── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? "rgba(43, 33, 24, 0.97)" : "transparent",
        backdropFilter: scrolled ? "blur(14px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(111,78,55,0.25)" : "none",
        transition: "all 0.35s ease",
        padding: scrolled ? "14px 48px" : "22px 48px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: "linear-gradient(135deg, #6F4E37, #D4A373)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Coffee size={18} color="#fff" />
          </div>
          <div>
            <span style={{ fontWeight: 800, fontSize: 15, color: "#FAF3E0", letterSpacing: "-0.3px" }}>Smart Restaurant</span>
            <span style={{ display: "block", fontSize: 9, color: "#D4A373", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase" }}>POS Platform</span>
          </div>
        </div>

        {/* Desktop nav */}
        <div style={{ display: "flex", alignItems: "center", gap: 32 }} className="hp-desktop-nav">
          {NAV_LINKS.map((l) => (
            <button key={l.label} onClick={() => scrollTo(l.href)} style={{
              background: "none", border: "none", cursor: "pointer",
              color: "#D4A373", fontWeight: 600, fontSize: 14, letterSpacing: "0.3px",
              transition: "color 0.2s",
            }}
              onMouseEnter={e => e.target.style.color = "#FAF3E0"}
              onMouseLeave={e => e.target.style.color = "#D4A373"}
            >{l.label}</button>
          ))}
          <Link to="/login" style={{
            background: "linear-gradient(135deg, #6F4E37, #9B6B45)",
            color: "#FAF3E0", padding: "9px 22px", borderRadius: 10,
            fontWeight: 700, fontSize: 13, textDecoration: "none",
            boxShadow: "0 4px 18px rgba(111,78,55,0.45)",
            transition: "all 0.2s", letterSpacing: "0.3px",
          }}
            onMouseEnter={e => { e.target.style.transform = "translateY(-1px)"; e.target.style.boxShadow = "0 8px 24px rgba(111,78,55,0.5)"; }}
            onMouseLeave={e => { e.target.style.transform = "none"; e.target.style.boxShadow = "0 4px 18px rgba(111,78,55,0.45)"; }}
          >Staff Login</Link>
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setMenuOpen(!menuOpen)} className="hp-mobile-nav"
          style={{ background: "none", border: "none", cursor: "pointer", color: "#D4A373" }}>
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 90,
          background: "rgba(43,33,24,0.98)", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 28,
        }}>
          {NAV_LINKS.map((l) => (
            <button key={l.label} onClick={() => scrollTo(l.href)} style={{
              background: "none", border: "none", cursor: "pointer",
              color: "#FAF3E0", fontWeight: 700, fontSize: 22,
            }}>{l.label}</button>
          ))}
          <Link to="/login" onClick={() => setMenuOpen(false)} style={{
            background: "linear-gradient(135deg, #6F4E37, #9B6B45)",
            color: "#FAF3E0", padding: "13px 36px", borderRadius: 12,
            fontWeight: 700, fontSize: 16, textDecoration: "none", marginTop: 8,
          }}>Staff Login</Link>
        </div>
      )}

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #1A0F0A 0%, #2B1810 40%, #3D2214 70%, #2B1810 100%)",
        position: "relative", overflow: "hidden",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {/* Background texture circles */}
        <div style={{
          position: "absolute", width: 700, height: 700, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(111,78,55,0.18) 0%, transparent 70%)",
          top: "-200px", right: "-150px", pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(212,163,115,0.10) 0%, transparent 70%)",
          bottom: "-100px", left: "-100px", pointerEvents: "none",
        }} />

        {/* Decorative grain overlay */}
        <div style={{
          position: "absolute", inset: 0, opacity: 0.03,
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          pointerEvents: "none",
        }} />

        <div style={{
          maxWidth: 1100, width: "100%", padding: "120px 48px 80px",
          display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
          position: "relative", zIndex: 2,
        }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(111,78,55,0.25)", border: "1px solid rgba(212,163,115,0.3)",
            borderRadius: 100, padding: "6px 16px", marginBottom: 28,
          }}>
            <Zap size={12} color="#D4A373" fill="#D4A373" />
            <span style={{ fontSize: 12, color: "#D4A373", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase" }}>
              Final Year Project · 2026
            </span>
          </div>

          <h1 style={{
            fontSize: "clamp(38px, 6vw, 72px)",
            fontWeight: 900, color: "#FAF3E0", lineHeight: 1.08,
            letterSpacing: "-2px", marginBottom: 24, maxWidth: 800,
          }}>
            Every Order.
            <span style={{
              background: "linear-gradient(90deg, #D4A373, #E8C49A, #D4A373)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}> Every Bite.</span>
            <br />Every Moment Managed.
          </h1>

          <p style={{
            fontSize: "clamp(15px, 2vw, 18px)", color: "rgba(212,163,115,0.85)",
            maxWidth: 560, lineHeight: 1.7, marginBottom: 44, fontWeight: 400,
          }}>
            A complete web-based restaurant management platform — from POS billing and kitchen display to real-time inventory and smart analytics.
          </p>

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
            <Link to="/login" style={{
              background: "linear-gradient(135deg, #6F4E37 0%, #9B6B45 100%)",
              color: "#FAF3E0", padding: "14px 32px", borderRadius: 12,
              fontWeight: 700, fontSize: 15, textDecoration: "none",
              display: "flex", alignItems: "center", gap: 8,
              boxShadow: "0 8px 32px rgba(111,78,55,0.5)",
              transition: "all 0.2s",
            }}>
              Staff Login <ArrowRight size={16} />
            </Link>
            <button onClick={() => scrollTo("#features")} style={{
              background: "transparent", border: "1.5px solid rgba(212,163,115,0.4)",
              color: "#D4A373", padding: "14px 32px", borderRadius: 12,
              fontWeight: 700, fontSize: 15, cursor: "pointer",
              transition: "all 0.2s",
            }}
              onMouseEnter={e => { e.target.style.borderColor = "#D4A373"; e.target.style.color = "#FAF3E0"; }}
              onMouseLeave={e => { e.target.style.borderColor = "rgba(212,163,115,0.4)"; e.target.style.color = "#D4A373"; }}
            >Explore Features</button>
          </div>

          {/* Floating stats */}
          <div style={{
            display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center",
            marginTop: 64, paddingTop: 48,
            borderTop: "1px solid rgba(111,78,55,0.3)",
          }}>
            {STATS.map((s) => (
              <div key={s.label} style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(212,163,115,0.15)",
                borderRadius: 14, padding: "16px 28px", textAlign: "center",
                backdropFilter: "blur(8px)", minWidth: 120,
              }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: "#D4A373", letterSpacing: "-0.5px" }}>{s.value}</div>
                <div style={{ fontSize: 11, color: "rgba(212,163,115,0.6)", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────── */}
      <section id="features" style={{ background: "#FAF3E0", padding: "96px 48px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <span style={{
              display: "inline-block", fontSize: 11, fontWeight: 700,
              color: "#6F4E37", letterSpacing: "2.5px", textTransform: "uppercase",
              background: "rgba(111,78,55,0.08)", padding: "5px 14px", borderRadius: 100, marginBottom: 16,
            }}>Platform Features</span>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 900, color: "#2B2118", letterSpacing: "-1.5px", lineHeight: 1.15 }}>
              Everything a restaurant needs,<br />in one place.
            </h2>
            <p style={{ color: "#6F4E37", marginTop: 14, fontSize: 16, opacity: 0.7, maxWidth: 480, margin: "14px auto 0" }}>
              Purpose-built modules that work together seamlessly.
            </p>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 20,
          }}>
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} style={{
                  background: "#fff",
                  border: "1px solid rgba(111,78,55,0.12)",
                  borderRadius: 20, padding: "28px 28px 30px",
                  transition: "all 0.25s",
                  cursor: "default",
                }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = "0 16px 48px rgba(111,78,55,0.14)";
                    e.currentTarget.style.borderColor = "rgba(111,78,55,0.25)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.borderColor = "rgba(111,78,55,0.12)";
                  }}
                >
                  <div style={{
                    width: 48, height: 48, borderRadius: 14,
                    background: f.bg, border: `1.5px solid rgba(111,78,55,0.15)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    marginBottom: 18,
                  }}>
                    <Icon size={22} color={f.color} />
                  </div>
                  <h3 style={{ fontWeight: 800, fontSize: 17, color: "#2B2118", marginBottom: 8, letterSpacing: "-0.3px" }}>{f.title}</h3>
                  <p style={{ color: "#6F4E37", fontSize: 14, lineHeight: 1.65, opacity: 0.75 }}>{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────── */}
      <section id="how" style={{
        background: "linear-gradient(160deg, #2B1810 0%, #3D2214 50%, #2B1810 100%)",
        padding: "96px 48px",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <span style={{
              display: "inline-block", fontSize: 11, fontWeight: 700,
              color: "#D4A373", letterSpacing: "2.5px", textTransform: "uppercase",
              background: "rgba(212,163,115,0.12)", padding: "5px 14px", borderRadius: 100, marginBottom: 16,
            }}>Workflow</span>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 900, color: "#FAF3E0", letterSpacing: "-1.5px", lineHeight: 1.15 }}>
              From order to served,<br />in four steps.
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 24 }}>
            {STEPS.map((s, i) => (
              <div key={s.num} style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(212,163,115,0.15)",
                borderRadius: 20, padding: "32px 26px",
                position: "relative",
                transition: "all 0.25s",
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.07)";
                  e.currentTarget.style.borderColor = "rgba(212,163,115,0.35)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                  e.currentTarget.style.borderColor = "rgba(212,163,115,0.15)";
                }}
              >
                <div style={{
                  fontSize: 48, fontWeight: 900, color: "rgba(212,163,115,0.12)",
                  lineHeight: 1, marginBottom: 16, letterSpacing: "-3px",
                }}>{s.num}</div>
                <h3 style={{ fontWeight: 800, fontSize: 16, color: "#FAF3E0", marginBottom: 10 }}>{s.title}</h3>
                <p style={{ color: "rgba(212,163,115,0.65)", fontSize: 13.5, lineHeight: 1.65 }}>{s.desc}</p>
                {i < STEPS.length - 1 && (
                  <div style={{
                    position: "absolute", right: -14, top: "50%",
                    transform: "translateY(-50%)",
                    color: "rgba(212,163,115,0.3)", fontSize: 22, zIndex: 1,
                  }} className="hp-step-arrow">→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Choose Us ─────────────────────────────────────────── */}
      <section id="why" style={{ background: "#FAF3E0", padding: "96px 48px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }} className="hp-why-grid">
          {/* Left */}
          <div>
            <span style={{
              display: "inline-block", fontSize: 11, fontWeight: 700,
              color: "#6F4E37", letterSpacing: "2.5px", textTransform: "uppercase",
              background: "rgba(111,78,55,0.08)", padding: "5px 14px", borderRadius: 100, marginBottom: 20,
            }}>Why this platform</span>
            <h2 style={{ fontSize: "clamp(26px, 3.5vw, 40px)", fontWeight: 900, color: "#2B2118", letterSpacing: "-1px", lineHeight: 1.15, marginBottom: 24 }}>
              Inspired by coffee.<br />Built on precision.
            </h2>
            <p style={{ color: "#6F4E37", fontSize: 15, lineHeight: 1.75, opacity: 0.75, marginBottom: 36 }}>
              Designed for the rhythm of a real cafe — fast-paced billing, live kitchen coordination, and complete operational visibility in one unified platform.
            </p>
            {[
              "Role-based access for every staff member",
              "Real-time kitchen display with timer alerts",
              "Auto stock deduction on every sale",
              "UPI, Cash & Card payments in one flow",
              "Email receipts and complete audit trail",
            ].map((item) => (
              <div key={item} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <div style={{
                  width: 20, height: 20, borderRadius: "50%",
                  background: "rgba(111,78,55,0.1)", border: "1.5px solid rgba(111,78,55,0.25)",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <Check size={11} color="#6F4E37" strokeWidth={3} />
                </div>
                <span style={{ fontSize: 14, color: "#2B2118", fontWeight: 600 }}>{item}</span>
              </div>
            ))}
            <Link to="/login" style={{
              display: "inline-flex", alignItems: "center", gap: 8, marginTop: 32,
              background: "linear-gradient(135deg, #6F4E37, #9B6B45)",
              color: "#FAF3E0", padding: "12px 26px", borderRadius: 12,
              fontWeight: 700, fontSize: 14, textDecoration: "none",
              boxShadow: "0 6px 24px rgba(111,78,55,0.35)",
            }}>
              Access Dashboard <ArrowRight size={15} />
            </Link>
          </div>

          {/* Right — visual card */}
          <div style={{ position: "relative" }}>
            <div style={{
              background: "linear-gradient(135deg, #2B1810, #3D2214)",
              borderRadius: 24, padding: 32,
              border: "1px solid rgba(212,163,115,0.2)",
              boxShadow: "0 32px 80px rgba(43,24,16,0.4)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: "linear-gradient(135deg, #6F4E37, #D4A373)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Coffee size={16} color="#fff" />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 13, color: "#FAF3E0" }}>Live Dashboard</div>
                  <div style={{ fontSize: 11, color: "rgba(212,163,115,0.6)" }}>Today's Overview</div>
                </div>
                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80" }} />
                  <span style={{ fontSize: 11, color: "#4ade80", fontWeight: 600 }}>Live</span>
                </div>
              </div>

              {[
                { label: "Total Orders Today", value: "84", sub: "+12 from yesterday", up: true },
                { label: "Revenue", value: "₹24,680", sub: "Across 3 sessions", up: true },
                { label: "Avg. Order Value", value: "₹293", sub: "↑ ₹18 vs last week", up: true },
              ].map((m) => (
                <div key={m.label} style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(212,163,115,0.12)",
                  borderRadius: 12, padding: "14px 18px", marginBottom: 10,
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <div>
                    <div style={{ fontSize: 11, color: "rgba(212,163,115,0.55)", fontWeight: 600, marginBottom: 3 }}>{m.label}</div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: "#FAF3E0", letterSpacing: "-0.5px" }}>{m.value}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: m.up ? "#4ade80" : "#f87171", fontWeight: 600 }}>{m.sub}</div>
                  </div>
                </div>
              ))}

              <div style={{
                background: "rgba(111,78,55,0.2)", borderRadius: 10, padding: "10px 14px",
                display: "flex", alignItems: "center", gap: 10, marginTop: 14,
              }}>
                <Shield size={14} color="#D4A373" />
                <span style={{ fontSize: 12, color: "rgba(212,163,115,0.7)", fontWeight: 600 }}>All transactions secured with JWT auth & audit log</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ─────────────────────────────────────────────── */}
      <section style={{
        background: "linear-gradient(135deg, #6F4E37 0%, #4A2E1A 50%, #3D2214 100%)",
        padding: "80px 48px", textAlign: "center",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(circle at 20% 50%, rgba(212,163,115,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(111,78,55,0.2) 0%, transparent 50%)",
          pointerEvents: "none",
        }} />
        <div style={{ position: "relative", zIndex: 2 }}>
          <h2 style={{ fontSize: "clamp(26px, 4vw, 42px)", fontWeight: 900, color: "#FAF3E0", letterSpacing: "-1.5px", marginBottom: 16 }}>
            Ready to manage your restaurant smarter?
          </h2>
          <p style={{ color: "rgba(212,163,115,0.8)", fontSize: 16, marginBottom: 36, maxWidth: 480, margin: "0 auto 36px" }}>
            Log in as Admin, Cashier, or Kitchen Staff and explore the full platform.
          </p>
          <Link to="/login" style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            background: "#FAF3E0", color: "#2B2118",
            padding: "14px 34px", borderRadius: 12,
            fontWeight: 800, fontSize: 15, textDecoration: "none",
            boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
            transition: "all 0.2s",
          }}>
            Go to Staff Login <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer style={{
        background: "#1A0F0A", padding: "48px",
        borderTop: "1px solid rgba(111,78,55,0.2)",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 9,
              background: "linear-gradient(135deg, #6F4E37, #D4A373)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Coffee size={16} color="#fff" />
            </div>
            <div>
              <span style={{ fontWeight: 800, fontSize: 14, color: "#FAF3E0" }}>Smart Restaurant POS</span>
              <span style={{ display: "block", fontSize: 10, color: "rgba(212,163,115,0.5)", fontWeight: 600 }}>Final Year Project · 2026</span>
            </div>
          </div>
          <div style={{ color: "rgba(212,163,115,0.4)", fontSize: 12 }}>
            © 2026 Dhaval Prajapati · Hitiksha Patel · Krince Visoriya
          </div>
          <Link to="/login" style={{
            color: "#D4A373", fontSize: 13, fontWeight: 600,
            textDecoration: "none", opacity: 0.7,
          }}>Staff Login →</Link>
        </div>
      </footer>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .hp-desktop-nav { display: none !important; }
          .hp-mobile-nav { display: block !important; }
          .hp-why-grid { grid-template-columns: 1fr !important; }
          .hp-step-arrow { display: none !important; }
        }
        @media (min-width: 769px) {
          .hp-mobile-nav { display: none !important; }
        }
      `}</style>
    </div>
  );
}
