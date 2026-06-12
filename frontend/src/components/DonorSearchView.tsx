/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Search, MapPin, Phone, Heart, Grid, Filter, Map, Navigation2, Compass, ArrowDownCircle, User, X, Building, Clock, Activity, ShieldAlert } from "lucide-react";
import { useAuth } from "../context/AuthContext.js";
import { DonorMatch, EmergencyRequest } from "../types.js";
import { motion, AnimatePresence } from "motion/react";
import { apiUrl } from "../api.js";

interface DonorSearchViewProps {
  onNavigate: (view: string) => void;
  addToast: (message: string, type: "success" | "error" | "info") => void;
}

export default function DonorSearchView({ onNavigate, addToast }: DonorSearchViewProps) {
  const { user, token } = useAuth();
  
  // States
  const [bloodGroup, setBloodGroup] = useState("Any");
  const [city, setCity] = useState("");
  const [radius, setRadius] = useState<number>(50); // Default 50 km
  const [useGeospatial, setUseGeospatial] = useState<boolean>(false);
  const [nameFilter, setNameFilter] = useState("");

  const [donors, setDonors] = useState<DonorMatch[]>([]);
  const [visibleCount, setVisibleCount] = useState<number>(6); // Show initially 6
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const [emergencies, setEmergencies] = useState<EmergencyRequest[]>([]);
  const [loadingEmergencies, setLoadingEmergencies] = useState(false);

  const fetchEmergencies = async () => {
    setLoadingEmergencies(true);
    try {
      const res = await fetch(apiUrl("/emergency"));
      if (res.ok) {
        const data = await res.json();
        setEmergencies(data || []);
      }
    } catch (err) {
      console.warn("Failed to fetch search page emergencies:", err);
    } finally {
      setLoadingEmergencies(false);
    }
  };

  useEffect(() => {
    fetchEmergencies();
  }, []);

  // Blood centers sidebar states
  const [showCentersDrawer, setShowCentersDrawer] = useState(false);
  const [centers, setCenters] = useState<any[]>([]);
  const [loadingCenters, setLoadingCenters] = useState(false);
  const [centersError, setCentersError] = useState("");

  const fetchNearbyCenters = async () => {
    setLoadingCenters(true);
    setCentersError("");
    try {
      let lat = 0;
      let lng = 0;

      // Use user profile coordinates if present
      if (user && user.location && user.location.coordinates[0] !== 0) {
        lng = user.location.coordinates[0];
        lat = user.location.coordinates[1];
      }

      // Geolocation API fallback
      if (lat === 0 && lng === 0) {
        if (navigator.geolocation) {
          const pos = await new Promise<any>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 });
          }).catch(() => null);

          if (pos && pos.coords) {
            lat = pos.coords.latitude;
            lng = pos.coords.longitude;
          }
        }
      }

      // Global fallback coordinates (Andhra Pradesh center coordinates used in DB)
      if (lat === 0 && lng === 0) {
        lat = 15.9129;
        lng = 79.7400;
      }

      const res = await fetch(apiUrl(`/location/blood-centers?latitude=${lat}&longitude=${lng}`), {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error("Failed to fetch closest registered blood centers");
      }

      const data = await res.json();
      setCenters(data.centers || []);
    } catch (err: any) {
      console.warn("fetchNearbyCenters error:", err);
      setCentersError(err.message || "Failed to locate any nearby blood centers");
    } finally {
      setLoadingCenters(false);
    }
  };

  const handleOpenCenters = () => {
    setShowCentersDrawer(true);
    fetchNearbyCenters();
  };

  // Memoized sorting helper to put "Available" first, then "Emergency", then others
  // Within same availability level, sorts by distance range
  const sortedDonors = React.useMemo(() => {
    return [...donors].sort((a, b) => {
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
  }, [donors]);

  // Auto-fetch on mount
  useEffect(() => {
    handleSearch();
  }, []);

  // Infinite Scroll Trigger
  useEffect(() => {
    const handleScroll = () => {
      if (loading || visibleCount >= donors.length) return;
      const threshold = 150; 
      const totalHeight = document.documentElement.scrollHeight;
      const currentScroll = window.innerHeight + window.scrollY;
      if (totalHeight - currentScroll < threshold) {
        setVisibleCount((prev) => Math.min(prev + 6, donors.length));
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loading, donors.length, visibleCount]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setVisibleCount(6);

    try {
      // Build query string params
      let params = new URLSearchParams();
      
      if (bloodGroup && bloodGroup !== "Any") {
        params.append("bloodGroup", bloodGroup);
      }
      
      if (city.trim() !== "") {
        params.append("city", city.trim());
      }

      if (nameFilter.trim() !== "") {
        params.append("name", nameFilter.trim());
      }

      // Add user coordinates to support radial sorting if checked
      if (useGeospatial && user && user.location && user.location.coordinates[0] !== 0) {
        const [lng, lat] = user.location.coordinates;
        params.append("latitude", lat.toString());
        params.append("longitude", lng.toString());
        params.append("radius", radius.toString());
      }

      const response = await fetch(apiUrl(`/users/search?${params.toString()}`), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to search matching donors");
      }

      const data = await response.json();
      setDonors(data.donors || []);
      setHasSearched(true);
      
      if (data.donors && data.donors.length > 0) {
        addToast(`Found ${data.count} matches matching search filters.`, "success");
      }
    } catch (err: any) {
      console.warn("Search donors error:", err);
      addToast(err.message || "Donor search error", "error");
    } finally {
      setLoading(false);
    }
  };

  const [uLng, uLat] = user?.location?.coordinates || [0, 0];
  const hasCoordinates = uLat !== 0 || uLng !== 0;

  return (
    <div className="space-y-8 pb-12 max-w-6xl mx-auto px-4">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-left">
        <div className="space-y-1">
          <h2 className="text-3xl font-display font-medium text-slate-900">Donor Directory Grid</h2>
          <p className="text-slate-500 text-xs sm:text-sm">Filter and track matching blood types and organ pledges.</p>
        </div>
        <button
          type="button"
          onClick={handleOpenCenters}
          className="self-start sm:self-auto px-4.5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow active:scale-95 shrink-0"
          id="btn-toggle-blood-centers"
        >
          <Building className="w-4 h-4 text-white" />
          <span>Registered Blood Centers Nearby</span>
        </button>
      </div>

      {/* Active Blood Emergency Alerts Section */}
      <AnimatePresence>
        {emergencies.length > 0 && (
          <div className="space-y-4 text-left" id="directory-emergency-header">
            <div className="flex items-center gap-2 border-b border-rose-100 pb-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-650 bg-red-600"></span>
              </span>
              <h3 className="font-display font-black text-rose-650 dark:text-rose-450 text-xs tracking-wider uppercase flex items-center gap-1.5 animate-pulse">
                <ShieldAlert className="w-5 h-5 text-red-600" /> Active Emergency Alerts Requiring Urgent Help
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {emergencies.map((req) => (
                <div
                  key={req.id}
                  className="bg-rose-50/70 dark:bg-rose-950/20 border border-rose-150/85 dark:border-rose-900/40 rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-xs hover:border-rose-300 dark:hover:border-rose-800 transition-colors"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-red-600 text-white font-black rounded-lg text-xs shadow-xs">
                          {req.bloodGroup}
                        </span>
                        <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">{req.userName}</h4>
                      </div>
                      <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 font-semibold uppercase">
                        {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-750 dark:text-slate-350 font-semibold bg-white/95 dark:bg-slate-900 p-2.5 rounded-xl border border-rose-100/60 dark:border-rose-900/30 leading-relaxed italic">
                      "{req.message}"
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span className="line-clamp-1">{req.address}</span>
                    </div>
                  </div>

                  <div className="border-t border-rose-100/70 dark:border-rose-900/30 pt-2 flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        localStorage.setItem("selected_donor_for_map", JSON.stringify({
                          ...req,
                          name: req.userName,
                          phone: req.userPhone,
                        }));
                        onNavigate("dashboard");
                      }}
                      className="text-xs font-bold text-red-650 dark:text-red-400 hover:underline cursor-pointer"
                    >
                      Locate on Atlas Map
                    </button>
                    {req.userPhone && (
                      <a
                        href={`tel:${req.userPhone}`}
                        className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-xs"
                      >
                        <Phone className="w-3 h-3 text-white" /> Call Requester
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Filter panel */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <form onSubmit={handleSearch} className="space-y-5" id="advance-search-form">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

            {/* Name Search Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 block uppercase tracking-wider">Search by Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Name"
                  value={nameFilter}
                  onChange={(e) => setNameFilter(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-red-500/20 text-slate-800 font-semibold placeholder-slate-400"
                  id="search-name-input"
                />
              </div>
            </div>
            
            {/* Blood type Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 block uppercase tracking-wider">Blood Group</label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-red-500/20 text-slate-700 font-semibold"
                id="search-blood-picker"
              >
                <option value="Any">All Blood Groups</option>
                {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((g) => (
                  <option key={g} value={g}>
                    Group {g}
                  </option>
                ))}
              </select>
            </div>

            {/* City search text input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 block uppercase tracking-wider">Search by Location</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                  <MapPin className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Location"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-red-500/20 text-slate-800 font-semibold placeholder-slate-400"
                  id="search-city-input"
                />
              </div>
            </div>

            {/* Distance Slider controls */}
            <div className={`space-y-1.5 ${(!useGeospatial || !hasCoordinates) && "opacity-40"}`}>
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-400 block uppercase tracking-wider">Proximity Range</label>
                <span className="text-xs font-bold text-red-600 block">{radius} km</span>
              </div>
              <input
                type="range"
                min="5"
                max="200"
                step="5"
                disabled={!useGeospatial || !hasCoordinates}
                value={radius}
                onChange={(e) => setRadius(parseInt(e.target.value))}
                className="w-full accent-red-600 cursor-pointer h-1.5 bg-slate-100 rounded-lg outline-none"
              />
            </div>

          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2 border-t border-slate-50">
            {/* Toggle state-based geo radial filters */}
            <label className="flex items-center gap-2 text-xs font-medium text-slate-500 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={useGeospatial}
                disabled={!hasCoordinates}
                onChange={(e) => setUseGeospatial(e.target.checked)}
                className="rounded border-slate-300 text-red-600 focus:ring-red-500 w-4 h-4"
              />
              Sort by Radial proximity (nearest first) using GPS coordinates
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow cursor-pointer text-center"
              id="directory-search-submit"
            >
              <Filter className="w-4 h-4 text-red-500" />
              {loading ? "Searching Directory..." : "Apply Filters"}
            </button>
          </div>
        </form>
      </div>

      {/* Grid listing content */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-24 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400 font-semibold">Updating database query list...</p>
          </div>
        ) : !hasSearched ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-100 shadow-sm max-w-sm mx-auto space-y-4 animate-fade-in">
            <Heart className="w-12 h-12 text-slate-300 mx-auto" />
            <div className="space-y-1">
              <h3 className="font-bold text-slate-700">Ready to search</h3>
              <p className="text-slate-500 text-xs leading-relaxed">
                Enter your search details above and click "Apply Filters" to query matching donors.
              </p>
            </div>
          </div>
        ) : donors.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-100 shadow-sm max-w-md mx-auto space-y-4">
            <Heart className="w-12 h-12 text-slate-300 mx-auto animate-pulse" />
            <div className="space-y-1">
              <h3 className="font-bold text-slate-900">No matches found</h3>
              <p className="text-slate-500 text-xs sm:text-sm">
                Try removing the city spelling tag, selecting a different blood type group, or expanding proximity range limits.
              </p>
            </div>
            <button
              onClick={() => {
                setNameFilter("");
                setCity("");
                setBloodGroup("Any");
                setRadius(100);
                setUseGeospatial(false);
                setTimeout(() => handleSearch(), 50);
              }}
              className="text-xs font-bold text-red-600 hover:underline cursor-pointer"
            >
              Reset Directories to default
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedDonors.slice(0, visibleCount).map((donor) => {
                const markerColor = "text-red-500";
                const badgeClass = "bg-red-50 text-red-800 border-red-200";

                return (
                  <div
                    key={donor.id}
                    className="relative bg-white p-4 sm:p-5 rounded-2xl border border-slate-150 shadow-sm hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between"
                    id={`directory-card-${donor.id}`}
                  >
                    <div className="space-y-4">
                      {/* Header Block with Name, Blood Group, Age */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <span className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center border ${badgeClass}`}>
                            <Heart className="w-4 h-4 fill-current text-red-500 shrink-0" />
                          </span>
                          <div className="text-left">
                            <h4 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">{donor.name}</h4>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 text-[10px] sm:text-xs mt-0.5">
                              {donor.age && (
                                <span className="text-slate-400 font-semibold font-mono tracking-wide">
                                  Age: {donor.age} yrs
                                </span>
                              )}
                              {donor.age && donor.gender && <span className="hidden sm:inline text-slate-300">•</span>}
                              {donor.gender && (
                                <span className="text-slate-400 font-semibold font-mono tracking-wide">
                                  {donor.gender}
                                </span>
                              )}
                            </div>
                            {donor.availability && (
                              <div className="flex items-center gap-1 mt-1">
                                <span className={`w-1.5 h-1.5 rounded-full ${donor.availability === "Available" ? "bg-emerald-500 animate-pulse" : donor.availability === "Emergency" ? "bg-amber-500 animate-pulse" : "bg-slate-400"}`}></span>
                                <span className="text-[9px] text-slate-500 font-bold tracking-wide uppercase leading-none font-mono">
                                  {donor.availability}
                                </span>
                              </div>
                            )}
                            {donor.distance !== undefined && donor.distance !== null && donor.distance > 0 ? (
                              <div className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded bg-amber-50 text-amber-800 text-[10px] font-bold leading-none font-mono">
                                <Navigation2 className="w-3 h-3 text-amber-500 fill-current shrink-0" />
                                {donor.distance} km away
                              </div>
                            ) : null}
                          </div>
                        </div>

                        {/* Top Right corner Blood Group Badge */}
                        <div className="flex flex-col items-end gap-1.5 shrink-0 select-none">
                          <span className="px-3 py-1.5 bg-red-600 text-white font-display font-black rounded-xl text-sm sm:text-base shadow shadow-red-500/20 leading-none">
                            {donor.bloodGroup}
                          </span>
                          <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded border ${badgeClass}`}>
                            Blood Donor
                          </span>
                        </div>
                      </div>

                      {/* Info block: Address, Phone, Coordinates, and Blood Group */}
                      <div className="space-y-3 text-xs text-slate-600 border-t border-slate-100 pt-3 text-left">
                        {donor.address && (
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                            <div>
                              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider leading-none mb-0.5">Address</span>
                              <span className="text-slate-700 font-medium leading-relaxed block">{donor.address}</span>
                            </div>
                          </div>
                        )}

                        {donor.location?.coordinates && (
                          <div className="flex items-start gap-2">
                            <Compass className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                            <div>
                              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider leading-none mb-0.5">Coordinates</span>
                              <span className="text-slate-700 font-mono text-[10px] font-medium bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 inline-block">
                                Lat: {donor.location.coordinates[1]?.toFixed(4)}, Lng: {donor.location.coordinates[0]?.toFixed(4)}
                              </span>
                            </div>
                          </div>
                        )}

                        {donor.phone && (
                          <div className="flex items-start gap-2">
                            <Phone className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                            <div>
                              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider leading-none mb-0.5">Contact Number</span>
                              <span className="text-slate-800 font-semibold">{donor.phone}</span>
                            </div>
                          </div>
                        )}

                        {donor.bloodGroup && (
                          <div className="flex items-start gap-2">
                            <Heart className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                            <div>
                              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider leading-none mb-0.5">Blood Group</span>
                              <span className="text-slate-800 font-bold">{donor.bloodGroup}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Footer */}
                    <div className="border-t border-slate-100 mt-4 pt-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => {
                          localStorage.setItem("viewing_other_donor", JSON.stringify(donor));
                          onNavigate("profile");
                        }}
                        className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 py-2.5 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors border border-slate-200 shrink-0"
                        id={`view-profile-btn-${donor.id}`}
                      >
                        <User className="w-4 h-4 text-slate-500" /> View Profile
                      </button>

                      {donor.phone ? (
                        <a
                          href={`tel:${donor.phone}`}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
                          id={`call-donor-btn-${donor.id}`}
                        >
                          <Phone className="w-3.5 h-3.5 text-white" /> Call Donor
                        </a>
                      ) : (
                        <span className="w-full bg-slate-100 text-slate-400 py-2.5 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 border border-slate-200 cursor-not-allowed shrink-0">
                          <Phone className="w-3.5 h-3.5 text-slate-300" /> Offline
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          localStorage.setItem("selected_donor_for_map", JSON.stringify(donor));
                          onNavigate("dashboard");
                        }}
                        className="w-full bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-red-600/10 hover:shadow-red-600/20 active:scale-[0.98] shrink-0"
                        id={`locate-map-btn-${donor.id}`}
                      >
                        <Map className="w-4 h-4 text-white" /> Locate on Map
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Infinite Scroll Load status indicator and fallback action */}
            <div className="pt-4 pb-8 flex flex-col items-center justify-center gap-3">
              <span className="text-xs text-slate-400 font-semibold">
                Showing {Math.min(visibleCount, donors.length)} of {donors.length} registered donors
              </span>
              {visibleCount < donors.length && (
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => Math.min(prev + 6, donors.length))}
                  className="px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-350 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-2 hover:shadow-xs cursor-pointer transition-all active:scale-95"
                >
                  <ArrowDownCircle className="w-4 h-4 text-red-500 animate-bounce" />
                  Load More Registered Donors
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 5. REGISTERED BLOOD CENTERS SIDEBAR */}
      <AnimatePresence>
        {showCentersDrawer && (
          <div className="fixed inset-0 z-50 overflow-hidden flex justify-end" id="blood-centers-sidebar-root">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCentersDrawer(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs cursor-pointer"
            />

            {/* Sidebar content panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col z-10 border-l border-slate-100 dark:border-slate-800"
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 bg-red-100 dark:bg-red-950/40 rounded-xl">
                    <Building className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </span>
                  <div className="text-left">
                    <h3 className="font-display font-bold text-slate-900 dark:text-white text-base">Blood Centers Nearby</h3>
                    <p className="text-[10px] text-slate-500 font-medium">Nearest registered locations from your location</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCentersDrawer(false)}
                  className="p-1.5 hover:bg-slate-150 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable list content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {loadingCenters ? (
                  <div className="py-20 text-center space-y-4">
                    <div className="w-8 h-8 border-3 border-red-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs text-slate-400 font-semibold font-mono">Tracing coordinates & matching centers...</p>
                  </div>
                ) : centersError ? (
                  <div className="p-4 bg-red-50 dark:bg-red-950/10 border border-red-200 dark:border-red-900/50 rounded-xl text-center space-y-2.5">
                    <p className="text-xs text-red-600 dark:text-red-400 font-medium">{centersError}</p>
                    <button
                      onClick={fetchNearbyCenters}
                      className="text-xs font-bold text-red-600 dark:text-red-400 hover:underline cursor-pointer"
                    >
                      Retry locating again
                    </button>
                  </div>
                ) : centers.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 space-y-2">
                    <Building className="w-10 h-10 text-slate-350 mx-auto" />
                    <p className="text-xs font-medium">No registered central distribution locations found near current area coordinates.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {centers.map((center: any) => (
                      <div
                        key={center.id}
                        className="p-4 bg-slate-50 dark:bg-slate-950/30 border border-slate-150 dark:border-slate-800/80 rounded-xl hover:border-red-200 dark:hover:border-red-950 transition-colors text-left space-y-3"
                      >
                        <div className="flex justify-between items-start gap-3">
                          <div className="space-y-1">
                            <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm leading-tight">
                              {center.name}
                            </h4>
                            <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs text-slate-400 font-mono">
                              <MapPin className="w-3.5 h-3.5" />
                              {center.distance} km away
                            </span>
                          </div>
                          <span className="shrink-0 text-[10px] font-bold px-2.5 py-1 rounded bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-mono">
                            {center.status}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-normal font-medium">
                          {center.address}
                        </p>

                        <div className="flex flex-wrap gap-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800/50">
                          {center.bloodTypesAvailable?.map((t: string) => (
                            <span
                              key={t}
                              className="text-[9px] font-extrabold px-1.5 py-0.5 bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 rounded font-mono border border-red-200/50 dark:border-red-900/40"
                            >
                              {t}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center justify-between text-[11px] pt-1">
                          <span className="text-slate-400 font-medium">
                            Total Donations: <strong className="text-slate-700 dark:text-slate-300 font-bold">{center.totalDonations} pints</strong>
                          </span>
                          <a
                            href={`tel:${center.phone}`}
                            className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 hover:opacity-85 font-bold font-mono text-[11px]"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            Call Center
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col gap-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium font-mono text-[10px]">Indexed coordinates:</span>
                  <span className="text-slate-700 dark:text-slate-300 font-semibold font-mono text-[10px] bg-slate-200 dark:bg-slate-900 border border-slate-150 px-1.5 py-0.5 rounded">
                    Active GPS Locator Mode
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCentersDrawer(false)}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl text-center cursor-pointer shadow transition-all active:scale-[0.98]"
                >
                  Close Directory Search
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
