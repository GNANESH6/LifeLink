import React from "react";

interface LifeLinkLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
}

export const LifeLinkLogo: React.FC<LifeLinkLogoProps> = ({
  className = "",
  size = "md",
  showText = true,
}) => {
  // Determine dimensions based on size variant
  let iconWidth = 50;
  let iconHeight = 50;
  let textSizeClass = "text-xl sm:text-2xl";
  let subtextSizeClass = "text-[8px] sm:text-[9.5px]";
  let containerGap = "gap-3";

  if (size === "sm") {
    iconWidth = 36;
    iconHeight = 36;
    textSizeClass = "text-lg";
    subtextSizeClass = "text-[7px]";
    containerGap = "gap-2";
  } else if (size === "lg") {
    iconWidth = 64;
    iconHeight = 64;
    textSizeClass = "text-3xl sm:text-4xl";
    subtextSizeClass = "text-[10px] sm:text-[11.5px]";
    containerGap = "gap-4";
  } else if (size === "xl") {
    iconWidth = 120;
    iconHeight = 120;
    textSizeClass = "text-5xl";
    subtextSizeClass = "text-[14px]";
    containerGap = "gap-6";
  }

  return (
    <div className={`flex items-center ${containerGap} ${className} select-none`} id="lifelink-custom-logo">
      {/* 1. Custom High-Fidelity SVG Icon representing LifeLink Attachment with Vibrant Gradients */}
      <svg
        width={iconWidth}
        height={iconHeight}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-md select-none transition-transform duration-200 hover:scale-105"
        style={{ filter: "drop-shadow(0px 4px 10px rgba(239, 68, 68, 0.15))" }}
      >
        <defs>
          <linearGradient id="vibrantRedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF2A5F" />
            <stop offset="100%" stopColor="#EF4444" />
          </linearGradient>
          <linearGradient id="vibrantSlateGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>
          <filter id="luminousGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Left circular red arc line */}
        <path
          d="M 60 170 C 22 145, 12 85, 45 45 C 75 10, 125 15, 155 45"
          stroke="url(#vibrantRedGrad)"
          strokeWidth="7"
          strokeLinecap="round"
          fill="none"
        />

        {/* Right circular navy arc line */}
        <path
          d="M 155 45 C 180 72, 185 115, 168 150"
          stroke="url(#vibrantSlateGrad)"
          strokeWidth="4.5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Red Blood Drop teardrop shape in center */}
        <path
          d="M 100 40 C 100 40, 60 98, 60 115 C 60 137.5, 77.9 156, 100 156 C 122.1 156, 140 137.5, 140 115 C 140 98, 100 40, 100 40 Z"
          fill="url(#vibrantRedGrad)"
        />

        {/* White EKG/Heartbeat Line inside blood drop */}
        <path
          d="M 64 115 H 81 L 90 85 L 99 145 L 108 95 L 117 122 L 124 115 H 136"
          stroke="#FFFFFF"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Navy Blue Hand cradling the teardrop bottom */}
        <path
          d="M 52 125 C 46 131, 41 142, 45 150 C 54 165, 75 174, 100 174 C 124 174, 145 163, 155 145 C 143 151, 131 154, 118 154 C 102 154, 88 148, 76 142 C 63 135, 56 128, 52 125 Z"
          fill="url(#vibrantSlateGrad)"
        />

        {/* Map Pin at top-right of the circle */}
        <g transform="translate(142, 28)">
          {/* Outer pin teardrop */}
          <path
            d="M 15 0 C 6.7 0, 0 6.7, 0 15 C 0 24.5, 15 38, 15 38 C 15 38, 30 24.5, 30 15 C 30 6.7, 23.3 0, 15 0 Z"
            fill="url(#vibrantSlateGrad)"
          />
          {/* Pin center white dot */}
          <circle cx="15" cy="15" r="4.5" fill="#FFFFFF" />
        </g>
      </svg>

      {/* 2. Responsive Typography */}
      {showText && (
        <div className="flex flex-col justify-center text-left">
          {/* Main "LifeLink" Text */}
          <h1 className={`${textSizeClass} font-display font-black tracking-tight leading-none flex items-center`}>
            <span className="bg-gradient-to-r from-[#FF2A5F] to-[#EF4444] bg-clip-text text-transparent">Life</span>
            <span className="text-[#0F172A] dark:text-white flex items-center relative">
              Link
            </span>
          </h1>
        </div>
      )}
    </div>
  );
};
