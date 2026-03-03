import React, { useMemo, useState } from "react";
import "./GoldMining.css";


/* ---------- helpers ---------- */
function fmt(n) {
  return new Intl.NumberFormat("en-US").format(n);
}
function money(n) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);
}
function pct(n) {
  return `${n.toFixed(2)}%`;
}

const ICONS = {
  chip: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M9 2h6v2h2a3 3 0 0 1 3 3v2h2v6h-2v2a3 3 0 0 1-3 3h-2v2H9v-2H7a3 3 0 0 1-3-3v-2H2V9h2V7a3 3 0 0 1 3-3h2V2Zm8 4H7a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1Zm-7 3h4v6h-4V9Z"
        fill="currentColor"
      />
    </svg>
  ),
  bolt: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M13 2 3 14h7l-1 8 12-14h-7l-1-6Z" fill="currentColor" />
    </svg>
  ),
  shield: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 2 4 5v6c0 5.2 3.4 9.9 8 11 4.6-1.1 8-5.8 8-11V5l-8-3Zm0 18c-3.3-1.1-6-4.9-6-9V6.3L12 4l6 2.3V11c0 4.1-2.7 7.9-6 9Z"
        fill="currentColor"
      />
    </svg>
  ),
  pick: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M14.5 3a1 1 0 0 1 1.3.6l1 2.5 1.9-.7a1 1 0 0 1 1.2.4l1.2 2a1 1 0 0 1-.3 1.4l-2.7 1.6a7 7 0 0 1-4.6 5.5l-1.3.4 4.1 4.1a1 1 0 0 1-1.4 1.4L6.3 12.5l-2.6 1a1 1 0 0 1-1.2-.4l-1.2-2a1 1 0 0 1 .3-1.4l2.8-1.6a7 7 0 0 1 4.6-5.5l3.5-1.2ZM10 4.7a5 5 0 0 0-3.2 3.8l6.8 6.8a5 5 0 0 0 3.2-3.8L10 4.7Z"
        fill="currentColor"
      />
    </svg>
  ),
};

