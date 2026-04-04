import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import memberApi from "../services/memberApi"; // ✅ Import axios instance
import "./Login.css";

export default function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({ identifier: "", password: "", form: "" });

  const identifierHasSpaces = useMemo(() => /\s/.test(identifier), [identifier]);

  const validate = () => {
    const next = { identifier: "", password: "", form: "" };
    if (!identifier.trim()) next.identifier = "Username or phone is required.";
    else if (identifierHasSpaces) next.identifier = "No spaces allowed in username.";
    if (!password) next.password = "Password is required.";
    setErrors(next);
    return !next.identifier && !next.password;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    setIsLoading(true);
    setErrors((p) => ({ ...p, form: "" }));

    try {
      // ✅ Use memberApi (axios) with baseURL - NO /api prefix needed
      const { data } = await memberApi.post("/member-auth/login", {
        identifier: identifier.trim(),
        password,
      });

      // ✅ Save token
      if (remember) {
        localStorage.setItem("member_token", data.token);
        localStorage.setItem("member_data", JSON.stringify(data.member));
      } else {
        sessionStorage.setItem("member_token", data.token);
        sessionStorage.setItem("member_data", JSON.stringify(data.member));
      }

      // ✅ Redirect to member dashboard
      window.location.href = "/member/dashboard";
      
    } catch (err) {
      // ✅ Extract error message from axios response
      const msg = err?.response?.data?.message || err?.message || "Login failed. Please try again.";
      setErrors((p) => ({ ...p, form: msg }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="gm-login">
      {/* LEFT PANEL */}
      <aside className="gm-left">
        <div className="gm-brand">
          <div className="gm-mark" aria-hidden="true">
            <svg width="34" height="34" viewBox="0 0 64 64" fill="none">
              <path d="M10 22 32 10 54 22 32 34 10 22Z" fill="var(--gold)" />
              <path d="M10 30 32 42 54 30" stroke="var(--gold)" strokeWidth="4" strokeLinejoin="round" />
              <path d="M10 38 32 50 54 38" stroke="var(--gold)" strokeWidth="4" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="gm-brand-name">
            <span className="w">Gold</span>
            <span className="g">Miracle</span>
          </div>
        </div>

        <div className="gm-left-content">
          <h1 className="gm-h1">Welcome back to<br />GoldMiracle.</h1>
          <p className="gm-sub">Secure access to your finance dashboard.</p>
          <ul className="gm-trust">
            <li><span className="gm-trust-ic">✓</span><span>Bank-grade encryption</span></li>
            <li>
              <span className="gm-trust-ic gm-trust-ic--bars" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M5 20V11" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  <path d="M12 20V7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  <path d="M19 20V14" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </span>
              <span>Real-time analytics</span>
            </li>
            <li><span className="gm-trust-ic">✓</span><span>Verified secure sessions</span></li>
          </ul>
        </div>
        <div className="gm-left-foot">© 2026 GoldMiracle. All rights reserved.</div>
        <div className="gm-left-chart" aria-hidden="true">
          <svg viewBox="0 0 1200 700" preserveAspectRatio="none">
            <path d="M0,480 C180,420 280,560 430,500 C610,430 650,330 780,360 C930,400 1010,260 1200,300" className="w1" />
            <path d="M0,550 C240,470 330,620 500,580 C690,540 740,400 890,430 C1040,455 1110,380 1200,410" className="w2" />
            <path d="M0,610 C240,560 330,690 520,650 C720,610 780,480 930,510 C1080,540 1140,490 1200,510" className="w3" />
          </svg>
        </div>
      </aside>

      {/* RIGHT PANEL */}
      <main className="gm-right">
        <section className="gm-card">
          <header className="gm-card-head">
            <h2 className="gm-title">Sign in</h2>
            <p className="gm-card-sub">Enter your credentials to continue.</p>
          </header>

          <form className="gm-form" onSubmit={handleSubmit} noValidate>
            {/* Username/Phone */}
            <div className="gm-field">
              <label>Username or Phone</label>
              <input
                className={`gm-input ${errors.identifier ? "err" : ""} ${identifierHasSpaces ? "err" : ""}`}
                type="text"
                placeholder="john123 or +8801712345678"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                disabled={isLoading}
                autoComplete="username"
              />
              {identifier && (
                <div className={`gm-err ${!identifierHasSpaces ? "ok" : ""}`} style={{ marginTop: 4, color: identifierHasSpaces ? "#dc2626" : "#16a34a" }}>
                  {!identifierHasSpaces ? "✓ Valid format" : "✗ No spaces allowed"}
                </div>
              )}
              {errors.identifier && !identifierHasSpaces && <div className="gm-err">{errors.identifier}</div>}
            </div>

            {/* Password */}
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
                <button type="button" className="gm-eye" onClick={() => setShowPassword((s) => !s)} disabled={isLoading} aria-label="Toggle password visibility">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" stroke="currentColor" strokeWidth="1.8"/>
                    <path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z" stroke="currentColor" strokeWidth="1.8"/>
                  </svg>
                </button>
              </div>
              {errors.password && <div className="gm-err">{errors.password}</div>}
            </div>

            {/* Remember + Forgot */}
            <div className="gm-row">
              <label className="gm-check">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} disabled={isLoading} />
                <span>Remember me</span>
              </label>
              <a className="gm-link" href="#" onClick={(e) => e.preventDefault()}>Forgot password?</a>
            </div>

            {/* ✅ Error message: red, centered, just above button */}
            {errors.form && (
              <div style={{ color: "#dc2626", textAlign: "center", fontWeight: 500, marginBottom: 12, fontSize: 14 }}>
                {errors.form}
              </div>
            )}

            {/* Submit Button */}
            <button className="gm-btn gm-primary" type="submit" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign in"}
            </button>

            <div className="gm-divider">
              <span /><span className="gm-divider-shield" aria-hidden="true">🛡️</span><span />
            </div>

            <div className="gm-protect">
              <span className="lock" aria-hidden="true">🔒</span>
              Protected by secure authentication
            </div>

            <div className="gm-bottom">
              <span>New to GoldMiracle?</span>{" "}
              <Link className="gm-link" to="/signup">Create an account</Link>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}