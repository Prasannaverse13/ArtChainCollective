import React from 'react';
import { Link } from 'wouter';
import { NFT, Artwork } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { formatAddress } from '@/lib/wallet';

interface NFTCardProps {
  nft: NFT;
  artwork: Artwork;
  collaborators?: { 
    id: number; 
    username: string; 
    walletAddress?: string;
    contributionPercentage?: number;
  }[];
  onBuy?: () => void;
}

export function NFTCard({ nft, artwork, collaborators = [], onBuy }: NFTCardProps) {
  return (
    <div className="bg-dark-indigo/60 backdrop-blur-sm rounded-lg overflow-hidden border border-electric-blue/20 hover:border-electric-blue/50 transition-all duration-300 group">
      <div className="relative">
        {/* Canvas preview */}
        <div className="w-full aspect-square overflow-hidden relative">
          {artwork.canvasData ? (
            <img 
              src={artwork.canvasData as string} 
              alt={artwork.title} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-space-black/70 flex items-center justify-center">
              <p className="text-light-gray/50"><i className="fas fa-image text-3xl mb-2 block"></i></p>
            </div>
          )}
        </div>
        
        {/* Tags for the NFT */}
        {collaborators && collaborators.length > 1 && (
          <div className="absolute top-3 right-3 bg-dark-indigo/80 text-acid-green px-2 py-1 rounded-md text-xs backdrop-blur-sm font-vt323">
            COLLABORATIVE
          </div>
        )}
        
        {nft.category && (
          <div className="absolute top-3 left-3 bg-dark-indigo/80 text-neon-pink px-2 py-1 rounded-md text-xs backdrop-blur-sm font-vt323">
            {nft.category.toUpperCase()}
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="text-xl font-orbitron font-semibold text-electric-blue mb-1 group-hover:text-bright-cyan transition-colors">
          {artwork.title}
        </h3>
        
        <div className="flex items-center space-x-2 mb-3">
          <div className="flex items-center -space-x-1">
            {collaborators.slice(0, 3).map((collaborator, index) => (
              <div 
                key={collaborator.id}
                className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs border-2 border-dark-indigo ${
                  index % 3 === 0 ? 'bg-neon-pink' : 
                  index % 3 === 1 ? 'bg-electric-blue' : 'bg-acid-green'
                }`}
              >
                {collaborator.username.substring(0, 2).toUpperCase()}
              </div>
            ))}
          </div>
          <span className="text-light-gray/70 text-sm">
            {collaborators.length} {collaborators.length === 1 ? 'creator' : 'collaborators'}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <div>
            <div className="text-xs text-light-gray/70 mb-1">Current price</div>
            <div className="flex items-center">
              <i className="fa-solid fa-diamond text-acid-green mr-1"></i>
              <span className="font-orbitron text-acid-green font-medium">
                {nft.price ? `${nft.price} XLM` : 'Not for sale'}
              </span>
            </div>
          </div>
          
          {nft.price && !nft.isSold && (
            <Button 
              variant="outline"
              onClick={onBuy}
              className="cybr-btn bg-gradient-to-r from-neon-purple to-electric-blue text-white font-medium py-1.5 px-4 rounded-md text-sm hover:animate-glow"
            >
              Buy Now
            </Button>
          )}
          
          {nft.isSold && (
            <span className="text-neon-pink text-sm font-semibold">
              SOLD
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default NFTCard;
