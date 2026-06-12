/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";


// Load environment configurations
dotenv.config();

// Router imports
import authRoutes from "./src/routes/auth.routes.js";
import userRoutes from "./src/routes/user.routes.js";
import locationRoutes from "./src/routes/location.routes.js";
import emergencyRoutes from "./src/routes/emergency.routes.js";

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 5000;

  // Standard middleware configuration
  app.use(cors({
    origin: [
      "http://localhost:5173",
      "https://lifelink-w2d7.onrender.com"
    ]
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API router bindings
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/location", locationRoutes);
  app.use("/api/emergency", emergencyRoutes);

  // Serve Single Page Application static files (for production deployment)
  const distPath = path.join(process.cwd(), "../frontend/dist");
  app.use(express.static(distPath));
  // In development, the frontend runs on its own port and proxies API calls here.
  // In production, the backend serves the built frontend files.
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Critical: Failed to boot LifeLink Server:", error);
});
