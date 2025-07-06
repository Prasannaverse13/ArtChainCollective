import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@/hooks/use-wallet';
import { NFTCard } from '@/components/NFTCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiRequest } from '@/lib/queryClient';

export default function Profile() {
  const { walletInfo } = useWallet();
  const { toast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState('CyberArtist');
  const [bio, setBio] = useState('Digital artist specializing in cyberpunk and futuristic themes. Creating on the Stellar blockchain.');
  
  // Fetch user data if wallet is connected
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['/api/users/wallet', walletInfo.address],
    queryFn: async () => {
      if (!walletInfo.address) return null;
      
      const response = await fetch(`/api/users/wallet/${walletInfo.address}`);
      if (response.status === 404) return null;
      if (!response.ok) throw new Error('Failed to fetch user data');
      return response.json();
    },
    enabled: !!walletInfo.address,
  });
  
  // Fetch user's NFTs
  const { data: userNFTs, isLoading: nftsLoading } = useQuery({
    queryKey: ['/api/users/nfts', userData?.id],
    queryFn: async () => {
      if (!userData?.id) return [];
      
      const response = await fetch(`/api/users/${userData.id}/nfts`);
      if (!response.ok) throw new Error('Failed to fetch user NFTs');
      return response.json();
    },
    enabled: !!userData?.id,
  });
  
  // For demo purposes, mock NFT data if API returns empty
  const displayNFTs = userNFTs?.length > 0 ? userNFTs : [
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
        { id: 1, username: 'CyberArtist', walletAddress: walletInfo.address || 'GD...XYZ', contributionPercentage: 100 }
      ]
    },
    {
      id: 2,
      artworkId: 2,
      tokenId: 'ART-2-1623456790',
      contractAddress: 'GDEMO5555DEMO5555DEMO5555DEMO5555DEMO5555DEMO5',
      mintedAt: new Date().toISOString(),
      isSold: false,
      price: 0.85,
      category: 'abstract',
      artwork: {
        id: 2,
        title: 'Neon Abstraction',
        description: 'Abstract patterns with neon colors',
        canvasData: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=500&h=500&auto=format&fit=crop',
        status: 'minted',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      collaborators: [
        { id: 1, username: 'CyberArtist', walletAddress: walletInfo.address || 'GD...XYZ', contributionPercentage: 100 }
      ]
    }
  ];
  
  const handleUpdateProfile = async () => {
    if (!userData?.id) return;
    
    try {
      await apiRequest('PUT', `/api/users/${userData.id}`, {
        username,
        bio
      });
      
      setIsEditing(false);
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been updated successfully',
      });
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  // If wallet is not connected, show a message
  if (!walletInfo.isConnected) {
    return (
      <div className="py-12 px-6 md:px-12 lg:px-20 max-w-7xl mx-auto">
        <div className="bg-dark-indigo/60 backdrop-blur-sm p-8 rounded-lg border border-electric-blue/20 text-center">
          <i className="fas fa-wallet text-electric-blue text-5xl mb-4"></i>
          <h2 className="text-2xl font-orbitron font-bold text-light-gray mb-4">Wallet Not Connected</h2>
          <p className="text-light-gray/70 mb-6">Connect your wallet to view your profile and NFT collection.</p>
          <Button 
            variant="outline"
            className="cybr-btn bg-gradient-to-r from-neon-purple to-electric-blue text-white font-medium py-2 px-6 rounded-md hover:animate-glow"
          >
            Connect Wallet
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="py-12 px-6 md:px-12 lg:px-20">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <h2 className="text-3xl md:text-4xl font-orbitron font-bold mb-4">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-electric-blue to-acid-green">My Portfolio</span>
          </h2>
          <p className="text-lg text-light-gray/70 max-w-2xl">
            Manage your digital art collection and artist profile on the Stellar blockchain.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Profile Section */}
          <div className="lg:col-span-1">
            <Card className="bg-dark-indigo/60 backdrop-blur-sm border border-electric-blue/20 h-full">
              <CardHeader>
                <CardTitle className="text-xl font-orbitron text-electric-blue">
                  Artist Profile
                </CardTitle>
                <CardDescription className="text-light-gray/70">
                  Your public identity on ArtChain
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6 flex justify-center">
                  <div className="relative w-32 h-32 rounded-full bg-neon-purple flex items-center justify-center text-4xl font-semibold text-white border-4 border-space-black">
                    {username.substring(0, 2).toUpperCase()}
                    <div className="absolute bottom-2 right-0 w-6 h-6 rounded-full bg-acid-green flex items-center justify-center text-xs border-2 border-space-black">
                      <i className="fas fa-check"></i>
                    </div>
                  </div>
                </div>
                
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-light-gray/70 mb-1">Username</label>
                      <Input
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="bg-space-black/50 border border-electric-blue/30 text-light-gray"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-light-gray/70 mb-1">Bio</label>
                      <Textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        rows={4}
                        className="bg-space-black/50 border border-electric-blue/30 text-light-gray"
                      />
                    </div>
                    <div className="pt-2 flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                        className="bg-space-black text-light-gray border border-light-gray/30"
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="default"
                        onClick={handleUpdateProfile}
                        className="bg-gradient-to-r from-electric-blue to-acid-green text-white"
                      >
                        Save Changes
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-xl font-orbitron font-semibold text-light-gray mb-1">
                      {username}
                    </h3>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex items-center text-acid-green text-sm">
                        <i className="fas fa-diamond mr-1"></i>
                        <span>Verified Artist</span>
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <p className="text-light-gray/70">{bio}</p>
                    </div>
                    
                    <div className="p-3 bg-space-black/50 rounded-md mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-light-gray/70">Wallet Address</span>
                        <span className="text-light-gray font-mono text-sm">{walletInfo.displayAddress}</span>
                      </div>
                    </div>
                    
                    <div className="mb-4 flex justify-between">
                      <div className="text-center">
                        <div className="text-xl font-orbitron text-electric-blue">
                          {displayNFTs.length}
                        </div>
                        <div className="text-sm text-light-gray/70">Created</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-orbitron text-neon-pink">
                          {displayNFTs.filter(nft => nft.isSold).length}
                        </div>
                        <div className="text-sm text-light-gray/70">Sold</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-orbitron text-acid-green">1.30</div>
                        <div className="text-sm text-light-gray/70">XLM Earned</div>
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(true)}
                      className="w-full bg-space-black border border-electric-blue/30 text-electric-blue hover:bg-electric-blue/10"
                    >
                      <i className="fas fa-edit mr-2"></i> Edit Profile
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* NFT Collection Section */}
          <div className="lg:col-span-2">
            <Card className="bg-dark-indigo/60 backdrop-blur-sm border border-electric-blue/20 h-full">
              <CardHeader>
                <CardTitle className="text-xl font-orbitron text-neon-pink">
                  My NFT Collection
                </CardTitle>
                <CardDescription className="text-light-gray/70">
                  Your created and collected NFTs on the Stellar blockchain
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="created">
                  <TabsList className="mb-6 bg-space-black">
                    <TabsTrigger value="created" className="data-[state=active]:bg-neon-pink/20 data-[state=active]:text-neon-pink">
                      Created
                    </TabsTrigger>
                    <TabsTrigger value="collected" className="data-[state=active]:bg-electric-blue/20 data-[state=active]:text-electric-blue">
                      Collected
                    </TabsTrigger>
                    <TabsTrigger value="pending" className="data-[state=active]:bg-acid-green/20 data-[state=active]:text-acid-green">
                      Pending
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="created">
                    {nftsLoading ? (
                      <div className="flex justify-center items-center py-10">
                        <div className="text-electric-blue text-lg animate-pulse">Loading your creations...</div>
                      </div>
                    ) : displayNFTs.length === 0 ? (
                      <div className="text-center py-10">
                        <i className="fas fa-palette text-neon-pink text-4xl mb-3"></i>
                        <h3 className="text-xl font-orbitron font-semibold text-light-gray mb-2">No NFTs Created Yet</h3>
                        <p className="text-light-gray/70 mb-4">Create your first NFT in the Studio!</p>
                        <Button
                          variant="outline"
                          className="cybr-btn bg-gradient-to-r from-neon-purple to-electric-blue text-white font-medium py-2 px-6 rounded-md hover:animate-glow"
                        >
                          Go to Studio
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {displayNFTs.map((nft: any) => (
                          <NFTCard
                            key={nft.id}
                            nft={nft}
                            artwork={nft.artwork}
                            collaborators={nft.collaborators}
                          />
                        ))}
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="collected">
                    <div className="text-center py-10">
                      <i className="fas fa-shopping-bag text-electric-blue text-4xl mb-3"></i>
                      <h3 className="text-xl font-orbitron font-semibold text-light-gray mb-2">No Collected NFTs</h3>
                      <p className="text-light-gray/70 mb-4">Discover NFTs in the Marketplace!</p>
                      <Button
                        variant="outline"
                        className="cybr-btn bg-gradient-to-r from-acid-green to-electric-blue text-white font-medium py-2 px-6 rounded-md hover:animate-glow"
                      >
                        Go to Marketplace
                      </Button>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="pending">
                    <div className="text-center py-10">
                      <i className="fas fa-clock text-acid-green text-4xl mb-3"></i>
                      <h3 className="text-xl font-orbitron font-semibold text-light-gray mb-2">No Pending Creations</h3>
                      <p className="text-light-gray/70 mb-4">You don't have any drafts or works in progress.</p>
                      <Button
                        variant="outline"
                        className="cybr-btn bg-gradient-to-r from-neon-purple to-neon-pink text-white font-medium py-2 px-6 rounded-md hover:animate-glow"
                      >
                        Start New Creation
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Transaction History */}
        <Card className="bg-dark-indigo/60 backdrop-blur-sm border border-electric-blue/20 mb-8">
          <CardHeader>
            <CardTitle className="text-xl font-orbitron text-acid-green">
              Transaction History
            </CardTitle>
            <CardDescription className="text-light-gray/70">
              Your recent transactions on the Stellar blockchain
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-electric-blue/20">
                    <th className="pb-3 text-light-gray/70">Type</th>
                    <th className="pb-3 text-light-gray/70">Date</th>
                    <th className="pb-3 text-light-gray/70">NFT</th>
                    <th className="pb-3 text-light-gray/70">Amount</th>
                    <th className="pb-3 text-light-gray/70">Status</th>
                    <th className="pb-3 text-light-gray/70">Tx Hash</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-electric-blue/10">
                    <td className="py-3">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-neon-purple/20 text-neon-purple text-xs">Mint</span>
                    </td>
                    <td className="py-3 text-light-gray/70">{new Date().toLocaleDateString()}</td>
                    <td className="py-3 text-light-gray">Cybernetic Dreamscape</td>
                    <td className="py-3 text-acid-green">0.45 XLM</td>
                    <td className="py-3">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-acid-green/20 text-acid-green text-xs">Success</span>
                    </td>
                    <td className="py-3 font-mono text-xs text-light-gray/70">
                      <a href="#" className="hover:text-electric-blue transition-colors">0x72f...3e1a</a>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-electric-blue/20 text-electric-blue text-xs">Sale</span>
                    </td>
                    <td className="py-3 text-light-gray/70">{new Date(Date.now() - 86400000).toLocaleDateString()}</td>
                    <td className="py-3 text-light-gray">Neon Abstraction</td>
                    <td className="py-3 text-acid-green">0.85 XLM</td>
                    <td className="py-3">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-acid-green/20 text-acid-green text-xs">Success</span>
                    </td>
                    <td className="py-3 font-mono text-xs text-light-gray/70">
                      <a href="#" className="hover:text-electric-blue transition-colors">0x43b...9c7d</a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
