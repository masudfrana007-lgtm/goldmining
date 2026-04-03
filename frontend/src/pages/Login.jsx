import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({ email: "", password: "", form: "" });

  const isEmailValid = useMemo(() => {
    if (!email.trim()) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }, [email]);

  const validate = () => {
    const next = { email: "", password: "", form: "" };
    if (!email.trim()) next.email = "Email is required.";
    else if (!isEmailValid) next.email = "Please enter a valid email address.";

    if (!password) next.password = "Password is required.";
    setErrors(next);
    return !next.email && !next.password;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    setErrors((p) => ({ ...p, form: "" }));

    try {
      await new Promise((r) => setTimeout(r, 850));
      alert("Signed in (demo). Connect your API next.");
    } catch {
      setErrors((p) => ({ ...p, form: "Login failed. Please try again." }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="gm-login">
      {/* LEFT */}
      <aside className="gm-left">
        <div className="gm-brand">
          <div className="gm-mark" aria-hidden="true">
            <svg width="34" height="34" viewBox="0 0 64 64" fill="none">
              <path d="M10 22 32 10 54 22 32 34 10 22Z" fill="var(--gold)" />
              <path
                d="M10 30 32 42 54 30"
                stroke="var(--gold)"
                strokeWidth="4"
                strokeLinejoin="round"
              />
              <path
                d="M10 38 32 50 54 38"
                stroke="var(--gold)"
                strokeWidth="4"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div className="gm-brand-name">
            <span className="w">Gold</span>
            <span className="g">Miracle</span>
          </div>
        </div>

        <div className="gm-left-content">
          <h1 className="gm-h1">
            Welcome back to
            <br />
            GoldMiracle.
          </h1>
          <p className="gm-sub">Secure access to your finance dashboard.</p>

          <ul className="gm-trust">
            <li>
              <span className="gm-trust-ic">✓</span>
              <span>Bank-grade encryption</span>
            </li>
            <li>
              <span className="gm-trust-ic gm-trust-ic--bars" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 20V11"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <path
                    d="M12 20V7"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <path
                    d="M19 20V14"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <span>Real-time analytics</span>
            </li>
            <li>
              <span className="gm-trust-ic">✓</span>
              <span>Verified secure sessions</span>
            </li>
          </ul>
        </div>

        <div className="gm-left-foot">© 2026 GoldMiracle. All rights reserved.</div>

        {/* Background chart */}
        <div className="gm-left-chart" aria-hidden="true">
          <svg viewBox="0 0 1200 700" preserveAspectRatio="none">
            <path
              d="M0,480 C180,420 280,560 430,500 C610,430 650,330 780,360 C930,400 1010,260 1200,300"
              className="w1"
            />
            <path
              d="M0,550 C240,470 330,620 500,580 C690,540 740,400 890,430 C1040,455 1110,380 1200,410"
              className="w2"
            />
            <path
              d="M0,610 C240,560 330,690 520,650 C720,610 780,480 930,510 C1080,540 1140,490 1200,510"
              className="w3"
            />
          </svg>
        </div>
      </aside>

      {/* RIGHT */}
      <main className="gm-right">
        <section className="gm-card">
          <header className="gm-card-head">
            <h2 className="gm-title">Sign in</h2>
            <p className="gm-card-sub">Enter your credentials to continue.</p>
          </header>

          {errors.form ? <div className="gm-form-error">{errors.form}</div> : null}

          <form className="gm-form" onSubmit={handleSubmit} noValidate>
            <div className="gm-field">
              <label>Email</label>
              <input
                className={`gm-input ${errors.email ? "err" : ""}`}
                type="email"
                placeholder="name@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
              {errors.email ? <div className="gm-err">{errors.email}</div> : null}
            </div>

            <div className="gm-field">
              <label>Password</label>
              <div className={`gm-pass ${errors.password ? "err" : ""}`}>
                <input
                  className="gm-input gm-input-pass"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="gm-eye"
                  onClick={() => setShowPassword((s) => !s)}
                  disabled={isLoading}
                  aria-label="Toggle password visibility"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    />
                    <path
                      d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    />
                  </svg>
                </button>
              </div>
              {errors.password ? <div className="gm-err">{errors.password}</div> : null}
            </div>

            <div className="gm-row">
              <label className="gm-check">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  disabled={isLoading}
                />
                <span>Remember me</span>
              </label>

              <a className="gm-link" href="#" onClick={(e) => e.preventDefault()}>
                Forgot password?
              </a>
            </div>

            <button className="gm-btn gm-primary" type="submit" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign in"}
            </button>

            <button
              className="gm-btn gm-google"
              type="button"
              disabled={isLoading}
              onClick={() => alert("Connect Google OAuth")}
            >
              <span className="gm-google-icon" aria-hidden="true">
                G
              </span>
              Continue with Google
            </button>

            <div className="gm-divider">
              <span />
              <span className="gm-divider-shield" aria-hidden="true">
                🛡️
              </span>
              <span />
            </div>

            <div className="gm-protect">
              <span className="lock" aria-hidden="true">
                🔒
              </span>
              Protected by secure authentication
            </div>

            <div className="gm-bottom">
              <span>New to GoldMiracle?</span>{" "}
              {/* ✅ THIS NOW GOES TO SIGNUP PAGE */}
              <Link className="gm-link" to="/signup">
                Create an account
              </Link>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}