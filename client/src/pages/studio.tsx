import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@/hooks/use-wallet';
import { Canvas } from '@/components/ui/canvas';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { apiRequest } from '@/lib/queryClient';
import { mintNFT } from '@/lib/stellar';
import { queryClient } from '@/lib/queryClient';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type DrawingTool = 'pen' | 'eraser' | 'fill' | 'shape' | 'select' | 'text';
type Tool = { id: DrawingTool; icon: string; label: string };
type ColorOption = { color: string; name: string };

const tools: Tool[] = [
  { id: 'pen', icon: 'fa-pen', label: 'Pen' },
  { id: 'eraser', icon: 'fa-eraser', label: 'Eraser' },
  { id: 'fill', icon: 'fa-fill-drip', label: 'Fill' },
  { id: 'shape', icon: 'fa-shapes', label: 'Shapes' },
  { id: 'select', icon: 'fa-object-group', label: 'Select' },
  { id: 'text', icon: 'fa-font', label: 'Text' }
];

const colors: ColorOption[] = [
  { color: '#ff2a6d', name: 'Neon Pink' },
  { color: '#0ff0fc', name: 'Electric Blue' },
  { color: '#05ffa1', name: 'Acid Green' },
  { color: '#b026ff', name: 'Neon Purple' },
  { color: '#ffffff', name: 'White' },
  { color: '#ffb800', name: 'Amber' },
  { color: '#1a1a3a', name: 'Dark Indigo' },
  { color: '#050520', name: 'Space Black' }
];

