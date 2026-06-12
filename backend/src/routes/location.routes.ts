/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from "express";
import { geocodeAddress, reverseGeocodeCoordinates, getBloodCenters } from "../controllers/location.controller.js";

const router = Router();

router.post("/geocode", geocodeAddress);
router.post("/reverse-geocode", reverseGeocodeCoordinates);
router.get("/blood-centers", getBloodCenters);

export default router;
