import { useState } from 'react';
import type { NodeType } from '../types';
import { nodeLabels, nodeColors, nodeIcons } from '../config/nodeConfig';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

function Tooltip({ content, children }: TooltipProps) {
  const [show, setShow] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div
          className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-md text-sm whitespace-nowrap animate-fade-in z-50"
          style={{
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-default)',
            boxShadow: 'var(--shadow-md)',
            color: 'var(--text-primary)',
          }}
        >
          {content}
          <div
            className="absolute right-full top-1/2 -translate-y-1/2 w-2 h-2 rotate-45"
            style={{
              background: 'var(--bg-primary)',
              borderLeft: '1px solid var(--border-default)',
              borderBottom: '1px solid var(--border-default)',
            }}
          />
        </div>
      )}
    </div>
  );
}

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
  isFullscreen?: boolean;
}

export default function Sidebar({ isOpen, onToggle, isFullscreen = false }: SidebarProps) {
  const nodeTypes: NodeType[] = [
    'data_node',
    'train_node',
    'compress_node',
    'inference_node',
    'deploy_node',
    'condition_node',
  ];

  // Mini mode when closed - 48px width with icons only and scrollable
  if (!isOpen) {
    return (
      <div
        className="fixed left-0 z-20 flex flex-col items-center py-2 gap-1.5"
        style={{
          top: isFullscreen ? '16px' : '48px',
          background: 'var(--bg-primary)',
          borderRight: '1px solid var(--border-default)',
          borderRadius: '0 10px 10px 0',
          boxShadow: 'var(--shadow-md)',
          animation: 'slideInLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          maxHeight: isFullscreen ? 'calc(100% - 32px)' : 'calc(100vh - 64px)',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        <Tooltip content="展开节点面板 (Ctrl+B)">
          <button
            onClick={onToggle}
            className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:bg-[var(--bg-secondary)] active:scale-95 flex-shrink-0"
            style={{ color: 'var(--text-tertiary)' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          </button>
        </Tooltip>
        <div className="h-px w-6 flex-shrink-0" style={{ background: 'var(--border-default)' }} />
        <div className="flex flex-col items-center gap-1.5 w-full px-0.5">
          {nodeTypes.map((type, index) => {
            const color = nodeColors[type];
            return (
              <Tooltip key={type} content={`添加 ${nodeLabels[type]}`}>
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center cursor-grab hover:scale-110 active:scale-95 transition-all duration-200"
                  style={{
                    background: `linear-gradient(135deg, ${color}15, ${color}08)`,
                    border: `1px solid ${color}30`,
                    color: color,
                    animation: `fadeInUp 0.3s ease-out ${index * 0.05}s both`,
                  }}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/reactflow', type);
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                >
                  <span className="text-lg">{nodeIcons[type]}</span>
                </div>
              </Tooltip>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="fixed left-[240px] top-1/2 -translate-y-1/2 z-30 p-1.5 rounded-md transition-all duration-300 hover:scale-110 active:scale-95"
        style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-default)',
          boxShadow: 'var(--shadow-md)',
          animation: 'fadeIn 0.2s ease-out',
        }}
        title="收起节点面板 (Ctrl+B)"
      >
        <svg
          className="w-4 h-4 transition-transform duration-300 rotate-180"
          style={{ color: 'var(--text-tertiary)' }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Sidebar - Overlay Panel */}
      <div
        className="fixed left-0 z-20 overflow-hidden rounded-r-xl"
        style={{
          top: isFullscreen ? '16px' : '48px',
          height: isFullscreen ? 'calc(100% - 32px)' : 'calc(100vh - 64px)',
          width: '240px',
          background: 'var(--bg-primary)',
          borderRight: '1px solid var(--border-default)',
          boxShadow: 'var(--shadow-lg)',
          animation: 'slideInLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-4 border-b" style={{ borderColor: 'var(--border-default)' }}>
            <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <svg className="w-4 h-4" style={{ color: 'var(--color-primary-600)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              节点面板
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
              拖拽节点到画布
            </p>
          </div>

          {/* Node List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
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
          <div className="p-3 border-t" style={{ borderColor: 'var(--border-default)' }}>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
              提示：点击节点可查看和编辑配置，支持节点间的数据流转连接。
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
