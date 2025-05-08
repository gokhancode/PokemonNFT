const hre = require("hardhat");
require('dotenv').config({ path: '.env.local' });

async function main() {
  const [signer] = await hre.ethers.getSigners();
  console.log("Checking ownership with account:", signer.address);

  // Get contract addresses
  const nftAddress = process.env.NEXT_PUBLIC_POKEMON_NFT_ADDRESS;
  const tradingAddress = process.env.NEXT_PUBLIC_POKEMON_TRADING_ADDRESS;
  if (!nftAddress || !tradingAddress) {
    throw new Error('Contract addresses not found in .env.local');
  }

  const PokemonNFT = await hre.ethers.getContractAt("PokemonNFT", nftAddress);
  const PokemonTrading = await hre.ethers.getContractAt("PokemonTrading", tradingAddress);

  // Get total supply
  const totalSupply = await PokemonNFT.totalSupply();
  console.log("\nTotal Pokemon NFTs:", totalSupply.toString());

  // Check ownership and listings for each token
  console.log("\nChecking ownership and listings...");
  for (let i = 1; i <= totalSupply.toNumber(); i++) {
    try {
      // Get NFT owner
      const nftOwner = await PokemonNFT.ownerOf(i);
      console.log(`\nToken ${i}:`);
      console.log("NFT Owner:", nftOwner);

      // Get Pokemon details
      const pokemon = await PokemonNFT.getPokemon(i);
      console.log("Name:", pokemon.name);
      console.log("Type 1:", pokemon.type1);
      console.log("Type 2:", pokemon.type2);

      // Check if listed
      const listing = await PokemonTrading.getListing(i);
      if (listing.isListed) {
        console.log("Listed for sale:", true);
        console.log("Price:", hre.ethers.utils.formatEther(listing.price), "ETH");
        console.log("Seller:", listing.seller);
      } else {
        console.log("Listed for sale:", false);
      }

      // Check trading contract approval
      const approved = await PokemonNFT.getApproved(i);
      console.log("Trading contract approved:", approved === tradingAddress);

    } catch (error) {
      console.log(`Token ${i} not found or error:`, error.message);
    }
  }

  // Check user's Pokemon
  console.log("\nChecking user's Pokemon...");
  const balance = await PokemonNFT.balanceOf(signer.address);
  console.log("User's Pokemon count:", balance.toString());

  if (balance.gt(0)) {
    console.log("\nUser's Pokemon details:");
    for (let i = 0; i < balance.toNumber(); i++) {
      const tokenId = await PokemonNFT.tokenOfOwnerByIndex(signer.address, i);
      const pokemon = await PokemonNFT.getPokemon(tokenId);
      console.log(`\nToken ${tokenId}:`);
      console.log("Name:", pokemon.name);
      console.log("Type 1:", pokemon.type1);
      console.log("Type 2:", pokemon.type2);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 