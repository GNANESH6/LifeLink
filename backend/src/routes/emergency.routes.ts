/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from "express";
import { protect } from "../middleware/auth.middleware.js";
import { db } from "../config/db.js";

const router = Router();

// GET all active emergency requests
router.get("/", async (req: any, res) => {
  try {
    const lat = req.query.latitude ? parseFloat(req.query.latitude as string) : undefined;
    const lng = req.query.longitude ? parseFloat(req.query.longitude as string) : undefined;
    const radius = req.query.radius ? parseFloat(req.query.radius as string) : undefined;

    const list = await db.getAllEmergencyRequests(lat, lng, radius);
    res.json(list);
  } catch (error: any) {
    console.error("Get emergency requests route failed:", error);
    res.status(500).json({ message: "Server error retrieving emergency requests list" });
  }
});

// POST to create a localized emergency request
router.post("/", protect, async (req: any, res) => {
  try {
    const { bloodGroup, message, address, latitude, longitude } = req.body;

    if (!bloodGroup || !message || !address) {
      res.status(400).json({ message: "All elements (bloodGroup, message, address) must be filled." });
      return;
    }

    const latVal = latitude !== undefined ? parseFloat(latitude.toString()) : 0;
    const lngVal = longitude !== undefined ? parseFloat(longitude.toString()) : 0;

    // Fetch user details
    const user = await db.findUserById(req.user.id);
    if (!user) {
      res.status(404).json({ message: "Authenticated user not found in storage" });
      return;
    }

    const newReq = await db.createEmergencyRequest({
      userId: req.user.id,
      userName: req.user.name,
      userPhone: user.phone || "+1-555-0100",
      bloodGroup,
      message,
      address,
      location: {
        type: "Point",
        coordinates: [lngVal, latVal]
      }
    });

    res.status(201).json({
      message: "Emergency broadcast successfully active!",
      emergencyRequest: newReq
    });
  } catch (error: any) {
    console.error("Create emergency request failed:", error);
    res.status(500).json({ message: "Server error publishing emergency request broadcast" });
  }
});

// DELETE / Close emergency request
router.delete("/:id", protect, async (req: any, res) => {
  try {
    const closed = await db.closeEmergencyRequest(req.params.id, req.user.id);
    if (!closed) {
      res.status(400).json({ message: "Emergency request could not be closed. Verify owner permissions." });
      return;
    }

    res.json({ message: "Emergency request closed successfully." });
  } catch (error: any) {
    console.error("Close emergency request failed:", error);
    res.status(500).json({ message: "Server error closing request" });
  }
});

export default router;
