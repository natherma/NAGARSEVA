import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name:       { type: String, required: true, trim: true },
    phone:      { type: String, required: true, unique: true },
    email:      { type: String, trim: true, lowercase: true },
    role:       { type: String, enum: ["citizen", "officer", "admin"], default: "citizen" },
    ward:       { type: String, required: true },
    city:       { type: String, default: "Mumbai" },
    password:   { type: String, required: true, minlength: 6 },
    department: { type: String, default: null },
  },
  { timestamps: true }
);

// No pre-save hook — we'll hash in the route instead
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const User = mongoose.model("User", userSchema);
export default User;