import { useEffect, useMemo, useRef, useState } from "react";
import "./TradingPro.css";

const REST_BASE = "https://data-api.binance.vision/api/v3";
const WS_BASE = "wss://stream.binance.com:9443/ws";
const HISTORY_KEY = "tradingpro_history_v1";
const FAVORITES_KEY = "tradingpro_favorites_v1";

const PAIRS = [
  { symbol: "BTCUSDT", label: "BTC/USDT", payout: 92, seed: 45000, baseAsset: "BTC", quoteAsset: "USDT" },
  { symbol: "ETHUSDT", label: "ETH/USDT", payout: 88, seed: 2500, baseAsset: "ETH", quoteAsset: "USDT" },
  { symbol: "BNBUSDT", label: "BNB/USDT", payout: 86, seed: 600, baseAsset: "BNB", quoteAsset: "USDT" },
  { symbol: "SOLUSDT", label: "SOL/USDT", payout: 90, seed: 140, baseAsset: "SOL", quoteAsset: "USDT" },
  { symbol: "XRPUSDT", label: "XRP/USDT", payout: 84, seed: 0.55, baseAsset: "XRP", quoteAsset: "USDT" },
  { symbol: "ADAUSDT", label: "ADA/USDT", payout: 85, seed: 0.62, baseAsset: "ADA", quoteAsset: "USDT" },
  { symbol: "DOGEUSDT", label: "DOGE/USDT", payout: 83, seed: 0.12, baseAsset: "DOGE", quoteAsset: "USDT" },
  { symbol: "TRXUSDT", label: "TRX/USDT", payout: 82, seed: 0.13, baseAsset: "TRX", quoteAsset: "USDT" },
  { symbol: "AVAXUSDT", label: "AVAX/USDT", payout: 87, seed: 38, baseAsset: "AVAX", quoteAsset: "USDT" },
  { symbol: "DOTUSDT", label: "DOT/USDT", payout: 84, seed: 7.2, baseAsset: "DOT", quoteAsset: "USDT" },
  { symbol: "LINKUSDT", label: "LINK/USDT", payout: 86, seed: 18, baseAsset: "LINK", quoteAsset: "USDT" },
  { symbol: "MATICUSDT", label: "MATIC/USDT", payout: 83, seed: 0.95, baseAsset: "MATIC", quoteAsset: "USDT" },
  { symbol: "LTCUSDT", label: "LTC/USDT", payout: 84, seed: 82, baseAsset: "LTC", quoteAsset: "USDT" },
  { symbol: "BCHUSDT", label: "BCH/USDT", payout: 82, seed: 420, baseAsset: "BCH", quoteAsset: "USDT" },
  { symbol: "ATOMUSDT", label: "ATOM/USDT", payout: 83, seed: 10.5, baseAsset: "ATOM", quoteAsset: "USDT" },
  { symbol: "NEARUSDT", label: "NEAR/USDT", payout: 84, seed: 5.8, baseAsset: "NEAR", quoteAsset: "USDT" },
  { symbol: "APTUSDT", label: "APT/USDT", payout: 84, seed: 9.5, baseAsset: "APT", quoteAsset: "USDT" },
  { symbol: "ARBUSDT", label: "ARB/USDT", payout: 83, seed: 1.1, baseAsset: "ARB", quoteAsset: "USDT" },
  { symbol: "OPUSDT", label: "OP/USDT", payout: 83, seed: 2.3, baseAsset: "OP", quoteAsset: "USDT" },
  { symbol: "FILUSDT", label: "FIL/USDT", payout: 82, seed: 6.4, baseAsset: "FIL", quoteAsset: "USDT" },
];

const INDICATORS = [
  { key: "ema9", label: "EMA 9" },
  { key: "ema21", label: "EMA 21" },
  { key: "sma20", label: "SMA 20" },
  { key: "bb", label: "Bollinger" },
  { key: "zigzag", label: "ZigZag" },
];

const MENU_ITEMS = [
  { key: "trade", label: "TRADE" },
  { key: "support", label: "SUPPORT" },
  { key: "account", label: "ACCOUNT" },
  { key: "tournaments", label: "TOURNA-\nMENTS" },
  { key: "market", label: "MARKET" },
  { key: "more", label: "MORE" },
];

const QUOTE_FILTERS = ["ALL", "USDT", "BTC"];
const SORT_OPTIONS = [
  { key: "marketcap", label: "Market Cap" },
  { key: "volume", label: "Top Volume" },
  { key: "favorites", label: "Favorites" },
  { key: "az", label: "A-Z" },
];

function cls(...arr) {
  return arr.filter(Boolean).join(" ");
}

function nfmt(n, d = 2) {
  const num = Number(n || 0);
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  }).format(num);
}

function compact(n) {
  const num = Number(n || 0);
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(num);
}

function pad2(v) {
  return String(v).padStart(2, "0");
}

