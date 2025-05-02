const { ethers } = require("hardhat");

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("Minting with account:", signer.address);

  // Get the deployed contract
  const pokemonNFT = await ethers.getContractAt(
    "PokemonNFT",
    "0xBd6eAA8f741321e3Df8CDD8E6143c7c803A3C38a"
  );

  // Mint a Pikachu with known base stats
  console.log("Minting Pikachu...");
  const tx = await pokemonNFT.mintPokemon(
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

  console.log("Transaction sent, waiting for confirmation...");
  const receipt = await tx.wait();
  
  // Get the token ID from the event
  const event = receipt.events.find(e => e.event === "PokemonMinted");
  const tokenId = event.args.tokenId;
  
  console.log("Transaction confirmed! Token ID:", tokenId.toString());

  // Get the Pokemon's stats
  const pokemon = await pokemonNFT.getPokemon(tokenId);
  console.log("\nMinted Pokemon Stats:");
  console.log("Name:", pokemon.name);
  console.log("HP:", pokemon.hp.toString(), "(Base: 35)");
  console.log("Attack:", pokemon.attack.toString(), "(Base: 55)");
  console.log("Defense:", pokemon.defense.toString(), "(Base: 40)");
  console.log("Speed:", pokemon.speed.toString(), "(Base: 90)");
  console.log("Special:", pokemon.special.toString(), "(Base: 50)");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 