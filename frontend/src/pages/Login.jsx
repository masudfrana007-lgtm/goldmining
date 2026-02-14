import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";

function cls(...a) {
  return a.filter(Boolean).join(" ");
}

export default function Login() {
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  const canSubmit = useMemo(() => {
    if (!email.trim()) return false;
    if (!pass.trim()) return false;
    return true;
  }, [email, pass]);

  async function onSubmit(e) {
    e.preventDefault();
    if (!canSubmit || busy) return;

    setBusy(true);

    // ✅ Demo login (replace with real auth)
    setTimeout(() => {
      setBusy(false);
      // Example: save auth token
      localStorage.setItem("gm_demo_auth", "1");
      nav("/trading");
    }, 700);
  }

  return (
    <div className="authPage">
      <div className="authVignette" />

      <div className="authShell">
        {/* Left brand panel */}
        <section className="authHero">
          <div className="authBrand">
            <div className="authLogo" />
            <div>
              <div className="authName">GoldMiracle</div>
              <div className="authTag">Professional Trading Platform</div>
            </div>
          </div>

          <div className="authHeadline">
            Welcome back 👋
          </div>
          <div className="authSub">
            Login to access your markets, live charts, and manual trading panel.
          </div>

          <div className="authBadges">
            <div className="authBadge">Live Prices</div>
            <div className="authBadge">Secure Login</div>
            <div className="authBadge">Mobile Friendly</div>
          </div>

          <div className="authFootNote">
            Tip: Use a strong password and keep your account safe.
          </div>
        </section>

        {/* Right form card */}
        <section className="authCard">
          <div className="authCardHead">
            <div className="authTitle">Login</div>
            <div className="authMini">Use your email and password</div>
          </div>

          <form onSubmit={onSubmit} className="authForm">
            <label className="authLabel">
              Email
              <div className="authField">
                <input
                  className="authInput"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  inputMode="email"
                  autoComplete="email"
                />
              </div>
            </label>

            <label className="authLabel">
              Password
              <div className="authField">
                <input
                  className="authInput"
                  type={show ? "text" : "password"}
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className={cls("authGhost", show && "on")}
                  onClick={() => setShow((s) => !s)}
                  aria-label="Toggle password"
                >
                  {show ? "Hide" : "Show"}
                </button>
              </div>
            </label>

            <div className="authRow">
              <label className="authCheck">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>

              <button
                type="button"
                className="authLinkBtn"
                onClick={() => alert("Add your reset password flow")}
              >
                Forgot password?
              </button>
            </div>

            <button
              className={cls("authBtn", !canSubmit && "disabled")}
              disabled={!canSubmit || busy}
              type="submit"
            >
              {busy ? "Signing in…" : "Sign In"}
            </button>

            <div className="authDivider">
              <span />
              <p>or</p>
              <span />
            </div>

            <button
              type="button"
              className="authBtn alt"
              onClick={() => alert("Add Google/Apple login later")}
            >
              Continue with Google
            </button>

            <div className="authBottom">
              Don’t have an account?{" "}
              <Link className="authLink" to="/signup">
                Create one
              </Link>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
