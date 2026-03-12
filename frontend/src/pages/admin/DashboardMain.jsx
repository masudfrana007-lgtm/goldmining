// src/pages/DashboardMain.jsx
import "./DashboardMain.css";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
// import { getUser, logout } from "../auth";
// import api from "../services/api";
// import AppLayout from "../components/AppLayout";

function money(n) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(n || 0));
}

function fmtDate(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  // simple readable format
  return d.toLocaleString("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Build a smooth-ish SVG path from points */
function pathFromPoints(points, w = 560, h = 240, pad = 18) {
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const sx = (x) => pad + ((x - minX) / (maxX - minX || 1)) * (w - pad * 2);
  const sy = (y) => h - pad - ((y - minY) / (maxY - minY || 1)) * (h - pad * 2);

  const pts = points.map(([x, y]) => [sx(x), sy(y)]);
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const [x, y] = pts[i];
    d += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return d;
}

const DASHBOARD_RESET = {
  deposits: {
    approved_amount: 473856,
    pending_amount: 1271,
    total: 489,
    today_approved: 0,
    today_pending: 0,
    today_total: 0,
    month_approved: 31465,
    month_pending: 181,
    month_total: 400,
  },
  withdrawals: {
    approved_amount: 59642,
    pending_amount: 28995,
    total: 179,
    today_approved: 0,
    today_pending: 0,
    today_total: 0,
    month_approved: 29768,
    month_pending: 27450,
    month_total: 154,
  },
};

function num(v) {
  return Number(v || 0);
}

function minusBase(current, base) {
  return Math.max(num(current) - num(base), 0);
}

export default function DashboardMain() {
  const nav = useNavigate();
  const user = getUser();
  const role = user?.role;

  const doLogout = () => {
    logout();
    nav("/login", { replace: true });
  };

  const [sum, setSum] = useState(null);
  const [recent, setRecent] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    (async () => {
      setErr("");
      setLoading(true);
      try {
        const [s, r] = await Promise.all([
          api.get("/users/dashboard/summary"),
          api.get("/users/dashboard/recent?limit=10"),
        ]);

        if (!alive) return;
        setSum(s.data || null);
        setRecent(Array.isArray(r.data) ? r.data : []);
      } catch (e) {
        if (!alive) return;
        setErr(e?.response?.data?.message || "Failed to load dashboard data");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const adjusted = useMemo(() => {
    const deposits = sum?.deposits || {};
    const withdrawals = sum?.withdrawals || {};

    return {
      deposits: {
        approved_amount: minusBase(deposits.approved_amount, DASHBOARD_RESET.deposits.approved_amount),
        pending_amount: minusBase(deposits.pending_amount, DASHBOARD_RESET.deposits.pending_amount),
        total: minusBase(deposits.total, DASHBOARD_RESET.deposits.total),

        today_approved: minusBase(deposits.today_approved, DASHBOARD_RESET.deposits.today_approved),
        today_pending: minusBase(deposits.today_pending, DASHBOARD_RESET.deposits.today_pending),
        today_total: minusBase(deposits.today_total, DASHBOARD_RESET.deposits.today_total),

        month_approved: minusBase(deposits.month_approved, DASHBOARD_RESET.deposits.month_approved),
        month_pending: minusBase(deposits.month_pending, DASHBOARD_RESET.deposits.month_pending),
        month_total: minusBase(deposits.month_total, DASHBOARD_RESET.deposits.month_total),
      },

      withdrawals: {
        approved_amount: minusBase(withdrawals.approved_amount, DASHBOARD_RESET.withdrawals.approved_amount),
        pending_amount: minusBase(withdrawals.pending_amount, DASHBOARD_RESET.withdrawals.pending_amount),
        total: minusBase(withdrawals.total, DASHBOARD_RESET.withdrawals.total),

        today_approved: minusBase(withdrawals.today_approved, DASHBOARD_RESET.withdrawals.today_approved),
        today_pending: minusBase(withdrawals.today_pending, DASHBOARD_RESET.withdrawals.today_pending),
        today_total: minusBase(withdrawals.today_total, DASHBOARD_RESET.withdrawals.today_total),

        month_approved: minusBase(withdrawals.month_approved, DASHBOARD_RESET.withdrawals.month_approved),
        month_pending: minusBase(withdrawals.month_pending, DASHBOARD_RESET.withdrawals.month_pending),
        month_total: minusBase(withdrawals.month_total, DASHBOARD_RESET.withdrawals.month_total),
      },

      users: sum?.users || {},
      sets: sum?.sets || {},
      tasks: sum?.tasks || {},
      members: sum?.members || {},
      support: sum?.support || {},
    };
  }, [sum]);

  // ✅ real stats for cards
const stats = useMemo(() => {
  const deposits = adjusted?.deposits || {};
  const withdrawals = adjusted?.withdrawals || {};
  const users = adjusted?.users || {};
  const sets = adjusted?.sets || {};
  const tasks = adjusted?.tasks || {};
  const members = adjusted?.members || {};
  const support = adjusted?.support || {};

  return [
    // -----------------------
    // LIFETIME
    // -----------------------
    {
      title: "Deposit",
      sub: "Lifetime approved",
      icon: "⬇️",
      theme: "green",
      rows: [
        ["Approved amount", Number(deposits.approved_amount || 0)],
        ["Pending amount", Number(deposits.pending_amount || 0)],
        ["Total deposits", Number(deposits.total || 0)],
      ],
      moneyMask: [true, true, false],
    },
    {
      title: "Withdraw",
      sub: "Lifetime approved",
      icon: "⬆️",
      theme: "red",
      rows: [
        ["Approved amount", Number(withdrawals.approved_amount || 0)],
        ["Pending amount", Number(withdrawals.pending_amount || 0)],
        ["Total withdrawals", Number(withdrawals.total || 0)],
      ],
      moneyMask: [true, true, false],
    },

    // -----------------------
    // TODAY
    // -----------------------
    {
      title: "Deposit Today",
      sub: "Approved today",
      icon: "📅",
      theme: "green",
      rows: [
        ["Approved amount", Number(deposits.today_approved || 0)],
        ["Pending amount", Number(deposits.today_pending || 0)],
        ["Total deposits", Number(deposits.today_total || 0)],
      ],
      moneyMask: [true, true, false],
    },
    {
      title: "Withdraw Today",
      sub: "Approved today",
      icon: "📅",
      theme: "red",
      rows: [
        ["Approved amount", Number(withdrawals.today_approved || 0)],
        ["Pending amount", Number(withdrawals.today_pending || 0)],
        ["Total withdrawals", Number(withdrawals.today_total || 0)],
      ],
      moneyMask: [true, true, false],
    },

    // -----------------------
    // THIS MONTH
    // -----------------------
    {
      title: "Deposit Month",
      sub: "Approved this month",
      icon: "🗓️",
      theme: "green",
      rows: [
        ["Approved amount", Number(deposits.month_approved || 0)],
        ["Pending amount", Number(deposits.month_pending || 0)],
        ["Total deposits", Number(deposits.month_total || 0)],
      ],
      moneyMask: [true, true, false],
    },
    {
      title: "Withdraw Month",
      sub: "Approved this month",
      icon: "🗓️",
      theme: "red",
      rows: [
        ["Approved amount", Number(withdrawals.month_approved || 0)],
        ["Pending amount", Number(withdrawals.month_pending || 0)],
        ["Total withdrawals", Number(withdrawals.month_total || 0)],
      ],
      moneyMask: [true, true, false],
    },

    // -----------------------
    // Platform & Tasks
    // -----------------------
    {
      title: "Platform",
      sub: "Core totals",
      icon: "🧩",
      theme: "purple",
      rows: [
        ["Users", Number(users.total || 0)],
        ["Members", Number(members.total || 0)],
        ["Support open", Number(support.open || 0)],
      ],
      moneyMask: [false, false, false],
    },
    {
      title: "Tasks & Sets",
      sub: "Packages totals",
      icon: "📦",
      theme: "green",
      rows: [
        ["Tasks", Number(tasks.total || 0)],
        ["Sets", Number(sets.total || 0)],
        ["Combo sets", Number(sets.combo_sets || 0)],
      ],
      moneyMask: [false, false, false],
    },
  ];
}, [adjusted]);

  // keep your chart shape (placeholder), but show real numbers in tooltip
  const revenue = [
    [1, 40],
    [2, 55],
    [3, 38],
    [4, 46],
    [5, 62],
    [6, 50],
    [7, 70],
    [8, 58],
    [9, 76],
  ];
  const withdrawSeries = [
    [1, 22],
    [2, 28],
    [3, 18],
    [4, 24],
    [5, 35],
    [6, 30],
    [7, 42],
    [8, 34],
    [9, 48],
  ];
  const revPath = pathFromPoints(revenue);
  const wdrPath = pathFromPoints(withdrawSeries);

  const hintRevenue = Number(adjusted?.deposits?.approved_amount || 0);
  const hintWithdraw = Number(adjusted?.withdrawals?.approved_amount || 0);

  // pie from adjusted values
  const dep = Number(adjusted?.deposits?.approved_amount || 0);
  const wdr = Number(adjusted?.withdrawals?.approved_amount || 0);
  const total = dep + wdr || 1;
  const depPct = dep / total;
  const wdrPct = wdr / total;

  const C = 2.764 * 44;
  const depDash = `${C * depPct} ${C}`;
  const wdrDash = `${C * wdrPct} ${C}`;
  const wdrOffset = -(C * depPct);

  return (
    <AppLayout>
      <div className="db">
        <div className="dbGrid">
          {err && (
            <div className="msg err" style={{ gridColumn: "1 / -1" }}>
              {err}
            </div>
          )}

          {/* Stat cards */}
          <section className="dbCards">
            {stats.map((card) => (
              <article className={`sCard s-${card.theme}`} key={card.title}>
                <div className="sHead">
                  <div className={`sIcon sIcon-${card.theme}`} aria-hidden="true">
                    {card.icon}
                  </div>
                  <div className="sMeta">
                    <div className="sTitle">{card.title}</div>
                    <div className="sSub">
                      {loading ? "Loading…" : card.sub} {role ? `• ${role}` : ""}
                    </div>
                  </div>

                  <div className="sSpark" aria-hidden="true">
                    <svg viewBox="0 0 84 40">
                      <path
                        d="M2 30 C12 18, 22 34, 34 20 C44 8, 56 26, 66 14 C74 4, 80 12, 82 6"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                      <path
                        d="M2 30 C12 18, 22 34, 34 20 C44 8, 56 26, 66 14 C74 4, 80 12, 82 6 L82 38 L2 38 Z"
                        fill="currentColor"
                        opacity=".10"
                      />
                    </svg>
                  </div>
                </div>

                <div className="sRows">
                  {card.rows.map(([label, value], idx) => (
                    <div className="sRow" key={label}>
                      <span className="sLabel">{label}</span>
                      <span className="sValue">
                        {loading ? "…" : card.moneyMask?.[idx] ? money(value) : value}
                      </span>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </section>

          {/* Middle: chart + transactions */}
          <section className="dbMid">
            <article className="panel panelChart">
              <div className="pHead">
                <div>
                  <div className="pTitle">Revenue & Withdraw Overview</div>
                  <div className="pSub">Snapshot (approved amounts)</div>
                </div>

                <div className="tabs" role="tablist" aria-label="Range">
                  <button className="tab isActive" type="button">
                    Overview
                  </button>
                  <button className="tab" type="button" onClick={doLogout}>
                    Logout
                  </button>
                </div>
              </div>

              <div className="chartWrap">
                <div className="chartLegend">
                  <span className="lgItem">
                    <i className="dot dotBlue" /> Revenue
                  </span>
                  <span className="lgItem">
                    <i className="dot dotRed" /> Withdraw
                  </span>
                </div>

                <svg className="chart" viewBox="0 0 640 280" role="img" aria-label="Line chart">
                  <g className="grid">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <line key={i} x1="40" x2="620" y1={40 + i * 50} y2={40 + i * 50} />
                    ))}
                  </g>

                  <path className="lineBlue" d={revPath} />
                  <path className="lineRed" d={wdrPath} />

                  <g className="hint">
                    <rect x="230" y="92" rx="12" ry="12" width="240" height="86" />
                    <text x="245" y="122" className="hintT">
                      Revenue (Approved Deposits)
                    </text>
                    <text x="245" y="145" className="hintV">
                      {loading ? "…" : money(hintRevenue)}
                    </text>

                    <text x="410" y="122" className="hintT">
                      Withdraw (Approved)
                    </text>
                    <text x="410" y="145" className="hintV">
                      {loading ? "…" : money(hintWithdraw)}
                    </text>
                  </g>

                  <g className="xlab">
                    <text x="70" y="268">P1</text>
                    <text x="185" y="268">P2</text>
                    <text x="300" y="268">P3</text>
                    <text x="410" y="268">P4</text>
                    <text x="520" y="268">P5</text>
                  </g>
                </svg>
              </div>
            </article>

            <article className="panel panelTx">
              <div className="pHead">
                <div className="pTitle">Recent Transactions</div>
              </div>

              <div className="txTable">
                <div className="txHead">
                  <span>ID</span>
                  <span>Date</span>
                  <span className="txRight">Amount</span>
                </div>

                <div className="txBody">
                  {(loading ? Array.from({ length: 8 }).map((_, i) => ({ id: `…${i}` })) : recent).map(
                    (t, idx) => (
                      <div className="txRow" key={t.id ?? idx}>
                        <span className="txId">
                          {loading
                            ? "…"
                            : `${String(t.type || "").toUpperCase()}-${t.id} (${t.member_short_id || "-"})`}
                        </span>
                        <span className="txDate">{loading ? "…" : fmtDate(t.created_at)}</span>
                        <span className="txAmt txRight">
                          {loading
                            ? "…"
                            : `${t.direction === "debit" ? "-" : "+"}${money(t.amount)}`}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </article>
          </section>

          {/* Bottom: pie */}
          <section className="dbBottom">
            <article className="panel panelPie">
              <div className="pHead">
                <div className="pTitle">Deposits & Withdraws Overview</div>
              </div>

              <div className="pieRow">
                <div className="pieLegend">
                  <div className="leg">
                    <i className="dot dotGreen" /> Deposits
                    <span className="legVal">{loading ? "…" : money(dep)}</span>
                  </div>
                  <div className="leg">
                    <i className="dot dotRed" /> Withdraw
                    <span className="legVal">{loading ? "…" : money(wdr)}</span>
                  </div>
                </div>

                <div className="pieWrap" aria-label="Pie chart" role="img">
                  <svg viewBox="0 0 120 120" className="pie">
                    <circle className="pieBase" cx="60" cy="60" r="44" />
                    <circle className="pieGreen" cx="60" cy="60" r="44" strokeDasharray={depDash} />
                    <circle
                      className="pieRed"
                      cx="60"
                      cy="60"
                      r="44"
                      strokeDasharray={wdrDash}
                      strokeDashoffset={String(wdrOffset)}
                    />
                    <circle className="pieHole" cx="60" cy="60" r="28" />

                    <text x="38" y="52" className="pieTxtRed">
                      {loading ? "…" : `${Math.round(wdrPct * 100)}%`}
                    </text>
                    <text x="66" y="76" className="pieTxtGreen">
                      {loading ? "…" : `${Math.round(depPct * 100)}%`}
                    </text>
                  </svg>
                </div>
              </div>
            </article>
          </section>
        </div>
      </div>
    </AppLayout>
  );
}
