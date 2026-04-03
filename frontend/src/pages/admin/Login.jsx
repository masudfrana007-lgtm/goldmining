import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { saveAuth } from "../../auth";
import "../../styles/authLogin.css";

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setErr("");

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password;

    if (!cleanEmail || !cleanPassword) {
      setErr("Email and password are required");
      return;
    }

    try {
      setLoading(true);

      const { data } = await api.post("/auth/login", {
        email: cleanEmail,
        password: cleanPassword,
      });

      // save token + user
      saveAuth(data);

      // role-based redirect
      const role = data?.user?.role;

      if (role === "admin" || role === "owner" || role === "agent") {
        nav("/admin/dashboard", { replace: true });
        return;
      }

      setErr("Access denied");

      } catch (e2) {
        console.error('🔐 Login error:', e2);
        
        // Clear, safe error handling
        let msg = 'Login failed';
        if (e2?.response?.data?.message) {
          msg = e2.response.data.message;
        } else if (e2?.request?.status === 404) {
          msg = 'Backend not found - please check your connection';
        } else if (e2?.message) {
          msg = e2.message;
        }
        setErr(msg);
      }      
       finally {
      setLoading(false);
    }
  };

  return (
    <div className="loginPage">
      <div className="loginCard">
        <h2 className="loginTitle">Login</h2>
        <div className="loginSub">Admin / Owner / Agent</div>
        <div className="loginHr" />

        <form onSubmit={submit} className="loginForm">
          <div>
            <div className="loginLabel">Email</div>
            <input
              className="loginInput"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              inputMode="email"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <div className="loginLabel">Password</div>
            <input
              className="loginInput"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="Enter your password"
            />
          </div>

          {err ? <div className="loginError">{err}</div> : null}

          <button className="loginBtn" type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="loginHr" />
      </div>
    </div>
  );
}