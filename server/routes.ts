import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateConversationLine, getCurrentTopic, getTopicProgress } from "./services/openai";
import { insertConversationMessageSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // SSE endpoint for streaming conversation
  app.get("/api/conversation/stream", async (req, res) => {
    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');

    // Send initial connection event
    res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

    // Send recent messages
    const recentMessages = await storage.getRecentMessages(10);
    for (const message of recentMessages) {
      res.write(`data: ${JSON.stringify({ 
        type: 'message', 
        data: message 
      })}\n\n`);
    }

    let intervalId: NodeJS.Timeout;

    const generateAndSendMessage = async () => {
      try {
        // Get recent context
        const context = await storage.getRecentMessages(5);
        
        // Determine next entity (alternate between A and B)
        const messageCount = await storage.getMessageCount();
        const nextEntity = messageCount % 2 === 0 ? "ENTITY_A" : "ENTITY_B";
        
        // Generate new message
        const content = await generateConversationLine(
          context.map(msg => ({
            entity: msg.entity,
            content: msg.content,
            timestamp: msg.timestamp
          })),
          nextEntity,
          storage
        );
        
        // Save to storage
        const newMessage = await storage.addMessage({
          entity: nextEntity,
          content
        });
        
        // Send to client
        res.write(`data: ${JSON.stringify({ 
          type: 'message', 
          data: newMessage 
        })}\n\n`);
        
      } catch (error) {
        console.error("Error generating message:", error);
        res.write(`data: ${JSON.stringify({ 
          type: 'error', 
          message: 'Failed to generate message' 
        })}\n\n`);
      }
    };

    // Start generating messages every 30 seconds to reduce rate limits
    intervalId = setInterval(generateAndSendMessage, 30000);

    // Handle client disconnect
    req.on('close', () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      res.end();
    });
  });

  // Get recent messages endpoint
  app.get("/api/conversation/messages", async (req, res) => {
    try {
      const messages = await storage.getRecentMessages(20);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Get current topic and progress
  app.get("/api/conversation/topic", async (req, res) => {
    try {
      res.json({
        currentTopic: getCurrentTopic(),
        progress: getTopicProgress()
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch topic info" });
    }
  });

  // Get list of saved topic files
  app.get("/api/topics", async (req, res) => {
    try {
      const files = await storage.getTopicFiles();
      res.json(files);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch topic files" });
    }
  });

  // Get content of a specific topic file
  app.get("/api/topics/:filename", async (req, res) => {
    try {
      const content = await storage.getTopicFileContent(req.params.filename);
      res.json({ content });
    } catch (error) {
      res.status(404).json({ message: "Topic file not found" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
