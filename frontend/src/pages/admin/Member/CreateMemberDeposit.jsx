// src/pages/CreateMemberDeposit.jsx
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../../services/api";
import AppLayout from "../../../components/AppLayout";
import { getUser } from "../../../auth";
import "./Members.css";

// Keep same asset list style you used in member deposit page
const ASSETS = [
  {
    symbol: "USDT",
    name: "Tether",
    networks: ["TRC20", "BEP20", "ERC20"],
  },
  {
    symbol: "BTC",
    name: "Bitcoin",
    networks: ["BTC"],
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    networks: ["ERC20"],
  },
  {
    symbol: "BNB",
    name: "BNB",
    networks: ["BEP20"],
  },
];

export default function CreateMemberDeposit() {
  const me = getUser();
  const canCreate = me?.role === "owner" || me?.role === "agent";
  const nav = useNavigate();
  const { memberId } = useParams();

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("bank"); // "crypto" | "bank"
  const [asset, setAsset] = useState("USDT");
  const [network, setNetwork] = useState("TRC20");
  const [txRef, setTxRef] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const assetObj = useMemo(() => ASSETS.find((a) => a.symbol === asset) || ASSETS[0], [asset]);
  const networks = assetObj.networks;

  const onChangeMethod = (v) => {
    setMethod(v);
    setErr("");
    if (v === "crypto") {
      const a = ASSETS.find((x) => x.symbol === asset) || ASSETS[0];
      const defNet = a.networks[0] || "";
      setNetwork(defNet);
    }
  };

  const onChangeAsset = (sym) => {
    setAsset(sym);
    const a = ASSETS.find((x) => x.symbol === sym) || ASSETS[0];
    const defNet = a.networks[0] || "";
    setNetwork(defNet);
  };

  const submit = async () => {
    if (!canCreate) return setErr("Only owner or agent can create deposits");

    setErr("");
    const n = Number(amount || 0);
    if (!n || n <= 0) return setErr("Deposit amount must be > 0");

    const txRefClean = String(txRef || "").trim();
    const proofUrlClean = String(proofUrl || "").trim();

    // Validate crypto requirements (matches backend)
    if (method === "crypto") {
      if (!asset) return setErr("Asset is required for crypto deposit");
      if (!network) return setErr("Network is required for crypto deposit");
    }

    // Prepare payload exactly as backend expects
    const payload = {
      member_id: Number(memberId),
      amount: n,
      method: method === "crypto" ? "crypto" : "bank",
      ...(method === "crypto" ? { asset, network } : {}),
      ...(txRefClean ? { tx_ref: txRefClean } : {}),
      ...(proofUrlClean ? { proof_url: proofUrlClean } : {}),
    };

    setBusy(true);
    try {
      const response = await api.post("/deposits", payload);
      // Success → redirect to wallet with deposits tab active
      nav(`/members/${memberId}/wallet?tab=deposits`);
    } catch (e) {
      // Show exact backend error message if available
      const backendMsg = e?.response?.data?.message;
      setErr(backendMsg || "Failed to create deposit. Please try again.");
      console.error("Deposit creation error:", e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppLayout>
      <div className="container">
        <div className="topbar">
          <div>
            <h2>💰 Create Deposit</h2>
            <div className="small">
              Member ID: <span className="badge">{memberId}</span>
            </div>
          </div>
          <button className="btn btn-secondary" onClick={() => nav(-1)} disabled={busy} type="button">
            ← Back
          </button>
        </div>
        {err && <div className="error">{err}</div>}
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
              onClick={() => !busy && onChangeMethod("crypto")}
            >
              🪙 Cryptocurrency
            </div>
            <div
              className={`method-option ${method === "bank" ? "active" : ""}`}
              onClick={() => !busy && onChangeMethod("bank")}
            >
              🏦 Bank Transfer
            </div>
          </div>
          {/* Crypto-specific fields */}
          {method === "crypto" && (
            <div>
              <div className="form-group">
                <label>Asset *</label>
                <select value={asset} onChange={(e) => onChangeAsset(e.target.value)} disabled={busy}>
                  {ASSETS.map((a) => (
                    <option key={a.symbol} value={a.symbol}>
                      {a.symbol} — {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Network *</label>
                <select value={network} onChange={(e) => setNetwork(e.target.value)} disabled={busy}>
                  {networks.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
        {/* Transaction Details */}
        <div className="form-section">
          <div className="form-section-header">
            <div className="form-section-icon">📋</div>
            <h3>Transaction</h3>
          </div>
          <div className="form-group">
            <label>Reference</label>
            <input
              value={txRef}
              onChange={(e) => setTxRef(e.target.value)}
              placeholder="Optional"
              disabled={busy}
            />
          </div>
          <div className="form-group">
            <label>Proof URL</label>
            <input
              value={proofUrl}
              onChange={(e) => setProofUrl(e.target.value)}
              placeholder="Optional"
              disabled={busy}
            />
          </div>
        </div>
        {/* Submit Actions */}
        <div className="action-buttons">
          <button className="btn btn-success" type="button" onClick={submit} disabled={busy}>
            {busy ? "⏳ Creating..." : "✅ Create Deposit"}
          </button>
        </div>
      </div>
    </AppLayout>
  );
}