const hre = require("hardhat");

async function main() {
  const pokemonNFTAddress = "0xAa1536D2d038d5e37cb4F4e5d1BCE45Dc9d67C2C";
  const PokemonNFT = await hre.ethers.getContractAt("PokemonNFT", pokemonNFTAddress);
  
  // Get Pokemon data for token ID 1 (our first minted Pokemon)
  console.log("Getting Pokemon data...");
  const pokemon = await PokemonNFT.getPokemon(1);
  
  console.log("\nPokemon Details:");
  console.log("---------------");
  console.log("Number:", pokemon.number.toString());
  console.log("Name:", pokemon.name);
  console.log("Type 1:", pokemon.type1);
  console.log("Type 2:", pokemon.type2);
  console.log("HP:", pokemon.hp.toString());
  console.log("Attack:", pokemon.attack.toString());
  console.log("Defense:", pokemon.defense.toString());
  console.log("Speed:", pokemon.speed.toString());
  console.log("Special:", pokemon.special.toString());
  console.log("Image URL:", pokemon.imageUrl);
  console.log("Description:", pokemon.description);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 