import { useNavigate } from "react-router-dom";
import "../styles/memberBottomNav.css";

export default function MemberBottomNav({ active = "home" }) {
  const nav = useNavigate();

  return (
    <>
      
      <div className="mNav">
        <button
          className={`mNavItem ${active === "home" ? "active" : ""}`}
          onClick={() => nav("/member/dashboard")}
          type="button"
        >
          <span className="mNavIcon">⌂</span>
          <span className="mNavText">Home</span>
        </button>

        <button
          className={`mNavItem ${active === "service" ? "active" : ""}`}

//          onClick={() => nav("/member/customerService")}
          onClick={() => nav("/member/customerService")}
          type="button"
        >
          <span className="mNavIcon">⟲</span>
          <span className="mNavText">Customer Service</span>
        </button>

        <button
          className={`mNavItem ${active === "menu" ? "active" : ""}`}
          onClick={() => nav("/member/menu")}
          type="button"
        >
          <span className="mNavIcon">▦</span>
          <span className="mNavText">Menu</span>
        </button>

        <button
          className={`mNavItem ${active === "record" ? "active" : ""}`}
          onClick={() => nav("/member/history")}   // ✅ your history route
          type="button"
        >
          <span className="mNavIcon">▤</span>
          <span className="mNavText">Record</span>
        </button>

        <button
          className={`mNavItem mine ${active === "mine" ? "active" : ""}`}
          onClick={() => nav("/member/mine")}
          type="button"
        >
          <span className="mNavIcon">●</span>
          <span className="mNavText">Mine</span>
        </button>
      </div>

      {/* spacer so page content never hides behind nav */}
      <div className="mNavSpacer" />

      
    </>
  );
}