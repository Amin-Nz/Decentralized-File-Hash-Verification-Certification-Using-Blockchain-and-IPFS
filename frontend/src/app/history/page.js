"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function HistoryPage() {
  const [historyFiles, setHistoryFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchName, setSearchName] = useState("");
  const [searchTags, setSearchTags] = useState("");
  const [searchWallet, setSearchWallet] = useState("");
  const [searchTx, setSearchTx] = useState("");
  const [searchSha256, setSearchSha256] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("file_hashes")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error) setHistoryFiles(data);
      setLoading(false);
    };

    fetchHistory();
  }, []);

  const filtered = historyFiles.filter((item) => {
    const nameMatch = item.file_name?.toLowerCase().includes(searchName.toLowerCase());
    const tagMatch = searchTags ? item.tags?.toLowerCase().includes(searchTags.toLowerCase()) : true;
    const walletMatch = item.user_wallet?.toLowerCase().includes(searchWallet.toLowerCase());
    const txMatch = item.blockchain_tx?.toLowerCase().includes(searchTx.toLowerCase());
    const shaMatch = item.sha256?.toLowerCase().includes(searchSha256.toLowerCase());

    let dateMatch = true;
    if (dateFrom || dateTo) {
      const created = new Date(item.created_at);
      const from = dateFrom ? new Date(dateFrom) : null;
      const to = dateTo ? new Date(dateTo + "T23:59:59") : null; // Include full day for 'to' date

      if (from && created < from) dateMatch = false;
      if (to && created > to) dateMatch = false;
    }

    return nameMatch && tagMatch && walletMatch && txMatch && shaMatch && dateMatch;
  });

  const clearFilters = () => {
    setSearchName("");
    setSearchTags("");
    setSearchWallet("");
    setSearchTx("");
    setSearchSha256("");
    setDateFrom("");
    setDateTo("");
  };

  return (
    <div className="p-8 max-w-6xl mx-auto bg-gray-50 min-h-screen">
      <h1 className="text-4xl font-extrabold mb-8 text-center text-gray-900">
        <span role="img" aria-label="magnifying glass" className="mr-3">🔎</span> Public File History
      </h1>

      {/* Filter Section */}
      <div className="bg-white shadow-xl rounded-xl p-6 mb-8 border border-gray-200">
        <h2 className="text-2xl font-bold mb-5 text-gray-800">Filter Records</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-4">
          <div>
            <label htmlFor="search-name" className="block text-sm font-medium text-gray-700 mb-1">File Name</label>
            <input
              id="search-name"
              type="text"
              placeholder="e.g., contract.pdf"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="p-3 border border-gray-300 rounded-lg w-full focus:ring-blue-500 focus:border-blue-500 shadow-sm transition duration-150 ease-in-out"
            />
          </div>
          <div>
            <label htmlFor="search-tags" className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
            <input
              id="search-tags"
              type="text"
              placeholder="e.g., invoice, legal"
              value={searchTags}
              onChange={(e) => setSearchTags(e.target.value)}
              className="p-3 border border-gray-300 rounded-lg w-full focus:ring-blue-500 focus:border-blue-500 shadow-sm transition duration-150 ease-in-out"
            />
          </div>
          <div>
            <label htmlFor="search-wallet" className="block text-sm font-medium text-gray-700 mb-1">Uploader Wallet</label>
            <input
              id="search-wallet"
              type="text"
              placeholder="e.g., 0xabc..."
              value={searchWallet}
              onChange={(e) => setSearchWallet(e.target.value)}
              className="p-3 border border-gray-300 rounded-lg w-full focus:ring-blue-500 focus:border-blue-500 shadow-sm transition duration-150 ease-in-out"
            />
          </div>
          <div>
            <label htmlFor="search-tx" className="block text-sm font-medium text-gray-700 mb-1">Blockchain Transaction</label>
            <input
              id="search-tx"
              type="text"
              placeholder="e.g., 0xdef..."
              value={searchTx}
              onChange={(e) => setSearchTx(e.target.value)}
              className="p-3 border border-gray-300 rounded-lg w-full focus:ring-blue-500 focus:border-blue-500 shadow-sm transition duration-150 ease-in-out"
            />
          </div>
          <div>
            <label htmlFor="search-sha256" className="block text-sm font-medium text-gray-700 mb-1">SHA-256 Hash</label>
            <input
              id="search-sha256"
              type="text"
              placeholder="e.g., abc123..."
              value={searchSha256}
              onChange={(e) => setSearchSha256(e.target.value)}
              className="p-3 border border-gray-300 rounded-lg w-full focus:ring-blue-500 focus:border-blue-500 shadow-sm transition duration-150 ease-in-out"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="date-from" className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
              <input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="p-3 border border-gray-300 rounded-lg w-full focus:ring-blue-500 focus:border-blue-500 shadow-sm transition duration-150 ease-in-out"
              />
            </div>
            <div>
              <label htmlFor="date-to" className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
              <input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="p-3 border border-gray-300 rounded-lg w-full focus:ring-blue-500 focus:border-blue-500 shadow-sm transition duration-150 ease-in-out"
              />
            </div>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={clearFilters}
            className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition ease-in-out duration-150 font-medium"
          >
            Clear All Filters
          </button>
          <span className="px-4 py-2 bg-blue-50 text-blue-800 rounded-md text-sm font-medium">
            Showing {filtered.length} of {historyFiles.length} records
          </span>
        </div>
      </div>

      {/* History List */}
      {loading ? (
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          <p className="mt-3 text-lg text-gray-600">Loading public history records...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-lg text-gray-700">
            No matching entries found for your current filters. Try adjusting your search criteria.
          </p>
          <button
            onClick={clearFilters}
            className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150 ease-in-out font-medium"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-gray-200 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow duration-200 ease-in-out"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3">
                <div>
                  <h3 className="font-bold text-xl text-gray-900 mb-1">{item.file_name}</h3>
                  <p className="text-sm text-gray-600">
                    Uploaded by <span className="font-mono text-blue-700 break-all">{item.user_wallet}</span> on{" "}
                    {new Date(item.created_at).toLocaleString()}
                  </p>
                </div>
                {item.blockchain_tx && (
                  <Link
                    href={`/tx/${item.blockchain_tx}`}
                    className="text-base text-purple-600 hover:text-purple-800 hover:underline mt-2 sm:mt-0 px-4 py-2 bg-purple-50 rounded-full transition duration-150 ease-in-out"
                  >
                    View Transaction Details
                  </Link>
                )}
              </div>
              <div className="text-base text-gray-700 mt-4 space-y-2">
                <p>
                  <strong className="text-gray-900">SHA-256:</strong>{" "}
                  <span className="font-mono bg-gray-50 p-2 rounded-md block mt-1 break-all">{item.sha256}</span>
                </p>
                {item.tags && (
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="text-gray-900">Tags:</strong>
                    {item.tags.split(',').map((tag, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                )}
                {item.notes && (
                  <p>
                    <strong className="text-gray-900">Notes:</strong>{" "}
                    <span className="bg-gray-50 p-2 rounded-md block mt-1 text-sm">{item.notes}</span>
                  </p>
                )}
                {item.ipfs_cid && (
                  <p>
                    <strong className="text-gray-900">IPFS CID:</strong>{" "}
                    <Link
                      href={`https://gateway.pinata.cloud/ipfs/${item.ipfs_cid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline font-mono break-all"
                    >
                      {item.ipfs_cid}
                    </Link>
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}