// src/pages/MemberWallet.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import api from "../../../services/api";
import { getUser } from "../../../auth";
import AppLayout from "../../../components/AppLayout";
import "./Members.css";

const fmtMoney = (v) => {
  const n = Number(v || 0);
  if (Number.isNaN(n)) return "0.00";
  return n.toFixed(2);
};

const fmtDate = (d) => {
  if (!d) return "-";
  try {
    return new Date(d).toLocaleString();
  } catch {
    return String(d);
  }
};

// ✅ Map DB status to UI status labels used in DepositRecord.css
// deposits/withdrawals table status: pending | approved | rejected
function uiStatus(dbStatus) {
  const s = String(dbStatus || "").toLowerCase();
  if (s === "approved") return "Completed";
  if (s === "rejected") return "Failed";
  return "Confirming"; // pending or unknown
}

/** Confirmation rule:
 * - Completed => 12/12
 * - Others => random 3..10 / 12
 */
function getConfirmationsByStatus(status, max = 12) {
  if (status === "Completed") return { current: max, max };
  const current = Math.floor(Math.random() * (10 - 3 + 1)) + 3;
  return { current, max };
}

// ✅ Normalize deposit row => card record
function normalizeDeposit(d) {
  const status = uiStatus(d.status);
  return {
    kind: "deposit",
    id: d.id, // numeric for API
    displayId: d.tx_ref ? `DP-${d.id}` : `DP-${d.id}`, // visible id
    date: fmtDate(d.created_at),
    amount: Number(d.amount || 0),
    method: d.method || "-",
    asset: d.asset || "-",
    network: d.network || "-",
    status,
    // show tx_ref as hash-like string
    txHash: d.tx_ref || "-",
    completedAt: d.reviewed_at ? fmtDate(d.reviewed_at) : "-",
    adminNote: d.admin_note || "",
    rawStatus: d.status || "pending",
  };
}

// ✅ Normalize withdrawal row => card record
function normalizeWithdrawal(w) {
  const status = uiStatus(w.status);
  return {
    kind: "withdrawal",
    id: w.id,
    displayId: `WD-${w.id}`,
    date: fmtDate(w.created_at),
    amount: Number(w.amount || 0),
    method: w.method || "-",
    asset: w.asset || "-", // if exists
    network: w.network || "-", // if exists
    status,
    txHash: w.tx_ref || "-", // if you have
    account: w.account_details || "-",
    completedAt: w.reviewed_at ? fmtDate(w.reviewed_at) : "-",
    adminNote: w.admin_note || "",
    rawStatus: w.status || "pending",
  };
}

