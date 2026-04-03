import React from "react";
import { Link } from "react-router-dom";
import "./LegalPages.css";

export default function Terms() {
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

          <h1 className="legalTitle">Terms of Service</h1>
          <p className="legalSub">
            These terms govern your access to and use of GoldMiracle.
          </p>
        </header>

        <div className="legalCard">
          <div className="legalMeta">
            <span>Website: goldmiracle.bond</span>
            <span>Last updated: March 2026</span>
          </div>

          <section className="legalSection">
            <h2>1) Acceptance of Terms</h2>
            <p>
              By accessing or using GoldMiracle, you agree to these Terms and any policies referenced here
              (including the Privacy Policy and Disclaimer). If you do not agree, do not use the platform.
            </p>
          </section>

          <section className="legalSection">
            <h2>2) Eligibility</h2>
            <p>
              You must be legally permitted to use this service in your jurisdiction. You are responsible for
              ensuring compliance with applicable laws, regulations, and restrictions.
            </p>
          </section>

          <section className="legalSection">
            <h2>3) Account Security</h2>
            <ul>
              <li>You are responsible for maintaining confidentiality of your login credentials.</li>
              <li>You agree to notify us immediately of any unauthorized access or suspicious activity.</li>
              <li>We may require additional verification for security and fraud prevention.</li>
            </ul>
          </section>

          <section className="legalSection">
            <h2>4) Platform Use Rules</h2>
            <p>You agree not to:</p>
            <ul>
              <li>Use the service for unlawful activities or to violate sanctions/restrictions.</li>
              <li>Attempt to exploit, reverse engineer, disrupt, or overload platform systems.</li>
              <li>Use automated scripts/bots in ways that harm stability or other users.</li>
              <li>Misrepresent identity, ownership, or the source of funds.</li>
            </ul>
          </section>

          <section className="legalSection">
            <h2>5) Fees</h2>
            <p>
              Certain services may include fees or charges disclosed within the platform. By using paid features,
              you agree to applicable pricing and fee disclosures shown at the time of the transaction.
            </p>
          </section>

          <section className="legalSection">
            <h2>6) Risk Acknowledgment</h2>
            <p>
              You acknowledge that financial markets can be volatile and that you may incur losses.
              You are solely responsible for your decisions and outcomes.
            </p>
          </section>

          <section className="legalSection">
            <h2>7) Suspension & Termination</h2>
            <p>
              We may suspend or terminate access if we reasonably believe you violated these Terms, created risk,
              or engaged in suspicious or unlawful activity. We may also update platform access rules to protect
              users and the service.
            </p>
          </section>

          <section className="legalSection">
            <h2>8) Intellectual Property</h2>
            <p>
              The platform, UI, branding, and content are owned by GoldMiracle or its licensors and are protected by
              applicable laws. You may not copy, distribute, or create derivative works without permission.
            </p>
          </section>

          <section className="legalSection">
            <h2>9) Changes to Terms</h2>
            <p>
              We may update these Terms from time to time. Continued use of the service after changes means you accept
              the updated Terms.
            </p>
          </section>

          <div className="legalDivider" />

          <div className="legalNavRow">
            <Link className="legalLink" to="/disclaimer">Disclaimer</Link>
            <span className="legalDot">•</span>
            <Link className="legalLink" to="/privacy">Privacy</Link>
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