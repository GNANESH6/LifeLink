/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Search, MapPin, Phone, Heart, Grid, Map, UserCheck, ShieldAlert, Navigation2, LogIn, User, Bell, Volume2, Plus, X, Radio } from "lucide-react";
import { useAuth } from "../context/AuthContext.js";
import { DonorMatch, AvailabilityStatus, DonorType, EmergencyRequest } from "../types.js";
import DonorMap from "./DonorMap.js";
import { motion, AnimatePresence } from "motion/react";
import { apiUrl } from "../api.js";

interface DashboardViewProps {
  onNavigate: (view: string) => void;
  addToast: (message: string, type: "success" | "error" | "info") => void;
}

export default function DashboardView({ onNavigate, addToast }: DashboardViewProps) {
  const { user, token, updateUserProfile } = useAuth();
  
  // Dashboard modes: "recipient" (find blood), "donor" (update voluntary settings), or "emergency" (live broadcasts)
  const [activeTab, setActiveTab] = useState<"recipient" | "donor" | "emergency">("recipient");

  // Search parameters for finding donors
  const [searchBloodGroup, setSearchBloodGroup] = useState("O+");
  const [searchRadius, setSearchRadius] = useState<number>(25); // default 25km
  
  // Results
  const [matchingDonors, setMatchingDonors] = useState<DonorMatch[]>([]);
  const [selectedDonor, setSelectedDonor] = useState<DonorMatch | null>(null);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Map settings
  const [mapCenter, setMapCenter] = useState<[number, number] | undefined>(undefined);

  // Custom Google Maps style location search box
  const [customLocationQuery, setCustomLocationQuery] = useState("");
  const [customSearching, setCustomSearching] = useState(false);

  // Emergency request states
  const [emergencyRequests, setEmergencyRequests] = useState<EmergencyRequest[]>([]);
  const [loadingEmergencies, setLoadingEmergencies] = useState(false);
  
  // Broadcast Form Form-States
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [emergBloodGroup, setEmergBloodGroup] = useState("O-");
  const [emergMessage, setEmergMessage] = useState("");
  const [emergAddress, setEmergAddress] = useState("");
  const [publishingEmergency, setPublishingEmergency] = useState(false);

  // Simulated push notification banner state
  const [pushBanner, setPushBanner] = useState<{
    show: boolean;
    bloodGroup: string;
    message: string;
    userName: string;
    address: string;
  }>({
    show: false,
    bloodGroup: "",
    message: "",
    userName: "",
    address: ""
  });

  // Sort matching donors by availability status (Available first, then Emergency, then Not Available/Unavailable)
  // Ties within the same status are sorted by distance range
  const sortedMatchingDonors = React.useMemo(() => {
    return [...matchingDonors].sort((a, b) => {
      const getScore = (status?: string) => {
        if (status === "Available") return 2;
        if (status === "Emergency") return 1;
        return 0;
      };
      const scoreA = getScore(a.availability);
      const scoreB = getScore(b.availability);
      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }
      return (a.distance ?? Infinity) - (b.distance ?? Infinity);
    });
  }, [matchingDonors]);

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
      console.warn("Failed to fetch emergency requests:", err);
    } finally {
      setLoadingEmergencies(false);
    }
  };

  useEffect(() => {
    fetchEmergencyRequests();
  }, [token]);

  // Sound play simulation for push notification
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
    
    let lat = 0;
    let lng = 0;
    if (user && user.location && user.location.coordinates[0] !== 0) {
      lng = user.location.coordinates[0];
      lat = user.location.coordinates[1];
    } else if (mapCenter && mapCenter[0] !== 0) {
      lat = mapCenter[0];
      lng = mapCenter[1];
    }

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

      const data = await res.json();
      addToast("Emergency broadcast published successfully!", "success");
      
      playBeaconSound();

      setEmergMessage("");
      setEmergAddress("");
      setShowBroadcastModal(false);

      // Trigger "push notification" simulation banner overlay!
      setPushBanner({
        show: true,
        bloodGroup: data.emergencyRequest.bloodGroup,
        message: data.emergencyRequest.message,
        userName: data.emergencyRequest.userName,
        address: data.emergencyRequest.address
      });

      // Automatically dismiss the push notification banner after 6 seconds
      setTimeout(() => {
        setPushBanner(prev => ({ ...prev, show: false }));
      }, 6000);

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

  // Set default seeking blood group setting upon loading without auto-scanning
  useEffect(() => {
    if (user) {
      setSearchBloodGroup(user.bloodGroup);
    }
  }, [user]);

  // Hook to handle locating a donor from directory redirection
  useEffect(() => {
    const selectedDonorStr = localStorage.getItem("selected_donor_for_map");
    if (selectedDonorStr && user) {
      try {
        const donorToLocate: DonorMatch = JSON.parse(selectedDonorStr);
        localStorage.removeItem("selected_donor_for_map");
        
        // Switch to recipient tab
        setActiveTab("recipient");
        
        // Set hasSearched flag to show matching results
        setHasSearched(true);
        
        // Inject or prepend to matching donors list
        setMatchingDonors((prev) => {
          const exists = prev.some((d) => d.id === donorToLocate.id);
          if (exists) return prev;
          return [donorToLocate, ...prev];
        });
        
        // Set selected donor to highlight them
        setSelectedDonor(donorToLocate);
        
        // Center map around the donor's coordinates
        if (donorToLocate.location?.coordinates) {
          const [lng, lat] = donorToLocate.location.coordinates;
          setMapCenter([lat, lng]);
        }
        
        addToast(`Now locating ${donorToLocate.name} on the Map`, "info");
      } catch (err) {
        console.warn("Locate donor JSON parse error:", err);
      }
    }
  }, [user]);

  const handleCustomLocate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customLocationQuery.trim()) {
      addToast("Please enter a location name or coordinates.", "error");
      return;
    }

    setCustomSearching(true);
    
    // Check if input looks like coordinates (e.g., "15.9129, 79.74" or "15.9129 79.74")
    const coordRegex = /^\s*(-?\d+(\.\d+)?)\s*[\s,]\s*(-?\d+(\.\d+)?)\s*$/;
    const match = customLocationQuery.match(coordRegex);
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[3]);
      setMapCenter([lat, lng]);
      addToast(`Centered map to custom coordinates: [${lat.toFixed(4)}, ${lng.toFixed(4)}]`, "success");
      setCustomSearching(false);
      return;
    }

    // Call standard geocoding
    try {
      const res = await fetch(apiUrl("/location/geocode"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ address: customLocationQuery }),
      });

      if (!res.ok) {
        throw new Error("Failed to Geocode address");
      }

      const data = await res.json();
      if (data && data.latitude !== undefined && data.longitude !== undefined) {
        setMapCenter([data.latitude, data.longitude]);
        addToast(`Located: ${data.address || customLocationQuery}`, "success");
      } else {
        addToast("Location not resolved. Try a different spelling or city.", "error");
      }
    } catch (err) {
      console.warn("Geocoding failed:", err);
      addToast("Failed to resolve location address.", "error");
    } finally {
      setCustomSearching(false);
    }
  };

  // Handle Finding Donors
  const handleFindNearbyDonors = async (bloodType: string, radius: number) => {
    setSearching(true);

    let lat: number = 0;
    let lng: number = 0;
    let locationLabel = "your profile location";

    // 1. If we have a custom focused map center (from geocoding query or coordinates input), we search around it!
    if (mapCenter && mapCenter[0] !== 0 && mapCenter[1] !== 0) {
      lat = mapCenter[0];
      lng = mapCenter[1];
      locationLabel = "the selected map center";
    }
    // 2. Otherwise fall back to user profile location
    else if (user && user.location && user.location.coordinates[0] !== 0) {
      lng = user.location.coordinates[0];
      lat = user.location.coordinates[1];
      locationLabel = "your home location";
    }
    // 3. If neither, but there is text in the search input box, let's geocode it inline first!
    else if (customLocationQuery.trim()) {
      try {
        const res = await fetch(apiUrl("/location/geocode"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ address: customLocationQuery }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data && data.latitude !== undefined && data.longitude !== undefined) {
            lat = data.latitude;
            lng = data.longitude;
            setMapCenter([lat, lng]);
            locationLabel = data.address || customLocationQuery;
          } else {
            addToast("Could not resolve the entered location. Please check spelling or verify coordinates.", "error");
            setSearching(false);
            return;
          }
        } else {
          addToast("Failed to geocode the entered search location.", "error");
          setSearching(false);
          return;
        }
      } catch (err) {
        console.warn("Inline geocode failed:", err);
        addToast("Error resolving your searched location.", "error");
        setSearching(false);
        return;
      }
    } else {
      // 4. Truly empty, raise helpful prompt
      addToast("Failed to identify a scan origin. Please enter a custom search city or save your coordinates on your Profile page.", "error");
      setSearching(false);
      return;
    }

    try {
      const url = apiUrl(`/users/nearby?bloodGroup=${encodeURIComponent(bloodType)}&radius=${radius}&latitude=${lat}&longitude=${lng}`);
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to scan nearby matching database records");
      }

      const result = await response.json();
      setMatchingDonors(result.donors || []);
      setSelectedDonor(null); // clear selection
      setHasSearched(true);

      if (result.donors && result.donors.length > 0) {
        addToast(`Success! Found ${result.count} matching donors within ${radius} km of ${locationLabel}.`, "success");
        // Senior developer choice: Keep map centered at our target search origin coordinates so they can see context!
        setMapCenter([lat, lng]);
      } else {
        addToast(`No active donors found within ${radius} km of ${locationLabel}.`, "info");
      }
    } catch (err: any) {
      console.warn("Scanning nearby donors failed:", err);
      addToast(err.message || "Donor search error", "error");
    } finally {
      setSearching(false);
    }
  };

  // Toggle Donor Availability Status
  const handleToggleAvailability = async (currentStatus: AvailabilityStatus) => {
    const nextStatus: AvailabilityStatus = currentStatus === "Available" ? "Not Available" : "Available";
    
    addToast("Updating availability settings...", "info");
    const success = await updateUserProfile({ availability: nextStatus });
    
    if (success) {
      addToast(`Status updated successfully to: ${nextStatus === "Available" ? "Active volunteer" : "Temporarily offline"}`, "success");
    } else {
      addToast("Failed to alter online state", "error");
    }
  };

  if (!user) {
    return (
      <div className="text-center py-24 space-y-4 max-w-sm mx-auto">
        <ShieldAlert className="w-12 h-12 text-slate-400 mx-auto" />
        <h3 className="text-xl font-bold">Authentication Required</h3>
        <p className="text-slate-500 text-sm">Please log in to register changes or geolocate matching donors.</p>
        <button
          onClick={() => onNavigate("login")}
          className="px-6 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold cursor-pointer shadow hover:bg-red-700"
        >
          Sign In Now
        </button>
      </div>
    );
  }

  const [userLng, userLat] = user.location.coordinates;

  return (
    <div className="space-y-8 pb-12 max-w-7xl mx-auto px-4">
      {/* Dynamic Tab Selector header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="space-y-1">
          <h2 className="text-3xl font-display font-medium text-slate-950 dark:text-white">Atlas View</h2>
          <p className="text-slate-500 dark:text-slate-450 text-xs sm:text-sm">Manage your vital availability or matching nearby donors.</p>
        </div>

        <div className="bg-slate-100 dark:bg-slate-905 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl flex flex-wrap items-center gap-1 shrink-0 w-full sm:w-auto border border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab("recipient")}
            className={`flex-1 sm:flex-none py-2 px-4 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === "recipient"
                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200/50 dark:border-slate-700"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            <Search className="w-3.5 h-3.5 text-red-500" />
            Recipient Search Map
          </button>
          
          <button
            onClick={() => setActiveTab("donor")}
            className={`flex-1 sm:flex-none py-2 px-4 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === "donor"
                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200/50 dark:border-slate-700"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
            Donor Status Portal
          </button>

          <button
            onClick={() => setActiveTab("emergency")}
            className={`flex-1 sm:flex-none py-2 px-4 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === "emergency"
                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200/50 dark:border-slate-700"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
            id="tab-emergency-alerts-board"
          >
            <Radio className="w-3.5 h-3.5 text-red-650 text-red-600 animate-pulse" />
            Emergency Alerts Board
          </button>
        </div>
      </div>

      {/* RECIPIENT LAYOUT */}
      {activeTab === "recipient" && (
        <div className="space-y-6">
          {/* Geolocation check flag when coordinates are omitted */}
          {userLat === 0 && userLng === 0 && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
              <span className="flex flex-col sm:flex-row items-center gap-2.5 font-medium text-center sm:text-left">
                <ShieldAlert className="w-5 h-5 text-yellow-600 shrink-0" />
                <span>Your home coordinates have not been indexed. To calculate near metrics, please save your coordinates on your Profile tab!</span>
              </span>
              <button
                onClick={() => onNavigate("profile")}
                className="w-full sm:w-auto px-4 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-bold shrink-0 cursor-pointer text-center"
              >
                Go to Profile
              </button>
            </div>
          )}

          {/* Quick Filter & Location Search Section */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
              
              {/* 1. Google Maps Style Search Field */}
              <div className="md:col-span-8 lg:col-span-9 space-y-1.5 text-left">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Location Coordinates or Address</label>
                <form onSubmit={handleCustomLocate} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1.5">
                  <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                      <Map className="w-4 h-4 text-slate-400" />
                    </span>
                    <input
                      type="text"
                      placeholder="Search Google Maps style: enter city, country or lat, lng..."
                      value={customLocationQuery}
                      onChange={(e) => setCustomLocationQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-transparent text-xs sm:text-sm outline-none font-semibold text-slate-800 placeholder-slate-400"
                      id="maps-custom-locator-query"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={customSearching}
                    className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold text-xs px-5 py-2.5 rounded-lg cursor-pointer shadow transition-all shrink-0 flex items-center justify-center gap-1.5"
                    id="maps-custom-locator-submit"
                  >
                    <MapPin className="w-3.5 h-3.5 text-red-500" />
                    {customSearching ? "Locating..." : "Locate on Map"}
                  </button>
                </form>
              </div>

              {/* 2. Blood compatibility group selector */}
              <div className="md:col-span-4 lg:col-span-3 space-y-1.5 text-left">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Compatible Group</label>
                <select
                  value={searchBloodGroup}
                  onChange={(e) => setSearchBloodGroup(e.target.value)}
                  className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-red-500/20"
                >
                  {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Any"].map((group) => (
                    <option key={group} value={group}>
                      Seeking {group}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sub-row for slider presets, range adjustment and Scan triggers */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end pt-4 border-t border-slate-100/80">
              
              {/* 3. Radius presets & slider controls */}
              <div className="md:col-span-8 space-y-2 text-left">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                  <span>Match Search Radius</span>
                  <span className="text-red-650 font-bold font-mono text-red-600">{searchRadius} km</span>
                </div>
                
                {/* Preset Quick Select with layoutId spring transition */}
                <div className="grid grid-cols-5 gap-1 p-1 bg-slate-100 border border-slate-200/50 rounded-xl relative">
                  {[
                    { label: "Local", val: 5 },
                    { label: "City", val: 15 },
                    { label: "State", val: 30 },
                    { label: "Wide", val: 50 },
                    { label: "Max", val: 100 },
                  ].map((preset) => {
                    const isActive = searchRadius === preset.val;
                    return (
                      <button
                        key={preset.val}
                        type="button"
                        onClick={() => setSearchRadius(preset.val)}
                        className={`relative py-1.5 text-[10px] font-bold rounded-lg transition-colors z-10 cursor-pointer text-center select-none ${
                          isActive ? "text-white" : "text-slate-600 hover:text-slate-800"
                        }`}
                      >
                        {isActive && (
                          <motion.span
                            layoutId="activeRangePreset"
                            className="absolute inset-0 bg-red-600 rounded-lg shadow-sm"
                            transition={{ type: "spring", stiffness: 380, damping: 30 }}
                            style={{ zIndex: -1 }}
                          />
                        )}
                        <span className="block leading-none font-bold">{preset.label}</span>
                        <span className="block text-[8px] opacity-75 mt-0.5 leading-none">{preset.val}k</span>
                      </button>
                    );
                  })}
                </div>

                {/* Fine tuning slider */}
                <div className="flex items-center gap-3 pt-1">
                  <input
                    type="range"
                    min="5"
                    max="100"
                    step="5"
                    value={searchRadius}
                    onChange={(e) => setSearchRadius(parseInt(e.target.value))}
                    className="flex-1 accent-red-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg outline-none"
                  />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono shrink-0">Fine Tune Range</span>
                </div>
              </div>

              {/* 4. Trigger Scan Button */}
              <div className="md:col-span-4 w-full">
                <button
                  onClick={() => handleFindNearbyDonors(searchBloodGroup, searchRadius)}
                  disabled={searching}
                  className="w-full px-7 py-3 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-red-600/10 hover:shadow-red-600/25 transition-all duration-200 active:scale-[0.98] select-none cursor-pointer tracking-wide"
                  id="dashboard-search-triggers"
                >
                  <Search className="w-4 h-4 text-white shrink-0" />
                  {searching ? "Scanning Grid..." : "Scan Nearby Donors"}
                </button>
              </div>
            </div>
          </div>

          {/* Map + List Split Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Split Column 1: Map (Spans 8 cols on desktop) */}
            <div className="lg:col-span-7 xl:col-span-8 flex flex-col h-[400px] lg:h-[500px]">
              <DonorMap
                userLocation={user.location}
                donors={sortedMatchingDonors}
                selectedDonor={selectedDonor}
                onSelectDonor={(donor) => setSelectedDonor(donor)}
                centerCoords={mapCenter}
                emergencies={emergencyRequests}
              />
            </div>

            {/* Split Column 2: Results List (Spans 4 cols) */}
            <div className="lg:col-span-5 xl:col-span-4 flex flex-col h-[400px] lg:h-[500px] bg-white rounded-2xl border border-slate-150 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Matching Contacts</span>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-200/60 rounded-full text-slate-700">
                  {sortedMatchingDonors.length} active
                </span>
              </div>

              {/* Scrolling Card List */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-2">
                {!hasSearched ? (
                  <div className="text-center py-16 px-4 space-y-3">
                    <Grid className="w-8 h-8 text-slate-305 mx-auto" />
                    <h4 className="text-sm font-semibold text-slate-700">Search Nearby Donors</h4>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      Adjust compatibility filters and click "Scan Nearby Donors" to view live matches.
                    </p>
                  </div>
                ) : sortedMatchingDonors.length === 0 ? (
                  <div className="text-center py-16 px-4 space-y-3">
                    <Grid className="w-8 h-8 text-slate-300 mx-auto animate-pulse" />
                    <h4 className="text-sm font-semibold text-slate-900">No matches found</h4>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      Adjust your blood compatibility filters or expand match radius to locate compatible groups on map points.
                    </p>
                  </div>
                ) : (
                  sortedMatchingDonors.map((donor) => {
                    const badgeColorClass = "bg-red-50 border-red-100 text-red-800";
                    const isSelected = selectedDonor?.id === donor.id;

                    return (
                      <div
                        key={donor.id}
                        onClick={() => setSelectedDonor(donor)}
                        className={`p-3.5 rounded-xl border transition-all text-left space-y-2.5 cursor-pointer hover:border-slate-300 ${
                          isSelected
                            ? "bg-red-50/40 border-red-300/60 ring-2 ring-red-500/5 shadow-sm"
                            : "bg-white border-slate-150 text-slate-800"
                        }`}
                        id={`donor-card-item-${donor.id}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5">
                            <h4 className="font-bold text-slate-900 text-sm">{donor.name}</h4>
                            <p className="text-[11px] text-slate-400 font-medium line-clamp-1 flex items-center gap-0.5">
                              <MapPin className="w-3 h-3 shrink-0" /> {donor.address}
                            </p>
                          </div>

                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className="px-2.5 py-0.5 text-xs font-bold rounded-lg bg-red-600 text-white text-center">
                              {donor.bloodGroup}
                            </span>
                            <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded border uppercase ${badgeColorClass}`}>
                              Blood Donor
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-50 text-[11px] font-medium">
                          <span className="text-slate-400 flex items-center gap-1 font-mono">
                            <Navigation2 className="w-3 h-3 text-red-500" /> {donor.distance} km away
                          </span>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                localStorage.setItem("viewing_other_donor", JSON.stringify(donor));
                                onNavigate("profile");
                              }}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 flex items-center gap-1 cursor-pointer transition-colors"
                              id={`view-profile-btn-${donor.id}`}
                            >
                              <User className="w-3 h-3 text-slate-500" /> View Profile
                            </button>

                            {donor.phone && (
                              <a
                                href={`tel:${donor.phone}`}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                                id={`call-donor-btn-${donor.id}`}
                              >
                                <Phone className="w-3 h-3 text-white" /> Call
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DONOR LAYOUT STATUS CONTROL PANEL */}
      {activeTab === "donor" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1: Availability Status Control */}
          <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-xl font-display font-semibold text-slate-900">Voluntary Availability Settings</h3>
              <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
                As a volunteer donor, you control your presence dynamically. Toggle yourself ofline when you are unavailable or travel; toggle online status when you are fit and ready to accept phone calls for donor drives.
              </p>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Registration Status</span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-3 h-3 rounded-full ${
                        user.availability === "Available" ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                      }`}
                    ></span>
                    <span className="text-sm font-bold text-slate-800">
                      {user.availability === "Available" ? "Available & Active" : "Not Currently Available"}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleToggleAvailability(user.availability)}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold active:scale-95 transition-all shadow-sm cursor-pointer border ${
                    user.availability === "Available"
                      ? "bg-slate-900 hover:bg-slate-850 text-white border-slate-950"
                      : "bg-red-600 hover:bg-red-700 text-white border-red-700"
                  }`}
                  id="availability-toggle-trigger"
                >
                  {user.availability === "Available" ? "Go Offline" : "Go Online & Live"}
                </button>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 text-xs text-slate-400 leading-normal space-y-1">
              <span className="font-semibold text-slate-500">Security Warning:</span>
              <p>Your coordinates and phone are visible only to logged-in healthcare receivers scanning matches inside your filter location range.</p>
            </div>
          </div>

          {/* Card 2: Personal Profile card brief */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-xl font-display font-semibold text-slate-900">My Donor Badge</h3>
              
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-red-500 text-white font-display font-black rounded-2xl flex items-center justify-center text-xl shadow-md border-2 border-red-400">
                    {user.bloodGroup}
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-slate-900 leading-tight">{user.name}</h4>
                    <span className="px-2 py-0.5 text-[9px] bg-slate-100 text-slate-600 rounded border uppercase font-bold">
                      {user.donorType} Pledged
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5 pt-2 border-t border-slate-100 text-xs">
                  <div className="flex justify-between items-center text-slate-500">
                    <span>Contact Line:</span>
                    <span className="font-bold text-slate-900 font-mono">{user.phone}</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-slate-500">
                    <span>Email Match:</span>
                    <span className="font-bold text-slate-900 font-mono text-[11px] line-clamp-1">{user.email}</span>
                  </div>

                  <div className="space-y-1 pt-1.5 text-slate-500">
                    <span>Base Address:</span>
                    <span className="font-bold text-slate-800 line-clamp-2 leading-relaxed bg-slate-100/50 p-2 rounded-lg text-[11px]">
                      {user.address}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigate("profile")}
              className="w-full py-2.5 text-center text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-semibold transition-all cursor-pointer border border-slate-200"
              id="dash-edit-profile-action"
            >
              Update Registration Address
            </button>
          </div>
        </div>
      )}

      {/* EMERGENCY RADAR BROADCAST TAB */}
      {activeTab === "emergency" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
          {/* Left Column: Live Alerts Board */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-display font-semibold text-slate-900 dark:text-white">Active Blood Emergency Feed</h3>
                </div>
              </div>

              {loadingEmergencies ? (
                <div className="text-center py-12 text-slate-500">
                  <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-xs font-medium">Scanning network database records...</p>
                </div>
              ) : emergencyRequests.length === 0 ? (
                <div className="text-center py-16 px-4 space-y-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                  <Bell className="w-8 h-8 text-slate-350 dark:text-slate-600 mx-auto animate-pulse" />
                  <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 font-display">All Clear on Local Grid</h4>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 max-w-xs mx-auto text-center leading-relaxed">
                    No emergency request broadcasts have been lodged in your area in the past 24 hours.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {emergencyRequests.map((req) => {
                    const isOwner = req.userId === user.id || req.id.startsWith("er-seed");
                    return (
                      <div
                        key={req.id}
                        className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 hover:border-slate-350 dark:hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                      >
                        <div className="flex items-start gap-3.5">
                          <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex flex-col items-center justify-center font-bold font-display shadow-inner shrink-0 border border-red-500/15">
                            <span className="text-sm leading-tight">{req.bloodGroup}</span>
                            <span className="text-[9px] uppercase font-mono tracking-wider font-extrabold text-red-500 animate-pulse mt-0.5">Alert</span>
                          </div>
                          <div className="space-y-1 text-left">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-slate-900 dark:text-white text-sm">{req.userName}</span>
                              <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 bg-slate-200/50 dark:bg-slate-800 px-2 py-0.5 rounded">
                                {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">{req.message}</p>
                            <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-normal">
                              <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                              <span className="line-clamp-1">{req.address}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex sm:flex-col items-end gap-2.5 shrink-0 justify-end border-t sm:border-t-0 border-slate-100 dark:border-slate-800/80 pt-3.5 sm:pt-0">
                          {req.userPhone && (
                            <a
                              href={`tel:${req.userPhone}`}
                              className="px-4 py-2 bg-red-650 hover:bg-red-700 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                            >
                              <Phone className="w-3.5 h-3.5" /> Call Volunteer
                            </a>
                          )}
                          
                          {isOwner && (
                            <button
                              onClick={() => handleCloseEmergency(req.id)}
                              className="px-3.5 py-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-400 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg cursor-pointer transition-colors"
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
            </div>
          </div>

          {/* Right Column: Trigger Alert CTA Panel */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm text-center space-y-6 flex flex-col justify-between h-full">
              <div className="space-y-4">
                <div className="w-14 h-14 bg-red-50 dark:bg-red-950/20 border-2 border-red-500/10 rounded-full flex items-center justify-center mx-auto text-xl shadow-inner relative">
                  <Radio className="w-6 h-6 text-red-655 text-red-600 animate-pulse" />
                  <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-red-600 border-2 border-white dark:border-slate-900 animate-ping"></span>
                </div>
                
                <h4 className="text-lg font-display font-semibold text-slate-900 dark:text-white">Need Urgent Blood?</h4>
                <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm leading-relaxed">
                  Publish a localized push-notification-like radar broadcast for sudden transfusions, matching donor drives, or urgent surgical blood requirements.
                </p>
              </div>

              <button
                onClick={() => setShowBroadcastModal(true)}
                className="w-full py-3 bg-slate-900 dark:bg-red-600 hover:bg-slate-850 dark:hover:bg-red-700 text-white text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-red-500/5 transition-all active:scale-95 border border-slate-950 dark:border-red-700"
                id="trigger-broadcast-modal-btn"
              >
                <Plus className="w-4 h-4 text-white" />
                Broadcast Localized Alert
              </button>
            </div>
          </div>
        </div>
      )}

    {/* 4. BROADCAST EMERGENCY MODAL DIALOG */}
    <AnimatePresence>
      {showBroadcastModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4 text-left"
        >
          <motion.div
            initial={{ scale: 0.95, y: 15 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 15 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative space-y-5"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-600 animate-pulse" />
                <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white">Broadcast Emergency Alert</h3>
              </div>
              <button
                onClick={() => setShowBroadcastModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleBroadcastEmergency} className="space-y-4">
              <div className="space-y-1.5 focus-within:text-red-500">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Needed Blood Group</label>
                <select
                  value={emergBloodGroup}
                  onChange={(e) => setEmergBloodGroup(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-xl text-xs sm:text-sm font-semibold text-slate-705 text-slate-700 dark:text-slate-100 outline-none focus:ring-2 focus:ring-red-500/20"
                >
                  {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((g) => (
                    <option key={g} value={g}>{g} Needed</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5 focus-within:text-red-500">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Hospital Address / Location</label>
                <input
                  type="text"
                  required
                  placeholder="E.g., San Francisco General Hospital Ward 4 or City Clinic..."
                  value={emergAddress}
                  onChange={(e) => setEmergAddress(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-xl text-xs sm:text-sm font-semibold text-slate-705 text-slate-700 dark:text-slate-100 outline-none focus:ring-2 focus:ring-red-500/20"
                  id="emerg-broadcast-address"
                />
                <span className="text-[9px] text-slate-405 dark:text-slate-500 block leading-tight pt-0.5 font-medium">
                  Note: The broadcast is geocoded to volunteer radiuses automatically based on your location coordinates.
                </span>
              </div>

              <div className="space-y-1.5 focus-within:text-red-500">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Emergency Alert Message</label>
                <textarea
                  required
                  rows={3}
                  maxLength={200}
                  placeholder="E.g., Urgent: Patient during bypass surgery requires universal blood support in immediate 15km radar range..."
                  value={emergMessage}
                  onChange={(e) => setEmergMessage(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-xl text-xs sm:text-sm font-semibold text-slate-755 text-slate-700 dark:text-slate-100 outline-none focus:ring-2 focus:ring-red-500/20 resize-none"
                  id="emerg-broadcast-message"
                />
              </div>

              <div className="flex gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800/80 justify-end">
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-750 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={publishingEmergency}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-350 dark:disabled:bg-slate-800 text-white text-xs font-bold rounded-lg shadow cursor-pointer flex items-center gap-1.5"
                  id="submit-broadcast-siren-btn"
                >
                  {publishingEmergency ? (
                    <>Launching...</>
                  ) : (
                    <>
                      <Bell className="w-3.5 h-3.5 text-white animate-bounce" />
                      Launch Broadcast
                    </>
                  )}
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
