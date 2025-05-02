const hre = require("hardhat");

async function main() {
  const [signer] = await hre.ethers.getSigners();
  const provider = hre.ethers.provider;
  
  console.log("Checking pending transactions for address:", signer.address);
  
  // Get the current nonce
  const currentNonce = await provider.getTransactionCount(signer.address);
  console.log("Current nonce:", currentNonce);
  
  // Get the pending nonce (includes pending transactions)
  const pendingNonce = await provider.getTransactionCount(signer.address, "pending");
  console.log("Pending nonce:", pendingNonce);
  
  if (pendingNonce > currentNonce) {
    console.log(`Found ${pendingNonce - currentNonce} pending transactions`);
    
    // Get current gas price and increase it by 50%
    const currentGasPrice = await provider.getGasPrice();
    const higherGasPrice = currentGasPrice.mul(150).div(100);
    
    // Create a cancel transaction with higher gas price
    const cancelTx = {
      to: signer.address,
      value: 0,
      nonce: currentNonce,
      gasLimit: 21000,
      gasPrice: higherGasPrice // Use higher gas price
    };
    
    console.log("Sending cancel transaction with 50% higher gas price...");
    const tx = await signer.sendTransaction(cancelTx);
    console.log("Cancel transaction sent:", tx.hash);
    
    await tx.wait();
    console.log("Cancel transaction confirmed");
  } else {
    console.log("No pending transactions found");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 