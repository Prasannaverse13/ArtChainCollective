import { useState, useEffect, useCallback } from 'react';
import { 
  WalletInfo, 
  WalletType, 
  isFreighterInstalled, 
  isMetaMaskInstalled, 
  connectFreighter, 
  connectMetaMask,
  formatAddress
} from '@/lib/wallet';
import { useToast } from '@/hooks/use-toast';

// Local storage key for wallet info
const WALLET_KEY = 'artchain_wallet';

export function useWallet() {
  const [walletInfo, setWalletInfo] = useState<WalletInfo>({
    isConnected: false,
    address: null,
    type: null,
    displayAddress: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Check if wallets are installed - Updated with useEffect to properly detect
  const [walletAvailability, setWalletAvailability] = useState({
    freighter: false,
    metamask: false
  });
  
  // Check wallet availability on component mount and window focus
  useEffect(() => {
    const checkWallets = () => {
      setWalletAvailability({
        freighter: isFreighterInstalled(),
        metamask: isMetaMaskInstalled()
      });
    };
    
    // Initial check
    checkWallets();
    
    // Set up event listener for window focus to recheck
    window.addEventListener('focus', checkWallets);
    
    // Clean up
    return () => {
      window.removeEventListener('focus', checkWallets);
    };
  }, []);

  // Initialize from localStorage
  useEffect(() => {
    const storedWallet = localStorage.getItem(WALLET_KEY);
    if (storedWallet) {
      try {
        const parsed = JSON.parse(storedWallet);
        setWalletInfo({
          ...parsed,
          displayAddress: parsed.address ? formatAddress(parsed.address) : null
        });
      } catch (error) {
        console.error('Failed to parse stored wallet info:', error);
        localStorage.removeItem(WALLET_KEY);
      }
    }
  }, []);

  // Connect to wallet
  const connectWallet = useCallback(async (type: WalletType) => {
    if (!type) return;
    
    setIsLoading(true);
    try {
      let address = '';
      
      if (type === 'freighter') {
        try {
          // Try connecting even if detection failed
          address = await connectFreighter();
          
          // Force update wallet availability since we connected successfully
          setWalletAvailability(prev => ({
            ...prev,
            freighter: true
          }));
        } catch (error: any) {
          console.error('Freighter connection error:', error);
          toast({
            title: 'Freighter Connection Failed',
            description: error.message || 'Unable to connect to Freighter. Please check if it\'s installed.',
            variant: 'destructive'
          });
          setIsLoading(false);
          return;
        }
      } else if (type === 'metamask') {
        try {
          // Try connecting even if detection failed
          address = await connectMetaMask();
          
          // Force update wallet availability since we connected successfully
          setWalletAvailability(prev => ({
            ...prev,
            metamask: true
          }));
        } catch (error: any) {
          console.error('MetaMask connection error:', error);
          toast({
            title: 'MetaMask Connection Failed',
            description: error.message || 'Unable to connect to MetaMask. Please check if it\'s installed.',
            variant: 'destructive'
          });
          setIsLoading(false);
          return;
        }
      }
      
      const walletData = {
        isConnected: true,
        address,
        type,
        displayAddress: formatAddress(address)
      };
      
      setWalletInfo(walletData);
      localStorage.setItem(WALLET_KEY, JSON.stringify(walletData));
      
      toast({
        title: 'Wallet Connected',
        description: `Successfully connected to ${type === 'freighter' ? 'Freighter' : 'MetaMask'}`,
      });
    } catch (error) {
      console.error('Wallet connection error:', error);
      toast({
        title: 'Connection Failed',
        description: 'Failed to connect wallet. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, walletAvailability]);

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    setWalletInfo({
      isConnected: false,
      address: null,
      type: null,
      displayAddress: null,
    });
    localStorage.removeItem(WALLET_KEY);
    
    toast({
      title: 'Wallet Disconnected',
      description: 'Your wallet has been disconnected.',
    });
  }, [toast]);

  return {
    walletInfo,
    isLoading,
    walletAvailability,
    connectWallet,
    disconnectWallet
  };
}
