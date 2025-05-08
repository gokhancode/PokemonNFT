const hre = require("hardhat");
const fs = require('fs');
const csv = require('csv-parser');
require('dotenv').config({ path: '.env.local' });

async function main() {
  const [signer] = await hre.ethers.getSigners();
  console.log("Bulk minting with account:", signer.address);

  // Get contract address
  const nftAddress = process.env.NEXT_PUBLIC_POKEMON_NFT_ADDRESS;
  if (!nftAddress) {
    throw new Error('NFT contract address not found in .env.local');
  }
  console.log("Using NFT contract at:", nftAddress);

  const PokemonNFT = await hre.ethers.getContractFactory("PokemonNFT");
  const pokemonNFT = await PokemonNFT.attach(nftAddress);
  
  console.log("Reading Pokemon data from CSV...");
  
  const results = [];
  fs.createReadStream('pokemon.csv')
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      console.log(`Found ${results.length} Pokemon to mint`);
      
      // Get current total supply
      const totalSupply = await pokemonNFT.totalSupply();
      console.log("Current total supply:", totalSupply.toString());
      
      // Calculate how many more we can mint (assuming max supply is 151)
      const maxToMint = 151 - totalSupply.toNumber();
      const pokemonToMint = results.slice(0, maxToMint);
      
      console.log(`Will mint ${pokemonToMint.length} Pokemon`);
      
      for (const pokemon of pokemonToMint) {
        try {
          console.log(`\nMinting ${pokemon.name}...`);
          
          const tx = await pokemonNFT.mintPokemon(
            parseInt(pokemon.number),
            pokemon.name,
            pokemon.type1,
            pokemon.type2 || "", // Handle empty Type2
            parseInt(pokemon.hp),
            parseInt(pokemon.attack),
            parseInt(pokemon.defense),
            parseInt(pokemon.speed),
            parseInt(pokemon.special),
            pokemon.imageURL,
            pokemon.description
          );
          
          console.log("Transaction sent, waiting for confirmation...");
          const receipt = await tx.wait();
          
          // Get the token ID from the event
          const event = receipt.events.find(e => e.event === "PokemonMinted");
          const tokenId = event.args.tokenId;
          
          console.log(`Successfully minted ${pokemon.name}! Token ID: ${tokenId}`);
          
          // Add a small delay between mints to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 2000));
          
        } catch (error) {
          console.error(`Error minting ${pokemon.name}:`, error);
        }
      }
      
      // Get final total supply
      const finalSupply = await pokemonNFT.totalSupply();
      console.log("\nMinting process completed!");
      console.log("Final total supply:", finalSupply.toString());
      process.exit(0);
    });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
}); 