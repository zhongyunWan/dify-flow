import type { NodeType, NodeConfigField } from '../types';

export const nodeConfigFields: Record<NodeType, NodeConfigField[]> = {
  data_node: [
    { key: 'data_source', label: '数据源', type: 'select', options: ['local', 's3', 'database'], required: true },
    { key: 'file_path', label: '文件路径', type: 'text', placeholder: '/path/to/data' },
    { key: 'format', label: '数据格式', type: 'select', options: ['json', 'csv', 'parquet'] },
  ],
  train_node: [
    { key: 'model_name', label: '模型名称', type: 'text', required: true, placeholder: 'llama-7b' },
    { key: 'epochs', label: '训练轮数', type: 'number', required: true },
    { key: 'batch_size', label: '批次大小', type: 'number' },
    { key: 'learning_rate', label: '学习率', type: 'number' },
    { key: 'gpu_count', label: 'GPU数量', type: 'number' },
  ],
  compress_node: [
    { key: 'method', label: '压缩方法', type: 'select', options: ['quantization', 'pruning', 'distillation'] },
    { key: 'compression_ratio', label: '压缩比例', type: 'number' },
    { key: 'output_path', label: '输出路径', type: 'text' },
  ],
  inference_node: [
    { key: 'model_path', label: '模型路径', type: 'text', required: true },
    { key: 'max_tokens', label: '最大Token数', type: 'number' },
    { key: 'temperature', label: 'Temperature', type: 'number' },
    { key: 'top_p', label: 'Top P', type: 'number' },
  ],
  deploy_node: [
    { key: 'deployment_name', label: '部署名称', type: 'text', required: true },
    { key: 'endpoint', label: '端点', type: 'text', required: true },
    { key: 'replicas', label: '副本数', type: 'number' },
    { key: 'auto_scale', label: '自动扩缩容', type: 'boolean' },
  ],
  condition_node: [
    { key: 'condition_type', label: '条件类型', type: 'select', options: ['if', 'switch'] },
    { key: 'conditions', label: '条件表达式', type: 'textarea', placeholder: 'output > 0.5' },
  ],
};

export const nodeLabels: Record<NodeType, string> = {
  data_node: '数据节点',
  train_node: '训练节点',
  compress_node: '压缩节点',
  inference_node: '推理节点',
  deploy_node: '部署节点',
  condition_node: '条件节点',
};

export const nodeColors: Record<NodeType, string> = {
  data_node: '#17b26a',    /* Green */
  train_node: '#2e90fa',   /* Blue */
  compress_node: '#6172f3', /* Indigo */
  inference_node: '#f79009', /* Orange */
  deploy_node: '#f04438',   /* Red */
  condition_node: '#7839ee', /* Violet */
};

export const nodeIcons: Record<NodeType, string> = {
  data_node: '📊',
  train_node: '🎯',
  compress_node: '📦',
  inference_node: '🔮',
  deploy_node: '🚀',
  condition_node: '🔀',
};
