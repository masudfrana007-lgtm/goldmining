import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./TradingDashboardGoldMiracle.css";

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
function compact(n) {
  const num = Number(n || 0);
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(num);
}
function pct(n) {
  const num = Number(n || 0);
  return `${num >= 0 ? "+" : ""}${num.toFixed(2)}%`;
}

/** tiny sparkline */
function buildLine(values, w, h, pad = 10) {
  const arr = (values || []).map((x) => Number(x || 0));
  const min = Math.min(...arr);
  const max = Math.max(...arr);
  const span = Math.max(1e-9, max - min);

  const innerW = w - pad * 2;
  const innerH = h - pad * 2;

  const pts = arr.map((v, i) => {
    const x = pad + (innerW * i) / Math.max(1, arr.length - 1);
    const y = pad + innerH - ((v - min) / span) * innerH;
    return { x, y, v };
  });

  const pointsStr = pts.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
  const areaStr =
    `M ${pts[0].x.toFixed(2)} ${h - pad} ` +
    pts.map((p) => `L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ") +
    ` L ${pts[pts.length - 1].x.toFixed(2)} ${h - pad} Z`;

  return { pointsStr, areaStr, pts };
}

/** Inline icons (no libs) */
function Icon({ name }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
  };

  switch (name) {
    case "support":
      return (
        <svg {...common}>
          <path
            d="M4 12a8 8 0 0 1 16 0v4a2 2 0 0 1-2 2h-1"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M6 12v4a2 2 0 0 0 2 2h2"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path d="M9 20h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "add":
      return (
        <svg {...common}>
          <path d="M12 5v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "send":
      return (
        <svg {...common}>
          <path
            d="M22 2 11 13"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M22 2 15 22 11 13 2 9 22 2Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "request":
      return (
        <svg {...common}>
          <path d="M12 3v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M8 7l4-4 4 4" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <path d="M4 21h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "bill":
      return (
        <svg {...common}>
          <path d="M7 3h10v18l-2-1-3 1-3-1-2 1V3Z" stroke="currentColor" strokeWidth="2" />
          <path d="M9 7h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M9 11h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M9 15h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "trade":
      return (
        <svg {...common}>
          <path d="M7 7h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M7 7l3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M17 17H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M17 17l-3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "deposit":
      return (
        <svg {...common}>
          <path d="M12 3v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M8 7l4-4 4 4" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <path d="M4 21h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "withdraw":
      return (
        <svg {...common}>
          <path d="M12 21V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M8 13l4-4 4 4" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <path d="M4 3h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "orders":
      return (
        <svg {...common}>
          <path d="M7 7h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M7 12h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M7 17h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "ai":
      return (
        <svg {...common}>
          <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <path d="M2 17l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
        </svg>
      );
    default:
      return null;
  }
}

export default function TradingDashboardGoldMiracle() {
  const nav = useNavigate();
  const go = (to) => to && nav(to);

  const [user] = useState({
    name: "Lyndsey Noel",
    memberId: "GM-284193",
    lastLogin: "2026-02-21 22:55",
    avatar: "/gm/avatar.png",
  });

  const [account] = useState({
    balance: 12850.42,
    available: 10210.14,
    locked: 2640.28,
    equity: 101420.66,
    marginUsed: 18450.2,
    currency: "USDT",
  });

  // Trading-like market snapshot (demo)
  const market = useMemo(
    () => ({
      symbol: "ETHUSDT",
      last: 3620.52,
      chg: 2.41,
      high: 3710.1,
      low: 3482.7,
      vol: 128456789.12,
      bid: 3619.92,
      ask: 3620.58,
    }),
    []
  );

  // Account summary (demo)
  const summary = useMemo(
    () => ({
      equity: account.equity,
      funding: 0.01,
      nextIn: "04:18:30",
      available: 82970.46,
      usedMargin: 18450.2,
      upnl: 315.67,
      today: 306.02,
      risk: 18.2,
      riskLabel: "Low",
    }),
    [account.equity]
  );

  const spread = useMemo(() => {
    const s = (market.ask || 0) - (market.bid || 0);
    const mid = market.ask && market.bid ? (market.ask + market.bid) / 2 : 0;
    const sp = mid ? (s / mid) * 100 : 0;
    return { s, sp };
  }, [market]);

  const spark = useMemo(() => ({ values: [3510, 3540, 3490, 3560, 3602, 3588, 3620] }), []);
  const chart = useMemo(() => buildLine(spark.values, 520, 140, 12), [spark.values]);

  const positions = useMemo(
    () => [
      { id: "POS-1902", sym: "ETHUSDT", side: "UP", entry: 3520.4, mark: 3620.5, size: 0.42, lev: 5, pnl: 42.85, pnlPct: 2.91 },
      { id: "POS-1877", sym: "BTCUSDT", side: "DOWN", entry: 61820.0, mark: 61234.1, size: 0.06, lev: 3, pnl: 18.2, pnlPct: 1.44 },
    ],
    []
  );

  const openOrders = useMemo(
    () => [
      { id: "OD-1102", sym: "ETHUSDT", side: "UP", type: "LIMIT", price: 3608.2, amount: 0.15, status: "Open" },
      { id: "OD-1188", sym: "BTCUSDT", side: "DOWN", type: "LIMIT", price: 61010.0, amount: 0.02, status: "Open" },
    ],
    []
  );

  const recent = useMemo(
    () => [
      { id: "TR-2003", sym: "BTCUSDT", side: "DOWN", type: "MARKET", price: 61234.1, amount: 0.02, status: "Filled" },
      { id: "TR-2091", sym: "ETHUSDT", side: "UP", type: "MARKET", price: 3619.8, amount: 0.10, status: "Filled" },
    ],
    []
  );

  const chgUp = (market.chg || 0) >= 0;

  return (
    <div className="tdDash">
      <div className="tdVignette" aria-hidden="true" />

      {/* ✅ MINING-STYLE TOP BAR */}
      <header className="tdTopMining">
        <div className="tdTopLeft">
          <div className="tdTopOrb" aria-hidden="true">
            <span className="tdTopOrbGlow" />
          </div>
          <div className="tdTopTitle">GoldMiracle</div>
        </div>

        {/* ✅ Customer Support -> CustomerService */}
        <button className="tdSupportPill" onClick={() => go("/customer-service")} type="button" title="Customer Support">
          <span className="tdSupportPillIco">
            <Icon name="support" />
          </span>
          Customer Support
        </button>
      </header>

      <main className="tdWrap">
        {/* ✅ MINING-STYLE WELCOME CARD */}
        <section className="tdWelcomeMining tdCard">
          <div className="tdWelcomeLeft">
            <div className="tdWelcomeTitle">
              Welcome back, <span className="tdWelcomeName">{user.name}</span>
            </div>
            <div className="tdWelcomeSub">
              Member ID: <b>{user.memberId}</b> • Last login: {user.lastLogin}
            </div>
          </div>

          {/* need Ai reading button and click korle /member/ai-dashboard */}
          <button className="tdAiReadingBtn" onClick={() => go("/member/ai-dashboard")} type="button">
            <span className="tdAiIcon">
              <Icon name="ai" />
            </span>
            AI Reading
          </button>

          <div className="tdWelcomeRight">
            <div className="tdAvatar" title="Your profile">
              <img
                src={user.avatar}
                alt="profile"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
              <div className="tdAvatarFallback">{user.name.slice(0, 1).toUpperCase()}</div>
            </div>

            <button className="tdGhostBtn" onClick={() => go("/settings")} type="button">
              Profile
            </button>
            <button className="tdGhostBtn" onClick={() => go("/security")} type="button">
              Security
            </button>
          </div>
        </section>

        {/* ✅ MINING-STYLE BALANCE/ACTIONS CARD */}
        <section className="tdMiningHero tdCard">
          <div className="tdMiningHeroTop">
            <div>
              <div className="tdHello">
                Hello, <b>{user.name.split(" ")[0]}</b>
              </div>
              <div className="tdBigBal">
                <span className="tdBigDollar">$</span>
                <span className="tdBigNum">{nfmt(account.balance, 2)}</span>
                <span className="tdBigDec">.00</span>
                <span className="tdBigChg">{"+3.41%"}</span>
              </div>

              <div className="tdAvailRow">
                <span>
                  Available: <b>{nfmt(account.available, 2)} {account.currency}</b>
                </span>
                <span className="tdDot" />
                <span>
                  Locked: <b>{nfmt(account.locked, 2)} {account.currency}</b>
                </span>
              </div>
            </div>

            <div className="tdActivePill">
              <span className="tdActiveDot" />
              Active
            </div>
          </div>

          <div className="tdMiningActions">
  {/* ✅ Add -> MemberDeposit */}
  <button className="tdMAction" type="button" onClick={() => go("/member/deposit")}>
    <span className="tdMIcon"><Icon name="add" /></span>
    <span className="tdMText">Deposit</span>
  </button>

  {/* ✅ Send -> WithdrawalMethod */}
  <button className="tdMAction" type="button" onClick={() => go("/member/withdrawal-method")}>
    <span className="tdMIcon"><Icon name="request" /></span>
    <span className="tdMText">Withdraw</span>
  </button>

  <button className="tdMAction" type="button" onClick={() => go("/records")}>
    <span className="tdMIcon"><Icon name="bill" /></span>
    <span className="tdMText">Records</span>
  </button>
</div>
        </section>

        {/* MAIN GRID */}
        <section className="tdGrid">
          {/* LEFT COLUMN */}
          <div className="tdLeftCol">
            {/* ✅ Account Summary (NOW GRID VIEW) */}
            <section className="tdCard tdSummaryCard">
              <div className="tdSummaryHead">
                <div className="tdSummaryTitle">Account Summary</div>
                <div className="tdSummaryMeta">
                  <span>
                    Equity <b>{nfmt(summary.equity, 2)}</b>
                  </span>
                  <span className="tdDotSm" />
                  <span>
                    Funding <b>{summary.funding >= 0 ? "+" : ""}{summary.funding.toFixed(2)}%</b>
                  </span>
                  <span className="tdDotSm" />
                  <span className="tdClockPill">
                    <span className="tdClockDot" />
                    {summary.nextIn}
                  </span>
                </div>
              </div>

              <div className="tdSummaryGrid">
                <div className="tdSumTile">
                  <div className="k">Available</div>
                  <div className="v">{nfmt(summary.available, 2)} <span>{account.currency}</span></div>
                </div>

                <div className="tdSumTile">
                  <div className="k">Used Margin</div>
                  <div className="v">{nfmt(summary.usedMargin, 2)} <span>{account.currency}</span></div>
                </div>

                <div className={cls("tdSumTile", summary.upnl >= 0 ? "pos" : "neg")}>
                  <div className="k">Unrealized PnL</div>
                  <div className="v">{summary.upnl >= 0 ? "+" : ""}{nfmt(summary.upnl, 2)} <span>{account.currency}</span></div>
                </div>

                <div className={cls("tdSumTile", summary.today >= 0 ? "pos" : "neg")}>
                  <div className="k">Today PnL</div>
                  <div className="v">{summary.today >= 0 ? "+" : ""}{nfmt(summary.today, 2)} <span>{account.currency}</span></div>
                </div>

                <div className="tdSumTile tdRiskTile">
                  <div className="tdRiskTop">
                    <div>
                      <div className="k">Risk</div>
                      <div className="v">
                        {summary.risk.toFixed(1)}%{" "}
                        <span
                          className={cls(
                            "tdRiskTag",
                            summary.risk <= 25 ? "low" : summary.risk <= 50 ? "mid" : "high"
                          )}
                        >
                          {summary.riskLabel}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="tdRiskBar">
                    <div
                      className={cls("tdRiskFill", summary.risk <= 25 ? "low" : summary.risk <= 50 ? "mid" : "high")}
                      style={{ width: `${Math.max(0, Math.min(100, summary.risk))}%` }}
                    />
                  </div>
                </div>

                <div className="tdSumTile tdSumCTA">
                  <div className="k">Quick</div>
                  <div className="tdSumBtns">
                    <button className="tdGhostBtn sm" onClick={() => go("/trading")} type="button">
                      Open Trading
                    </button>
                    <button className="tdPrimaryBtn tdPrimaryBtnSm" onClick={() => go("/trading")} type="button">
                      Trade Now
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Trading summary card (your premium hero) */}
            <section className="tdCard tdHero">
              <div className="tdHeroTop">
                <div className="tdPair">
                  <div className="tdPairSym">
                    {market.symbol.replace("USDT", "")} / {account.currency}
                  </div>
                  <div className={cls("tdPairChg", chgUp ? "up" : "down")}>{pct(market.chg)}</div>
                </div>

                <div className="tdBalanceBox">
                  <div className="tdBLabel">Balance</div>
                  <div className="tdBVal">
                    {nfmt(account.balance, 2)} <span>{account.currency}</span>
                  </div>
                </div>
              </div>

              <div className="tdHeroMid">
                <div className="tdPrice">
                  <div className="tdK">Last Price</div>
                  <div className="tdV">{nfmt(market.last, market.last >= 1000 ? 2 : 4)}</div>

                  <div className="tdMiniBA">
                    <span>Bid</span>
                    <b className="g">{market.bid ? nfmt(market.bid, 2) : "—"}</b>
                    <span className="sep" />
                    <span>Ask</span>
                    <b className="r">{market.ask ? nfmt(market.ask, 2) : "—"}</b>
                  </div>

                  <div className="tdSpread">
                    Spread: <b>{nfmt(spread.s, 4)}</b> ({spread.sp ? spread.sp.toFixed(3) : "0.000"}%)
                  </div>
                </div>

                <div className="tdChartMini" aria-hidden="true">
                  <svg className="tdSvg" viewBox="0 0 520 140" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="tdArea" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="rgba(0,231,156,.36)" />
                        <stop offset="100%" stopColor="rgba(91,178,255,.22)" />
                      </linearGradient>
                      <linearGradient id="tdLine" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="rgba(0,231,156,.95)" />
                        <stop offset="100%" stopColor="rgba(255,216,74,.88)" />
                      </linearGradient>
                    </defs>

                    <path d="M12 40 H508" className="tdGridLine" />
                    <path d="M12 80 H508" className="tdGridLine" />
                    <path d="M12 120 H508" className="tdGridLine" />

                    <path d={chart.areaStr} fill="url(#tdArea)" opacity="0.18" />
                    <polyline
                      points={chart.pointsStr}
                      fill="none"
                      stroke="url(#tdLine)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>

                  <div className="tdChartHint">7-step preview • Open chart to trade</div>

                  <div className="tdChartBtns">
                    <button className="tdGhostBtn sm" onClick={() => go("/trading")} type="button">
                      Open Trading
                    </button>
                    <button className="tdPrimaryBtn" onClick={() => go("/trading")} type="button">
                      Trade Now
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick actions (trading focused) */}
              <div className="tdQuick">
                <button className="tdAction tone-green" onClick={() => go("/trading")} type="button">
                  <span className="tdAIcon"><Icon name="trade" /></span>
                  <span className="tdATxt">
                    <span className="tdATitle">Trade</span>
                    <span className="tdASub">Open terminal</span>
                  </span>
                  <span className="tdArr">→</span>
                </button>

                {/* ✅ Deposit -> MemberDeposit */}
                <button className="tdAction tone-blue" onClick={() => go("/member/deposit")} type="button">
                  <span className="tdAIcon"><Icon name="deposit" /></span>
                  <span className="tdATxt">
                    <span className="tdATitle">Deposit</span>
                    <span className="tdASub">Add funds</span>
                  </span>
                  <span className="tdArr">→</span>
                </button>

                {/* ✅ Withdraw -> WithdrawalMethod */}
                <button className="tdAction tone-gold" onClick={() => go("/member/withdrawal-method")} type="button">
                  <span className="tdAIcon"><Icon name="withdraw" /></span>
                  <span className="tdATxt">
                    <span className="tdATitle">Withdraw</span>
                    <span className="tdASub">Request payout</span>
                  </span>
                  <span className="tdArr">→</span>
                </button>

                <button className="tdAction tone-gray" onClick={() => go("/orders")} type="button">
                  <span className="tdAIcon"><Icon name="orders" /></span>
                  <span className="tdATxt">
                    <span className="tdATitle">Orders</span>
                    <span className="tdASub">Open & history</span>
                  </span>
                  <span className="tdArr">→</span>
                </button>
              </div>

              {/* Small metrics row */}
              <div className="tdMiniStats">
                <div className="tdMS">
                  <div className="k">Equity</div>
                  <div className="v">{nfmt(account.equity, 2)} USDT</div>
                </div>
                <div className="tdMS">
                  <div className="k">Margin Used</div>
                  <div className="v">{nfmt(account.marginUsed, 2)} USDT</div>
                </div>
                <div className="tdMS">
                  <div className="k">24h Volume</div>
                  <div className="v">{compact(market.vol)}</div>
                </div>
                <div className="tdMS">
                  <div className="k">24h Range</div>
                  <div className="v">
                    {nfmt(market.low, 2)} – {nfmt(market.high, 2)}
                  </div>
                </div>
              </div>
            </section>

            {/* Positions */}
            <section className="tdSection">
              <div className="tdSectionHead">
                <div>
                  <div className="tdSectionTitle">Open Positions</div>
                  <div className="tdSectionSub">Live PnL and leverage overview</div>
                </div>
                <button className="tdGhostBtn" onClick={() => go("/positions")} type="button">
                  View all
                </button>
              </div>

              <div className="tdCard tdList">
                {positions.map((p) => {
                  const up = (p.pnl || 0) >= 0;
                  return (
                    <div key={p.id} className="tdRow">
                      <div className={cls("tdTag", p.side === "UP" ? "up" : "down")}>{p.side}</div>

                      <div className="tdRowMain">
                        <div className="tdRowTop">
                          <div className="tdRowTitle">{p.sym.replace("USDT", "")}/USDT</div>
                          <div className={cls("tdPnl", up ? "up" : "down")}>
                            {up ? "+" : ""}
                            {nfmt(p.pnl, 2)} <span>USDT</span>
                          </div>
                        </div>
                        <div className="tdRowMeta">
                          Entry <b>{nfmt(p.entry, 2)}</b> • Mark <b>{nfmt(p.mark, 2)}</b> • Size <b>{p.size}</b> • Lev{" "}
                          <b>{p.lev}x</b>
                        </div>
                      </div>

                      <div className="tdRowRight">
                        <div className={cls("tdPct", up ? "up" : "down")}>
                          {up ? "+" : ""}
                          {p.pnlPct.toFixed(2)}%
                        </div>
                        <button className="tdGhostBtn sm" onClick={() => go("/trading")} type="button">
                          Manage
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN (✅ Risk & Security removed completely) */}
          <div className="tdRightCol">
            {/* Open orders */}
            <div className="tdCard tdBox">
              <div className="tdCardTitleRow">
                <div>
                  <div className="tdCardTitle">Open Orders</div>
                  <div className="tdCardSub">Limit orders waiting to fill</div>
                </div>
                <button className="tdLinkBtn" onClick={() => go("/orders")} type="button">
                  View
                </button>
              </div>

              <div className="tdMiniList">
                {openOrders.map((o) => (
                  <div key={o.id} className="tdMiniRow">
                    <div className={cls("tdChip", o.side === "UP" ? "up" : "down")}>{o.side}</div>
                    <div className="tdMiniMain">
                      <div className="t">
                        {o.sym.replace("USDT", "")}/USDT • {o.type}
                      </div>
                      <div className="s">
                        Price <b>{nfmt(o.price, 2)}</b> • Amount <b>{o.amount}</b>
                      </div>
                    </div>
                    <div className="tdMiniEnd">{o.status}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent trades */}
            <div className="tdCard tdBox">
              <div className="tdCardTitleRow">
                <div>
                  <div className="tdCardTitle">Recent Trades</div>
                  <div className="tdCardSub">Last filled orders overview</div>
                </div>
                <button className="tdLinkBtn" onClick={() => go("/orders/history")} type="button">
                  History
                </button>
              </div>

              <div className="tdMiniList">
                {recent.map((h) => (
                  <div key={h.id} className="tdMiniRow">
                    <div className={cls("tdChip", h.side === "UP" ? "up" : "down")}>{h.side}</div>
                    <div className="tdMiniMain">
                      <div className="t">
                        {h.sym.replace("USDT", "")}/USDT • {h.type}
                      </div>
                      <div className="s">
                        Price <b>{nfmt(h.price, 2)}</b> • Amount <b>{h.amount}</b>
                      </div>
                    </div>
                    <div className="tdMiniEnd ok">{h.status}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Keep Support as a compact card (optional) */}
            <div className="tdCard tdBox tdSupportCard">
              <div className="tdCardTitleRow">
                <div>
                  <div className="tdCardTitle">Need help?</div>
                  <div className="tdCardSub">Fast response from support</div>
                </div>
              </div>
              <div className="tdSupportInner">
                {/* ✅ Customer Support -> CustomerService */}
                <button className="tdSupportWide" onClick={() => go("/customer-service")} type="button">
                  <span className="tdSupportIcon">
                    <Icon name="support" />
                  </span>
                  Customer Support
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}