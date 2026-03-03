import "./LegalPages.css";

export default function TermsOfService() {
  return (
    <div className="legalPage">
      <div className="legalCard">
        <h1 className="legalTitle">Terms of Service</h1>
        <p className="legalMeta">Last updated: {new Date().toLocaleDateString()}</p>

        <p className="legalP">
          These Terms of Service (“Terms”) govern your use of eorder.io (“we”, “us”, “our”). By accessing or
          using the platform, you agree to these Terms.
        </p>

        <h2 className="legalH2">1) Eligibility</h2>
        <p className="legalP">
          You must be able to form a legally binding agreement in your country/region to use our services.
        </p>

        <h2 className="legalH2">2) Account & Security</h2>
        <ul className="legalList">
          <li>You are responsible for maintaining account confidentiality and all activities under your account.</li>
          <li>Provide accurate information and keep your email/credentials updated.</li>
          <li>Do not share passwords or verification codes.</li>
        </ul>

        <h2 className="legalH2">3) Acceptable Use</h2>
        <ul className="legalList">
          <li>No fraud, fake screenshots, fake transaction proof, or manipulated data.</li>
          <li>No duplicate or multiple accounts intended to abuse promotions or systems.</li>
          <li>No attempts to exploit or disrupt the platform (including bots, scraping, or attacks).</li>
        </ul>

        <h2 className="legalH2">4) Payments, Withdrawals & Verification</h2>
        <p className="legalP">
          Deposits/withdrawals may require verification checks for security and compliance. Processing time can
          vary based on network and verification requirements.
        </p>

        <h2 className="legalH2">5) Suspension or Termination</h2>
        <p className="legalP">
          We may suspend or terminate accounts involved in suspicious activity, policy violations, or security
          risks. We may also restrict features to protect the platform.
        </p>

        <h2 className="legalH2">6) Disclaimer</h2>
        <p className="legalP">
          The platform is provided “as is” and “as available.” We do not guarantee uninterrupted access or that
          the service will be error-free.
        </p>

        <h2 className="legalH2">7) Limitation of Liability</h2>
        <p className="legalP">
          To the maximum extent permitted by law, we are not liable for indirect or consequential damages
          arising from your use of the platform.
        </p>

        <h2 className="legalH2">8) Changes</h2>
        <p className="legalP">
          We may update these Terms from time to time. Continued use of the platform means you accept the updated Terms.
        </p>

        <h2 className="legalH2">9) Contact</h2>
        <p className="legalP">
          For questions about these Terms, please use the Contact Us page.
        </p>
      </div>
    </div>
  );
}
