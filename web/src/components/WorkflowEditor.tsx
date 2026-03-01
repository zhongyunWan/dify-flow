import { useState, useCallback, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useWorkflowStore } from '../store/workflowStore';
import { nodeTypes } from './nodes';
import Sidebar from './Sidebar';
import ConfigPanel from './ConfigPanel';
import Toolbar from './Toolbar';
import type { NodeType } from '../types';

function WorkflowEditorInner() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    selectNode,
    isDarkMode,
  } = useWorkflowStore();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(false);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow') as NodeType;

      if (!type) {
        return;
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      addNode(type, position);
    },
    [screenToFlowPosition, addNode]
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: any) => {
      selectNode(node);
      setIsConfigPanelOpen(true);
    },
    [selectNode]
  );

  const onPaneClick = useCallback(() => {
    selectNode(null);
    setIsConfigPanelOpen(false);
  }, [selectNode]);

  const nodeColor = (node: any) => {
    const colors: Record<string, string> = {
      data_node: '#10b981',
      train_node: '#3b82f6',
      compress_node: '#8b5cf6',
      inference_node: '#f59e0b',
      deploy_node: '#ef4444',
      condition_node: '#06b6d4',
    };
    return colors[node.data?.type] || '#6366f1';
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-[var(--bg-deep)]">
      <Toolbar />

      <div className="h-16" />

      <div className="h-[calc(100vh-64px)] relative">
        <Sidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />

        <div
          ref={reactFlowWrapper}
          className="h-full"
          style={{
            marginLeft: isSidebarOpen ? '260px' : '0',
            marginRight: isConfigPanelOpen ? '340px' : '0',
            transition: 'margin 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
            snapToGrid
            snapGrid={[15, 15]}
            defaultEdgeOptions={{
              style: { strokeWidth: 2 },
              animated: true,
            }}
            style={{
              backgroundColor: isDarkMode ? '#0a0a0f' : '#f8fafc',
            }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1}
              color={isDarkMode ? '#334155' : '#cbd5e1'}
            />
            <Controls
              style={{
                backgroundColor: isDarkMode ? '#12121a' : 'white',
                borderColor: isDarkMode ? '#2a2a38' : '#e2e8f0',
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
              }}
            />
            <MiniMap
              nodeColor={nodeColor}
              maskColor={isDarkMode ? 'rgba(10, 10, 15, 0.8)' : 'rgba(248, 250, 252, 0.8)'}
              style={{
                backgroundColor: isDarkMode ? '#12121a' : 'white',
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
              }}
            />
          </ReactFlow>
        </div>

        <ConfigPanel
          isOpen={isConfigPanelOpen}
          onClose={() => setIsConfigPanelOpen(false)}
        />
      </div>
    </div>
  );
}

export default function WorkflowEditor() {
  return (
    <ReactFlowProvider>
      <WorkflowEditorInner />
    </ReactFlowProvider>
  );
}
