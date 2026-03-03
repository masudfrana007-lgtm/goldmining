import { useMemo, useState, useEffect, useRef } from "react";
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
    const raw =
      localStorage.getItem("gm_user") ||
      localStorage.getItem("user") ||
      localStorage.getItem("auth_user");

    if (!raw) return { name: "User", avatar: "" };

    const parsed = JSON.parse(raw);
    const name = parsed?.name || parsed?.username || parsed?.fullName || "User";
    const avatar =
      parsed?.avatar || parsed?.photo || parsed?.profilePhoto || "";
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
  dailyPct: 0.3,
  durationDays: 30,
  min: 100,
  max: 299, // ✅ 100–299
  settlement: "Daily accrual",
  riskNote: "Market conditions apply",
  image: "/gm/rig-starter.png",
};

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M15.5 19a1 1 0 0 1-.71-.29l-6.5-6.5a1 1 0 0 1 0-1.42l6.5-6.5a1 1 0 1 1 1.42 1.42L10.41 11.5l5.8 5.79A1 1 0 0 1 15.5 19Z" />
    </svg>
  );
}

/** 🎉 Confetti burst (pure CSS) */
function ConfettiBurst() {
  const pieces = useMemo(
    () => [
      // ✅ slightly longer durations (feel > 3s with ring/sparkle too)
      { x: -120, y: -140, r: 140, d: 2200 },
      { x: 120, y: -150, r: -120, d: 2350 },
      { x: -160, y: -80, r: 220, d: 2100 },
      { x: 160, y: -90, r: -230, d: 2250 },
      { x: -90, y: -170, r: 180, d: 2400 },
      { x: 90, y: -175, r: -180, d: 2450 },
      { x: -200, y: -40, r: 260, d: 2050 },
      { x: 200, y: -35, r: -260, d: 2150 },

      { x: -140, y: -190, r: 200, d: 2600 },
      { x: 140, y: -195, r: -200, d: 2650 },
      { x: -220, y: -120, r: 280, d: 2300 },
      { x: 220, y: -110, r: -280, d: 2350 },

      { x: -70, y: -220, r: 160, d: 2750 },
      { x: 70, y: -225, r: -160, d: 2800 },
      { x: -250, y: -70, r: 300, d: 2250 },
      { x: 250, y: -65, r: -300, d: 2300 },

      { x: -30, y: -240, r: 120, d: 2900 },
      { x: 30, y: -245, r: -120, d: 2950 },
      { x: -180, y: -160, r: 260, d: 2550 },
      { x: 180, y: -155, r: -260, d: 2600 },

      { x: -110, y: -210, r: 210, d: 2700 },
      { x: 110, y: -215, r: -210, d: 2750 },
      { x: -240, y: -10, r: 320, d: 2100 },
      { x: 240, y: -8, r: -320, d: 2150 },
    ],
    []
  );

  return (
    <div className="srConfetti" aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="srConfettiPiece"
          style={{
            "--x": `${p.x}px`,
            "--y": `${p.y}px`,
            "--r": `${p.r}deg`,
            "--d": `${p.d}ms`,
            "--delay": `${(i % 8) * 35}ms`,
          }}
        />
      ))}
      <div className="srBurstRing" />
      <div className="srSparkle" />
    </div>
  );
}

