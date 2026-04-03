import React from "react";
import { Link } from "react-router-dom";
import "./LegalPages.css";

export default function Privacy() {
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

          <h1 className="legalTitle">Privacy Policy</h1>
          <p className="legalSub">
            This policy explains how GoldMiracle collects, uses, and protects your information.
          </p>
        </header>

        <div className="legalCard">
          <div className="legalMeta">
            <span>Website: goldmiracle.bond</span>
            <span>Last updated: March 2026</span>
          </div>

          <section className="legalSection">
            <h2>1) Information We Collect</h2>
            <ul>
              <li><b>Account data:</b> name, email, login identifiers, and profile details you provide.</li>
              <li><b>Usage data:</b> pages visited, feature usage, device/browser info, and approximate location (IP-based).</li>
              <li><b>Transaction records:</b> deposits/withdrawals records and related metadata (where applicable).</li>
              <li><b>Support messages:</b> information you send through customer support.</li>
            </ul>
          </section>

          <section className="legalSection">
            <h2>2) How We Use Information</h2>
            <ul>
              <li>Provide, operate, and improve the platform experience.</li>
              <li>Secure accounts, prevent fraud, and enforce platform rules.</li>
              <li>Communicate about updates, security alerts, and service notices.</li>
              <li>Comply with legal obligations where required.</li>
            </ul>
          </section>

          <section className="legalSection">
            <h2>3) Cookies & Similar Technologies</h2>
            <p>
              We may use cookies and similar technologies for login sessions, preferences, analytics, and security.
              You can control cookies through your browser settings, but some features may not work correctly.
            </p>
          </section>

          <section className="legalSection">
            <h2>4) Sharing of Information</h2>
            <p>We do not sell your personal information. We may share data with:</p>
            <ul>
              <li><b>Service providers</b> (hosting, analytics, security, customer support tools) to run the platform.</li>
              <li><b>Legal authorities</b> if required by law or to protect rights and safety.</li>
              <li><b>Business transfers</b> if we undergo a merger, acquisition, or asset sale.</li>
            </ul>
          </section>

          <section className="legalSection">
            <h2>5) Data Security</h2>
            <p>
              We use reasonable administrative, technical, and organizational safeguards to protect information.
              However, no method of transmission or storage is 100% secure.
            </p>
          </section>

          <section className="legalSection">
            <h2>6) Data Retention</h2>
            <p>
              We retain personal information only as long as needed for legitimate purposes (account operations,
              security, legal compliance), then delete or anonymize it when feasible.
            </p>
          </section>

          <section className="legalSection">
            <h2>7) Your Choices</h2>
            <ul>
              <li>Update your profile information in your account settings (where available).</li>
              <li>Control cookies via your browser.</li>
              <li>Request access, correction, or deletion of certain data subject to legal limits.</li>
            </ul>
          </section>

          <section className="legalSection">
            <h2>8) Contact</h2>
            <p>For privacy questions or requests, contact support through the platform help section.</p>
          </section>

          <div className="legalDivider" />

          <div className="legalNavRow">
            <Link className="legalLink" to="/disclaimer">Disclaimer</Link>
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