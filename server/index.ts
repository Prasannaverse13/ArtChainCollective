import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error(`Server Error: ${status} - ${message}`);
    console.error(err.stack);

    res.status(status).json({ message });
    
    // Don't throw the error again as it might crash the server
    // Instead, just log it for debugging
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Replit requires port 5000 or environment PORT variable
  // This is CRITICAL for Replit to properly forward requests
  const port = process.env.PORT ? parseInt(process.env.PORT) : 5000;
  
  // Log all environment variables for debugging
  console.log('Initializing server with environment:', {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    REPL_SLUG: process.env.REPL_SLUG,
    REPL_OWNER: process.env.REPL_OWNER,
    REPL_ID: process.env.REPL_ID,
    REPLIT_DEPLOYMENT: process.env.REPLIT_DEPLOYMENT
  });
  
  // For Replit, we need to use explicit host binding
  // This combination of host and port values works reliably in Replit
  server.listen({
    port: port,
    host: '0.0.0.0', // Required for external access
  }, () => {
    log(`🚀 Server running at http://0.0.0.0:${port}`);
    log(`📂 API endpoints available at /api`);
    log(`💓 Health check endpoint at /health`);
    log(`🔍 WebSocket debugging tool at /debug-ws`);
    log(`🌐 WebSocket server enabled and ready for connections`);
  });
})();