export default function StarterRig() {
  // ✅ IMPORTANT: keep as STRING so user can clear input fully (no forced 0)
  const [amount, setAmount] = useState(String(STARTER_RIG.min));
  const [roiErr, setRoiErr] = useState("");

  /** ✅ Subscribe flow states */
  const [subOpen, setSubOpen] = useState(false);
  const [investOpen, setInvestOpen] = useState(false);
  const [loadingOpen, setLoadingOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);

  // ✅ STRING state to allow empty input
  const [investAmount, setInvestAmount] = useState(String(STARTER_RIG.min));
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
      safeAmount >= STARTER_RIG.min &&
      safeAmount <= STARTER_RIG.max;

    const dailyProfit = safeAmount * (STARTER_RIG.dailyPct / 100);
    const totalProfit = dailyProfit * STARTER_RIG.durationDays;
    const totalReturn = safeAmount + totalProfit;
    const roiPct = safeAmount > 0 ? (totalProfit / safeAmount) * 100 : 0;

    return { inRange, dailyProfit, totalProfit, totalReturn, roiPct };
  }, [amount, amountNum]);

  const totalReturnPct = useMemo(
    () => STARTER_RIG.dailyPct * STARTER_RIG.durationDays,
    []
  );

  /** ✅ Package "price" in Step-1 = minimum required to join */
  const packagePrice = STARTER_RIG.min;
  const balance = Number(USER.totalBalance || 0);
  const shortage = Math.max(0, packagePrice - balance);
  const canBuy = balance >= packagePrice;

  function closeAllModals() {
    setSubOpen(false);
    setInvestOpen(false);
    setLoadingOpen(false);
    setSuccessOpen(false);
    setSubErr("");

    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    timerRef.current = null;
    intervalRef.current = null;

    setSecondsLeft(15);
  }

  function openSubscribeDefault() {
    setSubErr("");
    setInvestAmount(String(STARTER_RIG.min));
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

    if (a < STARTER_RIG.min || a > STARTER_RIG.max) {
      setRoiErr(
        `Invalid data. Allowed range is $${money(
          STARTER_RIG.min
        )} – $${money(STARTER_RIG.max)}.`
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
    if (x < STARTER_RIG.min) return `Invalid data. Minimum investment is $${money(STARTER_RIG.min)}.`;
    if (x > STARTER_RIG.max) return `Invalid data. Maximum investment is $${money(STARTER_RIG.max)}.`;
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
            <div className="srKicker">Mining Package</div>
            <h1 className="srTitle">{STARTER_RIG.name}</h1>
            <p className="srSub">{STARTER_RIG.subtitle}</p>
          </div>

          <div className="srHeaderActions">
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

            <button
              className="addBalanceBtn"
              title="Add Balance"
              onClick={() => alert("Go to Add Balance / Marketplace")}
            >
              <span className="abDot" />
              Add Balance
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
                <div
                  className="rigPhoto"
                  style={{ backgroundImage: `url("${STARTER_RIG.image}")` }}
                />

                <div className="rigInfo">
                  <div className="rigName">{STARTER_RIG.name}</div>
                  <div className="rigDesc">
                    Daily accrual package designed for smaller allocations and steady compounding rules (backend-defined).
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

                {/* ✅ EMPTY stays EMPTY (no forced 0) */}
                <input
                  className="control"
                  type="number"
                  inputMode="decimal"
                  min={STARTER_RIG.min}
                  max={STARTER_RIG.max}
                  step="10"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)} // ✅ keep string
                  placeholder={`Suggested: ${STARTER_RIG.min}`}
                />

                <div className={calc.inRange ? "help ok" : "help warn"}>
                  Range: ${money(STARTER_RIG.min)} – ${money(STARTER_RIG.max)}
                  {!calc.inRange && (
                    <span className="helpTag">{amount === "" ? "Required" : "Out of range"}</span>
                  )}
                </div>

                <div className="srRoiTools">
                  <button
                    type="button"
                    className="srSuggestPill"
                    onClick={() => setAmount(String(STARTER_RIG.min))}
                  >
                    Suggested: ${money(STARTER_RIG.min)}
                  </button>

                  {roiErr ? <div className="srRoiError">{roiErr}</div> : null}
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
                  disabled={!calc.inRange}
                  onClick={openSubscribeFromROI}
                >
                  Proceed
                </button>

                <button className="ghostBtn" onClick={() => setAmount(String(STARTER_RIG.min))}>
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

      {/* Step 1: Permission / balance check */}
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
                You are about to buy <b>{STARTER_RIG.name}</b>. Minimum package price is shown below.
              </div>

              <div className="srInfoGrid">
                <div className="srInfoCard">
                  <div className="srInfoLabel">Package Price (Minimum)</div>
                  <div className="srInfoValue">${money(STARTER_RIG.min)}</div>
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
              <button className="primaryBtn" onClick={goToInvestModal} disabled={!canBuy}>
                Yes, Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Input investment amount */}
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
                Choose how much you want to invest in <b>Starter Rig</b>.
              </div>

              <div className="srInfoGrid">
                <div className="srInfoCard">
                  <div className="srInfoLabel">Allowed Range</div>
                  <div className="srInfoValue">
                    ${money(STARTER_RIG.min)} – ${money(STARTER_RIG.max)}
                  </div>
                </div>
                <div className="srInfoCard">
                  <div className="srInfoLabel">Your Balance</div>
                  <div className="srInfoValue ok">${money(balance)}</div>
                </div>
              </div>

              <label className="srField">
                <div className="srFieldLabel">Investment Amount (USD)</div>

                {/* ✅ EMPTY stays EMPTY (no forced 0) */}
                <input
                  className="srFieldControl"
                  type="number"
                  inputMode="decimal"
                  min={STARTER_RIG.min}
                  max={STARTER_RIG.max}
                  step="10"
                  value={investAmount}
                  onChange={(e) => setInvestAmount(e.target.value)} // ✅ keep string
                  placeholder={`Min ${STARTER_RIG.min}`}
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

      {/* Step 3: Loading 15s */}
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
                <div
                  className="srProgressBar"
                  style={{ width: `${((15 - secondsLeft) / 15) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success + Celebration */}
      {successOpen && (
        <div className="srModalOverlay" role="dialog" aria-modal="true">
          <div className="srModal srModalSm">
            <ConfettiBurst />

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
              {/* ✅ NEW: Congratulations + longer celebration feel */}
              <div className="srCongrats">
                <div className="srCongratsTitle">🎉 Congratulations!</div>
                <div className="srCongratsMsg">
                  You have successfully activated the <b>{STARTER_RIG.name}</b> package.
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
                    Invested: <b>${money(investedNum)}</b> • Package: <b>{STARTER_RIG.name}</b>
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