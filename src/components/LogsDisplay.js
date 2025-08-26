import React from 'react';

const LogsDisplay = ({ logs, clearLogs }) => {
  if (logs.length === 0) return null;

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold">Logs:</h3>
        <button 
          onClick={clearLogs}
          className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-1 px-3 rounded text-sm"
        >
          Clear Logs
        </button>
      </div>
      <div className="bg-gray-50 border border-gray-300 rounded p-4 h-64 overflow-y-auto font-mono text-sm">
        {logs.map((log, index) => (
          <div key={index}>{log}</div>
        ))}
      </div>
    </div>
  );
};

export default LogsDisplay;