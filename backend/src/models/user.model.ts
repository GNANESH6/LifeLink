/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: false, // Optional for Google OAuth users
    },
    phone: {
      type: String,
      required: false,
      default: "",
    },
    age: {
      type: Number,
      required: false,
      default: 28,
    },
    gender: {
      type: String,
      required: false,
      default: "Unspecified", // Or just default empty/unspecified
    },
    bloodGroup: {
      type: String,
      required: false,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", ""],
      default: "",
    },
    donorType: {
      type: String,
      required: false,
      enum: ["Blood", "Organ", "Both", ""],
      default: "Blood",
    },
    address: {
      type: String,
      required: false,
      default: "",
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: false,
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: false,
        default: [0, 0],
      },
    },
    availability: {
      type: String,
      enum: ["Available", "Not Available"],
      default: "Available",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Apply 2dsphere index for Geospatial Location calculations
UserSchema.index({ location: "2dsphere" });

// Hash password prior to saving if not already a bcrypt hash
UserSchema.pre("save", async function (this: any) {
  if (!this.isModified("password") || !this.password) {
    return;
  }
  // Check if password is already a valid bcrypt hash
  const isHashed = /^\$2[ayb]\$.{56}$/.test(this.password);
  if (isHashed) {
    return;
  }
  try {
    const salt = bcrypt.genSaltSync(10);
    this.password = bcrypt.hashSync(this.password, salt);
  } catch (err: any) {
    console.error("Password hash pre-save failed:", err);
  }
});

// Avoid re-compilation error if model already compiled
export const MongoDBUser = mongoose.models.User || mongoose.model("User", UserSchema);
