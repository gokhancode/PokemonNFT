const hre = require("hardhat");

async function main() {
  const pokemonNFTAddress = "0xAa1536D2d038d5e37cb4F4e5d1BCE45Dc9d67C2C";
  const PokemonNFT = await hre.ethers.getContractAt("PokemonNFT", pokemonNFTAddress);
  
  // Test minting a Pokemon
  console.log("Minting a Pokemon NFT...");
  const tx = await PokemonNFT.mintPokemon(
    25,                  // number (Pikachu's Pokedex number)
    "Pikachu",           // name
    "Electric",          // type1
    "",                  // type2 (Pikachu is only Electric type)
    35,                  // hp
    55,                  // attack
    40,                  // defense
    90,                  // speed
    50,                  // special
    "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png", // image URL
    "When Pikachu meet, they touch tails and communicate by sending electrical signals." // description
  );
  
  await tx.wait();
  console.log("Pokemon NFT minted successfully!");
  
  // Get the total supply
  const totalSupply = await PokemonNFT.totalSupply();
  console.log("Total Pokemon NFTs:", totalSupply.toString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 