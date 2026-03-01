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

// 提取响应数据的辅助函数，处理两种格式：
// 1. { code: 0, data: {...}, message: "success" } - 包装格式
// 2. {...} - 直接数据格式
function extractData(response: any): any {
  const data = response.data;
  // 如果有 code 和 data 字段，说明是包装格式
  if (data && data.code !== undefined && data.data !== undefined) {
    return data.data;
  }
  // 否则直接返回数据
  return data;
}

// Workflow APIs
export const workflowApi = {
  // 获取工作流列表
  list: async (): Promise<Workflow[]> => {
    const response = await api.get<any>('/workflows');
    return extractData(response);
  },

  // 获取单个工作流
  get: async (id: string): Promise<Workflow> => {
    const response = await api.get<any>(`/workflows/${id}`);
    return extractData(response);
  },

  // 创建工作流
  create: async (workflow: Partial<Workflow>): Promise<Workflow> => {
    const response = await api.post<any>('/workflows', workflow);
    return extractData(response);
  },

  // 更新工作流
  update: async (id: string, workflow: Partial<Workflow>): Promise<Workflow> => {
    const response = await api.put<any>(`/workflows/${id}`, workflow);
    return extractData(response);
  },

  // 删除工作流
  delete: async (id: string): Promise<void> => {
    await api.delete(`/workflows/${id}`);
  },

  // 验证工作流
  validate: async (id: string): Promise<{ valid: boolean; errors: string[] }> => {
    const response = await api.post<any>(`/workflows/${id}/validate`);
    return extractData(response);
  },
};

// Execution APIs
export const executionApi = {
  // 执行工作流
  run: async (workflowId: string): Promise<WorkflowExecution> => {
    const response = await api.post<any>(`/workflows/${workflowId}/run`, {});
    return extractData(response);
  },

  // 获取执行历史
  list: async (workflowId: string): Promise<WorkflowExecution[]> => {
    const response = await api.get<any>(`/workflows/${workflowId}/executions`);
    return extractData(response);
  },

  // 获取执行详情
  get: async (executionId: string): Promise<WorkflowExecution> => {
    const response = await api.get<any>(`/executions/${executionId}`);
    return extractData(response);
  },

  // 停止执行
  stop: async (executionId: string): Promise<void> => {
    await api.post(`/executions/${executionId}/stop`);
  },
};

export default api;
