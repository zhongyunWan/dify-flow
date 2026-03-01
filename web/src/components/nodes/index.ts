import CustomNode from './CustomNode';

export const nodeTypes = {
  custom: CustomNode,
  data_node: CustomNode,
  train_node: CustomNode,
  compress_node: CustomNode,
  inference_node: CustomNode,
  deploy_node: CustomNode,
  condition_node: CustomNode,
};

export { CustomNode };
