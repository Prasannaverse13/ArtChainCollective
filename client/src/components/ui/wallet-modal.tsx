import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/hooks/use-wallet';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WalletModal({ isOpen, onClose }: WalletModalProps) {
  const { connectWallet, isLoading, walletAvailability } = useWallet();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-dark-indigo border border-electric-blue/30 shadow-lg shadow-electric-blue/10 max-w-md w-full">
        <div className="absolute inset-0 gradient-border pointer-events-none opacity-50"></div>
        
        <DialogHeader className="relative z-10">
          <DialogTitle className="text-2xl font-orbitron font-bold text-electric-blue mb-6">
            Connect Wallet
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4 space-y-4">
          <button 
            onClick={() => connectWallet('freighter')}
            disabled={isLoading}
            className="w-full py-4 px-6 bg-space-black hover:bg-space-black/70 border border-neon-purple/30 hover:border-neon-purple/70 rounded-lg transition-all duration-200 flex items-center justify-between group disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-neon-purple/10 flex items-center justify-center mr-4">
                <i className="fas fa-wallet text-neon-purple"></i>
              </div>
              <div className="text-left">
                <div className="font-orbitron font-medium text-neon-purple">Freighter</div>
                <div className="text-sm text-light-gray/70">
                  {walletAvailability.freighter 
                    ? 'Connect to your Freighter wallet' 
                    : 'Try connecting to Freighter (refresh if needed)'}
                </div>
              </div>
            </div>
            <i className="fas fa-chevron-right text-neon-purple/50 group-hover:text-neon-purple transition-colors"></i>
          </button>
          
          <button 
            onClick={() => connectWallet('metamask')}
            disabled={isLoading}
            className="w-full py-4 px-6 bg-space-black hover:bg-space-black/70 border border-electric-blue/30 hover:border-electric-blue/70 rounded-lg transition-all duration-200 flex items-center justify-between group disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-electric-blue/10 flex items-center justify-center mr-4">
                <i className="fas fa-fox text-electric-blue"></i>
              </div>
              <div className="text-left">
                <div className="font-orbitron font-medium text-electric-blue">MetaMask</div>
                <div className="text-sm text-light-gray/70">
                  {walletAvailability.metamask 
                    ? 'Connect to your MetaMask wallet' 
                    : 'Try connecting to MetaMask (refresh if needed)'}
                </div>
              </div>
            </div>
            <i className="fas fa-chevron-right text-electric-blue/50 group-hover:text-electric-blue transition-colors"></i>
          </button>
        </div>
        
        <div className="mt-6 pt-4 border-t border-electric-blue/20">
          <p className="text-sm text-light-gray/70 text-center">
            By connecting your wallet, you agree to our <a href="#" className="text-electric-blue hover:underline">Terms of Service</a> and <a href="#" className="text-electric-blue hover:underline">Privacy Policy</a>
          </p>
        </div>
        
        <DialogFooter className="bg-dark-indigo/80 px-0 pt-4 border-t border-electric-blue/20 sm:justify-end">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="w-full sm:w-auto bg-space-black text-light-gray border border-light-gray/30 hover:border-light-gray/60"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default WalletModal;
