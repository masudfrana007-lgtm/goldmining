// src/pages/CreateMemberDeposit.jsx
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../../services/api";
import AppLayout from "../../../components/AppLayout";
import { getUser } from "../../../auth";

const ASSETS = [
  { symbol: "USDT", name: "Tether", networks: ["TRC20", "BEP20", "ERC20"] },
  { symbol: "BTC", name: "Bitcoin", networks: ["BTC"] },
  { symbol: "ETH", name: "Ethereum", networks: ["ERC20"] },
  { symbol: "BNB", name: "BNB", networks: ["BEP20"] },
];

export default function CreateMemberDeposit() {
  const me = getUser();
  const canCreate = me?.role === "owner" || me?.role === "agent";
  const nav = useNavigate();
  const { memberId } = useParams();

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("bank");
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
      setNetwork(a.networks[0] || "");
    }
  };

  const onChangeAsset = (sym) => {
    setAsset(sym);
    const a = ASSETS.find((x) => x.symbol === sym) || ASSETS[0];
    setNetwork(a.networks[0] || "");
  };

  const submit = async () => {
    if (!canCreate) return setErr("Only owner or agent can create deposits");
    setErr("");

    const n = Number(amount || 0);
    if (!n || n <= 0) return setErr("Deposit amount must be > 0");

    if (method === "crypto") {
      if (!asset) return setErr("Asset is required for crypto deposit");
      if (!network) return setErr("Network is required for crypto deposit");
    }

    const payload = {
      member_id: Number(memberId),
      amount: n,
      method: method === "crypto" ? "crypto" : "bank",
      ...(method === "crypto" ? { asset, network } : {}),
      ...(txRef.trim() ? { tx_ref: txRef.trim() } : {}),
      ...(proofUrl.trim() ? { proof_url: proofUrl.trim() } : {}),
    };

    setBusy(true);
    try {
      await api.post("/deposits", payload);
      nav(`/members/${memberId}/wallet?tab=deposits`);
    } catch (e) {
      const backendMsg = e?.response?.data?.message;
      setErr(backendMsg || "Failed to create deposit. Please try again.");
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
            <h2>💰 Create Deposit</h2>
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
        <div className="members-table-card">   {/* Reusing members table card style */}

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

          {/* Method Section */}
          <div className="members-form-group">
            <label>Method</label>
            <div className="method-switcher">   {/* We'll style this below */}
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

            {method === "crypto" && (
              <>
                <div className="members-form-group">
                  <label>Asset <span className="required">*</span></label>
                  <select 
                    value={asset} 
                    onChange={(e) => onChangeAsset(e.target.value)} 
                    disabled={busy}
                  >
                    {ASSETS.map((a) => (
                      <option key={a.symbol} value={a.symbol}>
                        {a.symbol} — {a.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="members-form-group">
                  <label>Network <span className="required">*</span></label>
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
              </>
            )}
          </div>

          {/* Transaction Details */}
          <div className="members-form-group">
            <label>Reference</label>
            <input
              value={txRef}
              onChange={(e) => setTxRef(e.target.value)}
              placeholder="Optional (e.g. Transaction ID)"
              disabled={busy}
            />
          </div>

          <div className="members-form-group">
            <label>Proof URL</label>
            <input
              value={proofUrl}
              onChange={(e) => setProofUrl(e.target.value)}
              placeholder="Optional (screenshot or receipt link)"
              disabled={busy}
            />
          </div>

          {/* Submit Button */}
          <div className="members-form-actions">
            <button
              className="members-btn members-btn-primary members-btn-large"
              type="button"
              onClick={submit}
              disabled={busy}
            >
              {busy ? "⏳ Creating Deposit..." : "✅ Create Deposit"}
            </button>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}