function formatClock(ts) {
  const d = new Date(ts);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

function formatDateTime(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(
    d.getHours()
  )}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

function formatCountdown(sec) {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${pad2(m)}:${pad2(r)}`;
}

function getDigits(price) {
  const p = Number(price || 0);
  if (p >= 1000) return 2;
  if (p >= 100) return 3;
  if (p >= 1) return 4;
  return 6;
}

function normalizeKline(k) {
  return {
    openTime: Number(k[0]),
    open: Number(k[1]),
    high: Number(k[2]),
    low: Number(k[3]),
    close: Number(k[4]),
    volume: Number(k[5]),
    closeTime: Number(k[6]),
  };
}

function createFallbackCandles(count = 140, startPrice = 45000) {
  const out = [];
  let price = startPrice;
  const start = Date.now() - count * 60_000;

  for (let i = 0; i < count; i++) {
    const open = price;
    const move = (Math.random() - 0.5) * startPrice * 0.003;
    const close = Math.max(0.0001, open + move);
    const high = Math.max(open, close) + Math.random() * startPrice * 0.0013;
    const low = Math.min(open, close) - Math.random() * startPrice * 0.0013;

    out.push({
      openTime: start + i * 60_000,
      open,
      high,
      low,
      close,
      volume: 100 + Math.random() * 800,
      closeTime: start + (i + 1) * 60_000 - 1,
    });

    price = close;
  }

  return out;
}

function linePath(points) {
  const valid = points.filter((p) => p && Number.isFinite(p.x) && Number.isFinite(p.y));
  if (!valid.length) return "";
  return valid
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(" ");
}

function areaPath(upper, lower) {
  const u = upper.filter(Boolean);
  const l = lower.filter(Boolean);
  if (!u.length || !l.length) return "";
  let d = `M ${u[0].x.toFixed(2)} ${u[0].y.toFixed(2)} `;
  for (let i = 1; i < u.length; i++) d += `L ${u[i].x.toFixed(2)} ${u[i].y.toFixed(2)} `;
  for (let i = l.length - 1; i >= 0; i--) d += `L ${l[i].x.toFixed(2)} ${l[i].y.toFixed(2)} `;
  d += "Z";
  return d;
}

function calcSMA(values, period) {
  const out = new Array(values.length).fill(null);
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    if (i >= period - 1) out[i] = sum / period;
  }
  return out;
}

function calcEMA(values, period) {
  const out = new Array(values.length).fill(null);
  const k = 2 / (period + 1);
  let ema = null;

  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) continue;

    if (i === period - 1) {
      let seed = 0;
      for (let j = i - period + 1; j <= i; j++) seed += values[j];
      ema = seed / period;
      out[i] = ema;
    } else {
      ema = values[i] * k + ema * (1 - k);
      out[i] = ema;
    }
  }

  return out;
}

function calcBollinger(values, period = 20, mult = 2) {
  const mid = calcSMA(values, period);
  const upper = new Array(values.length).fill(null);
  const lower = new Array(values.length).fill(null);

  for (let i = period - 1; i < values.length; i++) {
    const slice = values.slice(i - period + 1, i + 1);
    const mean = mid[i];
    const variance = slice.reduce((acc, v) => acc + (v - mean) ** 2, 0) / period;
    const sd = Math.sqrt(variance);
    upper[i] = mean + mult * sd;
    lower[i] = mean - mult * sd;
  }

  return { mid, upper, lower };
}

function calcZigZag(candles, thresholdPct = 0.003) {
  if (!candles || candles.length < 3) return [];

  const pivots = [];
  let lastPivotIndex = 0;
  let lastPivotPrice = candles[0].close;
  let trend = 0;

  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;

    if (trend === 0) {
      const upMove = (high - lastPivotPrice) / lastPivotPrice;
      const downMove = (lastPivotPrice - low) / lastPivotPrice;

      if (upMove >= thresholdPct) {
        trend = 1;
        pivots.push({ index: lastPivotIndex, price: lastPivotPrice });
        lastPivotIndex = i;
        lastPivotPrice = high;
      } else if (downMove >= thresholdPct) {
        trend = -1;
        pivots.push({ index: lastPivotIndex, price: lastPivotPrice });
        lastPivotIndex = i;
        lastPivotPrice = low;
      } else {
        if (
          Math.abs(candles[i].close - candles[lastPivotIndex].close) >
          Math.abs(lastPivotPrice - candles[lastPivotIndex].close)
        ) {
          lastPivotIndex = i;
          lastPivotPrice = candles[i].close;
        }
      }
      continue;
    }

    if (trend === 1) {
      if (high >= lastPivotPrice) {
        lastPivotPrice = high;
        lastPivotIndex = i;
      } else {
        const reversal = (lastPivotPrice - low) / lastPivotPrice;
        if (reversal >= thresholdPct) {
          pivots.push({ index: lastPivotIndex, price: lastPivotPrice });
          trend = -1;
          lastPivotPrice = low;
          lastPivotIndex = i;
        }
      }
    } else {
      if (low <= lastPivotPrice) {
        lastPivotPrice = low;
        lastPivotIndex = i;
      } else {
        const reversal = (high - lastPivotPrice) / lastPivotPrice;
        if (reversal >= thresholdPct) {
          pivots.push({ index: lastPivotIndex, price: lastPivotPrice });
          trend = 1;
          lastPivotPrice = high;
          lastPivotIndex = i;
        }
      }
    }
  }

  pivots.push({ index: lastPivotIndex, price: lastPivotPrice });

  const cleaned = [];
  for (const p of pivots) {
    const last = cleaned[cleaned.length - 1];
    if (!last || last.index !== p.index) cleaned.push(p);
  }

  return cleaned;
}

function useElementSize(ref) {
  const [size, setSize] = useState({ width: 900, height: 560 });

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;

    const update = () => {
      const rect = el.getBoundingClientRect();
      setSize({
        width: Math.max(320, rect.width),
        height: Math.max(320, rect.height),
      });
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [ref]);

  return size;
}

function getStoredHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveHistory(history) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {}
}

function getStoredFavorites() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return ["BTCUSDT", "ETHUSDT", "SOLUSDT"];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : ["BTCUSDT", "ETHUSDT", "SOLUSDT"];
  } catch {
    return ["BTCUSDT", "ETHUSDT", "SOLUSDT"];
  }
}

function saveFavorites(favorites) {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  } catch {}
}

function coinLogoUrl(base) {
  return `https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/${String(
    base || ""
  ).toLowerCase()}.png`;
}

function marketCapRank(base) {
  const ranks = {
    BTC: 1,
    ETH: 2,
    BNB: 3,
    SOL: 4,
    XRP: 5,
    DOGE: 6,
    ADA: 7,
    TRX: 8,
    AVAX: 9,
    DOT: 10,
    LINK: 11,
    BCH: 12,
    LTC: 13,
    NEAR: 14,
    APT: 15,
    ATOM: 16,
    FIL: 17,
    OP: 18,
    ARB: 19,
    MATIC: 20,
  };
  return ranks[base] || 9999;
}

function buildReportStats(list) {
  const totalTrades = list.length;
  const wins = list.filter((h) => h.status === "won").length;
  const losses = list.filter((h) => h.status === "lost").length;
  const net = list.reduce((sum, h) => sum + Number(h.pnl || 0), 0);
  const totalInvested = list.reduce((sum, h) => sum + Number(h.amount || 0), 0);
  const winRate = totalTrades ? ((wins / totalTrades) * 100).toFixed(2) : "0.00";

  const sortedByPnl = [...list].sort((a, b) => Number(b.pnl || 0) - Number(a.pnl || 0));

  return {
    totalTrades,
    wins,
    losses,
    net,
    totalInvested,
    winRate,
    bestTrade: sortedByPnl[0] || null,
    worstTrade: sortedByPnl[sortedByPnl.length - 1] || null,
  };
}

function Icon({ name }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  switch (name) {
    case "menu":
      return (
        <svg {...common}>
          <path d="M4 7h16" />
          <path d="M4 12h16" />
          <path d="M4 17h16" />
        </svg>
      );
    case "trade":
      return (
        <svg {...common}>
          <rect x="4" y="5" width="16" height="12" rx="2" />
          <path d="M7 13l3-3 2 2 5-5" />
        </svg>
      );
    case "support":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M9.5 9a2.5 2.5 0 1 1 4.5 1.5c-.8.8-1.8 1.3-2 2.5" />
          <path d="M12 17h.01" />
        </svg>
      );
    case "account":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20a8 8 0 0 1 16 0" />
        </svg>
      );
    case "trophy":
      return (
        <svg {...common}>
          <path d="M8 21h8" />
          <path d="M12 17v4" />
          <path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" />
          <path d="M17 5h2a1 1 0 0 1 1 1v1a4 4 0 0 1-4 4" />
          <path d="M7 5H5a1 1 0 0 0-1 1v1a4 4 0 0 0 4 4" />
        </svg>
      );
    case "market":
      return (
        <svg {...common}>
          <path d="M4 19h16" />
          <path d="M7 15V9" />
          <path d="M12 15V5" />
          <path d="M17 15v-7" />
        </svg>
      );
    case "dots":
      return (
        <svg {...common}>
          <circle cx="6" cy="12" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="18" cy="12" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      );
    case "bell":
      return (
        <svg {...common}>
          <path d="M6 8a6 6 0 1 1 12 0c0 6 3 6 3 8H3c0-2 3-2 3-8" />
          <path d="M10 20a2 2 0 0 0 4 0" />
        </svg>
      );
    case "plus":
      return (
        <svg {...common}>
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
      );
    case "minus":
      return (
        <svg {...common}>
          <path d="M5 12h14" />
        </svg>
      );
    case "up":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 16V8" />
          <path d="m8.5 11.5 3.5-3.5 3.5 3.5" />
        </svg>
      );
    case "down":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v8" />
          <path d="m8.5 12.5 3.5 3.5 3.5-3.5" />
        </svg>
      );
    case "clock":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    case "pen":
      return (
        <svg {...common}>
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
        </svg>
      );
    case "cross":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="5" />
          <path d="M12 2v3" />
          <path d="M12 19v3" />
          <path d="M2 12h3" />
          <path d="M19 12h3" />
        </svg>
      );
    case "wave":
      return (
        <svg {...common}>
          <path d="M4 15c2-6 4 6 8 0s6 6 8 0" />
        </svg>
      );
    case "mute":
      return (
        <svg {...common}>
          <path d="M11 5 6 9H3v6h3l5 4V5Z" />
          <path d="m17 9 4 6" />
          <path d="m21 9-4 6" />
        </svg>
      );
    case "history":
      return (
        <svg {...common}>
          <path d="M3 12a9 9 0 1 0 3-6.7" />
          <path d="M3 4v5h5" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    case "wallet":
      return (
        <svg {...common}>
          <path d="M3 7h17a1 1 0 0 1 1 1v9a2 2 0 0 1-2 2H3z" />
          <path d="M3 7V6a2 2 0 0 1 2-2h13" />
          <path d="M16 12h5" />
        </svg>
      );
    case "star":
      return (
        <svg {...common}>
          <path d="m12 3 2.8 5.67 6.26.91-4.53 4.42 1.07 6.25L12 17.27 6.4 20.25l1.07-6.25L2.94 9.58l6.26-.91L12 3Z" />
        </svg>
      );
    case "search":
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      );
    default:
      return null;
  }
}

function SideMenu({ activeMenu, setActiveMenu, mobileOpen, setMobileOpen }) {
  const getIcon = (key) => {
    switch (key) {
      case "trade":
        return "trade";
      case "support":
        return "support";
      case "account":
        return "account";
      case "tournaments":
        return "trophy";
      case "market":
        return "market";
      default:
        return "dots";
    }
  };

  return (
    <>
      <aside className={cls("tpSidebar", mobileOpen && "mobileOpen")}>
        <div className="tpSidebarTop">
          <button className="tpIconBtn" onClick={() => setMobileOpen(false)}>
            <Icon name="menu" />
          </button>
        </div>

        <div className="tpSidebarNav">
          {MENU_ITEMS.map((item) => (
            <button
              key={item.key}
              className={cls("tpSideNav", activeMenu === item.key && "active")}
              onClick={() => {
                setActiveMenu(item.key);
                setMobileOpen(false);
              }}
            >
              <Icon name={getIcon(item.key)} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        <div className="tpSidebarBottom">
          <div className="tpBottomToolRow">
            <button className="tpIconBtn">
              <Icon name="cross" />
            </button>
            <button className="tpIconBtn">
              <Icon name="mute" />
            </button>
          </div>
          <button className="tpHelpBtn">Help</button>
        </div>
      </aside>

      {mobileOpen && <div className="tpSidebarBackdrop" onClick={() => setMobileOpen(false)} />}
    </>
  );
}

function CandleChart({
  candles,
  price,
  pairLabel,
  payout,
  indicators,
  openTrades,
  onToggleIndicator,
}) {
  const wrapRef = useRef(null);
  const { width, height } = useElementSize(wrapRef);
  const [hoverIndex, setHoverIndex] = useState(null);
  const [smoothPrice, setSmoothPrice] = useState(price || 0);

  useEffect(() => {
    if (!price) return;
    let raf = 0;

    const animate = () => {
      setSmoothPrice((prev) => {
        const next = prev + (price - prev) * 0.18;
        if (Math.abs(price - next) < 0.000001) return price;
        return next;
      });
      raf = requestAnimationFrame(animate);
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [price]);

  const digits = getDigits(price);
  const visibleCount = 70;
  const visibleStart = Math.max(0, candles.length - visibleCount);
  const visible = candles.slice(visibleStart);
  const fullCloses = candles.map((c) => c.close);

  const leftPad = 12;
  const rightPad = width < 700 ? 88 : 120;
  const topPad = width < 700 ? 134 : 146;
  const bottomPad = width < 700 ? 66 : 64;

  const chartW = Math.max(100, width - leftPad - rightPad);
  const chartH = Math.max(100, height - topPad - bottomPad);
  const step = chartW / Math.max(visible.length, 1);

  const fullEma9 = calcEMA(fullCloses, 9);
  const fullEma21 = calcEMA(fullCloses, 21);
  const fullSma20 = calcSMA(fullCloses, 20);
  const fullBb = calcBollinger(fullCloses, 20, 2);
  const fullZigZags = calcZigZag(candles, 0.003);

  const ema9 = fullEma9.slice(visibleStart);
  const ema21 = fullEma21.slice(visibleStart);
  const sma20 = fullSma20.slice(visibleStart);
  const bb = {
    upper: fullBb.upper.slice(visibleStart),
    lower: fullBb.lower.slice(visibleStart),
    mid: fullBb.mid.slice(visibleStart),
  };

  const zigzags = fullZigZags
    .filter((z) => z.index >= visibleStart)
    .map((z) => ({ ...z, visibleIndex: z.index - visibleStart }));

  const indicatorValues = [
    ...ema9.filter((v) => v != null),
    ...ema21.filter((v) => v != null),
    ...sma20.filter((v) => v != null),
    ...bb.upper.filter((v) => v != null),
    ...bb.lower.filter((v) => v != null),
    ...zigzags.map((z) => z.price),
  ];

  const rawHigh = Math.max(...visible.map((c) => c.high), ...indicatorValues, smoothPrice || 0);
  const rawLow = Math.min(...visible.map((c) => c.low), ...indicatorValues, smoothPrice || Number.MAX_SAFE_INTEGER);
  const range = Math.max(rawHigh - rawLow, Math.abs(rawHigh || 1) * 0.002 || 1);
  const yMax = rawHigh + range * 0.12;
  const yMin = rawLow - range * 0.12;

  const y = (v) => topPad + ((yMax - v) / (yMax - yMin || 1)) * chartH;
  const x = (i) => leftPad + i * step + step / 2;

  const activeIndex = hoverIndex == null ? visible.length - 1 : hoverIndex;
  const activeCandle = visible[Math.max(0, Math.min(activeIndex, visible.length - 1))];

  const gridY = 8;
  const gridX = Math.min(10, Math.max(5, Math.floor(width / 120)));

  const handleMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xx = e.clientX - rect.left - leftPad;
    const i = Math.floor(xx / step);
    if (i >= 0 && i < visible.length) setHoverIndex(i);
  };

  const handleLeave = () => setHoverIndex(null);

  const ema9Points = ema9.map((v, i) => (v == null ? null : { x: x(i), y: y(v) }));
  const ema21Points = ema21.map((v, i) => (v == null ? null : { x: x(i), y: y(v) }));
  const sma20Points = sma20.map((v, i) => (v == null ? null : { x: x(i), y: y(v) }));
  const bbUpperPoints = bb.upper.map((v, i) => (v == null ? null : { x: x(i), y: y(v) }));
  const bbLowerPoints = bb.lower.map((v, i) => (v == null ? null : { x: x(i), y: y(v) }));
  const bbMidPoints = bb.mid.map((v, i) => (v == null ? null : { x: x(i), y: y(v) }));
  const zigzagPoints = zigzags.map((z) => ({ x: x(z.visibleIndex), y: y(z.price) }));

  const activeIndicatorItems = [
    indicators.bb && {
      key: "bb",
      title: "BOLLINGER BANDS",
      values: ["20", "2.00"],
      dotClass: "is-bb",
    },
    indicators.ema9 && {
      key: "ema9",
      title: "MOVING AVERAGE",
      values: ["EMA", "9"],
      dotClass: "is-ema9",
    },
    indicators.ema21 && {
      key: "ema21",
      title: "MOVING AVERAGE",
      values: ["EMA", "21"],
      dotClass: "is-ema21",
    },
    indicators.sma20 && {
      key: "sma20",
      title: "MOVING AVERAGE",
      values: ["SMA", "20"],
      dotClass: "is-sma20",
    },
    indicators.zigzag && {
      key: "zigzag",
      title: "ZIG ZAG",
      values: ["5", "12", "3"],
      dotClass: "is-zigzag",
    },
  ].filter(Boolean);

  return (
    <div ref={wrapRef} className="tpChart">
      <div className="tpChartTopRow">
        <div className="tpChartTopLeft">
          <div className="tpChartPercent">{payout}%</div>
          <div className="tpChartNow">• {formatClock(Date.now())} UTC</div>
        </div>

        <div className="tpChartTopRight">
          <div className="tpMiniStat positive">▲ 0.00%</div>
          <div className="tpMiniStat">Vol {compact(activeCandle?.volume || 0)}</div>
          <div className="tpMiniStat">Price {Number(smoothPrice || 0).toFixed(digits)}</div>
        </div>
      </div>

      <div className="tpChartSubRow">
        <span className="tpDot" />
        <span>{formatClock(Date.now())} UTC</span>
        <strong>{pairLabel}</strong>
      </div>

      <div className="tpPairInfoBadge">
        <span className="tpPairInfoBadgeIcon">i</span>
        <span>PAIR INFORMATION</span>
      </div>

      <div className="tpIndicatorTopBar">
        {activeIndicatorItems.map((item) => (
          <div key={item.key} className="tpIndicatorTopItem">
            <span className="tpIndicatorTopTitle">{item.title}</span>
            <span className={cls("tpIndicatorTopDot", item.dotClass)} />
            <div className="tpIndicatorTopVals">
              {item.values.map((v, i) => (
                <span key={`${item.key}-${i}`} className="tpIndicatorTopVal">
                  {v}
                </span>
              ))}
            </div>
            <button
              className="tpIndicatorTopClose"
              onClick={() => onToggleIndicator(item.key)}
              aria-label={`Hide ${item.title}`}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className="tpChartSideTools">
        <button className="tpTool">
          <Icon name="pen" />
        </button>
        <button className="tpTool">
          <Icon name="wave" />
        </button>
        <button className="tpTool">
          <Icon name="cross" />
        </button>
        <button className="tpTool tpTf">1m</button>
      </div>

      <svg
        className="tpChartSvg"
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
      >
        <defs>
          <linearGradient id="bbFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(122,132,255,0.18)" />
            <stop offset="100%" stopColor="rgba(122,132,255,0.03)" />
          </linearGradient>
        </defs>

        {Array.from({ length: gridY + 1 }).map((_, i) => {
          const yy = topPad + (chartH / gridY) * i;
          return <line key={`gy-${i}`} x1={leftPad} y1={yy} x2={width - rightPad} y2={yy} className="tpGridLine" />;
        })}

        {Array.from({ length: gridX + 1 }).map((_, i) => {
          const xx = leftPad + (chartW / gridX) * i;
          return (
            <line
              key={`gx-${i}`}
              x1={xx}
              y1={topPad}
              x2={xx}
              y2={height - bottomPad}
              className="tpGridLine tpGridV"
            />
          );
        })}

        {Array.from({ length: gridY + 1 }).map((_, i) => {
          const val = yMax - ((yMax - yMin) / gridY) * i;
          const yy = topPad + (chartH / gridY) * i;
          return (
            <text key={`yl-${i}`} x={width - rightPad + 10} y={yy + 4} className="tpAxisText">
              {Number(val).toFixed(digits)}
            </text>
          );
        })}

        {indicators.bb && (
          <>
            <path d={areaPath(bbUpperPoints, bbLowerPoints)} className="tpBbArea tpAnimLine" />
            <path d={linePath(bbUpperPoints)} className="tpLine tpBbLine tpAnimLine" />
            <path d={linePath(bbLowerPoints)} className="tpLine tpBbLine tpAnimLine" />
            <path d={linePath(bbMidPoints)} className="tpLine tpBbMid tpAnimLine" />
          </>
        )}

        {indicators.ema9 && <path d={linePath(ema9Points)} className="tpLine tpEma9 tpAnimLine" />}
        {indicators.ema21 && <path d={linePath(ema21Points)} className="tpLine tpEma21 tpAnimLine" />}
        {indicators.sma20 && <path d={linePath(sma20Points)} className="tpLine tpSma20 tpAnimLine" />}

        {visible.map((c, i) => {
          const green = c.close >= c.open;
          const bodyW = Math.max(4, step * 0.62);
          const xx = x(i);
          const yOpen = y(c.open);
          const yClose = y(c.close);
          const yHigh = y(c.high);
          const yLow = y(c.low);
          const bodyY = Math.min(yOpen, yClose);
          const bodyH = Math.max(2, Math.abs(yClose - yOpen));

          return (
            <g key={c.openTime} className="tpCandleGroup">
              <line
                x1={xx}
                y1={yHigh}
                x2={xx}
                y2={yLow}
                className={cls(green ? "tpWickUp" : "tpWickDown", "tpCandleWick")}
              />
              <rect
                x={xx - bodyW / 2}
                y={bodyY}
                width={bodyW}
                height={bodyH}
                rx="1.4"
                className={cls(green ? "tpBodyUp" : "tpBodyDown", "tpCandleBody")}
              />
            </g>
          );
        })}

        {indicators.zigzag && zigzagPoints.length > 1 && <path d={linePath(zigzagPoints)} className="tpLine tpZigZag tpAnimLine" />}

        {hoverIndex != null && activeCandle && (
          <>
            <line x1={x(hoverIndex)} y1={topPad} x2={x(hoverIndex)} y2={height - bottomPad} className="tpCrossHair" />
            <line
              x1={leftPad}
              y1={y(activeCandle.close)}
              x2={width - rightPad}
              y2={y(activeCandle.close)}
              className="tpCrossHair"
            />
          </>
        )}

        {openTrades.map((t, idx) => {
          const yy = y(t.entryPrice);
          return (
            <g key={t.id}>
              <line
                x1={leftPad}
                y1={yy}
                x2={width - rightPad}
                y2={yy}
                className={t.side === "up" ? "tpTradeLineUp" : "tpTradeLineDown"}
              />
              <foreignObject x={leftPad + 6 + idx * 104} y={yy - 14} width="98" height="28">
                <div className={cls("tpTradeMarker", t.side === "up" ? "up" : "down")}>
                  <span>{t.side === "up" ? "↑" : "↓"}</span>
                  <span>${t.amount}</span>
                  <span>{formatCountdown(t.remainingMs / 1000)}</span>
                </div>
              </foreignObject>
            </g>
          );
        })}

        {!!smoothPrice && (
          <>
            <line x1={leftPad} y1={y(smoothPrice)} x2={width - rightPad} y2={y(smoothPrice)} className="tpPriceLine tpAnimPrice" />
            <rect
              x={width - rightPad + 3}
              y={y(smoothPrice) - 12}
              width={width < 700 ? 72 : 90}
              height="24"
              rx="11"
              className="tpPriceBox tpAnimPrice"
            />
            <text
              x={width - rightPad + (width < 700 ? 39 : 48)}
              y={y(smoothPrice) + 4}
              textAnchor="middle"
              className="tpPriceText"
            >
              {Number(smoothPrice).toFixed(digits)}
            </text>
          </>
        )}

        {visible
          .filter((_, i) => i % Math.max(1, Math.floor(visible.length / 8)) === 0)
          .map((c, indexFromFilter, arr) => {
            const realIndex = visible.findIndex((v) => v.openTime === c.openTime);
            const d = new Date(c.openTime);
            return (
              <text key={`xl-${c.openTime}-${indexFromFilter}-${arr.length}`} x={x(realIndex)} y={height - 12} textAnchor="middle" className="tpAxisText">
                {`${pad2(d.getHours())}:${pad2(d.getMinutes())}`}
              </text>
            );
          })}
      </svg>

      <div className="tpOHLC">
        <span>O {activeCandle ? activeCandle.open.toFixed(digits) : "--"}</span>
        <span>H {activeCandle ? activeCandle.high.toFixed(digits) : "--"}</span>
        <span>L {activeCandle ? activeCandle.low.toFixed(digits) : "--"}</span>
        <span>C {activeCandle ? activeCandle.close.toFixed(digits) : "--"}</span>
      </div>
    </div>
  );
}

function SupportPanel() {
  return (
    <div className="tpContentCard">
      <div className="tpSectionTitle">Support Center</div>
      <div className="tpGridInfo">
        <div className="tpInfoBox">
          <strong>Live Chat</strong>
          <p>Connect with an operator for platform, deposit, withdrawal, and trading support.</p>
        </div>
        <div className="tpInfoBox">
          <strong>FAQ</strong>
          <p>Find quick answers about indicators, trade settlement, payout logic, and market timing.</p>
        </div>
        <div className="tpInfoBox">
          <strong>Risk Notice</strong>
          <p>Digital trading carries risk. Review market conditions carefully before opening trades.</p>
        </div>
      </div>
    </div>
  );
}

function ReportModal({ open, title, type = "summary", data, onClose }) {
  if (!open || !data) return null;

  return (
    <div className="tpReportOverlay" onClick={onClose}>
      <div className="tpReportModal" onClick={(e) => e.stopPropagation()}>
        <div className="tpReportHead">
          <div>
            <div className="tpReportEyebrow">Professional Report</div>
            <h3>{title}</h3>
          </div>

          <button className="tpReportClose" onClick={onClose} type="button">
            ×
          </button>
        </div>

        {type === "trade" ? (
          <div className="tpReportGrid">

            <div className="tpReportCard is-primary">
              <span>Status</span>
              <strong className={data.status === "won" ? "positive" : "negative"}>
                {String(data.status || "").toUpperCase()}
              </strong>
            </div>

            <div className="tpReportCard is-pair">
              <span>Pair</span>
              <strong>{data.pair}</strong>
            </div>

            <div className="tpReportCard is-direction">
              <span>Direction</span>
              <strong>{data.side === "up" ? "BUY" : "SELL"}</strong>
            </div>

            <div className="tpReportCard">
              <span>Investment</span>
              <strong>${nfmt(data.amount, 2)}</strong>
            </div>

            <div className="tpReportCard">
              <span>Payout</span>
              <strong>{data.payout}%</strong>
            </div>

            <div className={cls("tpReportCard", Number(data.pnl) >= 0 ? "is-profit" : "is-loss")}>
              <span>Profit / Loss</span>
              <strong className={Number(data.pnl) >= 0 ? "positive" : "negative"}>
                {Number(data.pnl) >= 0 ? "+" : ""}${nfmt(data.pnl, 2)}
              </strong>
            </div>

            <div className="tpReportCard">
              <span>Entry Price</span>
              <strong>{data.entryPriceFormatted}</strong>
            </div>

            <div className="tpReportCard">
              <span>Exit Price</span>
              <strong>{data.exitPriceFormatted}</strong>
            </div>

            <div className="tpReportCard wide">
              <span>Opened At</span>
              <strong>{formatDateTime(data.openedAt)}</strong>
            </div>

            <div className="tpReportCard wide">
              <span>Closed At</span>
              <strong>{formatDateTime(data.closedAt)}</strong>
            </div>

            <div className="tpReportCard wide">
              <span>Trade ID</span>
              <strong>{data.id}</strong>
            </div>

          </div>
        ) : (
          <div className="tpReportGrid">

            <div className="tpReportCard">
              <span>Total Trades</span>
              <strong>{data.totalTrades}</strong>
            </div>

            <div className="tpReportCard">
              <span>Wins</span>
              <strong className="positive">{data.wins}</strong>
            </div>

            <div className="tpReportCard">
              <span>Losses</span>
              <strong className="negative">{data.losses}</strong>
            </div>

            <div className="tpReportCard">
              <span>Win Rate</span>
              <strong>{data.winRate}%</strong>
            </div>

            <div className="tpReportCard">
              <span>Total Invested</span>
              <strong>${nfmt(data.totalInvested, 2)}</strong>
            </div>

            <div className={cls("tpReportCard", Number(data.net) >= 0 ? "is-profit" : "is-loss")}>
              <span>Net P/L</span>
              <strong className={Number(data.net) >= 0 ? "positive" : "negative"}>
                {Number(data.net) >= 0 ? "+" : ""}${nfmt(data.net, 2)}
              </strong>
            </div>

            <div className="tpReportCard wide">
              <span>Best Trade</span>
              <strong>
                {data.bestTrade
                  ? `${data.bestTrade.pair} • ${
                      Number(data.bestTrade.pnl) >= 0 ? "+" : ""
                    }$${nfmt(data.bestTrade.pnl, 2)}`
                  : "No data"}
              </strong>
            </div>

            <div className="tpReportCard wide">
              <span>Worst Trade</span>
              <strong>
                {data.worstTrade
                  ? `${data.worstTrade.pair} • ${
                      Number(data.worstTrade.pnl) >= 0 ? "+" : ""
                    }$${nfmt(data.worstTrade.pnl, 2)}`
                  : "No data"}
              </strong>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

function AccountPanel({ balance, history, onOpenReport }) {
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  const oneMonth = 30 * oneDay;

  const totalStats = buildReportStats(history);
  const dailyStats = buildReportStats(history.filter((h) => now - h.closedAt <= oneDay));
  const monthlyStats = buildReportStats(history.filter((h) => now - h.closedAt <= oneMonth));

  return (
    <div className="tpContentCard">
      <div className="tpSectionTitle">Account Overview</div>
      <div className="tpStatsGrid">
        <div className="tpStatCard">
          <span>Balance</span>
          <strong>${nfmt(balance, 2)}</strong>
        </div>

        <button
          className="tpStatCard tpStatCardBtn"
          type="button"
          onClick={() => onOpenReport("Daily Report", "summary", dailyStats)}
        >
          <span>Daily Record</span>
          <strong>{dailyStats.totalTrades} Trades</strong>
        </button>

        <button
          className="tpStatCard tpStatCardBtn"
          type="button"
          onClick={() => onOpenReport("Monthly Report", "summary", monthlyStats)}
        >
          <span>Monthly Record</span>
          <strong>{monthlyStats.totalTrades} Trades</strong>
        </button>

        <button
          className="tpStatCard tpStatCardBtn"
          type="button"
          onClick={() => onOpenReport("Total Report", "summary", totalStats)}
        >
          <span>Total Record</span>
          <strong>{totalStats.totalTrades} Trades</strong>
        </button>

        <div className="tpStatCard wide">
          <span>Net P/L</span>
          <strong className={totalStats.net >= 0 ? "positive" : "negative"}>
            {totalStats.net >= 0 ? "+" : ""}${nfmt(totalStats.net, 2)}
          </strong>
        </div>
      </div>
    </div>
  );
}

function MarketPanel({ pair, price, candles }) {
  const last = candles[candles.length - 1];
  const prev = candles[candles.length - 2];
  const change = last && prev ? last.close - prev.close : 0;
  const digits = getDigits(price);

  return (
    <div className="tpContentCard">
      <div className="tpSectionTitle">Market Snapshot</div>
      <div className="tpGridInfo">
        <div className="tpInfoBox">
          <strong>Selected Pair</strong>
          <p>{pair.label}</p>
        </div>
        <div className="tpInfoBox">
          <strong>Current Price</strong>
          <p>{Number(price || 0).toFixed(digits)}</p>
        </div>
        <div className="tpInfoBox">
          <strong>Last Candle Change</strong>
          <p className={change >= 0 ? "positive" : "negative"}>
            {change >= 0 ? "+" : ""}
            {change.toFixed(digits)}
          </p>
        </div>
      </div>
    </div>
  );
}

function TournamentsPanel() {
  return (
    <div className="tpContentCard">
      <div className="tpSectionTitle">Tournaments</div>
      <div className="tpGridInfo">
        <div className="tpInfoBox">
          <strong>Weekly Challenge</strong>
          <p>Compete on return percentage and consistency with limited virtual capital.</p>
        </div>
        <div className="tpInfoBox">
          <strong>Rank Rewards</strong>
          <p>Premium competition layout for leaderboards, trading streaks, and result summaries.</p>
        </div>
      </div>
    </div>
  );
}

function MorePanel() {
  return (
    <div className="tpContentCard">
      <div className="tpSectionTitle">More Options</div>
      <div className="tpGridInfo">
        <div className="tpInfoBox">
          <strong>Platform Settings</strong>
          <p>Customize chart visibility, trade panel behavior, and history display preferences.</p>
        </div>
        <div className="tpInfoBox">
          <strong>Notifications</strong>
          <p>Enable alerts for trade results, market activity, and account balance changes.</p>
        </div>
      </div>
    </div>
  );
}

function TradeHistoryPanel({ history, selectedId, setSelectedId, clearHistory, onOpenReport }) {
  const selected = history.find((h) => h.id === selectedId) || history[0] || null;

  return (
    <div className="tpHistoryWrap">
      <div className="tpHistoryHeader">
        <div className="tpHistoryTitle">
          <Icon name="history" />
          <strong>Professional Trade History</strong>
        </div>
        <button className="tpClearBtn" onClick={clearHistory}>
          Clear History
        </button>
      </div>

      <div className="tpHistoryGrid">
        <div className="tpHistoryList">
          {!history.length ? (
            <div className="tpEmptyTrades">No recorded trades yet.</div>
          ) : (
            history.map((item) => (
              <button
                key={item.id}
                className={cls("tpHistoryItem", selected?.id === item.id && "active")}
                onClick={() => {
                  setSelectedId(item.id);
                  onOpenReport("Finished Trade Report", "trade", item);
                }}
              >
                <div className="tpHistoryItemTop">
                  <strong>{item.pair}</strong>
                  <span className={item.status === "won" ? "positive" : "negative"}>
                    {item.status.toUpperCase()}
                  </span>
                </div>
                <div className="tpHistoryItemMid">
                  <span>{item.side === "up" ? "BUY" : "SELL"}</span>
                  <span>${nfmt(item.amount, 2)}</span>
                </div>
                <div className="tpHistoryItemBot">
                  <span>{formatDateTime(item.closedAt)}</span>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="tpHistoryDetails">
          {!selected ? (
            <div className="tpEmptyTrades">Select a trade record to view details.</div>
          ) : (
            <>
              <div className="tpDetailHead">
                <strong>{selected.pair}</strong>
                <span className={selected.status === "won" ? "positive" : "negative"}>
                  {selected.status.toUpperCase()}
                </span>
              </div>

              <div className="tpDetailGrid">
                <div className="tpDetailBox">
                  <span>Trade ID</span>
                  <strong>{selected.id}</strong>
                </div>
                <div className="tpDetailBox">
                  <span>Direction</span>
                  <strong>{selected.side === "up" ? "BUY" : "SELL"}</strong>
                </div>
                <div className="tpDetailBox">
                  <span>Investment</span>
                  <strong>${nfmt(selected.amount, 2)}</strong>
                </div>
                <div className="tpDetailBox">
                  <span>Payout %</span>
                  <strong>{selected.payout}%</strong>
                </div>
                <div className="tpDetailBox">
                  <span>Entry Price</span>
                  <strong>{selected.entryPriceFormatted}</strong>
                </div>
                <div className="tpDetailBox">
                  <span>Exit Price</span>
                  <strong>{selected.exitPriceFormatted}</strong>
                </div>
                <div className="tpDetailBox">
                  <span>Opened At</span>
                  <strong>{formatDateTime(selected.openedAt)}</strong>
                </div>
                <div className="tpDetailBox">
                  <span>Closed At</span>
                  <strong>{formatDateTime(selected.closedAt)}</strong>
                </div>
                <div className="tpDetailBox wide">
                  <span>Profit / Loss</span>
                  <strong className={selected.pnl >= 0 ? "positive" : "negative"}>
                    {selected.pnl >= 0 ? "+" : ""}${nfmt(selected.pnl, 2)}
                  </strong>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TradingPro() {
  const [allPairs] = useState(PAIRS);
  const [pairIndex, setPairIndex] = useState(0);
  const pair = allPairs[pairIndex] || allPairs[0] || PAIRS[0];

  const [candles, setCandles] = useState([]);
  const [price, setPrice] = useState(0);
  const [balance, setBalance] = useState(12794.26);
  const [tradeSeconds, setTradeSeconds] = useState(15);
  const [investment, setInvestment] = useState(15);
  const [trades, setTrades] = useState([]);
  const [history, setHistory] = useState(() => getStoredHistory());
  const [selectedHistoryId, setSelectedHistoryId] = useState(null);
  const [pendingTradeEnabled, setPendingTradeEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState("trade");
  const [showPairSelector, setShowPairSelector] = useState(false);
  const [pairSearch, setPairSearch] = useState("");
  const [favorites, setFavorites] = useState(() => getStoredFavorites());
  const [marketStats, setMarketStats] = useState({});
  const [quoteFilter, setQuoteFilter] = useState("ALL");
  const [sortMode, setSortMode] = useState("marketcap");
  const [indicators, setIndicators] = useState({
    ema9: true,
    ema21: true,
    sma20: true,
    bb: true,
    zigzag: true,
  });

  const [reportOpen, setReportOpen] = useState(false);
  const [reportTitle, setReportTitle] = useState("");
  const [reportType, setReportType] = useState("summary");
  const [reportData, setReportData] = useState(null);

  const wsRef = useRef(null);
  const fallbackTickRef = useRef(null);

  useEffect(() => {
    saveHistory(history);
    if (!selectedHistoryId && history.length) {
      setSelectedHistoryId(history[0].id);
    }
  }, [history, selectedHistoryId]);

  useEffect(() => {
    saveFavorites(favorites);
  }, [favorites]);

  useEffect(() => {
    let ignore = false;

    async function loadTickerStats() {
      try {
        const res = await fetch(`${REST_BASE}/ticker/24hr`);
        if (!res.ok) throw new Error("Failed ticker stats");
        const data = await res.json();

        const next = {};
        for (const item of data) {
          next[item.symbol] = {
            lastPrice: Number(item.lastPrice),
            priceChangePercent: Number(item.priceChangePercent),
            quoteVolume: Number(item.quoteVolume),
          };
        }

        if (!ignore) setMarketStats(next);
      } catch (err) {
        console.error("Failed ticker stats", err);
      }
    }

    loadTickerStats();
    const id = setInterval(loadTickerStats, 15000);

    return () => {
      ignore = true;
      clearInterval(id);
    };
  }, []);

  const filteredPairs = useMemo(() => {
    const q = pairSearch.trim().toLowerCase();

    let list = allPairs.filter((p) => {
      if (quoteFilter !== "ALL" && p.quoteAsset !== quoteFilter) return false;

      if (!q) return true;
      return (
        p.symbol.toLowerCase().includes(q) ||
        p.label.toLowerCase().includes(q) ||
        p.baseAsset?.toLowerCase().includes(q) ||
        p.quoteAsset?.toLowerCase().includes(q)
      );
    });

    if (sortMode === "favorites") {
      list = list
        .slice()
        .sort((a, b) => {
          const af = favorites.includes(a.symbol) ? 1 : 0;
          const bf = favorites.includes(b.symbol) ? 1 : 0;
          if (bf !== af) return bf - af;
          return a.label.localeCompare(b.label);
        });
    } else if (sortMode === "volume") {
      list = list
        .slice()
        .sort(
          (a, b) =>
            Number(marketStats[b.symbol]?.quoteVolume || 0) - Number(marketStats[a.symbol]?.quoteVolume || 0)
        );
    } else if (sortMode === "marketcap") {
      list = list
        .slice()
        .sort((a, b) => marketCapRank(a.baseAsset) - marketCapRank(b.baseAsset));
    } else {
      list = list.slice().sort((a, b) => a.label.localeCompare(b.label));
    }

    return list;
  }, [allPairs, pairSearch, quoteFilter, sortMode, favorites, marketStats]);

  const favoritePairs = useMemo(
    () =>
      allPairs
        .filter((p) => favorites.includes(p.symbol))
        .filter((p) => quoteFilter === "ALL" || p.quoteAsset === quoteFilter)
        .slice(0, 12),
    [allPairs, favorites, quoteFilter]
  );

  const trendingPairs = useMemo(() => {
    return allPairs
      .filter((p) => marketStats[p.symbol])
      .filter((p) => quoteFilter === "ALL" || p.quoteAsset === quoteFilter)
      .slice()
      .sort(
        (a, b) =>
          Math.abs(marketStats[b.symbol]?.priceChangePercent || 0) -
          Math.abs(marketStats[a.symbol]?.priceChangePercent || 0)
      )
      .slice(0, 10);
  }, [allPairs, marketStats, quoteFilter]);

  const topVolumePairs = useMemo(() => {
    return allPairs
      .filter((p) => marketStats[p.symbol])
      .filter((p) => quoteFilter === "ALL" || p.quoteAsset === quoteFilter)
      .slice()
      .sort(
        (a, b) =>
          Number(marketStats[b.symbol]?.quoteVolume || 0) - Number(marketStats[a.symbol]?.quoteVolume || 0)
      )
      .slice(0, 10);
  }, [allPairs, marketStats, quoteFilter]);

  const topVisiblePairs = useMemo(() => {
    const current = pair ? [pair] : [];
    const extras = allPairs.filter((p) => p.symbol !== pair?.symbol).slice(0, 4);
    return [...current, ...extras];
  }, [allPairs, pair]);

  const liveTrades = useMemo(
    () => trades.filter((t) => t.symbol === pair.symbol).slice().reverse(),
    [trades, pair.symbol]
  );

  useEffect(() => {
    let ignore = false;
    const controller = new AbortController();

    async function loadData() {
      setIsLoading(true);

      try {
        const res = await fetch(`${REST_BASE}/klines?symbol=${pair.symbol}&interval=1m&limit=160`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Failed kline fetch");
        const data = await res.json();

        if (!ignore && Array.isArray(data) && data.length) {
          const parsed = data.map(normalizeKline);
          setCandles(parsed);
          setPrice(parsed[parsed.length - 1].close);
          setIsLoading(false);
          return;
        }
      } catch (err) {
        console.error(err);
      }

      if (!ignore) {
        const fallback = createFallbackCandles(140, pair.seed);
        setCandles(fallback);
        setPrice(fallback[fallback.length - 1].close);
        setIsLoading(false);
      }
    }

    function startFallbackAnimation() {
      clearInterval(fallbackTickRef.current);
      fallbackTickRef.current = setInterval(() => {
        setCandles((prev) => {
          if (!prev.length) return prev;
          const copy = [...prev];
          const last = copy[copy.length - 1];
          const now = Date.now();
          const currentMinute = Math.floor(now / 60000) * 60000;

          if (last.openTime === currentMinute) {
            const drift = (Math.random() - 0.5) * last.close * 0.0008;
            const close = Math.max(0.0001, last.close + drift);
            copy[copy.length - 1] = {
              ...last,
              high: Math.max(last.high, close),
              low: Math.min(last.low, close),
              close,
              closeTime: now,
            };
            setPrice(close);
          } else {
            const open = last.close;
            const close = Math.max(0.0001, open + (Math.random() - 0.5) * open * 0.0012);
            copy.push({
              openTime: currentMinute,
              open,
              high: Math.max(open, close),
              low: Math.min(open, close),
              close,
              volume: 120 + Math.random() * 500,
              closeTime: currentMinute + 59_999,
            });
            setPrice(close);
          }

          return copy.slice(-180);
        });
      }, 1000);
    }

    function startWebSocket() {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }

      try {
        const ws = new WebSocket(`${WS_BASE}/${pair.symbol.toLowerCase()}@kline_1m`);
        wsRef.current = ws;

        ws.onmessage = (event) => {
          const msg = JSON.parse(event.data);
          const k = msg.k;

          const candle = {
            openTime: Number(k.t),
            open: Number(k.o),
            high: Number(k.h),
            low: Number(k.l),
            close: Number(k.c),
            volume: Number(k.v),
            closeTime: Number(k.T),
          };

          clearInterval(fallbackTickRef.current);

          setCandles((prev) => {
            const copy = [...prev];
            if (!copy.length) return [candle];

            const last = copy[copy.length - 1];
            if (last.openTime === candle.openTime) {
              copy[copy.length - 1] = {
                ...last,
                ...candle,
              };
            } else {
              copy.push(candle);
            }

            return copy.slice(-180);
          });

          setPrice(candle.close);
        };

        ws.onerror = () => startFallbackAnimation();
        ws.onclose = () => startFallbackAnimation();
      } catch (e) {
        console.error(e);
        startFallbackAnimation();
      }
    }

    loadData().then(startWebSocket);

    return () => {
      ignore = true;
      controller.abort();
      if (wsRef.current) wsRef.current.close();
      clearInterval(fallbackTickRef.current);
    };
  }, [pair.symbol, pair.seed]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTrades((prev) =>
        prev.map((t) => {
          if (t.status !== "open") return t;

          const remainingMs = Math.max(0, t.expiresAt - Date.now());
          if (remainingMs <= 0) {
            const won = t.side === "up" ? price > t.entryPrice : price < t.entryPrice;
            const payoutGain = won ? t.amount * (t.payout / 100) : -t.amount;
            const digits = getDigits(t.entryPrice);

            if (!t.settled) {
              setBalance((b) => Number((b + t.amount + payoutGain).toFixed(2)));

              const record = {
                id: t.id,
                pair: t.pair,
                symbol: t.symbol,
                side: t.side,
                amount: t.amount,
                payout: t.payout,
                status: won ? "won" : "lost",
                pnl: Number(payoutGain.toFixed(2)),
                openedAt: t.openedAt,
                closedAt: Date.now(),
                entryPrice: t.entryPrice,
                exitPrice: price,
                entryPriceFormatted: Number(t.entryPrice).toFixed(digits),
                exitPriceFormatted: Number(price).toFixed(digits),
              };

              setHistory((prevHistory) => [record, ...prevHistory]);
              setSelectedHistoryId(record.id);
            }

            return {
              ...t,
              remainingMs: 0,
              status: won ? "won" : "lost",
              settled: true,
              pnl: payoutGain,
            };
          }

          return { ...t, remainingMs };
        })
      );
    }, 250);

    return () => clearInterval(timer);
  }, [price]);

  const payoutAmount = useMemo(
    () => Number((Number(investment || 0) * (pair.payout / 100)).toFixed(2)),
    [investment, pair.payout]
  );

  function openReport(title, type, data) {
    setReportTitle(title);
    setReportType(type);
    setReportData(data);
    setReportOpen(true);
  }

  function placeTrade(side) {
    const investNum = Number(investment || 0);
    if (!price || balance < investNum || investNum <= 0) return;

    setBalance((b) => Number((b - investNum).toFixed(2)));

    const trade = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      symbol: pair.symbol,
      pair: pair.label,
      side,
      amount: investNum,
      payout: pair.payout,
      entryPrice: price,
      status: "open",
      openedAt: Date.now(),
      expiresAt: Date.now() + tradeSeconds * 1000,
      remainingMs: tradeSeconds * 1000,
      pnl: 0,
      settled: false,
    };

    setTrades((prev) => [...prev, trade]);
  }

  function toggleIndicator(key) {
    setIndicators((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function clearHistory() {
    setHistory([]);
    setSelectedHistoryId(null);
    saveHistory([]);
  }

  function toggleFavorite(symbol) {
    setFavorites((prev) =>
      prev.includes(symbol)
        ? prev.filter((s) => s !== symbol)
        : [symbol, ...prev].slice(0, 20)
    );
  }

  function selectPairBySymbol(symbol) {
    const realIndex = allPairs.findIndex((x) => x.symbol === symbol);
    if (realIndex >= 0) {
      setPairIndex(realIndex);
      setShowPairSelector(false);
      setPairSearch("");
    }
  }

  function renderCoinLogo(baseAsset) {
    return (
      <div className="tpCoinLogoWrap">
        <img
          src={coinLogoUrl(baseAsset)}
          alt={baseAsset}
          className="tpCoinLogo"
          onError={(e) => {
            e.currentTarget.style.display = "none";
            const next = e.currentTarget.nextSibling;
            if (next) next.style.display = "grid";
          }}
        />
        <span className="tpCoinLogoFallback">{String(baseAsset || "?").slice(0, 2)}</span>
      </div>
    );
  }

  function renderSelectorItem(p, compactView = false) {
    const stat = marketStats[p.symbol];
    const digits = getDigits(stat?.lastPrice || p.seed);
    const isFav = favorites.includes(p.symbol);
    const isActive = pair.symbol === p.symbol;
    const change = Number(stat?.priceChangePercent || 0);

    return (
      <button
        key={p.symbol}
        className={cls("tpPairSelectorItem", isActive && "active", compactView && "compact")}
        onClick={() => selectPairBySymbol(p.symbol)}
      >
        <div className="tpPairSelectorLeft">
          <button
            type="button"
            className={cls("tpFavBtn", isFav && "active")}
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(p.symbol);
            }}
            aria-label={isFav ? "Remove favorite" : "Add favorite"}
          >
            <Icon name="star" />
          </button>

          {renderCoinLogo(p.baseAsset)}

          <div className="tpPairText">
            <strong>{p.label}</strong>
            <span>{p.symbol}</span>
          </div>
        </div>

        <div className="tpPairSelectorMeta">
          <span className="tpPairListPrice">
            {stat?.lastPrice ? Number(stat.lastPrice).toFixed(digits) : "--"}
          </span>
          <span className={cls("tpPairListChange", change >= 0 ? "positive" : "negative")}>
            {change >= 0 ? "+" : ""}
            {change.toFixed(2)}%
          </span>
        </div>

        <div className="tpPairSelectorRight">
          <span>{p.payout}%</span>
        </div>
      </button>
    );
  }

  function renderMainContent() {
    if (activeMenu === "support") return <SupportPanel />;
    if (activeMenu === "account") {
      return <AccountPanel balance={balance} history={history} onOpenReport={openReport} />;
    }
    if (activeMenu === "tournaments") return <TournamentsPanel />;
    if (activeMenu === "market") return <MarketPanel pair={pair} price={price} candles={candles} />;
    if (activeMenu === "more") return <MorePanel />;

    return (
      <>
        <div className="tpPairsBarWrap">
          <div className="tpPairsBar">
            <button
              className="tpPairAddBtn"
              onClick={() => setShowPairSelector((v) => !v)}
            >
              <Icon name="plus" />
            </button>

            {topVisiblePairs.map((p) => {
              const realIndex = allPairs.findIndex((x) => x.symbol === p.symbol);
              const stat = marketStats[p.symbol];
              const tabDigits = getDigits(stat?.lastPrice || p.seed);
              const tabChange = Number(stat?.priceChangePercent || 0);

              return (
                <button
                  key={p.symbol}
                  className={cls("tpPairTab", p.symbol === pair.symbol && "active")}
                  onClick={() => {
                    if (realIndex >= 0) setPairIndex(realIndex);
                    setShowPairSelector(false);
                  }}
                >
                  {renderCoinLogo(p.baseAsset)}

                  <div className="tpPairTabContent">
                    <div className="tpPairTabTop">
                      <strong>{p.label}</strong>
                      {p.symbol === pair.symbol && <div className="tpLiveBadge">+LIVE</div>}
                    </div>

                    <div className="tpPairTabBottom">
                      <span className="tpPairTabPayout">{p.payout}%</span>
                      <span className="tpPairTabPrice">
                        {stat?.lastPrice ? Number(stat.lastPrice).toFixed(tabDigits) : "--"}
                      </span>
                      <span className={cls("tpPairTabChange", tabChange >= 0 ? "positive" : "negative")}>
                        {tabChange >= 0 ? "+" : ""}
                        {tabChange.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {showPairSelector && (
            <div className="tpPairSelector">
              <div className="tpPairSelectorHead">
                <strong>Select Coin Pair</strong>
                <button
                  className="tpPairSelectorClose"
                  onClick={() => setShowPairSelector(false)}
                >
                  ×
                </button>
              </div>

              <div className="tpPairSearchWrap">
                <span className="tpPairSearchIcon">
                  <Icon name="search" />
                </span>
                <input
                  className="tpPairSearch"
                  type="text"
                  placeholder="Search coin pair..."
                  value={pairSearch}
                  onChange={(e) => setPairSearch(e.target.value)}
                />
              </div>

              <div className="tpSelectorSection">
                <div className="tpSelectorSectionTitle">Quote Filter</div>
                <div className="tpSelectorTabs">
                  {QUOTE_FILTERS.map((item) => (
                    <button
                      key={item}
                      className={cls("tpSelectorTab", quoteFilter === item && "active")}
                      onClick={() => setQuoteFilter(item)}
                      type="button"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div className="tpSelectorSection">
                <div className="tpSelectorSectionTitle">Sort By</div>
                <div className="tpSelectorTabs">
                  {SORT_OPTIONS.map((item) => (
                    <button
                      key={item.key}
                      className={cls("tpSelectorTab", sortMode === item.key && "active")}
                      onClick={() => setSortMode(item.key)}
                      type="button"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {!pairSearch && favoritePairs.length > 0 && (
                <div className="tpSelectorSection">
                  <div className="tpSelectorSectionTitle">Favorites</div>
                  <div className="tpSelectorMiniList">
                    {favoritePairs.slice(0, 6).map((p) => renderSelectorItem(p, true))}
                  </div>
                </div>
              )}

              {!pairSearch && topVolumePairs.length > 0 && (
                <div className="tpSelectorSection">
                  <div className="tpSelectorSectionTitle">Top Volume Coins</div>
                  <div className="tpSelectorMiniList">
                    {topVolumePairs.slice(0, 6).map((p) => renderSelectorItem(p, true))}
                  </div>
                </div>
              )}

              {!pairSearch && trendingPairs.length > 0 && (
                <div className="tpSelectorSection">
                  <div className="tpSelectorSectionTitle">Trending</div>
                  <div className="tpSelectorMiniList">
                    {trendingPairs.map((p) => renderSelectorItem(p, true))}
                  </div>
                </div>
              )}

              <div className="tpSelectorSection">
                <div className="tpSelectorSectionTitle">
                  {pairSearch ? "Search Results" : "All Coins"}
                </div>

                <div className="tpPairSelectorList">
                  {filteredPairs.length ? (
                    filteredPairs.map((p) => renderSelectorItem(p))
                  ) : (
                    <div className="tpEmptyTrades">No coin pair found.</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="tpIndicatorsBar">
          {INDICATORS.map((ind) => (
            <button
              key={ind.key}
              className={cls("tpIndicatorBtn", indicators[ind.key] && "active")}
              onClick={() => toggleIndicator(ind.key)}
            >
              {ind.label}
            </button>
          ))}
        </div>

        <div className="tpChartPanel">
          {candles.length > 0 ? (
            <CandleChart
              candles={candles}
              price={price}
              pairLabel={pair.label}
              payout={pair.payout}
              indicators={indicators}
              openTrades={trades.filter((t) => t.symbol === pair.symbol && t.status === "open")}
              onToggleIndicator={toggleIndicator}
            />
          ) : (
            <div className="tpLoadingBox">{isLoading ? "Loading market data..." : "No chart data"}</div>
          )}
        </div>

        <TradeHistoryPanel
          history={history}
          selectedId={selectedHistoryId}
          setSelectedId={setSelectedHistoryId}
          clearHistory={clearHistory}
          onOpenReport={openReport}
        />
      </>
    );
  }

  return (
    <div className="tpPage">
      <SideMenu
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <div className="tpBody">
        <header className="tpHeader">
          <div className="tpHeaderLeft">
            <button className="tpMobileMenu" onClick={() => setMobileOpen(true)}>
              <Icon name="menu" />
            </button>

            <div className="tpLogoBlock">
              <div className="tpLogo">◫</div>
              <div className="tpBrand">
                <strong>TRADING PRO</strong>
                <span>WEB TRADING PLATFORM</span>
              </div>
            </div>
          </div>

          <div className="tpHeaderRight">
            <button className="tpBell">
              <Icon name="bell" />
              <span className="tpBellDot">1</span>
            </button>

            <div className="tpBalanceCard">
              <small>LIVE ACCOUNT</small>
              <strong>${nfmt(balance, 2)}</strong>
            </div>

            <button className="tpDepositBtn">+ Deposit</button>
            <button className="tpWithdrawBtn">Withdrawal</button>
          </div>
        </header>

        <div className="tpContent">
          <section className="tpMainArea">{renderMainContent()}</section>

          <aside className="tpRightPanel">
            <div className="tpOrderHeader">
              <div className="tpOrderPair">
                {renderCoinLogo(pair.baseAsset)}
                <strong>{pair.label}</strong>
                <span>{pair.payout}%</span>
              </div>

              <label className="tpSwitch">
                <input
                  type="checkbox"
                  checked={pendingTradeEnabled}
                  onChange={(e) => setPendingTradeEnabled(e.target.checked)}
                />
                <span className="tpSlider" />
              </label>
            </div>

            <div className="tpPendingText">PENDING TRADE</div>

            <div className="tpInputBox">
              <label>Time</label>
              <div className="tpInputControl">
                <button onClick={() => setTradeSeconds((v) => Math.max(5, v - 5))}>
                  <Icon name="minus" />
                </button>
                <div>{formatCountdown(tradeSeconds)}</div>
                <button onClick={() => setTradeSeconds((v) => Math.min(3600, v + 5))}>
                  <Icon name="plus" />
                </button>
              </div>
              <button className="tpSwitchLink">SWITCH TIME</button>
            </div>

            <div className="tpInputBox tpInputBoxInvestment">
              <label>Investment</label>
              <div className="tpInputControl tpInputControlInvestment">
                <button onClick={() => setInvestment((v) => Math.max(1, Number(v || 0) - 1))} type="button">
                  <Icon name="minus" />
                </button>

                <div className="tpInvestmentField">
                  <span className="tpInvestmentPrefix">$</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    inputMode="numeric"
                    className="tpInvestmentInput"
                    value={investment}
                    onChange={(e) => {
                      const next = e.target.value;
                      if (next === "") {
                        setInvestment("");
                        return;
                      }
                      const num = Number(next);
                      if (!Number.isNaN(num) && num >= 0) {
                        setInvestment(next);
                      }
                    }}
                    onBlur={() => {
                      const normalized = Math.max(1, Number(investment || 1));
                      setInvestment(normalized);
                    }}
                  />
                </div>

                <button onClick={() => setInvestment((v) => Math.min(9999, Number(v || 0) + 1))} type="button">
                  <Icon name="plus" />
                </button>
              </div>
              <button className="tpSwitchLink">SWITCH</button>
            </div>

            <button className="tpBtnUp tpDesktopTradeBtn" onClick={() => placeTrade("up")}>
              <span>Buy</span>
              <Icon name="up" />
            </button>

            <div className="tpPayout tpDesktopPayout">Your payout: {nfmt(payoutAmount, 2)} $</div>

            <button className="tpBtnDown tpDesktopTradeBtn" onClick={() => placeTrade("down")}>
              <span>Sell</span>
              <Icon name="down" />
            </button>

            <div className="tpTradesCard">
              <div className="tpTradesHead">
                <div className="tpTradesTitle">
                  <strong>Open Trades</strong>
                  <span className="tpCounter">{liveTrades.length}</span>
                </div>

                <div className="tpTradesMeta">
                  <Icon name="clock" />
                  <span className="tpCounter dark">
                    {liveTrades.filter((t) => t.status === "open").length}
                  </span>
                </div>
              </div>

              <div className="tpTradesList">
                {!liveTrades.length ? (
                  <div className="tpEmptyTrades">No live trades right now.</div>
                ) : (
                  liveTrades.map((t) => (
                    <div key={t.id} className="tpTradeItem">
                      <div className="tpTradeItemTop">
                        <strong>{t.pair}</strong>
                        <span>
                          {t.status === "open"
                            ? formatCountdown(t.remainingMs / 1000)
                            : t.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="tpTradeItemBottom">
                        <div className={cls("tpTradeSide", t.side === "up" ? "up" : "down")}>
                          {t.side === "up" ? "↑" : "↓"} {t.amount} $
                        </div>

                        <div className="tpTradePnl neutral">LIVE</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="tpQuickStats">
              <div className="tpQuickStat">
                <Icon name="wallet" />
                <div>
                  <span>Balance</span>
                  <strong>${nfmt(balance, 2)}</strong>
                </div>
              </div>
              <div className="tpQuickStat">
                <Icon name="history" />
                <div>
                  <span>History</span>
                  <strong>{history.length} records</strong>
                </div>
              </div>
            </div>
          </aside>

          <div className="tpMobileTradeBar">
            <div className="tpMobileTradeRow">
              <button className="tpBtnUp tpBtnHalf" onClick={() => placeTrade("up")} type="button">
                <span>Buy</span>
                <Icon name="up" />
              </button>

              <button className="tpBtnDown tpBtnHalf" onClick={() => placeTrade("down")} type="button">
                <span>Sell</span>
                <Icon name="down" />
              </button>
            </div>

            <div className="tpMobileTradeBottom">
              <div className="tpMobilePayout">Payout: {nfmt(payoutAmount, 2)} $</div>
              <button className="tpMobileTradeToggle" type="button">
                Trade Panel
              </button>
            </div>
          </div>
        </div>
      </div>

      <ReportModal
        open={reportOpen}
        title={reportTitle}
        type={reportType}
        data={reportData}
        onClose={() => setReportOpen(false)}
      />
    </div>
  );
}