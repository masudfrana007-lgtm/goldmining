// src/pages/Members.jsx
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
  if (!x) return 0;
  if (typeof x === "number") return x;
  const t = Date.parse(String(x));
  return Number.isFinite(t) ? t : 0;
}

function fmtDT(x) {
  if (!x) return "-";
  const t = typeof x === "number" ? x : Date.parse(String(x));
  if (!Number.isFinite(t)) return String(x);
  return new Date(t).toLocaleString();
}

export default function Members() {
  const me = getUser();
  const nav = useNavigate();

  // ✅ Only dynamic data - start empty
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const canReview = me?.role === "owner" || me?.role === "agent";

  // Filters
  const [draft, setDraft] = useState({
    q: "",
    ranking: "ALL",
    status: "ALL",
    sponsor: "ALL",
    sort: "created_desc",
  });
  const [filters, setFilters] = useState(draft);

  // Sponsor options from loaded data
  const sponsorOptions = useMemo(() => {
    const set = new Set();
    for (const m of list) {
      const s = norm(m?.sponsor_short_id);
      if (s) set.add(s);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [list]);

  // ✅ Load members from backend ONLY
  const load = async () => {
    setErr("");
    setLoading(true);
    try {
      const { data } = await api.get("/members");
      setList(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to load members:", e);
      setErr(e?.response?.data?.message || "Failed to load members");
    } finally {
      setLoading(false);
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

  // ✅ Filter + sort logic (unchanged, works on dynamic data)
  const filtered = useMemo(() => {
    const q = norm(filters.q).toLowerCase();
    let rows = [...list];

    if (filters.ranking !== "ALL") {
      rows = rows.filter((m) => norm(m?.ranking) === filters.ranking);
    }
    if (filters.status !== "ALL") {
      rows = rows.filter((m) => norm(m?.approval_status) === filters.status);
    }
    if (filters.sponsor !== "ALL") {
      rows = rows.filter((m) => norm(m?.sponsor_short_id) === filters.sponsor);
    }
    if (q) {
      rows = rows.filter((m) => {
        const hay = [m?.id, m?.short_id, m?.nickname, m?.phone, m?.sponsor_short_id]
          .map((x) => norm(x).toLowerCase())
          .join(" ");
        return hay.includes(q);
      });
    }

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

  const renderLoginDetails = (m) => {
    const username = m?.nickname || "-";
    const ip = m?.last_login_ip || "-";
    const lastOnline = fmtDT(m?.last_login);
    return (
      <div className="members-login-details">
        <div><b>Username:</b> {username}</div>
        <div><b>IP:</b> {ip}</div>
        <div><b>Last Online:</b> {lastOnline}</div>
      </div>
    );
  };

  // ✅ Show loading state
  if (loading) {
    return (
      <AppLayout>
        <div className="members-container">
          <div className="members-loading">Loading members...</div>
        </div>
      </AppLayout>
    );
  }

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
          <Link to="/admin/member/create" className="members-create-btn">
            + Create Member
          </Link>
        </div>

        {/* Filter Bar */}
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
                  <option key={x} value={x}>{x}</option>
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
                  <option key={x} value={x}>{x}</option>
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
                  <option key={x} value={x}>{x}</option>
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
                  <tr key={m.id}>
                    <td>{m.short_id}</td>
                    <td>{m.nickname}</td>
                    <td>{m.phone}</td>
                    <td>{renderLoginDetails(m)}</td>
                    <td><span className="badge">{m.ranking}</span></td>
                    <td>
                      <span className="badge">
                        {m.withdraw_privilege ? "Enabled" : "Disabled"}
                      </span>
                    </td>
                    <td><span className="badge">{fmtMoney(m.balance)}</span></td>
                    <td><span className="badge">{fmtMoney(m.locked_balance)}</span></td>
                    <td>{m.sponsor_short_id || "-"}</td>
                    <td>
                      <span className="badge">{m.approval_status}</span>
                      {canReview && m.approval_status === "pending" && (
                        <div className="members-actions">
                          <button className="btn btn-approve" type="button" onClick={() => approveMember(m.id)}>
                            Approve
                          </button>
                          <button className="btn btn-reject" type="button" onClick={() => rejectMember(m.id)}>
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                    <td>
                      <button className="btn btn-wallet" type="button" onClick={() => nav(`/members/${m.id}/wallet`)}>
                        Wallet
                      </button>
                    </td>
                    <td>
                      {canReview ? (
                        <button className="btn btn-edit" type="button" onClick={() => nav(`/members/${m.id}/edit`)}>
                          Edit
                        </button>
                      ) : (
                        <span className="small">—</span>
                      )}
                    </td>
                  </tr>
                ))}

                {/* ✅ Empty state when no data matches filters */}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="12" className="empty">
                      {list.length === 0 ? "No members found. Create one to get started." : "No members match these filters."}
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