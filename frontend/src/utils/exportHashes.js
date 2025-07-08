    // src/utils/exportHashes.js

export function exportToCSV(hashes) {
  if (!Array.isArray(hashes)) return;

  const csvHeader = [
    "file_name",
    "file_size",
    "file_type",
    "sha256",
    "sha1",
    "simple_hash",
    "ipfs_cid",
    "note",
    "created_at",
  ];

  const csvRows = hashes.map((h) => [
    h.file_name,
    h.file_size,
    h.file_type,
    h.sha256,
    h.sha1,
    h.simple_hash,
    h.ipfs_cid || "",
    h.note || "",
    h.created_at,
  ]);

  const csvContent = [
    csvHeader.join(","),
    ...csvRows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "hashes.csv";
  a.click();
  URL.revokeObjectURL(url);
}
