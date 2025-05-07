# Pokemon NFT Marketplace

<p align="center">
  <img src="pokeball.png" alt="Pokeball" width="50" height="50">
</p>

A decentralized marketplace for trading Pokemon as NFTs on the Ethereum blockchain (Sepolia testnet). This project combines the beloved world of Pokemon with blockchain technology, allowing users to mint, trade, and auction Pokemon as unique digital assets.

## Features

### Pokemon NFTs
- Mint Pokemon as unique NFTs with randomized stats
- Each Pokemon has:
  - Base stats (HP, Attack, Defense, Speed, Special)
  - Types (Primary and Secondary)
  - Custom description
  - Official Pokemon artwork

### Trading System
- **Direct Sales**: List Pokemon for a fixed price
- **Auctions**: Start timed auctions with:
  - Starting bid price
  - Duration
  - Automatic completion
- Cancel listings or auctions at any time
- View all Pokemon currently on sale or in auction 

### User Interface
- Modern, responsive design
- Real-time updates for:
  - Pokemon listings
  - Auction status
  - Bid history
- Easy-to-use forms for minting and listing
- Comprehensive Pokemon stats display

## Smart Contracts

The marketplace is powered by two main smart contracts:

1. **PokemonNFT**
   - ERC721 compliant
   - Handles Pokemon minting
   - Stores Pokemon metadata and stats
   - Manages ownership and transfers

2. **PokemonTrading**
   - Manages listings and auctions
   - Handles secure trading logic
   - Processes payments and transfers
   - Includes safety features and checks

## Technology Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Blockchain**: Ethereum (Sepolia), Hardhat, Ethers.js
- **Smart Contracts**: Solidity
- **Testing**: Chai, Waffle
- **Development**: TypeScript, ESLint

## Setup Instructions (Mac, Windows, Linux)

### Prerequisites
- **Node.js** (v18 or later recommended)
- **npm** (comes with Node.js)
- **Git**
- **MetaMask** browser extension (for interacting with the dApp)

#### Optional (for local blockchain development):
- **Hardhat** (installed via npm)
- **A code editor** (e.g., VS Code)

---

### 1. Clone the Repository
```sh
git clone https://github.com/gokhancode/PokemonNFT.git
cd PokemonNFT
```

---

### 2. Install Dependencies
```sh
npm install
```

---

### 3. Environment Setup
Create a `.env.local` file in the root directory for environment variables (if needed for API keys, etc). For local development, this is usually not required unless you want to use custom RPC endpoints.

---

### 4. Running a Local Blockchain (Optional, for local testing)
You can use Hardhat's built-in local node:

#### Mac/Linux/Windows (in project root):
```sh
npx hardhat node
```
This will start a local Ethereum blockchain at `http://127.0.0.1:8545` with test accounts preloaded with ETH.

---

### 5. Deploy Smart Contracts
#### To Local Network:
Open a new terminal in the project root and run:
```sh
npx hardhat run scripts/deploy.js --network localhost
```
- Note the contract addresses output after deployment.
- Update your frontend config (e.g., in `context/Web3Context.tsx`) with these addresses.

#### To Sepolia Testnet:
- Set up your `.env.local` with your Sepolia RPC URL and private key.
- Run:
```sh
npx hardhat run scripts/deploy.js --network sepolia
```

---

### 6. Configure MetaMask
- For local: Add the `localhost 8545` network and import one of the test private keys from the Hardhat node output.
- For Sepolia: Switch to Sepolia and ensure you have test ETH (get from a faucet).

---

### 7. Start the Frontend
```sh
npm run dev
```
- The app will be available at `http://localhost:3000`

---

### 8. Usage
- **Mint**: Go to the Mint page and mint a Pokémon NFT.
- **List**: Go to the List page to list your Pokémon for sale or auction.
- **Buy/Bid**: Go to the Marketplace to buy or bid on Pokémon.

---

### Platform Notes
- **Mac/Linux**: All commands above work as shown.
- **Windows**: Use Git Bash, WSL, or PowerShell. If you encounter issues with `npx` or scripts, try running your terminal as administrator.

---

### Troubleshooting
- If you see errors about missing dependencies, run `npm install` again.
- If contracts are not found, make sure you updated the contract addresses in the frontend after deployment.
- For MetaMask connection issues, ensure your wallet is on the correct network (localhost or Sepolia).

## Getting Started

See the [Setup Instructions](#setup-instructions-mac-windows-linux) above for detailed steps on installing dependencies, deploying contracts, and running the app.

1. Connect your MetaMask wallet to Sepolia testnet or your local Hardhat node
2. Get some Sepolia ETH from a faucet (if using Sepolia)
3. Start minting and trading Pokemon!

## Usage

### Minting Pokemon
1. Navigate to the Mint page
2. Choose a Pokemon to mint
3. Confirm the transaction
4. Your new Pokemon NFT will appear in your collection

### Listing Pokemon
1. Go to the List page
2. Select a Pokemon from your collection
3. Choose between direct sale or auction
4. Set your price or auction parameters
5. Confirm the listing

### Buying Pokemon
1. Browse the Marketplace
2. Find a Pokemon you like
3. Either:
   - Buy directly at the listed price
   - Place a bid in an auction
4. Confirm the transaction

## Security Features

- Reentrancy protection
- Secure fund handling
- Owner-only administrative functions
- Emergency pause functionality
- Comprehensive error handling 

## Legal Disclaimer

Pokémon and all related media, including images and data, are registered trademarks of Nintendo, The Pokémon Company, and Game Freak. This project is for educational purposes only and is not affiliated with, endorsed, sponsored, or specifically approved by Nintendo, The Pokémon Company, or Game Freak.

All Pokémon content and materials are protected by copyright and other intellectual property rights. This project acknowledges these rights and does not claim ownership of any Pokémon-related intellectual property. 
