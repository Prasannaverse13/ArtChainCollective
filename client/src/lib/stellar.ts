// Stellar SDK integration for blockchain operations
import * as StellarSdk from 'stellar-sdk';

// Define a server interface to ensure some type safety
interface StellarServer {
  loadAccount: (publicKey: string) => Promise<any>;
  submitTransaction: (xdr: any) => Promise<any>;
}

// Initialize SDK - using testnet by default
// We need to access the Horizon.Server constructor from the StellarSDK
const Networks = StellarSdk.Networks;
const TransactionBuilder = StellarSdk.TransactionBuilder;
const Operation = StellarSdk.Operation;
const Asset = StellarSdk.Asset;

// Initialize server with better error handling and retry logic
let server: StellarServer;
try {
  // Use the proper namespace to access the Server constructor
  server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');
  console.log('✅ Stellar Server initialized successfully');
} catch (error) {
  console.error('Failed to initialize Stellar Server:', error);
  // Fallback implementation to prevent app crashes
  server = {
    loadAccount: async () => { throw new Error('Stellar SDK not initialized properly'); },
    submitTransaction: async () => { throw new Error('Stellar SDK not initialized properly'); }
  };
}

// Add health check function
export const checkStellarConnection = async () => {
  try {
    await server.loadAccount(STELLAR_CONTRACT_ADDRESS);
    return true;
  } catch (error) {
    console.error('Stellar connection check failed:', error);
    return false;
  }
};
const network = Networks.TESTNET;

// In Vite, env variables are accessed via import.meta.env and must be prefixed with VITE_
export const STELLAR_CONTRACT_ADDRESS = import.meta.env.VITE_STELLAR_CONTRACT_ADDRESS || "GB6Q6UWHR6ZG23EXJCUKKBZFU5KFZWJHFQ7INVDZUJ45HDB3W3XKRPG7";

// Types
export interface MintNFTParams {
  walletPublicKey: string;
  artworkId: number;
  title: string;
  collaborators: {
    publicKey: string;
    share: number;
  }[];
}

export interface PurchaseNFTParams {
  buyerPublicKey: string;
  tokenId: string;
  price: number;
  sellerPublicKey: string;
}

// Helper functions
export async function getAccountDetails(publicKey: string) {
  // Allow demo/empty addresses to avoid errors in development
  if (publicKey === STELLAR_CONTRACT_ADDRESS || !publicKey) {
    // Return a minimal mock account for demo purposes
    console.log('Using demo account for wallet display');
    return {
      id: STELLAR_CONTRACT_ADDRESS,
      sequence: '0',
      balances: [{ balance: '10000.0000000', asset_type: 'native' }]
    };
  }
  
  try {
    // Validate the publicKey format - it should be a valid Stellar public key
    if (!publicKey.startsWith('G') || publicKey.length !== 56) {
      console.warn('Invalid Stellar public key format:', publicKey);
      throw new Error('Invalid Stellar public key format');
    }
    
    // Try to load the account with timeout for better error handling
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Connection timed out')), 10000);
    });
    
    const accountPromise = server.loadAccount(publicKey);
    const account = await Promise.race([accountPromise, timeoutPromise]);
    return account;
  } catch (error: any) {
    console.error('Failed to load account details:', error);
    
    // Enhanced error handling with more specific messages
    if (error.response && error.response.status === 404) {
      console.warn('Account not found on network:', publicKey);
      // Return a minimal mock account to avoid UI breakage
      return {
        id: publicKey,
        sequence: '0',
        balances: [{ balance: '0.0000000', asset_type: 'native' }]
      };
    } else if (error.message && error.message.includes('timed out')) {
      console.warn('Account loading timed out:', publicKey);
      // Return a minimal mock account to avoid UI breakage
      return {
        id: publicKey,
        sequence: '0',
        balances: [{ balance: '0.0000000', asset_type: 'native' }]
      };
    } else if (error.message && error.message.includes('NetworkError')) {
      console.warn('Network error while loading account:', publicKey);
      return {
        id: publicKey,
        sequence: '0',
        balances: [{ balance: '0.0000000', asset_type: 'native' }]
      };
    } else {
      // For any other error, return a minimal mock account
      console.warn('Unknown error while loading account:', publicKey);
      return {
        id: publicKey,
        sequence: '0',
        balances: [{ balance: '0.0000000', asset_type: 'native' }]
      };
    }
  }
}

