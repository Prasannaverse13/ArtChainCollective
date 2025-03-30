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

// Connect to Freighter wallet
export async function connectFreighter(): Promise<string> {
  try {
    // @ts-ignore - Freighter injects window.freighter
    if (typeof window.freighter === 'undefined') {
      throw new Error('Freighter extension is not installed. Please install Freighter wallet to continue.');
    }
    
    // Check if user is on a supported network
    // @ts-ignore
    const networkDetails = await window.freighter.getNetworkDetails();
    console.log('Freighter network details:', networkDetails);
    
    if (networkDetails && networkDetails.networkPassphrase !== 'Test SDF Network ; September 2015') {
      throw new Error('Please switch to the Stellar Testnet in your Freighter wallet settings.');
    }
    
    // @ts-ignore - Freighter injects window.freighter
    await window.freighter.connect();
    
    // @ts-ignore - Freighter injects window.freighter
    const publicKey = await window.freighter.getPublicKey();
    
    if (!publicKey) {
      throw new Error('Could not retrieve public key from Freighter wallet. Please check your wallet connection.');
    }
    
    return publicKey;
  } catch (error: any) {
    console.error('Failed to connect Freighter wallet:', error);
    throw new Error(error.message || 'Failed to connect to Freighter wallet. Please try again.');
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

// Sign transaction with Freighter
export async function signWithFreighter(xdr: string): Promise<string> {
  try {
    // @ts-ignore - Freighter injects window.freighter
    if (typeof window.freighter === 'undefined') {
      throw new Error('Freighter extension is not installed. Please install Freighter wallet to continue.');
    }
    
    if (!xdr) {
      throw new Error('Invalid transaction: No XDR provided');
    }
    
    // @ts-ignore - Freighter injects window.freighter
    const signedXdr = await window.freighter.signTransaction(xdr, {
      networkPassphrase: 'Test SDF Network ; September 2015'
    });
    
    if (!signedXdr) {
      throw new Error('Transaction signing failed or was cancelled by user');
    }
    
    return signedXdr;
  } catch (error: any) {
    console.error('Failed to sign transaction with Freighter:', error);
    
    // Provide user-friendly error messages
    if (error.message && error.message.includes('User declined')) {
      throw new Error('Transaction signing declined. Please approve the transaction in Freighter.');
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
