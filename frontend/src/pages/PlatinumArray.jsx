// src/pages/PlatinumArray.jsx
import { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./PlatinumArray.css";

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
  rigInvestment: 1000.0,
  rigEarnings: 215.75,
  active: true,
};

const PLATINUM_ARRAY = {
  name: "Platinum Array",
  subtitle: "Elite mining array package with higher daily yield and premium-grade stability.",
  dailyPct: 1.5,
  durationDays: 30,

  // ✅ FIXED RANGE: 10001-20000
  min: 10001,
  max: 20000,
  durations: [7, 15, 30], // Available duration options in days

  settlement: "Daily accrual",
  riskNote: "Market conditions apply",
  image: "/gm/rig-platinum.png",
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
    <div className="paConfetti" aria-hidden="true" style={{ "--base": `${offsetMs}ms` }}>
      {pieces.map((p, i) => (
        <span
          key={i}
          className="paConfettiPiece"
          style={{
            "--x": `${p.x}px`,
            "--y": `${p.y}px`,
            "--r": `${p.r}deg`,
            "--d": `${p.d}ms`,
            "--delay": `${(i % 8) * 30}ms`,
          }}
        />
      ))}
      <div className="paBurstRing" />
      <div className="paSparkle" />
    </div>
  );
}

export default function PlatinumArray() {
  const nav = useNavigate();

  // ✅ keep string (allows empty input)
  const [amount, setAmount] = useState(String(PLATINUM_ARRAY.min));
  const [roiErr, setRoiErr] = useState("");
  const [selectedDuration, setSelectedDuration] = useState(PLATINUM_ARRAY.durations[0]); // ✅ Duration selector

  /** ✅ Subscribe flow states */
  const [subOpen, setSubOpen] = useState(false);
  const [investOpen, setInvestOpen] = useState(false);
  const [loadingOpen, setLoadingOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);

  // ✅ keep string
  const [investAmount, setInvestAmount] = useState(String(PLATINUM_ARRAY.min));
  const [subErr, setSubErr] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(15);

  const timerRef = useRef(null);
  const intervalRef = useRef(null);

  const me = useMemo(() => getLoggedInUser(), []);

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
      amount !== "" && safeAmount >= PLATINUM_ARRAY.min && safeAmount <= PLATINUM_ARRAY.max;

    const dailyProfit = safeAmount * (PLATINUM_ARRAY.dailyPct / 100);
    const totalProfit = dailyProfit * selectedDuration; // ✅ Use selected duration
    const totalReturn = safeAmount + totalProfit;
    const roiPct = safeAmount > 0 ? (totalProfit / safeAmount) * 100 : 0;

    return { inRange, dailyProfit, totalProfit, totalReturn, roiPct };
  }, [amount, amountNum, selectedDuration]); // ✅ Add selectedDuration dependency

  const totalReturnPct = useMemo(() => PLATINUM_ARRAY.dailyPct * PLATINUM_ARRAY.durationDays, []);

  /** Step-1 uses minimum price */
  const packagePrice = PLATINUM_ARRAY.min;
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
    setInvestAmount(String(PLATINUM_ARRAY.min));
    setSubOpen(true);
  }

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

    if (a < PLATINUM_ARRAY.min || a > PLATINUM_ARRAY.max) {
      setRoiErr(
        `Invalid data. Allowed range is $${money(PLATINUM_ARRAY.min)} – $${money(PLATINUM_ARRAY.max)}.`
      );
      return;
    }

    setInvestAmount(String(a));
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
    if (x < PLATINUM_ARRAY.min) return `Invalid data. Minimum investment is $${money(PLATINUM_ARRAY.min)}.`;
    if (x > PLATINUM_ARRAY.max) return `Invalid data. Maximum investment is $${money(PLATINUM_ARRAY.max)}.`;
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

    // 15s loading
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

  /** ESC closes */
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") closeAllModals();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Clear ROI error when typing */
  useEffect(() => {
    if (roiErr) setRoiErr("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount]);

  const investedNum = useMemo(() => {
    const x = parseFloat(investAmount);
    return Number.isFinite(x) ? x : 0;
  }, [investAmount]);

  return (
    <div className="paPage">
      <div className="paBg" aria-hidden="true" />

      <div className="paContainer">
        {/* Header */}
        <div className="paHeader">
          <div>
            <button className="backBtn" type="button" onClick={() => nav(-1)} aria-label="Go back">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M15.5 5.5a1 1 0 0 1 0 1.4L10.4 12l5.1 5.1a1 1 0 1 1-1.4 1.4l-5.8-5.8a1 1 0 0 1 0-1.4l5.8-5.8a1 1 0 0 1 1.4 0Z" />
              </svg>
              <span>Back</span>
            </button>

            <div className="paKicker">Mining Package</div>
            <h1 className="paTitle">{PLATINUM_ARRAY.name}</h1>
            <p className="paSub">{PLATINUM_ARRAY.subtitle}</p>
          </div>

          <div className="paHeaderActions">
            <div className="welcomeWrap" title={`Logged in as ${me?.name || "User"}`}>
              <div className="welcomeAvatar" aria-hidden="true">
                {me?.avatar ? <img src={me.avatar} alt="" /> : <span className="welcomeInitials">{initials}</span>}
              </div>

              <div className="welcomeText">
                <div className="welcomeSmall">Welcome back</div>
                <div className="welcomeName">{me?.name || "User"}</div>
              </div>
            </div>

            <button className="addBalanceBtn" title="Add Balance" onClick={() => alert("Go to Add Balance")}>
              <span className="abDot" />
              Add Balance
            </button>

            <div className="paStatusPill">
              <span className={`paDot ${USER.active ? "on" : "off"}`} />
              <span>{USER.active ? "Active" : "Inactive"}</span>
            </div>
          </div>
        </div>

        {/* Top Summary */}
        <section className="paSummary">
          <div className="sumCard">
            <div className="sumLabel">Total Balance</div>
            <div className="sumValue">${money(USER.totalBalance)}</div>
            <div className="sumMeta">Available funds</div>
          </div>

          <div className="sumCard">
            <div className="sumLabel">Platinum Array Investment</div>
            <div className="sumValue">${money(USER.rigInvestment)}</div>
            <div className="sumMeta">Currently allocated</div>
          </div>

          <div className="sumCard">
            <div className="sumLabel">Earnings (Platinum)</div>
            <div className="sumValue mint">${money(USER.rigEarnings)}</div>
            <div className="sumMeta">Accrued profit</div>
          </div>

          <div className="sumCard">
            <div className="sumLabel">Total Return (Plan)</div>
            <div className="sumValue platinum">{pct(totalReturnPct)}</div>
            <div className="sumMeta">{PLATINUM_ARRAY.durationDays} days • Simple model</div>
          </div>
        </section>

        {/* Main Grid */}
        <section className="paGrid">
          {/* Overview */}
          <div className="paBlock">
            <div className="blockHead">
              <div>
                <div className="blockTitle">Platinum Array Overview</div>
                <div className="blockHint">Elite plan terms & allocation info for this array.</div>
              </div>
              <div className="headRight">
                <span className="smallTag">Daily profit is estimated</span>
              </div>
            </div>

            <div className="overviewBody">
              <div className="rigCard">
                <div className="rigPhoto" style={{ backgroundImage: `url("${PLATINUM_ARRAY.image}")` }} />

                <div className="rigInfo">
                  <div className="rigName">{PLATINUM_ARRAY.name}</div>
                  <div className="rigDesc">
                    A glossy, premium-grade mining array designed for higher daily yield with stable daily settlement rules
                    (backend-defined).
                  </div>

                  <div className="kpiRow">
                    <div className="kpiBox">
                      <div className="kpiLabel">Daily Profit</div>
                      <div className="kpiValue platinum">{pct(PLATINUM_ARRAY.dailyPct)}</div>
                    </div>
                    <div className="kpiBox">
                      <div className="kpiLabel">Duration</div>
                      <div className="kpiValue">{PLATINUM_ARRAY.durationDays} days</div>
                    </div>
                    <div className="kpiBox">
                      <div className="kpiLabel">Total Return</div>
                      <div className="kpiValue platinum">{pct(totalReturnPct)}</div>
                    </div>
                  </div>

                  <div className="rows">
                    <div className="row">
                      <span className="rowKey">Minimum</span>
                      <span className="rowVal">${money(PLATINUM_ARRAY.min)}</span>
                    </div>
                    <div className="row">
                      <span className="rowKey">Maximum</span>
                      <span className="rowVal">${money(PLATINUM_ARRAY.max)}</span>
                    </div>
                    <div className="row">
                      <span className="rowKey">Settlement</span>
                      <span className="rowVal">{PLATINUM_ARRAY.settlement}</span>
                    </div>
                    <div className="row">
                      <span className="rowKey">Risk Notes</span>
                      <span className="rowVal muted">{PLATINUM_ARRAY.riskNote}</span>
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
          <aside className="paBlock">
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
                  min={PLATINUM_ARRAY.min}
                  max={PLATINUM_ARRAY.max}
                  step="50"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`Suggested: ${PLATINUM_ARRAY.min}`}
                />

                <div className={calc.inRange ? "help ok" : "help warn"}>
                  Range: ${money(PLATINUM_ARRAY.min)} – ${money(PLATINUM_ARRAY.max)}
                  {!calc.inRange && (
                    <span className="helpTag">{amount === "" ? "Required" : "Out of range"}</span>
                  )}
                </div>

                <div className="paRoiTools">
                  <button
                    type="button"
                    className="paSuggestPill"
                    onClick={() => setAmount(String(PLATINUM_ARRAY.min))}
                  >
                    Suggested: ${money(PLATINUM_ARRAY.min)}
                  </button>

                  {roiErr ? <div className="paRoiError">{roiErr}</div> : null}
                </div>
              </label>

              {/* ✅ Duration Selector */}
              <label className="field">
                <span className="label">Package Duration</span>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                  {PLATINUM_ARRAY.durations.map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setSelectedDuration(days)}
                      style={{
                        padding: "0.5rem 1rem",
                        background: selectedDuration === days ? "#e5e4e2" : "#1e293b",
                        border: `1px solid ${selectedDuration === days ? "#e5e4e2" : "#334155"}`,
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
                  <div className="calcValue platinum">${money(calc.dailyProfit)}</div>
                  <div className="calcMeta">({pct(PLATINUM_ARRAY.dailyPct)} of principal)</div>
                </div>

                <div className="calcCard">
                  <div className="calcLabel">Est. Total Profit</div>
                  <div className="calcValue">${money(calc.totalProfit)}</div>
                  <div className="paCalcMeta">{selectedDuration} {selectedDuration === 1 ? "day" : "days"}</div>
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
                <button className="ghostBtn" onClick={() => setAmount(String(PLATINUM_ARRAY.min))}>
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
        <div className="paModalOverlay" role="dialog" aria-modal="true">
          <div className="paModal">
            <div className="paModalHead">
              <div className="paHeadLeft">
                <button className="paBackIconBtn" onClick={closeAllModals} aria-label="Back">
                  <BackIcon />
                </button>
                <div className="paModalTitle">Confirm Subscription</div>
              </div>

              <button className="paModalX" onClick={closeAllModals} aria-label="Close">
                ×
              </button>
            </div>

            <div className="paModalBody">
              <div className="paModalDesc">
                You are about to buy <b>{PLATINUM_ARRAY.name}</b>. Minimum package price is shown below.
              </div>

              <div className="paInfoGrid">
                <div className="paInfoCard">
                  <div className="paInfoLabel">Package Price (Minimum)</div>
                  <div className="paInfoValue">${money(PLATINUM_ARRAY.min)}</div>
                </div>
                <div className="paInfoCard">
                  <div className="paInfoLabel">Your Current Balance</div>
                  <div className={`paInfoValue ${canBuy ? "ok" : "warn"}`}>${money(balance)}</div>
                </div>
              </div>

              {!canBuy && (
                <div className="paShortage">
                  <span className="paShortageDot" />
                  Insufficient balance. Shortage: <b>${money(shortage)}</b>
                </div>
              )}

              {!!subErr && <div className="paError">{subErr}</div>}
            </div>

            <div className="paModalActions">
              <button className="ghostBtn" onClick={closeAllModals}>
                Cancel
              </button>
              <button className="primaryBtn" onClick={goToInvestModal} disabled={!canBuy}>
                Yes, Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2 */}
      {investOpen && (
        <div className="paModalOverlay" role="dialog" aria-modal="true">
          <div className="paModal">
            <div className="paModalHead">
              <div className="paHeadLeft">
                <button className="paBackIconBtn" onClick={backToConfirm} aria-label="Back">
                  <BackIcon />
                </button>
                <div className="paModalTitle">Enter Investment Amount</div>
              </div>

              <button className="paModalX" onClick={closeAllModals} aria-label="Close">
                ×
              </button>
            </div>

            <div className="paModalBody">
              <div className="paModalDesc">
                Choose how much you want to invest in <b>{PLATINUM_ARRAY.name}</b>.
              </div>

              <div className="paInfoGrid">
                <div className="paInfoCard">
                  <div className="paInfoLabel">Allowed Range</div>
                  <div className="paInfoValue">
                    ${money(PLATINUM_ARRAY.min)} – ${money(PLATINUM_ARRAY.max)}
                  </div>
                </div>
                <div className="paInfoCard">
                  <div className="paInfoLabel">Your Balance</div>
                  <div className="paInfoValue ok">${money(balance)}</div>
                </div>
              </div>

              <label className="paField">
                <div className="paFieldLabel">Investment Amount (USD)</div>
                <input
                  className="paFieldControl"
                  type="number"
                  inputMode="decimal"
                  min={PLATINUM_ARRAY.min}
                  max={PLATINUM_ARRAY.max}
                  step="50"
                  value={investAmount}
                  onChange={(e) => setInvestAmount(e.target.value)}
                  placeholder={`Min ${PLATINUM_ARRAY.min}`}
                />
                <div className="paFieldHint">Must be within range and not exceed your balance.</div>
              </label>

              {!!subErr && <div className="paError">{subErr}</div>}
            </div>

            <div className="paModalActions">
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
        <div className="paModalOverlay" role="dialog" aria-modal="true">
          <div className="paModal paModalSm">
            <div className="paModalHead">
              <div className="paHeadLeft">
                <button className="paBackIconBtn" onClick={closeAllModals} aria-label="Back">
                  <BackIcon />
                </button>
                <div className="paModalTitle">Processing</div>
              </div>

              <button className="paModalX" onClick={closeAllModals} aria-label="Close">
                ×
              </button>
            </div>

            <div className="paModalBody">
              <div className="paLoaderWrap">
                <div className="paSpinner" aria-hidden="true" />
                <div className="paLoaderText">
                  Confirming your subscription…
                  <div className="paLoaderSmall">Please wait {secondsLeft}s</div>
                </div>
              </div>

              <div className="paProgress">
                <div className="paProgressBar" style={{ width: `${((15 - secondsLeft) / 15) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success (NO auto-close, 2 bursts, ~6s total) */}
      {successOpen && (
        <div className="paModalOverlay" role="dialog" aria-modal="true">
          <div className="paModal paModalSm">
            <ConfettiBurst offsetMs={0} />
            <ConfettiBurst offsetMs={3000} />

            <div className="paModalHead">
              <div className="paHeadLeft">
                <button className="paBackIconBtn" onClick={closeAllModals} aria-label="Back">
                  <BackIcon />
                </button>
                <div className="paModalTitle">Successful</div>
              </div>

              <button className="paModalX" onClick={closeAllModals} aria-label="Close">
                ×
              </button>
            </div>

            <div className="paModalBody">
              <div className="paCongrats">
                <div className="paCongratsTitle">🎉 Congratulations!</div>
                <div className="paCongratsMsg">
                  You have successfully activated the <b>{PLATINUM_ARRAY.name}</b> package.
                  <div className="paCongratsSub">
                    Invested: <b>${money(investedNum)}</b> • Enjoy daily rewards and track your earnings anytime.
                  </div>
                </div>
              </div>

              <div className="paSuccess">
                <div className="paTick" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>

                <div className="paSuccessText">
                  Subscription completed successfully!
                  <div className="paSuccessSmall">
                    Invested: <b>${money(investedNum)}</b> • Package: <b>{PLATINUM_ARRAY.name}</b>
                  </div>
                </div>
              </div>
            </div>

            <div className="paModalActions">
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