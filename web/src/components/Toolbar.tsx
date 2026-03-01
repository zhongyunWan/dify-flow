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
      case 'completed': return 'bg-[#17b26a]';
      case 'failed': return 'bg-[#f04438]';
      case 'running': return 'bg-[#2e90fa] animate-pulse';
      default: return 'bg-[#98a2b3]';
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 h-12 z-40 flex items-center justify-between px-4 glass" style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-default)' }}>
      {/* Left: Logo & Name */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--color-primary-600), var(--color-primary-700))', boxShadow: '0 2px 8px rgba(21, 94, 239, 0.3)' }}>
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="font-semibold text-base tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Dify <span style={{ color: 'var(--color-primary-600)' }}>Flow</span>
          </span>
        </div>

        <div className="h-5 w-px" style={{ background: 'var(--border-strong)' }} />

        <input
          type="text"
          value={workflowName}
          onChange={(e) => setWorkflowName(e.target.value)}
          placeholder="未命名工作流"
          className="w-40 px-3 py-1.5 rounded-lg text-sm transition-all"
          style={{
            background: 'var(--color-components-input-bg-normal)',
            border: '1px solid var(--border-default)',
            color: 'var(--text-primary)',
          }}
        />
      </div>

      {/* Center: Status */}
      {isExecuting && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full animate-fade-in" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-default)' }}>
          <div className={`w-2 h-2 rounded-full ${getStatusColor()} shadow-lg`} />
          <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            {useWorkflowStore.getState().executionStatus === 'running' ? '执行中...' :
             useWorkflowStore.getState().executionStatus === 'completed' ? '执行完成' :
             '等待执行'}
          </span>
        </div>
      )}

      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        {/* Theme Toggle */}
        <button
          onClick={toggleDarkMode}
          className="w-9 h-9 rounded-lg flex items-center justify-center transition-all"
          style={{ color: 'var(--text-tertiary)' }}
          title={isDarkMode ? '切换到浅色模式 (T)' : '切换到深色模式 (T)'}
        >
          {isDarkMode ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>

        {/* Import */}
        <button
          onClick={handleImport}
          className="w-9 h-9 rounded-lg flex items-center justify-center transition-all"
          style={{ color: 'var(--text-tertiary)' }}
          title="导入工作流"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
        </button>

        {/* Export */}
        <button
          onClick={handleExport}
          className="w-9 h-9 rounded-lg flex items-center justify-center transition-all"
          style={{ color: 'var(--text-tertiary)' }}
          title="导出工作流"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </button>

        {/* Save */}
        <button
          onClick={() => setShowSaveModal(true)}
          className="w-9 h-9 rounded-lg flex items-center justify-center transition-all"
          style={{ color: 'var(--text-tertiary)' }}
          title="保存工作流 (Ctrl+S)"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          </svg>
        </button>

        {/* Run */}
        <button
          onClick={handleRun}
          disabled={isExecuting}
          className="px-4 h-9 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5"
          style={{
            background: isExecuting ? 'var(--color-gray-400)' : 'var(--color-components-button-primary-bg)',
            color: 'white',
            cursor: isExecuting ? 'not-allowed' : 'pointer',
            opacity: isExecuting ? 0.5 : 1,
          }}
        >
          {isExecuting ? (
            <>
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              执行中
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              执行
            </>
          )}
        </button>
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0, 0, 0, 0.4)' }} >
          <div className="w-[400px] p-6 rounded-xl animate-scale-in" style={{ background: 'var(--bg-primary)', boxShadow: 'var(--shadow-xl)' }}>
            <h3 className="text-xl font-semibold mb-5" style={{ color: 'var(--text-primary)' }}>
              保存工作流
            </h3>
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="请输入工作流名称"
              className="w-full px-4 py-3 rounded-lg text-sm transition-all mb-5"
              style={{
                background: 'var(--color-components-input-bg-normal)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-primary)',
              }}
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-5 py-2.5 rounded-lg text-sm font-medium transition-all"
                style={{ background: 'var(--color-components-button-tertiary-bg)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all"
                style={{
                  background: 'var(--color-components-button-primary-bg)',
                  color: 'white',
                }}
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
