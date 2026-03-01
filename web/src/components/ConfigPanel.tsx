import { useState, useEffect } from 'react';
import { useWorkflowStore } from '../store/workflowStore';
import { nodeConfigFields, nodeLabels, nodeColors } from '../config/nodeConfig';
import type { NodeConfigField as NodeConfigFieldType, NodeType, NodeData } from '../types';

interface ConfigPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ConfigPanel({ isOpen, onClose }: ConfigPanelProps) {
  const { selectedNode, updateNodeData, deleteNode } = useWorkflowStore();
  const [localConfig, setLocalConfig] = useState<Record<string, any>>({});

  useEffect(() => {
    if (selectedNode) {
      const nodeData = selectedNode.data as NodeData;
      setLocalConfig(nodeData.config || {});
    }
  }, [selectedNode]);

  if (!selectedNode) return null;

  const nodeData = selectedNode.data as NodeData;
  const nodeType = nodeData.type as NodeType;
  const configFields = nodeConfigFields[nodeType];
  const label = nodeLabels[nodeType];
  const color = nodeColors[nodeType];

  const handleConfigChange = (key: string, value: any) => {
    const newConfig = { ...localConfig, [key]: value };
    setLocalConfig(newConfig);
    updateNodeData(selectedNode.id, { config: newConfig });
  };

  const handleLabelChange = (newLabel: string) => {
    updateNodeData(selectedNode.id, { label: newLabel });
  };

  const handleDelete = () => {
    deleteNode(selectedNode.id);
    onClose();
  };

  const renderField = (field: NodeConfigFieldType) => {
    switch (field.type) {
      case 'text': {
        const textValue = localConfig[field.key] as string ?? '';
        return (
          <input
            type="text"
            value={textValue}
            onChange={(e) => handleConfigChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            className="w-full px-3 py-2 rounded-md border transition-colors focus:outline-none focus:ring-2"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
          />
        );
      }

      case 'number': {
        const numValue = localConfig[field.key] as number ?? 0;
        return (
          <input
            type="number"
            value={numValue}
            onChange={(e) => handleConfigChange(field.key, parseFloat(e.target.value))}
            className="w-full px-3 py-2 rounded-md border transition-colors focus:outline-none focus:ring-2"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
          />
        );
      }

      case 'select': {
        const selectValue = localConfig[field.key] as string ?? '';
        return (
          <select
            value={selectValue}
            onChange={(e) => handleConfigChange(field.key, e.target.value)}
            className="w-full px-3 py-2 rounded-md border transition-colors focus:outline-none focus:ring-2"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="">请选择</option>
            {field.options?.map((opt: string) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );
      }

      case 'textarea': {
        const textareaValue = localConfig[field.key] as string ?? '';
        return (
          <textarea
            value={textareaValue}
            onChange={(e) => handleConfigChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            rows={3}
            className="w-full px-3 py-2 rounded-md border transition-colors focus:outline-none focus:ring-2 resize-none"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
          />
        );
      }

      case 'boolean': {
        const boolValue = localConfig[field.key] as boolean ?? false;
        return (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={boolValue}
              onChange={(e) => handleConfigChange(field.key, e.target.checked)}
              className="w-5 h-5 rounded accent-blue-500"
            />
            <span style={{ color: 'var(--text-secondary)' }}>启用</span>
          </label>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div
      className={`
        fixed right-0 top-0 h-full w-80 z-10
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}
      style={{
        backgroundColor: 'var(--bg-primary)',
        borderLeft: '1px solid var(--border-color)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 border-b"
        style={{ borderColor: 'var(--border-color)' }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: color }}
          />
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            {label}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6 overflow-y-auto h-[calc(100%-65px)]">
        {/* Node Name */}
        <div>
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: 'var(--text-secondary)' }}
          >
            节点名称
          </label>
          <input
            type="text"
            value={nodeData.label}
            onChange={(e) => handleLabelChange(e.target.value)}
            className="w-full px-3 py-2 rounded-md border transition-colors focus:outline-none focus:ring-2"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        {/* Node ID */}
        <div>
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: 'var(--text-secondary)' }}
          >
            节点ID
          </label>
          <div
            className="px-3 py-2 rounded-md text-sm font-mono"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-secondary)',
            }}
          >
            {selectedNode.id}
          </div>
        </div>

        {/* Config Fields */}
        <div className="space-y-4">
          <h3
            className="text-sm font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            配置项
          </h3>
          {configFields.map((field) => (
            <div key={field.key}>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--text-secondary)' }}
              >
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              {renderField(field)}
            </div>
          ))}
        </div>

        {/* Delete Button */}
        <button
          onClick={handleDelete}
          className="w-full py-2 px-4 rounded-md bg-red-500 text-white font-medium
            hover:bg-red-600 transition-colors"
        >
          删除节点
        </button>
      </div>
    </div>
  );
}
