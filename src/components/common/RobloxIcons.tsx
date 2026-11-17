import React from 'react';

// Official 2022 Roblox Tilted Square Logo
export const RobloxLogo: React.FC<{ className?: string; size?: number; color?: string }> = ({ 
  className = "w-7 h-7", 
  size = 28,
  color = "currentColor" 
}) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer tilted square */}
      <path 
        d="M23.5 4.5L95.5 23.5L76.5 95.5L4.5 76.5L23.5 4.5Z" 
        fill={color} 
      />
      {/* Inner square cut-out hole */}
      <path 
        d="M44.5 38.5L62.5 43.5L57.5 61.5L39.5 56.5L44.5 38.5Z" 
        fill="#111216" 
      />
    </svg>
  );
};

// Official Roblox Wordmark (2022 Typography)
export const RobloxWordmark: React.FC<{ className?: string; height?: number }> = ({ 
  className = "h-6", 
  height = 24 
}) => {
  return (
    <div className={`flex items-center gap-1.5 select-none font-black tracking-tighter ${className}`}>
      <RobloxLogo size={height} color="#ffffff" className="shrink-0" />
      <span className="font-extrabold text-xl tracking-wide text-white uppercase" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
        ROBLOX
      </span>
    </div>
  );
};

// Official 2022 Robux Icon (Tilted Hexagonal Coin with square hole)
export const RobuxIcon: React.FC<{ className?: string; size?: number; color?: string }> = ({ 
  className = "w-4 h-4", 
  size = 16,
  color = "#00e676" 
}) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Hexagonal coin body */}
      <path 
        d="M50 4L90 27V73L50 96L10 73V27L50 4Z" 
        fill="none"
        stroke={color}
        strokeWidth="12"
        strokeLinejoin="round"
      />
      {/* Tilted square in the center */}
      <path 
        d="M50 28L72 50L50 72L28 50L50 28Z" 
        fill={color} 
      />
    </svg>
  );
};

// Official Roblox Studio 2022 Blue Logo
export const RobloxStudioLogo: React.FC<{ className?: string; size?: number }> = ({ 
  className = "w-7 h-7", 
  size = 28 
}) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path 
        d="M23.5 4.5L95.5 23.5L76.5 95.5L4.5 76.5L23.5 4.5Z" 
        fill="#00a2ff" 
      />
      <path 
        d="M44.5 38.5L62.5 43.5L57.5 61.5L39.5 56.5L44.5 38.5Z" 
        fill="#111216" 
      />
    </svg>
  );
};

// Official Roblox Verified Badge (2022 White tick in blue circle)
export const RobloxVerifiedBadge: React.FC<{ className?: string; size?: number }> = ({ 
  className = "w-4 h-4", 
  size = 16 
}) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="12" cy="12" r="10" fill="#00a2ff" />
      <path 
        d="M8.5 12L11 14.5L16 9.5" 
        stroke="#ffffff" 
        strokeWidth="2.2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
    </svg>
  );
};

// Roblox Premium Icon (P badge)
export const RobloxPremiumIcon: React.FC<{ className?: string; size?: number }> = ({
  className = "w-4 h-4",
  size = 16
}) => {
  return (
    <div 
      className={`rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center font-black text-black text-[10px] select-none ${className}`}
      style={{ width: size, height: size }}
      title="Roblox Premium"
    >
      P
    </div>
  );
};
