import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Signup.css";

function cls(...a) {
  return a.filter(Boolean).join(" ");
}

export default function Signup() {
  const nav = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  const match = pass && pass2 && pass === pass2;

  const canSubmit = useMemo(() => {
    if (!name.trim()) return false;
    if (!email.trim()) return false;
    if (!pass.trim()) return false;
    if (!match) return false;
    return true;
  }, [name, email, pass, match]);

  function onSubmit(e) {
    e.preventDefault();
    if (!canSubmit || busy) return;
    setBusy(true);

    // ✅ Demo signup (replace with real API)
    setTimeout(() => {
      setBusy(false);
      localStorage.setItem("gm_demo_auth", "1");
      nav("/trading");
    }, 800);
  }

  return (
    <div className="authPage">
      <div className="authVignette" />

      <div className="authShell">
        <section className="authHero">
          <div className="authBrand">
            <div className="authLogo" />
            <div>
              <div className="authName">GoldMiracle</div>
              <div className="authTag">Create your account</div>
            </div>
          </div>

          <div className="authHeadline">Start trading with confidence</div>
          <div className="authSub">
            Create your account to access live markets, charts, and a clean trading dashboard.
          </div>

          <div className="authList">
            <div className="authLi">✅ Mobile-friendly design</div>
            <div className="authLi">✅ Live price updates</div>
            <div className="authLi">✅ Simple, professional UI</div>
          </div>
        </section>

        <section className="authCard">
          <div className="authCardHead">
            <div className="authTitle">Sign Up</div>
            <div className="authMini">Fill the form to create account</div>
          </div>

          <form className="authForm" onSubmit={onSubmit}>
            <label className="authLabel">
              Full Name
              <div className="authField">
                <input
                  className="authInput"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  autoComplete="name"
                />
              </div>
            </label>

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
                  placeholder="Create password"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className={cls("authGhost", show && "on")}
                  onClick={() => setShow((s) => !s)}
                >
                  {show ? "Hide" : "Show"}
                </button>
              </div>
            </label>

            <label className="authLabel">
              Confirm Password
              <div className={cls("authField", pass2 && !match && "bad", match && "good")}>
                <input
                  className="authInput"
                  type={show ? "text" : "password"}
                  value={pass2}
                  onChange={(e) => setPass2(e.target.value)}
                  placeholder="Repeat password"
                  autoComplete="new-password"
                />
              </div>
              {pass2 ? (
                <div className={cls("authMsg", match ? "ok" : "err")}>
                  {match ? "Passwords match" : "Passwords do not match"}
                </div>
              ) : null}
            </label>

            <button className={cls("authBtn", !canSubmit && "disabled")} disabled={!canSubmit || busy} type="submit">
              {busy ? "Creating…" : "Create Account"}
            </button>

            <div className="authBottom">
              Already have an account?{" "}
              <Link className="authLink" to="/login">
                Login
              </Link>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
