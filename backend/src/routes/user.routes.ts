/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from "express";
import { getProfile, updateProfile, getNearbyDonors, searchDonors, getStats } from "../controllers/user.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/stats", getStats);
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.get("/nearby", protect, getNearbyDonors);
router.get("/search", protect, searchDonors);

export default router;
