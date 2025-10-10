import { useState, useRef, useEffect } from 'react';
import { NodeData, Position } from '@/types/node';
import * as Icons from 'lucide-react';
import { LucideIcon } from 'lucide-react';

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
  onNameEdit: (newName: string) => void;
  connectionStatus?: 'connected' | 'unconnected';
  disabled?: boolean;
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
  onNameEdit,
  connectionStatus,
  disabled = false,
}: NodeProps) => {
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(node.displayName);
  const nodeRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get icon component dynamically
  const getIcon = (iconName: string): LucideIcon => {
    const iconKey = iconName
      .split('-')
      .map((part, i) => (i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)))
      .join('') as keyof typeof Icons;
    
    const IconComponent = Icons[iconKey as keyof typeof Icons];
    return IconComponent as LucideIcon || Icons.Circle;
  };

  const IconComponent = getIcon(node.icon);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.socket')) return;
    if (isEditing) return;
    
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

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!testMode) return; // Only allow editing in test mode
    setIsEditing(true);
    setEditValue(node.displayName);
  };

  const handleEditBlur = () => {
    setIsEditing(false);
    if (editValue.trim() !== node.displayName) {
      onNameEdit(editValue.trim() || node.displayName);
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEditBlur();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(node.displayName);
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
  
  // Apply yellow tint for unconnected nodes when showing connection status
  const nodeClassName = connectionStatus === 'unconnected' 
    ? 'ring-2 ring-yellow-500/50 ring-offset-2 ring-offset-canvas-bg' 
    : '';

  return (
    <div
      ref={nodeRef}
      className={`absolute select-none ${shadowClass} ${nodeClassName} transition-all duration-200`}
      style={{
        left: node.position.x,
        top: node.position.y,
        width: 180,
        height: 90,
        zIndex: isDragging ? 1000 : isConnecting ? 999 : 1,
        cursor: disabled ? 'default' : isDragging ? 'grabbing' : isEditing ? 'text' : 'grab',
        opacity: disabled ? 0.9 : 1,
      }}
      onMouseDown={disabled ? undefined : handleMouseDown}
      onDoubleClick={disabled ? undefined : handleDoubleClick}
    >
      <div className={`w-full h-full ${colorClass} rounded-lg border-2 border-border/20 overflow-hidden flex flex-col`}>
        {/* Header */}
        <div className="px-3 py-2 border-b border-canvas-bg/10 bg-canvas-bg/5">
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleEditBlur}
              onKeyDown={handleEditKeyDown}
              className="w-full bg-canvas-bg/20 text-canvas-bg text-xs font-medium px-1 py-0.5 rounded border border-canvas-bg/30 focus:outline-none focus:border-canvas-bg/50"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            />
          ) : (
            <div className="text-xs font-medium text-canvas-bg flex items-center justify-between">
              <span className="truncate font-bold">
                {testMode ? node.hiddenName : node.displayName}
              </span>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 flex items-center gap-2 px-3 py-1">
          <IconComponent className="w-5 h-5 text-canvas-bg/60 flex-shrink-0" strokeWidth={1.5} />
          {node.description && (
            <span className="text-[10px] text-canvas-bg/50 truncate leading-tight">
              {node.description}
            </span>
          )}
        </div>
      </div>

      {/* Input Socket */}
      <div
        className="socket socket-hover absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-socket-input border-2 border-canvas-bg cursor-crosshair"
        style={{ color: 'hsl(var(--socket-input))' }}
        onMouseUp={handleInputSocketMouseUp}
      />

      {/* Output Socket */}
      <div
        className="socket socket-hover absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-socket-output border-2 border-canvas-bg cursor-crosshair"
        style={{ color: 'hsl(var(--socket-output))' }}
        onMouseDown={handleOutputSocketMouseDown}
      />
    </div>
  );
};
