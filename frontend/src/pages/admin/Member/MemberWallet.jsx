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

// Map DB status → UI-friendly labels
function uiStatus(dbStatus) {
  const s = String(dbStatus || "").toLowerCase();
  if (s === "approved") return "Completed";
  if (s === "rejected") return "Failed";
  return "Confirming"; // pending or unknown
}

function getConfirmationsByStatus(status, max = 12) {
  if (status === "Completed") return { current: max, max };
  const current = Math.floor(Math.random() * (10 - 3 + 1)) + 3;
  return { current, max };
}

function normalizeDeposit(d) {
  const status = uiStatus(d.status);
  return {
    kind: "deposit",
    id: d.id,
    displayId: d.tx_ref ? `DP-${d.id}` : `DP-${d.id}`,
    date: fmtDate(d.created_at),
    amount: Number(d.amount || 0),
    method: d.method || "-",
    asset: d.asset || "USDT",
    network: d.network || "-",
    status,
    txHash: d.tx_ref || "-",
    proofUrl: d.proof_url || null,
    completedAt: d.reviewed_at ? fmtDate(d.reviewed_at) : "-",
    adminNote: d.admin_note || "",
    rawStatus: d.status || "pending",
  };
}

function normalizeWithdrawal(w) {
  const status = uiStatus(w.status);
  return {
    kind: "withdrawal",
    id: w.id,
    displayId: `WD-${w.id}`,
    date: fmtDate(w.created_at),
    amount: Number(w.amount || 0),
    method: w.method || "-",
    asset: w.asset || "USDT", // fallback
    network: w.network || "-",
    status,
    txHash: w.tx_ref || "-",
    account: w.account_details || "-",
    completedAt: w.reviewed_at ? fmtDate(w.reviewed_at) : "-",
    adminNote: w.admin_note || "",
    rawStatus: w.status || "pending",
  };
}

