"use client";

import { useWallet } from "../context/WalletContext";

export default function Home() {
  const { walletAddress, errorMessage, connectWallet, disconnectWallet } = useWallet();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-4">D-APP</h1>

      {walletAddress ? (
        <div className="text-center">
          <p className="text-green-600 mb-2">Status: Connected</p>
          <p>Connected wallet:</p>
          <p className="font-mono text-sm text-blue-600">{walletAddress}</p>
          <button
            onClick={disconnectWallet}
            className="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Disconnect Wallet
          </button>
        </div>
      ) : (
        <button
          onClick={connectWallet}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Connect Wallet
        </button>
      )}

      {errorMessage && <p className="text-red-600 mt-4">{errorMessage}</p>}
    </main>
  );
}