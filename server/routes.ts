import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertUserSchema, insertArtworkSchema, insertCollaboratorSchema, insertNFTSchema } from "@shared/schema";
import { z } from "zod";
import path from "path";
import fs from "fs";

interface WebSocketMessage {
  type: string;
  artworkId: number;
  data: any;
}

interface ExtendedWebSocket extends WebSocket {
  isAlive: boolean;
  userId?: number;
  artworkId?: number;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Create WebSocket server for real-time collaboration, optimized for Replit
  const wss = new WebSocketServer({ 
    server: httpServer,
    // Handle errors at the server level
    clientTracking: true,
    // Disable message compression for better compatibility with Replit
    perMessageDeflate: false,
    // Accept connections from any origin (needed for Replit)
    verifyClient: () => true,
    // Explicitly set path for Replit environment
    path: '/ws',
    // Increase max payload for art data
    maxPayload: 10 * 1024 * 1024 // 10MB
  });
  
  console.log('✅ WebSocket server optimized for Replit environment');
  console.log('👥 WebSocket endpoint available at: /ws');
  
  // Connection tracking for collaborative drawing
  const connections = new Map<number, Set<ExtendedWebSocket>>();
  
  // Handle server-level errors to prevent crashes
  wss.on('error', (error) => {
    console.error('WebSocket Server Error:', error);
  });
  
  wss.on('connection', (ws: ExtendedWebSocket) => {
    console.log('New WebSocket connection established');
    ws.isAlive = true;
    
    ws.on('pong', () => {
      ws.isAlive = true;
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket client error:', error);
    });
    
    ws.on('message', async (messageData) => {
      try {
        // Handle different message types (Buffer, ArrayBuffer, string)
        let messageStr: string;
        if (messageData instanceof Buffer) {
          messageStr = messageData.toString();
        } else if (typeof messageData === 'string') {
          messageStr = messageData;
        } else {
          // For array buffers or other types
          const decoder = new TextDecoder('utf-8');
          messageStr = decoder.decode(messageData as ArrayBuffer);
        }
        
        console.log(`WebSocket message received: ${messageStr.substring(0, 100)}...`);
        
        const { type, artworkId, data } = JSON.parse(messageStr) as WebSocketMessage;
        console.log(`Processed message: type=${type}, artworkId=${artworkId}`);
        
        if (type === 'join') {
          // Track connection for broadcasting
          ws.artworkId = artworkId;
          
          // Add connection to artwork's connection pool
          if (!connections.has(artworkId)) {
            connections.set(artworkId, new Set());
          }
          connections.get(artworkId)?.add(ws);
          
          console.log(`Client joined artwork room: ${artworkId}, total clients: ${connections.get(artworkId)?.size || 0}`);
          
          // Send existing canvas data
          try {
            const artwork = await storage.getArtwork(artworkId);
            if (artwork) {
              ws.send(JSON.stringify({
                type: 'canvas-init',
                data: artwork.canvasData
              }));
              
              // Send collaborator info
              const collaborators = await storage.getCollaborators(artworkId);
              ws.send(JSON.stringify({
                type: 'collaborators',
                data: collaborators
              }));
            } else {
              console.log(`No artwork found for id ${artworkId}`);
            }
          } catch (error) {
            console.error(`Error retrieving artwork data for id ${artworkId}:`, error);
          }
        } else if (type === 'ping') {
          // Simple ping-pong for testing WebSocket connectivity
          console.log(`Ping received from client, sending pong`);
          try {
            ws.send(JSON.stringify({
              type: 'pong',
              data: {
                serverTime: new Date().toISOString(),
                echo: data,
                clients: wss.clients.size
              }
            }));
          } catch (error) {
            console.error('Error sending pong response:', error);
          }
        } else if (type === 'draw' && ws.artworkId) {
          // Broadcast drawing data to all clients except sender
          const clients = connections.get(ws.artworkId);
          if (clients) {
            clients.forEach(client => {
              try {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify({
                    type: 'draw',
                    data
                  }));
                }
              } catch (error) {
                console.error('Error sending drawing data to client:', error);
              }
            });
          }
          
          // Update artwork canvas data periodically (throttled updates to database)
          try {
            // We're not updating on every draw event for performance
            const artwork = await storage.getArtwork(ws.artworkId);
            if (artwork) {
              // Every few seconds, update the canvas data
              // This is a simplified approach - in production, use debounce
              if (Math.random() < 0.05) { // ~5% chance to update
                await storage.updateArtwork(ws.artworkId, {
                  canvasData: data.canvasState
                  // updatedAt is handled automatically by the storage layer
                });
              }
            }
          } catch (error) {
            console.error(`Error updating artwork data for id ${ws.artworkId}:`, error);
          }
        }
      } catch (err) {
        console.error('WebSocket message processing error:', err);
      }
    });
    
