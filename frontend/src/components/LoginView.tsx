/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Mail, Lock, LogIn, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext.js";
import { motion } from "motion/react";

interface LoginViewProps {
  onNavigate: (view: string) => void;
  addToast: (message: string, type: "success" | "error" | "info") => void;
}

export default function LoginView({ onNavigate, addToast }: LoginViewProps) {
  const { login, googleSignInAction } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  
  // Google quick-fill mock details
  const [googleEmail, setGoogleEmail] = useState("");
  const [googleName, setGoogleName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      addToast("Please fill in all email and password fields", "error");
      return;
    }

    setSubmitting(true);
    try {
      const success = await login(email, password);
      if (success) {
        addToast("Logged in successfully. Welcome back!", "success");
        onNavigate("home");
      } else {
        addToast("Invalid email or password", "error");
      }
    } catch (err: any) {
      addToast(err.message || "An error occurred during login", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleQuickSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmail || !googleName) {
      addToast("Please provide your Google email and name", "error");
      return;
    }

    setSubmitting(true);
    try {
      // Simulate Google Auth Provider returning profile info, which provisions automatically on backend!
      const mockGoogleId = `g-${Math.floor(Math.random() * 900000 + 100000)}`;
      const success = await googleSignInAction({
        email: googleEmail,
        name: googleName,
        googleId: mockGoogleId,
        latitude: 0,
        longitude: 0,
        address: "",
        phone: "",
        donorType: "Blood",
        bloodGroup: "",
      });

      if (success) {
        addToast(`Successfully authenticated account via Google: ${googleEmail}`, "success");
        setShowGoogleModal(false);
        onNavigate("home");
      } else {
        addToast("Google SSO authentication failed", "error");
      }
    } catch (err: any) {
      addToast(err.message || "OAuth login error", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xl space-y-6"
      >
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-display font-medium text-slate-900 dark:text-slate-50">Welcome Back</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Sign in to locate nearby donors and update availability.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" id="login-form">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400 dark:text-slate-500">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 border border-slate-200 dark:border-slate-705 outline-none rounded-xl text-sm transition-all text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                id="login-email-input"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Password</label>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400 dark:text-slate-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 focus:bg-white dark:focus:bg-slate-905 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 border border-slate-200 dark:border-slate-705 outline-none rounded-xl text-sm transition-all text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                id="login-password-input"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-medium rounded-xl shadow-lg shadow-red-500/10 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            id="login-submit-btn"
          >
            <LogIn className="w-4 h-4" />
            {submitting ? "Signing In..." : "Sign In with Email"}
          </button>
        </form>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-slate-100 dark:border-slate-800"></div>
          <span className="flex-shrink mx-4 text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">or</span>
          <div className="flex-grow border-t border-slate-100 dark:border-slate-800"></div>
        </div>

        {/* Real / Interactive Simulated Google OAuth Integration in Single Click */}
        <button
          onClick={() => {
            setGoogleName("");
            setGoogleEmail("");
            setShowGoogleModal(true);
          }}
          className="w-full py-3 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium rounded-xl shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
          id="login-google-btn"
        >
          <svg className="w-4.5 h-4.5" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.147 4.114-3.483 0-6.315-2.832-6.315-6.314 0-3.483 2.832-6.315 6.315-6.315 1.543 0 2.946.56 4.043 1.488l3.125-3.125C19.14 2.19 15.93 1 12.24 1 5.918 1 1 5.918 1 12.24c0 6.322 4.918 11.24 11.24 11.24 7.215 0 11.24-5.074 11.24-11.24 0-.756-.07-1.488-.2-2.19l-11.04-.005z"
            />
          </svg>
          Sign in with Google
        </button>

        <p className="text-center text-xs text-slate-400 dark:text-slate-500">
          New to LifeLink?{" "}
          <button
            onClick={() => onNavigate("register")}
            className="font-bold text-red-600 dark:text-red-400 hover:underline cursor-pointer"
            id="navigate-register-btn"
          >
            Create an Account
          </button>
        </p>
      </motion.div>

      {/* Google Sign-In Quick-OAuth Input Panel */}
      {showGoogleModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 z-[10001]">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-sm w-full space-y-4 shadow-2xl"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.147 4.114-3.483 0-6.315-2.832-6.315-6.314 0-3.483 2.832-6.315 6.315-6.315 1.543 0 2.946.56 4.043 1.488l3.125-3.125C19.14 2.19 15.93 1 12.24 1 5.918 1 12.24c0 6.322 4.918 11.24 11.24 11.24 7.215 0 11.24-5.074 11.24-11.24 0-.756-.07-1.488-.2-2.19l-11.04-.005z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 leading-tight">Google Identity Connection</h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Choose mock profile details to generate Google OAuth credentials.</p>
              </div>
            </div>

            <form onSubmit={handleGoogleQuickSignIn} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Johnathan Doe"
                  value={googleName}
                  onChange={(e) => setGoogleName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-705 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Google Email</label>
                <input
                  type="email"
                  required
                  placeholder="john.doe@gmail.com"
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-705 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                />
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowGoogleModal(false)}
                  className="flex-1 py-2 text-center text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold border border-slate-200 dark:border-slate-700 rounded-lg text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95 transition-all"
                >
                  Authorize <ArrowRight className="w-3 h-3 text-red-500" />
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
