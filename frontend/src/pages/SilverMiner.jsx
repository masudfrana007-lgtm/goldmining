// src/pages/SilverMiner.jsx
import { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./SilverMiner.css";

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
  rigInvestment: 500.0,
  rigEarnings: 92.4,
  active: true,
};

const SILVER_MINER = {
  name: "Silver Miner",
  subtitle: "Advanced mining package with improved yield and steady daily accrual.",
  dailyPct: 0.75,
  durationDays: 30,
  min: 1001,
  max: 2000, // ✅ FIX: 1001–2000
  durations: [3, 7, 15, 30], // Available duration options in days
  settlement: "Daily accrual",
  riskNote: "Market conditions apply",
  image: "/gm/rig-silver.png",
};

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M15.5 19a1 1 0 0 1-.71-.29l-6.5-6.5a1 1 0 0 1 0-1.42l6.5-6.5a1 1 0 1 1 1.42 1.42L10.41 11.5l5.8 5.79A1 1 0 0 1 15.5 19Z" />
    </svg>
  );
}

/** 🎉 Confetti burst (offset lets us play it twice) */
function ConfettiBurst({ offsetMs = 0 }) {
  const pieces = useMemo(
    () => [
      { x: -120, y: -140, r: 140, d: 2000 },
      { x: 120, y: -150, r: -120, d: 2100 },
      { x: -160, y: -80, r: 220, d: 1950 },
      { x: 160, y: -90, r: -230, d: 2050 },
      { x: -90, y: -170, r: 180, d: 2150 },
      { x: 90, y: -175, r: -180, d: 2200 },
      { x: -200, y: -40, r: 260, d: 1900 },
      { x: 200, y: -35, r: -260, d: 1950 },

      { x: -140, y: -190, r: 200, d: 2300 },
      { x: 140, y: -195, r: -200, d: 2350 },
      { x: -220, y: -120, r: 280, d: 2100 },
      { x: 220, y: -110, r: -280, d: 2150 },

      { x: -70, y: -220, r: 160, d: 2450 },
      { x: 70, y: -225, r: -160, d: 2500 },
      { x: -250, y: -70, r: 300, d: 2100 },
      { x: 250, y: -65, r: -300, d: 2150 },

      { x: -30, y: -240, r: 120, d: 2600 },
      { x: 30, y: -245, r: -120, d: 2650 },
      { x: -180, y: -160, r: 260, d: 2350 },
      { x: 180, y: -155, r: -260, d: 2400 },

      { x: -110, y: -210, r: 210, d: 2500 },
      { x: 110, y: -215, r: -210, d: 2550 },
      { x: -240, y: -10, r: 320, d: 2000 },
      { x: 240, y: -8, r: -320, d: 2050 },
    ],
    []
  );

  return (
    <div className="srConfetti" aria-hidden="true" style={{ "--base": `${offsetMs}ms` }}>
      {pieces.map((p, i) => (
        <span
          key={i}
          className="srConfettiPiece"
          style={{
            "--x": `${p.x}px`,
            "--y": `${p.y}px`,
            "--r": `${p.r}deg`,
            "--d": `${p.d}ms`,
            "--delay": `${(i % 8) * 30}ms`,
          }}
        />
      ))}
      <div className="srBurstRing" />
      <div className="srSparkle" />
    </div>
  );
}

