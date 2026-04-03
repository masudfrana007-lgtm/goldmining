import React from "react";
import { Link } from "react-router-dom";
import "./LegalPages.css";

export default function Disclaimer() {
  return (
    <div className="legalPage">
      <div className="legalBg" />
      <div className="legalWrap">
        <header className="legalTop">
          <a
            href="https://goldmiracle.bond"
            target="_blank"
            rel="noopener noreferrer"
            className="legalKicker"
          >
            <img src="/logo.png" alt="GoldMiracle Logo" className="legalLogo" />
            <span>GoldMiracle</span>
          </a>

          <h1 className="legalTitle">Disclaimer</h1>
          <p className="legalSub">
            This page explains important limitations and user responsibilities when using GoldMiracle.
          </p>
        </header>

        <div className="legalCard">
          <div className="legalMeta">
            <span>Website: goldmiracle.bond</span>
            <span>Last updated: March 2026</span>
          </div>

          <section className="legalSection">
            <h2>1) No Financial Advice</h2>
            <p>
              The content, tools, dashboards, signals, estimates, and any other information provided on GoldMiracle
              are for general informational purposes only. Nothing on this website constitutes financial, investment,
              legal, or tax advice, and should not be relied upon as such.
            </p>
          </section>

          <section className="legalSection">
            <h2>2) No Guarantee of Results</h2>
            <p>
              Trading and investing involve risk, and performance is not guaranteed. Any examples, projections,
              backtests, or simulated outcomes are illustrative only and may not reflect real market conditions.
              You may lose some or all of your funds.
            </p>
          </section>

          <section className="legalSection">
            <h2>3) Accuracy & Availability</h2>
            <p>
              We aim to keep information accurate and the platform available, but we do not warrant that content is
              always complete, error-free, up-to-date, or uninterrupted. System maintenance, third-party outages,
              and network issues may occur.
            </p>
          </section>

          <section className="legalSection">
            <h2>4) Third-Party Services</h2>
            <p>
              GoldMiracle may reference or integrate third-party services (exchanges, payment providers, data vendors,
              analytics tools). We are not responsible for third-party content, actions, pricing, uptime, or policies.
              Your use of third-party services is at your own risk.
            </p>
          </section>

          <section className="legalSection">
            <h2>5) User Responsibility</h2>
            <p>
              You are responsible for verifying any information before acting on it, maintaining the confidentiality
              of your credentials, and complying with applicable laws and regulations in your jurisdiction.
            </p>
          </section>

          <section className="legalSection">
            <h2>6) Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, GoldMiracle and its affiliates will not be liable for any direct,
              indirect, incidental, consequential, special, or punitive damages arising from your use of the platform
              or reliance on any information provided.
            </p>
          </section>

          <div className="legalDivider" />

          <div className="legalNavRow">
            <Link className="legalLink" to="/privacy">Privacy</Link>
            <span className="legalDot">•</span>
            <Link className="legalLink" to="/terms">Terms</Link>
          </div>
        </div>

        <footer className="legalFooter">
          <div className="legalFooterLeft">
            <div className="legalBrand">GoldMiracle</div>
            <div className="legalMuted">© 2026 GoldMiracle. All rights reserved.</div>
          </div>
          <div className="legalFooterRight">
            <Link className="legalFooterLink" to="/disclaimer">Disclaimer</Link>
            <Link className="legalFooterLink" to="/privacy">Privacy</Link>
            <Link className="legalFooterLink" to="/terms">Terms</Link>
          </div>
        </footer>
      </div>
    </div>
  );
}