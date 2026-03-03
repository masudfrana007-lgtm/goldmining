import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./EorderLanding.css";

export default function EorderLanding() {
  const nav = useNavigate();

  const payment = useMemo(
    () => [
      { label: "VISA", img: "/partners/visa.png" },
      { label: "Mastercard", img: "/partners/mastercard.png" },
      { label: "PayPal", img: "/partners/paypal.svg" },
      { label: "Binance", img: "/partners/binance.png" },
      { label: "USDT", img: "/partners/tether.png" },
      { label: "Stripe", img: "/partners/stripe.png" },
      { label: "Skrill", img: "/partners/skrill.png" },
      { label: "Wise", img: "/partners/wise.png" },
    ],
    []
  );

  const brands = useMemo(
    () => [
      { label: "Amazon", img: "/brands/amazon.png" },
      { label: "eBay", img: "/brands/ebay.png" },
      { label: "Shopify", img: "/brands/shopify.png" },
      { label: "TikTok", img: "/brands/tiktok.png" },
      { label: "Alibaba", img: "/brands/alibaba.png" },
      { label: "YouTube", img: "/brands/youtube.png" },
      { label: "Shopee", img: "/brands/shopee.png" },
      { label: "Lazada", img: "/brands/lazada.png" },
    ],
    []
  );

  return (
    <div className="eoLanding">
      <div className="eoVignette" aria-hidden="true" />
      <div className="eoParticles" aria-hidden="true" />

      {/* ✅ Positioning wrapper (centers everything properly) */}
      <div className="eoStage">
        <main className="eoWrap">
          <header className="eoHeader">
            <div className="eoLogoRow">
              <div className="eoMark" aria-hidden="true">
                <span className="eoMarkInner">e</span>
              </div>
              <div className="eoBrand">
                eorder<span>.io</span>
              </div>
            </div>

            <h1 className="eoTitle">
              Welcome to <span>eorder.io</span>
            </h1>
            <p className="eoSub">Complete Tasks. Earn. Withdraw.</p>

<div className="eoCtas">
  <button
    className="eoBtn eoBtnGold"
    onClick={() => window.location.href = "/member/login"}
  >
    Log in
  </button>

  <button
    className="eoBtn eoBtnBlue"
    onClick={() => window.location.href = "/member/signup"}
  >
    Sign Up
  </button>
</div>

          </header>

          <section className="eoSupport" role="region" aria-label="Customer support">
            <div className="eoSupportLeft">
              <div className="eoBubble" aria-hidden="true">
                💬
              </div>
              <div className="eoSupportTxt">
                <div className="eoSupportTitle">24/7 Customer Support</div>
                <div className="eoSupportSub">
                  <span className="eoDot" aria-hidden="true" /> 24/7 Online Assistance
                </div>
              </div>
            </div>

            <a
              className="eoChatBtn"
              href="https://t.me/MarketWaySupport"
              target="_blank"
              rel="noreferrer"
            >
              Chat Now <span className="eoArrow" aria-hidden="true">➜</span>
            </a>
          </section>

          <section className="eoSection">
            <div className="eoSectionHead">
              <span className="eoSectionLine" aria-hidden="true" />
              <div className="eoSectionTitle">Trusted Payment Partners</div>
              <span className="eoSectionLine" aria-hidden="true" />
            </div>

            <div className="eoMarquee" aria-label="Payment partners marquee">
              <div className="eoMarqueeTrack">
                {[...payment, ...payment].map((p, i) => (
                  <div className="eoLogoTile" key={p.label + i}>
                    <img className="eoLogoImg" src={p.img} alt={p.label} />
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="eoSection eoSectionTight">
            <div className="eoBrands" aria-label="Brands marquee">
              <div className="eoBrandsTrack">
                {[...brands, ...brands].map((b, i) => (
                  <div className="eoLogoTile eoLogoTileSm" key={b.label + i}>
                    <img className="eoLogoImg" src={b.img} alt={b.label} />
                  </div>
                ))}
              </div>
            </div>
          </section>

          <footer className="eoFooter">
  <a href="/privacy" className="eoFootLink">Privacy Policy</a>
  <span className="eoSep" aria-hidden="true">|</span>
  <a href="/terms" className="eoFootLink">Terms of Service</a>
  <span className="eoSep" aria-hidden="true">|</span>
  <a href="/contact" className="eoFootLink">Contact Us</a>
</footer>
        </main>
      </div>
    </div>
  );
}
