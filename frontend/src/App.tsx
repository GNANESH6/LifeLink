/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext.js";
import HomeView from "./components/HomeView.js";
import LoginView from "./components/LoginView.js";
import RegisterView from "./components/RegisterView.js";
import DashboardView from "./components/DashboardView.js";
import DonorSearchView from "./components/DonorSearchView.js";
import ProfileView from "./components/ProfileView.js";
import ToastContainer, { ToastMessage } from "./components/Toast.js";
import { LifeLinkLogo } from "./components/LifeLinkLogo.js";
import { Heart, Activity, User, LogOut, Search, Grid, Home, BookOpen, Sun, Moon, Map } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import img0 from "./assets/input_file_0.svg";
import img1 from "./assets/input_file_1.svg";
import img2 from "./assets/input_file_2.svg";
import img3 from "./assets/input_file_3.svg";

function LifeLinkApp() {
  const { user, logout } = useAuth();
  
  // Theme state configuration
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark" || saved === "light") return saved;
    return "dark";
  });

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  // Standard SPA state-based routing
  const [view, setView] = useState<string>("home");
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (message: string, type: "success" | "error" | "info") => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const handleLogoutClick = () => {
    logout();
    addToast("Logged out successfully. Stay safe!", "info");
    setView("home");
  };

  // Safe navigation checks for protected routes
  const handleNavigate = (targetView: string) => {
    const protectedViews = ["dashboard", "donor-search", "profile"];
    if (protectedViews.includes(targetView) && !user) {
      addToast("Authentication required to browse directories.", "error");
      setView("login");
    } else {
      setView(targetView);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 relative" id="lifelink-app-container">
      
      {/* Dynamic Floating Foreground Character Ornaments (on top of components, z-[50], but low opacity) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-[50] select-none">
        {/* Drop 1: Thumbs Up Character */}
        <motion.div
          animate={{
            y: [0, -18, 0],
            x: [0, 8, 0],
            rotate: [0, 5, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-[12%] -left-4 md:left-[3%] p-2.5 md:p-3 pb-3 bg-white/95 dark:bg-slate-800/90 rounded-full border-2 border-red-500/30 dark:border-red-500/40 shadow-xl shadow-red-500/5 dark:shadow-red-950/40 opacity-[0.32] dark:opacity-[0.22] w-24 md:w-36 h-24 md:h-36 flex items-center justify-center overflow-hidden"
        >
          <img
            src={img0}
            alt=""
            referrerPolicy="no-referrer"
            className="w-[85%] h-[85%] object-contain"
          />
        </motion.div>

        {/* Drop 2: Thank You Mascot */}
        <motion.div
          animate={{
            y: [0, 15, 0],
            x: [0, -6, 0],
            rotate: [0, -4, 0],
          }}
          transition={{
            duration: 9.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-[26%] -right-4 md:right-[2%] p-2.5 md:p-3 pb-3 bg-white/95 dark:bg-slate-800/90 rounded-full border-2 border-red-500/30 dark:border-red-500/40 shadow-xl shadow-red-500/5 dark:shadow-red-950/40 opacity-[0.32] dark:opacity-[0.22] w-24 md:w-36 h-24 md:h-36 flex items-center justify-center overflow-hidden"
        >
          <img
            src={img1}
            alt=""
            referrerPolicy="no-referrer"
            className="w-[85%] h-[85%] object-contain"
          />
        </motion.div>

        {/* Drop 3: Blood drop with IV Infusion */}
        <motion.div
          animate={{
            y: [0, -15, 0],
            x: [0, 8, 0],
            rotate: [0, 3, 0],
          }}
          transition={{
            duration: 9,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-[42%] -left-4 md:left-[4%] p-2.5 md:p-3 pb-3 bg-white/95 dark:bg-slate-800/90 rounded-full border-2 border-red-500/30 dark:border-red-500/40 shadow-xl shadow-red-500/5 dark:shadow-red-950/40 opacity-[0.32] dark:opacity-[0.22] w-24 md:w-36 h-24 md:h-36 flex items-center justify-center overflow-hidden"
        >
          <img
            src={img2}
            alt=""
            referrerPolicy="no-referrer"
            className="w-[85%] h-[85%] object-contain"
          />
        </motion.div>

        {/* Drop 4: Waving Blood drop Mascot */}
        <motion.div
          animate={{
            y: [0, 16, 0],
            x: [0, -10, 0],
            rotate: [0, -5, 0],
          }}
          transition={{
            duration: 8.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-[56%] -right-4 md:right-[3%] p-2.5 md:p-3 pb-3 bg-white/95 dark:bg-slate-800/90 rounded-full border-2 border-red-500/30 dark:border-red-500/40 shadow-xl shadow-red-500/5 dark:shadow-red-950/40 opacity-[0.32] dark:opacity-[0.22] w-24 md:w-36 h-24 md:h-36 flex items-center justify-center overflow-hidden"
        >
          <img
            src={img3}
            alt=""
            referrerPolicy="no-referrer"
            className="w-[85%] h-[85%] object-contain"
          />
        </motion.div>

        {/* Drop 5: Repeated Thumbs Up Character */}
        <motion.div
          animate={{
            y: [0, -12, 0],
            x: [0, 6, 0],
            rotate: [0, -3, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-[72%] -left-4 md:left-[3%] p-2.5 md:p-3 pb-3 bg-white/95 dark:bg-slate-800/90 rounded-full border-2 border-red-500/30 dark:border-red-500/40 shadow-xl shadow-red-500/5 dark:shadow-red-950/40 opacity-[0.32] dark:opacity-[0.22] w-24 md:w-36 h-24 md:h-36 flex items-center justify-center overflow-hidden"
        >
          <img
            src={img0}
            alt=""
            referrerPolicy="no-referrer"
            className="w-[85%] h-[85%] object-contain"
          />
        </motion.div>

        {/* Drop 6: Repeated Thank You Mascot */}
        <motion.div
          animate={{
            y: [0, 14, 0],
            x: [0, -7, 0],
            rotate: [0, 4, 0],
          }}
          transition={{
            duration: 11,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-[86%] -right-4 md:right-[4%] p-2.5 md:p-3 pb-3 bg-white/95 dark:bg-slate-800/90 rounded-full border-2 border-red-500/30 dark:border-red-500/40 shadow-xl shadow-red-500/5 dark:shadow-red-950/40 opacity-[0.32] dark:opacity-[0.22] w-24 md:w-36 h-24 md:h-36 flex items-center justify-center overflow-hidden"
        >
          <img
            src={img1}
            alt=""
            referrerPolicy="no-referrer"
            className="w-[85%] h-[85%] object-contain"
          />
        </motion.div>
      </div>

      {/* Interactive Main Layout Canvas (strictly elevated above background ornaments) */}
      <div className="relative z-10 flex flex-col min-h-screen justify-between w-full">

      {/* 1. Global Navigation Bar */}
      <header className="sticky top-0 z-[1001] bg-white/80 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-150 dark:border-slate-800/80 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          
          {/* Logo Brand */}
          <button
            onClick={() => handleNavigate("home")}
            className="flex items-center cursor-pointer text-left focus:outline-none hover:opacity-95 transition-all"
            id="brand-logo"
          >
            <LifeLinkLogo size="sm" />
          </button>

          {/* Desktop Navigation Link Tabs */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => handleNavigate("home")}
              className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                view === "home" ? "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
              id="nav-home"
            >
              <Home className="w-3.5 h-3.5" />
              Home
            </button>

            {user && (
              <>
                <button
                  onClick={() => handleNavigate("dashboard")}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    view === "dashboard" ? "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                  id="nav-dashboard"
                >
                  <Map className="w-3.5 h-3.5" />
                  Atlas View
                </button>

                <button
                  onClick={() => handleNavigate("donor-search")}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    view === "donor-search" ? "bg-red-50 text-red-600" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                  id="nav-donor-search"
                >
                  <Search className="w-3.5 h-3.5" />
                  Donor Directory
                </button>

                <button
                  onClick={() => {
                    localStorage.removeItem("viewing_other_donor");
                    handleNavigate("profile");
                  }}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    view === "profile" ? "bg-red-50 text-red-600" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                  id="nav-profile"
                >
                  <User className="w-3.5 h-3.5" />
                  My Badge
                </button>
              </>
            )}
          </nav>

          {/* User Sign In Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Accessibility Theme Toggle Option */}
            <button
              onClick={toggleTheme}
              className="p-1.5 sm:p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer font-bold flex items-center justify-center border border-slate-200 dark:border-slate-800 shadow-sm"
              aria-label="Toggle Theme Mode"
              id="theme-toggle-btn"
            >
              {theme === "light" ? (
                <Moon className="w-4 h-4 text-slate-700 dark:text-slate-300" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500" />
              )}
            </button>

            {user ? (
              <div className="flex items-center gap-3">
                <div 
                  onClick={() => {
                    localStorage.removeItem("viewing_other_donor");
                    handleNavigate("profile");
                  }}
                  className="hidden sm:flex items-center gap-2 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl cursor-pointer transition-all border border-slate-200 dark:border-slate-700 shadow-xs hover:shadow-sm"
                  id="header-user-badge"
                >
                  <div className="px-1.5 py-1 h-6 min-w-[28px] rounded-full bg-red-600 text-white font-extrabold text-[9px] tracking-tight flex items-center justify-center font-mono uppercase border border-white/60 shadow-xs shrink-0 select-none leading-none">
                    {user.bloodGroup}
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-none select-none">
                    {user.name.split(" ")[0]}
                  </span>
                </div>

                <button
                  onClick={handleLogoutClick}
                  className="px-3.5 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                  id="header-logout-btn"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  onClick={() => handleNavigate("login")}
                  className="px-3 sm:px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap"
                  id="header-login-btn"
                >
                  Log In
                </button>
                
                <button
                  onClick={() => handleNavigate("register")}
                  className="px-3 sm:px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md shadow-red-500/15 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                  id="header-register-btn"
                >
                  <span className="sm:hidden">Register</span>
                  <span className="hidden sm:inline">Register Donor</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* Mobile Drawer Quick Links (displayed only when authenticated) */}
      {user && (
        <div className="sticky top-16 md:hidden bg-white dark:bg-slate-900 border-b border-slate-150 dark:border-slate-800 py-2.5 px-4 flex items-center justify-around shadow-inner z-[1000] transition-colors duration-200">
          <button
            onClick={() => handleNavigate("home")}
            className={`flex flex-col items-center gap-0.5 text-slate-500 dark:text-slate-400 text-[10px] font-bold ${
              view === "home" ? "text-red-600 dark:text-red-400" : ""
            }`}
            id="mob-nav-home"
          >
            <Home className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            Home
          </button>
          
          <button
            onClick={() => handleNavigate("dashboard")}
            className={`flex flex-col items-center gap-0.5 text-slate-500 dark:text-slate-400 text-[10px] font-bold ${
              view === "dashboard" ? "text-red-600 dark:text-red-400" : ""
            }`}
            id="mob-nav-dashboard"
          >
            <Map className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            Atlas View
          </button>

          <button
            onClick={() => handleNavigate("donor-search")}
            className={`flex flex-col items-center gap-0.5 text-slate-500 dark:text-slate-400 text-[10px] font-bold ${
              view === "donor-search" ? "text-red-600 dark:text-red-400" : ""
            }`}
            id="mob-nav-search"
          >
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            Directory
          </button>

          <button
            onClick={() => {
              localStorage.removeItem("viewing_other_donor");
              handleNavigate("profile");
            }}
            className={`flex flex-col items-center gap-0.5 text-slate-500 dark:text-slate-400 text-[10px] font-bold ${
              view === "profile" ? "text-red-600 dark:text-red-400" : ""
            }`}
            id="mob-nav-profile"
          >
            <User className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            Badge
          </button>
        </div>
      )}

      {/* 2. Main Content view Canvas (with exit/entry transitions) */}
      <main className="flex-1 py-8">
        <AnimatePresence mode="wait">
          {view === "home" && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              <HomeView onNavigate={handleNavigate} isAuthenticated={!!user} />
            </motion.div>
          )}

          {view === "login" && (
            <motion.div
              key="login"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              <LoginView onNavigate={handleNavigate} addToast={addToast} />
            </motion.div>
          )}

          {view === "register" && (
            <motion.div
              key="register"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              <RegisterView onNavigate={handleNavigate} addToast={addToast} />
            </motion.div>
          )}

          {view === "dashboard" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              <DashboardView onNavigate={handleNavigate} addToast={addToast} />
            </motion.div>
          )}

          {view === "donor-search" && (
            <motion.div
              key="donor-search"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              <DonorSearchView onNavigate={handleNavigate} addToast={addToast} />
            </motion.div>
          )}

          {view === "profile" && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              <ProfileView addToast={addToast} onNavigate={handleNavigate} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 3. Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-150 dark:border-slate-800/80 py-8 text-center text-xs text-slate-400 dark:text-slate-500 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 space-y-3">
          <div className="flex items-center justify-center">
            <LifeLinkLogo size="sm" />
          </div>
          <p className="max-w-md mx-auto leading-relaxed dark:text-slate-400">
            Voluntary blood donor coordination platform using advanced geospatial nearest radial queries.
          </p>

        </div>
      </footer>
      </div> {/* Interactive Layout Wrapper */}
      
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LifeLinkApp />
    </AuthProvider>
  );
}
