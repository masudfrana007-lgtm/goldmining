// src/pages/DepositBank.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./memberDepositBank.css";

function money(n) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(n);
}

/** Load ALL countries automatically */
function getAllCountries() {
  try {
    const regions = Intl.supportedValuesOf("region");
    const dn = new Intl.DisplayNames(["en"], { type: "region" });
    return regions
      .map((code) => ({ code, name: dn.of(code) || code }))
      .filter((x) => x.name && x.name.toLowerCase() !== "unknown region")
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    return [
      { code: "KH", name: "Cambodia" },
      { code: "TH", name: "Thailand" },
      { code: "VN", name: "Vietnam" },
      { code: "MY", name: "Malaysia" },
      { code: "US", name: "United States" },
      { code: "GB", name: "United Kingdom" },
    ];
  }
}

/** Demo banks by country (replace with backend later) */
const BANKS_BY_COUNTRY = {
  KH: ["ABA Bank", "ACLEDA Bank", "Wing"],
  TH: ["Kasikornbank", "SCB", "Krungthai Bank"],
  VN: ["Vietcombank", "Techcombank"],
  MY: ["Maybank", "CIMB"],
};

function statusKey(s) {
  return String(s || "").toLowerCase();
}

// --- backend -> UI mapping ---
function mapDbToUi(dbStatus) {
  const s = String(dbStatus || "").toLowerCase();
  if (s === "approved") return "Credited";
  if (s === "rejected") return "Rejected";
  return "Reviewing";
}

function timelineForUiStatus(uiStatus) {
  if (uiStatus === "Credited") return ["Submitted", "Reviewing", "Processing", "Credited"];
  if (uiStatus === "Rejected") return ["Submitted", "Reviewing", "Rejected"];
  return ["Submitted", "Reviewing"];
}

