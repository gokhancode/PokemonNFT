const hre = require("hardhat");
require('dotenv').config({ path: '.env.local' });

async function main() {
  const [signer] = await hre.ethers.getSigners();
  console.log("Testing minting with account:", signer.address);

  // Get contract addresses
  const nftAddress = process.env.NEXT_PUBLIC_POKEMON_NFT_ADDRESS;
  if (!nftAddress) {
    throw new Error('NFT contract address not found in .env.local');
  }

  const PokemonNFT = await hre.ethers.getContractAt("PokemonNFT", nftAddress);
  
  // Test minting different Pokemon
  const testPokemon = [
    {
      name: "Pikachu",
      number: 25,
      type1: "Electric",
      type2: "",
      hp: 35,
      attack: 55,
      defense: 40,
      speed: 90,
      special: 50,
      imageUrl: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png",
      description: "When Pikachu meet, they touch tails and communicate by sending electrical signals."
    },
    {
      name: "Charizard",
      number: 6,
      type1: "Fire",
      type2: "Flying",
      hp: 78,
      attack: 84,
      defense: 78,
      speed: 100,
      special: 85,
      imageUrl: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/6.png",
      description: "It spits fire that is hot enough to melt boulders. It may cause forest fires by blowing flames."
    }
  ];

  for (const pokemon of testPokemon) {
    try {
      console.log(`\nMinting ${pokemon.name}...`);
      const tx = await PokemonNFT.mintPokemon(
        pokemon.number,
        pokemon.name,
        pokemon.type1,
        pokemon.type2,
        pokemon.hp,
        pokemon.attack,
        pokemon.defense,
        pokemon.speed,
        pokemon.special,
        pokemon.imageUrl,
        pokemon.description
      );

      console.log("Transaction sent, waiting for confirmation...");
      const receipt = await tx.wait();
      
      // Get the token ID from the event
      const event = receipt.events.find(e => e.event === "PokemonMinted");
      const tokenId = event.args.tokenId;
      
      console.log("Transaction confirmed! Token ID:", tokenId.toString());

      // Verify the minted Pokemon
      const mintedPokemon = await PokemonNFT.getPokemon(tokenId);
      console.log("\nMinted Pokemon Stats:");
      console.log("Name:", mintedPokemon.name);
      console.log("Type 1:", mintedPokemon.type1);
      console.log("Type 2:", mintedPokemon.type2);
      console.log("HP:", mintedPokemon.hp.toString());
      console.log("Attack:", mintedPokemon.attack.toString());
      console.log("Defense:", mintedPokemon.defense.toString());
      console.log("Speed:", mintedPokemon.speed.toString());
      console.log("Special:", mintedPokemon.special.toString());

      // Add a small delay between mints
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`Error minting ${pokemon.name}:`, error);
    }
  }

  // Get total supply
  const totalSupply = await PokemonNFT.totalSupply();
  console.log("\nTotal Pokemon NFTs:", totalSupply.toString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 