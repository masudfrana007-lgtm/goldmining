import { useEffect, useState } from "react";
import api from "../../../services/api";
import { getUser } from "../../../auth";
import AppLayout from "../../../components/AppLayout";
import "./Users.css";

export default function Users() {
  const me = getUser();

  const [list, setList] = useState([]);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [busyId, setBusyId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: me.role === "admin" ? "owner" : "agent",
  });

  const load = async () => {
    try {
      const { data } = await api.get("/users");
      setList(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr("Failed to load users");
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onChange = (key, value) => {
    setForm((p) => ({ ...p, [key]: value }));
    setFieldErrors((p) => ({ ...p, [key]: null }));
  };

  const create = async (e) => {
    e.preventDefault();
    setErr("");
    setOk("");
    setFieldErrors({});

    try {
      await api.post("/users", form);
      setForm({
        name: "",
        email: "",
        password: "",
        role: me.role === "admin" ? "owner" : "agent",
      });
      setOk("User created successfully");
      await load();
      setTimeout(() => setOk(""), 2000);
    } catch (e2) {
      const data = e2?.response?.data;
      if (data?.fieldErrors) setFieldErrors(data.fieldErrors);
      else setErr(data?.message || "Failed to create user");
    }
  };

  const canManage = (u) => {
    if (!u) return false;
    if (me?.role === "admin") return u.role !== "admin";
    if (me?.role === "owner") return u.role === "agent";
    return false;
  };

  const toggleBlock = async (u) => {
    setErr("");
    setOk("");

    if (!canManage(u)) {
      setErr("Not allowed to manage this user");
      return;
    }

    const willBlock = !Boolean(u.is_blocked);
    const confirmMsg = willBlock
      ? `Block ${u.name} (${u.short_id})?`
      : `Unblock ${u.name} (${u.short_id})?`;

    if (!window.confirm(confirmMsg)) return;

    setBusyId(u.id);
    setList((prev) =>
      prev.map((x) => (x.id === u.id ? { ...x, is_blocked: willBlock } : x))
    );

    try {
      await api.post(`/users/${u.id}/${willBlock ? "block" : "unblock"}`);
      setOk(willBlock ? "User blocked successfully" : "User unblocked successfully");
      setTimeout(() => setOk(""), 2000);
    } catch (e2) {
      setList((prev) =>
        prev.map((x) => (x.id === u.id ? { ...x, is_blocked: !willBlock } : x))
      );
      const data = e2?.response?.data;
      setErr(data?.message || "Operation failed");
    } finally {
      setBusyId(null);
    }
  };

  const getRoleBadgeClass = (role) => {
    return `users-role-badge ${role}`;
  };

  return (
    <AppLayout>
      <div className="users-container">
        <div className="users-topbar">
          <div>
            <h2>👥 Users Management</h2>
            <div className="small">
              You are <span className="badge">{me.role}</span>
            </div>
          </div>
        </div>

        {err && <div className="users-error">❌ {err}</div>}
        {ok && <div className="users-ok">✅ {ok}</div>}

        <div className="users-grid">
          {/* Create User Section */}
          <div className="users-form-section">
            <h3>✨ Create {me.role === "admin" ? "Owner" : "Agent"}</h3>
            <span className="small">
              {me.role === "admin"
                ? "Admin can create owner accounts"
                : "Owner can create agent accounts"}
            </span>
            <div className="hr" />

            <form onSubmit={create}>
              <div className="users-form-group">
                <label>Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => onChange("name", e.target.value)}
                  placeholder="Enter full name"
                />
                {fieldErrors.name && (
                  <div className="users-error">{fieldErrors.name[0]}</div>
                )}
              </div>

              <div className="users-form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => onChange("email", e.target.value)}
                  placeholder="Enter email address"
                />
                {fieldErrors.email && (
                  <div className="users-error">{fieldErrors.email[0]}</div>
                )}
              </div>

              <div className="users-form-group">
                <label>Password *</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => onChange("password", e.target.value)}
                  placeholder="Minimum 6 characters"
                />
                {fieldErrors.password && (
                  <div className="users-error">{fieldErrors.password[0]}</div>
                )}
              </div>

              <div className="users-form-group">
                <label>Role</label>
                <input value={form.role} disabled />
              </div>

              <button className="users-btn" type="submit">
                ✅ Create User
              </button>
            </form>
          </div>

          {/* Users List Section */}
          <div className="users-table-section">
            <h3>📋 Users List</h3>
            <span className="small">
              Admin sees all users. Owner sees self + created agents.
            </span>
            <div className="hr" />

            <div className="users-table-scroll">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>User ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Created By</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {list.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: "center", padding: "24px" }}>
                        No users found
                      </td>
                    </tr>
                  ) : (
                    list.map((u) => {
                      const allowed = canManage(u);
                      const isBusy = busyId === u.id;

                      return (
                        <tr key={u.short_id}>
                          <td>{u.short_id}</td>
                          <td>{u.name}</td>
                          <td>{u.email}</td>
                          <td>
                            <span className={getRoleBadgeClass(u.role)}>
                              {u.role}
                            </span>
                          </td>
                          <td>{u.created_by ?? "-"}</td>
                          <td>
                            <span
                              className={`users-status-pill ${
                                u.is_blocked ? "blocked" : "active"
                              }`}
                            >
                              {u.is_blocked ? "🚫 Blocked" : "✅ Active"}
                            </span>
                          </td>
                          <td>
                            <button
                              className={`users-action-btn ${
                                u.is_blocked ? "unblock" : "block"
                              }`}
                              disabled={!allowed || isBusy}
                              onClick={() => toggleBlock(u)}
                            >
                              {isBusy
                                ? "⏳"
                                : u.is_blocked
                                ? "Unblock"
                                : "Block"}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="small" style={{ opacity: 0.7, marginTop: 12 }}>
              💡 Tip: Swipe left/right to view all columns on mobile
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
