// src/components/TeamJoinPopup.jsx
import { FaUsers, FaTimes } from "react-icons/fa";
import "../styles/teamJoinPopup.css";

export default function TeamJoinPopup({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="team-popup-overlay" onClick={onClose}>
      <div className="team-popup-content" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="team-popup-close" onClick={onClose}>
          <FaTimes />
        </button>

        {/* Icon */}
        <div className="team-popup-icon">
          <FaUsers />
        </div>

        {/* Title */}
        <h3 className="team-popup-title">Join a Team</h3>

        {/* Message */}
        <p className="team-popup-message">
          You are not in any team yet. First you have to join a team to access team features and start earning together!
        </p>

        {/* Action Buttons */}
        <div className="team-popup-actions">
          <button className="team-popup-btn primary" onClick={onClose}>
            Find Teams
          </button>
          <button className="team-popup-btn secondary" onClick={onClose}>
            Later
          </button>
        </div>
      </div>
    </div>
  );
}