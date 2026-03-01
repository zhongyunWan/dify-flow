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
      case 'completed': return 'bg-emerald-500';
      case 'failed': return 'bg-red-500';
      case 'running': return 'bg-blue-500 animate-pulse';
      default: return 'bg-slate-500';
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 h-16 z-40 flex items-center justify-between px-6 glass">
      {/* Left: Logo & Name */}
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="font-semibold text-lg tracking-tight text-slate-100">
            Dify <span className="text-indigo-400">Flow</span>
          </span>
        </div>

        <div className="h-6 w-px bg-slate-700/50" />

        <input
          type="text"
          value={workflowName}
          onChange={(e) => setWorkflowName(e.target.value)}
          placeholder="未命名工作流"
          className="w-48 px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all"
        />
      </div>

      {/* Center: Status */}
      {isExecuting && (
        <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700/50 animate-fade-in">
          <div className={`w-2 h-2 rounded-full ${getStatusColor()} shadow-lg shadow-current`} />
          <span className="text-sm text-slate-400 font-medium">
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
          className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-all"
          title={isDarkMode ? '切换到浅色模式' : '切换到深色模式'}
        >
          {isDarkMode ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>

        {/* Import */}
        <button
          onClick={handleImport}
          className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 bg-slate-800/50 border border-slate-700/50 hover:bg-slate-700/50 hover:border-slate-600/50 transition-all"
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            导入
          </span>
        </button>

        {/* Export */}
        <button
          onClick={handleExport}
          className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 bg-slate-800/50 border border-slate-700/50 hover:bg-slate-700/50 hover:border-slate-600/50 transition-all"
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            导出
          </span>
        </button>

        {/* Save */}
        <button
          onClick={() => setShowSaveModal(true)}
          className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 bg-slate-800/50 border border-slate-700/50 hover:bg-slate-700/50 hover:border-slate-600/50 transition-all"
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            保存
          </span>
        </button>

        {/* Run */}
        <button
          onClick={handleRun}
          disabled={isExecuting}
          className={`
            px-5 py-2 rounded-xl text-sm font-semibold transition-all
            ${isExecuting
              ? 'opacity-50 cursor-not-allowed bg-emerald-600/50'
              : 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-400 hover:to-emerald-500 hover:shadow-lg hover:shadow-emerald-500/25 hover:-translate-y-0.5'
            }
          `}
        >
          <span className="flex items-center gap-2">
            {isExecuting ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                执行中...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                执行
              </>
            )}
          </span>
        </button>
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-[400px] p-6 rounded-2xl glass shadow-2xl animate-scale-in">
            <h3 className="text-xl font-semibold mb-5 text-slate-100">
              保存工作流
            </h3>
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="请输入工作流名称"
              className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all mb-5"
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-300 bg-slate-800/50 border border-slate-700/50 hover:bg-slate-700/50 hover:border-slate-600/50 transition-all"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-400 hover:to-purple-400 hover:shadow-lg hover:shadow-indigo-500/25 transition-all"
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
