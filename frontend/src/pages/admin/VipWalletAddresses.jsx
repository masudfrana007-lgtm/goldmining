import { useEffect, useState } from "react";
import AppLayout from "../../components/AppLayout";
import api from "../../services/api";
import "./VipWalletAddresses.css";

const VIPS = [
  { key: "V1", label: "VIP 1" },
  { key: "V2", label: "VIP 2" },
  { key: "V3", label: "VIP 3" },
];

// Only one slot: USDT TRC20
const SLOT = { asset: "USDT", network: "TRC20", label: "USDT (TRC20)" };

// Convert relative URLs to absolute (backend)
const toAbsUrl = (p) => {
  if (!p) return "";
  if (/^(https?:)?\/\//i.test(p)) return p;
  return p.startsWith("/") ? p : `/${p}`;
};

function slotKey(vip_rank, asset, network) {
  return `${vip_rank}__${String(asset || "").toUpperCase()}__${String(
    network || ""
  ).toUpperCase()}`;
}

export default function VipWalletAddresses() {
  const [vip, setVip] = useState("V1");
  const [rows, setRows] = useState({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  async function loadAll() {
    setErr("");
    setOk("");
    try {
      const { data } = await api.get("/vip-deposit-addresses");
      const map = {};
      for (const r of data || []) {
        const k = slotKey(r.vip_rank, r.asset, r.network || "");
        map[k] = {
          vip_rank: String(r.vip_rank || "").toUpperCase(),
          asset: String(r.asset || "").toUpperCase(),
          network: String(r.network || "").toUpperCase(),
          wallet_address: r.wallet_address || "",
          photo_url: r.photo_url || "",
          is_active: r.is_active !== false,
        };
      }
      setRows(map);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load");
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  function getRow() {
    const k = slotKey(vip, SLOT.asset, SLOT.network);
    return (
      rows[k] || {
        vip_rank: vip,
        asset: SLOT.asset,
        network: SLOT.network,
        wallet_address: "",
        photo_url: "",
        is_active: true,
      }
    );
  }

  function patchRow(patch) {
    const k = slotKey(vip, SLOT.asset, SLOT.network);
    setRows((prev) => ({
      ...prev,
      [k]: { ...getRow(), ...patch },
    }));
  }

async function uploadPhoto(file) {
  setBusy(true);
  setErr("");
  setOk("");
  try {
    const fd = new FormData();
    fd.append("photo", file);
    fd.append("vip_rank", vip);
    
    console.log('📤 Uploading:', { 
      fileName: file.name, 
      size: file.size, 
      type: file.type,
      vip_rank: vip 
    });
    
    const { data } = await api.post("/vip-deposit-addresses/photo", fd, {
      headers: { 'Content-Type': 'multipart/form-data' } // ✅ Explicit, but axios usually handles this
    });
    
    console.log('✅ Upload response:', data);
    patchRow({ photo_url: data?.photo_url || "" });
    setOk("Photo uploaded");
  } catch (e) {
    console.error('❌ Upload failed:', {
      status: e?.response?.status,
      statusText: e?.response?.statusText,
      data: e?.response?.data,
      message: e?.message,
      config: {
        url: e?.config?.url,
        method: e?.config?.method,
        headers: e?.config?.headers
      }
    });
    setErr(e?.response?.data?.message || "Upload failed");
  } finally {
    setBusy(false);
  }
}

  async function save() {
    const row = getRow();
    setBusy(true);
    setErr("");
    setOk("");
    try {
      if (!String(row.wallet_address || "").trim()) {
        setErr("Wallet address is required");
        return;
      }
      await api.post("/vip-deposit-addresses/upsert", {
        vip_rank: vip,
        asset: "USDT",
        network: "TRC20",
        wallet_address: String(row.wallet_address || "").trim(),
        photo_url: String(row.photo_url || "").trim(),
        is_active: row.is_active !== false,
      });
      setOk(`${vip} saved`);
      await loadAll();
    } catch (e) {
      setErr(e?.response?.data?.message || "Save failed");
    } finally {
      setBusy(false);
    }
  }

  const row = getRow();

  return (
    <AppLayout>
      <div className="vip-container">
        <div className="vip-topbar">
          <div>
            <h2>VIP Wallet Addresses</h2>
            <div className="vip-small">Only USDT (TRC20) for VIP 1/2/3.</div>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button className="vip-btn ghost" onClick={loadAll} disabled={busy}>
              Refresh
            </button>
            <button className="vip-btn" onClick={save} disabled={busy}>
              {busy ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        {err && <div className="vip-alert err">{err}</div>}
        {ok && <div className="vip-alert ok">{ok}</div>}

        {/* VIP Tabs */}
        <div className="vip-tabs">
          {VIPS.map((v) => (
            <button
              key={v.key}
              className={`vip-tab ${vip === v.key ? "active" : ""}`}
              onClick={() => {
                setVip(v.key);
                setErr("");
                setOk("");
              }}
              disabled={busy}
            >
              {v.label}
            </button>
          ))}
        </div>

        <div className="vip-card">
          <div className="vip-row">
            <div>
              <h3>{SLOT.label}</h3>
              <div className="vip-small">
                Rank: <b>{VIPS.find((v) => v.key === vip)?.label || vip}</b>
              </div>
            </div>

            <label className="vip-small" style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="checkbox"
                checked={row.is_active}
                onChange={(e) => patchRow({ is_active: e.target.checked })}
                disabled={busy}
              />
              Active
            </label>
          </div>

          <div className="vip-row" style={{ marginTop: 16 }}>
            <div style={{ flex: 1, minWidth: 260 }}>
              <div className="field">
                <div className="vip-small">Wallet address</div>
                <input
                  className="vip-input"
                  value={row.wallet_address || ""}
                  onChange={(e) => patchRow({ wallet_address: e.target.value })}
                  placeholder="Paste USDT TRC20 address"
                  disabled={busy}
                />
              </div>

              <div className="field" style={{ marginTop: 12 }}>
                <div className="vip-small">QR / Photo</div>
                <div className="vip-row">
                  <input
                    className="vip-input"
                    value={row.photo_url || ""}
                    onChange={(e) => patchRow({ photo_url: e.target.value })}
                    placeholder="Or paste photo URL"
                    style={{ flex: 1, minWidth: 260 }}
                    disabled={busy}
                  />
                  <label className="vip-btn ghost" style={{ cursor: "pointer" }}>
                    Upload photo
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        uploadPhoto(f);
                        e.target.value = "";
                      }}
                      disabled={busy}
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="vip-photo-preview">
              {row.photo_url ? (
                <img
                  src={toAbsUrl(row.photo_url)}
                  alt="QR"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
              ) : (
                <div className="vip-small">No photo</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}