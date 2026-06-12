/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { User, Phone, MapPin, Compass, ShieldCheck, Heart, Power, Save, Check, Lock, ArrowLeft, Eye, AlertTriangle, Radio, Bell, Plus, X, ShieldAlert } from "lucide-react";
import { useAuth } from "../context/AuthContext.js";
import { DonorType, AvailabilityStatus } from "../types.js";
import { motion, AnimatePresence } from "motion/react";
import { apiUrl } from "../api.js";

interface ProfileViewProps {
  addToast: (message: string, type: "success" | "error" | "info") => void;
  onNavigate?: (view: string) => void;
}

export default function ProfileView({ addToast, onNavigate }: ProfileViewProps) {
  const { user, token, updateUserProfile } = useAuth();

  // Guard
  if (!user) return null;

  // Emergency Alerts Board Logic & State
  const [emergencyRequests, setEmergencyRequests] = useState<any[]>([]);
  const [loadingEmergencies, setLoadingEmergencies] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [emergBloodGroup, setEmergBloodGroup] = useState("O-");
  const [emergMessage, setEmergMessage] = useState("");
  const [emergAddress, setEmergAddress] = useState(user.address || "");
  const [publishingEmergency, setPublishingEmergency] = useState(false);

  const fetchEmergencyRequests = async () => {
    if (!token) return;
    setLoadingEmergencies(true);
    try {
      const res = await fetch(apiUrl("/emergency"), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setEmergencyRequests(data);
      }
    } catch (err) {
      console.warn("Failed to fetch emergency requests inside profile:", err);
    } finally {
      setLoadingEmergencies(false);
    }
  };

  React.useEffect(() => {
    fetchEmergencyRequests();
  }, [token]);

  const playBeaconSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(520, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15);
      
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.warn("Audio Context blocked or unsupported:", e);
    }
  };

  const handleBroadcastEmergency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emergBloodGroup || !emergMessage.trim() || !emergAddress.trim()) {
      addToast("Please fill out the blood group needed, exact address, and emergency message.", "error");
      return;
    }

    setPublishingEmergency(true);
    
    const lat = user.location?.coordinates?.[1] || 0;
    const lng = user.location?.coordinates?.[0] || 0;

    try {
      const res = await fetch(apiUrl("/emergency"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bloodGroup: emergBloodGroup,
          message: emergMessage,
          address: emergAddress,
          latitude: lat,
          longitude: lng,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to publish emergency request");
      }

      addToast("Emergency broadcast published successfully!", "success");
      playBeaconSound();

      setEmergMessage("");
      setShowBroadcastModal(false);
      fetchEmergencyRequests();
    } catch (err: any) {
      addToast(err.message || "Failed to broadcast emergency request", "error");
    } finally {
      setPublishingEmergency(false);
    }
  };

  const handleCloseEmergency = async (requestId: string) => {
    addToast("Resolving broadcast...", "info");
    try {
      const res = await fetch(apiUrl(`/emergency/${requestId}`), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        addToast("Broadcast closed and marked as resolved.", "success");
        fetchEmergencyRequests();
      } else {
        const data = await res.json();
        addToast(data.message || "Failed to close emergency request", "error");
      }
    } catch (err) {
      console.warn("Failed to close emergency request:", err);
      addToast("Failed to resolve request.", "error");
    }
  };

  // Viewing another donor (restricted owner read-only mode)
  const [viewingDonor, setViewingDonor] = React.useState<any | null>(null);

  React.useEffect(() => {
    const saved = localStorage.getItem("viewing_other_donor");
    if (saved) {
      try {
        setViewingDonor(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse viewing_other_donor", e);
      }
    }
  }, []);

  const handleReturnToDashboard = () => {
    localStorage.removeItem("viewing_other_donor");
    setViewingDonor(null);
    if (onNavigate) {
      onNavigate("dashboard");
    }
  };

  // States
  const [name, setName] = useState(user.name || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [age, setAge] = useState<number | "">(user.age ?? "");
  const [gender, setGender] = useState(user.gender || "");
  const [bloodGroup, setBloodGroup] = useState(user.bloodGroup || "O+");
  const [donorType, setDonorType] = useState<DonorType>(user.donorType || "Blood");
  const [address, setAddress] = useState(user.address || "");
  const [availability, setAvailability] = useState<AvailabilityStatus>(user.availability || "Available");

  const [latitude, setLatitude] = useState<number | "">(user.location?.coordinates?.[1] ?? "");
  const [longitude, setLongitude] = useState<number | "">(user.location?.coordinates?.[0] ?? "");

  const userId = user?.id;
  const userName = user?.name;
  const userPhone = user?.phone;
  const userAge = user?.age;
  const userGender = user?.gender;
  const userBloodGroup = user?.bloodGroup;
  const userDonorType = user?.donorType;
  const userAddress = user?.address;
  const userAvailability = user?.availability;
  const userLat = user?.location?.coordinates?.[1];
  const userLng = user?.location?.coordinates?.[0];

  React.useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPhone(user.phone || "");
      setAge(user.age ?? "");
      setGender(user.gender || "");
      setBloodGroup(user.bloodGroup || "O+");
      setDonorType(user.donorType || "Blood");
      setAddress(user.address || "");
      setAvailability(user.availability || "Available");
      setLatitude(user.location?.coordinates?.[1] ?? "");
      setLongitude(user.location?.coordinates?.[0] ?? "");
    }
  }, [userId, userName, userPhone, userAge, userGender, userBloodGroup, userDonorType, userAddress, userAvailability, userLat, userLng]);

  const [detectingGps, setDetectingGps] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [saving, setSaving] = useState(false);

  // Trigger GPS detection
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      addToast("Geolocation is not supported by your browser.", "error");
      return;
    }

    setDetectingGps(true);
    addToast("Capturing GPS location coordinates...", "info");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);
        addToast(`GPS coordinates updated: [${lat.toFixed(4)}, ${lng.toFixed(4)}]`, "success");

        // Reverse geocode to text address
        try {
          const res = await fetch(apiUrl("/location/reverse-geocode"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ latitude: lat, longitude: lng }),
          });
          if (res.ok) {
            const result = await res.json();
            if (result.address) {
              setAddress(result.address);
              addToast("Address auto-updated successfully from GPS!", "success");
            }
          }
        } catch (err) {
          console.error("Auto reverse-geocoding fail:", err);
        } finally {
          setDetectingGps(false);
        }
      },
      (error) => {
        console.error("GPS capturing error:", error);
        addToast(`GPS Capturing failed: ${error.message}`, "error");
        setDetectingGps(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Convert hand-typed address to coordinates
  const handleVerifyAddress = async () => {
    if (!address.trim()) {
      addToast("Please input an address first", "error");
      return;
    }

    setGeocoding(true);
    addToast("Translating address to geo-coordinates point...", "info");

    try {
      const res = await fetch(apiUrl("/location/geocode"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });

      if (!res.ok) {
        throw new Error("Geocoding lookup failed");
      }

      const result = await res.json();
      setLatitude(result.latitude);
      setLongitude(result.longitude);

      if (result.address) {
        setAddress(result.address);
      }

      addToast("Address verified and geo-coordinates resolved successfully!", "success");
    } catch (err: any) {
      console.error("Geocoding fails:", err);
      addToast("Address verification failed, please enter coordinate pins manually.", "error");
    } finally {
      setGeocoding(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !phone || !bloodGroup || !address || !age || !gender) {
      addToast("Please fill in all mandatory fields including age and gender selection.", "error");
      return;
    }

    const numericAge = parseInt(age.toString());
    if (isNaN(numericAge) || numericAge < 16 || numericAge > 65) {
      addToast("Profile update failed: Voluntary donation is restricted to individuals between 16 and 65 years.", "error");
      return;
    }

    if (latitude === "" || longitude === "") {
      addToast("Geo-matcher requires coordinates. Please run geo-tagging or GPS capturing.", "error");
      return;
    }

    setSaving(true);
    try {
      const success = await updateUserProfile({
        name,
        phone,
        age: age ? parseInt(age.toString()) : undefined,
        gender,
        bloodGroup,
        donorType,
        address,
        latitude: parseFloat(latitude.toString()),
        longitude: parseFloat(longitude.toString()),
        availability,
      });

      if (success) {
        addToast("Donor registration data updated securely!", "success");
      } else {
        addToast("Profile update failed.", "error");
      }
    } catch (err: any) {
      addToast(err.message || "Save error occurred", "error");
    } finally {
      setSaving(false);
    }
  };

  if (viewingDonor) {
    const lat = viewingDonor.location?.coordinates?.[1] || "";
    const lng = viewingDonor.location?.coordinates?.[0] || "";
    
    return (
      <div className="max-w-2xl mx-auto py-8 px-6" id="view-profile-readonly-container">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-8 rounded-2xl border border-slate-100 shadow-xl space-y-8"
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <button
              onClick={handleReturnToDashboard}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-wider cursor-pointer"
              id="return-to-matches-btn"
            >
              <ArrowLeft className="w-4 h-4" /> Return to Matches
            </button>
            <div className="px-3 py-1.5 bg-red-600 text-white font-sans font-black rounded-xl text-sm shadow shadow-red-500/25 leading-none shrink-0 select-none">
              Group {viewingDonor.bloodGroup}
            </div>
          </div>

          <div className="space-y-2 text-center sm:text-left">
            <h2 className="text-2xl font-display font-semibold text-slate-900" id="donor-profile-readonly-name">{viewingDonor.name}</h2>
            <p className="text-slate-500 text-xs sm:text-sm">Verified Voluntary Pledge Registry Profile</p>
          </div>

          {/* Secure access notice badge list */}
          <div className="bg-amber-50/40 p-4 rounded-xl border border-amber-200/50 flex items-start gap-3 text-left">
            <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Restricted Owner View</h4>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                For security, this information is read-only. Data modification and write access are exclusive to the authorized self-account owner.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
            <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Pledge Group Type</span>
              <span className="text-xs font-semibold text-slate-800">
                Blood Donor Only
              </span>
            </div>

            <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Availability State</span>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${viewingDonor.availability === "Available" ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`}></span>
                <span className="text-xs font-bold text-slate-800 font-mono uppercase">
                  {viewingDonor.availability || "Offline"}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4 text-left">
            <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-1 block">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Current Registry Address</span>
              <span className="text-xs font-bold text-slate-800 leading-relaxed block">{viewingDonor.address || "No address provided"}</span>
            </div>

            <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-1 block">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Official Phone Line</span>
              <span className="text-xs font-mono font-bold text-slate-800 block">
                {viewingDonor.phone ? (
                  <a href={`tel:${viewingDonor.phone}`} className="text-red-600 hover:opacity-80 underline">{viewingDonor.phone}</a>
                ) : (
                  "N/A"
                )}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-100 text-center">
              <span className="text-[10px] font-bold text-slate-400 block uppercase font-mono">Latitude Coordinate</span>
              <span className="text-xs font-mono font-bold text-slate-700">
                {lat ? parseFloat(lat.toString()).toFixed(6) : "N/A"}
              </span>
            </div>
            <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-100 text-center">
              <span className="text-[10px] font-bold text-slate-400 block uppercase font-mono">Longitude Coordinate</span>
              <span className="text-xs font-mono font-bold text-slate-700">
                {lng ? parseFloat(lng.toString()).toFixed(6) : "N/A"}
              </span>
            </div>
          </div>

          {viewingDonor.distance !== undefined && viewingDonor.distance !== null && viewingDonor.distance > 0 ? (
            <div className="text-[11px] text-amber-700 font-bold flex items-center gap-1 justify-center bg-amber-50/30 py-2 rounded-lg border border-amber-100">
              <Compass className="w-3.5 h-3.5 text-amber-500" /> Geospatially mapped {viewingDonor.distance} km away from your search reference.
            </div>
          ) : null}

          {viewingDonor.phone && (
            <a
              href={`tel:${viewingDonor.phone}`}
              className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs sm:text-sm active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-red-500/20 text-center"
              id="call-donor-profile-btn"
            >
              <Phone className="w-4 h-4 text-white" />
              Call Voluntary Donor ({viewingDonor.phone})
            </a>
          )}

          <button
            onClick={handleReturnToDashboard}
            className="w-full py-3.5 bg-slate-900 hover:bg-slate-850 text-white font-semibold rounded-xl text-xs sm:text-sm active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            id="return-to-matches-submit"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Atlas View
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-4 sm:py-8 px-4 sm:px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-5 sm:p-8 rounded-2xl border border-slate-100 shadow-xl space-y-6 sm:space-y-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1 text-center sm:text-left animate-fade-in">
            <h2 className="text-xl sm:text-2xl font-display font-semibold text-slate-900 tracking-tight">Donor Badge Manager</h2>
            <p className="text-slate-500 text-xs sm:text-sm">Keep your blood type records and location coordinates accurate.</p>
          </div>

          <div className="px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center gap-2 self-center sm:self-auto shrink-0 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[11px] font-bold text-emerald-600 font-display">Registered Donor</span>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-5 sm:space-y-6" id="profile-edit-form">
          {/* Read Only Account ID Info */}
          <div className="space-y-1 text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Account Email</span>
            <span className="text-xs font-mono font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 inline-block select-all">
              {user.email}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-red-500/25 focus:border-red-500 transition-all font-semibold text-slate-800"
                  id="profile-name-input"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Phone Number</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </span>
                <input
                  type="tel"
                  required
                  placeholder="Phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-red-500/25 focus:border-red-500 transition-all font-semibold text-slate-800"
                  id="profile-phone-input"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Age */}
            <div className="space-y-1.5 text-left animate-fade-in">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Age (Years)</label>
                <span className="text-[10px] font-mono text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded font-semibold">16 - 65 Only</span>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="number"
                  required
                  min={16}
                  max={65}
                  placeholder="Enter your Age (16 to 65)"
                  value={age}
                  onChange={(e) => setAge(e.target.value === "" ? "" : parseInt(e.target.value))}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-red-500/25 focus:border-red-500 transition-all font-semibold text-slate-800"
                  id="profile-age-input"
                />
              </div>
              <p className="text-[9.5px] text-slate-400 font-mono leading-tight">Eligible blood donors must be between 16 and 65 years of age.</p>
            </div>

            {/* Gender */}
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gender</label>
              <select
                value={gender}
                required
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-red-500/25 focus:border-red-500 transition-all font-semibold text-slate-700"
                id="profile-gender-select"
              >
                <option value="">Select Gender...</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Blood Group */}
            <div className="space-y-1.5 text-left sm:col-span-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Blood Group</label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-red-500/25 focus:border-red-500 transition-all font-semibold text-slate-700"
                id="profile-blood-select"
              >
                {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((g) => (
                  <option key={g} value={g}>
                    Group {g}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Edit current registered Address */}
          <div className="space-y-1.5 text-left">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Current Address</label>
              <button
                type="button"
                onClick={handleVerifyAddress}
                disabled={geocoding || !address}
                className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline disabled:text-slate-400 inline-flex items-center gap-1.5 cursor-pointer"
              >
                {geocoding ? "Mapping..." : "Verify Address"}
              </button>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                <MapPin className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                placeholder="Location"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-red-500/25 focus:border-red-500 transition-all font-semibold text-slate-800"
                id="profile-address-input"
              />
            </div>
          </div>

          {/* Availability Status */}
          <div className="space-y-1.5 text-left">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Availability Status</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setAvailability("Available")}
                className={`py-3 rounded-xl text-xs font-bold font-display border cursor-pointer active:scale-95 transition-all text-center flex items-center justify-center gap-1.5 ${
                  availability === "Available"
                    ? "bg-emerald-500 border-emerald-600 text-white shadow-sm"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
                id="profile-avail-online"
              >
                <Power className="w-4 h-4" /> Available (Live)
              </button>

              <button
                type="button"
                onClick={() => setAvailability("Not Available")}
                className={`py-3 rounded-xl text-xs font-bold font-display border cursor-pointer active:scale-95 transition-all text-center flex items-center justify-center gap-1.5 ${
                  availability === "Not Available"
                    ? "bg-slate-900 border-slate-950 text-white shadow-sm"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
                id="profile-avail-offline"
              >
                <Power className="w-4 h-4" /> Temporarily Offline
              </button>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-5 space-y-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <h4 className="text-xs font-bold text-slate-800 flex items-center justify-center sm:justify-start gap-1.5">
                  <Compass className="w-4 h-4 text-red-600" /> Capture Live Coordinate points
                </h4>
                <p className="text-[10px] text-slate-500">
                  Click to grab raw GPS coordinates from your browser sensor and auto-encode your general lookup address.
                </p>
              </div>

              <button
                type="button"
                onClick={handleDetectGPS}
                disabled={detectingGps}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-white text-xs font-bold rounded-lg cursor-pointer transition-all shrink-0 active:scale-95"
              >
                {detectingGps ? "Detecting..." : "GPS Sensor"}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-center">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Latitude</span>
                <span className="text-xs font-mono font-bold text-slate-700">
                  {latitude !== "" ? latitude.toFixed(6) : "Not Geo-tagged"}
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-center">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Longitude</span>
                <span className="text-xs font-mono font-bold text-slate-700">
                  {longitude !== "" ? longitude.toFixed(6) : "Not Geo-tagged"}
                </span>
              </div>
            </div>

            {latitude !== "" && longitude !== "" && (
              <div className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 justify-center bg-gray-50 py-1.5 rounded-lg border border-slate-100">
                <Check className="w-3.5 h-3.5" /> Coordinates registered successfully. Matches are ready!
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={saving || geocoding || detectingGps}
            className="w-full py-4 sm:py-3.5 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white text-xs sm:text-sm font-extrabold rounded-xl shadow-md shadow-red-600/10 hover:shadow-red-600/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer select-none"
            id="profile-save-submit"
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>Saving Changes...</span>
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Save className="w-4.5 h-4.5 text-white shrink-0" />
                <span className="hidden sm:inline">Save Profile Changes</span>
                <span className="inline sm:hidden">Save Changes</span>
              </span>
            )}
          </button>
        </form>
      </motion.div>

      {/* Emergency Alerts Board inside User Profile */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="mt-8 bg-white dark:bg-slate-900 p-5 sm:p-8 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xl space-y-6 text-left"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div className="space-y-1">
            <h3 className="text-xl font-display font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 dark:bg-emerald-300 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 dark:bg-emerald-400"></span>
              </span>
              Emergency Alerts Board
            </h3>
            <p className="text-slate-550 dark:text-slate-400 text-xs font-semibold">View active medical emergency requests or broadcast a new public alert.</p>
          </div>

          <button
            type="button"
            onClick={() => {
              setEmergAddress(address || user.address || "");
              setShowBroadcastModal(true);
            }}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-red-500/10 select-none"
            id="profile-trigger-broadcast-btn"
          >
            <Plus className="w-3.5 h-3.5" /> Broadcast Alert
          </button>
        </div>

        {loadingEmergencies ? (
          <div className="text-center py-8 text-slate-500">
            <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs font-medium">Scanning live database records...</p>
          </div>
        ) : emergencyRequests.length === 0 ? (
          <div className="text-center py-10 px-4 space-y-2.5 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
            <Bell className="w-6 h-6 text-slate-355 dark:text-slate-650 mx-auto animate-pulse" />
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">No active local grid notifications</h4>
            <p className="text-[10.5px] text-slate-400 dark:text-slate-500 max-w-sm mx-auto leading-relaxed">
              No medical emergencies have been broadcast near your index range in the past 24 hours.
            </p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
            {emergencyRequests.map((req) => {
              const isOwner = req.userId === user.id || req.id.startsWith("er-seed");
              return (
                <div
                  key={req.id}
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800/80 rounded-xl p-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/10 text-red-600 dark:text-red-400 flex flex-col items-center justify-center font-bold font-mono text-center shadow-xs shrink-0 border border-red-500/10">
                      <span className="text-xs leading-none font-extrabold">{req.bloodGroup}</span>
                      <span className="text-[7.5px] uppercase tracking-wider font-extrabold text-red-500 animate-pulse mt-0.5">Alert</span>
                    </div>
                    <div className="space-y-1.5 text-left">
                      <div className="flex flex-wrap items-center gap-1.5 leading-none">
                        <span className="font-bold text-slate-900 dark:text-white text-xs">{req.userName}</span>
                        <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 bg-slate-200/50 dark:bg-slate-800 px-1.5 py-0.5 rounded leading-none">
                          {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-650 dark:text-slate-305 leading-relaxed font-semibold">{req.message}</p>
                      <div className="flex items-center gap-1 text-[10px] text-slate-505 dark:text-slate-450 font-semibold">
                        <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                        <span className="line-clamp-1">{req.address}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-end gap-2 shrink-0 justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-150 dark:border-slate-800">
                    {req.userPhone && (
                      <a
                        href={`tel:${req.userPhone}`}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[11px] font-bold transition-all shadow-xs flex items-center gap-1 shrink-0 select-none"
                      >
                        <Phone className="w-3 h-3" /> Call Volunteer
                      </a>
                    )}
                    
                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => handleCloseEmergency(req.id)}
                        className="px-2.5 py-1 text-[10px] font-bold text-slate-600 dark:text-slate-450 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg cursor-pointer transition-colors select-none"
                      >
                        Resolve Alert
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Broadcast Modal Dialog inside ProfileView */}
      <AnimatePresence>
        {showBroadcastModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4 text-left font-sans"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-red-600 animate-pulse" />
                  <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white">Broadcast Emergency Alert</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleBroadcastEmergency} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Required Blood Group</label>
                  <select
                    value={emergBloodGroup}
                    onChange={(e) => setEmergBloodGroup(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm font-semibold outline-none focus:ring-2 focus:ring-red-500/20 text-slate-700 dark:text-slate-200"
                  >
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((g) => (
                      <option key={g} value={g}>
                        Group {g} Needed
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Broadcast Message</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Describe the medical emergency, hospital detail or quantity needed..."
                    value={emergMessage}
                    onChange={(e) => setEmergMessage(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm font-semibold outline-none focus:ring-2 focus:ring-red-500/20 text-slate-800 dark:text-slate-100 resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Transfusion Location / Address</label>
                  <input
                    type="text"
                    required
                    placeholder="Hospital, clinic or blood bank address"
                    value={emergAddress}
                    onChange={(e) => setEmergAddress(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm font-semibold outline-none focus:ring-2 focus:ring-red-500/20 text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div className="bg-red-50 dark:bg-red-950/20 p-3 rounded-xl border border-red-200/50 dark:border-red-900/30 text-[11px] text-red-600 dark:text-red-400 font-semibold leading-relaxed">
                  ⚠️ This publishes a critical beacon to all compatible donors in this general geocoded radial range immediately. Use with discretion.
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowBroadcastModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={publishingEmergency}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg cursor-pointer shadow-sm hover:shadow-md disabled:bg-slate-300 flex items-center gap-1 select-none"
                  >
                    {publishingEmergency ? "Broadcasting..." : "Lodge Broadcast"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