export default function GoldMining() {
  const packages = useMemo(
    () => [
      {
        key: "starter",
        name: "Starter Rig",
        tier: "Entry",
        entry: 100,
        dailyRate: 0.3,
        badge: "Best to start",
        // ✅ put your own image paths in public/gm/
        img: "/gm/rig-starter.png",
        specs: ["Low power draw", "Stable daily cycle", "Beginner-friendly setup"],
      },
      {
        key: "bronze",
        name: "Bronze Miner",
        tier: "Growth",
        entry: 300,
        dailyRate: 0.5,
        badge: "Popular",
        img: "/gm/rig-bronze.png",
        specs: ["Balanced output", "Optimized cooling", "Auto status checks"],
      },
      {
        key: "silver",
        name: "Silver Engine",
        tier: "Advance",
        entry: 500,
        dailyRate: 0.75,
        badge: "Better yield",
        img: "/gm/rig-silver.png",
        specs: ["Higher hash mode", "Faster payout cycle", "Priority monitoring"],
      },
      {
        key: "gold",
        name: "Gold Core",
        tier: "Pro",
        entry: 800,
        dailyRate: 1.0,
        badge: "Pro tier",
        img:"/gm/rig-gold.png",
        specs: ["Pro performance", "Uptime focus", "Dashboard analytics"],
      },
      {
        key: "platinum",
        name: "Platinum Array",
        tier: "Elite",
        entry: 1000,
        dailyRate: 1.5,
        badge: "Elite",
        img: "/gm/rig-platinum.png",
        specs: ["Elite output", "Enhanced stability", "Advanced reporting"],
      },
      {
        key: "titan",
        name: "Titan Vault Rig",
        tier: "Institutional",
        entry: 2000,
        dailyRate: 2.0,
        badge: "Max tier",
        img: "/gm/rig-titan.png",
        specs: ["Maximum capacity", "Priority support", "Enterprise monitoring"],
      },
    ],
    []
  );

  const [selectedKey, setSelectedKey] = useState(packages[0].key);
  const selected = packages.find((p) => p.key === selectedKey) || packages[0];

  // Estimator
  const daily = (selected.entry * selected.dailyRate) / 100;
  const weekly = daily * 7;
  const monthly = daily * 30;

  return (
    <div className="gmMine">
      {/* Ambient background */}
      <div className="gmMineBg" aria-hidden="true">
        <div className="gmMineGrid" />
        <div className="gmMineGlow a" />
        <div className="gmMineGlow b" />
        <div className="gmMineNoise" />
      </div>

      {/* Header */}
      <header className="gmMineTop">
        <div className="gmMineWrap gmMineTopIn">
          <div className="gmMineBrand">
            <img className="gmMineLogo" src="/gm/logo.png" alt="GoldMiracle" />
            <div>
              <div className="gmMineName">GoldMiracle</div>
              <div className="gmMineTag">Gold Mining • BTC-first theme</div>
            </div>
          </div>

          <div className="gmMineActions">
            <button className="gmMineBtn gmMineBtnGhost" type="button">
              Back
            </button>
            <button className="gmMineBtn gmMineBtnGold" type="button">
              Start Mining
            </button>
          </div>
        </div>
      </header>

      <main className="gmMineWrap">
        {/* Hero */}
        <section className="gmMineHero">
          <div className="gmMineHeroLeft">
            <div className="gmMineKicker">
              <span className="gmMineDot" />
              Mining packages • Transparent tiers • Premium dashboard
            </div>

            <h1 className="gmMineH1">
              Gold Mining Packages
              <span className="gmMineGold"> (BTC-themed)</span>
            </h1>

            <p className="gmMineLead">
              Choose a mining machine package based on your budget and target daily rate. Each package is presented with
              clean specs, expected daily rate, and a realistic console-style UI.
            </p>

            

           
            {/* Visual Mining Graphic Block */}
{/* Visual Mining Graphic Block (NEXT LEVEL) */}
<div className="gmMineVisual gmMineVisualXL">
  <div className="gmMineSweep" />
  <div className="gmMineHud" />
  <div className="gmMineHudScan" />
  

  {/* energy beam */}
  <div className="gmMineEnergyBeam" />

  {/* particles */}
  <div className="gmMineParticles" aria-hidden="true">
    {Array.from({ length: 18 }).map((_, i) => (
      <span className="gmMineParticle" style={{ ["--i"]: i }} key={i} />
    ))}
  </div>

  <div className="gmMineVisualInner">
    <div className="gmMineOrbitA" />
    <div className="gmMineOrbitB" />

    <img
      src="/gm/coin-btc.png"
      alt="Bitcoin"
      className="gmMineCoin"
      loading="lazy"
    />

    <img
      src="/gm/gold-bar.png"
      alt="Gold bars"
      className="gmMineGoldBars"
      loading="lazy"
    />

    <div className="gmMineCoreRing" />
    <div className="gmMineCoreRing2" />
    <div className="gmMineCorePulse" />
  </div>

  <div className="gmMineHudText">
    <div className="t">Mining Visual Core</div>
    <div className="s">BTC energy • Gold yield • Real-time status</div>
  </div>
</div>


          </div>

          <div className="gmMineHeroRight">
            <div className="gmMineConsole">
              <div className="gmMineConsoleHead">
                <div>
                  <div className="gmMineConsoleTitle">Mining Console</div>
                  <div className="gmMineConsoleSub">Select a package to preview expected performance</div>
                </div>
                <span className="gmMinePill">BTC • GOLD</span>
              </div>

              <div className="gmMineConsoleBody">
                <div className="gmMinePreview">
                  <img className="gmMinePreviewImg" src={selected.img} alt={selected.name} />
                  <div className="gmMinePreviewMeta">
                    <div className="gmMinePreviewName">{selected.name}</div>
                    <div className="gmMinePreviewTier">
                      <span className="gmMineChip">{selected.tier}</span>
                      <span className="gmMineChip soft">{selected.badge}</span>
                    </div>
                  </div>
                </div>

                <div className="gmMineMetrics">
                  <div className="gmMineMetric">
                    <div className="gmMineMetricLbl">Entry</div>
                    <div className="gmMineMetricVal">{money(selected.entry)}</div>
                  </div>
                  <div className="gmMineMetric">
                    <div className="gmMineMetricLbl">Daily Rate</div>
                    <div className="gmMineMetricVal">{pct(selected.dailyRate)}</div>
                  </div>
                  <div className="gmMineMetric">
                    <div className="gmMineMetricLbl">Estimated / Day</div>
                    <div className="gmMineMetricVal">{money(daily)}</div>
                  </div>
                  <div className="gmMineMetric">
                    <div className="gmMineMetricLbl">Uptime</div>
                    <div className="gmMineMetricVal ok">Online</div>
                  </div>
                </div>

                <div className="gmMineSpecRow">
                  {selected.specs.map((s) => (
                    <div className="gmMineSpec" key={s}>
                      <span className="gmMineSpecDot" />
                      {s}
                    </div>
                  ))}
                </div>

                <div className="gmMineConsoleFoot">
                  <button className="gmMineBtn gmMineBtnGold" type="button">
                    Activate {selected.name}
                  </button>
                  <button className="gmMineBtn" type="button">
                    View Terms
                  </button>
                </div>
              </div>
            </div>

            {/* Estimator */}
            <div className="gmMineEstimator">
              <div className="gmMineEstimatorHead">
                <div className="gmMineEstimatorTitle">Earnings Estimator</div>
                <span className="gmMinePill soft">Auto-calculated</span>
              </div>

              <div className="gmMineEstGrid">
                <div className="gmMineEst">
                  <div className="gmMineEstLbl">Daily</div>
                  <div className="gmMineEstVal">{money(daily)}</div>
                </div>
                <div className="gmMineEst">
                  <div className="gmMineEstLbl">Weekly</div>
                  <div className="gmMineEstVal">{money(weekly)}</div>
                </div>
                <div className="gmMineEst">
                  <div className="gmMineEstLbl">Monthly (30d)</div>
                  <div className="gmMineEstVal">{money(monthly)}</div>
                </div>
              </div>

              <div className="gmMineEstNote">
                Estimates use: <strong>Entry × Daily rate</strong>. Connect to live data later if needed.
              </div>
            </div>
          </div>
        </section>

        {/* Packages */}
        <section className="gmMineSection">
          <div className="gmMineSectionHead">
            <h2 className="gmMineH2">Choose your mining machine</h2>
            <p className="gmMineP">
              Six packages designed for different budgets — from Starter to institutional-grade rigs.
            </p>
          </div>

          <div className="gmMineCards">
            {packages.map((p) => (
              <button
                key={p.key}
                type="button"
                className={`gmMineCard ${p.key === selectedKey ? "active" : ""}`}
                onClick={() => setSelectedKey(p.key)}
              >
                <div className="gmMineCardTop">
                  <div className="gmMineCardIcon">{ICONS.chip}</div>
                  <div className="gmMineCardPills">
                    <span className="gmMineChip">{p.tier}</span>
                    <span className="gmMineChip soft">{p.badge}</span>
                  </div>
                </div>

                <div className="gmMineCardMedia">
                  <img src={p.img} alt={p.name} loading="lazy" />
                </div>

                <div className="gmMineCardTitle">{p.name}</div>
                <div className="gmMineCardDesc">
                  Entry: <strong>{money(p.entry)}</strong> • Daily rate: <strong>{pct(p.dailyRate)}</strong>
                </div>

                <div className="gmMineCardBottom">
                  <div className="gmMineCardMini">
                    <div className="lbl">Est / day</div>
                    <div className="val">{money((p.entry * p.dailyRate) / 100)}</div>
                  </div>
                  <span className="gmMineCardCta">Preview</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* FAQ / Support */}
        <section className="gmMineSection">
          <div className="gmMineSectionHead">
            <h2 className="gmMineH2">Frequently asked questions</h2>
            <p className="gmMineP">Clear answers improve trust and reduce support requests.</p>
          </div>

          <div className="gmMineFaq">
            <details className="gmMineFaqItem">
              <summary>When does the daily rate apply?</summary>
              <div className="a">
                After activation, the package follows the daily cycle shown in your platform terms. Add your exact timing rules in
                the Terms page (e.g., 24-hour cycle, cutoff time, etc.).
              </div>
            </details>

            <details className="gmMineFaqItem">
              <summary>Can users upgrade to a higher package?</summary>
              <div className="a">
                Yes — most platforms allow upgrades. Recommended UX: show “Upgrade options” inside the Mining Console with a clean
                comparison table.
              </div>
            </details>

            <details className="gmMineFaqItem">
              <summary>How should withdrawals be handled?</summary>
              <div className="a">
                Keep it professional: show payout status, confirmation steps, and history. Always add a clear “Pending/Completed”
                timeline and limits if applicable.
              </div>
            </details>
          </div>
        </section>

        {/* Footer */}
        <footer className="gmMineFooter">
          <div className="gmMineFooterTop">
            <div className="gmMineFooterBrand">
              <img className="gmMineLogo sm" src="/gm/logo.png" alt="GoldMiracle" />
              <div>
                <div className="gmMineName">GoldMiracle</div>
                <div className="gmMineTag">Gold Mining • BTC-first</div>
              </div>
            </div>

            <div className="gmMineFooterLinks">
              <a href="#top">Top</a>
              <a href="#packages">Packages</a>
              <a href="#terms">Terms</a>
              <a href="#support">Support</a>
            </div>
          </div>

          <div className="gmMineFooterBottom">
            <span>© {new Date().getFullYear()} GoldMiracle. All rights reserved.</span>
            <span className="muted">Terms • Privacy • Risk Disclosure</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
