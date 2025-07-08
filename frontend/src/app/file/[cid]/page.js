'use client';
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import QRCode from "react-qr-code";
import Link from "next/link";

export default function FileByCID() {
  const { cid } = useParams();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!cid) return;
    const fetchFile = async () => {
      const { data, error } = await supabase
        .from("file_hashes")
        .select("*")
        .eq("ipfs_cid", cid)
        .single();
      if (data) setFile(data);
      setLoading(false);
    };
    fetchFile();
  }, [cid]);

  if (loading) return <p className="p-6">Loading...</p>;
  if (!file) return <p className="p-6 text-red-600">No file found for CID: {cid}</p>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Public File Verification</h1>
      <p><strong>File Name:</strong> {file.file_name}</p>
      <p><strong>Uploaded by:</strong> {file.user_wallet}</p>
      <p><strong>Uploaded on:</strong> {new Date(file.created_at).toLocaleString()}</p>
      <p><strong>SHA-256:</strong> <span className="break-all">{file.sha256}</span></p>

      {file.blockchain_tx ? (
        <p className="mt-2 text-green-700">
          ✅ Verified on Blockchain.{" "}
          <Link href={`/tx/${file.blockchain_tx}`} className="underline text-blue-600">
            View TX
          </Link>
        </p>
      ) : (
        <p className="mt-2 text-yellow-700">⚠️ Not registered on-chain</p>
      )}

      <div className="mt-4">
        <a
          href={`https://gateway.pinata.cloud/ipfs/${cid}`}
          target="_blank"
          className="text-blue-600 underline"
        >
          View File on IPFS
        </a>
      </div>

      <div className="mt-6">
        <QRCode value={`https://gateway.pinata.cloud/ipfs/${cid}`} size={128} />
      </div>
    </div>
  );
}
