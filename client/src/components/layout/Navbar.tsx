import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useWallet } from '@/hooks/use-wallet';
import { WalletModal } from '@/components/ui/wallet-modal';
import { Button } from '@/components/ui/button';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const { walletInfo, disconnectWallet } = useWallet();
  const [location] = useLocation();

  return (
    <>
      <nav className="bg-dark-indigo/80 backdrop-blur-md py-4 px-6 flex justify-between items-center border-b border-electric-blue/30">
        <div className="flex items-center gap-2">
          <Link href="/">
            <a className="text-3xl font-orbitron font-bold text-white">
              ArtChain
            </a>
          </Link>
          <span className="text-xs font-vt323 bg-neon-pink/30 text-neon-pink font-bold px-2 py-0.5 rounded-md border border-neon-pink/50 animate-pulse">BETA</span>
        </div>
        
        <div className="hidden md:flex items-center space-x-8">
          <Link href="/studio">
            <a className={`hover:text-electric-blue transition-colors ${location === '/studio' ? 'text-electric-blue' : 'text-light-gray'}`}>
              Studio
            </a>
          </Link>
          <Link href="/marketplace">
            <a className={`hover:text-electric-blue transition-colors ${location === '/marketplace' ? 'text-electric-blue' : 'text-light-gray'}`}>
              Marketplace
            </a>
          </Link>
          <Link href="/finance">
            <a className={`hover:text-electric-blue transition-colors ${location === '/finance' ? 'text-electric-blue' : 'text-light-gray'}`}>
              Finance
            </a>
          </Link>
          <Link href="/profile">
            <a className={`hover:text-electric-blue transition-colors ${location === '/profile' ? 'text-electric-blue' : 'text-light-gray'}`}>
              My Portfolio
            </a>
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
          {walletInfo.isConnected ? (
            <>
              <div className="hidden md:block connection-indicator text-sm md:text-base font-bold bg-space-black/50 border border-electric-blue/40 rounded-lg px-3 py-1 text-electric-blue">
                <i className="fas fa-check-circle mr-2 text-neon-green"></i>
                {walletInfo.displayAddress}
              </div>
              
              <Button 
                variant="outline"
                onClick={disconnectWallet}
                className="cybr-btn bg-gradient-to-r from-neon-pink to-electric-blue text-white font-medium py-2 px-4 rounded-md hover:animate-glow flex items-center gap-2"
              >
                <i className="fas fa-wallet"></i>
                <span>Disconnect</span>
              </Button>
            </>
          ) : (
            <>
              <div className="hidden md:block connection-indicator disconnected text-sm md:text-base font-bold bg-space-black/50 border border-neon-pink/40 rounded-lg px-3 py-1 text-neon-pink">
                <i className="fas fa-times-circle mr-2"></i>
                Not Connected
              </div>
              
              <Button 
                variant="outline"
                onClick={() => setWalletModalOpen(true)}
                className="cybr-btn bg-gradient-to-r from-neon-purple to-electric-blue text-white font-medium py-2 px-4 rounded-md hover:animate-glow flex items-center gap-2"
              >
                <i className="fas fa-wallet"></i>
                <span>Connect Wallet</span>
              </Button>
            </>
          )}
          
          <button 
            className="md:hidden text-electric-blue text-2xl"
            onClick={() => setIsOpen(!isOpen)}
          >
            <i className={`fas ${isOpen ? 'fa-times' : 'fa-bars'}`}></i>
          </button>
        </div>
      </nav>
      
      {/* Mobile Navigation Menu */}
      {isOpen && (
        <div className="md:hidden bg-dark-indigo/90 backdrop-blur-md px-6 py-4 border-b border-electric-blue/30">
          <div className="flex flex-col space-y-4">
            <Link href="/studio">
              <a 
                className={`hover:text-electric-blue transition-colors ${location === '/studio' ? 'text-electric-blue' : 'text-light-gray'}`}
                onClick={() => setIsOpen(false)}
              >
                Studio
              </a>
            </Link>
            <Link href="/marketplace">
              <a 
                className={`hover:text-electric-blue transition-colors ${location === '/marketplace' ? 'text-electric-blue' : 'text-light-gray'}`}
                onClick={() => setIsOpen(false)}
              >
                Marketplace
              </a>
            </Link>
            <Link href="/finance">
              <a 
                className={`hover:text-electric-blue transition-colors ${location === '/finance' ? 'text-electric-blue' : 'text-light-gray'}`}
                onClick={() => setIsOpen(false)}
              >
                Finance
              </a>
            </Link>
            <Link href="/profile">
              <a 
                className={`hover:text-electric-blue transition-colors ${location === '/profile' ? 'text-electric-blue' : 'text-light-gray'}`}
                onClick={() => setIsOpen(false)}
              >
                My Portfolio
              </a>
            </Link>
          </div>
        </div>
      )}
      
      <WalletModal isOpen={walletModalOpen} onClose={() => setWalletModalOpen(false)} />
    </>
  );
}

export default Navbar;
