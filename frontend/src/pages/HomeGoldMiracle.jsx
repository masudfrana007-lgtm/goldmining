// src/pages/HomeGoldMiracle.jsx
import React, { useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./HomeGoldMiracle.css";

/* ---------- helpers ---------- */
function fmt(n) {
  return new Intl.NumberFormat("en-US").format(n);
}
function money(n) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(n);
}

/* Simple countdown formatter kept for layout compatibility (not used for demo timers now) */
function formatMMSS(totalSec) {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/* ---------- icons ---------- */
const ICONS = {
  hold: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 2a7 7 0 0 0-7 7v4a5 5 0 0 0 5 5h1v2H8a1 1 0 1 0 0 2h8a1 1 0 1 0 0-2h-3v-2h1a5 5 0 0 0 5-5V9a7 7 0 0 0-7-7Zm5 11a3 3 0 0 1-3 3h-4a3 3 0 0 1-3-3V9a5 5 0 0 1 10 0v4Z"
        fill="currentColor"
      />
    </svg>
  ),
  trade: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7 7h10l-2-2a1 1 0 0 1 1.4-1.4l4 4a1 1 0 0 1 0 1.4l-4 4A1 1 0 0 1 15 11l2-2H7a1 1 0 0 1 0-2Zm10 10H7l2 2a1 1 0 0 1-1.4 1.4l-4-4a1 1 0 0 1 0-1.4l4-4A1 1 0 1 1 9 15l-2 2h10a1 1 0 0 1 0 2Z"
        fill="currentColor"
      />
    </svg>
  ),
  mine: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M3 20h18v-2l-5-9-4 6-3-4-6 9v0Zm16.3-2H4.7l4.3-6.5 2.9 3.9 3.8-5.7 3.3 6.3ZM8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm0-2a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"
        fill="currentColor"
      />
    </svg>
  ),
  btc: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M13.5 2h-3v2.1c-1.2.1-2.4.4-3.3.8l.9 2.2c.7-.3 1.6-.6 2.4-.7V17c-.7-.1-1.6-.4-2.4-.7l-.9 2.2c.9.4 2.1.7 3.3.8V22h3v-2.1c2.7-.3 4.6-1.8 4.6-4.2 0-1.7-.9-2.9-2.5-3.5 1.2-.6 1.9-1.6 1.9-3 0-2.1-1.7-3.6-4-4V2Zm-1 6.1c1.2.1 2 .7 2 1.7 0 1.1-.9 1.7-2 1.8V8.1Zm0 5.8c1.6.1 2.6.7 2.6 2 0 1.2-1 1.9-2.6 2v-4Z"
        fill="currentColor"
      />
    </svg>
  ),
  shield: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 2 4 5v6c0 5.2 3.4 9.9 8 11 4.6-1.1 8-5.8 8-11V5l-8-3Zm0 18c-3.3-1.1-6-4.9-6-9V6.3L12 4l6 2.3V11c0 4.1-2.7 7.9-6 9Zm-1-6 5-5-1.4-1.4L11 11.2 9.4 9.6 8 11l3 3Z"
        fill="currentColor"
      />
    </svg>
  ),
  lightning: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M13 2 3 14h7l-1 8 12-14h-7l-1-6Z" fill="currentColor" />
    </svg>
  ),
  cube: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 2 3 6.5v11L12 22l9-4.5v-11L12 2Zm0 2.3 6.8 3.4L12 11 5.2 7.7 12 4.3ZM5 9.3l6 3v7.3l-6-3V9.3Zm14 0v7.3l-6 3v-7.3l6-3Z"
        fill="currentColor"
      />
    </svg>
  ),
};

/* ✅ Forsage-style curved rotating ring component */
function LiveTextRing({
  text = "PASSIVE • INCLUDE • GOLDMIRACLE • BTC • ",
  radius = 78,
  duration = 9,
  centerText = "₮",
}) {
  const chars = Array.from(text);

  return (
    <div
      className="gmLiveRing"
      style={{
        ["--ringRadius"]: `${radius}px`,
        ["--ringDuration"]: `${duration}s`,
      }}
      aria-hidden="true"
    >
      <div className="gmLiveRingOuter" />

      <div className="gmLiveRingText">
        {chars.map((ch, i) => (
          <span
            key={`${ch}-${i}`}
            className="gmRingChar"
            style={{ ["--i"]: i, ["--n"]: chars.length }}
          >
            {ch === " " ? "\u00A0" : ch}
          </span>
        ))}
      </div>

      <div className="gmLiveRingDot" />

      <div className="gmLiveRingCore">
        <div className="gmLiveRingLogo">{centerText}</div>
        <div className="gmLiveRingHalo" />
        <div className="gmLiveRingInnerLine" />
      </div>
    </div>
  );
}

