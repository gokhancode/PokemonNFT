const hre = require("hardhat");
const fs = require('fs');
const csv = require('csv-parser');

async function main() {
  // Read the contract address from .env.local
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const nftAddressMatch = envContent.match(/NEXT_PUBLIC_POKEMON_NFT_ADDRESS=(.*)/);
  if (!nftAddressMatch) {
    throw new Error('Could not find NFT contract address in .env.local');
  }
  const nftAddress = "0xEc61BB4be54571c7Aa7075A9FF6f24F488286134";
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
      
      // Only mint the first 3 Pokemon for now
      const pokemonToMint = results.slice(0, 3);
      
      for (const pokemon of pokemonToMint) {
        try {
          console.log(`Minting ${pokemon.name}...`);
          
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
          
          await tx.wait();
          console.log(`Successfully minted ${pokemon.name}!`);
          
          // Add a small delay between mints to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 2000));
          
        } catch (error) {
          console.error(`Error minting ${pokemon.name}:`, error);
        }
      }
      
      console.log("Minting process completed!");
      process.exit(0);
    });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
}); 