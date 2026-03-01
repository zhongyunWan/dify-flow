import axios from 'axios';
import type { Workflow, WorkflowExecution, ApiResponse } from '../types';

const API_BASE_URL = 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Workflow APIs
export const workflowApi = {
  // 获取工作流列表
  list: async (): Promise<Workflow[]> => {
    const response = await api.get<ApiResponse<Workflow[]>>('/workflows');
    return response.data.data;
  },

  // 获取单个工作流
  get: async (id: string): Promise<Workflow> => {
    const response = await api.get<ApiResponse<Workflow>>(`/workflows/${id}`);
    return response.data.data;
  },

  // 创建工作流
  create: async (workflow: Partial<Workflow>): Promise<Workflow> => {
    const response = await api.post<ApiResponse<Workflow>>('/workflows', workflow);
    return response.data.data;
  },

  // 更新工作流
  update: async (id: string, workflow: Partial<Workflow>): Promise<Workflow> => {
    const response = await api.put<ApiResponse<Workflow>>(`/workflows/${id}`, workflow);
    return response.data.data;
  },

  // 删除工作流
  delete: async (id: string): Promise<void> => {
    await api.delete(`/workflows/${id}`);
  },

  // 验证工作流
  validate: async (id: string): Promise<{ valid: boolean; errors: string[] }> => {
    const response = await api.post<ApiResponse<{ valid: boolean; errors: string[] }>>(`/workflows/${id}/validate`);
    return response.data.data;
  },
};

// Execution APIs
export const executionApi = {
  // 执行工作流
  run: async (workflowId: string): Promise<WorkflowExecution> => {
    const response = await api.post<ApiResponse<WorkflowExecution>>(`/workflows/${workflowId}/execute`);
    return response.data.data;
  },

  // 获取执行历史
  list: async (workflowId: string): Promise<WorkflowExecution[]> => {
    const response = await api.get<ApiResponse<WorkflowExecution[]>>(`/workflows/${workflowId}/executions`);
    return response.data.data;
  },

  // 获取执行详情
  get: async (executionId: string): Promise<WorkflowExecution> => {
    const response = await api.get<ApiResponse<WorkflowExecution>>(`/executions/${executionId}`);
    return response.data.data;
  },

  // 停止执行
  stop: async (executionId: string): Promise<void> => {
    await api.post(`/executions/${executionId}/stop`);
  },
};

export default api;
