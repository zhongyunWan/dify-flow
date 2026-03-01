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
        flex items-center gap-3 px-4 py-3 rounded-lg cursor-grab
        transition-all duration-200 hover:scale-102 hover:shadow-lg
      `}
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderLeft: `3px solid ${color}`,
      }}
    >
      <div
        className="w-8 h-8 rounded-md flex items-center justify-center text-lg"
        style={{ backgroundColor: `${color}20` }}
      >
        {icon}
      </div>
      <span className="text-sm font-medium" style={{ color }}>
        {label}
      </span>
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
        className="fixed left-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-lg shadow-lg transition-all duration-200 hover:scale-110"
        style={{
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
        }}
        title={isOpen ? '隐藏节点面板' : '显示节点面板'}
      >
        <svg
          className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Sidebar */}
      <div
        className={`
          fixed left-0 top-0 h-full w-64 z-10
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{
          backgroundColor: 'var(--bg-primary)',
          borderRight: '1px solid var(--border-color)',
        }}
      >
        <div className="p-4 pt-16">
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            节点面板
          </h2>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            拖拽节点到画布
          </p>

          <div className="space-y-2">
            {nodeTypes.map((type) => (
              <DraggableNode key={type} type={type} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
