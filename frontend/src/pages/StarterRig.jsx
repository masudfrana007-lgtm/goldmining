import { useMemo, useState } from "react";
import "./StarterRig.css";

function money(n) {
  const num = Number(n || 0);
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(num);
}

function pct(n) {
  return `${Number(n || 0).toFixed(2)}%`;
}

/** ✅ Try to read logged-in user from localStorage (safe fallback) */
function getLoggedInUser() {
  try {
    // Try common keys (you can keep only the one you use)
    const raw =
      localStorage.getItem("gm_user") ||
      localStorage.getItem("user") ||
      localStorage.getItem("auth_user");

    if (!raw) return { name: "User", avatar: "" };

    const parsed = JSON.parse(raw);
    const name = parsed?.name || parsed?.username || parsed?.fullName || "User";
    const avatar = parsed?.avatar || parsed?.photo || parsed?.profilePhoto || "";
    return { name, avatar };
  } catch {
    return { name: "User", avatar: "" };
  }
}

const USER = {
  totalBalance: 12450.35,
  rigInvestment: 600.0,
  rigEarnings: 135.2,
  active: true,
};

const STARTER_RIG = {
  name: "Starter Rig",
  subtitle: "Stable entry-tier mining package with daily accrual.",
  dailyPct: 0.9,
  durationDays: 30,
  min: 100,
  max: 999,
  settlement: "Daily accrual",
  riskNote: "Market conditions apply",
  image: "/gm/rig-starter.png",
};

