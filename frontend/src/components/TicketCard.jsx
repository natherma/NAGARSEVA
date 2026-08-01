import { useNavigate } from "react-router-dom";

const STATUS = {
  open:        { label: "Open",        color: "#0C447C", bg: "#E6F1FB" },
  in_progress: { label: "In progress", color: "#633806", bg: "#FAEEDA" },
  resolved:    { label: "Resolved",    color: "#27500A", bg: "#EAF3DE" },
  closed:      { label: "Closed",      color: "#27500A", bg: "#EAF3DE" },
  escalated:   { label: "Escalated",   color: "#791F1F", bg: "#FCEBEB" },
};

const SEVERITY = {
  high:   { label: "High",   color: "#791F1F", bg: "#FCEBEB" },
  medium: { label: "Medium", color: "#633806", bg: "#FAEEDA" },
  low:    { label: "Low",    color: "#27500A", bg: "#EAF3DE" },
};

const CATEGORY_ICON = {
  roads: "🛣️", water: "💧", sanitation: "🗑️",
  lights: "💡", parks: "🌳", encroachment: "🏗️",
};

// SLA bar — shows how much time has passed vs the deadline
function SlaBar({ raisedAt, slaDeadline, slaDays, resolvedAt }) {
  const now      = resolvedAt ? new Date(resolvedAt) : new Date();
  const raised   = new Date(raisedAt);
  const deadline = new Date(slaDeadline);

  const totalMs   = deadline - raised;
  const elapsedMs = now - raised;
  const pct       = Math.min(100, Math.max(0, Math.round((elapsedMs / totalMs) * 100)));
  const daysLeft  = Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24));
  const breached  = new Date() > deadline && !resolvedAt;

  const color = pct > 80 ? "#E24B4A" : pct > 55 ? "#EF9F27" : "#639922";
  const textColor = pct > 80 ? "#791F1F" : pct > 55 ? "#854F0B" : "#3B6D11";

  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#999", marginBottom: 4 }}>
        <span>SLA: {slaDays} days</span>
        <span style={{ color: textColor, fontWeight: 500 }}>
          {breached ? "⚠ SLA breached" : resolvedAt ? "✓ Resolved" : `${daysLeft}d left`}
        </span>
      </div>
      <div style={{ height: 5, background: "#eee", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 3 }} />
      </div>
    </div>
  );
}

export default function TicketCard({ ticket }) {
  const navigate = useNavigate();
  const status   = STATUS[ticket.status]   || STATUS.open;
  const severity = SEVERITY[ticket.severity] || SEVERITY.medium;

  return (
    <div
      onClick={() => navigate(`/ticket/${ticket._id}`)}
      style={{
        background: "#fff", border: "0.5px solid #e8e8e8",
        borderRadius: 12, padding: "14px 16px", marginBottom: 10,
        cursor: "pointer", transition: "box-shadow 0.15s",
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.08)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
    >
      {/* Top row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: "#aaa", fontFamily: "monospace", marginBottom: 3 }}>
            {CATEGORY_ICON[ticket.category]} {ticket.ticketId}
          </div>
          <div style={{ fontSize: 15, fontWeight: 500, color: "#1a1a1a",
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {ticket.title}
          </div>
          <div style={{ fontSize: 12, color: "#888", marginTop: 3 }}>
            {ticket.ward} · {daysAgo(ticket.createdAt)}
          </div>
        </div>

        {/* Badges */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end", flexShrink: 0 }}>
          <span style={{ ...badgeStyle, background: status.bg, color: status.color }}>
            {status.label}
          </span>
          <span style={{ ...badgeStyle, background: severity.bg, color: severity.color }}>
            {severity.label}
          </span>
        </div>
      </div>

      <SlaBar
        raisedAt={ticket.createdAt}
        slaDeadline={ticket.slaDeadline}
        slaDays={ticket.slaDays}
        resolvedAt={ticket.resolvedAt}
      />
    </div>
  );
}

function daysAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

const badgeStyle = {
  display: "inline-block", padding: "3px 10px",
  borderRadius: 999, fontSize: 11, fontWeight: 500,
};