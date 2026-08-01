import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

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

function SlaBar({ raisedAt, slaDeadline, slaDays, resolvedAt }) {
  const now      = resolvedAt ? new Date(resolvedAt) : new Date();
  const raised   = new Date(raisedAt);
  const deadline = new Date(slaDeadline);
  const totalMs  = deadline - raised;
  const elapsed  = now - raised;
  const pct      = Math.min(100, Math.max(0, Math.round((elapsed / totalMs) * 100)));
  const daysLeft = Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24));
  const breached = new Date() > deadline && !resolvedAt;
  const color    = pct > 80 ? "#E24B4A" : pct > 55 ? "#EF9F27" : "#639922";
  const txtColor = pct > 80 ? "#791F1F" : pct > 55 ? "#854F0B" : "#3B6D11";

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12,
                    color: "#888", marginBottom: 6 }}>
        <span>SLA: {slaDays} days</span>
        <span style={{ color: txtColor, fontWeight: 500 }}>
          {breached ? "⚠ SLA breached" : resolvedAt ? "✓ Resolved on time" : `${daysLeft} day${daysLeft !== 1 ? "s" : ""} left`}
        </span>
      </div>
      <div style={{ height: 6, background: "#eee", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 3 }} />
      </div>
    </div>
  );
}

function Timeline({ entries }) {
  return (
    <div style={{ paddingLeft: 16, borderLeft: "2px solid #e8e8e8" }}>
      {[...entries].reverse().map((entry, i) => (
        <div key={i} style={{ position: "relative", paddingLeft: 14, marginBottom: 18 }}>
          {/* Dot on the timeline line */}
          <div style={{
            position: "absolute", left: -21, top: 4,
            width: 10, height: 10, borderRadius: "50%",
            background: entry.by === "system" ? "#ccc" : entry.by === "officer" ? "#185FA5" : "#1D9E75",
            border: "2px solid #fff",
          }} />
          <div style={{ fontSize: 11, color: "#aaa", marginBottom: 3 }}>
            {formatDate(entry.at)} · {entry.byLabel || entry.by}
          </div>
          <div style={{ fontSize: 14, color: "#1a1a1a" }}>{entry.message}</div>
        </div>
      ))}
    </div>
  );
}

