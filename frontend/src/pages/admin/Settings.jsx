// src/pages/Settings.jsx
import { useNavigate } from "react-router-dom";
import { getUser } from "../../auth";
import AppLayout from "../../components/AppLayout";
import "./Settings.css";

export default function Settings() {
  const nav = useNavigate();
  const user = getUser();

  const goToForgotPassword = () => {
    nav("/forgot-password");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    nav("/admin/login");
  };

  return (
    <AppLayout>
      <div className="settings-container">
        <div className="settings-topbar">
          <div>
            <h2>⚙️ Settings</h2>
            <div className="small">
              Manage your account and application settings
            </div>
          </div>
        </div>

        <div className="settings-grid">
          {/* Account Settings */}
          <div className="settings-card">
            <h3>
              <span className="settings-icon blue">👤</span>
              Account Settings
            </h3>
            <p className="description">
              Manage your account information and security settings
            </p>
            <div className="hr" />

            <div className="settings-option">
              <div className="option-info">
                <div className="option-title">User Profile</div>
                <div className="option-desc">
                  {user?.name} • {user?.email} • Role: {user?.role}
                </div>
              </div>
            </div>

            <div className="settings-option">
              <div className="option-info">
                <div className="option-title">🔐 Change Password</div>
                <div className="option-desc">
                  Update your password to keep your account secure
                </div>
              </div>
              <button className="settings-btn" onClick={goToForgotPassword}>
                Change Password
              </button>
            </div>

            <div className="settings-option">
              <div className="option-info">
                <div className="option-title">🚪 Logout</div>
                <div className="option-desc">
                  Sign out from your current session
                </div>
              </div>
              <button className="settings-btn danger" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>

          {/* Application Settings */}
          <div className="settings-card">
            <h3>
              <span className="settings-icon green">🎨</span>
              Application Settings
            </h3>
            <p className="description">
              Configure application preferences and behavior
            </p>
            <div className="hr" />

            <div className="settings-option">
              <div className="option-info">
                <div className="option-title">Language</div>
                <div className="option-desc">
                  Current: English (Default)
                </div>
              </div>
              <button className="settings-btn secondary" disabled>
                Coming Soon
              </button>
            </div>

            <div className="settings-option">
              <div className="option-info">
                <div className="option-title">Theme</div>
                <div className="option-desc">
                  Current: Light Mode
                </div>
              </div>
              <button className="settings-btn secondary" disabled>
                Coming Soon
              </button>
            </div>

            <div className="settings-option">
              <div className="option-info">
                <div className="option-title">Timezone</div>
                <div className="option-desc">
                  Current: UTC (Coordinated Universal Time)
                </div>
              </div>
              <button className="settings-btn secondary" disabled>
                Coming Soon
              </button>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="settings-card">
            <h3>
              <span className="settings-icon orange">🔔</span>
              Notification Settings
            </h3>
            <p className="description">
              Control how you receive notifications and alerts
            </p>
            <div className="hr" />

            <div className="settings-option">
              <div className="option-info">
                <div className="option-title">Email Notifications</div>
                <div className="option-desc">
                  Receive important updates via email
                </div>
              </div>
              <label className="settings-toggle">
                <input type="checkbox" defaultChecked disabled />
                <span className="settings-toggle-slider"></span>
              </label>
            </div>

            <div className="settings-option">
              <div className="option-info">
                <div className="option-title">Push Notifications</div>
                <div className="option-desc">
                  Get real-time alerts for important events
                </div>
              </div>
              <label className="settings-toggle">
                <input type="checkbox" defaultChecked disabled />
                <span className="settings-toggle-slider"></span>
              </label>
            </div>

            <div className="settings-option">
              <div className="option-info">
                <div className="option-title">SMS Alerts</div>
                <div className="option-desc">
                  Receive critical alerts via SMS
                </div>
              </div>
              <label className="settings-toggle">
                <input type="checkbox" disabled />
                <span className="settings-toggle-slider"></span>
              </label>
            </div>

            <div className="settings-info-box">
              <span className="icon">💡</span>
              <div className="content">
                <strong>Note:</strong> Notification preferences are coming soon. 
                Currently all notifications are enabled by default.
              </div>
            </div>
          </div>

          {/* System Information */}
          <div className="settings-card">
            <h3>
              <span className="settings-icon purple">📊</span>
              System Information
            </h3>
            <p className="description">
              View system status and application details
            </p>
            <div className="hr" />

            <div className="settings-stats">
              <div className="settings-stat-item">
                <div className="value">v1.0.0</div>
                <div className="label">Version</div>
              </div>
              <div className="settings-stat-item">
                <div className="value">Active</div>
                <div className="label">Status</div>
              </div>
              <div className="settings-stat-item">
                <div className="value">{user?.role || "N/A"}</div>
                <div className="label">Your Role</div>
              </div>
            </div>

            <div className="settings-warning-box" style={{ marginTop: 20 }}>
              <span className="icon">⚠️</span>
              <div className="content">
                <strong>Important:</strong> Some settings require owner or admin 
                privileges to modify. Contact your administrator for assistance.
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          {(user?.role === "admin" || user?.role === "owner") && (
            <div className="settings-card" style={{ borderColor: "#fecaca" }}>
              <h3>
                <span className="settings-icon red">⚠️</span>
                Danger Zone
              </h3>
              <p className="description">
                Sensitive actions that require careful consideration
              </p>
              <div className="hr" />

              <div className="settings-option">
                <div className="option-info">
                  <div className="option-title">Clear Cache</div>
                  <div className="option-desc">
                    Clear application cache and temporary files
                  </div>
                </div>
                <button className="settings-btn secondary">
                  Clear Cache
                </button>
              </div>

              <div className="settings-option">
                <div className="option-info">
                  <div className="option-title">Database Backup</div>
                  <div className="option-desc">
                    Create a backup of the database
                  </div>
                </div>
                <button className="settings-btn success">
                  Create Backup
                </button>
              </div>

              <div className="settings-warning-box">
                <span className="icon">🛡️</span>
                <div className="content">
                  <strong>Security Notice:</strong> These actions are restricted to 
                  administrators only. Use with caution.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
