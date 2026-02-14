import React, { useEffect, useMemo, useRef, useState } from "react";
import "./HomeGoldMiracle.css";
import { Link, useNavigate } from "react-router-dom";

/* ---------- helpers ---------- */
function fmt(n) {
  return new Intl.NumberFormat("en-US").format(n);
}
function money(n) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(n);
}

/* Count-up that starts only when "start" becomes true */
function useCountUpOnStart(target, start, ms = 1200) {
  const [v, setV] = useState(0);

  useEffect(() => {
    if (!start) return;
    let raf = 0;
    const t0 = performance.now();
    const from = 0;

    const tick = (t) => {
      const p = Math.min(1, (t - t0) / ms);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(Math.round(from + (target - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, start, ms]);

  return v;
}

/* Observe when an element enters viewport */
function useInViewOnce(options = { threshold: 0.25 }) {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;

    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setSeen(true);
        obs.disconnect();
      }
    }, options);

    obs.observe(el);
    return () => obs.disconnect();
  }, [seen, options]);

  return { ref, seen };
}

/* Simple countdown in seconds -> mm:ss */
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
  // Key metrics (wire to API later)
  const totalUsersTarget = 1525202;
  const joined24hTarget = 8042;
  const profitUsersTarget = 318901;
  const navigate = useNavigate();

  // start counters only when stats row is visible
  const { ref: statsRef, seen: statsSeen } = useInViewOnce({ threshold: 0.25 });

  const users = useCountUpOnStart(totalUsersTarget, statsSeen, 1300);
  const joined24h = useCountUpOnStart(joined24hTarget, statsSeen, 1100);
  const profitUsers = useCountUpOnStart(profitUsersTarget, statsSeen, 1200);

  // Live activity widget (visual pulse — wire to real feed later)
  const [liveJoined, setLiveJoined] = useState(42);
  const [tick, setTick] = useState(15); // countdown seconds to next "sync"
  useEffect(() => {
    const t = setInterval(() => {
      setTick((s) => (s <= 1 ? 15 : s - 1));
      setLiveJoined((v) => v + (Math.random() > 0.55 ? 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const products = useMemo(
    () => [
      {
        key: "hold",
        title: "Long-Term Holding",
        desc: "A vault for disciplined investors — secure storage, clear history, and full visibility over your balances.",
        bullets: [
          "Asset vault + portfolio allocation view",
          "Deposit / withdrawal history with statuses",
          "Security checkpoints: device + confirmation steps",
        ],
        icon: ICONS.hold,
        tag: "HOLD",
        cta: "Explore Holding",
      },
      {
        key: "trade",
        title: "Short-Term Trading",
        desc: "Built for speed and clarity — execute orders quickly with risk tools designed for active traders.",
        bullets: [
          "Market & limit orders with clean summaries",
          "Risk tools: TP/SL + position overview",
          "Watchlist + movement highlights",
        ],
        icon: ICONS.trade,
        tag: "TRADE",
        cta: "Open Trading",
      },
      {
        key: "mine",
        title: "Mining",
        desc: "BTC gold-mining themed module — plans, yield tracking, and transparent performance stats in one place.",
        bullets: [
          "Mining plans + yield projection cards",
          "Hash/power indicators with uptime status",
          "Performance history + payout timeline",
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
      { icon: ICONS.btc, title: "BTC-grade Design", desc: "Bitcoin-first visuals with gold accents and premium depth." },
      { icon: ICONS.shield, title: "Safety Cues", desc: "Clear confirmations, device checks, and readable transaction states." },
      { icon: ICONS.lightning, title: "Fast Operations", desc: "Short paths, fewer clicks — optimized for real user actions." },
      { icon: ICONS.cube, title: "Modular System", desc: "Holding, Trading, Mining share one reliable design language." },
    ],
    []
  );

  const faqs = useMemo(
    () => [
      {
        q: "What is GoldMiracle?",
        a: "GoldMiracle combines long-term holding, short-term trading tools, and a BTC gold-mining themed yield module into one premium platform experience.",
      },
      {
        q: "Is the design mobile friendly?",
        a: "Yes. All blocks are responsive with readable spacing, clean cards, and a mobile-first layout approach.",
      },
      {
        q: "Can these numbers be real?",
        a: "Yes. The interface is ready to connect with live data sources or your backend APIs whenever you’re ready.",
      },
      {
        q: "What should we build next?",
        a: "Next: Holding dashboard (vault + history), then Mining plans and performance, then Trading execution flow.",
      },
    ],
    []
  );

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
      <header className="gmTop">
        <div className="gmWrap gmTopIn">
          <div className="gmBrand">
            <div className="gmLogoWrap" aria-hidden="true">
  <img className="gmLogoImg" src="/gm/logo.png" alt="GoldMiracle logo" />
</div>

            <div className="gmBrandTxt">
              <div className="gmName">GoldMiracle</div>
              <div className="gmTagline">goldmiracle.io • BTC Gold Mining Tech</div>
            </div>
          </div>

          <nav className="gmNav">
            <a className="gmNavLink" href="#products">Products</a>
            <a className="gmNavLink" href="#results">Results</a>
            <a className="gmNavLink" href="#technology">Technology</a>
            <a className="gmNavLink" href="#faq">FAQ</a>
          </nav>

          <div className="gmActions">
            <Link to="/login" className="gmBtn gmBtnGhost">Login</Link>
            <Link to="/signup" className="gmBtn gmBtnGold">Sign up</Link>            
          </div>
        </div>
      </header>

      <main className="gmWrap">
        {/* HERO */}
        <section className="gmHero">
          <div className="gmHeroLeft">
            <div className="gmKicker">
              <span className="gmDot" />
              BTC-first experience • Gold-grade visuals • Built for conversion
            </div>

            {/* ✅ keep this header EXACTLY as requested */}
            <h1 className="gmH1">
              BTC-first platform for
              <span className="gmGoldTxt"> Holding, Trading </span>
              and
              <span className="gmGoldTxt"> Gold Mining</span>
            </h1>

            <p className="gmLead">
              GoldMiracle is built for real-world crypto users: protect capital with long-term holding, execute fast short-term trades,
              and track mining performance with clear yield dashboards — all in one premium, security-first experience.
            </p>

            <div className="gmHeroCtas">
              <Link to="/signup" className="gmBtn gmBtnGold gmBtnLg">Create Account</Link>

              <button
                className="gmBtn gmBtnGlass gmBtnLg"
                type="button"
                onClick={() => document.getElementById("products")?.scrollIntoView({ behavior: "smooth" })}
              >
                Explore Products
              </button>              
            </div>

            {/* Live widget */}
            <div className="gmLiveRow">
              <div className="gmLiveCard">
                <div className="gmLiveTop">
                  <div className="gmLiveTitle">Live Activity</div>
                  <span className="gmChip">SYNC</span>
                </div>

                <div className="gmLiveBody">
                  <div className="gmLiveVal">{fmt(liveJoined)}</div>
                  <div className="gmLiveSub">network activity pulse • updated in real time</div>
                </div>

                <div className="gmLiveBottom">
                  <div className="gmPulseDot" />
                  <span className="gmLiveHint">Next sync</span>
                  <span className="gmLiveTime">{formatMMSS(tick)}</span>
                </div>
              </div>

              <div className="gmMiniBadges">
                <div className="gmBadge">
                  <span className="gmBadgeIcon">{ICONS.shield}</span>
                  <div>
                    <div className="gmBadgeTitle">Trust & Clarity</div>
                    <div className="gmBadgeDesc">Clear states, confirmations, history</div>
                  </div>
                </div>
                <div className="gmBadge">
                  <span className="gmBadgeIcon">{ICONS.btc}</span>
                  <div>
                    <div className="gmBadgeTitle">BTC Theme</div>
                    <div className="gmBadgeDesc">Gold glow + premium tech depth</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats (count when visible) */}
            <div ref={statsRef} className="gmStats">
              <div className="gmStat">
                <div className="gmStatVal">{fmt(users)}</div>
                <div className="gmStatLbl">Accounts created</div>
              </div>
              <div className="gmStat">
                <div className="gmStatVal">{fmt(joined24h)}</div>
                <div className="gmStatLbl">New activity (24h)</div>
              </div>
              <div className="gmStat">
                <div className="gmStatVal">{fmt(profitUsers)}</div>
                <div className="gmStatLbl">Active users</div>
              </div>
            </div>

            {/* Trusted by / partners logo row */}
            <div className="gmLogoRow" aria-label="technology logos">
              <img src="/gm/coin-btc.png" alt="Bitcoin" loading="lazy" />
              <img src="/gm/gold-bar.png" alt="Gold" loading="lazy" />
              <img src="/gm/mining-rig.png" alt="Mining" loading="lazy" />
            </div>
          </div>

          {/* Hero right glass console */}
          <div className="gmHeroRight">
            <div className="gmOrb" />

            {/* HERO IMAGE */}
            <img
              className="gmHeroArt"
              src="/gm/hero-btc-gold.png"
              alt="BTC + Gold mining illustration"
              loading="lazy"
            />

            {/* Forsage-style Live Rotating Ring */}
            <LiveTextRing
              text="PASSIVE • INCLUDE • GOLDMIRACLE • BTC • "
              radius={78}
              duration={9}
              centerText="₮"
            />

            <div className="gmConsole">
              <div className="gmConsoleHead">
                <div className="gmConsoleTitle">Mining Console</div>
                <span className="gmChip gmChipSoft">BTC • GOLD</span>
              </div>

              <div className="gmConsoleGrid">
                <div className="gmBox">
                  <div className="gmBoxLbl">Hash Power</div>
                  <div className="gmBoxVal">128.4 TH/s</div>
                </div>
                <div className="gmBox">
                  <div className="gmBoxLbl">Estimated Yield</div>
                  <div className="gmBoxVal">{money(18.72)} USDT</div>
                </div>
                <div className="gmBox">
                  <div className="gmBoxLbl">BTC Output</div>
                  <div className="gmBoxVal">0.00384</div>
                </div>
                <div className="gmBox">
                  <div className="gmBoxLbl">Uptime</div>
                  <div className="gmBoxVal gmOk">Online</div>
                </div>
              </div>

              <div className="gmConsoleFoot">
                <Link to="/mining/packages" className="gmBtn gmBtnGold gmBtnSm">View Plans</Link>
                <Link to="/mining" className="gmBtn gmBtnGhost gmBtnSm">How It Works</Link>                
              </div>
            </div>
          </div>
        </section>

        {/* PRODUCTS */}
        <section id="products" className="gmSection">
          <div className="gmSectionHead">
            <h2 className="gmH2">Three core products</h2>
            <p className="gmP">
              Built around three real use-cases: hold for the long term, trade for the short term, and track mining performance with clarity.
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
                    src={
                      p.key === "hold"
                        ? "/gm/holding.png"
                        : p.key === "trade"
                        ? "/gm/trading.png"
                        : "/gm/mining-rig.png"
                    }
                    alt={p.title}
                    loading="lazy"
                  />
                </div>

                <div className="gmCardTitle">{p.title}</div>
                <div className="gmCardDesc">{p.desc}</div>

                <ul className="gmList">
                  {p.bullets.map((b) => <li key={b}>{b}</li>)}
                </ul>

                <button
                  className="gmBtn gmBtnGlass"
                  onClick={() => {
                    if (p.key === "hold") navigate("/login");
                    if (p.key === "trade") navigate("/trading");
                    if (p.key === "mine") navigate("/mining");
                  }}
                >
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
              We keep key activity metrics readable and verification details clear, so users understand what’s happening at every step.
            </p>
          </div>

          <div className="gmResults">
            <div className="gmResultCard">
              <div className="gmResultTop">
                <div className="gmResultTitle">Accounts</div>
                <span className="gmChip">Live</span>
              </div>
              <div className="gmResultVal">{fmt(totalUsersTarget)}</div>
              <div className="gmResultSub">Verified accounts across the network</div>
            </div>

            <div className="gmResultCard">
              <div className="gmResultTop">
                <div className="gmResultTitle">Total Volume</div>
                <span className="gmChip">USD</span>
              </div>
              <div className="gmResultVal">{fmt(1317722886)}</div>
              <div className="gmResultSub">Total platform activity volume</div>
            </div>

            <div className="gmResultCard gmResultWide">
              <div className="gmResultTop">
                <div className="gmResultTitle">Transparency & verification</div>
                <span className="gmChip gmChipSoft">BTC/USDT</span>
              </div>

              <div className="gmAddrList">
                <div className="gmAddr">
                  <span className="gmAddrLbl">Mining Pool Reference</span>
                  <span className="gmAddrVal">bc1q…goldmiracle</span>
                </div>
                <div className="gmAddr">
                  <span className="gmAddrLbl">Treasury Reference</span>
                  <span className="gmAddrVal">0x8a2f…A91C</span>
                </div>
                <div className="gmAddr">
                  <span className="gmAddrLbl">Trading Router Reference</span>
                  <span className="gmAddrVal">0x61b0…0F3E</span>
                </div>
              </div>

              <div className="gmHint">
                Verification entries are displayed clearly so users can validate activity and history with confidence.
              </div>
            </div>
          </div>
        </section>

        {/* TECHNOLOGY */}
        <section id="technology" className="gmSection">
          <div className="gmSectionHead">
            <h2 className="gmH2">Tech graphics (BTC + gold)</h2>
            <p className="gmP">
              A premium tech language: glass panels, gold accents, and consistent UX patterns across Holding, Trading and Mining.
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
                Built to stay sharp on mobile: clean spacing, readable typography, and fast-loading visuals.
              </div>
            </div>
            <button className="gmBtn gmBtnGold" type="button">See Components</button>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="gmSection gmFaq">
          <div className="gmSectionHead">
            <h2 className="gmH2">Frequently asked questions</h2>
            <p className="gmP">Clear answers to improve trust.</p>
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
              <div className="gmFootSub">goldmiracle.io • BTC Gold Mining Theme</div>
            </div>

            <div className="gmFootLinks">
              <a href="#products">Products</a>
              <a href="#results">Results</a>
              <a href="#technology">Technology</a>
              <a href="#faq">FAQ</a>
            </div>
          </div>

          <div className="gmFootBottom">
            <span>© {new Date().getFullYear()} GoldMiracle. All rights reserved.</span>
            <span className="gmFootNote">Disclaimer • Privacy • Terms</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
