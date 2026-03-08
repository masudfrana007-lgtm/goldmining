import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./GoldMiracleAIDashboard.css";

function cls(...a) {
  return a.filter(Boolean).join(" ");
}

function nfmt(n, d = 2) {
  const num = Number(n || 0);
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: d,
    minimumFractionDigits: d,
  }).format(num);
}

function money(n, d = 2) {
  const num = Number(n || 0);
  return `$${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: d,
    minimumFractionDigits: d,
  }).format(num)}`;
}

function pct(n) {
  const num = Number(n || 0);
  const sign = num >= 0 ? "+" : "";
  return `${sign}${num.toFixed(2)}%`;
}

/* ---------- Simple SVG Line Chart ---------- */
function LineChart({ data, height = 220 }) {
  const w = 860;
  const h = height;
  const pad = 18;

  const { path, area, min, max, last } = useMemo(() => {
    const xs = data.map((d) => d.x);
    const ys = data.map((d) => d.y);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const spanY = Math.max(1, maxY - minY);

    const x0 = Math.min(...xs);
    const x1 = Math.max(...xs);
    const spanX = Math.max(1, x1 - x0);

    const X = (x) => pad + ((x - x0) / spanX) * (w - pad * 2);
    const Y = (y) => h - pad - ((y - minY) / spanY) * (h - pad * 2);

    const pts = data.map((d) => [X(d.x), Y(d.y)]);
    const dPath = pts
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p[0].toFixed(2)} ${p[1].toFixed(2)}`)
      .join(" ");
    const dArea = `${dPath} L ${pts[pts.length - 1][0].toFixed(2)} ${(h - pad).toFixed(
      2
    )} L ${pts[0][0].toFixed(2)} ${(h - pad).toFixed(2)} Z`;

    return {
      path: dPath,
      area: dArea,
      min: minY,
      max: maxY,
      last: data[data.length - 1]?.y ?? 0,
    };
  }, [data, h]);

  return (
    <div className="gmChart">
      <svg viewBox={`0 0 860 ${h}`} className="gmSvg" role="img" aria-label="S&P 500 performance line chart">
        <g className="gmSvgGrid">
          {[0, 1, 2, 3, 4].map((i) => {
            const y = 18 + (i * (h - 36)) / 4;
            return <line key={i} x1="18" x2="842" y1={y} y2={y} />;
          })}
        </g>

        <path d={area} className="gmArea" />
        <path d={path} className="gmLine" />

        <circle
          cx="842"
          cy={18 + ((max - last) / Math.max(1, max - min)) * (h - 36)}
          r="3.8"
          className="gmDot"
        />
      </svg>

      <div className="gmChartMeta">
        <div className="gmChartLabel">S&amp;P 500 (6M)</div>
        <div className="gmChartValue">{nfmt(last, 2)}</div>
        <div className="gmChartSub">Price index • simulated but realistic</div>
      </div>
    </div>
  );
}

/* ---------- Simple SVG Candlestick Chart ---------- */
function CandleChart({ candles, height = 260 }) {
  const w = 860;
  const h = height;
  const pad = 18;

  const { items } = useMemo(() => {
    const lows = candles.map((c) => c.l);
    const highs = candles.map((c) => c.h);
    const minP = Math.min(...lows);
    const maxP = Math.max(...highs);
    const span = Math.max(1, maxP - minP);

    const Y = (p) => h - pad - ((p - minP) / span) * (h - pad * 2);

    const gap = 8.5;
    const cw = 7;
    const startX = pad + 10;

    const items = candles.map((c, i) => {
      const x = startX + i * gap;
      const yO = Y(c.o);
      const yC = Y(c.c);
      const yH = Y(c.h);
      const yL = Y(c.l);
      const up = c.c >= c.o;

      const bodyY = Math.min(yO, yC);
      const bodyH = Math.max(2.2, Math.abs(yC - yO));

      return {
        x,
        up,
        wick: { x, y1: yH, y2: yL },
        body: { x: x - cw / 2, y: bodyY, w: cw, h: bodyH },
      };
    });

    return { items };
  }, [candles, h]);

  return (
    <div className="gmChart">
      <svg viewBox={`0 0 860 ${h}`} className="gmSvg" role="img" aria-label="Bitcoin candlestick chart">
        <g className="gmSvgGrid">
          {[0, 1, 2, 3, 4].map((i) => {
            const y = 18 + (i * (h - 36)) / 4;
            return <line key={i} x1="18" x2="842" y1={y} y2={y} />;
          })}
        </g>

        {items.map((it, i) => (
          <g key={i} className={cls("gmCandle", it.up ? "up" : "down")}>
            <line x1={it.wick.x} x2={it.wick.x} y1={it.wick.y1} y2={it.wick.y2} className="gmWick" />
            <rect x={it.body.x} y={it.body.y} width={it.body.w} height={it.body.h} rx="1.4" className="gmBody" />
          </g>
        ))}
      </svg>

      <div className="gmChartMeta">
        <div className="gmChartLabel">BTC/USDT (Candles)</div>
        <div className="gmChartValue">{money(candles[candles.length - 1]?.c ?? 0, 0)}</div>
        <div className="gmChartSub">Intraday candles • simulated but realistic</div>
      </div>
    </div>
  );
}

/* ---------- Coin Selector Modal ---------- */
function CoinPickerModal({
  open,
  onClose,
  coinOptions,
  selectedCoins,
  setSelectedCoins,
  systemSelect,
  setSystemSelect,
}) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return coinOptions;
    return coinOptions.filter((c) => c.toLowerCase().includes(s));
  }, [coinOptions, q]);

  const toggleCoin = (c) => {
    setSelectedCoins((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  };

  const selectAll = () => setSelectedCoins(coinOptions.slice(0));
  const clearAll = () => setSelectedCoins([]);

  if (!open) return null;

  return (
    <div className="gmModalWrap" role="dialog" aria-modal="true" aria-label="Select coins">
      <div className="gmModalBackdrop" onClick={onClose} />

      <div className="gmModal">
        <div className="gmModalHead">
          <div>
            <div className="gmModalTitle">Select Coins (Multi)</div>
            <div className="gmModalSub">
              You can select multiple coins, or enable system selection to let the system choose randomly.
            </div>
          </div>

          <button className="gmIconBtn" type="button" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="gmModalTopRow">
          <label className="gmSysPick">
            <input type="checkbox" checked={systemSelect} onChange={(e) => setSystemSelect(e.target.checked)} />
            <span className="box" aria-hidden="true" />
            <span className="txt">
              <b>System can select random coin</b>
              <span className="mut"> (recommended for diversification)</span>
            </span>
          </label>

          <div className="gmModalSearch">
            <span className="ic">⌕</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search coins..." />
          </div>
        </div>

        <div className="gmModalList">
          {filtered.map((c) => {
            const on = selectedCoins.includes(c);
            return (
              <button
                key={c}
                type="button"
                className={cls("gmCoinRow", on && "on", systemSelect && "disabled")}
                onClick={() => !systemSelect && toggleCoin(c)}
                disabled={systemSelect}
                title={systemSelect ? "Disable system selection to manually choose coins" : ""}
              >
                <span className={cls("cb", on && "on")} aria-hidden="true" />
                <span className="coin">{c}</span>
                <span className="tag">{c.split("/")[0]}</span>
              </button>
            );
          })}
        </div>

        <div className="gmModalFoot">
          <div className="gmModalFootLeft">
            <button className="gmTextBtn" type="button" onClick={clearAll} disabled={systemSelect}>
              Clear
            </button>
            <button className="gmTextBtn" type="button" onClick={selectAll} disabled={systemSelect}>
              Select all
            </button>
            <span className="gmCount">
              Selected: <b>{systemSelect ? "System" : selectedCoins.length}</b>
            </span>
          </div>

          <div className="gmModalFootRight">
            <button className="gmBtnLight" type="button" onClick={onClose}>
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===========================
   ✅ NEW: AI Start Flow Modal
=========================== */

function AiStartFlowModal({
  open,
  onClose,
  currentBalance = 0,
  durationLabel = "7 days",
  onApplyAmount,
}) {
  const [step, setStep] = useState(0); // 0=amount, 1=confirm, 2=processing, 3=done
  const [alloc, setAlloc] = useState("");
  const [err, setErr] = useState("");

  // processing UX
  const [runIndex, setRunIndex] = useState(-1);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState([]);
  const [hash, setHash] = useState("");

  // ✅ stable helpers (IMPORTANT: prevents effect loops)
  const fmtMoney = useCallback((n) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(Number(n || 0));
  }, []);

  const randHex = useCallback((len = 48) => {
    const chars = "abcdef0123456789";
    let out = "";
    for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
  }, []);

  const fmtTs = useCallback(() => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }, []);

  const pushLog = useCallback((line) => {
    setLogs((p) => {
      const next = [...p, line];
      return next.length > 80 ? next.slice(next.length - 80) : next;
    });
  }, []);

  const daysNum = useMemo(() => {
    const s = String(durationLabel || "").toLowerCase();
    if (s.includes("month")) return 30;
    const m = s.match(/(\d+)/);
    return m ? Number(m[1]) : 7;
  }, [durationLabel]);

  const steps = useMemo(
    () => [
      { t: "Security checks", s: "2FA • device trust • risk rules validation" },
      { t: "Selecting coins", s: "Applying your multi-coin selection logic" },
      { t: "Analyzing data (last 6 months)", s: "Volatility • trend • liquidity • correlation" },
      { t: "Final check", s: "TP/SL boundaries • strategy caps • spread filters" },
      { t: `Setting trade for next ${daysNum} days`, s: "Execution window locked and scheduled" },
    ],
    [daysNum]
  );

    const termBodyRef = useRef(null);
  const stepListRef = useRef(null);

  // ✅ Auto-scroll terminal logs to bottom (latest line)
  useEffect(() => {
    if (!open) return;
    if (step !== 2) return;
    const el = termBodyRef.current;
    if (!el) return;

    // wait for DOM paint then scroll
    const raf = requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });

    return () => cancelAnimationFrame(raf);
  }, [open, step, logs]);

  // reset when open
  useEffect(() => {
    if (!open) return;
    setStep(0);
    setAlloc("");
    setErr("");
    setRunIndex(-1);
    setProgress(0);
    setLogs([]);
    setHash("");
  }, [open]);

  // esc close
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  function clamp(v) {
    const clean = String(v).replace(/[^\d.]/g, "");
    const parts = clean.split(".");
    return parts.length > 2 ? parts[0] + "." + parts.slice(1).join("") : clean;
  }

  function next() {
    const n = Number(alloc);
    if (!alloc || !Number.isFinite(n) || n <= 0) return setErr("Please enter a valid amount.");
    if (n > Number(currentBalance || 0)) return setErr("Amount cannot be higher than your current balance.");
    setErr("");
    setStep(1);
  }

  function confirm() {
    const n = Number(alloc);
    if (!Number.isFinite(n) || n <= 0) return;
    onApplyAmount?.(n);
    setStep(2);
  }

  // ✅ 45s processing orchestration (FIXED)
  useEffect(() => {
    if (!open) return;
    if (step !== 2) return;

    let cancelled = false;

    // Snapshot values so they don't "move" mid-run
    const allocSnap = Number(alloc || 0);
    const durationSnap = durationLabel;
    const daysSnap = daysNum;
    const stepsSnap = steps;

    const TOTAL_MS = 45000;

    const weights = [0.18, 0.16, 0.32, 0.18, 0.16];
    const stepMs = weights.map((w) => Math.round(TOTAL_MS * w));

    const startedAt = Date.now();

    // smooth progress
    const progTimer = setInterval(() => {
      if (cancelled) return;
      const t = Date.now() - startedAt;
      const p = Math.max(0, Math.min(100, Math.round((t / TOTAL_MS) * 100)));
      setProgress(p);
    }, 120);

    // secure hash ticker
    const hashTimer = setInterval(() => {
      if (cancelled) return;
      setHash(randHex(48));
    }, 180);

    // logs streaming
    const logPool = [
      "Initializing AI trading engine runtime…",
      "Loading risk profile and execution window…",
      "Binding strategy caps (profit/loss) to session…",
      "Verifying device signature & session token…",
      "Applying rule guards (TP/SL) and anti-drawdown checks…",
      "Fetching last 6 months: volatility + correlation matrices…",
      "Running feature extraction on price action…",
      "Scanning liquidity bands & spread conditions…",
      "Selecting optimal routing plan for chosen coins…",
      "Performing final checksum & guardrail validation…",
      "Deploying strategy to execution scheduler…",
      "Activating autonomous monitoring loop…",
    ];

    const logTimer = setInterval(() => {
      if (cancelled) return;
      const pick = logPool[Math.floor(Math.random() * logPool.length)];
      pushLog(`[${fmtTs()}] ${pick}`);
    }, 650);

    const runSteps = async () => {
      setRunIndex(0);
      pushLog(`[${fmtTs()}] Session created. Allocation=${fmtMoney(allocSnap)} Window=${durationSnap}`);
      pushLog(`[${fmtTs()}] Security module online. Starting checks…`);

      for (let i = 0; i < stepsSnap.length; i++) {
        if (cancelled) return;
        setRunIndex(i);

        pushLog(`[${fmtTs()}] ▶ ${stepsSnap[i].t} …`);
        pushLog(`[${fmtTs()}] ${stepsSnap[i].s}`);

        const ms = stepMs[i] || 4000;

        const burstCount = Math.max(3, Math.round(ms / 2500));
        for (let b = 0; b < burstCount; b++) {
          if (cancelled) return;
          const jitter = 600 + Math.floor(Math.random() * 900);
          await new Promise((r) => setTimeout(r, jitter));
          const pick = logPool[Math.floor(Math.random() * logPool.length)];
          pushLog(`[${fmtTs()}] ${pick}`);
        }

        const used = burstCount * 900;
        const remain = Math.max(400, ms - used);
        await new Promise((r) => setTimeout(r, remain));

        if (cancelled) return;
        pushLog(`[${fmtTs()}] ✓ ${stepsSnap[i].t} complete`);
      }

      if (cancelled) return;
      setRunIndex(stepsSnap.length);
      setProgress(100);
      pushLog(`[${fmtTs()}] Deployment finalized. Engine status: ACTIVE`);
      pushLog(`[${fmtTs()}] Monitoring loop engaged for next ${daysSnap} days.`);

      setTimeout(() => {
        if (!cancelled) setStep(3);
      }, 850);
    };

    runSteps();

  return () => {
  cancelled = true;
  clearInterval(progTimer);
  clearInterval(hashTimer);
  clearInterval(logTimer);
};
  }, [open, step, alloc, durationLabel, daysNum, steps, fmtMoney, fmtTs, pushLog, randHex]);

  if (!open) return null;

  return (
    <div className="aiFlowOverlay" role="dialog" aria-modal="true" aria-label="AI Trading activation">
      <div className="aiFlowBackdrop" onClick={onClose} />
      <div className="aiFlowModal">
        <div className="aiFlowTop">
          <div className="aiFlowTitle">
            <span className="aiFlowDot" aria-hidden="true" />
            AI Trading Activation
          </div>
          <button className="aiFlowClose" type="button" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="aiFlowStepper">
          <div className={cls("b", step >= 0 && "on")}>1</div>
          <div className={cls("l", step >= 1 && "on")} />
          <div className={cls("b", step >= 1 && "on")}>2</div>
          <div className={cls("l", step >= 2 && "on")} />
          <div className={cls("b", step >= 2 && "on")}>3</div>
        </div>

        {step === 0 && (
          <div className="aiFlowBody">
            <div className="aiFlowCard">
              <div className="aiFlowHead">
                <div className="h">Enter Balance Amount</div>
                <div className="s">Your available balance is shown below.</div>
              </div>

              <div className="aiFlowStats">
                <div className="st">
                  <div className="k">Current Balance</div>
                  <div className="v">{fmtMoney(currentBalance)}</div>
                </div>
                <div className="st">
                  <div className="k">Duration</div>
                  <div className="v">{durationLabel}</div>
                </div>
              </div>

              <div className="aiFlowField">
                <label>Amount to allocate</label>
                <div className="aiFlowInput">
                  <span className="p">$</span>
                  <input
                    value={alloc}
                    onChange={(e) => {
                      setErr("");
                      setAlloc(clamp(e.target.value));
                    }}
                    placeholder="0.00"
                    inputMode="decimal"
                  />
                  <button
                    type="button"
                    className="aiFlowMax"
                    onClick={() => {
                      setErr("");
                      setAlloc(String(Number(currentBalance || 0).toFixed(2)));
                    }}
                  >
                    MAX
                  </button>
                </div>
                {err ? <div className="aiFlowErr">{err}</div> : null}
              </div>

              <div className="aiFlowActions">
                <button className="aiFlowBtn ghost" type="button" onClick={onClose}>
                  Cancel
                </button>
                <button className="aiFlowBtn" type="button" onClick={next}>
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="aiFlowBody">
            <div className="aiFlowCard pulse">
              <div className="aiFlowHead">
                <div className="h">Confirm Allocation</div>
                <div className="s">Review your amount before activation.</div>
              </div>

              <div className="aiFlowConfirm">
                <div className="r">
                  <div className="k">Amount</div>
                  <div className="v gold">{fmtMoney(alloc)}</div>
                </div>
                <div className="r">
                  <div className="k">Duration</div>
                  <div className="v">{durationLabel}</div>
                </div>
                <div className="r">
                  <div className="k">Balance after</div>
                  <div className="v">{fmtMoney(Number(currentBalance || 0) - Number(alloc || 0))}</div>
                </div>
              </div>

              <div className="aiFlowActions">
                <button className="aiFlowBtn ghost" type="button" onClick={() => setStep(0)}>
                  Back
                </button>
                <button className="aiFlowBtn gold" type="button" onClick={confirm}>
                  Confirm & Start
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
  <div className="aiFlowBody">
    <div className="aiFlowCard">
      <div className="aiFlowHead">
        <div className="h">Initializing AI Trading</div>
        <div className="s">This activation sequence completes in ~45 seconds.</div>
      </div>

      {/* ✅ NEW: Scroll container (for mobile) */}
      <div className="aiFlowScrollArea">
        {/* ✅ TOP TECH BAR */}
        <div className="aiTechBar">
          <div className="aiPct">
            <div className="k">Progress</div>
            <div className="v">{progress}%</div>
          </div>

          <div className="aiBarWrap" aria-hidden="true">
            <div className="aiBar" style={{ width: `${progress}%` }} />
            <div className="aiBarScan" />
          </div>

          <div className="aiHash">
            <div className="k">Secure hash</div>
            <div className="v">{hash || "—"}</div>
          </div>

          <div className="aiKey" title="Secure session">
            <span className="ring" />
            <span className="key">🔑</span>
          </div>
        </div>

        <div className="aiFlowProgress">
          <div className="aiFlowRing" aria-hidden="true">
            <div className="r1" />
            <div className="r2" />
            <div className="r3" />
            <div className="aiScanLines" aria-hidden="true" />
          </div>

          {/* ✅ NEW: step list scroll target */}
          <div className="aiFlowSteps" ref={stepListRef}>
            {steps.map((x, i) => {
              const done = runIndex > i;
              const on = runIndex === i;
              return (
                <div key={x.t} className={cls("aiFlowStep", done && "done", on && "on")}>
                  <div className="dot" />
                  <div className="txt">
                    <div className="t">{x.t}</div>
                    <div className="d">{x.s}</div>
                  </div>
                  <div className="st">{done ? "Done" : on ? "Running..." : "Queued"}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ✅ Terminal logs (auto-scroll already applied) */}
        <div className="aiTerminal" aria-label="AI terminal logs">
          <div className="aiTermTop">
            <div className="b" />
            <div className="b y" />
            <div className="b g" />
            <div className="t">engine.logs</div>
            <div className="sp" />
            <div className="tag">LIVE</div>
          </div>

          <div className="aiTermBody" ref={termBodyRef}>
            {logs.map((l, idx) => (
              <div key={idx} className="ln">
                {l}
              </div>
            ))}
            <div className="cursorRow">
              <span className="prompt">›</span>
              <span className="cursor" />
            </div>
          </div>
        </div>

        <div className="aiFlowHint">
          Allocation: <b>{fmtMoney(alloc)}</b> • Window: <b>{durationLabel}</b>
        </div>
      </div>
    </div>
  </div>
)}

        {step === 3 && (
          <div className="aiFlowBody">
            <div className="aiFlowCard done">
              <div className="aiFlowHead">
                <div className="h">Congratulations</div>
                <div className="s">AI Trading deployment completed successfully.</div>
              </div>

              <div className="aiCongrats">
                <div className="bolt" aria-hidden="true">
                  ⚡
                </div>
                <div className="msg">
                  <div className="m1">
                    <b>Trade successfully deployed to the AI trading engine.</b>
                  </div>
                  <div className="m2">
                    The system will autonomously analyze market signals and manage the position over the next{" "}
                    <b>{daysNum} days</b> for optimal results.
                  </div>
                  <div className="m3">
                    Successfully set the trade for next <b>{daysNum} days</b> to get the best result.
                  </div>
                </div>
              </div>

              <div className="aiFlowActions">
                <button className="aiFlowBtn gold" type="button" onClick={onClose}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
/* ---------- Main Page ---------- */
export default function GoldMiracleAIDashboard() {
  const navigate = useNavigate();

  const tickers = [
    { sym: "AAPL", name: "Apple", px: 194.28, chg: 0.74 },
    { sym: "MSFT", name: "Microsoft", px: 424.91, chg: -0.38 },
    { sym: "TSLA", name: "Tesla", px: 211.37, chg: 1.92 },
    { sym: "NVDA", name: "NVIDIA", px: 906.52, chg: 2.41 },
  ];

  const sp6m = useMemo(
    () => [
      { x: 0, y: 4685.2 },
      { x: 1, y: 4728.9 },
      { x: 2, y: 4669.4 },
      { x: 3, y: 4782.1 },
      { x: 4, y: 4869.8 },
      { x: 5, y: 4926.6 },
      { x: 6, y: 4887.9 },
      { x: 7, y: 4958.3 },
      { x: 8, y: 5031.7 },
      { x: 9, y: 5098.1 },
      { x: 10, y: 5066.4 },
      { x: 11, y: 5149.6 },
      { x: 12, y: 5212.9 },
    ],
    []
  );

  const btcCandles = useMemo(
    () => [
      { o: 64320, h: 65110, l: 63880, c: 64790 },
      { o: 64790, h: 65440, l: 64210, c: 65010 },
      { o: 65010, h: 65260, l: 64160, c: 64540 },
      { o: 64540, h: 64920, l: 63640, c: 63980 },
      { o: 63980, h: 64610, l: 63720, c: 64470 },
      { o: 64470, h: 65280, l: 64230, c: 65190 },
      { o: 65190, h: 65740, l: 64860, c: 65410 },
      { o: 65410, h: 65810, l: 64990, c: 65120 },
      { o: 65120, h: 65630, l: 64720, c: 65380 },
      { o: 65380, h: 66190, l: 65210, c: 66040 },
      { o: 66040, h: 66610, l: 65740, c: 65920 },
      { o: 65920, h: 66480, l: 65430, c: 66310 },
      { o: 66310, h: 66840, l: 66010, c: 66780 },
      { o: 66780, h: 67220, l: 66240, c: 66450 },
      { o: 66450, h: 67060, l: 66110, c: 66990 },
      { o: 66990, h: 67410, l: 66620, c: 67150 },
      { o: 67150, h: 67680, l: 66810, c: 66940 },
      { o: 66940, h: 67390, l: 66430, c: 66710 },
      { o: 66710, h: 67240, l: 66250, c: 67120 },
      { o: 67120, h: 67910, l: 66940, c: 67680 },
    ],
    []
  );

  const portfolio = [
    { asset: "BTC", name: "Bitcoin", alloc: 34.0, qty: 0.42, avg: 61200, px: 67680, pl: 10.58 },
    { asset: "ETH", name: "Ethereum", alloc: 22.5, qty: 5.8, avg: 3120, px: 3365, pl: 7.85 },
    { asset: "SOL", name: "Solana", alloc: 14.0, qty: 78, avg: 122, px: 136.4, pl: 11.8 },
    { asset: "BNB", name: "BNB", alloc: 9.5, qty: 8.2, avg: 548, px: 571.2, pl: 4.23 },
    { asset: "USDT", name: "Tether", alloc: 20.0, qty: 4000, avg: 1.0, px: 1.0, pl: 0.02 },
  ];

  const coinOptions = [
    "BTC/USDT","ETH/USDT","SOL/USDT","BNB/USDT","XRP/USDT","ADA/USDT","DOGE/USDT","AVAX/USDT",
    "LINK/USDT","DOT/USDT","MATIC/USDT","LTC/USDT","TRX/USDT","ATOM/USDT","BCH/USDT",
  ];
  const durations = ["1 day", "3 days", "7 days", "15 days", "1 month"];

  const [selectedCoins, setSelectedCoins] = useState(["BTC/USDT", "ETH/USDT"]);
  const [systemSelect, setSystemSelect] = useState(false);
  const [duration, setDuration] = useState("7 days");
  const [amount, setAmount] = useState(1000);
  const [tpEnabled, setTpEnabled] = useState(true);
  const [slEnabled, setSlEnabled] = useState(true);
  const [takeProfit, setTakeProfit] = useState(8);
  const [stopLoss, setStopLoss] = useState(4);
  const [maxProfit, setMaxProfit] = useState(18);
  const [maxLoss, setMaxLoss] = useState(7);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [coinModalOpen, setCoinModalOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("overview");

  // ✅ NEW: AI start popup state
  const [aiFlowOpen, setAiFlowOpen] = useState(false);

  const riskGrade = useMemo(() => {
    const coinsCount = systemSelect ? 2 : Math.max(1, selectedCoins.length);
    const coinsFactor = Math.min(3, coinsCount) * 1.2;
    const durFactor =
      duration === "1 day" ? 1.8 : duration === "3 days" ? 1.5 : duration === "7 days" ? 1.2 : 1.0;
    const tpFactor = tpEnabled ? Math.min(2.5, takeProfit / 6) : 0.8;
    const slFactor = slEnabled ? Math.max(0.8, 6 / Math.max(1, stopLoss)) : 1.7;
    const score = coinsFactor * durFactor * tpFactor * slFactor;

    if (score >= 5.2) return { label: "Aggressive", tone: "bad" };
    if (score >= 3.6) return { label: "Balanced", tone: "warn" };
    return { label: "Conservative", tone: "ok" };
  }, [selectedCoins.length, duration, tpEnabled, takeProfit, slEnabled, stopLoss, systemSelect]);

  const coinSummary = useMemo(() => {
    if (systemSelect) return "System selects randomly";
    if (selectedCoins.length === 0) return "Select coins";
    if (selectedCoins.length <= 2) return selectedCoins.join(", ");
    return `${selectedCoins.slice(0, 2).join(", ")} +${selectedCoins.length - 2}`;
  }, [selectedCoins, systemSelect]);

  const headerContent = useMemo(() => {
    switch (activeNav) {
      case "overview":
        return {
          title: "GoldMiracle AI Dashboard",
          subtitle: "AI-assisted multi-asset execution • configurable duration • TP/SL safeguards • neutral, factual reporting"
        };
      case "markets":
        return {
          title: "Market Analysis",
          subtitle: "Real-time market data and trends • S&P 500 benchmark • cryptocurrency structure • volatility tracking"
        };
      case "ai-trading":
        return {
          title: "AI Trading Setup",
          subtitle: "Configure automated trading strategies • multi-coin selection • risk management controls • execution parameters"
        };
      case "portfolio":
        return {
          title: "Portfolio Management",
          subtitle: "Track holdings and performance • asset allocation • profit/loss monitoring • real-time valuations"
        };
      case "reports":
        return {
          title: "AI Insights & Reports",
          subtitle: "Data-driven analysis • market signals • execution strategies • confidence metrics and forecasts"
        };
      case "support":
        return {
          title: "Support Center",
          subtitle: "Get help and assistance • 24/7 support • documentation • contact our team"
        };
      case "settings":
        return {
          title: "Account Settings",
          subtitle: "Manage preferences • security settings • API configuration • notification controls"
        };
      default:
        return {
          title: "GoldMiracle AI Dashboard",
          subtitle: "AI-assisted multi-asset execution • configurable duration • TP/SL safeguards • neutral, factual reporting"
        };
    }
  }, [activeNav]);

  // ✅ NEW: current balance (uses USDT qty from your existing portfolio demo)
  const currentBalance = useMemo(() => {
    const usdt = portfolio.find((p) => p.asset === "USDT");
    return Number(usdt?.qty || 0);
  }, [portfolio]);

  return (
    <div className={cls("gmAI", sidebarOpen && "sidebarOpen")}>
      <div className="gmAmbient" aria-hidden="true" />
      <div className="gmNoise" aria-hidden="true" />

      <div className="gmSideOverlay" onClick={() => setSidebarOpen(false)} aria-hidden="true" />

      <aside className="gmSide">
        <div className="gmBrand">
          <div className="gmLogo" aria-hidden="true">
            <span className="gmLogoDot" />
          </div>
          <div className="gmBrandTxt">
            <div className="gmBrandTop">GoldMiracle</div>
            <div className="gmBrandSub">AI Trading</div>
          </div>
        </div>

        <nav className="gmNav">
          <button className={cls("gmNavItem", activeNav === "overview" && "active")} onClick={() => { setActiveNav("overview"); setSidebarOpen(false); }}>
            <span className="ic">▣</span> Overview
          </button>
          <button className={cls("gmNavItem", activeNav === "ai-trading" && "active")} onClick={() => { setActiveNav("ai-trading"); setSidebarOpen(false); }}>
            <span className="ic">⟡</span> AI Trading
          </button>
          <button className={cls("gmNavItem", activeNav === "markets" && "active")} onClick={() => { setActiveNav("markets"); setSidebarOpen(false); }}>
            <span className="ic">↗</span> Markets
          </button>
          <button className={cls("gmNavItem", activeNav === "portfolio" && "active")} onClick={() => { setActiveNav("portfolio"); setSidebarOpen(false); }}>
            <span className="ic">◷</span> Portfolio
          </button>
          <button className={cls("gmNavItem", activeNav === "reports" && "active")} onClick={() => { setActiveNav("reports"); setSidebarOpen(false); }}>
            <span className="ic">≋</span> Reports
          </button>

          <div className="gmNavSep" />

          <button className={cls("gmNavItem", activeNav === "support" && "active")} onClick={() => { setActiveNav("support"); setSidebarOpen(false); }}>
            <span className="ic">☰</span> Support
          </button>
          <button className={cls("gmNavItem", activeNav === "settings" && "active")} onClick={() => { setActiveNav("settings"); setSidebarOpen(false); }}>
            <span className="ic">⚙</span> Settings
          </button>
        </nav>

        <div className="gmSideFoot">
          <div className="gmMiniCard">
            <div className="gmMiniTitle">AI Model Status</div>
            <div className="gmMiniRow">
              <span className="dot ok" />
              <span>Signal engine online</span>
            </div>
            <div className="gmMiniRow">
              <span className="dot warn" />
              <span>Latency: 120–180ms</span>
            </div>
            <div className="gmMiniHint">Data window: last 6 months</div>
          </div>
        </div>
      </aside>

      <main className="gmMain">
        <header className="gmTop">
          <div className="gmTopLeft">
            <div className="gmTopRow">
              <button className="gmBurger" type="button" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
                ☰
              </button>

              <div className="gmPageTitle">
                {headerContent.title}
                <span className="gmBadge">Finance-grade UI</span>
              </div>
            </div>

            <div className="gmPageSub">
              {headerContent.subtitle}
            </div>
          </div>

          <div className="gmTopRight">
            <div className="gmSearch">
              <span className="gmSearchIc">⌕</span>
              <input placeholder="Search markets, assets, reports..." />
            </div>

            <button className="gmBackBtn" type="button" onClick={() => navigate(-1)} aria-label="Go back" title="Back to previous page">
              ← Back
            </button>

            <div className="gmUser">
              <div className="gmUserMeta">
                <div className="gmUserName">Member</div>
                <div className="gmUserRole">Verified</div>
              </div>
              <div className="gmAvatar" aria-hidden="true">
                <span />
              </div>
            </div>
          </div>
        </header>

        {activeNav === "overview" && (
          <section className="gmTickers">
            {tickers.map((t) => (
              <div key={t.sym} className="gmTicker">
                <div className="gmTickerTop">
                  <div className="gmTickerSym">{t.sym}</div>
                  <div className={cls("gmChg", t.chg >= 0 ? "pos" : "neg")}>{pct(t.chg)}</div>
                </div>
                <div className="gmTickerPx">{money(t.px, 2)}</div>
                <div className="gmTickerName">{t.name}</div>
              </div>
            ))}

            <div className="gmTicker gmTickerWide">
              <div className="gmTickerTop">
                <div className="gmTickerSym">AI Trading Advantage</div>
                <div className="gmPill">Manual vs AI</div>
              </div>
              <div className="gmWideText">
                Manual trading is limited by human attention and speed. GoldMiracle AI evaluates multi-coin signals
                concurrently, scoring setups using a rolling 6-month market window and enforcing your configured TP/SL
                boundaries.
              </div>
              <div className="gmWideChips">
                <span className="chip">Multi-asset scanning</span>
                <span className="chip">Rule-based risk caps</span>
                <span className="chip">Consistent execution</span>
                <span className="chip">Duration controls</span>
              </div>
            </div>
          </section>
        )}

        {activeNav === "markets" && (
          <section className="gmGrid">
            <div className="gmPanel span2">
              <div className="gmPanelHead">
                <div>
                  <div className="gmH">Market Benchmark</div>
                  <div className="gmS">S&amp;P 500 trend over the last 6 months (reference curve)</div>
                </div>
                <div className="gmHeadRight">
                  <div className="gmStat">
                    <div className="k">Volatility</div>
                    <div className="v">Low–Moderate</div>
                  </div>
                  <div className="gmStat">
                    <div className="k">Breadth</div>
                    <div className="v">Tech-led</div>
                  </div>
                </div>
              </div>
              <LineChart data={sp6m} height={240} />
            </div>

            <div className="gmPanel span2">
              <div className="gmPanelHead">
                <div>
                  <div className="gmH">Crypto Structure</div>
                  <div className="gmS">Bitcoin candlesticks with realistic intraday swings</div>
                </div>
                <div className="gmHeadRight">
                  <div className="gmStat">
                    <div className="k">Trend</div>
                    <div className="v">Neutral-to-Up</div>
                  </div>
                  <div className="gmStat">
                    <div className="k">Liquidity</div>
                    <div className="v">High</div>
                  </div>
                </div>
              </div>
              <CandleChart candles={btcCandles} height={280} />
            </div>
          </section>
        )}

        {activeNav === "ai-trading" && (
          <section className="gmGrid">
            <div className="gmPanel gmWhitePanel span4">
              <div className="gmPanelHead gmWhiteHead">
                <div>
                  <div className="gmH gmDarkText">AI Trading Setup</div>
                  <div className="gmS gmDarkSub">
                    Select one or multiple coins. AI analyzes the last 6 months of market behavior and executes within your
                    configured limits.
                  </div>
                </div>
                <div className={cls("gmRiskTag", "gmRiskTagWhite", riskGrade.tone)}>
                  Risk: <b>{riskGrade.label}</b>
                </div>
              </div>

              <div className="gmControls gmWhiteBody">
                <div className="gmControlBlock gmWhiteCard">
                  <div className="gmLabel gmDarkText">Coins (multi-select)</div>

                  <button
                    type="button"
                    className="gmPickerBtn"
                    onClick={() => setCoinModalOpen(true)}
                    aria-label="Open coin selection"
                  >
                    <div className="left">
                      <div className="title">Selected</div>
                      <div className="value">{coinSummary}</div>
                    </div>
                    <div className="right">
                      <span className={cls("gmSysBadge", systemSelect && "on")}>{systemSelect ? "System" : "Manual"}</span>
                      <span className="chev">▾</span>
                    </div>
                  </button>

                  <div className="gmHint gmDarkHint">
                    Tap to open the coin list. You can select multiple coins, or enable system selection to choose randomly.
                  </div>
                </div>

                <div className="gmControlRow">
                  <div className="gmField gmWhiteCard">
                    <div className="gmLabel gmDarkText">Amount & Duration</div>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                      <div style={{ flex: '1' }}>
                        <div className="gmInput gmInputWhite" style={{ marginTop: '0' }}>
                          <span className="pre">$</span>
                          <input 
                            type="number" 
                            value={amount} 
                            onChange={(e) => setAmount(Number(e.target.value || 0))} 
                            placeholder="Amount"
                          />
                        </div>
                      </div>
                      <div style={{ flex: '1' }}>
                        <div className="gmSelect gmSelectWhite" style={{ marginTop: '0' }}>
                          <select value={duration} onChange={(e) => setDuration(e.target.value)}>
                            {durations.map((d) => (
                              <option key={d} value={d}>
                                {d}
                              </option>
                            ))}
                          </select>
                          <span className="caret">▾</span>
                        </div>
                      </div>
                    </div>
                    <div className="gmHint gmDarkHint">Investment amount and execution window for AI trading setup.</div>
                  </div>

                  <div className="gmField gmWhiteCard">
                    <div className="gmLabel gmDarkText">Mode</div>
                    <div className="gmMode">
                      <div className="gmModeCard on">
                        <div className="t">AI Trading</div>
                        <div className="s">Automated signals + rule guards</div>
                      </div>
                      <div className="gmModeCard">
                        <div className="t">Manual</div>
                        <div className="s">Limited to single focus &amp; speed</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="gmControlRow">
                  <div className="gmField gmWhiteCard">
                    <div className="gmLabelRow gmDarkText">
                      <span>Take Profit (TP)</span>
                      <label className="gmToggle gmToggleWhite">
                        <input type="checkbox" checked={tpEnabled} onChange={(e) => setTpEnabled(e.target.checked)} />
                        <span />
                      </label>
                    </div>

                    <div className={cls("gmSliderWrap gmSliderWhite", !tpEnabled && "disabled")}>
                      <input
                        type="range"
                        min="1"
                        max="30"
                        value={takeProfit}
                        onChange={(e) => setTakeProfit(Number(e.target.value))}
                        disabled={!tpEnabled}
                      />
                      <div className="gmSliderMeta gmDarkHint">
                        <span>1%</span>
                        <b className="gmDarkText">{takeProfit}%</b>
                        <span>30%</span>
                      </div>
                    </div>

                    <div className="gmHint gmDarkHint">Binance-style TP boundary: closes positions at target profit.</div>
                  </div>

                  <div className="gmField gmWhiteCard">
                    <div className="gmLabelRow gmDarkText">
                      <span>Stop Loss (SL)</span>
                      <label className="gmToggle gmToggleWhite">
                        <input type="checkbox" checked={slEnabled} onChange={(e) => setSlEnabled(e.target.checked)} />
                        <span />
                      </label>
                    </div>

                    <div className={cls("gmSliderWrap gmSliderWhite", !slEnabled && "disabled")}>
                      <input
                        type="range"
                        min="1"
                        max="20"
                        value={stopLoss}
                        onChange={(e) => setStopLoss(Number(e.target.value))}
                        disabled={!slEnabled}
                      />
                      <div className="gmSliderMeta gmDarkHint">
                        <span>1%</span>
                        <b className="gmDarkText">{stopLoss}%</b>
                        <span>20%</span>
                      </div>
                    </div>

                    <div className="gmHint gmDarkHint">SL boundary: limits downside by exiting after defined loss.</div>
                  </div>
                </div>

                <div className="gmControlRow">
                  <div className="gmField gmWhiteCard">
                    <div className="gmLabel gmDarkText">Max Profit Cap (strategy-level)</div>
                    <div className="gmInput gmInputWhite">
                      <span className="pre">%</span>
                      <input value={maxProfit} onChange={(e) => setMaxProfit(Number(e.target.value || 0))} />
                    </div>
                    <div className="gmHint gmDarkHint">Stops trading once overall profit cap is reached.</div>
                  </div>

                  <div className="gmField gmWhiteCard">
                    <div className="gmLabel gmDarkText">Max Loss Cap (strategy-level)</div>
                    <div className="gmInput gmInputWhite">
                      <span className="pre">%</span>
                      <input value={maxLoss} onChange={(e) => setMaxLoss(Number(e.target.value || 0))} />
                    </div>
                    <div className="gmHint gmDarkHint">Halts execution if drawdown reaches your configured limit.</div>
                  </div>
                </div>

                <div className="gmActions gmActionsWhite">
                  <button className="gmBtn ghost" type="button">
                    Save Preset
                  </button>

                  {/* ✅ ONLY CHANGE: onClick opens the smart flow popup */}
                  <button className="gmBtn gmBtnBinance" type="button" onClick={() => setAiFlowOpen(true)}>
                    Start AI Trading
                    <span className="shine" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {activeNav === "reports" && (
          <section className="gmGrid">
            <div className="gmPanel span4">
              <div className="gmPanelHead">
                <div>
                  <div className="gmH">AI Insights</div>
                  <div className="gmS">Concise, analyst-style notes based on a 6-month feature window</div>
                </div>
              </div>

              <div className="gmInsights">
                <div className="gmInsight">
                  <div className="tag">Macro</div>
                  <div className="txt">
                    AI model indicates <b>moderate growth bias</b> in large-cap tech over the next quarter, with volatility
                    clustering remaining elevated around earnings windows.
                  </div>
                  <div className="meta">Confidence: Medium • Horizon: 4–12 weeks</div>
                </div>

                <div className="gmInsight">
                  <div className="tag">Crypto</div>
                  <div className="txt">
                    Bitcoin structure shows <b>higher lows</b> with intermittent pullbacks. AI prefers breakout confirmations
                    when volume expands above prior resistance bands.
                  </div>
                  <div className="meta">Confidence: Medium-High • Horizon: 1–3 weeks</div>
                </div>

                <div className="gmInsight">
                  <div className="tag">Execution</div>
                  <div className="txt">
                    Multi-coin routing improves opportunity coverage, while risk stays bounded by configured <b>TP/SL</b> and
                    strategy-level caps. Assets with widening spreads are deprioritized.
                  </div>
                  <div className="meta">Controls active: TP/SL • Caps: enabled</div>
                </div>

                <div className="gmInsightNote">
                  <div className="t">Why AI trading is structurally stronger than manual trading</div>
                  <ul>
                    <li>Simultaneous scanning across multiple coins (no single-focus limitation).</li>
                    <li>Consistent rules and execution reduces emotional decision-making.</li>
                    <li>Uses a rolling 6-month dataset to adapt to changing regimes.</li>
                    <li>Enforces profit/loss limits to manage drawdowns.</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>
        )}

        {activeNav === "portfolio" && (
          <section className="gmGrid">
            <div className="gmPanel span4">
              <div className="gmPanelHead">
                <div>
                  <div className="gmH">Portfolio Summary</div>
                  <div className="gmS">Holdings, allocation, and performance indicators</div>
                </div>
                <div className="gmHeadRight">
                  <div className="gmStat">
                    <div className="k">Net Value</div>
                    <div className="v">{money(28750, 0)}</div>
                  </div>
                  <div className="gmStat">
                    <div className="k">Daily P/L</div>
                    <div className="v pos">{pct(1.18)}</div>
                  </div>
                </div>
              </div>

              <div className="gmTableWrap">
                <div className="gmTableScroll">
                  <table className="gmTable">
                    <thead>
                      <tr>
                        <th>Asset</th>
                        <th>Name</th>
                        <th className="r">Allocation</th>
                        <th className="r">Quantity</th>
                        <th className="r">Avg Cost</th>
                        <th className="r">Last</th>
                        <th className="r">P/L</th>
                      </tr>
                    </thead>
                    <tbody>
                      {portfolio.map((p) => (
                        <tr key={p.asset}>
                          <td><span className="gmAsset">{p.asset}</span></td>
                          <td className="mut">{p.name}</td>
                          <td className="r">{p.alloc.toFixed(1)}%</td>
                          <td className="r">{nfmt(p.qty, p.asset === "BTC" ? 2 : p.asset === "USDT" ? 0 : 2)}</td>
                          <td className="r">{money(p.avg, p.asset === "USDT" ? 2 : 0)}</td>
                          <td className="r">{money(p.px, p.asset === "USDT" ? 2 : p.asset === "ETH" ? 0 : 1)}</td>
                          <td className={cls("r", p.pl >= 0 ? "pos" : "neg")}>{pct(p.pl)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="gmTableHint">Indicators are UI demo only. Replace with backend values later.</div>
              </div>
            </div>
          </section>
        )}

        {activeNav === "support" && (
          <section className="gmGrid">
            <div className="gmPanel span2">
              <div className="gmPanelHead">
                <div>
                  <div className="gmH">Support Center</div>
                  <div className="gmS">Get help and contact our support team</div>
                </div>
              </div>
              <div className="gmInsights">
                <div className="gmInsightNote">
                  <div className="t">Support section coming soon</div>
                  <ul>
                    <li>24/7 Live chat support</li>
                    <li>Email support: support@goldmiracle.com</li>
                    <li>FAQ and knowledge base</li>
                    <li>Video tutorials</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>
        )}

        {activeNav === "settings" && (
          <section className="gmGrid">
            <div className="gmPanel span2">
              <div className="gmPanelHead">
                <div>
                  <div className="gmH">Settings</div>
                  <div className="gmS">Manage your account preferences and configurations</div>
                </div>
              </div>
              <div className="gmInsights">
                <div className="gmInsightNote">
                  <div className="t">Settings section coming soon</div>
                  <ul>
                    <li>Account preferences</li>
                    <li>Notification settings</li>
                    <li>API key management</li>
                    <li>Security settings</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>
        )}

        <footer className="gmFooter">
          <div className="gmFootLeft">
            <span className="dot ok" /> Market data: demo
            <span className="sep">•</span>
            Risk controls: UI only
            <span className="sep">•</span>
            Execution: backend pending
          </div>
          <div className="gmFootRight">GoldMiracle AI • Professional trading dashboard UI</div>
        </footer>
      </main>

      <CoinPickerModal
        open={coinModalOpen}
        onClose={() => setCoinModalOpen(false)}
        coinOptions={coinOptions}
        selectedCoins={selectedCoins}
        setSelectedCoins={setSelectedCoins}
        systemSelect={systemSelect}
        setSystemSelect={(v) => {
          setSystemSelect(v);
        }}
      />

      {/* ✅ NEW: Smart AI activation flow */}
      <AiStartFlowModal
        open={aiFlowOpen}
        onClose={() => setAiFlowOpen(false)}
        currentBalance={currentBalance}
        durationLabel={duration}
        onApplyAmount={(n) => setAmount(Number(n))}
      />
    </div>
  );
}