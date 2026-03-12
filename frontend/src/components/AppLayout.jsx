import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import TopMenu from "./TopMenu";

export default function AppLayout({ children }) {
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    return saved === "true";
  });

  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", collapsed);
  }, [collapsed]);

  const toggleSidebar = () => {
    if (window.innerWidth <= 768) {
      setMobileOpen(p => !p);
    } else {
      setCollapsed(p => !p);
    }
  };

  return (
    <div
      className={`app-layout 
        ${collapsed ? "collapsed" : ""} 
        ${mobileOpen ? "show-sidebar" : ""}`}
    >
      <Sidebar
        collapsed={collapsed}
        onItemClick={() => setMobileOpen(false)}
      />

      {mobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className="main-area">
        <TopMenu onToggle={toggleSidebar} />
        <div className="page-content">{children}</div>
      </div>
    </div>
  );
}
