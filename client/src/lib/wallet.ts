// Wallet integration for Freighter and MetaMask
import { submitSignedTransaction } from './stellar';

// Types
export type WalletType = 'freighter' | 'metamask' | null;

export interface WalletInfo {
  isConnected: boolean;
  address: string | null;
  type: WalletType;
  displayAddress: string | null;
}

// Check if Freighter is available in the browser
export function isFreighterInstalled(): boolean {
  try {
    // @ts-ignore - Freighter injects window.freighter
    return typeof window.freighter !== 'undefined';
  } catch (e) {
    console.error('Error checking Freighter installation:', e);
    return false;
  }
}

// Check if MetaMask is available in the browser
export function isMetaMaskInstalled(): boolean {
  try {
    // @ts-ignore - MetaMask injects window.ethereum
    return typeof window.ethereum !== 'undefined';
  } catch (e) {
    console.error('Error checking MetaMask installation:', e);
    return false;
  }
}

// Connect to Freighter wallet with improved error handling and SEP-10 auth preparation
export async function connectFreighter(): Promise<string> {
  try {
    // @ts-ignore - Freighter injects window.freighter
    if (typeof window.freighter === 'undefined') {
      throw new Error('Freighter extension is not installed. Please install Freighter wallet to continue.');
    }

    // Check if Freighter is connected to the correct network
    // @ts-ignore
    const networkDetails = await window.freighter.getNetworkDetails();
    console.log('Freighter network details:', networkDetails);
    
    const TESTNET_PASSPHRASE = 'Test SDF Network ; September 2015';
    
    if (networkDetails && networkDetails.networkPassphrase !== TESTNET_PASSPHRASE) {
      console.warn('Freighter is not on Testnet, attempting to switch...');
      
      try {
        // @ts-ignore - Try to switch network - this may not work depending on Freighter version
        if (window.freighter.setNetworkDetails) {
          await window.freighter.setNetworkDetails({
            networkPassphrase: TESTNET_PASSPHRASE,
            networkUrl: 'https://horizon-testnet.stellar.org'
          });
          console.log('Successfully switched to Testnet');
        } else {
          throw new Error('Please switch to the Stellar Testnet in your Freighter wallet settings.');
        }
      } catch (switchError) {
        console.error('Failed to switch network:', switchError);
        throw new Error('Please switch to the Stellar Testnet in your Freighter wallet settings.');
      }
    }
    
    // Explicitly request user permission to connect
    // @ts-ignore - Freighter injects window.freighter
    console.log('Requesting Freighter connection...');
    await window.freighter.connect();
    console.log('Freighter connected successfully');
    
    // Retrieve the user's public key
    // @ts-ignore - Freighter injects window.freighter
    const publicKey = await window.freighter.getPublicKey();
    
    if (!publicKey) {
      throw new Error('Could not retrieve public key from Freighter wallet. Please check your wallet connection.');
    }
    
    console.log('Connected to Freighter with public key:', publicKey);
    
    // Check if the provided account is valid/activated on the network
    // We'll do this check in the stellar.ts getAccountDetails
    
    return publicKey;
  } catch (error: any) {
    console.error('Failed to connect Freighter wallet:', error);
    // Provide more helpful error messages
    if (error.message && error.message.includes('User declined')) {
      throw new Error('Connection rejected. Please approve the connection request in Freighter wallet.');
    } else if (error.message) {
      throw new Error(error.message);
    } else {
      throw new Error('Failed to connect to Freighter wallet. Please try again or refresh the page.');
    }
  }
}

// Connect to MetaMask wallet
export async function connectMetaMask(): Promise<string> {
  try {
    // @ts-ignore - MetaMask injects window.ethereum
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask extension is not installed. Please install MetaMask to continue.');
    }
    
    // @ts-ignore - MetaMask injects window.ethereum
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    
    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts found in MetaMask. Please create or unlock an account.');
    }
    
    return accounts[0];
  } catch (error: any) {
    console.error('Failed to connect MetaMask wallet:', error);
    
    // Provide user-friendly error messages
    if (error.code === 4001) {
      throw new Error('Connection rejected. Please approve the connection request in MetaMask.');
    } else if (error.message) {
      throw new Error(error.message);
    } else {
      throw new Error('Failed to connect to MetaMask wallet. Please try again.');
    }
  }
}

// Sign transaction with Freighter following SEP-10 authentication guidelines
export async function signWithFreighter(xdr: string): Promise<string> {
  try {
    // @ts-ignore - Freighter injects window.freighter
    if (typeof window.freighter === 'undefined') {
      throw new Error('Freighter extension is not installed. Please install Freighter wallet to continue.');
    }
    
    if (!xdr) {
      throw new Error('Invalid transaction: No XDR provided');
    }
    
    console.log('Requesting Freighter to sign transaction...');
    
    const TESTNET_PASSPHRASE = 'Test SDF Network ; September 2015';
    
    // @ts-ignore - Freighter injects window.freighter
    const signedXdr = await window.freighter.signTransaction(xdr, {
      networkPassphrase: TESTNET_PASSPHRASE
    });
    
    if (!signedXdr) {
      throw new Error('Transaction signing failed or was cancelled by user');
    }
    
    console.log('Transaction signed successfully by Freighter');
    return signedXdr;
  } catch (error: any) {
    console.error('Failed to sign transaction with Freighter:', error);
    
    // Provide user-friendly error messages
    if (error.message && error.message.includes('User declined')) {
      throw new Error('Transaction signing declined. Please approve the transaction in Freighter.');
    } else if (error.message && error.message.includes('Request failed')) {
      throw new Error('Failed to connect to Freighter. Please make sure the extension is unlocked and try again.');
    } else if (error.message && error.message.includes('timeout')) {
      throw new Error('Connection to Freighter timed out. Please try again or refresh the page.');
    } else if (error.message) {
      throw new Error(error.message);
    } else {
      throw new Error('Failed to sign transaction with Freighter. Please try again.');
    }
  }
}

// Sign and submit transaction with Freighter
export async function signAndSubmitWithFreighter(xdr: string) {
  try {
    if (!xdr) {
      throw new Error('Invalid transaction: No XDR provided');
    }
    
    const signedXdr = await signWithFreighter(xdr);
    
    // Then submit the signed transaction
    const result = await submitSignedTransaction(signedXdr);
    return result;
  } catch (error: any) {
    console.error('Failed to sign and submit transaction:', error);
    
    if (error.message) {
      throw new Error(error.message);
    } else {
      throw new Error('Failed to complete transaction. Please try again.');
    }
  }
}

// Format address for display (truncate middle)
export function formatAddress(address: string): string {
  if (!address) return '';
  if (address.length <= 11) return address;
  return `${address.substring(0, 5)}...${address.substring(address.length - 5)}`;
}