function fmtDate(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

/**
 * Put these logo images in: public/partners/
 * - visa.png, mastercard.png, unionpay.png, paypal.png, stripe.png
 * - swift.png, hsbc.png, citi.png, standardchartered.png, barclays.png
 */
const PARTNER_LOGOS = [
  { name: "Visa", src: "/partners/visa.png" },
  { name: "Mastercard", src: "/partners/mastercard.png" },
  { name: "UnionPay", src: "/partners/unionpay.png" },
  { name: "PayPal", src: "/partners/paypal.png" },
  { name: "Stripe", src: "/partners/stripe.png" },
  { name: "SWIFT", src: "/partners/swift.png" },
  { name: "HSBC", src: "/partners/hsbc.png" },
  { name: "Citi", src: "/partners/citi.png" },
  { name: "Standard Chartered", src: "/partners/standardchartered.png" },
  { name: "Barclays", src: "/partners/barclays.png" },
];

/** ✅ Local DEMO storage (no API) */
const DEMO = {
  balance: 0,
  deposits: [
    // Example:
    // {
    //   id: "DP-123456",
    //   created_at: new Date().toISOString(),
    //   amount: 100,
    //   status: "pending", // pending/approved/rejected
    //   method: "bank",
    //   network: "ABA Bank",
    //   country: "KH",
    // }
  ],
};

export default function DepositBank() {
  const nav = useNavigate();

  const MIN_DEPOSIT = 10;

  // ✅ local balance
  const [balance, setBalance] = useState(0);

  const countries = useMemo(() => getAllCountries(), []);
  const [country, setCountry] = useState("KH");

  const banks = useMemo(() => BANKS_BY_COUNTRY[country] || [], [country]);
  const [bank, setBank] = useState("");

  // Payer details (who is sending)
  const [payerName, setPayerName] = useState("");
  const [payerAccount, setPayerAccount] = useState("");

  // Receiving bank details (optional fields to help match)
  const [reference, setReference] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [branchNumber, setBranchNumber] = useState("");

  const [amount, setAmount] = useState("");

  // ✅ local history
  const [history, setHistory] = useState([]);

  // Inline validation + submit lock
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const validateDeposit = () => {
    const next = {};

    if (!country) next.country = "Please select a country.";
    if (!bank) next.bank = "Please select a bank.";
    if (!payerName.trim()) next.payerName = "Please enter payer (sender) name.";
    if (!payerAccount.trim()) next.payerAccount = "Please enter payer account number.";

    const amt = Number(amount || 0);
    if (!amount || Number.isNaN(amt) || amt <= 0) next.amount = "Enter a valid amount.";
    else if (amt < MIN_DEPOSIT) next.amount = `Minimum deposit is ${MIN_DEPOSIT} USD.`;

    // Reference is recommended, not required
    if (reference && reference.trim().length < 4) next.reference = "Reference is too short (min 4 chars).";

    return next;
  };

  const isReadyToSubmit = () => Object.keys(validateDeposit()).length === 0;

  // ✅ load balance (local)
  const loadMe = async () => {
    setBalance(Number(DEMO.balance || 0));
  };

  // ✅ load deposits (local) and map to UI
  const loadDeposits = async () => {
    setLoadingHistory(true);
    try {
      const arr = Array.isArray(DEMO.deposits) ? DEMO.deposits : [];
      const bankOnly = arr.filter((d) => String(d?.method || "").toLowerCase() === "bank");

      const mapped = bankOnly.map((d) => {
        const uiS = mapDbToUi(d?.status);
        return {
          id: d?.id || d?.tx_ref || `DP-${Math.floor(100000 + Math.random() * 900000)}`,
          date: fmtDate(d?.created_at),
          amount: Number(d?.amount || 0),
          status: uiS,
          timeline: timelineForUiStatus(uiS),
          bank: d?.network || "",
          country: d?.country || "",
          _raw: d,
        };
      });

      setHistory(mapped);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadMe();
    loadDeposits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async () => {
    if (isSubmitting) return;

    const next = validateDeposit();
    setErrors(next);
    if (Object.keys(next).length) return;

    setIsSubmitting(true);
    try {
      const n = Number(amount);

      // If user didn't type a reference, generate one
      const txRef = reference?.trim()
        ? reference.trim()
        : `DP-${Math.floor(100000 + Math.random() * 900000)}`;

      const newRow = {
        id: txRef,
        created_at: new Date().toISOString(),
        amount: n,
        status: "pending", // pending/approved/rejected demo
        method: "bank",
        network: bank,
        country,
        sender_name: payerName.trim(),
        sender_account: payerAccount.trim(),
        routing_number: routingNumber.trim(),
        branch_number: branchNumber.trim(),
      };

      DEMO.deposits = [newRow, ...(DEMO.deposits || [])];

      setAmount("");
      setPayerName("");
      setPayerAccount("");
      setReference("");
      setRoutingNumber("");
      setBranchNumber("");

      setErrors((prev) => ({ ...prev, form: "Deposit request submitted ✅" }));
      setTimeout(() => setErrors((p) => ({ ...p, form: "" })), 2500);

      await loadMe();
      await loadDeposits();
    } catch {
      alert("Failed to submit deposit");
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = ["Submitted", "Reviewing", "Processing", "Credited"];

  return (
    <div className="vipWhite db3">
      {/* Top bar */}
      <header className="dcTop">
        <button className="dcBack" onClick={() => nav(-1)} aria-label="Back">
          ←
        </button>

        <div className="topTitle">
          <div className="topBrandRow">
            <span className="topBrand">Deposit by Bank</span>
            <span className="vipBadge vipBadgeAx">Secure</span>
          </div>
          <div className="topSub">Submit your deposit details for faster verification</div>
        </div>

        <button className="dcHistoryBtn" onClick={() => nav("/member/deposit/records")}>
          History
        </button>
      </header>

      {/* ✅ Frozen supported networks block */}
      <section className="db3-netSticky" aria-label="Supported networks">
        <div className="db3-netInner">
          <div className="db3-netTitle">
            Supported Networks <span className="db3-netChip">Verified</span>
          </div>

          <div className="db3-marquee" aria-label="Partner logos">
            <div className="db3-track">
              {[...PARTNER_LOGOS, ...PARTNER_LOGOS].map((l, idx) => (
                <div key={l.name + idx} className="db3-logoPill" title={l.name}>
                  <img className="db3-logoImg" src={l.src} alt={l.name} loading="lazy" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <main className="wrapW">
        {/* Balance block */}
        <section className="balanceCardAx">
          <div className="balanceLeft">
            <div className="balanceLabelAx">Current Balance</div>

            <div className="balanceValueW">
              {money(balance)} <span className="unitW">USD</span>
            </div>

            <div className="metaRowW">
              <span className="pillW pillAx">Min {MIN_DEPOSIT} USD</span>
              <span className="pillW pillAx">Verification up to 24h</span>
              <span className="pillW pillAx">Anti-fraud checks</span>
            </div>
          </div>

          <div className="balanceRightW balanceRightAx">
            <div className="miniInfo">
              <div className="miniLabelAx">Status</div>
              <div className="miniValue">Active</div>
            </div>

            <div className="miniInfo">
              <div className="miniLabelAx">Minimum</div>
              <div className="miniValue">{MIN_DEPOSIT} USD</div>
            </div>
          </div>
        </section>

        {/* Deposit Request */}
        <section className="cardW db3-requestCard" id="deposit-request">
          <div className="db3-cardHead">
            <h2 className="h2W">Deposit Request</h2>
            <span className="smallMutedW">Enter real bank transfer info</span>
          </div>

          {errors.form ? <div className="db3-banner">{errors.form}</div> : null}

          <div className="db3-grid">
            <div className="db3-field">
              <label>Country</label>
              <select
                value={country}
                onChange={(e) => {
                  setCountry(e.target.value);
                  setErrors((p) => ({ ...p, country: "" }));
                  setBank("");
                }}
              >
                {countries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.country ? (
                <div className="db3-error">{errors.country}</div>
              ) : (
                <div className="db3-help">Select the bank country where you sent the transfer.</div>
              )}
            </div>

            <div className="db3-field">
              <label>Bank</label>
              <select
                value={bank}
                onChange={(e) => {
                  setBank(e.target.value);
                  setErrors((p) => ({ ...p, bank: "" }));
                }}
              >
                <option value="">Select bank</option>
                {banks.length ? (
                  banks.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>
                    Bank list will appear after selecting a supported country.
                  </option>
                )}
              </select>
              {errors.bank ? (
                <div className="db3-error">{errors.bank}</div>
              ) : (
                <div className="db3-help">Banks load by selected country (demo list).</div>
              )}
            </div>

            <div className="db3-field">
              <label>Payer (Sender) Name</label>
              <input
                value={payerName}
                onChange={(e) => {
                  setPayerName(e.target.value);
                  setErrors((p) => ({ ...p, payerName: "" }));
                }}
                autoComplete="name"
                placeholder="Name on sender account"
              />
              {errors.payerName ? <div className="db3-error">{errors.payerName}</div> : null}
            </div>

            <div className="db3-field">
              <label>Payer Account Number</label>
              <input
                value={payerAccount}
                onChange={(e) => {
                  setPayerAccount(e.target.value);
                  setErrors((p) => ({ ...p, payerAccount: "" }));
                }}
                inputMode="numeric"
                autoComplete="off"
                placeholder="Sender account number"
              />
              {errors.payerAccount ? <div className="db3-error">{errors.payerAccount}</div> : null}
            </div>

            <div className="db3-field">
              <label>Reference / Transfer Note (recommended)</label>
              <input
                value={reference}
                onChange={(e) => {
                  setReference(e.target.value);
                  setErrors((p) => ({ ...p, reference: "" }));
                }}
                placeholder="e.g. MW-USER-1021"
                autoComplete="off"
              />
              {errors.reference ? (
                <div className="db3-error">{errors.reference}</div>
              ) : (
                <div className="db3-help">Use your unique reference to match deposit faster.</div>
              )}
            </div>

            <div className="db3-field">
              <label>Deposit Amount (USD)</label>
              <input
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setErrors((p) => ({ ...p, amount: "" }));
                }}
                placeholder="Enter amount"
                inputMode="decimal"
              />
              {errors.amount ? (
                <div className="db3-error">{errors.amount}</div>
              ) : (
                <div className="db3-help">Minimum: {MIN_DEPOSIT} USD</div>
              )}
            </div>

            <div className="db3-field">
              <label>Routing Number (optional)</label>
              <input value={routingNumber} onChange={(e) => setRoutingNumber(e.target.value)} inputMode="numeric" />
            </div>

            <div className="db3-field">
              <label>Branch Number (optional)</label>
              <input value={branchNumber} onChange={(e) => setBranchNumber(e.target.value)} inputMode="numeric" />
            </div>
          </div>

          <div className="db3-summary">
            <div>
              <span>Amount</span>
              <span>${money(Number(amount || 0))}</span>
            </div>
            <div className="strong">
              <span>Expected Credit</span>
              <span>${money(Number(amount || 0))}</span>
            </div>
          </div>

          {/* Desktop button */}
          <button
            className="db3-primaryBtn db3-desktopOnly"
            onClick={submit}
            type="button"
            disabled={isSubmitting || !isReadyToSubmit()}
          >
            {isSubmitting ? "Submitting..." : "Confirm Deposit"}
          </button>

          <p className="db3-note">
            Submit only real transfer details. Fake info, fake screenshots, or mismatched names may lead to rejection.
          </p>
        </section>

        {/* History */}
        <section className="cardW">
          <div className="db3-cardHead">
            <h2 className="h2W">Deposit History & Status</h2>
            <span className="smallMutedW">{loadingHistory ? "Loading…" : "Tracking timeline"}</span>
          </div>

          <div className="db3-history">
            {!loadingHistory && !history.length ? <div className="db3-banner">No bank deposit records found.</div> : null}

            {history.map((h) => (
              <div key={h.id} className="db3-historyCard">
                <div className="db3-historyTop">
                  <div>
                    <div className="db3-id">{h.id}</div>
                    <div className="db3-date">{h.date}</div>
                    {h.bank ? <div className="db3-metaLine">Bank: {h.bank}</div> : null}
                    {h.country ? <div className="db3-metaLine">Country: {h.country}</div> : null}
                  </div>

                  <div className="db3-historyActions">
                    <div className={"db3-status " + statusKey(h.status)}>{h.status}</div>
                  </div>
                </div>

                <div className="db3-historyAmount">${money(h.amount)}</div>

                <div className="db3-timeline">
                  {steps.map((step) => {
                    const done = h.timeline?.includes(step);
                    const rejected = h.status === "Rejected";

                    const dotClass =
                      rejected && (step === "Processing" || step === "Credited")
                        ? "failed"
                        : done
                        ? "done"
                        : "";

                    return (
                      <div key={step} className={"db3-step " + (done ? "doneText" : "")}>
                        <span className={"dot " + dotClass} />
                        <span>{step}</span>
                      </div>
                    );
                  })}
                </div>

                {h.status === "Rejected" && (
                  <div className="db3-failHint">Reason: details mismatch / invalid reference / compliance review.</div>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Sticky mobile confirm bar */}
      <div className="db3-stickyBar" role="region" aria-label="Deposit action bar">
        <div className="db3-stickyMeta">
          <div className="db3-stickyLabel">Amount</div>
          <div className="db3-stickyValue">${money(Number(amount || 0))}</div>
        </div>

        <button
          className="db3-stickyBtn"
          type="button"
          onClick={() => {
            submit();
            const next = validateDeposit();
            if (Object.keys(next).length) {
              document.getElementById("deposit-request")?.scrollIntoView({ behavior: "smooth", block: "start" });
            }
          }}
          disabled={isSubmitting || !isReadyToSubmit()}
        >
          {isSubmitting ? "Submitting..." : "Confirm"}
        </button>
      </div>
    </div>
  );
}