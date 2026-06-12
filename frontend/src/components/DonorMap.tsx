/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { DonorMatch, GeoLocation, EmergencyRequest } from "../types.js";
import { Locate } from "lucide-react";

interface DonorMapProps {
  userLocation: GeoLocation | null;
  donors: DonorMatch[];
  selectedDonor: DonorMatch | null;
  onSelectDonor: (donor: DonorMatch) => void;
  centerCoords?: [number, number]; // [lat, lng]
  emergencies?: EmergencyRequest[];
}

export default function DonorMap({
  userLocation,
  donors,
  selectedDonor,
  onSelectDonor,
  centerCoords,
  emergencies = [],
}: DonorMapProps) {
  const [showMeOnly, setShowMeOnly] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const searchCenterMarkerRef = useRef<L.Marker | null>(null);

  const handleRecenter = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    
    if (userLocation && userLocation.coordinates[0] !== 0) {
      map.flyTo([userLocation.coordinates[1], userLocation.coordinates[0]], 14);
    } else {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          map.flyTo([position.coords.latitude, position.coords.longitude], 14);
        },
        () => {
          map.flyTo([15.9129, 79.7400], 12);
        }
      );
    }
  };

  const handleShowMeOnlyToggle = () => {
    const nextVal = !showMeOnly;
    setShowMeOnly(nextVal);
    
    const map = mapInstanceRef.current;
    if (!map) return;
    
    if (userLocation && userLocation.coordinates[0] !== 0) {
      const [uLng, uLat] = userLocation.coordinates;
      map.flyTo([uLat, uLng], 14);
      setTimeout(() => {
        if (userMarkerRef.current) {
          userMarkerRef.current.openPopup();
        }
      }, 500);
    }
  };

  // Initialize Map Instance once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Default center (Andhra Pradesh, India)
    const initialLat = userLocation?.coordinates[1] || centerCoords?.[0] || 15.9129;
    const initialLng = userLocation?.coordinates[0] || centerCoords?.[1] || 79.7400;

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
    }).setView([initialLat, initialLng], 12);

    // Map theme load from OpenStreetMap standard tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Sync / Fly to center coordinate updates
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (centerCoords && centerCoords[0] !== 0) {
      map.flyTo(centerCoords, 13, { animate: true, duration: 1.5 });
    } else if (userLocation && userLocation.coordinates[0] !== 0) {
      map.flyTo([userLocation.coordinates[1], userLocation.coordinates[0]], 13, {
        animate: true,
        duration: 1.5,
      });
    }
  }, [centerCoords, userLocation]);

  // Handle markers drawing & binding
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // 1. Clear old donor markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // 1.5 Clear old search center marker
    if (searchCenterMarkerRef.current) {
      searchCenterMarkerRef.current.remove();
      searchCenterMarkerRef.current = null;
    }

    // 2. Draw User Marker
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    if (userLocation && userLocation.coordinates[0] !== 0) {
      const [uLng, uLat] = userLocation.coordinates;
      const userIcon = L.divIcon({
        className: "custom-user-marker",
        html: `
          <div class="relative flex items-center justify-center w-8 h-8">
            <div class="absolute w-8 h-8 rounded-full bg-blue-500/30 custom-pulse-ring"></div>
            <div class="absolute w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-md custom-pulse-dot"></div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      userMarkerRef.current = L.marker([uLat, uLng], { icon: userIcon })
        .addTo(map)
        .bindPopup(
          `<div class="p-1 font-sans">
            <p class="font-bold text-blue-600 text-sm">Your Location</p>
            <p class="text-xs text-slate-500 font-mono">Lat: ${uLat.toFixed(4)}, Lng: ${uLng.toFixed(4)}</p>
          </div>`
        );
    }

    // 2.5 Draw Custom Search Center Marker (if search target is active and not coinciding with user location)
    let isCustomCenter = false;
    let customLat = 0;
    let customLng = 0;

    if (centerCoords && centerCoords[0] !== 0) {
      customLat = centerCoords[0];
      customLng = centerCoords[1];
      
      if (userLocation && userLocation.coordinates[0] !== 0) {
        const [uLng, uLat] = userLocation.coordinates;
        if (Math.abs(uLat - customLat) > 0.001 || Math.abs(uLng - customLng) > 0.001) {
          isCustomCenter = true;
        }
      } else {
        isCustomCenter = true;
      }
    }

    if (isCustomCenter) {
      const searchIcon = L.divIcon({
        className: "custom-search-marker",
        html: `
          <div class="relative flex flex-col items-center">
            <div class="relative flex items-center justify-center w-8 h-10">
              <svg class="w-8 h-10 text-slate-900 filter drop-shadow-md" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              <div class="absolute top-[6px] w-2.5 h-2.5 bg-white rounded-full"></div>
            </div>
          </div>
        `,
        iconSize: [32, 40],
        iconAnchor: [16, 40],
        popupAnchor: [0, -40],
      });

      searchCenterMarkerRef.current = L.marker([customLat, customLng], { icon: searchIcon })
        .addTo(map)
        .bindPopup(
          `<div class="p-2.5 font-sans text-xs text-slate-800 space-y-1 w-44">
            <p class="font-bold text-slate-900">Map Center Location</p>
            <p class="text-slate-500 leading-normal">Selected target coordinate search hub center.</p>
            <p class="text-[9px] text-slate-400 font-mono pt-1">Lat: ${customLat.toFixed(4)}, Lng: ${customLng.toFixed(4)}</p>
          </div>`
        );
    }

    // 3. Draw matching donor pins
    if (!showMeOnly) {
      donors.forEach((donor) => {
        const [dLng, dLat] = donor.location.coordinates;
        if (dLat === 0 && dLng === 0) return;

        const markerColor = "text-red-600";
        const markerBadgeColor = "bg-red-100 text-red-800";

        const donorIcon = L.divIcon({
          className: "custom-donor-marker",
          html: `
            <div class="flex flex-col items-center">
              <div class="relative flex items-center justify-center w-8 h-10">
                <svg class="w-8 h-10 ${markerColor} filter drop-shadow-md" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                <span class="absolute top-[6px] text-[10px] font-sans font-bold text-white uppercase">${donor.bloodGroup}</span>
              </div>
            </div>
          `,
          iconSize: [32, 40],
          iconAnchor: [16, 40],
          popupAnchor: [0, -40],
        });

        const cardPopupHtml = `
          <div class="p-3 font-sans w-60 text-slate-800 space-y-2.5">
            <div class="flex items-start justify-between gap-2">
              <div>
                <h4 class="font-bold text-slate-900 text-sm leading-tight">${donor.name}</h4>
                <span class="inline-block mt-1 px-1.5 py-0.5 text-[9px] font-bold rounded border uppercase ${markerBadgeColor}">
                  Blood Pledged
                </span>
              </div>
              <span class="px-2.5 py-1 bg-red-600 text-white font-sans font-black rounded-lg text-xs shadow shadow-red-500/20 leading-none shrink-0 select-none">
                ${donor.bloodGroup}
              </span>
            </div>

            <p class="text-[11px] text-slate-500 leading-normal line-clamp-2">${donor.address || "No address provided"}</p>
            
            <div class="border-t border-slate-100 pt-2 flex flex-col gap-1 text-[11px]">
              <div class="flex items-center justify-between">
                <span class="text-slate-400">Distance Range:</span>
                <span class="font-bold text-slate-700">${donor.distance ? `${donor.distance} km` : "Nearby"}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-slate-400">Contact Line:</span>
                <a href="tel:${donor.phone}" class="font-bold text-red-600 hover:opacity-80">${donor.phone || "No contact"}</a>
              </div>
            </div>
          </div>
        `;

        const marker = L.marker([dLat, dLng], { icon: donorIcon })
          .addTo(map)
          .bindPopup(cardPopupHtml);

        // Event listener for selections
        marker.on("click", () => {
          onSelectDonor(donor);
        });

        // Track marker reference
        markersRef.current.push(marker);
      });
    }

    // 4. Draw active emergency request pins
    if (!showMeOnly && emergencies && emergencies.length > 0) {
      emergencies.forEach((req) => {
        if (!req.location || !req.location.coordinates || req.location.coordinates[0] === 0) return;
        const [eLng, eLat] = req.location.coordinates;
        
        const emergIcon = L.divIcon({
          className: "custom-emergency-marker",
          html: `
            <div class="relative flex flex-col items-center">
              <div class="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full animate-ping opacity-75"></div>
              <div class="relative flex items-center justify-center w-9 h-11">
                <svg class="w-9 h-11 text-amber-500 filter drop-shadow-md" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                <div class="absolute top-[8px] px-1 bg-amber-600 text-white font-sans text-[8px] font-black rounded-xs border border-white leading-none shadow-sm animate-pulse">${req.bloodGroup}</div>
              </div>
            </div>
          `,
          iconSize: [36, 44],
          iconAnchor: [18, 44],
          popupAnchor: [0, -44],
        });

        const cardPopupHtml = `
          <div class="p-3 font-sans w-60 text-slate-800 space-y-2 text-left">
            <div class="flex items-center gap-1 px-1.5 py-0.5 bg-red-50 border border-red-150 rounded text-red-600 font-bold text-[9px] uppercase tracking-wider animate-pulse w-fit">
              <span class="w-1.5 h-1.5 bg-red-600 rounded-full"></span>
              Live Emergency Alert
            </div>
            <div class="flex items-start justify-between gap-2">
              <div>
                <h4 class="font-bold text-slate-900 text-xs sm:text-sm leading-tight">${req.userName}</h4>
                <p class="text-[9px] text-slate-400 mt-1">${new Date(req.createdAt).toLocaleDateString()} ${new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <span class="px-2 py-0.5 bg-amber-500 text-white font-bold rounded text-xs shrink-0 leading-none select-none">
                ${req.bloodGroup}
              </span>
            </div>
            
            <p class="text-[11px] text-slate-600 leading-normal font-semibold bg-amber-50/40 p-2 rounded">${req.message}</p>
            <p class="text-[10px] text-slate-500 leading-normal line-clamp-1">📍 ${req.address}</p>

            <div class="border-t border-slate-100 pt-2 flex items-center justify-between text-[11px]">
              <span class="text-slate-400">Emergency Line:</span>
              ${req.userPhone ? `<a href="tel:${req.userPhone}" class="font-bold text-red-600 hover:underline">📞 ${req.userPhone}</a>` : '<span class="text-slate-400">No contact info</span>'}
            </div>
          </div>
        `;

        const marker = L.marker([eLat, eLng], { icon: emergIcon })
          .addTo(map)
          .bindPopup(cardPopupHtml);

        markersRef.current.push(marker);
      });
    }
  }, [donors, userLocation, centerCoords, showMeOnly, emergencies]);

  // Sync selected donor trigger popup
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedDonor) return;

    const [sLng, sLat] = selectedDonor.location.coordinates;
    map.setView([sLat, sLng], 14, { animate: true });

    // Find and open popup of the corresponding marker
    markersRef.current.forEach((marker) => {
      const latLng = marker.getLatLng();
      if (Math.abs(latLng.lat - sLat) < 0.0001 && Math.abs(latLng.lng - sLng) < 0.0001) {
        marker.openPopup();
      }
    });
  }, [selectedDonor]);

  return (
    <div className="relative w-full h-full min-h-[350px] shadow-sm overflow-hidden bg-slate-100 rounded-2xl border border-slate-200">
      <div id="leaflet-map-element" ref={mapContainerRef} className="w-full h-full min-h-[350px]" />
      
      {/* Map Control Buttons overlay */}
      <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-2">
        {/* Show Only Me symbol */}
        <button
          onClick={handleShowMeOnlyToggle}
          className={`p-2.5 rounded-xl border shadow-lg cursor-pointer transition-all flex items-center justify-center gap-1.5 font-bold text-xs ${
            showMeOnly
              ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-700"
              : "bg-white hover:bg-slate-50 text-slate-800 border-slate-200 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800 dark:border-slate-800"
          }`}
          title="Click to redirect and show your location only"
          type="button"
          id="btn-show-me-only"
        >
          <Locate className={`w-4 h-4 ${showMeOnly ? "text-white animate-pulse" : "text-blue-600 dark:text-blue-400"}`} />
          {showMeOnly ? <span className="text-[10px] pr-1 font-sans">Only Me</span> : null}
        </button>
      </div>

      {/* Overlay controls description */}
      <div className="absolute bottom-3 left-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] font-medium text-slate-500 dark:text-slate-400 pointer-events-none shadow-sm z-[1000] flex gap-2">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 bg-blue-600 rounded-full inline-block"></span> You
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 bg-red-600 rounded-full inline-block"></span> Blood Donors
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 bg-amber-500 rounded-full inline-block"></span> Emergency Alerts
        </span>
      </div>
    </div>
  );
}
