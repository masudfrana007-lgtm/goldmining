import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./DashboardGoldMiracle.css";

function cls(...a) {
  return a.filter(Boolean).join(" ");
}

function money(n) {
  const num = Number(n || 0);
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(num);
}

function pct(n) {
  const num = Number(n || 0);
  return `${num >= 0 ? "+" : ""}${num.toFixed(2)}%`;
}

function fmt2(n) {
  const num = Number(n || 0);
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(num);
}

/** Simple inline SVG icon (no external library) */
function Icon({ name }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
  };

  switch (name) {
    case "plus":
      return (
        <svg {...common}>
          <path d="M12 5v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "send":
      return (
        <svg {...common}>
          <path
            d="M21 3L10 14"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M21 3l-7 20-4-9-9-4 20-7Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "request":
      return (
        <svg {...common}>
          <path d="M12 21V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path
            d="M16 13l-4-4-4 4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M4 3h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "bill":
      return (
        <svg {...common}>
          <path
            d="M6 2h12v20l-2-1-2 1-2-1-2 1-2-1-2 1V2Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M9 7h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M9 11h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M9 15h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "btc":
      return (
        <svg {...common}>
          <path d="M9 7h6a3 3 0 0 1 0 6H9V7Z" stroke="currentColor" strokeWidth="2" />
          <path d="M9 13h7a3 3 0 0 1 0 6H9v-6Z" stroke="currentColor" strokeWidth="2" />
          <path
            d="M11 5v2M13 5v2M11 19v2M13 19v2"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );
    case "eth":
      return (
        <svg {...common}>
          <path
            d="M12 2l6 10-6 4-6-4 6-10Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M6 12l6 10 6-10" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      );
    case "gold":
      return (
        <svg {...common}>
          <path d="M7 10h10l2 6H5l2-6Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <path d="M9 10l3-4 3 4" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      );
    case "network":
      return (
        <svg {...common}>
          <path d="M12 12a3 3 0 1 0-3-3 3 3 0 0 0 3 3Z" stroke="currentColor" strokeWidth="2" />
          <path
            d="M5 20a7 7 0 0 1 14 0"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path d="M3 6h6M15 6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}

/** Build polyline + area path + store point coordinates (for tooltip) */
function buildLine(values, w, h, pad = 10) {
  const arr = (values || []).map((x) => Number(x || 0));
  const min = Math.min(...arr);
  const max = Math.max(...arr);
  const span = Math.max(1e-9, max - min);

  const innerW = w - pad * 2;
  const innerH = h - pad * 2;

  const pts = arr.map((v, i) => {
    const x = pad + (innerW * i) / Math.max(1, arr.length - 1);
    const y = pad + innerH - ((v - min) / span) * innerH;
    return { x, y, v };
  });

  const pointsStr = pts.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
  const areaStr =
    `M ${pts[0].x.toFixed(2)} ${h - pad} ` +
    pts.map((p) => `L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ") +
    ` L ${pts[pts.length - 1].x.toFixed(2)} ${h - pad} Z`;

  return { pointsStr, areaStr, min, max, pts };
}

/* ✅ SEO helpers (no design changes) */
function upsertMeta(nameOrProp, content, isProperty = false) {
  if (!content) return;
  const selector = isProperty ? `meta[property="${nameOrProp}"]` : `meta[name="${nameOrProp}"]`;
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement("meta");
    if (isProperty) el.setAttribute("property", nameOrProp);
    else el.setAttribute("name", nameOrProp);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertLink(rel, href) {
  if (!href) return;
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function upsertJsonLd(id, json) {
  const scriptId = `jsonld-${id}`;
  let el = document.getElementById(scriptId);
  if (!el) {
    el = document.createElement("script");
    el.type = "application/ld+json";
    el.id = scriptId;
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(json);
}

export default function DashboardGoldMiracle() {
  const nav = useNavigate();

  const [customer] = useState({
    name: "Lyndsey Noel",
    memberId: "GM-284193",
    lastLogin: "2026-02-21 22:55",
    avatar: "/gm/avatar.png",
  });

  const [balance] = useState({
    total: 12850.42,
    available: 10210.14,
    locked: 2640.28,
    currency: "USDT",
  });

  const [vip] = useState({
    level: "Gold Member",
    badge: "VIP",
    since: "2025-11-03",
    status: "Verified",
  });

  // ✅ SEO content (domain locked to goldmiracle.bond)
  const seo = useMemo(() => {
    const baseUrl = "https://goldmiracle.bond";
    const path = window.location?.pathname || "/";
    const canonical = `${baseUrl}${path}`;
    const title = "GoldMiracle Dashboard | Wallet, Mining Packages, Profits & Withdrawals";
    const description =
      "Access your GoldMiracle dashboard to view wallet balance, mining packages, 7-day analytics, deposits, withdrawals, and account security in one place.";
    // Optional: create this image for better social previews
    const ogImage = `${baseUrl}/gm/og-dashboard.png`;
    return { baseUrl, canonical, title, description, ogImage };
  }, []);

  useEffect(() => {
    // ✅ Basic SEO tags
    document.title = seo.title;

    upsertMeta("description", seo.description);
    upsertMeta("robots", "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1");
    upsertLink("canonical", seo.canonical);

    // ✅ Open Graph
    upsertMeta("og:type", "website", true);
    upsertMeta("og:site_name", "GoldMiracle", true);
    upsertMeta("og:title", seo.title, true);
    upsertMeta("og:description", seo.description, true);
    upsertMeta("og:url", seo.canonical, true);
    upsertMeta("og:image", seo.ogImage, true);

    // ✅ Twitter cards
    upsertMeta("twitter:card", "summary_large_image");
    upsertMeta("twitter:title", seo.title);
    upsertMeta("twitter:description", seo.description);
    upsertMeta("twitter:image", seo.ogImage);

    // ✅ Structured data (JSON-LD)
    upsertJsonLd("website", {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "GoldMiracle",
      url: seo.baseUrl,
      description: seo.description,
      potentialAction: {
        "@type": "SearchAction",
        target: `${seo.baseUrl}/search?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    });

    upsertJsonLd("org", {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "GoldMiracle",
      url: seo.baseUrl,
      logo: `${seo.baseUrl}/gm/logo.png`,
    });
  }, [seo]);

  const market = useMemo(
    () => ({
      todayProfit: 62.8,
      profitChange: 3.41,
      activePackages: 2,
      pendingRequests: 1,
      nextPayout: "Today 23:59",
    }),
    []
  );

  const profit7d = useMemo(
    () => ({
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      values: [41.2, 53.6, 48.9, 61.1, 57.4, 66.2, 62.8],
    }),
    []
  );

  const deposit7d = useMemo(
    () => ({
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      values: [0, 500, 0, 1200, 300, 0, 1500],
    }),
    []
  );

  const withdraw7d = useMemo(
    () => ({
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      values: [0, 0, 200, 0, 0, 400, 0],
    }),
    []
  );

  const [chartTab, setChartTab] = useState("profit");

  const activeSet = useMemo(() => {
    if (chartTab === "deposit") return deposit7d;
    if (chartTab === "withdraw") return withdraw7d;
    return profit7d;
  }, [chartTab, deposit7d, withdraw7d, profit7d]);

  const activeLabels = activeSet.labels;
  const activeValues = activeSet.values;

  const activeSum = useMemo(() => activeValues.reduce((a, b) => a + b, 0), [activeValues]);
  const activeAvg = useMemo(() => activeSum / activeValues.length, [activeSum, activeValues.length]);
  const activeBest = useMemo(() => Math.max(...activeValues), [activeValues]);

  const activeChart = useMemo(() => buildLine(activeValues, 560, 160, 12), [activeValues]);

  const chartBoxRef = useRef(null);
  const [tip, setTip] = useState({ show: false, i: 0, x: 0, y: 0 });

  function showTipFromEvent(e) {
    const el = chartBoxRef.current;
    if (!el) return;

    const r = el.getBoundingClientRect();
    const localX = e.clientX - r.left;
    const w = r.width || 1;
    const sx = (localX / w) * 560;

    const pts = activeChart.pts || [];
    if (!pts.length) return;

    let bestI = 0;
    let bestD = Infinity;
    for (let i = 0; i < pts.length; i++) {
      const d = Math.abs(pts[i].x - sx);
      if (d < bestD) {
        bestD = d;
        bestI = i;
      }
    }

    const p = pts[bestI];
    const px = (p.x / 560) * w;
    const py = (p.y / 160) * (r.height || 1);

    setTip({ show: true, i: bestI, x: px, y: py });
  }

  function hideTip() {
    setTip((s) => ({ ...s, show: false }));
  }

  const packages = useMemo(
    () => [
      {
        id: "PK-GM-01",
        name: "Gold Miner Pro",
        range: "5000–9999.99",
        daily: 1.2,
        status: "Running",
        progress: 62,
        img: "/gm/rig-gold.png",
      },
      {
        id: "PK-GM-02",
        name: "Blue Hash Engine",
        range: "1000–4999.99",
        daily: 0.85,
        status: "Running",
        progress: 28,
        img: "/gm/rig-blue.png",
      },
      {
        id: "PK-GM-03",
        name: "Starter Drill",
        range: "200–999.99",
        daily: 0.55,
        status: "Paused",
        progress: 14,
        img: "/gm/rig-starter.png",
      },
    ],
    []
  );

  const activity = useMemo(
    () => [
      {
        id: "TX-90021",
        type: "Deposit",
        amount: 1500,
        coin: "USDT",
        status: "Completed",
        time: "2026-02-21 22:15",
        meta: "TRC20 • Ref: 4NQ...B2A",
      },
      {
        id: "TX-90012",
        type: "Mining Profit",
        amount: 62.8,
        coin: "USDT",
        status: "Completed",
        time: "2026-02-21 09:10",
        meta: "Gold Miner Pro • Daily payout",
      },
      {
        id: "TX-89981",
        type: "Withdraw",
        amount: 400,
        coin: "USDT",
        status: "Processing",
        time: "2026-02-20 18:42",
        meta: "To beneficiary: My TRC20 Wallet",
      },
      {
        id: "TX-89911",
        type: "Security",
        amount: 0,
        coin: "",
        status: "Alert",
        time: "2026-02-19 12:01",
        meta: "New login detected • Phnom Penh (KH)",
      },
    ],
    []
  );

  const tools = useMemo(
    () => [
      { key: "deposit", title: "Deposit", sub: "Add funds", icon: "＋", to: "/deposit", tone: "blue" },
      { key: "withdraw", title: "Withdraw", sub: "Request payout", icon: "↗", to: "/withdraw", tone: "gold" },
      { key: "transfer", title: "Transfer", sub: "Internal move", icon: "⇄", to: "/transfer", tone: "gray" },
      { key: "packages", title: "Packages", sub: "Mining plans", icon: "⛏", to: "/mining", tone: "green" },
      { key: "wdh", title: "Withdraw History", sub: "Track payouts", icon: "🧾", to: "/withdraw/history", tone: "gold" },
      { key: "dph", title: "Deposit History", sub: "Track deposits", icon: "📥", to: "/deposit/history", tone: "blue" },
      { key: "benef", title: "Beneficiaries", sub: "Manage wallets", icon: "👤", to: "/beneficiaries", tone: "purple" },
      { key: "security", title: "Security", sub: "2FA & devices", icon: "🛡", to: "/security", tone: "red" },
      { key: "settings", title: "Settings", sub: "Profile & prefs", icon: "⚙", to: "/settings", tone: "gray" },
      { key: "support", title: "Support", sub: "Help center", icon: "💬", to: "/support", tone: "blue" },
      { key: "kyc", title: "Verification", sub: "KYC status", icon: "✅", to: "/verification", tone: "green" },
      { key: "invite", title: "Invite", sub: "Referral tools", icon: "🎁", to: "/referral", tone: "gold" },
    ],
    []
  );

  const [marketLive, setMarketLive] = useState({
    loading: false,
    updatedAt: null,
    btcUsd: 0,
    btcChg: 0,
    ethUsd: 0,
    ethChg: 0,
    goldUsd: 2034.55,
    hashrateEH: 602.4,
    difficultyT: 88.25,
  });

  async function refreshMarket() {
    setMarketLive((s) => ({ ...s, loading: true }));

    let btcUsd = marketLive.btcUsd;
    let btcChg = marketLive.btcChg;
    let ethUsd = marketLive.ethUsd;
    let ethChg = marketLive.ethChg;

    try {
      const r = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true"
      );
      const j = await r.json();
      btcUsd = j?.bitcoin?.usd ?? btcUsd;
      btcChg = j?.bitcoin?.usd_24h_change ?? btcChg;
      ethUsd = j?.ethereum?.usd ?? ethUsd;
      ethChg = j?.ethereum?.usd_24h_change ?? ethChg;
    } catch (e) {}

    setMarketLive((s) => ({
      ...s,
      loading: false,
      updatedAt: new Date().toLocaleString(),
      btcUsd,
      btcChg,
      ethUsd,
      ethChg,
    }));
  }

  useEffect(() => {
    refreshMarket();
    const t = setInterval(refreshMarket, 60000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function go(to) {
    if (!to) return;
    nav(to);
  }

  const tipLabel = chartTab === "profit" ? "Profit" : chartTab === "deposit" ? "Deposit" : "Withdraw";
  const tipValue = activeValues[tip.i] ?? 0;
  const tipDay = activeLabels[tip.i] ?? "";

  // ✅ Visually-hidden style (no CSS file changes)
  const srOnly = {
    position: "absolute",
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: "hidden",
    clip: "rect(0, 0, 0, 0)",
    whiteSpace: "nowrap",
    border: 0,
  };

  return (
    <div className="gmDash">
      {/* ✅ SEO heading + intro (invisible; does not change layout) */}
      <h1 style={srOnly}>GoldMiracle Dashboard</h1>
      <p style={srOnly}>
        GoldMiracle is a digital finance dashboard to manage wallet balance, track mining packages, review 7-day analytics for profits,
        deposits, and withdrawals, and access account security and support.
      </p>

      <div className="gmVignette" aria-hidden="true" />

      <header className="gmTop">
        <div className="gmBrand">
          <div className="gmLogoMark" aria-hidden="true">
            <span className="gmLogoGlow" />
            <span className="gmLogoText">GM</span>
          </div>

          <div className="gmBrandText">
            <div className="gmBrandName">GoldMiracle</div>
          </div>
        </div>

        <div className="gmTopRight">
          <button className="gmSupportBtn" type="button" onClick={() => go("/support")} aria-label="Open customer support">
            <span className="gmSupportIcon" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M4 12a8 8 0 0 1 16 0v3a2 2 0 0 1-2 2h-2v-6h4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M4 12v3a2 2 0 0 0 2 2h2v-6H4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 19a3 3 0 0 0 3-3h-3"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            Customer Support
          </button>
        </div>
      </header>

      <main className="gmWrap">
        <section className="gmWelcome gmCard" aria-label="Account overview">
          <div className="gmWelcomeLeft">
            <div className="gmWelcomeTitle">
              Welcome back, <span className="gmWelcomeName">{customer.name}</span>
            </div>
            <div className="gmWelcomeSub">
              Member ID: <b>{customer.memberId}</b> • Last login: {customer.lastLogin}
            </div>
          </div>

          <div className="gmWelcomeRight">
            <div className="gmAvatar" title="Your profile">
              <img
                src={customer.avatar}
                alt={`${customer.name} profile avatar`}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
              <div className="gmAvatarFallback">{customer.name.slice(0, 1).toUpperCase()}</div>
            </div>

            <button className="gmGhostBtn dex" onClick={() => go("/settings")} type="button" aria-label="Open profile settings">
              Profile
            </button>
            <button className="gmGhostBtn dex" onClick={() => go("/security")} type="button" aria-label="Open security settings">
              Security
            </button>
          </div>
        </section>

        <section className="gmHeroRow">
          <div className="gmLeftCol">
            <section className="gmWallet gmCard" aria-label="Wallet balance and quick actions">
              <div className="gmWalletTop">
                <div />
                <div className="gmActivePill" title="Wallet status" aria-label="Wallet status active">
                  <span className="gmActiveDot" />
                  Active
                </div>
              </div>

              <div className="gmWalletHello">
                Hello, <span className="gmWalletName">{customer.name.split(" ")[0]}</span>
              </div>

              <div className="gmWalletAmtRow">
                <div className="gmWalletAmt">
                  ${money(balance.total)}
                  <span className="gmWalletCents">.00</span>
                </div>

                <div className="gmWalletChange" title="24h change">
                  {pct(market.profitChange)}
                </div>
              </div>

              <div className="gmWalletMeta">
                Available: <b>{money(balance.available)} USDT</b> &nbsp;&nbsp; Locked: <b>{money(balance.locked)} USDT</b>
              </div>

              <div className="gmWalletActions" aria-label="Wallet actions">
                <button className="gmWAction" type="button" onClick={() => go("/deposit")} title="Add funds" aria-label="Deposit funds">
                  <span className="gmWActionIcon" aria-hidden="true">
                    <Icon name="plus" />
                  </span>
                  <span className="gmWActionText">Add</span>
                </button>

                <button className="gmWAction" type="button" onClick={() => go("/transfer")} title="Send" aria-label="Transfer funds">
                  <span className="gmWActionIcon" aria-hidden="true">
                    <Icon name="send" />
                  </span>
                  <span className="gmWActionText">Send</span>
                </button>

                <button className="gmWAction" type="button" onClick={() => go("/withdraw")} title="Request payout" aria-label="Withdraw funds">
                  <span className="gmWActionIcon" aria-hidden="true">
                    <Icon name="request" />
                  </span>
                  <span className="gmWActionText">Request</span>
                </button>

                <button className="gmWAction" type="button" onClick={() => go("/transactions")} title="Bills" aria-label="View transactions">
                  <span className="gmWActionIcon" aria-hidden="true">
                    <Icon name="bill" />
                  </span>
                  <span className="gmWActionText">Bill</span>
                </button>
              </div>

              <div className="gmWalletVip">
                <div className="gmWalletVipLeft">
                  <span className="gmVipBadge2">{vip.badge}</span>
                  <div className="gmWalletVipMeta">
                    <div className="gmWalletVipTitle">{vip.level}</div>
                    <div className="gmWalletVipSub">
                      {vip.status} • Since {vip.since}
                    </div>
                  </div>
                </div>

                <button className="gmWalletVipBtn" onClick={() => go("/settings")} type="button" title="Account" aria-label="Open account settings">
                  Account
                </button>
              </div>

              <div className="gmWalletMiniGrid" aria-label="Wallet summary">
                <div className="gmWStat">
                  <div className="gmWStatK">Today Profit</div>
                  <div className="gmWStatV">{money(market.todayProfit)} USDT</div>
                </div>

                <div className="gmWStat">
                  <div className="gmWStatK">Active packages</div>
                  <div className="gmWStatV">{market.activePackages}</div>
                </div>

                <div className="gmWStat">
                  <div className="gmWStatK">Pending requests</div>
                  <div className="gmWStatV">{market.pendingRequests}</div>
                </div>

                <div className="gmWStat">
                  <div className="gmWStatK">Next payout</div>
                  <div className="gmWStatV">{market.nextPayout}</div>
                </div>
              </div>
            </section>

            <div className="gmCard gmProfitCard" aria-label="7-day analytics">
              <div className="gmProfitHead">
                <div>
                  <div className="gmProfitTitle">7-Day Analytics</div>
                  <div className="gmProfitSub">Profit / Deposit / Withdraw • hover for details</div>
                </div>

                <div className="gmTabs" role="tablist" aria-label="7-day analytics tabs">
                  <button
                    className={cls("gmTab", chartTab === "profit" && "active")}
                    onClick={() => setChartTab("profit")}
                    type="button"
                    role="tab"
                    aria-selected={chartTab === "profit"}
                  >
                    Profit
                  </button>
                  <button
                    className={cls("gmTab", chartTab === "deposit" && "active")}
                    onClick={() => setChartTab("deposit")}
                    type="button"
                    role="tab"
                    aria-selected={chartTab === "deposit"}
                  >
                    Deposit
                  </button>
                  <button
                    className={cls("gmTab", chartTab === "withdraw" && "active")}
                    onClick={() => setChartTab("withdraw")}
                    type="button"
                    role="tab"
                    aria-selected={chartTab === "withdraw"}
                  >
                    Withdraw
                  </button>
                </div>
              </div>

              <div className="gmProfitStatsRow">
                <div className="gmPStat">
                  <div className="gmPStatK">7D Total</div>
                  <div className="gmPStatV">{money(activeSum)} USDT</div>
                </div>
                <div className="gmPStat">
                  <div className="gmPStatK">Avg/Day</div>
                  <div className="gmPStatV">{money(activeAvg)} USDT</div>
                </div>
                <div className="gmPStat">
                  <div className="gmPStatK">Best Day</div>
                  <div className="gmPStatV">{money(activeBest)} USDT</div>
                </div>

                <div className={cls("gmPBadge", chartTab)}>
                  {chartTab === "profit" ? "Mining Profit" : chartTab === "deposit" ? "Deposits" : "Withdrawals"}
                </div>
              </div>

              <div
                className="gmChartWrap"
                ref={chartBoxRef}
                onMouseMove={showTipFromEvent}
                onMouseEnter={() => setTip((s) => ({ ...s, show: true }))}
                onMouseLeave={hideTip}
                style={{ position: "relative" }}
              >
                <svg className="gmChart" viewBox="0 0 560 160" preserveAspectRatio="none" aria-hidden="true">
                  <defs>
                    <linearGradient id="gmArea" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="rgba(168, 85, 247, .55)" />
                      <stop offset="100%" stopColor="rgba(59, 130, 246, .45)" />
                    </linearGradient>
                    <linearGradient id="gmLine" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="rgba(255, 216, 74, .95)" />
                      <stop offset="100%" stopColor="rgba(168, 85, 247, .92)" />
                    </linearGradient>
                  </defs>

                  <path d="M12 40 H548" className="gmChartGrid" />
                  <path d="M12 80 H548" className="gmChartGrid" />
                  <path d="M12 120 H548" className="gmChartGrid" />

                  <path d={activeChart.areaStr} fill="url(#gmArea)" opacity="0.22" />
                  <polyline
                    points={activeChart.pointsStr}
                    fill="none"
                    stroke="url(#gmLine)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {activeChart.pts.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r={i === tip.i && tip.show ? 6 : 4.5} className="gmChartDot" />
                  ))}

                  {tip.show && activeChart.pts[tip.i] ? (
                    <path
                      d={`M ${activeChart.pts[tip.i].x} 12 V 148`}
                      stroke="rgba(255,255,255,.16)"
                      strokeWidth="2"
                      strokeDasharray="4 6"
                    />
                  ) : null}
                </svg>

                {tip.show && activeChart.pts[tip.i] ? (
                  <div
                    className="gmTip"
                    style={{
                      position: "absolute",
                      left: Math.min(Math.max(10, tip.x + 10), (chartBoxRef.current?.clientWidth || 600) - 170),
                      top: Math.max(8, tip.y - 62),
                    }}
                  >
                    <div className="gmTipTop">
                      <div className="gmTipDay">{tipDay}</div>
                      <div className={cls("gmTipPill", chartTab)}>{tipLabel}</div>
                    </div>
                    <div className="gmTipVal">
                      {money(tipValue)} <span className="gmTipUnit">USDT</span>
                    </div>
                    <div className="gmTipHint">Hover any point to compare the last 7 days.</div>
                  </div>
                ) : null}

                <div className="gmChartLabels">
                  {activeLabels.map((d, i) => (
                    <div key={`${chartTab}-${d}`} className={cls("gmCL", tip.show && i === tip.i && "active")}>
                      <div className="gmCLDay">{d}</div>
                      <div className="gmCLVal">{money(activeValues[i])}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="gmCol">
            <div className="gmCard gmNotices">
              <div className="gmCardTitleRow">
                <div className="gmCardTitle">System Notices</div>
                <button className="gmLinkBtn" onClick={() => go("/notifications")} type="button" aria-label="View all system notices">
                  View all
                </button>
              </div>

              <ul className="gmNoticeList">
                <li>
                  <span className="gmBullet gold" />
                  Network: TRC20 withdrawals may take longer during peak hours.
                </li>
                <li>
                  <span className="gmBullet blue" />
                  New mining package “Gold Miner Pro” performance upgrade applied.
                </li>
                <li>
                  <span className="gmBullet gray" />
                  Keep your beneficiary name matching your wallet owner for faster review.
                </li>
              </ul>
            </div>

            <div className="gmCard gmMarketPanel">
              <div className="gmCardTitleRow">
                <div>
                  <div className="gmCardTitle">Market Overview</div>
                  <div className="gmMarketUpdate">
                    {marketLive.updatedAt ? `Updated: ${marketLive.updatedAt}` : "Updating..."}
                  </div>
                </div>

                <button
                  className="gmGhostBtn sm dex"
                  onClick={refreshMarket}
                  type="button"
                  disabled={marketLive.loading}
                  aria-label="Refresh market overview"
                >
                  {marketLive.loading ? "..." : "Refresh"}
                </button>
              </div>

              <div className="gmMarketMiniGrid">
                <div className="gmMarketTile tone-btc">
                  <div className="gmMTTop">
                    <span className="gmMTIcon" aria-hidden="true">
                      <Icon name="btc" />
                    </span>
                    <div className="gmMTName">BTC</div>
                    <div className={cls("gmMTChip", (marketLive.btcChg || 0) >= 0 ? "up" : "down")}>
                      {pct(marketLive.btcChg || 0)}
                    </div>
                  </div>
                  <div className="gmMTVal">${fmt2(marketLive.btcUsd || 0)}</div>
                  <div className="gmMTSub">Bitcoin price</div>
                </div>

                <div className="gmMarketTile tone-eth">
                  <div className="gmMTTop">
                    <span className="gmMTIcon" aria-hidden="true">
                      <Icon name="eth" />
                    </span>
                    <div className="gmMTName">ETH</div>
                    <div className={cls("gmMTChip", (marketLive.ethChg || 0) >= 0 ? "up" : "down")}>
                      {pct(marketLive.ethChg || 0)}
                    </div>
                  </div>
                  <div className="gmMTVal">${fmt2(marketLive.ethUsd || 0)}</div>
                  <div className="gmMTSub">Ethereum price</div>
                </div>

                <div className="gmMarketTile tone-gold">
                  <div className="gmMTTop">
                    <span className="gmMTIcon" aria-hidden="true">
                      <Icon name="gold" />
                    </span>
                    <div className="gmMTName">GOLD</div>
                    <div className="gmMTChip soft">Index</div>
                  </div>
                  <div className="gmMTVal">${fmt2(marketLive.goldUsd || 0)}</div>
                  <div className="gmMTSub">USD / oz</div>
                </div>

                <div className="gmMarketTile tone-net">
                  <div className="gmMTTop">
                    <span className="gmMTIcon" aria-hidden="true">
                      <Icon name="network" />
                    </span>
                    <div className="gmMTName">NETWORK</div>
                    <div className="gmMTChip soft">Mining</div>
                  </div>

                  <div className="gmMTTwo">
                    <div className="gmMTMini">
                      <div className="gmMTMiniK">Hashrate</div>
                      <div className="gmMTMiniV">{fmt2(marketLive.hashrateEH || 0)} EH/s</div>
                    </div>
                    <div className="gmMTMini">
                      <div className="gmMTMiniK">Difficulty</div>
                      <div className="gmMTMiniV">{fmt2(marketLive.difficultyT || 0)} T</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="gmSection" aria-label="Mining packages">
          <div className="gmSectionHead">
            <div>
              <div className="gmSectionTitle">Current Packages</div>
              <div className="gmSectionSub">Your active mining engines and performance</div>
            </div>
            <button className="gmGhostBtn dex" onClick={() => go("/mining")} type="button" aria-label="View all mining packages">
              View packages
            </button>
          </div>

          <div className="gmPkgGrid">
            {packages.map((p) => (
              <div className="gmCard gmPkg" key={p.id}>
                <div className="gmPkgTop">
                  <div className="gmPkgThumb">
                    <img
                      src={p.img}
                      alt={`${p.name} mining package`}
                      loading="lazy"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                    <div className="gmThumbGlow" />
                  </div>

                  <div className="gmPkgInfo">
                    <div className="gmPkgName">{p.name}</div>
                    <div className="gmPkgMeta">
                      Limit: {p.range} • Daily: <b>{p.daily}%</b>
                    </div>

                    <div className="gmPkgBadges">
                      <span className={cls("gmPill", p.status === "Running" ? "run" : "pause")}>{p.status}</span>
                      <span className="gmPill soft">ID: {p.id}</span>
                    </div>
                  </div>
                </div>

                <div className="gmProgRow">
                  <div className="gmProgLabel">Cycle progress</div>
                  <div className="gmProgVal">{p.progress}%</div>
                </div>
                <div className="gmProgBar">
                  <div className="gmProgFill" style={{ width: `${p.progress}%` }} />
                </div>

                <div className="gmPkgBtns">
                  <button className="gmGhostBtn dex" onClick={() => go(`/mining/${p.id}`)} type="button" aria-label={`View details for ${p.name}`}>
                    Details
                  </button>

                  <button className="gmPrimaryBtn dexYellow" onClick={() => go("/withdraw")} type="button" aria-label="Withdraw from wallet">
                    Withdraw
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="gmSection" aria-label="Services and shortcuts">
          <div className="gmSectionHead">
            <div>
              <div className="gmSectionTitle">Services</div>
              <div className="gmSectionSub">Fast access to wallet and account features</div>
            </div>
          </div>

          <div className="gmToolGrid">
            {tools.map((t) => (
              <button
                key={t.key}
                className={cls("gmTool", `tone-${t.tone || "gray"}`)}
                onClick={() => go(t.to)}
                type="button"
                aria-label={`${t.title}: ${t.sub}`}
              >
                <span className="gmToolIcon" aria-hidden="true">
                  {t.icon}
                </span>
                <span className="gmToolText">
                  <span className="gmToolTitle">{t.title}</span>
                  <span className="gmToolSub">{t.sub}</span>
                </span>
                <span className="gmToolArrow" aria-hidden="true">
                  →
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="gmSection" aria-label="Recent transactions and activity">
          <div className="gmSectionHead">
            <div>
              <div className="gmSectionTitle">Recent Activity</div>
              <div className="gmSectionSub">Latest transactions, profits, and security events</div>
            </div>
            <button className="gmGhostBtn dex" onClick={() => go("/transactions")} type="button" aria-label="View all transactions">
              View all
            </button>
          </div>

          <div className="gmCard gmActivity">
            {activity.map((a) => (
              <div className="gmActRow" key={a.id}>
                <div
                  className={cls(
                    "gmActIcon",
                    a.type === "Withdraw" ? "wd" : a.type === "Deposit" ? "dp" : a.type === "Security" ? "sec" : "pf"
                  )}
                  aria-hidden="true"
                >
                  {a.type === "Withdraw" ? "↗" : a.type === "Deposit" ? "＋" : a.type === "Security" ? "🛡" : "⛏"}
                </div>

                <div className="gmActBody">
                  <div className="gmActTop">
                    <div className="gmActTitle">{a.type}</div>
                    <div className={cls("gmStatus", a.status === "Completed" ? "ok" : a.status === "Processing" ? "wait" : "alert")}>
                      {a.status}
                    </div>
                  </div>
                  <div className="gmActMeta">{a.meta}</div>
                  <div className="gmActTime">
                    {a.time} • {a.id}
                  </div>
                </div>

                <div className="gmActAmt">
                  {a.amount ? (
                    <>
                      <div className="gmAmtMain">{money(a.amount)}</div>
                      <div className="gmAmtSub">{a.coin}</div>
                    </>
                  ) : (
                    <div className="gmAmtMain muted">—</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="gmStrip" aria-label="Supported payment methods">
          <div className="gmStripCard">
            <div className="gmStripTitle">Supported Payments</div>
            <div className="gmStripRow">
              {[
                { src: "/gm/pay-usdt.png", alt: "USDT payment" },
                { src: "/gm/pay-trc20.png", alt: "TRC20 network" },
                { src: "/gm/pay-erc20.png", alt: "ERC20 network" },
                { src: "/gm/pay-binance.png", alt: "Binance" },
                { src: "/gm/pay-visa.png", alt: "Visa" },
                { src: "/gm/pay-master.png", alt: "Mastercard" },
              ].map((p) => (
                <div className="gmPay" key={p.src}>
                  <img src={p.src} alt={p.alt} loading="lazy" onError={(e) => (e.currentTarget.style.display = "none")} />
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}