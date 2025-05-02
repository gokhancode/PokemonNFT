const hre = require("hardhat");
require('dotenv').config({ path: '.env.local' });

async function main() {
  const [signer] = await hre.ethers.getSigners();
  console.log("Transferring from account:", signer.address);

  // Get the NFT contract
  const nftAddress = "0xEc61BB4be54571c7Aa7075A9FF6f24F488286134";
  console.log("NFT contract address:", nftAddress);
  const nftContract = await hre.ethers.getContractAt("PokemonNFT", nftAddress);

  // Get the recipient address from environment variable
  const recipientAddress = process.env.RECIPIENT_ADDRESS;
  if (!recipientAddress) {
    console.error("Please set RECIPIENT_ADDRESS environment variable");
    process.exit(1);
  }

  console.log("Transferring to address:", recipientAddress);

  // Transfer tokens 1-3
  for (let i = 1; i <= 3; i++) {
    try {
      console.log(`Transferring token ${i}...`);
      const tx = await nftContract.transferFrom(signer.address, recipientAddress, i);
      await tx.wait();
      console.log(`Successfully transferred token ${i}`);
    } catch (error) {
      console.error(`Error transferring token ${i}:`, error);
    }
  }

  console.log("Transfer process completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 