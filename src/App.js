import React, { useState, useCallback, useEffect } from 'react';
import WalletConnect from './components/WalletConnect';
import InferenceClient from './components/InferenceClient';
import LogsDisplay from './components/LogsDisplay';
import MetaMaskTest from './components/MetaMaskTest';
import './App.css';

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [provider, setProvider] = useState(null);
  const [logs, setLogs] = useState([]);

  const addLog = useCallback((message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `${timestamp}: ${message}`]);
    console.log(message);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  useEffect(() => {
    // Log browser and MetaMask information on app start
    addLog("App initialized");
    addLog(`User Agent: ${navigator.userAgent.split(') ')[0]})`);
    
    if (typeof window.ethereum !== "undefined") {
      addLog("Ethereum object detected in window");
      addLog(`isMetaMask: ${window.ethereum.isMetaMask}`);
      addLog(`networkVersion: ${window.ethereum.networkVersion || 'unknown'}`);
    } else {
      addLog("No Ethereum object found - MetaMask may not be installed");
    }
  }, [addLog]);

  return (
    <div className="bg-gray-100 min-h-screen py-6">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
            0G Labs Inference Client
          </h1>
          
          <MetaMaskTest />
          
          <WalletConnect 
            isConnected={isConnected}
            setIsConnected={setIsConnected}
            walletAddress={walletAddress}
            setWalletAddress={setWalletAddress}
            provider={provider}
            setProvider={setProvider}
            addLog={addLog}
          />
          
          {isConnected && (
            <InferenceClient 
              provider={provider}
              walletAddress={walletAddress}
              addLog={addLog}
            />
          )}
          
          <LogsDisplay 
            logs={logs}
            clearLogs={clearLogs}
          />
        </div>
      </div>
    </div>
  );
}

export default App;