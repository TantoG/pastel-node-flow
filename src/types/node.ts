export interface Position {
  x: number;
  y: number;
}

export interface NodeData {
  id: string;
  hiddenName: string; // A, B, C, D
  displayName: string;
  position: Position;
  color: 'pink' | 'orange' | 'gray' | 'blue';
  icon: string; // lucide icon name
  description?: string;
  connectionStatus?: 'connected' | 'unconnected';
}

export interface Connection {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  isValid: boolean;
}

export interface HistoryState {
  nodes: NodeData[];
  connections: Connection[];
}
