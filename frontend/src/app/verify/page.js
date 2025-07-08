"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import QRCode from "react-qr-code";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "@/lib/contractABI";
import { ethers } from "ethers";
import { generateCertificate } from "@/utils/pdfGenerator";

export default function VerifyPage() {
  const router = useRouter();
  const [fileInfo, setFileInfo] = useState(null);
  const [hashes, setHashes] = useState({});
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [blockchainInfo, setBlockchainInfo] = useState(null);
  const [checkingChain, setCheckingChain] = useState(false);
  const [manualHash, setManualHash] = useState("");
  const [txHashInput, setTxHashInput] = useState("");

  // Hash computation
  const computeHash = async (algorithm, arrayBuffer) => {
    const hashBuffer = await window.crypto.subtle.digest(algorithm, arrayBuffer);
    const hashArray = new Uint8Array(hashBuffer);
    return Array.from(hashArray).map((b) => b.toString(16).padStart(2, "0")).join("");
  };

  // File handler
  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileInfo(null);
    setHashes({});
    setMatch(null);
    setBlockchainInfo(null);
    setError(null);
    setLoading(true);

    try {
      const arrayBuffer = await file.arrayBuffer();

      const [sha256, sha1, sha512] = await Promise.all([
        computeHash("SHA-256", arrayBuffer),
        computeHash("SHA-1", arrayBuffer),
        computeHash("SHA-512", arrayBuffer),
      ]);

      const hashSet = { sha256, sha1, sha512 };
      setHashes(hashSet);

      setFileInfo({
        name: file.name,
        size: file.size,
        type: file.type,
        modified: new Date(file.lastModified).toLocaleString(),
      });

      // Check in Supabase first
      const { data, error } = await supabase
        .from("file_hashes")
        .select("*")
        .or(`sha256.eq.${sha256},sha1.eq.${sha1},sha512.eq.${sha512}`);

      if (error) throw error;
      if (data.length > 0) {
        setMatch(data[0]);
      }

      // Also check on blockchain
      checkOnBlockchain(sha256);
    } catch (err) {
      setError("Verification failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Manual hash search handler
  const handleManualHashSearch = async () => {
    if (!manualHash.trim()) {
      setError("Please enter a SHA-256 hash to search.");
      return;
    }

    setLoading(true);
    setError(null);
    setMatch(null);
    setFileInfo(null);
    setHashes({});
    setBlockchainInfo(null);

    try {
      const { data, error } = await supabase
        .from("file_hashes")
        .select("*")
        .eq("sha256", manualHash.trim());

      if (error) throw error;
      if (data.length > 0) {
        setMatch(data[0]);
        setHashes({ sha256: manualHash.trim() });
        checkOnBlockchain(manualHash.trim());
      } else {
        setError("No record found for this hash in our database.");
        setHashes({ sha256: manualHash.trim() }); // Still show the hash for clarity
        checkOnBlockchain(manualHash.trim()); // Still check blockchain even if not in DB
      }
    } catch (err) {
      setError("Verification failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Blockchain check
  const checkOnBlockchain = async (sha256) => {
    if (!window.ethereum || !ethers) {
      console.warn("MetaMask or Ethers.js not detected. Skipping blockchain check.");
      return;
    }

    try {
      setCheckingChain(true);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner(); // Get signer to interact with contract
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      const fileData = await contract.getFileInfo(sha256);

      // Check if the uploader address is not the zero address (meaning a record exists)
      if (fileData && fileData.uploader !== ethers.ZeroAddress) {
        setBlockchainInfo({
          uploader: fileData.uploader,
          fileName: fileData.fileName,
          tag: fileData.tag,
          timestamp: new Date(Number(fileData.timestamp) * 1000).toLocaleString(),
        });
      } else {
        console.log("No blockchain record found for this hash.");
      }
    } catch (err) {
      console.error("Blockchain check error:", err);
      // Only set error if it's not just "no record found"
      if (!err.message.includes("could not resolve ENS name") && !err.message.includes("invalid hash")) {
        setError("Error checking blockchain: " + err.message);
      }
    } finally {
      setCheckingChain(false);
    }
  };

  // Download Certificate Handler
  const handleDownloadCertificate = async () => {
    if (!match && (!fileInfo || Object.keys(hashes).length === 0)) {
      alert("Missing data to generate certificate. Please verify a file or hash first.");
      return;
    }

    // Prioritize 'match' data, then 'fileInfo' and 'hashes'
    const dataForCert = {
      fileInfo: fileInfo || {
        name: match?.file_name || "N/A",
        size: match?.file_size || "N/A",
        type: match?.file_type || "N/A",
        modified: match?.created_at ? new Date(match.created_at).toLocaleString() : "N/A"
      },
      hashes: hashes.sha256 ? hashes : { sha256: match?.sha256 || manualHash || "N/A" },
      ipfsCID: match?.ipfs_cid || "N/A",
      txHash: match?.blockchain_tx || blockchainInfo?.txHash || "N/A", // assuming blockchainInfo might have a txHash
      walletAddress: match?.user_wallet || blockchainInfo?.uploader || "N/A",
      contractAddress: CONTRACT_ADDRESS,
      tags: match?.tags || blockchainInfo?.tag || "N/A",
      notes: match?.notes || "N/A",
      blockchainTimestamp: blockchainInfo?.timestamp || "N/A",
    };

    try {
      await generateCertificate(dataForCert);
    } catch (err) {
      console.error("Error generating certificate:", err);
      alert("Failed to generate certificate. Please try again.");
    }
  };

  // Transaction hash search handler
  const handleTxHashGo = () => {
    if (txHashInput.trim() && txHashInput.trim().startsWith("0x")) {
      router.push(`/tx/${txHashInput.trim()}`);
    } else {
      setError("Please enter a valid Ethereum transaction hash (starting with 0x).");
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto bg-gray-50 min-h-screen">
      <h1 className="text-4xl font-extrabold mb-8 text-center text-gray-900">
        Verify Document Authenticity
      </h1>

      {/* Input Sections */}
      <div className="bg-white shadow-lg rounded-xl p-8 mb-8 border border-gray-200">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Choose Your Verification Method</h2>

        {/* File upload */}
        <div className="mb-6 pb-6 border-b border-gray-200">
          <label htmlFor="file-upload" className="block text-lg font-semibold text-gray-700 mb-3">
            1. Upload a File
          </label>
          <input
            id="file-upload"
            type="file"
            onChange={handleFile}
            className="block w-full text-base text-gray-700
                       file:mr-4 file:py-2 file:px-5
                       file:rounded-full file:border-0
                       file:text-base file:font-medium
                       file:bg-indigo-50 file:text-indigo-700
                       hover:file:bg-indigo-100 cursor-pointer transition duration-200 ease-in-out"
          />
          <p className="text-sm text-gray-500 mt-2">
            Upload any document to compute its unique cryptographic hashes (SHA-256, SHA-1, SHA-512) and check against registered records.
          </p>
        </div>

        {/* Manual hash search */}
        <div className="mb-6 pb-6 border-b border-gray-200">
          <label htmlFor="manual-hash-search" className="block text-lg font-semibold text-gray-700 mb-3">
            2. Search by SHA-256 Hash
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              id="manual-hash-search"
              type="text"
              placeholder="Enter a SHA-256 hash (e.g., 0xabc123...)"
              value={manualHash}
              onChange={(e) => setManualHash(e.target.value)}
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 shadow-sm text-base transition duration-150 ease-in-out"
            />
            <button
              onClick={handleManualHashSearch}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150 ease-in-out font-medium text-base"
            >
              Search Hash
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Directly enter a SHA-256 hash to find associated records in our database and on the blockchain.
          </p>
        </div>

        {/* Transaction hash search */}
        <div>
          <label htmlFor="tx-hash-input" className="block text-lg font-semibold text-gray-700 mb-3">
            3. Explore by Blockchain Transaction Hash
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              id="tx-hash-input"
              type="text"
              placeholder="Paste an Ethereum transaction hash (e.g., 0x...)"
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 shadow-sm text-base transition duration-150 ease-in-out"
              value={txHashInput}
              onChange={e => setTxHashInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  handleTxHashGo();
                }
              }}
            />
            <button
              onClick={handleTxHashGo}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition duration-150 ease-in-out font-medium text-base"
            >
              Go to Transaction
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            If you have a transaction hash, you can directly navigate to its dedicated verification page.
          </p>
        </div>
      </div>

      {/* Loading & Error States */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          <p className="mt-3 text-lg text-gray-600">Processing and verifying...</p>
        </div>
      )}
      {checkingChain && (
        <div className="text-center py-4 text-blue-700">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400 mr-2"></div>
          <p className="mt-1 text-base">Checking blockchain for records...</p>
        </div>
      )}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg relative mb-6" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline ml-2">{error}</span>
        </div>
      )}

      {/* Results Display */}
      {!loading && !error && (
        <>
          {fileInfo && Object.keys(hashes).length > 0 && (
            <div className="mt-8 bg-white shadow-lg rounded-xl p-6 border border-gray-200">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Uploaded File Information</h2>
              <div className="space-y-2 text-gray-700">
                <p><strong>Name:</strong> {fileInfo.name}</p>
                <p><strong>Size:</strong> {(fileInfo.size / 1024).toFixed(2)} KB</p>
                <p><strong>Type:</strong> {fileInfo.type}</p>
                <p><strong>Last Modified:</strong> {fileInfo.modified}</p>
                <p className="mt-4 text-sm break-all">
                  <strong className="text-gray-900">SHA-256 (Computed):</strong>{" "}
                  <span className="font-mono bg-gray-50 p-2 rounded-md block mt-1">{hashes.sha256}</span>
                </p>
                {hashes.sha1 && (
                  <p className="text-sm break-all">
                    <strong className="text-gray-900">SHA-1 (Computed):</strong>{" "}
                    <span className="font-mono bg-gray-50 p-2 rounded-md block mt-1">{hashes.sha1}</span>
                  </p>
                )}
                {hashes.sha512 && (
                  <p className="text-sm break-all">
                    <strong className="text-gray-900">SHA-512 (Computed):</strong>{" "}
                    <span className="font-mono bg-gray-50 p-2 rounded-md block mt-1">{hashes.sha512}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {match && (
            <div className="mt-8 bg-green-50 border border-green-300 p-8 rounded-xl shadow-lg">
              <h2 className="text-3xl font-extrabold text-green-800 mb-4 flex items-center">
                <span className="mr-3 text-4xl">✅</span> Verified via Database!
              </h2>
              <p className="text-green-700 text-lg mb-6">
                This document's hash matches a record in our secure database.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-gray-800 text-base">
                <p><strong>Original File Name:</strong> {match.file_name}</p>
                <p><strong>Uploaded by:</strong> <span className="font-mono break-all">{match.user_wallet}</span></p>
                <p><strong>Registered On:</strong> {new Date(match.created_at).toLocaleString()}</p>
                {match.tags && <p><strong>Tags:</strong> {match.tags}</p>}
              </div>
              {match.notes && <p className="mt-4 text-gray-800"><strong>Notes:</strong> {match.notes}</p>}

              <div className="mt-6 border-t border-gray-200 pt-6">
                {match.blockchain_tx && (
                  <p className="mb-3 text-base">
                    <strong>Blockchain Transaction:</strong>{" "}
                    <a
                      className="text-purple-600 hover:underline font-mono break-all"
                      href={`https://sepolia.etherscan.io/tx/${match.blockchain_tx}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {match.blockchain_tx}
                    </a>{" "}
                    <span className="text-gray-500">(View on Etherscan)</span>
                  </p>
                )}

                {match.ipfs_cid && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-4">
                    <p className="text-base">
                      <strong>IPFS Content Identifier (CID):</strong>{" "}
                      <a
                        className="text-blue-600 hover:underline font-mono break-all"
                        href={`https://gateway.pinata.cloud/ipfs/${match.ipfs_cid}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {match.ipfs_cid}
                      </a>
                    </p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`https://gateway.pinata.cloud/ipfs/${match.ipfs_cid}`);
                        alert("IPFS link copied to clipboard!");
                      }}
                      className="text-sm text-gray-600 hover:text-gray-800 hover:underline px-3 py-1 rounded-full bg-gray-100"
                    >
                      Copy Link
                    </button>
                  </div>
                )}
              </div>

              {match.ipfs_cid && (
                <div className="mt-6 p-5 bg-white rounded-lg shadow-inner flex flex-col items-center">
                  <p className="text-base text-gray-700 mb-3 font-medium">Scan QR Code for IPFS Link:</p>
                  <QRCode
                    value={`https://gateway.pinata.cloud/ipfs/${match.ipfs_cid}`}
                    size={180}
                    level="H"
                    className="rounded-md border border-gray-200 p-2"
                  />
                </div>
              )}

              <button
                onClick={handleDownloadCertificate}
                className="mt-8 w-full sm:w-auto px-8 py-3 bg-green-700 text-white text-lg font-semibold rounded-lg shadow-md hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition duration-200 ease-in-out"
              >
                Download Verification Certificate (PDF)
              </button>
            </div>
          )}

          {blockchainInfo && (
            <div className="mt-8 bg-blue-50 border border-blue-300 p-8 rounded-xl shadow-lg">
              <h2 className="text-3xl font-extrabold text-blue-800 mb-4 flex items-center">
                <span className="mr-3 text-4xl">🧬</span> Blockchain Record Found!
              </h2>
              <p className="text-blue-700 text-lg mb-6">
                This document's hash is immutably recorded on the Ethereum blockchain.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-gray-800 text-base">
                <p><strong>Registered Uploader:</strong> <span className="font-mono break-all">{blockchainInfo.uploader}</span></p>
                <p><strong>File Name (on-chain):</strong> {blockchainInfo.fileName}</p>
                <p><strong>Registered On:</strong> {blockchainInfo.timestamp}</p>
                <p><strong>Tag (on-chain):</strong> {blockchainInfo.tag}</p>
              </div>
              {/* You might want to add a link to the blockchain transaction here if you have it */}
              {match?.blockchain_tx && (
                  <p className="mt-6 text-base">
                    <strong>Transaction:</strong>{" "}
                    <a
                      className="text-purple-600 hover:underline font-mono break-all"
                      href={`https://sepolia.etherscan.io/tx/${match.blockchain_tx}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {match.blockchain_tx}
                    </a>{" "}
                    <span className="text-gray-500">(View on Etherscan)</span>
                  </p>
                )}
            </div>
          )}

          {!match && !blockchainInfo && (hashes.sha256 || manualHash) && !loading && (
            <div className="mt-8 bg-yellow-50 border border-yellow-300 p-8 rounded-xl shadow-lg text-center">
              <h2 className="text-3xl font-extrabold text-yellow-800 mb-4 flex items-center justify-center">
                <span className="mr-3 text-4xl">⚠️</span> Document Not Recognized
              </h2>
              <p className="text-yellow-700 text-lg mb-6">
                This document's hash does not match any record in our database or on the blockchain.
              </p>
              <p className="text-gray-600 mb-6">
                If this is a new document, you can register it to ensure its authenticity for the future.
              </p>
              <button
                onClick={() => router.push("/upload")}
                className="px-8 py-3 bg-blue-600 text-white text-lg font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200 ease-in-out"
              >
                Upload This Document Now
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}