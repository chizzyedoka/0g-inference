import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const WalletConnect = ({ 
  isConnected, 
  setIsConnected, 
  walletAddress, 
  setWalletAddress, 
  provider, 
  setProvider, 
  addLog 
}) => {
  const [isMetaMaskAvailable, setIsMetaMaskAvailable] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    // Check if MetaMask is available
    const checkMetaMask = () => {
      if (typeof window.ethereum !== "undefined") {
        setIsMetaMaskAvailable(true);
        addLog("MetaMask detected");
        
        // Log MetaMask version and other details for debugging
        if (window.ethereum.isMetaMask) {
          addLog("Confirmed MetaMask provider");
        } else {
          addLog("Ethereum provider detected but may not be MetaMask");
        }
      } else {
        setIsMetaMaskAvailable(false);
        addLog("MetaMask not detected - please install MetaMask extension");
      }
    };

    // Check immediately
    checkMetaMask();

    // Also check after a short delay in case MetaMask loads later
    const timer = setTimeout(checkMetaMask, 1000);

    // Listen for MetaMask installation
    const handleEthereum = () => {
      checkMetaMask();
    };

    window.addEventListener('ethereum#initialized', handleEthereum, {
      once: true,
    });

    // Cleanup
    return () => {
      clearTimeout(timer);
      window.removeEventListener('ethereum#initialized', handleEthereum);
    };
  }, [addLog]);

  const connectWallet = async () => {
    if (isConnecting) return;
    
    setIsConnecting(true);
    
    try {
      // Check if MetaMask is available
      if (typeof window.ethereum === "undefined") {
        throw new Error("MetaMask is not installed. Please install MetaMask and refresh the page.");
      }

      addLog("MetaMask detected, attempting connection...");

      // First, check if we already have permission
      let accounts = [];
      try {
        accounts = await window.ethereum.request({ 
          method: 'eth_accounts' 
        });
        addLog(`Existing accounts found: ${accounts.length}`);
      } catch (error) {
        addLog(`Error checking existing accounts: ${error.message}`);
        accounts = [];
      }

      // If no accounts, request permission
      if (accounts.length === 0) {
        addLog("No accounts found, requesting permission...");
        try {
          accounts = await window.ethereum.request({ 
            method: 'eth_requestAccounts' 
          });
          addLog(`Permission granted, accounts: ${accounts.length}`);
        } catch (error) {
          if (error.code === 4001) {
            throw new Error("User rejected the connection request");
          }
          throw new Error(`Failed to request accounts: ${error.message}`);
        }
      }

      if (accounts.length === 0) {
        throw new Error("No accounts available in MetaMask");
      }

      addLog("Creating ethers provider...");
      
      // Create provider without immediately requesting signer
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      
      // Test the provider
      try {
        const network = await browserProvider.getNetwork();
        addLog(`Connected to network: ${network.name} (${network.chainId})`);
      } catch (networkError) {
        addLog(`Warning: Could not get network info - ${networkError.message}`);
      }

      addLog("Getting signer and address...");
      const signer = await browserProvider.getSigner();
      const address = await signer.getAddress();
      
      // Update state
      setProvider(browserProvider);
      setWalletAddress(address);
      setIsConnected(true);
      addLog(`✅ Successfully connected to MetaMask: ${address}`);
      
      // Try to get balance (non-critical)
      try {
        const balance = await browserProvider.getBalance(address);
        addLog(`Wallet balance: ${ethers.formatEther(balance)} ETH`);
      } catch (balanceError) {
        addLog(`Note: Could not fetch balance - ${balanceError.message}`);
      }
      
      return;
      
    } catch (error) {
      addLog(`❌ Connection failed: ${error.message}`);
      console.error("Full error details:", error);
      
      // If MetaMask fails, don't try WalletConnect automatically
      // User can try again or we could offer WalletConnect as alternative
      
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setWalletAddress('');
    setProvider(null);
    addLog('Wallet disconnected');
  };

  if (!isConnected) {
    return (
      <div id="status" className="mb-6">
        <div className="p-4 rounded-lg border">
          {!isMetaMaskAvailable && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              <strong>❌ MetaMask Not Found</strong>
              <p className="mt-2">Please install MetaMask extension and refresh the page.</p>
              <a 
                href="https://metamask.io/download.html" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                Download MetaMask
              </a>
            </div>
          )}
          
          {isMetaMaskAvailable && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
              <strong>✅ MetaMask Detected</strong>
              <p className="mt-1">Ready to connect to your wallet.</p>
            </div>
          )}
          
          <button 
            onClick={connectWallet}
            disabled={isConnecting || !isMetaMaskAvailable}
            className={`${
              isConnecting 
                ? 'bg-gray-400 cursor-not-allowed' 
                : !isMetaMaskAvailable
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-700'
            } text-white font-bold py-2 px-4 rounded w-full`}
          >
            {isConnecting 
              ? 'Connecting...' 
              : !isMetaMaskAvailable 
              ? 'MetaMask Required'
              : 'Connect MetaMask Wallet'
            }
          </button>
          
          {!isMetaMaskAvailable && (
            <p className="mt-2 text-sm text-gray-600 text-center">
              After installing MetaMask, please refresh this page.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div id="status" className="mb-6">
      <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
        <strong>Connected:</strong> {walletAddress}
        <button 
          onClick={disconnectWallet}
          className="ml-4 bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-sm"
        >
          Disconnect
        </button>
      </div>
    </div>
  );
};

export default WalletConnect;