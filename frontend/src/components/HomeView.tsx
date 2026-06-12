/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { Heart, MapPin, Search, ShieldCheck, ArrowRight, UserPlus, FileHeart, ShieldAlert, Phone } from "lucide-react";
import { motion } from "motion/react";
import BloodCompatibilityTable from "./BloodCompatibilityTable";
import DonorFAQs from "./DonorFAQs";
import { EmergencyRequest } from "../types.js";

interface HomeViewProps {
  onNavigate: (view: string) => void;
  isAuthenticated: boolean;
}

export default function HomeView({ onNavigate, isAuthenticated }: HomeViewProps) {
  const [stats, setStats] = useState({
    activeDonors: 0,
    organPledges: 0,
    cities: 1,
  });

  const [emergencies, setEmergencies] = useState<EmergencyRequest[]>([]);
  const [loadingEmergencies, setLoadingEmergencies] = useState(false);

  useEffect(() => {
    setLoadingEmergencies(true);
    fetch("/api/emergency")
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("Failed to fetch emergencies");
      })
      .then((data) => {
        setEmergencies(data || []);
      })
      .catch((err) => console.warn("Failed to fetch active emergencies:", err))
      .finally(() => setLoadingEmergencies(false));
  }, []);

  useEffect(() => {
    fetch("/api/users/stats")
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("Statistics retrieval failed");
      })
      .then((data) => {
        if (data) {
          setStats({
            activeDonors: data.activeDonors || 0,
            organPledges: data.organPledges || 0,
            cities: data.cities || 1,
          });
        }
      })
      .catch((err) => console.warn("Could not fetch database stats:", err));
  }, []);

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative px-6 pt-12 text-center max-w-4xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-450 rounded-full text-xs font-semibold"
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 dark:bg-emerald-300 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500 dark:bg-emerald-400"></span>
          </span>
          Emergency Matching active 24/7
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl sm:text-6xl font-display font-bold tracking-tight text-slate-900 dark:text-slate-50 leading-[1.1]"
        >
          Connecting Donors <br />
          <span className="text-red-650 dark:text-red-500">Saving Lives in Real-Time</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto"
        >
          LifeLink maps voluntary blood donors on an interactive geolocal grid, matching emergency requests with the nearest active donors instantly.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
        >
          <button
            onClick={() => onNavigate(isAuthenticated ? "donor-search" : "register")}
            className="w-full sm:w-auto px-8 py-3.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl shadow-lg shadow-red-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            id="hero-find-donor-btn"
          >
            <Search className="w-5 h-5" />
            Find Nearby Donors
            <ArrowRight className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => onNavigate(isAuthenticated ? "dashboard" : "login")}
            className="w-full sm:w-auto px-8 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium rounded-xl shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            id="hero-register-donor-btn"
          >
            <UserPlus className="w-5 h-5 text-red-500" />
            Register as Donor
          </button>
        </motion.div>
      </section>

      {/* Live Emergency Broadcasts Board */}
      <section id="home-emergency-alerts-board" className="max-w-5xl mx-auto px-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-650 bg-red-600"></span>
            </span>
            <h2 className="text-xl font-display font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-650 text-red-600 animate-pulse" /> Live Blood Emergency Feed
            </h2>
          </div>
          <span className="text-[10px] sm:text-xs font-semibold text-slate-400 dark:text-slate-500 font-mono tracking-widest uppercase">
            Emergency match system active
          </span>
        </div>

        {loadingEmergencies ? (
          <div className="p-10 text-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xs">
            <div className="w-8 h-8 border-3 border-red-650 dark:border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Scanning local and national grid databases...</p>
          </div>
        ) : emergencies.length === 0 ? (
          <div className="p-6 bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 text-emerald-800 dark:text-emerald-400 text-xs sm:text-sm text-left">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-450 shrink-0" />
              <span>
                <strong className="font-bold">Grid Secure:</strong> No blood emergencies currently reported in your area. All clear on local networks.
              </span>
            </div>
            <button
              onClick={() => onNavigate(isAuthenticated ? "dashboard" : "login")}
              className="w-full sm:w-auto px-4.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl active:scale-95 transition-all cursor-pointer shadow-xs whitespace-nowrap"
            >
              Post Emergency Request
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5" id="home-emergency-list">
            {emergencies.map((req) => (
              <div
                key={req.id}
                className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 rounded-2xl p-5 hover:border-red-300 dark:hover:border-slate-700 hover:shadow-md transition-all flex flex-col justify-between text-left gap-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-11 h-11 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex flex-col items-center justify-center font-bold font-display shadow-inner shrink-0 border border-red-500/10">
                        <span className="text-sm leading-none">{req.bloodGroup}</span>
                        <span className="text-[7.5px] uppercase font-bold tracking-wider text-red-600 dark:text-red-400 animate-pulse mt-0.5">ALERT</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm leading-tight">{req.userName}</h4>
                        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-505 font-mono">
                          {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                    <span className="text-[9.5px] font-mono text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/35 px-2 py-0.5 rounded-lg font-extrabold uppercase animate-pulse border border-rose-200/40 dark:border-rose-900/40">
                      CRITICAL NEED
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-semibold bg-slate-50 dark:bg-slate-950 px-3 py-2.5 border border-slate-150/50 dark:border-slate-800 rounded-xl">
                    {req.message}
                  </p>

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                    <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                    <span className="line-clamp-1">{req.address}</span>
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-3.5 flex items-center justify-between text-xs font-semibold">
                  <button
                    onClick={() => {
                      if (isAuthenticated) {
                        localStorage.setItem("selected_donor_for_map", JSON.stringify({
                          ...req,
                          name: req.userName,
                          phone: req.userPhone,
                        }));
                        onNavigate("dashboard");
                      } else {
                        onNavigate("login");
                      }
                    }}
                    className="text-xs font-bold text-red-650 dark:text-red-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    Locate Alert on Atlas
                  </button>

                  {req.userPhone && (
                    <a
                      href={`tel:${req.userPhone}`}
                      className="px-4 py-2 bg-red-650 hover:bg-red-700 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <Phone className="w-3.5 h-3.5" /> Call Volunteer
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Statistics Section */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto px-6">
        {[
          { label: "Active Donors", value: `${stats.activeDonors}`, color: "text-red-600 dark:text-red-400" },
          { label: "Match Success Rate", value: "99.4%", color: "text-emerald-600 dark:text-emerald-400" },
          { label: "Seconds to Match", value: "< 2s", color: "text-blue-600 dark:text-blue-405" },
          { label: "Covered Regions", value: `${stats.cities} Cities`, color: "text-purple-650 dark:text-purple-400" },
        ].map((stat, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-slate-905 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm text-center flex flex-col justify-center"
          >
            <span className={`text-2xl sm:text-3.5xl font-display font-bold ${stat.color}`}>{stat.value}</span>
            <span className="text-xs sm:text-sm font-medium text-slate-450 dark:text-slate-450 mt-1">{stat.label}</span>
          </div>
        ))}
      </section>

      {/* Blood Compatibility Info Section */}
      <section className="max-w-6xl mx-auto px-6">
        <BloodCompatibilityTable />
      </section>

      {/* Feature Bento Grid */}
      <section className="max-w-6xl mx-auto px-6 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-display font-semibold tracking-tight text-slate-900 dark:text-white">
            Engineered for Extreme Urgency
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-lg mx-auto">
            Our geo-matcher utilizes advanced mapping frameworks and local indexing to find compatible matches instantly.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 pt-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 hover:shadow-md transition-all">
            <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-xl w-fit">
              <MapPin className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Geospatial Radar</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              Instantly converts typed street names or coordinates into geometric points using Nominatim, tracking donors on high-contrast Leaflet grids.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 hover:shadow-md transition-all">
            <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-xl w-fit">
              <Heart className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Compatible Matching</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              Filters donor pools based on medical blood type rules (such as universal recipient compatibility) and exact radial proximity down to 1 km.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 hover:shadow-md transition-all">
            <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-xl w-fit">
              <ShieldCheck className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Cryptographic Auth</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              Tightly secures profiles with JWT session hashing and credential standards, safeguarding personal addresses and dial numbers.
            </p>
          </div>
        </div>
      </section>

      {/* Donor FAQs Section */}
      <section className="max-w-6xl mx-auto px-6">
        <DonorFAQs />
      </section>

      {/* Emergency Blood Alliance Accent */}
      <section className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl p-8 sm:p-12 max-w-6xl mx-auto mx-6 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center gap-8 justify-between">
        <div className="absolute right-0 bottom-0 opacity-10 font-black text-9xl pointer-events-none select-none select-all-disabled tracking-tighter">
          LIFE
        </div>

        <div className="space-y-4 max-w-xl z-10">
          <span className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5" /> Blood Alliance Active
          </span>
          <h2 className="text-2xl sm:text-4xl font-display font-bold leading-tight">
            Urgent Need, Instant Match, Ultimate Impact
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Register your voluntary active donor status. LifeLink maps coordinates cleanly so recipients and emergency workers can safely discover you when critical needs arise.
          </p>
        </div>

        <button
          onClick={() => onNavigate(isAuthenticated ? "profile" : "register")}
          className="px-6 py-4 bg-red-600 hover:bg-red-700 font-semibold text-white rounded-xl active:scale-95 transition-all text-sm shrink-0 flex items-center gap-2 shadow-lg shadow-red-500/20 cursor-pointer z-10 animate-pulse hover:animate-none"
          id="blood-donor-join-btn"
        >
          Become a Voluntary Donor
          <ArrowRight className="w-4 h-4" />
        </button>
      </section>
    </div>
  );
}
