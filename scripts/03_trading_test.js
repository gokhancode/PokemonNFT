const hre = require("hardhat");
require('dotenv').config({ path: '.env.local' });

async function main() {
  const [signer, otherSigner] = await hre.ethers.getSigners();
  console.log("Testing trading with accounts:");
  console.log("Trader:", signer.address);
  console.log("Other:", otherSigner.address);

  // Get contract addresses
  const nftAddress = process.env.NEXT_PUBLIC_POKEMON_NFT_ADDRESS;
  const tradingAddress = process.env.NEXT_PUBLIC_POKEMON_TRADING_ADDRESS;
  if (!nftAddress || !tradingAddress) {
    throw new Error('Contract addresses not found in .env.local');
  }

  const PokemonNFT = await hre.ethers.getContractAt("PokemonNFT", nftAddress);
  const PokemonTrading = await hre.ethers.getContractAt("PokemonTrading", tradingAddress);

  // Test 1: List Pokemon for sale
  console.log("\nTest 1: Listing Pokemon for sale");
  try {
    const tokenId = 1; // Assuming we have a token with ID 1
    const price = hre.ethers.utils.parseEther("0.1"); // 0.1 ETH

    console.log(`Listing token ${tokenId} for ${hre.ethers.utils.formatEther(price)} ETH`);
    
    // Approve trading contract
    const approveTx = await PokemonNFT.approve(tradingAddress, tokenId);
    await approveTx.wait();
    console.log("Approved trading contract");

    // List for sale
    const listTx = await PokemonTrading.listPokemon(tokenId, price);
    await listTx.wait();
    console.log("Listed Pokemon for sale");

    // Verify listing
    const listing = await PokemonTrading.getListing(tokenId);
    console.log("Listing verified:", listing.isListed);
    console.log("Listing price:", hre.ethers.utils.formatEther(listing.price));
  } catch (error) {
    console.error("Error in Test 1:", error);
  }

  // Test 2: Buy Pokemon
  console.log("\nTest 2: Buying Pokemon");
  try {
    const tokenId = 2; // Assuming we have a token with ID 2
    const price = hre.ethers.utils.parseEther("0.2"); // 0.2 ETH

    console.log(`Buying token ${tokenId} for ${hre.ethers.utils.formatEther(price)} ETH`);
    
    // Buy Pokemon
    const buyTx = await PokemonTrading.connect(otherSigner).buyPokemon(tokenId, { value: price });
    await buyTx.wait();
    console.log("Bought Pokemon");

    // Verify ownership
    const newOwner = await PokemonNFT.ownerOf(tokenId);
    console.log("New owner:", newOwner);
    console.log("Expected owner:", otherSigner.address);
  } catch (error) {
    console.error("Error in Test 2:", error);
  }

  // Test 3: Cancel listing
  console.log("\nTest 3: Canceling listing");
  try {
    const tokenId = 3; // Assuming we have a token with ID 3

    console.log(`Canceling listing for token ${tokenId}`);
    
    // Cancel listing
    const cancelTx = await PokemonTrading.cancelListing(tokenId);
    await cancelTx.wait();
    console.log("Canceled listing");

    // Verify cancellation
    const listing = await PokemonTrading.getListing(tokenId);
    console.log("Listing canceled:", !listing.isListed);
  } catch (error) {
    console.error("Error in Test 3:", error);
  }

  // Test 4: Update listing price
  console.log("\nTest 4: Updating listing price");
  try {
    const tokenId = 4; // Assuming we have a token with ID 4
    const newPrice = hre.ethers.utils.parseEther("0.15"); // 0.15 ETH

    console.log(`Updating price for token ${tokenId} to ${hre.ethers.utils.formatEther(newPrice)} ETH`);
    
    // Update price
    const updateTx = await PokemonTrading.updateListingPrice(tokenId, newPrice);
    await updateTx.wait();
    console.log("Updated listing price");

    // Verify new price
    const listing = await PokemonTrading.getListing(tokenId);
    console.log("New price:", hre.ethers.utils.formatEther(listing.price));
  } catch (error) {
    console.error("Error in Test 4:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 