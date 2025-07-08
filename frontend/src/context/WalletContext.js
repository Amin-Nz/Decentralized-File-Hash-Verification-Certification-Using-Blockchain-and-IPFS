"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

const WalletContext = createContext();

export const useWallet = () => useContext(WalletContext);

export const WalletProvider = ({ children }) => {
  const [walletAddress, setWalletAddress] = useState(null);
  const [error, setError] = useState(null);

  const connectWallet = async () => {
    if (typeof window === "undefined") return;
    if (!window.ethereum) {
      setError("MetaMask is not installed.");
      return;
    }

    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      setWalletAddress(accounts[0]);
      localStorage.setItem("walletAddress", accounts[0]);
      setError(null); // Clear any previous errors
      
      // ✅ Add redirect after successful connection
      window.location.href = "/dashboard";
    } catch (err) {
      setError("User rejected the connection request.");
    }
  };

  const disconnectWallet = () => {
    setWalletAddress(null);
    localStorage.removeItem("walletAddress");
    setError(null);
  };

  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;

    // ✅ Check if user intentionally disconnected by checking localStorage
    const checkConnection = async () => {
      try {
        const storedAddress = localStorage.getItem("walletAddress");
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        
        if (accounts.length > 0 && storedAddress) {
          // MetaMask is connected AND user hasn't disconnected
          setWalletAddress(accounts[0]);
          localStorage.setItem("walletAddress", accounts[0]);
        } else if (accounts.length === 0) {
          // MetaMask is disconnected, clear everything
          setWalletAddress(null);
          localStorage.removeItem("walletAddress");
        } else {
          // MetaMask is connected but user disconnected from app
          setWalletAddress(null);
          // Keep localStorage empty to remember user's choice
        }
      } catch (error) {
        console.error("Error checking wallet connection:", error);
        setWalletAddress(null);
        localStorage.removeItem("walletAddress");
      }
    };

    checkConnection();

    const handleChange = (accounts) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else {
        setWalletAddress(accounts[0]);
        localStorage.setItem("walletAddress", accounts[0]);
        setError(null);
      }
    };

    window.ethereum.on("accountsChanged", handleChange);

    return () => {
      window.ethereum.removeListener("accountsChanged", handleChange);
    };
  }, []);

  return (
    <WalletContext.Provider
      value={{ walletAddress, connectWallet, disconnectWallet, error, setWalletAddress }}
    >
      {children}
    </WalletContext.Provider>
  );
};