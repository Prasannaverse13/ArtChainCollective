import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useWallet } from '@/hooks/use-wallet';
import { useToast } from '@/hooks/use-toast';
import { 
  getBlendPools, 
  getUserBlendPosition, 
  supplyToBlendPool,
  borrowFromBlendPool,
  getBlendProtocolStats,
  getUserBlndBalance,
  calculateHealthFactor,
  type BlendPoolInfo,
  type UserPosition 
} from '@/lib/blend';
import { DollarSign, TrendingUp, Shield, Users, Coins, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function Finance() {
  const { wallet } = useWallet();
  const { toast } = useToast();
  const [selectedPool, setSelectedPool] = useState<string | null>(null);
  const [supplyAmount, setSupplyAmount] = useState('');
  const [borrowAmount, setBorrowAmount] = useState('');
  const [selectedAsset, setSelectedAsset] = useState('');

  // Fetch Blend protocol data
  const { data: pools, isLoading: poolsLoading } = useQuery({
    queryKey: ['/api/blend/pools'],
    queryFn: getBlendPools,
  });

  const { data: userPositions } = useQuery({
    queryKey: ['/api/blend/positions', wallet.address],
    queryFn: () => wallet.address ? getUserBlendPosition(wallet.address) : [],
    enabled: wallet.isConnected,
  });

  const { data: protocolStats } = useQuery({
    queryKey: ['/api/blend/stats'],
    queryFn: getBlendProtocolStats,
  });

  const { data: blndBalance } = useQuery({
    queryKey: ['/api/blend/blnd-balance', wallet.address],
    queryFn: () => wallet.address ? getUserBlndBalance(wallet.address) : '0',
    enabled: wallet.isConnected,
  });

  const handleSupply = async () => {
    if (!wallet.address || !selectedPool || !supplyAmount || !selectedAsset) {
      toast({
        title: "Error",
        description: "Please fill in all fields and connect your wallet",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await supplyToBlendPool({
        poolId: selectedPool,
        asset: selectedAsset,
        amount: supplyAmount,
        userPublicKey: wallet.address
      });
      
      toast({
        title: "Supply Transaction Created",
        description: `Supplying ${supplyAmount} ${selectedAsset} to ${selectedPool}`,
      });
      
      setSupplyAmount('');
    } catch (error: any) {
      toast({
        title: "Supply Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleBorrow = async () => {
    if (!wallet.address || !selectedPool || !borrowAmount || !selectedAsset) {
      toast({
        title: "Error",
        description: "Please fill in all fields and connect your wallet",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await borrowFromBlendPool({
        poolId: selectedPool,
        asset: selectedAsset,
        amount: borrowAmount,
        collateralAsset: 'XLM', // Default collateral
        userPublicKey: wallet.address
      });
      
      toast({
        title: "Borrow Transaction Created",
        description: `Borrowing ${borrowAmount} ${selectedAsset} from ${selectedPool}`,
      });
      
      setBorrowAmount('');
    } catch (error: any) {
      toast({
        title: "Borrow Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (!wallet.isConnected) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-6">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              ArtChain Finance
            </h1>
            <p className="text-xl text-gray-300">
              Connect your wallet to access DeFi lending powered by Blend Protocol
            </p>
            <div className="bg-gray-900 rounded-lg p-8 max-w-md mx-auto">
              <Shield className="mx-auto mb-4 h-12 w-12 text-purple-400" />
              <p className="text-gray-400">
                Connect your Stellar wallet to lend, borrow, and earn yield on your digital assets
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            ArtChain Finance
          </h1>
          <p className="text-xl text-gray-300">
            DeFi lending and borrowing powered by Blend Protocol on Stellar
          </p>
        </div>

        {/* Protocol Stats */}
        {protocolStats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card className="bg-gray-900 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-green-400" />
                  <div>
                    <p className="text-sm text-gray-400">Total Value Locked</p>
                    <p className="text-lg font-bold text-white">${protocolStats.totalValueLocked}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-900 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-blue-400" />
                  <div>
                    <p className="text-sm text-gray-400">Total Borrowed</p>
                    <p className="text-lg font-bold text-white">${protocolStats.totalBorrowed}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-purple-400" />
                  <div>
                    <p className="text-sm text-gray-400">Active Pools</p>
                    <p className="text-lg font-bold text-white">{protocolStats.activePools}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-cyan-400" />
                  <div>
                    <p className="text-sm text-gray-400">Total Users</p>
                    <p className="text-lg font-bold text-white">{protocolStats.totalUsers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Coins className="h-5 w-5 text-yellow-400" />
                  <div>
                    <p className="text-sm text-gray-400">BLND Price</p>
                    <p className="text-lg font-bold text-white">${protocolStats.blndPrice}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* User Portfolio */}
        {userPositions && userPositions.length > 0 && (
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Your Positions</CardTitle>
              <CardDescription>Your lending and borrowing positions across Blend pools</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userPositions.map((position) => (
                  <div key={position.poolId} className="bg-gray-800 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-semibold text-white">{position.poolId}</h4>
                      <Badge 
                        variant={position.healthFactor > 1.5 ? "default" : "destructive"}
                        className="ml-2"
                      >
                        Health: {position.healthFactor.toFixed(2)}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-400 mb-2">Supplied Assets</p>
                        {Object.entries(position.supplied).map(([asset, amount]) => (
                          <div key={asset} className="flex justify-between">
                            <span className="text-green-400">{asset}</span>
                            <span className="text-white">{amount}</span>
                          </div>
                        ))}
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-400 mb-2">Borrowed Assets</p>
                        {Object.entries(position.borrowed).map(([asset, amount]) => (
                          <div key={asset} className="flex justify-between">
                            <span className="text-red-400">{asset}</span>
                            <span className="text-white">{amount}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Available Pools */}
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Available Lending Pools</CardTitle>
            <CardDescription>Choose a pool to lend or borrow assets</CardDescription>
          </CardHeader>
          <CardContent>
            {poolsLoading ? (
              <div className="text-center py-8">
                <p className="text-gray-400">Loading pools...</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {pools?.map((pool) => (
                  <div 
                    key={pool.poolId}
                    className={`bg-gray-800 rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedPool === pool.poolId ? 'ring-2 ring-purple-400' : 'hover:bg-gray-750'
                    }`}
                    onClick={() => setSelectedPool(pool.poolId)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-semibold text-white">{pool.name}</h4>
                      <div className="flex space-x-2">
                        {pool.supportedAssets.map((asset) => (
                          <Badge key={asset} variant="outline" className="text-xs">
                            {asset}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">Supply APY</p>
                        <p className="text-green-400 font-semibold">{pool.supplyApy}%</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Borrow APY</p>
                        <p className="text-red-400 font-semibold">{pool.borrowApy}%</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Utilization</p>
                        <div className="flex items-center space-x-2">
                          <Progress value={pool.utilizationRate} className="flex-1" />
                          <span className="text-white text-xs">{pool.utilizationRate}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions Panel */}
        {selectedPool && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Supply */}
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <ArrowUpRight className="h-5 w-5 text-green-400" />
                  <span>Supply Assets</span>
                </CardTitle>
                <CardDescription>Lend your assets to earn interest</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400">Asset</label>
                  <select 
                    value={selectedAsset}
                    onChange={(e) => setSelectedAsset(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
                  >
                    <option value="">Select asset</option>
                    <option value="XLM">XLM</option>
                    <option value="USDC">USDC</option>
                    <option value="BLND">BLND</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Amount</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={supplyAmount}
                    onChange={(e) => setSupplyAmount(e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>
                <Button onClick={handleSupply} className="w-full bg-green-600 hover:bg-green-700">
                  Supply
                </Button>
              </CardContent>
            </Card>

            {/* Borrow */}
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <ArrowDownRight className="h-5 w-5 text-blue-400" />
                  <span>Borrow Assets</span>
                </CardTitle>
                <CardDescription>Borrow against your collateral</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400">Asset</label>
                  <select 
                    value={selectedAsset}
                    onChange={(e) => setSelectedAsset(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
                  >
                    <option value="">Select asset</option>
                    <option value="XLM">XLM</option>
                    <option value="USDC">USDC</option>
                    <option value="BLND">BLND</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Amount</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={borrowAmount}
                    onChange={(e) => setBorrowAmount(e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>
                <Button onClick={handleBorrow} className="w-full bg-blue-600 hover:bg-blue-700">
                  Borrow
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* BLND Token Info */}
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">BLND Token</CardTitle>
            <CardDescription>
              Your BLND balance and backstop participation status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-400">Your BLND Balance</p>
                <p className="text-xl font-bold text-white">{blndBalance} BLND</p>
              </div>
              <Button variant="outline" className="border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-black">
                Participate in Backstop
              </Button>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}