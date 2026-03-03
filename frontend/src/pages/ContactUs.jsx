import { useState } from "react";
import "./LegalPages.css";

export default function ContactUs() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    subject: "",
    message: "",
  });
  const [sent, setSent] = useState(false);

  function onChange(e) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  function onSubmit(e) {
    e.preventDefault();
    // For now: show success UI (later you can connect API/email)
    setSent(true);
  }

  return (
    <div className="legalPage">
      <div className="legalCard">
        <h1 className="legalTitle">Contact Us</h1>
        <p className="legalMeta">
          Need help? Send us a message and our support team will respond as soon as possible.
        </p>

        {sent ? (
          <div className="successBox">
            <div className="successTitle">Message sent ✅</div>
            <div className="successText">
              We received your request. Please keep your email active for replies.
            </div>

            <button className="legalBtn" onClick={() => setSent(false)}>
              Send another message
            </button>
          </div>
        ) : (
          <form className="contactForm" onSubmit={onSubmit}>
            <div className="grid2">
              <label className="field">
                <span className="label">Full Name</span>
                <input
                  name="fullName"
                  value={form.fullName}
                  onChange={onChange}
                  placeholder="Your name"
                  required
                />
              </label>

              <label className="field">
                <span className="label">Email</span>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={onChange}
                  placeholder="you@email.com"
                  required
                />
              </label>
            </div>

            <label className="field">
              <span className="label">Subject</span>
              <input
                name="subject"
                value={form.subject}
                onChange={onChange}
                placeholder="Account / Payment / Technical / Other"
                required
              />
            </label>

            <label className="field">
              <span className="label">Message</span>
              <textarea
                name="message"
                value={form.message}
                onChange={onChange}
                placeholder="Write your message…"
                rows={6}
                required
              />
            </label>

            <button className="legalBtn legalBtnGold" type="submit">
              Submit
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
