import "./LegalPages.css";

export default function PrivacyPolicy() {
  return (
    <div className="legalPage">
      <div className="legalCard">
        <h1 className="legalTitle">Privacy Policy</h1>
        <p className="legalMeta">Last updated: {new Date().toLocaleDateString()}</p>

        <p className="legalP">
          This Privacy Policy explains how eorder.io (“we”, “us”, “our”) collects, uses, and protects your
          information when you use our website and services.
        </p>

        <h2 className="legalH2">1) Information We Collect</h2>
        <ul className="legalList">
          <li><b>Account information:</b> name, email, login credentials (stored securely).</li>
          <li><b>Usage data:</b> pages visited, actions performed, device/browser information.</li>
          <li><b>Communication:</b> messages you send to support, including attachments if provided.</li>
          <li><b>Transaction-related data:</b> deposit/withdrawal records and references (where applicable).</li>
        </ul>

        <h2 className="legalH2">2) How We Use Your Information</h2>
        <ul className="legalList">
          <li>To create and manage your account.</li>
          <li>To provide customer support and respond to requests.</li>
          <li>To operate, maintain, and improve platform performance and security.</li>
          <li>To comply with legal obligations and prevent fraud/abuse.</li>
        </ul>

        <h2 className="legalH2">3) Cookies & Tracking</h2>
        <p className="legalP">
          We may use cookies or similar technologies to keep you logged in, remember preferences, and improve
          your experience. You can control cookies through your browser settings.
        </p>

        <h2 className="legalH2">4) Data Sharing</h2>
        <p className="legalP">
          We do not sell your personal information. We may share data with trusted service providers (hosting,
          analytics, security) only when needed to operate the service, and with appropriate protections.
        </p>

        <h2 className="legalH2">5) Data Security</h2>
        <p className="legalP">
          We use reasonable security measures to protect your data. However, no method of transmission or
          storage is 100% secure. Please keep your password private and use a strong password.
        </p>

        <h2 className="legalH2">6) Your Rights</h2>
        <ul className="legalList">
          <li>Request access, correction, or deletion of your personal data (where applicable).</li>
          <li>Opt out of non-essential communications.</li>
        </ul>

        <h2 className="legalH2">7) Contact</h2>
        <p className="legalP">
          If you have questions about this Privacy Policy, contact us via the Contact Us page.
        </p>
      </div>
    </div>
  );
}
