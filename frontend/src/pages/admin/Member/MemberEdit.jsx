// src/pages/MemberEdit.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../../services/api";
import AppLayout from "../../../components/AppLayout";
import { getUser } from "../../../auth";
import "./Members.css";

const RANKS = ["Trial", "V1", "V2", "V3"];
const STATUSES = ["pending", "approved", "rejected"];
const GENDERS = ["male", "female", "other"];

function rankLabel(v) {
  const x = String(v || "").trim().toUpperCase();
  if (x === "V1") return "VIP 1";
  if (x === "V2") return "VIP 2";
  if (x === "V3") return "VIP 3";
  if (x === "TRIAL") return "Trial";
  // optional: V4 -> VIP 4 etc
  if (/^V\d+$/.test(x)) return `VIP ${x.slice(1)}`;
  return x || "-";
}

function norm(v) {
  return String(v ?? "").trim();
}

function buildPatch(original, form) {
  // only send changed fields
  const patch = {};

  const fields = [
    "nickname",
    "phone",
    "email",
    "country",
    "ranking",
    "gender",
    "approval_status",
  ];

  for (const k of fields) {
    const a = norm(original?.[k]);
    const b = norm(form?.[k]);
    if (a !== b) patch[k] = b; // backend handles "" -> null for email/country if you want
  }

  // boolean
  if (Boolean(original?.withdraw_privilege) !== Boolean(form?.withdraw_privilege)) {
    patch.withdraw_privilege = !!form.withdraw_privilege;
  }

  // password
  if (norm(form?.new_password)) {
    patch.new_password = norm(form.new_password);
  }

  return patch;
}

export default function MemberEdit() {
  const me = getUser();
  const nav = useNavigate();
  const { memberId } = useParams();
  const id = memberId; // keep rest of your code unchanged


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
  if (!canEdit) return; // UI guard
  if (!id) {
    setErr("Invalid member id in URL");
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
        sponsor_short_id: data?.sponsor_short_id || "",
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
      if (form.new_password !== form.confirm_password) return "Password confirm does not match";
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

  // ✅ confirmation
  const yes = window.confirm("Save these changes to this member?");
  if (!yes) return;

  try {
    await api.patch(`/members/${id}`, patch);

    const { data } = await api.get(`/members/${id}`);
    setOrig(data || null);
    setForm((f) => ({ ...f, new_password: "", confirm_password: "" }));

    setOk("Saved");
    setTimeout(() => setOk(""), 1200);
  } catch (e) {
    setErr(e?.response?.data?.message || "Save failed");
  }
};

if (!canEdit) {
  return (
    <AppLayout>
      <div className="container">
        <div className="card">
          <h3>Not allowed</h3>
          <div className="small">Only owner/agent can edit members.</div>
        </div>
      </div>
    </AppLayout>
  );
}

  return (
    <AppLayout>
      <div className="container">
        <div className="topbar">
          <div>
            <h2>Edit Member</h2>
            <div className="small">
              Member ID: <span className="badge">{id}</span>
              {orig?.short_id ? (
                <>
                  {" "} • Short ID: <span className="badge">{orig.short_id}</span>
                </>
              ) : null}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="btn" type="button" onClick={() => nav(-1)}>
              ← Back
            </button>
          </div>
        </div>

        {loading ? (
          <div className="card">
            <div className="small">Loading…</div>
          </div>
        ) : (
          <>
            {err && <div className="error">{err}</div>}
            {ok && <div className="ok">{ok}</div>}

            {/* Basic Information Section */}
            <div className="form-section">
              <div className="form-section-header">
                <div className="form-section-icon">👤</div>
                <h3>Basic Information</h3>
              </div>
              
              <div className="form-group">
                <label>Nickname *</label>
                <input value={form.nickname} onChange={onChange("nickname")} placeholder="Enter nickname" />
              </div>

              <div className="form-group">
                <label>Phone Number *</label>
                <input value={form.phone} onChange={onChange("phone")} placeholder="Enter phone" />
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input value={form.email} onChange={onChange("email")} placeholder="Optional" />
              </div>

              <div className="form-group">
                <label>Country</label>
                <input value={form.country} onChange={onChange("country")} placeholder="Optional" />
              </div>

              <div className="form-group">
                <label>Gender</label>
                <select value={form.gender} onChange={onChange("gender")}>
                  {GENDERS.map((x) => (
                    <option key={x} value={x}>{x}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Sponsor Code</label>
                <div className="read-only-field">
                  🔗 {orig?.sponsor_short_id || "None"}
                </div>
                <span className="help-text">Cannot be changed</span>
              </div>
            </div>

            {/* Account Status Section */}
            <div className="form-section">
              <div className="form-section-header">
                <div className="form-section-icon">⚙️</div>
                <h3>Account Status</h3>
              </div>
              
              <div className="form-group">
                <label>Ranking</label>
                <select value={form.ranking} onChange={onChange("ranking")}>
                  {RANKS.map((x) => (
                    <option key={x} value={x}>
                      {rankLabel(x)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Status</label>
                <select value={form.approval_status} onChange={onChange("approval_status")}>
                  {STATUSES.map((x) => (
                    <option key={x} value={x}>{x}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Withdraw Allowed</label>
                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    id="withdraw-priv"
                    checked={!!form.withdraw_privilege}
                    onChange={onChange("withdraw_privilege")}
                  />
                  <label htmlFor="withdraw-priv">Allow withdrawals</label>
                </div>
              </div>
            </div>

            {/* Password Section */}
            <div className="form-section">
              <div className="form-section-header">
                <div className="form-section-icon">🔒</div>
                <h3>Password</h3>
              </div>

              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={form.new_password}
                  onChange={onChange("new_password")}
                  placeholder="Leave blank to keep current"
                />
              </div>

              <div className="form-group">
                <label>Confirm</label>
                <input
                  type="password"
                  value={form.confirm_password}
                  onChange={onChange("confirm_password")}
                  placeholder="Re-enter password"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="action-buttons">
                <button className="btn btn-success" type="button" onClick={save} disabled={!dirty}>
                  💾 Save Changes
                </button>

                <button
                  className="btn btn-secondary"
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
                      sponsor_short_id: orig.sponsor_short_id || "",
                      new_password: "",
                      confirm_password: "",
                    }));
                  }}
                >
                  🔄 Reset to Original
                </button>

                {!dirty && <span className="small" style={{ alignSelf: "center" }}>✓ No unsaved changes</span>}
              </div>
            </>
          )}
      </div>
    </AppLayout>
  );
}
