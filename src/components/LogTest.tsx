import React from 'react';
import logger from '../services/logger';

const LogTest: React.FC = () => {
  const testLogs = () => {
    // Test different importance levels
    logger.info('Low importance info message', { timestamp: new Date() }, 'LogTest', 'low');
    logger.info('Medium importance info message', { timestamp: new Date() }, 'LogTest', 'medium');
    logger.info('High importance info message', { timestamp: new Date() }, 'LogTest', 'high');
    logger.info('Critical importance info message', { timestamp: new Date() }, 'LogTest', 'critical');
    
    logger.success('Operation completed successfully!', { userId: '123' }, 'LogTest', 'high');
    logger.warning('This is a warning message', { code: 'WARN_001' }, 'LogTest', 'high');
    logger.error('This is an error message', { error: 'Something went wrong' }, 'LogTest', 'critical');
    logger.debug('Debug information', { data: { key: 'value' } }, 'LogTest', 'low');
    
    // Test API logging (these will be low importance by default)
    logger.apiCall('GET', '/api/users', { page: 1 });
    logger.apiResponse('GET', '/api/users', 200, { users: [] });
    logger.apiResponse('GET', '/api/users', 404, { error: 'Not found' }); // This will be critical
    
    // Test user action logging
    logger.userAction('clicked test button', { component: 'LogTest' });
    
    // Test system event logging
    logger.systemEvent('application started', { version: '1.0.0' });
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Log Test Component</h2>
      <button
        onClick={testLogs}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Test All Log Types
      </button>
      <p className="mt-2 text-sm text-gray-600">
        Click the button to generate test logs with different importance levels. 
        <br />
        <strong>Important logs only</strong> will show: High/Critical importance, Success, Warning, and Error messages.
        <br />
        Check the bug icon in the bottom right to view logs and toggle between "Important Only" and "All Logs".
      </p>
    </div>
  );
};

export default LogTest;
