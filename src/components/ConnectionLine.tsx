import { Position } from '@/types/node';
import { useState } from 'react';
import { X } from 'lucide-react';

interface ConnectionLineProps {
  from: Position;
  to: Position;
  isValid: boolean | null | 'missing';
  onDelete: () => void;
  canDelete?: boolean;
}

export const ConnectionLine = ({ from, to, isValid, onDelete, canDelete = true }: ConnectionLineProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isSelected, setIsSelected] = useState(false);

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

  const strokeWidth = isHovered || isSelected ? 3 : 2;
  const isDashed = isValid === 'missing';

  // Calculate midpoint for delete button
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;

  const handleLineClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (canDelete && isValid === null) {
      setIsSelected(!isSelected);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
    setIsSelected(false);
  };

  return (
    <g
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="pointer-events-auto"
    >
      {/* Invisible wider path for easier hover */}
      <path
        d={path}
        stroke="transparent"
        strokeWidth="12"
        fill="none"
        className="pointer-events-auto cursor-pointer"
        onClick={handleLineClick}
      />
      
      {/* Visible path */}
      <path
        d={path}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        fill="none"
        className="transition-all duration-200 pointer-events-none"
        strokeLinecap="round"
        strokeDasharray={isDashed ? "8,4" : undefined}
        style={{
          filter: isHovered || isSelected ? 'drop-shadow(0 0 6px currentColor)' : 'none',
        }}
      />

      {/* Delete button - shown when selected */}
      {isSelected && canDelete && isValid === null && (
        <g transform={`translate(${midX}, ${midY})`}>
          {/* Button background */}
          <circle
            r="16"
            fill="hsl(0, 84%, 60%)"
            className="cursor-pointer hover:scale-110 transition-transform"
            onClick={handleDeleteClick}
          />
          {/* X icon */}
          <g transform="translate(-8, -8)">
            <line
              x1="4"
              y1="4"
              x2="12"
              y2="12"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              className="pointer-events-none"
            />
            <line
              x1="12"
              y1="4"
              x2="4"
              y2="12"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              className="pointer-events-none"
            />
          </g>
        </g>
      )}

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
