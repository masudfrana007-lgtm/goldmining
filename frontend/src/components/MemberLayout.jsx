import { NavLink, useNavigate } from "react-router-dom";
import { memberLogout } from "../memberAuth";
import "../styles/app.css";

export default function MemberLayout({ children }) {
  const nav = useNavigate();

  const linkClass = ({ isActive }) =>
    isActive ? "sidebar-item active" : "sidebar-item";

  const logout = () => {
    memberLogout();
    nav("/member/login");
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <div className="sidebar">
        <div className="sidebar-logo">MEMBER</div>

        <NavLink to="/member/dashboard" className={linkClass}>
          Dashboard
        </NavLink>

        <NavLink to="/member/history" className={linkClass}>
          History
        </NavLink>

        <div style={{ marginTop: "auto", padding: 12 }}>
          <button className="btn danger" style={{ width: "100%" }} onClick={logout}>
            Logout
          </button>
        </div>
      </div>

      <div style={{ flex: 1, background: "#f5f7fb" }}>
        {children}
      </div>
    </div>
  );
}
