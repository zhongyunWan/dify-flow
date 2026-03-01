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
        group flex items-center gap-3 px-4 py-3 rounded-lg cursor-grab
        transition-all duration-200 ease-out
        hover:bg-[var(--color-gray-100)] active:cursor-grabbing active:scale-[0.98]
      `}
    >
      <div
        className="w-9 h-9 rounded-md flex items-center justify-center text-lg transition-all duration-200"
        style={{
          background: `linear-gradient(135deg, ${color}15, ${color}08)`,
          border: `1px solid ${color}20`,
        }}
      >
        <span>{icon}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-medium" style={{ color }}>
          {label}
        </span>
        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
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
          fixed left-4 top-1/2 -translate-y-1/2 z-30 p-2 rounded-md
          transition-all duration-200
          ${isOpen ? 'left-[260px]' : 'left-4'}
        `}
        style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-default)',
          boxShadow: 'var(--shadow-sm)',
        }}
        title={isOpen ? '隐藏节点面板' : '显示节点面板'}
      >
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          style={{ color: 'var(--text-tertiary)' }}
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
          transition-transform duration-200 ease-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{
          background: 'var(--bg-primary)',
          borderRight: '1px solid var(--border-default)',
        }}
      >
        <div className="relative p-5 pt-16">
          <div className="mb-6">
            <h2 className="text-base font-semibold mb-1 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <svg className="w-5 h-5" style={{ color: 'var(--color-primary-600)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              节点面板
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
              拖拽节点到画布
            </p>
          </div>

          <div className="space-y-0.5">
            {nodeTypes.map((type, index) => (
              <div
                key={type}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <DraggableNode type={type} />
              </div>
            ))}
          </div>

          {/* Footer Tips */}
          <div className="mt-8 p-3 rounded-lg" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
              提示：点击节点可查看和编辑配置，支持节点间的数据流转连接。
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
