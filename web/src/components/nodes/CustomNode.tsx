import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { NodeData } from '../../types';
import { nodeColors, nodeLabels, nodeIcons } from '../../config/nodeConfig';

interface CustomNodeProps extends NodeProps {
  data: NodeData;
}

const CustomNode = memo(({ data, selected }: CustomNodeProps) => {
  const color = nodeColors[data.type];
  const label = nodeLabels[data.type];
  const icon = nodeIcons[data.type];

  return (
    <div
      className={`
        group min-w-[200px] rounded-xl border-2 transition-all duration-300
        ${selected
          ? 'shadow-2xl scale-105'
          : 'shadow-lg hover:shadow-xl hover:scale-[1.02]'
        }
      `}
      style={{
        background: 'linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)',
        borderColor: selected ? color : `${color}40`,
        boxShadow: selected
          ? `0 0 30px ${color}40, 0 8px 32px rgba(0, 0, 0, 0.4)`
          : `0 4px 20px rgba(0, 0, 0, 0.3)`,
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-slate-600 !border-2 !border-slate-400 !-top-1.5 transition-all duration-200"
        style={{
          background: 'var(--bg-tertiary)',
          borderColor: 'var(--text-secondary)',
        }}
      />

      <div className="p-4">
        <div className="flex items-center gap-3">
          {/* Icon Container */}
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all duration-300 group-hover:scale-110"
            style={{
              background: `linear-gradient(135deg, ${color}25, ${color}10)`,
              boxShadow: `0 0 20px ${color}30, inset 0 0 10px ${color}10`,
            }}
          >
            <span style={{ filter: `drop-shadow(0 0 6px ${color}80)` }}>{icon}</span>
          </div>

          {/* Labels */}
          <div className="flex flex-col">
            <div
              className="text-sm font-semibold tracking-wide"
              style={{ color }}
            >
              {label}
            </div>
            <div className="text-xs text-slate-500 truncate max-w-[120px]">
              {data.label}
            </div>
          </div>
        </div>

        {/* Status Indicator */}
        {selected && (
          <div className="mt-3 pt-3 border-t border-slate-700/50">
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full animate-pulse"
                style={{
                  backgroundColor: color,
                  boxShadow: `0 0 8px ${color}`,
                }}
              />
              <span className="text-xs text-slate-500">
                已选中
              </span>
            </div>
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-slate-600 !border-2 !border-slate-400 !-bottom-1.5 transition-all duration-200"
        style={{
          background: 'var(--bg-tertiary)',
          borderColor: 'var(--text-secondary)',
        }}
      />
    </div>
  );
});

CustomNode.displayName = 'CustomNode';

export default CustomNode;
