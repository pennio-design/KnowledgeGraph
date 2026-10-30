import React, { useMemo } from 'react';
import ReactFlow, { Node, Edge, Background, Controls, Handle, Position, NodeProps } from 'reactflow';
import 'reactflow/dist/style.css';
import { RoadmapNode, RoadmapEdge } from '../types';
import { Lock, CheckCircle, PlayCircle } from 'lucide-react';

type NodeData = RoadmapNode & { selected: boolean };

const DIFFICULTY_COLOR: Record<string, string> = {
  beginner: 'text-emerald-600',
  intermediate: 'text-amber-600',
  advanced: 'text-red-600',
};

const CustomNode = ({ data }: NodeProps<NodeData>) => {
  let style = 'bg-white border-blue-400 shadow-md';
  let icon = <PlayCircle className="w-4 h-4 text-blue-500" aria-hidden />;
  const label = { locked: 'Locked', available: 'Available', completed: 'Completed' }[data.status];

  if (data.status === 'locked') {
    style = 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed';
    icon = <Lock className="w-4 h-4 text-slate-400" aria-hidden />;
  } else if (data.status === 'completed') {
    style = 'bg-emerald-50 border-emerald-200 shadow-sm';
    icon = <CheckCircle className="w-4 h-4 text-emerald-600" aria-hidden />;
  }

  return (
    <div
      className={`px-4 py-3 rounded-xl border-2 w-[220px] transition-colors duration-200 ${style} ${data.selected ? 'ring-2 ring-slate-900' : ''}`}
      aria-label={`${data.title}, ${label}`}
    >
      <Handle type="target" position={Position.Top} />
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">{data.category}</div>
          <div className="text-xs font-bold text-slate-900 leading-tight">{data.title}</div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[10px] font-medium bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{data.estimatedHours}h</span>
            <span className={`text-[10px] font-bold capitalize ${DIFFICULTY_COLOR[data.difficulty] ?? 'text-slate-500'}`}>{data.difficulty}</span>
          </div>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

const nodeTypes = { concept: CustomNode };

interface RoadmapGraphProps {
  nodes: RoadmapNode[];
  edges: RoadmapEdge[];
  selectedId: string | null;
  onNodeClick: (node: RoadmapNode) => void;
}

const RoadmapGraph: React.FC<RoadmapGraphProps> = ({ nodes, edges, selectedId, onNodeClick }) => {
  const flowNodes: Node<NodeData>[] = useMemo(() => nodes.map(n => ({
    id: n.id,
    type: 'concept',
    position: n.position,
    data: { ...n, selected: n.id === selectedId },
    draggable: false,
    connectable: false,
  })), [nodes, selectedId]);

  const flowEdges: Edge[] = useMemo(() => edges.map(e => ({
    id: e.id,
    source: e.source,
    target: e.target,
    style: { stroke: '#94a3b8', strokeWidth: 2 },
  })), [edges]);

  return (
    <div className="absolute inset-0 bg-slate-50">
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        onNodeClick={(_, node) => { if (node.data.status !== 'locked') onNodeClick(node.data); }}
        nodesConnectable={false}
        fitView
        minZoom={0.2}
        maxZoom={1.5}
        attributionPosition="bottom-right"
      >
        <Background color="#e2e8f0" gap={24} size={1} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
};

export default RoadmapGraph;
