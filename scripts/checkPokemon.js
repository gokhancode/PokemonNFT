const hre = require("hardhat");
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

async function main() {
  const [signer] = await hre.ethers.getSigners();
  console.log("Checking with account:", signer.address);

  // Check NFT contract
  const nftAddress = "0xEc61BB4be54571c7Aa7075A9FF6f24F488286134";
  console.log("\nChecking NFT contract:", nftAddress);
  const nftContract = await hre.ethers.getContractAt("PokemonNFT", nftAddress);
  
  for (let i = 1; i <= 5; i++) {
    try {
      const owner = await nftContract.ownerOf(i);
      console.log(`Token ${i} owner (NFT):`, owner);
    } catch (error) {
      console.log(`Token ${i} not found in NFT contract`);
    }
  }

  // Check trading contract
  const tradingAddress = "0xacb0F4Dc94838D3Aa015C67a546904a59A50635e";
  console.log("\nChecking trading contract:", tradingAddress);
  const tradingContract = await hre.ethers.getContractAt("PokemonTrading", tradingAddress);
  
  for (let i = 1; i <= 5; i++) {
    try {
      const owner = await tradingContract.ownerOf(i);
      console.log(`Token ${i} owner (Trading):`, owner);
    } catch (error) {
      console.log(`Token ${i} not found in trading contract`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 