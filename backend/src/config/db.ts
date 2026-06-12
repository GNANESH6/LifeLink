/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { MongoDBUser } from "../models/user.model.js";
import { User, DonorType, AvailabilityStatus, DonorMatch, EmergencyRequest } from "../types.js";

// Ensure data folder exists for local JSON DB fallback
const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const EMERGENCY_REQUESTS_FILE = path.join(DATA_DIR, "emergency_requests.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Haversine formula for calculating distance in kilometers
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2)); // return distance rounded to 2 decimal places
}



class DatabaseManager {
  private isConnectedToMongo = false;
  private users: User[] = [];
  private emergencyRequests: EmergencyRequest[] = [];

  constructor() {
    this.initialize();
  }

  private async initialize() {
    this.loadLocalEmergencyRequests();
    const mongoUri = process.env.MONGO_URI;
    if (mongoUri) {
      try {
        console.log("Connecting to MongoDB Atlas...");
        await mongoose.connect(mongoUri, {
          serverSelectionTimeoutMS: 3000, // Handle slow/unreachable DB gracefully in 3s
        });
        this.isConnectedToMongo = true;
        console.log("Successfully connected to MongoDB Atlas!");
        // Synchronously request mongoose to build any non-existing indexes (like 2dsphere)
        try {
          const UserModel = MongoDBUser as any;
          await UserModel.createIndexes();
          console.log("MongoDB indexes (2dsphere) synchronized and verified successfully.");
        } catch (idxErr) {
          console.warn("MongoDB index creation warning:", idxErr);
        }
      } catch (err) {
        console.error("MongoDB Atlas connection failed. Falling back to Local JSON database:", err);
        this.loadLocalUsers();
      }
    } else {
      console.log("No MONGO_URI specified. Initializing Local file-based database...");
      this.loadLocalUsers();
    }
  }

  private loadLocalUsers() {
    try {
      if (fs.existsSync(USERS_FILE)) {
        const raw = fs.readFileSync(USERS_FILE, "utf-8");
        this.users = JSON.parse(raw);
        console.log(`Loaded ${this.users.length} users from JSON database.`);
      } else {
        this.users = [];
        this.saveLocalUsers();
        console.log(`Initialized empty JSON database for users.`);
      }
    } catch (error) {
      console.error("Failed to load local user database:", error);
      this.users = [];
    }
  }

  private saveLocalUsers() {
    try {
      fs.writeFileSync(USERS_FILE, JSON.stringify(this.users, null, 2), "utf-8");
    } catch (error) {
      console.error("Failed to write local database file:", error);
    }
  }

  private loadLocalEmergencyRequests() {
    try {
      if (fs.existsSync(EMERGENCY_REQUESTS_FILE)) {
        const raw = fs.readFileSync(EMERGENCY_REQUESTS_FILE, "utf-8");
        this.emergencyRequests = JSON.parse(raw);
        console.log(`Loaded ${this.emergencyRequests.length} emergency requests from JSON database.`);
      } else {
        this.emergencyRequests = [];
        this.saveLocalEmergencyRequests();
        console.log(`Initialized empty JSON database for emergency requests.`);
      }
    } catch (error) {
      console.error("Failed to load local emergency request database:", error);
      this.emergencyRequests = [];
    }
  }

  private saveLocalEmergencyRequests() {
    try {
      fs.writeFileSync(EMERGENCY_REQUESTS_FILE, JSON.stringify(this.emergencyRequests, null, 2), "utf-8");
    } catch (error) {
      console.error("Failed to write local emergency requests file:", error);
    }
  }

