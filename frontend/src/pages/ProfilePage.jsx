import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

const WARDS = [
  "Ward 71", "Ward 72", "Ward 73", "Ward 74",
  "Ward 83", "Ward 92", "Ward 101", "Ward 102",
];

export default function ProfilePage() {
  const { user, logout, login } = useAuth();
  const navigate = useNavigate();

  const [editing, setEditing]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [success, setSuccess]   = useState("");
  const [error, setError]       = useState("");

  const [form, setForm] = useState({
    name:  user?.name  || "",
    email: user?.email || "",
    ward:  user?.ward  || "",
    city:  user?.city  || "Mumbai",
  });

  function update(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
    setSuccess("");
    setError("");
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await api.patch("/auth/profile", form);
      // Update local storage so useAuth reflects new values
      localStorage.setItem("user", JSON.stringify(res.data.user));
      setSuccess("Profile updated successfully!");
      setEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save. Try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const initials = user?.name
    ?.split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div style={{ maxWidth: 480, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ background: "#185FA5", padding: "32px 20px 24px", textAlign: "center" }}>
        {/* Avatar circle */}
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          background: "rgba(255,255,255,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 26, fontWeight: 700, color: "#fff",
          margin: "0 auto 12px",
        }}>
          {initials}
        </div>
        <div style={{ fontSize: 20, fontWeight: 600, color: "#fff" }}>{user?.name}</div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", marginTop: 4 }}>
          {user?.phone} · {user?.ward}
        </div>
        <div style={{ marginTop: 8 }}>
          <span style={{
            background: "rgba(255,255,255,0.2)", color: "#fff",
            padding: "3px 12px", borderRadius: 999, fontSize: 12, fontWeight: 500,
          }}>
            {user?.role === "officer" ? "🏛 Officer" : "👤 Citizen"}
          </span>
        </div>
      </div>

      <div style={{ padding: 16 }}>

        {/* Success / Error */}
        {success && (
          <div style={{ background: "#EAF3DE", color: "#27500A", padding: "10px 14px",
                        borderRadius: 8, fontSize: 13, marginBottom: 14 }}>
            ✓ {success}
          </div>
        )}
        {error && (
          <div style={{ background: "#FCEBEB", color: "#791F1F", padding: "10px 14px",
                        borderRadius: 8, fontSize: 13, marginBottom: 14 }}>
            {error}
          </div>
        )}

        {/* Profile card */}
        <div style={{ background: "#fff", borderRadius: 12, border: "0.5px solid #e8e8e8",
                      padding: 16, marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between",
                        alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Personal details</div>
            {!editing && (
              <button onClick={() => setEditing(true)}
                style={{ background: "#E6F1FB", color: "#185FA5", border: "none",
                         borderRadius: 6, padding: "5px 12px", fontSize: 13,
                         fontWeight: 500, cursor: "pointer" }}>
                Edit
              </button>
            )}
          </div>

          {!editing ? (
            // View mode
            <div>
              {[
                { label: "Full name", value: user?.name },
                { label: "Phone",     value: user?.phone },
                { label: "Email",     value: user?.email || "Not added" },
                { label: "Ward",      value: user?.ward },
                { label: "City",      value: user?.city },
              ].map(row => (
                <div key={row.label} style={{ display: "flex", gap: 12, marginBottom: 12,
                                              paddingBottom: 12, borderBottom: "0.5px solid #f0f0f0" }}>
                  <div style={{ fontSize: 13, color: "#888", width: 80, flexShrink: 0 }}>{row.label}</div>
                  <div style={{ fontSize: 13, color: row.value === "Not added" ? "#bbb" : "#1a1a1a",
                                fontWeight: 500, fontStyle: row.value === "Not added" ? "italic" : "normal" }}>
                    {row.value}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Edit mode
            <form onSubmit={handleSave}>
              {[
                { label: "Full name", field: "name",  type: "text",  placeholder: "Your name" },
                { label: "Email",     field: "email", type: "email", placeholder: "you@example.com" },
                { label: "City",      field: "city",  type: "text",  placeholder: "Mumbai" },
              ].map(({ label, field, type, placeholder }) => (
                <div key={field} style={{ marginBottom: 14 }}>
                  <label style={lbl}>{label}</label>
                  <input type={type} placeholder={placeholder}
                    value={form[field]}
                    onChange={e => update(field, e.target.value)}
                    style={inp} />
                </div>
              ))}

              <div style={{ marginBottom: 16 }}>
                <label style={lbl}>Ward</label>
                <select value={form.ward} onChange={e => update("ward", e.target.value)} style={inp}>
                  {WARDS.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>

              {/* Phone is read-only — will need OTP to change */}
              <div style={{ marginBottom: 16 }}>
                <label style={lbl}>Phone number</label>
                <div style={{ padding: "11px 14px", borderRadius: 8, background: "#f7f7f5",
                              border: "1px solid #e8e8e8", fontSize: 14, color: "#aaa",
                              display: "flex", justifyContent: "space-between" }}>
                  <span>{user?.phone}</span>
                  <span style={{ fontSize: 12, color: "#bbb" }}>OTP verification coming soon</span>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button type="submit" disabled={saving}
                  style={{ flex: 1, padding: 12, background: "#185FA5", color: "#fff",
                           border: "none", borderRadius: 8, fontSize: 14, fontWeight: 500 }}>
                  {saving ? "Saving..." : "Save changes"}
                </button>
                <button type="button" onClick={() => { setEditing(false); setError(""); }}
                  style={{ flex: 1, padding: 12, background: "#f0f0f0", color: "#555",
                           border: "none", borderRadius: 8, fontSize: 14 }}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Account section */}
        <div style={{ background: "#fff", borderRadius: 12, border: "0.5px solid #e8e8e8",
                      padding: 16, marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Account</div>

          <div style={{ display: "flex", justifyContent: "space-between",
                        alignItems: "center", paddingBottom: 12,
                        borderBottom: "0.5px solid #f0f0f0", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>Mobile OTP login</div>
              <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>
                Verify phone with OTP on each login
              </div>
            </div>
            <span style={{ fontSize: 12, background: "#FAEEDA", color: "#633806",
                           padding: "3px 10px", borderRadius: 999, fontWeight: 500 }}>
              Coming soon
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>Member since</div>
              <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
                  : "Recently joined"}
              </div>
            </div>
          </div>
        </div>

        {/* Danger zone */}
        <div style={{ background: "#fff", borderRadius: 12, border: "0.5px solid #e8e8e8",
                      padding: 16, marginBottom: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Session</div>
          <button onClick={handleLogout}
            style={{ width: "100%", padding: 12, background: "#FCEBEB", color: "#791F1F",
                     border: "none", borderRadius: 8, fontSize: 14, fontWeight: 500 }}>
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}

const lbl = { display: "block", fontSize: 13, color: "#555", marginBottom: 6 };
const inp = {
  width: "100%", padding: "11px 14px", borderRadius: 8,
  fontSize: 14, border: "1px solid #ddd", outline: "none", boxSizing: "border-box",
};