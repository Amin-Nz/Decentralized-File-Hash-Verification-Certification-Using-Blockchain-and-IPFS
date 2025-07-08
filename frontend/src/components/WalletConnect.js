"use client";
import React, { useState, useEffect } from "react";
import { useWallet } from "@/context/WalletContext";
import { useRouter } from "next/navigation";

const WalletConnect = () => {
  const [errorMessage, setErrorMessage] = useState("");
  const { walletAddress, setWalletAddress } = useWallet();
  const router = useRouter();

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        setWalletAddress(accounts[0]);
        localStorage.setItem("walletAddress", accounts[0]);
        
        // Clear any previous error messages
        setErrorMessage("");
        
        // Redirect to dashboard after connecting
        router.push("/dashboard");
      } catch (error) {
        setErrorMessage("User rejected the connection request.");
      }
    } else {
      setErrorMessage("MetaMask is not installed.");
    }
  };

  const disconnectWallet = async () => {
    try {
      // Clear local state and storage
      setWalletAddress(null);
      localStorage.removeItem("walletAddress");
      
      // Clear error message
      setErrorMessage("");

      // Note: MetaMask doesn't have a direct disconnect method
      // The connection will persist until user manually disconnects in MetaMask
      // or until they switch accounts/networks
      
    } catch (error) {
      console.error("Error disconnecting:", error);
    }
  };

  // Check if wallet is connected on component mount
  useEffect(() => {
    const checkWalletConnection = async () => {
      if (window.ethereum) {
        try {
          // Check if MetaMask is connected
          const accounts = await window.ethereum.request({
            method: "eth_accounts",
          });
          
          if (accounts.length > 0) {
            setWalletAddress(accounts[0]);
            localStorage.setItem("walletAddress", accounts[0]);
          } else {
            // If no accounts, clear stored address
            setWalletAddress(null);
            localStorage.removeItem("walletAddress");
          }
        } catch (error) {
          console.error("Error checking wallet connection:", error);
          setWalletAddress(null);
          localStorage.removeItem("walletAddress");
        }
      }
    };

    checkWalletConnection();
  }, [setWalletAddress]);

  // Handle account changes
  useEffect(() => {
    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        // User disconnected from MetaMask
        setWalletAddress(null);
        localStorage.removeItem("walletAddress");
      } else {
        // User switched accounts
        setWalletAddress(accounts[0]);
        localStorage.setItem("walletAddress", accounts[0]);
      }
    };

    const handleChainChanged = (chainId) => {
      // Optionally handle chain changes
      console.log("Chain changed:", chainId);
    };

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);

      return () => {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      };
    }
  }, [setWalletAddress]);

  return (
    <div className="p-4 border rounded-xl bg-gray-100 max-w-md mx-auto mt-6 text-center">
      <h2 className="text-xl font-semibold mb-4">Wallet Connection</h2>
      {walletAddress ? (
        <>
          <p className="text-green-600 mb-2">
            Connected: <span className="font-mono text-sm">{walletAddress}</span>
          </p>
          <button
            onClick={disconnectWallet}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
          >
            Disconnect
          </button>
          <p className="text-xs text-gray-600 mt-2">
            Note: To fully disconnect, please disconnect from MetaMask extension
          </p>
        </>
      ) : (
        <button
          onClick={connectWallet}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          Connect Wallet
        </button>
      )}
      {errorMessage && (
        <p className="text-red-600 mt-2 text-sm">{errorMessage}</p>
      )}
    </div>
  );
};

export default WalletConnect;