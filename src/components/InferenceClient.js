import React, { useState } from 'react';
import { ethers } from 'ethers';
// Note: Import will work after successful package installation
// import { createZGComputeNetworkBroker } from '@0glabs/0g-serving-broker';
// import OpenAI from 'openai';

const InferenceClient = ({ provider, walletAddress, addLog }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [response, setResponse] = useState('');

  const runInference = async () => {
    setIsRunning(true);
    setResponse('');
    
    try {
      addLog("Starting inference client...");
      
      // Dynamic import to handle potential loading issues
      const { createZGComputeNetworkBroker } = await import('@0glabs/0g-serving-broker');
      const OpenAI = await import('openai');
      
      const signer = await provider.getSigner();
      addLog("Creating broker...");
      
      const broker = await createZGComputeNetworkBroker(signer);
      addLog(`Broker created. Available methods: ${Object.keys(broker).join(', ')}`);
      
      if (broker.inference) {
        addLog(`Inference methods: ${Object.keys(broker.inference).join(', ')}`);
      }
      
      // Skip ledger management for browser compatibility
      addLog("Skipping ledger check - using existing account with sufficient balance");
      
      // Get available services
      addLog("Getting available services...");
      const services = await broker.inference.listService();
      addLog(`Available services: ${services.length}`);
      
      if (services.length === 0) {
        throw new Error("No inference services available");
      }
      
      const service = services[0];
      const providerAddress = service.provider;
      addLog(`Using provider: ${providerAddress}`);
      
      // Check if provider is already acknowledged
      try {
        addLog("Checking if provider is already acknowledged...");
        const isAcknowledged = await broker.inference.userAcknowledged(providerAddress);
        addLog(`Provider acknowledgment status: ${isAcknowledged}`);
        
        if (!isAcknowledged) {
          addLog("Acknowledging provider signer...");
          await broker.inference.acknowledgeProviderSigner(providerAddress);
          addLog("Provider signer acknowledged successfully");
        } else {
          addLog("Provider already acknowledged, skipping...");
        }
      } catch (ackError) {
        addLog(`Error with provider acknowledgment: ${ackError.message}`);
        addLog("Attempting to continue despite acknowledgment error...");
      }
      
      // Get service metadata
      let endpoint, model;
      try {
        addLog("Getting service metadata...");
        const metadata = await broker.inference.getServiceMetadata(providerAddress);
        endpoint = metadata.endpoint;
        model = metadata.model;
        addLog("Service metadata retrieved successfully");
      } catch (metadataError) {
        addLog(`Error getting metadata: ${metadataError.message}`);
        throw metadataError;
      }
      
      addLog(`Service Endpoint: ${endpoint}`);
      addLog(`Model: ${model}`);
      
      // Create request
      const message = "Tell me a short joke about programming.";
      const systemPrompt = "You are a helpful assistant with a sense of humor.";
      
      const messages = [];
      if (systemPrompt) {
        messages.push({ role: "system", content: systemPrompt });
      }
      messages.push({ role: "user", content: message });
      
      addLog(`Getting headers for provider: ${providerAddress}`);
      
      // Create authentication headers manually (browser-compatible approach)
      let requestHeaders;
      try {
        addLog("Creating authentication headers manually (browser-compatible approach)...");
        
        // Get account information
        const account = await broker.inference.getAccount(providerAddress);
        addLog(`Retrieved account data`);
        
        // Parse account data (it's an array)
        const walletAddr = account[0];  // wallet address
        const nonce = account[2];       // nonce
        const fee = account[3];         // fee amount
        
        // Create timestamp and request body for hash
        const timestamp = Date.now();
        const requestBody = { messages, model };
        const requestBodyString = JSON.stringify(requestBody);
        const requestHash = ethers.keccak256(ethers.toUtf8Bytes(requestBodyString));
        
        // Create signature
        const messageToSign = `0g-inference-${providerAddress}-${walletAddr}-${timestamp}-${message}`;
        const signature = await signer.signMessage(messageToSign);
        
        // Create complete headers
        requestHeaders = {
          'Authorization': `Bearer ${walletAddr}`,
          'X-Provider': providerAddress,
          'X-Account': walletAddr,
          'X-Timestamp': timestamp.toString(),
          'X-Signature': signature,
          'Signature': signature,
          'Request-Hash': requestHash,
          'X-Request-Hash': requestHash,
          'X-Fee': fee.toString(),
          'Fee': fee.toString(),
          'Input-Fee': fee.toString(),
          'X-Input-Fee': fee.toString(),
          'Nonce': nonce.toString(),
          'X-Nonce': nonce.toString(),
          'Address': walletAddr,
          'X-Address': walletAddr,
          'X-User-Address': walletAddr,
          'User-Address': walletAddr,
          'Content-Type': 'application/json'
        };
        
        addLog("Authentication headers created successfully");
      } catch (headerError) {
        addLog(`Header creation failed: ${headerError.message}`);
        throw headerError;
      }
      
      // Create OpenAI client
      const openai = new OpenAI.default({
        baseURL: endpoint,
        apiKey: "", // Empty string as per docs
        defaultHeaders: requestHeaders,
        dangerouslyAllowBrowser: true
      });
      
      const requestParams = {
        messages,
        model
      };
      
      addLog(`Making OpenAI request...`);
      
      try {
        const completion = await openai.chat.completions.create(requestParams);
        addLog("OpenAI Response received");
        
        if (!completion || !completion.choices || !completion.choices[0]) {
          throw new Error("Invalid response format from API");
        }
        
        const aiResponse = completion.choices[0].message.content || '';
        addLog(`AI Response: ${aiResponse}`);
        
        setResponse(aiResponse);
        addLog("Inference completed successfully!");
        
      } catch (openaiError) {
        addLog(`OpenAI request failed: ${openaiError.message}`);
        
        // Try direct fetch as fallback
        addLog("Attempting direct fetch to debug connection...");
        try {
          const debugResponse = await fetch(`${endpoint}/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...requestHeaders
            },
            body: JSON.stringify(requestParams),
            mode: 'cors',
            credentials: 'omit'
          });
          
          addLog(`Direct fetch status: ${debugResponse.status}`);
          
          if (!debugResponse.ok) {
            const errorText = await debugResponse.text();
            addLog(`Direct fetch error response: ${errorText}`);
          } else {
            const data = await debugResponse.json();
            addLog("Direct fetch succeeded!");
            
            if (data.choices && data.choices[0]) {
              const aiResponse = data.choices[0].message.content || '';
              addLog(`AI Response: ${aiResponse}`);
              setResponse(aiResponse);
              addLog("Inference completed successfully!");
            }
          }
        } catch (fetchError) {
          addLog(`Direct fetch failed: ${fetchError.message}`);
          if (fetchError.message.includes('fetch') || fetchError.message.includes('CORS')) {
            addLog("❌ CORS Error Detected!");
            addLog("💡 Solutions:");
            addLog("1. Use a CORS proxy service");
            addLog("2. Run a local proxy server");
            addLog("3. Contact 0G Labs about CORS headers on their API");
          }
          throw openaiError;
        }
      }
      
    } catch (error) {
      addLog(`Error in inference: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <>
      <div className="mb-6">
        <button 
          onClick={runInference}
          disabled={isRunning}
          className="bg-green-500 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded mr-4"
        >
          {isRunning ? 'Running...' : 'Run AI Inference'}
        </button>
      </div>
      
      {response && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">AI Response:</h3>
          <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded">
            {response}
          </div>
        </div>
      )}
    </>
  );
};

export default InferenceClient;