export default function MemberWallet() {
  const me = getUser();
  const canCreate = me?.role === "owner" || me?.role === "agent";
  const canReview = me?.role === "owner";

  const nav = useNavigate();
  const { memberId } = useParams();
  const [sp, setSp] = useSearchParams();
  const tab = sp.get("tab") || "deposits";
  const setTab = (t) => setSp({ tab: t });

  const [busy, setBusy] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [err, setErr] = useState("");
  const [member, setMember] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [deps, setDeps] = useState([]);
  const [wds, setWds] = useState([]);

  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [active, setActive] = useState(null);

  const load = async () => {
    setErr("");
    setBusy(true);
    try {
      const { data } = await api.get(`/members/${memberId}/wallet`);
      setMember(data?.member || null);
      setWallet(data?.wallet || null);
      setDeps(Array.isArray(data?.deposits) ? data.deposits : []);
      setWds(Array.isArray(data?.withdrawals) ? data.withdrawals : []);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load wallet data");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    load();
  }, [memberId]);

  const totals = useMemo(() => {
    const totalDeposit = deps.reduce((s, x) => s + Number(x.amount || 0), 0);
    const totalWithdraw = wds.reduce((s, x) => s + Number(x.amount || 0), 0);
    return { totalDeposit, totalWithdraw };
  }, [deps, wds]);

  const titleName = member?.nickname || "Member";

  const records = useMemo(() => {
    if (tab === "withdrawals") return wds.map(normalizeWithdrawal);
    return deps.map(normalizeDeposit);
  }, [tab, deps, wds]);

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (filter !== "All" && r.status !== filter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !String(r.displayId || "").toLowerCase().includes(q) &&
          !String(r.txHash || "").toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [records, filter, search]);

  const actTransaction = async (kind, id, action) => {
    if (actionBusy) return;
    setErr("");
    setActionBusy(true);
    try {
      const endpoint = kind === "deposit" ? `/deposits/${id}/${action}` : `/withdrawals/${id}/${action}`;
      await api.patch(endpoint, { admin_note: "" });
      await load();
      setActive(null);
    } catch (e) {
      setErr(e?.response?.data?.message || `${action} failed for ${kind}`);
    } finally {
      setActionBusy(false);
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
            <button
              className="members-btn members-btn-secondary"
              type="button"
              onClick={() => nav(-1)}
              disabled={busy || actionBusy}
            >
              ← Back
            </button>
            <button
              className="members-btn members-btn-primary"
              type="button"
              onClick={load}
              disabled={busy || actionBusy}
            >
              Refresh
            </button>
            {canCreate && (
              <>
                <Link
                  className="members-btn members-btn-primary"
                  to={`/members/${memberId}/wallet/deposit/new`}
                >
                  + Create Deposit
                </Link>
                <Link
                  className="members-btn members-btn-primary"
                  to={`/members/${memberId}/wallet/withdraw/new`}
                >
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
              disabled={busy || actionBusy}
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
              disabled={busy || actionBusy}
            >
              Withdrawals ({wds.length})
            </button>
          </div>

          <div className="members-hr" />

          <section className="dpFilters" style={{ marginTop: 6 }}>
            {filters.map((f) => (
              <button
                key={f}
                className={`dpFilterBtn ${filter === f ? "active" : ""}`}
                onClick={() => setFilter(f)}
                type="button"
                disabled={busy || actionBusy}
              >
                {f}
              </button>
            ))}
          </section>

          <section className="dpSearch">
            <input
              placeholder={`Search by ${tab === "deposits" ? "Deposit" : "Withdraw"} ID or TX hash`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              disabled={busy || actionBusy}
            />
          </section>

          <main className="dpWrap">
            {busy && <div className="small">Loading…</div>}
            {!busy && filtered.length === 0 && (
              <div className="dpEmpty">No records found.</div>
            )}

            {filtered.map((r) => (
              <div
                key={`${r.kind}-${r.id}`}
                className="dpCard clickable"
                onClick={() => setActive(r)}
              >
                <div className="dpRow">
                  <span className="dpLabel">Amount</span>
                  <span className="dpAmount">
                    {fmtMoney(r.amount)} {r.asset}
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

                {active.kind === "deposit" && active.confirmations && (
                  <DetailRow
                    label="Confirmations"
                    value={`${active.confirmations.current} / ${active.confirmations.max}`}
                  />
                )}

                <DetailRow label="Record ID" value={active.displayId} />
                <DetailRow
                  label="Amount"
                  value={`${fmtMoney(active.amount)} ${active.asset}`}
                />
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

                {active.kind === "deposit" && active.proofUrl && active.proofUrl !== "-" && (
                  <div style={{ marginTop: 16 }}>
                    <div className="dpDetailLabel">Proof Image</div>
                    <img
                      src={active.proofUrl}
                      alt="Payment proof"
                      style={{
                        maxWidth: "100%",
                        borderRadius: 8,
                        marginTop: 8,
                        display: "block",
                      }}
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  </div>
                )}

                <DetailRow label="Submitted At" value={active.date} />
                <DetailRow label="Completed At" value={active.completedAt} />

                {active.adminNote && (
                  <DetailRow label="Admin Note" value={active.adminNote} />
                )}
              </div>

              <div className="dpModalFooter" style={{ gap: 8, flexWrap: "wrap" }}>
                <button
                  className="dpBtnSoft"
                  onClick={() => setActive(null)}
                  type="button"
                  disabled={actionBusy}
                >
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

                {canReview && String(active.rawStatus).toLowerCase() === "pending" && (
                  <>
                    {active.kind === "deposit" ? (
                      <>
                        <button
                          className="dpBtnPrimary"
                          type="button"
                          disabled={actionBusy}
                          onClick={() => actTransaction("deposit", active.id, "approve")}
                        >
                          {actionBusy ? "Processing..." : "Approve"}
                        </button>
                        <button
                          className="dpBtnPrimary"
                          type="button"
                          disabled={actionBusy}
                          onClick={() => actTransaction("deposit", active.id, "reject")}
                          style={{ background: "#dc2626" }}
                        >
                          {actionBusy ? "Processing..." : "Reject"}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="dpBtnPrimary"
                          type="button"
                          disabled={actionBusy}
                          onClick={() => actTransaction("withdrawal", active.id, "approve")}
                        >
                          {actionBusy ? "Processing..." : "Approve"}
                        </button>
                        <button
                          className="dpBtnPrimary"
                          type="button"
                          disabled={actionBusy}
                          onClick={() => actTransaction("withdrawal", active.id, "reject")}
                          style={{ background: "#dc2626" }}
                        >
                          {actionBusy ? "Processing..." : "Reject"}
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

/* Reused components */
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

function DetailRow({ label, value, mono = false }) {
  return (
    <div className="dpDetailRow">
      <div className="dpDetailLabel">{label}</div>
      <div className={`dpDetailValue ${mono ? "mono" : ""}`}>{value || "-"}</div>
    </div>
  );
}