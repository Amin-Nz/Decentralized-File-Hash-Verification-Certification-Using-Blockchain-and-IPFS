# 🧾 Decentralized File Hash Verification DApp

A full-stack decentralized application (DApp) that allows users to:

- Generate and verify file hashes (SHA-256, SHA-1, SHA-512, etc.)
- Upload files to IPFS
- Register file metadata on the Ethereum blockchain (Sepolia testnet)
- Publicly verify file authenticity using hash or transaction hash

---

## 📚 Table of Contents

- [Demo](#demo)
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Prerequisites](#prerequisites)
- [Folder Structure](#folder-structure)
- [Local Setup](#local-setup)
- [Smart Contract Deployment](#smart-contract-deployment)
- [Running the Frontend](#running-the-frontend)
- [Usage](#usage)
- [Environment Variables](#environment-variables)
- [Security Considerations](#security-considerations)
- [License](#license)

---

## 🚀 Demo

Live preview: _(Insert your deployed app link here)_

---

## ✅ Features

- Connect Ethereum wallet via MetaMask
- Drag and drop or upload a file
- Generate multiple hash algorithms from the file
- Register file hash and metadata on blockchain (Sepolia)
- Store file in IPFS with generated CID
- Save file record and metadata in Supabase
- Publicly verify documents on `/verify` or `/tx/:hash`
- Dashboard with all personal uploaded files
- Filter and search by hash, tags, date, and file name

---

## 🛠️ Technologies Used

| Layer       | Technology                          |
|------------|--------------------------------------|
| Frontend   | Next.js 14, React, TailwindCSS       |
| Backend    | Supabase (PostgreSQL + Storage)      |
| Blockchain | Solidity, Hardhat, Ethers.js         |
| IPFS       | Pinata SDK or Infura (via API)       |
| Wallet     | MetaMask (Ethereum Provider)         |
| Deployment | Vercel (Frontend), Alchemy/Sepolia   |

---

## 🔐 Prerequisites

- Node.js (v18+ recommended)
- MetaMask wallet
- Git
- [Infura](https://infura.io/) or [Alchemy](https://alchemy.com/)
- Supabase account

---

## 📁 Folder Structure

/D-App-FileHash
│
├── /frontend # Next.js frontend
├── /blockchain # Hardhat project with Solidity smart contract
├── /public # Public assets
├── .gitignore
├── README.md


---

## ⚙️ Local Setup

```bash
# Clone the project
git clone https://github.com/your-username/your-repo.git
cd your-repo

# Install frontend dependencies
cd frontend
npm install

# Install blockchain dependencies
cd ../blockchain
npm install
```bash

Create a .env.local file in frontend/ and add:

NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
NEXT_PUBLIC_CONTRACT_ADDRESS=your_deployed_contract_address

For blockchain/.env:

PRIVATE_KEY=your_wallet_private_key
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID

**Smart Contract Deployment**

cd blockchain
npx hardhat compile

# Deploy to Sepolia
npx hardhat run scripts/deploy.js --network sepolia

Once deployed, update NEXT_PUBLIC_CONTRACT_ADDRESS in .env.local.

**Running the Frontend**

cd frontend
npm run dev

Visit http://localhost:3000

**Usage**

**Upload & Hash**

1. Go to /upload

2. Connect your MetaMask wallet

3. Choose or drag a file

4. View hash values (SHA-256, SHA-1, SHA-512)

5. Upload to IPFS (optional)

6. Register on Blockchain

7. Save to database

**Verify File**

1. Go to /verify

2. Upload a file or paste hash

3. Match will be shown if it exists in DB

4. Transaction link to Etherscan is displayed

**Explore Others' Uploads**

/explore: Browse public uploads

/history: Filter & sort all uploaded file hashes

**Public Verification via TX Hash**

/tx/:hash: Show blockchain-verified record using tx hash only