export default function SilverMiner() {
  const nav = useNavigate();

  // ✅ IMPORTANT: keep as STRING so user can clear input fully (no forced 0)
  const [amount, setAmount] = useState(String(SILVER_MINER.min));
  const [roiErr, setRoiErr] = useState("");
  const [selectedDuration, setSelectedDuration] = useState(SILVER_MINER.durations[0]); // ✅ Duration selector

  /** ✅ Subscribe flow states */
  const [subOpen, setSubOpen] = useState(false);
  const [investOpen, setInvestOpen] = useState(false);
  const [loadingOpen, setLoadingOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);

  // ✅ STRING state to allow empty input
  const [investAmount, setInvestAmount] = useState(String(SILVER_MINER.min));
  const [subErr, setSubErr] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(15);

  const timerRef = useRef(null);
  const intervalRef = useRef(null);

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

  const amountNum = useMemo(() => {
    const x = parseFloat(amount);
    return Number.isFinite(x) ? x : 0;
  }, [amount]);

  const calc = useMemo(() => {
    const safeAmount = amount === "" ? 0 : amountNum;

    const inRange =
      amount !== "" &&
      safeAmount >= SILVER_MINER.min &&
      safeAmount <= SILVER_MINER.max;

    const dailyProfit = safeAmount * (SILVER_MINER.dailyPct / 100);
    const totalProfit = dailyProfit * selectedDuration; // ✅ Use selected duration
    const totalReturn = safeAmount + totalProfit;
    const roiPct = safeAmount > 0 ? (totalProfit / safeAmount) * 100 : 0;

    return { inRange, dailyProfit, totalProfit, totalReturn, roiPct };
  }, [amount, amountNum, selectedDuration]); // ✅ Add selectedDuration dependency

  const totalReturnPct = useMemo(
    () => SILVER_MINER.dailyPct * SILVER_MINER.durationDays,
    []
  );

  /** ✅ Package "price" in Step-1 = minimum required to join */
  const packagePrice = SILVER_MINER.min;
  const balance = Number(USER.totalBalance || 0);
  const shortage = Math.max(0, packagePrice - balance);
  const canBuy = balance >= packagePrice;

  function closeAllModals() {
    setSubOpen(false);
    setInvestOpen(false);
    setLoadingOpen(false);
    setSuccessOpen(false);
    setSubErr("");
    setRoiErr("");

    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    timerRef.current = null;
    intervalRef.current = null;

    setSecondsLeft(15);
  }

  function openSubscribeDefault() {
    setSubErr("");
    setInvestAmount(String(SILVER_MINER.min));
    setSubOpen(true);
  }

  /** ✅ Proceed from ROI: SAME FLOW */
  function openSubscribeFromROI() {
    setRoiErr("");
    setSubErr("");

    if (amount === "") {
      setRoiErr("Invalid data. Please enter an amount.");
      return;
    }

    const a = parseFloat(amount);
    if (!Number.isFinite(a) || a <= 0) {
      setRoiErr("Invalid data. Please enter a valid amount.");
      return;
    }

    if (a < SILVER_MINER.min || a > SILVER_MINER.max) {
      setRoiErr(
        `Invalid data. Allowed range is $${money(SILVER_MINER.min)} – $${money(
          SILVER_MINER.max
        )}.`
      );
      return;
    }

    setInvestAmount(String(a)); // ✅ prefill with ROI amount
    setSubOpen(true);
  }

  function goToInvestModal() {
    if (!canBuy) {
      setSubErr("Insufficient balance. Please add balance to continue.");
      return;
    }
    setSubOpen(false);
    setInvestOpen(true);
  }

  function backToConfirm() {
    setSubErr("");
    setInvestOpen(false);
    setSubOpen(true);
  }

  function validateInvest(aStr) {
    if (aStr === "") return "Invalid data. Please enter an amount.";

    const x = parseFloat(aStr);
    if (!Number.isFinite(x) || x <= 0) return "Invalid data. Please enter a valid amount.";
    if (x < SILVER_MINER.min) return `Invalid data. Minimum investment is $${money(SILVER_MINER.min)}.`;
    if (x > SILVER_MINER.max) return `Invalid data. Maximum investment is $${money(SILVER_MINER.max)}.`;
    if (x > balance) return `Your balance is not enough. Shortage: $${money(x - balance)}.`;
    return "";
  }

  function submitInvestment() {
    const err = validateInvest(investAmount);
    if (err) {
      setSubErr(err);
      return;
    }

    setSubErr("");
    setInvestOpen(false);

    // start loading for 15s
    setSecondsLeft(15);
    setLoadingOpen(true);

    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      timerRef.current = null;

      setLoadingOpen(false);
      setSuccessOpen(true);
    }, 15000);
  }

  /** ESC to close */
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") closeAllModals();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Clear ROI error when user changes value */
  useEffect(() => {
    if (roiErr) setRoiErr("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount]);

  const investedNum = useMemo(() => {
    const x = parseFloat(investAmount);
    return Number.isFinite(x) ? x : 0;
  }, [investAmount]);

  return (
    <div className="srPage">
      <div className="srBg" aria-hidden="true" />

      <div className="srContainer">
        {/* Header */}
        <div className="srHeader">
          <div>
            {/* ✅ Back button */}
            <button className="backBtn" type="button" onClick={() => nav(-1)} aria-label="Go back">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M15.5 5.5a1 1 0 0 1 0 1.4L10.4 12l5.1 5.1a1 1 0 1 1-1.4 1.4l-5.8-5.8a1 1 0 0 1 0-1.4l5.8-5.8a1 1 0 0 1 1.4 0Z" />
              </svg>
              <span>Back</span>
            </button>

            <div className="srKicker">Mining Package</div>
            <h1 className="srTitle">{SILVER_MINER.name}</h1>
            <p className="srSub">{SILVER_MINER.subtitle}</p>
          </div>

          <div className="srHeaderActions">
            <div className="welcomeWrap" title={`Logged in as ${me?.name || "User"}`}>
              <div className="welcomeAvatar" aria-hidden="true">
                {me?.avatar ? <img src={me.avatar} alt="" /> : <span className="welcomeInitials">{initials}</span>}
              </div>

              <div className="welcomeText">
                <div className="welcomeSmall">Welcome back</div>
                <div className="welcomeName">{me?.name || "User"}</div>
              </div>
            </div>

            {/* ✅ Only Add Balance */}
            <button className="addBalanceBtn" title="Add Balance" onClick={() => alert("Go to Add Balance")}>
              <span className="abDot" />
              Add Balance
            </button>

            {/* ✅ Status only */}
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
            <div className="sumLabel">Silver Miner Investment</div>
            <div className="sumValue">${money(USER.rigInvestment)}</div>
            <div className="sumMeta">Currently allocated</div>
          </div>

          <div className="sumCard">
            <div className="sumLabel">Earnings (Silver Miner)</div>
            <div className="sumValue green">${money(USER.rigEarnings)}</div>
            <div className="sumMeta">Accrued profit</div>
          </div>

          <div className="sumCard">
            <div className="sumLabel">Total Return (Plan)</div>
            <div className="sumValue blue">{pct(totalReturnPct)}</div>
            <div className="sumMeta">{SILVER_MINER.durationDays} days • Simple model</div>
          </div>
        </section>

        {/* Main Grid */}
        <section className="srGrid">
          {/* Overview */}
          <div className="srBlock">
            <div className="blockHead">
              <div>
                <div className="blockTitle">Silver Miner Overview</div>
                <div className="blockHint">Plan terms & allocation info for this rig.</div>
              </div>
              <div className="headRight">
                <span className="smallTag">Daily profit is estimated</span>
              </div>
            </div>

            <div className="overviewBody">
              <div className="rigCard">
                <div className="rigPhoto" style={{ backgroundImage: `url("${SILVER_MINER.image}")` }} />

                <div className="rigInfo">
                  <div className="rigName">{SILVER_MINER.name}</div>
                  <div className="rigDesc">
                    Improved-yield daily accrual package designed for mid-tier allocations with stable settlement rules
                    (backend-defined).
                  </div>

                  <div className="kpiRow">
                    <div className="kpiBox">
                      <div className="kpiLabel">Daily Profit</div>
                      <div className="kpiValue green">{pct(SILVER_MINER.dailyPct)}</div>
                    </div>
                    <div className="kpiBox">
                      <div className="kpiLabel">Duration</div>
                      <div className="kpiValue">{SILVER_MINER.durationDays} days</div>
                    </div>
                    <div className="kpiBox">
                      <div className="kpiLabel">Total Return</div>
                      <div className="kpiValue">{pct(totalReturnPct)}</div>
                    </div>
                  </div>

                  <div className="rows">
                    <div className="row">
                      <span className="rowKey">Minimum</span>
                      <span className="rowVal">${money(SILVER_MINER.min)}</span>
                    </div>
                    <div className="row">
                      <span className="rowKey">Maximum</span>
                      <span className="rowVal">${money(SILVER_MINER.max)}</span>
                    </div>
                    <div className="row">
                      <span className="rowKey">Settlement</span>
                      <span className="rowVal">{SILVER_MINER.settlement}</span>
                    </div>
                    <div className="row">
                      <span className="rowKey">Risk Notes</span>
                      <span className="rowVal muted">{SILVER_MINER.riskNote}</span>
                    </div>
                  </div>

                  <div className="ctaRow">
                    <button className="primaryBtn" onClick={openSubscribeDefault}>
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
                  inputMode="decimal"
                  min={SILVER_MINER.min}
                  max={SILVER_MINER.max}
                  step="50"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`Suggested: ${SILVER_MINER.min}`}
                />

                <div className={calc.inRange ? "help ok" : "help warn"}>
                  Range: ${money(SILVER_MINER.min)} – ${money(SILVER_MINER.max)}
                  {!calc.inRange && (
                    <span className="helpTag">{amount === "" ? "Required" : "Out of range"}</span>
                  )}
                </div>

                <div className="srRoiTools">
                  <button type="button" className="srSuggestPill" onClick={() => setAmount(String(SILVER_MINER.min))}>
                    Suggested: ${money(SILVER_MINER.min)}
                  </button>

                  {roiErr ? <div className="srRoiError">{roiErr}</div> : null}
                </div>
              </label>
              {/* ✅ Duration Selector */}
              <label className="field">
                <span className="label">Package Duration</span>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                  {SILVER_MINER.durations.map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setSelectedDuration(days)}
                      style={{
                        padding: "0.5rem 1rem",
                        background: selectedDuration === days ? "#c0c0c0" : "#1e293b",
                        border: `1px solid ${selectedDuration === days ? "#c0c0c0" : "#334155"}`,
                        borderRadius: "0.5rem",
                        color: selectedDuration === days ? "#0f172a" : "#f1f5f9",
                        cursor: "pointer",
                        fontSize: "0.875rem",
                        fontWeight: selectedDuration === days ? "600" : "400",
                      }}
                    >
                      {days} {days === 1 ? "day" : "days"}
                    </button>
                  ))}
                </div>
              </label>
              <div className="calcGrid">
                <div className="calcCard">
                  <div className="calcLabel">Est. Daily Profit</div>
                  <div className="calcValue green">${money(calc.dailyProfit)}</div>
                  <div className="calcMeta">({pct(SILVER_MINER.dailyPct)} of principal)</div>
                </div>

                <div className="calcCard">
                  <div className="calcLabel">Est. Total Profit</div>
                  <div className="calcValue">${money(calc.totalProfit)}</div>
                  <div className="smCalcMeta">{selectedDuration} {selectedDuration === 1 ? "day" : "days"}</div>
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
                <button className="primaryBtn" disabled={!calc.inRange} onClick={openSubscribeFromROI}>
                  Proceed
                </button>

                <button className="ghostBtn" onClick={() => setAmount(String(SILVER_MINER.min))}>
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

      {/* ===================== MODALS ===================== */}

      {/* Step 1 */}
      {subOpen && (
        <div className="srModalOverlay" role="dialog" aria-modal="true">
          <div className="srModal">
            <div className="srModalHead">
              <div className="srHeadLeft">
                <button className="srBackIconBtn" onClick={closeAllModals} aria-label="Back">
                  <BackIcon />
                </button>
                <div className="srModalTitle">Confirm Subscription</div>
              </div>

              <button className="srModalX" onClick={closeAllModals} aria-label="Close">
                ×
              </button>
            </div>

            <div className="srModalBody">
              <div className="srModalDesc">
                You are about to buy <b>{SILVER_MINER.name}</b>. Minimum package price is shown below.
              </div>

              <div className="srInfoGrid">
                <div className="srInfoCard">
                  <div className="srInfoLabel">Package Price (Minimum)</div>
                  <div className="srInfoValue">${money(SILVER_MINER.min)}</div>
                </div>
                <div className="srInfoCard">
                  <div className="srInfoLabel">Your Current Balance</div>
                  <div className={`srInfoValue ${canBuy ? "ok" : "warn"}`}>${money(balance)}</div>
                </div>
              </div>

              {!canBuy && (
                <div className="srShortage">
                  <span className="srShortageDot" />
                  Insufficient balance. Shortage: <b>${money(shortage)}</b>
                </div>
              )}

              {!!subErr && <div className="srError">{subErr}</div>}
            </div>

            <div className="srModalActions">
              <button className="ghostBtn" onClick={closeAllModals}>
                Cancel
              </button>
              <button className="primaryBtn" onClick={() => (canBuy ? (setSubOpen(false), setInvestOpen(true)) : null)} disabled={!canBuy}>
                Yes, Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2 */}
      {investOpen && (
        <div className="srModalOverlay" role="dialog" aria-modal="true">
          <div className="srModal">
            <div className="srModalHead">
              <div className="srHeadLeft">
                <button className="srBackIconBtn" onClick={backToConfirm} aria-label="Back">
                  <BackIcon />
                </button>
                <div className="srModalTitle">Enter Investment Amount</div>
              </div>

              <button className="srModalX" onClick={closeAllModals} aria-label="Close">
                ×
              </button>
            </div>

            <div className="srModalBody">
              <div className="srModalDesc">
                Choose how much you want to invest in <b>{SILVER_MINER.name}</b>.
              </div>

              <div className="srInfoGrid">
                <div className="srInfoCard">
                  <div className="srInfoLabel">Allowed Range</div>
                  <div className="srInfoValue">
                    ${money(SILVER_MINER.min)} – ${money(SILVER_MINER.max)}
                  </div>
                </div>
                <div className="srInfoCard">
                  <div className="srInfoLabel">Your Balance</div>
                  <div className="srInfoValue ok">${money(balance)}</div>
                </div>
              </div>

              <label className="srField">
                <div className="srFieldLabel">Investment Amount (USD)</div>
                <input
                  className="srFieldControl"
                  type="number"
                  inputMode="decimal"
                  min={SILVER_MINER.min}
                  max={SILVER_MINER.max}
                  step="50"
                  value={investAmount}
                  onChange={(e) => setInvestAmount(e.target.value)}
                  placeholder={`Min ${SILVER_MINER.min}`}
                />
                <div className="srFieldHint">Must be within range and not exceed your balance.</div>
              </label>

              {!!subErr && <div className="srError">{subErr}</div>}
            </div>

            <div className="srModalActions">
              <button className="ghostBtn" onClick={backToConfirm}>
                Back
              </button>
              <button className="primaryBtn" onClick={submitInvestment}>
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3 */}
      {loadingOpen && (
        <div className="srModalOverlay" role="dialog" aria-modal="true">
          <div className="srModal srModalSm">
            <div className="srModalHead">
              <div className="srHeadLeft">
                <button className="srBackIconBtn" onClick={closeAllModals} aria-label="Back">
                  <BackIcon />
                </button>
                <div className="srModalTitle">Processing</div>
              </div>

              <button className="srModalX" onClick={closeAllModals} aria-label="Close">
                ×
              </button>
            </div>

            <div className="srModalBody">
              <div className="srLoaderWrap">
                <div className="srSpinner" aria-hidden="true" />
                <div className="srLoaderText">
                  Confirming your subscription…
                  <div className="srLoaderSmall">Please wait {secondsLeft}s</div>
                </div>
              </div>

              <div className="srProgress">
                <div className="srProgressBar" style={{ width: `${((15 - secondsLeft) / 15) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Success + Celebration (NO auto-close, 2 bursts, ~6s total) */}
      {successOpen && (
        <div className="srModalOverlay" role="dialog" aria-modal="true">
          <div className="srModal srModalSm">
            {/* Burst 1 (0ms) */}
            <ConfettiBurst offsetMs={0} />
            {/* Burst 2 (3000ms) */}
            <ConfettiBurst offsetMs={3000} />

            <div className="srModalHead">
              <div className="srHeadLeft">
                <button className="srBackIconBtn" onClick={closeAllModals} aria-label="Back">
                  <BackIcon />
                </button>
                <div className="srModalTitle">Successful</div>
              </div>

              <button className="srModalX" onClick={closeAllModals} aria-label="Close">
                ×
              </button>
            </div>

            <div className="srModalBody">
              <div className="srCongrats">
                <div className="srCongratsTitle">🎉 Congratulations!</div>
                <div className="srCongratsMsg">
                  You have successfully activated the <b>{SILVER_MINER.name}</b> package.
                  <div className="srCongratsSub">
                    Invested: <b>${money(investedNum)}</b> • Enjoy daily rewards and track your earnings anytime.
                  </div>
                </div>
              </div>

              <div className="srSuccess">
                <div className="srTick" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>

                <div className="srSuccessText">
                  Subscription completed successfully!
                  <div className="srSuccessSmall">
                    Invested: <b>${money(investedNum)}</b> • Package: <b>{SILVER_MINER.name}</b>
                  </div>
                </div>
              </div>
            </div>

            <div className="srModalActions">
              <button className="primaryBtn" onClick={closeAllModals}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}