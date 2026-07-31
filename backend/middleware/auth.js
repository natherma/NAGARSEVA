import jwt from "jsonwebtoken";
import User from "../models/User.js";

// This function runs before protected routes
// It checks if the request has a valid token
const protect = async (req, res, next) => {
  let token;

  // Tokens are sent in the Authorization header like:
  // "Bearer eyJhbGci..."
  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ message: "Not logged in. Please log in to continue." });
  }

  try {
    // Verify the token is real and not expired
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the user to the request object
    // Now any route after this can access req.user
    req.user = await User.findById(decoded.id);

    next(); // move on to the actual route
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token. Please log in again." });
  }
};

// Extra middleware — only allows officers through
const officerOnly = (req, res, next) => {
  if (req.user?.role !== "officer" && req.user?.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Officers only." });
  }
  next();
};

export { protect, officerOnly };