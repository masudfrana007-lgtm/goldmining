import { useMemo, useState } from "react";
import "./MiningPackages.css";

function money(n) {
  const num = Number(n || 0);
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

function clamp(n, min, max) {
  const x = Number.isFinite(n) ? n : 0;
  return Math.max(min, Math.min(max, x));
}

const DEMO_USER = {
  miningBalance: 12450.35,
  totalEarnings: 3860.22,
  activePackages: 2,
};

const PACKAGES = [
  {
    id: "mp-starter",
    name: "Starter Miner",
    dailyPct: 0.9,
    durationDays: 30,
    min: 100,
    max: 999,
    recommended: false,
  },
  {
    id: "mp-core",
    name: "Core Miner",
    dailyPct: 1.2,
    durationDays: 45,
    min: 1000,
    max: 4999,
    recommended: true,
  },
  {
    id: "mp-pro",
    name: "Pro Miner",
    dailyPct: 1.5,
    durationDays: 60,
    min: 5000,
    max: 19999,
    recommended: false,
  },
  {
    id: "mp-institutional",
    name: "Institutional Miner",
    dailyPct: 1.8,
    durationDays: 90,
    min: 20000,
    max: 100000,
    recommended: false,
  },
];

const ACTIVE_MINING = [
  {
    id: "am-10021",
    packageId: "mp-core",
    startedAt: "2026-02-01",
    principal: 2500,
    accrued: 182.4,
    daysLeft: 32,
    status: "Active",
  },
  {
    id: "am-10008",
    packageId: "mp-starter",
    startedAt: "2026-01-20",
    principal: 600,
    accrued: 135.2,
    daysLeft: 5,
    status: "Active",
  },
];

export default function MiningPackages() {
  const [selectedPkgId, setSelectedPkgId] = useState(PACKAGES.find((p) => p.recommended)?.id || PACKAGES[0].id);
  const [amount, setAmount] = useState(1500);

  const selectedPkg = useMemo(
    () => PACKAGES.find((p) => p.id === selectedPkgId) || PACKAGES[0],
    [selectedPkgId]
  );

  const calc = useMemo(() => {
    const a = Number(amount);
    const safeAmount = Number.isFinite(a) ? a : 0;

    const inRange = safeAmount >= selectedPkg.min && safeAmount <= selectedPkg.max;

    const dailyProfit = safeAmount * (selectedPkg.dailyPct / 100);
    const totalProfit = dailyProfit * selectedPkg.durationDays;
    const totalReturn = safeAmount + totalProfit;
    const roiPct = safeAmount > 0 ? (totalProfit / safeAmount) * 100 : 0;

    return {
      inRange,
      dailyProfit,
      totalProfit,
      totalReturn,
      roiPct,
    };
  }, [amount, selectedPkg]);

  const summary = useMemo(() => {
    const totalActivePrincipal = ACTIVE_MINING.reduce((s, x) => s + x.principal, 0);
    const totalAccrued = ACTIVE_MINING.reduce((s, x) => s + x.accrued, 0);
    return {
      totalActivePrincipal,
      totalAccrued,
    };
  }, []);

  return (
    <div className="mpPage">
      {/* subtle animated background */}
      <div className="mpBg" aria-hidden="true" />

      <div className="mpContainer">
        {/* Header */}
        <div className="mpHeader">
          <div>
            <h1 className="mpTitle">Mining Packages</h1>
            <p className="mpSub">
              Choose a package based on risk tolerance and capital range. Track active mining below.
            </p>
          </div>

          <div className="mpHeaderRight">
            <div className="mpPill">
              <span className="dotLive" />
              <span>Mining Engine: Online</span>
            </div>
          </div>
        </div>

        {/* Top summary */}
        <section className="mpSummary">
          <div className="sumCard">
            <div className="sumLabel">User Mining Balance</div>
            <div className="sumValue">${money(DEMO_USER.miningBalance)}</div>
            <div className="sumMeta">Available for new packages</div>
          </div>

          <div className="sumCard">
            <div className="sumLabel">Total Earnings</div>
            <div className="sumValue green">${money(DEMO_USER.totalEarnings)}</div>
            <div className="sumMeta">All-time mining profit</div>
          </div>

          <div className="sumCard">
            <div className="sumLabel">Active Packages</div>
            <div className="sumValue">{DEMO_USER.activePackages}</div>
            <div className="sumMeta">
              Active principal: <span className="muted">${money(summary.totalActivePrincipal)}</span>
            </div>
          </div>

          <div className="sumCard">
            <div className="sumLabel">Accrued (Active)</div>
            <div className="sumValue blue">${money(summary.totalAccrued)}</div>
            <div className="sumMeta">Current running profit</div>
          </div>
        </section>

        {/* Grid: Packages + ROI Calculator */}
        <section className="mpMainGrid">
          {/* Packages */}
          <div className="mpBlock">
            <div className="blockHead">
              <div>
                <div className="blockTitle">Available Packages</div>
                <div className="blockHint">Data-driven tiers with transparent ranges.</div>
              </div>
              <div className="blockActions">
                <div className="smallTag">Daily profit is estimated</div>
              </div>
            </div>

            <div className="pkgGrid">
              {PACKAGES.map((p) => {
                const totalProfit = p.durationDays * (p.dailyPct / 100);
                const totalReturnPct = totalProfit * 100; // on principal, simple model
                const isSelected = p.id === selectedPkgId;

                return (
                  <article
                    key={p.id}
                    className={[
                      "pkgCard",
                      p.recommended ? "recommended" : "",
                      isSelected ? "selected" : "",
                    ].join(" ")}
                    onClick={() => setSelectedPkgId(p.id)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="pkgTop">
                      <div className="pkgNameRow">
                        <div className="pkgName">{p.name}</div>
                        {p.recommended && <div className="badgeRec">Recommended</div>}
                      </div>

                      <div className="pkgKPIs">
                        <div className="kpi">
                          <div className="kpiLabel">Daily Profit</div>
                          <div className="kpiValue green">{p.dailyPct}%</div>
                        </div>
                        <div className="kpi">
                          <div className="kpiLabel">Duration</div>
                          <div className="kpiValue">{p.durationDays} days</div>
                        </div>
                        <div className="kpi">
                          <div className="kpiLabel">Total Return</div>
                          <div className="kpiValue">{money(totalReturnPct)}%</div>
                        </div>
                      </div>
                    </div>

                    <div className="pkgBody">
                      <div className="rows">
                        <div className="row">
                          <span className="rowKey">Minimum</span>
                          <span className="rowVal">${money(p.min)}</span>
                        </div>
                        <div className="row">
                          <span className="rowKey">Maximum</span>
                          <span className="rowVal">${money(p.max)}</span>
                        </div>
                        <div className="row">
                          <span className="rowKey">Settlement</span>
                          <span className="rowVal">Daily accrual</span>
                        </div>
                        <div className="row">
                          <span className="rowKey">Risk Notes</span>
                          <span className="rowVal muted">Market conditions apply</span>
                        </div>
                      </div>

                      <div className="pkgFooter">
                        <button
                          className="buyBtn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPkgId(p.id);
                            // Replace with real purchase modal / route
                            alert(`Selected: ${p.name}`);
                          }}
                        >
                          Buy Package
                        </button>

                        <button
                          className="ghostBtn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPkgId(p.id);
                          }}
                        >
                          Use in Calculator
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          {/* ROI Calculator */}
          <aside className="mpBlock calcBlock">
            <div className="blockHead">
              <div>
                <div className="blockTitle">ROI Calculator</div>
                <div className="blockHint">Estimate profit using package rate & duration.</div>
              </div>
            </div>

            <div className="calcForm">
              <label className="field">
                <span className="label">Select Package</span>
                <select
                  className="control"
                  value={selectedPkgId}
                  onChange={(e) => setSelectedPkgId(e.target.value)}
                >
                  {PACKAGES.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} • {p.dailyPct}% / day • {p.durationDays}d
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span className="label">Investment Amount (USD)</span>
                <input
                  className="control"
                  type="number"
                  min="0"
                  step="50"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  placeholder="Enter amount"
                />
                <div className={calc.inRange ? "help ok" : "help warn"}>
                  Range: ${money(selectedPkg.min)} – ${money(selectedPkg.max)}
                  {!calc.inRange && <span className="helpTag">Out of range</span>}
                </div>
              </label>

              <div className="calcGrid">
                <div className="calcCard">
                  <div className="calcLabel">Est. Daily Profit</div>
                  <div className="calcValue green">${money(calc.dailyProfit)}</div>
                  <div className="calcMeta">({selectedPkg.dailyPct}% of principal)</div>
                </div>

                <div className="calcCard">
                  <div className="calcLabel">Est. Total Profit</div>
                  <div className="calcValue">${money(calc.totalProfit)}</div>
                  <div className="calcMeta">{selectedPkg.durationDays} days</div>
                </div>

                <div className="calcCard">
                  <div className="calcLabel">Est. Total Return</div>
                  <div className="calcValue blue">${money(calc.totalReturn)}</div>
                  <div className="calcMeta">Principal + profit</div>
                </div>

                <div className="calcCard">
                  <div className="calcLabel">ROI</div>
                  <div className="calcValue">{money(calc.roiPct)}%</div>
                  <div className="calcMeta">Simple return model</div>
                </div>
              </div>

              <div className="calcActions">
                <button
                  className="buyBtn"
                  disabled={!calc.inRange || amount <= 0}
                  onClick={() => alert(`Proceed: ${selectedPkg.name} • $${money(amount)}`)}
                >
                  Proceed
                </button>
                <button
                  className="ghostBtn"
                  onClick={() => setAmount(clamp(selectedPkg.min, 0, selectedPkg.max))}
                >
                  Use Minimum
                </button>
              </div>

              <div className="calcNote">
                <span className="noteDot" />
                Estimates are for dashboard preview. Use real backend settlement rules for production.
              </div>
            </div>
          </aside>
        </section>

        {/* Active Mining */}
        <section className="mpBlock">
          <div className="blockHead">
            <div>
              <div className="blockTitle">Active Mining</div>
              <div className="blockHint">Track running packages and accrued profit.</div>
            </div>
            <div className="blockActions">
              <div className="smallTag">Auto-updates via backend</div>
            </div>
          </div>

          <div className="tableWrap">
            <table className="mpTable">
              <thead>
                <tr>
                  <th>Package</th>
                  <th>Started</th>
                  <th className="right">Principal</th>
                  <th className="right">Accrued</th>
                  <th className="right">Days Left</th>
                  <th>Status</th>
                  <th className="right">Action</th>
                </tr>
              </thead>
              <tbody>
                {ACTIVE_MINING.map((x) => {
                  const pkg = PACKAGES.find((p) => p.id === x.packageId);
                  return (
                    <tr key={x.id}>
                      <td>
                        <div className="cellMain">{pkg?.name || "—"}</div>
                        <div className="cellSub">#{x.id}</div>
                      </td>
                      <td>{x.startedAt}</td>
                      <td className="right">${money(x.principal)}</td>
                      <td className="right green">${money(x.accrued)}</td>
                      <td className="right">{x.daysLeft}</td>
                      <td>
                        <span className="statusPill">
                          <span className="statusDot" />
                          {x.status}
                        </span>
                      </td>
                      <td className="right">
                        <button className="miniBtn" onClick={() => alert(`Details: ${x.id}`)}>
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile-friendly list fallback (optional, but useful) */}
          <div className="mobileList">
            {ACTIVE_MINING.map((x) => {
              const pkg = PACKAGES.find((p) => p.id === x.packageId);
              return (
                <div className="mItem" key={`m-${x.id}`}>
                  <div className="mTop">
                    <div>
                      <div className="mTitle">{pkg?.name || "—"}</div>
                      <div className="mSub">#{x.id} • Started {x.startedAt}</div>
                    </div>
                    <span className="statusPill">
                      <span className="statusDot" />
                      {x.status}
                    </span>
                  </div>

                  <div className="mGrid">
                    <div className="mKV">
                      <span>Principal</span>
                      <b>${money(x.principal)}</b>
                    </div>
                    <div className="mKV">
                      <span>Accrued</span>
                      <b className="green">${money(x.accrued)}</b>
                    </div>
                    <div className="mKV">
                      <span>Days Left</span>
                      <b>{x.daysLeft}</b>
                    </div>
                  </div>

                  <button className="miniBtn wide" onClick={() => alert(`Details: ${x.id}`)}>
                    View Details
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        <div className="mpFooterNote">
          Tip: Keep package terms consistent with your backend rules (settlement, fees, compounding, early close).
        </div>
      </div>
    </div>
  );
}
