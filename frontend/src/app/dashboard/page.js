"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useWallet } from "@/context/WalletContext";
import Link from "next/link";

export default function DashboardPage() {
  const { walletAddress } = useWallet();
  const [stats, setStats] = useState({
    total: 0,
    registered: 0,
    ipfs: 0,
    lastUpload: null,
  });
  const [recentFiles, setRecentFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!walletAddress) return;

    const fetchStats = async () => {
      setLoading(true);

      const { data: files, error } = await supabase
        .from("file_hashes")
        .select("*")
        .eq("user_wallet", walletAddress)
        .order("created_at", { ascending: false });

      if (!error && files.length) {
        const registered = files.filter((f) => f.is_registered).length;
        const ipfs = files.filter((f) => f.ipfs_cid).length;

        setStats({
          total: files.length,
          registered,
          ipfs,
          lastUpload: files[0].created_at,
        });

        setRecentFiles(files.slice(0, 5));
      }

      setLoading(false);
    };

    fetchStats();
  }, [walletAddress]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Dashboard
            </h1>
          </div>
          <p className="text-gray-600 text-lg">Monitor your document verification activities</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
              <span className="text-gray-600 font-medium">Loading dashboard...</span>
            </div>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              <StatsCard 
                title="Total Files" 
                value={stats.total} 
                icon="📄"
                gradient="from-blue-500 to-cyan-500"
                bgColor="bg-blue-50"
                textColor="text-blue-700"
              />
              <StatsCard 
                title="On-Chain Registered" 
                value={stats.registered} 
                icon="🔗"
                gradient="from-green-500 to-emerald-500"
                bgColor="bg-green-50"
                textColor="text-green-700"
              />
              <StatsCard 
                title="IPFS Uploaded" 
                value={stats.ipfs} 
                icon="🌐"
                gradient="from-purple-500 to-violet-500"
                bgColor="bg-purple-50"
                textColor="text-purple-700"
              />
              <StatsCard 
                title="Last Upload" 
                value={stats.lastUpload ? new Date(stats.lastUpload).toLocaleDateString() : "N/A"}
                icon="⏰"
                gradient="from-gray-500 to-slate-500"
                bgColor="bg-gray-50"
                textColor="text-gray-700"
              />
            </div>

            {/* Recent Files Section */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Recent Files</h2>
              </div>
              
              <div className="space-y-3">
                {recentFiles.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 font-medium">No recent files found</p>
                    <p className="text-gray-400 text-sm mt-1">Upload your first document to get started</p>
                  </div>
                ) : (
                  recentFiles.map((file) => (
                    <div key={file.id} className="group p-4 rounded-xl bg-gradient-to-r from-white to-gray-50 border border-gray-100 hover:shadow-md transition-all duration-200 hover:border-blue-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                {file.file_name}
                              </p>
                              <p className="text-sm text-gray-500">
                                {file.file_type} • {new Date(file.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex gap-2 mt-3">
                            <StatusBadge 
                              active={file.is_registered}
                              activeText="On-Chain"
                              inactiveText="Not Registered"
                              activeColor="bg-green-500"
                              inactiveColor="bg-gray-400"
                            />
                            <StatusBadge 
                              active={file.ipfs_cid}
                              activeText="IPFS"
                              inactiveText="No IPFS"
                              activeColor="bg-purple-500"
                              inactiveColor="bg-gray-400"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <ActionButton
                href="/upload"
                icon="📤"
                title="Upload New File"
                description="Add new document"
                gradient="from-blue-500 to-cyan-500"
                hoverColor="hover:from-blue-600 hover:to-cyan-600"
              />
              <ActionButton
                href="/verify"
                icon="🔍"
                title="Verify Document"
                description="Check authenticity"
                gradient="from-emerald-500 to-teal-500"
                hoverColor="hover:from-emerald-600 hover:to-teal-600"
              />
              <ActionButton
                href="/my-hashes"
                icon="📂"
                title="View My Files"
                description="Browse all files"
                gradient="from-indigo-500 to-purple-500"
                hoverColor="hover:from-indigo-600 hover:to-purple-600"
              />
              <ActionButton
                href="/history"
                icon="🕑"
                title="History"
                description="View past activity"
                gradient="from-orange-500 to-red-500"
                hoverColor="hover:from-orange-600 hover:to-red-600"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatsCard({ title, value, icon, gradient, bgColor, textColor }) {
  return (
    <div className={`${bgColor} rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 group`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl bg-gradient-to-r ${gradient} shadow-lg`}>
          <span className="text-xl">{icon}</span>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-bold ${textColor} group-hover:scale-110 transition-transform duration-200`}>
            {value}
          </p>
        </div>
      </div>
      <h3 className={`font-semibold ${textColor} opacity-80`}>{title}</h3>
    </div>
  );
}

function StatusBadge({ active, activeText, inactiveText, activeColor, inactiveColor }) {
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-white shadow-sm ${
      active ? activeColor : inactiveColor
    }`}>
      <span className={`w-2 h-2 rounded-full mr-2 ${active ? 'bg-white' : 'bg-gray-200'}`}></span>
      {active ? activeText : inactiveText}
    </span>
  );
}

function ActionButton({ href, icon, title, description, gradient, hoverColor }) {
  return (
    <Link
      href={href}
      className={`group p-6 rounded-2xl bg-gradient-to-r ${gradient} ${hoverColor} text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300`}
    >
      <div className="flex flex-col items-center text-center">
        <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-200">
          {icon}
        </div>
        <h3 className="font-semibold text-lg mb-1">{title}</h3>
        <p className="text-sm opacity-90">{description}</p>
      </div>
    </Link>
  );
}