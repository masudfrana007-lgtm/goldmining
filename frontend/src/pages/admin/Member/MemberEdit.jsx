// src/pages/MemberEdit.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../../services/api";
import AppLayout from "../../../components/AppLayout";
import { getUser } from "../../../auth";

const RANKS = ["Trial", "V1", "V2", "V3"];
const STATUSES = ["pending", "approved", "rejected"];
const GENDERS = ["male", "female", "other"];

function rankLabel(v) {
  const x = String(v || "").trim().toUpperCase();
  if (x === "V1") return "VIP 1";
  if (x === "V2") return "VIP 2";
  if (x === "V3") return "VIP 3";
  if (x === "TRIAL") return "Trial";
  if (/^V\d+$/.test(x)) return `VIP ${x.slice(1)}`;
  return x || "-";
}

function norm(v) {
  return String(v ?? "").trim();
}

function buildPatch(original, form) {
  const patch = {};
  const fields = ["nickname", "phone", "email", "country", "ranking", "gender", "approval_status"];

  for (const k of fields) {
    const a = norm(original?.[k]);
    const b = norm(form?.[k]);
    if (a !== b) patch[k] = b;
  }

  if (Boolean(original?.withdraw_privilege) !== Boolean(form?.withdraw_privilege)) {
    patch.withdraw_privilege = !!form.withdraw_privilege;
  }

  if (norm(form?.new_password)) {
    patch.new_password = norm(form.new_password);
  }

  return patch;
}

