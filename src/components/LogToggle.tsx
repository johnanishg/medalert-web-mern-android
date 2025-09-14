import React, { useState } from 'react';
import { Bug, X } from 'lucide-react';
import LogViewer from './LogViewer';
import logger from '../services/logger';

const LogToggle: React.FC = () => {
  const [isLogViewerOpen, setIsLogViewerOpen] = useState(false);

  const toggleLogViewer = () => {
    setIsLogViewerOpen(!isLogViewerOpen);
    if (!isLogViewerOpen) {
      logger.info('Log viewer opened', null, 'LogToggle');
    }
  };

  return (
    <>
      <button
        onClick={toggleLogViewer}
        className="fixed bottom-4 right-4 z-40 bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-105"
        title="View Application Logs"
      >
        <Bug size={20} />
      </button>

      <LogViewer 
        isOpen={isLogViewerOpen} 
        onClose={() => setIsLogViewerOpen(false)} 
      />
    </>
  );
};

export default LogToggle;
