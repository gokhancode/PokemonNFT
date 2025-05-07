const hre = require("hardhat");
const fs = require('fs');
require('dotenv').config();

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy PokemonNFT
  console.log("\nDeploying PokemonNFT...");
  const PokemonNFT = await hre.ethers.getContractFactory("PokemonNFT");
  const pokemonNFT = await PokemonNFT.deploy();
  await pokemonNFT.deployed();
  console.log("PokemonNFT deployed to:", pokemonNFT.address);

  // Deploy PokemonTrading
  console.log("\nDeploying PokemonTrading...");
  const PokemonTrading = await hre.ethers.getContractFactory("PokemonTrading");
  const pokemonTrading = await PokemonTrading.deploy(pokemonNFT.address);
  await pokemonTrading.deployed();
  console.log("PokemonTrading deployed to:", pokemonTrading.address);

  // Update .env.local file
  const envPath = '.env.local';
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  // Update or add PokemonNFT address
  if (envContent.includes('NEXT_PUBLIC_POKEMON_NFT_ADDRESS=')) {
    envContent = envContent.replace(
      /NEXT_PUBLIC_POKEMON_NFT_ADDRESS=.*/,
      `NEXT_PUBLIC_POKEMON_NFT_ADDRESS=${pokemonNFT.address}`
    );
  } else {
    envContent += `\nNEXT_PUBLIC_POKEMON_NFT_ADDRESS=${pokemonNFT.address}`;
  }

  // Update or add PokemonTrading address
  if (envContent.includes('NEXT_PUBLIC_POKEMON_TRADING_ADDRESS=')) {
    envContent = envContent.replace(
      /NEXT_PUBLIC_POKEMON_TRADING_ADDRESS=.*/,
      `NEXT_PUBLIC_POKEMON_TRADING_ADDRESS=${pokemonTrading.address}`
    );
  } else {
    envContent += `\nNEXT_PUBLIC_POKEMON_TRADING_ADDRESS=${pokemonTrading.address}`;
  }

  fs.writeFileSync(envPath, envContent);
  console.log("\nUpdated .env.local with new contract addresses");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 