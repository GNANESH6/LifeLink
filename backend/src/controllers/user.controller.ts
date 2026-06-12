/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Response } from "express";
import { db } from "../config/db.js";

/**
 * Get authenticated user profile
 * GET /api/users/profile
 */
export async function getProfile(req: any, res: Response) {
  try {
    const user = await db.findUserById(req.user.id);
    if (!user) {
      res.status(404).json({ message: "Profile not found" });
      return;
    }

    res.json(user);
  } catch (error: any) {
    console.error("Get profile route failed:", error);
    res.status(500).json({ message: "Server error retrieving profile" });
  }
}

/**
 * Update authenticated user profile or availability
 * PUT /api/users/profile
 */
export async function updateProfile(req: any, res: Response) {
  try {
    const { name, phone, bloodGroup, donorType, address, latitude, longitude, availability, age, gender } = req.body;

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (age !== undefined) {
      const parsedAge = age ? parseInt(age.toString()) : 0;
      if (isNaN(parsedAge) || parsedAge < 16 || parsedAge > 65) {
        res.status(400).json({ message: "Age must be between 16 and 65 years limit." });
        return;
      }
      updates.age = parsedAge;
    }
    if (gender !== undefined) updates.gender = gender;
    if (bloodGroup !== undefined) updates.bloodGroup = bloodGroup;
    if (donorType !== undefined) updates.donorType = donorType;
    if (address !== undefined) updates.address = address;
    if (availability !== undefined) updates.availability = availability;

    if (latitude !== undefined && longitude !== undefined) {
      updates.location = {
        type: "Point",
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      };
    }

    const updatedUser = await db.updateUser(req.user.id, updates);
    if (!updatedUser) {
      res.status(404).json({ message: "User not found to update" });
      return;
    }

    res.json({
      message: "Profile updated successfully",
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        age: updatedUser.age,
        gender: updatedUser.gender,
        bloodGroup: updatedUser.bloodGroup,
        donorType: updatedUser.donorType,
        address: updatedUser.address,
        location: updatedUser.location,
        availability: updatedUser.availability,
        createdAt: updatedUser.createdAt,
      },
    });
  } catch (error: any) {
    console.error("Update profile route failed:", error);
    res.status(500).json({ message: "Server error resetting user profile" });
  }
}

/**
 * Find nearby donors within specific radius with geospatial logic
 * GET /api/users/nearby
 * Query parameters: bloodGroup, radius (km), latitude, longitude
 */
export async function getNearbyDonors(req: any, res: Response) {
  try {
    const bloodGroup = (req.query.bloodGroup as string) || "Any";
    const radius = parseFloat(req.query.radius as string) || 10;
    const lat = parseFloat(req.query.latitude as string);
    const lng = parseFloat(req.query.longitude as string);

    if (isNaN(lat) || isNaN(lng)) {
      res.status(400).json({ message: "Missing or invalid latitude/longitude parameters for geo-matching" });
      return;
    }

    const currentUserEmail = req.user?.email || undefined;
    const results = await db.findNearbyDonors(lat, lng, bloodGroup, radius, currentUserEmail);

    res.json({
      count: results.length,
      donors: results,
    });
  } catch (error: any) {
    console.error("Get nearby donors failed:", error);
    res.status(500).json({ message: "Failed to parse nearby matching search results" });
  }
}

/**
 * Filter and query donors generally by blood group, city or coordinates
 * GET /api/users/search
 * Query parameters: bloodGroup, city, radius (km), latitude, longitude
 */
export async function searchDonors(req: any, res: Response) {
  try {
    const bloodGroup = req.query.bloodGroup as string;
    const city = req.query.city as string;
    const radius = req.query.radius ? parseFloat(req.query.radius as string) : undefined;
    const lat = req.query.latitude ? parseFloat(req.query.latitude as string) : undefined;
    const lng = req.query.longitude ? parseFloat(req.query.longitude as string) : undefined;
    const name = req.query.name as string;

    const currentUserEmail = req.user?.email || undefined;
    const results = await db.searchDonors(bloodGroup, city, radius, lat, lng, currentUserEmail, name);

    res.json({
      count: results.length,
      donors: results,
    });
  } catch (error: any) {
    console.error("Donor query filtering failed:", error);
    res.status(500).json({ message: "Failed to search matches in database" });
  }
}

/**
 * Get dynamic database metrics
 * GET /api/users/stats
 */
export async function getStats(req: any, res: Response) {
  try {
    const stats = await db.getStats();
    res.json(stats);
  } catch (error: any) {
    console.error("Database dynamic metrics parsing failed:", error);
    res.status(500).json({ message: "Failed to load directory counts" });
  }
}
