import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./Records.css";

function nfmt(n, d = 2) {
  const num = Number(n || 0);
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: d,
    minimumFractionDigits: d,
  }).format(num);
}

function Icon({ name }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
  };

  switch (name) {
    case "support":
      return (
        <svg {...common}>
          <path
            d="M4 12a8 8 0 0 1 16 0v4a2 2 0 0 1-2 2h-1"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M6 12v4a2 2 0 0 0 2 2h2"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path d="M9 20h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "back":
      return (
        <svg {...common}>
          <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      );
    default:
      return null;
  }
}

export default function Records() {
  const nav = useNavigate();
  const [activeTab, setActiveTab] = useState("deposit"); // "deposit" or "withdrawal"

  // Demo deposit records
  const depositRecords = useMemo(
    () => [
      {
        id: "DEP-2024-001",
        date: "2026-03-04 14:32",
        amount: 5000.0,
        currency: "USDT",
        method: "Bank Transfer",
        status: "Completed",
        txHash: "0x7a8f9e2d...4b6c",
      },
      {
        id: "DEP-2024-002",
        date: "2026-03-02 10:15",
        amount: 2500.0,
        currency: "USDT",
        method: "Crypto Deposit",
        status: "Completed",
        txHash: "0x3c5d8a1f...9e2b",
      },
      {
        id: "DEP-2024-003",
        date: "2026-02-28 16:45",
        amount: 1000.0,
        currency: "USDT",
        method: "Bank Transfer",
        status: "Pending",
        txHash: "—",
      },
      {
        id: "DEP-2024-004",
        date: "2026-02-25 09:30",
        amount: 3000.0,
        currency: "USDT",
        method: "Crypto Deposit",
        status: "Completed",
        txHash: "0x9b4e6c2a...5d8f",
      },
    ],
    []
  );

  // Demo withdrawal records
  const withdrawalRecords = useMemo(
    () => [
      {
        id: "WD-2024-001",
        date: "2026-03-03 11:20",
        amount: 1500.0,
        currency: "USDT",
        method: "Bank Transfer",
        status: "Completed",
        txHash: "0x4f8a3e2c...7b9d",
      },
      {
        id: "WD-2024-002",
        date: "2026-03-01 15:10",
        amount: 800.0,
        currency: "USDT",
        method: "Crypto Withdrawal",
        status: "Processing",
        txHash: "0x2d9c7b4e...3a6f",
      },
      {
        id: "WD-2024-003",
        date: "2026-02-27 13:55",
        amount: 2000.0,
        currency: "USDT",
        method: "Bank Transfer",
        status: "Completed",
        txHash: "0x6e3f9a1d...8c4b",
      },
      {
        id: "WD-2024-004",
        date: "2026-02-24 08:40",
        amount: 500.0,
        currency: "USDT",
        method: "Crypto Withdrawal",
        status: "Rejected",
        txHash: "—",
      },
    ],
    []
  );

  const currentRecords = activeTab === "deposit" ? depositRecords : withdrawalRecords;

  const getStatusClass = (status) => {
    if (status === "Completed") return "status-completed";
    if (status === "Pending" || status === "Processing") return "status-pending";
    if (status === "Rejected") return "status-rejected";
    return "";
  };

  return (
    <div className="recDash">
      <div className="recVignette" aria-hidden="true" />

      {/* Top Bar */}
      <header className="recTopMining">
        <div className="recTopLeft">
          <button className="recBackBtn" onClick={() => nav(-1)} type="button">
            <Icon name="back" />
          </button>
          <div className="recTopOrb" aria-hidden="true">
            <span className="recTopOrbGlow" />
          </div>
          <div className="recTopTitle">Transaction Records</div>
        </div>

        <button
          className="recSupportPill"
          onClick={() => nav("/customer-service")}
          type="button"
          title="Customer Support"
        >
          <span className="recSupportPillIco">
            <Icon name="support" />
          </span>
          Customer Support
        </button>
      </header>

      <main className="recWrap">
        {/* Tab Navigation */}
        <section className="recCard recTabCard">
          <div className="recTabNav">
            <button
              className={`recTab ${activeTab === "deposit" ? "active" : ""}`}
              onClick={() => setActiveTab("deposit")}
              type="button"
            >
              <div className="recTabTitle">Deposit Records</div>
              <div className="recTabCount">{depositRecords.length}</div>
            </button>

            <button
              className={`recTab ${activeTab === "withdrawal" ? "active" : ""}`}
              onClick={() => setActiveTab("withdrawal")}
              type="button"
            >
              <div className="recTabTitle">Withdrawal Records</div>
              <div className="recTabCount">{withdrawalRecords.length}</div>
            </button>
          </div>
        </section>

        {/* Records Table */}
        <section className="recCard recTableCard">
          <div className="recTableHeader">
            <div className="recTableTitle">
              {activeTab === "deposit" ? "Deposit" : "Withdrawal"} History
            </div>
            <div className="recTableSub">
              Showing {currentRecords.length} {activeTab === "deposit" ? "deposit" : "withdrawal"} transactions
            </div>
          </div>

          <div className="recTableWrap">
            <table className="recTable">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Date & Time</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Tx Hash</th>
                </tr>
              </thead>
              <tbody>
                {currentRecords.map((record) => (
                  <tr key={record.id}>
                    <td>
                      <div className="recId">{record.id}</div>
                    </td>
                    <td>
                      <div className="recDate">{record.date}</div>
                    </td>
                    <td>
                      <div className="recAmount">
                        {nfmt(record.amount, 2)} <span className="recCurrency">{record.currency}</span>
                      </div>
                    </td>
                    <td>
                      <div className="recMethod">{record.method}</div>
                    </td>
                    <td>
                      <span className={`recStatus ${getStatusClass(record.status)}`}>{record.status}</span>
                    </td>
                    <td>
                      <div className="recHash">{record.txHash}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {currentRecords.length === 0 && (
            <div className="recEmpty">
              <div className="recEmptyTitle">No records found</div>
              <div className="recEmptySub">
                You haven't made any {activeTab === "deposit" ? "deposit" : "withdrawal"} transactions yet.
              </div>
            </div>
          )}
        </section>

        {/* Quick Actions */}
        <section className="recCard recActionsCard">
          <div className="recActionsTitle">Quick Actions</div>
          <div className="recActions">
            <button className="recActionBtn deposit" onClick={() => nav("/member/deposit")} type="button">
              Make Deposit
            </button>
            <button className="recActionBtn withdrawal" onClick={() => nav("/member/withdrawal-method")} type="button">
              Request Withdrawal
            </button>
            <button className="recActionBtn dashboard" onClick={() => nav("/member/trading-dashboard")} type="button">
              Back to Dashboard
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
