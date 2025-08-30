// Simple MetaMask test component
import React, { useState } from 'react';

const MetaMaskTest = () => {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testBasicConnection = async () => {
    setLoading(true);
    setResult('Testing...');
    
    try {
      // Step 1: Check if MetaMask exists
      if (typeof window.ethereum === 'undefined') {
        setResult('❌ MetaMask not found. Please install MetaMask.');
        return;
      }
      
      setResult('✅ MetaMask found. Checking accounts...');
      
      // Step 2: Check current accounts
      const accounts = await window.ethereum.request({ 
        method: 'eth_accounts' 
      });
      
      if (accounts.length > 0) {
        setResult(`✅ Already connected to: ${accounts[0]}`);
      } else {
        setResult('📝 No accounts connected. Requesting access...');
        
        // Step 3: Request access
        const newAccounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
        
        if (newAccounts.length > 0) {
          setResult(`✅ Successfully connected to: ${newAccounts[0]}`);
        } else {
          setResult('❌ No accounts returned after request.');
        }
      }
      
    } catch (error) {
      setResult(`❌ Error: ${error.message}`);
      console.error('MetaMask test error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50 mb-4">
      <h3 className="font-bold mb-2">MetaMask Connection Test</h3>
      <button
        onClick={testBasicConnection}
        disabled={loading}
        className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded mb-2"
      >
        {loading ? 'Testing...' : 'Test MetaMask Connection'}
      </button>
      
      {result && (
        <div className="mt-2 p-2 bg-white border rounded">
          <pre className="text-sm">{result}</pre>
        </div>
      )}
    </div>
  );
};

export default MetaMaskTest;
