// src/pages/CreateMemberWithdrawal.jsx
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../../services/api";
import AppLayout from "../../../components/AppLayout";
import { getUser } from "../../../auth";
import "./Members.css";

const CRYPTO_ASSETS = ["USDT", "BTC", "ETH", "BNB"];
const NETWORKS_BY_ASSET = {
  USDT: ["TRC20", "ERC20", "BEP20"],
  BTC: ["BTC"],
  ETH: ["ERC20"],
  BNB: ["BEP20"],
};

// optional: you can replace this with your real list
const BANK_COUNTRIES = [
  { code: "KH", name: "Cambodia" },
  { code: "TH", name: "Thailand" },
  { code: "VN", name: "Vietnam" },
  { code: "MY", name: "Malaysia" },
];

export default function CreateMemberWithdrawal() {
  const me = getUser();
  // Owner can create + review; agent can create but not review
  const canCreate = me?.role === "owner" || me?.role === "agent";
  const canReview = me?.role === "owner";

  const nav = useNavigate();
  const { memberId } = useParams();

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("crypto"); // "crypto" | "bank"

  // crypto fields
  const [asset, setAsset] = useState("USDT");
  const networks = useMemo(() => NETWORKS_BY_ASSET[asset] || ["TRC20"], [asset]);
  const [network, setNetwork] = useState(networks[0] || "TRC20");
  const [walletAddress, setWalletAddress] = useState("");

  // bank fields
  const [bankCountry, setBankCountry] = useState("KH");
  const [bankName, setBankName] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [branchName, setBranchName] = useState("");

  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [busy, setBusy] = useState(false);

  // keep network valid when asset changes
  const onChangeAsset = (a) => {
    setAsset(a);
    const ns = NETWORKS_BY_ASSET[a] || [];
    setNetwork(ns[0] || "");
    setWalletAddress("");
  };

  const validate = () => {
    const n = Number(amount || 0);
    if (!canCreate) return "Only owner or agent can create withdrawals";
    if (!n || n <= 0) return "Withdraw amount must be > 0";

    if (method === "crypto") {
      if (!asset) return "Asset required";
      if (!network) return "Network required";
      if (!walletAddress.trim()) return "Wallet address required";
      if (walletAddress.trim().length < 10) return "Wallet address looks too short";
    }

    if (method === "bank") {
      if (!bankCountry) return "Bank country required";
      if (!bankName.trim()) return "Bank name required";
      if (!accountHolderName.trim()) return "Account holder name required";
      if (!accountNumber.trim()) return "Account number required";
    }

    return "";
  };

  const buildAccountDetails = () => {
    if (method === "crypto") {
      const addr = walletAddress.trim();
      const short = addr ? `${addr.slice(0, 8)}…${addr.slice(-6)}` : "-";
      return `Crypto • ${asset} (${network}) • ${short}`;
    }

    // bank
    const acc = accountNumber.trim();
    const masked = acc ? `****${acc.slice(-4)}` : "-";
    return `Bank • ${bankName.trim()} • ${accountHolderName.trim()} • ${masked}`;
  };

  const submit = async () => {
    setErr("");
    setOk("");

    const msg = validate();
    if (msg) return setErr(msg);

    setBusy(true);
    try {
      const n = Number(amount || 0);

      const payload =
        method === "crypto"
          ? {
              member_id: Number(memberId),
              amount: n,
              method: "crypto",
              account_details: buildAccountDetails(),

              // crypto-only
              asset,
              network,
              wallet_address: walletAddress.trim(),
            }
          : {
              member_id: Number(memberId),
              amount: n,
              method: "bank",
              account_details: buildAccountDetails(),

              // bank-only
              bank_country: bankCountry,
              bank_name: bankName.trim(),
              account_holder_name: accountHolderName.trim(),
              account_number: accountNumber.trim(),
              routing_number: routingNumber.trim() || null,
              branch_name: branchName.trim() || null,
            };

      await api.post("/withdrawals", payload);
      nav(`/members/${memberId}/wallet?tab=withdrawals`);
    } catch (e) {
      setErr(e?.response?.data?.message || "Create withdrawal failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppLayout>
      <div className="container">
        <div className="topbar">
          <div>
            <h2>💸 Create Withdrawal</h2>
            <div className="small">
              Member ID: <span className="badge">{memberId}</span>
            </div>
          </div>
          <button className="btn btn-secondary" onClick={() => nav(-1)} disabled={busy}>
            ← Back
          </button>
        </div>

        {err && <div className="error">{err}</div>}
        {ok && <div className="ok">{ok}</div>}

        {/* Amount Section */}
        <div className="form-section">
          <div className="form-section-header">
            <div className="form-section-icon">💵</div>
            <h3>Amount</h3>
          </div>
          
          <div className="form-group">
            <label>Amount *</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              disabled={busy}
              inputMode="decimal"
              min="0"
              step="any"
            />
          </div>
        </div>

        {/* Method Selection */}
        <div className="form-section">
          <div className="form-section-header">
            <div className="form-section-icon">🔀</div>
            <h3>Method</h3>
          </div>

          <div className="method-switcher">
            <div 
              className={`method-option ${method === "crypto" ? "active" : ""}`}
              onClick={() => {
                if (!busy) {
                  setMethod("crypto");
                  setErr("");
                }
              }}
            >
              🪙 Cryptocurrency
            </div>
            <div 
              className={`method-option ${method === "bank" ? "active" : ""}`}
              onClick={() => {
                if (!busy) {
                  setMethod("bank");
                  setErr("");
                }
              }}
            >
              🏦 Bank Transfer
            </div>
          </div>
        </div>

        {/* Crypto Destination Details */}
        {method === "crypto" && (
          <div className="form-section">
            <div className="form-section-header">
              <div className="form-section-icon">🪙</div>
              <h3>Crypto Details</h3>
            </div>

            <div className="form-group">
              <label>Asset *</label>
              <select
                value={asset}
                onChange={(e) => onChangeAsset(e.target.value)}
                disabled={busy}
              >
                {CRYPTO_ASSETS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Network *</label>
              <select
                value={network}
                onChange={(e) => setNetwork(e.target.value)}
                disabled={busy}
              >
                {networks.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Wallet Address *</label>
              <input
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="Enter wallet address"
                disabled={busy}
                autoComplete="off"
              />
            </div>
          </div>
        )}

        {/* Bank Destination Details */}
        {method === "bank" && (
          <div className="form-section">
            <div className="form-section-header">
              <div className="form-section-icon">🏦</div>
              <h3>Bank Details</h3>
            </div>

            <div className="form-group">
              <label>Country *</label>
              <select
                value={bankCountry}
                onChange={(e) => setBankCountry(e.target.value)}
                disabled={busy}
              >
                {BANK_COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Bank Name *</label>
              <input
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="Enter bank name"
                disabled={busy}
              />
            </div>

            <div className="form-group">
              <label>Account Holder *</label>
              <input
                value={accountHolderName}
                onChange={(e) => setAccountHolderName(e.target.value)}
                placeholder="Full name"
                disabled={busy}
              />
            </div>

            <div className="form-group">
              <label>Account Number *</label>
              <input
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Enter account number"
                disabled={busy}
                inputMode="numeric"
                autoComplete="off"
              />
            </div>

            <div className="form-group">
              <label>Routing / SWIFT</label>
              <input
                value={routingNumber}
                onChange={(e) => setRoutingNumber(e.target.value)}
                placeholder="Optional"
                disabled={busy}
                inputMode="numeric"
              />
            </div>

            <div className="form-group">
              <label>Branch</label>
              <input
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                placeholder="Optional"
                disabled={busy}
              />
            </div>
          </div>
        )}

        {/* Submit Actions */}
        <div className="action-buttons">
          <button className="btn btn-success" type="button" onClick={submit} disabled={busy}>
            {busy ? "⏳ Processing..." : "✅ Create Withdrawal"}
          </button>
        </div>

        <div className="info-box">
          <span className="info-box-icon">⚠️</span>
          <div className="info-box-content">
            <strong>Withdrawal Process:</strong> Upon creation, balance decreases and locked amount increases immediately. 
            If rejected, funds return to balance. If approved, locked funds are released and transaction is processed.
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
