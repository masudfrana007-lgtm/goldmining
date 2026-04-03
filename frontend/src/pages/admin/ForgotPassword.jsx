import { useState } from "react";
import AppLayout from "../../components/AppLayout";
import api from "../../services/api";
import { getUser } from "../../auth"; // <-- get logged-in user
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "./ForgotPassword.css";

export default function ForgotPassword() {
  const user = getUser(); // { email, role, name, ... }
  const [email] = useState(user?.email || ""); // fixed, not editable
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");

    if (password !== confirm) {
      return setErr("Passwords do not match");
    }

    try {
      setLoading(true);
      await api.post("/users/forgot-password", {
        email, // use fixed email
        newPassword: password,
      });
      setMsg("Password updated successfully");
      setPassword("");
      setConfirm("");
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  const passwordsMatch = confirm ? password === confirm : true;

  return (
    <AppLayout>
      <div className="fpWrap">
        <div className="fpCard">
          <h2 className="fpTitle">Reset Password</h2>
          <p className="fpSub">Owners & agents only</p>

          <form onSubmit={submit} className="fpForm">
            {err && <div className="fpErr">{err}</div>}
            {msg && <div className="fpOk">{msg}</div>}

            {/* Display fixed email */}
            <div className="fpEmailDisplay">
              <label>Email</label>
              <span>{email}</span>
            </div>

            <div className="fpPassWrap">
              <input
                type={showPass ? "text" : "password"}
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <span
                className="fpEye"
                onClick={() => setShowPass((prev) => !prev)}
              >
                {showPass ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>

            <div className="fpPassWrap">
              <input
                type={showConfirm ? "text" : "password"}
                placeholder="Confirm password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
              <span
                className="fpEye"
                onClick={() => setShowConfirm((prev) => !prev)}
              >
                {showConfirm ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>

            {confirm && (
              <div
                className={`fpMatch ${passwordsMatch ? "match" : "unmatch"}`}
              >
                {passwordsMatch
                  ? "Passwords match ✅"
                  : "Passwords do not match ❌"}
              </div>
            )}

            <button disabled={loading || !passwordsMatch}>
              {loading ? "Updating..." : "Reset Password"}
            </button>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
