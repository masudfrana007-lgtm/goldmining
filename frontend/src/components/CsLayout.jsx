// src/components/CsLayout.jsx
import { useNavigate } from "react-router-dom";
import "../styles/app.css";

export default function CsLayout({ children, title = "" }) {
  const nav = useNavigate();

  const logout = () => {
    // clear only CS auth (use this key in your CsLogin)
    localStorage.removeItem("cs_ok");
    nav("/cs/login");
  };

  return (
    <div className="app-layout" style={{ minHeight: "100vh" }}>
      {/* Simple topbar (no sidebar) */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          background: "#fff",
          borderBottom: "1px solid rgba(0,0,0,.08)",
          padding: "10px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontWeight: 700 }}>{title || "Customer Support"}</div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button className="btn" type="button" onClick={logout}>
            Logout
          </button>
        </div>
      </div>

      <div className="page-content" style={{ padding: 14, width:'100%' }}>
        {children}
      </div>
    </div>
  );
}
