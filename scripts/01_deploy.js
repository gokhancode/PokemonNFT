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

  // Update or add contract addresses
  const updates = {
    'NEXT_PUBLIC_POKEMON_NFT_ADDRESS': pokemonNFT.address,
    'NEXT_PUBLIC_POKEMON_TRADING_ADDRESS': pokemonTrading.address
  };

  for (const [key, value] of Object.entries(updates)) {
    if (envContent.includes(`${key}=`)) {
      envContent = envContent.replace(
        new RegExp(`${key}=.*`),
        `${key}=${value}`
      );
    } else {
      envContent += `\n${key}=${value}`;
    }
  }

  fs.writeFileSync(envPath, envContent);
  console.log("\nUpdated .env.local with new contract addresses");

  // Verify contracts on Etherscan
  console.log("\nVerifying contracts on Etherscan...");
  try {
    await hre.run("verify:verify", {
      address: pokemonNFT.address,
      constructorArguments: [],
    });
    console.log("PokemonNFT verified on Etherscan");

    await hre.run("verify:verify", {
      address: pokemonTrading.address,
      constructorArguments: [pokemonNFT.address],
    });
    console.log("PokemonTrading verified on Etherscan");
  } catch (error) {
    console.error("Verification failed:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 