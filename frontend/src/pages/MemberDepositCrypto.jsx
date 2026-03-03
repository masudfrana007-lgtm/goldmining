// src/pages/MemberDepositCrypto.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./memberDepositCrypto.css";
import "./memberDepositBank.css";

const coins = [
  { code: "USDT", name: "Tether", icon: "/coins/usdt.png", networks: ["TRC20", "ERC20", "BEP20"] },
  { code: "BTC", name: "Bitcoin", icon: "/coins/btc.png", networks: ["BTC"] },
  { code: "ETH", name: "Ethereum", icon: "/coins/eth.png", networks: ["ERC20"] },
  { code: "BNB", name: "BNB", icon: "/coins/bnb.png", networks: ["BEP20"] },
  { code: "TRX", name: "TRON", icon: "/coins/trx.png", networks: ["TRC20"] },
];

function money(n) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 8 }).format(Number(n || 0));
}

function maskAddr(a = "") {
  if (!a) return "";
  if (a.length <= 16) return a;
  return `${a.slice(0, 10)}…${a.slice(-6)}`;
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

// db -> ui
function uiStatus(dbStatus) {
  const s = String(dbStatus || "").toLowerCase();
  if (s === "approved") return "Credited";
  if (s === "rejected") return "Rejected";
  return "Pending";
}

/** ✅ Local DEMO data (no API) */
const DEMO = {
  balance: 0,
  vip: {
    // Example structure:
    // "USDT|TRC20": { vip_rank:"V1", asset:"USDT", network:"TRC20", wallet_address:"...", photo_url:"/qr/usdt-trc20.png" }
    "USDT|TRC20": {
      vip_rank: "V1",
      asset: "USDT",
      network: "TRC20",
      wallet_address: "Txxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      photo_url: "", // optional: "/qr/usdt-trc20.png"
    },
    "USDT|ERC20": {
      vip_rank: "V1",
      asset: "USDT",
      network: "ERC20",
      wallet_address: "0xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      photo_url: "",
    },
    "USDT|BEP20": {
      vip_rank: "V1",
      asset: "USDT",
      network: "BEP20",
      wallet_address: "0xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      photo_url: "",
    },
    "BTC|BTC": {
      vip_rank: "V1",
      asset: "BTC",
      network: "BTC",
      wallet_address: "bc1qxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      photo_url: "",
    },
    "ETH|ERC20": {
      vip_rank: "V1",
      asset: "ETH",
      network: "ERC20",
      wallet_address: "0xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      photo_url: "",
    },
    "BNB|BEP20": {
      vip_rank: "V1",
      asset: "BNB",
      network: "BEP20",
      wallet_address: "0xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      photo_url: "",
    },
    "TRX|TRC20": {
      vip_rank: "V1",
      asset: "TRX",
      network: "TRC20",
      wallet_address: "Txxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      photo_url: "",
    },
  },
  deposits: [
    // demo rows
    // { id: 1, method:"crypto", asset:"USDT", network:"TRC20", amount: 50, status:"pending", created_at: new Date().toISOString(), tx_ref:"DP-1" }
  ],
};

export default function MemberDepositCrypto() {
  const nav = useNavigate();

  // ✅ Local balance
  const [balance, setBalance] = useState(0);

  // optional: show counts on page
  const [pendingCount, setPendingCount] = useState(0);
  const [creditedCount, setCreditedCount] = useState(0);

  // ✅ deposits (local)
  const [deposits, setDeposits] = useState([]);
  const [loadingDeposits, setLoadingDeposits] = useState(false);

  // UI inputs
  const minDeposit = 5;
  const confirmationsRequired = 12;

  const [coin, setCoin] = useState(coins[0]);
  const [network, setNetwork] = useState(coins[0].networks[0]);

  // ✅ VIP deposit slot (local)
  const [vipSlot, setVipSlot] = useState(null);
  const vipAddress = vipSlot?.wallet_address || "";
  const vipPhotoUrl = String(vipSlot?.photo_url || "").trim(); // keep as-is (no API host)

  // optional amount
  const [amount, setAmount] = useState("");
  const amountNum = useMemo(() => {
    const n = Number(amount);
    return Number.isFinite(n) ? n : 0;
  }, [amount]);

  // UI states
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  // ✅ load balance (local)
  const loadMe = async () => {
    setBalance(Number(DEMO.balance || 0));
  };

  // ✅ load deposits (local)
  const loadDeposits = async () => {
    setLoadingDeposits(true);
    try {
      const rows = Array.isArray(DEMO.deposits) ? DEMO.deposits : [];
      const cryptoOnly = rows.filter((x) => String(x?.method || "").toLowerCase() === "crypto");
      setDeposits(cryptoOnly);

      const p = cryptoOnly.filter((x) => String(x?.status || "").toLowerCase() === "pending").length;
      const a = cryptoOnly.filter((x) => String(x?.status || "").toLowerCase() === "approved").length;
      setPendingCount(p);
      setCreditedCount(a);
    } finally {
      setLoadingDeposits(false);
    }
  };

  // ✅ load VIP address + photo (local)
  const loadVipAddress = async (assetCode, net) => {
    const key = `${assetCode}|${net}`;
    setVipSlot(DEMO.vip[key] || null);
  };

  const refreshTop = async () => {
    await Promise.all([loadMe(), loadDeposits()]);
  };

  useEffect(() => {
    refreshTop();
    loadVipAddress(coins[0].code, coins[0].networks[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onSelectCoin(c) {
    setCoin(c);
    const net = c.networks[0];
    setNetwork(net);
    setCopied(false);
    loadVipAddress(c.code, net);
  }

  function onNetworkChange(n) {
    setNetwork(n);
    setCopied(false);
    loadVipAddress(coin.code, n);
  }

  async function copyAddress() {
    if (!vipAddress) return;
    try {
      await navigator.clipboard.writeText(vipAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = vipAddress;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    }
  }

  const depositHint = useMemo(() => {
    if (coin.code === "USDT") return "Send only USDT to this address.";
    return `Send only ${coin.code} to this address.`;
  }, [coin.code]);

  const amountOk = amountNum === 0 || amountNum >= minDeposit;

  // ✅ local submit (no API): adds a record to UI list
  const submitDeposit = async () => {
    const n = Number(amount || 0);
    if (!n || Number.isNaN(n) || n <= 0) return alert("Please enter amount.");
    if (n < minDeposit) return alert(`Minimum suggested deposit is ${minDeposit}.`);
    if (!coin?.code) return alert("Select coin.");
    if (!network) return alert("Select network.");
    if (!vipAddress) return alert("No VIP deposit address found for your package.");

    const newRow = {
      id: Date.now(),
      method: "crypto",
      asset: coin.code,
      network,
      amount: n,
      status: "pending",
      created_at: new Date().toISOString(),
      tx_ref: `DP-${String(Date.now()).slice(-6)}`,
    };

    // keep everything local + refresh UI
    DEMO.deposits = [newRow, ...(DEMO.deposits || [])];

    alert("Deposit submitted. Awaiting approval ✅");
    setAmount("");
    await refreshTop();
    nav("/member/deposit/records");
  };

  return (
    <div className="dcPage">
      {/* Header */}
      <header className="dcTop">
        <button className="dcBack" onClick={() => nav(-1)} aria-label="Back">
          ←
        </button>
        <div className="dcTitle">Deposit Crypto</div>
        <button className="dcHistoryBtn" onClick={() => nav("/member/deposit/records")}>
          History
        </button>
      </header>

      <div className="dcContainer">
        {/* Balance */}
        <section className="balanceCardAx">
          <div className="balanceLeft">
            <div className="balanceLabelAx">Wallet Balance</div>

            <div className="balanceValueW">
              {money(balance)} <span className="unitW">USDT</span>
            </div>

            <div className="metaRowW">
              <span className="pillW pillAx">Min {minDeposit}</span>
              <span className="pillW pillAx">{confirmationsRequired} confirmations</span>
              <span className="pillW pillAx">Secure deposit</span>
            </div>
          </div>

          <div className="balanceRightW balanceRightAx">
            <div className="miniInfo">
              <div className="miniLabelAx">Pending</div>
              <div className="miniValue">{pendingCount}</div>
            </div>

            <div className="miniInfo">
              <div className="miniLabelAx">Credited</div>
              <div className="miniValue">{creditedCount}</div>
            </div>

            <div className="miniInfo" style={{ gridColumn: "1 / -1" }}>
              <button
                type="button"
                onClick={refreshTop}
                className="pillW pillAx"
                style={{
                  width: "100%",
                  cursor: "pointer",
                  padding: "8px 12px",
                  border: "none",
                }}
              >
                Refresh Balance
              </button>
            </div>
          </div>
        </section>

        {/* Select Asset */}
        <section className="dcCoins">
          <div className="dcCoinsTitle">Select Asset</div>
          <div className="dcCoinRow">
            {coins.map((c) => (
              <button
                key={c.code}
                className={`dcCoin ${coin.code === c.code ? "active" : ""}`}
                onClick={() => onSelectCoin(c)}
                type="button"
              >
                <div className="dcCoinTop">
                  <img className="dcCoinIcon" src={c.icon} alt={c.code} />
                  <div className="dcCoinTexts">
                    <div className="dcCoinCode">{c.code}</div>
                    <div className="dcCoinName">{c.name}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="dcHelper">Tip: choose coin first, then select the correct network to avoid loss.</div>
        </section>

        {/* ✅ VIP Deposit Address */}
        <section className="dcWallet">
          <div className="dcWalletHead">
            <div className="dcWalletTitle">
              Deposit Address{" "}
              <span className="dcTag" style={{ marginLeft: 8 }}>
                {vipSlot?.vip_rank ? `VIP ${vipSlot.vip_rank.slice(1)}` : "VIP"}
              </span>
            </div>

            <button
              className="dcAddWallet"
              type="button"
              onClick={() => loadVipAddress(coin.code, network)}
              style={{ opacity: 0.9 }}
            >
              Refresh
            </button>
          </div>

          <div className="dcHint" style={{ marginTop: 6 }}>
            This address is assigned automatically based on your VIP package (VIP 1/2/3).
          </div>
        </section>

        {/* Deposit instructions + form */}
        <section className="dcCard">
          <div className="dcGrid">
            <div className="dcField">
              <label>Network</label>
              <select value={network} onChange={(e) => onNetworkChange(e.target.value)}>
                {coin.networks.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <div className="dcHint">Only send via the selected network.</div>
            </div>

            <div className="dcField">
              <label>Deposit Amount</label>
              <div className="dcAmountRow">
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  inputMode="decimal"
                  placeholder={`Min ${minDeposit}`}
                />
                <button type="button" onClick={() => setAmount("")}>
                  Clear
                </button>
              </div>

              <div className="dcCalc">
                You will receive after confirmations:{" "}
                <span>{amountNum > 0 ? `${money(amountNum)} ${coin.code}` : `— ${coin.code}`}</span>
              </div>

              {!amountOk && <div className="dcError">Minimum suggested deposit is {minDeposit}.</div>}
            </div>
          </div>

          <div className="dcField">
            <label>Deposit Address</label>

            <div className="dcAddressBox">
              <div className="dcAddressText">
                {vipAddress ? vipAddress : "No address found for your VIP rank / asset / network."}
              </div>

              <div className="dcAddressActions">
                <button className="dcMiniBtn" type="button" onClick={() => setShowQR(true)} disabled={!vipAddress}>
                  QR
                </button>
                <button className="dcMiniBtn" type="button" onClick={copyAddress} disabled={!vipAddress}>
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            <div className="dcHint">
              {depositHint} Transactions are credited after {confirmationsRequired} confirmations.
            </div>
          </div>

          <button className="dcSubmit" onClick={submitDeposit} disabled={!vipAddress}>
            I have sent the payment
          </button>

          <div className="dcRules">
            <ul>
              <li>
                Send only <b>{coin.code}</b> on <b>{network}</b> network to this address.
              </li>
              <li>Wrong coin/network may cause permanent loss and cannot be recovered.</li>
              <li>Deposits are credited automatically after confirmations + approval.</li>
              <li>If you need help, contact support with TxID / hash.</li>
            </ul>
          </div>
        </section>

        <section className="dcCard" style={{ marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontWeight: 700 }}>Recent Crypto Deposits</div>
            <button
              type="button"
              onClick={loadDeposits}
              disabled={loadingDeposits}
              style={{
                cursor: loadingDeposits ? "not-allowed" : "pointer",
                padding: "8px 16px",
                backgroundColor: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontWeight: "600",
                fontSize: "14px",
                opacity: loadingDeposits ? 0.6 : 1,
                transition: "all 0.3s ease",
              }}
            >
              {loadingDeposits ? "Loading..." : "Reload"}
            </button>
          </div>

          <div style={{ marginTop: 10 }}>
            {loadingDeposits ? (
              <div className="dcHint">Loading…</div>
            ) : deposits.length ? (
              <div style={{ display: "grid", gap: 10 }}>
                {deposits.slice(0, 8).map((d) => (
                  <div
                    key={String(d?.id || d?.tx_ref || Math.random())}
                    style={{
                      padding: 12,
                      borderRadius: 12,
                      border: "1px solid rgba(148,163,184,.35)",
                      display: "grid",
                      gap: 6,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                      <div style={{ fontWeight: 700 }}>
                        {String(d?.asset || "").toUpperCase()} • {String(d?.network || "").toUpperCase()}
                      </div>
                      <div style={{ fontWeight: 700 }}>{uiStatus(d?.status)}</div>
                    </div>
                    <div className="dcHint">
                      Amount: {money(d?.amount)} • Date: {fmtDate(d?.created_at)}
                    </div>
                    <div className="dcHint">Ref: {d?.tx_ref || `DP-${d?.id}`}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="dcHint">No crypto deposit records found.</div>
            )}
          </div>
        </section>
      </div>

      {/* ✅ QR Modal */}
      {showQR && (
        <div className="dcModalOverlay" onClick={() => setShowQR(false)}>
          <div className="dcModal" onClick={(e) => e.stopPropagation()}>
            <div className="dcModalHead">
              <div className="dcModalTitle">Scan QR</div>
              <button className="dcModalClose" onClick={() => setShowQR(false)} type="button">
                ✕
              </button>
            </div>

            <div className="dcModalBody">
              <div className="dcQrBox">
                {vipPhotoUrl ? (
                  <img
                    src={vipPhotoUrl}
                    alt="VIP QR"
                    style={{ width: "100%", maxWidth: 260, borderRadius: 16, display: "block", margin: "0 auto" }}
                  />
                ) : (
                  <div className="dcQrPlaceholder">No QR photo uploaded</div>
                )}

                <div className="dcQrText">{maskAddr(vipAddress || "")}</div>
              </div>

              <button className="dcModalSave" onClick={copyAddress} disabled={!vipAddress} type="button">
                {copied ? "Copied" : "Copy Address"}
              </button>

              <div className="dcModalTip">For best security, verify the first & last characters before sending.</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}