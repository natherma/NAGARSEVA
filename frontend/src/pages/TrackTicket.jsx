import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";

const STATUS = {
  open:        { label: "Open",        color: "#0C447C", bg: "#E6F1FB" },
  in_progress: { label: "In progress", color: "#633806", bg: "#FAEEDA" },
  resolved:    { label: "Resolved",    color: "#27500A", bg: "#EAF3DE" },
  closed:      { label: "Closed",      color: "#27500A", bg: "#EAF3DE" },
  escalated:   { label: "Escalated",   color: "#791F1F", bg: "#FCEBEB" },
};

export default function TrackTicket() {
  const navigate        = useNavigate();
  const [query, setQuery]   = useState("");
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setTicket(null);
    try {
      const res = await api.get(`/tickets/${query.trim()}`);
      setTicket(res.data.ticket);
    } catch {
      setError("No ticket found with that ID. Check the ID and try again.");
    } finally {
      setLoading(false);
    }
  }

  const status = ticket ? (STATUS[ticket.status] || STATUS.open) : null;

  return (
    <div style={{ minHeight: "100vh", padding: "40px 24px", maxWidth: 480, margin: "0 auto" }}>

      <Link to="/login" style={{ fontSize: 13, color: "#185FA5" }}>← Back to login</Link>

      <div style={{ textAlign: "center", margin: "32px 0 28px" }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>🔍</div>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Track a ticket</h1>
        <p style={{ fontSize: 14, color: "#888", marginTop: 6 }}>
          Enter your ticket ID to see its current status
        </p>
      </div>

      <form onSubmit={handleSearch} style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="e.g. MUM-2026-84947"
          style={{ flex: 1, padding: "12px 14px", borderRadius: 8, fontSize: 14,
                   border: "1px solid #ddd", outline: "none" }}
        />
        <button type="submit" disabled={loading}
          style={{ padding: "12px 18px", background: "#185FA5", color: "#fff",
                   border: "none", borderRadius: 8, fontSize: 14, fontWeight: 500 }}>
          {loading ? "..." : "Search"}
        </button>
      </form>

      {error && (
        <div style={{ background: "#FCEBEB", color: "#791F1F", padding: "12px 14px",
                      borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {ticket && (
        <div style={{ background: "#fff", borderRadius: 12, border: "0.5px solid #e8e8e8", padding: 16 }}>
          <div style={{ fontSize: 11, fontFamily: "monospace", color: "#aaa", marginBottom: 6 }}>
            {ticket.ticketId}
          </div>
          <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 10 }}>{ticket.title}</div>

          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 999,
                           fontSize: 12, fontWeight: 500,
                           background: status.bg, color: status.color }}>
              {status.label}
            </span>
          </div>

          {[
            { label: "Ward",    value: ticket.ward },
            { label: "Officer", value: ticket.assignedOfficerName || "Pending" },
            { label: "SLA due", value: new Date(ticket.slaDeadline).toLocaleDateString("en-IN") },
          ].map(row => (
            <div key={row.label} style={{ display: "flex", gap: 12, marginBottom: 8 }}>
              <div style={{ fontSize: 13, color: "#888", width: 64, flexShrink: 0 }}>{row.label}</div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{row.value}</div>
            </div>
          ))}

          {/* Timeline */}
          {ticket.timeline?.length > 0 && (
            <>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#aaa", letterSpacing: "0.05em",
                            textTransform: "uppercase", margin: "16px 0 10px" }}>
                Activity
              </div>
              <div style={{ paddingLeft: 14, borderLeft: "2px solid #e8e8e8" }}>
                {[...ticket.timeline].reverse().map((entry, i) => (
                  <div key={i} style={{ position: "relative", paddingLeft: 12, marginBottom: 14 }}>
                    <div style={{ position: "absolute", left: -19, top: 4, width: 8, height: 8,
                                  borderRadius: "50%", background: "#185FA5", border: "2px solid #fff" }} />
                    <div style={{ fontSize: 11, color: "#aaa" }}>
                      {new Date(entry.at).toLocaleDateString("en-IN")} · {entry.byLabel}
                    </div>
                    <div style={{ fontSize: 13, color: "#1a1a1a", marginTop: 2 }}>{entry.message}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}