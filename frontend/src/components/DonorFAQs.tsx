/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { HelpCircle, ChevronDown, Heart, ShieldAlert, Clock, Sparkles, Activity, CheckCircle2 } from "lucide-react";

interface FAQItem {
  id: string;
  category: "importance" | "eligibility" | "safety" | "myths";
  question: string;
  answer: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
}

export default function DonorFAQs() {
  const [activeId, setActiveId] = useState<string | null>("importance-1");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const faqs: FAQItem[] = [
    {
      id: "importance-1",
      category: "importance",
      question: "Why are regular blood donations so critical for hospitals?",
      icon: Heart,
      answer: (
        <div className="space-y-3">
          <p>
            Unlike many chemical therapeutics, human blood cannot be manufactured synthetically. It has a remarkably short shelf life: **red blood cells expire in 35 days**, while life-saving **platelets last only 5 days**. 
          </p>
          <div className="bg-rose-50/50 p-3 rounded-xl border border-rose-100 flex items-start gap-2.5 text-xs text-rose-950 font-medium leading-relaxed">
            <Activity className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span>
              A single donation of whole blood can be separated into red cells, plasma, and platelets, potentially saving up to <strong>three human lives</strong> during trauma, cancer treatment, or complex surgeries.
            </span>
          </div>
        </div>
      )
    },
    {
      id: "eligibility-1",
      category: "eligibility",
      question: "What are the strict age and physical eligibility requirements?",
      icon: ShieldAlert,
      answer: (
        <div className="space-y-3 text-slate-600 text-xs sm:text-sm leading-relaxed">
          <p>
            To ensure the absolute safety of both the donor and the recipient, our platform strictly enforces medical eligibility thresholds:
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-medium text-slate-800">
            <li className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <span className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-[10px] font-bold shrink-0 font-mono">16+</span>
              <span>Minimum age: 16 years old</span>
            </li>
            <li className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <span className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-[10px] font-bold shrink-0 font-mono">65</span>
              <span>Maximum age: 65 years old</span>
            </li>
            <li className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 col-span-1 sm:col-span-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Weight over 50kg (110 lbs) with healthy blood pressure</span>
            </li>
            <li className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 col-span-1 sm:col-span-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Hemoglobin level ≥ 12.5 g/dL (tested at drive)</span>
            </li>
          </ul>
          <p className="text-[11px] text-slate-400 italic">
            *Individuals under 16 or over 65 are highly susceptible to safe hemodynamic fluctuations and recovery variations, which is why voluntary registration is strictly restricted inside this range.
          </p>
        </div>
      )
    },
    {
      id: "safety-1",
      category: "safety",
      question: "How should I prepare before and care for myself after donating?",
      icon: Clock,
      answer: (
        <div className="space-y-3 text-slate-600 text-xs sm:text-sm leading-relaxed">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 p-3.5 bg-emerald-50/40 rounded-xl border border-emerald-100">
              <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider font-mono">Pre-Donation Prep</h4>
              <ul className="list-disc pl-4 space-y-1 text-xs text-slate-700">
                <li>Drink **500ml of water** right before</li>
                <li>Eat an iron-rich, low-fat meal</li>
                <li>Ensure at least 7-8 hours of sleep</li>
              </ul>
            </div>
            <div className="space-y-1.5 p-3.5 bg-sky-50/40 rounded-xl border border-sky-100">
              <h4 className="text-xs font-bold text-sky-800 uppercase tracking-wider font-mono">Post-Donation Care</h4>
              <ul className="list-disc pl-4 space-y-1 text-xs text-slate-700">
                <li>Rest for 10-15 minutes immediately</li>
                <li>Keep the needle-site bandage on for 4 hours</li>
                <li>Avoid heavy lifting or strenuous exercise</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "myths-1",
      category: "myths",
      question: "Common debunked myths about donating blood",
      icon: Sparkles,
      answer: (
        <div className="space-y-2.5 text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed">
          <div className="flex gap-2.5">
            <span className="text-red-500 font-bold font-mono">Myth:</span>
            <span>\"Donating blood hurts or makes you permanently weak.\"</span>
          </div>
          <div className="flex gap-2.5 pl-4 border-l-2 border-emerald-500 text-slate-700 dark:text-slate-305 font-medium bg-emerald-50/25 dark:bg-emerald-950/10 py-1 px-2.5 rounded-r">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">Fact:</span>
            <span>You may feel a minor pinch like a quick mosquito bite. Your body completely replenishes lost fluids within 24–48 hours, and red blood cells within 4–6 weeks.</span>
          </div>
          <div className="flex gap-2.5 mt-3">
            <span className="text-red-500 font-bold font-mono">Myth:</span>
            <span>\"I can contract an infection by donating blood.\"</span>
          </div>
          <div className="flex gap-2.5 pl-4 border-l-2 border-emerald-500 text-slate-700 dark:text-slate-305 font-medium bg-emerald-50/25 dark:bg-emerald-950/10 py-1 px-2.5 rounded-r">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">Fact:</span>
            <span>Every single collection syringe, sterile container, and needle kit is factory-sealed, used exactly once, and instantly incinerated. It is physically impossible to contract any infectious disease through blood donation.</span>
          </div>
        </div>
      )
    }
  ];

  const categories = [
    { key: "all", label: "All FAQ" },
    { key: "importance", label: "Donation Impact" },
    { key: "eligibility", label: "Age & Limits" },
    { key: "safety", label: "Medical Safety" },
    { key: "myths", label: "Myths vs Facts" }
  ];

  const filteredFaqs = filterCategory === "all" 
    ? faqs 
    : faqs.filter(f => f.category === filterCategory);

  return (
    <div className="bg-slate-50/50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800/80 p-5 sm:p-8 space-y-6 transition-colors duration-200" id="donor-faq-section">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1.5 text-left">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-red-50 dark:bg-red-955/35 border border-red-100 dark:border-red-900/30 text-[10px] font-bold uppercase tracking-widest text-red-600 dark:text-red-400 rounded">
            <HelpCircle className="w-3 h-3" /> Medical FAQ
          </div>
          <h3 className="text-xl sm:text-2xl font-display font-bold text-slate-900 dark:text-white tracking-tight">
            Donor Medical Center & FAQs
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-lg">
            Essential guidelines compiled by medical specialists to keep our voluntary donation workspace safe and healthy.
          </p>
        </div>

        {/* Categories toggler */}
        <div className="flex flex-wrap gap-1 bg-slate-100 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 p-1 rounded-xl shrink-0">
          {categories.map((cat) => {
            const isActive = filterCategory === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => {
                  setFilterCategory(cat.key);
                  // Auto-open first item in category
                  const match = faqs.find(f => cat.key === "all" || f.category === cat.key);
                  if (match) setActiveId(match.id);
                }}
                className={`px-3 py-1 text-[10px] sm:text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  isActive ? "bg-slate-900 dark:bg-red-600 text-white shadow-sm" : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-205"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start pt-2">
        {/* Accordions */}
        <div className="md:col-span-8 space-y-3">
          {filteredFaqs.map((faq) => {
            const isOpen = activeId === faq.id;
            const Icon = faq.icon;
            return (
              <div 
                key={faq.id} 
                className={`bg-white dark:bg-slate-900 rounded-xl border transition-all ${
                  isOpen ? "border-slate-200 dark:border-slate-700 shadow-sm ring-1 ring-slate-100 dark:ring-slate-800/50" : "border-slate-100 dark:border-slate-800/80 hover:border-slate-200 dark:hover:border-slate-700"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setActiveId(isOpen ? null : faq.id)}
                  className="w-full px-4 sm:px-5 py-4 flex items-center justify-between gap-3 text-left font-semibold text-slate-800 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white text-xs sm:text-sm cursor-pointer"
                >
                  <span className="flex items-center gap-2.5">
                    <span className={`p-1.5 rounded-lg ${isOpen ? "bg-red-50 dark:bg-red-95/43 text-red-650 dark:text-red-400" : "bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-500"}`}>
                      <Icon className="w-4 h-4" />
                    </span>
                    <span>{faq.question}</span>
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 pt-1.5 border-t border-slate-50 dark:border-slate-800/40 text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed space-y-3 text-left">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Doctor's Note Sidebar Widget */}
        <div className="md:col-span-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/85 shadow-sm space-y-4 text-left">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800/80">
            <span className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center text-sm">🥼</span>
            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Specialist Advice</h4>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Chief Medical Officer</p>
            </div>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-550 dark:text-slate-400 leading-relaxed font-normal">
            "Strictly limiting donation age from **16 to 65 years** represents the highest medical protocol. Younger organs face vascular adjustments, whereas older circulatory structures require rigorous clearance. Regular donors can donate every **56 days** securely, promoting hematopoietic turnover."
          </p>
          <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-805/80 space-y-1">
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block font-mono">Next Blood Drive</span>
            <span className="text-xs font-semibold text-slate-820 dark:text-slate-300 block">Universal Matching Grid</span>
            <span className="text-[10px] font-mono text-red-600 dark:text-red-400 font-bold bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-801 inline-block mt-1">
              Active Geotagging Enabled
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
