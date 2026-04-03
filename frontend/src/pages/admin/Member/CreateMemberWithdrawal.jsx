// src/pages/CreateMemberWithdrawal.jsx
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../../services/api";
import AppLayout from "../../../components/AppLayout";
import { getUser } from "../../../auth";

const CRYPTO_ASSETS = ["USDT", "BTC", "ETH", "BNB"];

const NETWORKS_BY_ASSET = {
  USDT: ["TRC20", "ERC20", "BEP20"],
  BTC: ["BTC"],
  ETH: ["ERC20"],
  BNB: ["BEP20"],
};

const BANK_COUNTRIES = [
  { code: "KH", name: "Cambodia" },
  { code: "TH", name: "Thailand" },
  { code: "VN", name: "Vietnam" },
  { code: "MY", name: "Malaysia" },
];

export default function CreateMemberWithdrawal() {
  const me = getUser();
  const canCreate = me?.role === "owner" || me?.role === "agent";
  const nav = useNavigate();
  const { memberId } = useParams();

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("crypto");
  const [asset, setAsset] = useState("USDT");
  const [network, setNetwork] = useState("TRC20");
  const [walletAddress, setWalletAddress] = useState("");

  const [bankCountry, setBankCountry] = useState("KH");
  const [bankName, setBankName] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [branchName, setBranchName] = useState("");

  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const networks = useMemo(() => NETWORKS_BY_ASSET[asset] || ["TRC20"], [asset]);

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

  const submit = async () => {
    setErr("");
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
              asset,
              network,
              wallet_address: walletAddress.trim(),
            }
          : {
              member_id: Number(memberId),
              amount: n,
              method: "bank",
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
      setErr(e?.response?.data?.message || "Failed to create withdrawal");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppLayout>
      <div className="members-container">

        {/* Top Bar - Consistent with Members page */}
        <div className="members-topbar">
          <div>
            <h2>💸 Create Withdrawal</h2>
            <div className="small">
              Member ID: <span className="badge">{memberId}</span>
            </div>
          </div>
          <button
            className="members-btn members-btn-secondary"
            onClick={() => nav(-1)}
            disabled={busy}
            type="button"
          >
            ← Back
          </button>
        </div>

        {err && <div className="members-error">{err}</div>}

        {/* Main Form Card */}
        <div className="members-table-card">

          {/* Amount Section */}
          <div className="members-form-group">
            <label>Amount <span className="required">*</span></label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              disabled={busy}
              min="0"
              step="any"
            />
          </div>

          {/* Method Selection */}
          <div className="members-form-group">
            <label>Method</label>
            <div className="method-switcher">
              <div
                className={`method-option ${method === "crypto" ? "active" : ""}`}
                onClick={() => !busy && setMethod("crypto")}
              >
                🪙 Cryptocurrency
              </div>
              <div
                className={`method-option ${method === "bank" ? "active" : ""}`}
                onClick={() => !busy && setMethod("bank")}
              >
                🏦 Bank Transfer
              </div>
            </div>
          </div>

          {/* Crypto Details */}
          {method === "crypto" && (
            <>
              <div className="members-form-group">
                <label>Asset <span className="required">*</span></label>
                <select value={asset} onChange={(e) => onChangeAsset(e.target.value)} disabled={busy}>
                  {CRYPTO_ASSETS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>

              <div className="members-form-group">
                <label>Network <span className="required">*</span></label>
                <select value={network} onChange={(e) => setNetwork(e.target.value)} disabled={busy}>
                  {networks.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>

              <div className="members-form-group">
                <label>Wallet Address <span className="required">*</span></label>
                <input
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder="Enter full wallet address"
                  disabled={busy}
                  autoComplete="off"
                />
              </div>
            </>
          )}

          {/* Bank Details */}
          {method === "bank" && (
            <>
              <div className="members-form-group">
                <label>Country <span className="required">*</span></label>
                <select value={bankCountry} onChange={(e) => setBankCountry(e.target.value)} disabled={busy}>
                  {BANK_COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="members-form-group">
                <label>Bank Name <span className="required">*</span></label>
                <input
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="Enter bank name"
                  disabled={busy}
                />
              </div>

              <div className="members-form-group">
                <label>Account Holder Name <span className="required">*</span></label>
                <input
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                  placeholder="Full name as per bank record"
                  disabled={busy}
                />
              </div>

              <div className="members-form-group">
                <label>Account Number <span className="required">*</span></label>
                <input
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Enter account number"
                  disabled={busy}
                  inputMode="numeric"
                />
              </div>

              <div className="members-form-group">
                <label>Routing / SWIFT Code</label>
                <input
                  value={routingNumber}
                  onChange={(e) => setRoutingNumber(e.target.value)}
                  placeholder="Optional"
                  disabled={busy}
                />
              </div>

              <div className="members-form-group">
                <label>Branch Name</label>
                <input
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  placeholder="Optional"
                  disabled={busy}
                />
              </div>
            </>
          )}

          {/* Submit Button */}
          <div className="members-form-actions">
            <button
              className="members-btn members-btn-primary members-btn-large"
              type="button"
              onClick={submit}
              disabled={busy}
            >
              {busy ? "⏳ Processing..." : "✅ Create Withdrawal"}
            </button>
          </div>

          {/* Info Box */}
          <div className="members-form-group" style={{ marginTop: "28px", background: "#f9fafb", padding: "16px", borderRadius: "8px", border: "1px solid #e5e7eb", color: "black" }}>
            <strong style={{ color: "#374151" }}>Withdrawal Process:</strong><br />
            Upon creation, balance decreases and locked amount increases immediately. 
            If rejected, funds return to balance. If approved, locked funds are released.
          </div>

        </div>
      </div>
    </AppLayout>
  );
}