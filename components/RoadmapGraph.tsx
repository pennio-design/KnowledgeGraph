
import React, { useMemo, useCallback } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  Node as FlowNode, 
  Edge as FlowEdge,
  Handle,
  Position,
  NodeProps
} from 'reactflow';
import 'reactflow/dist/style.css';
import { RoadmapNode, NodeStatus } from '../types';
import { CheckCircle, Lock, Play, Star } from 'lucide-react';

const CustomNode = ({ data }: NodeProps) => {
  const status: NodeStatus = data.status;
  const isMilestone = data.nodeType === 'milestone';

  const getStatusStyles = () => {
    switch (status) {
      case 'completed': return 'border-emerald-500 bg-emerald-50 shadow-emerald-100';
      case 'in_progress': return 'border-amber-500 bg-amber-50 shadow-amber-100 animate-pulse';
      case 'locked': return 'border-slate-200 bg-slate-50 opacity-60';
      default: return 'border-blue-500 bg-white shadow-blue-100';
    }
  };

  return (
    <div className={`px-4 py-3 shadow-md rounded-xl border-2 ${getStatusStyles()} min-w-[180px] max-w-[220px]`}>
      <Handle type="target" position={Position.Top} className="w-2 h-2" />
      <div className="flex items-center gap-2 mb-1">
        {status === 'completed' && <CheckCircle className="w-4 h-4 text-emerald-500" />}
        {status === 'locked' && <Lock className="w-4 h-4 text-slate-400" />}
        {status === 'in_progress' && <Play className="w-4 h-4 text-amber-500" />}
        {status === 'available' && <div className="w-4 h-4 rounded-full border-2 border-blue-400" />}
        <span className={`text-[10px] font-bold uppercase tracking-wider ${isMilestone ? 'text-amber-600' : 'text-slate-400'}`}>
          {isMilestone ? 'Milestone' : data.category}
        </span>
      </div>
      <h3 className="font-bold text-slate-900 text-sm leading-tight mb-1">{data.title}</h3>
      <div className="flex items-center justify-between mt-2">
        <span className="text-[10px] text-slate-500 font-medium">~{data.estimatedHours}h</span>
        {isMilestone && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
      </div>
      <Handle type="source" position={Position.Bottom} className="w-2 h-2" />
    </div>
  );
};

interface RoadmapGraphProps {
  nodes: RoadmapNode[];
  edges: FlowEdge[];
  onNodeClick: (node: RoadmapNode) => void;
}

const RoadmapGraph: React.FC<RoadmapGraphProps> = ({ nodes, edges, onNodeClick }) => {
  const nodeTypes = useMemo(() => ({ custom: CustomNode }), []);

  const flowNodes: FlowNode[] = useMemo(() => 
    nodes.map(node => ({
      id: node.id,
      type: 'custom',
      position: node.position,
      data: node,
    })), [nodes]);

  const flowEdges: FlowEdge[] = useMemo(() => 
    edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      animated: nodes.find(n => n.id === edge.source)?.status === 'completed',
      style: { stroke: nodes.find(n => n.id === edge.source)?.status === 'completed' ? '#10b981' : '#cbd5e1', strokeWidth: 2 },
    })), [edges, nodes]);

  const onConnect = useCallback((params: any) => {
    // Read-only graph
  }, []);

  return (
    <div className="h-full w-full bg-slate-50">
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        onNodeClick={(_, node) => onNodeClick(node.data)}
        fitView
        onConnect={onConnect}
        className="touch-none"
      >
        <Background color="#cbd5e1" gap={20} size={1} />
        <Controls />
      </ReactFlow>
    </div>
  );
};

export default RoadmapGraph;
