// src/pages/Members.jsx (list + filters + wallet redirect)
import { useEffect, useMemo, useState } from "react";
import api from "../../../services/api";
import { getUser } from "../../../auth";
import "./Members.css";
import AppLayout from "../../../components/AppLayout";
import { Link, useNavigate } from "react-router-dom";

const RANKS = ["Trial", "V1", "V2", "V3"];
const STATUSES = ["pending", "approved", "rejected"];

const fmtMoney = (v) => {
  const n = Number(v || 0);
  if (Number.isNaN(n)) return "0.00";
  return n.toFixed(2);
};

function norm(s) {
  return String(s ?? "").trim();
}

function toTs(x) {
  // supports created_at / createdAt values (ISO or timestamp)
  if (!x) return 0;
  if (typeof x === "number") return x;
  const t = Date.parse(String(x));
  return Number.isFinite(t) ? t : 0;
}

// ✅ nice datetime for "Last Online"
function fmtDT(x) {
  if (!x) return "-";
  const t = typeof x === "number" ? x : Date.parse(String(x));
  if (!Number.isFinite(t)) return String(x);
  return new Date(t).toLocaleString();
}

export default function Members() {
  const me = getUser();
  const nav = useNavigate();

  // Static demo data for development
  const staticData = [
    {
      id: 1,
      short_id: "GM001234",
      nickname: "johnsmith",
      phone: "+1-555-0101",
      ranking: "V3",
      approval_status: "approved",
      withdraw_privilege: true,
      balance: 125000.50,
      locked_balance: 25000.00,
      sponsor_short_id: "GM000001",
      last_login_ip: "192.168.1.100",
      last_login: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 2,
      short_id: "GM001235",
      nickname: "sarahwilson",
      phone: "+44-20-7123-4567",
      ranking: "V2",
      approval_status: "approved",
      withdraw_privilege: true,
      balance: 78500.25,
      locked_balance: 15000.00,
      sponsor_short_id: "GM000001",
      last_login_ip: "82.102.23.45",
      last_login: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 3,
      short_id: "GM001236",
      nickname: "michaelbrown",
      phone: "+1-555-0202",
      ranking: "V1",
      approval_status: "pending",
      withdraw_privilege: false,
      balance: 45000.00,
      locked_balance: 10000.00,
      sponsor_short_id: "GM001234",
      last_login_ip: "198.51.100.42",
      last_login: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 4,
      short_id: "GM001237",
      nickname: "emmajones",
      phone: "+61-2-9876-5432",
      ranking: "Trial",
      approval_status: "approved",
      withdraw_privilege: false,
      balance: 5000.75,
      locked_balance: 0,
      sponsor_short_id: "GM001234",
      last_login_ip: "203.0.113.25",
      last_login: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 5,
      short_id: "GM001238",
      nickname: "davidlee",
      phone: "+65-6123-4567",
      ranking: "V2",
      approval_status: "rejected",
      withdraw_privilege: false,
      balance: 32000.00,
      locked_balance: 5000.00,
      sponsor_short_id: "GM001235",
      last_login_ip: "103.28.154.12",
      last_login: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 6,
      short_id: "GM001239",
      nickname: "lisaanderson",
      phone: "+49-30-1234567",
      ranking: "V1",
      approval_status: "approved",
      withdraw_privilege: true,
      balance: 62000.00,
      locked_balance: 12000.00,
      sponsor_short_id: "GM001234",
      last_login_ip: "84.155.23.78",
      last_login: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 7,
      short_id: "GM001240",
      nickname: "robertwang",
      phone: "+86-10-12345678",
      ranking: "Trial",
      approval_status: "pending",
      withdraw_privilege: false,
      balance: 2500.00,
      locked_balance: 0,
      sponsor_short_id: "GM001235",
      last_login_ip: "223.5.5.5",
      last_login: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 8,
      short_id: "GM001241",
      nickname: "mariagomez",
      phone: "+34-91-123-4567",
      ranking: "V3",
      approval_status: "approved",
      withdraw_privilege: true,
      balance: 195000.00,
      locked_balance: 35000.00,
      sponsor_short_id: "GM000001",
      last_login_ip: "88.26.105.44",
      last_login: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  const [list, setList] = useState(staticData);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const canReview = me?.role === "owner" || me?.role === "agent";

  // -------------------------
  // Filters: draft -> apply
  // -------------------------
  const [draft, setDraft] = useState({
    q: "",
    ranking: "ALL",
    status: "ALL",
    sponsor: "ALL",
    sort: "created_desc", // created_desc | created_asc
  });

  const [filters, setFilters] = useState(draft);

  const sponsorOptions = useMemo(() => {
    const set = new Set();
    for (const m of list) {
      const s = norm(m?.sponsor_short_id);
      if (s) set.add(s);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [list]);

  const load = async () => {
    setErr("");
    try {
      const { data } = await api.get("/members");
      setList(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load members");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const approveMember = async (id) => {
    setErr("");
    setOk("");
    try {
      await api.patch(`/members/${id}/approve`);
      setOk("Member approved");
      await load();
      setTimeout(() => setOk(""), 1500);
    } catch (e) {
      setErr(e?.response?.data?.message || "Approve failed");
    }
  };

  const rejectMember = async (id) => {
    setErr("");
    setOk("");
    try {
      await api.patch(`/members/${id}/reject`);
      setOk("Member rejected");
      await load();
      setTimeout(() => setOk(""), 1500);
    } catch (e) {
      setErr(e?.response?.data?.message || "Reject failed");
    }
  };

  const applyFilters = () => setFilters(draft);

  const resetFilters = () => {
    const clean = {
      q: "",
      ranking: "ALL",
      status: "ALL",
      sponsor: "ALL",
      sort: "created_desc",
    };
    setDraft(clean);
    setFilters(clean);
  };

  const filtered = useMemo(() => {
    const q = norm(filters.q).toLowerCase();
    let rows = [...list];

    // ranking
    if (filters.ranking !== "ALL") {
      rows = rows.filter((m) => norm(m?.ranking) === filters.ranking);
    }

    // status
    if (filters.status !== "ALL") {
      rows = rows.filter((m) => norm(m?.approval_status) === filters.status);
    }

    // sponsor
    if (filters.sponsor !== "ALL") {
      rows = rows.filter((m) => norm(m?.sponsor_short_id) === filters.sponsor);
    }

    // search text
    if (q) {
      rows = rows.filter((m) => {
        const hay = [m?.id, m?.short_id, m?.nickname, m?.phone, m?.sponsor_short_id]
          .map((x) => norm(x).toLowerCase())
          .join(" ");
        return hay.includes(q);
      });
    }

    // sort
    rows.sort((a, b) => {
      const ta = toTs(a?.created_at ?? a?.createdAt);
      const tb = toTs(b?.created_at ?? b?.createdAt);

      if (filters.sort === "created_asc") {
        if (ta !== tb) return ta - tb;
        return Number(a?.id || 0) - Number(b?.id || 0);
      }

      if (ta !== tb) return tb - ta;
      return Number(b?.id || 0) - Number(a?.id || 0);
    });

    return rows;
  }, [list, filters]);

  // ✅ Login Details renderer
  // Map these fields to whatever your backend returns.
const renderLoginDetails = (m) => {
  const username = m?.nickname || "-";
  const ip = m?.last_login_ip || "-";
  const lastOnline = fmtDT(m?.last_login);

  return (
    <div className="members-login-details">
      <div>
        <b>Username:</b> {username}
      </div>
      <div>
        <b>IP:</b> {ip}
      </div>
      <div>
        <b>Last Online:</b> {lastOnline}
      </div>
    </div>
  );
};

  return (
    <AppLayout>
      <div className="members-container">        
        <div className="members-topbar">
          <div>
            <h2>Members</h2>
            <div className="small">
              You are <span className="badge">{me?.role}</span>
            </div>
          </div>

          <Link to="/members/create" className="members-create-btn">
            + Create Member
          </Link>
        </div>

        {/* ✅ FILTER BAR */}
        <div className="members-filter-card">
          <div className="members-filter-row">
            <div className="members-filter-group search">
              <label className="members-label">Search</label>
              <input
                className="members-input"
                placeholder="Search members..."
                value={draft.q}
                onChange={(e) => setDraft((s) => ({ ...s, q: e.target.value }))}
              />
            </div>

            <button className="members-btn members-btn-primary" type="button" onClick={applyFilters}>
              Search
            </button>

            <button className="members-btn members-btn-secondary" type="button" onClick={resetFilters}>
              Reset
            </button>
          </div>

          <div className="members-filter-row">
            <div className="members-filter-group">
              <label className="members-label">Ranking</label>
              <select
                className="members-select"
                value={draft.ranking}
                onChange={(e) => setDraft((s) => ({ ...s, ranking: e.target.value }))}
              >
                <option value="ALL">All</option>
                {RANKS.map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </select>
            </div>

            <div className="members-filter-group">
              <label className="members-label">Status</label>
              <select
                className="members-select"
                value={draft.status}
                onChange={(e) => setDraft((s) => ({ ...s, status: e.target.value }))}
              >
                <option value="ALL">All</option>
                {STATUSES.map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </select>
            </div>

            <div className="members-filter-group">
              <label className="members-label">Sponsor</label>
              <select
                className="members-select"
                value={draft.sponsor}
                onChange={(e) => setDraft((s) => ({ ...s, sponsor: e.target.value }))}
              >
                <option value="ALL">All</option>
                {sponsorOptions.map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </select>
            </div>

            <div className="members-filter-group">
              <label className="members-label">Sort By</label>
              <select
                className="members-select"
                value={draft.sort}
                onChange={(e) => setDraft((s) => ({ ...s, sort: e.target.value }))}
              >
                <option value="created_desc">Date Created (Newest)</option>
                <option value="created_asc">Date Created (Oldest)</option>
              </select>
            </div>
          </div>

          <div className="members-filter-summary">
            Showing <span className="badge">{filtered.length}</span> of{" "}
            <span className="badge">{list.length}</span>
          </div>
        </div>

        <div className="members-table-card">
          <h3>Members List</h3>
          <div className="small">
            Agent sees only their members. Owner sees own + members created by their agents.
          </div>
          <div className="members-hr" />

          {err && <div className="members-error">{err}</div>}
          {ok && <div className="members-success">{ok}</div>}

          <div className="members-table-wrap">
            <table className="members-table">
              <thead>
                <tr>
                  <th>Member ID</th>
                  <th>Nickname</th>
                  <th>Phone</th>

                  {/* ✅ NEW COLUMN */}
                  <th>Login Details</th>

                  <th>Ranking</th>
                  <th>Withdraw</th>
                  <th>Balance</th>
                  <th>Locked</th>
                  <th>Sponsor</th>
                  <th>Status</th>
                  <th>Wallet</th>
                  <th>Edit</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((m) => (
                  <tr key={m.short_id || m.id}>
                    <td>{m.short_id}</td>
                    <td>{m.nickname}</td>
                    <td>{m.phone}</td>

                    {/* ✅ NEW CELL */}
                    <td>{renderLoginDetails(m)}</td>

                    <td>
                      <span className="badge">{m.ranking}</span>
                    </td>

                    <td>
                      <span className="badge">
                        {m.withdraw_privilege ? "Enabled" : "Disabled"}
                      </span>
                    </td>

                    <td>
                      <span className="badge">{fmtMoney(m.balance)}</span>
                    </td>

                    <td>
                      <span className="badge">{fmtMoney(m.locked_balance)}</span>
                    </td>

                    <td>{m.sponsor_short_id || "-"}</td>

                    <td>
                      <span className="badge">{m.approval_status}</span>

                      {canReview && m.approval_status === "pending" && (
                        <div className="members-actions">
                          <button
                            className="btn btn-approve"
                            type="button"
                            onClick={() => approveMember(m.id)}
                          >
                            Approve
                          </button>

                          <button
                            className="btn btn-reject"
                            type="button"
                            onClick={() => rejectMember(m.id)}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </td>

                    <td>
                      <button
                        className="btn btn-wallet"
                        type="button"
                        onClick={() => nav(`/members/${m.id}/wallet`)}
                      >
                        Wallet
                      </button>
                    </td>

                    <td>
                      {canReview ? (
                        <button
                          className="btn btn-edit"
                          type="button"
                          onClick={() => nav(`/members/${m.id}/edit`)}
                        >
                          Edit
                        </button>
                      ) : (
                        <span className="small">—</span>
                      )}
                    </td>
                  </tr>
                ))}

                {!filtered.length && (
                  <tr>
                    {/* ✅ colSpan updated: now 12 columns */}
                    <td colSpan="12" className="empty">
                      No members match these filters.
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
