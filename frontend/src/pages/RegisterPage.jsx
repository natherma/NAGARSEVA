import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const WARDS = ["Ward 71", "Ward 72", "Ward 73", "Ward 74", "Ward 83", "Ward 92"];

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm]       = useState({ name: "", phone: "", password: "", ward: "", city: "Mumbai" });
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  function update(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      await register({ ...form, role: "citizen" });
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: "32px 24px", maxWidth: 480, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ fontSize: 40, marginBottom: 6 }}>🏛️</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#185FA5" }}>Create your account</h1>
        <p style={{ fontSize: 13, color: "#888", marginTop: 4 }}>Join Nagar Seva to report civic issues</p>
      </div>

      <form onSubmit={handleSubmit}>
        {[
          { label: "Full name",     field: "name",     type: "text",     placeholder: "Nafees Ahmed" },
          { label: "Phone number",  field: "phone",    type: "tel",      placeholder: "9876543210" },
          { label: "Password",      field: "password", type: "password", placeholder: "Min 6 characters" },
          { label: "City",          field: "city",     type: "text",     placeholder: "Mumbai" },
        ].map(({ label, field, type, placeholder }) => (
          <div key={field} style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 13, color: "#555", marginBottom: 6 }}>{label}</label>
            <input type={type} placeholder={placeholder} value={form[field]}
              onChange={e => update(field, e.target.value)} required style={inputStyle} />
          </div>
        ))}

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 13, color: "#555", marginBottom: 6 }}>Your ward</label>
          <select value={form.ward} onChange={e => update("ward", e.target.value)} required style={inputStyle}>
            <option value="">Select your ward</option>
            {WARDS.map(w => <option key={w} value={w}>{w}</option>)}
          </select>
        </div>

        {error && (
          <div style={{ background: "#FCEBEB", color: "#791F1F", padding: "10px 14px",
                        borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} style={primaryBtn}>
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p style={{ textAlign: "center", fontSize: 14, color: "#888", marginTop: 20 }}>
        Already have an account?{" "}
        <Link to="/login" style={{ color: "#185FA5", fontWeight: 500 }}>Log in</Link>
      </p>
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
};