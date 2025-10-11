import { useState, useRef, useCallback, useEffect } from 'react';
import { NodeData, Connection, Position, HistoryState } from '@/types/node';
import { Node } from './Node';
import { ConnectionLine } from './ConnectionLine';
import { Toolbar } from './Toolbar';
import { toast } from 'sonner';

const INITIAL_NODES: NodeData[] = [
  { id: '1', hiddenName: 'A', displayName: 'MAPPING', position: { x: 100, y: 200 }, color: 'pink', icon: 'map', description: 'Coordenadas' },
  { id: '2', hiddenName: 'B', displayName: 'IMAGE', position: { x: 100, y: 320 }, color: 'orange', icon: 'image', description: 'Textura' },
  { id: '3', hiddenName: 'C', displayName: 'PRINCIPLED BSDF', position: { x: 100, y: 440 }, color: 'gray', icon: 'sparkles', description: 'Material' },
  { id: '4', hiddenName: 'D', displayName: 'OUTPUT LAYER', position: { x: 100, y: 560 }, color: 'blue', icon: 'layers', description: 'Salida' },
];

export const NodeCanvas = () => {
  const [nodes, setNodes] = useState<NodeData[]>(INITIAL_NODES);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [testMode, setTestMode] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<{ nodeId: string; x: number; y: number } | null>(null);
  const [mousePos, setMousePos] = useState<Position>({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState<Position>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Position>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [history, setHistory] = useState<HistoryState[]>([{ nodes: INITIAL_NODES, connections: [] }]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const canvasRef = useRef<HTMLDivElement>(null);

  const saveToHistory = useCallback(() => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ nodes: [...nodes], connections: [...connections] });
    if (newHistory.length > 50) newHistory.shift();
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [nodes, connections, history, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setNodes(prevState.nodes);
      setConnections(prevState.connections);
      setHistoryIndex(historyIndex - 1);
      toast.info('Deshecho');
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setNodes(nextState.nodes);
      setConnections(nextState.connections);
      setHistoryIndex(historyIndex + 1);
      toast.info('Rehecho');
    }
  }, [history, historyIndex]);

  const validateConnection = useCallback((fromNodeId: string, toNodeId: string): boolean => {
    const fromNode = nodes.find(n => n.id === fromNodeId);
    const toNode = nodes.find(n => n.id === toNodeId);
    
    if (!fromNode || !toNode) return false;

    const sequence = ['A', 'B', 'C', 'D'];
    const fromIndex = sequence.indexOf(fromNode.hiddenName);
    const toIndex = sequence.indexOf(toNode.hiddenName);

    return toIndex === fromIndex + 1;
  }, [nodes]);

  const handleNodeDragStart = (nodeId: string) => {
    setDraggingNode(nodeId);
  };

  const handleNodeDrag = (nodeId: string, position: Position) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId ? { ...node, position } : node
    ));
  };

  const handleNodeNameEdit = (nodeId: string, newName: string) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId ? { ...node, displayName: newName } : node
    ));
    saveToHistory();
  };

  const handleNodeDragEnd = () => {
    if (draggingNode) {
      saveToHistory();
      setDraggingNode(null);
    }
  };

  const handleConnectionStart = (nodeId: string, position: Position) => {
    setConnectingFrom({ nodeId, x: position.x, y: position.y });
  };

  const handleConnectionEnd = (toNodeId: string) => {
    if (connectingFrom && connectingFrom.nodeId !== toNodeId) {
      const existingConnection = connections.find(
        c => c.fromNodeId === connectingFrom.nodeId || c.toNodeId === toNodeId
      );

      if (existingConnection) {
        toast.error('Ya existe una conexión en este nodo');
        setConnectingFrom(null);
        return;
      }

      const isValid = validateConnection(connectingFrom.nodeId, toNodeId);
      const newConnection: Connection = {
        id: `${connectingFrom.nodeId}-${toNodeId}`,
        fromNodeId: connectingFrom.nodeId,
        toNodeId,
        isValid,
      };

      setConnections(prev => [...prev, newConnection]);
      saveToHistory();
      
      if (isValid) {
        toast.success('Conexión correcta');
      } else {
        toast.error('Conexión fuera de secuencia');
      }
    }
    setConnectingFrom(null);
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setMousePos({
        x: (e.clientX - rect.left - panOffset.x) / zoom,
        y: (e.clientY - rect.top - panOffset.y) / zoom,
      });
    }

    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  };

  const handleCanvasMouseUp = () => {
    setIsPanning(false);
    if (connectingFrom) {
      setConnectingFrom(null);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.001;
    const newZoom = Math.min(Math.max(0.5, zoom + delta), 2);
    setZoom(newZoom);
  };

  const handleSubmit = () => {
    const correctSequence = ['A', 'B', 'C', 'D'];
    
    if (connections.length !== 3) {
      toast.error('Faltan conexiones. Debes conectar los 4 nodos en secuencia.');
      return;
    }

    const allValid = connections.every(c => c.isValid);
    
    // Verificar que la cadena sea completa
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const connMap = new Map(connections.map(c => [c.fromNodeId, c.toNodeId]));
    
    let currentId = nodes.find(n => n.hiddenName === 'A')?.id;
    const sequence: string[] = [];
    
    while (currentId && sequence.length < 4) {
      const node = nodeMap.get(currentId);
      if (node) sequence.push(node.hiddenName);
      currentId = connMap.get(currentId);
    }

    const isComplete = sequence.length === 4 && 
                      sequence.every((name, i) => name === correctSequence[i]);

    setSubmitted(true);

    if (isComplete && allValid) {
      toast.success('¡Excelente! Secuencia correcta A → B → C → D', {
        duration: 5000,
      });
      console.log('Resultado:', {
        pass: true,
        sequence,
        connections: connections.map(c => ({
          from: nodeMap.get(c.fromNodeId)?.hiddenName,
          to: nodeMap.get(c.toNodeId)?.hiddenName,
        })),
      });
    } else {
      toast.error('Secuencia incorrecta. Revisa las conexiones.', {
        duration: 5000,
      });
      console.log('Resultado:', {
        pass: false,
        sequence,
        expected: correctSequence,
      });
    }
  };

  const deleteConnection = (connectionId: string) => {
    setConnections(prev => prev.filter(c => c.id !== connectionId));
    saveToHistory();
    toast.info('Conexión eliminada');
  };

  // Get connection status for a node (for yellow highlighting)
  const getNodeConnectionStatus = (nodeId: string) => {
    const hasInput = connections.some(c => c.toNodeId === nodeId);
    const hasOutput = connections.some(c => c.fromNodeId === nodeId);
    const node = nodes.find(n => n.id === nodeId);
    
    // Node A should only have output, Node D should only have input
    if (node?.hiddenName === 'A') return hasOutput ? 'connected' : 'unconnected';
    if (node?.hiddenName === 'D') return hasInput ? 'connected' : 'unconnected';
    
    // Nodes B and C should have both
    return (hasInput && hasOutput) ? 'connected' : 'unconnected';
  };

  // Generate correct solution nodes - positioned horizontally at the bottom
  const correctNodes: NodeData[] = INITIAL_NODES.map((node, index) => ({
    ...node,
    id: `correct-${node.id}`,
    position: { x: 100 + index * 220, y: 750 },
  }));

  const correctConnections: Connection[] = [
    { id: 'correct-1-2', fromNodeId: 'correct-1', toNodeId: 'correct-2', isValid: true },
    { id: 'correct-2-3', fromNodeId: 'correct-2', toNodeId: 'correct-3', isValid: true },
    { id: 'correct-3-4', fromNodeId: 'correct-3', toNodeId: 'correct-4', isValid: true },
  ];

  // Generate missing connections for student's work
  const getMissingConnections = (): Connection[] => {
    if (!submitted) return [];
    
    const expectedConnections = [
      { from: '1', to: '2' }, // A -> B
      { from: '2', to: '3' }, // B -> C
      { from: '3', to: '4' }, // C -> D
    ];
    
    const missingConnections: Connection[] = [];
    
    expectedConnections.forEach(({ from, to }) => {
      const exists = connections.some(
        c => c.fromNodeId === from && c.toNodeId === to
      );
      
      if (!exists) {
        missingConnections.push({
          id: `missing-${from}-${to}`,
          fromNodeId: from,
          toNodeId: to,
          isValid: 'missing',
        });
      }
    });
    
    return missingConnections;
  };

  const missingConnections = getMissingConnections();

  return (
    <div className="w-full h-screen flex flex-col bg-canvas-bg">
      <Toolbar
        testMode={testMode}
        onToggleTestMode={() => setTestMode(!testMode)}
        onUndo={undo}
        onRedo={redo}
        onSubmit={handleSubmit}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        submitted={submitted}
      />
      
      <div
        ref={canvasRef}
        className="flex-1 relative overflow-hidden grid-pattern cursor-move"
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
        onWheel={handleWheel}
      >
        <div
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
          }}
          className="relative w-full h-full"
        >
          {/* Title */}
          <div className="absolute top-8 left-1/2 -translate-x-1/2 z-50">
            <h1 className="text-4xl font-heading font-extrabold text-white tracking-wider">
              ETAPAS DE SHADING
            </h1>
          </div>

          {/* Student's work label */}
          {submitted && (
            <div className="absolute top-4 left-4 bg-canvas-fg/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-canvas-fg/20">
              <p className="text-sm font-medium text-canvas-fg">Tu respuesta:</p>
            </div>
          )}

          {/* Render student connections */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
            {connections.map(conn => {
              const fromNode = nodes.find(n => n.id === conn.fromNodeId);
              const toNode = nodes.find(n => n.id === conn.toNodeId);
              if (!fromNode || !toNode) return null;

              return (
                <ConnectionLine
                  key={conn.id}
                  from={{ x: fromNode.position.x + 180, y: fromNode.position.y + 45 }}
                  to={{ x: toNode.position.x, y: toNode.position.y + 45 }}
                  isValid={submitted ? conn.isValid : null}
                  onDelete={() => !submitted && deleteConnection(conn.id)}
                />
              );
            })}
            
            {/* Missing connections (yellow dashed) */}
            {missingConnections.map(conn => {
              const fromNode = nodes.find(n => n.id === conn.fromNodeId);
              const toNode = nodes.find(n => n.id === conn.toNodeId);
              if (!fromNode || !toNode) return null;

              return (
                <ConnectionLine
                  key={conn.id}
                  from={{ x: fromNode.position.x + 180, y: fromNode.position.y + 45 }}
                  to={{ x: toNode.position.x, y: toNode.position.y + 45 }}
                  isValid="missing"
                  onDelete={() => {}}
                />
              );
            })}
            
            {/* Rubber band connection */}
            {connectingFrom && !submitted && (
              <ConnectionLine
                from={{ x: connectingFrom.x, y: connectingFrom.y }}
                to={mousePos}
                isValid={null}
                onDelete={() => {}}
              />
            )}

            {/* Render correct solution connections */}
            {submitted && correctConnections.map(conn => {
              const fromNode = correctNodes.find(n => n.id === conn.fromNodeId);
              const toNode = correctNodes.find(n => n.id === conn.toNodeId);
              if (!fromNode || !toNode) return null;

              return (
                <ConnectionLine
                  key={conn.id}
                  from={{ x: fromNode.position.x + 180, y: fromNode.position.y + 45 }}
                  to={{ x: toNode.position.x, y: toNode.position.y + 45 }}
                  isValid={true}
                  onDelete={() => {}}
                />
              );
            })}
          </svg>

          {/* Render student nodes */}
          {nodes.map(node => (
            <Node
              key={node.id}
              node={node}
              testMode={testMode}
              isDragging={draggingNode === node.id}
              onDragStart={() => !submitted && handleNodeDragStart(node.id)}
              onDrag={(pos) => !submitted && handleNodeDrag(node.id, pos)}
              onDragEnd={handleNodeDragEnd}
              onConnectionStart={(pos) => !submitted && handleConnectionStart(node.id, pos)}
              onConnectionEnd={() => !submitted && handleConnectionEnd(node.id)}
              isConnecting={connectingFrom?.nodeId === node.id}
              onNameEdit={(newName) => handleNodeNameEdit(node.id, newName)}
              connectionStatus={submitted ? getNodeConnectionStatus(node.id) : undefined}
              disabled={submitted}
            />
          ))}

          {/* Render correct solution nodes */}
          {submitted && (
            <>
              <div className="absolute left-[100px] top-[700px] bg-canvas-fg/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-canvas-fg/20">
                <p className="text-sm font-medium text-canvas-fg">Respuesta correcta:</p>
              </div>
              {correctNodes.map(node => (
                <Node
                  key={node.id}
                  node={node}
                  testMode={testMode}
                  isDragging={false}
                  onDragStart={() => {}}
                  onDrag={() => {}}
                  onDragEnd={() => {}}
                  onConnectionStart={() => {}}
                  onConnectionEnd={() => {}}
                  isConnecting={false}
                  onNameEdit={() => {}}
                  disabled={true}
                />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
