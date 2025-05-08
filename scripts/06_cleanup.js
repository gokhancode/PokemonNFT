const hre = require("hardhat");
require('dotenv').config({ path: '.env.local' });

async function main() {
  const [signer] = await hre.ethers.getSigners();
  console.log("Cleaning up with account:", signer.address);

  // Get contract addresses
  const nftAddress = process.env.NEXT_PUBLIC_POKEMON_NFT_ADDRESS;
  const tradingAddress = process.env.NEXT_PUBLIC_POKEMON_TRADING_ADDRESS;
  if (!nftAddress || !tradingAddress) {
    throw new Error('Contract addresses not found in .env.local');
  }

  const PokemonNFT = await hre.ethers.getContractAt("PokemonNFT", nftAddress);
  const PokemonTrading = await hre.ethers.getContractAt("PokemonTrading", tradingAddress);

  // Get user's Pokemon
  const balance = await PokemonNFT.balanceOf(signer.address);
  console.log("\nUser's Pokemon count:", balance.toString());

  if (balance.gt(0)) {
    console.log("\nCleaning up user's Pokemon...");
    for (let i = 0; i < balance.toNumber(); i++) {
      try {
        const tokenId = await PokemonNFT.tokenOfOwnerByIndex(signer.address, i);
        console.log(`\nProcessing token ${tokenId}...`);

        // Check if listed
        const listing = await PokemonTrading.getListing(tokenId);
        if (listing.isListed) {
          console.log("Canceling listing...");
          const cancelTx = await PokemonTrading.cancelListing(tokenId);
          await cancelTx.wait();
          console.log("Listing canceled");
        }

        // Check approval
        const approved = await PokemonNFT.getApproved(tokenId);
        if (approved === tradingAddress) {
          console.log("Revoking trading contract approval...");
          const revokeTx = await PokemonNFT.approve(hre.ethers.constants.AddressZero, tokenId);
          await revokeTx.wait();
          console.log("Approval revoked");
        }

        // Get Pokemon details
        const pokemon = await PokemonNFT.getPokemon(tokenId);
        console.log("Pokemon:", pokemon.name);

      } catch (error) {
        console.error(`Error processing token ${i}:`, error);
      }
    }
  }

  // Verify cleanup
  console.log("\nVerifying cleanup...");
  for (let i = 0; i < balance.toNumber(); i++) {
    try {
      const tokenId = await PokemonNFT.tokenOfOwnerByIndex(signer.address, i);
      
      // Check listing
      const listing = await PokemonTrading.getListing(tokenId);
      console.log(`\nToken ${tokenId}:`);
      console.log("Listed:", listing.isListed);
      
      // Check approval
      const approved = await PokemonNFT.getApproved(tokenId);
      console.log("Approved:", approved);
      
    } catch (error) {
      console.error(`Error verifying token ${i}:`, error);
    }
  }

  console.log("\nCleanup completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 