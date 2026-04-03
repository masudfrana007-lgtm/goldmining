// src/pages/TitanVaultRig.jsx
import { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./TitanVaultRig.css";

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
  rigInvestment: 2000.0,
  rigEarnings: 412.6,
  active: true,
};

const TITAN = {
  name: "Titan Vault Rig",
  subtitle:
    "Institutional-grade vault rig engineered for maximum throughput with high-yield daily settlement.",
  dailyPct: 2.0, // ✅ 2% flat daily
  durationDays: 30,

  // ✅ Range: 20001 or more (no max)
  min: 20001,
  max: null, // Unlimited
  durations: [7, 15, 30], // Available duration options in days

  settlement: "Daily accrual",
  riskNote: "Market conditions apply",
  image: "/gm/rig-titan.png",
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
    <div className="tvConfetti" aria-hidden="true" style={{ "--base": `${offsetMs}ms` }}>
      {pieces.map((p, i) => (
        <span
          key={i}
          className="tvConfettiPiece"
          style={{
            "--x": `${p.x}px`,
            "--y": `${p.y}px`,
            "--r": `${p.r}deg`,
            "--d": `${p.d}ms`,
            "--delay": `${(i % 8) * 30}ms`,
          }}
        />
      ))}
      <div className="tvBurstRing" />
      <div className="tvSparkle" />
    </div>
  );
}

