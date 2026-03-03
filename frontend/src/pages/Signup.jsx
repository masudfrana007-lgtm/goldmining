import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Signup.css";

function cls(...a) {
  return a.filter(Boolean).join(" ");
}

export default function Signup() {
  const nav = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");
  const [show, setShow] = useState(false);
  const [agree, setAgree] = useState(true);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const match = pass && pass2 && pass === pass2;

  const canSubmit = useMemo(() => {
    if (!fullName.trim()) return false;
    if (!email.trim()) return false;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return false;
    if (!pass.trim() || pass.length < 6) return false;
    if (!match) return false;
    if (!agree) return false;
    return true;
  }, [fullName, email, pass, match, agree]);

  function onSubmit(e) {
    e.preventDefault();
    if (!canSubmit || busy) return;

    setBusy(true);
    setErr("");

    // ✅ Demo signup (replace with your API)
    setTimeout(() => {
      setBusy(false);
      localStorage.setItem("gm_demo_auth", "1");
      nav("/login");
    }, 900);
  }

  return (
    <div className="gm-signup">
      {/* LEFT PANEL */}
      <aside className="gmS-left">
        <div className="gmS-brand">
          <div className="gmS-mark" aria-hidden="true">
            <svg width="34" height="34" viewBox="0 0 64 64" fill="none">
              <path d="M10 22 32 10 54 22 32 34 10 22Z" fill="var(--gmGold)" />
              <path d="M10 30 32 42 54 30" stroke="var(--gmGold)" strokeWidth="4" strokeLinejoin="round" />
              <path d="M10 38 32 50 54 38" stroke="var(--gmGold)" strokeWidth="4" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="gmS-brandName">
            <span className="w">Gold</span>
            <span className="g">Miracle</span>
          </div>
        </div>

        <div className="gmS-hero">
          <h1 className="gmS-h1">
            Create your
            <br />
            GoldMiracle account.
          </h1>
          <p className="gmS-sub">
            Join a clean finance dashboard experience with secure sessions and fast access.
          </p>

          <div className="gmS-badges">
            <span className="gmS-badge">Secure signup</span>
            <span className="gmS-badge">Fast onboarding</span>
            <span className="gmS-badge">Modern UI</span>
          </div>

          <ul className="gmS-list">
            <li>
              <span className="gmS-ic">✓</span> Verified secure sessions
            </li>
            <li>
              <span className="gmS-ic gmS-ic--bars" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M5 20V11" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  <path d="M12 20V7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  <path d="M19 20V14" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </span>
              Real-time analytics
            </li>
            <li>
              <span className="gmS-ic">✓</span> Bank-grade encryption
            </li>
          </ul>
        </div>

        <div className="gmS-foot">© 2026 GoldMiracle. All rights reserved.</div>

        <div className="gmS-waves" aria-hidden="true">
          <svg viewBox="0 0 1200 700" preserveAspectRatio="none">
            <path d="M0,480 C180,420 280,560 430,500 C610,430 650,330 780,360 C930,400 1010,260 1200,300" className="w1" />
            <path d="M0,550 C240,470 330,620 500,580 C690,540 740,400 890,430 C1040,455 1110,380 1200,410" className="w2" />
            <path d="M0,610 C240,560 330,690 520,650 C720,610 780,480 930,510 C1080,540 1140,490 1200,510" className="w3" />
          </svg>
        </div>
      </aside>

      {/* RIGHT PANEL */}
      <main className="gmS-right">
        <section className="gmS-card">
          <header className="gmS-head">
            <h2 className="gmS-title">Sign up</h2>
            <p className="gmS-mini">Fill the form to create your account.</p>
          </header>

          {err ? <div className="gmS-alert">{err}</div> : null}

          <form className="gmS-form" onSubmit={onSubmit}>
            <div className="gmS-field">
              <label>Full Name</label>
              <input
                className="gmS-input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
                autoComplete="name"
              />
            </div>

            <div className="gmS-field">
              <label>Email</label>
              <input
                className="gmS-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@email.com"
                inputMode="email"
                autoComplete="email"
              />
            </div>

            <div className="gmS-field">
              <label>Password</label>
              <div className="gmS-pass">
                <input
                  className="gmS-input gmS-inputPass"
                  type={show ? "text" : "password"}
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  placeholder="Create password (min 6)"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className={cls("gmS-eye", show && "on")}
                  onClick={() => setShow((s) => !s)}
                  aria-label="Toggle password visibility"
                >
                  {show ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="gmS-field">
              <label>Confirm Password</label>
              <input
                className={cls("gmS-input", pass2 && !match && "err", match && "ok")}
                type={show ? "text" : "password"}
                value={pass2}
                onChange={(e) => setPass2(e.target.value)}
                placeholder="Repeat password"
                autoComplete="new-password"
              />
              {pass2 ? (
                <div className={cls("gmS-msg", match ? "ok" : "err")}>
                  {match ? "Passwords match" : "Passwords do not match"}
                </div>
              ) : null}
            </div>

            <label className="gmS-check">
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
              <span>
                I agree to the <a href="#" onClick={(e) => e.preventDefault()}>Terms</a> and{" "}
                <a href="#" onClick={(e) => e.preventDefault()}>Privacy</a>
              </span>
            </label>

            <button className={cls("gmS-btn", !canSubmit && "disabled")} disabled={!canSubmit || busy} type="submit">
              {busy ? "Creating…" : "Create Account"}
            </button>

            <div className="gmS-bottom">
              Already have an account?{" "}
              <Link className="gmS-link" to="/login">
                Login
              </Link>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}