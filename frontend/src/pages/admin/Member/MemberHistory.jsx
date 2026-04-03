import { useEffect, useMemo, useState } from "react";
import memberApi from "../services/memberApi";
import MemberBottomNav from "../components/MemberBottomNav";
import "../styles/memberHistory.css";

function safeNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function normalizeStatus(s) {
  // backend: pending/approved/rejected (or processing etc)
  // UI expects: Completed / Pending / Processing / Failed etc
  const x = String(s || "").toLowerCase();
  if (x === "approved" || x === "completed") return "Completed";
  if (x === "rejected" || x === "failed") return "Failed";
  if (x === "pending") return "Pending";
  if (x === "processing") return "Processing";
  return s || "-";
}

function titleCase(x) {
  const s = String(x || "");
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function MemberHistory() {
  const [rows, setRows] = useState([]);        // unified list: deposits + withdrawals + tasks
  const [summary, setSummary] = useState(null); // from /member/history-summary
  const [totals, setTotals] = useState({
    deposits: { count: 0, total: 0 },
    withdrawals: { count: 0, total: 0 },
    tasks: { count: 0, total: 0 },
  });
  const [err, setErr] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const load = async () => {
    setErr("");
    try {
      const [depRes, wdRes, setsRes, sumRes] = await Promise.all([
        memberApi.get("/member/deposits"),
        memberApi.get("/member/withdrawals"),
        memberApi.get("/member/my-sets"),
        memberApi.get("/member/history-summary"),
      ]);

      const deposits = Array.isArray(depRes.data) ? depRes.data : [];
      const withdrawals = Array.isArray(wdRes.data) ? wdRes.data : [];
      const mySets = Array.isArray(setsRes.data) ? setsRes.data : [];
      const sum = sumRes.data || null;

      // ----- map deposits -> UI rows -----
      const depRows = deposits.map((d) => {
        const isCrypto = String(d.method || "").toLowerCase().includes("crypto");

        return {
          id: `dep-${d.id}`,
          type: "deposit",
          method: isCrypto
            ? `Crypto${d.asset ? ` (${d.asset}${d.network ? ` ${d.network}` : ""})` : ""}`
            : titleCase(d.method) || "Deposit",
          amount: safeNum(d.amount),
          status: normalizeStatus(d.status),
          date: d.created_at || d.reviewed_at || null,
          txId: d.tx_ref || `DEP-${d.id}`,
        };
      });

      // ----- map withdrawals -> UI rows -----
      const wdRows = withdrawals.map((w) => ({
        id: `wd-${w.id}`,
        type: "withdrawal",
        method:
          w.method === "crypto"
            ? `Crypto${w.asset ? ` (${w.asset}${w.network ? ` ${w.network}` : ""})` : ""}`
            : titleCase(w.method) || "Withdrawal",
        amount: safeNum(w.amount),
        status: normalizeStatus(w.status),
        date: w.created_at || w.reviewed_at || null,
        txId: w.tx_ref || `WTH-${w.id}`,
      }));

      // ----- map my-sets -> task rows (set completion records) -----
      // Note: member_task_history already drives commissions; for per-set commission here,
      // we use set_amount as a "total earned-like" proxy only if you want.
      // If you want exact commission per set, we can query member_task_history grouped by member_set_id.
      const taskRows = mySets.map((s) => ({
        id: `set-${s.id}`,
        type: "task",
        setName: s.set_name || `Set #${s.set_id}`,
        taskCount: Number(s.current_task_index || 0),
        commission: safeNum(s.earned_commission), // keep your UI field name "commission"
        status: normalizeStatus(s.status === "completed" ? "Completed" : s.status),
        date: s.updated_at || s.created_at || null,
      }));

      // ----- unify + sort by date desc -----
      const all = [...depRows, ...wdRows, ...taskRows].sort((a, b) => {
        const ta = a.date ? new Date(a.date).getTime() : 0;
        const tb = b.date ? new Date(b.date).getTime() : 0;
        return tb - ta;
      });

      // ----- compute totals for top 3 cards -----
      const depTotal = deposits.reduce((acc, d) => acc + safeNum(d.amount), 0);
      const wdTotal = withdrawals.reduce((acc, w) => acc + safeNum(w.amount), 0);

      // For "Tasks Earned" we should use lifetime_commission from history-summary (most correct)
      // If not available, fallback to sum of set_amount from mySets.
      const taskEarned =
        sum && sum.lifetime_commission != null
          ? safeNum(sum.lifetime_commission)
          : mySets.reduce((acc, s) => acc + safeNum(s.earned_commission), 0);

      const taskCount =
        sum && sum.lifetime_tasks != null
          ? Number(sum.lifetime_tasks || 0)
          : mySets.reduce((acc, s) => acc + Number(s.total_tasks || 0), 0);

      setRows(all);
      setSummary(sum);
      setTotals({
        deposits: { count: deposits.length, total: depTotal },
        withdrawals: { count: withdrawals.length, total: wdTotal },
        tasks: { count: taskCount, total: taskEarned },
      });
    } catch (e) {
      setRows([]);
      setSummary(null);
      setTotals({
        deposits: { count: 0, total: 0 },
        withdrawals: { count: 0, total: 0 },
        tasks: { count: 0, total: 0 },
      });
      setErr(e?.response?.data?.message || "Failed to load history");
    }
  };

  // Filter data based on active tab (use REAL rows now)
  const filteredData = useMemo(() => {
    const tab = String(activeTab || "All");
    if (tab === "All") return rows;
    return rows.filter((item) => item.type === tab.toLowerCase());
  }, [rows, activeTab]);

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  // Reset page when tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  useEffect(() => {
    load();
  }, []);

  const fmt = (d) => {
    if (!d) return "-";
    try {
      return new Date(d).toLocaleString();
    } catch {
      return d;
    }
  };

  return (
    <div className="historyPage">
      <div className="historyContent">
        <div className="historyHeader">
          <h2 className="historyTitle">History & Earnings</h2>
          <div className="historySub">Daily · Weekly · Lifetime performance</div>
        </div>

        {err && <div className="historyAlert error">{err}</div>}

        {/* ================= SUMMARY GLASS CARDS ================= */}
        {/* Overall Summary Cards */}
        <div className="historySummary">
          <div className="summaryCard">
            <div className="summaryTitle">💰 Deposits</div>
            <div className="summaryGrid">
              <div>
                <div className="summaryLabel">Count</div>
                <div className="summaryValue">{totals.deposits.count}</div>
              </div>
              <div>
                <div className="summaryLabel">Total Amount</div>
                <div className="summaryValue strong">
                  ${totals.deposits.total.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          <div className="summaryCard">
            <div className="summaryTitle">💸 Withdrawals</div>
            <div className="summaryGrid">
              <div>
                <div className="summaryLabel">Count</div>
                <div className="summaryValue">{totals.withdrawals.count}</div>
              </div>
              <div>
                <div className="summaryLabel">Total Amount</div>
                <div className="summaryValue strong">
                  ${totals.withdrawals.total.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          <div className="summaryCard">
            <div className="summaryTitle">✅ Tasks</div>
            <div className="summaryGrid">
              <div>
                <div className="summaryLabel">Completed</div>
                <div className="summaryValue">{totals.tasks.count}</div>
              </div>
              <div>
                <div className="summaryLabel">Earned</div>
                <div className="summaryValue strong">
                  ${totals.tasks.total.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Summary */}
        {summary && (
          <div className="historySummary">
            {[
              {
                title: "Today",
                sets: summary.today_sets,
                tasks: summary.today_tasks,
                amount: summary.today_commission,
              },
              {
                title: "This Week",
                sets: summary.week_sets,
                tasks: summary.week_tasks,
                amount: summary.week_commission,
              },
              {
                title: "Lifetime",
                sets: summary.lifetime_sets,
                tasks: summary.lifetime_tasks,
                amount: summary.lifetime_commission,
              },
            ].map((s) => (
              <div key={s.title} className="summaryCard">
                <div className="summaryTitle">{s.title}</div>

                <div className="summaryGrid">
                  <div>
                    <div className="summaryLabel">Sets</div>
                    <div className="summaryValue">{s.sets}</div>
                  </div>

                  <div>
                    <div className="summaryLabel">Tasks</div>
                    <div className="summaryValue">{s.tasks}</div>
                  </div>

                  <div>
                    <div className="summaryLabel">Commission</div>
                    <div className="summaryValue strong">
                      ${Number(s.amount || 0).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ================= FILTER TABS ================= */}
        <div className="historyTabs">
          {["All", "Deposit", "Withdrawal", "Task"].map((tab) => (
            <button
              key={tab}
              className={`historyTab ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ================= HISTORY LIST ================= */}
        {!paginatedData.length ? (
          <div className="historyCard">
            <div className="historyEmpty">
              No {activeTab.toLowerCase()} history yet.
            </div>
          </div>
        ) : (
          paginatedData.map((item, i) => (
            <div key={item.id} className="historyCard">
              <div className="historyTop">
                <div className="historyIndex">{startIndex + i + 1}</div>
                <div className={`historyBadge ${item.type}`}>
                  {item.type === "deposit" && "💰 DEPOSIT"}
                  {item.type === "withdrawal" && "💸 WITHDRAWAL"}
                  {item.type === "task" && "✅ TASK"}
                </div>
                <div
                  className={`historyStatus ${String(item.status || "")
                    .toLowerCase()
                    .replace(/\s+/g, "-")}`}
                >
                  {item.status}
                </div>
              </div>

              {/* Deposit/Withdrawal Details */}
              {(item.type === "deposit" || item.type === "withdrawal") && (
                <>
                  <div className="historyName">{item.method}</div>
                  <div className="historyGrid">
                    <div>
                      <div className="historyLabel">Amount</div>
                      <div className="historyValue strong">
                        ${safeNum(item.amount).toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="historyLabel">Transaction ID</div>
                      <div className="historyValue">{item.txId || "-"}</div>
                    </div>
                    <div>
                      <div className="historyLabel">Date</div>
                      <div className="historyValue">{fmt(item.date)}</div>
                    </div>
                  </div>
                </>
              )}

              {/* Task Details */}
              {item.type === "task" && (
                <>
                  {/*<div className="historyName">{item.setName}</div>*/}
                  <div className="historyGrid">
                    <div>
                      <div className="historyLabel">Tasks Completed</div>
                      <div className="historyValue">{item.taskCount}</div>
                    </div>
                    <div>
                      <div className="historyLabel">Commission</div>
                      <div className="historyValue strong">
                        ${safeNum(item.commission).toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="historyLabel">Date</div>
                      <div className="historyValue">{fmt(item.date)}</div>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))
        )}

        {/* ================= PAGINATION ================= */}
        {totalPages > 1 && (
          <div className="historyPagination">
            <button
              className="paginationBtn"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              ← Previous
            </button>

            <div className="paginationInfo">
              Page {currentPage} of {totalPages}
            </div>

            <button
              className="paginationBtn"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next →
            </button>
          </div>
        )}
      </div>

      <MemberBottomNav active="record" />
    </div>
  );
}
