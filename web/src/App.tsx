import { useEffect } from 'react';
import WorkflowEditor from './components/WorkflowEditor';
import { useWorkflowStore } from './store/workflowStore';
import './styles/theme.css';

function App() {
  const { isDarkMode } = useWorkflowStore();

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <WorkflowEditor />
    </div>
  );
}

export default App;
