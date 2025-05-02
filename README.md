# Pokemon NFT Marketplace

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

## Getting Started

1. Connect your MetaMask wallet to Sepolia testnet
2. Get some Sepolia ETH from a faucet
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
