import React from "react";
import WalletConnect from "./components/WalletConnect";

function App() {
  return (
    <div className="min-h-screen bg-white text-gray-800 p-6">
      <h1 className="text-3xl font-bold mb-4">D-APP - Decentralized Document Verification</h1>
      <WalletConnect />
    </div>
  );
}

export default App;
localStorage