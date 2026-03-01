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
            className="w-full px-3 py-2 rounded-md text-sm transition-all"
            style={{
              background: 'var(--color-components-input-bg-normal)',
              border: '1px solid var(--border-default)',
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
            className="w-full px-3 py-2 rounded-md text-sm transition-all"
            style={{
              background: 'var(--color-components-input-bg-normal)',
              border: '1px solid var(--border-default)',
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
            className="w-full px-3 py-2 rounded-md text-sm transition-all appearance-none cursor-pointer"
            style={{
              background: 'var(--color-components-input-bg-normal)',
              border: '1px solid var(--border-default)',
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
            className="w-full px-3 py-2 rounded-md text-sm transition-all resize-none"
            style={{
              background: 'var(--color-components-input-bg-normal)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-primary)',
            }}
          />
        );
      }

      case 'boolean': {
        const boolValue = localConfig[field.key] as boolean ?? false;
        return (
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                checked={boolValue}
                onChange={(e) => handleConfigChange(field.key, e.target.checked)}
                className="sr-only"
              />
              <div
                className="w-9 h-5 rounded-full transition-all duration-200"
                style={{
                  background: boolValue ? 'var(--color-primary-600)' : 'var(--color-gray-300)',
                }}
              >
                <div
                  className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200"
                  style={{
                    transform: boolValue ? 'translateX(16px)' : 'translateX(0)',
                  }}
                />
              </div>
            </div>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              启用
            </span>
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
        fixed right-0 top-0 h-full w-[320px] z-20
        transition-transform duration-200 ease-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}
      style={{
        background: 'var(--bg-primary)',
        borderLeft: '1px solid var(--border-default)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 border-b"
        style={{ borderColor: 'var(--border-default)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-md flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${color}15, ${color}08)`,
              border: `1px solid ${color}20`,
            }}
          >
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
          </div>
          <div>
            <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
              {label}
            </h2>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              节点配置
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-md transition-all"
          style={{ color: 'var(--text-tertiary)' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4 overflow-y-auto h-[calc(100%-64px)]">
        {/* Node Name */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            节点名称
          </label>
          <input
            type="text"
            value={nodeData.label}
            onChange={(e) => handleLabelChange(e.target.value)}
            className="w-full px-3 py-2 rounded-md text-sm transition-all"
            style={{
              background: 'var(--color-components-input-bg-normal)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        {/* Node ID */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            节点ID
          </label>
          <div className="px-3 py-2 rounded-md text-xs font-mono truncate" style={{ background: 'var(--bg-secondary)', color: 'var(--text-tertiary)' }}>
            {selectedNode.id}
          </div>
        </div>

        {/* Config Fields */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <svg className="w-4 h-4" style={{ color: 'var(--color-primary-600)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            配置项
          </h3>
          {configFields.map((field, index) => (
            <div
              key={field.key}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <label className="block text-sm mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                {field.label}
                {field.required && <span style={{ color: 'var(--color-text-destructive)' }}> *</span>}
              </label>
              {renderField(field)}
            </div>
          ))}
        </div>

        {/* Delete Button */}
        <div className="pt-4 border-t" style={{ borderColor: 'var(--border-default)' }}>
          <button
            onClick={handleDelete}
            className="w-full py-2.5 px-4 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2"
            style={{
              background: 'var(--color-error-bg)',
              color: 'var(--color-text-destructive)',
              border: '1px solid var(--color-text-destructive)',
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            删除节点
          </button>
        </div>
      </div>
    </div>
  );
}