export default function StarterRig() {
  const [amount, setAmount] = useState(1500);

  /** ✅ Logged in user (dynamic) */
  const me = useMemo(() => getLoggedInUser(), []);

  /** ✅ Avatar fallback initials */
  const initials = useMemo(() => {
    const n = (me?.name || "User").trim();
    const parts = n.split(/\s+/).filter(Boolean);
    const a = parts[0]?.[0] || "U";
    const b = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
    return (a + b).toUpperCase();
  }, [me?.name]);

  const calc = useMemo(() => {
    const a = Number(amount);
    const safeAmount = Number.isFinite(a) ? a : 0;

    const inRange = safeAmount >= STARTER_RIG.min && safeAmount <= STARTER_RIG.max;
    const dailyProfit = safeAmount * (STARTER_RIG.dailyPct / 100);
    const totalProfit = dailyProfit * STARTER_RIG.durationDays;
    const totalReturn = safeAmount + totalProfit;
    const roiPct = safeAmount > 0 ? (totalProfit / safeAmount) * 100 : 0;

    return { inRange, dailyProfit, totalProfit, totalReturn, roiPct };
  }, [amount]);

  const totalReturnPct = useMemo(() => STARTER_RIG.dailyPct * STARTER_RIG.durationDays, []);

  return (
    <div className="srPage">
      <div className="srBg" aria-hidden="true" />

      <div className="srContainer">
        {/* Header */}
        <div className="srHeader">
          <div>
            <div className="srKicker">Mining Package</div>
            <h1 className="srTitle">{STARTER_RIG.name}</h1>
            <p className="srSub">{STARTER_RIG.subtitle}</p>
          </div>

          <div className="srHeaderActions">
            {/* ✅ Welcome back + avatar (NEW) */}
            <div className="welcomeWrap" title={`Logged in as ${me?.name || "User"}`}>
              <div className="welcomeAvatar" aria-hidden="true">
                {me?.avatar ? (
                  <img src={me.avatar} alt="" />
                ) : (
                  <span className="welcomeInitials">{initials}</span>
                )}
              </div>

              <div className="welcomeText">
                <div className="welcomeSmall">Welcome back</div>
                <div className="welcomeName">{me?.name || "User"}</div>
              </div>
            </div>

            {/* Add Balance */}
            <button
              className="addBalanceBtn"
              title="Add Balance"
              onClick={() => alert("Go to Add Balance / Marketplace")}
            >
              <span className="abDot" />
              Add Balance
            </button>

            <button className="iconBtn" title="Deposit" onClick={() => alert("Go to Deposit")}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 3a1 1 0 0 1 1 1v9.59l2.3-2.3a1 1 0 1 1 1.4 1.42l-4.01 4a1 1 0 0 1-1.38 0l-4.01-4a1 1 0 1 1 1.4-1.42L11 13.59V4a1 1 0 0 1 1-1Z" />
                <path d="M5 20a2 2 0 0 1-2-2v-1a1 1 0 1 1 2 0v1h14v-1a1 1 0 1 1 2 0v1a2 2 0 0 1-2 2H5Z" />
              </svg>
              <span>Deposit</span>
            </button>

            <button className="iconBtn" title="Withdraw" onClick={() => alert("Go to Withdraw")}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 21a1 1 0 0 1-1-1v-9.59l-2.3 2.3a1 1 0 0 1-1.4-1.42l4.01-4a1 1 0 0 1 1.38 0l4.01 4a1 1 0 1 1-1.4 1.42L13 10.41V20a1 1 0 0 1-1 1Z" />
                <path d="M5 6a2 2 0 0 1-2-2V3a1 1 0 1 1 2 0v1h14V3a1 1 0 1 1 2 0v1a2 2 0 0 1-2 2H5Z" />
              </svg>
              <span>Withdraw</span>
            </button>

            <div className="srStatusPill">
              <span className={`srDot ${USER.active ? "on" : "off"}`} />
              <span>{USER.active ? "Active" : "Inactive"}</span>
            </div>
          </div>
        </div>

        {/* Top Summary */}
        <section className="srSummary">
          <div className="sumCard">
            <div className="sumLabel">Total Balance</div>
            <div className="sumValue">${money(USER.totalBalance)}</div>
            <div className="sumMeta">Available funds</div>
          </div>

          <div className="sumCard">
            <div className="sumLabel">Starter Rig Investment</div>
            <div className="sumValue">${money(USER.rigInvestment)}</div>
            <div className="sumMeta">Currently allocated</div>
          </div>

          <div className="sumCard">
            <div className="sumLabel">Earnings (Starter Rig)</div>
            <div className="sumValue green">${money(USER.rigEarnings)}</div>
            <div className="sumMeta">Accrued profit</div>
          </div>

          <div className="sumCard">
            <div className="sumLabel">Total Return (Plan)</div>
            <div className="sumValue blue">{pct(totalReturnPct)}</div>
            <div className="sumMeta">{STARTER_RIG.durationDays} days • Simple model</div>
          </div>
        </section>

        {/* Main Grid */}
        <section className="srGrid">
          {/* Overview */}
          <div className="srBlock">
            <div className="blockHead">
              <div>
                <div className="blockTitle">Starter Miner Overview</div>
                <div className="blockHint">Plan terms & allocation info for this rig.</div>
              </div>
              <div className="headRight">
                <span className="smallTag">Daily profit is estimated</span>
              </div>
            </div>

            <div className="overviewBody">
              <div className="rigCard">
                <div className="rigPhoto" style={{ backgroundImage: `url("${STARTER_RIG.image}")` }} />

                <div className="rigInfo">
                  <div className="rigName">{STARTER_RIG.name}</div>
                  <div className="rigDesc">
                    Daily accrual package designed for smaller allocations and steady compounding rules
                    (backend-defined).
                  </div>

                  <div className="kpiRow">
                    <div className="kpiBox">
                      <div className="kpiLabel">Daily Profit</div>
                      <div className="kpiValue green">{pct(STARTER_RIG.dailyPct)}</div>
                    </div>
                    <div className="kpiBox">
                      <div className="kpiLabel">Duration</div>
                      <div className="kpiValue">{STARTER_RIG.durationDays} days</div>
                    </div>
                    <div className="kpiBox">
                      <div className="kpiLabel">Total Return</div>
                      <div className="kpiValue">{pct(totalReturnPct)}</div>
                    </div>
                  </div>

                  <div className="rows">
                    <div className="row">
                      <span className="rowKey">Minimum</span>
                      <span className="rowVal">${money(STARTER_RIG.min)}</span>
                    </div>
                    <div className="row">
                      <span className="rowKey">Maximum</span>
                      <span className="rowVal">${money(STARTER_RIG.max)}</span>
                    </div>
                    <div className="row">
                      <span className="rowKey">Settlement</span>
                      <span className="rowVal">{STARTER_RIG.settlement}</span>
                    </div>
                    <div className="row">
                      <span className="rowKey">Risk Notes</span>
                      <span className="rowVal muted">{STARTER_RIG.riskNote}</span>
                    </div>
                  </div>

                  <div className="ctaRow">
                    <button className="primaryBtn" onClick={() => alert("Subscribe Starter Rig")}>
                      Subscribe
                    </button>
                    <button className="ghostBtn" onClick={() => alert("View Transactions")}>
                      View History
                    </button>
                  </div>

                  <div className="note">
                    <span className="noteDot" />
                    Subscription & settlement rules should come from backend (fees, compounding, early close, etc.).
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ROI Calculator */}
          <aside className="srBlock">
            <div className="blockHead">
              <div>
                <div className="blockTitle">ROI Calculator</div>
                <div className="blockHint">Estimate profit using package rate & duration.</div>
              </div>
            </div>

            <div className="calcBody">
              <label className="field">
                <span className="label">Investment Amount (USD)</span>
                <input
                  className="control"
                  type="number"
                  min="0"
                  step="50"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  placeholder="Enter amount"
                />
                <div className={calc.inRange ? "help ok" : "help warn"}>
                  Range: ${money(STARTER_RIG.min)} – ${money(STARTER_RIG.max)}
                  {!calc.inRange && <span className="helpTag">Out of range</span>}
                </div>
              </label>

              <div className="calcGrid">
                <div className="calcCard">
                  <div className="calcLabel">Est. Daily Profit</div>
                  <div className="calcValue green">${money(calc.dailyProfit)}</div>
                  <div className="calcMeta">({pct(STARTER_RIG.dailyPct)} of principal)</div>
                </div>

                <div className="calcCard">
                  <div className="calcLabel">Est. Total Profit</div>
                  <div className="calcValue">${money(calc.totalProfit)}</div>
                  <div className="calcMeta">{STARTER_RIG.durationDays} days</div>
                </div>

                <div className="calcCard">
                  <div className="calcLabel">Est. Total Return</div>
                  <div className="calcValue blue">${money(calc.totalReturn)}</div>
                  <div className="calcMeta">Principal + profit</div>
                </div>

                <div className="calcCard">
                  <div className="calcLabel">ROI</div>
                  <div className="calcValue">{money(calc.roiPct)}%</div>
                  <div className="calcMeta">Simple return model</div>
                </div>
              </div>

              <div className="calcActions">
                <button
                  className="primaryBtn"
                  disabled={!calc.inRange || amount <= 0}
                  onClick={() => alert(`Proceed Subscribe: $${money(amount)}`)}
                >
                  Proceed
                </button>
                <button className="ghostBtn" onClick={() => setAmount(STARTER_RIG.min)}>
                  Use Minimum
                </button>
              </div>

              <div className="note soft">
                <span className="noteDot blueDot" />
                Estimates are for dashboard preview. Use real backend settlement rules for production.
              </div>
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}
