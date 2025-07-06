import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAccountDetails } from '@/lib/stellar';

export default function TestPage() {
  const [testResult, setTestResult] = useState<string>('No test run yet');
  const [loading, setLoading] = useState<boolean>(false);
  
  const runConnectionTest = async () => {
    setLoading(true);
    setTestResult('Running connection test...');
    
    try {
      // Test the Stellar connection
      await getAccountDetails('GDEMO5555DEMO5555DEMO5555DEMO5555DEMO5555DEMO5');
      setTestResult('✅ Stellar connection successful');
    } catch (error: any) {
      console.error('Connection test failed:', error);
      setTestResult(`❌ Stellar connection failed: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    // Run a test on mount
    runConnectionTest();
  }, []);
  
  return (
    <div className="container mx-auto py-8">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Connection Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-md">
              <h2 className="font-medium mb-2">Stellar API Connection:</h2>
              <div className={`text-sm font-mono ${testResult.includes('✅') ? 'text-green-500' : 'text-red-500'}`}>
                {testResult}
              </div>
            </div>
            
            <Button 
              onClick={runConnectionTest}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Testing...' : 'Run Test Again'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}