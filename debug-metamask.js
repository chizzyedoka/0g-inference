// Simple MetaMask connection test script
// Run this in the browser console to debug MetaMask issues

console.log("=== MetaMask Debug Script ===");

// Check if window.ethereum exists
console.log("1. Checking for window.ethereum:", typeof window.ethereum !== "undefined");

if (typeof window.ethereum !== "undefined") {
  console.log("2. ethereum.isMetaMask:", window.ethereum.isMetaMask);
  console.log("3. ethereum.networkVersion:", window.ethereum.networkVersion);
  console.log("4. ethereum.selectedAddress:", window.ethereum.selectedAddress);
  
  // Test basic connection
  window.ethereum.request({ method: 'eth_accounts' })
    .then(accounts => {
      console.log("5. Existing accounts:", accounts);
      
      if (accounts.length === 0) {
        console.log("6. No accounts found, requesting permission...");
        return window.ethereum.request({ method: 'eth_requestAccounts' });
      }
      return accounts;
    })
    .then(accounts => {
      console.log("7. Final accounts:", accounts);
      console.log("✅ MetaMask connection test successful!");
    })
    .catch(error => {
      console.error("❌ MetaMask connection failed:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
    });
} else {
  console.log("❌ MetaMask not detected. Please install MetaMask extension.");
  console.log("Browser:", navigator.userAgent);
}
