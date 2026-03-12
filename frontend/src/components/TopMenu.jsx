import { FaBars } from "react-icons/fa";
import { getUser, logout } from "../auth";
import { useNavigate } from "react-router-dom";
import "../styles/app.css";

export default function TopMenu({ onToggle }) {
  const user = getUser();
  const nav = useNavigate();

  const doLogout = () => {
    logout();
    nav("/login", { replace: true });
  };

  return (
    <div className="topmenu">
      <div className="menu-left">
        <button className="menu-item" onClick={onToggle} aria-label="Toggle menu">
          <FaBars />
        </button>
      </div>

      <div className="menu-right">
        <span className="badge">{user?.role}</span>
        <button className="menu-item" onClick={doLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}
