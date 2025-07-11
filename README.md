# 🧾 Decentralized File Hash Verification DApp

A full-stack decentralized application (DApp) that allows users to:

- Generate and verify file hashes (SHA-256, SHA-1, SHA-512, etc.)
- Upload files to IPFS
- Register file metadata on the Ethereum blockchain (Sepolia testnet)
- Publicly verify file authenticity using hash or transaction hash

---

## 📚 Table of Contents

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

```
# Clone the project
git clone https://github.com/Amin-Nz/Decentralized-File-Hash-Verification-Certification-Using-Blockchain-and-IPFS.git
cd Decentralized-File-Hash-Verification-Certification-Using-Blockchain-and-IPFS

# Install frontend dependencies
cd frontend
npm install

# Install blockchain dependencies
cd ../blockchain
npm install

```

Create a .env.local file in frontend/ and add:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
NEXT_PUBLIC_CONTRACT_ADDRESS=your_deployed_contract_address

```


For blockchain/.env:

```
PRIVATE_KEY=your_wallet_private_key
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID

```

**Smart Contract Deployment**
```
cd blockchain
npx hardhat compile
```
# Deploy to Sepolia
```
npx hardhat run scripts/deploy.js --network sepolia
```
Once deployed, update NEXT_PUBLIC_CONTRACT_ADDRESS in .env.local.

**Running the Frontend**
```
cd frontend
npm run dev
```
Visit http://localhost:3000

---


## 🐳 Docker Deployment

You can run the entire application using Docker for easier setup and consistency.

### Step 1: Build the Docker Image

From the `frontend/` directory:

```bash
docker build -t filehash-dapp .
```

**Step 2: Run the Container**
```
docker run -p 3000:3000 --env-file .env.local filehash-dapp
```

The app will be available at http://localhost:3000

Make sure your .env.local file exists inside frontend/ and contains the required environment variables.

**Optional: Docker Compose**
You can also use Docker Compose if you want to include additional services like a local Supabase instance or reverse proxy (optional).
```
# docker-compose.yml (if needed)
version: '3.8'

services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    env_file:
      - ./frontend/.env.local

```

Run with:
```
docker compose up --build
```
# Usage

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

---

## 🔒 Security Considerations

Private keys are kept securely using .env and never exposed on frontend

Wallet actions (registering) must be confirmed via MetaMask

File content is not stored on blockchain, only metadata and hashes

---

## 💡 Future Improvements

End-to-end file comparison

Digital signatures & certificates

ENS integration for human-readable identities

zkProofs for private verification

---

## 👨‍💻 Author

Created by Mohammadamin Norouzi as a university blockchain project.

Feel free to contribute or fork!
