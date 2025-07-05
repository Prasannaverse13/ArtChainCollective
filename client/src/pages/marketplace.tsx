import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@/hooks/use-wallet';
import { NFTCard } from '@/components/NFTCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { purchaseNFT } from '@/lib/stellar';

const CATEGORIES = ['All Items', 'Abstract', 'Cyberpunk', 'Generative', 'Pixel Art'];
const SORT_OPTIONS = ['Newest', 'Price: Low to High', 'Price: High to Low', 'Most Popular'];

export default function Marketplace() {
  const { walletInfo } = useWallet();
  const { toast } = useToast();
  
  const [selectedCategory, setSelectedCategory] = useState('All Items');
  const [sortOption, setSortOption] = useState('Newest');
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch NFTs
  const { data: nfts, isLoading, error } = useQuery({
    queryKey: ['/api/nfts'],
    queryFn: async () => {
      const category = selectedCategory !== 'All Items' ? selectedCategory.toLowerCase() : undefined;
      const url = new URL('/api/nfts', window.location.origin);
      if (category) url.searchParams.append('category', category);
      
      const response = await fetch(url.toString());
      if (!response.ok) throw new Error('Failed to fetch NFTs');
      return response.json();
    }
  });
  
  // For demo, mock response data if nothing is returned from the API
  const displayNFTs = nfts?.length > 0 ? nfts : [
    {
      id: 1,
      artworkId: 1,
      tokenId: 'ART-1-1623456789',
      contractAddress: 'GDEMO5555DEMO5555DEMO5555DEMO5555DEMO5555DEMO5',
      mintedAt: new Date().toISOString(),
      isSold: false,
      price: 0.45,
      category: 'cyberpunk',
      artwork: {
        id: 1,
        title: 'Cybernetic Dreamscape',
        description: 'A futuristic cyberpunk landscape',
        canvasData: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?q=80&w=500&h=500&auto=format&fit=crop',
        status: 'minted',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      collaborators: [
        { id: 1, username: 'JohnDoe', walletAddress: 'GD...XYZ', contributionPercentage: 60 },
        { id: 2, username: 'KateL', walletAddress: 'GD...ABC', contributionPercentage: 40 }
      ]
    },
    {
      id: 2,
      artworkId: 2,
      tokenId: 'ART-2-1623456790',
      contractAddress: 'GDEMO5555DEMO5555DEMO5555DEMO5555DEMO5555DEMO5',
      mintedAt: new Date().toISOString(),
      isSold: false,
      price: 0.75,
      category: 'abstract',
      artwork: {
        id: 2,
        title: 'Neon Genesis',
        description: 'Abstract neon patterns',
        canvasData: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=500&h=500&auto=format&fit=crop',
        status: 'minted',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      collaborators: [
        { id: 3, username: 'MikeR', walletAddress: 'GD...123', contributionPercentage: 100 }
      ]
    },
    {
      id: 3,
      artworkId: 3,
      tokenId: 'ART-3-1623456791',
      contractAddress: 'GDEMO5555DEMO5555DEMO5555DEMO5555DEMO5555DEMO5',
      mintedAt: new Date().toISOString(),
      isSold: false,
      price: 1.2,
      category: 'cyberpunk',
      artwork: {
        id: 3,
        title: 'Digital Dystopia',
        description: 'A dark vision of the future',
        canvasData: 'https://images.unsplash.com/photo-1604871000636-074fa5117945?q=80&w=500&h=500&auto=format&fit=crop',
        status: 'minted',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      collaborators: [
        { id: 2, username: 'KateL', walletAddress: 'GD...ABC', contributionPercentage: 50 },
        { id: 1, username: 'JohnDoe', walletAddress: 'GD...XYZ', contributionPercentage: 50 }
      ]
    },
    {
      id: 4,
      artworkId: 4,
      tokenId: 'ART-4-1623456792',
      contractAddress: 'GDEMO5555DEMO5555DEMO5555DEMO5555DEMO5555DEMO5',
      mintedAt: new Date().toISOString(),
      isSold: false,
      price: 0.6,
      category: 'generative',
      artwork: {
        id: 4,
        title: 'Holographic Memories',
        description: 'Generative art inspired by holographic imagery',
        canvasData: 'https://images.unsplash.com/photo-1614851099175-e5b30eb6f696?q=80&w=500&h=500&auto=format&fit=crop',
        status: 'minted',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      collaborators: [
        { id: 3, username: 'MikeR', walletAddress: 'GD...123', contributionPercentage: 100 }
      ]
    }
  ];
  
  const handleBuyNFT = (nft: any) => {
    if (!walletInfo.isConnected) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet to purchase NFTs',
        variant: 'destructive',
      });
      return;
    }
    
    setSelectedNFT(nft);
    setPurchaseModalOpen(true);
  };
  
  const handleConfirmPurchase = async () => {
    if (!selectedNFT) {
      toast({
        title: 'Error',
        description: 'No NFT selected for purchase',
        variant: 'destructive',
      });
      return;
    }
    
    if (!walletInfo.isConnected || !walletInfo.address) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet to proceed with purchase',
        variant: 'destructive',
      });
      setPurchaseModalOpen(false);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Get the seller's address from the collaborators
      const sellerAddress = selectedNFT.collaborators[0]?.walletAddress;
      
      // Create the purchase transaction
      const purchaseData = {
        buyerPublicKey: walletInfo.address,
        tokenId: selectedNFT.tokenId,
        price: selectedNFT.price,
        sellerPublicKey: sellerAddress || 'GDEMO5555DEMO5555DEMO5555DEMO5555DEMO5555DEMO5' // Fallback
      };
      
      // Generate transaction XDR - now returns mock data
      const { xdr, mockData } = await purchaseNFT(purchaseData);
      
      // For demo purposes, we're using a mock transaction result
      const txResult = {
        successful: true,
        hash: `mock-purchase-hash-${Date.now()}`,
        mockTransaction: true
      };
      
      if (txResult.successful) {
        // Update the NFT status in our database
        await fetch(`/api/nfts/${selectedNFT.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isSold: true }),
        });
        
        toast({
          title: 'Purchase Successful',
          description: `You've successfully purchased "${selectedNFT.artwork.title}"!`,
        });
        
        setPurchaseModalOpen(false);
      } else {
        throw new Error('Transaction failed');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      toast({
        title: 'Purchase Failed',
        description: error instanceof Error ? error.message : 'Failed to complete purchase',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <section id="marketplace" className="py-12 px-6 md:px-12 lg:px-20">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <h2 className="text-3xl md:text-4xl font-orbitron font-bold mb-4">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-neon-pink to-neon-purple">NFT Marketplace</span>
          </h2>
          <p className="text-lg text-light-gray/70 max-w-2xl">
            Discover and collect unique digital art created by our global community of artists.
          </p>
        </div>
        
        {/* Filter and sort options */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex flex-wrap items-center gap-3">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`bg-dark-indigo/60 text-light-gray px-4 py-2 rounded-md border ${
                  selectedCategory === category
                    ? 'border-neon-pink/60 text-neon-pink'
                    : 'border-electric-blue/30 hover:border-electric-blue/60'
                } transition-all duration-200 text-sm`}
              >
                {category}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-light-gray/70">Sort by:</span>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="bg-dark-indigo text-light-gray px-3 py-2 rounded-md border border-electric-blue/30 text-sm focus:outline-none focus:border-electric-blue/60"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-electric-blue text-lg animate-pulse">Loading NFTs...</div>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-neon-pink text-lg">Error loading NFTs. Please try again.</div>
          </div>
        ) : (
          <>
            {/* NFT Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-10">
              {displayNFTs.map((nft: any) => (
                <NFTCard
                  key={nft.id}
                  nft={nft}
                  artwork={nft.artwork}
                  collaborators={nft.collaborators}
                  onBuy={() => handleBuyNFT(nft)}
                />
              ))}
            </div>
            
            <div className="flex justify-center">
              <Button
                variant="outline"
                className="cybr-btn bg-transparent border border-electric-blue/50 text-electric-blue font-medium py-3 px-8 rounded-md transition-all duration-300 hover:bg-electric-blue/10"
              >
                Load More
              </Button>
            </div>
          </>
        )}
      </div>
      
      {/* Purchase Confirmation Modal */}
      {selectedNFT && (
        <Dialog open={purchaseModalOpen} onOpenChange={setPurchaseModalOpen}>
          <DialogContent className="bg-dark-indigo border border-electric-blue/30">
            <DialogHeader>
              <DialogTitle className="text-2xl font-orbitron font-bold text-electric-blue">
                Confirm Purchase
              </DialogTitle>
            </DialogHeader>
            
            <div className="py-4">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-20 h-20 rounded-md overflow-hidden">
                  <img
                    src={selectedNFT.artwork.canvasData}
                    alt={selectedNFT.artwork.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-light-gray">
                    {selectedNFT.artwork.title}
                  </h3>
                  <p className="text-sm text-light-gray/70">
                    {selectedNFT.collaborators.length} {selectedNFT.collaborators.length === 1 ? 'creator' : 'collaborators'}
                  </p>
                </div>
              </div>
              
              <div className="p-4 bg-space-black/50 rounded-md mb-6">
                <div className="flex justify-between mb-2">
                  <span className="text-light-gray/70">Price:</span>
                  <span className="text-acid-green font-semibold">{selectedNFT.price} XLM</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-light-gray/70">Network Fee:</span>
                  <span className="text-light-gray">0.00001 XLM</span>
                </div>
                <div className="border-t border-electric-blue/20 pt-2 mt-2 flex justify-between">
                  <span className="text-light-gray font-medium">Total:</span>
                  <span className="text-acid-green font-bold">{(selectedNFT.price + 0.00001).toFixed(5)} XLM</span>
                </div>
              </div>
              
              <div className="p-3 bg-electric-blue/10 border border-electric-blue/30 rounded-md text-sm text-light-gray/80">
                <p className="flex items-center">
                  <i className="fas fa-info-circle text-electric-blue mr-2"></i>
                  You'll be asked to approve this transaction with your connected wallet.
                </p>
              </div>
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setPurchaseModalOpen(false)}
                className="bg-space-black text-light-gray border border-light-gray/30"
              >
                Cancel
              </Button>
              <Button
                variant="default"
                onClick={handleConfirmPurchase}
                disabled={isSubmitting}
                className="bg-gradient-to-r from-acid-green to-electric-blue text-white"
              >
                {isSubmitting ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i> Processing...
                  </>
                ) : (
                  <>
                    Confirm Purchase
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </section>
  );
}
