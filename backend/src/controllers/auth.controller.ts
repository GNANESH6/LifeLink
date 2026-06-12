/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../config/db.js";

const JWT_SECRET = process.env.JWT_SECRET || "lifelink_jwt_secret_token_key_2026";

// Generate JWT Helper
const generateToken = (id: string, email: string) => {
  return jwt.sign({ id, email }, JWT_SECRET, {
    expiresIn: "30d",
  });
};

/**
 * Register a new user with password hashing
 * POST /api/auth/register
 */
export async function registerUser(req: Request, res: Response) {
  try {
    const { name, email, password, phone, bloodGroup, donorType, address, latitude, longitude, age, gender } = req.body;

    if (!name || !email || !password || !phone || !bloodGroup || !address || !age) {
      res.status(400).json({ message: "Please enter all required fields including age" });
      return;
    }

    const parsedAge = parseInt(age);
    if (isNaN(parsedAge) || parsedAge < 16 || parsedAge > 65) {
      res.status(400).json({ message: "Registration is restricted to individuals between 16 and 65 years of age only." });
      return;
    }

    // Verify email unique
    const userExists = await db.findUserByEmail(email);
    if (userExists) {
      res.status(400).json({ message: "An account with this email already exists" });
      return;
    }

    // Hash password
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    // Save user with [longitude, latitude] geospatial array
    const latNum = parseFloat(latitude) || 0;
    const lngNum = parseFloat(longitude) || 0;

    const user = await db.createUser({
      name,
      email,
      password: hashedPassword,
      phone,
      age: parsedAge,
      gender: gender || "Unspecified",
      bloodGroup,
      donorType: donorType || "Blood",
      address,
      location: {
        type: "Point",
        coordinates: [lngNum, latNum], // GeoJSON order is [longitude, latitude]
      },
      availability: "Available",
    });

    const token = generateToken(user.id, user.email);

    res.status(201).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        age: user.age,
        gender: user.gender,
        bloodGroup: user.bloodGroup,
        donorType: user.donorType,
        address: user.address,
        location: user.location,
        availability: user.availability,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (error: any) {
    console.error("Register user error:", error);
    res.status(500).json({ message: "Server error during registration", error: error.message });
  }
}

/**
 * Login registered user
 * POST /api/auth/login
 */
export async function loginUser(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: "Please provide email and password" });
      return;
    }

    // Find user
    const user = await db.findUserByEmail(email);
    if (!user) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    // Verify password exists (might be oAuth user)
    if (!user.password) {
      res.status(400).json({ message: "This email is registered with Google. Please login with Google instead." });
      return;
    }

    // Match password
    const isMatched = bcrypt.compareSync(password, user.password);
    if (!isMatched) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    const token = generateToken(user.id, user.email);

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        age: user.age,
        gender: user.gender,
        bloodGroup: user.bloodGroup,
        donorType: user.donorType,
        address: user.address,
        location: user.location,
        availability: user.availability,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (error: any) {
    console.error("Login route error:", error);
    res.status(500).json({ message: "Server login error" });
  }
}

/**
 * Direct or Popup Google Sign-In with automatic account provisioning
 * POST /api/auth/google
 */
export async function googleSignIn(req: Request, res: Response) {
  try {
    const { email, name, googleId, phone, bloodGroup, donorType, address, latitude, longitude, age, gender } = req.body;

    if (!email || !name) {
      res.status(400).json({ message: "Google profile email and name are required." });
      return;
    }

    let user = await db.findUserByEmail(email);

    // If User doesn't exist, reject login
    if (!user) {
      res.status(401).json({ message: "No LifeLink account found with this Google email. Please register first." });
      return;
    }

    const token = generateToken(user.id, user.email);

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        age: user.age,
        gender: user.gender,
        bloodGroup: user.bloodGroup,
        donorType: user.donorType,
        address: user.address,
        location: user.location,
        availability: user.availability,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (error: any) {
    console.error("Google SSO error:", error);
    res.status(500).json({ message: "Google authentication failed", error: error.message });
  }
}

/**
 * Get current authenticated user
 * GET /api/auth/me
 */
export async function getMe(req: any, res: Response) {
  try {
    const user = await db.findUserById(req.user.id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      age: user.age,
      gender: user.gender,
      bloodGroup: user.bloodGroup,
      donorType: user.donorType,
      address: user.address,
      location: user.location,
      availability: user.availability,
      createdAt: user.createdAt,
    });
  } catch (error: any) {
    console.error("fetch me route failed:", error);
    res.status(500).json({ message: "Server error fetching logged-in profile" });
  }
}
