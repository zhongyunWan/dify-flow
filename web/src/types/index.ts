// Node types
export type NodeType =
  | 'train_node'
  | 'compress_node'
  | 'inference_node'
  | 'deploy_node'
  | 'data_node'
  | 'condition_node';

// Node data interface
export interface NodeData {
  label: string;
  type: NodeType;
  config: Record<string, any>;
  [key: string]: any;
}

// Workflow definition
export interface Workflow {
  id: string;
  name: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface WorkflowNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: NodeData;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

// API types
export interface WorkflowExecution {
  execution_id: string;
  workflow_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  started_at: string;
  finished_at?: string;
  outputs?: any;
  node_executions?: any[];
}

export interface ApiResponse<T> {
  code: number;
  data: T;
  message: string;
}

// Node config form types
export interface NodeConfigField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea' | 'boolean';
  options?: string[];
  required?: boolean;
  placeholder?: string;
}
