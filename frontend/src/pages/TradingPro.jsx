// TradingPro.jsx
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import "./TradingPro.css";

const API = "https://data-api.binance.vision";

/* ---------------- helpers ---------------- */
function nfmt(n, d = 2) {
  const num = Number(n || 0);
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: d,
    minimumFractionDigits: d,
  }).format(num);
}
function compact(n) {
  const num = Number(n || 0);
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(num);
}
function cls(...a) {
  return a.filter(Boolean).join(" ");
}
async function jget(url, signal) {
  const r = await fetch(url, { signal });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

/** Smooth number animation */
function useAnimatedNumber(value, duration = 380) {
  const [v, setV] = useState(value);
  const rafRef = useRef(0);
  const fromRef = useRef(value);

  useEffect(() => {
    const from = Number(fromRef.current || 0);
    const to = Number(value || 0);
    if (!isFinite(to)) return;

    const start = performance.now();
    cancelAnimationFrame(rafRef.current);

    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      const e = 1 - Math.pow(1 - t, 3); // easeOutCubic
      const cur = from + (to - from) * e;
      setV(cur);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else fromRef.current = to;
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration]);

  return v;
}

/* ---------------- Candlestick canvas ---------------- */

function fmtTime(ms) {
  try {
    const d = new Date(ms);
    return d.toLocaleString([], { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

/**
 * candles: [{t, o, h, l, c}]
 * onHover: (candle|null) => void
 */
function CandleCanvas({ candles = [], livePrice = 0, isUp = true, onHover }) {
  const ref = useRef(null);
  const [hoverIdx, setHoverIdx] = useState(null);

  const draw = useCallback(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    const dpr = window.devicePixelRatio || 1;

    const w = c.clientWidth;
    const h = c.clientHeight;

    c.width = Math.floor(w * dpr);
    c.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    // background
    ctx.fillStyle = "rgba(0,0,0,0)";
    ctx.fillRect(0, 0, w, h);

    if (!candles.length) {
      ctx.fillStyle = "rgba(231,238,249,.65)";
      ctx.font = "600 13px ui-sans-serif,system-ui";
      ctx.fillText("Loading chart…", 18, 28);
      return;
    }

    const padL = 46;
    const padR = 16;
    const padT = 16;
    const padB = 28;

    const innerW = Math.max(10, w - padL - padR);
    const innerH = Math.max(10, h - padT - padB);

    const lows = candles.map((x) => x.l);
    const highs = candles.map((x) => x.h);
    const min = Math.min(...lows);
    const max = Math.max(...highs);
    const span = max - min || 1;

    const yOf = (price) => padT + ((max - price) / span) * innerH;

    // grid lines
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const yy = padT + (i * innerH) / 5;
      ctx.beginPath();
      ctx.moveTo(padL, yy);
      ctx.lineTo(w - padR, yy);
      ctx.stroke();
    }
    for (let i = 0; i <= 6; i++) {
      const xx = padL + (i * innerW) / 6;
      ctx.beginPath();
      ctx.moveTo(xx, padT);
      ctx.lineTo(xx, h - padB);
      ctx.stroke();
    }

    // Y labels (max/mid/min)
    ctx.fillStyle = "rgba(231,238,249,.55)";
    ctx.font = "700 11px ui-sans-serif,system-ui";
    const mid = (min + max) / 2;
    ctx.fillText(String(nfmt(max, 2)), 10, padT + 10);
    ctx.fillText(String(nfmt(mid, 2)), 10, yOf(mid) + 4);
    ctx.fillText(String(nfmt(min, 2)), 10, h - padB);

    const N = candles.length;
    const step = innerW / N;
    const bodyW = Math.max(4, Math.min(10, step * 0.62));

    // draw candles
    for (let i = 0; i < N; i++) {
      const x = padL + i * step + step * 0.5;
      const cd = candles[i];

      const yH = yOf(cd.h);
      const yL = yOf(cd.l);
      const yO = yOf(cd.o);
      const yC = yOf(cd.c);

      const up = cd.c >= cd.o;
      const color = up ? "rgba(0,231,156,0.98)" : "rgba(255,77,79,0.98)";
      const soft = up ? "rgba(0,231,156,0.16)" : "rgba(255,77,79,0.16)";

      // wick
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x, yH);
      ctx.lineTo(x, yL);
      ctx.stroke();

      // body
      const top = Math.min(yO, yC);
      const bot = Math.max(yO, yC);
      const bh = Math.max(2.5, bot - top);

      ctx.fillStyle = soft;
      ctx.fillRect(x - bodyW / 2, top, bodyW, bh);

      ctx.strokeStyle = color;
      ctx.lineWidth = 1.2;
      ctx.strokeRect(x - bodyW / 2, top, bodyW, bh);
    }

    // current live price line
    if (livePrice) {
      const yy = yOf(livePrice);
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = isUp ? "rgba(0,231,156,0.42)" : "rgba(255,77,79,0.42)";
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(padL, yy);
      ctx.lineTo(w - padR, yy);
      ctx.stroke();
      ctx.setLineDash([]);

      // price tag
      const tag = nfmt(livePrice, 4);
      ctx.fillStyle = isUp ? "rgba(0,231,156,0.16)" : "rgba(255,77,79,0.16)";
      ctx.strokeStyle = isUp ? "rgba(0,231,156,0.30)" : "rgba(255,77,79,0.30)";
      ctx.lineWidth = 1;
      const tw = ctx.measureText(tag).width + 14;
      const tx = w - padR - tw;
      const ty = Math.max(padT + 6, Math.min(h - padB - 18, yy - 10));
      ctx.beginPath();
      ctx.roundRect(tx, ty, tw, 18, 9);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "rgba(231,238,249,.92)";
      ctx.fillText(tag, tx + 7, ty + 13);
    }

    // hover crosshair
    if (hoverIdx != null && candles[hoverIdx]) {
      const x = padL + hoverIdx * step + step * 0.5;
      const cd = candles[hoverIdx];

      ctx.strokeStyle = "rgba(255,255,255,0.25)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, padT);
      ctx.lineTo(x, h - padB);
      ctx.stroke();

      const yy = yOf(cd.c);
      ctx.beginPath();
      ctx.moveTo(padL, yy);
      ctx.lineTo(w - padR, yy);
      ctx.stroke();

      // dot
      ctx.fillStyle = "rgba(231,238,249,0.95)";
      ctx.beginPath();
      ctx.arc(x, yy, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // tooltip
      const lines = [
        fmtTime(cd.t),
        `O ${nfmt(cd.o, 4)}  H ${nfmt(cd.h, 4)}`,
        `L ${nfmt(cd.l, 4)}  C ${nfmt(cd.c, 4)}`,
      ];
      ctx.font = "800 11px ui-sans-serif,system-ui";
      const maxW = Math.max(...lines.map((s) => ctx.measureText(s).width));
      const bw = maxW + 16;
      const bh = 50;

      let bx = x + 12;
      if (bx + bw > w - padR) bx = x - 12 - bw;
      let by = padT + 10;
      if (by + bh > h - padB) by = h - padB - bh - 8;

      ctx.fillStyle = "rgba(12,18,26,0.92)";
      ctx.strokeStyle = "rgba(255,255,255,0.10)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(bx, by, bw, bh, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "rgba(231,238,249,.92)";
      ctx.fillText(lines[0], bx + 8, by + 16);
      ctx.fillStyle = "rgba(231,238,249,.78)";
      ctx.fillText(lines[1], bx + 8, by + 32);
      ctx.fillText(lines[2], bx + 8, by + 46);
    }
  }, [candles, livePrice, isUp, hoverIdx]);

  useEffect(() => {
    draw();
    const onResize = () => draw();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [draw]);

  useEffect(() => {
    if (typeof onHover !== "function") return;
    if (hoverIdx == null) onHover(null);
    else onHover(candles[hoverIdx] || null);
  }, [hoverIdx, candles, onHover]);

  return (
    <canvas
      className="tpCanvas"
      ref={ref}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;

        const padL = 46;
        const padR = 16;
        const innerW = Math.max(10, rect.width - padL - padR);

        const rx = Math.max(0, Math.min(innerW, x - padL));
        const idx = Math.floor((rx / innerW) * candles.length);
        const clamped = Math.max(0, Math.min(candles.length - 1, idx));
        setHoverIdx(clamped);
      }}
      onMouseLeave={() => setHoverIdx(null)}
      onTouchMove={(e) => {
        const t = e.touches?.[0];
        if (!t) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = t.clientX - rect.left;

        const padL = 46;
        const padR = 16;
        const innerW = Math.max(10, rect.width - padL - padR);

        const rx = Math.max(0, Math.min(innerW, x - padL));
        const idx = Math.floor((rx / innerW) * candles.length);
        const clamped = Math.max(0, Math.min(candles.length - 1, idx));
        setHoverIdx(clamped);
      }}
      onTouchEnd={() => setHoverIdx(null)}
    />
  );
}

/* ---------------- main component ---------------- */

function tfToInterval(tf) {
  return tf; // 15m, 1h, 4h, 1d
}

export default function TradingPro() {
  const USER = { balance: 97280.12, currency: "USDT" };

  const [drawer, setDrawer] = useState(false);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

  // Market list
  const [coins, setCoins] = useState([]);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState("ETHUSDT");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Chart / price
  const [tf, setTf] = useState("15m");
  const [tickerMap, setTickerMap] = useState({});
  const [candles, setCandles] = useState([]); // [{t,o,h,l,c}]
  const wsRef = useRef(null);

  // hover candle info
  const [hoverCandle, setHoverCandle] = useState(null);

  // ✅ price blink
  const [blink, setBlink] = useState(""); // "up" | "down" | ""
  const prevLastRef = useRef(null);

  // ✅ best bid/ask + spread (depth meter)
  const [bookTop, setBookTop] = useState({ bid: 0, ask: 0 });

  // ✅ order book ladder
  const [ob, setOb] = useState({ bids: [], asks: [] }); // arrays of [price, qty]

  // Trade
  const [side, setSide] = useState("buy"); // buy | sell
  const [orderType, setOrderType] = useState("market"); // market | limit
  const [amount, setAmount] = useState(""); // USDT amount
  const [limitPrice, setLimitPrice] = useState("");
  const [leverage, setLeverage] = useState(5);

  // Activity
  const [tab, setTab] = useState("open");
  const [openOrders, setOpenOrders] = useState([
    { id: "OD-1102", sym: "ETHUSDT", side: "buy", type: "limit", price: 3620.5, amount: 150, status: "Open" },
  ]);
  const [history, setHistory] = useState([
    { id: "TR-2003", sym: "BTCUSDT", side: "sell", type: "market", price: 61234.1, amount: 200, status: "Filled" },
  ]);

  // ✅ Manual trade time + popup simulation
  const [tradeTime, setTradeTime] = useState(60); // 30/60/90/120
  const [timeMenu, setTimeMenu] = useState(false);

  const [tradePop, setTradePop] = useState({
    open: false,
    stage: "countdown", // "countdown" | "done"
    left: 0,
    amount: 0,
    profit: 0,
    sym: "",
  });

  function goDashboard() {
    window.location.assign("/TradingDashboardGoldMiracle");
  }

  // ✅ countdown logic
  useEffect(() => {
    if (!tradePop.open || tradePop.stage !== "countdown") return;

    const t = setInterval(() => {
      setTradePop((p) => {
        const next = Math.max(0, (p.left || 0) - 1);
        if (next === 0) {
          const profit = Number(p.amount || 0) * 0.2; // 20% profit
          return { ...p, left: 0, stage: "done", profit };
        }
        return { ...p, left: next };
      });
    }, 1000);

    return () => clearInterval(t);
  }, [tradePop.open, tradePop.stage]);

  // Load tickers (top volume)
  useEffect(() => {
    const ac = new AbortController();
    let tmr = null;

    async function loadTickers() {
      try {
        setErr("");
        setLoading(true);

        const all = await jget(`${API}/api/v3/ticker/24hr`, ac.signal);

                const usdt = all
          .filter((t) => t.symbol.endsWith("USDT") && !t.symbol.includes("UPUSDT") && !t.symbol.includes("DOWNUSDT"))
          .map((t) => ({
            symbol: t.symbol,
            last: Number(t.lastPrice),
            chg: Number(t.priceChangePercent),
            high: Number(t.highPrice),
            low: Number(t.lowPrice),
            vol: Number(t.quoteVolume),
            changeAbs: Number(t.priceChange),
          }))
          .sort((a, b) => b.vol - a.vol); // ✅ keep sorted, but show ALL (no slice)

        // ✅ Insert XAUUSD as 3rd item
        const xau = {
          symbol: "XAUUSD",
          last: 0,
          chg: 0,
          high: 0,
          low: 0,
          vol: 0,
          changeAbs: 0,
        };

        usdt.splice(2, 0, xau);

        setCoins(usdt);

        const map = {};
        usdt.forEach((x) => (map[x.symbol] = x));
        setTickerMap(map);

        if (!map[selected] && usdt[0]?.symbol) setSelected(usdt[0].symbol);
      } catch {
        setErr("Market data failed to load. Please check your internet.");
      } finally {
        setLoading(false);
      }
    }

    loadTickers();
    tmr = setInterval(loadTickers, 12000);

    return () => {
      ac.abort();
      if (tmr) clearInterval(tmr);
    };
  }, [selected]);

  const selectedTicker = tickerMap[selected];
  const last = selectedTicker?.last || 0;
  const chgUp = (selectedTicker?.chg ?? 0) >= 0;
  const priceDecimals = last >= 1000 ? 2 : 4;

  // ✅ smooth number (animated last price)
  const animatedLast = useAnimatedNumber(last, 420);

  // ✅ blink when price changes
  useEffect(() => {
    const prev = prevLastRef.current;
    if (prev == null) {
      prevLastRef.current = last;
      return;
    }
    if (last !== prev && last > 0) {
      const dir = last > prev ? "up" : "down";
      setBlink(dir);
      const t = setTimeout(() => setBlink(""), 320);
      prevLastRef.current = last;
      return () => clearTimeout(t);
    }
    prevLastRef.current = last;
  }, [last]);

  /* ---------------- Candles: REST initial + WebSocket live ---------------- */

  useEffect(() => {
    const ac = new AbortController();

    async function loadInitialCandles() {
      try {
        const interval = tfToInterval(tf);
        const k = await jget(`${API}/api/v3/klines?symbol=${selected}&interval=${interval}&limit=120`, ac.signal);

        const cs = (k || []).map((r) => ({
          t: Number(r[0]),
          o: Number(r[1]),
          h: Number(r[2]),
          l: Number(r[3]),
          c: Number(r[4]),
          x: Boolean(r[6]),
        }));

        setCandles(cs);

        const lastClose = cs[cs.length - 1]?.c;
        if (lastClose) setLimitPrice(String(lastClose));
      } catch {
        setCandles([]);
      }
    }

        if (selected && selected !== "XAUUSD") loadInitialCandles();
    return () => ac.abort();
  }, [selected, tf]);

  useEffect(() => {
       if (!selected || selected === "XAUUSD") return;

    const interval = tfToInterval(tf);
    const stream = `${selected.toLowerCase()}@kline_${interval}`;
    const url = `wss://stream.binance.com:9443/ws/${stream}`;

    try {
      if (wsRef.current) wsRef.current.close();
    } catch {}

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        const k = msg?.k;
        if (!k) return;

        const candle = {
          t: Number(k.t),
          o: Number(k.o),
          h: Number(k.h),
          l: Number(k.l),
          c: Number(k.c),
          x: Boolean(k.x),
        };

        setLimitPrice((p) => (orderType === "limit" ? p : String(candle.c)));

        setCandles((prev) => {
          if (!prev || prev.length === 0) return [candle];

          const lastT = prev[prev.length - 1]?.t;

          if (lastT === candle.t) {
            const copy = prev.slice();
            copy[copy.length - 1] = candle;
            return copy;
          }

          const next = [...prev, candle];
          return next.slice(-120);
        });
      } catch {}
    };

    return () => {
      try {
        ws.close();
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, tf]);

  /* ---------------- Order book polling (light) ---------------- */
  useEffect(() => {
    const ac = new AbortController();
    let tmr = null;

    async function loadBook() {
      try {
        const bt = await jget(`${API}/api/v3/ticker/bookTicker?symbol=${selected}`, ac.signal);
        setBookTop({ bid: Number(bt.bidPrice), ask: Number(bt.askPrice) });

        const d = await jget(`${API}/api/v3/depth?symbol=${selected}&limit=20`, ac.signal);
        setOb({
          bids: (d.bids || []).slice(0, 12).map((x) => [Number(x[0]), Number(x[1])]),
          asks: (d.asks || []).slice(0, 12).map((x) => [Number(x[0]), Number(x[1])]),
        });
      } catch {}
    }

        if (selected && selected !== "XAUUSD") loadBook();
    tmr = setInterval(loadBook, 1600);

    return () => {
      ac.abort();
      if (tmr) clearInterval(tmr);
    };
  }, [selected]);

  const filteredCoins = useMemo(() => {
    const qq = q.trim().toUpperCase();
    if (!qq) return coins;
    return coins.filter((c) => c.symbol.includes(qq));
  }, [coins, q]);

  // ✅ manual trade coin list (separate search inside trade panel)
  const [tradeQ, setTradeQ] = useState("");
  const tradeCoins = useMemo(() => {
    const qq = tradeQ.trim().toUpperCase();
    if (!qq) return coins;
    return coins.filter((c) => c.symbol.includes(qq));
  }, [coins, tradeQ]);

  // depth meter calc
  const depthInfo = useMemo(() => {
    const bid = Number(bookTop.bid || 0);
    const ask = Number(bookTop.ask || 0);
    const mid = bid && ask ? (bid + ask) / 2 : 0;
    const spread = bid && ask ? ask - bid : 0;
    const spreadPct = mid ? (spread / mid) * 100 : 0;

    const bidQty = ob.bids.reduce((s, x) => s + (x[1] || 0), 0);
    const askQty = ob.asks.reduce((s, x) => s + (x[1] || 0), 0);
    const total = bidQty + askQty || 1;
    const bidPct = (bidQty / total) * 100;
    const askPct = 100 - bidPct;

    return { bid, ask, mid, spread, spreadPct, bidPct, askPct };
  }, [bookTop, ob]);

  /* ===========================
     ✅ Amount is USDT (not coin)
  =========================== */
  const notionalUSDT = useMemo(() => {
    const usdt = Number(amount || 0);
    return usdt > 0 ? usdt : 0;
  }, [amount]);

  const qty = useMemo(() => {
    const px = orderType === "market" ? last : Number(limitPrice || 0);
    if (!px) return 0;
    return notionalUSDT / px;
  }, [notionalUSDT, orderType, last, limitPrice]);

  const fee = notionalUSDT * 0.001;
  const total = side === "buy" ? notionalUSDT + fee : Math.max(notionalUSDT - fee, 0);

  const canSubmit = useMemo(() => {
    const usdt = Number(amount || 0);
    if (!usdt || usdt <= 0) return false;
    if (orderType === "limit") {
      const p = Number(limitPrice || 0);
      if (!p || p <= 0) return false;
    }
    if (side === "buy") return total <= USER.balance;
    return true;
  }, [amount, orderType, limitPrice, side, total, USER.balance]);

  function placeOrder() {
    if (!canSubmit) return;
    const amt = Number(amount || 0);
    const px = orderType === "market" ? last : Number(limitPrice);

    if (orderType === "market") {
      setHistory((h) => [
        {
          id: `TR-${Math.floor(2000 + Math.random() * 8000)}`,
          sym: selected,
          side,
          type: orderType,
          price: px,
          amount: Number(amount),
          status: "Filled",
        },
        ...h,
      ]);
    } else {
      setOpenOrders((o) => [
        {
          id: `OD-${Math.floor(1000 + Math.random() * 9000)}`,
          sym: selected,
          side,
          type: orderType,
          price: px,
          amount: Number(amount),
          status: "Open",
        },
        ...o,
      ]);
    }

    // ✅ Start popup timer
    setTradePop({
      open: true,
      stage: "countdown",
      left: tradeTime,
      amount: amt,
      profit: 0,
      sym: selected,
    });

    setAmount("");
  }

  function cancelOrder(id) {
    setOpenOrders((o) => o.filter((x) => x.id !== id));
  }

  const obMaxQty = useMemo(() => {
    const all = [...ob.bids, ...ob.asks].map((x) => x[1] || 0);
    return Math.max(1, ...all);
  }, [ob]);

  /* ---------------- Manual Trade renderer (used twice) ---------------- */
  const ManualTrade = (
    <div className="tpPanel tpOrderPanel tpOrderPanel--light">
      <div className="tpPanelHead">
        <div className="tpPanelTitle">Manual Trade</div>

        <div className="tpModePills">
          <button className={cls("tpMode", orderType === "market" && "active")} onClick={() => setOrderType("market")} type="button">
            Market
          </button>
          <button className={cls("tpMode", orderType === "limit" && "active")} onClick={() => setOrderType("limit")} type="button">
            Limit
          </button>
        </div>
      </div>

      {/* Coin selector inside Manual Trade */}
      <div className="tpCoinPick">
        <div className="tpCoinPickTop">
          <div className="tpCoinPickLabel">Coin</div>
          <div className="tpCoinPickNow">
            <b>{selected.replace("USDT", "")}</b> <span>/{USER.currency}</span>
          </div>
        </div>

        <div className="tpCoinPickRow">
          <input
            className="tpCoinPickSearch"
            value={tradeQ}
            onChange={(e) => setTradeQ(e.target.value)}
            placeholder="Search (BTC, ETH...)"
          />

          <select
            className="tpCoinPickSelect"
            value={selected}
            onChange={(e) => {
              setSelected(e.target.value);
              setTradeQ("");
            }}
          >
            {(tradeCoins.length ? tradeCoins : coins).map((c) => (
              <option key={c.symbol} value={c.symbol}>
                {c.symbol.replace("USDT", "")}/{USER.currency}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Buy then Sell */}
      <div className="tpSideBtns">
        <button className={cls("tpSideBtn", side === "buy" && "active long")} onClick={() => setSide("buy")} type="button">
          Buy / Long
        </button>
        <button className={cls("tpSideBtn", side === "sell" && "active short")} onClick={() => setSide("sell")} type="button">
          Sell / Short
        </button>
      </div>

      <div className="tpField">
        <div className="tpFieldLabel">Leverage</div>
        <div className="tpLevRow">
          <button className="tpLevBtn" onClick={() => setLeverage((v) => Math.max(1, v - 1))} type="button">
            -
          </button>
          <div className="tpLevVal">{leverage}x</div>
          <button className="tpLevBtn" onClick={() => setLeverage((v) => Math.min(50, v + 1))} type="button">
            +
          </button>
        </div>
        <input className="tpRange" type="range" min="1" max="50" value={leverage} onChange={(e) => setLeverage(Number(e.target.value))} />
      </div>

      {orderType === "limit" ? (
        <div className="tpField">
          <div className="tpFieldLabel">Limit Price (USDT)</div>
          <input className="tpInput" value={limitPrice} onChange={(e) => setLimitPrice(e.target.value)} inputMode="decimal" />
        </div>
      ) : (
        <div className="tpInfo">
          Current Price: <b>{selectedTicker ? nfmt(last, priceDecimals) : "—"} USDT</b>
        </div>
      )}

      <div className="tpField">
        <div className="tpFieldLabel">Amount (USDT)</div>
        <input className="tpInput" value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="0.00 USDT" />
      </div>

      <div className="tpInfo">
        Est. Qty: <b>{qty ? nfmt(qty, 6) : "—"} {selected.replace("USDT", "")}</b>
      </div>

      <div className="tpSummary">
        <div className="r">
          <span>Value</span>
          <b>{nfmt(notionalUSDT, 2)} USDT</b>
        </div>
        <div className="r">
          <span>Fee</span>
          <b>{nfmt(fee, 2)} USDT</b>
        </div>
        <div className="r total">
          <span>{side === "buy" ? "Total Cost" : "Est. Receive"}</span>
          <b>{nfmt(total, 2)} USDT</b>
        </div>
      </div>

            {/* Trade Time (popup modal) */}
      <div className="tpTimeRow">
        <div className="tpTimeLeft">
          <div className="tpTimeLabel">Trade Time</div>
          <div className="tpTimeVal">{tradeTime} sec</div>
        </div>

        <div className="tpTimeRight">
          <button
            className="tpTimeBtn"
            onClick={() => setTimeMenu(true)}
            type="button"
          >
            Set Time
          </button>
        </div>
      </div>

      {/* ✅ Time Picker Popup */}
      {timeMenu ? (
        <div
          className="tpTimePopWrap"
          onClick={() => setTimeMenu(false)}
          role="presentation"
        >
          <div
            className="tpTimePop"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Set Trade Time"
          >
            <div className="tpTimePopTop">
              <div className="tpTimePopTitle">Set Trade Time</div>
              <button
                className="tpTimePopClose"
                onClick={() => setTimeMenu(false)}
                type="button"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="tpTimePopBody">
              {[30, 60, 90, 120].map((s) => (
                <button
                  key={s}
                  className={cls("tpTimePopOpt", tradeTime === s && "active")}
                  onClick={() => {
                    setTradeTime(s);
                    setTimeMenu(false);
                  }}
                  type="button"
                >
                  {s} sec
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <button
        className={cls("tpSubmit", side === "sell" ? "short" : "long", !canSubmit && "disabled")}
        disabled={!canSubmit}
        onClick={placeOrder}
        type="button"
      >
        Place Order
      </button>

      {!canSubmit ? <div className="tpWarn">Enter a valid amount{orderType === "limit" ? " and limit price" : ""}. Buy requires enough balance.</div> : null}
      
      <div className="tpFine">Use the + / − buttons or slider to adjust leverage (e.g., 5x).
Higher leverage increases potential profit but also increases risk. Choose your preferred Trade Time (e.g., 60 seconds).
The position will automatically close when the selected duration ends. </div>
    </div>
  );

  return (
    <div className="tpPage">
      <header className="tpTop">
        <button className="tpBackBtn" type="button" onClick={() => navigate(-1)} aria-label="Go back" title="Back to previous page">
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span>Back</span>
        </button>

        {/* <button className="tpBurger" onClick={() => setDrawer(true)} aria-label="Open markets">
          <span />
          <span />
          <span />
        </button> */}

        <div className="tpBrand">
          <div className="tpMark" />
          <div className="tpBrandText">
            <div className="tpName">GoldMiracle</div>
            <div className="tpHint">Professional Trading</div>
          </div>
        </div>

        <div className="tpTopRight">
          <button className="tpDashBtn" onClick={goDashboard} type="button">
            My Dashboard
          </button>

          <div className="tpWallet">
            <div className="tpWL">Balance</div>
            <div className="tpWV">
              {nfmt(USER.balance, 2)} <span>{USER.currency}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="tpShell">
        <aside className={cls("tpSide", drawer && "open")}>
          <div className="tpSideTop">
            <div className="tpSideTitle">Markets</div>
            <button className="tpClose" onClick={() => setDrawer(false)} aria-label="Close" type="button">
              ✕
            </button>
          </div>

          <div className="tpSearch">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search coin (BTC, ETH…)" />
          </div>

          <div className="tpSideMeta">
            {loading ? <span className="tpPill">Updating…</span> : <span className="tpPill ok">Live</span>}
            {err ? <span className="tpPill warn">Issue</span> : null}
          </div>

          <div className="tpCoinList">
            {filteredCoins.map((c) => (
              <button
                key={c.symbol}
                className={cls("tpCoin", selected === c.symbol && "active")}
                onClick={() => {
                  setSelected(c.symbol);
                  setDrawer(false);
                }}
                type="button"
              >
                <div className="tpCoinL">
                  <div className="tpCoinSym">{c.symbol.replace("USDT", "")}</div>
                  <div className="tpCoinSub">/{USER.currency}</div>
                </div>

                <div className="tpCoinM">
                  <div className="tpCoinPrice">{nfmt(c.last, c.last >= 1000 ? 2 : 4)}</div>
                  <div className="tpCoinVol">Vol {compact(c.vol)}</div>
                </div>

                <div className={cls("tpCoinR", c.chg >= 0 ? "up" : "down")}>
                  {c.chg >= 0 ? "+" : ""}
                  {c.chg.toFixed(2)}%
                </div>
              </button>
            ))}
          </div>

          <div className="tpSideFoot">
            <div className="tpNote">Top volume coins are shown by default.</div>
          </div>
        </aside>

        {drawer && <div className="tpBackdrop" onClick={() => setDrawer(false)} />}

        <main className="tpMain">
          <div className="tpMainTop tpMainTop--compact">
            <div className="tpPairBlock">
              <div className="tpPairSym">
                {selected.replace("USDT", "")} / {USER.currency}
              </div>

              <div className={cls("tpPairChg", chgUp ? "up" : "down")}>
                {selectedTicker ? (selectedTicker.chg >= 0 ? "+" : "") + selectedTicker.chg.toFixed(2) + "%" : "—"}
              </div>
            </div>

            <div className="tpPriceBlock">
              <div className="tpPriceLabel">Last Price</div>

              <div className={cls("tpPriceVal", blink && `blink ${blink}`)}>{selectedTicker ? nfmt(animatedLast, priceDecimals) : "—"}</div>

              <div className="tpMiniBA">
                <span>Bid</span>
                <b className="g">{depthInfo.bid ? nfmt(depthInfo.bid, priceDecimals) : "—"}</b>

                <span className="sep" />

                <span>Ask</span>
                <b className="r">{depthInfo.ask ? nfmt(depthInfo.ask, priceDecimals) : "—"}</b>
              </div>
            </div>

            <div className="tpStatGrid">
              <div className="tpStatBox">
                <div className="k">24h High</div>
                <div className="v">{selectedTicker ? nfmt(selectedTicker.high, 2) : "—"}</div>
              </div>

              <div className="tpStatBox">
                <div className="k">24h Low</div>
                <div className="v">{selectedTicker ? nfmt(selectedTicker.low, 2) : "—"}</div>
              </div>

              <div className="tpStatBox">
                <div className="k">24h Change</div>
                <div className={cls("v", chgUp ? "upTxt" : "downTxt")}>
                  {selectedTicker ? (selectedTicker.changeAbs >= 0 ? "+" : "") + nfmt(selectedTicker.changeAbs, priceDecimals) : "—"}
                </div>
              </div>

              <div className="tpStatBox">
                <div className="k">24h Volume</div>
                <div className="v">{selectedTicker ? compact(selectedTicker.vol) : "—"}</div>
              </div>
            </div>
          </div>

          <section className="tpPanel tpChartPanel">
            <div className="tpPanelHead">
              <div className="tpPanelTitle">Price Chart</div>

              <div className="tpTfRow">
                {["15m", "1h", "4h", "1d"].map((x) => (
                  <button key={x} className={cls("tpTf", tf === x && "active")} onClick={() => setTf(x)} type="button">
                    {x.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="tpChartBox tpChartBox--candle">
              <CandleCanvas candles={candles} livePrice={candles[candles.length - 1]?.c || last} isUp={chgUp} onHover={(c) => setHoverCandle(c)} />
            </div>
          </section>

          <div className="tpMobileTrade">{ManualTrade}</div>

          <section className="tpPanel tpOBPanel">
            <div className="tpPanelHead">
              <div className="tpPanelTitle">Order Book</div>

              <div className="tpOBMeta">
                <span className="m">
                  Spread: <b>{depthInfo.spread ? nfmt(depthInfo.spread, priceDecimals) : "—"}</b>
                </span>
                <span className="m">
                  Spread%: <b>{depthInfo.spreadPct ? depthInfo.spreadPct.toFixed(3) + "%" : "—"}</b>
                </span>
              </div>
            </div>

            <div className="tpDepth">
              <div className="tpDepthTop">
                <div className="tpDepthLbl">
                  Depth Meter <span>(Bids vs Asks)</span>
                </div>
                <div className="tpDepthVal">
                  <span className="g">{depthInfo.bidPct.toFixed(0)}%</span>
                  <span className="mut"> / </span>
                  <span className="r">{depthInfo.askPct.toFixed(0)}%</span>
                </div>
              </div>

              <div className="tpDepthBar">
                <div className="tpDepthBid" style={{ width: `${Math.max(0, Math.min(100, depthInfo.bidPct))}%` }} />
                <div className="tpDepthAsk" style={{ width: `${Math.max(0, Math.min(100, depthInfo.askPct))}%` }} />
              </div>

              <div className="tpDepthFoot">
                <div className="g">Bids</div>
                <div className="r">Asks</div>
              </div>
            </div>

            <div className="tpOBGrid">
              <div className="tpOBCol">
                <div className="tpOBHead">
                  <span>Bid</span>
                  <span>Qty</span>
                </div>

                <div className="tpOBList">
                  {ob.bids.map(([p, q], i) => {
                    const w = Math.round((q / obMaxQty) * 100);
                    return (
                      <div className="tpOBRow bid" key={`b${i}`}>
                        <div className="bar" style={{ width: `${w}%` }} />
                        <div className="price">{nfmt(p, priceDecimals)}</div>
                        <div className="qty">{nfmt(q, 4)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="tpOBMid">
                <div className="tpOBMidPrice">
                  <span className="mut">Mark</span>
                  <b className={cls("mk", chgUp ? "g" : "r")}>{selectedTicker ? nfmt(last, priceDecimals) : "—"}</b>
                </div>
              </div>

              <div className="tpOBCol">
                <div className="tpOBHead right">
                  <span>Ask</span>
                  <span>Qty</span>
                </div>

                <div className="tpOBList">
                  {ob.asks.map(([p, q], i) => {
                    const w = Math.round((q / obMaxQty) * 100);
                    return (
                      <div className="tpOBRow ask" key={`a${i}`}>
                        <div className="bar" style={{ width: `${w}%` }} />
                        <div className="price">{nfmt(p, priceDecimals)}</div>
                        <div className="qty">{nfmt(q, 4)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          <section className="tpPanel tpBottomPanel">
            <div className="tpPanelHead">
              <div className="tpTabs">
                <button className={cls("tpTab", tab === "open" && "active")} onClick={() => setTab("open")} type="button">
                  Open Orders
                </button>
                <button className={cls("tpTab", tab === "history" && "active")} onClick={() => setTab("history")} type="button">
                  History
                </button>
              </div>

              <div className="tpSmallHint">Simple view</div>
            </div>

            <div className="tpCards">
              {tab === "open" ? (
                openOrders.length ? (
                  openOrders.map((o) => (
                    <div className="tpCard" key={o.id}>
                      <div className="tpCardRow">
                        <div className="tpCardTitle">{o.sym.replace("USDT", "")}/USDT</div>
                        <div className={cls("tpBadge", o.side)}>{o.side === "buy" ? "BUY" : "SELL"}</div>
                      </div>
                      <div className="tpCardRow">
                        <div className="tpKV">
                          <span>Type</span>
                          <b>{o.type.toUpperCase()}</b>
                        </div>
                        <div className="tpKV">
                          <span>Price</span>
                          <b>{nfmt(o.price, 2)}</b>
                        </div>
                        <div className="tpKV">
                          <span>Amount</span>
                          <b>{nfmt(o.amount, 2)} USDT</b>
                        </div>
                      </div>
                      <div className="tpCardRow">
                        <div className="tpStatus">{o.status}</div>
                        <button className="tpCancel" onClick={() => cancelOrder(o.id)} type="button">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="tpEmpty">No open orders.</div>
                )
              ) : history.length ? (
                history.map((h) => (
                  <div className="tpCard" key={h.id}>
                    <div className="tpCardRow">
                      <div className="tpCardTitle">{h.sym.replace("USDT", "")}/USDT</div>
                      <div className={cls("tpBadge", h.side)}>{h.side === "buy" ? "BUY" : "SELL"}</div>
                    </div>
                    <div className="tpCardRow">
                      <div className="tpKV">
                        <span>Type</span>
                        <b>{h.type.toUpperCase()}</b>
                      </div>
                      <div className="tpKV">
                        <span>Price</span>
                        <b>{nfmt(h.price, 2)}</b>
                      </div>
                      <div className="tpKV">
                        <span>Amount</span>
                        <b>{nfmt(h.amount, 2)} USDT</b>
                      </div>
                    </div>
                    <div className="tpCardRow">
                      <div className="tpStatus ok">{h.status}</div>
                      <div className="tpMuted">{h.id}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="tpEmpty">No history yet.</div>
              )}
            </div>
          </section>
        </main>

        <aside className="tpRight">
          {ManualTrade}
        </aside>
      </div>

      {tradePop.open ? (
        <div className="tpPopWrap" onClick={() => setTradePop((p) => ({ ...p, open: false }))}>
          <div className="tpPop" onClick={(e) => e.stopPropagation()}>
            <div className="tpPopTop">
              <div className="tpPopTitle">Trade Processing</div>
              <button className="tpPopClose" onClick={() => setTradePop((p) => ({ ...p, open: false }))} type="button">
                ✕
              </button>
            </div>

            {tradePop.stage === "countdown" ? (
              <div className="tpPopBody">
                <div className="tpPopK">Time Remaining</div>
                <div className="tpPopTimerWrap">
                  <div className="tpPopTimer">{tradePop.left}s</div>
                </div>
                <div className="tpPopHint">
                  {tradePop.sym.replace("USDT", "")}/USDT • {side === "buy" ? "Long" : "Short"} • {orderType.toUpperCase()}
                </div>
                
                <div className="tpPopDetails">
                  <div className="tpPopDetailRow">
                    <div className="tpPopDetailLabel">Amount</div>
                    <div className="tpPopDetailValue">{nfmt(tradePop.amount, 2)} USDT</div>
                  </div>
                  <div className="tpPopDetailRow">
                    <div className="tpPopDetailLabel">Leverage</div>
                    <div className="tpPopDetailValue">{leverage}x</div>
                  </div>
                  <div className="tpPopDetailRow">
                    <div className="tpPopDetailLabel">Entry Price</div>
                    <div className="tpPopDetailValue">{nfmt(orderType === "market" ? last : Number(limitPrice || 0), priceDecimals)} USDT</div>
                  </div>
                  <div className="tpPopDetailRow">
                    <div className="tpPopDetailLabel">Expected Return</div>
                    <div className="tpPopDetailValue">+{nfmt(tradePop.amount * 0.2, 2)} USDT</div>
                  </div>
                </div>

                <div className="tpPopBar">
                  <div
                    className="tpPopBarFill"
                    style={{
                      width: `${Math.max(0, Math.min(100, (1 - tradePop.left / Math.max(1, tradeTime)) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="tpPopBody">
                <div className="tpPopCongrats">
                  <div className="tpPopCongratsTitle">🎉 Congratulations!</div>
                  <div className="tpPopCongratsMsg">
                    Your trade completed successfully and profit has been added to your balance.
                  </div>
                </div>

                <div className="tpPopSuccess">
                  <div className="tpPopTick" aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </div>

                  <div className="tpPopSuccessText">
                    Trade executed successfully!
                    <div className="tpPopSuccessSmall">
                      Profit: <b>+{nfmt(tradePop.profit, 2)} USDT</b> • Return: <b>20%</b>
                    </div>
                  </div>
                </div>

                <div className="tpPopTradeInfo">
                  <div className="tpPopInfoRow">
                    <span>Pair</span>
                    <b>{tradePop.sym.replace("USDT", "")}/USDT</b>
                  </div>
                  <div className="tpPopInfoRow">
                    <span>Direction</span>
                    <b>{side === "buy" ? "Long" : "Short"}</b>
                  </div>
                  <div className="tpPopInfoRow">
                    <span>Amount</span>
                    <b>{nfmt(tradePop.amount, 2)} USDT</b>
                  </div>
                  <div className="tpPopInfoRow">
                    <span>Leverage</span>
                    <b>{leverage}x</b>
                  </div>
                  <div className="tpPopInfoRow">
                    <span>Entry Price</span>
                    <b>{nfmt(orderType === "market" ? last : Number(limitPrice || 0), priceDecimals)} USDT</b>
                  </div>
                  <div className="tpPopInfoRow highlight">
                    <span>Profit</span>
                    <b className="profit">+{nfmt(tradePop.profit, 2)} USDT</b>
                  </div>
                </div>

                <button className="tpPopDone" onClick={() => setTradePop((p) => ({ ...p, open: false }))} type="button">
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}