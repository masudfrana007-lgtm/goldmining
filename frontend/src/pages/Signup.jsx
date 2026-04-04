import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api"; // Axios instance
import "./Signup.css";

function cls(...a) {
  return a.filter(Boolean).join(" ");
}

// ✅ Same COUNTRIES array as CreateMember.jsx
const COUNTRIES = [
  { name: "United States of America", dial: "+1" },
  { name: "Canada", dial: "+1" },
  { name: "United Kingdom", dial: "+44" },
  { name: "Germany", dial: "+49" },
  { name: "France", dial: "+33" },
  { name: "Netherlands", dial: "+31" },
  { name: "Switzerland", dial: "+41" },
  { name: "Sweden", dial: "+46" },
  { name: "Norway", dial: "+47" },
  { name: "Denmark", dial: "+45" },
  { name: "Australia", dial: "+61" },
  { name: "New Zealand", dial: "+64" },
  { name: "Singapore", dial: "+65" },
  { name: "United Arab Emirates", dial: "+971" },
  { name: "Japan", dial: "+81" },
  { name: "South Korea", dial: "+82" },
  { name: "Ireland", dial: "+353" },
  { name: "India", dial: "+91" },
  { name: "Indonesia", dial: "+62" },
  { name: "Philippines", dial: "+63" },
  { name: "Vietnam", dial: "+84" },
  { name: "Thailand", dial: "+66" },
  { name: "Malaysia", dial: "+60" },
  { name: "Pakistan", dial: "+92" },
  { name: "Bangladesh", dial: "+880" },
  { name: "Sri Lanka", dial: "+94" },
  { name: "Nigeria", dial: "+234" },
  { name: "Kenya", dial: "+254" },
  { name: "South Africa", dial: "+27" },
  { name: "Ghana", dial: "+233" },
  { name: "Brazil", dial: "+55" },
  { name: "Mexico", dial: "+52" },
  { name: "Argentina", dial: "+54" },
  { name: "Colombia", dial: "+57" },
  { name: "Chile", dial: "+56" },
  { name: "Peru", dial: "+51" },
  { name: "Egypt", dial: "+20" },
  { name: "Morocco", dial: "+212" },
  { name: "Saudi Arabia", dial: "+966" },
  { name: "Qatar", dial: "+974" },
  { name: "Kuwait", dial: "+965" },
  { name: "Israel", dial: "+972" },
  { name: "Turkey", dial: "+90" },
  { name: "Poland", dial: "+48" },
  { name: "Czech Republic", dial: "+420" },
  { name: "Romania", dial: "+40" },
  { name: "Hungary", dial: "+36" },
  { name: "Ukraine", dial: "+380" },
  { name: "Russia", dial: "+7" },
  { name: "China", dial: "+86" }
];

// ✅ Phone formatting helpers (same as CreateMember.jsx)
function extractDialCode(countryLabel) {
  const m = String(countryLabel || "").match(/\(\s*(\+\d+)\s*\)/);
  return m ? m[1] : "";
}
function digitsOnly(v) {
  return String(v || "").replace(/[^\d]/g, "");
}
function buildFullPhone(countryLabel, phoneInput) {
  const dial = extractDialCode(countryLabel);
  const num = digitsOnly(phoneInput);
  if (!dial || !num) return "";
  const dialDigits = digitsOnly(dial);
  return `+${dialDigits}${num}`;
}

