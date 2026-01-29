import React from 'react';
import ReactFlow, { 
  Node, Edge, Background, Controls, Handle, Position, NodeProps
} from 'reactflow';
import 'reactflow/dist/style.css';
import { UnifiedRoadmap, UnifiedNode } from '../types';
import { Sparkles, AlertCircle, ArrowUpRight } from 'lucide-react';

const UnifiedNodeComponent = ({ data }: NodeProps<UnifiedNode>) => {
  const size = 100 + (data.globalPriorityScore || 0) * 1.5;
  const isBottleneck = data.isBottleneck;
  
  let bgClass = "bg-white border-slate-200";
  let textClass = "text-slate-900";
  
  if (data.globalPriorityScore > 80) {
    bgClass = "bg-amber-50 border-amber-200 shadow-amber-100";
    textClass = "text-amber-900";
  } else if (data.synergyCount > 1) {
    bgClass = "bg-blue-50 border-blue-200 shadow-blue-100";
    textClass = "text-blue-900";
  }

  return (
    <div 
      style={{ width: `${size}px`, height: `${size}px` }}
      className={`rounded-full flex flex-col items-center justify-center text-center p-4 border-4 shadow-xl transition-all duration-500 relative ${bgClass} ${isBottleneck ? 'animate-pulse ring-4 ring-red-100' : ''}`}
    >
      <Handle type="target" position={Position.Top} className="!bg-slate-400" />
      {isBottleneck && (
        <div className="absolute -top-3 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm animate-bounce">
          <AlertCircle className="w-3 h-3" /> BOTTLENECK
        </div>
      )}
      {data.globalPriorityScore > 85 && (
        <div className="absolute -top-3 bg-amber-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
          <Sparkles className="w-3 h-3" /> TOP 20%
        </div>
      )}
      <div className={`font-black leading-tight ${size > 150 ? 'text-lg' : 'text-xs'} ${textClass}`}>
        {data.title}
      </div>
      <div className="mt-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        {data.synergyCount} Goals
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-slate-400" />
    </div>
  );
};

const nodeTypes = { unified: UnifiedNodeComponent };

interface UnifiedGraphViewProps {
  roadmap: UnifiedRoadmap;
  onClose: () => void;
}

const UnifiedGraphView: React.FC<UnifiedGraphViewProps> = ({ roadmap, onClose }) => {
  const initialNodes: Node[] = roadmap.nodes.map(n => ({
    id: n.id,
    type: 'unified',
    position: n.position,
    data: n,
  }));

  const initialEdges: Edge[] = roadmap.edges.map(e => ({
    id: e.id,
    source: e.source,
    target: e.target,
    animated: true,
    style: { stroke: '#94a3b8', strokeWidth: 2 },
  }));

  return (
    <div className="fixed inset-0 bg-slate-50 z-50 flex flex-col animate-in fade-in duration-300">
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm z-10">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <span className="bg-slate-900 text-white p-1 rounded">GOD</span> MODE
          </h1>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Synthesizing {roadmap.goals.length} Goals • {roadmap.nodes.length} Critical Nodes
          </p>
        </div>
        <button 
          onClick={onClose}
          className="px-6 py-2 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-colors"
        >
          Close View
        </button>
      </div>

      <div className="flex-1 w-full h-full bg-slate-100">
        <ReactFlow
          nodes={initialNodes}
          edges={initialEdges}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.1}
          maxZoom={1.5}
        >
          <Background color="#cbd5e1" gap={20} size={1} />
          <Controls className="!bg-white !border-slate-200 !shadow-lg !rounded-xl overflow-hidden" />
        </ReactFlow>
      </div>

      <div className="bg-white border-t border-slate-200 p-6 grid grid-cols-1 md:grid-cols-3 gap-6 z-10">
         <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
               <Sparkles className="w-6 h-6" />
            </div>
            <div>
               <div className="text-sm font-bold text-slate-900">Pareto Optimized</div>
               <div className="text-xs text-slate-500">Focus on the big Gold nodes first.</div>
            </div>
         </div>
         <div className="flex items-center gap-4">
            <div className="p-3 bg-red-50 rounded-xl text-red-600 animate-pulse">
               <AlertCircle className="w-6 h-6" />
            </div>
            <div>
               <div className="text-sm font-bold text-slate-900">Bottleneck Detected</div>
               <div className="text-xs text-slate-500">Pulsing nodes block multiple goals.</div>
            </div>
         </div>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
               <ArrowUpRight className="w-6 h-6" />
            </div>
            <div>
               <div className="text-sm font-bold text-slate-900">Synergy Score</div>
               <div className="text-xs text-slate-500">Blue nodes create cross-domain bridges.</div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default UnifiedGraphView;