export default function HomeGoldMiracle() {
  const nav = useNavigate();

  // Refs for smooth scroll targets
  const productsRef = useRef(null);

  const goProducts = () => {
    productsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Professional, stable headline metrics (replace later with API)
  const metrics = useMemo(
    () => ({
      accounts: 1525202,
      active24h: 8042,
      activeUsers: 318901,
      volumeUsd: 1317722886,
      console: {
        hashPower: "128.4 TH/s",
        estYield: 18.72,
        btcOutput: "0.00384",
        uptime: "Online",
      },
    }),
    []
  );

  // Professional live widget copy (no demo timers/random increments)
  const liveActivity = useMemo(
    () => ({
      value: 42,
      label: "System health pulse • continuously monitored",
      nextSyncLabel: "Auto-check",
      nextSyncTime: formatMMSS(0), // kept for layout (00:00)
    }),
    []
  );

  const products = useMemo(
    () => [
      {
        key: "hold",
        title: "Long-Term Holding",
        desc: "A structured vault experience designed for disciplined investors—clean portfolio visibility, clear records, and security-first workflows.",
        bullets: [
          "Vault view with allocation and balance clarity",
          "Deposit & withdrawal timeline with readable statuses",
          "Security checkpoints: device + confirmation flow",
        ],
        icon: ICONS.hold,
        tag: "HOLD",
        cta: "Explore Holding",
      },
      {
        key: "trade",
        title: "Short-Term Trading",
        desc: "Fast execution with professional readability—quick order placement, position visibility, and practical risk tools for active traders.",
        bullets: [
          "Market & limit orders with clean summaries",
          "Risk tools: TP/SL and position overview",
          "Watchlist with movement highlights",
        ],
        icon: ICONS.trade,
        tag: "TRADE",
        cta: "Open Trading",
      },
      {
        key: "mine",
        title: "Mining",
        desc: "A BTC gold-mining themed module focused on transparency—plan selection, performance metrics, and yield tracking in one console.",
        bullets: [
          "Plan cards with yield projection and limits",
          "Hash power indicators with uptime status",
          "Performance history with payout timeline",
        ],
        icon: ICONS.mine,
        tag: "MINE",
        cta: "Start Mining",
      },
    ],
    []
  );

  const techBlocks = useMemo(
    () => [
      {
        icon: ICONS.btc,
        title: "BTC-First Visual System",
        desc: "A consistent Bitcoin-inspired identity—gold accents, glass depth, and premium contrast for readability.",
      },
      {
        icon: ICONS.shield,
        title: "Security-First UX",
        desc: "Clear confirmations, device awareness, and straightforward transaction states to build user trust.",
      },
      {
        icon: ICONS.lightning,
        title: "Efficient User Flows",
        desc: "Optimized layouts and short actions—designed to reduce clicks while keeping clarity high.",
      },
      {
        icon: ICONS.cube,
        title: "Modular Product Architecture",
        desc: "Holding, Trading, and Mining share the same design language for a seamless platform experience.",
      },
    ],
    []
  );

  const faqs = useMemo(
    () => [
      {
        q: "What is GoldMiracle?",
        a: "GoldMiracle is a unified platform experience that brings Holding, Trading, and Mining-style performance dashboards together with a premium BTC-and-gold theme.",
      },
      {
        q: "Is the interface mobile friendly?",
        a: "Yes. The layout is responsive and optimized for mobile readability, with balanced spacing, clean typography, and touch-friendly controls.",
      },
      {
        q: "Where do the numbers come from?",
        a: "This interface is designed to connect with your backend data sources. Once APIs are connected, all metrics and histories can be displayed dynamically and accurately.",
      },
      {
        q: "What is the recommended build order?",
        a: "A practical rollout is: Authentication → Member Dashboard → Deposits/Withdrawals → Mining Plans & Console → Trading execution flow and risk tools.",
      },
    ],
    []
  );

  const handleProductCTA = (key) => {
    if (key === "trade") return nav("/member/trading-dashboard");
    if (key === "mine") return nav("/mining");
    return goProducts();
  };

  return (
    <div className="gm">
      {/* Animated background */}
      <div className="gmBg" aria-hidden="true">
        <div className="gmGridMove" />
        <div className="gmGlow gmGlowA" />
        <div className="gmGlow gmGlowB" />
        <div className="gmGlow gmGlowC" />
        <div className="gmFloat gmF1" />
        <div className="gmFloat gmF2" />
        <div className="gmFloat gmF3" />
        <div className="gmNoise" />
      </div>

      {/* Top nav */}
      <header className="HgmTop">
        <div className="HgmWrap HgmTopIn">
          <div className="gmBrand">
            <div className="gmLogoWrap" aria-hidden="true">
              <img className="gmLogoImg" src="/gm/logo.png" alt="GoldMiracle logo" />
            </div>

            <div className="gmBrandTxt">
              <div className="gmName">GoldMiracle</div>
              <div className="gmTagline">goldmiracle.bond • BTC Gold Mining Tech</div>
            </div>
          </div>

          <nav className="gmNav">
            <a className="gmNavLink" href="#products">
              Products
            </a>
            <a className="gmNavLink" href="#results">
              Results
            </a>
            <a className="gmNavLink" href="#technology">
              Technology
            </a>
            <a className="gmNavLink" href="#faq">
              FAQ
            </a>
          </nav>

          <div className="gmActions">
            <button className="gmBtn gmBtnGhost" type="button" onClick={() => nav("/login")}>
              Login
            </button>
            <button className="gmBtn gmBtnGold" type="button" onClick={() => nav("/signup")}>
              Sign up
            </button>
          </div>
        </div>
      </header>

      <main className="HgmWrap">
        {/* HERO */}
        <section className="gmHero">
          <div className="gmHeroLeft">
            <div className="gmKicker">
              <span className="gmDot" />
              Security-first experience • Premium BTC visuals • Built for clarity & conversion
            </div>

            {/* ✅ keep this header EXACTLY as requested */}
            <h1 className="gmH1">
              BTC-first platform for
              <span className="gmGoldTxt"> Holding, Trading </span>
              and
              <span className="gmGoldTxt"> Gold Mining</span>
            </h1>

            <p className="gmLead">
              GoldMiracle delivers a unified crypto user experience: a clean vault for long-term holding, a streamlined
              trading interface for fast decisions, and a mining console designed around transparent performance
              indicators and readable yield tracking—built with premium detail and a security-first approach.
            </p>

            <div className="gmHeroCtas">
              <button className="gmBtn gmBtnGold gmBtnLg" type="button" onClick={() => nav("/signup")}>
                Create Account
              </button>
              <button className="gmBtn gmBtnGlass gmBtnLg" type="button" onClick={goProducts}>
                Explore Products
              </button>
            </div>

            {/* Live widget (professional static, no demo scripts) */}
            <div className="gmLiveRow">
              <div className="gmLiveCard">
                <div className="gmLiveTop">
                  <div className="gmLiveTitle">Platform Status</div>
                  <span className="gmChip">LIVE</span>
                </div>

                <div className="gmLiveBody">
                  <div className="gmLiveVal">{fmt(liveActivity.value)}</div>
                  <div className="gmLiveSub">{liveActivity.label}</div>
                </div>

                <div className="gmLiveBottom">
                  <div className="gmPulseDot" />
                  <span className="gmLiveHint">{liveActivity.nextSyncLabel}</span>
                  <span className="gmLiveTime">{liveActivity.nextSyncTime}</span>
                </div>
              </div>

              <div className="gmMiniBadges">
                <div className="gmBadge">
                  <span className="gmBadgeIcon">{ICONS.shield}</span>
                  <div>
                    <div className="gmBadgeTitle">Trust by Design</div>
                    <div className="gmBadgeDesc">Clear states • confirmations • history</div>
                  </div>
                </div>
                <div className="gmBadge">
                  <span className="gmBadgeIcon">{ICONS.btc}</span>
                  <div>
                    <div className="gmBadgeTitle">BTC Identity</div>
                    <div className="gmBadgeDesc">Gold glow • premium fintech depth</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats (static, professional — no demo counters) */}
            <div className="gmStats">
              <div className="gmStat">
                <div className="gmStatVal">{fmt(metrics.accounts)}</div>
                <div className="gmStatLbl">Registered accounts</div>
              </div>
              <div className="gmStat">
                <div className="gmStatVal">{fmt(metrics.active24h)}</div>
                <div className="gmStatLbl">Active sessions (24h)</div>
              </div>
              <div className="gmStat">
                <div className="gmStatVal">{fmt(metrics.activeUsers)}</div>
                <div className="gmStatLbl">Monthly active users</div>
              </div>
            </div>

            {/* Trusted by / partners logo row */}
            {/* <div className="gmLogoRow" aria-label="technology logos">
              <img src="/gm/coin-btc.png" alt="Bitcoin" loading="lazy" />
              <img src="/gm/gold-bar.png" alt="Gold" loading="lazy" />
              <img src="/gm/mining-rig.png" alt="Mining" loading="lazy" />
            </div> */}
          </div>

          {/* Hero right glass console */}
          <div className="gmHeroRight">
            <div className="gmOrb" />

            {/* HERO IMAGE */}
            <img className="gmHeroArt" src="/gm/hero-btc-gold.png" alt="BTC + Gold mining illustration" loading="lazy" />

            {/* Forsage-style Live Rotating Ring */}
            <LiveTextRing text="PASSIVE • INCLUDE • GOLDMIRACLE • BTC • " radius={78} duration={9} centerText="₮" />

            <div className="gmConsole">
              <div className="gmConsoleHead">
                <div className="gmConsoleTitle">Mining Console</div>
                <span className="gmChip gmChipSoft">BTC • GOLD</span>
              </div>

              <div className="gmConsoleGrid">
                <div className="gmBox">
                  <div className="gmBoxLbl">Hash Power</div>
                  <div className="gmBoxVal">{metrics.console.hashPower}</div>
                </div>
                <div className="gmBox">
                  <div className="gmBoxLbl">Estimated Yield</div>
                  <div className="gmBoxVal">{money(metrics.console.estYield)} USDT</div>
                </div>
                <div className="gmBox">
                  <div className="gmBoxLbl">BTC Output</div>
                  <div className="gmBoxVal">{metrics.console.btcOutput}</div>
                </div>
                <div className="gmBox">
                  <div className="gmBoxLbl">Uptime</div>
                  <div className="gmBoxVal gmOk">{metrics.console.uptime}</div>
                </div>
              </div>

              <div className="gmConsoleFoot">
                <button className="gmBtn gmBtnGold gmBtnSm" type="button" onClick={() => nav("/mining")}>
                  View Plans
                </button>

                {/* ✅ Hook this to your How It Works page route */}
                <button className="gmBtn gmBtnGhost gmBtnSm" type="button" onClick={() => nav("/member/how-it-works")}>
                  How It Works
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* PRODUCTS */}
        <section id="products" ref={productsRef} className="gmSection">
          <div className="gmSectionHead">
            <h2 className="gmH2">Three core products</h2>
            <p className="gmP">
              Built around three primary use-cases: protect capital with Holding, execute quickly with Trading, and monitor
              plan performance through a Mining console with transparent metrics.
            </p>
          </div>

          <div className="gmCards">
            {products.map((p, idx) => (
              <article className={`gmCard gmEnter gmEnter${idx + 1}`} key={p.key}>
                <div className="gmCardTop">
                  <div className="gmIcon">{p.icon}</div>
                  <span className="gmChip gmChipSoft">{p.tag}</span>
                </div>

                {/* Product Card Image */}
                <div className="gmCardMedia">
                  <img
                    src={p.key === "hold" ? "/gm/holding.png" : p.key === "trade" ? "/gm/trading.png" : "/gm/mining-rig.png"}
                    alt={p.title}
                    loading="lazy"
                  />
                </div>

                <div className="gmCardTitle">{p.title}</div>
                <div className="gmCardDesc">{p.desc}</div>

                <ul className="gmList">
                  {p.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>

                <button className="gmBtn gmBtnGlass" type="button" onClick={() => handleProductCTA(p.key)}>
                  {p.cta}
                </button>
              </article>
            ))}
          </div>
        </section>

        {/* RESULTS */}
        <section id="results" className="gmSection">
          <div className="gmSectionHead">
            <h2 className="gmH2">Results & transparency</h2>
            <p className="gmP">
              Core operational indicators are presented in a readable format so users can understand activity, balances,
              and confirmations with confidence.
            </p>
          </div>

          <div className="gmResults">
            <div className="gmResultCard">
              <div className="gmResultTop">
                <div className="gmResultTitle">Accounts</div>
                <span className="gmChip">ACTIVE</span>
              </div>
              <div className="gmResultVal">{fmt(metrics.accounts)}</div>
              <div className="gmResultSub">Registered accounts across the platform</div>
            </div>

            <div className="gmResultCard">
              <div className="gmResultTop">
                <div className="gmResultTitle">Total Volume</div>
                <span className="gmChip">USD</span>
              </div>
              <div className="gmResultVal">{fmt(metrics.volumeUsd)}</div>
              <div className="gmResultSub">Aggregate platform activity volume</div>
            </div>

            <div className="gmResultCard gmResultWide">
              <div className="gmResultTop">
                <div className="gmResultTitle">Verification & audit references</div>
                <span className="gmChip gmChipSoft">SYSTEM</span>
              </div>

              <div className="gmAddrList">
                <div className="gmAddr">
                  <span className="gmAddrLbl">Operations Reference</span>
                  <span className="gmAddrVal">GM-OPS-STATUS-001</span>
                </div>
                <div className="gmAddr">
                  <span className="gmAddrLbl">Treasury Reference</span>
                  <span className="gmAddrVal">GM-TREASURY-LEDGER-A</span>
                </div>
                <div className="gmAddr">
                  <span className="gmAddrLbl">Trading Reference</span>
                  <span className="gmAddrVal">GM-TRADE-ROUTER-CORE</span>
                </div>
              </div>

              <div className="gmHint">
                References are shown in a consistent format to support traceability across platform events, histories, and system checks.
              </div>
            </div>
          </div>
        </section>

        {/* TECHNOLOGY */}
        <section id="technology" className="gmSection">
          <div className="gmSectionHead">
            <h2 className="gmH2">Technology & experience</h2>
            <p className="gmP">
              A premium fintech interface: glass panels, gold accents, and consistent UX patterns across Holding, Trading, and Mining.
            </p>
          </div>

          <div className="gmTechGrid">
            {techBlocks.map((t) => (
              <div className="gmTech" key={t.title}>
                <div className="gmTechIcon">{t.icon}</div>
                <div className="gmTechTitle">{t.title}</div>
                <div className="gmTechDesc">{t.desc}</div>
              </div>
            ))}
          </div>

          <div className="gmBanner">
            <div>
              <div className="gmBannerTitle">Console-like UI • premium gold glow</div>
              <div className="gmBannerDesc">
                Designed to stay sharp on mobile: readable spacing, clean typography, and performance-friendly visuals.
              </div>
            </div>
            <button className="gmBtn gmBtnGold" type="button">
              See Components
            </button>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="gmSection gmFaq">
          <div className="gmSectionHead">
            <h2 className="gmH2">Frequently asked questions</h2>
            <p className="gmP">Clear answers to support trust and decision-making.</p>
          </div>

          <div className="gmFaqGrid">
            {faqs.map((f) => (
              <details className="gmFaqItem" key={f.q}>
                <summary>{f.q}</summary>
                <div className="gmFaqA">{f.a}</div>
              </details>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="gmFooter">
          <div className="gmFootTop">
            <div>
              <div className="gmFootBrand">GoldMiracle</div>
              <div className="gmFootSub">goldmiracle.bond • BTC Gold Mining Theme</div>
            </div>

            <div className="gmFootLinks">
              <a href="#products" style={{ textDecoration: "none" }}>
                Products
              </a>
              <a href="#results" style={{ textDecoration: "none" }}>
                Results
              </a>
              <a href="#technology" style={{ textDecoration: "none" }}>
                Technology
              </a>
              <a href="#faq" style={{ textDecoration: "none" }}>
                FAQ
              </a>
            </div>
          </div>

          <div className="gmFootBottom">
            <span>© {new Date().getFullYear()} GoldMiracle. All rights reserved.</span>
            <span className="gmFootNote">
              <a onClick={() => nav("/disclaimer")} style={{ textDecoration: "none", cursor: "pointer" }}>
                Disclaimer
              </a>{" "}
              •{" "}
              <a onClick={() => nav("/privacy")} style={{ textDecoration: "none", cursor: "pointer" }}>
                Privacy
              </a>{" "}
              •{" "}
              <a onClick={() => nav("/terms")} style={{ textDecoration: "none", cursor: "pointer" }}>
                Terms
              </a>
            </span>
          </div>
        </footer>
      </main>
    </div>
  );
}