function RatingWidget({ ticketId, onRated }) {
  const [rating, setRating]   = useState(0);
  const [hover, setHover]     = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);

  async function submitRating() {
    if (!rating) return;
    setLoading(true);
    try {
      await api.post(`/tickets/${ticketId}/rate`, { rating, comment });
      setDone(true);
      onRated();
    } catch (err) {
      alert(err.response?.data?.message || "Could not submit rating.");
    } finally {
      setLoading(false);
    }
  }

  if (done) return (
    <div style={{ background: "#EAF3DE", borderRadius: 10, padding: "14px 16px",
                  textAlign: "center", color: "#27500A", fontSize: 14, fontWeight: 500 }}>
      ✓ Thank you for your feedback!
    </div>
  );

  return (
    <div style={{ background: "#fff", borderRadius: 12, border: "0.5px solid #e8e8e8", padding: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 12 }}>
        Rate your experience
      </div>
      {/* Star rating */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {[1, 2, 3, 4, 5].map(star => (
          <button key={star}
            onClick={() => setRating(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            style={{ background: "none", border: "none", fontSize: 28, cursor: "pointer",
                     color: star <= (hover || rating) ? "#EF9F27" : "#ddd" }}>
            ★
          </button>
        ))}
      </div>
      <textarea
        placeholder="Optional comment — what went well or could be better?"
        value={comment}
        onChange={e => setComment(e.target.value)}
        rows={2}
        style={{ width: "100%", padding: "10px 12px", borderRadius: 8, fontSize: 13,
                 border: "1px solid #ddd", outline: "none", resize: "none",
                 fontFamily: "inherit", marginBottom: 10, boxSizing: "border-box" }}
      />
      <button onClick={submitRating} disabled={!rating || loading}
        style={{ width: "100%", padding: 11, background: rating ? "#185FA5" : "#ccc",
                 color: "#fff", border: "none", borderRadius: 8, fontSize: 14,
                 fontWeight: 500, cursor: rating ? "pointer" : "not-allowed" }}>
        {loading ? "Submitting..." : "Submit rating"}
      </button>
    </div>
  );
}

export default function TicketDetail() {
  const { id }       = useParams();   // gets the :id from the URL
  const navigate     = useNavigate();
  const { user }     = useAuth();
  const [ticket, setTicket]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [closing, setClosing]       = useState(false);
  const [closeReason, setCloseReason] = useState("");
  const [showCloseForm, setShowCloseForm] = useState(false);
  const [closeError, setCloseError] = useState("");

  // Fetch ticket on load — refetch() is also called after rating
  async function fetchTicket() {
    try {
      const res = await api.get(`/tickets/${id}`);
      setTicket(res.data.ticket);
    } catch (err) {
      setError("Ticket not found.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchTicket(); }, [id]);

  if (loading) return (
    <div style={{ padding: 40, textAlign: "center", color: "#aaa" }}>Loading ticket...</div>
  );

  if (error || !ticket) return (
    <div style={{ padding: 24 }}>
      <button onClick={() => navigate("/")} style={backBtn}>← Back</button>
      <div style={{ background: "#FCEBEB", color: "#791F1F", padding: 16,
                    borderRadius: 8, marginTop: 16 }}>{error || "Ticket not found."}</div>
    </div>
  );

  const status   = STATUS[ticket.status]     || STATUS.open;
  const severity = SEVERITY[ticket.severity] || SEVERITY.medium;
  const isResolved = ticket.status === "resolved" || ticket.status === "closed";
  const canRate    = isResolved && !ticket.rating;
  
    async function handleCitizenClose(e) {
    e.preventDefault();
    if (!closeReason.trim()) return setCloseError("Please give a reason.");
    setClosing(true);
    try {
      await api.patch(`/tickets/${ticket._id}/citizen-close`, { reason: closeReason });
      setShowCloseForm(false);
      fetchTicket();
    } catch (err) {
      setCloseError(err.response?.data?.message || "Could not close ticket.");
    } finally {
      setClosing(false);
    }
  }
  return (
    <div style={{ maxWidth: 480, margin: "0 auto" }}>

      {/* Top bar */}
      <div style={{ background: "#fff", padding: "14px 16px",
                    borderBottom: "0.5px solid #e8e8e8", display: "flex",
                    alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 10 }}>
        <button onClick={() => navigate("/")} style={{ background: "none", border: "none",
                                                        fontSize: 22, color: "#666", padding: 0 }}>←</button>
        <div style={{ flex: 1, fontSize: 16, fontWeight: 500 }}>Ticket detail</div>
        <div style={{ fontSize: 11, fontFamily: "monospace", color: "#aaa" }}>{ticket.ticketId}</div>
      </div>

      <div style={{ padding: 16 }}>

        {/* Title + badges */}
        <div style={{ background: "#fff", borderRadius: 12, border: "0.5px solid #e8e8e8",
                      padding: 16, marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: "#aaa", marginBottom: 4 }}>
            {CATEGORY_ICON[ticket.category]} {ticket.category}
          </div>
          <div style={{ fontSize: 18, fontWeight: 600, color: "#1a1a1a", marginBottom: 10 }}>
            {ticket.title}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
            <span style={{ ...badge, background: status.bg,   color: status.color }}>
              {status.label}
            </span>
            <span style={{ ...badge, background: severity.bg, color: severity.color }}>
              {severity.label}
            </span>
            {ticket.isEscalated && (
              <span style={{ ...badge, background: "#FCEBEB", color: "#791F1F" }}>
                ⚠ Escalated
              </span>
            )}
          </div>
          <SlaBar
            raisedAt={ticket.createdAt}
            slaDeadline={ticket.slaDeadline}
            slaDays={ticket.slaDays}
            resolvedAt={ticket.resolvedAt}
          />
        </div>

        {/* Details table */}
        <div style={{ background: "#fff", borderRadius: 12, border: "0.5px solid #e8e8e8",
                      padding: 16, marginBottom: 12 }}>
          {[
            { label: "Location", value: ticket.location?.address },
            { label: "Ward",     value: ticket.ward },
            { label: "Officer",  value: ticket.assignedOfficerName || "Pending assignment" },
            { label: "SLA due",  value: formatDate(ticket.slaDeadline) },
            { label: "Raised",   value: formatDate(ticket.createdAt) },
          ].map(row => (
            <div key={row.label} style={{ display: "flex", gap: 12, paddingBottom: 10,
                                          marginBottom: 10, borderBottom: "0.5px solid #f0f0f0" }}>
              <div style={{ fontSize: 13, color: "#888", width: 72, flexShrink: 0 }}>{row.label}</div>
              <div style={{ fontSize: 13, color: "#1a1a1a", fontWeight: 500, flex: 1 }}>{row.value || "—"}</div>
            </div>
          ))}
          {/* Description — last row, no border */}
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ fontSize: 13, color: "#888", width: 72, flexShrink: 0 }}>Details</div>
            <div style={{ fontSize: 13, color: "#555", flex: 1, lineHeight: 1.5 }}>{ticket.description}</div>
          </div>
        </div>

        {/* Rating widget — only shown when resolved and not yet rated */}
        {canRate && (
          <div style={{ marginBottom: 12 }}>
            <RatingWidget ticketId={ticket._id} onRated={fetchTicket} />
          </div>
        )}

        {/* Existing rating */}
        {ticket.rating && (
          <div style={{ background: "#fff", borderRadius: 12, border: "0.5px solid #e8e8e8",
                        padding: 16, marginBottom: 12 }}>
            <div style={{ fontSize: 13, color: "#888", marginBottom: 6 }}>Your rating</div>
            <div style={{ display: "flex", gap: 3, marginBottom: 4 }}>
              {[1,2,3,4,5].map(s => (
                <span key={s} style={{ fontSize: 20, color: s <= ticket.rating ? "#EF9F27" : "#ddd" }}>★</span>
              ))}
            </div>
            {ticket.ratingComment && (
              <div style={{ fontSize: 13, color: "#666", fontStyle: "italic" }}>"{ticket.ratingComment}"</div>
            )}
          </div>
        )}

        {/* Citizen close option — only for open/in_progress tickets */}
{(ticket.status === "open" || ticket.status === "in_progress") && (
  <div style={{ marginBottom: 14 }}>
    {!showCloseForm ? (
      <button
        onClick={() => setShowCloseForm(true)}
        style={{ width: "100%", padding: 11, background: "#fff",
                 border: "1px solid #e0e0e0", borderRadius: 8,
                 fontSize: 13, color: "#888", cursor: "pointer" }}>
        Issue resolved on its own? Close this ticket
      </button>
    ) : (
      <div style={{ background: "#fff", borderRadius: 12,
                    border: "0.5px solid #e8e8e8", padding: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
          Close this ticket
        </div>
        <div style={{ fontSize: 12, color: "#888", marginBottom: 12 }}>
          Tell us why you're closing it — this helps the municipality understand what happened.
        </div>
        <form onSubmit={handleCitizenClose}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
            {[
              "Issue was fixed by the municipality",
              "Problem resolved on its own",
              "I raised this ticket by mistake",
              "Other reason",
            ].map(reason => (
              <button type="button" key={reason}
                onClick={() => setCloseReason(reason)}
                style={{
                  padding: "10px 14px", borderRadius: 8, border: "1.5px solid",
                  borderColor: closeReason === reason ? "#185FA5" : "#e8e8e8",
                  background: closeReason === reason ? "#E6F1FB" : "#fff",
                  color: closeReason === reason ? "#0C447C" : "#555",
                  fontSize: 13, textAlign: "left", cursor: "pointer",
                  fontWeight: closeReason === reason ? 600 : 400,
                }}>
                {closeReason === reason ? "✓ " : ""}{reason}
              </button>
            ))}
          </div>

          <textarea
            placeholder="Any additional notes? (optional)"
            value={closeReason.startsWith("Other") ? closeReason : ""}
            onChange={e => setCloseReason(e.target.value)}
            rows={2}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 8,
                     fontSize: 13, border: "1px solid #ddd", outline: "none",
                     resize: "none", fontFamily: "inherit", boxSizing: "border-box",
                     marginBottom: 10 }}
          />

          {closeError && (
            <div style={{ fontSize: 12, color: "#791F1F", marginBottom: 8 }}>{closeError}</div>
          )}

          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit" disabled={closing || !closeReason}
              style={{ flex: 1, padding: 11, background: closeReason ? "#185FA5" : "#ccc",
                       color: "#fff", border: "none", borderRadius: 8,
                       fontSize: 13, fontWeight: 500, cursor: closeReason ? "pointer" : "not-allowed" }}>
              {closing ? "Closing..." : "Confirm close"}
            </button>
            <button type="button" onClick={() => { setShowCloseForm(false); setCloseReason(""); setCloseError(""); }}
              style={{ flex: 1, padding: 11, background: "#f0f0f0", color: "#555",
                       border: "none", borderRadius: 8, fontSize: 13 }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    )}
  </div>
)}

        {/* Activity timeline */}
        <div style={{ fontSize: 11, fontWeight: 600, color: "#aaa",
                      letterSpacing: "0.05em", textTransform: "uppercase",
                      marginBottom: 12, marginTop: 4 }}>
          Activity timeline
        </div>
        {ticket.timeline?.length > 0
          ? <Timeline entries={ticket.timeline} />
          : <div style={{ color: "#aaa", fontSize: 13 }}>No activity yet.</div>
        }
      </div>
    </div>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const badge = {
  display: "inline-block", padding: "3px 10px",
  borderRadius: 999, fontSize: 12, fontWeight: 500,
};

const backBtn = {
  background: "none", border: "none", fontSize: 15,
  color: "#185FA5", cursor: "pointer", padding: 0,
};