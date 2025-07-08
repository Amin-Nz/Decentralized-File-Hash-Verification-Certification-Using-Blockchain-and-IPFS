"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useWallet } from "@/context/WalletContext";
import { uploadToIPFS } from "@/utils/ipfs";
import { getContract } from "@/utils/getContract";
import { generateCertificate } from "@/utils/pdfGenerator";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x..."; // Replace with your actual contract address

export default function FileHasher() {
  // --- State and logic (unchanged) ---
  const [fileInfo, setFileInfo] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [hashes, setHashes] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isMounted, setIsMounted] = useState(false);
  const [canUploadToIPFS, setCanUploadToIPFS] = useState(false);
  const [ipfsCID, setIpfsCID] = useState(null);
  const [tags, setTags] = useState("");
  const [notes, setNotes] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRegistered, setIsRegistered] = useState(null);
  const [blockchainError, setBlockchainError] = useState(null);
  const [txHash, setTxHash] = useState(null);

  const { walletAddress } = useWallet();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const computeSimpleHash = (arrayBuffer) => {
    const bytes = new Uint8Array(arrayBuffer);
    let hash = 0;
    for (let i = 0; i < bytes.length; i++) {
      const char = bytes[i];
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  };

  const computeCryptoHash = async (algorithm, arrayBuffer) => {
    if (!window.crypto?.subtle) throw new Error('Web Crypto API not available');
    const hashBuffer = await window.crypto.subtle.digest(algorithm, arrayBuffer);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  };

  const uploadManuallyToIPFS = async () => {
    try {
      const ipfsHash = await uploadToIPFS(selectedFile);
      setIpfsCID(ipfsHash);
      await supabase.from("file_hashes")
        .update({ ipfs_cid: ipfsHash })
        .eq("sha256", hashes.sha256);
      alert("Uploaded to IPFS: " + ipfsHash);
    } catch (err) {
      alert("Upload failed: " + err.message);
    }
  };

  const downloadCertificate = async () => {
    if (!fileInfo || !hashes?.sha256 || !walletAddress || !txHash) {
      alert("Certificate can't be generated yet.");
      return;
    }
    try {
      await generateCertificate({
        fileInfo,
        hashes,
        ipfsCID,
        txHash,
        walletAddress,
        contractAddress: CONTRACT_ADDRESS,
        tags,
        notes
      });
    } catch (err) {
      console.error('Certificate generation failed:', err);
      alert('Failed to generate certificate: ' + err.message);
    }
  };

  const registerOnBlockchain = async () => {
    if (!walletAddress) {
      alert('Please connect your wallet first');
      return;
    }
    if (!hashes.sha256 || hashes.sha256.includes("Computing")) {
      alert("Hash not ready");
      return;
    }
    setIsRegistering(true);
    setBlockchainError(null);
    setTxHash(null);
    try {
      const contract = await getContract();
      if (!contract) throw new Error('Failed to get contract instance');
      if (!contract.interface || !contract.interface.fragments)
        throw new Error('Contract interface not available - check ABI configuration');
      const functionFragments = contract.interface.fragments.filter(f => f.type === 'function');
      if (functionFragments.length === 0)
        throw new Error('No functions found in contract ABI');
      const availableFunctions = functionFragments.map(f => {
        const inputs = f.inputs.map(input => input.type).join(',');
        return `${f.name}(${inputs})`;
      });
      const possibleFunctions = [
        'registerFile(string,string,string)',
        'addFile(string,string,string)',
        'storeFile(string,string,string)',
        'register(string,string,string)',
        'addHash(string,string,string)',
        'storeHash(string,string,string)',
        'registerFile(string,string)',
        'addFile(string,string)',
        'storeFile(string,string)',
        'register(string,string)',
        'addHash(string,string)',
        'storeHash(string,string)',
        'registerFile(string)',
        'addFile(string)',
        'storeFile(string)',
        'register(string)',
        'addHash(string)',
        'storeHash(string)'
      ];
      let matchedFunction = null;
      for (const funcSignature of possibleFunctions) {
        if (availableFunctions.includes(funcSignature)) {
          matchedFunction = funcSignature;
          break;
        }
      }
      if (!matchedFunction) {
        throw new Error(`No compatible registration function found in contract. Available functions: ${availableFunctions.join(', ')}`);
      }
      const functionName = matchedFunction.split('(')[0];
      const paramMatch = matchedFunction.match(/\(([^)]*)\)/);
      const paramTypes = paramMatch && paramMatch[1] ? paramMatch[1].split(',').filter(p => p.trim()) : [];
      const paramCount = paramTypes.length;
      const params = [];
      params.push(hashes.sha256);
      if (paramCount >= 2) params.push(selectedFile.name);
      if (paramCount >= 3) params.push(tags || "");
      const tx = await contract[functionName](...params);
      setTxHash(tx.hash);
      const receipt = await tx.wait();
      alert("✅ File registered on blockchain!");
      try {
        await supabase.from("file_hashes")
          .update({
            blockchain_tx: tx.hash,
            is_registered: true
          })
          .eq("sha256", hashes.sha256);
      } catch (dbErr) {
        console.error('Database update failed:', dbErr);
      }
      setIsRegistered(true);
      setTimeout(() => {
        verifyRegistration();
      }, 1000);
    } catch (err) {
      console.error("Blockchain TX error:", err);
      setBlockchainError(err.message);
      alert("❌ Failed to register on blockchain: " + err.message);
    } finally {
      setIsRegistering(false);
    }
  };

  const verifyRegistration = async () => {
    if (!hashes.sha256 || hashes.sha256.includes('Computing')) return;
    setIsVerifying(true);
    setBlockchainError(null);
    try {
      const contract = await getContract();
      if (!contract.interface || !contract.interface.fragments) {
        if (txHash) {
          setIsRegistered(true);
        }
        return;
      }
      const functionFragments = contract.interface.fragments.filter(f => f.type === 'function');
      const availableFunctions = functionFragments.map(f => {
        const inputs = f.inputs.map(input => input.type).join(',');
        return `${f.name}(${inputs})`;
      });
      let result = false;
      let verificationMethod = 'none';
      const verificationFunctions = [
        'isRegistered(string)',
        'isFileRegistered(string)',
        'fileExists(string)',
        'getFile(string)'
      ];
      let foundVerificationFunction = null;
      for (const funcSignature of verificationFunctions) {
        if (availableFunctions.includes(funcSignature)) {
          foundVerificationFunction = funcSignature;
          break;
        }
      }
      if (!foundVerificationFunction) {
        if (txHash) {
          setIsRegistered(true);
        }
        return;
      }
      const functionName = foundVerificationFunction.split('(')[0];
      try {
        if (functionName === 'getFile') {
          const fileInfo = await contract.getFile(hashes.sha256);
          result = fileInfo && fileInfo.length > 0;
          verificationMethod = 'getFile';
        } else {
          result = await contract[functionName](hashes.sha256);
          verificationMethod = functionName;
        }
      } catch (err) {
        throw err;
      }
      setIsRegistered(result);
    } catch (err) {
      if (txHash) {
        setIsRegistered(true);
      } else {
        setBlockchainError(`Verification failed: ${err.message}. The file may still be registered.`);
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const saveToDatabase = async () => {
    if (!selectedFile || !hashes.sha256 || hashes.sha256.includes('Computing')) {
      alert('Please wait for file processing to complete');
      return;
    }
    try {
      const { error: insertError } = await supabase.from("file_hashes").insert({
        user_wallet: walletAddress,
        file_name: selectedFile.name,
        file_type: selectedFile.type || 'unknown',
        file_size: selectedFile.size,
        modified_at: new Date(selectedFile.lastModified),
        sha256: hashes.sha256,
        sha512: hashes.sha512,
        sha1: hashes.sha1,
        simple_hash: hashes.simple,
        tags: tags || null,
        notes: notes || null,
        ipfs_cid: ipfsCID || null,
        blockchain_tx: txHash || null,
        is_registered: isRegistered || false
      });
      if (insertError) {
        alert('Failed to save to database: ' + insertError.message);
      } else {
        alert('File information saved to database successfully!');
      }
    } catch (err) {
      alert('Failed to save to database: ' + err.message);
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      setFileInfo(null);
      setHashes({});
      setError(null);
      setIsRegistered(null);
      setTxHash(null);
      setBlockchainError(null);
      return;
    }
    setSelectedFile(file);
    setIsLoading(true);
    setError(null);
    setIpfsCID(null);
    setCanUploadToIPFS(false);
    setIsRegistered(null);
    setTxHash(null);
    setBlockchainError(null);
    try {
      const arrayBuffer = await file.arrayBuffer();
      setFileInfo({
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        lastModified: new Date(file.lastModified).toLocaleString()
      });
      const simpleHash = computeSimpleHash(arrayBuffer);
      setHashes({ sha256: 'Computing...', sha1: 'Computing...', sha512: 'Computing...', simple: simpleHash });
      if (window.crypto?.subtle) {
        const [sha256, sha1, sha512] = await Promise.all([
          computeCryptoHash('SHA-256', arrayBuffer),
          computeCryptoHash('SHA-1', arrayBuffer),
          computeCryptoHash('SHA-512', arrayBuffer)
        ]);
        const finalHashes = { sha256, sha1, sha512, simple: simpleHash };
        setHashes(finalHashes);
        setCanUploadToIPFS(true);
        setTimeout(() => verifyRegistration(), 500);
      } else {
        setHashes(prev => ({
          ...prev,
          sha256: 'Not available (no crypto API)',
          sha1: 'Not available (no crypto API)',
          sha512: 'Not available (no crypto API)'
        }));
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
      setFileInfo(null);
      setHashes({});
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Copied to clipboard!');
    } catch (err) {
      alert('Failed to copy to clipboard');
    }
  };

  const canGenerateCertificate = fileInfo && hashes?.sha256 && walletAddress && txHash && !hashes.sha256.includes('Computing') && !hashes.sha256.includes('Not available');

  // --- UI helpers for beautiful presentation ---
  const StatusBadge = ({ status, children }) => {
    let color =
      status === "success"
        ? "bg-green-100 text-green-700 border-green-300"
        : status === "error"
        ? "bg-red-100 text-red-700 border-red-300"
        : status === "warn"
        ? "bg-yellow-100 text-yellow-700 border-yellow-300"
        : "bg-gray-100 text-gray-700 border-gray-300";
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-semibold ${color}`}
      >
        {children}
      </span>
    );
  };

  const SectionCard = ({ title, icon, children, className = "" }) => (
    <section
      className={`rounded-2xl shadow-sm border border-gray-100 bg-gradient-to-br from-white to-gray-50 p-6 mb-6 ${className}`}
    >
      <div className="flex items-center gap-2 mb-4">
        {icon && <span className="text-xl">{icon}</span>}
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      </div>
      {children}
    </section>
  );

  if (!isMounted) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-12 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  // --- UI ---
  return (
    <div className="p-6 sm:p-10 max-w-2xl mx-auto">
      <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
        <h1 className="text-4xl font-extrabold mb-8 text-blue-700 flex items-center gap-3">
          <span className="bg-blue-100 rounded-full p-2 text-blue-600">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M9 17v-5l-2 2m0 0l-2-2m2 2V7a2 2 0 012-2h6a2 2 0 012 2v10a2 2 0 01-2 2H9a2 2 0 01-2-2z" /></svg>
          </span>
          File Hasher
        </h1>

        {/* File Upload */}
        <SectionCard title="Choose a File" icon="📁">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select a file to analyze and register
          </label>
          <input
            type="file"
            onChange={handleFileChange}
            disabled={isLoading}
            className="block w-full text-sm text-gray-600 
              file:mr-4 file:py-2 file:px-4 
              file:rounded-xl file:border-0 
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700 
              hover:file:bg-blue-100
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all"
          />
        </SectionCard>

        {/* Tags & Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Tags</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. invoice,legal,important"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any remarks or context..."
              rows={1}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-200"
            />
          </div>
        </div>

        {/* Error Alerts */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-center gap-2">
            <span className="text-red-600 text-xl">❌</span>
            <div>
              <div className="font-semibold text-red-700">Error</div>
              <div className="text-sm text-red-700">{error}</div>
            </div>
          </div>
        )}
        {blockchainError && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-center gap-2">
            <span className="text-red-600 text-xl">⛔</span>
            <div>
              <div className="font-semibold text-red-700">Blockchain Error</div>
              <div className="text-sm text-red-700">{blockchainError}</div>
            </div>
          </div>
        )}

        {/* Loading Spinner */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-b-blue-600"></div>
            <p className="mt-4 text-blue-700 font-medium">Processing file...</p>
          </div>
        )}

        {/* Main Content */}
        {fileInfo && (
          <div className="space-y-7">
            {/* File Info */}
            <SectionCard title="File Information" icon="📝">
              <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2 text-sm">
                <div>
                  <dt className="font-semibold text-gray-500">Name</dt>
                  <dd className="text-gray-900 break-all">{fileInfo.name}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-gray-500">Size</dt>
                  <dd className="text-gray-900">{formatFileSize(fileInfo.size)}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-gray-500">Type</dt>
                  <dd className="text-gray-900">{fileInfo.type}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-gray-500">Modified</dt>
                  <dd className="text-gray-900">{fileInfo.lastModified}</dd>
                </div>
              </dl>
            </SectionCard>

            {/* Hashes */}
            <SectionCard title="Hash Values" icon="🔑">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(hashes).map(([key, value]) => (
                  <div key={key} className="mb-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{key}</span>
                      {value && !value.includes("Computing") && !value.includes("Not available") && (
                        <button
                          onClick={() => copyToClipboard(value)}
                          className="text-xs text-blue-600 hover:text-blue-800 hover:underline transition"
                        >
                          Copy
                        </button>
                      )}
                    </div>
                    <div className="p-2 bg-gray-50 border border-gray-100 rounded-lg font-mono text-xs break-all select-all">
                      {value || <span className="text-gray-400">Waiting...</span>}
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Blockchain Status */}
            {hashes.sha256 && !hashes.sha256.includes('Computing') && !hashes.sha256.includes('Not available') && (
              <SectionCard title="Blockchain Status" icon="⛓️">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Registration Status:</span>
                    <div className="flex items-center gap-2">
                      {isVerifying ? (
                        <span className="inline-flex items-center gap-1 animate-pulse text-blue-600">
                          <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/></svg>
                          Checking...
                        </span>
                      ) : isRegistered === true ? (
                        <StatusBadge status="success">✓ Registered</StatusBadge>
                      ) : isRegistered === false ? (
                        <StatusBadge status="error">✗ Not Registered</StatusBadge>
                      ) : (
                        <StatusBadge status="warn">Unknown</StatusBadge>
                      )}
                      <button
                        onClick={verifyRegistration}
                        disabled={isVerifying}
                        className="ml-2 text-xs text-blue-600 hover:text-blue-800 hover:underline disabled:opacity-50"
                      >
                        {isVerifying ? 'Checking...' : 'Verify'}
                      </button>
                    </div>
                  </div>
                  {txHash && (
                    <div className="text-xs mt-2">
                      <span className="font-semibold text-gray-700">Transaction Hash:</span>
                      <div className="font-mono break-all p-2 mt-1 bg-white border border-gray-100 rounded-lg">
                        {txHash}
                      </div>
                    </div>
                  )}
                </div>
              </SectionCard>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 mt-6">
              {canUploadToIPFS && !ipfsCID && (
                <button
                  onClick={uploadManuallyToIPFS}
                  className="bg-gradient-to-r from-green-500 to-green-600 text-white px-5 py-2.5 rounded-xl shadow hover:from-green-600 hover:to-green-700 transition font-semibold"
                >
                  <span className="inline-flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M12 16v-8m0 0l-4 4m4-4l4 4" /></svg>
                    Upload to IPFS
                  </span>
                </button>
              )}

              {hashes.sha256 && !hashes.sha256.includes('Computing') && !hashes.sha256.includes('Not available') && walletAddress && (
                <button
                  onClick={registerOnBlockchain}
                  disabled={isRegistering || isRegistered === true}
                  className={`bg-gradient-to-r from-purple-500 to-purple-600 text-white px-5 py-2.5 rounded-xl shadow font-semibold transition
                  ${isRegistering || isRegistered === true ? 'opacity-60 cursor-not-allowed' : 'hover:from-purple-600 hover:to-purple-700'}`}
                >
                  {isRegistering ? (
                    <span className="inline-flex items-center gap-2">
                      <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/></svg>
                      Registering...
                    </span>
                  ) : isRegistered ? "Already Registered" : (
                    <span className="inline-flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M16 17v-1a4 4 0 00-8 0v1" /><circle cx="12" cy="7" r="4" /></svg>
                      Register on Blockchain
                    </span>
                  )}
                </button>
              )}

              {hashes.sha256 && !hashes.sha256.includes('Computing') && !hashes.sha256.includes('Not available') && (
                <button
                  onClick={saveToDatabase}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-5 py-2.5 rounded-xl shadow font-semibold hover:from-blue-600 hover:to-blue-700 transition"
                >
                  <span className="inline-flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M17 16l4-4m0 0l-4-4m4 4H7" /></svg>
                    Save to Database
                  </span>
                </button>
              )}

              {canGenerateCertificate && (
                <button
                  onClick={downloadCertificate}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-5 py-2.5 rounded-xl shadow font-semibold hover:from-orange-600 hover:to-orange-700 transition"
                >
                  <span className="inline-flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M12 20h9" /><path d="M12 4v16m0 0l-4-4m4 4l4-4" /></svg>
                    Download Certificate
                  </span>
                </button>
              )}
            </div>

            {/* Wallet Not Connected */}
            {!walletAddress && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mt-4 flex items-center gap-3">
                <span className="text-yellow-500 text-2xl">⚠️</span>
                <div>
                  <h3 className="font-semibold text-yellow-800">Wallet Not Connected</h3>
                  <p className="text-sm text-yellow-700">
                    Connect your wallet to register files on the blockchain.
                  </p>
                </div>
              </div>
            )}

            {/* IPFS CID */}
            {ipfsCID && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mt-4 flex items-center gap-3">
                <span className="text-green-600 text-2xl">🌐</span>
                <div>
                  <h3 className="font-semibold text-green-800">IPFS Upload Success</h3>
                  <p className="text-sm text-green-700 break-all">
                    IPFS CID: <span className="font-mono">{ipfsCID}</span>
                  </p>
                  <button
                    onClick={() => copyToClipboard(ipfsCID)}
                    className="text-xs text-green-600 hover:text-green-800 mt-1 hover:underline"
                  >
                    Copy CID
                  </button>
                </div>
              </div>
            )}

            {/* Crypto API Warning */}
            {!window.crypto?.subtle && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mt-4 flex items-center gap-3">
                <span className="text-yellow-500 text-2xl">🛡️</span>
                <div>
                  <h3 className="font-semibold text-yellow-800">Limited Crypto Support</h3>
                  <p className="text-sm text-yellow-700">
                    Your browser doesn't support the Web Crypto API. Only the simple hash is available.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
