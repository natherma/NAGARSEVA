import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm]     = useState({ phone: "", password: "" });
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.phone, form.password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column",
                  justifyContent: "center", padding: "32px 24px", maxWidth: 480, margin: "0 auto" }}>
      {/* Logo / Header */}
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🏛️</div>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: "#185FA5" }}>Nagar Seva</h1>
        <p style={{ fontSize: 14, color: "#888", marginTop: 4 }}>Civic issues, resolved faster</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 13, color: "#555", marginBottom: 6 }}>
            Phone number
          </label>
          <input
            type="tel"
            placeholder="9876543210"
            value={form.phone}
            onChange={e => setForm({ ...form, phone: e.target.value })}
            required
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 13, color: "#555", marginBottom: 6 }}>
            Password
          </label>
          <input
            type="password"
            placeholder="Enter your password"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            required
            style={inputStyle}
          />
        </div>

        {error && (
          <div style={{ background: "#FCEBEB", color: "#791F1F", padding: "10px 14px",
                        borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} style={primaryBtn}>
          {loading ? "Logging in..." : "Log in"}
        </button>
      </form>

      <p style={{ textAlign: "center", fontSize: 14, color: "#888", marginTop: 24 }}>
        No account?{" "}
        <Link to="/register" style={{ color: "#185FA5", fontWeight: 500 }}>Register here</Link>
      </p>

      <div style={{ borderTop: "1px solid #e0e0e0", marginTop: 32, paddingTop: 20, textAlign: "center" }}>
        <Link to="/track" style={{ fontSize: 13, color: "#185FA5" }}>
          🔍 Track a ticket without logging in
        </Link>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "11px 14px", borderRadius: 8, fontSize: 15,
  border: "1px solid #ddd", outline: "none", background: "#fff",
};

const primaryBtn = {
  width: "100%", padding: 13, background: "#185FA5", color: "#fff",
  border: "none", borderRadius: 10, fontSize: 15, fontWeight: 500,
  opacity: 1, transition: "opacity 0.15s",
};