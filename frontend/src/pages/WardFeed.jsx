import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

const CATEGORY_ICON = {
  roads: "🛣️", water: "💧", sanitation: "🗑️",
  lights: "💡", parks: "🌳", encroachment: "🏗️",
};

const STATUS = {
  open:        { label: "Open",        color: "#0C447C", bg: "#E6F1FB" },
  in_progress: { label: "In progress", color: "#633806", bg: "#FAEEDA" },
  resolved:    { label: "Resolved",    color: "#27500A", bg: "#EAF3DE" },
  closed:      { label: "Closed",      color: "#27500A", bg: "#EAF3DE" },
  escalated:   { label: "Escalated",   color: "#791F1F", bg: "#FCEBEB" },
};

export default function WardFeed() {
  const { user } = useAuth();
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [filter, setFilter]     = useState("all");  // filter by status

  useEffect(() => {
    async function fetchWard() {
      try {
        // encode the ward name in case it has spaces
        const ward = encodeURIComponent(user?.ward || "Ward 74");
        const res  = await api.get(`/tickets/ward/${ward}`);
        setData(res.data);
      } catch (err) {
        setError("Could not load ward data.");
      } finally {
        setLoading(false);
      }
    }
    fetchWard();
  }, [user]);

  const tickets = data?.tickets || [];
  const stats   = data?.stats   || {};

  // Apply filter
  const filtered = filter === "all"
    ? tickets
    : tickets.filter(t => t.status === filter);

  return (
    <div style={{ maxWidth: 480, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ background: "#fff", padding: "20px 20px 16px",
                    borderBottom: "0.5px solid #e8e8e8", marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: "#888" }}>Public feed</div>
        <h1 style={{ fontSize: 20, fontWeight: 600, marginTop: 4 }}>
          📍 {user?.ward}
        </h1>
      </div>

      <div style={{ padding: "0 16px" }}>

        {/* Stats cards */}
        {!loading && !error && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
            <StatCard label="Total tickets"  value={stats.total    ?? 0} color="#1a1a1a" />
            <StatCard label="Open now"       value={stats.open     ?? 0} color="#0C447C" />
            <StatCard label="Resolved"       value={stats.resolved ?? 0} color="#27500A" />
            <StatCard label="On-time rate"
              value={stats.onTimeRate != null ? `${stats.onTimeRate}%` : "—"}
              color={stats.onTimeRate >= 80 ? "#27500A" : stats.onTimeRate >= 60 ? "#633806" : "#791F1F"}
            />
          </div>
        )}

        {/* On-time rate bar */}
        {!loading && stats.onTimeRate != null && (
          <div style={{ background: "#fff", borderRadius: 12, border: "0.5px solid #e8e8e8",
                        padding: 16, marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between",
                          fontSize: 13, marginBottom: 8 }}>
              <span style={{ fontWeight: 500 }}>SLA compliance</span>
              <span style={{ fontWeight: 600,
                             color: stats.onTimeRate >= 80 ? "#27500A" : "#791F1F" }}>
                {stats.onTimeRate}%
              </span>
            </div>
            <div style={{ height: 8, background: "#eee", borderRadius: 4, overflow: "hidden" }}>
              <div style={{
                width: `${stats.onTimeRate}%`, height: "100%", borderRadius: 4,
                background: stats.onTimeRate >= 80 ? "#639922" : stats.onTimeRate >= 60 ? "#EF9F27" : "#E24B4A",
                transition: "width 0.6s ease",
              }} />
            </div>
            <div style={{ fontSize: 11, color: "#aaa", marginTop: 6 }}>
              {stats.resolved} of {stats.total} tickets resolved on time
            </div>
          </div>
        )}

        {/* Filter chips */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4, marginBottom: 14 }}>
          {["all", "open", "in_progress", "resolved", "escalated"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{
                padding: "5px 14px", borderRadius: 999, border: "0.5px solid",
                borderColor: filter === f ? "#185FA5" : "#e0e0e0",
                background: filter === f ? "#E6F1FB" : "#fff",
                color: filter === f ? "#0C447C" : "#666",
                fontSize: 12, fontWeight: filter === f ? 600 : 400,
                whiteSpace: "nowrap", cursor: "pointer", flexShrink: 0,
              }}>
              {f === "all" ? "All" : f === "in_progress" ? "In progress" :
               f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Tickets */}
        {loading && (
          <div style={{ textAlign: "center", padding: 40, color: "#aaa" }}>
            Loading ward feed...
          </div>
        )}

        {error && (
          <div style={{ background: "#FCEBEB", color: "#791F1F", padding: "12px 14px",
                        borderRadius: 8, fontSize: 13 }}>
            {error}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "32px 24px", color: "#aaa" }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🏙️</div>
            <p style={{ fontWeight: 500, color: "#666", marginBottom: 4 }}>No tickets here</p>
            <p style={{ fontSize: 13 }}>
              {filter === "all" ? "Your ward has no tickets yet." : `No ${filter} tickets.`}
            </p>
          </div>
        )}

        {filtered.map(ticket => (
          <PublicTicketCard key={ticket._id} ticket={ticket} />
        ))}

        {/* Info note */}
        {!loading && (
          <div style={{ fontSize: 12, color: "#aaa", textAlign: "center",
                        padding: "16px 0 8px", lineHeight: 1.6 }}>
            Citizen names are hidden to protect privacy.
            <br />This is a public feed — anyone can view ward activity.
          </div>
        )}
      </div>
    </div>
  );
}

// Public ticket card — no citizen name, no description
function PublicTicketCard({ ticket }) {
  const status = STATUS[ticket.status] || STATUS.open;

  return (
    <div style={{ background: "#fff", borderRadius: 12, border: "0.5px solid #e8e8e8",
                  padding: "14px 16px", marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between",
                    alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: "#aaa", marginBottom: 3 }}>
            {CATEGORY_ICON[ticket.category]} {ticket.ticketId}
          </div>
          <div style={{ fontSize: 14, fontWeight: 500, color: "#1a1a1a",
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {ticket.title}
          </div>
          <div style={{ fontSize: 12, color: "#888", marginTop: 3 }}>
            📍 {ticket.location?.address || ticket.ward}
          </div>
        </div>
        <span style={{
          display: "inline-block", padding: "3px 10px", borderRadius: 999,
          fontSize: 11, fontWeight: 500, flexShrink: 0,
          background: status.bg, color: status.color,
        }}>
          {status.label}
        </span>
      </div>

      {/* SLA mini bar */}
      {ticket.slaDeadline && (
        <MiniSlaBar
          raisedAt={ticket.createdAt}
          slaDeadline={ticket.slaDeadline}
          resolvedAt={ticket.resolvedAt}
        />
      )}
    </div>
  );
}

function MiniSlaBar({ raisedAt, slaDeadline, resolvedAt }) {
  const now      = resolvedAt ? new Date(resolvedAt) : new Date();
  const raised   = new Date(raisedAt);
  const deadline = new Date(slaDeadline);
  const pct      = Math.min(100, Math.max(0, Math.round(((now - raised) / (deadline - raised)) * 100)));
  const color    = pct > 80 ? "#E24B4A" : pct > 55 ? "#EF9F27" : "#639922";

  return (
    <div style={{ height: 4, background: "#eee", borderRadius: 2, overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 2 }} />
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={{ background: "#fff", borderRadius: 10, border: "0.5px solid #e8e8e8",
                  padding: "14px 12px" }}>
      <div style={{ fontSize: 22, fontWeight: 600, color }}>{value}</div>
      <div style={{ fontSize: 11, color: "#999", marginTop: 3 }}>{label}</div>
    </div>
  );
}