    ws.on('close', (code, reason) => {
      console.log(`WebSocket connection closed: code=${code}, reason=${reason || 'No reason provided'}`);
      if (ws.artworkId && connections.has(ws.artworkId)) {
        connections.get(ws.artworkId)?.delete(ws);
        console.log(`Client left artwork room: ${ws.artworkId}, remaining clients: ${connections.get(ws.artworkId)?.size || 0}`);
      }
    });
  });
  
  // Ping clients to detect disconnected ones
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      const extWs = ws as ExtendedWebSocket;
      if (extWs.isAlive === false) {
        console.log('Terminating inactive WebSocket connection');
        return extWs.terminate();
      }
      
      extWs.isAlive = false;
      try {
        extWs.ping();
      } catch (error) {
        console.error('Error sending ping to client:', error);
        // If ping fails, terminate the connection
        extWs.terminate();
      }
    });
  }, 30000);
  
  wss.on('close', () => {
    clearInterval(interval);
  });
  
  // API Routes
  const apiRouter = express.Router();
  
  // User routes
  apiRouter.post('/users', async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ error: err.errors });
      } else {
        res.status(500).json({ error: 'Failed to create user' });
      }
    }
  });
  
  apiRouter.get('/users/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    const user = await storage.getUser(id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  });
  
  apiRouter.get('/users/wallet/:address', async (req, res) => {
    const address = req.params.address;
    const user = await storage.getUserByWalletAddress(address);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  });
  
  // Artwork routes
  apiRouter.post('/artworks', async (req, res) => {
    try {
      const artworkData = insertArtworkSchema.parse(req.body);
      const artwork = await storage.createArtwork(artworkData);
      res.status(201).json(artwork);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ error: err.errors });
      } else {
        res.status(500).json({ error: 'Failed to create artwork' });
      }
    }
  });
  
  apiRouter.get('/artworks', async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
    
    const artworks = await storage.listArtworks(limit, offset);
    res.json(artworks);
  });
  
  apiRouter.get('/artworks/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid artwork ID' });
    }
    
    const artwork = await storage.getArtwork(id);
    
    if (!artwork) {
      return res.status(404).json({ error: 'Artwork not found' });
    }
    
    res.json(artwork);
  });
  
  apiRouter.put('/artworks/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid artwork ID' });
    }
    
    try {
      const artworkData = insertArtworkSchema.partial().parse(req.body);
      const updatedArtwork = await storage.updateArtwork(id, artworkData);
      
      if (!updatedArtwork) {
        return res.status(404).json({ error: 'Artwork not found' });
      }
      
      res.json(updatedArtwork);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ error: err.errors });
      } else {
        res.status(500).json({ error: 'Failed to update artwork' });
      }
    }
  });
  
  // Collaborator routes
  apiRouter.post('/collaborators', async (req, res) => {
    try {
      const collaboratorData = insertCollaboratorSchema.parse(req.body);
      const collaborator = await storage.addCollaborator(collaboratorData);
      res.status(201).json(collaborator);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ error: err.errors });
      } else {
        res.status(500).json({ error: 'Failed to add collaborator' });
      }
    }
  });
  
  apiRouter.get('/artworks/:id/collaborators', async (req, res) => {
    const artworkId = parseInt(req.params.id);
    
    if (isNaN(artworkId)) {
      return res.status(400).json({ error: 'Invalid artwork ID' });
    }
    
    const collaborators = await storage.getCollaborators(artworkId);
    res.json(collaborators);
  });
  
  // NFT routes
  apiRouter.post('/nfts', async (req, res) => {
    try {
      const nftData = insertNFTSchema.parse(req.body);
      const nft = await storage.createNFT(nftData);
      res.status(201).json(nft);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ error: err.errors });
      } else {
        res.status(500).json({ error: 'Failed to create NFT' });
      }
    }
  });
  
  apiRouter.get('/nfts', async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
    const category = req.query.category as string | undefined;
    
    const filters: any = {};
    if (category) filters.category = category;
    
    const nfts = await storage.listNFTs(filters, limit, offset);
    res.json(nfts);
  });
  
  apiRouter.get('/nfts/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid NFT ID' });
    }
    
    const nft = await storage.getNFT(id);
    
    if (!nft) {
      return res.status(404).json({ error: 'NFT not found' });
    }
    
    res.json(nft);
  });
  
  apiRouter.get('/artworks/:id/nfts', async (req, res) => {
    const artworkId = parseInt(req.params.id);
    
    if (isNaN(artworkId)) {
      return res.status(400).json({ error: 'Invalid artwork ID' });
    }
    
    const nfts = await storage.getNFTsByArtwork(artworkId);
    res.json(nfts);
  });
  
  // Register API routes with prefix
  app.use('/api', apiRouter);
  
  // Add health check and debug routes
  app.get('/health', (req, res) => {
    res.status(200).json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      webSocketStatus: wss.clients.size > 0 ? 'active' : 'no connections',
      connectionCount: wss.clients.size
    });
  });
  
  // Debug endpoint to test WebSocket connectivity with simple HTML page
  app.get('/debug-ws', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>WebSocket Debug</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            pre { background: #f4f4f4; padding: 10px; border-radius: 4px; overflow: auto; }
            .success { color: green; }
            .error { color: red; }
            button { padding: 8px 12px; cursor: pointer; margin: 5px; }
          </style>
        </head>
        <body>
          <h1>WebSocket Connection Tester</h1>
          <p>This page tests WebSocket connectivity to the server.</p>
          
          <div>
            <button id="connect">Connect</button>
            <button id="disconnect">Disconnect</button>
            <button id="send">Send Test Message</button>
          </div>
          
          <h3>Connection Status: <span id="status" class="error">Disconnected</span></h3>
          
          <h3>Events:</h3>
          <pre id="log"></pre>
          
          <script>
            const log = document.getElementById('log');
            const status = document.getElementById('status');
            let socket = null;
            
            function appendLog(message, isError = false) {
              const line = document.createElement('div');
              line.textContent = new Date().toLocaleTimeString() + ': ' + message;
              if (isError) line.className = 'error';
              log.appendChild(line);
              log.scrollTop = log.scrollHeight;
            }
            
            document.getElementById('connect').addEventListener('click', () => {
              if (socket && socket.readyState !== WebSocket.CLOSED) {
                appendLog('Already connected or connecting');
                return;
              }
              
              // Create WebSocket connection
              const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
              const host = window.location.host;
              
              try {
                appendLog('Connecting to ' + protocol + '//' + host + '/ws');
                socket = new WebSocket(protocol + '//' + host + '/ws');
                
                socket.onopen = () => {
                  status.textContent = 'Connected';
                  status.className = 'success';
                  appendLog('Connection established');
                };
                
                socket.onclose = (event) => {
                  status.textContent = 'Disconnected';
                  status.className = 'error';
                  appendLog('Connection closed: code=' + event.code + ', reason=' + event.reason);
                };
                
                socket.onerror = (error) => {
                  appendLog('WebSocket error', true);
                  console.error('WebSocket error:', error);
                };
                
                socket.onmessage = (event) => {
                  appendLog('Message received: ' + event.data);
                  console.log('Message received:', event.data);
                };
              } catch (error) {
                appendLog('Failed to create WebSocket: ' + error.message, true);
              }
            });
            
            document.getElementById('disconnect').addEventListener('click', () => {
              if (!socket) {
                appendLog('Not connected');
                return;
              }
              
              socket.close();
              socket = null;
            });
            
            document.getElementById('send').addEventListener('click', () => {
              if (!socket || socket.readyState !== WebSocket.OPEN) {
                appendLog('Not connected', true);
                return;
              }
              
              const testMessage = JSON.stringify({
                type: 'ping',
                artworkId: 1,
                data: { timestamp: new Date().toISOString() }
              });
              
              try {
                socket.send(testMessage);
                appendLog('Sent: ' + testMessage);
              } catch (error) {
                appendLog('Failed to send: ' + error.message, true);
              }
            });
            
            window.addEventListener('beforeunload', () => {
              if (socket) socket.close();
            });
          </script>
        </body>
      </html>
    `);
  });

  // Access test page for checking server connectivity
  app.get('/access-test', (req, res) => {
    const filePath = path.join(process.cwd(), 'access-test.html');
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      res.setHeader('Content-Type', 'text/html');
      res.send(content);
    } catch (error) {
      console.error('Error serving access-test.html:', error);
      res.status(500).send('Error loading test page');
    }
  });

  return httpServer;
}
