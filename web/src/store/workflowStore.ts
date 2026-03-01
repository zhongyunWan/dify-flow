import { create } from 'zustand';
import type { Node, Edge, OnNodesChange, OnEdgesChange, OnConnect } from '@xyflow/react';
import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';
import type { NodeType, NodeData, Workflow } from '../types';

interface WorkflowState {
  // Workflow data
  workflow: Workflow | null;
  workflowId: string | null;
  workflowName: string;

  // React Flow state
  nodes: Node[];
  edges: Edge[];

  // UI state
  selectedNode: Node | null;
  isConfigPanelOpen: boolean;
  isDarkMode: boolean;
  isExecuting: boolean;
  executionStatus: string | null;

  // Actions
  setWorkflow: (workflow: Workflow) => void;
  setWorkflowName: (name: string) => void;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;

  // Node changes
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;

  // Node operations
  addNode: (type: NodeType, position: { x: number; y: number }) => void;
  updateNodeData: (nodeId: string, data: Partial<NodeData>) => void;
  deleteNode: (nodeId: string) => void;

  // Selection
  selectNode: (node: Node | null) => void;
  toggleConfigPanel: () => void;

  // Theme
  toggleDarkMode: () => void;

  // Execution
  setExecuting: (isExecuting: boolean) => void;
  setExecutionStatus: (status: string | null) => void;

  // Import/Export
  exportWorkflow: () => Workflow;
  importWorkflow: (workflow: Workflow) => void;
}

const generateNodeId = (type: NodeType) => {
  return `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const getDefaultNodeData = (type: NodeType): NodeData => {
  const defaults: Record<NodeType, Record<string, any>> = {
    data_node: { data_source: 'local', format: 'json' },
    train_node: { epochs: 10, batch_size: 32, learning_rate: 0.001, gpu_count: 1 },
    compress_node: { method: 'quantization', compression_ratio: 0.5 },
    inference_node: { max_tokens: 2048, temperature: 0.7, top_p: 0.9 },
    deploy_node: { replicas: 1, auto_scale: false },
    condition_node: { condition_type: 'if' },
  };

  return {
    label: type.replace('_node', ''),
    type,
    config: defaults[type] || {},
  };
};

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  workflow: null,
  workflowId: null,
  workflowName: '未命名工作流',
  nodes: [],
  edges: [],
  selectedNode: null,
  isConfigPanelOpen: false,
  isDarkMode: false,
  isExecuting: false,
  executionStatus: null,

  setWorkflow: (workflow) => set({
    workflow,
    workflowId: workflow.id,
    workflowName: workflow.name,
    nodes: workflow.nodes.map(n => ({
      id: n.id,
      type: n.type,
      position: n.position,
      data: n.data,
    })),
    edges: workflow.edges.map(e => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle,
    })),
  }),

  setWorkflowName: (name) => set({ workflowName: name }),

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },

  onConnect: (connection) => {
    set({
      edges: addEdge({ ...connection, id: `edge_${Date.now()}` }, get().edges),
    });
  },

  addNode: (type, position) => {
    const newNode: Node = {
      id: generateNodeId(type),
      type: type,
      position,
      data: getDefaultNodeData(type),
    };
    set({ nodes: [...get().nodes, newNode] });
  },

  updateNodeData: (nodeId, data) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...data } }
          : node
      ),
    });
  },

  deleteNode: (nodeId) => {
    set({
      nodes: get().nodes.filter((node) => node.id !== nodeId),
      edges: get().edges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId
      ),
      selectedNode: null,
      isConfigPanelOpen: false,
    });
  },

  selectNode: (node) => {
    set({ selectedNode: node, isConfigPanelOpen: !!node });
  },

  toggleConfigPanel: () => set({ isConfigPanelOpen: !get().isConfigPanelOpen }),

  toggleDarkMode: () => set({ isDarkMode: !get().isDarkMode }),

  setExecuting: (isExecuting) => set({ isExecuting }),
  setExecutionStatus: (status) => set({ executionStatus: status }),

  exportWorkflow: () => {
    const { workflowId, workflowName, nodes, edges } = get();
    return {
      id: workflowId || `workflow_${Date.now()}`,
      name: workflowName,
      description: '',
      graph: {
        nodes: nodes.map(n => ({
          id: n.id,
          type: n.type as NodeType,
          position: n.position,
          data: n.data as NodeData,
        })),
        edges: edges.map(e => ({
          id: e.id,
          source: e.source,
          target: e.target,
          sourceHandle: e.sourceHandle || undefined,
          targetHandle: e.targetHandle || undefined,
        })),
      },
    };
  },

  importWorkflow: (workflow) => {
    get().setWorkflow(workflow);
  },
}));