export default function TitanVaultRig() {
  const nav = useNavigate();

  // ✅ string (like sample, allows empty)
  const [amount, setAmount] = useState(String(TITAN.min));
  const [roiErr, setRoiErr] = useState("");
  const [selectedDuration, setSelectedDuration] = useState(TITAN.durations[0]); // ✅ Duration selector

  /** ✅ Subscribe flow states (same as sample) */
  const [subOpen, setSubOpen] = useState(false);
  const [investOpen, setInvestOpen] = useState(false);
  const [loadingOpen, setLoadingOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);

  // ✅ string
  const [investAmount, setInvestAmount] = useState(String(TITAN.min));
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

    // ✅ Range: min only
    const inRange = amount !== "" && safeAmount >= TITAN.min;

    const dailyProfit = safeAmount * (TITAN.dailyPct / 100);
    const totalProfit = dailyProfit * selectedDuration; // ✅ Use selected duration
    const totalReturn = safeAmount + totalProfit;
    const roiPct = safeAmount > 0 ? (totalProfit / safeAmount) * 100 : 0;

    return { inRange, dailyProfit, totalProfit, totalReturn, roiPct };
  }, [amount, amountNum, selectedDuration]); // ✅ Add selectedDuration dependency

  const totalReturnPct = useMemo(() => TITAN.dailyPct * TITAN.durationDays, []);

  /** Step-1 uses minimum price (same pattern) */
  const packagePrice = TITAN.min;
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
    setInvestAmount(String(TITAN.min));
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

    if (a < TITAN.min) {
      setRoiErr(`Invalid data. Minimum investment is $${money(TITAN.min)} (no maximum).`);
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
    if (x < TITAN.min) return `Invalid data. Minimum investment is $${money(TITAN.min)} (no maximum).`;
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
    <div className="tvPage">
      {/* live background layers */}
      <div className="tvBg" aria-hidden="true" />
      <div className="tvParticles" aria-hidden="true" />
      <div className="tvScanlines" aria-hidden="true" />

      <div className="tvContainer">
        {/* Header */}
        <div className="tvHeader">
          <div>
            <button className="backBtn" type="button" onClick={() => nav(-1)} aria-label="Go back">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M15.5 5.5a1 1 0 0 1 0 1.4L10.4 12l5.1 5.1a1 1 0 1 1-1.4 1.4l-5.8-5.8a1 1 0 0 1 0-1.4l5.8-5.8a1 1 0 0 1 1.4 0Z" />
              </svg>
              <span>Back</span>
            </button>

            <div className="tvKicker">Mining Package</div>
            <h1 className="tvTitle">{TITAN.name}</h1>
            <p className="tvSub">{TITAN.subtitle}</p>
          </div>

          <div className="tvHeaderActions">
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

            <div className="tvStatusPill">
              <span className={`tvDot ${USER.active ? "on" : "off"}`} />
              <span>{USER.active ? "Active" : "Inactive"}</span>
            </div>
          </div>
        </div>

        {/* Top Summary */}
        <section className="tvSummary">
          <div className="sumCard">
            <div className="sumLabel">Total Balance</div>
            <div className="sumValue">${money(USER.totalBalance)}</div>
            <div className="sumMeta">Available funds</div>
          </div>

          <div className="sumCard">
            <div className="sumLabel">Titan Investment</div>
            <div className="sumValue">${money(USER.rigInvestment)}</div>
            <div className="sumMeta">Currently allocated</div>
          </div>

          <div className="sumCard">
            <div className="sumLabel">Earnings (Titan)</div>
            <div className="sumValue aqua">${money(USER.rigEarnings)}</div>
            <div className="sumMeta">Accrued profit</div>
          </div>

          <div className="sumCard">
            <div className="sumLabel">Total Return (Plan)</div>
            <div className="sumValue titan">{pct(totalReturnPct)}</div>
            <div className="sumMeta">{TITAN.durationDays} days • Simple model</div>
          </div>
        </section>

        {/* Main Grid */}
        <section className="tvGrid">
          {/* Overview */}
          <div className="tvBlock">
            <div className="blockHead">
              <div>
                <div className="blockTitle">Titan Vault Overview</div>
                <div className="blockHint">Institutional terms & vault-grade allocation details.</div>
              </div>
              <div className="headRight">
                <span className="smallTag">Daily profit is estimated</span>
              </div>
            </div>

            <div className="overviewBody">
              <div className="rigCard">
                <div className="rigPhoto" style={{ backgroundImage: `url("${TITAN.image}")` }}>
                  <div className="rigPhotoGlow" aria-hidden="true" />
                </div>

                <div className="rigInfo">
                  <div className="rigName">{TITAN.name}</div>
                  <div className="rigDesc">
                    A “titan-class” vault rig with hardened settlement rules and a premium yield profile (backend-defined).
                  </div>

                  <div className="kpiRow">
                    <div className="kpiBox">
                      <div className="kpiLabel">Daily Rate</div>
                      <div className="kpiValue titan">{pct(TITAN.dailyPct)}</div>
                    </div>
                    <div className="kpiBox">
                      <div className="kpiLabel">Minimum Entry</div>
                      <div className="kpiValue">${money(TITAN.min)}</div>
                    </div>
                    <div className="kpiBox">
                      <div className="kpiLabel">Est / day (min)</div>
                      <div className="kpiValue aqua">${money(TITAN.min * (TITAN.dailyPct / 100))}</div>
                    </div>
                  </div>

                  <div className="rows">
                    <div className="row">
                      <span className="rowKey">Minimum</span>
                      <span className="rowVal">${money(TITAN.min)}</span>
                    </div>

                    <div className="row">
                      <span className="rowKey">Maximum</span>
                      <span className="rowVal muted">No maximum</span>
                    </div>

                    <div className="row">
                      <span className="rowKey">Settlement</span>
                      <span className="rowVal">{TITAN.settlement}</span>
                    </div>
                    <div className="row">
                      <span className="rowKey">Risk Notes</span>
                      <span className="rowVal muted">{TITAN.riskNote}</span>
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
                    Vault rules, fees, compounding, early close, and payout windows should come from backend.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ROI Calculator */}
          <aside className="tvBlock">
            <div className="blockHead">
              <div>
                <div className="blockTitle">ROI Calculator</div>
                <div className="blockHint">Estimate profit using rate & duration.</div>
              </div>
            </div>

            <div className="calcBody">
              <label className="field">
                <span className="label">Investment Amount (USD)</span>

                <input
                  className="control"
                  type="number"
                  inputMode="decimal"
                  min={TITAN.min}
                  step="100"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`Suggested: ${TITAN.min}`}
                />

                <div className={calc.inRange ? "help ok" : "help warn"}>
                  Minimum: ${money(TITAN.min)} (no maximum)
                  {!calc.inRange && (
                    <span className="helpTag">{amount === "" ? "Required" : "Below minimum"}</span>
                  )}
                </div>

                <div className="tvRoiTools">
                  <button type="button" className="tvSuggestPill" onClick={() => setAmount(String(TITAN.min))}>
                    Suggested: ${money(TITAN.min)}
                  </button>

                  {roiErr ? <div className="tvRoiError">{roiErr}</div> : null}
                </div>
              </label>

              {/* ✅ Duration Selector */}
              <label className="field">
                <span className="label">Package Duration</span>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                  {TITAN.durations.map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setSelectedDuration(days)}
                      style={{
                        padding: "0.5rem 1rem",
                        background: selectedDuration === days ? "#8b7355" : "#1e293b",
                        border: `1px solid ${selectedDuration === days ? "#8b7355" : "#334155"}`,
                        borderRadius: "0.5rem",
                        color: "#f1f5f9",
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
                  <div className="calcValue aqua">${money(calc.dailyProfit)}</div>
                  <div className="calcMeta">({pct(TITAN.dailyPct)} of principal)</div>
                </div>

                <div className="calcCard">
                  <div className="calcLabel">Est. Total Profit</div>
                  <div className="calcValue">${money(calc.totalProfit)}</div>
                  <div className="tvCalcMeta">{selectedDuration} {selectedDuration === 1 ? "day" : "days"}</div>
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
                <button className="ghostBtn" onClick={() => setAmount(String(TITAN.min))}>
                  Use Minimum
                </button>
              </div>

              <div className="note soft">
                <span className="noteDot blueDot" />
                Dashboard preview only. Use backend settlement rules for production.
              </div>
            </div>
          </aside>
        </section>
      </div>

      {/* ===================== MODALS ===================== */}

      {/* Step 1 */}
      {subOpen && (
        <div className="tvModalOverlay" role="dialog" aria-modal="true">
          <div className="tvModal">
            <div className="tvModalHead">
              <div className="tvHeadLeft">
                <button className="tvBackIconBtn" onClick={closeAllModals} aria-label="Back">
                  <BackIcon />
                </button>
                <div className="tvModalTitle">Confirm Subscription</div>
              </div>

              <button className="tvModalX" onClick={closeAllModals} aria-label="Close">
                ×
              </button>
            </div>

            <div className="tvModalBody">
              <div className="tvModalDesc">
                You are about to buy <b>{TITAN.name}</b>. Minimum package price is shown below.
              </div>

              <div className="tvInfoGrid">
                <div className="tvInfoCard">
                  <div className="tvInfoLabel">Package Price (Minimum)</div>
                  <div className="tvInfoValue">${money(TITAN.min)}</div>
                </div>
                <div className="tvInfoCard">
                  <div className="tvInfoLabel">Your Current Balance</div>
                  <div className={`tvInfoValue ${canBuy ? "ok" : "warn"}`}>${money(balance)}</div>
                </div>
              </div>

              {!canBuy && (
                <div className="tvShortage">
                  <span className="tvShortageDot" />
                  Insufficient balance. Shortage: <b>${money(shortage)}</b>
                </div>
              )}

              {!!subErr && <div className="tvError">{subErr}</div>}
            </div>

            <div className="tvModalActions">
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
        <div className="tvModalOverlay" role="dialog" aria-modal="true">
          <div className="tvModal">
            <div className="tvModalHead">
              <div className="tvHeadLeft">
                <button className="tvBackIconBtn" onClick={backToConfirm} aria-label="Back">
                  <BackIcon />
                </button>
                <div className="tvModalTitle">Enter Investment Amount</div>
              </div>

              <button className="tvModalX" onClick={closeAllModals} aria-label="Close">
                ×
              </button>
            </div>

            <div className="tvModalBody">
              <div className="tvModalDesc">
                Choose how much you want to invest in <b>{TITAN.name}</b>.
              </div>

              <div className="tvInfoGrid">
                <div className="tvInfoCard">
                  <div className="tvInfoLabel">Allowed Range</div>
                  <div className="tvInfoValue">
                    Minimum: ${money(TITAN.min)} <span className="muted">• No maximum</span>
                  </div>
                </div>
                <div className="tvInfoCard">
                  <div className="tvInfoLabel">Your Balance</div>
                  <div className="tvInfoValue ok">${money(balance)}</div>
                </div>
              </div>

              <label className="tvField">
                <div className="tvFieldLabel">Investment Amount (USD)</div>
                <input
                  className="tvFieldControl"
                  type="number"
                  inputMode="decimal"
                  min={TITAN.min}
                  step="100"
                  value={investAmount}
                  onChange={(e) => setInvestAmount(e.target.value)}
                  placeholder={`Min ${TITAN.min}`}
                />
                <div className="tvFieldHint">Must be at least the minimum and not exceed your balance.</div>
              </label>

              {!!subErr && <div className="tvError">{subErr}</div>}
            </div>

            <div className="tvModalActions">
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
        <div className="tvModalOverlay" role="dialog" aria-modal="true">
          <div className="tvModal tvModalSm">
            <div className="tvModalHead">
              <div className="tvHeadLeft">
                <button className="tvBackIconBtn" onClick={closeAllModals} aria-label="Back">
                  <BackIcon />
                </button>
                <div className="tvModalTitle">Processing</div>
              </div>

              <button className="tvModalX" onClick={closeAllModals} aria-label="Close">
                ×
              </button>
            </div>

            <div className="tvModalBody">
              <div className="tvLoaderWrap">
                <div className="tvSpinner" aria-hidden="true" />
                <div className="tvLoaderText">
                  Confirming your subscription…
                  <div className="tvLoaderSmall">Please wait {secondsLeft}s</div>
                </div>
              </div>

              <div className="tvProgress">
                <div className="tvProgressBar" style={{ width: `${((15 - secondsLeft) / 15) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success */}
      {successOpen && (
        <div className="tvModalOverlay" role="dialog" aria-modal="true">
          <div className="tvModal tvModalSm">
            <ConfettiBurst offsetMs={0} />
            <ConfettiBurst offsetMs={3000} />

            <div className="tvModalHead">
              <div className="tvHeadLeft">
                <button className="tvBackIconBtn" onClick={closeAllModals} aria-label="Back">
                  <BackIcon />
                </button>
                <div className="tvModalTitle">Successful</div>
              </div>

              <button className="tvModalX" onClick={closeAllModals} aria-label="Close">
                ×
              </button>
            </div>

            <div className="tvModalBody">
              <div className="tvCongrats">
                <div className="tvCongratsTitle">🎉 Congratulations!</div>
                <div className="tvCongratsMsg">
                  You have successfully activated the <b>{TITAN.name}</b> package.
                  <div className="tvCongratsSub">
                    Invested: <b>${money(investedNum)}</b> • Enjoy daily rewards and track your earnings anytime.
                  </div>
                </div>
              </div>

              <div className="tvSuccess">
                <div className="tvTick" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>

                <div className="tvSuccessText">
                  Subscription completed successfully!
                  <div className="tvSuccessSmall">
                    Invested: <b>${money(investedNum)}</b> • Package: <b>{TITAN.name}</b>
                  </div>
                </div>
              </div>
            </div>

            <div className="tvModalActions">
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