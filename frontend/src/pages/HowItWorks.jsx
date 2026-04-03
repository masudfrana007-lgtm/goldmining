// src/pages/HowItWorks.jsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./HowItWorks.css";

function cls(...a) {
  return a.filter(Boolean).join(" ");
}

function Icon({ name }) {
  const common = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none" };
  switch (name) {
    case "bolt":
      return (
        <svg {...common}>
          <path
            d="M13 2L3 14h7l-1 8 12-14h-7l-1-6z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "shield":
      return (
        <svg {...common}>
          <path
            d="M12 2l8 4v6c0 5-3.4 9.4-8 10-4.6-.6-8-5-8-10V6l8-4z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M9 12l2 2 4-5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "graph":
      return (
        <svg {...common}>
          <path d="M4 19V5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M4 19h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path
            d="M7 15l4-4 3 3 6-7"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "cpu":
      return (
        <svg {...common}>
          <path d="M9 9h6v6H9V9z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path
            d="M8 2v3M16 2v3M8 19v3M16 19v3M2 8h3M2 16h3M19 8h3M19 16h3"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path d="M7 7h10v10H7V7z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      );
    default:
      return null;
  }
}

export default function HowItWorks() {
  const nav = useNavigate();
  const [open, setOpen] = useState(0);

  const steps = useMemo(
    () => [
      {
        t: "Choose a Mining Plan",
        d: "Pick a plan based on your preferred entry amount and mining capacity (Hash Power).",
      },
      {
        t: "Activate Your Package",
        d: "Once activated, your account is allocated a portion of computational power inside our mining infrastructure.",
      },
      {
        t: "Start Earning Daily Rewards",
        d: "Rewards are calculated daily based on your active hash power and plan model, then credited automatically.",
      },
      {
        t: "Track Everything in Real-Time",
        d: "Monitor status, uptime, estimated yield, and BTC output directly from your Mining Console.",
      },
      {
        t: "Withdraw or Reinvest",
        d: "Use your balance for withdrawals (subject to platform policy) or reinvest to upgrade for higher earning potential.",
      },
    ],
    []
  );

  const highlights = useMemo(
    () => [
      {
        icon: "cpu",
        t: "Digital Mining Infrastructure",
        d: "Mining packages represent allocated computational power—no hardware setup needed.",
      },
      {
        icon: "graph",
        t: "Transparent Reward Model",
        d: "Earnings are proportional to your active hash power and package rules.",
      },
      {
        icon: "bolt",
        t: "Real-Time Monitoring",
        d: "Live console metrics show performance, status, yield, and output updates.",
      },
      {
        icon: "shield",
        t: "Security & Stability",
        d: "Secure backend monitoring ensures fair distribution and stable operations.",
      },
    ],
    []
  );

  const faq = useMemo(
    () => [
      {
        q: "What is Hash Power (TH/s)?",
        a: "Hash Power indicates your mining capacity. Higher TH/s means a larger contribution to reward generation and typically a higher share of daily rewards.",
      },
      {
        q: "How is the Estimated Yield calculated?",
        a: "Estimated Yield is derived from your active package rules and performance model. Actual yield may vary slightly based on operational metrics and plan terms.",
      },
      {
        q: "When are rewards credited?",
        a: "Rewards are calculated daily and credited automatically to your wallet balance once the daily cycle completes.",
      },
      {
        q: "Can I withdraw anytime?",
        a: "Withdrawals are available subject to platform policy, verification, and network conditions. You can also reinvest to upgrade your plan.",
      },
      {
        q: "Do I need to buy mining machines?",
        a: "No. You don’t need to manage hardware. Mining power is allocated digitally through our infrastructure when you activate a plan.",
      },
    ],
    []
  );

  return (
    <div className="hiw">
      {/* Ambient background */}
      <div className="hiw-bg" aria-hidden="true">
        <div className="hiw-orb o1" />
        <div className="hiw-orb o2" />
        <div className="hiw-grid" />
      </div>

      <div className="hiw-wrap">
        <header className="hiw-hero">
          <div className="hiw-badge">
            <span className="dot" />
            Mining Console Guide
          </div>

          <h1 className="hiw-title">How It Works</h1>
          <p className="hiw-sub">
            Understand how mining plans allocate hash power, generate rewards, and let you track performance
            in real time—without managing physical hardware.
          </p>

          <div className="hiw-ctaRow">
            {/* ✅ FIXED: goes to /mining (your mining plans page) */}
            <button className="hiw-btn primary" onClick={() => nav("/mining")}>
              View Plans
            </button>

            <button className="hiw-btn ghost" onClick={() => nav(-1)}>
              Back
            </button>
          </div>

          <div className="hiw-stats">
            <div className="hiw-stat">
              <div className="k">Allocated Power</div>
              <div className="v">TH/s Based</div>
            </div>
            <div className="hiw-stat">
              <div className="k">Rewards</div>
              <div className="v">Daily Credit</div>
            </div>
            <div className="hiw-stat">
              <div className="k">Tracking</div>
              <div className="v">Real-Time Console</div>
            </div>
          </div>
        </header>

        {/* Highlights */}
        <section className="hiw-section">
          <div className="hiw-sectionHead">
            <h2>Core Principles</h2>
            <p>Everything is designed to be simple, transparent, and trackable.</p>
          </div>

          <div className="hiw-gridCards">
            {highlights.map((x, i) => (
              <div className="hiw-card" key={i}>
                <div className="hiw-icon">
                  <Icon name={x.icon} />
                </div>
                <div className="hiw-cardTitle">{x.t}</div>
                <div className="hiw-cardDesc">{x.d}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Steps */}
        <section className="hiw-section">
          <div className="hiw-sectionHead">
            <h2>Step-by-Step Process</h2>
            <p>From choosing a plan to earning and managing your rewards.</p>
          </div>

          <div className="hiw-steps">
            {steps.map((s, idx) => (
              <div className="hiw-step" key={idx}>
                <div className="hiw-stepN">{String(idx + 1).padStart(2, "0")}</div>
                <div className="hiw-stepBody">
                  <div className="hiw-stepT">{s.t}</div>
                  <div className="hiw-stepD">{s.d}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="hiw-callout">
            <div className="hiw-calloutTitle">Tip</div>
            <div className="hiw-calloutText">
              Reinvesting profits can increase your future yield by upgrading to higher hash power plans.
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="hiw-section">
          <div className="hiw-sectionHead">
            <h2>FAQ</h2>
            <p>Quick answers to common questions about mining plans and rewards.</p>
          </div>

          <div className="hiw-faq">
            {faq.map((f, i) => {
              const isOpen = open === i;
              return (
                <button
                  key={i}
                  className={cls("hiw-faqItem", isOpen && "open")}
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  type="button"
                >
                  <div className="hiw-faqTop">
                    <span className="hiw-faqQ">{f.q}</span>
                    <span className="hiw-faqPlus" aria-hidden="true">
                      <span />
                      <span />
                    </span>
                  </div>
                  <div className="hiw-faqA">{f.a}</div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="hiw-bottom">
          <div className="hiw-bottomBox">
            <div className="hiw-bottomLeft">
              <div className="hiw-bottomT">Ready to start earning?</div>
              <div className="hiw-bottomD">
                Choose a plan that matches your budget and start tracking your yield instantly.
              </div>
            </div>

            <div className="hiw-bottomRight">
              {/* ✅ FIXED: goes to /mining */}
              <button className="hiw-btn primary" onClick={() => nav("/mining")}>
                View Plans
              </button>

              {/* ✅ Your support page route in your app */}
              <button className="hiw-btn soft" onClick={() => nav("/customer-service")}>
                Contact Support
              </button>
            </div>
          </div>
        </section>

        <footer className="hiw-foot">
          <span>© {new Date().getFullYear()} Mining Console • All rights reserved</span>
        </footer>
      </div>
    </div>
  );
}