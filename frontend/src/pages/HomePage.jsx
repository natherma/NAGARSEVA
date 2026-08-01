import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import TicketCard from "../components/TicketCard";
import api from "../api/axios";

export default function HomePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");

  // useEffect runs after the component appears on screen
  // The empty [] means it only runs once — when the page loads
  useEffect(() => {
    async function fetchTickets() {
      try {
        const res = await api.get("/tickets/my");
        setTickets(res.data.tickets);
      } catch (err) {
        setError("Could not load tickets. Is the backend running?");
      } finally {
        setLoading(false);
      }
    }
    fetchTickets();
  }, []);

  const open     = tickets.filter(t => t.status === "open").length;
  const active   = tickets.filter(t => t.status === "in_progress").length;
  const resolved = tickets.filter(t => t.status === "closed" || t.status === "resolved").length;

  return (
    <div style={{ padding: "0 0 16px" }}>

      {/* Header */}
      <div style={{ background: "#fff", padding: "20px 20px 16px",
                    borderBottom: "0.5px solid #e8e8e8", marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: "#888" }}>Nagar Seva · {user?.ward}</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>Hello, {user?.name?.split(" ")[0]} 👋</h1>
          <button onClick={logout} style={{ background: "none", border: "none",
                                            fontSize: 12, color: "#aaa", padding: 4 }}>
            Log out
          </button>
        </div>
      </div>

      <div style={{ padding: "0 16px" }}>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 20 }}>
          {[
            { label: "Open",     value: open,     color: "#0C447C" },
            { label: "Active",   value: active,   color: "#633806" },
            { label: "Resolved", value: resolved, color: "#27500A" },
          ].map(s => (
            <div key={s.label} style={{ background: "#fff", borderRadius: 10,
                                        padding: "12px 10px", border: "0.5px solid #e8e8e8", textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 600, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Raise button */}
        <button
          onClick={() => navigate("/raise")}
          style={{ width: "100%", padding: 13, background: "#185FA5", color: "#fff",
                   border: "none", borderRadius: 10, fontSize: 15, fontWeight: 500, marginBottom: 20 }}>
          ➕ Raise a new ticket
        </button>

        {/* Tickets list */}
        <div style={{ fontSize: 11, fontWeight: 600, color: "#aaa",
                      letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 10 }}>
          My tickets
        </div>

        {loading && (
          <div style={{ textAlign: "center", padding: 40, color: "#aaa" }}>Loading your tickets...</div>
        )}

        {error && (
          <div style={{ background: "#FCEBEB", color: "#791F1F", padding: "12px 14px",
                        borderRadius: 8, fontSize: 13 }}>
            {error}
          </div>
        )}

        {!loading && !error && tickets.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 24px", color: "#aaa" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
            <p style={{ fontWeight: 500, color: "#666", marginBottom: 6 }}>No tickets yet</p>
            <p style={{ fontSize: 13 }}>Raise your first ticket and track it here</p>
          </div>
        )}

        {tickets.map(ticket => (
          <TicketCard key={ticket._id} ticket={ticket} />
        ))}
      </div>
    </div>
  );
}