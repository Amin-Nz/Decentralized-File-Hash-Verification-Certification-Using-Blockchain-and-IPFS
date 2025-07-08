// src/utils/ipfs.js
export async function uploadToIPFS(file) {
  const formData = new FormData();
  formData.append("file", file);

  const metadata = {
    name: file.name,
    keyvalues: {
      originalName: file.name,
    },
  };
  formData.append("pinataMetadata", JSON.stringify(metadata));

  const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`, // Add this to .env.local
    },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error("IPFS upload failed: " + JSON.stringify(err));
  }

  const json = await res.json();
  return json.IpfsHash;
}
