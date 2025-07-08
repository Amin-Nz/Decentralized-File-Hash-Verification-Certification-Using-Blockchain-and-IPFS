"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import { ethers } from "ethers";
import QRCode from "react-qr-code";
import { generateCertificate } from "@/utils/pdfGenerator";
import { CONTRACT_ABI } from "@/lib/contractABI";

export default function TxPage() {
  const { hash } = useParams();
  const [txData, setTxData] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [fileData, setFileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!hash) return;

    const fetchTx = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Fetch raw transaction
        const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL);
        const tx = await provider.getTransaction(hash);
        const receipt = await provider.getTransactionReceipt(hash);

        if (!tx || !tx.to || !tx.data) throw new Error("Invalid transaction data");

        setTxData(tx);
        setReceipt(receipt);

        // 2. Decode input data (must match contract ABI)
        const iface = new ethers.Interface(CONTRACT_ABI);
        const decoded = iface.parseTransaction({ data: tx.data });

        const args = decoded?.args || [];

        setFileData({
          contract: tx.to,
          fileHash: args[0],
          fileName: args[1],
          tag: args[2],
          from: tx.from,
          timestamp: new Date(Number(receipt?.timestamp || Date.now())).toLocaleString(),
        });

      } catch (err) {
        console.error(err);
        setError("Failed to fetch transaction or decode input.");
      } finally {
        setLoading(false);
      }
    };

    fetchTx();
  }, [hash]);

  const handleDownloadCertificate = async () => {
    if (!fileData) return;

    await generateCertificate({
      fileInfo: {
        name: fileData.fileName,
        size: "N/A",
        type: "N/A",
        modified: fileData.timestamp,
      },
      hashes: {
        sha256: fileData.fileHash,
        sha1: "N/A",
        sha512: "N/A",
      },
      ipfsCID: null,
      txHash: hash,
      walletAddress: fileData.from,
      contractAddress: fileData.contract,
      tags: fileData.tag || "",
      notes: "",
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">🔍 Blockchain Proof</h1>

      {loading && <p>Loading transaction details...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {fileData && (
        <div className="bg-white rounded shadow p-4 space-y-3">
          <p><strong>File Name:</strong> {fileData.fileName}</p>
          <p><strong>Tag:</strong> {fileData.tag}</p>
          <p className="break-all"><strong>SHA-256:</strong> {fileData.fileHash}</p>
          <p><strong>Uploaded by:</strong> {fileData.from}</p>
          <p><strong>Contract:</strong> {fileData.contract}</p>
          <p><strong>Transaction:</strong> <a href={`https://sepolia.etherscan.io/tx/${hash}`} className="text-blue-600 underline" target="_blank">{hash}</a></p>

          <QRCode value={`https://sepolia.etherscan.io/tx/${hash}`} size={128} className="mt-4" />

          <button
            onClick={handleDownloadCertificate}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Download Certificate
          </button>
        </div>
      )}
    </div>
  );
}
