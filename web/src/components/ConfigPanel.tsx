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
            className="w-full px-4 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all"
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
            className="w-full px-4 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
        );
      }

      case 'select': {
        const selectValue = localConfig[field.key] as string ?? '';
        return (
          <select
            value={selectValue}
            onChange={(e) => handleConfigChange(field.key, e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all appearance-none cursor-pointer"
          >
            <option value="" className="bg-slate-800">请选择</option>
            {field.options?.map((opt: string) => (
              <option key={opt} value={opt} className="bg-slate-800">
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
            className="w-full px-4 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
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
                className={`
                  w-11 h-6 rounded-full transition-all duration-300
                  ${boolValue ? 'bg-indigo-500' : 'bg-slate-700'}
                `}
              >
                <div
                  className={`
                    absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-md
                    transition-transform duration-300
                    ${boolValue ? 'translate-x-5' : 'translate-x-0'}
                  `}
                />
              </div>
            </div>
            <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
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
        fixed right-0 top-0 h-full w-[340px] z-20
        transition-transform duration-300 ease-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}
      style={{
        background: 'linear-gradient(180deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)',
        borderLeft: '1px solid var(--border-default)',
      }}
    >
      {/* Header Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div
        className="relative flex items-center justify-between p-5 border-b"
        style={{ borderColor: 'var(--border-default)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${color}30, ${color}10)`,
              boxShadow: `0 0 20px ${color}30`,
            }}
          >
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-100">
              {label}
            </h2>
            <p className="text-xs text-slate-500">
              节点配置
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="relative p-5 space-y-6 overflow-y-auto h-[calc(100%-80px)]">
        {/* Node Name */}
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2.5">
            节点名称
          </label>
          <input
            type="text"
            value={nodeData.label}
            onChange={(e) => handleLabelChange(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
        </div>

        {/* Node ID */}
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2.5">
            节点ID
          </label>
          <div className="px-4 py-2.5 rounded-xl bg-slate-800/30 border border-slate-700/30 text-xs font-mono text-slate-500 truncate">
            {selectedNode.id}
          </div>
        </div>

        {/* Config Fields */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            配置项
          </h3>
          {configFields.map((field, index) => (
            <div
              key={field.key}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <label className="block text-sm font-medium text-slate-400 mb-2">
                {field.label}
                {field.required && <span className="text-red-400 ml-1">*</span>}
              </label>
              {renderField(field)}
            </div>
          ))}
        </div>

        {/* Delete Button */}
        <div className="pt-4 border-t" style={{ borderColor: 'var(--border-default)' }}>
          <button
            onClick={handleDelete}
            className="w-full py-3 px-4 rounded-xl bg-red-500/10 text-red-400 font-medium
              hover:bg-red-500/20 border border-red-500/20
              hover:border-red-500/40 transition-all flex items-center justify-center gap-2"
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
