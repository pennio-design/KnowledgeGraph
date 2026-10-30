import React, { useMemo, useState } from 'react';
import ReactFlow, { Node, Edge, Background, Controls, Handle, Position, NodeProps } from 'reactflow';
import 'reactflow/dist/style.css';
import { UnifiedRoadmap, UnifiedNode } from '../types';
import { AlertCircle, ArrowUpRight, Star } from 'lucide-react';

const HIGH_LEVERAGE = 70;
// Layout positions assume small nodes; spread them so large (high-priority) nodes do not overlap.
const SPREAD_X = 1.3;
const SPREAD_Y = 1.6;

const UnifiedNodeComponent = ({ data }: NodeProps<UnifiedNode>) => {
  const size = 90 + data.globalPriorityScore;
  const isTop = data.globalPriorityScore > 80;

  let tone = 'bg-white border-slate-300 text-slate-900';
  if (isTop) tone = 'bg-amber-50 border-amber-300 text-amber-900';
  else if (data.synergyCount > 1) tone = 'bg-blue-50 border-blue-300 text-blue-900';

  return (
    <div
      style={{ width: size, height: size }}
      className={`rounded-full flex flex-col items-center justify-center text-center p-4 border-4 shadow-sm relative ${tone} ${data.isBottleneck ? 'ring-4 ring-red-200' : ''}`}
      title={data.description}
    >
      <Handle type="target" position={Position.Top} />
      {data.isBottleneck && (
        <div className="absolute -top-3 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
          <AlertCircle className="w-3 h-3" aria-hidden /> BOTTLENECK
        </div>
      )}
      <div className={`font-black leading-tight ${size > 150 ? 'text-base' : 'text-xs'}`}>{data.title}</div>
      <div className="mt-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
        {data.synergyCount} {data.synergyCount === 1 ? 'goal' : 'goals'}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

const nodeTypes = { unified: UnifiedNodeComponent };

interface UnifiedGraphViewProps {
  roadmap: UnifiedRoadmap;
  onClose: () => void;
}

const UnifiedGraphView: React.FC<UnifiedGraphViewProps> = ({ roadmap, onClose }) => {
  const [onlyKey, setOnlyKey] = useState(false);

  const visible = useMemo(
    () => roadmap.nodes.filter(n => !onlyKey || n.isBottleneck || n.globalPriorityScore >= HIGH_LEVERAGE),
    [roadmap.nodes, onlyKey],
  );

  const nodes: Node<UnifiedNode>[] = useMemo(() => visible.map(n => ({
    id: n.id,
    type: 'unified',
    position: { x: n.position.x * SPREAD_X, y: n.position.y * SPREAD_Y },
    data: n,
  })), [visible]);

  const edges: Edge[] = useMemo(() => {
    const ids = new Set(visible.map(n => n.id));
    return roadmap.edges
      .filter(e => ids.has(e.source) && ids.has(e.target))
      .map(e => ({ id: e.id, source: e.source, target: e.target, style: { stroke: '#94a3b8', strokeWidth: 2 } }));
  }, [roadmap.edges, visible]);

  return (
    <div className="fixed inset-0 bg-slate-50 z-50 flex flex-col" role="dialog" aria-modal="true" aria-label="Unified knowledge map">
      <div className="bg-white border-b border-slate-200 px-4 md:px-6 py-4 flex flex-wrap gap-3 justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900">God Mode</h1>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            {roadmap.goals.length} goals · {visible.length}/{roadmap.nodes.length} nodes
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
            <input type="checkbox" checked={onlyKey} onChange={e => setOnlyKey(e.target.checked)} className="w-4 h-4 accent-slate-900" />
            High-leverage only
          </label>
          <button onClick={onClose} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-semibold rounded-lg hover:border-slate-300 transition-colors">
            Close
          </button>
        </div>
      </div>

      <div className="flex-1 w-full bg-slate-100">
        <ReactFlow key={String(onlyKey)} nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView minZoom={0.1} maxZoom={1.5} nodesConnectable={false}>
          <Background color="#cbd5e1" gap={20} size={1} />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>

      <div className="bg-white border-t border-slate-200 p-4 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {[
          { icon: Star, tone: 'bg-amber-50 text-amber-600', title: 'High priority', text: 'Large gold nodes: learn these first.' },
          { icon: AlertCircle, tone: 'bg-red-50 text-red-600', title: 'Bottleneck', text: 'Red ring: this blocks several goals.' },
          { icon: ArrowUpRight, tone: 'bg-blue-50 text-blue-600', title: 'Shared', text: 'Blue nodes appear in more than one goal.' },
        ].map(({ icon: Icon, tone, title, text }) => (
          <div key={title} className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${tone}`}><Icon className="w-5 h-5" aria-hidden /></div>
            <div>
              <div className="text-sm font-bold text-slate-900">{title}</div>
              <div className="text-xs text-slate-500">{text}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UnifiedGraphView;
