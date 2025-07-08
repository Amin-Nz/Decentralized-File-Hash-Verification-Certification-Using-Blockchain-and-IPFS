export const CONTRACT_ADDRESS = "0xbb78cac13262039347B1aEe6515ccb490C5dD55E";

export const CONTRACT_ABI = [
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "uploader", type: "address" },
      { indexed: true, internalType: "string", name: "fileHash", type: "string" },
      { indexed: false, internalType: "string", name: "fileName", type: "string" },
      { indexed: false, internalType: "string", name: "tag", type: "string" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" }
    ],
    name: "FileRegistered",
    type: "event"
  },
  {
    inputs: [{ internalType: "string", name: "fileHash", type: "string" }],
    name: "getFileInfo",
    outputs: [
      {
        components: [
          { internalType: "address", name: "uploader", type: "address" },
          { internalType: "string", name: "fileName", type: "string" },
          { internalType: "string", name: "tag", type: "string" },
          { internalType: "uint256", name: "timestamp", type: "uint256" }
        ],
        internalType: "struct DecentralizedHashRegistry.FileEntry",
        name: "",
        type: "tuple"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "string", name: "fileHash", type: "string" }],
    name: "isRegistered",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "string", name: "fileHash", type: "string" },
      { internalType: "string", name: "fileName", type: "string" },
      { internalType: "string", name: "tag", type: "string" }
    ],
    name: "registerFile",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ internalType: "string", name: "", type: "string" }],
    name: "registry",
    outputs: [
      { internalType: "address", name: "uploader", type: "address" },
      { internalType: "string", name: "fileName", type: "string" },
      { internalType: "string", name: "tag", type: "string" },
      { internalType: "uint256", name: "timestamp", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  }
];