  public async getAllEmergencyRequests(lat?: number, lng?: number, radiusKm?: number): Promise<EmergencyRequest[]> {
    const activeRequests = this.emergencyRequests.filter(er => er.active !== false);
    
    if (lat !== undefined && lng !== undefined && radiusKm !== undefined && !isNaN(lat) && !isNaN(lng)) {
      return activeRequests.filter(er => {
        const [erLng, erLat] = er.location.coordinates;
        const distance = calculateDistance(lat, lng, erLat, erLng);
        return distance <= radiusKm;
      });
    }
    
    return [...activeRequests].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async createEmergencyRequest(data: Omit<EmergencyRequest, "id" | "createdAt" | "active">): Promise<EmergencyRequest> {
    const newRequest: EmergencyRequest = {
      ...data,
      id: `er-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
      active: true
    };
    
    this.emergencyRequests.unshift(newRequest);
    this.saveLocalEmergencyRequests();
    return newRequest;
  }

  public async closeEmergencyRequest(requestId: string, userId: string): Promise<boolean> {
    const index = this.emergencyRequests.findIndex(er => er.id === requestId);
    if (index === -1) return false;
    
    // Seed requests can be closed by anyone, others closed by the owner
    if (this.emergencyRequests[index].userId !== userId && !requestId.startsWith("er-seed")) {
      return false;
    }
    
    this.emergencyRequests[index].active = false;
    this.saveLocalEmergencyRequests();
    return true;
  }

  // Generic Operations exposed to Controllers
  public async findUserByEmail(email: string): Promise<User | null> {
    const targetEmail = email.toLowerCase().trim();
    if (this.isConnectedToMongo) {
      try {
        const user = await (MongoDBUser as any).findOne({ email: targetEmail });
        if (user) {
          const uObj = (user as any).toJSON();
          return {
            ...uObj,
            id: uObj._id ? uObj._id.toString() : (uObj.id || user._id.toString()),
            age: uObj.age || 28,
            gender: uObj.gender || "Unspecified",
          } as User;
        }
      } catch (err) {
        console.error("findUserByEmail MongoDB error:", err);
      }
    }
    const user = this.users.find((u) => u.email.toLowerCase().trim() === targetEmail);
    return user || null;
  }

  public async findUserById(id: string): Promise<User | null> {
    if (this.isConnectedToMongo) {
      try {
        if (mongoose.Types.ObjectId.isValid(id)) {
          const user = await (MongoDBUser as any).findById(id);
          if (user) {
            const uObj = (user as any).toJSON();
            return {
              ...uObj,
              id: uObj._id ? uObj._id.toString() : (uObj.id || user._id.toString()),
              age: uObj.age || 28,
              gender: uObj.gender || "Unspecified",
            } as User;
          }
        }
      } catch (err) {
        console.error("findUserById MongoDB error:", err);
      }
    }
    const user = this.users.find((u) => u.id === id);
    return user || null;
  }

  public async createUser(data: Partial<User>): Promise<User> {
    if (this.isConnectedToMongo) {
      const UserMongoose = MongoDBUser as any;
      const model = new UserMongoose(data);
      const saved = await model.save();
      const uObj = (saved as any).toJSON();
      return {
        ...uObj,
        id: uObj._id ? uObj._id.toString() : (uObj.id || saved._id.toString()),
        age: uObj.age || 28,
        gender: uObj.gender || "Unspecified",
      } as User;
    }

    const newUser: User = {
      id: `u-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: data.name || "",
      email: (data.email || "").toLowerCase().trim(),
      password: data.password || "",
      phone: data.phone || "",
      age: data.age || 28,
      gender: data.gender || "Unspecified",
      bloodGroup: data.bloodGroup || "O+",
      donorType: data.donorType || "Blood",
      address: data.address || "",
      location: data.location || { type: "Point", coordinates: [0, 0] },
      availability: data.availability || "Available",
      createdAt: new Date().toISOString(),
    };

    this.users.push(newUser);
    this.saveLocalUsers();

    return newUser;
  }

  public async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    if (this.isConnectedToMongo) {
      try {
        if (mongoose.Types.ObjectId.isValid(id)) {
          const updated = await (MongoDBUser as any).findByIdAndUpdate(id, updates, { new: true });
          if (updated) {
            const uObj = (updated as any).toJSON();
            return {
              ...uObj,
              id: uObj._id ? uObj._id.toString() : (uObj.id || updated._id.toString()),
            } as User;
          }
        }
      } catch (err) {
        console.error("updateUser MongoDB error:", err);
      }
    }

    const index = this.users.findIndex((u) => u.id === id);
    if (index === -1) return null;

    // Preserve static fields and override updates
    this.users[index] = {
      ...this.users[index],
      ...updates,
      id: this.users[index].id, // protect ID
      email: updates.email ? updates.email.toLowerCase().trim() : this.users[index].email,
    };

    this.saveLocalUsers();
    return this.users[index];
  }

