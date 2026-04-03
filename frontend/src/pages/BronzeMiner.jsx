// src/pages/BronzeMiner.jsx
import { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./BronzeMiner.css";

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

/** ✅ Demo user values (replace later with API) */
const USER = {
  totalBalance: 12450.35,
  rigInvestment: 300.0,
  rigEarnings: 38.6,
  active: true,
};

const BRONZE = {
  name: "Bronze Miner",
  subtitle:
    "Entry-level mining package with stable daily accrual and bronze-grade performance tuning.",
  dailyPct: 0.5, // ✅ 0.50% daily
  durationDays: 30,

  // ✅ Range: 501 - 1000
  min: 501,
  max: 1000,
  durations: [1, 7, 15, 30], // Available duration options in days

  settlement: "Daily accrual",
  riskNote: "Market conditions apply",
  image: "/gm/rig-bronze.png", // ✅ change if your file name is different
};

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 12a1 1 0 0 1-1 1H7.41l4.3 4.29a1 1 0 1 1-1.42 1.42l-6-6a1 1 0 0 1 0-1.42l6-6a1 1 0 1 1 1.42 1.42L7.41 11H19a1 1 0 0 1 1 1Z" />
    </svg>
  );
}

/** 🎉 Confetti burst */
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
    ],
    []
  );

  return (
    <div className="bmConfetti" aria-hidden="true" style={{ "--base": `${offsetMs}ms` }}>
      {pieces.map((p, i) => (
        <span
          key={i}
          className="bmConfettiPiece"
          style={{
            "--x": `${p.x}px`,
            "--y": `${p.y}px`,
            "--r": `${p.r}deg`,
            "--d": `${p.d}ms`,
            "--delay": `${(i % 8) * 30}ms`,
          }}
        />
      ))}
      <div className="bmBurstRing" />
      <div className="bmSparkle" />
    </div>
  );
}

