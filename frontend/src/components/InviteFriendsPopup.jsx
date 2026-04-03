// src/components/InviteFriendsPopup.jsx
import { FaUserPlus, FaTimes } from "react-icons/fa";
import "../styles/inviteFriendsPopup.css";

export default function InviteFriendsPopup({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="invite-popup-overlay" onClick={onClose}>
      <div className="invite-popup-content" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="invite-popup-close" onClick={onClose}>
          <FaTimes />
        </button>

        {/* Icon */}
        <div className="invite-popup-icon">
          <FaUserPlus />
        </div>

        {/* Title */}
        <h3 className="invite-popup-title">Complete your milestone</h3>

        {/* Message */}
        <p className="invite-popup-message">
          You are not eligible to invite your friends. First you have to complete your task and then invite your friend and earn together!
        </p>

        {/* Action Buttons */}
        <div className="invite-popup-actions">
          <button className="invite-popup-btn primary" onClick={onClose}>
            Complete Task
          </button>
          <button className="invite-popup-btn secondary" onClick={onClose}>
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}