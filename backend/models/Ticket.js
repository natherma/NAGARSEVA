import mongoose from "mongoose";

const timelineEntrySchema = new mongoose.Schema({
  message: { type: String, required: true },
  by:      { type: String, enum: ["citizen", "officer", "system"], default: "system" },
  byLabel: { type: String },
  at:      { type: Date, default: Date.now },
});

const ticketSchema = new mongoose.Schema(
  {
    ticketId:            { type: String, unique: true },
    citizen:             { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title:               { type: String, required: true, trim: true, maxlength: 100 },
    description:         { type: String, required: true, trim: true },
    category:            { type: String, required: true, enum: ["roads", "water", "sanitation", "lights", "parks", "encroachment"] },
    severity:            { type: String, required: true, enum: ["high", "medium", "low"], default: "medium" },
    ward:                { type: String, required: true },
    location: {
      address:     { type: String, required: true },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number },
      },
    },
    photos:              [{ type: String }],
    status:              { type: String, enum: ["open", "in_progress", "resolved", "closed", "escalated"], default: "open" },
    slaDays:             { type: Number, required: true },
    slaDeadline:         { type: Date, required: true },
    resolvedAt:          { type: Date, default: null },
    assignedOfficer:     { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    assignedOfficerName: { type: String, default: null },
    isEscalated:         { type: Boolean, default: false },
    escalationReason:    { type: String, default: null },
    followUpAdded:       { type: Boolean, default: false },
    rating:              { type: Number, min: 1, max: 5, default: null },
    ratingComment:       { type: String, default: null },
    timeline:            [timelineEntrySchema],
  },
  { timestamps: true }
);

const Ticket = mongoose.model("Ticket", ticketSchema);
export default Ticket;