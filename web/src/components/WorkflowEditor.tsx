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
    return colors[node.data?.type] || '#999';
  };

  return (
    <div className="h-screen w-screen overflow-hidden">
      <Toolbar />

      <div className="h-14" />

      <div className="relative h-[calc(100vh-56px)]">
        <Sidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />

        <div
          ref={reactFlowWrapper}
          className="h-full"
          style={{
            marginLeft: isSidebarOpen ? '256px' : '0',
            marginRight: isConfigPanelOpen ? '320px' : '0',
            transition: 'margin 0.3s ease-in-out',
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
              backgroundColor: isDarkMode ? '#1a1a2e' : '#f8fafc',
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
                backgroundColor: isDarkMode ? '#1e293b' : 'white',
                borderColor: isDarkMode ? '#334155' : '#e2e8f0',
                color: isDarkMode ? 'white' : 'black',
              }}
            />
            <MiniMap
              nodeColor={nodeColor}
              maskColor={isDarkMode ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)'}
              style={{
                backgroundColor: isDarkMode ? '#1e293b' : 'white',
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
