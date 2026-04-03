import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./memberDepositCrypto.css";

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

function uiStatus(dbStatus) {
  const s = String(dbStatus || "").toLowerCase();
  if (s === "approved") return "Credited";
  if (s === "rejected") return "Rejected";
  return "Pending";
}

/** Local demo data */
const DEMO = {
  balance: 0,
  vip: {
    "USDT|TRC20": {
      vip_rank: "V1",
      asset: "USDT",
      network: "TRC20",
      wallet_address: "Txxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      photo_url: "",
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
  deposits: [],
};

export default function MemberDepositCrypto() {
  const nav = useNavigate();

  const [balance, setBalance] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [creditedCount, setCreditedCount] = useState(0);
  const [deposits, setDeposits] = useState([]);
  const [loadingDeposits, setLoadingDeposits] = useState(false);

  const minDeposit = 5;
  const confirmationsRequired = 12;

  const [coin, setCoin] = useState(coins[0]);
  const [network, setNetwork] = useState(coins[0].networks[0]);

  const [vipSlot, setVipSlot] = useState(null);
  const vipAddress = vipSlot?.wallet_address || "";
  const vipPhotoUrl = String(vipSlot?.photo_url || "").trim();

  const [amount, setAmount] = useState("");
  const amountNum = useMemo(() => {
    const n = Number(amount);
    return Number.isFinite(n) ? n : 0;
  }, [amount]);

  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const loadMe = async () => {
    setBalance(Number(DEMO.balance || 0));
  };

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

    DEMO.deposits = [newRow, ...(DEMO.deposits || [])];

    alert("Deposit submitted. Awaiting approval ✅");
    setAmount("");
    await refreshTop();
    nav("/member/deposit/records");
  };

  return (
    <div className="mdcPage">
      <header className="mdcTopbar">
        <button className="mdcTopBtn mdcTopBtnBack" onClick={() => nav(-1)} aria-label="Back" type="button">
          ←
        </button>

        <div className="mdcTopbarTitle">
          <div className="mdcTopbarHeading">Crypto Deposit</div>
          <div className="mdcTopbarSub">Secure wallet funding</div>
        </div>

        <button className="mdcTopBtn" onClick={() => nav("/member/deposit/records")} type="button">
          History
        </button>
      </header>

      <main className="mdcWrap">
        <section className="mdcHeroCard">
          <div className="mdcHeroMain">
            <div className="mdcEyebrow">Wallet balance</div>

            <div className="mdcBalanceRow">
              <div className="mdcBalanceValue">{money(balance)}</div>
              <div className="mdcBalanceUnit">USDT</div>
            </div>

            <div className="mdcHeroMeta">
              <span className="mdcMetaPill">Minimum {minDeposit}</span>
              <span className="mdcMetaPill">{confirmationsRequired} confirmations</span>
              <span className="mdcMetaPill">Fast crediting</span>
            </div>
          </div>

          <div className="mdcHeroStats">
            <div className="mdcStatCard">
              <div className="mdcStatLabel">Pending</div>
              <div className="mdcStatValue">{pendingCount}</div>
            </div>

            <div className="mdcStatCard">
              <div className="mdcStatLabel">Credited</div>
              <div className="mdcStatValue">{creditedCount}</div>
            </div>

            <button className="mdcRefreshBtn" type="button" onClick={refreshTop}>
              Refresh balance
            </button>
          </div>
        </section>

        <section className="mdcCard">
          <div className="mdcSectionHead">
            <div>
              <h3 className="mdcSectionTitle">Select asset</h3>
              <p className="mdcSectionNote">Choose the asset you want to deposit.</p>
            </div>
          </div>

          <div className="mdcCoinGrid">
            {coins.map((c) => (
              <button
                key={c.code}
                className={`mdcCoinCard ${coin.code === c.code ? "active" : ""}`}
                onClick={() => onSelectCoin(c)}
                type="button"
              >
                <img className="mdcCoinIcon" src={c.icon} alt={c.code} />
                <div className="mdcCoinText">
                  <div className="mdcCoinCode">{c.code}</div>
                  <div className="mdcCoinName">{c.name}</div>
                </div>
              </button>
            ))}
          </div>

          <div className="mdcInlineTip">
            Tip: Always match the selected coin with the correct network to avoid loss of funds.
          </div>
        </section>

        <section className="mdcCard">
          <div className="mdcSectionHead">
            <div>
              <h3 className="mdcSectionTitle">Assigned deposit address</h3>
              <p className="mdcSectionNote">
                This address is assigned automatically based on your VIP package.
              </p>
            </div>

            <div className="mdcVipBadge">
              {vipSlot?.vip_rank ? `VIP ${vipSlot.vip_rank.slice(1)}` : "VIP"}
            </div>
          </div>

          <div className="mdcFormGrid">
            <div className="mdcField">
              <label htmlFor="network">Network</label>
              <select id="network" value={network} onChange={(e) => onNetworkChange(e.target.value)}>
                {coin.networks.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <div className="mdcFieldHint">Send only through the selected network.</div>
            </div>

            <div className="mdcField">
              <label htmlFor="depositAmount">Deposit amount</label>
              <div className="mdcAmountWrap">
                <input
                  id="depositAmount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  inputMode="decimal"
                  placeholder={`Minimum ${minDeposit}`}
                />
                <button type="button" className="mdcGhostBtn" onClick={() => setAmount("")}>
                  Clear
                </button>
              </div>

              <div className="mdcFieldHint">
                You will receive after confirmations:{" "}
                <span className="mdcAccentText">
                  {amountNum > 0 ? `${money(amountNum)} ${coin.code}` : `— ${coin.code}`}
                </span>
              </div>

              {!amountOk && <div className="mdcErrorText">Minimum suggested deposit is {minDeposit}.</div>}
            </div>
          </div>

          <div className="mdcField">
            <label>Deposit address</label>

            <div className="mdcAddressBox">
              <div className="mdcAddressContent">
                <div className="mdcAddressValue">
                  {vipAddress ? vipAddress : "No address found for your VIP rank / asset / network."}
                </div>
                <div className="mdcFieldHint">
                  {depositHint} Transactions are credited after {confirmationsRequired} confirmations.
                </div>
              </div>

              <div className="mdcAddressBtns">
                <button className="mdcMiniBtn" type="button" onClick={() => setShowQR(true)} disabled={!vipAddress}>
                  QR
                </button>
                <button className="mdcMiniBtn" type="button" onClick={copyAddress} disabled={!vipAddress}>
                  {copied ? "Copied" : "Copy"}
                </button>
                <button className="mdcMiniBtn" type="button" onClick={() => loadVipAddress(coin.code, network)}>
                  Refresh
                </button>
              </div>
            </div>
          </div>

          <button className="mdcPrimaryBtn" onClick={submitDeposit} disabled={!vipAddress}>
            I have sent the payment
          </button>

          <div className="mdcRulesBox">
            <div className="mdcRulesTitle">Deposit instructions</div>
            <ul className="mdcRulesList">
              <li>
                Send only <b>{coin.code}</b> using the <b>{network}</b> network.
              </li>
              <li>Sending the wrong coin or wrong network may result in permanent loss.</li>
              <li>Deposits are credited after required confirmations and approval.</li>
              <li>Keep your TxID or hash ready if support is needed.</li>
            </ul>
          </div>
        </section>

        <section className="mdcCard">
          <div className="mdcSectionHead">
            <div>
              <h3 className="mdcSectionTitle">Recent crypto deposits</h3>
              <p className="mdcSectionNote">Your most recent submitted deposit requests.</p>
            </div>

            <button
              type="button"
              onClick={loadDeposits}
              disabled={loadingDeposits}
              className="mdcReloadBtn"
            >
              {loadingDeposits ? "Loading..." : "Reload"}
            </button>
          </div>

          {loadingDeposits ? (
            <div className="mdcEmptyState">Loading records…</div>
          ) : deposits.length ? (
            <div className="mdcDepositList">
              {deposits.slice(0, 8).map((d) => (
                <div className="mdcDepositItem" key={String(d?.id || d?.tx_ref || Math.random())}>
                  <div className="mdcDepositTop">
                    <div>
                      <div className="mdcDepositAsset">
                        {String(d?.asset || "").toUpperCase()} • {String(d?.network || "").toUpperCase()}
                      </div>
                      <div className="mdcDepositRef">Ref: {d?.tx_ref || `DP-${d?.id}`}</div>
                    </div>

                    <div
                      className={`mdcStatusBadge ${
                        uiStatus(d?.status) === "Credited"
                          ? "is-success"
                          : uiStatus(d?.status) === "Rejected"
                          ? "is-danger"
                          : "is-pending"
                      }`}
                    >
                      {uiStatus(d?.status)}
                    </div>
                  </div>

                  <div className="mdcDepositMeta">
                    <span>Amount: {money(d?.amount)}</span>
                    <span>Date: {fmtDate(d?.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mdcEmptyState">No crypto deposit records found.</div>
          )}
        </section>
      </main>

      {showQR && (
        <div className="mdcModalOverlay" onClick={() => setShowQR(false)}>
          <div className="mdcModal" onClick={(e) => e.stopPropagation()}>
            <div className="mdcModalHead">
              <div>
                <div className="mdcModalTitle">Scan deposit QR</div>
                <div className="mdcModalSub">{coin.code} • {network}</div>
              </div>

              <button className="mdcModalClose" onClick={() => setShowQR(false)} type="button">
                ✕
              </button>
            </div>

            <div className="mdcModalBody">
              <div className="mdcQrBox">
                {vipPhotoUrl ? (
                  <img className="mdcQrImage" src={vipPhotoUrl} alt="VIP QR" />
                ) : (
                  <div className="mdcQrPlaceholder">No QR uploaded</div>
                )}

                <div className="mdcQrAddress">{maskAddr(vipAddress || "")}</div>
              </div>

              <button className="mdcPrimaryBtn mdcModalCopyBtn" onClick={copyAddress} disabled={!vipAddress} type="button">
                {copied ? "Copied" : "Copy address"}
              </button>

              <div className="mdcModalTip">
                For security, always verify the first and last characters before sending.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}