  // Geospatial match calculations for blood group + radius
  public async findNearbyDonors(
    lat: number,
    lng: number,
    bloodGroup: string,
    radiusKm: number,
    currentUserEmail?: string
  ): Promise<DonorMatch[]> {
    if (this.isConnectedToMongo) {
      try {
        const UserMongoose = MongoDBUser as any;
        // Convert radius standard (meters)
        const radiusInMeters = radiusKm * 1000;
        
        const filter: any = {
          location: {
            $near: {
              $geometry: {
                type: "Point",
                coordinates: [lng, lat],
              },
              $maxDistance: radiusInMeters,
            },
          },
        };

        if (bloodGroup && bloodGroup !== "Any") {
          filter.bloodGroup = bloodGroup;
        }

        // Do not exclude currently logged-in user so they can view themselves in list
        // if (currentUserEmail) {
        //   filter.email = { $ne: currentUserEmail.toLowerCase() };
        // }

        const donors = await UserMongoose.find(filter);
        return donors.map((d: any) => {
          const userObj = d.toJSON() as any;
          const [donLng, donLat] = userObj.location?.coordinates || [0, 0];
          const dist = calculateDistance(lat, lng, donLat, donLng);
          return {
            ...userObj,
            id: userObj._id.toString(),
            distance: dist,
          };
        });
      } catch (err) {
        console.error("Geospatial query failed in Mongo, falling back to local formulas:", err);
      }
    }

    // JSON fallback filtering
    let eligible = [...this.users];

    if (bloodGroup && bloodGroup !== "Any") {
      eligible = eligible.filter((u) => (u.bloodGroup || "").toUpperCase() === bloodGroup.toUpperCase());
    }

    // Do not exclude currently logged-in user so they can view themselves in list
    // if (currentUserEmail) {
    //   eligible = eligible.filter((u) => u.email.toLowerCase().trim() !== currentUserEmail.toLowerCase().trim());
    // }

    const matches: DonorMatch[] = [];

    for (const donor of eligible) {
      const [donLng, donLat] = donor.location?.coordinates || [0, 0];
      const distance = calculateDistance(lat, lng, donLat, donLng);
      if (distance <= radiusKm) {
        matches.push({
          id: donor.id,
          name: donor.name,
          email: donor.email,
          phone: donor.phone,
          bloodGroup: donor.bloodGroup,
          donorType: donor.donorType,
          address: donor.address,
          location: donor.location,
          availability: donor.availability,
          createdAt: donor.createdAt,
          distance,
        });
      }
    }

    // Sort by near distances first
    return matches.sort((a, b) => a.distance - b.distance);
  }

