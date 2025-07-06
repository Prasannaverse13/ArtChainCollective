import { useState, useRef, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

// Types for drawing tools
type DrawingTool = 'pen' | 'eraser' | 'fill' | 'shape' | 'select' | 'text';
type DrawingColor = string;

// Canvas state interface
interface CanvasState {
  tool: DrawingTool;
  color: DrawingColor;
  lineWidth: number;
  currentLayer: number;
  layers: {
    id: number;
    visible: boolean;
    locked: boolean;
    data: ImageData | null;
  }[];
  canvasData: string | null; // Base64 representation of the canvas
}

interface UseCanvasOptions {
  artworkId?: number;
  initialData?: any;
  readOnly?: boolean;
  collaborative?: boolean;
}

export function useCanvas(options: UseCanvasOptions = {}) {
  const { artworkId, initialData, readOnly = false, collaborative = false } = options;
  
  // Refs for canvas elements
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  
  // State for drawing settings
  const [canvasState, setCanvasState] = useState<CanvasState>({
    tool: 'pen',
    color: '#0ff0fc', // Electric blue default
    lineWidth: 5,
    currentLayer: 0,
    layers: [
      { id: 0, visible: true, locked: false, data: null }
    ],
    canvasData: null
  });
  
  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState<{ x: number, y: number } | null>(null);
  const [collaborators, setCollaborators] = useState<any[]>([]);
  
  const { toast } = useToast();
  
  // Initialize canvas and context
  const getContext = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    return ctx;
  }, []);
  
  // Initialize the canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Set canvas size
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    
    const ctx = getContext();
    if (!ctx) return;
    
    // Set default styles
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = canvasState.color;
    ctx.lineWidth = canvasState.lineWidth;
    
    // Load initial data if provided
    if (initialData) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
      img.src = initialData;
    }
  }, [canvasRef, getContext, initialData, canvasState.color, canvasState.lineWidth]);
  
  // Connect to WebSocket for collaborative drawing
  useEffect(() => {
    if (!collaborative || !artworkId) return;
    
    // Create WebSocket connection with protocol matching page protocol (ws or wss)
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    
    // For Replit deployment, ensure we're using the correct host and path
    // This helps with compatibility across different environments
    const wsUrl = `${protocol}//${host}/ws`;
    
    console.log(`Attempting WebSocket connection to ${wsUrl}`);
    
    // Create WebSocket connection with error handling
    let socket: WebSocket | null = null;
    
    try {
      socket = new WebSocket(wsUrl);
      socketRef.current = socket;
      
      console.log('WebSocket object created:', {
        url: wsUrl,
        readyState: socket.readyState,
        protocol: socket.protocol,
        extensions: socket.extensions
      });
    } catch (error) {
      console.error('WebSocket initialization error:', error);
      toast({
        title: 'Connection Error',
        description: 'Failed to connect to the drawing server. Try refreshing the page.',
        variant: 'destructive'
      });
      return;
    }
    
    // Add connection timeout
    const connectionTimeout = setTimeout(() => {
      if (socket && socket.readyState !== WebSocket.OPEN) {
        console.error('WebSocket connection timeout');
        toast({
          title: 'Connection Error',
          description: 'Failed to connect to server. Please try again later.',
          variant: 'destructive'
        });
        socket.close();
      }
    }, 5000);
    
    // WebSocket event handlers
    socket.onopen = () => {
      clearTimeout(connectionTimeout);
      console.log('WebSocket connection established');
      
      // Join the artwork room
      socket.send(JSON.stringify({
        type: 'join',
        artworkId,
        data: {}
      }));
    };
    
    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === 'canvas-init') {
          // Initialize canvas with existing data
          const ctx = getContext();
          if (ctx && message.data) {
            const img = new Image();
            img.onload = () => {
              ctx.drawImage(img, 0, 0);
            };
            img.src = message.data;
          }
        } else if (message.type === 'draw' && message.data) {
          // Draw data received from other collaborator
          const ctx = getContext();
          if (!ctx) return;
          
          if (message.data.tool === 'pen') {
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = message.data.color;
            ctx.lineWidth = message.data.lineWidth;
            
            ctx.beginPath();
            ctx.moveTo(message.data.lastX, message.data.lastY);
            ctx.lineTo(message.data.x, message.data.y);
            ctx.stroke();
          } else if (message.data.tool === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.lineWidth = message.data.lineWidth * 2;
            
            ctx.beginPath();
            ctx.moveTo(message.data.lastX, message.data.lastY);
            ctx.lineTo(message.data.x, message.data.y);
            ctx.stroke();
            
            ctx.globalCompositeOperation = 'source-over';
          }
        } else if (message.type === 'collaborators') {
          // Update collaborators list
          setCollaborators(message.data);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      toast({
        title: 'Connection Error',
        description: 'Failed to connect to drawing room',
        variant: 'destructive'
      });
    };
    
    // Cleanup function
    return () => {
      clearTimeout(connectionTimeout);
      if (socket) {
        console.log('Closing WebSocket connection');
        socket.close();
      }
    };
  }, [collaborative, artworkId, getContext, toast]);
  
  // Handle drawing
  const handleStartDrawing = useCallback((x: number, y: number) => {
    if (readOnly) return;
    
    setIsDrawing(true);
    setLastPos({ x, y });
    
    const ctx = getContext();
    if (!ctx) return;
    
    // Apply tool settings
    if (canvasState.tool === 'pen') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = canvasState.color;
    } else if (canvasState.tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
    }
    
    // Start drawing path
    ctx.beginPath();
    ctx.moveTo(x, y);
  }, [readOnly, getContext, canvasState.tool, canvasState.color]);
  
  const handleDrawing = useCallback((x: number, y: number) => {
    if (!isDrawing || readOnly) return;
    
    const ctx = getContext();
    if (!ctx || !lastPos) return;
    
    // Draw line
    if (canvasState.tool === 'pen' || canvasState.tool === 'eraser') {
      ctx.beginPath();
      ctx.moveTo(lastPos.x, lastPos.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    
    // Update last position
    setLastPos({ x, y });
    
    // Send drawing data to collaborators
    if (collaborative && socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'draw',
        artworkId,
        data: {
          tool: canvasState.tool,
          color: canvasState.color,
          lineWidth: canvasState.lineWidth,
          lastX: lastPos.x,
          lastY: lastPos.y,
          x,
          y,
          canvasState: canvasRef.current?.toDataURL()
        }
      }));
    }
  }, [isDrawing, readOnly, getContext, lastPos, canvasState.tool, canvasState.color, canvasState.lineWidth, collaborative, artworkId]);
  
  const handleEndDrawing = useCallback(() => {
    setIsDrawing(false);
    setLastPos(null);
    
    const ctx = getContext();
    if (!ctx) return;
    
    // Reset composite operation
    ctx.globalCompositeOperation = 'source-over';
    
    // Save canvas state
    const canvas = canvasRef.current;
    if (canvas) {
      const canvasData = canvas.toDataURL();
      setCanvasState(prev => ({
        ...prev,
        canvasData
      }));
    }
  }, [getContext]);
  
  // Canvas event handlers for mouse
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (readOnly) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    handleStartDrawing(x, y);
  }, [readOnly, handleStartDrawing]);
  
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || readOnly) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    handleDrawing(x, y);
  }, [isDrawing, readOnly, handleDrawing]);
  
  const handleMouseUp = useCallback(() => {
    if (readOnly) return;
    handleEndDrawing();
  }, [readOnly, handleEndDrawing]);
  
  // Canvas event handlers for touch
  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    if (readOnly) return;
    e.preventDefault();
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    handleStartDrawing(x, y);
  }, [readOnly, handleStartDrawing]);
  
  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || readOnly) return;
    e.preventDefault();
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    handleDrawing(x, y);
  }, [isDrawing, readOnly, handleDrawing]);
  
  const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    if (readOnly) return;
    e.preventDefault();
    handleEndDrawing();
  }, [readOnly, handleEndDrawing]);
  
  // Tool selection
  const selectTool = useCallback((tool: DrawingTool) => {
    setCanvasState(prev => ({
      ...prev,
      tool
    }));
  }, []);
  
  // Color selection
  const selectColor = useCallback((color: DrawingColor) => {
    setCanvasState(prev => ({
      ...prev,
      color
    }));
  }, []);
  
  // Clear canvas
  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = getContext();
    
    if (!canvas || !ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Save empty canvas state
    const canvasData = canvas.toDataURL();
    setCanvasState(prev => ({
      ...prev,
      canvasData
    }));
  }, [getContext]);
  
  // Save canvas as image
  const saveCanvasImage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    
    return canvas.toDataURL('image/png');
  }, []);
  
  // Load image to canvas
  const loadImage = useCallback((imageData: string) => {
    const canvas = canvasRef.current;
    const ctx = getContext();
    
    if (!canvas || !ctx) return;
    
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Save canvas state
      const canvasData = canvas.toDataURL();
      setCanvasState(prev => ({
        ...prev,
        canvasData
      }));
    };
    img.src = imageData;
  }, [getContext]);
  
  return {
    canvasRef,
    canvasState,
    collaborators,
    isDrawing,
    selectTool,
    selectColor,
    clearCanvas,
    saveCanvasImage,
    loadImage,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  };
}
