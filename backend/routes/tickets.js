import express from "express";
import Ticket from "../models/Ticket.js";
import { protect, officerOnly } from "../middleware/auth.js";

const router = express.Router();

// ─── SLA MATRIX ──────────────────────────────────────────────────────────────
const SLA_MATRIX = {
  roads:        { high: 7,  medium: 14, low: 21 },
  water:        { high: 2,  medium: 5,  low: 10 },
  sanitation:   { high: 1,  medium: 3,  low: 7  },
  lights:       { high: 3,  medium: 7,  low: 14 },
  parks:        { high: 5,  medium: 10, low: 21 },
  encroachment: { high: 7,  medium: 14, low: 30 },
};

function calcSla(category, severity) {
  const days = SLA_MATRIX[category]?.[severity] ?? 7;
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + days);
  return { slaDays: days, slaDeadline: deadline };
}

function generateTicketId() {
  const year = new Date().getFullYear();
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `MUM-${year}-${rand}`;
}

// ─── CREATE TICKET ────────────────────────────────────────────────────────────
// POST /api/tickets
// Must be logged in (protect middleware)
router.post("/", protect, async (req, res) => {
  try {
    const { title, description, category, severity, ward, location } = req.body;

    const { slaDays, slaDeadline } = calcSla(category, severity);

    const ticket = await Ticket.create({
      ticketId: generateTicketId(),
      citizen: req.user._id,         // comes from the JWT token via protect middleware
      title,
      description,
      category,
      severity,
      ward,
      location,
      slaDays,
      slaDeadline,
      photos: req.body.photos || [],
      timeline: [
        {
          message: "Ticket raised successfully.",
          by: "system",
          byLabel: "System",
        },
      ],
    });

    res.status(201).json({
      message: "Ticket raised successfully!",
      ticket,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── MY TICKETS ───────────────────────────────────────────────────────────────
// GET /api/tickets/my
// Returns only tickets belonging to the logged-in citizen
router.get("/my", protect, async (req, res) => {
  try {
    const tickets = await Ticket.find({ citizen: req.user._id })
      .sort({ createdAt: -1 });   // newest first

    res.json({ tickets });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── PUBLIC WARD FEED ─────────────────────────────────────────────────────────
// GET /api/tickets/ward/:ward
// Public — no login needed. Strips private citizen info.
router.get("/ward/:ward", async (req, res) => {
  try {
    const tickets = await Ticket.find({ ward: req.params.ward })
      .sort({ createdAt: -1 })
      .select("-citizen -description")   // hide citizen identity + full description
      .limit(50);

    // Ward stats
    const all = await Ticket.find({ ward: req.params.ward });
    const total = all.length;
    const resolved = all.filter(t =>
      t.status === "closed" || t.status === "resolved"
    ).length;
    const onTime = all.filter(t => {
      if (!t.resolvedAt) return false;
      return new Date(t.resolvedAt) <= new Date(t.slaDeadline);
    }).length;

    res.json({
      tickets,
      stats: {
        total,
        open: all.filter(t => t.status === "open").length,
        resolved,
        onTimeRate: resolved > 0 ? Math.round((onTime / resolved) * 100) : 0,
      },
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── GET ONE TICKET (public tracker) ─────────────────────────────────────────
// GET /api/tickets/:id
// Works by MongoDB _id OR by ticketId string like MUM-2024-12345
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Try ticketId first (e.g. MUM-2026-12345), then MongoDB _id
    const ticket = await Ticket.findOne({ ticketId: id })
      || await Ticket.findById(id).catch(() => null);

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found." });
    }

    // Hide citizen identity from public
    const { citizen, ...publicTicket } = ticket.toObject();
    res.json({ ticket: publicTicket });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── OFFICER UPDATE TICKET ────────────────────────────────────────────────────
// PATCH /api/tickets/:id
// Officers only — updates status and adds a timeline entry
router.patch("/:id", protect, officerOnly, async (req, res) => {
  try {
    const { status, note } = req.body;

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found." });

    // Update status
    ticket.status = status;
    ticket.assignedOfficer = req.user._id;
    ticket.assignedOfficerName = req.user.name;

    // Mark resolved time if closing
    if (status === "closed" || status === "resolved") {
      ticket.resolvedAt = new Date();
    }

    // Add to timeline
    ticket.timeline.push({
      message: note,
      by: "officer",
      byLabel: req.user.name,
      at: new Date(),
    });

    // Auto-escalate if SLA breached
    if (new Date() > new Date(ticket.slaDeadline) && status !== "closed") {
      ticket.isEscalated = true;
      ticket.escalationReason = "SLA deadline exceeded.";
      ticket.status = "escalated";
      ticket.timeline.push({
        message: "SLA breached. Ticket auto-escalated.",
        by: "system",
        byLabel: "System",
      });
    }

    await ticket.save();
    res.json({ message: "Ticket updated.", ticket });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── CITIZEN RATES TICKET ─────────────────────────────────────────────────────
// POST /api/tickets/:id/rate
router.post("/:id/rate", protect, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) return res.status(404).json({ message: "Ticket not found." });

    // Only the citizen who raised it can rate
    if (ticket.citizen.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only rate your own tickets." });
    }

    if (ticket.status !== "resolved" && ticket.status !== "closed") {
      return res.status(400).json({ message: "Can only rate resolved tickets." });
    }

    ticket.rating = rating;
    ticket.ratingComment = comment;

    // Low rating re-opens for review
    if (rating <= 2) {
      ticket.status = "in_progress";
      ticket.isEscalated = true;
      ticket.escalationReason = `Citizen rated ${rating}/5. Flagged for supervisor review.`;
      ticket.timeline.push({
        message: `Citizen rated ${rating}/5 — "${comment}". Reopened for review.`,
        by: "system",
        byLabel: "System",
      });
    }

    await ticket.save();
    res.json({ message: "Thank you for your feedback!", ticket });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/tickets/:id/citizen-close
router.patch("/:id/citizen-close", protect, async (req, res) => {
  try {
    const { reason } = req.body;
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) return res.status(404).json({ message: "Ticket not found." });

    // Only the citizen who raised it can close it
    if (ticket.citizen.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only close your own tickets." });
    }

    if (ticket.status === "closed") {
      return res.status(400).json({ message: "Ticket is already closed." });
    }

    ticket.status    = "closed";
    ticket.resolvedAt = new Date();
    ticket.timeline.push({
      message: `Citizen closed the ticket. Reason: ${reason}`,
      by:      "citizen",
      byLabel: "You",
      at:      new Date(),
    });

    await ticket.save();
    res.json({ message: "Ticket closed.", ticket });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
export default router;