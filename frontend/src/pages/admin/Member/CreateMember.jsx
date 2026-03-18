import { useEffect, useMemo, useState } from "react";
import api from "../../../services/api";
import { getUser } from "../../../auth";
import "./Members.css";
import AppLayout from "../../../components/AppLayout";

const RANKS = ["Trial", "V1", "V2", "V3"];

const COUNTRIES = [
  // Tier 1 — Wealthy / High purchasing power
  { name: "United States of America", dial: "+1" },
  { name: "Canada", dial: "+1" },
  { name: "United Kingdom", dial: "+44" },
  { name: "Germany", dial: "+49" },
  { name: "France", dial: "+33" },
  { name: "Netherlands", dial: "+31" },
  { name: "Switzerland", dial: "+41" },
  { name: "Sweden", dial: "+46" },
  { name: "Norway", dial: "+47" },
  { name: "Denmark", dial: "+45" },
  { name: "Australia", dial: "+61" },
  { name: "New Zealand", dial: "+64" },
  { name: "Singapore", dial: "+65" },
  { name: "United Arab Emirates", dial: "+971" },
  { name: "Japan", dial: "+81" },
  { name: "South Korea", dial: "+82" },
  { name: "Ireland", dial: "+353" },

  // Tier 2 — Emerging + high-investor appetite
  { name: "India", dial: "+91" },
  { name: "Indonesia", dial: "+62" },
  { name: "Philippines", dial: "+63" },
  { name: "Vietnam", dial: "+84" },
  { name: "Thailand", dial: "+66" },
  { name: "Malaysia", dial: "+60" },
  { name: "Pakistan", dial: "+92" },
  { name: "Bangladesh", dial: "+880" },
  { name: "Sri Lanka", dial: "+94" },
  { name: "Nigeria", dial: "+234" },
  { name: "Kenya", dial: "+254" },
  { name: "South Africa", dial: "+27" },
  { name: "Ghana", dial: "+233" },
  { name: "Brazil", dial: "+55" },
  { name: "Mexico", dial: "+52" },
  { name: "Argentina", dial: "+54" },
  { name: "Colombia", dial: "+57" },
  { name: "Chile", dial: "+56" },
  { name: "Peru", dial: "+51" },
  { name: "Egypt", dial: "+20" },
  { name: "Morocco", dial: "+212" },
  { name: "Saudi Arabia", dial: "+966" },
  { name: "Qatar", dial: "+974" },
  { name: "Kuwait", dial: "+965" },
  { name: "Israel", dial: "+972" },
  { name: "Turkey", dial: "+90" },
  { name: "Poland", dial: "+48" },
  { name: "Czech Republic", dial: "+420" },
  { name: "Romania", dial: "+40" },
  { name: "Hungary", dial: "+36" },
  { name: "Ukraine", dial: "+380" },
  { name: "Russia", dial: "+7" },
  { name: "China", dial: "+86" }
];


function extractDialCode(countryLabel) {
  const m = String(countryLabel || "").match(/\(\s*(\+\d+)\s*\)/);
  return m ? m[1] : "";
}
function digitsOnly(v) {
  return String(v || "").replace(/[^\d]/g, "");
}
function buildFullPhone(countryLabel, phoneInput) {
  const dial = extractDialCode(countryLabel);
  const num = digitsOnly(phoneInput);
  if (!dial || !num) return "";
  const dialDigits = digitsOnly(dial);
  return `+${dialDigits}${num}`;
}
function normalizeStoredPhone(storedPhone, selectedCountryLabel) {
  const raw = String(storedPhone || "").trim();
  if (!raw) return "";
  if (raw.startsWith("+")) return `+${digitsOnly(raw)}`;
  return buildFullPhone(selectedCountryLabel, raw);
}

function rankLabel(v) {
  const x = String(v || "").toUpperCase();
  if (x === "V1") return "VIP 1";
  if (x === "V2") return "VIP 2";
  if (x === "V3") return "VIP 3";
  if (x === "TRIAL") return "Trial";
  return x;
}

