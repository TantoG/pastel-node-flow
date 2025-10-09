import { useState, useRef, useEffect } from 'react';
import { NodeData, Position } from '@/types/node';

interface NodeProps {
  node: NodeData;
  testMode: boolean;
  isDragging: boolean;
  onDragStart: () => void;
  onDrag: (position: Position) => void;
  onDragEnd: () => void;
  onConnectionStart: (position: Position) => void;
  onConnectionEnd: () => void;
  isConnecting: boolean;
}

export const Node = ({
  node,
  testMode,
  isDragging,
  onDragStart,
  onDrag,
  onDragEnd,
  onConnectionStart,
  onConnectionEnd,
  isConnecting,
}: NodeProps) => {
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const nodeRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.socket')) return;
    
    e.stopPropagation();
    onDragStart();
    
    const rect = nodeRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const handleOutputSocketMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = nodeRef.current?.getBoundingClientRect();
    if (rect) {
      onConnectionStart({
        x: node.position.x + 180,
        y: node.position.y + 45,
      });
    }
  };

  const handleInputSocketMouseUp = (e: React.MouseEvent) => {
    e.stopPropagation();
    onConnectionEnd();
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const canvas = document.querySelector('.grid-pattern');
      const rect = canvas?.getBoundingClientRect();
      if (rect) {
        const parentTransform = canvas?.querySelector('div')?.style.transform || '';
        const scaleMatch = parentTransform.match(/scale\(([\d.]+)\)/);
        const scale = scaleMatch ? parseFloat(scaleMatch[1]) : 1;
        const translateMatch = parentTransform.match(/translate\(([-\d.]+)px, ([-\d.]+)px\)/);
        const translateX = translateMatch ? parseFloat(translateMatch[1]) : 0;
        const translateY = translateMatch ? parseFloat(translateMatch[2]) : 0;

        onDrag({
          x: (e.clientX - rect.left - translateX) / scale - dragOffset.x,
          y: (e.clientY - rect.top - translateY) / scale - dragOffset.y,
        });
      }
    };

    const handleMouseUp = () => {
      onDragEnd();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, onDrag, onDragEnd]);

  const colorClass = `bg-node-${node.color}`;
  const shadowClass = isDragging ? 'node-shadow-lifted' : 'node-shadow';

  return (
    <div
      ref={nodeRef}
      className={`absolute select-none ${shadowClass} transition-shadow duration-200`}
      style={{
        left: node.position.x,
        top: node.position.y,
        width: 180,
        height: 90,
        zIndex: isDragging ? 1000 : isConnecting ? 999 : 1,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onMouseDown={handleMouseDown}
    >
      <div className={`w-full h-full ${colorClass} rounded-lg border-2 border-border/20 p-3 flex flex-col justify-center`}>
        <div className="text-sm font-medium text-canvas-bg">
          {node.displayName}
          {testMode && (
            <span className="ml-2 text-xs opacity-70">({node.hiddenName})</span>
          )}
        </div>
      </div>

      {/* Input Socket */}
      <div
        className="socket absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-socket-input border-2 border-canvas-bg cursor-crosshair hover:scale-125 transition-transform"
        onMouseUp={handleInputSocketMouseUp}
      />

      {/* Output Socket */}
      <div
        className="socket absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-socket-output border-2 border-canvas-bg cursor-crosshair hover:scale-125 transition-transform"
        onMouseDown={handleOutputSocketMouseDown}
      />
    </div>
  );
};