export default function MemberEdit() {
  const me = getUser();
  const nav = useNavigate();
  const { memberId } = useParams();
  const id = memberId;

  const [loading, setLoading] = useState(true);
  const [orig, setOrig] = useState(null);
  const [form, setForm] = useState({
    nickname: "",
    phone: "",
    email: "",
    country: "",
    ranking: "Trial",
    gender: "other",
    approval_status: "pending",
    withdraw_privilege: true,
    new_password: "",
    confirm_password: "",
  });

  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const canEdit = me?.role === "owner" || me?.role === "agent";

  useEffect(() => {
    if (!canEdit || !id) {
      setLoading(false);
      return;
    }

    (async () => {
      setErr("");
      setOk("");
      setLoading(true);
      try {
        const { data } = await api.get(`/members/${id}`);
        setOrig(data || null);
        setForm((f) => ({
          ...f,
          nickname: data?.nickname || "",
          phone: data?.phone || "",
          email: data?.email || "",
          country: data?.country || "",
          ranking: data?.ranking || "Trial",
          gender: data?.gender || "other",
          approval_status: data?.approval_status || "pending",
          withdraw_privilege: !!data?.withdraw_privilege,
          new_password: "",
          confirm_password: "",
        }));
      } catch (e) {
        setErr(e?.response?.data?.message || "Failed to load member");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, canEdit]);

  const dirty = useMemo(() => {
    if (!orig) return false;
    const patch = buildPatch(orig, form);
    return Object.keys(patch).length > 0;
  }, [orig, form]);

  const onChange = (k) => (e) => {
    const v = e?.target?.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((s) => ({ ...s, [k]: v }));
  };

  const validate = () => {
    if (!norm(form.nickname)) return "Nickname is required";
    if (!norm(form.phone)) return "Phone is required";
    if (!RANKS.includes(form.ranking)) return "Invalid ranking";
    if (!STATUSES.includes(form.approval_status)) return "Invalid status";
    if (!GENDERS.includes(form.gender)) return "Invalid gender";

    if (norm(form.new_password)) {
      if (form.new_password.length < 4) return "Password too short";
      if (form.new_password !== form.confirm_password) return "Passwords do not match";
    }
    return "";
  };

  const save = async () => {
    setErr("");
    setOk("");
    const v = validate();
    if (v) return setErr(v);
    if (!orig) return;

    const patch = buildPatch(orig, form);
    if (!Object.keys(patch).length) return setErr("No changes to save");

    if (!window.confirm("Save these changes to this member?")) return;

    try {
      await api.patch(`/members/${id}`, patch);
      const { data } = await api.get(`/members/${id}`);
      setOrig(data || null);
      setForm((f) => ({ ...f, new_password: "", confirm_password: "" }));
      setOk("Changes saved successfully");
      setTimeout(() => setOk(""), 1500);
    } catch (e) {
      setErr(e?.response?.data?.message || "Save failed");
    }
  };

  if (!canEdit) {
    return (
      <AppLayout>
        <div className="members-container">
          <div className="members-table-card">
            <h3>Not Allowed</h3>
            <p className="small">Only owner or agent can edit members.</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="members-container">

        {/* Top Bar */}
        <div className="members-topbar">
          <div>
            <h2>✏️ Edit Member</h2>
            <div className="small">
              Member ID: <span className="badge">{id}</span>
              {orig?.short_id && <> • Short ID: <span className="badge">{orig.short_id}</span></>}
            </div>
          </div>
          <button
            className="members-btn members-btn-secondary"
            onClick={() => nav(-1)}
            type="button"
          >
            ← Back
          </button>
        </div>

        {loading ? (
          <div className="members-table-card">
            <div className="small">Loading member data...</div>
          </div>
        ) : (
          <>
            {err && <div className="members-error">{err}</div>}
            {ok && <div className="members-success">{ok}</div>}

            <div className="members-table-card">

              {/* Basic Information */}
              <div className="members-form-group">
                <label>Nickname <span className="required">*</span></label>
                <input
                  value={form.nickname}
                  onChange={onChange("nickname")}
                  placeholder="Enter nickname"
                />
              </div>

              <div className="members-form-group">
                <label>Phone Number <span className="required">*</span></label>
                <input
                  value={form.phone}
                  onChange={onChange("phone")}
                  placeholder="Enter phone number"
                />
              </div>

              <div className="members-form-group">
                <label>Email Address</label>
                <input
                  value={form.email}
                  onChange={onChange("email")}
                  placeholder="Optional"
                />
              </div>

              <div className="members-form-group">
                <label>Country</label>
                <input
                  value={form.country}
                  onChange={onChange("country")}
                  placeholder="Optional"
                />
              </div>

              <div className="members-form-group">
                <label>Gender</label>
                <select value={form.gender} onChange={onChange("gender")}>
                  {GENDERS.map((x) => (
                    <option key={x} value={x}>
                      {x.charAt(0).toUpperCase() + x.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="members-form-group">
                <label>Sponsor Code</label>
                <div className="read-only-field" style={{ padding: "12px 16px", background: "#f9fafb", borderRadius: "8px", border: "1px solid #e5e7eb", color: "black" }}>
                  🔗 {orig?.sponsor_short_id || "None"}
                </div>
                <span className="small" style={{ color: "#6b7280", marginTop: "4px", display: "block" }}>
                  Cannot be changed
                </span>
              </div>

              {/* Account Status */}
              <div style={{ marginTop: "32px" }}>
                <h3 style={{ marginBottom: "16px", color: "#111827" }}>Account Status</h3>

                <div className="members-form-group">
                  <label>Ranking</label>
                  <select value={form.ranking} onChange={onChange("ranking")}>
                    {RANKS.map((x) => (
                      <option key={x} value={x}>
                        {rankLabel(x)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="members-form-group">
                  <label>Approval Status</label>
                  <select value={form.approval_status} onChange={onChange("approval_status")}>
                    {STATUSES.map((x) => (
                      <option key={x} value={x}>
                        {x}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="members-form-group">
                  <label>Withdraw Privilege</label>
                  <div className="checkbox-group" style={{ marginTop: "8px" }}>
                    <input
                      type="checkbox"
                      id="withdraw-priv"
                      checked={!!form.withdraw_privilege}
                      onChange={onChange("withdraw_privilege")}
                    />
                    <label htmlFor="withdraw-priv" style={{ cursor: "pointer" }}>
                      Allow this member to make withdrawals
                    </label>
                  </div>
                </div>
              </div>

              {/* Password Reset */}
              <div style={{ marginTop: "32px" }}>
                <h3 style={{ marginBottom: "16px", color: "#111827" }}>Password Reset</h3>

                <div className="members-form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    value={form.new_password}
                    onChange={onChange("new_password")}
                    placeholder="Leave blank to keep current password"
                  />
                </div>

                <div className="members-form-group">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    value={form.confirm_password}
                    onChange={onChange("confirm_password")}
                    placeholder="Re-enter new password"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="members-form-actions">
                <button
                  className="members-btn members-btn-primary members-btn-large"
                  type="button"
                  onClick={save}
                  disabled={!dirty}
                >
                  💾 Save Changes
                </button>

                <button
                  className="members-btn members-btn-secondary"
                  type="button"
                  onClick={() => {
                    if (!orig) return;
                    setErr("");
                    setOk("");
                    setForm((f) => ({
                      ...f,
                      nickname: orig.nickname || "",
                      phone: orig.phone || "",
                      email: orig.email || "",
                      country: orig.country || "",
                      ranking: orig.ranking || "Trial",
                      gender: orig.gender || "other",
                      approval_status: orig.approval_status || "pending",
                      withdraw_privilege: !!orig.withdraw_privilege,
                      new_password: "",
                      confirm_password: "",
                    }));
                  }}
                >
                  🔄 Reset to Original
                </button>

                {!dirty && <span className="small" style={{ alignSelf: "center", color: "#10b981" }}>✓ No unsaved changes</span>}
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}