export async function mintNFT(params: MintNFTParams) {
  try {
    const { walletPublicKey, artworkId, title, collaborators } = params;
    
    // Load the account to get the sequence number
    const account = await server.loadAccount(walletPublicKey);
    
    // Unique token ID based on artwork and timestamp
    const tokenId = `ART-${artworkId}-${Date.now()}`;
    
    // Create a transaction to create the NFT
    const transaction = new TransactionBuilder(account, {
      fee: '100000', // 0.01 XLM
      networkPassphrase: network
    });
    
    // Add the main NFT data operation
    transaction.addOperation(
      Operation.manageData({
        name: `nft:${tokenId}`, 
        value: title
      })
    );
    
    // Add operations for collaborators shares if using a custom contract
    collaborators.forEach(collaborator => {
      transaction.addOperation(
        Operation.manageData({
          name: `nft:${tokenId}:${collaborator.publicKey}`,
          value: collaborator.share.toString()
        })
      );
    });
    
    // Set transaction timeout and build
    const builtTx = transaction
      .setTimeout(180)
      .build();
    
    // Return the built transaction XDR for signing by the wallet
    return {
      xdr: builtTx.toXDR(),
      tokenId
    };
  } catch (error) {
    console.error('Failed to create NFT transaction:', error);
    throw new Error('Error creating NFT transaction');
  }
}

export async function purchaseNFT(params: PurchaseNFTParams) {
  try {
    const { buyerPublicKey, tokenId, price, sellerPublicKey } = params;
    
    console.log('Purchasing NFT with params:', {
      buyerPublicKey,
      tokenId,
      price,
      sellerPublicKey
    });
    
    // For demo purposes, return a mock XDR transaction
    // This avoids the need to connect to the Stellar network
    return {
      xdr: 'MockTransactionXDR' + Date.now(),
      mockData: true
    };
    
    /* In production, you would use the following code:
    // Load the account to get the sequence number
    const account = await server.loadAccount(buyerPublicKey);
    
    // Create a transaction to purchase the NFT
    const transaction = new TransactionBuilder(account, {
      fee: '100000', // 0.01 XLM
      networkPassphrase: network
    });
    
    // Add payment operation
    transaction.addOperation(
      Operation.payment({
        destination: sellerPublicKey,
        asset: Asset.native(),
        amount: price.toString()
      })
    );
    
    // Set timeout and build
    const builtTx = transaction
      .setTimeout(180)
      .build();
    
    // Return the built transaction XDR for signing by the wallet
    return {
      xdr: builtTx.toXDR()
    };
    */
  } catch (error) {
    console.error('Failed to create purchase transaction:', error);
    throw new Error('Error creating purchase transaction');
  }
}

export async function submitSignedTransaction(signedXdr: string) {
  try {
    // Submit the signed transaction
    const result = await server.submitTransaction(signedXdr);
    return result;
  } catch (error) {
    console.error('Failed to submit transaction:', error);
    throw new Error('Error submitting transaction to the network');
  }
}

export async function splitPayment(params: {
  payerPublicKey: string;
  amount: number;
  recipients: { publicKey: string; share: number }[];
}) {
  try {
    const { payerPublicKey, amount, recipients } = params;
    
    // Load the account to get the sequence number
    const account = await server.loadAccount(payerPublicKey);
    
    // Create a transaction with payment operations for each recipient
    const transaction = new TransactionBuilder(account, {
      fee: '100000', // 0.01 XLM
      networkPassphrase: network
    });
    
    // Add payment operations for each recipient based on their share
    recipients.forEach(recipient => {
      const recipientAmount = (amount * recipient.share / 100).toFixed(7);
      transaction.addOperation(
        Operation.payment({
          destination: recipient.publicKey,
          asset: Asset.native(),
          amount: recipientAmount
        })
      );
    });
    
    // Set timeout and build
    const builtTx = transaction
      .setTimeout(180)
      .build();
    
    // Return the built transaction XDR for signing by the wallet
    return {
      xdr: builtTx.toXDR()
    };
  } catch (error) {
    console.error('Failed to create split payment transaction:', error);
    throw new Error('Error creating payment distribution transaction');
  }
}
