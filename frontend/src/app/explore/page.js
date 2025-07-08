"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function ExplorePage() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchFiles = async () => {
      setLoading(true); // Ensure loading state is true when fetching
      const { data, error } = await supabase
        .from("file_hashes")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error) {
        setFiles(data);
      } else {
        console.error("Error fetching files:", error);
        // Optionally, set an error state here to inform the user
      }
      setLoading(false);
    };

    fetchFiles();
  }, []);

  const filtered = files.filter((file) => {
    const searchTerm = search.toLowerCase();
    return (
      (file.file_name?.toLowerCase().includes(searchTerm)) ||
      (file.tags?.toLowerCase().includes(searchTerm)) ||
      (file.sha256?.toLowerCase().includes(searchTerm)) ||
      (file.user_wallet?.toLowerCase().includes(searchTerm)) // Also allow searching by wallet
    );
  });

  return (
    <div className="max-w-6xl mx-auto p-8 bg-gray-50 min-h-screen">
      <h1 className="text-4xl font-extrabold mb-8 text-center text-gray-900">
        <span role="img" aria-label="magnifying glass" className="mr-3">🔍</span> Explore Public File Registry
      </h1>

      {/* Search Bar */}
      <div className="mb-8 bg-white shadow-md rounded-lg p-4 border border-gray-200">
        <input
          type="text"
          placeholder="Search by file name, tags, SHA-256 hash, or uploader wallet..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="p-3 w-full border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 shadow-sm transition duration-150 ease-in-out text-base"
        />
      </div>

      {/* Loading, Empty, and Results Display */}
      {loading ? (
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          <p className="mt-3 text-lg text-gray-600">Loading public file registry...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-xl shadow-md p-8 border border-gray-200">
          <p className="text-lg text-gray-700">
            No files found matching your search criteria.
          </p>
          {search && (
            <button
              onClick={() => setSearch("")}
              className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150 ease-in-out font-medium"
            >
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {filtered.map((file) => (
            <div
              key={file.id}
              className="bg-white shadow-lg p-6 rounded-xl border border-gray-200 hover:shadow-xl transition-shadow duration-200 ease-in-out"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">{file.file_name}</h2>
                  <p className="text-sm text-gray-600">
                    Uploaded by: <span className="font-mono text-blue-700 break-all">{file.user_wallet}</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    Registered on: {new Date(file.created_at).toLocaleString()}
                  </p>
                </div>
                {/* Optional: Add a quick action button here if applicable, e.g., Verify */}
              </div>

              {file.tags && (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <strong className="text-gray-900 text-sm">Tags:</strong>
                  {file.tags.split(",").map((tag, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-indigo-100 text-indigo-800 text-xs font-medium rounded-full"
                    >
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-4 border-t border-gray-100 pt-4 space-y-2 text-gray-700">
                <p className="text-sm">
                  <strong className="text-gray-900">SHA-256 Hash:</strong>{" "}
                  <span className="font-mono bg-gray-50 p-2 rounded-md inline-block max-w-full overflow-hidden text-ellipsis break-all align-middle">{file.sha256}</span>
                </p>

                {file.ipfs_cid && (
                  <p className="text-sm">
                    <strong className="text-gray-900">IPFS Link:</strong>{" "}
                    <a
                      href={`https://gateway.pinata.cloud/ipfs/${file.ipfs_cid}`}
                      className="text-blue-600 hover:underline font-mono break-all"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {file.ipfs_cid}
                    </a>
                  </p>
                )}

                {file.blockchain_tx && (
                  <p className="text-sm">
                    <strong className="text-gray-900">Blockchain TX:</strong>{" "}
                    <a
                      href={`https://sepolia.etherscan.io/tx/${file.blockchain_tx}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:underline font-mono break-all"
                    >
                      {file.blockchain_tx.slice(0, 20)}...{file.blockchain_tx.slice(-8)}
                    </a>{" "}
                    <span className="text-gray-500 text-xs">(Etherscan)</span>
                    <Link
                      href={`/tx/${file.blockchain_tx}`}
                      className="ml-2 text-blue-500 hover:underline text-xs"
                    >
                      View Proof Page
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