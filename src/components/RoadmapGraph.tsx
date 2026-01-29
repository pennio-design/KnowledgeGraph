import React, { useCallback } from 'react';
import ReactFlow, { 
  Node, Edge, Background, Controls, Handle, Position, NodeProps,
  useNodesState, useEdgesState
} from 'reactflow';
import 'reactflow/dist/style.css';
import { RoadmapNode, RoadmapEdge } from '../types';
import { Lock, CheckCircle, PlayCircle, BookOpen } from 'lucide-react';

// --- CUSTOM NODE COMPONENT ---
const CustomNode = ({ data }: NodeProps<RoadmapNode>) => {
  // Determine styling based on strict status types: 'locked' | 'available' | 'completed'
  let bgClass = 'bg-white border-slate-200';
  let icon = <BookOpen className="w-4 h-4 text-slate-400" />;
  let opacity = 'opacity-100';

  if (data.status === 'locked') {
    bgClass = 'bg-slate-100 border-slate-200';
    icon = <Lock className="w-4 h-4 text-slate-400" />;
    opacity = 'opacity-60 grayscale';
  } else if (data.status === 'completed') {
    bgClass = 'bg-emerald-50 border-emerald-200 shadow-sm';
    icon = <CheckCircle className="w-4 h-4 text-emerald-500" />;
  } else if (data.status === 'available') {
    // This represents "In Progress" or "Next Up"
    bgClass = 'bg-white border-blue-400 shadow-md shadow-blue-100 ring-2 ring-blue-50';
    icon = <PlayCircle className="w-4 h-4 text-blue-500" />;
  }

  return (
    <div className={`px-4 py-3 rounded-xl border-2 w-[220px] transition-all duration-300 ${bgClass} ${opacity}`}>
      <Handle type="target" position={Position.Top} className="!bg-slate-300 !w-3 !h-3" />
      
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{icon}</div>
        <div className="flex-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
            {data.category}
          </div>
          <div className="text-xs font-bold text-slate-900 leading-tight">
            {data.title}
          </div>
          <div className="mt-2 flex items-center justify-between">
             <span className="text-[9px] font-medium bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">
               {data.estimatedHours}h
             </span>
             <span className={`text-[9px] font-bold capitalize ${
               data.difficulty === 'beginner' ? 'text-emerald-500' : 
               data.difficulty === 'intermediate' ? 'text-amber-500' : 'text-red-500'
             }`}>
               {data.difficulty}
             </span>
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-slate-300 !w-3 !h-3" />
    </div>
  );
};

const nodeTypes = { concept: CustomNode };

interface RoadmapGraphProps {
  nodes: RoadmapNode[];
  edges: RoadmapEdge[];
  onNodeClick: (node: RoadmapNode) => void;
}

const RoadmapGraph: React.FC<RoadmapGraphProps> = ({ nodes, edges, onNodeClick }) => {
  // Convert our data types to React Flow types
  const initialNodes: Node[] = nodes.map(n => ({
    id: n.id,
    type: 'concept', // Must match nodeTypes key
    position: n.position,
    data: n,
    draggable: false, // Keep layout static for stability
  }));

  const initialEdges: Edge[] = edges.map(e => ({
    id: e.id,
    source: e.source,
    target: e.target,
    animated: true,
    style: { stroke: '#cbd5e1', strokeWidth: 2 },
  }));

  const handleNodeClick = (_: React.MouseEvent, node: Node) => {
    // Only allow clicking available or completed nodes
    if (node.data.status !== 'locked') {
      onNodeClick(node.data as RoadmapNode);
    }
  };

  return (
    <div className="w-full h-full bg-slate-50">
      <ReactFlow
        nodes={initialNodes}
        edges={initialEdges}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        fitView
        minZoom={0.2}
        maxZoom={1.5}
        attributionPosition="bottom-right"
      >
        <Background color="#e2e8f0" gap={24} size={1} />
        <Controls className="!bg-white !border-slate-200 !shadow-lg !rounded-xl !m-4" />
      </ReactFlow>
    </div>
  );
};

export default RoadmapGraph;