export default function Signup() {
  const nav = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("United States of America (+1)");
  const [gender, setGender] = useState("male");
  const [referral, setReferral] = useState("");

  const [pass, setPass] = useState("");
  const [withdrawPass, setWithdrawPass] = useState("");
  const [pass2, setPass2] = useState("");
  
  // ✅ Show/hide toggles for both password fields
  const [show, setShow] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false); // ✅ New toggle for withdraw password
  
  const [agree, setAgree] = useState(true);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const match = pass && pass2 && pass === pass2;

  // ✅ Username validation: no spaces, case-insensitive normalized
  const normalizedUsername = useMemo(() => {
    return username.trim().toLowerCase();
  }, [username]);

  const usernameHasSpaces = useMemo(() => {
    return /\s/.test(username);
  }, [username]);

  const canSubmit = useMemo(() => {
    if (!normalizedUsername) return false;
    if (usernameHasSpaces) return false;
    if (!phone.trim()) return false;
    if (!country.trim()) return false;
    if (!gender) return false;
    if (!referral.trim()) return false;
    if (!pass.trim() || pass.length < 6) return false;
    if (!withdrawPass.trim() || withdrawPass.length < 4) return false;
    if (!match) return false;
    if (!agree) return false;
    return true;
  }, [normalizedUsername, usernameHasSpaces, phone, country, gender, referral, pass, withdrawPass, match, agree]);

  async function onSubmit(e) {
    e.preventDefault();
    if (!canSubmit || busy) return;

    try {
      setBusy(true);
      setErr("");

      const fullPhone = buildFullPhone(country, phone);
      if (!fullPhone) {
        const dial = extractDialCode(country);
        const phoneDigits = digitsOnly(phone);
        console.warn("Phone build failed:", { country, phone, dial, phoneDigits });
        throw new Error("Invalid phone/country combination. Please check country and phone number.");
      }

      await api.post("/members", {
        nickname: normalizedUsername,
        phone: fullPhone,
        country,
        password: pass,
        withdraw_password: withdrawPass,
        gender,
        ranking: "Trial",
        withdraw_privilege: "Enabled",
        referral_code: referral.trim(),
      });

      nav("/login");
    } catch (e) {
      console.error("=== SIGNUP ERROR DEBUG ===");
      console.error("Error object:", e);
      console.error("Response ", e?.response?.data);
      console.error("Response status:", e?.response?.status);
      console.error("Message:", e?.response?.data?.message || e?.message);
      console.error("Full error:", JSON.stringify(e, Object.getOwnPropertyNames(e), 2));
      console.error("==========================");

      const errorMsg = e?.response?.data?.message || e?.message || "Signup failed";
      setErr(errorMsg);
    } finally {
      setBusy(false);
    }
  }

  const currentDial = extractDialCode(country) || "+XX";

  return (
    <div className="gm-signup">
      {/* LEFT PANEL (unchanged) */}
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

          <form className="gmS-form" onSubmit={onSubmit}>
            {/* Username */}
            <div className="gmS-field">
              <label>Username</label>
              <input
                className={cls("gmS-input", usernameHasSpaces && "err")}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. john123"
                autoComplete="username"
              />
              {username && (
                <div className={cls("gmS-msg", !usernameHasSpaces ? "ok" : "err")} style={{ marginTop: 4 }}>
                  {!usernameHasSpaces ? "✓ Valid username" : "✗ No spaces allowed"}
                </div>
              )}
            </div>

            {/* Country */}
            <div className="gmS-field">
              <label>Country</label>
              <select
                className="gmS-input"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              >
                {COUNTRIES.map((c) => (
                  <option key={c.name + c.dial} value={`${c.name} (${c.dial})`}>
                    {c.name} ({c.dial})
                  </option>
                ))}
              </select>
            </div>

            {/* Phone */}
            <div className="gmS-field">
              <label>Phone Number</label>
              <input
                className="gmS-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={`${currentDial} XXX XXXXXXX`}
                type="tel"
              />
              <div className="small" style={{ color: "#64748b", marginTop: 4 }}>
                Enter your local number. The country code ({currentDial}) will be added automatically.
              </div>
            </div>

            {/* Gender */}
            <div className="gmS-field">
              <label>Gender</label>
              <select className="gmS-input" value={gender} onChange={(e) => setGender(e.target.value)}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Referral Code */}
            <div className="gmS-field">
              <label>Referral Code</label>
              <input
                className="gmS-input"
                value={referral}
                onChange={(e) => setReferral(e.target.value)}
                placeholder="Enter sponsor code"
              />
            </div>

            {/* Password with Show/Hide */}
            <div className="gmS-field">
              <label>Password</label>
              <div className="gmS-pass">
                <input
                  className="gmS-input gmS-inputPass"
                  type={show ? "text" : "password"}
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  placeholder="Create password"
                />
                <button type="button" className={cls("gmS-eye", show && "on")} onClick={() => setShow((s) => !s)}>
                  {show ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* ✅ Withdraw Password with Show/Hide (NEW) */}
            <div className="gmS-field">
              <label>Withdraw Password</label>
              <div className="gmS-pass">
                <input
                  className="gmS-input gmS-inputPass"
                  type={showWithdraw ? "text" : "password"}
                  value={withdrawPass}
                  onChange={(e) => setWithdrawPass(e.target.value)}
                  placeholder="Withdrawal password"
                />
                <button 
                  type="button" 
                  className={cls("gmS-eye", showWithdraw && "on")} 
                  onClick={() => setShowWithdraw((s) => !s)}
                >
                  {showWithdraw ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="gmS-field">
              <label>Confirm Password</label>
              <input
                className={cls("gmS-input", pass2 && !match && "err", match && "ok")}
                type={show ? "text" : "password"}
                value={pass2}
                onChange={(e) => setPass2(e.target.value)}
              />
              {pass2 && <div className={cls("gmS-msg", match ? "ok" : "err")}>{match ? "Passwords match" : "Passwords do not match"}</div>}
            </div>

            {/* Terms Checkbox */}
            <label className="gmS-check">
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
              <span>
                I agree to <a href="#">Terms</a> and <a href="#">Privacy</a>
              </span>
            </label>

            {/* Error Message */}
            {err && (
              <div style={{
                color: "#dc2626",
                textAlign: "center",
                fontWeight: 500,
                marginBottom: 12,
                fontSize: 14
              }}>
                {err}
              </div>
            )}

            {/* Submit Button */}
            <button className={cls("gmS-btn", !canSubmit && "disabled")} disabled={!canSubmit || busy} type="submit">
              {busy ? "Creating…" : "Create Account"}
            </button>

            {/* Login Link */}
            <div className="gmS-bottom">
              Already have an account? <Link className="gmS-link" to="/login">Login</Link>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}