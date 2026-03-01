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
        group min-w-[180px] rounded-lg border transition-all duration-200
        ${selected
          ? 'shadow-lg'
          : 'hover:shadow-md'
        }
      `}
      style={{
        background: 'var(--bg-primary)',
        borderColor: selected ? color : 'var(--border-default)',
        boxShadow: selected
          ? `0 0 0 2px ${color}30, var(--shadow-md)`
          : 'var(--shadow-sm)',
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2.5 !h-2.5 !-top-1.5"
        style={{
          background: 'var(--bg-tertiary)',
          border: '2px solid var(--text-tertiary)',
        }}
      />

      <div className="p-3">
        <div className="flex items-center gap-2.5">
          {/* Icon Container */}
          <div
            className="w-8 h-8 rounded-md flex items-center justify-center text-base"
            style={{
              background: `linear-gradient(135deg, ${color}12, ${color}06)`,
              border: `1px solid ${color}20`,
            }}
          >
            <span>{icon}</span>
          </div>

          {/* Labels */}
          <div className="flex flex-col">
            <div
              className="text-sm font-medium"
              style={{ color }}
            >
              {label}
            </div>
            <div className="text-xs truncate max-w-[100px]" style={{ color: 'var(--text-tertiary)' }}>
              {data.label}
            </div>
          </div>
        </div>

        {/* Status Indicator */}
        {selected && (
          <div className="mt-2 pt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="flex items-center gap-1.5">
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                已选中
              </span>
            </div>
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2.5 !h-2.5 !-bottom-1.5"
        style={{
          background: 'var(--bg-tertiary)',
          border: '2px solid var(--text-tertiary)',
        }}
      />
    </div>
  );
});

CustomNode.displayName = 'CustomNode';

export default CustomNode;
