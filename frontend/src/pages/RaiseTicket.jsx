import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

const CATEGORIES = [
  { id: "roads",        label: "Roads",         icon: "🛣️" },
  { id: "water",        label: "Water supply",  icon: "💧" },
  { id: "sanitation",   label: "Sanitation",    icon: "🗑️" },
  { id: "lights",       label: "Street lights", icon: "💡" },
  { id: "parks",        label: "Parks & trees", icon: "🌳" },
  { id: "encroachment", label: "Encroachment",  icon: "🏗️" },
];

const SEVERITIES = [
  { id: "high",   label: "High",   desc: "Safety risk / urgent",  color: "#791F1F", bg: "#FCEBEB" },
  { id: "medium", label: "Medium", desc: "Affects daily life",    color: "#633806", bg: "#FAEEDA" },
  { id: "low",    label: "Low",    desc: "Minor inconvenience",   color: "#27500A", bg: "#EAF3DE" },
];

const SLA_MATRIX = {
  roads:        { high: 7,  medium: 14, low: 21 },
  water:        { high: 2,  medium: 5,  low: 10 },
  sanitation:   { high: 1,  medium: 3,  low: 7  },
  lights:       { high: 3,  medium: 7,  low: 14 },
  parks:        { high: 5,  medium: 10, low: 21 },
  encroachment: { high: 7,  medium: 14, low: 30 },
};