export default function MemberWallet() {
  const me = getUser();
  const canCreate = me?.role === "owner" || me?.role === "agent"; // owners + agents
  const canReview = me?.role === "owner"; // only owners can approve/reject
  
  const nav = useNavigate();
  const { memberId } = useParams();
  const [sp, setSp] = useSearchParams();

  const tab = sp.get("tab") || "deposits"; // deposits | withdrawals
  const setTab = (t) => setSp({ tab: t });

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const [member, setMember] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [deps, setDeps] = useState([]);
  const [wds, setWds] = useState([]);

  // ✅ DepositRecord-like UI state
  const [filter, setFilter] = useState("All"); // All | Confirming | Completed | Failed
  const [search, setSearch] = useState("");
  const [active, setActive] = useState(null); // modal record

  const load = async () => {
    setErr("");
    setBusy(true);
    try {
      const { data } = await api.get(`/members/${memberId}/wallet`);

      setMember(data?.member || null);
      setWallet(data?.wallet || null);

      // ✅ show ALL records: keep full arrays from backend response
      setDeps(Array.isArray(data?.deposits) ? data.deposits : []);
      setWds(Array.isArray(data?.withdrawals) ? data.withdrawals : []);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load wallet");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberId]);

  const totals = useMemo(() => {
    const totalDeposit = deps.reduce((s, x) => s + Number(x.amount || 0), 0);
    const totalWithdraw = wds.reduce((s, x) => s + Number(x.amount || 0), 0);
    return { totalDeposit, totalWithdraw };
  }, [deps, wds]);

  const titleName = member?.nickname || member?.name || "Member";

  // ✅ Build records for current tab (normalized)
  const records = useMemo(() => {
    if (tab === "withdrawals") return wds.map(normalizeWithdrawal);
    return deps.map(normalizeDeposit);
  }, [tab, deps, wds]);

  // ✅ Apply filter + search (same behavior as DepositRecord)
  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (filter !== "All" && r.status !== filter) return false;

      if (search) {
        const q = search.toLowerCase();
        const a = String(r.displayId || "").toLowerCase();
        const b = String(r.txHash || "").toLowerCase();
        if (!a.includes(q) && !b.includes(q)) return false;
      }
      return true;
    });
  }, [records, filter, search]);

  // approve/reject actions (owner)
  const actDeposit = async (id, action) => {
    setErr("");
    setBusy(true);
    try {
      await api.patch(`/deposits/${id}/${action}`, { admin_note: null });
      await load();
      setActive(null);
    } catch (e) {
      setErr(e?.response?.data?.message || `Deposit ${action} failed`);
    } finally {
      setBusy(false);
    }
  };

  const actWithdrawal = async (id, action) => {
    setErr("");
    setBusy(true);
    try {
      await api.patch(`/withdrawals/${id}/${action}`, { admin_note: null });
      await load();
      setActive(null);
    } catch (e) {
      setErr(e?.response?.data?.message || `Withdrawal ${action} failed`);
    } finally {
      setBusy(false);
    }
  };

  const filters = ["All", "Confirming", "Completed", "Failed"];

  return (
    <AppLayout>
      <div className="members-container">
        <div className="members-topbar">
          <div>
            <h2>Member Wallet</h2>
            <div className="small">
              Member: <span className="badge">{titleName}</span> • ID:{" "}
              <span className="badge">{member?.short_id || memberId}</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="members-btn members-btn-secondary" type="button" onClick={() => nav(-1)} disabled={busy}>
              ← Back
            </button>
            <button className="members-btn members-btn-primary" type="button" onClick={load} disabled={busy}>
              Refresh
            </button>

            {canCreate && (
              <>
                <Link className="members-btn members-btn-primary" to={`/members/${memberId}/wallet/deposit/new`}>
                  + Create Deposit
                </Link>
                <Link className="members-btn members-btn-primary" to={`/members/${memberId}/wallet/withdraw/new`}>
                  + Create Withdrawal
                </Link>
              </>
            )}
          </div>
        </div>

        {err && <div className="members-error">{err}</div>}

        {/* Summary cards */}
        <div className="wallet-summary-grid">
          <div className="wallet-summary-card">
            <div className="label">Balance</div>
            <div className="value">
              {wallet ? fmtMoney(wallet.balance) : busy ? "…" : "0.00"}
            </div>
          </div>

          <div className="wallet-summary-card">
            <div className="label">Locked</div>
            <div className="value">
              {wallet ? fmtMoney(wallet.locked_balance) : busy ? "…" : "0.00"}
            </div>
          </div>

          <div className="wallet-summary-card">
            <div className="label">Total Deposit</div>
            <div className="value">{fmtMoney(totals.totalDeposit)}</div>
          </div>

          <div className="wallet-summary-card">
            <div className="label">Total Withdraw</div>
            <div className="value">{fmtMoney(totals.totalWithdraw)}</div>
          </div>
        </div>

        {/* Tabs + Records */}
        <div className="members-table-card">
          {/* Tabs */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
            <button
              className={`members-btn ${tab === "deposits" ? "members-btn-primary" : "members-btn-secondary"}`}
              type="button"
              onClick={() => {
                setTab("deposits");
                setFilter("All");
                setSearch("");
                setActive(null);
              }}
            >
              Deposits ({deps.length})
            </button>

            <button
              className={`members-btn ${tab === "withdrawals" ? "members-btn-primary" : "members-btn-secondary"}`}
              type="button"
              onClick={() => {
                setTab("withdrawals");
                setFilter("All");
                setSearch("");
                setActive(null);
              }}
            >
              Withdrawals ({wds.length})
            </button>
          </div>

          <div className="members-hr" />

          {/* Status filter (same as DepositRecord) */}
          <section className="dpFilters" style={{ marginTop: 6 }}>
            {filters.map((f) => (
              <button
                key={f}
                className={`dpFilterBtn ${filter === f ? "active" : ""}`}
                onClick={() => setFilter(f)}
                type="button"
              >
                {f}
              </button>
            ))}
          </section>

          {/* Search */}
          <section className="dpSearch">
            <input
              placeholder={`Search by ${tab === "deposits" ? "Deposit" : "Withdraw"} ID or TX hash`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </section>

          {/* Records */}
          <main className="dpWrap">
            {busy && <div className="small">Loading…</div>}

            {!busy && filtered.length === 0 && (
              <div className="dpEmpty">No records found.</div>
            )}

            {filtered.map((r) => (
              <div
                key={`${r.kind}-${r.id}`}
                className="dpCard clickable"
                onClick={() =>
                  setActive({
                    ...r,
                    confirmations: getConfirmationsByStatus(r.status, 12),
                  })
                }
              >
                <div className="dpRow">
                  <span className="dpLabel">Amount</span>
                  <span className="dpAmount">
                    {fmtMoney(r.amount)} {r.asset !== "-" ? r.asset : "USDT"}
                  </span>
                </div>

                <div className="dpRow">
                  <span className="dpLabel">{r.kind === "deposit" ? "Network" : "Method"}</span>
                  <span>{r.kind === "deposit" ? r.network : r.method}</span>
                </div>

                <div className="dpRow">
                  <span className="dpLabel">Date</span>
                  <span>{r.date}</span>
                </div>

                <div className="dpRow">
                  <span className="dpLabel">Status</span>
                  <span className={`dpStatus ${r.status.toLowerCase()}`}>
                    {r.status}
                  </span>
                </div>

                <div className="dpFooter">
                  <span className="dpId">{r.displayId}</span>
                  <span className="dpView">View Details →</span>
                </div>
              </div>
            ))}
          </main>
        </div>

        {/* Detail modal */}
        {active && (
          <div className="dpModalOverlay" onClick={() => setActive(null)}>
            <div className="dpModal" onClick={(e) => e.stopPropagation()}>
              <div className="dpModalTop">
                <div className="dpModalTitle">
                  {active.kind === "deposit" ? "Deposit Details" : "Withdrawal Details"}
                </div>
                <button className="dpClose" onClick={() => setActive(null)} type="button">
                  ✕
                </button>
              </div>

              <div className="dpModalBody">
                <DepositTimeline status={active.status} />

                {active.confirmations && active.kind === "deposit" && (
                  <DetailRow
                    label="Confirmations"
                    value={`${active.confirmations.current} / ${active.confirmations.max}`}
                  />
                )}

                <DetailRow label="Record ID" value={active.displayId} />
                <DetailRow label="Amount" value={`${fmtMoney(active.amount)} ${active.asset !== "-" ? active.asset : "USDT"}`} />
                <DetailRow label="Method" value={active.method} />

                {active.kind === "deposit" ? (
                  <>
                    <DetailRow label="Asset" value={active.asset} />
                    <DetailRow label="Network" value={active.network} />
                  </>
                ) : (
                  <DetailRow label="Account" value={active.account} />
                )}

                <DetailRow label="TX Hash" mono value={active.txHash} />
                <DetailRow label="Submitted At" value={active.date} />
                <DetailRow label="Completed At" value={active.completedAt} />

                {!!active.adminNote && (
                  <DetailRow label="Admin note" value={active.adminNote} />
                )}
              </div>

              <div className="dpModalFooter" style={{ gap: 8, flexWrap: "wrap" }}>
                <button className="dpBtnSoft" onClick={() => setActive(null)} type="button">
                  Close
                </button>

                {active.txHash !== "-" && (
                  <button
                    className="dpBtnPrimary"
                    onClick={() => navigator.clipboard.writeText(active.txHash)}
                    type="button"
                  >
                    Copy TX Hash
                  </button>
                )}

                {/* Owner actions if pending */}
                {canReview && String(active.rawStatus).toLowerCase() === "pending" && (
                  <>
                    {active.kind === "deposit" ? (
                      <>
                        <button
                          className="dpBtnPrimary"
                          type="button"
                          disabled={busy}
                          onClick={() => actDeposit(active.id, "approve")}
                        >
                          Approve
                        </button>
                        <button
                          className="dpBtnPrimary"
                          type="button"
                          disabled={busy}
                          onClick={() => actDeposit(active.id, "reject")}
                          style={{ background: "#dc2626" }}
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="dpBtnPrimary"
                          type="button"
                          disabled={busy}
                          onClick={() => actWithdrawal(active.id, "approve")}
                        >
                          Approve
                        </button>
                        <button
                          className="dpBtnPrimary"
                          type="button"
                          disabled={busy}
                          onClick={() => actWithdrawal(active.id, "reject")}
                          style={{ background: "#dc2626" }}
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

/* Components copied from your DepositRecord */

function DepositTimeline({ status }) {
  const steps = ["Submitted", "Confirming", "Completed"];

  let current = 1;
  if (status === "Confirming") current = 2;
  if (status === "Completed") current = 3;
  if (status === "Failed") current = 2;

  return (
    <div className={`dpTimeline ${status.toLowerCase()}`}>
      {steps.map((s, i) => {
        const done = i + 1 <= current && status !== "Failed";
        const failed = status === "Failed" && i === 1;

        return (
          <div key={s} className="dpStep">
            <div className={`dpDot ${done ? "done" : ""} ${failed ? "failed" : ""}`} />
            <div className="dpStepLabel">{s}</div>
            {i < steps.length - 1 && <div className="dpLine" />}
          </div>
        );
      })}
    </div>
  );
}

function DetailRow({ label, value, mono }) {
  return (
    <div className="dpDetailRow">
      <div className="dpDetailLabel">{label}</div>
      <div className={`dpDetailValue ${mono ? "mono" : ""}`}>{value}</div>
    </div>
  );
}