  // Broad filtering based on city search and/or blood type
  public async searchDonors(
    bloodGroup?: string,
    city?: string,
    radiusKm?: number,
    currentLat?: number,
    currentLng?: number,
    currentUserEmail?: string,
    name?: string
  ): Promise<DonorMatch[]> {
    if (this.isConnectedToMongo) {
      try {
        const UserMongoose = MongoDBUser as any;
        const filter: any = {};

        if (bloodGroup && bloodGroup !== "Any") {
          filter.bloodGroup = { $regex: new RegExp("^" + bloodGroup.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&") + "$", "i") };
        }

        if (city && city.trim() !== "") {
          filter.address = { $regex: new RegExp(city.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"), "i") };
        }

        if (name && name.trim() !== "") {
          filter.name = { $regex: new RegExp(name.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"), "i") };
        }

        // Do not exclude currently logged-in user so they can view themselves in directory list
        // if (currentUserEmail) {
        //   filter.email = { $ne: currentUserEmail.toLowerCase() };
        // }

        // If geospatial radius search is chosen with coordinates
        if (radiusKm && currentLat !== undefined && currentLng !== undefined && currentLat !== 0 && currentLng !== 0) {
          const radiusInMeters = radiusKm * 1000;
          filter.location = {
            $near: {
              $geometry: {
                type: "Point",
                coordinates: [currentLng, currentLat],
              },
              $maxDistance: radiusInMeters,
            },
          };
        }

        const donors = await UserMongoose.find(filter);
        return donors.map((d: any) => {
          const uObj = d.toJSON() as any;
          const [donLng, donLat] = uObj.location?.coordinates || [0, 0];
          let distance = 0;
          if (currentLat !== undefined && currentLng !== undefined && donLat !== 0 && donLng !== 0) {
            distance = calculateDistance(currentLat, currentLng, donLat, donLng);
          }
          return {
            ...uObj,
            id: uObj._id ? uObj._id.toString() : (uObj.id || d._id.toString()),
            distance,
          };
        });
      } catch (err) {
        console.error("MongoDB searchDonors failing, continuing to local JSON fallback:", err);
      }
    }

    // Otherwise, generic local JSON fallback
    // If geospatial radius search is chosen with coordinates
    if (radiusKm && currentLat && currentLng) {
      let nearby = await this.findNearbyDonors(currentLat, currentLng, bloodGroup || "Any", radiusKm, currentUserEmail);
      if (name) {
        const nameLower = name.toLowerCase().trim();
        nearby = nearby.filter((u) => (u.name || "").toLowerCase().includes(nameLower));
      }
      if (city) {
        const cityLower = city.toLowerCase().trim();
        nearby = nearby.filter((u) => (u.address || "").toLowerCase().includes(cityLower));
      }
      return nearby;
    }

    let eligible = [...this.users];

    if (bloodGroup && bloodGroup !== "Any") {
      eligible = eligible.filter((u) => (u.bloodGroup || "").toUpperCase() === bloodGroup.toUpperCase());
    }

    if (city) {
      const cityLower = city.toLowerCase().trim();
      eligible = eligible.filter((u) => (u.address || "").toLowerCase().includes(cityLower));
    }

    if (name) {
      const nameLower = name.toLowerCase().trim();
      eligible = eligible.filter((u) => (u.name || "").toLowerCase().includes(nameLower));
    }

    // Do not exclude currently logged-in user so they can view themselves in directory list
    // if (currentUserEmail) {
    //   eligible = eligible.filter((u) => u.email.toLowerCase().trim() !== currentUserEmail.toLowerCase().trim());
    // }

    return eligible.map((u) => {
      let distance = 0;
      if (currentLat !== undefined && currentLng !== undefined && !isNaN(currentLat) && !isNaN(currentLng)) {
        const [donLng, donLat] = u.location?.coordinates || [0, 0];
        distance = calculateDistance(currentLat, currentLng, donLat, donLng);
      }
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        bloodGroup: u.bloodGroup,
        donorType: u.donorType,
        address: u.address,
        location: u.location,
        availability: u.availability,
        createdAt: u.createdAt,
        distance,
      };
    });
  }



  // Calculate stats dynamically based on actual database records
  public async getStats(): Promise<{ activeDonors: number; organPledges: number; cities: number }> {
    let allUsers: User[] = [];
    if (this.isConnectedToMongo) {
      try {
        const UserMongoose = MongoDBUser as any;
        const users = await UserMongoose.find({});
        allUsers = users.map((u: any) => {
          const uObj = u.toJSON() as any;
          return {
            ...uObj,
            id: uObj._id ? uObj._id.toString() : uObj.id,
          } as User;
        });
      } catch (err) {
        console.error("Failed to fetch Mongoose users for statistics calculation:", err);
        allUsers = this.users;
      }
    } else {
      allUsers = this.users;
    }

    const activeDonors = allUsers.filter((u) => u.availability === "Available").length;
    const organPledges = 0;

    const citiesSet = new Set<string>();
    allUsers.forEach((u) => {
      if (u.address) {
        const parts = u.address.split(",");
        const cityCandidate = parts[0]?.trim();
        if (cityCandidate) {
          // Normalize city mapping
          citiesSet.add(cityCandidate.toLowerCase());
        }
      }
    });

    const cities = citiesSet.size || 1;

    return {
      activeDonors,
      organPledges,
      cities,
    };
  }
}

export const db = new DatabaseManager();
