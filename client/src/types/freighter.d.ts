// Type definitions for Freighter wallet browser extension
// This adds the freighter property to the global window object

interface FreighterAPI {
  isConnected: () => Promise<boolean>;
  getPublicKey: () => Promise<string>;
  signTransaction: (
    xdr: string,
    opts?: {
      networkPassphrase?: string;
    }
  ) => Promise<string>;
  connect: () => Promise<void>;
  getNetworkDetails: () => Promise<{
    networkPassphrase: string;
    networkUrl: string;
  }>;
  setNetworkDetails?: (details: {
    networkPassphrase: string;
    networkUrl: string;
  }) => Promise<void>;
}

interface Window {
  freighter?: FreighterAPI;
  ethereum?: {
    isMetaMask?: boolean;
    request: (request: { method: string; params?: any[] }) => Promise<any>;
  };
}