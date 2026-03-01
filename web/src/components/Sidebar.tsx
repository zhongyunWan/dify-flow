import type { NodeType } from '../types';
import { nodeLabels, nodeColors, nodeIcons } from '../config/nodeConfig';

interface DraggableNodeProps {
  type: NodeType;
}

function DraggableNode({ type }: DraggableNodeProps) {
  const handleDragStart = (event: React.DragEvent) => {
    event.dataTransfer.setData('application/reactflow', type);
    event.dataTransfer.effectAllowed = 'move';
  };

  const color = nodeColors[type];
  const label = nodeLabels[type];
  const icon = nodeIcons[type];

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className={`
        group flex items-center gap-3 px-4 py-3.5 rounded-xl cursor-grab
        transition-all duration-300 ease-out
        hover:bg-slate-800/60 hover:scale-[1.02] hover:shadow-lg
        active:cursor-grabbing active:scale-95
      `}
      style={{
        borderLeft: `3px solid ${color}40`,
      }}
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all duration-300 group-hover:scale-110"
        style={{
          background: `linear-gradient(135deg, ${color}20, ${color}10)`,
          boxShadow: `0 0 20px ${color}20`,
        }}
      >
        <span style={{ filter: `drop-shadow(0 0 4px ${color}80)` }}>{icon}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-medium" style={{ color }}>
          {label}
        </span>
        <span className="text-xs text-slate-500">
          {type.replace('_', ' ')}
        </span>
      </div>
    </div>
  );
}

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const nodeTypes: NodeType[] = [
    'data_node',
    'train_node',
    'compress_node',
    'inference_node',
    'deploy_node',
    'condition_node',
  ];

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className={`
          fixed left-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-xl
          glass shadow-lg transition-all duration-300
          hover:scale-110 hover:shadow-xl
          ${isOpen ? 'left-[260px]' : 'left-4'}
        `}
        title={isOpen ? '隐藏节点面板' : '显示节点面板'}
      >
        <svg
          className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Sidebar */}
      <div
        className={`
          fixed left-0 top-0 h-full w-[260px] z-20
          transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{
          background: 'linear-gradient(180deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)',
          borderRight: '1px solid var(--border-default)',
        }}
      >
        {/* Header Pattern */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-500/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative p-5 pt-20">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-100 mb-1 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              节点面板
            </h2>
            <p className="text-sm text-slate-500">
              拖拽节点到画布
            </p>
          </div>

          <div className="space-y-1">
            {nodeTypes.map((type, index) => (
              <div
                key={type}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <DraggableNode type={type} />
              </div>
            ))}
          </div>

          {/* Footer Tips */}
          <div className="mt-8 p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
            <p className="text-xs text-slate-500 leading-relaxed">
              提示：点击节点可查看和编辑配置，支持节点间的数据流转连接。
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
