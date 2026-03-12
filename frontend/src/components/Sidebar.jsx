import { NavLink } from "react-router-dom";
import { getUser } from "../auth";
import "../styles/app.css";
import {
  FaTachometerAlt,
  FaUsers,
  FaUserFriends,
  FaTasks,
  FaBoxOpen,
  FaClipboardList, // ✅ add
  FaWallet,  
  FaCog,
} from "react-icons/fa";

export default function Sidebar({ collapsed, onItemClick }) {
  const user = getUser();
  const role = user?.role;

  const linkClass = ({ isActive }) =>
    isActive ? "sidebar-item active" : "sidebar-item";

  const label = (text) => (!collapsed ? <span>{text}</span> : null);

  return (
    <div className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-logo">
        {collapsed ? "E" : "eorder.vip"}
      </div>

      <div className="sidebar-section">Main</div>
      <NavLink to="/admin" className={linkClass} title="Dashboard" onClick={onItemClick}>
        <FaTachometerAlt />
        {label("Dashboard")}
      </NavLink>

      {(role === "admin" || role === "owner") && (
        <>
          <div className="sidebar-section">Users</div>
          <NavLink
            to="/users"
            className={linkClass}
            title="Users"
            onClick={onItemClick}
          >
            <FaUsers />
            {label(role === "admin" ? "Create Owners" : "Create Agents")}
          </NavLink>
        </>
      )}

      {(role === "owner" || role === "agent") && (
        <>
          <div className="sidebar-section">Members</div>
          <NavLink
            to="/members"
            className={linkClass}
            title="Members"
            onClick={onItemClick}
          >
            <FaUserFriends />
            {label("Manage Members")}
          </NavLink>
        </>
      )}

      {role === "owner" && (
        <>
          <div className="sidebar-section">Tasks</div>
          <NavLink
            to="/tasks"
            className={linkClass}
            title="Tasks"
            onClick={onItemClick}
          >
            <FaTasks />
            {label("Manage Tasks")}
          </NavLink>
        </>
      )}

      {(role === "owner" || role === "agent") && (
        <>
          <div className="sidebar-section">Packages</div>

          <NavLink
            to="/sets"
            className={linkClass}
            title="Packages"
            onClick={onItemClick}
          >
            <FaBoxOpen />
            {label("Manage Sets")}
          </NavLink>

          {/* ✅ NEW: Manage Assign Sets */}
          <NavLink
            to="/assign-sets"
            className={linkClass}
            title="Manage Assign Sets"
            onClick={onItemClick}
          >
            <FaClipboardList />
            {label("Manage Assign Sets")}
          </NavLink>
        </>
      )}

      {(role === "owner" || role === "admin") && (
  <>
    <div className="sidebar-section">Finance</div>

    <NavLink
      to="/vip-wallets"
      className={linkClass}
      title="VIP Wallet Addresses"
      onClick={onItemClick}
    >
      <FaWallet />
      {label("VIP Wallet Addresses")}
    </NavLink>
  </>
)}

          {/* --- NEW Settings Section --- */}
    <div className="sidebar-section">Settings</div>
    <NavLink
      to="/settings"
      className={linkClass}
      title="Settings"
      onClick={onItemClick}
    >
      <FaCog />
      {label("Settings")}
    </NavLink>

    </div>
  );
}
