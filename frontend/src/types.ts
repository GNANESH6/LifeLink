/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface GeoLocation {
  type: "Point";
  coordinates: [number, number]; // [longitude, latitude]
}

export type DonorType = "Blood";
export type AvailabilityStatus = "Available" | "Not Available";

export interface User {
  id: string; // Uniform ID for both MongoDB and Local JSON fallback
  name: string;
  email: string;
  password?: string;
  phone: string;
  bloodGroup: string;
  donorType: DonorType;
  address: string;
  location: GeoLocation;
  availability: AvailabilityStatus;
  createdAt: string;
  age?: number;
  gender?: string;
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  phone: string;
  bloodGroup: string;
  donorType: DonorType;
  address: string;
  location: GeoLocation;
  availability: AvailabilityStatus;
  createdAt: string;
  age?: number;
  gender?: string;
}

export interface DonorMatch extends UserResponse {
  distance: number; // in kilometers or miles
}

export interface NearbyQuery {
  bloodGroup: string;
  radius: number; // in km
  latitude: number;
  longitude: number;
}

export interface SearchQuery {
  bloodGroup?: string;
  city?: string;
  radius?: number;
  latitude?: number;
  longitude?: number;
}

export interface EmergencyRequest {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  bloodGroup: string;
  message: string;
  address: string;
  location: GeoLocation;
  createdAt: string;
  active: boolean;
}
