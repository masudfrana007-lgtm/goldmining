// src/pages/CsLogin.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
// import api from "../services/api";
// import { saveAuth } from "../auth";
import "../../styles/authLogin.css";

export default function CsLogin() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");  
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setErr("");

    try {
      // ✅ SAME backend as normal login
      const { data } = await api.post("/auth/login", { email, password });

      // optional safety check
      if (!["admin", "owner", "agent"].includes(data?.user?.role)) {
        setErr("Access denied");
        return;
      }

      saveAuth(data);

      // ✅ different redirect for CS
      nav("/support", { replace: true });
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h2>CS Login</h2>
        <div className="small">Customer Support</div>
        <div className="hr" />

        <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
          <div>
            <div className="small">Email</div>
            <input value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div>
            <div className="small">Password</div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {err && <div className="error">{err}</div>}

          <button className="btn" type="submit">
            Login
          </button>
        </form>

        <div className="hr" />
      </div>
    </div>
  );
}
