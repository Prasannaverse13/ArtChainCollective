// Script to deploy a contract to Stellar Testnet
import StellarSdk from 'stellar-sdk';
import fetch from 'node-fetch';

// Generate a new keypair
const keypair = StellarSdk.Keypair.random();
const publicKey = keypair.publicKey();
const secretKey = keypair.secret();

console.log('🔑 New Stellar keypair generated:');
console.log(`Public Key: ${publicKey}`);
console.log(`Secret Key: ${secretKey}`);
console.log('\n⚠️ IMPORTANT: Save your secret key somewhere safe!');

// Fund the account using Friendbot
const friendbotUrl = `https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`;
console.log(`\n💰 Funding account with Friendbot...`);

fetch(friendbotUrl)
  .then(response => response.json())
  .then(data => {
    console.log('✅ Account funded successfully!');
    console.log(`\n🔍 View your account on Stellar Expert:`);
    console.log(`https://testnet.stellar.expert/explorer/testnet/account/${publicKey}`);
    
    // Now set up the smart contract (data entries)
    setupContract(keypair);
  })
  .catch(error => console.error('❌ Error funding account:', error));

// Set up the smart contract data entries
async function setupContract(keypair) {
  try {
    // Connect to Stellar Testnet
    const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');
    const account = await server.loadAccount(keypair.publicKey());
    
    // Define the transaction
    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: StellarSdk.Networks.TESTNET
    });
    
    // Add data entries to represent the smart contract
    transaction.addOperation(
      StellarSdk.Operation.manageData({
        name: 'ArtChain_Contract',
        value: 'v1.0'
      })
    );
    
    transaction.addOperation(
      StellarSdk.Operation.manageData({
        name: 'ArtChain_Type',
        value: 'NFT_Platform'
      })
    );
    
    transaction.addOperation(
      StellarSdk.Operation.manageData({
        name: 'ArtChain_Creator',
        value: 'ArtChain_Team'
      })
    );
    
    // Finalize the transaction
    const builtTx = transaction.setTimeout(30).build();
    
    // Sign the transaction
    builtTx.sign(keypair);
    
    console.log('\n📝 Deploying contract data...');
    
    // Submit the transaction
    const result = await server.submitTransaction(builtTx);
    console.log('✅ Contract deployed successfully!');
    console.log(`📊 Transaction hash: ${result.hash}`);
    console.log(`\n🚀 Your ArtChain contract is now live on the Stellar Testnet!`);
    console.log(`https://testnet.stellar.expert/explorer/testnet/account/${keypair.publicKey()}`);
    
    // Update environment file with the new contract address
    console.log(`\n✏️ Add this to your .env file:`);
    console.log(`VITE_STELLAR_CONTRACT_ADDRESS="${keypair.publicKey()}"`);
    
  } catch (error) {
    console.error('❌ Error setting up contract:', error);
  }
}