export default function RaiseTicket() {
  const navigate  = useNavigate();
  const { user }  = useAuth();

  const [step, setStep]     = useState(1);   // which step we're on (1, 2, or 3)
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");

  // All form data lives in one object
  const [form, setForm] = useState({
    category:    "",
    severity:    "",
    title:       "",
    description: "",
    address:     "",
    ward:        user?.ward || "",
  });

  function update(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
    setError("");
  }

  // Move to next step — validate first
  function nextStep() {
    if (step === 1) {
      if (!form.category) return setError("Please choose a category.");
      if (!form.severity)  return setError("Please choose a severity level.");
    }
    if (step === 2) {
      if (!form.title.trim())       return setError("Please add a title.");
      if (!form.description.trim()) return setError("Please describe the issue.");
      if (!form.address.trim())     return setError("Please enter the location.");
    }
    setError("");
    setStep(s => s + 1);
  }

  async function handleSubmit() {
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/tickets", {
        title:       form.title,
        description: form.description,
        category:    form.category,
        severity:    form.severity,
        ward:        form.ward,
        location:    { address: form.address },
      });
      // Go to the new ticket's detail page
      navigate(`/ticket/${res.data.ticket._id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to raise ticket. Try again.");
      setLoading(false);
    }
  }

  const slaDays = SLA_MATRIX[form.category]?.[form.severity];

  return (
    <div style={{ maxWidth: 480, margin: "0 auto" }}>

      {/* Top bar */}
      <div style={{ background: "#fff", padding: "14px 16px",
                    borderBottom: "0.5px solid #e8e8e8", display: "flex",
                    alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 10 }}>
        <button onClick={() => step === 1 ? navigate("/") : setStep(s => s - 1)}
          style={{ background: "none", border: "none", fontSize: 22, color: "#666", padding: 0, lineHeight: 1 }}>
          ←
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 500 }}>Raise a ticket</div>
          <div style={{ fontSize: 12, color: "#999" }}>Step {step} of 3</div>
        </div>
      </div>

      {/* Step indicator */}
      <div style={{ display: "flex", alignItems: "center", padding: "16px 20px 0" }}>
        {[1, 2, 3].map((n, i) => (
          <div key={n} style={{ display: "flex", alignItems: "center", flex: i < 2 ? 1 : "none" }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%", display: "flex",
              alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600,
              background: n < step ? "#EAF3DE" : n === step ? "#185FA5" : "#f0f0f0",
              color: n < step ? "#27500A" : n === step ? "#fff" : "#aaa",
              flexShrink: 0,
            }}>
              {n < step ? "✓" : n}
            </div>
            {i < 2 && (
              <div style={{ flex: 1, height: 2, background: n < step ? "#185FA5" : "#e8e8e8", margin: "0 6px" }} />
            )}
          </div>
        ))}
      </div>

      <div style={{ padding: "20px 16px" }}>

        {/* ── STEP 1: Category + Severity ─────────────────────────── */}
        {step === 1 && (
          <>
            <p style={sectionLabel}>Choose category</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 24 }}>
              {CATEGORIES.map(cat => (
                <button key={cat.id} onClick={() => update("category", cat.id)}
                  style={{
                    padding: "16px 10px", borderRadius: 10, border: "1.5px solid",
                    borderColor: form.category === cat.id ? "#185FA5" : "#e8e8e8",
                    background: form.category === cat.id ? "#E6F1FB" : "#fff",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                    fontSize: 13, color: form.category === cat.id ? "#0C447C" : "#555",
                    fontWeight: form.category === cat.id ? 600 : 400, cursor: "pointer",
                  }}>
                  <span style={{ fontSize: 24 }}>{cat.icon}</span>
                  {cat.label}
                </button>
              ))}
            </div>

            <p style={sectionLabel}>Severity level</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
              {SEVERITIES.map(sev => (
                <button key={sev.id} onClick={() => update("severity", sev.id)}
                  style={{
                    padding: "12px 14px", borderRadius: 10, border: "1.5px solid",
                    borderColor: form.severity === sev.id ? sev.color : "#e8e8e8",
                    background: form.severity === sev.id ? sev.bg : "#fff",
                    display: "flex", alignItems: "center", gap: 12, cursor: "pointer",
                    textAlign: "left",
                  }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600,
                                  color: form.severity === sev.id ? sev.color : "#1a1a1a" }}>
                      {sev.label}
                    </div>
                    <div style={{ fontSize: 12, color: "#888", marginTop: 1 }}>{sev.desc}</div>
                  </div>
                  {form.severity === sev.id && <span style={{ color: sev.color, fontSize: 18 }}>✓</span>}
                </button>
              ))}
            </div>

            {/* Show SLA preview once both are selected */}
            {slaDays && (
              <div style={{ background: "#E6F1FB", borderRadius: 8, padding: "10px 14px",
                            fontSize: 13, color: "#0C447C", marginBottom: 20 }}>
                ⏱ Expected resolution: <strong>{slaDays} days</strong> SLA
              </div>
            )}
          </>
        )}

        {/* ── STEP 2: Description + Location ──────────────────────── */}
        {step === 2 && (
          <>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Issue title</label>
              <input
                type="text"
                placeholder="e.g. Large pothole on main road"
                value={form.title}
                onChange={e => update("title", e.target.value)}
                maxLength={100}
                style={inputStyle}
              />
              <div style={{ fontSize: 11, color: "#aaa", textAlign: "right", marginTop: 3 }}>
                {form.title.length}/100
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Describe the issue</label>
              <textarea
                placeholder="Give as much detail as possible — size, exact spot, how long it's been there..."
                value={form.description}
                onChange={e => update("description", e.target.value)}
                rows={4}
                style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Location / address</label>
              <input
                type="text"
                placeholder="e.g. 14th Road, near Andheri signal"
                value={form.address}
                onChange={e => update("address", e.target.value)}
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Your ward</label>
              <input
                type="text"
                value={form.ward}
                onChange={e => update("ward", e.target.value)}
                style={inputStyle}
              />
            </div>

            {/* Photo upload note — full upload comes after we set up storage */}
            <div style={{ border: "1px dashed #ccc", borderRadius: 10, padding: "20px",
                          textAlign: "center", color: "#aaa", marginBottom: 20 }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>📷</div>
              <div style={{ fontSize: 13 }}>Photo upload coming in the next step</div>
            </div>
          </>
        )}

        {/* ── STEP 3: Review + Submit ──────────────────────────────── */}
        {step === 3 && (
          <>
            <div style={{ background: "#fff", borderRadius: 12, border: "0.5px solid #e8e8e8",
                          padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: "#aaa", textTransform: "uppercase",
                            letterSpacing: "0.05em", marginBottom: 12 }}>
                Review your ticket
              </div>
              {[
                { label: "Category",    value: `${CATEGORIES.find(c => c.id === form.category)?.icon} ${CATEGORIES.find(c => c.id === form.category)?.label}` },
                { label: "Severity",    value: SEVERITIES.find(s => s.id === form.severity)?.label },
                { label: "Title",       value: form.title },
                { label: "Location",    value: form.address },
                { label: "Ward",        value: form.ward },
                { label: "SLA",         value: `${slaDays} days to resolve` },
              ].map(row => (
                <div key={row.label} style={{ display: "flex", gap: 10, marginBottom: 10,
                                              paddingBottom: 10, borderBottom: "0.5px solid #f0f0f0" }}>
                  <div style={{ fontSize: 13, color: "#888", width: 80, flexShrink: 0 }}>{row.label}</div>
                  <div style={{ fontSize: 13, color: "#1a1a1a", fontWeight: 500, flex: 1 }}>{row.value}</div>
                </div>
              ))}
            </div>

            <div style={{ background: "#f7f7f5", borderRadius: 8, padding: "10px 14px",
                          fontSize: 12, color: "#888", marginBottom: 20 }}>
              🔒 Your details are shared only with the assigned ward officer.
            </div>
          </>
        )}

        {/* Error message */}
        {error && (
          <div style={{ background: "#FCEBEB", color: "#791F1F", padding: "10px 14px",
                        borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}

        {/* Navigation buttons */}
        {step < 3 ? (
          <button onClick={nextStep} style={primaryBtn}>
            Continue →
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={loading} style={primaryBtn}>
            {loading ? "Submitting..." : "Submit ticket ✓"}
          </button>
        )}

        {step > 1 && (
          <button onClick={() => setStep(s => s - 1)}
            style={{ width: "100%", padding: 12, background: "none", border: "0.5px solid #ddd",
                     borderRadius: 10, fontSize: 14, color: "#666", marginTop: 8 }}>
            ← Back
          </button>
        )}
      </div>
    </div>
  );
}

// Shared styles
const sectionLabel = {
  fontSize: 11, fontWeight: 600, color: "#aaa",
  letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 10,
};
const labelStyle = {
  display: "block", fontSize: 13, color: "#555", marginBottom: 6,
};
const inputStyle = {
  width: "100%", padding: "11px 14px", borderRadius: 8, fontSize: 14,
  border: "1px solid #ddd", outline: "none", background: "#fff",
};
const primaryBtn = {
  width: "100%", padding: 13, background: "#185FA5", color: "#fff",
  border: "none", borderRadius: 10, fontSize: 15, fontWeight: 500,
};