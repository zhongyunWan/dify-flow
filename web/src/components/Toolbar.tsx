import { useState } from 'react';
import { useWorkflowStore } from '../store/workflowStore';
import { workflowApi, executionApi } from '../services/api';

export default function Toolbar() {
  const {
    workflowName,
    setWorkflowName,
    workflowId,
    nodes,
    isDarkMode,
    toggleDarkMode,
    isExecuting,
    setExecuting,
    setExecutionStatus,
    exportWorkflow,
    importWorkflow,
  } = useWorkflowStore();

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveName, setSaveName] = useState(workflowName);

  const handleSave = async () => {
    try {
      const workflow = exportWorkflow();
      workflow.name = saveName;

      if (workflowId) {
        await workflowApi.update(workflowId, workflow);
      } else {
        await workflowApi.create(workflow);
      }
      setShowSaveModal(false);
      alert('保存成功');
    } catch (error) {
      console.error('Save failed:', error);
      alert('保存失败，请检查后端服务是否启动');
    }
  };

  const handleExport = () => {
    const workflow = exportWorkflow();
    const blob = new Blob([JSON.stringify(workflow, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workflowName}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const workflow = JSON.parse(e.target?.result as string);
            importWorkflow(workflow);
          } catch (error) {
            alert('导入失败，文件格式错误');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleRun = async () => {
    if (nodes.length === 0) {
      alert('请先添加节点');
      return;
    }

    setExecuting(true);
    setExecutionStatus('pending');

    try {
      const workflow = exportWorkflow();
      let currentId = workflowId;

      if (!currentId) {
        const created = await workflowApi.create(workflow);
        currentId = created.id;
      }

      setExecutionStatus('running');
      const execution = await executionApi.run(currentId);

      // Simulate execution status polling
      const pollExecution = async () => {
        try {
          const result = await executionApi.get(execution.id);
          if (result.status === 'completed') {
            setExecutionStatus('completed');
            setExecuting(false);
          } else if (result.status === 'failed') {
            setExecutionStatus('failed');
            setExecuting(false);
            alert(`执行失败: ${result.error}`);
          } else {
            setTimeout(pollExecution, 2000);
          }
        } catch (error) {
          console.error('Poll execution error:', error);
          setTimeout(pollExecution, 2000);
        }
      };

      pollExecution();
    } catch (error) {
      console.error('Execution failed:', error);
      setExecutionStatus('failed');
      setExecuting(false);
      alert('执行失败，请检查后端服务是否启动');
    }
  };

  const getStatusColor = () => {
    switch (useWorkflowStore.getState().executionStatus) {
      case 'completed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'running': return 'bg-blue-500 animate-pulse';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div
      className="fixed top-0 left-0 right-0 h-14 z-30 flex items-center justify-between px-4 border-b"
      style={{
        backgroundColor: 'var(--bg-primary)',
        borderColor: 'var(--border-color)',
      }}
    >
      {/* Left: Logo & Name */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">WF</span>
          </div>
          <span className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
            Dify Flow
          </span>
        </div>

        <div className="h-6 w-px" style={{ backgroundColor: 'var(--border-color)' }} />

        <input
          type="text"
          value={workflowName}
          onChange={(e) => setWorkflowName(e.target.value)}
          className="px-3 py-1 rounded-md border text-sm focus:outline-none focus:ring-2"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border-color)',
            color: 'var(--text-primary)',
          }}
        />
      </div>

      {/* Center: Status */}
      {isExecuting && (
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {useWorkflowStore.getState().executionStatus === 'running' ? '执行中...' :
             useWorkflowStore.getState().executionStatus === 'completed' ? '执行完成' :
             '等待执行'}
          </span>
        </div>
      )}

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
          title={isDarkMode ? '切换到浅色模式' : '切换到深色模式'}
        >
          {isDarkMode ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>

        {/* Import */}
        <button
          onClick={handleImport}
          className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
          }}
        >
          导入
        </button>

        {/* Export */}
        <button
          onClick={handleExport}
          className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
          }}
        >
          导出
        </button>

        {/* Save */}
        <button
          onClick={() => setShowSaveModal(true)}
          className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          style={{
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
          }}
        >
          保存
        </button>

        {/* Run */}
        <button
          onClick={handleRun}
          disabled={isExecuting}
          className={`
            px-4 py-1.5 rounded-lg text-sm font-medium transition-all
            ${isExecuting ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
          `}
          style={{
            backgroundColor: '#10b981',
            color: 'white',
          }}
        >
          {isExecuting ? '执行中...' : '执行'}
        </button>
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div
            className="w-96 p-6 rounded-lg shadow-xl"
            style={{ backgroundColor: 'var(--bg-primary)' }}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              保存工作流
            </h3>
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="工作流名称"
              className="w-full px-3 py-2 rounded-md border mb-4 focus:outline-none focus:ring-2"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
              }}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 rounded-md text-sm font-medium"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                }}
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded-md text-sm font-medium bg-blue-500 text-white hover:bg-blue-600"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
