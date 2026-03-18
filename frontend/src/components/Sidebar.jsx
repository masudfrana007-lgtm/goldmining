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
  FaRobot,
  FaChartLine,
  FaGem, // ✅ Mining icon
} from "react-icons/fa";

export default function Sidebar({ collapsed, onItemClick }) {
  const user = getUser();
  const role = user?.role;

  const linkClass = ({ isActive }) =>
    isActive ? "sidebar-item active" : "sidebar-item";

  const label = (text) => (!collapsed ? <span>{text}</span> : null);
  const section = (text) => (!collapsed ? <div className="sidebar-section">{text}</div> : null);

  return (
    <div className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-logo" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60px' }}>
        {collapsed ? "G" : "Goldmiracle"} {/* Show "G" when collapsed, "Goldmiracle" when expanded */}
      </div>

      {section("Main")}
      <NavLink to="/admin" className={linkClass} title="Dashboard" onClick={onItemClick}>
        <FaTachometerAlt />
        {label("Dashboard")}
      </NavLink>

      {(role === "admin" || role === "owner") && (
        <>
          {section("Users")}
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
          {section("Members")}
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
          {section("Trading")}
          <NavLink
            to="/tasks"
            className={linkClass}
            title="AI Trading"
            onClick={onItemClick}
          >
            <FaRobot />
            {label("AI Trading")}
          </NavLink>
          <NavLink
            to="/tasks"
            className={linkClass}
            title="Manual Trading"
            onClick={onItemClick}
          >
            <FaChartLine />
            {label("Manual Trading")}
          </NavLink>
        </>
      )}

      {(role === "owner" || role === "agent") && (
        <>
          {section("Mining")}

          <NavLink
            to="/sets"
            className={linkClass}
            title="Mining"
            onClick={onItemClick}
          >
            <FaGem />
            {label("Mining")}
          </NavLink>

          {/* ✅ NEW: Manage Assign Sets */}
          {/* <NavLink
            to="/assign-sets"
            className={linkClass}
            title="Manage Assign Sets"
            onClick={onItemClick}
          >
            <FaClipboardList />
            {label("Manage Assign Sets")}
          </NavLink> */}
        </>
      )}

      {(role === "owner" || role === "admin") && (
  <>
    {section("Finance")}

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
    {section("Settings")}
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
