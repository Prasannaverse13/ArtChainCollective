import React from 'react';
import { Link } from 'wouter';
import { useWallet } from '@/hooks/use-wallet';
import { Button } from '@/components/ui/button';

export default function Home() {
  const { walletInfo } = useWallet();

  return (
    <div className="py-12 px-6 md:px-12 lg:px-20 relative digital-noise">
      <div className="mb-20 md:mb-24 lg:mb-32 max-w-4xl mx-auto text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-orbitron font-bold mb-6">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-electric-blue via-bright-cyan to-neon-purple animate-pulse-slow">
            ArtChain
          </span>
          <br />
          <span className="text-white">Co-Create Digital Art</span>
          <br />
          <span className="text-bright-cyan">on the Stellar Network</span>
        </h1>
        
        <p className="text-xl md:text-2xl mb-10 text-white">
          Collaborate in real-time, mint NFTs, and split revenue automatically with smart contracts.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/studio">
            <Button
              variant="default"
              className="cybr-btn bg-gradient-to-r from-neon-purple to-electric-blue hover:from-electric-blue hover:to-neon-purple text-white font-medium py-3 px-8 rounded-md transition-all duration-300 shadow-lg shadow-neon-purple/20 hover:shadow-electric-blue/30"
            >
              Start Creating
            </Button>
          </Link>
          
          <Link href="/marketplace">
            <Button
              variant="outline"
              className="cybr-btn bg-transparent border border-acid-green/50 text-acid-green font-medium py-3 px-8 rounded-md transition-all duration-300 hover:bg-acid-green/10 shadow-lg shadow-acid-green/10 hover:shadow-acid-green/20"
            >
              Explore Marketplace
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Feature highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        <div className="bg-dark-indigo/60 backdrop-blur-sm p-6 rounded-lg border border-electric-blue/20 hover:border-electric-blue/40 transition-all duration-300 group">
          <div className="w-14 h-14 mb-4 bg-electric-blue/10 rounded-full flex items-center justify-center text-2xl text-electric-blue group-hover:animate-pulse-slow">
            <i className="fas fa-paint-brush"></i>
          </div>
          <h3 className="text-xl font-orbitron font-semibold text-electric-blue mb-2">Collaborative Canvas</h3>
          <p className="text-white/90">Create digital artwork in real-time with artists from around the world.</p>
        </div>
        
        <div className="bg-dark-indigo/60 backdrop-blur-sm p-6 rounded-lg border border-neon-pink/20 hover:border-neon-pink/40 transition-all duration-300 group">
          <div className="w-14 h-14 mb-4 bg-neon-pink/10 rounded-full flex items-center justify-center text-2xl text-neon-pink group-hover:animate-pulse-slow">
            <i className="fas fa-cubes"></i>
          </div>
          <h3 className="text-xl font-orbitron font-semibold text-neon-pink mb-2">NFT Minting</h3>
          <p className="text-white/90">Mint your collaborative artworks as NFTs on the Stellar blockchain.</p>
        </div>
        
        <div className="bg-dark-indigo/60 backdrop-blur-sm p-6 rounded-lg border border-acid-green/20 hover:border-acid-green/40 transition-all duration-300 group">
          <div className="w-14 h-14 mb-4 bg-acid-green/10 rounded-full flex items-center justify-center text-2xl text-acid-green group-hover:animate-pulse-slow">
            <i className="fas fa-dollar-sign"></i>
          </div>
          <h3 className="text-xl font-orbitron font-semibold text-acid-green mb-2">Revenue Splitting</h3>
          <p className="text-white/90">Smart contracts automatically distribute earnings among all contributors.</p>
        </div>
        
        <div className="bg-dark-indigo/60 backdrop-blur-sm p-6 rounded-lg border border-purple-400/20 hover:border-purple-400/40 transition-all duration-300 group">
          <div className="w-14 h-14 mb-4 bg-purple-400/10 rounded-full flex items-center justify-center text-2xl text-purple-400 group-hover:animate-pulse-slow">
            <i className="fas fa-chart-line"></i>
          </div>
          <h3 className="text-xl font-orbitron font-semibold text-purple-400 mb-2">DeFi Integration</h3>
          <p className="text-white/90">Lend, borrow, and earn yield on your digital assets through Blend Protocol.</p>
        </div>
      </div>
    </div>
  );
}