export default function Studio() {
  const { walletInfo } = useWallet();
  const { toast } = useToast();
  
  const [selectedTool, setSelectedTool] = useState<DrawingTool>('pen');
  const [selectedColor, setSelectedColor] = useState<string>(colors[0].color);
  const [isMintModalOpen, setIsMintModalOpen] = useState(false);
  const [artworkTitle, setArtworkTitle] = useState('');
  const [artworkDescription, setArtworkDescription] = useState('');
  const [currentArtworkId, setCurrentArtworkId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [contributionPercentage, setContributionPercentage] = useState('50');
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("draw");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // List of fake collaborators for demo UI
  const [collaborators] = useState([
    { id: 1, initials: 'JD', color: 'bg-neon-purple' },
    { id: 2, initials: 'KL', color: 'bg-electric-blue' },
    { id: 3, initials: 'MR', color: 'bg-acid-green' }
  ]);
  
  // Create a new artwork
  const createArtworkMutation = useMutation({
    mutationFn: async (data: { title: string; description: string; canvasData: string }) => {
      const response = await apiRequest('POST', '/api/artworks', data);
      return await response.json();
    },
    onSuccess: (data) => {
      setCurrentArtworkId(data.id);
      toast({
        title: 'Artwork Saved',
        description: 'Your artwork has been saved successfully!',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error Saving Artwork',
        description: error.message || 'Failed to save artwork',
        variant: 'destructive',
      });
    }
  });
  
  // Mint NFT
  const mintNFTMutation = useMutation({
    mutationFn: async (data: { artworkId: number; tokenId: string; contractAddress: string; price: number }) => {
      const response = await apiRequest('POST', '/api/nfts', data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'NFT Minted',
        description: 'Your NFT has been minted successfully!',
      });
      setIsMintModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/nfts'] });
    },
    onError: (error) => {
      toast({
        title: 'Error Minting NFT',
        description: error.message || 'Failed to mint NFT',
        variant: 'destructive',
      });
    }
  });
  
  const handleMintNFT = async () => {
    if (!currentArtworkId) {
      toast({
        title: 'No Artwork',
        description: 'Please save your artwork first',
        variant: 'destructive',
      });
      return;
    }
    
    if (!walletInfo.isConnected || !walletInfo.address) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet to mint an NFT',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Prepare NFT minting data
      const mintData = {
        walletPublicKey: walletInfo.address,
        artworkId: currentArtworkId,
        title: artworkTitle,
        collaborators: [
          { publicKey: walletInfo.address, share: 100 } // For demo, 100% to the creator
        ]
      };
      
      // Create and sign transaction for NFT minting
      const { xdr, tokenId } = await mintNFT(mintData);
      
      // For demo purposes, we'll use a mock transaction result
      // In production, you would use signAndSubmitWithFreighter(xdr)
      const txResult = {
        successful: true,
        hash: `mock-tx-hash-${Date.now()}`,
      };
      
      // If transaction is successful, save NFT to our database
      if (txResult.successful) {
        await mintNFTMutation.mutateAsync({
          artworkId: currentArtworkId,
          tokenId,
          contractAddress: 'GDEMO5555DEMO5555DEMO5555DEMO5555DEMO5555DEMO5', // Mock address
          price: 0.45 // Default price in XLM
        });
      } else {
        throw new Error('Transaction failed');
      }
    } catch (error) {
      console.error('Minting error:', error);
      toast({
        title: 'Minting Failed',
        description: error instanceof Error ? error.message : 'Failed to mint NFT',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload an image file',
        variant: 'destructive',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setUploadedImage(e.target.result as string);
        toast({
          title: 'Image Uploaded',
          description: 'Your image has been uploaded successfully!',
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Save artwork to collection
  const handleSaveArtwork = async () => {
    if (!walletInfo.isConnected) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet to save artwork',
        variant: 'destructive',
      });
      return;
    }
    
    let artworkData: string = '';
    
    // Determine the data source based on the active tab
    if (activeTab === 'draw') {
      const canvas = document.querySelector('canvas');
      if (!canvas) {
        toast({
          title: 'Canvas Error',
          description: 'Could not access the canvas',
          variant: 'destructive',
        });
        return;
      }
      artworkData = canvas.toDataURL('image/png');
    } else if (activeTab === 'upload') {
      if (!uploadedImage) {
        toast({
          title: 'No Image',
          description: 'Please upload an image first',
          variant: 'destructive',
        });
        return;
      }
      artworkData = uploadedImage;
    }
    
    if (!artworkData) {
      toast({
        title: 'No Artwork',
        description: 'No artwork data available to save',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      await createArtworkMutation.mutateAsync({
        title: artworkTitle || 'Untitled Artwork',
        description: artworkDescription || '',
        canvasData: artworkData
      });
      
      toast({
        title: 'Artwork Saved',
        description: activeTab === 'upload' ? 'Your uploaded image has been saved!' : 'Your artwork has been saved!',
      });
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: 'Save Failed',
        description: error instanceof Error ? error.message : 'Failed to save artwork',
        variant: 'destructive',
      });
    }
  };

  // Check if user is connected
  const isConnected = walletInfo.isConnected;
  
  return (
    <section className="py-12 px-6 md:px-12 lg:px-20 relative">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <h2 className="text-3xl md:text-4xl font-orbitron font-bold mb-4 text-white">
            Creation Studio
          </h2>
          <p className="text-lg text-light-gray/70 max-w-2xl">
            Bring your vision to life with our powerful co-creation tools. {!isConnected && 'Connect your wallet to start.'}
          </p>
        </div>
        
        {/* Canvas and Tools Area */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Tools panel */}
          <div className="lg:col-span-1 bg-dark-indigo/60 backdrop-blur-sm p-4 rounded-lg border border-electric-blue/20">
            <div className="mb-6">
              <h3 className="text-xl font-orbitron font-semibold text-electric-blue mb-4">Tools</h3>
              <div className="grid grid-cols-3 gap-2 mb-6">
                {tools.map((tool) => (
                  <button
                    key={tool.id}
                    className={`tool-btn h-12 bg-space-black/50 rounded flex items-center justify-center text-electric-blue border border-electric-blue/30 hover:border-electric-blue/70 ${
                      selectedTool === tool.id ? 'active' : ''
                    }`}
                    onClick={() => setSelectedTool(tool.id)}
                    title={tool.label}
                  >
                    <i className={`fas ${tool.icon}`}></i>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-xl font-orbitron font-semibold text-neon-pink mb-4">Colors</h3>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {colors.map((color) => (
                  <button
                    key={color.color}
                    className={`w-full h-8 rounded-sm ${
                      selectedColor === color.color ? 'ring-2 ring-white' : ''
                    }`}
                    style={{ backgroundColor: color.color }}
                    onClick={() => setSelectedColor(color.color)}
                    title={color.name}
                  ></button>
                ))}
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-xl font-orbitron font-semibold text-acid-green mb-4">Layers</h3>
              <div className="space-y-2">
                <div className="p-2 bg-space-black/50 rounded flex items-center justify-between border border-acid-green/30 hover:border-acid-green/70 transition-all duration-200">
                  <span>Background</span>
                  <div className="flex items-center gap-2">
                    <button className="text-light-gray/70 hover:text-light-gray"><i className="fas fa-eye"></i></button>
                    <button className="text-light-gray/70 hover:text-light-gray"><i className="fas fa-lock-open"></i></button>
                  </div>
                </div>
                <div className="p-2 bg-space-black/50 rounded flex items-center justify-between border border-acid-green/30 hover:border-acid-green/70 transition-all duration-200">
                  <span>Layer 1</span>
                  <div className="flex items-center gap-2">
                    <button className="text-light-gray/70 hover:text-light-gray"><i className="fas fa-eye"></i></button>
                    <button className="text-light-gray/70 hover:text-light-gray"><i className="fas fa-lock-open"></i></button>
                  </div>
                </div>
                
                <button className="w-full p-2 bg-acid-green/10 text-acid-green rounded border border-acid-green/30 hover:border-acid-green/70 transition-all duration-200 mt-4">
                  <i className="fas fa-plus mr-2"></i> Add Layer
                </button>
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-xl font-orbitron font-semibold text-electric-blue mb-4">Artwork Info</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-light-gray/70 mb-1">Title</label>
                  <Input
                    value={artworkTitle}
                    onChange={(e) => setArtworkTitle(e.target.value)}
                    placeholder="Untitled Artwork"
                    className="w-full bg-space-black/50 border border-electric-blue/30 text-light-gray"
                  />
                </div>
                <div>
                  <label className="block text-sm text-light-gray/70 mb-1">Description</label>
                  <Textarea
                    value={artworkDescription}
                    onChange={(e) => setArtworkDescription(e.target.value)}
                    placeholder="Describe your artwork..."
                    className="w-full bg-space-black/50 border border-electric-blue/30 text-light-gray"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Canvas area */}
          <div className="lg:col-span-3">
            <div className="bg-dark-indigo/60 backdrop-blur-sm p-4 rounded-lg border border-electric-blue/20 h-full flex flex-col">
              {/* Collaborators */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center -space-x-2">
                  {collaborators.map((collaborator) => (
                    <div
                      key={collaborator.id}
                      className={`w-8 h-8 rounded-full ${collaborator.color} flex items-center justify-center text-white text-xs border-2 border-space-black`}
                    >
                      {collaborator.initials}
                    </div>
                  ))}
                  <button 
                    onClick={() => setIsInviteModalOpen(true)}
                    className="w-8 h-8 rounded-full bg-dark-indigo flex items-center justify-center text-white text-xs border-2 border-electric-blue ml-1 hover:bg-electric-blue/20"
                    title="Invite collaborator"
                  >
                    <i className="fas fa-plus text-electric-blue"></i>
                  </button>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    onClick={handleSaveArtwork}
                    disabled={!isConnected || createArtworkMutation.isPending}
                    className="cybr-btn bg-gradient-to-r from-neon-pink to-neon-purple text-white font-medium py-2 px-4 rounded-md hover:animate-glow"
                  >
                    <i className="fas fa-save mr-2"></i> Save
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsMintModalOpen(true)}
                    disabled={!isConnected || !currentArtworkId}
                    className="cybr-btn bg-gradient-to-r from-acid-green to-electric-blue text-white font-medium py-2 px-4 rounded-md hover:animate-glow flex items-center"
                  >
                    <i className="fas fa-cube mr-2"></i> Mint NFT
                  </Button>
                </div>
              </div>
              
              {/* Creation Tabs */}
              <div className="flex-grow relative rounded overflow-hidden">
                {isConnected ? (
                  <Tabs 
                    value={activeTab} 
                    onValueChange={setActiveTab} 
                    className="w-full h-full flex flex-col" 
                    defaultValue="draw"
                  >
                    <TabsList className="bg-space-black/50 p-1 w-full flex justify-center mb-4">
                      <TabsTrigger 
                        value="draw" 
                        className="data-[state=active]:bg-electric-blue/20 data-[state=active]:text-electric-blue text-light-gray/70"
                      >
                        <i className="fas fa-paint-brush mr-2"></i> Draw
                      </TabsTrigger>
                      <TabsTrigger 
                        value="upload" 
                        className="data-[state=active]:bg-neon-pink/20 data-[state=active]:text-neon-pink text-light-gray/70"
                      >
                        <i className="fas fa-upload mr-2"></i> Upload Image
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="draw" className="flex-grow">
                      <Canvas 
                        className="w-full h-full"
                        collaborative={true}
                      />
                    </TabsContent>
                    
                    <TabsContent value="upload" className="flex-grow flex flex-col items-center justify-center">
                      {uploadedImage ? (
                        <div className="relative w-full h-full flex flex-col items-center">
                          <div className="relative max-h-[80%] overflow-hidden rounded-lg border-2 border-neon-pink/50">
                            <img 
                              src={uploadedImage} 
                              alt="Uploaded artwork" 
                              className="max-w-full max-h-full object-contain" 
                            />
                          </div>
                          <div className="mt-4 flex space-x-3">
                            <Button
                              variant="outline"
                              onClick={triggerFileInput}
                              className="bg-neon-pink/20 border border-neon-pink/40 text-neon-pink"
                            >
                              <i className="fas fa-sync-alt mr-2"></i> Change Image
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => setUploadedImage(null)}
                              className="bg-space-black/70 border border-light-gray/30 text-light-gray"
                            >
                              <i className="fas fa-trash-alt mr-2"></i> Remove
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center p-12 border-2 border-dashed border-neon-pink/30 rounded-lg bg-space-black/30 cursor-pointer hover:bg-space-black/50 transition-all duration-300" onClick={triggerFileInput}>
                          <i className="fas fa-cloud-upload-alt text-4xl mb-4 text-neon-pink/70"></i>
                          <p className="text-lg text-light-gray mb-2">Drag and drop an image here</p>
                          <p className="text-sm text-light-gray/50 mb-4">or click to browse</p>
                          <Button
                            variant="outline"
                            className="bg-neon-pink/20 border border-neon-pink/40 text-neon-pink"
                          >
                            <i className="fas fa-image mr-2"></i> Select Image
                          </Button>
                        </div>
                      )}
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*" 
                        ref={fileInputRef} 
                        onChange={handleImageUpload} 
                      />
                    </TabsContent>
                  </Tabs>
                ) : (
                  <div className="w-full h-full bg-space-black/70 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-lg text-light-gray/50 mb-4">
                        <i className="fas fa-palette text-3xl mb-2 block"></i> 
                        Connect your wallet to start creating
                      </p>
                      <Button 
                        variant="outline"
                        className="cybr-btn bg-electric-blue/20 border border-electric-blue/40 text-electric-blue font-medium py-2 px-6 rounded-md transition-all duration-300 hover:bg-electric-blue/30"
                      >
                        Connect Now
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mint NFT Modal */}
      <Dialog open={isMintModalOpen} onOpenChange={setIsMintModalOpen}>
        <DialogContent className="bg-dark-indigo border border-electric-blue/30">
          <DialogHeader>
            <DialogTitle className="text-2xl font-orbitron font-bold text-electric-blue">
              Mint Artwork as NFT
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-light-gray mb-4">
              You're about to mint "{artworkTitle || 'Untitled Artwork'}" as an NFT on the Stellar blockchain.
            </p>
            
            <div className="mb-4">
              <label className="block text-sm text-light-gray/70 mb-1">Initial Price (XLM)</label>
              <Input
                type="number"
                defaultValue="0.45"
                step="0.01"
                min="0.01"
                className="w-full bg-space-black/50 border border-electric-blue/30 text-light-gray"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm text-light-gray/70 mb-1">Category</label>
              <select className="w-full bg-space-black/50 border border-electric-blue/30 text-light-gray p-2 rounded-md">
                <option value="abstract">Abstract</option>
                <option value="cyberpunk">Cyberpunk</option>
                <option value="generative">Generative</option>
                <option value="pixel">Pixel Art</option>
              </select>
            </div>
            
            <div className="p-3 bg-electric-blue/10 border border-electric-blue/30 rounded-md text-sm text-light-gray/80 mb-4">
              <p className="flex items-center">
                <i className="fas fa-info-circle text-electric-blue mr-2"></i>
                Minting on Stellar testnet is free. In production, a small fee would apply.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsMintModalOpen(false)}
              className="bg-space-black text-light-gray border border-light-gray/30"
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={handleMintNFT}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-neon-purple to-electric-blue text-white"
            >
              {isSubmitting ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i> Processing...
                </>
              ) : (
                <>
                  <i className="fas fa-cube mr-2"></i> Mint NFT
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite Collaborator Modal */}
      <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
        <DialogContent className="bg-dark-indigo border border-electric-blue/30">
          <DialogHeader>
            <DialogTitle className="text-2xl font-orbitron font-bold text-neon-purple">
              Invite Co-Creator
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-light-gray mb-4">
              Invite another artist to collaborate on "{artworkTitle || 'Untitled Artwork'}".
            </p>
            
            <div className="mb-4">
              <label className="block text-sm text-light-gray/70 mb-1">Email Address</label>
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="collaborator@example.com"
                className="w-full bg-white border border-electric-blue/30 text-black"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm text-light-gray/70 mb-1">Contribution Share (%)</label>
              <Input
                type="number"
                value={contributionPercentage}
                onChange={(e) => setContributionPercentage(e.target.value)}
                min="1"
                max="99"
                className="w-full bg-white border border-electric-blue/30 text-black"
              />
              <p className="mt-1 text-xs text-light-gray/50">
                This determines the percentage of revenue this collaborator will receive from sales.
              </p>
            </div>
            
            <div className="p-3 bg-neon-purple/10 border border-neon-purple/30 rounded-md text-sm text-light-gray/80 mb-4">
              <p className="flex items-center">
                <i className="fas fa-info-circle text-neon-purple mr-2"></i>
                Your collaborator will receive an invite link via email. They'll need to connect their wallet when accepting.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsInviteModalOpen(false)}
              className="bg-space-black text-light-gray border border-light-gray/30"
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={handleInviteCollaborator}
              disabled={isSendingInvite || !inviteEmail}
              className="bg-gradient-to-r from-neon-purple to-electric-blue text-white"
            >
              {isSendingInvite ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i> Sending...
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane mr-2"></i> Send Invite
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );

  // Function to handle collaborator invitation
  function handleInviteCollaborator() {
    if (!inviteEmail) {
      toast({
        title: 'Missing Information',
        description: 'Please enter an email address for your collaborator',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSendingInvite(true);
    
    // Mock API call for sending invitation
    setTimeout(() => {
      // Create a mock collaboration link
      const collaborationLink = `${window.location.origin}/studio?invite=${Date.now()}&project=${currentArtworkId || 'new'}`;
      
      console.log('Collaboration invite would be sent to:', inviteEmail);
      console.log('With contribution percentage:', contributionPercentage);
      console.log('Collaboration link:', collaborationLink);
      
      // Show success message
      toast({
        title: 'Invitation Sent!',
        description: `Collaboration request sent to ${inviteEmail}`,
      });
      
      // Reset form and close modal
      setInviteEmail('');
      setContributionPercentage('50');
      setIsInviteModalOpen(false);
      setIsSendingInvite(false);
    }, 1500);
  }
}
