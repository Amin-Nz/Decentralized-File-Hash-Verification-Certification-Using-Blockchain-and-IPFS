"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useWallet } from "@/context/WalletContext";
import QRCode from "react-qr-code";

export default function MyHashesPage() {
  const { walletAddress } = useWallet();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTag, setFilterTag] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    const fetchFiles = async () => {
      if (!walletAddress) return;
      setLoading(true);
      const { data, error } = await supabase
        .from("file_hashes")
        .select("*")
        .eq("user_wallet", walletAddress)
        .order("created_at", { ascending: false });

      if (!error) setFiles(data);
      setLoading(false);
    };

    fetchFiles();
  }, [walletAddress]);

  const filteredFiles = files.filter((item) => {
    const matchesSearch = item.file_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = filterTag ? item.tags?.toLowerCase().includes(filterTag.toLowerCase()) : true;
    let matchesDate = true;
    if (dateFrom || dateTo) {
      const itemDate = new Date(item.created_at);
      const fromDate = dateFrom ? new Date(dateFrom) : null;
      const toDate = dateTo ? new Date(dateTo + "T23:59:59") : null;
      if (fromDate && itemDate < fromDate) matchesDate = false;
      if (toDate && itemDate > toDate) matchesDate = false;
    }
    return matchesSearch && matchesTag && matchesDate;
  });

  const clearFilters = () => {
    setSearchQuery("");
    setFilterTag("");
    setDateFrom("");
    setDateTo("");
  };

  const exportCSV = () => {
    const header = [
      "File Name",
      "SHA-256",
      "SHA-1",
      "SHA-512",
      "Simple Hash",
      "Tags",
      "Notes",
      "Created",
      "IPFS CID",
      "Blockchain TX"
    ];
    const rows = filteredFiles.map((f) => [
      f.file_name,
      f.sha256,
      f.sha1,
      f.sha512,
      f.simple_hash,
      f.tags,
      f.notes,
      f.created_at,
      f.ipfs_cid,
      f.blockchain_tx
    ]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "my_hashes.csv");
    link.click();
  };

  const exportSingleFile = (item) => {
    const header = ["Field", "Value"];
    const rows = [
      ["File Name", item.file_name],
      ["SHA-256", item.sha256],
      ["SHA-1", item.sha1],
      ["SHA-512", item.sha512],
      ["Simple Hash", item.simple_hash],
      ["Tags", item.tags || ""],
      ["Notes", item.notes || ""],
      ["Created", item.created_at],
      ["IPFS CID", item.ipfs_cid || ""],
      ["Blockchain TX", item.blockchain_tx || ""]
    ];
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${item.file_name}_hashes.csv`);
    link.click();
  };

  const deleteFile = async (id) => {
    if (!confirm("Are you sure you want to delete this file record?")) return;
    const { error } = await supabase.from("file_hashes").delete().eq("id", id);
    if (!error) {
      setFiles(files.filter((f) => f.id !== id));
    } else {
      alert("Failed to delete file record");
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">My Hashed Files</h1>

      {/* Filters */}
      <div className="mb-6 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Filter Your Files</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <label htmlFor="search-filename" className="block text-sm font-medium text-gray-700 mb-1">
              Search by File Name
            </label>
            <input
              type="text"
              id="search-filename"
              placeholder="e.g., document.pdf"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border border-gray-300 p-2 rounded-md w-full focus:ring-blue-500 focus:border-blue-500 shadow-sm transition duration-150 ease-in-out"
            />
          </div>
          <div>
            <label htmlFor="filter-tag" className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Tag
            </label>
            <input
              type="text"
              id="filter-tag"
              placeholder="e.g., important, invoice"
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
              className="border border-gray-300 p-2 rounded-md w-full focus:ring-blue-500 focus:border-blue-500 shadow-sm transition duration-150 ease-in-out"
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="date-from" className="block text-sm font-medium text-gray-700 mb-1">
              Date Range (From)
            </label>
            <input
              type="date"
              id="date-from"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="border border-gray-300 p-2 rounded-md w-full focus:ring-blue-500 focus:border-blue-500 shadow-sm transition duration-150 ease-in-out"
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="date-to" className="block text-sm font-medium text-gray-700 mb-1">
              Date Range (To)
            </label>
            <input
              type="date"
              id="date-to"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="border border-gray-300 p-2 rounded-md w-full focus:ring-blue-500 focus:border-blue-500 shadow-sm transition duration-150 ease-in-out"
            />
          </div>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            onClick={clearFilters}
            className="px-5 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition ease-in-out duration-150 text-sm font-medium"
          >
            Clear All Filters
          </button>
          <span className="px-4 py-2 bg-blue-50 text-blue-800 rounded-md text-sm font-medium">
            Showing {filteredFiles.length} of {files.length} files
          </span>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <button
          onClick={exportCSV}
          className="px-5 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition ease-in-out duration-150 font-medium"
        >
          Export All Filtered Results to CSV
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          <p className="mt-3 text-lg text-gray-600">Loading your files...</p>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-lg text-gray-700">
            {files.length === 0
              ? "No files found. Get started by uploading some files!"
              : "No files match your current filters. Try adjusting your search criteria or clearing your filters."}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredFiles.map((item) => (
            <div key={item.id} className="bg-white shadow-lg border border-gray-200 rounded-xl p-7 hover:shadow-xl transition-shadow duration-200 ease-in-out">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-xl text-gray-900">{item.file_name}</h3>
                    {item.file_type && (
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full font-medium">
                        {item.file_type}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mb-4">
                    Uploaded: {new Date(item.created_at).toLocaleString()}
                    {item.file_size && (
                      <span className="ml-4">
                        Size: {(item.file_size / 1024).toFixed(2)} KB
                      </span>
                    )}
                  </p>
                  <div className="space-y-3 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <strong className="text-gray-700 block mb-1">SHA-256:</strong>
                        <p className="font-mono text-gray-800 break-all">{item.sha256}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <strong className="text-gray-700 block mb-1">SHA-1:</strong>
                        <p className="font-mono text-gray-800 break-all">{item.sha1}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <strong className="text-gray-700 block mb-1">SHA-512:</strong>
                        <p className="font-mono text-gray-800 break-all">{item.sha512}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <strong className="text-gray-700 block mb-1">Simple Hash:</strong>
                        <p className="font-mono text-gray-800 break-all">{item.simple_hash}</p>
                      </div>
                    </div>
                  </div>
                  {item.tags && (
                    <div className="mb-4">
                      <strong className="text-sm text-gray-700 block mb-2">Tags:</strong>
                      <div className="flex flex-wrap gap-2">
                        {item.tags.split(',').map((tag, index) => (
                          <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {item.notes && (
                    <div className="mb-4">
                      <strong className="text-sm text-gray-700 block mb-2">Notes:</strong>
                      <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded-lg border border-gray-200">{item.notes}</p>
                    </div>
                  )}
                  {/* IPFS CID, links, public page, copy CID */}
                  {item.ipfs_cid && (
                    <div className="mt-4 text-sm bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <strong className="text-gray-700 block mb-1">IPFS CID:</strong>{" "}
                      <span className="font-mono break-all text-gray-800">{item.ipfs_cid}</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(item.ipfs_cid);
                          alert("IPFS CID copied to clipboard!");
                        }}
                        className="text-xs text-blue-600 ml-2 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                      >
                        Copy CID
                      </button>
                      <div className="mt-2 flex flex-wrap items-center gap-4">
                        <a
                          href={`https://gateway.pinata.cloud/ipfs/${item.ipfs_cid}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 hover:underline transition duration-150 ease-in-out"
                        >
                          View on IPFS Gateway
                        </a>
                        <a
                          href={`/file/${item.ipfs_cid}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-600 hover:text-purple-800 hover:underline transition duration-150 ease-in-out"
                        >
                          View Public Page
                        </a>
                      </div>
                    </div>
                  )}
                  {/* Blockchain TX */}
                  {item.blockchain_tx && (
                    <div className="mt-4 text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <strong className="block mb-1">Blockchain Transaction:</strong>{" "}
                      <a
                        href={`/tx/${item.blockchain_tx}`}
                        className="text-blue-600 hover:underline break-all"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {item.blockchain_tx}
                      </a>
                      <span className="ml-2">
                        (<a
                          href={`https://sepolia.etherscan.io/tx/${item.blockchain_tx}`}
                          className="text-blue-600 hover:underline break-all"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View on Etherscan
                        </a>)
                      </span>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-3 mt-5">
                    <button
                      onClick={() => exportSingleFile(item)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-300"
                    >
                      Export This Entry
                    </button>
                    {item.ipfs_cid && (
                      <>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            const a = document.createElement("a");
                            a.href = `https://gateway.pinata.cloud/ipfs/${item.ipfs_cid}`;
                            a.download = item.file_name;
                            a.style.display = "none";
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                          }}
                          className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md text-sm font-medium hover:bg-blue-200 transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-300"
                        >
                          Download from IPFS
                        </button>
                        <button
                          onClick={() =>
                            setShowQR((prev) => ({
                              ...prev,
                              [item.id]: !prev[item.id],
                            }))
                          }
                          className="px-4 py-2 bg-purple-100 text-purple-700 rounded-md text-sm font-medium hover:bg-purple-200 transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-300"
                        >
                          {showQR[item.id] ? "Hide QR" : "Show QR Code"}
                        </button>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(
                              `https://gateway.pinata.cloud/ipfs/${item.ipfs_cid}`
                            );
                            alert("IPFS link copied to clipboard!");
                          }}
                          className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-md text-sm font-medium hover:bg-indigo-200 transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        >
                          Copy IPFS Link
                        </button>
                      </>
                    )}
                  </div>
                  {item.ipfs_cid && showQR[item.id] && (
                    <div className="mt-5 p-5 bg-gray-50 rounded-lg flex flex-col items-center border border-gray-200">
                      <p className="text-sm text-gray-700 mb-3 font-medium">Scan for IPFS Link:</p>
                      <QRCode
                        value={`https://gateway.pinata.cloud/ipfs/${item.ipfs_cid}`}
                        size={160}
                        level="H"
                        className="rounded-md"
                      />
                    </div>
                  )}
                </div>
                <button
                  onClick={() => deleteFile(item.id)}
                  className="ml-6 flex-shrink-0 text-red-600 hover:text-red-800 text-sm font-medium px-4 py-2 rounded-md hover:bg-red-50 transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}