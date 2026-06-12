/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { Check, X, Info } from "lucide-react";

interface CompatibilityMap {
  [recipient: string]: {
    [donor: string]: boolean;
  };
}

const COMPATIBILITY_DATA: CompatibilityMap = {
  "O-": { "O-": true, "O+": false, "A-": false, "A+": false, "B-": false, "B+": false, "AB-": false, "AB+": false },
  "O+": { "O-": true, "O+": true, "A-": false, "A+": false, "B-": false, "B+": false, "AB-": false, "AB+": false },
  "A-": { "O-": true, "O+": false, "A-": true, "A+": false, "B-": false, "B+": false, "AB-": false, "AB+": false },
  "A+": { "O-": true, "O+": true, "A-": true, "A+": true, "B-": false, "B+": false, "AB-": false, "AB+": false },
  "B-": { "O-": true, "O+": false, "A-": false, "A+": false, "B-": true, "B+": false, "AB-": false, "AB+": false },
  "B+": { "O-": true, "O+": true, "A-": false, "A+": false, "B-": true, "B+": true, "AB-": false, "AB+": false },
  "AB-": { "O-": true, "O+": false, "A-": true, "A+": false, "B-": true, "B+": false, "AB-": true, "AB+": false },
  "AB+": { "O-": true, "O+": true, "A-": true, "A+": true, "B-": true, "B+": true, "AB-": true, "AB+": true },
};

const BLOOD_TYPES = ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"];

export default function BloodCompatibilityTable() {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [hoveredCol, setHoveredCol] = useState<string | null>(null);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 transition-colors duration-200" id="blood-compatibility-section">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 bg-red-650 rounded-full"></span>
            Red Blood Cell Compatibility Chart
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Understand matching safety between donors and recipients. Hover over cells to inspect compatibility.
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 w-fit">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center rounded">
              <Check className="w-1.5 h-1.5" />
            </span>
            <span>Compatible</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 bg-red-50 dark:bg-red-950/20 border border-red-150 dark:border-red-900/55 text-red-605 flex items-center justify-center rounded">
              <X className="w-1.5 h-1.5" />
            </span>
            <span>Incompatible</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
        <table className="w-full min-w-[700px] border-collapse text-sm">
          <thead>
            {/* Main Header Row */}
            <tr className="bg-slate-50/75 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800">
              <th className="p-4 text-center font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px] w-28 border-r border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-950/50">
                Recipient
              </th>
              <th colSpan={8} className="p-2.5 text-center font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider text-xs bg-slate-50/20 dark:bg-slate-950/20">
                Donor Blood Group
              </th>
            </tr>
            {/* Sub column headers */}
            <tr className="bg-slate-50 dark:bg-slate-950/30 border-b border-slate-200 dark:border-slate-800">
              <th className="p-3 text-center text-xs font-semibold text-slate-650 dark:text-slate-400 w-28 border-r border-slate-200 dark:border-slate-805 bg-slate-100/30 dark:bg-slate-950/30">
                Blood Group
              </th>
              {BLOOD_TYPES.map((bt) => (
                <th
                  key={bt}
                  className={`p-3 text-center text-xs font-bold transition-all duration-150 ${
                    hoveredCol === bt ? "bg-slate-200/60 dark:bg-slate-800 text-slate-900 dark:text-white scale-105" : "text-slate-600 dark:text-slate-400"
                  }`}
                  onMouseEnter={() => setHoveredCol(bt)}
                  onMouseLeave={() => setHoveredCol(null)}
                >
                  {bt}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {BLOOD_TYPES.map((recipient) => (
              <tr
                key={recipient}
                className={`border-b border-slate-150 dark:border-slate-800/50 last:border-0 transition-all duration-150 ${
                  hoveredRow === recipient ? "bg-slate-50/80 dark:bg-slate-850/10" : ""
                }`}
                onMouseEnter={() => setHoveredRow(recipient)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                {/* Recipient Row Header */}
                <td
                  className={`p-3.5 text-center font-bold border-r border-slate-200 dark:border-slate-805 transition-all duration-150 ${
                    hoveredRow === recipient
                      ? "bg-slate-200/50 dark:bg-slate-800 text-slate-900 dark:text-white"
                      : "text-slate-707 dark:text-slate-400 bg-slate-50/30 dark:bg-slate-950/10"
                  }`}
                >
                  {recipient}
                </td>
                {/* Compatibility Matrix Cells */}
                {BLOOD_TYPES.map((donor) => {
                  const isCompatible = COMPATIBILITY_DATA[recipient][donor];
                  const isHighlighted = hoveredRow === recipient || hoveredCol === donor;
                  
                  return (
                    <td
                      key={donor}
                      className={`p-3 text-center transition-all duration-150 ${
                        isHighlighted ? "bg-slate-50/30 dark:bg-slate-800/10" : ""
                      }`}
                      onMouseEnter={() => {
                        setHoveredRow(recipient);
                        setHoveredCol(donor);
                      }}
                      onMouseLeave={() => {
                        setHoveredRow(null);
                        setHoveredCol(null);
                      }}
                    >
                      <div className="flex items-center justify-center">
                        {isCompatible ? (
                          <div
                            className="flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/20 text-emerald-600 dark:text-emerald-450 shadow-sm shadow-emerald-500/5"
                            title={`${recipient} recipient is compatible with ${donor} donor`}
                          >
                            <Check className="w-4 h-4 stroke-[3]" />
                          </div>
                        ) : (
                          <div
                            className="flex items-center justify-center w-8 h-8 rounded-xl bg-red-50/55 dark:bg-red-950/10 border border-red-100 dark:border-red-900/30 text-red-400 dark:text-red-500"
                            title={`${recipient} recipient is incompatible with ${donor} donor`}
                          >
                            <X className="w-3.5 h-3.5 stroke-[2.5]" />
                          </div>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-start gap-2.5 bg-slate-50/80 dark:bg-slate-950/30 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-550 dark:text-slate-400 leading-relaxed">
        <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <p>
          <strong>Universal Survival Quick Facts:</strong> <span className="text-red-600 dark:text-red-450 font-semibold">O Negative (O-)</span> blood can be given to patients of any blood type in emergencies, representing the <strong>Universal Donor</strong>. Alternately, <span className="text-red-605 dark:text-red-455 font-semibold">AB Positive (AB+)</span> individuals can safely receive red blood cells of any type, making them the <strong>Universal Recipient</strong>.
        </p>
      </div>
    </div>
  );
}
