import React from 'react';
import { ethers } from 'ethers';
import WalletConnectProvider from '@walletconnect/web3-provider';

const WalletConnect = ({ 
  isConnected, 
  setIsConnected, 
  walletAddress, 
  setWalletAddress, 
  provider, 
  setProvider, 
  addLog 
}) => {
  const connectWallet = async () => {
    try {
      // Try MetaMask first
      if (typeof window.ethereum !== "undefined") {
        const browserProvider = new ethers.BrowserProvider(window.ethereum);
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const signer = await browserProvider.getSigner();
        const address = await signer.getAddress();
        
        setProvider(browserProvider);
        setWalletAddress(address);
        setIsConnected(true);
        addLog(`Connected to MetaMask: ${address}`);
        
        const balance = await browserProvider.getBalance(address);
        addLog(`Wallet balance: ${ethers.formatEther(balance)} ETH`);
        return;
      }
      
      // Fallback to WalletConnect
      const walletConnectProvider = new WalletConnectProvider({
        infuraId: "YOUR_INFURA_ID", // Get from Infura
        rpc: {
          1: "https://mainnet.infura.io/v3/YOUR_INFURA_ID",
          // Add other networks as needed
        },
      });
      
      await walletConnectProvider.enable();
      
      const web3Provider = new ethers.BrowserProvider(walletConnectProvider);
      const signer = await web3Provider.getSigner();
      const address = await signer.getAddress();
      
      setProvider(web3Provider);
      setWalletAddress(address);
      setIsConnected(true);
      addLog(`Connected via WalletConnect: ${address}`);
      
    } catch (error) {
      addLog(`Connection failed: ${error.message}`);
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
          <button 
            onClick={connectWallet}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Connect Wallet (MetaMask/WalletConnect)
          </button>
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