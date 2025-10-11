import { Position } from '@/types/node';
import { useState } from 'react';

interface ConnectionLineProps {
  from: Position;
  to: Position;
  isValid: boolean | null | 'missing';
  onDelete: () => void;
}

export const ConnectionLine = ({ from, to, isValid, onDelete }: ConnectionLineProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Bezier control points for smooth curves
  const controlOffset = Math.min(distance * 0.5, 100);
  const cp1x = from.x + controlOffset;
  const cp1y = from.y;
  const cp2x = to.x - controlOffset;
  const cp2y = to.y;

  const path = `M ${from.x} ${from.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${to.x} ${to.y}`;

  const strokeColor = isValid === null 
    ? '#ffffff' // White for unsubmitted or rubber band
    : isValid === 'missing'
      ? 'hsl(48, 96%, 53%)' // Yellow for missing connections
      : isValid 
        ? 'hsl(142, 76%, 36%)' // Green for correct
        : 'hsl(0, 84%, 60%)'; // Red for incorrect

  const strokeWidth = isHovered ? 3 : 2;
  const isDashed = isValid === 'missing';

  return (
    <g
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="pointer-events-auto cursor-pointer"
      onClick={(e) => {
        e.stopPropagation();
        if (isValid !== null) onDelete();
      }}
    >
      {/* Invisible wider path for easier hover */}
      <path
        d={path}
        stroke="transparent"
        strokeWidth="12"
        fill="none"
        className="pointer-events-auto"
      />
      
      {/* Visible path */}
      <path
        d={path}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        fill="none"
        className="transition-all duration-200"
        strokeLinecap="round"
        strokeDasharray={isDashed ? "8,4" : undefined}
        style={{
          filter: isHovered ? 'drop-shadow(0 0 6px currentColor)' : 'none',
        }}
      />

      {/* Animated pulse effect when connection is made */}
      {isValid !== null && (
        <circle r="4" fill={strokeColor} className="animate-pulse">
          <animateMotion dur="2s" repeatCount="indefinite">
            <mpath href={`#path-${from.x}-${from.y}`} />
          </animateMotion>
        </circle>
      )}
      
      <path id={`path-${from.x}-${from.y}`} d={path} fill="none" className="hidden" />
    </g>
  );
};
