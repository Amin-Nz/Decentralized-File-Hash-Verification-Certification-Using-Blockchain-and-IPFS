import { ethers } from "ethers";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "@/lib/contractABI";

export const getContract = async () => {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask is not available");
  }

  // Check if CONTRACT_ADDRESS and CONTRACT_ABI are properly defined
  if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === "" || CONTRACT_ADDRESS === "undefined") {
    throw new Error("CONTRACT_ADDRESS is missing or invalid");
  }
  
  if (!CONTRACT_ABI || !Array.isArray(CONTRACT_ABI) || CONTRACT_ABI.length === 0) {
    throw new Error("CONTRACT_ABI is missing, invalid, or empty");
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    
    // Create contract instance
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    
    // Enhanced validation for ethers v6
    if (!contract.interface) {
      throw new Error("Contract interface not created - check ABI format");
    }

    // Test if the interface has any functions
    const fragmentCount = contract.interface.fragments.length;
    if (fragmentCount === 0) {
      throw new Error("Contract interface has no functions - ABI may be invalid");
    }

    // Log available functions for debugging
    console.log("Contract loaded successfully");
    console.log("Available functions:", contract.interface.fragments.map(f => f.name).filter(Boolean));
    console.log("Contract address:", CONTRACT_ADDRESS);
    
    return contract;
    
  } catch (error) {
    console.error("Error creating contract:", error);
    
    // Provide more specific error messages
    if (error.message.includes("invalid address")) {
      throw new Error(`Invalid contract address: ${CONTRACT_ADDRESS}`);
    }
    if (error.message.includes("invalid fragment")) {
      throw new Error("Invalid ABI format - check contract ABI structure");
    }
    if (error.message.includes("network")) {
      throw new Error("Network error - check if you're connected to the correct network");
    }
    
    throw error;
  }
};