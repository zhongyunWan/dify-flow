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
        min-w-[180px] px-4 py-3 rounded-lg border-2 transition-all duration-200
        ${selected ? 'shadow-lg scale-105' : 'shadow-md'}
      `}
      style={{
        backgroundColor: 'var(--bg-primary)',
        borderColor: selected ? color : `${color}80`,
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white"
      />

      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-md flex items-center justify-center text-lg"
          style={{ backgroundColor: `${color}20` }}
        >
          {icon}
        </div>
        <div>
          <div
            className="text-sm font-semibold"
            style={{ color }}
          >
            {label}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {data.label}
          </div>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white"
      />
    </div>
  );
});

CustomNode.displayName = 'CustomNode';

export default CustomNode;