export default function CreateMember() {
  const me = getUser();

  // Static demo data
  const staticData = [
    {
      id: 1,
      short_id: "GM001245",
      nickname: "alexchen",
      phone: "+1-555-0303",
      gender: "male",
      ranking: "Trial",
      approval_status: "approved",
      sponsor_short_id: "GM000001",
    },
    {
      id: 2,
      short_id: "GM001246",
      nickname: "sophiakim",
      phone: "+82-2-1234-5678",
      gender: "female",
      ranking: "V1",
      approval_status: "pending",
      sponsor_short_id: "GM000001",
    },
    {
      id: 3,
      short_id: "GM001247",
      nickname: "jamesbrown",
      phone: "+44-20-7890-1234",
      gender: "male",
      ranking: "Trial",
      approval_status: "approved",
      sponsor_short_id: "GM000001",
    },
  ];

  const [list, setList] = useState(staticData);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const [form, setForm] = useState({
    country: "United States of America (+1)",
    phone: "",
    nickname: "",
    gender: "",
    password: "",
    ranking: "Trial",
    withdraw_privilege: "Enabled",
  });

  const load = async () => {
    const { data } = await api.get("/members");
    setList(data);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onChange = (key, value) => {
    setForm((p) => ({ ...p, [key]: value }));
    setFieldErrors((p) => ({ ...p, [key]: null }));
    setErr("");
  };

  const normalizedNickname = useMemo(
    () => form.nickname.trim().toLowerCase(),
    [form.nickname]
  );

  const nicknameDuplicate = useMemo(() => {
    if (!normalizedNickname) return false;
    return list.some(
      (m) => String(m.nickname || "").trim().toLowerCase() === normalizedNickname
    );
  }, [list, normalizedNickname]);

  const normalizedFullPhone = useMemo(
    () => buildFullPhone(form.country, form.phone),
    [form.country, form.phone]
  );

  const phoneDuplicate = useMemo(() => {
    if (!normalizedFullPhone) return false;
    return list.some((m) => {
      const existing = normalizeStoredPhone(m.phone, form.country);
      return existing && existing === normalizedFullPhone;
    });
  }, [list, normalizedFullPhone, form.country]);

  const create = async (e) => {
    e.preventDefault();
    setErr("");
    setOk("");
    setFieldErrors({});

    if (!form.country.trim()) return setErr("Country is required");
    if (!form.phone.trim()) return setErr("Phone number is required");
    if (!form.nickname.trim()) return setErr("Nickname is required");
    if (!form.gender.trim()) return setErr("Gender is required");
    if (!form.password.trim()) return setErr("Password is required");

    if (nicknameDuplicate) return setErr("Username already exists");
    if (phoneDuplicate) return setErr("Phone number already exists");

    const fullPhone = buildFullPhone(form.country, form.phone);
    if (!fullPhone) return setErr("Invalid phone/country");

    try {
      await api.post("/members", {
        nickname: form.nickname.trim(),
        phone: fullPhone,
        country: form.country,
        password: form.password,
        gender: form.gender,
        ranking: form.ranking,
        withdraw_privilege: form.withdraw_privilege,
        referral_code: me?.short_id || String(me?.id || ""),
      });

      setOk("✓ Member created successfully!");
      
      // Reset form
      setForm({
        country: "United States of America (+1)",
        phone: "",
        nickname: "",
        gender: "",
        password: "",
        ranking: "Trial",
        withdraw_privilege: "Enabled",
      });
      
      // Reload member list
      await load();
      
      // Clear success message after 3 seconds
      setTimeout(() => setOk(""), 3000);
    } catch (e2) {
      const data = e2?.response?.data;
      setErr(data?.message || "Failed to create member");
    }
  };

  return (
    <AppLayout>
      <div className="members-container">        
        <div className="members-topbar">
          <div>
            <h2>Create New Member</h2>
            <div className="small">
              You are <span className="badge">{me?.role}</span>
            </div>
          </div>

          <button
            type="button"
            className="members-btn members-btn-secondary"
            onClick={() => window.location.href = "/members"}
          >
            ← Back to Members
          </button>
        </div>

        <div className="members-table-card">
          <h3>Member Information</h3>
          <div className="small">Fill in the details below to create a new member account</div>
          <div className="members-hr" />

          {err && <div className="members-error">{err}</div>}
          {ok && <div className="members-success">{ok}</div>}

          <form onSubmit={create} className="members-form">
            <div className="members-form-grid">
              {/* Country */}
              <div className="members-form-group">
                <label className="members-label" htmlFor="country">
                  Country <span className="required">*</span>
                </label>
                <select
                  id="country"
                  className="members-select"
                  value={form.country}
                  onChange={(e) => onChange("country", e.target.value)}
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.dial + c.name} value={`${c.name} (${c.dial})`}>
                      {c.name} ({c.dial})
                    </option>
                  ))}
                </select>
                {fieldErrors.country && (
                  <div className="members-error" style={{ marginTop: 4, fontSize: 12 }}>
                    {fieldErrors.country[0]}
                  </div>
                )}
              </div>

              {/* Phone */}
              <div className="members-form-group">
                <label className="members-label" htmlFor="phone">
                  Phone Number <span className="required">*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  className="members-input"
                  value={form.phone}
                  onChange={(e) => onChange("phone", e.target.value)}
                  placeholder="Enter phone number"
                />
                {form.phone.trim() && phoneDuplicate && (
                  <div className="members-error" style={{ marginTop: 4, fontSize: 12 }}>
                    Phone number already exists
                  </div>
                )}
                {fieldErrors.phone && (
                  <div className="members-error" style={{ marginTop: 4, fontSize: 12 }}>
                    {fieldErrors.phone[0]}
                  </div>
                )}
              </div>

              {/* Gender */}
              <div className="members-form-group">
                <label className="members-label" htmlFor="gender">
                  Gender <span className="required">*</span>
                </label>
                <select
                  id="gender"
                  className="members-select"
                  value={form.gender}
                  onChange={(e) => onChange("gender", e.target.value)}
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Prefer not to say</option>
                </select>
                {fieldErrors.gender && (
                  <div className="members-error" style={{ marginTop: 4, fontSize: 12 }}>
                    {fieldErrors.gender[0]}
                  </div>
                )}
              </div>

              {/* Nickname */}
              <div className="members-form-group">
                <label className="members-label" htmlFor="nickname">
                  Nickname <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="nickname"
                  className="members-input"
                  value={form.nickname}
                  onChange={(e) => onChange("nickname", e.target.value)}
                  placeholder="Enter nickname"
                />
                {form.nickname.trim() && nicknameDuplicate && (
                  <div className="members-error" style={{ marginTop: 4, fontSize: 12 }}>
                    Username already exists
                  </div>
                )}
                {fieldErrors.nickname && (
                  <div className="members-error" style={{ marginTop: 4, fontSize: 12 }}>
                    {fieldErrors.nickname[0]}
                  </div>
                )}
              </div>

              {/* Ranking */}
              <div className="members-form-group">
                <label className="members-label" htmlFor="ranking">
                  Ranking
                </label>
                <select
                  id="ranking"
                  className="members-select"
                  value={form.ranking}
                  onChange={(e) => onChange("ranking", e.target.value)}
                >
                  {RANKS.map((r) => (
                    <option key={r} value={r}>
                      {rankLabel(r)}
                    </option>
                  ))}
                </select>
                {fieldErrors.ranking && (
                  <div className="members-error" style={{ marginTop: 4, fontSize: 12 }}>
                    {fieldErrors.ranking[0]}
                  </div>
                )}
              </div>

              {/* Password */}
              <div className="members-form-group">
                <label className="members-label" htmlFor="password">
                  Password <span className="required">*</span>
                </label>
                <input
                  type="password"
                  id="password"
                  className="members-input"
                  value={form.password}
                  onChange={(e) => onChange("password", e.target.value)}
                  placeholder="Enter password"
                  minLength={6}
                />
                {fieldErrors.password && (
                  <div className="members-error" style={{ marginTop: 4, fontSize: 12 }}>
                    {fieldErrors.password[0]}
                  </div>
                )}
              </div>

              {/* Sponsor ID (Read-only) */}
              <div className="members-form-group">
                <label className="members-label" htmlFor="sponsor">
                  Sponsor ID
                </label>
                <input
                  type="text"
                  id="sponsor"
                  className="members-input"
                  value={me?.short_id || me?.id || ""}
                  disabled
                  style={{ background: "#f1f5f9", cursor: "not-allowed" }}
                />
                <div className="small" style={{ marginTop: 4, color: "#64748b" }}>
                  Auto-assigned to the creator
                </div>
              </div>

              {/* Withdraw Privilege */}
              <div className="members-form-group">
                <label className="members-label" htmlFor="withdraw">
                  Withdraw Privilege
                </label>
                <select
                  id="withdraw"
                  className="members-select"
                  value={form.withdraw_privilege}
                  onChange={(e) => onChange("withdraw_privilege", e.target.value)}
                >
                  <option value="Enabled">Enabled</option>
                  <option value="Disabled">Disabled</option>
                </select>
                {fieldErrors.withdraw_privilege && (
                  <div className="members-error" style={{ marginTop: 4, fontSize: 12 }}>
                    {fieldErrors.withdraw_privilege[0]}
                  </div>
                )}
              </div>
            </div>

            <div className="members-form-actions">
              <button
                type="submit"
                className="members-btn members-btn-primary members-btn-large"
                disabled={nicknameDuplicate || phoneDuplicate}
                title={
                  nicknameDuplicate || phoneDuplicate
                    ? "Fix duplicate fields first"
                    : ""
                }
              >
                Create Member
              </button>

              <button
                type="button"
                className="members-btn members-btn-secondary members-btn-large"
                onClick={() => window.location.href = "/members"}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* Members List */}
        <div className="members-table-card" style={{ marginTop: 24 }}>
          <h3>Recently Created Members</h3>
          <div className="small">
            Showing members created by you
          </div>
          <div className="members-hr" />

          <div className="members-table-wrap">
            <table className="members-table">
              <thead>
                <tr>
                  <th>Member ID</th>
                  <th>Nickname</th>
                  <th>Phone</th>
                  <th>Gender</th>
                  <th>Ranking</th>
                  <th>Status</th>
                  <th>Sponsor</th>
                </tr>
              </thead>
              <tbody>
                {list.map((m) => (
                  <tr key={m.short_id || m.id}>
                    <td>{m.short_id}</td>
                    <td>{m.nickname}</td>
                    <td>{m.phone}</td>
                    <td style={{ textTransform: "capitalize" }}>{m.gender || "-"}</td>
                    <td>
                      <span className="badge">{rankLabel(m.ranking)}</span>
                    </td>
                    <td>
                      <span className="badge">{m.approval_status}</span>
                    </td>
                    <td>{m.sponsor_short_id || "-"}</td>
                  </tr>
                ))}
                {!list.length && (
                  <tr>
                    <td colSpan="7" className="empty">
                      No members created yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