export default function BronzeMiner() {
  const nav = useNavigate();

  // ✅ string (allows empty input)
  const [amount, setAmount] = useState(String(BRONZE.min));
  const [roiErr, setRoiErr] = useState("");
  const [selectedDuration, setSelectedDuration] = useState(BRONZE.durations[0]); // ✅ Duration selector

  /** ✅ Subscribe flow states */
  const [subOpen, setSubOpen] = useState(false);
  const [investOpen, setInvestOpen] = useState(false);
  const [loadingOpen, setLoadingOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);

  const [investAmount, setInvestAmount] = useState(String(BRONZE.min));
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
      amount !== "" && safeAmount >= BRONZE.min && safeAmount <= BRONZE.max;

    const dailyProfit = safeAmount * (BRONZE.dailyPct / 100);
    const totalProfit = dailyProfit * selectedDuration; // ✅ Use selected duration
    const totalReturn = safeAmount + totalProfit;
    const roiPct = safeAmount > 0 ? (totalProfit / safeAmount) * 100 : 0;

    return { inRange, dailyProfit, totalProfit, totalReturn, roiPct };
  }, [amount, amountNum, selectedDuration]); // ✅ Add selectedDuration dependency

  const totalReturnPct = useMemo(() => BRONZE.dailyPct * BRONZE.durationDays, []);

  /** Step-1 uses minimum package price */
  const packagePrice = BRONZE.min;
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
    setInvestAmount(String(BRONZE.min));
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

    if (a < BRONZE.min || a > BRONZE.max) {
      setRoiErr(`Invalid data. Limit is $${money(BRONZE.min)} - $${money(BRONZE.max)}.`);
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
    if (x < BRONZE.min || x > BRONZE.max)
      return `Invalid data. Limit is $${money(BRONZE.min)} - $${money(BRONZE.max)}.`;
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

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") closeAllModals();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (roiErr) setRoiErr("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount]);

  const investedNum = useMemo(() => {
    const x = parseFloat(investAmount);
    return Number.isFinite(x) ? x : 0;
  }, [investAmount]);

  return (
    <div className="bmPage">
      {/* live background layers */}
      <div className="bmBg" aria-hidden="true" />
      <div className="bmParticles" aria-hidden="true" />
      <div className="bmScanlines" aria-hidden="true" />

      <div className="bmContainer">
        {/* Header */}
        <div className="bmHeader">
          <div>
            <button className="bmBackBtn" type="button" onClick={() => nav(-1)} aria-label="Go back">
              <BackIcon />
              <span>Back</span>
            </button>

            <div className="bmKicker">Mining Package</div>
            <h1 className="bmTitle">{BRONZE.name}</h1>
            <p className="bmSub">{BRONZE.subtitle}</p>
          </div>

          <div className="bmHeaderActions">
            <div className="bmWelcomeWrap" title={`Logged in as ${me?.name || "User"}`}>
              <div className="bmWelcomeAvatar" aria-hidden="true">
                {me?.avatar ? <img src={me.avatar} alt="" /> : <span className="bmWelcomeInitials">{initials}</span>}
              </div>
              <div className="bmWelcomeText">
                <div className="bmWelcomeSmall">Welcome back</div>
                <div className="bmWelcomeName">{me?.name || "User"}</div>
              </div>
            </div>

            <button className="bmAddBalanceBtn" title="Add Balance" onClick={() => alert("Go to Add Balance")}>
              <span className="bmAbDot" />
              Add Balance
            </button>

            <div className="bmStatusPill">
              <span className={`bmDot ${USER.active ? "on" : "off"}`} />
              <span>{USER.active ? "Active" : "Inactive"}</span>
            </div>
          </div>
        </div>

        {/* Top Summary */}
        <section className="bmSummary">
          <div className="bmSumCard">
            <div className="bmSumLabel">Total Balance</div>
            <div className="bmSumValue">${money(USER.totalBalance)}</div>
            <div className="bmSumMeta">Available funds</div>
          </div>

          <div className="bmSumCard">
            <div className="bmSumLabel">Bronze Investment</div>
            <div className="bmSumValue">${money(USER.rigInvestment)}</div>
            <div className="bmSumMeta">Currently allocated</div>
          </div>

          <div className="bmSumCard">
            <div className="bmSumLabel">Earnings (Bronze)</div>
            <div className="bmSumValue bronze">${money(USER.rigEarnings)}</div>
            <div className="bmSumMeta">Accrued profit</div>
          </div>

          <div className="bmSumCard">
            <div className="bmSumLabel">Total Return (Plan)</div>
            <div className="bmSumValue gold">{pct(totalReturnPct)}</div>
            <div className="bmSumMeta">{BRONZE.durationDays} days • Simple model</div>
          </div>
        </section>

        {/* Main Grid */}
        <section className="bmGrid">
          {/* Overview */}
          <div className="bmBlock">
            <div className="bmBlockHead">
              <div>
                <div className="bmBlockTitle">Bronze Miner Overview</div>
                <div className="bmBlockHint">Entry rules & package specs.</div>
              </div>
              <div className="bmHeadRight">
                <span className="bmSmallTag">Daily profit is estimated</span>
              </div>
            </div>

            <div className="bmOverviewBody">
              <div className="bmRigCard">
                <div className="bmRigPhoto" style={{ backgroundImage: `url("${BRONZE.image}")` }}>
                  <div className="bmRigPhotoGlow" aria-hidden="true" />
                </div>

                <div className="bmRigInfo">
                  <div className="bmRigName">{BRONZE.name}</div>
                  <div className="bmRigDesc">
                    Bronze-tier package built for consistent daily accrual with a lightweight entry range.
                  </div>

                  <div className="bmKpiRow">
                    <div className="bmKpiBox">
                      <div className="bmKpiLabel">Daily Rate</div>
                      <div className="bmKpiValue gold">{pct(BRONZE.dailyPct)}</div>
                    </div>
                    <div className="bmKpiBox">
                      <div className="bmKpiLabel">Entry Limit</div>
                      <div className="bmKpiValue">${money(BRONZE.min)} - ${money(BRONZE.max)}</div>
                    </div>
                    <div className="bmKpiBox">
                      <div className="bmKpiLabel">Est / day (min)</div>
                      <div className="bmKpiValue bronze">${money(BRONZE.min * (BRONZE.dailyPct / 100))}</div>
                    </div>
                  </div>

                  <div className="bmRows">
                    <div className="bmRow">
                      <span className="bmRowKey">Minimum</span>
                      <span className="bmRowVal">${money(BRONZE.min)}</span>
                    </div>
                    <div className="bmRow">
                      <span className="bmRowKey">Maximum</span>
                      <span className="bmRowVal">${money(BRONZE.max)}</span>
                    </div>
                    <div className="bmRow">
                      <span className="bmRowKey">Settlement</span>
                      <span className="bmRowVal">{BRONZE.settlement}</span>
                    </div>
                    <div className="bmRow">
                      <span className="bmRowKey">Risk Notes</span>
                      <span className="bmRowVal muted">{BRONZE.riskNote}</span>
                    </div>
                  </div>

                  <div className="bmCtaRow">
                    <button className="bmPrimaryBtn" onClick={openSubscribeDefault}>
                      Subscribe
                    </button>
                    <button className="bmGhostBtn" onClick={() => alert("View Transactions")}>
                      View History
                    </button>
                  </div>

                  <div className="bmNote">
                    <span className="bmNoteDot" />
                    Backend should define fees, compounding, early close, and payout windows.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ROI Calculator */}
          <aside className="bmBlock">
            <div className="bmBlockHead">
              <div>
                <div className="bmBlockTitle">ROI Calculator</div>
                <div className="bmBlockHint">Estimate profit using rate & duration.</div>
              </div>
            </div>

            <div className="bmCalcBody">
              <label className="bmField">
                <span className="bmLabel">Investment Amount (USD)</span>

                <input
                  className="bmControl"
                  type="number"
                  inputMode="decimal"
                  min={BRONZE.min}
                  max={BRONZE.max}
                  step="10"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`Example: ${BRONZE.min}`}
                />

                <div className={calc.inRange ? "bmHelp ok" : "bmHelp warn"}>
                  Limit: ${money(BRONZE.min)} - ${money(BRONZE.max)}
                  {!calc.inRange && (
                    <span className="bmHelpTag">{amount === "" ? "Required" : "Out of range"}</span>
                  )}
                </div>

                <div className="bmRoiTools">
                  <button type="button" className="bmSuggestPill" onClick={() => setAmount(String(BRONZE.min))}>
                    Suggested: ${money(BRONZE.min)}
                  </button>

                  {roiErr ? <div className="bmRoiError">{roiErr}</div> : null}
                </div>
              </label>

              {/* ✅ Duration Selector */}
              <label className="field">
                <span className="label">Package Duration</span>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                  {BRONZE.durations.map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setSelectedDuration(days)}
                      style={{
                        padding: "0.5rem 1rem",
                        background: selectedDuration === days ? "#cd7f32" : "#1e293b",
                        border: `1px solid ${selectedDuration === days ? "#cd7f32" : "#334155"}`,
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

              <div className="bmCalcGrid">
                <div className="bmCalcCard">
                  <div className="bmCalcLabel">Est. Daily Profit</div>
                  <div className="bmCalcValue bronze">${money(calc.dailyProfit)}</div>
                  <div className="bmCalcMeta">({pct(BRONZE.dailyPct)} of principal)</div>
                </div>

                <div className="bmCalcCard">
                  <div className="bmCalcLabel">Est. Total Profit</div>
                  <div className="bmCalcValue">${money(calc.totalProfit)}</div>
                  <div className="bmCalcMeta">{selectedDuration} {selectedDuration === 1 ? "day" : "days"}</div>
                </div>

                <div className="bmCalcCard">
                  <div className="bmCalcLabel">Est. Total Return</div>
                  <div className="bmCalcValue blue">${money(calc.totalReturn)}</div>
                  <div className="bmCalcMeta">Principal + profit</div>
                </div>

                <div className="bmCalcCard">
                  <div className="bmCalcLabel">ROI</div>
                  <div className="bmCalcValue">{money(calc.roiPct)}%</div>
                  <div className="bmCalcMeta">Simple return model</div>
                </div>
              </div>

              <div className="bmCalcActions">
                <button className="bmPrimaryBtn" disabled={!calc.inRange} onClick={openSubscribeFromROI}>
                  Proceed
                </button>
                <button className="bmGhostBtn" onClick={() => setAmount(String(BRONZE.min))}>
                  Use Minimum
                </button>
              </div>

              <div className="bmNote soft">
                <span className="bmNoteDot blueDot" />
                Dashboard preview only. Use backend settlement rules for production.
              </div>
            </div>
          </aside>
        </section>
      </div>

      {/* ===================== MODALS ===================== */}

      {/* Step 1 */}
      {subOpen && (
        <div className="bmModalOverlay" role="dialog" aria-modal="true">
          <div className="bmModal">
            <div className="bmModalHead">
              <div className="bmHeadLeft">
                <button className="bmBackIconBtn" onClick={closeAllModals} aria-label="Back">
                  <BackIcon />
                </button>
                <div className="bmModalTitle">Confirm Subscription</div>
              </div>

              <button className="bmModalX" onClick={closeAllModals} aria-label="Close">
                ×
              </button>
            </div>

            <div className="bmModalBody">
              <div className="bmModalDesc">
                You are about to buy <b>{BRONZE.name}</b>. Minimum package price is shown below.
              </div>

              <div className="bmInfoGrid">
                <div className="bmInfoCard">
                  <div className="bmInfoLabel">Package Price (Minimum)</div>
                  <div className="bmInfoValue">${money(BRONZE.min)}</div>
                </div>
                <div className="bmInfoCard">
                  <div className="bmInfoLabel">Your Current Balance</div>
                  <div className={`bmInfoValue ${canBuy ? "ok" : "warn"}`}>${money(balance)}</div>
                </div>
              </div>

              {!canBuy && (
                <div className="bmShortage">
                  <span className="bmShortageDot" />
                  Insufficient balance. Shortage: <b>${money(shortage)}</b>
                </div>
              )}

              {!!subErr && <div className="bmError">{subErr}</div>}
            </div>

            <div className="bmModalActions">
              <button className="bmGhostBtn" onClick={closeAllModals}>
                Cancel
              </button>
              <button className="bmPrimaryBtn" onClick={goToInvestModal} disabled={!canBuy}>
                Yes, Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2 */}
      {investOpen && (
        <div className="bmModalOverlay" role="dialog" aria-modal="true">
          <div className="bmModal">
            <div className="bmModalHead">
              <div className="bmHeadLeft">
                <button className="bmBackIconBtn" onClick={backToConfirm} aria-label="Back">
                  <BackIcon />
                </button>
                <div className="bmModalTitle">Enter Investment Amount</div>
              </div>

              <button className="bmModalX" onClick={closeAllModals} aria-label="Close">
                ×
              </button>
            </div>

            <div className="bmModalBody">
              <div className="bmModalDesc">
                Choose how much you want to invest in <b>{BRONZE.name}</b>.
              </div>

              <div className="bmInfoGrid">
                <div className="bmInfoCard">
                  <div className="bmInfoLabel">Allowed Range</div>
                  <div className="bmInfoValue">
                    ${money(BRONZE.min)} - ${money(BRONZE.max)}
                  </div>
                </div>
                <div className="bmInfoCard">
                  <div className="bmInfoLabel">Your Balance</div>
                  <div className="bmInfoValue ok">${money(balance)}</div>
                </div>
              </div>

              <label className="bmField2">
                <div className="bmFieldLabel">Investment Amount (USD)</div>
                <input
                  className="bmFieldControl"
                  type="number"
                  inputMode="decimal"
                  min={BRONZE.min}
                  max={BRONZE.max}
                  step="10"
                  value={investAmount}
                  onChange={(e) => setInvestAmount(e.target.value)}
                  placeholder={`$${BRONZE.min} - $${BRONZE.max}`}
                />
                <div className="bmFieldHint">Must be within the range and not exceed your balance.</div>
              </label>

              {!!subErr && <div className="bmError">{subErr}</div>}
            </div>

            <div className="bmModalActions">
              <button className="bmGhostBtn" onClick={backToConfirm}>
                Back
              </button>
              <button className="bmPrimaryBtn" onClick={submitInvestment}>
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3 */}
      {loadingOpen && (
        <div className="bmModalOverlay" role="dialog" aria-modal="true">
          <div className="bmModal bmModalSm">
            <div className="bmModalHead">
              <div className="bmHeadLeft">
                <button className="bmBackIconBtn" onClick={closeAllModals} aria-label="Back">
                  <BackIcon />
                </button>
                <div className="bmModalTitle">Processing</div>
              </div>

              <button className="bmModalX" onClick={closeAllModals} aria-label="Close">
                ×
              </button>
            </div>

            <div className="bmModalBody">
              <div className="bmLoaderWrap">
                <div className="bmSpinner" aria-hidden="true" />
                <div className="bmLoaderText">
                  Confirming your subscription…
                  <div className="bmLoaderSmall">Please wait {secondsLeft}s</div>
                </div>
              </div>

              <div className="bmProgress">
                <div className="bmProgressBar" style={{ width: `${((15 - secondsLeft) / 15) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success */}
      {successOpen && (
        <div className="bmModalOverlay" role="dialog" aria-modal="true">
          <div className="bmModal bmModalSm">
            <ConfettiBurst offsetMs={0} />
            <ConfettiBurst offsetMs={2600} />

            <div className="bmModalHead">
              <div className="bmHeadLeft">
                <button className="bmBackIconBtn" onClick={closeAllModals} aria-label="Back">
                  <BackIcon />
                </button>
                <div className="bmModalTitle">Successful</div>
              </div>

              <button className="bmModalX" onClick={closeAllModals} aria-label="Close">
                ×
              </button>
            </div>

            <div className="bmModalBody">
              <div className="bmCongrats">
                <div className="bmCongratsTitle">🎉 Congratulations!</div>
                <div className="bmCongratsMsg">
                  You have successfully activated the <b>{BRONZE.name}</b> package.
                  <div className="bmCongratsSub">
                    Invested: <b>${money(investedNum)}</b> • Enjoy daily rewards and track your earnings anytime.
                  </div>
                </div>
              </div>

              <div className="bmSuccess">
                <div className="bmTick" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>

                <div className="bmSuccessText">
                  Subscription completed successfully!
                  <div className="bmSuccessSmall">
                    Invested: <b>${money(investedNum)}</b> • Package: <b>{BRONZE.name}</b>
                  </div>
                </div>
              </div>
            </div>

            <div className="bmModalActions">
              <button className="bmPrimaryBtn" onClick={closeAllModals}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}